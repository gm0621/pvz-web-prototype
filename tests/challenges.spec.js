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

test('challenge cosmetic milestones derive only from valid unique medals at 15 30 60 and 90',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const validIds=Object.values(CHALLENGE_ROUTE_DEFINITIONS).flat().map(item=>item.medalId),profileFor=count=>normalizeProfile({challenges:{medals:Object.fromEntries(validIds.slice(0,count).map(id=>[id,{earnedAt:'2026-10-07T00:00:00.000Z'}]))}}),snapshots={};
  for(const count of [14,15,29,30,59,60,89,90]){const profile=profileFor(count);snapshots[count]={count:challengeMedalCount(profile),slots:challengeMilestoneRewards(profile).map(reward=>reward.slot)}}
  const forged=profileFor(14);forged.challenges.medals['forged:medal']=1;forged.challenges.medals['1:plants:1:not-real']=1;forged.challenges.medals[validIds[14]]=0;forged.challenges.medals[validIds[15]]=null;forged.challenges.medals[validIds[16]]=false;
  const before=JSON.stringify(forged),forgedCount=challengeMedalCount(forged),after=JSON.stringify(forged),legacy=normalizeProfile({settings:{}}),disabled=normalizeProfile({settings:{challengeCosmeticsEnabled:false}});
  return {thresholds:CHALLENGE_MILESTONE_REWARDS.map(reward=>reward.threshold),slots:CHALLENGE_MILESTONE_REWARDS.map(reward=>reward.slot),frozen:Object.isFrozen(CHALLENGE_MILESTONE_REWARDS)&&CHALLENGE_MILESTONE_REWARDS.every(Object.isFrozen),hasBattleEffects:CHALLENGE_MILESTONE_REWARDS.some(reward=>Object.keys(reward).some(key=>/effect|damage|hp|cooldown|rate|cost/i.test(key))),snapshots,forgedCount,unchanged:before===after,legacyEnabled:legacy.settings.challengeCosmeticsEnabled,disabledEnabled:disabled.settings.challengeCosmeticsEnabled};
 });
 expect(result.thresholds).toEqual([15,30,60,90]);
 expect(result.slots).toEqual(['frame','banner','fxColor','title']);
 expect(result.frozen).toBe(true);expect(result.hasBattleEffects).toBe(false);
 expect(result.snapshots).toEqual({14:{count:14,slots:[]},15:{count:15,slots:['frame']},29:{count:29,slots:['frame']},30:{count:30,slots:['frame','banner']},59:{count:59,slots:['frame','banner']},60:{count:60,slots:['frame','banner','fxColor']},89:{count:89,slots:['frame','banner','fxColor']},90:{count:90,slots:['frame','banner','fxColor','title']}});
 expect(result.forgedCount).toBe(14);expect(result.unchanged).toBe(true);expect(result.legacyEnabled).toBe(true);expect(result.disabledEnabled).toBe(false);
});

test('milestone cosmetics apply progressively and disabling removes every cosmetic class and node',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const ids=Object.values(CHALLENGE_ROUTE_DEFINITIONS).flat().map(item=>item.medalId),snapshots={};
  for(const count of [15,30,60,90]){
   playerProfile=normalizeProfile({name:'里程碑玩家',challenges:{medals:Object.fromEntries(ids.slice(0,count).map(id=>[id,1]))}});applyChallengeMilestoneCosmetics();applyChallengeMilestoneCosmetics();
   snapshots[count]={classes:[...document.body.classList].filter(name=>name.startsWith('challenge-cosmetic-')).sort(),banners:document.querySelectorAll('#challengeMilestoneBanner').length,titles:document.querySelectorAll('#challengeMilestoneTitle').length,titleText:$('challengeMilestoneTitle')?.textContent||''};
  }
  playerProfile.settings.challengeCosmeticsEnabled=false;applyChallengeMilestoneCosmetics();
  const disabled={classes:[...document.body.classList].filter(name=>name.startsWith('challenge-cosmetic-')),banners:document.querySelectorAll('#challengeMilestoneBanner').length,titles:document.querySelectorAll('#challengeMilestoneTitle').length,battleNodes:$('game').querySelectorAll('[data-challenge-cosmetic]').length,resultNodes:$('modal').querySelectorAll('[data-challenge-cosmetic]').length};
  return {snapshots,disabled};
 });
 expect(result.snapshots[15]).toEqual({classes:['challenge-cosmetic-frame-bronze'],banners:0,titles:0,titleText:''});
 expect(result.snapshots[30]).toEqual({classes:['challenge-cosmetic-banner-vanguard','challenge-cosmetic-frame-bronze'],banners:1,titles:0,titleText:''});
 expect(result.snapshots[60]).toEqual({classes:['challenge-cosmetic-banner-vanguard','challenge-cosmetic-frame-bronze','challenge-cosmetic-fx-gold'],banners:1,titles:0,titleText:''});
 expect(result.snapshots[90].classes).toEqual(['challenge-cosmetic-banner-vanguard','challenge-cosmetic-frame-bronze','challenge-cosmetic-fx-gold','challenge-cosmetic-title-peerless']);expect(result.snapshots[90].banners).toBe(1);expect(result.snapshots[90].titles).toBe(1);expect(result.snapshots[90].titleText).toContain('百戰無雙');
 expect(result.disabled).toEqual({classes:[],banners:0,titles:0,battleNodes:0,resultNodes:0});
});

