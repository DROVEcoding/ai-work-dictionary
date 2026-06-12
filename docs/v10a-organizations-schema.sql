do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'organization_role'
  ) then
    create type public.organization_role as enum ('owner', 'member');
  end if;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

create or replace function public.set_new_organization_creator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception '用户必须登录后才能创建组织。';
  end if;

  -- 创建者身份由数据库从登录态写入，避免前端伪造或漏传 created_by。
  new.created_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists before_organization_created on public.organizations;
create trigger before_organization_created
before insert on public.organizations
for each row execute function public.set_new_organization_creator();

create or replace function public.is_org_member(org_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships
    where organization_id = org_id
      and organization_memberships.user_id = is_org_member.user_id
  );
$$;

create or replace function public.is_org_owner(org_id uuid, user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships
    where organization_id = org_id
      and organization_memberships.user_id = is_org_owner.user_id
      and role = 'owner'
  );
$$;

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_memberships (organization_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created
after insert on public.organizations
for each row execute function public.handle_new_organization();

create or replace function public.create_organization(org_name text)
returns table (
  id uuid,
  name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  normalized_name text;
begin
  if auth.uid() is null then
    raise exception '用户必须登录后才能创建组织。';
  end if;

  normalized_name := trim(org_name);
  if char_length(normalized_name) < 2 or char_length(normalized_name) > 40 then
    raise exception '组织名称需要 2 到 40 个字符。';
  end if;

  -- 创建组织是一个业务动作：数据库负责写入创建者和 owner 成员关系。
  insert into public.organizations (name, created_by)
  values (normalized_name, auth.uid())
  returning organizations.id into new_organization_id;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (new_organization_id, auth.uid(), 'owner')
  on conflict do nothing;

  return query
    select organizations.id, organizations.name, organizations.created_at
    from public.organizations
    where organizations.id = new_organization_id;
end;
$$;

drop policy if exists "Members can read their organizations" on public.organizations;
create policy "Members can read their organizations"
on public.organizations
for select
to authenticated
using (public.is_org_member(id));

drop policy if exists "Authenticated users can create organizations" on public.organizations;
create policy "Authenticated users can create organizations"
on public.organizations
for insert
to authenticated
with check (auth.uid() is not null and auth.uid() = created_by);

drop policy if exists "Members can read memberships in their organizations" on public.organization_memberships;
create policy "Members can read memberships in their organizations"
on public.organization_memberships
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Owners can manage memberships" on public.organization_memberships;
create policy "Owners can manage memberships"
on public.organization_memberships
for all
to authenticated
using (public.is_org_owner(organization_id))
with check (public.is_org_owner(organization_id));

grant select, insert on table public.organizations to authenticated;
grant select, insert, update, delete on table public.organization_memberships to authenticated;
grant execute on function public.create_organization(text) to authenticated;
