const {test,expect}=require('@playwright/test');

async function openApp(page){
 await page.addInitScript(()=>{
  const read={};
  for(const side of ['plants','zombies'])for(let level=1;level<=10;level++)for(const scene of ['opening','victory','defeat'])read[`${side}:${level}:${scene}`]=true;
  localStorage.setItem('sgzStoryRead_v1',JSON.stringify(read));
 });
 await page.goto('/?enemy-telegraphs-test=1');
 await page.waitForFunction(()=>typeof createGameplayState==='function'&&typeof start==='function'&&typeof catapultFire==='function');
}

function startDefense(page,season=1,level=1){
 return page.evaluate(({season,level})=>{
  playerProfile=normalizeProfile({});
  currentSeason=season;currentFaction='plants';selectedLevel=level;
  start('plants');clearInterval(timer);state.paused=false;
  state.time=60000;state.plants=[];state.zombies=[];state.projectiles=[];
  return true;
 },{season,level});
}

test('telegraph state is versioned, serializable, and normalized for old saves',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  const fresh=createGameplayState();
  const legacy=normalizeGameplayState({version:GAMEPLAY_STATE_VERSION,telemetry:fresh.telemetry,report:fresh.report});
  return {
   fresh:fresh.telegraphs,
   legacy:legacy.telegraphs,
   json:JSON.parse(JSON.stringify(fresh)).telegraphs,
   api:[typeof createEnemyTelegraph,typeof processEnemyTelegraphs,typeof cancelEnemyTelegraphsForSource]
  };
 });
 expect(result.api).toEqual(['function','function','function']);
 expect(result.fresh).toEqual({nextId:1,active:[]});
 expect(result.legacy).toEqual({nextId:1,active:[]});
 expect(result.json).toEqual({nextId:1,active:[]});
});

test('烈焰屍車 warns for 1.2 battle seconds, supports dodge and source cancellation, then cleans up',async({page})=>{
 await openApp(page);await startDefense(page);
 const result=await page.evaluate(()=>{
  const plant={id:'plant-a',type:'wallnut',r:2,c:4,hp:500,maxHp:500,last:0,bornAt:0};
  const splash={id:'plant-b',type:'peashooter',r:1,c:3,hp:200,maxHp:200,last:0,bornAt:0};
  state.plants=[plant,splash];
  const z=addZombie('fireCatapult',7,2);z.id='catapult-a';z.catapultLast=-999999;
  const scheduled=catapultFire(z,ZOMBIE_TYPES.fireCatapult);
  const queued=structuredClone(state.gameplay.telegraphs.active[0]);
  const hpBefore=[plant.hp,splash.hp];
  state.time=queued.executeAt-50;processEnemyTelegraphs();
  const hpEarly=[plant.hp,splash.hp];
  plant.r=0;plant.c=0;splash.r=4;splash.c=0;
  state.time=queued.executeAt;processEnemyTelegraphs();
  const hpDodged=[plant.hp,splash.hp],afterDodge=state.gameplay.telegraphs.active.length;

  plant.r=2;plant.c=4;splash.r=1;splash.c=3;z.catapultLast=-999999;state.time+=2000;
  catapultFire(z,ZOMBIE_TYPES.fireCatapult);const second=structuredClone(state.gameplay.telegraphs.active[0]);
  z.hp=0;state.time=second.executeAt;processEnemyTelegraphs();
  return {scheduled,queued,hpBefore,hpEarly,hpDodged,afterDodge,afterCancel:state.gameplay.telegraphs.active.length};
 });
 expect(result.scheduled).toBeTruthy();
 expect(result.queued).toMatchObject({kind:'fire-catapult',duration:1200,sourceId:'catapult-a',cancelOnSourceDeath:true});
 expect(result.queued.targets).toEqual([{r:2,c:4}]);
 expect(result.hpEarly).toEqual(result.hpBefore);
 expect(result.hpDodged).toEqual(result.hpBefore);
 expect(result.afterDodge).toBe(0);
 expect(result.afterCancel).toBe(0);
});