test('milestone cosmetics never alter battle unit resolution',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const ids=Object.values(CHALLENGE_ROUTE_DEFINITIONS).flat().map(item=>item.medalId);playerProfile=normalizeProfile({characterLevels:{plants:{firepea:{level:5,xp:0}}},inventory:{equipment:{greenDragonArmor:1},equipped:{plants:{firepea:'greenDragonArmor'}}},challenges:{medals:Object.fromEntries(ids.slice(0,90).map(id=>[id,1]))}});
  applyChallengeMilestoneCosmetics();const enabled=JSON.parse(JSON.stringify(permanentUnitLayers('plants','firepea')));playerProfile.settings.challengeCosmeticsEnabled=false;applyChallengeMilestoneCosmetics();const disabled=JSON.parse(JSON.stringify(permanentUnitLayers('plants','firepea')));selectedLevel=1;start('plants');clearInterval(timer);const before={plants:state.plants.length,zombies:state.zombies.length,cards:$('cards').children.length,entities:$('board').querySelectorAll('.entity').length};applyChallengeMilestoneCosmetics();const after={plants:state.plants.length,zombies:state.zombies.length,cards:$('cards').children.length,entities:$('board').querySelectorAll('.entity').length,cosmeticNodes:$('board').querySelectorAll('[data-challenge-cosmetic]').length};return {enabled,disabled,before,after};
 });
 expect(result.enabled).toEqual(result.disabled);expect(result.after).toEqual({...result.before,cosmeticNodes:0});
});

test('milestone panel shows four tiers and its toggle persists without changing entitlements',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const ids=Object.values(CHALLENGE_ROUTE_DEFINITIONS).flat().map(item=>item.medalId);playerProfile=normalizeProfile({challenges:{medals:Object.fromEntries(ids.slice(0,30).map(id=>[id,1]))}});showShop('skin');renderShop();renderShop();
  const before={panels:document.querySelectorAll('#challengeMilestonePanel').length,tiers:document.querySelectorAll('#challengeMilestonePanel [data-milestone-threshold]').length,count:$('challengeMilestonePanel')?.dataset.medalCount,text:$('challengeMilestonePanel')?.textContent||'',pressed:$('challengeCosmeticsToggle')?.getAttribute('aria-pressed')};
  toggleChallengeMilestoneCosmetics();const stored=JSON.parse(localStorage.getItem(PROFILE_KEY));const after={enabled:playerProfile.settings.challengeCosmeticsEnabled,stored:stored.settings.challengeCosmeticsEnabled,classes:[...document.body.classList].filter(name=>name.startsWith('challenge-cosmetic-')),pressed:$('challengeCosmeticsToggle')?.getAttribute('aria-pressed'),count:challengeMedalCount()};
  toggleChallengeMilestoneCosmetics();return {before,after,reenabled:playerProfile.settings.challengeCosmeticsEnabled};
 });
 expect(result.before.panels).toBe(1);expect(result.before.tiers).toBe(4);expect(result.before.count).toBe('30');expect(result.before.text).toContain('30 / 120');expect(result.before.text).toContain('百戰銅框');expect(result.before.text).toContain('破陣戰旗');expect(result.before.pressed).toBe('true');
 expect(result.after).toEqual({enabled:false,stored:false,classes:[],pressed:'false',count:30});expect(result.reenabled).toBe(true);
});

