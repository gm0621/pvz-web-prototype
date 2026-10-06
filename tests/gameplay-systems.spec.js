const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('state migration gives new and legacy battles versioned JSON-safe gameplay state',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const jsonUnsafePaths=(value,path='gameplay',seen=new Set())=>{
   const failures=[];
   if(value===undefined||typeof value==='function'||typeof value==='symbol'||typeof value==='bigint')return [path];
   if(value===null||typeof value!=='object')return failures;
   if(seen.has(value))return [path];
   seen.add(value);
   if(value instanceof Node||value instanceof EventTarget)failures.push(path);
   for(const [key,child] of Object.entries(value))failures.push(...jsonUnsafePaths(child,`${path}.${key}`,seen));
   seen.delete(value);
   return failures;
  };
  selectedLevel=1;
  start('plants');
  clearInterval(timer);
  const fresh=state.gameplay;
  const freshJson=JSON.parse(JSON.stringify(fresh));
  pauseAndSaveBattle('test');
  const snapshot=JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY));
  const savedGameplay=snapshot.state.gameplay;
  delete snapshot.state.gameplay;
  localStorage.setItem(BATTLE_SAVE_KEY,JSON.stringify(snapshot));
  const restored=restoreBattleIfAvailable();
  clearInterval(timer);
  return {
   helperTypes:[typeof createGameplayState,typeof normalizeGameplayState],
   fresh,
   freshJson,
   savedGameplay,
   normalizedMalformed:[
    normalizeGameplayState(null),
    normalizeGameplayState([]),
    normalizeGameplayState({version:999,extra:'ignored'})
   ],
   freshUnsafe:jsonUnsafePaths(fresh),
   restored,
   restoredGameplay:state?.gameplay,
   battleSaveVersion:snapshot.version
  };
 });
 expect(result.helperTypes).toEqual(['function','function']);
 expect(result.fresh).toEqual(expect.objectContaining({version:1,telemetry:expect.any(Object)}));
 expect(result.fresh).toEqual(result.freshJson);
 expect(result.savedGameplay).toEqual(result.fresh);
 expect(result.normalizedMalformed).toEqual([result.fresh,result.fresh,result.fresh]);
 expect(result.freshUnsafe).toEqual([]);
 expect(result.fresh.version).toBeGreaterThan(0);
 expect(result.restored).toBe(true);
 expect(result.restoredGameplay).toEqual(result.fresh);
 expect(result.battleSaveVersion).toBe(1);
});

test('event API aggregates damage, kills, control, resources and waves without DOM coupling',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  selectedLevel=1;start('plants');clearInterval(timer);
  recordBattleEvent('damage',{sourceSide:'plants',sourceId:'archer-1',sourceType:'peashooter',targetSide:'zombies',targetId:'zombie-1',targetType:'normal',amount:35,kind:'projectile'});
  recordBattleEvent('control',{sourceSide:'plants',sourceId:'archer-1',sourceType:'peashooter',targetSide:'zombies',targetId:'zombie-1',kind:'slow',duration:3200});
  recordBattleEvent('kill',{sourceSide:'plants',sourceId:'archer-1',sourceType:'peashooter',targetSide:'zombies',targetId:'zombie-1',targetType:'normal'});
  recordBattleEvent('resource',{side:'plants',amount:25,reason:'income'});
  recordBattleEvent('resource',{side:'plants',amount:-10,reason:'deploy'});
  recordBattleEvent('wave',{wave:2,phase:'complete'});
  const first=battleStatsSnapshot();first.totals.damageDealt.plants=999;
  return {snapshot:battleStatsSnapshot(),eventCount:state.gameplay.telemetry.events.length,hasDom:state.gameplay.telemetry.events.some(event=>Object.values(event).some(value=>value instanceof Node))};
 });
 expect(result.hasDom).toBe(false);expect(result.eventCount).toBe(6);
 expect(result.snapshot.totals).toEqual({damageDealt:{plants:35,zombies:0},damageTaken:{plants:0,zombies:35},kills:{plants:1,zombies:0},control:{plants:{count:1,duration:3200},zombies:{count:0,duration:0}},resources:{plants:{gained:25,spent:10,net:15},zombies:{gained:0,spent:0,net:0}},waves:{started:0,completed:1,current:2}});
 expect(result.snapshot.bySource['archer-1']).toEqual(expect.objectContaining({side:'plants',type:'peashooter',damage:35,kills:1,controlCount:1,controlDuration:3200}));
});

