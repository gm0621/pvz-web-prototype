const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('challenge registry gives every mainline route three immutable definitions',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const api={templates:typeof CHALLENGE_TEMPLATES,routes:typeof challengesForRoute,create:typeof createChallengeBattleState};
  if(Object.values(api).some(type=>type==='undefined'))return {api,routes:[]};
  const routes=[];
  for(const season of [1,2])for(const faction of ['plants','zombies'])for(let level=1;level<=10;level++){
   const challenges=challengesForRoute(season,faction,level);
   routes.push({season,faction,level,ids:challenges.map(item=>item.id),medalIds:challenges.map(item=>item.medalId),protectTypes:challenges.filter(item=>item.id==='protect-unit').map(item=>item.protectedUnitType),frozen:Object.isFrozen(challenges)&&challenges.every(Object.isFrozen)});
  }
  return {api,templateIds:Object.keys(CHALLENGE_TEMPLATES),templatesFrozen:Object.isFrozen(CHALLENGE_TEMPLATES)&&Object.values(CHALLENGE_TEMPLATES).every(Object.isFrozen),routes};
 });
 expect(result.api).toEqual({templates:'object',routes:'function',create:'function'});
 expect(result.templateIds).toEqual(['no-hero','gate-health','resource-cap','no-relocation','melee-only','time-limit','protect-unit','no-enemy-leak']);
 expect(result.templatesFrozen).toBe(true);
 expect(result.routes).toHaveLength(40);
 for(const route of result.routes){
  expect(route.ids).toHaveLength(3);
  expect(new Set(route.ids).size).toBe(3);
  expect(new Set(route.medalIds).size).toBe(3);
  if(route.faction==='zombies')expect(route.ids).not.toContain('gate-health');
  expect(route.protectTypes.every(Boolean)).toBe(true);
  expect(route.frozen).toBe(true);
 }
});

test('legacy profiles and battles migrate challenge state without losing progress or inventory',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const legacy=normalizeProfile({gold:77,campaignProgress:{plants:{highestLevel:2,completedLevels:{1:1,2:1}}},inventory:{skins:{legacyFrame:1}}});
  selectedLevel=1;start('plants');clearInterval(timer);
  const challenge=state.gameplay.challenge;
  return {profile:legacy,battleChallenge:challenge,json:challenge===undefined?null:JSON.parse(JSON.stringify(challenge))};
 });
 expect(result.profile.gold).toBe(77);
 expect(result.profile.campaignProgress.plants.highestLevel).toBe(2);
 expect(result.profile.inventory.skins.legacyFrame).toBe(1);
 expect(result.profile.challenges).toEqual({version:1,medals:{},claims:{}});
 expect(result.battleChallenge).toEqual({version:1,activeIds:[],fairMode:false,protectedEntityId:null});
 expect(result.battleChallenge).toEqual(result.json);
});

test('fair challenge mode removes permanent power only from challenge battles',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({characterLevels:{plants:{firepea:{level:5,xp:0}}}});completeCampaignLevel('plants',1,1);completeCampaignLevel('plants',2,1);completeCampaignLevel('plants',3,1);selectedLevel=4;start('plants');clearInterval(timer);
  const base=baseUnit('plants','firepea'),normal=resolveBattleUnit('plants','firepea',state);
  start('plants',{challengeIds:['no-relocation']});clearInterval(timer);
  const fair=resolveBattleUnit('plants','firepea',state),fairProc=rollSuperSkill('firepea',()=>.3);state.lastHuman.firepea=0;state.time=effectiveUnit('plants','firepea').cooldown;const fairCooldown={cooling:isCooling('firepea'),reason:deploymentReadyReason('firepea')};
  start('plants');clearInterval(timer);
  const replay=resolveBattleUnit('plants','firepea',state);state.lastHuman.firepea=0;state.time=effectiveUnit('plants','firepea').cooldown;const normalCooldown={cooling:isCooling('firepea'),reason:deploymentReadyReason('firepea')};
  return {baseHp:base.hp,normalHp:normal.unit.hp,fairHp:fair.unit.hp,replayHp:replay.unit.hp,fairLayers:fair.layers.slice(0,3).map(layer=>layer.unit.hp),fairProc,fairCooldown,normalCooldown};
 });
 expect(result.normalHp).toBeGreaterThan(result.baseHp);
 expect(result.fairHp).toBe(result.baseHp);
 expect(result.fairLayers).toEqual([result.baseHp,result.baseHp,result.baseHp]);
 expect(result.fairProc).toBe(false);
 expect(result.fairCooldown.cooling).toBe(true);expect(result.fairCooldown.reason).toContain('冷卻');
 expect(result.normalCooldown).toEqual({cooling:false,reason:''});
 expect(result.replayHp).toBe(result.normalHp);
});

