-- Replace late fixed-budget medals with tactical deployment goals and remove
-- the defender-only relocation medal from attacker routes.
begin;

create or replace function public.sgz_route_challenge_ids(p_season integer,p_faction text,p_level integer)
returns text[] language plpgsql immutable set search_path=pg_catalog,public as $$
declare v_pool text[];v_size integer;v_result text[];
begin
 if p_level is null or p_level<1 or p_level>10 or p_season not in (1,2) or p_faction not in ('plants','zombies') then return array[]::text[];end if;
 v_pool:=case
  when p_season=1 and p_faction='plants' then array['no-hero','gate-health','resource-cap','no-relocation','protect-unit','no-enemy-leak','time-limit','melee-only']
  when p_season=1 and p_faction='zombies' then array['no-hero','time-limit','melee-only','resource-cap','no-relocation','protect-unit','no-enemy-leak']
  when p_season=2 and p_faction='plants' then array['no-enemy-leak','protect-unit','resource-cap','no-hero','gate-health','no-relocation','time-limit','melee-only']
  else array['time-limit','melee-only','no-hero','resource-cap','protect-unit','no-relocation','no-enemy-leak'] end;
 v_size:=cardinality(v_pool);
 v_result:=array[v_pool[mod(p_level-1,v_size)+1],v_pool[mod(p_level,v_size)+1],v_pool[mod(p_level+1,v_size)+1]];
 if p_level=9 then v_result:=array_replace(v_result,'resource-cap','formation-width');end if;
 if p_level=10 then v_result:=array_replace(v_result,'resource-cap','unit-variety');end if;
 if p_faction='zombies' then v_result:=array_replace(v_result,'no-relocation','multi-lane-assault');end if;
 return v_result;
end $$;

create or replace function public.sgz_challenge_telemetry_passes(p_id text,p_faction text,p_telemetry jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog,public as $$
declare v_outcome jsonb;
begin
 select value into v_outcome from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) with ordinality e(value,n)
 where value->>'type'='outcome' order by n desc limit 1;
 if jsonb_typeof(v_outcome->'win') is distinct from 'boolean' or v_outcome->>'win'<>'true' then return false;end if;
 if p_id='no-hero' then return not exists(select 1 from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='deploy' and e->>'side'=p_faction and coalesce((e->>'hero')::boolean,false));end if;
 if p_id='gate-health' then return coalesce((v_outcome->>'objectiveHealthPct')::numeric,0)>=0.5;end if;
 if p_id='resource-cap' then return coalesce((p_telemetry#>>array['totals','resources',p_faction,'spent'])::numeric,0)<=500;end if;
 if p_id='no-relocation' then return not exists(select 1 from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='relocation' and e->>'side'=p_faction);end if;
 if p_id='melee-only' then return not exists(select 1 from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='deploy' and e->>'side'=p_faction and coalesce((e->>'ranged')::boolean,false));end if;
 if p_id='time-limit' then return coalesce((v_outcome->>'elapsedMs')::numeric,999999999)<=180000;end if;
 if p_id='protect-unit' then return coalesce((v_outcome->>'protectedUnitAlive')::boolean,false);end if;
 if p_id='no-enemy-leak' then return not exists(select 1 from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='leak' and e->>'side' is distinct from p_faction);end if;
 if p_id='formation-width' then return (select count(distinct (e->>'row')::numeric) from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='deploy' and e->>'side'=p_faction and jsonb_typeof(e->'row')='number' and (e->>'row')::numeric>=0 and trunc((e->>'row')::numeric)=(e->>'row')::numeric)>=4;end if;
 if p_id='unit-variety' then return (select count(distinct e->>'unitType') from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='deploy' and e->>'side'=p_faction and jsonb_typeof(e->'unitType')='string' and e->>'unitType'<>'')>=4;end if;
 if p_id='multi-lane-assault' then return p_faction='zombies' and (select count(distinct (e->>'row')::numeric) from jsonb_array_elements(coalesce(p_telemetry->'events','[]'::jsonb)) e where e->>'type'='deploy' and e->>'side'=p_faction and jsonb_typeof(e->'row')='number' and (e->>'row')::numeric>=0 and trunc((e->>'row')::numeric)=(e->>'row')::numeric)>=3;end if;
 return false;
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end $$;

-- Preserve already-earned cloud medals while moving their keys to the new route goals.
-- If both keys exist, keep the newer-format value and remove only the legacy key.
do $$
declare v_old text;v_new text;
begin
 for v_old,v_new in
  select * from (values
   ('1:plants:9:resource-cap','1:plants:9:formation-width'),
   ('1:plants:10:resource-cap','1:plants:10:unit-variety'),
   ('1:zombies:9:resource-cap','1:zombies:9:formation-width'),
   ('1:zombies:10:resource-cap','1:zombies:10:unit-variety'),
   ('2:plants:9:resource-cap','2:plants:9:formation-width'),
   ('2:plants:10:resource-cap','2:plants:10:unit-variety'),
   ('2:zombies:9:resource-cap','2:zombies:9:formation-width'),
   ('2:zombies:10:resource-cap','2:zombies:10:unit-variety'),
   ('1:zombies:3:no-relocation','1:zombies:3:multi-lane-assault'),
   ('1:zombies:4:no-relocation','1:zombies:4:multi-lane-assault'),
   ('1:zombies:5:no-relocation','1:zombies:5:multi-lane-assault'),
   ('1:zombies:10:no-relocation','1:zombies:10:multi-lane-assault'),
   ('2:zombies:4:no-relocation','2:zombies:4:multi-lane-assault'),
   ('2:zombies:5:no-relocation','2:zombies:5:multi-lane-assault'),
   ('2:zombies:6:no-relocation','2:zombies:6:multi-lane-assault')
  ) as medal_map(old_id,new_id)
 loop
  update public.sgz_profiles
  set profile=jsonb_set(
   profile #- array['challenges','medals',v_old],
   array['challenges','medals',v_new],
   coalesce(profile#>array['challenges','medals',v_new],profile#>array['challenges','medals',v_old]),
   true
  ),save_version=save_version+1
  where profile#>array['challenges','medals',v_old] is not null;
 end loop;
end $$;

revoke all on function public.sgz_route_challenge_ids(integer,text,integer) from public,anon,authenticated;
revoke all on function public.sgz_challenge_telemetry_passes(text,text,jsonb) from public,anon,authenticated;

notify pgrst,'reload schema';
commit;
