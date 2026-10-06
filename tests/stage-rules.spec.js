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
 expect(result.contracts.map(rule=>rule.id)).toEqual(['standard-defense','standard-attack','qin-finale']);
 for(const rule of result.contracts){
  expect(rule.title.length).toBeGreaterThan(0);
  expect(rule.brief.length).toBeGreaterThan(0);
  expect(rule.types).toEqual(Array(6).fill('function'));
 }
 expect(result.resolved).toEqual(['standard-defense','standard-attack','qin-finale','standard-defense','standard-attack']);
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
 expect(result.fresh).toEqual({id:'standard-defense',data:{startedAt:0,events:0}});
 expect(result.serializable).toEqual(result.fresh);
 expect(result.saved).toEqual({id:'standard-defense',data:{startedAt:0,events:3}});
 expect(result.restored).toBe(true);
 expect(result.restoredRule).toEqual(result.saved);
 expect(result.unknown).toEqual({id:'standard-defense',data:{startedAt:0,events:0}});
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
  const begin=(faction='plants')=>{currentSeason=1;currentFaction='plants';selectedLevel=1;start('plants');clearInterval(timer);state.faction=faction;const context=stageRuleContextFor(state.levelConfig,faction,1,1,state);state.gameplay.stageRule=createStageRuleRuntime(context);state.over=false};
  end=(win,title,text)=>{outcomes.push({win,title,text});state.over=true;return {win,title,text}};
  begin('plants');state.bossSpawned=true;state.zombies=[];checkEnd();
  begin('zombies');state.time=state.levelConfig.attackTimeLimit;checkEnd();
  begin('zombies');finishStageBreach({r:2},true,'legacy','legacy');
  begin('plants');finishStageBreach({r:4},false,'legacy','legacy');
  end=originalEnd;
  return {outcomes,events:state.gameplay.stageRule.data.events,breached:state.gameplay.stageRule.data.breached};
 });
 expect(result.outcomes.map(item=>item.win)).toEqual([true,false,true,false]);
 expect(result.outcomes.map(item=>item.title)).toEqual(['防守成功！','進攻失敗','突破成功！','防線被突破！']);
 expect(result.events).toBe(1);
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