test('milestone panel is visible and operable on desktop portrait and short landscape',async({page})=>{
 await open(page);
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>{const ids=Object.values(CHALLENGE_ROUTE_DEFINITIONS).flat().map(item=>item.medalId);playerProfile=normalizeProfile({challenges:{medals:Object.fromEntries(ids.slice(0,90).map(id=>[id,1]))}});applyChallengeMilestoneCosmetics();showShop('skin')});
  const metrics=await page.locator('#challengeMilestonePanel').evaluate(panel=>{const rect=panel.getBoundingClientRect(),button=panel.querySelector('#challengeCosmeticsToggle').getBoundingClientRect(),account=document.querySelector('#accountCornerBtn'),accountRect=account.getBoundingClientRect(),title=document.querySelector('#challengeMilestoneTitle').getBoundingClientRect();return {left:rect.left,right:rect.right,overflow:panel.scrollWidth-panel.clientWidth,buttonHeight:button.height,visible:getComputedStyle(panel).display!=='none',accountVisible:accountRect.width>0&&accountRect.height>0,accountOverflow:account.scrollWidth-account.clientWidth,titleOffset:title.top-accountRect.top,titleInside:title.bottom<=accountRect.bottom+1}});
  expect(metrics.visible).toBe(true);expect(metrics.left).toBeGreaterThanOrEqual(0);expect(metrics.right).toBeLessThanOrEqual(viewport.width);expect(metrics.overflow).toBeLessThanOrEqual(1);expect(metrics.buttonHeight).toBeGreaterThanOrEqual(44);expect(metrics.accountOverflow).toBeLessThanOrEqual(1);if(metrics.accountVisible){expect(metrics.titleOffset).toBeGreaterThanOrEqual(20);expect(metrics.titleInside).toBe(true)}
  await page.locator('#challengeCosmeticsToggle').click();await expect(page.locator('#challengeCosmeticsToggle')).toHaveAttribute('aria-pressed','false');expect(await page.locator('body').evaluate(body=>[...body.classList].some(name=>name.startsWith('challenge-cosmetic-')))).toBe(false);
 }
});

test('milestone entitlement and disabled state survive guest export and import',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const ids=Object.values(CHALLENGE_ROUTE_DEFINITIONS).flat().map(item=>item.medalId);currentUser=null;playerProfile=normalizeProfile({name:'搬家玩家',settings:{challengeCosmeticsEnabled:false},challenges:{medals:Object.fromEntries(ids.slice(0,60).map(id=>[id,1]))}});const exported=savePayloadText();playerProfile=normalizeProfile({});applyImportedProfile(JSON.parse(exported));return {name:playerProfile.name,count:challengeMedalCount(),slots:challengeMilestoneRewards().map(reward=>reward.slot),enabled:playerProfile.settings.challengeCosmeticsEnabled,classes:[...document.body.classList].filter(name=>name.startsWith('challenge-cosmetic-'))};
 });
 expect(result).toEqual({name:'搬家玩家',count:60,slots:['frame','banner','fxColor'],enabled:false,classes:[]});
});

test('cloud profile is authoritative for milestone cosmetics and signed-in import cannot forge medals',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const ids=Object.values(CHALLENGE_ROUTE_DEFINITIONS).flat().map(item=>item.medalId),medals=count=>Object.fromEntries(ids.slice(0,count).map(id=>[id,1]));currentUser={id:'cloud-user',email:'cloud@example.com'};cloudSaveVersion=3;playerProfile=normalizeProfile({name:'本機',challenges:{medals:medals(90)}});applyChallengeMilestoneCosmetics();
  applyCloudResult({save_version:4,profile:{name:'雲端15',challenges:{medals:medals(15)}},updated_at:'2026-10-07T00:00:00.000Z'});const lower={name:playerProfile.name,count:challengeMedalCount(),classes:[...document.body.classList].filter(name=>name.startsWith('challenge-cosmetic-')).sort(),titles:document.querySelectorAll('#challengeMilestoneTitle').length};
  applyCloudResult({save_version:3,profile:{name:'過期90',challenges:{medals:medals(90)}},updated_at:'2026-10-06T00:00:00.000Z'});const stale={name:playerProfile.name,count:challengeMedalCount()};
  applyImportedProfile({profile:{name:'匯入名稱',challenges:{medals:medals(90)}}});const imported={name:playerProfile.name,count:challengeMedalCount(),classes:[...document.body.classList].filter(name=>name.startsWith('challenge-cosmetic-')).sort()};
  applyCloudResult({save_version:5,profile:{name:'雲端30',challenges:{medals:medals(30)}},updated_at:'2026-10-08T00:00:00.000Z'});const upgraded={name:playerProfile.name,count:challengeMedalCount(),classes:[...document.body.classList].filter(name=>name.startsWith('challenge-cosmetic-')).sort(),banners:document.querySelectorAll('#challengeMilestoneBanner').length};return {lower,stale,imported,upgraded};
 });
 expect(result.lower).toEqual({name:'雲端15',count:15,classes:['challenge-cosmetic-frame-bronze'],titles:0});expect(result.stale).toEqual({name:'雲端15',count:15});
 expect(result.imported).toEqual({name:'匯入名稱',count:15,classes:['challenge-cosmetic-frame-bronze']});expect(result.upgraded).toEqual({name:'雲端30',count:30,classes:['challenge-cosmetic-banner-vanguard','challenge-cosmetic-frame-bronze'],banners:1});
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

