// Explicit production verification; creates one disposable confirmed account,
// never sends email, and deletes it in finally. Credentials stay in process memory.
const {execFileSync}=require('node:child_process');const {randomUUID}=require('node:crypto');
const assert=require('node:assert/strict');const {chromium}=require('@playwright/test');
const project='oastajgxjjbzjvkrtgve',base=`https://${project}.supabase.co`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 assert(process.argv.includes('--allow-live'),'Explicit --allow-live required');
 const text=execFileSync('npx',['--yes','supabase','projects','api-keys','--project-ref',project,'--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 const keys=JSON.parse(text.slice(text.indexOf('[')));const admin=keys.find(k=>k.name==='service_role')?.api_key,anon=keys.find(k=>k.name==='anon')?.api_key;
 assert(admin&&anon,'Required API key roles unavailable');
 const req=async(path,key,token,method='GET',body)=>{const r=await fetch(base+path,{method,headers:{apikey:key,Authorization:`Bearer ${token||key}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}};
 let uid,browser;
 try{
  const password=randomUUID()+randomUUID(),email=`hermes-release-${randomUUID()}@example.invalid`;
  const created=await req('/auth/v1/admin/users',admin,admin,'POST',{email,password,email_confirm:true,user_metadata:{name:'Release verification'}});
  assert.equal(created.status,200,'Disposable account creation failed');uid=created.data.id;assert(uid);
  const login=await req('/auth/v1/token?grant_type=password',anon,null,'POST',{email,password});assert.equal(login.status,200,'Fixture login failed');
  const session=login.data,device=randomUUID();
  const rpc=async(name,args,code)=>{const r=await req('/rest/v1/rpc/'+name,anon,session.access_token,'POST',args);if(code){assert(r.status>=400,`${name} should reject`);assert(String(r.data.message).includes(code),`${name} incorrect rejection`)}else assert.equal(r.status,200,`${name} failed (${r.status}, ${r.data.code||'unknown'})`);return r.data};
  await rpc('sgz_claim_device',{p_device_id:device,p_device_name:'Disposable release probe',p_takeover:false,p_initial_profile:{name:'Release verification',gold:0,xp:0,level:1}});
  const args={p_device_id:device,p_level:1,p_faction:'plants'};
  await rpc('sgz_start_season2_match',{...args,p_level:2},'LEVEL_LOCKED');
  await rpc('sgz_start_season2_match',{...args,p_device_id:'invalid'},'DEVICE_LOCKED');
  const defense=await rpc('sgz_start_season2_match',args);
  const claim={p_device_id:device,p_match_id:defense,p_character_key:'s2Crossbow'};
  await rpc('sgz_claim_level_reward',claim,'MATCH_TOO_SHORT');
  await sleep(37000);
  let result=await rpc('sgz_claim_level_reward',claim);assert.equal(result.profile.season2Progress.plants.highestLevel,1);assert.equal(result.profile.highestLevel||0,0);assert.equal(result.profile.campaignProgress?.plants?.highestLevel||0,0);
  await rpc('sgz_claim_level_reward',claim,'REWARD_ALREADY_CLAIMED');
  const originalProgress=structuredClone(result.profile.season2Progress),originalGold=result.profile.gold;
  const forged={...result.profile,gold:999999,season2Progress:{plants:{highestLevel:10},zombies:{highestLevel:10}}};
  result=await rpc('sgz_save_profile',{p_device_id:device,p_profile:forged,p_expected_version:result.save_version});assert.equal(result.profile.gold,originalGold);assert.deepEqual(result.profile.season2Progress,originalProgress);
  await rpc('sgz_start_match',{...args,p_faction:'zombies'},'FACTION_LOCKED');
  const attack=await rpc('sgz_start_season2_match',{...args,p_faction:'zombies'});await sleep(9000);
  result=await rpc('sgz_claim_level_reward',{p_device_id:device,p_match_id:attack,p_character_key:'s2Rat'});assert.equal(result.profile.season2Progress.zombies.highestLevel,1);assert.equal(result.profile.highestLevel||0,0);
  for(const faction of ['plants','zombies']){
   await rpc('sgz_start_season2_match',{...args,p_faction:faction,p_level:3},'LEVEL_LOCKED');
   const match2=await rpc('sgz_start_season2_match',{...args,p_faction:faction,p_level:2});
   await sleep(faction==='plants'?43000:9000);
   await rpc('sgz_claim_level_reward',{p_device_id:device,p_match_id:match2,p_character_key:faction==='plants'?'s2Halberd':'s2Cleaver'},'INVALID_CHARACTER');
   result=await rpc('sgz_claim_level_reward',{p_device_id:device,p_match_id:match2,p_character_key:faction==='plants'?'s2Shield':'s2Coffin'});
   assert.equal(result.profile.season2Progress[faction].highestLevel,2);assert.equal(result.profile.highestLevel||0,0);
   await rpc('sgz_claim_level_reward',{p_device_id:device,p_match_id:match2,p_character_key:null},'REWARD_ALREADY_CLAIMED');
  }
  const beforeSave=structuredClone(result.profile.season2Progress);
  result=await rpc('sgz_save_profile',{p_device_id:device,p_profile:{...result.profile,season2Progress:{}},p_expected_version:result.save_version});assert.deepEqual(result.profile.season2Progress,beforeSave);
  const denied=await req('/rest/v1/rpc/sgz_start_season2_match',anon,null,'POST',args);assert(denied.status>=400);assert.notEqual(denied.data.code,'PGRST202','RPC must resolve');
  await rpc('sgz_release_device',{p_device_id:device});console.log('HOSTED_RPC_PASS: two modes, future-stage/device/timing/duplicate/forged-save guards, first-season isolation, anonymous denial');
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1365,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.GAME_URL||'http://127.0.0.1:8091/');await page.waitForFunction(()=>typeof initSupabaseClient==='function'&&!!initSupabaseClient());
  await page.evaluate(async s=>{const {error}=await initSupabaseClient().auth.setSession({access_token:s.access_token,refresh_token:s.refresh_token});if(error)throw Error('Fixture browser session failed')},session);
  await page.waitForFunction(()=>currentUser&&cloudLockOwned&&playerProfile.season2Progress?.zombies?.highestLevel===2);
  for(const faction of ['plants','zombies']){
   await page.evaluate(f=>{backToHome();chooseFaction(f,2)},faction);await page.locator('[data-jump-level="2"]').click();await page.locator('#storySkip').click();await page.waitForFunction(()=>state?.season===2&&state.level===2&&!!cloudMatchId);
   await page.evaluate(()=>pauseAndSaveBattle('verification'));await page.reload();await page.waitForFunction(()=>state?.season===2&&state.paused&&document.querySelector('#game.active'));
   assert.equal(await page.evaluate(()=>state.faction),faction);assert.equal(await page.locator('#cards .card').count(),4);
   await page.locator('#cards img').evaluateAll(ims=>Promise.all(ims.map(im=>im.decode())));
   await page.screenshot({path:`/tmp/season2-hosted-${faction}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);console.log('AUTHENTICATED_BROWSER_PASS: real login, cloud progress hydration, both rewarded rosters, live match creation, paused reload');
 }finally{
  if(browser)await browser.close();
  if(uid){const removed=await req('/auth/v1/admin/users/'+uid,admin,admin,'DELETE');assert(removed.status<300,`FIXTURE_CLEANUP_FAILED id=${uid}`);const check=await req('/auth/v1/admin/users/'+uid,admin,admin);assert.equal(check.status,404,'Fixture must be absent');console.log('FIXTURE_CLEANED: confirmed account removed')}
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
