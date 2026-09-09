-- Read-only post-deployment checks; no player data is printed.
select to_regprocedure('public.sgz_start_season2_match(text,integer,text)') is not null as season2_start_ready;
select count(*) filter(where season_no not in (1,2)) as invalid_seasons,
 count(*) filter(where season_no=2 and level_no<>1) as illegal_future_stage_matches
from public.sgz_matches;
select count(*) as profiles_missing_seed from public.sgz_profiles
where profile->'season2Progress' is null or profile#>'{characterLevels,plants,s2Shield}' is null or profile#>'{characterLevels,zombies,s2Coffin}' is null;
select position('season2Progress' in pg_get_functiondef('public.sgz_save_profile(text,jsonb,bigint)'::regprocedure))>0 as generic_save_protected,
 position('season_no=1' in pg_get_functiondef('public.sgz_claim_level_reward(text,uuid,text)'::regprocedure))>0 as legacy_progress_isolated,
 not has_function_privilege('anon','public.sgz_start_season2_match(text,integer,text)','EXECUTE') as anonymous_start_denied;
