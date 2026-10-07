const {test,expect}=require('@playwright/test');

async function openApp(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/?stage-rules-test=1');
 await page.waitForFunction(()=>typeof start==='function'&&typeof createGameplayState==='function');
}

test('stage-rule registry exposes the complete contract and resolves both routes',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>({
  api:[typeof window.STAGE_RULES,typeof window.stageRuleById,typeof window.stageRuleFor],
  contracts:(window.STAGE_RULES||[]).map(rule=>({id:rule.id,title:rule.title,brief:rule.brief,types:['objective','start','tick','onEvent','isComplete','isFailed'].map(key=>typeof rule[key])})),
  resolved:[
   stageRuleFor({season:1,faction:'plants',level:1,levelConfig:LEVELS[1]})?.id,
   stageRuleFor({season:1,faction:'zombies',level:1,levelConfig:LEVELS[1]})?.id,
   stageRuleFor({season:1,faction:'plants',level:11,levelConfig:LEVELS[11]})?.id,
   stageRuleFor({season:2,faction:'plants',level:1,levelConfig:SEASON2_LEVELS[1]})?.id,
   stageRuleFor({season:2,faction:'zombies',level:1,levelConfig:SEASON2_LEVELS[1]})?.id
  ]
 }));
 expect(result.api).toEqual(['object','function','function']);
 expect(result.contracts.map(rule=>rule.id)).toEqual(['standard-defense','standard-attack','qin-finale','keep-mowers','escort-grain','lane-lock','destroy-arrow-tower','rotating-frost','escort-ram']);
 for(const rule of result.contracts){
  expect(rule.title.length).toBeGreaterThan(0);
  expect(rule.brief.length).toBeGreaterThan(0);
  expect(rule.types).toEqual(Array(6).fill('function'));
 }
 expect(result.resolved).toEqual(['keep-mowers','destroy-arrow-tower','qin-finale','rotating-frost','escort-ram']);
});

test('new and restored battles keep JSON-safe stage-rule runtime state',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  currentSeason=2;currentFaction='plants';selectedLevel=1;start('plants');clearInterval(timer);
  const fresh=state.gameplay.stageRule?structuredClone(state.gameplay.stageRule):null;
  const serializable=fresh?JSON.parse(JSON.stringify(fresh)):null;
  if(state.gameplay.stageRule)state.gameplay.stageRule.data.events=3;
  pauseAndSaveBattle('test');
  const saved=JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY)).state.gameplay.stageRule||null;
  state=null;$('game').classList.remove('active');
  const restored=restoreBattleIfAvailable();clearInterval(timer);
  const unknown=normalizeGameplayState({...state.gameplay,stageRule:{id:'removed-rule',data:{breached:true,events:99}}},{season:2,faction:'plants',level:1,levelConfig:SEASON2_LEVELS[1],time:0,zombies:[],bossSpawned:false,qinBossAlive:false}).stageRule;
  return {fresh,serializable,saved,restored,restoredRule:state.gameplay.stageRule?structuredClone(state.gameplay.stageRule):null,unknown};
 });
 expect(result.fresh).toEqual({id:'rotating-frost',data:{kind:'rotating-frost',breached:false,cycle:0,frozenLane:0}});
 expect(result.serializable).toEqual(result.fresh);
 expect(result.saved).toEqual({id:'rotating-frost',data:{kind:'rotating-frost',breached:false,cycle:0,frozenLane:0,events:3}});
 expect(result.restored).toBe(true);
 expect(result.restoredRule).toEqual(result.saved);
 expect(result.unknown).toEqual({id:'rotating-frost',data:{kind:'rotating-frost',breached:false,cycle:0,frozenLane:0}});
});