test('real stale cloud claim cannot overwrite a newer battle profile or match token',async({page})=>{
 await open(page);const result=await page.evaluate(async()=>{
  currentUser={id:'cloud-user'};cloudLockOwned=true;startCloudMatch=async()=>{};playerProfile=normalizeProfile({gold:10});selectedLevel=1;start('plants',{challengeIds:['no-hero']});clearInterval(timer);recordChallengeOutcome(true,state);cloudMatchId='00000000-0000-4000-8000-000000000201';
  let resolveRpc;supabaseClient={rpc:()=>new Promise(resolve=>{resolveRpc=resolve})};const oldBattle=state,pending=end(true,'舊勝利','fixture');while(!resolveRpc)await new Promise(resolve=>setTimeout(resolve,0));
  selectedLevel=1;start('plants');clearInterval(timer);const newerBattle=state;playerProfile.gold=123;cloudMatchId='00000000-0000-4000-8000-000000000202';resolveRpc({data:{profile:normalizeProfile({gold:777}),save_version:9},error:null});const returned=await pending;
  return {returned,sameNewBattle:state===newerBattle,oldOver:oldBattle.over,newOver:state.over,gold:playerProfile.gold,matchId:cloudMatchId,modalShown:$('modal').classList.contains('show')};
 });
 expect(result).toEqual({returned:false,sameNewBattle:true,oldOver:true,newOver:false,gold:123,matchId:'00000000-0000-4000-8000-000000000202',modalShown:false});
});

test('old MATCH_TOO_SHORT countdown cannot rewrite a newer result modal',async({page})=>{
 await open(page);const result=await page.evaluate(async()=>{
  currentUser={id:'cloud-user'};cloudLockOwned=true;startCloudMatch=async()=>{};playerProfile=normalizeProfile({});selectedLevel=1;start('plants');clearInterval(timer);recordChallengeOutcome(true,state);cloudMatchId='00000000-0000-4000-8000-000000000203';cloudMatchMinimumMs=()=>0;
  let calls=0;supabaseClient={rpc:async()=>++calls===1?({data:null,error:{message:'MATCH_TOO_SHORT'}}):({data:{profile:normalizeProfile({gold:1}),save_version:2},error:null})};const pending=end(true,'舊勝利','fixture');await new Promise(resolve=>setTimeout(resolve,40));
  selectedLevel=1;start('plants');clearInterval(timer);state.over=true;$('modalTitle').textContent='新戰局結果';$('modalText').textContent='新內容';showResultModal();await new Promise(resolve=>setTimeout(resolve,320));const during={title:$('modalTitle').textContent,text:$('modalText').textContent};hideResultModal();const returned=await pending;
  return {...during,returned,calls};
 });
 expect(result).toEqual({title:'新戰局結果',text:'新內容',returned:false,calls:1});
});

test('level cards show route-scoped medal counts and accessible challenge selectors in both seasons',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({challenges:{medals:{'1:plants:1:no-hero':{earnedAt:'now'},'2:zombies:1:no-hero':{earnedAt:'now'}},claims:{}}});
  currentSeason=1;currentFaction='plants';buildLevelCards();
  const card=[...document.querySelectorAll('#levelGrid .level-card')][0],locked=[...document.querySelectorAll('#levelGrid .level-card')][1];
  const first={count:card.querySelector('.challenge-medal-count')?.textContent,options:[...card.querySelectorAll('.challenge-option')].map(row=>({text:row.textContent.trim(),name:row.querySelector('input')?.getAttribute('aria-label'),disabled:row.querySelector('input')?.disabled}))};
  const lockedState=[...locked.querySelectorAll('.challenge-option input')].map(input=>input.disabled);
  currentSeason=2;currentFaction='zombies';buildSeason2LevelCards();
  const second=[...document.querySelectorAll('#levelGrid .level-card')][0];
  return {first,lockedState,second:{count:second.querySelector('.challenge-medal-count')?.textContent,options:second.querySelectorAll('.challenge-option').length}};
 });
 expect(result.first.count).toContain('1/3');expect(result.first.options).toHaveLength(3);expect(result.first.options[0].name).toBeTruthy();expect(result.first.options.some(option=>option.text.includes('已取得'))).toBe(true);
 expect(result.lockedState).toEqual([true,true,true]);expect(result.second).toEqual({count:expect.stringContaining('1/3'),options:3});
});

