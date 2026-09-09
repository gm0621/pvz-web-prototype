const {test,expect}=require('@playwright/test');
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs');const path=require('node:path');
const migration=path.join(__dirname,'../supabase/migrations/202609090002_season2_second_stage.sql');
test('PostgreSQL season-two migration is idempotent and enforces isolated authoritative rewards',async({},info)=>{
 test.skip(info.project.name!=='desktop','SQL runs once, independently of viewport');
 expect(fs.existsSync(migration)).toBe(true);
 const db=new PGlite();
 try{
  // Local adapters for Supabase-owned auth/storage schemas; game SQL runs unchanged.
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table public.sgz_profiles(user_id uuid primary key references auth.users(id),game text not null default 'sg-zombie-defense',version integer not null default 1,profile jsonb not null default '{}',updated_at timestamptz default now());
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
   create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  for(const name of fs.readdirSync(path.dirname(migration)).filter(n=>n.endsWith('.sql')&&n<path.basename(migration)).sort()){
   // gen_random_uuid() is built into PostgreSQL; PGlite does not need pgcrypto.
   await db.exec(fs.readFileSync(path.join(path.dirname(migration),name),'utf8').replace('create extension if not exists pgcrypto;',''));
  }
  const uid='10000000-0000-4000-8000-000000000001';
  const first={plants:{highestLevel:1,completedLevels:{1:1}},zombies:{highestLevel:0,completedLevels:{}}};
  await db.query('insert into auth.users values ($1)',[uid]);
  await db.query('insert into sgz_profiles(user_id,profile) values ($1,$2)',[uid,{gold:500,xp:0,level:1,highestLevel:1,completedLevels:{1:1},campaignProgress:first,characterLevels:{plants:{peashooter:{level:3,xp:21}},zombies:{}}}]);
  const sql=fs.readFileSync(migration,'utf8');await db.exec(sql);
  const read=async()=> (await db.query('select profile,save_version from sgz_profiles where user_id=$1',[uid])).rows[0];
  const seeded=await read();await db.exec(sql);expect(await read()).toEqual(seeded);
  expect(seeded.profile.characterLevels.plants.peashooter).toEqual({level:3,xp:21});expect(seeded.profile.characterLevels.zombies.s2Coffin).toEqual({level:1,xp:0});
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);
  await db.query("select sgz_claim_device('test-device','SQL fixture',false,null)");
  await expect(db.query("select sgz_start_season2_match('test-device',2,'plants')")).rejects.toThrow(/LEVEL_LOCKED/);
  await expect(db.query("select sgz_start_season2_match('wrong-device',1,'plants')")).rejects.toThrow(/DEVICE_LOCKED/);
  const start=async side=>(await db.query("select sgz_start_season2_match('test-device',1,$1) as id",[side])).rows[0].id;
  const match=await start('plants');
  await expect(db.query("select sgz_claim_level_reward('test-device',$1,'s2Crossbow')",[match])).rejects.toThrow(/MATCH_TOO_SHORT/);
  await db.query("update sgz_matches set started_at=now()-interval '1 minute' where id=$1",[match]);
  await expect(db.query("select sgz_claim_level_reward('test-device',$1,'peashooter')",[match])).rejects.toThrow(/INVALID_CHARACTER/);
  await db.query("select sgz_claim_level_reward('test-device',$1,'s2Crossbow')",[match]);
  await expect(db.query("select sgz_claim_level_reward('test-device',$1,'s2Crossbow')",[match])).rejects.toThrow(/REWARD_ALREADY_CLAIMED/);
  const won=await read();expect(won.profile.campaignProgress).toEqual(first);expect(won.profile.highestLevel).toBe(1);expect(won.profile.completedLevels).toEqual({1:1});
  expect(won.profile.gold).toBe(553);expect(won.profile.season2Progress.plants.highestLevel).toBe(1);expect(won.profile.season2Progress.zombies.highestLevel).toBe(0);expect(won.profile.characterLevels.plants.s2Crossbow.xp).toBe(10);
  await db.query("select sgz_save_profile('test-device',$1,$2)",[{...won.profile,gold:99999,season2Progress:{zombies:{highestLevel:10,completedLevels:{1:1,2:1}}}},won.save_version]);
  expect((await read()).profile.season2Progress).toEqual(won.profile.season2Progress);expect((await read()).profile.gold).toBe(553);
  const attack=await start('zombies');await db.query("update sgz_matches set started_at=now()-interval '9 seconds' where id=$1",[attack]);await db.query("select sgz_claim_level_reward('test-device',$1,'s2Rat')",[attack]);
  const both=await read();expect(both.profile.season2Progress.zombies.highestLevel).toBe(1);expect(both.profile.campaignProgress).toEqual(first);
  for(const side of ['plants','zombies']){
   await expect(db.query("select sgz_start_season2_match('test-device',3,$1)",[side])).rejects.toThrow(/LEVEL_LOCKED/);
   const match2=(await db.query("select sgz_start_season2_match('test-device',2,$1) as id",[side])).rows[0].id;
   await db.query("update sgz_matches set started_at=now()-interval '1 minute' where id=$1",[match2]);
   const reward=side==='plants'?'s2Halberd':'s2Cleaver';
   await expect(db.query("select sgz_claim_level_reward('test-device',$1,$2)",[match2,reward])).rejects.toThrow(/INVALID_CHARACTER/);
   await db.query("select sgz_claim_level_reward('test-device',$1,$2)",[match2,side==='plants'?'s2Shield':'s2Coffin']);
   expect((await read()).profile.season2Progress[side].highestLevel).toBe(2);
   await expect(db.query("select sgz_claim_level_reward('test-device',$1,$2)",[match2,reward])).rejects.toThrow(/REWARD_ALREADY_CLAIMED/);
   const replay=await start(side);await db.query("update sgz_matches set started_at=now()-interval '1 minute' where id=$1",[replay]);await db.query("select sgz_claim_level_reward('test-device',$1,$2)",[replay,reward]);
  }
  const latest=await read();await db.exec(sql);expect(await read()).toEqual(latest);expect(latest.profile.campaignProgress).toEqual(first);
  await expect(db.query("select sgz_start_match('test-device',1,'zombies')")).rejects.toThrow(/FACTION_LOCKED/);
  expect((await db.query("select has_function_privilege('anon','sgz_start_season2_match(text,integer,text)','EXECUTE') as ok")).rows[0].ok).toBe(false);
 }finally{await db.close()}
});