test('central damage hooks preserve exact HP and attribute projectiles and summons once',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  selectedLevel=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];state.projectiles=[];
  const archer={id:'archer',type:'peashooter',r:2,c:2,hp:100,maxHp:100};
  const summoned={id:'summon',type:'swordSoldier',r:2,c:3,hp:100,maxHp:100,summoned:true,summonerId:'summoner',summonerType:'liubei'};
  const first={id:'first',type:'normal',r:2,c:4,hp:100,maxHp:100};
  const second={id:'second',type:'normal',r:2,c:4,hp:30,maxHp:100};
  state.plants=[archer,summoned];state.zombies=[first,second];
  state.projectiles=[{x:4.33,y:2.5,r:2,dir:1,speed:.085,damage:35,from:'plant',sourceId:archer.id,sourceType:archer.type}];
  moveProjectiles();
  applyBattleDamage(second,40,{source:summoned,sourceSide:'plants',targetSide:'zombies',kind:'summon'});
  applyBattleDamage(second,40,{source:summoned,sourceSide:'plants',targetSide:'zombies',kind:'summon'});
  const snapshot=battleStatsSnapshot();
  return {hp:[first.hp,second.hp],projectileHit:state.projectiles[0].hit,snapshot,events:state.gameplay.telemetry.events.filter(event=>event.type==='damage'||event.type==='kill')};
 });
 expect(result.hp).toEqual([65,-50]);expect(result.projectileHit).toBe(true);
 expect(result.snapshot.totals.damageDealt.plants).toBe(65);expect(result.snapshot.totals.kills.plants).toBe(1);
 expect(result.snapshot.bySource.archer.damage).toBe(35);
 expect(result.snapshot.bySource.summoner).toEqual(expect.objectContaining({type:'liubei',damage:30,kills:1}));
 expect(result.events.filter(event=>event.type==='damage')).toHaveLength(2);expect(result.events.filter(event=>event.type==='kill')).toHaveLength(1);
});

test('season two damage records post-mitigation amounts without changing combat results',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  currentSeason=2;selectedLevel=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];
  const shield={id:'shield',type:'s2Shield',r:2,c:2,hp:200,maxHp:200,bornAt:0};
  const attacker={id:'rat',type:'s2Rat',r:2,c:2.7,hp:100,maxHp:100};
  state.plants=[shield];state.zombies=[attacker];state.time=1000;
  damageSeason2Plant(shield,100,true,{source:attacker,sourceSide:'zombies',kind:'melee'});
  return {hp:shield.hp,snapshot:battleStatsSnapshot()};
 });
 expect(result.hp).toBe(140);expect(result.snapshot.totals.damageDealt.zombies).toBe(60);expect(result.snapshot.totals.damageTaken.plants).toBe(60);
});

test('season two hook records real control while lethal control hits record none',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  currentSeason=2;selectedLevel=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];state.time=9000;
  const hook={id:'hook',type:'s2Hook',r:2,c:4,hp:100,maxHp:100,last:state.time,lastHook:0};
  const hooked={id:'hooked',type:'s2Spear',r:2,c:3.4,hp:100,maxHp:100};
  state.plants=[hooked];state.zombies=[hook];actSeason2Zombies();
  const warning=state.gameplay.telegraphs.active[0];state.time=warning.executeAt;processEnemyTelegraphs();
  const afterHook=battleStatsSnapshot();
  currentSeason=1;state.season=1;state.plants=[{id:'zhaoyun',type:'zhaoyun',r:2,c:2,hp:100,maxHp:100}];
  state.zombies=[{id:'victim',type:'normal',r:2,c:3,hp:1,maxHp:100}];state.pendingPlantShots=[{kind:'melee',at:state.time,sourceId:'zhaoyun',targetId:'victim',damage:20,slowDuration:3200}];
  processPendingPlantShots();
  return {hookedC:hooked.c,hookedSlowUntil:hooked.slowUntil,afterHook,final:battleStatsSnapshot(),deadSlowUntil:state.zombies[0].slowUntil};
 });
 expect(result.hookedC).toBe(3.2);expect(result.hookedSlowUntil).toBe(12000);
 expect(result.afterHook.totals.control.zombies).toEqual({count:1,duration:2200});
 expect(result.final.totals.control.plants).toEqual({count:0,duration:0});expect(result.deadSlowUntil).toBe(13000);
});

test('delayed summoned strike keeps summoner attribution after the summon dies',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  selectedLevel=1;start('plants');clearInterval(timer);state.time=1000;
  state.plants=[];state.zombies=[{id:'victim',type:'normal',r:2,c:4,hp:30,maxHp:100}];
  state.pendingPlantShots=[{kind:'soldierStrike',at:state.time,sourceId:'dead-summon',sourceType:'swordSoldier',summonerId:'liubei-1',summonerType:'liubei',targetId:'victim',damage:30}];
  processPendingPlantShots();return battleStatsSnapshot();
 });
 expect(result.bySource['liubei-1']).toEqual(expect.objectContaining({side:'plants',type:'liubei',damage:30,kills:1}));
});

test('telemetry survives pause save reload and continues from the restored totals',async({page})=>{
 await open(page);
 await page.evaluate(()=>{selectedLevel=1;start('plants');clearInterval(timer);recordBattleEvent('damage',{sourceSide:'plants',sourceId:'unit-1',sourceType:'peashooter',targetSide:'zombies',targetId:'target-1',amount:18});recordBattleEvent('resource',{side:'plants',amount:12,reason:'income'});pauseAndSaveBattle('test')});
 await page.reload();
 const result=await page.evaluate(()=>{clearInterval(timer);const restored=battleStatsSnapshot();recordBattleEvent('damage',{sourceSide:'plants',sourceId:'unit-1',sourceType:'peashooter',targetSide:'zombies',targetId:'target-2',amount:7});return {paused:state.paused,restored,continued:battleStatsSnapshot()}});
 expect(result.paused).toBe(true);expect(result.restored.totals.damageDealt.plants).toBe(18);expect(result.restored.totals.resources.plants).toEqual({gained:12,spent:0,net:12});expect(result.continued.totals.damageDealt.plants).toBe(25);expect(result.continued.bySource['unit-1'].damage).toBe(25);
});