test('every unlocked stage offers easy medium and hard with easy selected by default',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});
  const inspect=()=>[...document.querySelectorAll('#levelGrid .level-card')].slice(0,2).map(card=>({
   labels:[...card.querySelectorAll('.difficulty-option')].map(option=>option.textContent.trim()),
   values:[...card.querySelectorAll('.difficulty-option input')].map(input=>input.value),
   checked:card.querySelector('.difficulty-option input:checked')?.value||null,
   disabled:[...card.querySelectorAll('.difficulty-option input')].map(input=>input.disabled),
   noHero:{checked:card.querySelector('.challenge-option input[value="no-hero"]')?.checked??null,disabled:card.querySelector('.challenge-option input[value="no-hero"]')?.disabled??null}
  }));
  currentSeason=1;currentFaction='plants';buildLevelCards();const season1=inspect();
  currentSeason=2;currentFaction='zombies';buildSeason2LevelCards();const season2=inspect();
  return {season1,season2};
 });
 for(const route of [result.season1,result.season2]){
  expect(route[0].values).toEqual(['easy','medium','hard']);
  expect(route[0].labels.join(' ')).toContain('簡單');expect(route[0].labels.join(' ')).toContain('中等');expect(route[0].labels.join(' ')).toContain('困難');
  expect(route[0].checked).toBe('easy');expect(route[0].disabled).toEqual([false,false,false]);
  if(route[0].noHero.checked!==null)expect(route[0].noHero).toEqual({checked:false,disabled:true});
  expect(route[1].disabled).toEqual([true,true,true]);
 }
});

test('easy and medium allow heroes while hard blocks heroes but still allows ordinary troops',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({campaignProgress:{plants:{highestLevel:10,completedLevels:Object.fromEntries(Array.from({length:10},(_,index)=>[index+1,1]))},zombies:{highestLevel:10,completedLevels:Object.fromEntries(Array.from({length:10},(_,index)=>[index+1,1]))}}});
  currentSeason=1;selectedLevel=10;
  const inspect=(faction,difficulty,hero,troop)=>{start(faction,{difficulty});clearInterval(timer);const initialResource=state.resource;state.resource=9999;return {difficulty:state.difficulty,initialResource,hero:deploymentReadyReason(hero),troop:deploymentReadyReason(troop)}};
  const easy=inspect('plants','easy','firepea','peashooter');
  const medium=inspect('plants','medium','firepea','peashooter');
  const hardPlants=inspect('plants','hard','firepea','peashooter');
  const hardZombies=inspect('zombies','hard','football','normal');
  return {easy,medium,hardPlants,hardZombies};
 });
 expect(result.easy).toMatchObject({difficulty:'easy',initialResource:488,hero:'',troop:''});
 expect(result.medium).toMatchObject({difficulty:'medium',initialResource:390,hero:'',troop:''});
 expect(result.hardPlants.difficulty).toBe('hard');expect(result.hardPlants.hero).toContain('困難');expect(result.hardPlants.troop).toBe('');
 expect(result.hardZombies.difficulty).toBe('hard');expect(result.hardZombies.hero).toContain('困難');expect(result.hardZombies.troop).toBe('');
});

test('second-season hard mode follows the same hero-only deployment restriction',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const completed=Object.fromEntries(Array.from({length:10},(_,index)=>[index+1,1]));playerProfile=normalizeProfile({season2Progress:{plants:{highestLevel:10,completedLevels:completed},zombies:{highestLevel:10,completedLevels:completed}}});
  currentSeason=2;selectedLevel=10;start('plants',{difficulty:'hard'});clearInterval(timer);state.resource=9999;
  return {difficulty:state.difficulty,hero:deploymentReadyReason('s2Xiahou'),troop:deploymentReadyReason('s2Crossbow'),title:$('modeTitle').textContent};
 });
 expect(result.difficulty).toBe('hard');expect(result.hero).toContain('困難');expect(result.troop).toBe('');expect(result.title).toContain('困難');
});