test('屍巫、狂笑與重槌 use their declared warning windows before applying effects',async({page})=>{
 await openApp(page);await startDefense(page);
 const result=await page.evaluate(()=>{
  const makePlant=(id,r,c)=>({id,type:'wallnut',r,c,hp:600,maxHp:600,last:0,bornAt:0});
  const plant=makePlant('target',2,4);state.plants=[plant];
  const makeZombie=(type,id,r=2)=>{const z=addZombie(type,7,r);z.id=id;z.last=-999999;return z};
  const cases=[];
  const run=(kind,z,schedule,duration)=>{
   const before=plant.hp;schedule();const found=state.gameplay.telegraphs.active.find(item=>item.sourceId===z.id),warning=found?structuredClone(found):null;
   const untouched=plant.hp===before;if(warning){state.time=warning.executeAt;processEnemyTelegraphs()}
   cases.push({kind,duration:warning?.duration||0,untouched,damaged:plant.hp<before,remaining:state.gameplay.telegraphs.active.filter(item=>item.sourceId===z.id).length});
   plant.hp=600;state.time+=2000;
  };
  const titan=makeZombie('corpseTitan','titan');titan.smashLast=-999999;
  run('titan',titan,()=>titanSiegeSmash(titan,ZOMBIE_TYPES.corpseTitan,plant),800);
  const jester=makeZombie('jester','jester');jester.laughLast=-999999;
  run('jester',jester,()=>jesterLaugh(jester,ZOMBIE_TYPES.jester),800);
  const necro=makeZombie('necromancer','necro');necro.curseLast=-999999;
  run('necro',necro,()=>necromancerCurse(necro,ZOMBIE_TYPES.necromancer),1000);
  return cases;
 });
 expect(result).toEqual([
  {kind:'titan',duration:800,untouched:true,damaged:true,remaining:0},
  {kind:'jester',duration:800,untouched:true,damaged:true,remaining:0},
  {kind:'necro',duration:1000,untouched:true,damaged:true,remaining:0}
 ]);
});

test('秦皇天下一統 warns the chosen lane for 1.4 seconds before damage',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;currentFaction='plants';selectedLevel=11;start('plants');clearInterval(timer);state.paused=false;state.time=50000;
  const boss=qinBossEntity(),plant={id:'qin-target',type:'wallnut',r:3,c:3,hp:500,maxHp:500,last:0,bornAt:0};state.plants=[plant];
  const before=plant.hp;executeQinCommand(boss,3);const warning=state.gameplay.telegraphs.active.find(item=>item.kind==='qin-unification')||null;
  if(warning){state.time=warning.executeAt-50;processEnemyTelegraphs()}const early=plant.hp;
  if(warning){state.time=warning.executeAt;processEnemyTelegraphs()}
  return {warning,before,early,after:plant.hp,remaining:state.gameplay.telegraphs.active.length};
 });
 expect(result.warning).toMatchObject({kind:'qin-unification',duration:1400,cancelOnSourceDeath:false,targets:[{r:3}]});
 expect(result.early).toBe(result.before);
 expect(result.after).toBeLessThan(result.before);
 expect(result.remaining).toBe(0);
});

test('第二季斷盾、拖行與衝撞 telegraph for 0.7–1.0 seconds before resolving',async({page})=>{
 await openApp(page);await startDefense(page,2,1);
 const result=await page.evaluate(()=>{
  const plant=(id)=>({id,type:'s2Shield',r:2,c:4,hp:800,maxHp:800,shieldHp:300,last:0,bornAt:0});
  const zombie=(id,type)=>({id,type,r:2,c:4.7,hp:800,maxHp:800,last:-999999,bornAt:0});
  const cases=[];

  let p=plant('cleaver-target'),z=zombie('cleaver','s2Cleaver');state.plants=[p];state.zombies=[z];const originalRandom=Math.random;Math.random=()=>0;
  const cleaverBefore={hp:p.hp,shield:p.shieldHp};season2CleaverHit(z,p,ZOMBIE_TYPES.s2Cleaver);const cleaver=structuredClone(state.gameplay.telegraphs.active[0]);const cleaverEarly={hp:p.hp,shield:p.shieldHp};state.time=cleaver.executeAt;processEnemyTelegraphs();cases.push({kind:cleaver.kind,duration:cleaver.duration,early:cleaverEarly,before:cleaverBefore,after:{hp:p.hp,shield:p.shieldHp}});Math.random=originalRandom;

  state.time+=2000;state.gameplay.telegraphs.active=[];p=plant('hook-target');p.type='s2Tuntian';z=zombie('hook','s2Hook');z.lastHook=-999999;z.last=state.time;state.plants=[p];state.zombies=[z];const hookBefore=p.c;actSeason2Zombies();const hook=structuredClone(state.gameplay.telegraphs.active[0]);const hookEarly=p.c;state.time=hook.executeAt;processEnemyTelegraphs();cases.push({kind:hook.kind,duration:hook.duration,before:hookBefore,early:hookEarly,after:p.c,slowUntil:p.slowUntil});

  state.time+=2000;state.gameplay.telegraphs.active=[];p=plant('ram-target');p.type='s2Tuntian';z=zombie('ram','s2Ram');z.charge=60;state.plants=[p];state.zombies=[z];const ramBefore=p.hp;actSeason2Zombies();const ram=structuredClone(state.gameplay.telegraphs.active[0]);const ramEarly=p.hp;state.time=ram.executeAt;processEnemyTelegraphs();cases.push({kind:ram.kind,duration:ram.duration,before:ramBefore,early:ramEarly,after:p.hp});
  return cases;
 });
 expect(result[0]).toMatchObject({kind:'s2-shield-break',duration:700,early:result[0].before});
 expect(result[0].after.shield).toBeLessThan(result[0].before.shield);
 expect(result[1]).toMatchObject({kind:'s2-hook-drag',duration:800,early:result[1].before});
 expect(result[1].after).toBeLessThan(result[1].before);
 expect(result[1].slowUntil).toBeGreaterThan(0);
 expect(result[2]).toMatchObject({kind:'s2-ram-charge',duration:900,early:result[2].before});
 expect(result[2].after).toBeLessThan(result[2].before);
});