test('level cards and battle HUD render objectives from the same stage-rule source',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  const inspect=(season,faction)=>{
   currentSeason=season;currentFaction=faction;selectedLevel=1;buildLevelCards();
   const context={season,faction,level:1,levelConfig:campaignLevels(season)[1]};
   const rule=stageRuleFor(context),expected=rule.objective(context);
   const card=[...document.querySelectorAll('#levelGrid .level-card')][0];
   const cardText=[...card.querySelectorAll('[data-stage-objective] li')].map(item=>item.textContent);
   currentSeason=1;currentFaction='plants';selectedLevel=1;start('plants');clearInterval(timer);
   state.season=season;state.faction=faction;state.level=1;state.levelConfig=context.levelConfig;state.gameplay.stageRule=createStageRuleRuntime(context);$('cards').replaceChildren();updateHUD();
   const hudText=[...document.querySelectorAll('#objectives li')].map(item=>item.textContent);
   return {season,faction,ruleId:rule.id,expected,cardText,hudText,runtimeId:state.gameplay.stageRule.id};
  };
  return [inspect(1,'plants'),inspect(1,'zombies'),inspect(2,'plants'),inspect(2,'zombies')];
 });
 for(const row of result){
  expect(row.cardText,`${row.season}/${row.faction} card`).toEqual(row.expected);
  expect(row.hudText,`${row.season}/${row.faction} HUD`).toEqual(row.expected);
  expect(row.runtimeId).toBe(row.ruleId);
 }
});

test('wired completion, timeout and breach verdicts are decided by active rules',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  const outcomes=[],originalEnd=end;
  const begin=(faction='plants')=>{currentSeason=1;currentFaction='plants';selectedLevel=1;start('plants');clearInterval(timer);state.faction=faction;state.level=4;state.levelConfig=LEVELS[4];const context=stageRuleContextFor(state.levelConfig,faction,1,4,state);state.gameplay.stageRule=createStageRuleRuntime(context);state.over=false};
  end=(win,title,text)=>{outcomes.push({win,title,text});state.over=true;return {win,title,text}};
  begin('plants');state.bossSpawned=true;state.zombies=[];checkEnd();
  begin('zombies');state.time=state.levelConfig.attackTimeLimit;checkEnd();
  begin('zombies');finishStageBreach({r:2},true,'legacy','legacy');
  begin('plants');finishStageBreach({r:4},false,'legacy','legacy');
  end=originalEnd;
  return {outcomes,breached:state.gameplay.stageRule.data.breached};
 });
 expect(result.outcomes.map(item=>item.win)).toEqual([true,false,true,false]);
 expect(result.outcomes.map(item=>item.title)).toEqual(['防守成功！','進攻失敗','突破成功！','防線被突破！']);
 expect(result.breached).toBe(true);
});

test('stage objectives stay visible at desktop, portrait and short-landscape viewports',async({page})=>{
 await openApp(page);
 await page.evaluate(()=>{currentSeason=2;currentFaction='plants';$('start').classList.remove('active');$('levelScreen').classList.add('active');buildLevelCards()});
 for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  const objective=page.locator('#levelGrid [data-stage-objective]').first();
  await expect(objective).toBeVisible();
  await expect(objective.locator('li')).toHaveCount(3);
  const box=await objective.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);
  await page.screenshot({path:`/tmp/pvz-stage-rules-${viewport.width}x${viewport.height}.png`,fullPage:true});
 }
});

test('six pilot routes resolve to distinct playable stage rules',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>[
  [1,'plants',1],[1,'plants',2],[1,'plants',3],
  [1,'zombies',1],[2,'plants',1],[2,'zombies',1]
 ].map(([season,faction,level])=>{
  const levelConfig=campaignLevels(season)[level],rule=stageRuleFor({season,faction,level,levelConfig});
  return {route:`${season}-${faction}-${level}`,id:rule.id,title:rule.title,objective:rule.objective({season,faction,level,levelConfig})};
 }));
 expect(result.map(row=>row.id)).toEqual(['keep-mowers','escort-grain','lane-lock','destroy-arrow-tower','rotating-frost','escort-ram']);
 for(const row of result){
  expect(row.title,row.route).not.toMatch(/標準|undefined/);
  expect(row.objective,row.route).toHaveLength(3);
 }
});

