-- Keep the authoritative challenge registry aligned with the playable browser pool.
-- The previous Season 1 defender order paired protect-unit (a ranged unit on
-- level 5) with melee-only, which made that medal set impossible to complete.
begin;

create or replace function public.sgz_route_challenge_ids(p_season integer,p_faction text,p_level integer)
returns text[] language plpgsql immutable set search_path=pg_catalog,public as $$
declare v_pool text[];v_size integer;
begin
 if p_level is null or p_level<1 or p_level>10 or p_season not in (1,2) or p_faction not in ('plants','zombies') then return array[]::text[];end if;
 v_pool:=case
  when p_season=1 and p_faction='plants' then array['no-hero','gate-health','resource-cap','no-relocation','protect-unit','no-enemy-leak','time-limit','melee-only']
  when p_season=1 and p_faction='zombies' then array['no-hero','time-limit','melee-only','resource-cap','no-relocation','protect-unit','no-enemy-leak']
  when p_season=2 and p_faction='plants' then array['no-enemy-leak','protect-unit','resource-cap','no-hero','gate-health','no-relocation','time-limit','melee-only']
  else array['time-limit','melee-only','no-hero','resource-cap','protect-unit','no-relocation','no-enemy-leak'] end;
 v_size:=cardinality(v_pool);
 return array[v_pool[mod(p_level-1,v_size)+1],v_pool[mod(p_level,v_size)+1],v_pool[mod(p_level+1,v_size)+1]];
end $$;

commit;
