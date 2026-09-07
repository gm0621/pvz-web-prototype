-- Seed the undead Qin emperor for cloud profiles created before the character existed.
-- Idempotent: existing qinEmperor level/xp data is preserved unchanged.

with normalized as (
  select
    user_id,
    jsonb_set(
      profile,
      '{characterLevels}',
      coalesce(profile -> 'characterLevels', '{}'::jsonb),
      true
    ) as profile_with_levels
  from public.sgz_profiles
  where profile #> '{characterLevels,zombies,qinEmperor}' is null
), with_zombie_roster as (
  select
    user_id,
    jsonb_set(
      profile_with_levels,
      '{characterLevels,zombies}',
      coalesce(profile_with_levels #> '{characterLevels,zombies}', '{}'::jsonb),
      true
    ) as normalized_profile
  from normalized
)
update public.sgz_profiles as p
set profile=jsonb_set(
      wz.normalized_profile,
      '{characterLevels,zombies}',
      coalesce(wz.normalized_profile #> '{characterLevels,zombies}', '{}'::jsonb)
        || jsonb_build_object(
          'qinEmperor',
          coalesce(wz.normalized_profile #> '{characterLevels,zombies,qinEmperor}', '{"level":1,"xp":0}'::jsonb)
        ),
      true
    ),
    save_version=save_version+1,
    updated_at=now()
from with_zombie_roster as wz
where p.user_id=wz.user_id;