test('every listed telegraph supports its declared counter and cleans up exactly once',async({page})=>{
 await openApp(page);await startDefense(page);
 const result=await page.evaluate(()=>{
  const countered=[];
  const reset=(type,id)=>{const p={id:`${id}-target`,type:'wallnut',r:2,c:4,hp:800,maxHp:800,last:0,bornAt:0};state.plants=[p];state.zombies=[];state.gameplay.telegraphs.active=[];const z=addZombie(type,7,2);z.id=id;z.last=-999999;return {p,z,before:p.hp}};
  let setup=reset('corpseTitan','counter-titan');setup.z.smashLast=-999999;titanSiegeSmash(setup.z,ZOMBIE_TYPES.corpseTitan,setup.p);let warning=state.gameplay.telegraphs.active[0];setup.z.hp=0;state.time=warning.executeAt;processEnemyTelegraphs();countered.push({kind:warning.kind,unchanged:setup.p.hp===setup.before,remaining:state.gameplay.telegraphs.active.length});
  state.time+=2000;setup=reset('jester','counter-jester');setup.z.laughLast=-999999;jesterLaugh(setup.z,ZOMBIE_TYPES.jester);warning=state.gameplay.telegraphs.active[0];setup.z.hp=0;state.time=warning.executeAt;processEnemyTelegraphs();countered.push({kind:warning.kind,unchanged:setup.p.hp===setup.before,remaining:state.gameplay.telegraphs.active.length});
  state.time+=2000;setup=reset('necromancer','counter-necro');setup.z.curseLast=-999999;necromancerCurse(setup.z,ZOMBIE_TYPES.necromancer);warning=state.gameplay.telegraphs.active[0];setup.z.hp=0;state.time=warning.executeAt;processEnemyTelegraphs();countered.push({kind:warning.kind,unchanged:setup.p.hp===setup.before,remaining:state.gameplay.telegraphs.active.length});

  currentSeason=2;currentFaction='plants';selectedLevel=1;start('plants');clearInterval(timer);state.paused=false;state.time=60000;
  const resetS2=(type,id,plantType='s2Shield')=>{const p={id:`${id}-target`,type:plantType,r:2,c:4,hp:800,maxHp:800,shieldHp:300,last:0,bornAt:0};const z={id,type,r:2,c:4.7,hp:800,maxHp:800,last:-999999,bornAt:0};state.plants=[p];state.zombies=[z];state.gameplay.telegraphs.active=[];return {p,z,before:{hp:p.hp,shield:p.shieldHp,c:p.c}}};
  const originalRandom=Math.random;Math.random=()=>0;setup=resetS2('s2Cleaver','counter-cleaver');season2CleaverHit(setup.z,setup.p,ZOMBIE_TYPES.s2Cleaver);Math.random=originalRandom;warning=state.gameplay.telegraphs.active[0];setup.z.hp=0;state.time=warning.executeAt;processEnemyTelegraphs();countered.push({kind:warning.kind,unchanged:setup.p.hp===setup.before.hp&&setup.p.shieldHp===setup.before.shield,remaining:state.gameplay.telegraphs.active.length});
  state.time+=2000;setup=resetS2('s2Hook','counter-hook','s2Tuntian');setup.z.lastHook=-999999;setup.z.last=state.time;actSeason2Zombies();warning=state.gameplay.telegraphs.active[0];setup.z.hp=0;state.time=warning.executeAt;processEnemyTelegraphs();countered.push({kind:warning.kind,unchanged:setup.p.c===setup.before.c,remaining:state.gameplay.telegraphs.active.length});
  state.time+=2000;setup=resetS2('s2Ram','counter-ram','s2Tuntian');setup.z.charge=60;actSeason2Zombies();warning=state.gameplay.telegraphs.active[0];setup.z.hp=0;state.time=warning.executeAt;processEnemyTelegraphs();countered.push({kind:warning.kind,unchanged:setup.p.hp===setup.before.hp,remaining:state.gameplay.telegraphs.active.length});
  return countered;
 });
 expect(result).toEqual([
  {kind:'titan-smash',unchanged:true,remaining:0},
  {kind:'jester-laugh',unchanged:true,remaining:0},
  {kind:'necromancer-curse',unchanged:true,remaining:0},
  {kind:'s2-shield-break',unchanged:true,remaining:0},
  {kind:'s2-hook-drag',unchanged:true,remaining:0},
  {kind:'s2-ram-charge',unchanged:true,remaining:0}
 ]);
});

