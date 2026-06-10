create table if not exists public.term_backups (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  terms jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.term_backups enable row level security;

drop policy if exists "Users can read their own term backup" on public.term_backups;
create policy "Users can read their own term backup"
on public.term_backups
for select
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Users can insert their own term backup" on public.term_backups;
create policy "Users can insert their own term backup"
on public.term_backups
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Users can update their own term backup" on public.term_backups;
create policy "Users can update their own term backup"
on public.term_backups
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

grant select, insert, update on table public.term_backups to authenticated;
