-- Production foundation: atomic device ownership and server-authoritative economy.
-- Safe to run repeatedly in the Supabase SQL editor.

create extension if not exists pgcrypto;

alter table public.sgz_profiles
  add column if not exists active_device_id text,
  add column if not exists active_device_name text,
  add column if not exists active_seen_at timestamptz,
  add column if not exists save_version bigint not null default 0;

update public.sgz_profiles
set active_device_id = nullif(profile #>> '{syncLock,deviceId}', ''),
    active_device_name = nullif(profile #>> '{syncLock,deviceName}', ''),
    active_seen_at = case when (profile #>> '{syncLock,activeSeenAt}') ~ '^[0-9]{4}-' then (profile #>> '{syncLock,activeSeenAt}')::timestamptz else null end
where active_device_id is null and profile ? 'syncLock';

-- Remove legacy direct-write policies: all mutations now go through locked RPCs.
alter table public.sgz_profiles enable row level security;
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='sgz_profiles'
  loop execute format('drop policy if exists %I on public.sgz_profiles',p.policyname); end loop;
end $$;
create policy "sgz players read own profile" on public.sgz_profiles for select to authenticated using (auth.uid()=user_id and game='sg-zombie-defense');
revoke insert,update,delete,truncate,references,trigger on table public.sgz_profiles from anon,authenticated;
grant select on table public.sgz_profiles to authenticated;

create table if not exists public.sgz_shop_catalog (
  item_key text primary key,
  item_type text not null check (item_type in ('equipment','skill','skin')),
  side text not null check (side in ('plants','zombies')),
  target_key text not null,
  name text not null,
  price integer not null check (price >= 0),
  skin_class text,
  enabled boolean not null default true
);

alter table public.sgz_shop_catalog enable row level security;
drop policy if exists "catalog readable by everyone" on public.sgz_shop_catalog;
create policy "catalog readable by everyone" on public.sgz_shop_catalog for select using (enabled);

create table if not exists public.sgz_economy_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  item_key text,
  delta_gold integer not null default 0,
  balance_after integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists sgz_economy_transactions_user_created_idx on public.sgz_economy_transactions(user_id, created_at desc);
alter table public.sgz_economy_transactions enable row level security;
drop policy if exists "owners read own economy transactions" on public.sgz_economy_transactions;
create policy "owners read own economy transactions" on public.sgz_economy_transactions for select using (auth.uid() = user_id);

create table if not exists public.sgz_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  level_no integer not null check (level_no between 1 and 10),
  faction text not null check (faction in ('plants','zombies')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  won boolean
);
create index if not exists sgz_matches_user_started_idx on public.sgz_matches(user_id, started_at desc);
alter table public.sgz_matches enable row level security;

create or replace function public.sgz_profile_response(p_uid uuid)
returns jsonb
language sql stable security definer set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'profile', profile,
    'save_version', save_version,
    'active_device_id', active_device_id,
    'active_device_name', active_device_name,
    'active_seen_at', active_seen_at,
    'updated_at', updated_at
  ) from public.sgz_profiles where user_id = p_uid;
$$;

drop function if exists public.sgz_claim_device(text,text,boolean);
create or replace function public.sgz_claim_device(p_device_id text, p_device_name text, p_takeover boolean default false, p_initial_profile jsonb default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_uid uuid := auth.uid(); v_row public.sgz_profiles%rowtype; v_initial jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(length(p_device_id),0) not between 8 and 200 then raise exception 'INVALID_DEVICE'; end if;
  if p_initial_profile is not null and (jsonb_typeof(p_initial_profile) <> 'object' or pg_column_size(p_initial_profile) > 524288) then raise exception 'INVALID_PROFILE'; end if;
  v_initial := jsonb_set(coalesce(p_initial_profile,'{}'::jsonb) - 'syncLock' - 'updatedAt','{updatedAt}',to_jsonb(now()),true);
  -- A local profile is trusted only when creating this account's first cloud row.
  -- Every later economy mutation is protected by dedicated transactional RPCs.
  insert into public.sgz_profiles(user_id,game,version,profile,updated_at)
  values(v_uid,'sg-zombie-defense',1,v_initial,now()) on conflict(user_id) do nothing;
  select * into v_row from public.sgz_profiles where user_id=v_uid for update;
  if v_row.active_device_id is distinct from p_device_id
     and v_row.active_seen_at > now() - interval '120 seconds'
     and not p_takeover then
    raise exception 'DEVICE_LOCKED:%', coalesce(v_row.active_device_name,'other device');
  end if;
  update public.sgz_profiles set active_device_id=p_device_id,active_device_name=left(coalesce(p_device_name,'Device'),80),active_seen_at=now() where user_id=v_uid;
  return public.sgz_profile_response(v_uid);
end $$;

create or replace function public.sgz_heartbeat(p_device_id text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_uid uuid := auth.uid(); v_row public.sgz_profiles%rowtype;
begin
  select * into v_row from public.sgz_profiles where user_id=v_uid for update;
  if v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at <= now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED'; end if;
  update public.sgz_profiles set active_seen_at=now() where user_id=v_uid;
  return public.sgz_profile_response(v_uid);
end $$;

create or replace function public.sgz_release_device(p_device_id text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_uid uuid := auth.uid();
begin
  update public.sgz_profiles set active_device_id=null,active_device_name=null,active_seen_at=null
  where user_id=v_uid and active_device_id=p_device_id;
  return found;
end $$;

create or replace function public.sgz_save_profile(p_device_id text, p_profile jsonb, p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_uid uuid := auth.uid(); v_row public.sgz_profiles%rowtype; v_safe jsonb;
begin
  if p_profile is null or jsonb_typeof(p_profile)<>'object' or pg_column_size(p_profile)>524288 then raise exception 'INVALID_PROFILE'; end if;
  select * into v_row from public.sgz_profiles where user_id=v_uid for update;
  if v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at <= now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED'; end if;
  if v_row.save_version <> coalesce(p_expected_version,-1) then raise exception 'VERSION_CONFLICT'; end if;
  -- Economy fields are immutable here; only dedicated RPCs may change them.
  v_safe := coalesce(p_profile,'{}'::jsonb) - 'gold' - 'xp' - 'level' - 'characterLevels' - 'inventory' - 'highestLevel' - 'completedLevels' - 'syncLock' - 'updatedAt';
  v_safe := v_safe || jsonb_build_object(
    'gold',coalesce(v_row.profile->'gold','0'::jsonb),
    'xp',coalesce(v_row.profile->'xp','0'::jsonb),
    'level',coalesce(v_row.profile->'level','1'::jsonb),
    'characterLevels',coalesce(v_row.profile->'characterLevels','{"plants":{},"zombies":{}}'::jsonb),
    'inventory',coalesce(v_row.profile->'inventory','{"equipment":{},"skills":{},"skins":{},"equipped":{"plants":{},"zombies":{}},"activeSkins":{}}'::jsonb),
    'highestLevel',coalesce(v_row.profile->'highestLevel','0'::jsonb),
    'completedLevels',coalesce(v_row.profile->'completedLevels','{}'::jsonb),
    'updatedAt',to_jsonb(now())
  );
  update public.sgz_profiles set profile=v_safe,version=greatest(version,1),save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
  return public.sgz_profile_response(v_uid);
end $$;

create or replace function public.sgz_buy_item(p_device_id text, p_item_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_uid uuid := auth.uid(); v_row public.sgz_profiles%rowtype; v_item public.sgz_shop_catalog%rowtype; v_gold integer; v_inv jsonb; v_bucket text;
begin
  select * into v_row from public.sgz_profiles where user_id=v_uid for update;
  if v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at <= now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED'; end if;
  select * into v_item from public.sgz_shop_catalog where item_key=p_item_key and enabled;
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;
  v_bucket := case v_item.item_type when 'skill' then 'skills' when 'skin' then 'skins' else 'equipment' end;
  v_inv := coalesce(v_row.profile->'inventory','{"equipment":{},"skills":{},"skins":{},"equipped":{"plants":{},"zombies":{}},"activeSkins":{}}'::jsonb);
  if coalesce((v_inv #>> array[v_bucket,p_item_key])::integer,0)>0 then raise exception 'ALREADY_OWNED'; end if;
  v_gold := coalesce((v_row.profile->>'gold')::integer,0);
  if v_gold < v_item.price then raise exception 'INSUFFICIENT_GOLD'; end if;
  v_inv := jsonb_set(v_inv,array[v_bucket,p_item_key],'1'::jsonb,true);
  if v_item.item_type='equipment' then v_inv := jsonb_set(v_inv,array['equipped',v_item.side,v_item.target_key],to_jsonb(p_item_key),true); end if;
  update public.sgz_profiles set profile=jsonb_set(jsonb_set(v_row.profile,'{gold}',to_jsonb(v_gold-v_item.price),true),'{inventory}',v_inv,true),save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
  insert into public.sgz_economy_transactions(user_id,action,item_key,delta_gold,balance_after) values(v_uid,'buy',p_item_key,-v_item.price,v_gold-v_item.price);
  return public.sgz_profile_response(v_uid);
end $$;

create or replace function public.sgz_equip_item(p_device_id text, p_item_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_uid uuid := auth.uid(); v_row public.sgz_profiles%rowtype; v_item public.sgz_shop_catalog%rowtype; v_inv jsonb;
begin
  select * into v_row from public.sgz_profiles where user_id=v_uid for update;
  if v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at <= now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED'; end if;
  select * into v_item from public.sgz_shop_catalog where item_key=p_item_key and enabled and item_type='equipment'; if not found then raise exception 'ITEM_NOT_FOUND'; end if;
  v_inv:=coalesce(v_row.profile->'inventory','{}'::jsonb);
  if coalesce((v_inv #>> array['equipment',p_item_key])::integer,0)<1 then raise exception 'NOT_OWNED'; end if;
  v_inv:=jsonb_set(v_inv,array['equipped',v_item.side,v_item.target_key],to_jsonb(p_item_key),true);
  update public.sgz_profiles set profile=jsonb_set(v_row.profile,'{inventory}',v_inv,true),save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
  return public.sgz_profile_response(v_uid);
end $$;

create or replace function public.sgz_activate_skin(p_device_id text, p_item_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_uid uuid:=auth.uid(); v_row public.sgz_profiles%rowtype; v_item public.sgz_shop_catalog%rowtype; v_inv jsonb;
begin
  select * into v_row from public.sgz_profiles where user_id=v_uid for update;
  if v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at <= now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED'; end if;
  select * into v_item from public.sgz_shop_catalog where item_key=p_item_key and enabled and item_type='skin'; if not found then raise exception 'ITEM_NOT_FOUND'; end if;
  v_inv:=coalesce(v_row.profile->'inventory','{}'::jsonb);
  if coalesce((v_inv #>> array['skins',p_item_key])::integer,0)<1 then raise exception 'NOT_OWNED'; end if;
  v_inv:=jsonb_set(v_inv,array['activeSkins',v_item.side],to_jsonb(coalesce(v_item.skin_class,'')),true);
  update public.sgz_profiles set profile=jsonb_set(v_row.profile,'{inventory}',v_inv,true),save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
  return public.sgz_profile_response(v_uid);
end $$;

create or replace function public.sgz_upgrade_character(p_device_id text,p_roster text,p_character_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_uid uuid:=auth.uid(); v_row public.sgz_profiles%rowtype; v_rec jsonb; v_level integer; v_xp integer; v_need integer; v_profile jsonb;
begin
  if p_roster not in ('plants','zombies') or p_character_key !~ '^[a-zA-Z0-9_]+$' then raise exception 'INVALID_CHARACTER'; end if;
  select * into v_row from public.sgz_profiles where user_id=v_uid for update;
  if v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at <= now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED'; end if;
  v_rec:=coalesce(v_row.profile #> array['characterLevels',p_roster,p_character_key],'{"level":1,"xp":0}'::jsonb); v_level:=coalesce((v_rec->>'level')::integer,1); v_xp:=coalesce((v_rec->>'xp')::integer,0); v_need:=80+greatest(0,v_level-1)*45;
  if v_xp<v_need then raise exception 'INSUFFICIENT_XP'; end if;
  v_rec:=jsonb_build_object('level',v_level+1,'xp',v_xp-v_need); v_profile:=jsonb_set(v_row.profile,array['characterLevels',p_roster,p_character_key],v_rec,true);
  update public.sgz_profiles set profile=v_profile,save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
  return public.sgz_profile_response(v_uid);
end $$;

create or replace function public.sgz_start_match(p_device_id text,p_level integer,p_faction text)
returns uuid language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_uid uuid:=auth.uid(); v_row public.sgz_profiles%rowtype; v_id uuid;
begin
  select * into v_row from public.sgz_profiles where user_id=v_uid for update;
  if v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at <= now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED'; end if;
  if p_level not between 1 and 10 or p_faction not in ('plants','zombies') then raise exception 'INVALID_MATCH'; end if;
  if p_level > least(10,coalesce((v_row.profile->>'highestLevel')::integer,0)+1) then raise exception 'LEVEL_LOCKED'; end if;
  update public.sgz_matches set finished_at=now(),won=false where user_id=v_uid and finished_at is null;
  insert into public.sgz_matches(user_id,device_id,level_no,faction) values(v_uid,p_device_id,p_level,p_faction) returning id into v_id; return v_id;
end $$;

drop function if exists public.sgz_claim_level_reward(text,uuid,boolean,text[]);
create or replace function public.sgz_claim_level_reward(p_device_id text,p_match_id uuid,p_character_key text default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_uid uuid:=auth.uid(); v_row public.sgz_profiles%rowtype; v_match public.sgz_matches%rowtype; v_gold integer; v_xp integer; v_old_gold integer; v_profile jsonb; v_player_xp integer; v_player_level integer; v_need integer; v_char jsonb;
begin
  select * into v_row from public.sgz_profiles where user_id=v_uid for update;
  if v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at <= now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED'; end if;
  select * into v_match from public.sgz_matches where id=p_match_id and user_id=v_uid for update;
  if not found then raise exception 'MATCH_NOT_FOUND'; end if; if v_match.finished_at is not null then raise exception 'REWARD_ALREADY_CLAIMED'; end if;
  -- The caller cannot submit a win flag. The server accepts one timed completion per issued match.
  if now()-v_match.started_at < make_interval(secs=>30+v_match.level_no*6) then raise exception 'MATCH_TOO_SHORT'; end if;
  update public.sgz_matches set finished_at=now(),won=true where id=p_match_id;
  v_gold:=35+v_match.level_no*18; v_xp:=30+v_match.level_no*15; v_old_gold:=coalesce((v_row.profile->>'gold')::integer,0); v_player_xp:=coalesce((v_row.profile->>'xp')::integer,0)+v_xp; v_player_level:=coalesce((v_row.profile->>'level')::integer,1);
  loop v_need:=100+greatest(0,v_player_level-1)*60; exit when v_player_xp<v_need; v_player_xp:=v_player_xp-v_need; v_player_level:=v_player_level+1; end loop;
  v_profile:=jsonb_set(jsonb_set(jsonb_set(v_row.profile,'{gold}',to_jsonb(v_old_gold+v_gold),true),'{xp}',to_jsonb(v_player_xp),true),'{level}',to_jsonb(v_player_level),true);
  v_profile:=jsonb_set(v_profile,'{highestLevel}',to_jsonb(greatest(coalesce((v_profile->>'highestLevel')::integer,0),v_match.level_no)),true);
  v_profile:=jsonb_set(v_profile,'{completedLevels}',coalesce(v_profile->'completedLevels','{}'::jsonb),true);
  v_profile:=jsonb_set(v_profile,array['completedLevels',v_match.level_no::text],'1'::jsonb,true);
  if p_character_key is not null and p_character_key~'^[a-zA-Z0-9_]+$' and v_profile #> array['characterLevels',v_match.faction,p_character_key] is not null then
    v_char:=v_profile #> array['characterLevels',v_match.faction,p_character_key];
    v_char:=jsonb_set(v_char,'{xp}',to_jsonb(coalesce((v_char->>'xp')::integer,0)+8+v_match.level_no*2),true);
    v_profile:=jsonb_set(v_profile,array['characterLevels',v_match.faction,p_character_key],v_char,true);
  end if;
  update public.sgz_profiles set profile=v_profile,save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
  insert into public.sgz_economy_transactions(user_id,action,delta_gold,balance_after,metadata) values(v_uid,'level_reward',v_gold,v_old_gold+v_gold,jsonb_build_object('match_id',p_match_id,'level',v_match.level_no,'server_timed_completion',true));
  return public.sgz_profile_response(v_uid);
end $$;

-- Custom avatar storage (public reads; owner-only versioned writes under <user-id>/).
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,5242880,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='sgz avatar public read') then
    create policy "sgz avatar public read" on storage.objects for select using (bucket_id='avatars');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='sgz avatar owner insert') then
    create policy "sgz avatar owner insert" on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='sgz avatar owner update') then
    create policy "sgz avatar owner update" on storage.objects for update to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='sgz avatar owner delete') then
    create policy "sgz avatar owner delete" on storage.objects for delete to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
  end if;
end $$;

-- Realtime ownership notifications are best-effort; add the table once when the publication exists.
do $$ begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='sgz_profiles') then
    alter publication supabase_realtime add table public.sgz_profiles;
  end if;
end $$;

-- SECURITY DEFINER functions are not executable by PUBLIC/anon.
revoke all on function public.sgz_profile_response(uuid) from public, anon;
revoke all on function public.sgz_claim_device(text,text,boolean,jsonb) from public, anon;
revoke all on function public.sgz_heartbeat(text) from public, anon;
revoke all on function public.sgz_release_device(text) from public, anon;
revoke all on function public.sgz_save_profile(text,jsonb,bigint) from public, anon;
revoke all on function public.sgz_buy_item(text,text) from public, anon;
revoke all on function public.sgz_equip_item(text,text) from public, anon;
revoke all on function public.sgz_activate_skin(text,text) from public, anon;
revoke all on function public.sgz_upgrade_character(text,text,text) from public, anon;
revoke all on function public.sgz_start_match(text,integer,text) from public, anon;
revoke all on function public.sgz_claim_level_reward(text,uuid,text) from public, anon;
grant execute on function public.sgz_claim_device(text,text,boolean,jsonb),public.sgz_heartbeat(text),public.sgz_release_device(text),public.sgz_save_profile(text,jsonb,bigint),public.sgz_buy_item(text,text),public.sgz_equip_item(text,text),public.sgz_activate_skin(text,text),public.sgz_upgrade_character(text,text,text),public.sgz_start_match(text,integer,text),public.sgz_claim_level_reward(text,uuid,text) to authenticated;

insert into public.sgz_shop_catalog(item_key,item_type,side,target_key,name,price,skin_class) values
  ('archerQuiver','equipment','plants','peashooter','蜀軍箭袋',120,null),
  ('grainBanner','equipment','plants','sunflower','軍糧旗令',120,null),
  ('wallShield','equipment','plants','wallnut','玄鐵盾面',130,null),
  ('ambushBoots','equipment','plants','potato','伏兵疾靴',150,null),
  ('greenDragonArmor','equipment','plants','firepea','青龍戰袍',180,null),
  ('iceSpearCharm','equipment','plants','zhaoyun','冰槍符石',180,null),
  ('phoenixFan','equipment','plants','pangtong','鳳羽軍扇',260,null),
  ('lanceSaddle','equipment','plants','machao','突騎銀鞍',220,null),
  ('goldenBow','equipment','plants','huangzhong','百步金弓',260,null),
  ('roarDrum','equipment','plants','zhangfei','虎吼戰鼓',220,null),
  ('starRobe','equipment','plants','kongming','七星羽衣',320,null),
  ('virtueSeal','equipment','plants','liubei','仁德玉印',320,null),
  ('ironHelmet','equipment','zombies','cone','鐵角盔',100,null),
  ('boneArmor','equipment','zombies','bucket','獸骨厚甲',140,null),
  ('vaultPole','equipment','zombies','poleVault','飛躍竹竿',160,null),
  ('catapultOil','equipment','zombies','fireCatapult','烈焰火油',260,null),
  ('guanyuSkill','skill','plants','firepea','青龍火斬 Lv.2',240,null),
  ('zhaoyunSkill','skill','plants','zhaoyun','冰龍槍法',240,null),
  ('pangtongSkill','skill','plants','pangtong','鳳火連營',320,null),
  ('huangzhongSkill','skill','plants','huangzhong','穿雲箭訣',320,null),
  ('liubeiVirtue','skill','plants','liubei','仁德治世',300,null),
  ('jesterChaos','skill','zombies','jester','亂陣狂笑強化',260,null),
  ('titanSmashSkill','skill','zombies','corpseTitan','破城屍槌奧義',320,null),
  ('redFrame','skin','plants','all','赤焰卡框',90,'skin-red'),
  ('blueFrame','skin','zombies','all','幽藍屍潮卡框',90,'skin-blue'),
  ('royalGoldFrame','skin','plants','all','王者金框',180,'skin-red'),
  ('darkArmyFrame','skin','zombies','all','屍潮暗金框',180,'skin-blue')
on conflict(item_key) do update set item_type=excluded.item_type,side=excluded.side,target_key=excluded.target_key,name=excluded.name,price=excluded.price,skin_class=excluded.skin_class,enabled=true;
