create index if not exists profiles_email_idx
on public.profiles (lower(email));

create index if not exists profiles_role_idx
on public.profiles (role);

create index if not exists organizations_name_idx
on public.organizations (lower(name));

create index if not exists feedback_reports_status_idx
on public.feedback_reports (status);

create index if not exists feedback_reports_organization_id_idx
on public.feedback_reports (organization_id);

create index if not exists organization_memberships_organization_id_idx
on public.organization_memberships (organization_id);

create index if not exists organization_memberships_user_id_idx
on public.organization_memberships (user_id);

create or replace function public.get_admin_organization_detail(org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  organization_record public.organizations%rowtype;
  backup_record public.organization_term_backups%rowtype;
begin
  if not public.is_admin() then
    raise exception '只有超级管理员可以读取组织详情。';
  end if;

  select *
  into organization_record
  from public.organizations
  where id = org_id;

  if organization_record.id is null then
    raise exception '没有找到这个组织。';
  end if;

  select *
  into backup_record
  from public.organization_term_backups
  where organization_id = org_id;

  return jsonb_build_object(
    'id', organization_record.id,
    'name', organization_record.name,
    'created_at', organization_record.created_at,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', om.user_id,
        'email', p.email,
        'role', om.role,
        'created_at', om.created_at
      ) order by om.role desc, p.email)
      from public.organization_memberships as om
      join public.profiles as p on p.id = om.user_id
      where om.organization_id = org_id
    ), '[]'::jsonb),
    'feedback_reports', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'message', f.message,
        'status', f.status,
        'reporter_email', p.email,
        'created_at', f.created_at
      ) order by f.created_at desc)
      from public.feedback_reports as f
      left join public.profiles as p on p.id = f.reporter_id
      where f.organization_id = org_id
    ), '[]'::jsonb),
    'term_backup', case
      when backup_record.organization_id is null then null
      else jsonb_build_object(
        'updated_at', backup_record.updated_at,
        'term_count', jsonb_array_length(coalesce(backup_record.terms, '[]'::jsonb))
      )
    end
  );
end;
$$;

grant execute on function public.get_admin_organization_detail(uuid) to authenticated;
