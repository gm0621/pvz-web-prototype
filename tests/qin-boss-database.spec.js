const {test,expect}=require('@playwright/test');
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs');const path=require('node:path');
const migration=path.join(__dirname,'../supabase/migrations/202610060001_qin_final_boss.sql');

test('Qin finale migration securely unlocks and rewards plants level eleven',async({},info)=>{
 test.skip(info.project.name!=='desktop','SQL runs once, independently of viewport');
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table public.sgz_profiles(user_id uuid primary key references auth.users(id),game text not null default 'sg-zombie-defense',version integer not null default 1,profile jsonb not null default '{}',updated_at timestamptz default now());
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
   create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  const dir=path.dirname(migration);
  for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.sql')&&n<path.basename(migration)).sort())await db.exec(fs.readFileSync(path.join(dir,name),'utf8').replace('create extension if not exists pgcrypto;',''));
  const uid='10000000-0000-4000-8000-000000000011',completed9=Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,1]));
  const profile={gold:500,xp:0,level:1,highestLevel:9,completedLevels:completed9,campaignProgress:{plants:{highestLevel:9,completedLevels:completed9},zombies:{highestLevel:0,completedLevels:{}}},characterLevels:{plants:{peashooter:{level:1,xp:0}},zombies:{}}};
  await db.query('insert into auth.users values ($1)',[uid]);await db.query('insert into sgz_profiles(user_id,profile) values ($1,$2)',[uid,profile]);
  const sql=fs.readFileSync(migration,'utf8');await db.exec(sql);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.query("select sgz_claim_device('test-device','SQL fixture',false,null)");
  await expect(db.query("select sgz_start_match('test-device',11,'plants')")).rejects.toThrow(/LEVEL_LOCKED/);
  await expect(db.query("select sgz_start_match('test-device',11,'zombies')")).rejects.toThrow(/INVALID_MATCH/);
  const completed10={...completed9,10:1};profile.highestLevel=10;profile.completedLevels=completed10;profile.campaignProgress.plants={highestLevel:10,completedLevels:completed10};
  await db.query('update sgz_profiles set profile=$2 where user_id=$1',[uid,profile]);
  const id=(await db.query("select sgz_start_match('test-device',11,'plants') as id")).rows[0].id;
  await expect(db.query("select sgz_claim_level_reward('test-device',$1,'peashooter')",[id])).rejects.toThrow(/MATCH_TOO_SHORT/);
  await db.query("update sgz_matches set started_at=now()-interval '2 minutes' where id=$1",[id]);
  await db.query("select sgz_claim_level_reward('test-device',$1,'peashooter')",[id]);
  const won=(await db.query('select profile from sgz_profiles where user_id=$1',[uid])).rows[0].profile;
  expect(won.campaignProgress.plants.highestLevel).toBe(10);expect(won.campaignProgress.plants.completedLevels['11']).toBe(1);expect(won.highestLevel).toBe(10);expect(won.completedLevels['11']).toBe(1);expect(won.gold).toBe(733);
  await db.exec(sql);expect((await db.query("select has_function_privilege('anon','sgz_start_match(text,integer,text)','EXECUTE') as ok")).rows[0].ok).toBe(false);
 }finally{await db.close()}
});
