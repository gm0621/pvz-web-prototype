-- Supabase installs pgcrypto in the extensions schema. The challenge reward RPC
-- uses digest() while pinning its SECURITY DEFINER search path, so production
-- must include that trusted schema explicitly.
begin;

alter function public.sgz_claim_match_rewards(text,uuid,text,text[],text,text,jsonb)
set search_path=pg_catalog,extensions,public;

notify pgrst,'reload schema';
commit;
