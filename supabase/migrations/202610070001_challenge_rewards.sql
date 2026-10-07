-- Phase 6 challenge medals: route-bound, telemetry-evaluated and atomic with level rewards.
begin;

do $$
begin
 if to_regprocedure('public.sgz_claim_match_rewards(text,uuid,text,text[],text,text,jsonb)') is null then
  update public.sgz_profiles set profile=profile-'challenges' where profile?'challenges';
 end if;
end $$;

create or replace function public.sgz_seed_challenge_profile(p jsonb)
returns jsonb language sql immutable set search_path=pg_catalog,public as $$
 select jsonb_set(coalesce(p,'{}'::jsonb),'{challenges}',
  jsonb_build_object(
   'version',1,
   'medals',case when jsonb_typeof(p#>'{challenges,medals}')='object' then p#>'{challenges,medals}' else '{}'::jsonb end,
   'claims',case when jsonb_typeof(p#>'{challenges,claims}')='object' then p#>'{challenges,claims}' else '{}'::jsonb end
  ),true)
$$;

update public.sgz_profiles
set profile=public.sgz_seed_challenge_profile(profile)
where profile is distinct from public.sgz_seed_challenge_profile(profile);

create or replace function public.sgz_strip_initial_challenges()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin new.profile:=public.sgz_seed_challenge_profile(coalesce(new.profile,'{}'::jsonb)-'challenges');return new;end $$;
drop trigger if exists sgz_profiles_strip_initial_challenges on public.sgz_profiles;
create trigger sgz_profiles_strip_initial_challenges before insert on public.sgz_profiles for each row execute function public.sgz_strip_initial_challenges();

create or replace function public.sgz_route_challenge_ids(p_season integer,p_faction text,p_level integer)
returns text[] language plpgsql immutable set search_path=pg_catalog,public as $$
declare v_pool text[];v_size integer;
begin
 if p_level is null or p_level<1 or p_level>10 or p_season not in (1,2) or p_faction not in ('plants','zombies') then return array[]::text[];end if;
 v_pool:=case
  when p_season=1 and p_faction='plants' then array['no-hero','gate-health','resource-cap','no-relocation','protect-unit','no-enemy-leak','melee-only','time-limit']
  when p_season=1 and p_faction='zombies' then array['no-hero','time-limit','melee-only','resource-cap','no-relocation','protect-unit','no-enemy-leak']
  when p_season=2 and p_faction='plants' then array['no-enemy-leak','protect-unit','resource-cap','no-hero','gate-health','no-relocation','time-limit','melee-only']
  else array['time-limit','melee-only','no-hero','resource-cap','protect-unit','no-relocation','no-enemy-leak'] end;
 v_size:=cardinality(v_pool);
 return array[v_pool[mod(p_level-1,v_size)+1],v_pool[mod(p_level,v_size)+1],v_pool[mod(p_level+1,v_size)+1]];
end $$;

-- Re-evaluates the submitted canonical attestation. This prevents arbitrary medal IDs;
-- the browser battle remains client-attested rather than a server-side simulation.
create or replace function public.sgz_challenge_telemetry_passes(p_id text,p_faction text,p_telemetry jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog,public as $$
declare v_outcome jsonb;
begin
 select value into v_outcome from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) with ordinality e(value,n)
 where value->>'type'='outcome' order by n desc limit 1;
 if coalesce((v_outcome->>'win')::boolean,false) is not true then return false;end if;
 if p_id='no-hero' then return not exists(select 1 from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='deploy' and e->>'side'=p_faction and coalesce((e->>'hero')::boolean,false));end if;
 if p_id='gate-health' then return coalesce((v_outcome->>'objectiveHealthPct')::numeric,0)>=0.5;end if;
 if p_id='resource-cap' then return coalesce((p_telemetry#>>array['totals','resources',p_faction,'spent'])::numeric,0)<=500;end if;
 if p_id='no-relocation' then return not exists(select 1 from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='relocation' and e->>'side'=p_faction);end if;
 if p_id='melee-only' then return not exists(select 1 from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='deploy' and e->>'side'=p_faction and coalesce((e->>'ranged')::boolean,false));end if;
 if p_id='time-limit' then return coalesce((v_outcome->>'elapsedMs')::numeric,999999999)<=180000;end if;
 if p_id='protect-unit' then return coalesce((v_outcome->>'protectedUnitAlive')::boolean,false);end if;
 if p_id='no-enemy-leak' then return not exists(select 1 from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='leak' and e->>'side' is distinct from p_faction);end if;
 return false;
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end $$;

create or replace function public.sgz_save_profile(p_device_id text,p_profile jsonb,p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_uid uuid:=auth.uid();v_row public.sgz_profiles%rowtype;v_safe jsonb;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_profile is null or jsonb_typeof(p_profile)<>'object' or pg_column_size(p_profile)>524288 then raise exception 'INVALID_PROFILE';end if;
 select * into v_row from public.sgz_profiles where user_id=v_uid for update;
 if not found or v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at is null or v_row.active_seen_at<=now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED';end if;
 if v_row.save_version<>coalesce(p_expected_version,-1) then raise exception 'VERSION_CONFLICT';end if;
 v_safe:=p_profile - 'gold' - 'xp' - 'level' - 'characterLevels' - 'inventory' - 'highestLevel' - 'completedLevels' - 'campaignProgress' - 'season2Progress' - 'challenges' - 'syncLock' - 'updatedAt';
 v_safe:=v_safe||jsonb_build_object(
  'gold',coalesce(v_row.profile->'gold','0'),'xp',coalesce(v_row.profile->'xp','0'),'level',coalesce(v_row.profile->'level','1'),
  'characterLevels',coalesce(v_row.profile->'characterLevels','{"plants":{},"zombies":{}}'),
  'inventory',coalesce(v_row.profile->'inventory','{"equipment":{},"skills":{},"skins":{},"equipped":{"plants":{},"zombies":{}},"activeSkins":{}}'),
  'highestLevel',coalesce(v_row.profile->'highestLevel','0'),'completedLevels',coalesce(v_row.profile->'completedLevels','{}'),
  'campaignProgress',coalesce(v_row.profile->'campaignProgress','{"plants":{"highestLevel":0,"completedLevels":{}},"zombies":{"highestLevel":0,"completedLevels":{}}}'),
  'season2Progress',coalesce(v_row.profile->'season2Progress','{"plants":{"highestLevel":0,"completedLevels":{}},"zombies":{"highestLevel":0,"completedLevels":{}}}'),
  'challenges',coalesce(v_row.profile->'challenges','{"version":1,"medals":{},"claims":{}}'),'updatedAt',to_jsonb(now()));
 update public.sgz_profiles set profile=public.sgz_seed_challenge_profile(public.sgz_seed_season2_profile(v_safe)),version=greatest(version,1),save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
 return public.sgz_profile_response(v_uid);
end $$;

drop function if exists public.sgz_claim_match_rewards(text,uuid,text,text[],text);
drop function if exists public.sgz_claim_match_rewards(text,uuid,text,text[],text,jsonb);
create or replace function public.sgz_claim_match_rewards(p_device_id text,p_match_id uuid,p_character_key text,p_challenge_ids text[],p_telemetry_digest text,p_telemetry_canonical text,p_telemetry jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
 v_uid uuid:=auth.uid();v_row public.sgz_profiles%rowtype;v_match public.sgz_matches%rowtype;v_allowed text[];v_ids text[];v_id text;v_existing jsonb;v_profile jsonb;v_medals jsonb;v_claims jsonb;v_medal_key text;v_dummy jsonb;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_telemetry_digest is null or p_telemetry_digest!~'^[0-9a-f]{64}$' then raise exception 'INVALID_TELEMETRY_DIGEST';end if;
 if p_telemetry is null or jsonb_typeof(p_telemetry)<>'object' or pg_column_size(p_telemetry)>262144 then raise exception 'INVALID_TELEMETRY';end if;
 if p_telemetry_canonical is null or octet_length(p_telemetry_canonical)>262144 or p_telemetry_canonical::jsonb is distinct from p_telemetry then raise exception 'INVALID_TELEMETRY';end if;
 if encode(digest(convert_to(p_telemetry_canonical,'UTF8'),'sha256'),'hex') is distinct from p_telemetry_digest then raise exception 'TELEMETRY_DIGEST_MISMATCH';end if;
 if cardinality(coalesce(p_challenge_ids,array[]::text[]))>3 then raise exception 'INVALID_CHALLENGE';end if;
 select coalesce(array_agg(distinct id order by id),array[]::text[]) into v_ids from unnest(coalesce(p_challenge_ids,array[]::text[])) id;
 if cardinality(v_ids)<>cardinality(coalesce(p_challenge_ids,array[]::text[])) then raise exception 'INVALID_CHALLENGE';end if;
 select * into v_row from public.sgz_profiles where user_id=v_uid for update;
 if not found or v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at is null or v_row.active_seen_at<=now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED';end if;
 select * into v_match from public.sgz_matches where id=p_match_id and user_id=v_uid for update;
 if not found then raise exception 'MATCH_NOT_FOUND';end if;
 if v_match.device_id is distinct from p_device_id then raise exception 'DEVICE_LOCKED';end if;
 if (p_telemetry->>'season')::integer is distinct from v_match.season_no or p_telemetry->>'faction' is distinct from v_match.faction or (p_telemetry->>'level')::integer is distinct from v_match.level_no then raise exception 'INVALID_TELEMETRY';end if;
 v_allowed:=public.sgz_route_challenge_ids(v_match.season_no,v_match.faction,v_match.level_no);
 foreach v_id in array v_ids loop
  if not v_id=any(v_allowed) then raise exception 'INVALID_CHALLENGE';end if;
 end loop;
 if p_telemetry->'challengeIds' is distinct from to_jsonb(v_ids) then raise exception 'INVALID_TELEMETRY';end if;
 foreach v_id in array v_ids loop
  if not public.sgz_challenge_telemetry_passes(v_id,v_match.faction,p_telemetry) then raise exception 'CHALLENGE_NOT_COMPLETED';end if;
 end loop;
 v_existing:=v_row.profile#>array['challenges','claims',p_match_id::text];
 if v_match.finished_at is not null then
  if v_match.won is true and v_existing is not null then
   if v_existing->>'telemetryDigest' is distinct from p_telemetry_digest or v_existing->'challengeIds' is distinct from to_jsonb(v_ids) or v_existing->>'characterKey' is distinct from p_character_key then raise exception 'CHALLENGE_REPLAY_MISMATCH';end if;
   return public.sgz_profile_response(v_uid);
  end if;
  raise exception 'REWARD_ALREADY_CLAIMED';
 end if;
 v_dummy:=public.sgz_claim_level_reward(p_device_id,p_match_id,p_character_key);
 select * into v_row from public.sgz_profiles where user_id=v_uid for update;
 v_profile:=public.sgz_seed_challenge_profile(v_row.profile);v_medals:=v_profile#>'{challenges,medals}';v_claims:=v_profile#>'{challenges,claims}';
 foreach v_id in array v_ids loop
  v_medal_key:=v_match.season_no::text||':'||v_match.faction||':'||v_match.level_no::text||':'||v_id;
  if not v_medals?v_medal_key then v_medals:=jsonb_set(v_medals,array[v_medal_key],jsonb_build_object('earnedAt',now(),'season',v_match.season_no,'faction',v_match.faction,'level',v_match.level_no,'challengeId',v_id),true);end if;
 end loop;
 v_claims:=jsonb_set(v_claims,array[p_match_id::text],jsonb_build_object('telemetryDigest',p_telemetry_digest,'challengeIds',to_jsonb(v_ids),'characterKey',p_character_key,'claimedAt',now()),true);
 v_profile:=jsonb_set(jsonb_set(v_profile,'{challenges,medals}',v_medals,true),'{challenges,claims}',v_claims,true);
 update public.sgz_profiles set profile=v_profile,save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
 return public.sgz_profile_response(v_uid);
end $$;

revoke all on function public.sgz_seed_challenge_profile(jsonb) from public,anon,authenticated;
revoke all on function public.sgz_strip_initial_challenges() from public,anon,authenticated;
revoke all on function public.sgz_route_challenge_ids(integer,text,integer) from public,anon,authenticated;
revoke all on function public.sgz_challenge_telemetry_passes(text,text,jsonb) from public,anon,authenticated;
revoke all on function public.sgz_claim_match_rewards(text,uuid,text,text[],text,text,jsonb) from public,anon;
grant execute on function public.sgz_claim_match_rewards(text,uuid,text,text[],text,text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
