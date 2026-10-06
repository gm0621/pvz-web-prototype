begin;

-- The shared match table must be able to store the season-one finale. Season-two
-- RPCs continue to enforce their own 1..10 boundary.
alter table public.sgz_matches drop constraint if exists sgz_matches_level_no_check;
alter table public.sgz_matches add constraint sgz_matches_level_no_check check (level_no between 1 and 11);

-- Season-one finale: allow the plants-only Qin boss after defense level 10.
create or replace function public.sgz_start_match(p_device_id text,p_level integer,p_faction text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare
 v_uid uuid:=auth.uid();v_row public.sgz_profiles%rowtype;v_id uuid;
 v_campaign jsonb;v_completed jsonb;v_defense_completed jsonb;v_highest integer:=0;v_defense_highest integer:=0;v_i integer;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED';end if;
 select * into v_row from public.sgz_profiles where user_id=v_uid for update;
 if not found or v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at is null or v_row.active_seen_at<=now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED';end if;
 if p_faction not in ('plants','zombies') or p_level<1 or p_level>10 and not (p_faction='plants' and p_level=11) then raise exception 'INVALID_MATCH';end if;
 v_campaign:=coalesce(v_row.profile->'campaignProgress',jsonb_build_object('plants',jsonb_build_object('highestLevel',coalesce((v_row.profile->>'highestLevel')::integer,0),'completedLevels',coalesce(v_row.profile->'completedLevels','{}'::jsonb)),'zombies',jsonb_build_object('highestLevel',0,'completedLevels','{}'::jsonb)));
 v_defense_completed:=coalesce(v_campaign#>'{plants,completedLevels}','{}'::jsonb);
 for v_i in 1..10 loop exit when coalesce((v_defense_completed->>v_i::text)::integer,0)<1;v_defense_highest:=v_i;end loop;
 if p_faction='zombies' and v_defense_highest<10 then raise exception 'FACTION_LOCKED';end if;
 if p_level=11 then
  if p_faction<>'plants' or coalesce((v_defense_completed->>'10')::integer,0)<1 then raise exception 'LEVEL_LOCKED';end if;
 else
  v_completed:=coalesce(v_campaign#>array[p_faction,'completedLevels'],'{}'::jsonb);
  for v_i in 1..10 loop exit when coalesce((v_completed->>v_i::text)::integer,0)<1;v_highest:=v_i;end loop;
  if coalesce((v_completed->>p_level::text)::integer,0)<1 and p_level<>least(10,v_highest+1) then raise exception 'LEVEL_LOCKED';end if;
 end if;
 update public.sgz_matches set finished_at=now(),won=false where user_id=v_uid and finished_at is null;
 insert into public.sgz_matches(user_id,device_id,level_no,faction,season_no) values(v_uid,p_device_id,p_level,p_faction,1) returning id into v_id;
 return v_id;
end $$;

create or replace function public.sgz_claim_level_reward(p_device_id text,p_match_id uuid,p_character_key text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare
 v_uid uuid:=auth.uid();v_row public.sgz_profiles%rowtype;v_match public.sgz_matches%rowtype;
 v_gold integer;v_xp integer;v_old_gold integer;v_profile jsonb;v_player_xp integer;v_player_level integer;v_need integer;v_char jsonb;
 v_campaign jsonb;v_side jsonb;v_completed jsonb;v_highest integer:=0;v_i integer;v_minimum_seconds integer;v_progress_key text;v_allowed text[];v_required integer;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED';end if;
 select * into v_row from public.sgz_profiles where user_id=v_uid for update;
 if not found or v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at is null or v_row.active_seen_at<=now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED';end if;
 select * into v_match from public.sgz_matches where id=p_match_id and user_id=v_uid for update;
 if not found then raise exception 'MATCH_NOT_FOUND';end if;
 if v_match.device_id is distinct from p_device_id then raise exception 'DEVICE_LOCKED';end if;
 if v_match.finished_at is not null then raise exception 'REWARD_ALREADY_CLAIMED';end if;
 if v_match.season_no=2 and (v_match.level_no<1 or v_match.level_no>10 or v_match.level_no>1 and coalesce((v_row.profile#>>array['season2Progress',v_match.faction,'completedLevels',(v_match.level_no-1)::text])::integer,0)<1) then raise exception 'LEVEL_LOCKED';end if;
 if v_match.season_no=1 and v_match.level_no=11 and (v_match.faction<>'plants' or coalesce((v_row.profile#>>'{campaignProgress,plants,completedLevels,10}')::integer,0)<1) then raise exception 'LEVEL_LOCKED';end if;
 v_minimum_seconds:=case when v_match.faction='zombies' then 8 else 30+v_match.level_no*6 end;
 if now()-v_match.started_at<make_interval(secs=>v_minimum_seconds) then raise exception 'MATCH_TOO_SHORT';end if;
 if v_match.season_no=2 then
  v_allowed:=case when v_match.faction='plants' then array['s2Tuntian','s2Crossbow','s2Shield','s2Halberd','s2Xiahou','s2DianWei','s2XuChu','s2ZhangLiao','s2XuHuang','s2GuoJia','s2SimaYi','s2CaoCao'] else array['s2Rat','s2Nail','s2Coffin','s2Cleaver','s2Smoke','s2Hook','s2Medic','s2Venom','s2Decoy','s2Hexer','s2Ram','s2Overseer'] end;
  if p_character_key is not null and not (p_character_key=any(v_allowed)) then raise exception 'INVALID_CHARACTER';end if;
  if p_character_key is not null then v_required:=array_position(v_allowed,p_character_key)-2;if v_required>0 and coalesce((v_row.profile#>>array['season2Progress',v_match.faction,'completedLevels',v_required::text])::integer,0)<1 then raise exception 'INVALID_CHARACTER';end if;end if;
 elsif p_character_key like 's2%' then raise exception 'INVALID_CHARACTER';end if;
 update public.sgz_matches set finished_at=now(),won=true where id=p_match_id;
 v_gold:=35+v_match.level_no*18;v_xp:=30+v_match.level_no*15;
 v_old_gold:=coalesce((v_row.profile->>'gold')::integer,0);v_player_xp:=coalesce((v_row.profile->>'xp')::integer,0)+v_xp;v_player_level:=coalesce((v_row.profile->>'level')::integer,1);
 loop v_need:=100+greatest(0,v_player_level-1)*60;exit when v_player_xp<v_need;v_player_xp:=v_player_xp-v_need;v_player_level:=v_player_level+1;end loop;
 v_profile:=public.sgz_seed_season2_profile(v_row.profile);
 v_profile:=jsonb_set(jsonb_set(jsonb_set(v_profile,'{gold}',to_jsonb(v_old_gold+v_gold),true),'{xp}',to_jsonb(v_player_xp),true),'{level}',to_jsonb(v_player_level),true);
 v_progress_key:=case when v_match.season_no=2 then 'season2Progress' else 'campaignProgress' end;
 v_campaign:=coalesce(v_profile->v_progress_key,jsonb_build_object('plants',jsonb_build_object('highestLevel',coalesce((v_profile->>'highestLevel')::integer,0),'completedLevels',coalesce(v_profile->'completedLevels','{}')),'zombies',jsonb_build_object('highestLevel',0,'completedLevels','{}'::jsonb)));
 v_side:=coalesce(v_campaign->v_match.faction,jsonb_build_object('highestLevel',0,'completedLevels','{}'::jsonb));
 v_completed:=jsonb_set(coalesce(v_side->'completedLevels','{}'),array[v_match.level_no::text],'1',true);
 for v_i in 1..10 loop exit when coalesce((v_completed->>v_i::text)::integer,0)<1;v_highest:=v_i;end loop;
 v_side:=jsonb_set(jsonb_set(v_side,'{completedLevels}',v_completed,true),'{highestLevel}',to_jsonb(v_highest),true);
 v_profile:=jsonb_set(v_profile,array[v_progress_key],jsonb_set(v_campaign,array[v_match.faction],v_side,true),true);
 if v_match.season_no=1 then
  v_profile:=jsonb_set(v_profile,'{highestLevel}',to_jsonb(greatest(coalesce((v_profile->>'highestLevel')::integer,0),least(10,v_match.level_no))),true);
  v_profile:=jsonb_set(v_profile,'{completedLevels}',coalesce(v_profile->'completedLevels','{}'),true);
  v_profile:=jsonb_set(v_profile,array['completedLevels',v_match.level_no::text],'1',true);
 end if;
 if p_character_key is not null and p_character_key~'^[a-zA-Z0-9_]+$' and v_profile#>array['characterLevels',v_match.faction,p_character_key] is not null then v_char:=v_profile#>array['characterLevels',v_match.faction,p_character_key];v_char:=jsonb_set(v_char,'{xp}',to_jsonb(coalesce((v_char->>'xp')::integer,0)+8+v_match.level_no*2),true);v_profile:=jsonb_set(v_profile,array['characterLevels',v_match.faction,p_character_key],v_char,true);end if;
 update public.sgz_profiles set profile=v_profile,save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
 insert into public.sgz_economy_transactions(user_id,action,delta_gold,balance_after,metadata) values(v_uid,'level_reward',v_gold,v_old_gold+v_gold,jsonb_build_object('match_id',p_match_id,'season',v_match.season_no,'level',v_match.level_no,'faction',v_match.faction,'server_timed_completion',true));
 return public.sgz_profile_response(v_uid);
end $$;

revoke all on function public.sgz_start_match(text,integer,text),public.sgz_claim_level_reward(text,uuid,text) from public,anon;
grant execute on function public.sgz_start_match(text,integer,text),public.sgz_claim_level_reward(text,uuid,text) to authenticated;
notify pgrst,'reload schema';
commit;