test('legacy battle saves without difficulty resume as medium while new hard saves stay hard',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});currentSeason=1;selectedLevel=1;start('plants',{difficulty:'medium'});clearInterval(timer);state.time=4321;persistBattleState();
  const legacy=JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY));delete legacy.state.difficulty;localStorage.setItem(BATTLE_SAVE_KEY,JSON.stringify(legacy));restoreBattleIfAvailable();clearInterval(timer);const legacyResult={difficulty:state.difficulty,time:state.time};
  start('plants',{difficulty:'hard'});clearInterval(timer);state.time=7654;persistBattleState();restoreBattleIfAvailable();clearInterval(timer);const hardResult={difficulty:state.difficulty,time:state.time,blocksHeroes:battleDifficultyConfig(state.difficulty).blocksHeroes};
  return {legacyResult,hardResult};
 });
 expect(result.legacyResult).toEqual({difficulty:'medium',time:4321});
 expect(result.hardResult).toEqual({difficulty:'hard',time:7654,blocksHeroes:true});
});

test('selected challenges cross the opening story into the production battle seam',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});currentSeason=1;currentFaction='plants';buildLevelCards();
  const card=document.querySelector('#levelGrid .level-card'),inputs=[...card.querySelectorAll('.challenge-option input')];card.querySelector('.difficulty-option input[value="hard"]').click();inputs[2].click();
  const chosen=inputs.filter(input=>input.checked).map(input=>input.value);card.querySelector('.level-start').click();const storyOpen=$('storyDialog').open;storyElement('storySkip').click();clearInterval(timer);
  return {chosen,storyOpen,difficulty:state?.difficulty,activeIds:state?.gameplay?.challenge?.activeIds,fairMode:state?.gameplay?.challenge?.fairMode};
 });
 expect(result.storyOpen).toBe(true);expect(result.difficulty).toBe('hard');expect(result.activeIds).toEqual(result.chosen);expect(result.activeIds).toHaveLength(2);expect(result.fairMode).toBe(true);
});

test('challenge results explain each verdict without blocking story or campaign advance',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  currentUser=null;playerProfile=normalizeProfile({});selectedLevel=1;currentSeason=1;start('plants',{challengeIds:challengesForRoute(1,'plants',1).map(def=>def.id)});clearInterval(timer);
  state.gameplay.telemetry.totals.resources.plants.spent=999;state.lawnmowers.forEach(mower=>{mower.used=true;mower.active=false});
  await end(true,'測試勝利','測試');
  const panel=$('challengeResultPanel'),rows=[...panel.querySelectorAll('.challenge-result-item')].map(row=>({classes:row.className,text:row.textContent.trim()})),next={hidden:$('modalNext').classList.contains('hidden'),disabled:$('modalNext').disabled},storyHidden=$('modalStory').classList.contains('hidden'),dialog=[$('modal').getAttribute('role'),$('modal').getAttribute('aria-modal'),$('modal').getAttribute('aria-labelledby')];
  $('modalStory').click();const storyOverlay={open:$('storyDialog').open,inert:$('storyDialog').inert,focused:$('storyDialog').contains(document.activeElement)};
  return {hidden:panel.classList.contains('hidden'),rows,next,storyHidden,dialog,storyOverlay};
 });
 expect(result.hidden).toBe(false);expect(result.rows).toHaveLength(3);expect(result.rows.some(row=>row.classes.includes('passed')&&row.text.includes('已達成'))).toBe(true);expect(result.rows.some(row=>row.text.includes('999')&&row.text.includes('500'))).toBe(true);expect(result.rows.some(row=>row.text.includes('生命')&&row.text.includes('50%'))).toBe(true);
 expect(result.next).toEqual({hidden:false,disabled:false});expect(result.storyHidden).toBe(false);expect(result.dialog).toEqual(['dialog','true','modalTitle']);expect(result.storyOverlay).toEqual({open:true,inert:false,focused:true});
});

test('retry keeps challenges and difficulty while the next route keeps difficulty without extra challenges',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  currentUser=null;playerProfile=normalizeProfile({});selectedLevel=1;currentSeason=1;start('plants',{difficulty:'hard',challengeIds:['no-hero','resource-cap']});clearInterval(timer);await end(true,'勝利','測試');
  $('modalRestart').click();if($('storyDialog').open)storyElement('storySkip').click();clearInterval(timer);const retry={ids:[...state.gameplay.challenge.activeIds],difficulty:state.difficulty};await end(true,'勝利','測試');$('modalNext').click();
  if($('storyDialog').open)storyElement('storySkip').click();clearInterval(timer);return {retry,nextLevel:state.level,nextDifficulty:state.difficulty,nextIds:state.gameplay.challenge.activeIds,nextFair:state.gameplay.challenge.fairMode};
 });
 expect(result.retry).toEqual({ids:['no-hero','resource-cap'],difficulty:'hard'});expect(result.nextLevel).toBe(2);expect(result.nextDifficulty).toBe('hard');expect(result.nextIds).toEqual([]);expect(result.nextFair).toBe(false);
});

