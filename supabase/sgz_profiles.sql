-- 三國萌將守城：屍潮來襲｜Supabase prototype cloud save table
-- Run this in Supabase SQL Editor once for the GitHub Pages prototype.
-- This is a simple sync-code based prototype, not a full authenticated account system.

create table if not exists public.sgz_profiles (
  owner_code text primary key,
  game text not null default 'sg-zombie-defense',
  version integer not null default 1,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists sgz_profiles_game_updated_idx
  on public.sgz_profiles (game, updated_at desc);

alter table public.sgz_profiles enable row level security;

-- Prototype policy: allow the anon key to upsert/select rows by sync code.
-- Anyone with the same sync code can load/overwrite that save.
-- Replace this with Supabase Auth user_id policies before public launch.
drop policy if exists "sgz prototype read by anon" on public.sgz_profiles;
create policy "sgz prototype read by anon"
  on public.sgz_profiles
  for select
  to anon
  using (game = 'sg-zombie-defense');

drop policy if exists "sgz prototype insert by anon" on public.sgz_profiles;
create policy "sgz prototype insert by anon"
  on public.sgz_profiles
  for insert
  to anon
  with check (game = 'sg-zombie-defense' and length(owner_code) >= 12);

drop policy if exists "sgz prototype update by anon" on public.sgz_profiles;
create policy "sgz prototype update by anon"
  on public.sgz_profiles
  for update
  to anon
  using (game = 'sg-zombie-defense')
  with check (game = 'sg-zombie-defense' and length(owner_code) >= 12);
