-- Second season, first stage only. Additive; season-one match signatures stay intact.
-- Apply transactionally before publishing the matching frontend.
begin;
alter table public.sgz_matches add column if not exists season_no integer not null default 1;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='sgz_matches_season_no_check' and conrelid='public.sgz_matches'::regclass) then
  alter table public.sgz_matches add constraint sgz_matches_season_no_check check(season_no in (1,2));
 end if;
end $$;

create or replace function public.sgz_seed_season2_profile(p jsonb)
returns jsonb language plpgsql immutable set search_path=pg_catalog,public as $$
declare v jsonb:=coalesce(p,'{}'); side text; k text;
begin
 v:=jsonb_set(v,'{season2Progress}',coalesce(v->'season2Progress','{"plants":{"highestLevel":0,"completedLevels":{}},"zombies":{"highestLevel":0,"completedLevels":{}}}'),true);
 v:=jsonb_set(v,'{characterLevels}',coalesce(v->'characterLevels','{}'),true);
 foreach side in array array['plants','zombies'] loop
  v:=jsonb_set(v,array['characterLevels',side],coalesce(v#>array['characterLevels',side],'{}'),true);
  foreach k in array case when side='plants' then array['s2Tuntian','s2Crossbow','s2Shield'] else array['s2Rat','s2Nail','s2Coffin'] end loop
   if v#>array['characterLevels',side,k] is null then v:=jsonb_set(v,array['characterLevels',side,k],'{"level":1,"xp":0}',true); end if;
  end loop;
 end loop;
 return v;
end $$;
update public.sgz_profiles set profile=public.sgz_seed_season2_profile(profile),save_version=save_version+1,updated_at=now()
where profile is distinct from public.sgz_seed_season2_profile(profile);

create or replace function public.sgz_save_profile(p_device_id text,p_profile jsonb,p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_uid uuid:=auth.uid();v_row public.sgz_profiles%rowtype;v_safe jsonb;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_profile is null or jsonb_typeof(p_profile)<>'object' or pg_column_size(p_profile)>524288 then raise exception 'INVALID_PROFILE';end if;
 select * into v_row from public.sgz_profiles where user_id=v_uid for update;
 if not found or v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at is null or v_row.active_seen_at<=now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED';end if;
 if v_row.save_version<>coalesce(p_expected_version,-1) then raise exception 'VERSION_CONFLICT';end if;
 v_safe:=p_profile - 'gold' - 'xp' - 'level' - 'characterLevels' - 'inventory' - 'highestLevel' - 'completedLevels' - 'campaignProgress' - 'season2Progress' - 'syncLock' - 'updatedAt';
 v_safe:=v_safe||jsonb_build_object(
  'gold',coalesce(v_row.profile->'gold','0'),'xp',coalesce(v_row.profile->'xp','0'),'level',coalesce(v_row.profile->'level','1'),
  'characterLevels',coalesce(v_row.profile->'characterLevels','{"plants":{},"zombies":{}}'),
  'inventory',coalesce(v_row.profile->'inventory','{"equipment":{},"skills":{},"skins":{},"equipped":{"plants":{},"zombies":{}},"activeSkins":{}}'),
  'highestLevel',coalesce(v_row.profile->'highestLevel','0'),'completedLevels',coalesce(v_row.profile->'completedLevels','{}'),
  'campaignProgress',coalesce(v_row.profile->'campaignProgress','{"plants":{"highestLevel":0,"completedLevels":{}},"zombies":{"highestLevel":0,"completedLevels":{}}}'),
  'season2Progress',coalesce(v_row.profile->'season2Progress','{"plants":{"highestLevel":0,"completedLevels":{}},"zombies":{"highestLevel":0,"completedLevels":{}}}'),'updatedAt',to_jsonb(now()));
 update public.sgz_profiles set profile=public.sgz_seed_season2_profile(v_safe),version=greatest(version,1),save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
 return public.sgz_profile_response(v_uid);
end $$;

create or replace function public.sgz_start_season2_match(p_device_id text,p_level integer,p_faction text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_uid uuid:=auth.uid();v_row public.sgz_profiles%rowtype;v_id uuid;v_profile jsonb;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED';end if;
 select * into v_row from public.sgz_profiles where user_id=v_uid for update;
 if not found or v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at is null or v_row.active_seen_at<=now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED';end if;
 if p_level is distinct from 1 then raise exception 'LEVEL_LOCKED';end if;
 if p_faction is null or p_faction not in ('plants','zombies') then raise exception 'INVALID_MATCH';end if;
 v_profile:=public.sgz_seed_season2_profile(v_row.profile);
 if v_profile is distinct from v_row.profile then
  update public.sgz_profiles set profile=v_profile,save_version=save_version+1,updated_at=now() where user_id=v_uid;
 end if;
 update public.sgz_matches set finished_at=now(),won=false where user_id=v_uid and finished_at is null;
 insert into public.sgz_matches(user_id,device_id,season_no,level_no,faction) values(v_uid,p_device_id,2,p_level,p_faction) returning id into v_id;
 return v_id;
end $$;

create or replace function public.sgz_claim_level_reward(p_device_id text,p_match_id uuid,p_character_key text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
 v_uid uuid:=auth.uid();v_row public.sgz_profiles%rowtype;v_match public.sgz_matches%rowtype;
 v_gold integer;v_xp integer;v_old_gold integer;v_profile jsonb;v_player_xp integer;v_player_level integer;v_need integer;v_char jsonb;
 v_campaign jsonb;v_side jsonb;v_completed jsonb;v_highest integer:=0;v_i integer;v_minimum_seconds integer;v_progress_key text;v_allowed text[];
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED';end if;
 select * into v_row from public.sgz_profiles where user_id=v_uid for update;
 if not found or v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at is null or v_row.active_seen_at<=now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED';end if;
 select * into v_match from public.sgz_matches where id=p_match_id and user_id=v_uid for update;
 if not found then raise exception 'MATCH_NOT_FOUND';end if;
 if v_match.device_id is distinct from p_device_id then raise exception 'DEVICE_LOCKED';end if;
 if v_match.finished_at is not null then raise exception 'REWARD_ALREADY_CLAIMED';end if;
 if v_match.season_no=2 and v_match.level_no<>1 then raise exception 'LEVEL_LOCKED';end if;
 v_minimum_seconds:=case when v_match.faction='zombies' then 8 else 30+v_match.level_no*6 end;
 if now()-v_match.started_at<make_interval(secs=>v_minimum_seconds) then raise exception 'MATCH_TOO_SHORT';end if;
 if v_match.season_no=2 then
  v_allowed:=case when v_match.faction='plants' then array['s2Tuntian','s2Crossbow','s2Shield'] else array['s2Rat','s2Nail','s2Coffin'] end;
  if p_character_key is not null and not (p_character_key=any(v_allowed)) then raise exception 'INVALID_CHARACTER';end if;
  if p_character_key in ('s2Shield','s2Coffin') and coalesce((v_row.profile#>>array['season2Progress',v_match.faction,'completedLevels','1'])::integer,0)<1 then raise exception 'INVALID_CHARACTER';end if;
 elsif p_character_key like 's2%' then raise exception 'INVALID_CHARACTER';end if;
 update public.sgz_matches set finished_at=now(),won=true where id=p_match_id;
 v_gold:=35+v_match.level_no*18;v_xp:=30+v_match.level_no*15;
 v_old_gold:=coalesce((v_row.profile->>'gold')::integer,0);v_player_xp:=coalesce((v_row.profile->>'xp')::integer,0)+v_xp;v_player_level:=coalesce((v_row.profile->>'level')::integer,1);
 loop
  v_need:=100+greatest(0,v_player_level-1)*60;exit when v_player_xp<v_need;v_player_xp:=v_player_xp-v_need;v_player_level:=v_player_level+1;
 end loop;
 v_profile:=public.sgz_seed_season2_profile(v_row.profile);
 v_profile:=jsonb_set(jsonb_set(jsonb_set(v_profile,'{gold}',to_jsonb(v_old_gold+v_gold),true),'{xp}',to_jsonb(v_player_xp),true),'{level}',to_jsonb(v_player_level),true);
 v_progress_key:=case when v_match.season_no=2 then 'season2Progress' else 'campaignProgress' end;
 v_campaign:=coalesce(v_profile->v_progress_key,jsonb_build_object('plants',jsonb_build_object('highestLevel',coalesce((v_profile->>'highestLevel')::integer,0),'completedLevels',coalesce(v_profile->'completedLevels','{}')),'zombies',jsonb_build_object('highestLevel',0,'completedLevels','{}'::jsonb)));
 v_side:=coalesce(v_campaign->v_match.faction,jsonb_build_object('highestLevel',0,'completedLevels','{}'::jsonb));
 v_completed:=jsonb_set(coalesce(v_side->'completedLevels','{}'),array[v_match.level_no::text],'1',true);
 for v_i in 1..10 loop exit when coalesce((v_completed->>v_i::text)::integer,0)<1;v_highest:=v_i;end loop;
 v_side:=jsonb_set(jsonb_set(v_side,'{completedLevels}',v_completed,true),'{highestLevel}',to_jsonb(v_highest),true);
 v_profile:=jsonb_set(v_profile,array[v_progress_key],jsonb_set(v_campaign,array[v_match.faction],v_side,true),true);
 -- Legacy aggregate belongs to the first season ONLY.
 if v_match.season_no=1 then
  v_profile:=jsonb_set(v_profile,'{highestLevel}',to_jsonb(greatest(coalesce((v_profile->>'highestLevel')::integer,0),v_match.level_no)),true);
  v_profile:=jsonb_set(v_profile,'{completedLevels}',coalesce(v_profile->'completedLevels','{}'),true);
  v_profile:=jsonb_set(v_profile,array['completedLevels',v_match.level_no::text],'1',true);
 end if;
 if p_character_key is not null and p_character_key~'^[a-zA-Z0-9_]+$' and v_profile#>array['characterLevels',v_match.faction,p_character_key] is not null then
  v_char:=v_profile#>array['characterLevels',v_match.faction,p_character_key];
  v_char:=jsonb_set(v_char,'{xp}',to_jsonb(coalesce((v_char->>'xp')::integer,0)+8+v_match.level_no*2),true);
  v_profile:=jsonb_set(v_profile,array['characterLevels',v_match.faction,p_character_key],v_char,true);
 end if;
 update public.sgz_profiles set profile=v_profile,save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
 insert into public.sgz_economy_transactions(user_id,action,delta_gold,balance_after,metadata) values(v_uid,'level_reward',v_gold,v_old_gold+v_gold,jsonb_build_object('match_id',p_match_id,'season',v_match.season_no,'level',v_match.level_no,'faction',v_match.faction,'server_timed_completion',true));
 return public.sgz_profile_response(v_uid);
end $$;
revoke all on function public.sgz_seed_season2_profile(jsonb) from public,anon,authenticated;
revoke all on function public.sgz_start_season2_match(text,integer,text) from public,anon;
revoke all on function public.sgz_save_profile(text,jsonb,bigint) from public,anon;
revoke all on function public.sgz_claim_level_reward(text,uuid,text) from public,anon;
grant execute on function public.sgz_start_season2_match(text,integer,text),public.sgz_save_profile(text,jsonb,bigint),public.sgz_claim_level_reward(text,uuid,text) to authenticated;
notify pgrst,'reload schema';
commit;