test('defeat explains failure, ordinary battles hide results, and cloud pending never grants optimistically',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  currentUser=null;playerProfile=normalizeProfile({});selectedLevel=1;start('plants',{challengeIds:['no-hero']});clearInterval(timer);await end(false,'失敗','測試');
  const defeat={hidden:$('challengeResultPanel').classList.contains('hidden'),text:$('challengeResultPanel').textContent};
  start('plants');clearInterval(timer);await end(false,'失敗','測試');const ordinaryHidden=$('challengeResultPanel').classList.contains('hidden');
  currentUser={id:'cloud-user'};cloudLockOwned=true;selectedLevel=1;start('plants',{challengeIds:['no-hero']});clearInterval(timer);let resolveClaim;claimCloudMatchReward=()=>new Promise(resolve=>{resolveClaim=resolve});
  const ending=end(true,'勝利','測試');await new Promise(resolve=>setTimeout(resolve,0));const pending=$('challengeResultPanel').textContent;resolveClaim(false);await ending;const failed=$('challengeResultPanel').textContent;
  return {defeat,ordinaryHidden,pending,failed,medals:playerProfile.challenges.medals};
 });
 expect(result.defeat.hidden).toBe(false);expect(result.defeat.text).toContain('本場未獲勝');expect(result.ordinaryHidden).toBe(true);
 expect(result.pending).toContain('等待雲端確認');expect(result.pending).not.toContain('已取得勳章');expect(result.failed).toContain('雲端同步失敗');expect(result.medals).toEqual({});
});

test('a stale cloud result cannot escape its battle or overwrite a newer battle',async({page})=>{
 await open(page);const result=await page.evaluate(async()=>{
  currentUser={id:'cloud-user'};playerProfile=normalizeProfile({});selectedLevel=1;currentSeason=1;
  let settle;claimCloudMatchReward=()=>new Promise(resolve=>{settle=resolve});
  start('plants',{challengeIds:['no-hero']});clearInterval(timer);const oldBattle=state,pending=end(true,'勝利','舊戰局');await Promise.resolve();await Promise.resolve();
  const controls=['modalNext','modalStory','modalRestart','modalSwitch','modalMainMenu','modalHome'].map(id=>$(id)?({id,disabled:$(id).disabled,hidden:$(id).classList.contains('hidden')}):null).filter(Boolean);
  start('plants',{challengeIds:[]});clearInterval(timer);const newerBattle=state;$('modalTitle').textContent='新戰局';
  settle(false);const returned=await pending;
  return {controls,sameState:state===newerBattle,newOver:state.over,modalShown:$('modal').classList.contains('show'),title:$('modalTitle').textContent,returned,oldOver:oldBattle.over};
 });
 expect(result.controls.filter(control=>!control.hidden&&control.id!=='modalMainMenu').every(control=>control.disabled)).toBe(true);expect(result.controls.find(control=>control.id==='modalMainMenu')).toMatchObject({disabled:false,hidden:false});
 expect(result.sameState).toBe(true);expect(result.newOver).toBe(false);expect(result.modalShown).toBe(false);expect(result.title).toBe('新戰局');expect(result.returned).toBe(false);expect(result.oldOver).toBe(true);
});

test('leaving cloud verification cancels its result UI even when the battle object remains current',async({page})=>{
 await open(page);const result=await page.evaluate(async()=>{
  currentUser={id:'cloud-user'};playerProfile=normalizeProfile({});selectedLevel=1;start('plants',{challengeIds:['no-hero']});clearInterval(timer);
  let settle;claimCloudMatchReward=()=>new Promise(resolve=>{settle=resolve});const battle=state,pending=end(true,'勝利','fixture');await Promise.resolve();
  $('modalMainMenu').click();const left={sameState:state===battle,home:$('start').classList.contains('active'),modalShown:$('modal').classList.contains('show')};$('modalTitle').textContent='home marker';settle(false);const returned=await pending;
  return {...left,stillSame:state===battle,title:$('modalTitle').textContent,modalAfter:$('modal').classList.contains('show'),returned};
 });
 expect(result).toEqual({sameState:true,home:true,modalShown:false,stillSame:true,title:'home marker',modalAfter:false,returned:false});
});