test('challenge evaluator derives all verdicts from telemetry and fails closed without outcome',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const api=typeof evaluateChallengeVerdict;
  if(api!=='function')return {api};
  const base=createBattleTelemetry(),outcome={id:1,type:'outcome',time:90000,win:true,elapsedMs:90000,objectiveHealthPct:.75,protectedUnitAlive:true};
  base.events.push(outcome);base.totals.resources.plants.spent=400;
  const verdict=id=>evaluateChallengeVerdict({...CHALLENGE_TEMPLATES[id],season:1,faction:'plants',level:1},base);
  const passing=Object.fromEntries(CHALLENGE_TEMPLATE_IDS.map(id=>[id,verdict(id)]));
  const violated=JSON.parse(JSON.stringify(base));
  violated.events.unshift(
   {id:2,type:'deploy',time:100,side:'plants',unitType:'firepea',hero:true,ranged:true},
   {id:3,type:'relocation',time:200,side:'plants'},
   {id:4,type:'leak',time:300,side:'zombies'}
  );
  violated.totals.resources.plants.spent=999;
  violated.events[violated.events.length-1]={...outcome,win:true,elapsedMs:999999,objectiveHealthPct:.1,protectedUnitAlive:false};
  const failing=Object.fromEntries(CHALLENGE_TEMPLATE_IDS.map(id=>[id,evaluateChallengeVerdict({...CHALLENGE_TEMPLATES[id],season:1,faction:'plants',level:1},violated)]));
  const missingOutcome=evaluateChallengeVerdict({...CHALLENGE_TEMPLATES['no-hero'],season:1,faction:'plants',level:1},createBattleTelemetry());
  return {api,passing,failing,missingOutcome};
 });
 expect(result.api).toBe('function');
 for(const verdict of Object.values(result.passing))expect(verdict).toEqual(expect.objectContaining({passed:true,reason:'completed'}));
 for(const verdict of Object.values(result.failing))expect(verdict.passed).toBe(false);
 expect(result.missingOutcome).toEqual(expect.objectContaining({passed:false,reason:'missing-outcome'}));
});

test('protect-unit binds the first designated entity and rejects a replacement',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});completeCampaignLevel('plants',1,1);completeCampaignLevel('plants',2,1);completeCampaignLevel('plants',3,1);selectedLevel=4;start('plants',{challengeIds:['protect-unit']});clearInterval(timer);
  const type=activeChallengeDefinitions(state)[0].protectedUnitType;state.resource=9999;deploySelected(type,0,0);
  const boundId=state.gameplay.challenge.protectedEntityId;state.plants=state.plants.filter(unit=>unit.id!==boundId);state.time+=activeUnit('plants',type).cooldown;deploySelected(type,1,0);
  const replacementId=state.plants.find(unit=>unit.type===type)?.id;recordChallengeOutcome(true,state);
  const definition=activeChallengeDefinitions(state)[0];return {boundId,replacementId,storedId:state.gameplay.challenge.protectedEntityId,verdict:evaluateChallengeVerdict(definition,state.gameplay.telemetry)};
 });
 expect(result.boundId).toBeTruthy();expect(result.replacementId).toBeTruthy();expect(result.replacementId).not.toBe(result.boundId);expect(result.storedId).toBe(result.boundId);expect(result.verdict.passed).toBe(false);
});

test('legacy serialized gameplay normalizes an inactive challenge and preserves telemetry',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>normalizeGameplayState({version:1,telemetry:{nextEventId:2,events:[{id:1,type:'wave',time:10,wave:1}],totals:{},bySource:{},byTarget:{}},report:{},telegraphs:{},orders:{},stageRule:{}},{season:1,faction:'plants',level:1}));
 expect(result.challenge).toEqual({version:1,activeIds:[],fairMode:false,protectedEntityId:null});expect(result.telemetry.events).toHaveLength(1);expect(result.telemetry.events[0].type).toBe('wave');
});

test('production actions emit challenge deployment relocation leak and outcome events',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  completeCampaignLevel('plants',1,1);selectedLevel=2;start('plants',{challengeIds:['no-hero']});clearInterval(timer);state.resource=1000;
  deploySelected('firepea',0,0);
  state.actionMode='relocate';state.movingPlantId=state.plants[0].id;relocatePlantAt(1,0);
  state.zombies=[{id:'leaker',type:'normal',r:2,c:.1,hp:100,maxHp:100}];triggerMower(2);
  await end(false,'測試結束','測試');
  const events=state.gameplay.telemetry.events.filter(event=>['deploy','relocation','leak','outcome'].includes(event.type));
  return {events,unsafe:events.some(event=>Object.values(event).some(value=>value instanceof Node))};
 });
 expect(result.unsafe).toBe(false);
 expect(result.events.map(event=>event.type)).toEqual(['deploy','relocation','leak','outcome']);
 expect(result.events[0]).toEqual(expect.objectContaining({side:'plants',unitType:'firepea',hero:true,ranged:true}));
 expect(result.events[1]).toEqual(expect.objectContaining({side:'plants',unitType:'firepea',fromRow:0,toRow:1}));
 expect(result.events[2]).toEqual(expect.objectContaining({side:'zombies',lane:2}));
 expect(result.events[3]).toEqual(expect.objectContaining({win:false,elapsedMs:expect.any(Number)}));
});

