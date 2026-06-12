create table if not exists public.organization_audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists organization_audit_logs_organization_created_idx
on public.organization_audit_logs (organization_id, created_at desc);

alter table public.organization_audit_logs enable row level security;

drop policy if exists "Members can read organization audit logs" on public.organization_audit_logs;
create policy "Members can read organization audit logs"
on public.organization_audit_logs
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "No direct audit log writes from clients" on public.organization_audit_logs;
create policy "No direct audit log writes from clients"
on public.organization_audit_logs
for insert
to authenticated
with check (false);

create or replace function public.write_organization_audit_log(
  org_id uuid,
  actor_user_id uuid,
  target_user_id uuid,
  event_type text,
  details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_audit_logs (
    organization_id,
    actor_id,
    target_user_id,
    event_type,
    details
  )
  values (
    org_id,
    actor_user_id,
    target_user_id,
    event_type,
    coalesce(details, '{}'::jsonb)
  );
end;
$$;

create or replace function public.list_organization_audit_logs(org_id uuid, row_limit integer default 20)
returns table (
  id uuid,
  event_type text,
  details jsonb,
  created_at timestamptz,
  actor_email text,
  target_email text
)
language sql
security definer
set search_path = public
as $$
  select
    logs.id,
    logs.event_type,
    logs.details,
    logs.created_at,
    actor.email as actor_email,
    coalesce(target.email, logs.details ->> 'email') as target_email
  from public.organization_audit_logs as logs
  join public.profiles as actor on actor.id = logs.actor_id
  left join public.profiles as target on target.id = logs.target_user_id
  where logs.organization_id = org_id
    and public.is_org_member(org_id)
  order by logs.created_at desc
  limit least(greatest(row_limit, 1), 50);
$$;

create or replace function public.add_organization_member(org_id uuid, member_email text)
returns table (
  user_id uuid,
  email text,
  role public.organization_role,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  target_user_id uuid;
begin
  if auth.uid() is null then
    raise exception '请先登录云端账号。';
  end if;

  if not public.is_org_owner(org_id, auth.uid()) then
    raise exception '只有组织拥有者可以添加成员。';
  end if;

  normalized_email := lower(trim(member_email));
  if normalized_email = '' then
    raise exception '请输入成员邮箱。';
  end if;

  select p.id into target_user_id
  from public.profiles as p
  where lower(p.email) = normalized_email
  limit 1;

  if target_user_id is null then
    raise exception '没有找到这个邮箱对应的已注册用户。请让对方先注册云端账号。';
  end if;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (org_id, target_user_id, 'member')
  on conflict on constraint organization_memberships_pkey do nothing;

  perform public.write_organization_audit_log(
    org_id,
    auth.uid(),
    target_user_id,
    'member_added',
    jsonb_build_object('email', normalized_email)
  );

  return query
    select
      p.id as user_id,
      p.email as email,
      om.role as role,
      om.created_at as created_at
    from public.organization_memberships as om
    join public.profiles as p on p.id = om.user_id
    where om.organization_id = org_id
      and om.user_id = target_user_id;
end;
$$;

create or replace function public.promote_organization_member(org_id uuid, member_user_id uuid)
returns table (
  user_id uuid,
  email text,
  role public.organization_role,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception '请先登录云端账号。';
  end if;

  if not public.is_org_owner(org_id, auth.uid()) then
    raise exception '只有组织拥有者可以管理成员。';
  end if;

  update public.organization_memberships as om
  set role = 'owner'
  where om.organization_id = org_id
    and om.user_id = member_user_id
    and om.role = 'member';

  if not found then
    raise exception '没有找到可升级的普通成员。';
  end if;

  perform public.write_organization_audit_log(
    org_id,
    auth.uid(),
    member_user_id,
    'member_promoted',
    '{}'::jsonb
  );

  return query
    select
      p.id as user_id,
      p.email as email,
      om.role as role,
      om.created_at as created_at
    from public.organization_memberships as om
    join public.profiles as p on p.id = om.user_id
    where om.organization_id = org_id
      and om.user_id = member_user_id;
end;
$$;

create or replace function public.remove_organization_member(org_id uuid, member_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role public.organization_role;
begin
  if auth.uid() is null then
    raise exception '请先登录云端账号。';
  end if;

  if not public.is_org_owner(org_id, auth.uid()) then
    raise exception '只有组织拥有者可以管理成员。';
  end if;

  if member_user_id = auth.uid() then
    raise exception '不能移除自己。';
  end if;

  select om.role into target_role
  from public.organization_memberships as om
  where om.organization_id = org_id
    and om.user_id = member_user_id;

  if target_role is null then
    raise exception '没有找到这个组织成员。';
  end if;

  if target_role = 'owner' then
    raise exception '当前版本不能移除拥有者。请先保留多个 owner 后再扩展降级流程。';
  end if;

  delete from public.organization_memberships as om
  where om.organization_id = org_id
    and om.user_id = member_user_id
    and om.role = 'member';

  perform public.write_organization_audit_log(
    org_id,
    auth.uid(),
    member_user_id,
    'member_removed',
    '{}'::jsonb
  );
end;
$$;

grant select on table public.organization_audit_logs to authenticated;
grant execute on function public.write_organization_audit_log(uuid, uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.list_organization_audit_logs(uuid, integer) to authenticated;
