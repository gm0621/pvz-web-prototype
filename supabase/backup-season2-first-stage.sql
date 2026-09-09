-- Read-only scoped release backup. Output includes player data: save locally
-- with mode 0600 outside the repository; never publish its results.
select jsonb_build_object(
 'captured_at',now(),
 'profiles',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from public.sgz_profiles p),
 'matches',(select coalesce(jsonb_agg(to_jsonb(m)),'[]') from public.sgz_matches m),
 'functions',(select jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid))) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('sgz_save_profile','sgz_claim_level_reward'))
) as backup;
