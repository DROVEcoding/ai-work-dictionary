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

create or replace function public.list_organization_members(org_id uuid)
returns table (
  user_id uuid,
  email text,
  role public.organization_role,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    p.email as email,
    om.role as role,
    om.created_at as created_at
  from public.organization_memberships as om
  join public.profiles as p on p.id = om.user_id
  where om.organization_id = org_id
    and public.is_org_member(org_id)
  order by om.created_at asc;
$$;

grant execute on function public.add_organization_member(uuid, text) to authenticated;
grant execute on function public.list_organization_members(uuid) to authenticated;
