// Derive additive replacements from the deployed first-stage definitions.
const fs=require('node:fs'),assert=require('node:assert/strict');
const old=fs.readFileSync('supabase/migrations/202609090001_season2_first_stage.sql','utf8');
let sql='-- Second-season stage two: preserve all existing progress/economy.\nbegin;\n'+old.slice(old.indexOf('create or replace function public.sgz_seed_season2_profile'));
const replacements=[
 ["array['s2Tuntian','s2Crossbow','s2Shield']","array['s2Tuntian','s2Crossbow','s2Shield','s2Halberd']"],
 ["array['s2Rat','s2Nail','s2Coffin']","array['s2Rat','s2Nail','s2Coffin','s2Cleaver']"],
 ["if p_level is distinct from 1 then raise exception 'LEVEL_LOCKED';end if;","if p_level is null or p_level not in (1,2) then raise exception 'LEVEL_LOCKED';end if;\n if p_level=2 and coalesce((v_row.profile#>>array['season2Progress',p_faction,'completedLevels','1'])::integer,0)<1 then raise exception 'LEVEL_LOCKED';end if;"],
 ["if v_match.season_no=2 and v_match.level_no<>1 then raise exception 'LEVEL_LOCKED';end if;","if v_match.season_no=2 and (v_match.level_no not in (1,2) or v_match.level_no=2 and coalesce((v_row.profile#>>array['season2Progress',v_match.faction,'completedLevels','1'])::integer,0)<1) then raise exception 'LEVEL_LOCKED';end if;"],
 [" elsif p_character_key like 's2%'", " elsif p_character_key like 's2%'"]
];
for(const [from,to] of replacements.slice(0,4)){assert(sql.includes(from),from);sql=sql.replaceAll(from,to)}
const branch="elsif p_character_key like 's2%'";
assert(sql.includes(branch));sql=sql.replace(branch," if p_character_key in ('s2Halberd','s2Cleaver') and coalesce((v_row.profile#>>array['season2Progress',v_match.faction,'completedLevels','2'])::integer,0)<1 then raise exception 'INVALID_CHARACTER';end if;\n "+branch);
fs.writeFileSync('supabase/migrations/202609090002_season2_second_stage.sql',sql);console.log('Generated additive stage-two migration.');