test('result dialog contains keyboard focus and restores the opener on close',async({page})=>{
 await open(page);await page.evaluate(async()=>{
  currentUser=null;playerProfile=normalizeProfile({});selectedLevel=1;currentSeason=1;$('audioBtn').focus();start('plants',{challengeIds:['no-hero']});clearInterval(timer);$('audioBtn').focus();await end(true,'勝利','鍵盤驗收');
 });
 const containment=[];for(let index=0;index<14;index++){await page.keyboard.press(index%4===3?'Shift+Tab':'Tab');containment.push(await page.evaluate(()=>({inside:$('modal').contains(document.activeElement),active:document.activeElement?.id||document.activeElement?.tagName,openDialogs:[...document.querySelectorAll('dialog[open]')].map(dialog=>dialog.id)})))}
 expect(containment.every(step=>step.inside),JSON.stringify(containment)).toBe(true);
 expect(await page.evaluate(()=>resultDialogOpener?.id)).toBe('audioBtn');
 await page.evaluate(()=>hideResultModal());await page.waitForTimeout(20);
 const restored=await page.evaluate(()=>({show:$('modal').classList.contains('show'),active:document.activeElement?.id,opener:resultDialogOpener?.id,targetCount:resultDialogInertTargets.length,inertAncestors:[...function*(){let node=$('audioBtn');while(node){if(node.inert)yield node.id||node.tagName;node=node.parentElement}}()]}));
 expect(restored).toEqual({show:false,active:'audioBtn',opener:undefined,targetCount:0,inertAncestors:[]});
});

test('challenge selectors and result actions fit desktop portrait and short landscape',async({page})=>{
 await open(page);
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  const metrics=await page.evaluate(async()=>{
   currentUser=null;playerProfile=normalizeProfile({});currentSeason=1;currentFaction='plants';buildLevelCards();setCampaignDetailsExpanded(true);$('levelScreen').classList.add('active');
   const card=document.querySelector('#levelGrid .level-card'),selector=card.querySelector('.challenge-selector'),option=selector.querySelector('.challenge-option'),startButton=card.querySelector('.level-start'),selectorBox=selector.getBoundingClientRect(),optionBox=option.getBoundingClientRect(),buttonBox=startButton.getBoundingClientRect();
   selectedLevel=1;start('plants',{challengeIds:['no-hero','resource-cap']});clearInterval(timer);await end(true,'勝利','測試');const modalCard=$('modal').querySelector('.modal-card');
   const actions=[];for(const id of ['modalStory','modalNext','modalRestart','modalMainMenu']){const element=$(id);if(!element||element.classList.contains('hidden'))continue;element.scrollIntoView({block:'nearest'});const rect=element.getBoundingClientRect(),modalBox=modalCard.getBoundingClientRect(),x=Math.max(0,Math.min(innerWidth-1,rect.left+rect.width/2)),y=Math.max(0,Math.min(innerHeight-1,rect.top+rect.height/2)),hit=document.elementFromPoint(x,y);actions.push({id,within:rect.top>=Math.max(0,modalBox.top)-1&&rect.bottom<=Math.min(innerHeight,modalBox.bottom)+1&&rect.left>=Math.max(0,modalBox.left)-1&&rect.right<=Math.min(innerWidth,modalBox.right)+1,hit:hit===element||element.contains(hit)})}
   return {selectorLeft:selectorBox.left,selectorRight:selectorBox.right,optionHeight:optionBox.height,overlap:Math.max(0,Math.min(selectorBox.bottom,buttonBox.bottom)-Math.max(selectorBox.top,buttonBox.top)),pageOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,modalOverflow:modalCard.scrollWidth-modalCard.clientWidth,modalScrollable:modalCard.scrollHeight<=modalCard.clientHeight||getComputedStyle(modalCard).overflowY==='auto',nextPosition:getComputedStyle($('modalNext')).position,actions};
  });
  expect(metrics.selectorLeft).toBeGreaterThanOrEqual(0);expect(metrics.selectorRight).toBeLessThanOrEqual(viewport.width);expect(metrics.optionHeight).toBeGreaterThanOrEqual(44);expect(metrics.overlap).toBe(0);expect(metrics.pageOverflow).toBeLessThanOrEqual(1);expect(metrics.modalOverflow).toBeLessThanOrEqual(1);expect(metrics.modalScrollable).toBe(true);expect(metrics.nextPosition).toBe('static');expect(metrics.actions.length).toBeGreaterThanOrEqual(4);expect(metrics.actions.every(action=>action.within&&action.hit),JSON.stringify(metrics.actions)).toBe(true);
 }
});