test('秦皇天下一統 can be dodged by changing lane and still cleans up',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;currentFaction='plants';selectedLevel=11;start('plants');clearInterval(timer);state.paused=false;state.time=50000;
  const boss=qinBossEntity(),plant={id:'qin-dodge',type:'wallnut',r:3,c:3,hp:500,maxHp:500,last:0,bornAt:0};state.plants=[plant];executeQinCommand(boss,3);
  const warning=state.gameplay.telegraphs.active.find(item=>item.kind==='qin-unification'),before=plant.hp;plant.r=0;state.time=warning.executeAt;processEnemyTelegraphs();
  return {kind:warning.kind,unchanged:plant.hp===before,remaining:state.gameplay.telegraphs.active.length};
 });
 expect(result).toEqual({kind:'qin-unification',unchanged:true,remaining:0});
});

test('warning visuals expose non-color icon, text countdown, pointer-safe targets, and responsive geometry',async({page},testInfo)=>{
 await openApp(page);await startDefense(page);
 await page.evaluate(()=>{
  state.time=25000;
  createEnemyTelegraph('fire-catapult',{sourceId:'visual-fire',targets:[{r:4,c:4}],cancelOnSourceDeath:false});
  createEnemyTelegraph('qin-unification',{sourceId:'visual-qin',targets:[{r:1}],cancelOnSourceDeath:false});
  render();
 });
 const fire=page.locator('.enemy-telegraph.fire-catapult');
 const lane=page.locator('.enemy-telegraph.qin-unification');
 await expect(fire.locator('.telegraph-icon')).toHaveText('☄');
 await expect(lane.locator('.telegraph-icon')).toHaveText('令');
 await expect(fire.locator('time.telegraph-countdown')).toHaveAttribute('datetime','PT1.2S');
 await expect(fire.locator('time.telegraph-countdown')).toContainText('1.2 秒');
 await expect(page.locator('#battleTelegraphBanner')).toHaveAttribute('aria-live','assertive');
 await expect(page.locator('#battleTelegraphBanner')).toHaveAttribute('aria-label',/烈焰落石即將發動。反制：/);
 await expect(fire).toHaveAttribute('role','note');
 expect(await fire.evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');

 for(const [name,viewport] of [['desktop',{width:1440,height:900}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
  await page.setViewportSize(viewport);await page.evaluate(()=>render());
  const geometry=await page.evaluate(()=>{
   const board=document.getElementById('board').getBoundingClientRect(),cards=document.querySelector('.cards-panel').getBoundingClientRect(),banner=document.getElementById('battleTelegraphBanner').getBoundingClientRect();
   const warnings=[...document.querySelectorAll('.enemy-telegraph')].map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}});
   return {viewport:{width:innerWidth,height:innerHeight},board:{left:board.left,right:board.right,top:board.top,bottom:board.bottom},cards:{top:cards.top,position:getComputedStyle(document.querySelector('.cards-panel')).position},banner:{left:banner.left,right:banner.right,top:banner.top,bottom:banner.bottom},warnings,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  });
  expect(geometry.overflow,name).toBeLessThanOrEqual(1);
  expect(geometry.banner.left,name).toBeGreaterThanOrEqual(0);
  expect(geometry.banner.right,name).toBeLessThanOrEqual(geometry.viewport.width+1);
  expect(geometry.banner.bottom,name).toBeLessThanOrEqual(geometry.board.top+1);
  for(const warning of geometry.warnings){expect(warning.left,name).toBeGreaterThanOrEqual(geometry.board.left-1);expect(warning.right,name).toBeLessThanOrEqual(geometry.board.right+1);expect(warning.top,name).toBeGreaterThanOrEqual(geometry.board.top-1);expect(warning.bottom,name).toBeLessThanOrEqual(geometry.board.bottom+1)}
  if(geometry.cards.position==='fixed')expect(geometry.board.bottom,name).toBeLessThanOrEqual(geometry.cards.top+1);
  const target=page.locator('.cell[data-r="4"][data-c="4"]');
  await expect.poll(()=>target.evaluate(el=>{const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !top?.closest('.enemy-telegraph')}),`${name} warning must not intercept grid`).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`telegraph-accessible-${name}.png`),fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#fullscreenBtn').click();
 await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement||document.getElementById('game').classList.contains('fullscreen-mode'))).toBe(true);
 await page.evaluate(()=>render());
 const fullscreenGeometry=await page.evaluate(()=>{const board=document.getElementById('board').getBoundingClientRect(),cards=document.querySelector('.cards-panel').getBoundingClientRect();return{boardBottom:board.bottom,cardsTop:cards.top,warnings:[...document.querySelectorAll('.enemy-telegraph')].map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}}),width:innerWidth}});
 expect(fullscreenGeometry.boardBottom).toBeLessThanOrEqual(fullscreenGeometry.cardsTop+1);
 for(const warning of fullscreenGeometry.warnings){expect(warning.left).toBeGreaterThanOrEqual(0);expect(warning.right).toBeLessThanOrEqual(fullscreenGeometry.width+1);expect(warning.bottom).toBeLessThanOrEqual(fullscreenGeometry.boardBottom+1)}
 await expect(page.locator('#battleTelegraphBanner')).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('telegraph-accessible-portrait-fullscreen.png')});
});