test('pilot defense rules have deterministic win, loss and battle-time mechanics',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  const make=(season,level,time=0)=>{const levelConfig=campaignLevels(season)[level],context={season,faction:'plants',level,levelConfig,time,zombies:[],plants:[],lawnmowers:Array.from({length:5},(_,r)=>({r,used:false})),bossSpawned:false};const rule=stageRuleFor(context);return {rule,context,runtime:rule.start(context)}};
  const mower=make(1,1);mower.runtime=mower.rule.onEvent(mower.runtime,{type:'mower-used',lane:2},mower.context);
  const escort=make(1,2);escort.context.time=10000;escort.context.zombies=[{id:'z',r:2,c:escort.runtime.escort.c+.4,hp:100}];escort.runtime=escort.rule.tick(escort.runtime,escort.context);const escortAfterPressure=structuredClone(escort.runtime);escort.context.time=20000;escort.context.zombies=[];escort.runtime=escort.rule.tick(escort.runtime,escort.context);
  const lock=make(1,3);lock.context.time=12000;lock.runtime=lock.rule.tick(lock.runtime,lock.context);
  const frost=make(2,1);frost.context.time=10000;frost.runtime=frost.rule.tick(frost.runtime,frost.context);
  return {
   mower:{failed:mower.rule.isFailed(mower.runtime,mower.context),remaining:mower.runtime.mowersRemaining},
   escort:{afterPressure:escortAfterPressure,afterSafe:escort.runtime,failed:escort.rule.isFailed(escort.runtime,escort.context)},
   lock:{lane:lock.runtime.blockedLane,cycle:lock.runtime.cycle},
   frost:{lane:frost.runtime.frozenLane,cycle:frost.runtime.cycle,multiplier:stageRuleMovementMultiplier('zombies',frost.runtime.frozenLane,frost.runtime)}
  };
 });
 expect(result.mower).toEqual({failed:true,remaining:4});
 expect(result.escort.afterPressure.escort.hp).toBeLessThan(300);
 expect(result.escort.afterSafe.escort.progress).toBeGreaterThan(result.escort.afterPressure.escort.progress);
 expect(result.escort.failed).toBe(false);
 expect(result.lock).toEqual({lane:1,cycle:1});
 expect(result.frost).toEqual({lane:1,cycle:1,multiplier:.55});
});

test('pilot attack objectives require their designated target and escort',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  const setup=(season)=>{currentUser=null;playerProfile=defaultProfile();currentSeason=1;for(let level=1;level<=10;level++)completeCampaignLevel('plants',level,1);currentSeason=season;currentFaction='zombies';selectedLevel=1;start('zombies');clearInterval(timer);return state};
  setup(1);const towerRule=activeStageRule(),tower=state.plants.find(p=>p.stageTarget==='arrow-tower'),towerBefore=tower?{hp:tower.hp,maxHp:tower.maxHp}:null;state.time=state.gameplay.stageRule.data.deadline;tickStageRule();const towerTimedOut=towerRule.isFailed(state.gameplay.stageRule.data,stageRuleContextFor(state.levelConfig,state.faction,state.season,state.level,state));
  setup(2);const ramRule=activeStageRule(),ram=state.zombies.find(z=>z.stageEscort==='gate-ram'),ordinary={id:'ordinary',r:0,c:-.1,hp:10};state.zombies.push(ordinary);recordStageRuleEvent({type:'breach',lane:0,unitId:ordinary.id,stageEscort:null});const ordinaryComplete=ramRule.isComplete(state.gameplay.stageRule.data,stageRuleContextFor(state.levelConfig,state.faction,state.season,state.level,state));recordStageRuleEvent({type:'breach',lane:ram.r,unitId:ram.id,stageEscort:ram.stageEscort});const escortComplete=ramRule.isComplete(state.gameplay.stageRule.data,stageRuleContextFor(state.levelConfig,state.faction,state.season,state.level,state));
  return {towerBefore,towerTimedOut,ram:ram?{type:ram.type,escort:ram.stageEscort,hp:ram.hp}:null,ordinaryComplete,escortComplete};
 });
 expect(result.towerBefore).toEqual({hp:360,maxHp:360});
 expect(result.towerTimedOut).toBe(true);
 expect(result.ram).toEqual(expect.objectContaining({type:'s2Ram',escort:'gate-ram'}));
 expect(result.ram.hp).toBeGreaterThan(0);
 expect(result.ordinaryComplete).toBe(false);
 expect(result.escortComplete).toBe(true);
});

