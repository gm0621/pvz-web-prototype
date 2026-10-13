const {test,expect}=require('@playwright/test');
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs');const path=require('node:path');
const migration=path.join(__dirname,'../supabase/migrations/202610130001_onboarding_progress.sql');

test('onboarding progress is a server-enforced monotonic union',async({},info)=>{
 test.skip(info.project.name!=='desktop','SQL runs once, independently of viewport');
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table public.sgz_profiles(user_id uuid primary key,game text not null default 'sg-zombie-defense',version integer not null default 1,profile jsonb not null default '{}',save_version bigint not null default 0,active_device_id text,active_seen_at timestamptz,updated_at timestamptz default now());
   create function public.sgz_seed_season2_profile(jsonb) returns jsonb language sql immutable as $$select $1$$;
   create function public.sgz_seed_challenge_profile(jsonb) returns jsonb language sql immutable as $$select $1$$;
   create function public.sgz_profile_response(uuid) returns jsonb language sql stable as $$select jsonb_build_object('profile',profile,'save_version',save_version,'updated_at',updated_at) from public.sgz_profiles where user_id=$1$$;`);
  const uid='10000000-0000-4000-8000-000000000071',initial={gold:9,onboarding:{storyRead:{'plants:1:opening':true},battleLessons:{firstDefense:true}}};
  await db.query("insert into sgz_profiles(user_id,profile,active_device_id,active_seen_at) values($1,$2,'device',now())",[uid,initial]);
  const sql=fs.readFileSync(migration,'utf8');await db.exec(sql);await db.exec(sql);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);
  const incoming={gold:999,onboarding:{storyRead:{'plants:2:opening':true,'invalid-key':true,'plants:3:opening':false},battleLessons:{removeUnit:true,'removeUnit:pending':true,bogus:true}}};
  await db.query("select sgz_save_profile('device',$1,0)",[incoming]);
  let row=(await db.query('select profile,save_version from sgz_profiles where user_id=$1',[uid])).rows[0];
  expect(row.save_version).toBe(1);expect(row.profile.gold).toBe(9);
  expect(row.profile.onboarding).toEqual({storyRead:{'plants:1:opening':true,'plants:2:opening':true},battleLessons:{firstDefense:true,removeUnit:true}});
  await db.query("select sgz_save_profile('device',$1,1)",[{music:true}]);
  row=(await db.query('select profile,save_version from sgz_profiles where user_id=$1',[uid])).rows[0];
  expect(row.profile.onboarding).toEqual({storyRead:{'plants:1:opening':true,'plants:2:opening':true},battleLessons:{firstDefense:true,removeUnit:true}});
  await expect(db.query("select sgz_save_profile('device',$1,0)",[{}])).rejects.toThrow(/VERSION_CONFLICT/);
  expect((await db.query("select has_function_privilege('anon','sgz_save_profile(text,jsonb,bigint)','EXECUTE') ok")).rows[0].ok).toBe(false);
  expect((await db.query("select has_function_privilege('authenticated','sgz_save_profile(text,jsonb,bigint)','EXECUTE') ok")).rows[0].ok).toBe(true);
  expect((await db.query("select has_function_privilege('authenticated','sgz_merge_onboarding(jsonb,jsonb)','EXECUTE') ok")).rows[0].ok).toBe(false);
 }finally{await db.close()}
});
