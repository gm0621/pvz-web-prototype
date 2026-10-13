begin;

create or replace function public.sgz_merge_onboarding(p_current jsonb,p_incoming jsonb)
returns jsonb language sql immutable set search_path=pg_catalog,public as $$
with story_entries as (
 select key,value from jsonb_each(case when jsonb_typeof(p_current->'storyRead')='object' then p_current->'storyRead' else '{}'::jsonb end)
 union all
 select key,value from jsonb_each(case when jsonb_typeof(p_incoming->'storyRead')='object' then p_incoming->'storyRead' else '{}'::jsonb end)
), lesson_entries as (
 select key,value from jsonb_each(case when jsonb_typeof(p_current->'battleLessons')='object' then p_current->'battleLessons' else '{}'::jsonb end)
 union all
 select key,value from jsonb_each(case when jsonb_typeof(p_incoming->'battleLessons')='object' then p_incoming->'battleLessons' else '{}'::jsonb end)
), story as (
 select coalesce(jsonb_object_agg(key,'true'::jsonb),'{}'::jsonb) value from (select distinct key from story_entries where value='true'::jsonb and key~'^(s2:)?(plants|zombies):(1[01]|[1-9]):(opening|victory|defeat)$') valid
), lessons as (
 select coalesce(jsonb_object_agg(key,'true'::jsonb),'{}'::jsonb) value from (select distinct key from lesson_entries where value='true'::jsonb and key in ('firstDefense','removeUnit','relocateUnit','strategy')) valid
)
select jsonb_build_object('storyRead',story.value,'battleLessons',lessons.value) from story,lessons
$$;

create or replace function public.sgz_save_profile(p_device_id text,p_profile jsonb,p_expected_version bigint)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_uid uuid:=auth.uid();v_row public.sgz_profiles%rowtype;v_safe jsonb;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_profile is null or jsonb_typeof(p_profile)<>'object' or pg_column_size(p_profile)>524288 then raise exception 'INVALID_PROFILE';end if;
 select * into v_row from public.sgz_profiles where user_id=v_uid for update;
 if not found or v_row.active_device_id is distinct from p_device_id or v_row.active_seen_at is null or v_row.active_seen_at<=now()-interval '120 seconds' then raise exception 'DEVICE_LOCKED';end if;
 if v_row.save_version<>coalesce(p_expected_version,-1) then raise exception 'VERSION_CONFLICT';end if;
 v_safe:=p_profile - 'gold' - 'xp' - 'level' - 'characterLevels' - 'inventory' - 'highestLevel' - 'completedLevels' - 'campaignProgress' - 'season2Progress' - 'challenges' - 'onboarding' - 'syncLock' - 'updatedAt';
 v_safe:=v_safe||jsonb_build_object(
  'gold',coalesce(v_row.profile->'gold','0'),'xp',coalesce(v_row.profile->'xp','0'),'level',coalesce(v_row.profile->'level','1'),
  'characterLevels',coalesce(v_row.profile->'characterLevels','{"plants":{},"zombies":{}}'),
  'inventory',coalesce(v_row.profile->'inventory','{"equipment":{},"skills":{},"skins":{},"equipped":{"plants":{},"zombies":{}},"activeSkins":{}}'),
  'highestLevel',coalesce(v_row.profile->'highestLevel','0'),'completedLevels',coalesce(v_row.profile->'completedLevels','{}'),
  'campaignProgress',coalesce(v_row.profile->'campaignProgress','{"plants":{"highestLevel":0,"completedLevels":{}},"zombies":{"highestLevel":0,"completedLevels":{}}}'),
  'season2Progress',coalesce(v_row.profile->'season2Progress','{"plants":{"highestLevel":0,"completedLevels":{}},"zombies":{"highestLevel":0,"completedLevels":{}}}'),
  'challenges',coalesce(v_row.profile->'challenges','{"version":1,"medals":{},"claims":{}}'),
  'onboarding',public.sgz_merge_onboarding(v_row.profile->'onboarding',p_profile->'onboarding'),'updatedAt',to_jsonb(now()));
 update public.sgz_profiles set profile=public.sgz_seed_challenge_profile(public.sgz_seed_season2_profile(v_safe)),version=greatest(version,1),save_version=save_version+1,active_seen_at=now(),updated_at=now() where user_id=v_uid;
 return public.sgz_profile_response(v_uid);
end $$;

revoke all on function public.sgz_merge_onboarding(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.sgz_save_profile(text,jsonb,bigint) from public,anon;
grant execute on function public.sgz_save_profile(text,jsonb,bigint) to authenticated;
notify pgrst,'reload schema';
commit;