test('all six pilot verdicts are wired through the live battle end path',async({page})=>{
 await openApp(page);
 const outcomes=await page.evaluate(()=>{
  const result=[],originalEnd=end;
  end=(win,title,text)=>{result.push({win,title});state.over=true;return {win,title,text}};
  const begin=(season,faction,level)=>{
   currentUser=null;playerProfile=defaultProfile();currentSeason=1;currentFaction='plants';selectedLevel=1;start('plants');clearInterval(timer);
   state.season=season;state.faction=faction;state.level=level;state.levelConfig=campaignLevels(season)[level];state.time=0;state.over=false;
   state.gameplay.stageRule=createStageRuleRuntime(stageRuleContextFor(state.levelConfig,faction,season,level,state));
  };
  begin(1,'plants',1);state.bossSpawned=true;state.zombies=[];checkEnd();
  begin(1,'plants',1);recordStageRuleEvent({type:'mower-used',lane:0});checkEnd();
  begin(1,'plants',2);state.bossSpawned=true;state.zombies=[];Object.assign(state.gameplay.stageRule.data.escort,{progress:100,hp:1});checkEnd();
  begin(1,'plants',2);state.gameplay.stageRule.data.escort.hp=0;checkEnd();
  begin(1,'plants',3);state.bossSpawned=true;state.zombies=[];checkEnd();
  begin(1,'plants',3);recordStageRuleEvent({type:'breach'});checkEnd();
  begin(1,'zombies',1);Object.assign(state.gameplay.stageRule.data,{targetDestroyed:true,breached:true});checkEnd();
  begin(1,'zombies',1);state.time=state.gameplay.stageRule.data.deadline;checkEnd();
  begin(2,'plants',1);state.bossSpawned=true;state.zombies=[];checkEnd();
  begin(2,'plants',1);recordStageRuleEvent({type:'breach'});checkEnd();
  begin(2,'zombies',1);Object.assign(state.gameplay.stageRule.data,{escortAlive:true,escortId:'ram'});recordStageRuleEvent({type:'breach',unitId:'ram',stageEscort:'gate-ram'});checkEnd();
  begin(2,'zombies',1);state.gameplay.stageRule.data.escortAlive=false;checkEnd();
  end=originalEnd;return result;
 });
 expect(outcomes.map(item=>item.win)).toEqual([true,false,true,false,true,false,true,false,true,false,true,false]);
 expect(outcomes).toHaveLength(12);
});

test('pilot rule state restores without advancing and renders board cues',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  currentUser=null;playerProfile=defaultProfile();completeCampaignLevel('plants',1,1);currentSeason=1;currentFaction='plants';selectedLevel=2;start('plants');clearInterval(timer);
  state.time=10000;tickStageRule();render();const before=structuredClone(state.gameplay.stageRule),cueBefore=document.querySelector('[data-stage-rule-cue]')?.textContent||'';pauseAndSaveBattle('test');state=null;$('game').classList.remove('active');const restored=restoreBattleIfAvailable();clearInterval(timer);render();
  return {before,restored,after:state.gameplay.stageRule,time:state.time,paused:state.paused,cueBefore,cueAfter:document.querySelector('[data-stage-rule-cue]')?.textContent||''};
 });
 expect(result.restored).toBe(true);
 expect(result.after).toEqual(result.before);
 expect(result.time).toBe(10000);
 expect(result.paused).toBe(true);
 expect(result.cueBefore).toContain('運糧兵');
 expect(result.cueAfter).toBe(result.cueBefore);
 await page.locator('#pauseBtn').click();
 await expect(page.locator('#pauseOverlay')).not.toBeVisible();
 for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  const cue=page.locator('[data-stage-rule-cue="escort-grain"]'),board=page.locator('#board');
  await expect(cue).toBeVisible();
  const cueBox=await cue.boundingBox(),boardBox=await board.boundingBox();
  expect(cueBox.x).toBeGreaterThanOrEqual(boardBox.x);
  expect(cueBox.x+cueBox.width).toBeLessThanOrEqual(boardBox.x+boardBox.width+1);
  await page.screenshot({path:`/tmp/pvz-stage-rule-battle-${viewport.width}x${viewport.height}.png`,fullPage:true});
 }
});
