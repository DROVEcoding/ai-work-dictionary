create type public.app_role as enum ('user', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

create table if not exists public.public_terms (
  id text primary key default 'default',
  terms jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.public_terms enable row level security;

drop policy if exists "Authenticated users can read public terms" on public.public_terms;
create policy "Authenticated users can read public terms"
on public.public_terms
for select
to authenticated
using (true);

drop policy if exists "Admins can insert public terms" on public.public_terms;
create policy "Admins can insert public terms"
on public.public_terms
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update public terms" on public.public_terms;
create policy "Admins can update public terms"
on public.public_terms
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete public terms" on public.public_terms;
create policy "Admins can delete public terms"
on public.public_terms
for delete
to authenticated
using (public.is_admin());

grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.public_terms to authenticated;

-- 把某个账号设为管理员时，把下面邮箱换成你的云端登录邮箱后单独执行：
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';
