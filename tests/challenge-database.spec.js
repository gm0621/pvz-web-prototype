const {test,expect}=require('@playwright/test');
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs');const path=require('node:path');
const migration=path.join(__dirname,'../supabase/migrations/202610070001_challenge_rewards.sql');

test('challenge reward RPC is atomic idempotent route-bound and profile-forgery resistant',async({},info)=>{
 test.skip(info.project.name!=='desktop','SQL runs once, independently of viewport');
 expect(fs.existsSync(migration)).toBe(true);
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table public.sgz_profiles(user_id uuid primary key references auth.users(id),game text not null default 'sg-zombie-defense',version integer not null default 1,profile jsonb not null default '{}',updated_at timestamptz default now());
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
   create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
   create function public.digest(bytea,text) returns bytea language sql immutable as $$select decode(md5(encode($1,'hex'))||md5($2||encode($1,'hex')),'hex')$$;`);
  const dir=path.dirname(migration);
  for(const name of fs.readdirSync(dir).filter(name=>name.endsWith('.sql')&&name<path.basename(migration)).sort())await db.exec(fs.readFileSync(path.join(dir,name),'utf8').replace('create extension if not exists pgcrypto;',''));
  const uid='10000000-0000-4000-8000-000000000061',profile={gold:500,xp:0,level:1,highestLevel:0,completedLevels:{},campaignProgress:{plants:{highestLevel:0,completedLevels:{}},zombies:{highestLevel:0,completedLevels:{}}},characterLevels:{plants:{peashooter:{level:1,xp:0}},zombies:{}},challenges:{version:1,medals:{forged:true},claims:{forged:true}}};
  await db.query('insert into auth.users values ($1)',[uid]);await db.query('insert into sgz_profiles(user_id,profile) values ($1,$2)',[uid,profile]);
  const sql=fs.readFileSync(migration,'utf8');await db.exec(sql);await db.exec(sql);
  expect((await db.query('select profile#>\'{challenges,medals}\' as medals from sgz_profiles where user_id=$1',[uid])).rows[0].medals).toEqual({});
  const injectedUid='10000000-0000-4000-8000-000000000062';await db.query('insert into auth.users values ($1)',[injectedUid]);await db.query('insert into sgz_profiles(user_id,profile) values ($1,$2)',[injectedUid,{challenges:{medals:{forged:true},claims:{forged:true}}}]);expect((await db.query('select profile#>\'{challenges}\' as challenges from sgz_profiles where user_id=$1',[injectedUid])).rows[0].challenges).toEqual({version:1,medals:{},claims:{}});
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.query("select sgz_claim_device('test-device','SQL fixture',false,null)");
  const read=async()=> (await db.query('select profile,save_version from sgz_profiles where user_id=$1',[uid])).rows[0];
  const start=async()=>{const id=(await db.query("select sgz_start_match('test-device',1,'plants') as id")).rows[0].id;await db.query("update sgz_matches set started_at=now()-interval '2 minutes' where id=$1",[id]);return id};
  const telemetry={version:1,season:1,faction:'plants',level:1,challengeIds:['no-hero'],totals:{resources:{plants:{spent:0}}},events:[{type:'outcome',win:true,elapsedMs:1000,objectiveHealthPct:1,protectedUnitAlive:false}]};
  const canonical=value=>JSON.stringify(value),digestFor=async text=>(await db.query("select encode(digest(convert_to($1,'UTF8'),'sha256'),'hex') d",[text])).rows[0].d;
  const claim=(match,character,ids,digest,text,payload)=>db.query('select sgz_claim_match_rewards($1,$2,$3,$4,$5,$6,$7)',['test-device',match,character,ids,digest,text,payload]);
  const telemetryCanonical=canonical(telemetry),digest=await digestFor(telemetryCanonical);
  const pools={'1:plants':['no-hero','gate-health','resource-cap','no-relocation','protect-unit','no-enemy-leak','melee-only','time-limit'],'1:zombies':['no-hero','time-limit','melee-only','resource-cap','no-relocation','protect-unit','no-enemy-leak'],'2:plants':['no-enemy-leak','protect-unit','resource-cap','no-hero','gate-health','no-relocation','time-limit','melee-only'],'2:zombies':['time-limit','melee-only','no-hero','resource-cap','protect-unit','no-relocation','no-enemy-leak']};
  for(const [key,pool] of Object.entries(pools)){const [season,faction]=key.split(':');for(let level=1;level<=10;level++){const expected=[0,1,2].map(n=>pool[(level-1+n)%pool.length]).sort(),actual=(await db.query('select sgz_route_challenge_ids($1,$2,$3) ids',[season,faction,level])).rows[0].ids.sort();expect(actual).toEqual(expected)}}
  let id=await start(),before=await read();
  await expect(claim(id,'peashooter',['no-hero'],'bad',telemetryCanonical,telemetry)).rejects.toThrow(/INVALID_TELEMETRY_DIGEST/);
  expect(await read()).toEqual(before);expect((await db.query('select finished_at from sgz_matches where id=$1',[id])).rows[0].finished_at).toBeNull();
  await expect(claim(id,'peashooter',['forged-challenge'],digest,telemetryCanonical,telemetry)).rejects.toThrow(/INVALID_CHALLENGE/);
  expect(await read()).toEqual(before);
  const failedTelemetry={...telemetry,events:[{type:'deploy',side:'plants',hero:true},{type:'outcome',win:true,elapsedMs:1000}]};
  const failedCanonical=canonical(failedTelemetry),failedDigest=await digestFor(failedCanonical);
  await expect(claim(id,'peashooter',['no-hero'],failedDigest,failedCanonical,failedTelemetry)).rejects.toThrow(/CHALLENGE_NOT_COMPLETED/);
  await expect(claim(id,'peashooter',['no-hero'],'b'.repeat(64),telemetryCanonical,telemetry)).rejects.toThrow(/TELEMETRY_DIGEST_MISMATCH/);
  const mutated={...telemetry,events:[...telemetry.events,{type:'relocation',side:'plants'}]},mutatedCanonical=canonical(mutated);
  await expect(claim(id,'peashooter',['no-hero'],digest,mutatedCanonical,mutated)).rejects.toThrow(/TELEMETRY_DIGEST_MISMATCH/);expect(await read()).toEqual(before);
  await claim(id,'peashooter',['no-hero'],digest,telemetryCanonical,telemetry);
  const won=await read(),medalKey='1:plants:1:no-hero';expect(won.profile.challenges.medals[medalKey].challengeId).toBe('no-hero');expect(won.profile.challenges.claims[id].telemetryDigest).toBe(digest);expect(won.profile.gold).toBe(553);
  const stable=structuredClone(won);await claim(id,'peashooter',['no-hero'],digest,telemetryCanonical,telemetry);expect(await read()).toEqual(stable);
  await expect(claim(id,'firepea',['no-hero'],digest,telemetryCanonical,telemetry)).rejects.toThrow(/CHALLENGE_REPLAY_MISMATCH/);
  const forged={...stable.profile,challenges:{version:1,medals:{forged:{challengeId:'forged'}},claims:{forged:true}}};
  await db.query("select sgz_save_profile('test-device',$1,$2)",[forged,stable.save_version]);
  const saved=await read();expect(saved.profile.challenges).toEqual(stable.profile.challenges);
  expect((await db.query("select has_function_privilege('anon','sgz_claim_match_rewards(text,uuid,text,text[],text,text,jsonb)','EXECUTE') as ok")).rows[0].ok).toBe(false);
 }finally{await db.close()}
});