test('warning DOM and remaining battle time survive background pause plus reload',async({page},testInfo)=>{
 await openApp(page);await startDefense(page);
 const before=await page.evaluate(()=>{
  const p={id:'persist-target',type:'wallnut',r:2,c:4,hp:500,maxHp:500,last:0,bornAt:0};state.plants=[p];
  const z=addZombie('fireCatapult',7,2);z.id='persist-source';z.catapultLast=-999999;catapultFire(z,ZOMBIE_TYPES.fireCatapult);render();
  const warning=state.gameplay.telegraphs.active[0];const saved={time:state.time,executeAt:warning.executeAt};pauseAndSaveBattle('background');return saved;
 });
 const warning=page.locator('.enemy-telegraph.fire-catapult');await expect(warning).toBeVisible();await expect(warning).toContainText('烈焰落石');
 const banner=page.locator('#battleTelegraphBanner');await expect(banner).toBeVisible();await expect(banner).toContainText('反制：換列離開九宮格');
 await page.screenshot({path:testInfo.outputPath('enemy-telegraph-before-reload.png'),fullPage:true});
 await page.reload();await page.waitForFunction(()=>typeof restoreBattleIfAvailable==='function');
 const restored=await page.evaluate(()=>{const ok=restoreBattleIfAvailable();clearInterval(timer);return {ok,paused:state?.paused,time:state?.time,warning:state?.gameplay?.telegraphs?.active?.[0]}});
 expect(restored).toMatchObject({ok:true,paused:true,time:before.time,warning:{executeAt:before.executeAt,duration:1200}});
 await expect(page.locator('.enemy-telegraph.fire-catapult')).toBeVisible();
 await expect(page.locator('#battleTelegraphBanner')).toContainText('反制：換列離開九宮格');
 await page.screenshot({path:testInfo.outputPath('enemy-telegraph-after-reload.png'),fullPage:true});
});