test('guest challenge medals persist once while defeat replay and cloud failure add nothing',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  const api=typeof claimGuestChallengeResults;
  if(api!=='function')return {api};
  currentUser=null;playerProfile=normalizeProfile({});
  const play=async(win,id='no-hero')=>{selectedLevel=1;start('plants',{challengeIds:[id]});clearInterval(timer);return end(win,win?'勝利':'失敗','測試')};
  await play(true);
  const first=structuredClone(playerProfile.challenges),stored=JSON.parse(localStorage.getItem(PROFILE_KEY)).challenges;
  await play(true);
  const replay=structuredClone(playerProfile.challenges);
  await play(false,'gate-health');
  const defeated=structuredClone(playerProfile.challenges);
  currentUser={id:'cloud-user'};claimCloudMatchReward=async()=>false;
  await play(true,'resource-cap');
  return {api,first,stored,replay,defeated,cloudFailed:playerProfile.challenges};
 });
 expect(result.api).toBe('function');
 expect(Object.keys(result.first.medals)).toHaveLength(1);
 expect(result.stored).toEqual(result.first);
 expect(result.replay).toEqual(result.first);
 expect(result.defeated).toEqual(result.first);
 expect(result.cloudFailed).toEqual(result.first);
});

test('cloud challenge claim uses one atomic RPC with telemetry digest and never grants optimistically',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  currentUser={id:'cloud-user'};cloudLockOwned=true;startCloudMatch=async()=>{};playerProfile=normalizeProfile({});selectedLevel=1;start('plants',{challengeIds:['no-hero']});clearInterval(timer);
  recordChallengeOutcome(true,state);cloudMatchId='00000000-0000-4000-8000-000000000099';
  const calls=[],serverProfile=normalizeProfile({challenges:{medals:{'1:plants:1:no-hero':{earnedAt:'server'}},claims:{}}});
  supabaseClient={rpc:async(name,params)=>{calls.push({name,params});return {data:{profile:serverProfile,save_version:4,updated_at:'2026-10-07T00:00:00Z'},error:null}}};
  const success=await claimCloudMatchReward(true,[]),afterSuccess=structuredClone(playerProfile.challenges),clearedAfterSuccess=cloudMatchId;
  selectedLevel=1;start('plants',{challengeIds:['no-hero']});clearInterval(timer);recordChallengeOutcome(true,state);cloudMatchId='00000000-0000-4000-8000-000000000100';playerProfile=normalizeProfile({});pullCloudProfile=async()=>true;
  supabaseClient={rpc:async(name,params)=>{calls.push({name,params});return {data:null,error:{message:'CHALLENGE_REJECTED'}}}};
  const failed=await claimCloudMatchReward(true,[]),afterFailure=structuredClone(playerProfile.challenges);
  selectedLevel=1;start('plants');clearInterval(timer);recordChallengeOutcome(true,state);cloudMatchId='00000000-0000-4000-8000-000000000101';
  supabaseClient={rpc:async(name,params)=>{calls.push({name,params});return {data:{profile:normalizeProfile({}),save_version:5},error:null}}};
  const normal=await claimCloudMatchReward(true,[]);
  return {success,failed,normal,calls,afterSuccess,afterFailure,clearedAfterSuccess};
 });
 expect(result.success).toBe(true);expect(result.failed).toBe(false);expect(result.normal).toBe(true);
 expect(result.calls[0].name).toBe('sgz_claim_match_rewards');
 expect(result.calls[0].params.p_challenge_ids).toEqual(['no-hero']);
 expect(result.calls[0].params.p_telemetry_digest).toMatch(/^[a-f0-9]{64}$/);
 expect(result.calls[0].params.p_telemetry).toEqual(expect.objectContaining({version:1,season:1,faction:'plants',level:1}));
 expect(JSON.parse(result.calls[0].params.p_telemetry_canonical)).toEqual(result.calls[0].params.p_telemetry);
 expect(result.clearedAfterSuccess).toBeNull();
 expect(result.afterSuccess.medals['1:plants:1:no-hero']).toEqual({earnedAt:'server'});
 expect(result.afterFailure.medals).toEqual({});
 expect(result.calls[1].name).toBe('sgz_claim_match_rewards');
 expect(result.calls[2].name).toBe('sgz_claim_level_reward');
});
