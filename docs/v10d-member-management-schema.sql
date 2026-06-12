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
end;
$$;

grant execute on function public.promote_organization_member(uuid, uuid) to authenticated;
grant execute on function public.remove_organization_member(uuid, uuid) to authenticated;
