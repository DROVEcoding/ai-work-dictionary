create table if not exists public.organization_term_backups (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  terms jsonb not null,
  updated_by uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);

alter table public.organization_term_backups enable row level security;

drop policy if exists "Members can read organization terms" on public.organization_term_backups;
create policy "Members can read organization terms"
on public.organization_term_backups
for select
to authenticated
using (public.is_org_member(organization_id));

drop policy if exists "Members can insert organization terms" on public.organization_term_backups;
create policy "Members can insert organization terms"
on public.organization_term_backups
for insert
to authenticated
with check (
  auth.uid() = updated_by
  and public.is_org_member(organization_id)
);

drop policy if exists "Members can update organization terms" on public.organization_term_backups;
create policy "Members can update organization terms"
on public.organization_term_backups
for update
to authenticated
using (public.is_org_member(organization_id))
with check (
  auth.uid() = updated_by
  and public.is_org_member(organization_id)
);

grant select, insert, update on table public.organization_term_backups to authenticated;
