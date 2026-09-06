-- Attackers can legitimately break through quickly. Keep the longer defense
-- anti-cheat timing while allowing an attack victory after eight seconds.
create or replace function public.sgz_claim_level_reward(p_device_id text,p_match_id uuid,p_character_key text default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_uid uuid:=auth.uid();
  v_row public.sgz_profiles%rowtype;
  v_match public.sgz_matches%rowtype;
  v_gold integer;
  v_xp integer;
  v_old_gold integer;
  v_profile jsonb;
  v_player_xp integer;
  v_player_level integer;
  v_need integer;
  v_char jsonb;
  v_campaign jsonb;
  v_side jsonb;
  v_completed jsonb;
  v_highest integer:=0;
  v_i integer;
  v_minimum_seconds integer;
begin
  select * into v_row from public.sgz_profiles where user_id=v_uid for update;
  if v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at <= now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED'; end if;
  select * into v_match from public.sgz_matches where id=p_match_id and user_id=v_uid for update;
  if not found then raise exception 'MATCH_NOT_FOUND'; end if;
  if v_match.finished_at is not null then raise exception 'REWARD_ALREADY_CLAIMED'; end if;

  v_minimum_seconds:=case when v_match.faction='zombies' then 8 else 30+v_match.level_no*6 end;
  if now()-v_match.started_at < make_interval(secs=>v_minimum_seconds) then raise exception 'MATCH_TOO_SHORT'; end if;

  update public.sgz_matches set finished_at=now(),won=true where id=p_match_id;
  v_gold:=35+v_match.level_no*18;
  v_xp:=30+v_match.level_no*15;
  v_old_gold:=coalesce((v_row.profile->>'gold')::integer,0);
  v_player_xp:=coalesce((v_row.profile->>'xp')::integer,0)+v_xp;
  v_player_level:=coalesce((v_row.profile->>'level')::integer,1);
  loop
    v_need:=100+greatest(0,v_player_level-1)*60;
    exit when v_player_xp<v_need;
    v_player_xp:=v_player_xp-v_need;
    v_player_level:=v_player_level+1;
  end loop;
  v_profile:=jsonb_set(jsonb_set(jsonb_set(v_row.profile,'{gold}',to_jsonb(v_old_gold+v_gold),true),'{xp}',to_jsonb(v_player_xp),true),'{level}',to_jsonb(v_player_level),true);

  v_campaign:=coalesce(v_profile->'campaignProgress',jsonb_build_object(
    'plants',jsonb_build_object('highestLevel',coalesce((v_profile->>'highestLevel')::integer,0),'completedLevels',coalesce(v_profile->'completedLevels','{}'::jsonb)),
    'zombies',jsonb_build_object('highestLevel',0,'completedLevels','{}'::jsonb)
  ));
  v_side:=coalesce(v_campaign->v_match.faction,jsonb_build_object('highestLevel',0,'completedLevels','{}'::jsonb));
  v_completed:=jsonb_set(coalesce(v_side->'completedLevels','{}'::jsonb),array[v_match.level_no::text],'1'::jsonb,true);
  for v_i in 1..10 loop
    exit when coalesce((v_completed->>v_i::text)::integer,0)<1;
    v_highest:=v_i;
  end loop;
  v_side:=jsonb_set(jsonb_set(v_side,'{completedLevels}',v_completed,true),'{highestLevel}',to_jsonb(v_highest),true);
  v_campaign:=jsonb_set(v_campaign,array[v_match.faction],v_side,true);
  v_profile:=jsonb_set(v_profile,'{campaignProgress}',v_campaign,true);

  -- Retain old aggregate fields for rollback compatibility.
  v_profile:=jsonb_set(v_profile,'{highestLevel}',to_jsonb(greatest(coalesce((v_profile->>'highestLevel')::integer,0),v_match.level_no)),true);
  v_profile:=jsonb_set(v_profile,'{completedLevels}',coalesce(v_profile->'completedLevels','{}'::jsonb),true);
  v_profile:=jsonb_set(v_profile,array['completedLevels',v_match.level_no::text],'1'::jsonb,true);
  if p_character_key is not null and p_character_key~'^[a-zA-Z0-9_]+$' and v_profile #> array['characterLevels',v_match.faction,p_character_key] is not null then
    v_char:=v_profile #> array['characterLevels',v_match.faction,p_character_key];
    v_char:=jsonb_set(v_char,'{xp}',to_jsonb(coalesce((v_char->>'xp')::integer,0)+8+v_match.level_no*2),true);
    v_profile:=jsonb_set(v_profile,array['characterLevels',v_match.faction,p_character_key],v_char,true);
  end if;
  update public.sgz_profiles set profile=v_profile,save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
  insert into public.sgz_economy_transactions(user_id,action,delta_gold,balance_after,metadata) values(v_uid,'level_reward',v_gold,v_old_gold+v_gold,jsonb_build_object('match_id',p_match_id,'level',v_match.level_no,'faction',v_match.faction,'server_timed_completion',true));
  return public.sgz_profile_response(v_uid);
end $$;

revoke all on function public.sgz_claim_level_reward(text,uuid,text) from public, anon;
grant execute on function public.sgz_claim_level_reward(text,uuid,text) to authenticated;
