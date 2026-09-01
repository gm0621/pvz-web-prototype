-- 三國萌將守城：屍潮來襲｜Supabase Auth cloud save table
-- Run this in Supabase SQL Editor once for the GitHub Pages prototype.
-- Players sign in with Google or email/password; saves are scoped to auth.uid().

create table if not exists public.sgz_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  game text not null default 'sg-zombie-defense',
  version integer not null default 1,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists sgz_profiles_game_updated_idx
  on public.sgz_profiles (game, updated_at desc);

alter table public.sgz_profiles enable row level security;

-- Authenticated players can only read their own save.
drop policy if exists "sgz players read own profile" on public.sgz_profiles;
create policy "sgz players read own profile"
  on public.sgz_profiles
  for select
  to authenticated
  using (auth.uid() = user_id and game = 'sg-zombie-defense');

-- Authenticated players can only create their own save.
drop policy if exists "sgz players insert own profile" on public.sgz_profiles;
create policy "sgz players insert own profile"
  on public.sgz_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id and game = 'sg-zombie-defense');

-- Authenticated players can only update their own save.
drop policy if exists "sgz players update own profile" on public.sgz_profiles;
create policy "sgz players update own profile"
  on public.sgz_profiles
  for update
  to authenticated
  using (auth.uid() = user_id and game = 'sg-zombie-defense')
  with check (auth.uid() = user_id and game = 'sg-zombie-defense');
