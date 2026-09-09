-- Operational rollback: restore the previous frontend first, then disable new
-- season-two matches. Keep the additive columns and authoritative save guards.
-- Do NOT restore old claim RPCs while season-two matches exist: old code ignores seasons.
begin;
revoke execute on function public.sgz_start_season2_match(text,integer,text) from authenticated,anon,public;
update public.sgz_matches set finished_at=now(),won=false where season_no=2 and finished_at is null;
notify pgrst,'reload schema';
commit;
-- This deliberately preserves earned rewards, season-one progress and all player rows.
-- Re-enable by reapplying the idempotent 202609090001 migration after resolving the issue.
