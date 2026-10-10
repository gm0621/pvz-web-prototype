const {test,expect}=require('@playwright/test');

async function openApp(page){
 await page.goto('/?tactical-orders-test=1');
 await page.waitForFunction(()=>typeof createGameplayState==='function'&&typeof start==='function');
}

test('nine tactical orders declare a clear benefit and cost without mutating unit data',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  const before={plants:JSON.stringify(PLANT_TYPES),zombies:JSON.stringify(ZOMBIE_TYPES)};
  const orders=Array.isArray(window.TACTICAL_ORDERS)?window.TACTICAL_ORDERS.map(order=>structuredClone(order)):[];
  const modifierTypes=[...new Set(orders.flatMap(order=>Object.keys(order.modifiers||{})))];
  return {
   api:[typeof window.TACTICAL_ORDERS,typeof window.tacticalOrderById,typeof window.effectiveBattleModifier],
   names:orders.map(order=>order.name),
   ids:orders.map(order=>order.id),
   contracts:orders.map(order=>({
    duration:order.duration,
    benefit:order.benefit,
    cost:order.cost,
    modifierCount:Object.keys(order.modifiers||{}).length,
    benefitKeys:order.tradeoffs?.benefit||[],
    costKeys:order.tradeoffs?.cost||[]
   })),
   modifierTypes,
   unchanged:{plants:before.plants===JSON.stringify(PLANT_TYPES),zombies:before.zombies===JSON.stringify(ZOMBIE_TYPES)}
  };
 });
 expect(result.api).toEqual(['object','function','function']);
 expect(result.names).toEqual(['屯田急令','火箭齊射','固守中軍','背水一戰','援軍令','空城計','急行換防','醫護營','斷糧奇襲']);
 expect(new Set(result.ids).size).toBe(9);
 expect(result.contracts).toHaveLength(9);
 for(const contract of result.contracts){
  expect(contract.duration).toBe('battle');
  expect(contract.benefit.length).toBeGreaterThan(0);
  expect(contract.cost.length).toBeGreaterThan(0);
  expect(contract.modifierCount).toBeGreaterThanOrEqual(2);
  expect(contract.benefitKeys.length).toBeGreaterThan(0);
  expect(contract.costKeys.length).toBeGreaterThan(0);
 }
 expect(result.modifierTypes).toEqual(expect.arrayContaining(['resourceIncome','attackSpeed','shield','enemySpawnInterval','deploymentCost','healing','relocationCost','enemyResourceIncome']));
 expect(result.unchanged).toEqual({plants:true,zombies:true});
});

test('battle-local strategy points normalize safely and old forced offers become optional',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});currentSeason=1;currentFaction='plants';selectedLevel=1;
  start('plants');clearInterval(timer);
  const fresh=structuredClone(state.gameplay.orders||null);
  if(state.gameplay.orders)state.gameplay.orders.selected=['tuntian','last-stand','medical-camp'];
  const combined=typeof window.effectiveBattleModifier==='function'?{
   resourceIncome:effectiveBattleModifier('resourceIncome'),
   damage:effectiveBattleModifier('damage'),
   attackSpeed:effectiveBattleModifier('attackSpeed'),
   healing:effectiveBattleModifier('healing'),
   unknown:effectiveBattleModifier('not-a-modifier')
  }:null;
  const source={version:GAMEPLAY_STATE_VERSION,telemetry:state.gameplay.telemetry,report:state.gameplay.report,telegraphs:state.gameplay.telegraphs,orders:{selected:['tuntian','tuntian','unknown','medical-camp'],offer:['tuntian','fire-volley','hold-center'],history:['last-stand',3],nextOfferId:-5}};
  const normalized=normalizeGameplayState(source).orders||null;
  const json=state.gameplay.orders?JSON.parse(JSON.stringify(state.gameplay.orders)):null;
  const before=typeof window.effectiveBattleModifier==='function'?effectiveBattleModifier('attackSpeed'):null;
  if(state.gameplay.orders)state.gameplay.orders.selected=Array(10).fill('last-stand');
  const clamped=typeof window.effectiveBattleModifier==='function'?effectiveBattleModifier('attackSpeed'):null;
  return {fresh,combined,normalized,json,before,clamped};
 });
 expect(result.fresh).toEqual({selected:[],offer:null,history:[],nextOfferId:1,attackMilestones:[],points:0,dialogOpen:false});
 expect(result.combined).toEqual({resourceIncome:1.25,damage:.9,attackSpeed:1.09,healing:1.14,unknown:1});
 expect(result.normalized).toEqual({selected:['tuntian','medical-camp'],offer:['tuntian','fire-volley','hold-center'],history:['last-stand'],nextOfferId:1,attackMilestones:[],points:1,dialogOpen:false});
 expect(result.json).toEqual({selected:['tuntian','last-stand','medical-camp'],offer:null,history:[],nextOfferId:1,attackMilestones:[],points:0,dialogOpen:false});
 expect(result.before).toBe(1.09);
 expect(result.clamped).toBe(1.5);
});

test('completing a defense wave grants one strategy point without pausing or opening a dialog',async({page})=>{
 await openApp(page);
 const before=await page.evaluate(()=>{
  currentSeason=1;currentFaction='plants';selectedLevel=6;for(let level=1;level<6;level++)completeCampaignLevel('plants',level);saveProfile();
  start('plants');clearInterval(timer);state.openingQueue=[];state.time=80000;state.aiResource=1000;
  state.waveDirector.active={id:1,count:1,sent:0,warnedAt:state.time-5000,nextAt:state.time,rallied:true,rows:[]};
  updateDefenseWaves();updateHUD();
  const saved=JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY));
  return {time:state.time,paused:state.paused,points:state.gameplay.orders.points,offer:state.gameplay.orders.offer,savedPoints:saved?.state?.gameplay?.orders?.points||0};
 });
 expect(before).toEqual({time:80000,paused:false,points:1,offer:null,savedPoints:1});
 await expect(page.getByRole('dialog',{name:'選擇軍令'})).toBeHidden();
 await expect(page.locator('#game')).not.toHaveAttribute('inert','');
 await expect(page.locator('#strategyBtn')).toContainText('策略點 1');
 expect(await page.evaluate(t=>{tick();return state.time>t},before.time)).toBe(true);
});

test('player may open or defer strategy selection and only a chosen order spends one point',async({page})=>{
 await openApp(page);
 await page.evaluate(()=>{
  currentSeason=1;currentFaction='plants';selectedLevel=6;for(let level=1;level<6;level++)completeCampaignLevel('plants',level);saveProfile();
  start('plants');clearInterval(timer);state.openingQueue=[];grantStrategyPoint('test');updateHUD();
 });
 await page.locator('#strategyBtn').click();
 await expect(page.getByRole('dialog',{name:'選擇軍令'})).toBeVisible();
 await expect(page.locator('#game')).toHaveAttribute('inert','');
 const offered=await page.evaluate(()=>({ids:[...state.gameplay.orders.offer],points:state.gameplay.orders.points,paused:state.paused}));
 expect(offered.ids).toHaveLength(3);expect(offered.points).toBe(1);expect(offered.paused).toBe(true);
 await page.locator('#tacticalOrderLater').click();
 await expect(page.getByRole('dialog',{name:'選擇軍令'})).toBeHidden();
 expect(await page.evaluate(()=>({points:state.gameplay.orders.points,offer:[...state.gameplay.orders.offer],paused:state.paused}))).toEqual({points:1,offer:offered.ids,paused:false});
 await page.locator('#strategyBtn').click();
 await page.locator('[data-tactical-order]').first().click();
 const resolved=await page.evaluate(id=>({
  selected:state.gameplay.orders.selected.filter(value=>value===id).length,
  history:state.gameplay.orders.history.filter(value=>value===id).length,
  points:state.gameplay.orders.points,
  offer:state.gameplay.orders.offer,
  secondAttempt:chooseTacticalOrder(id),
  active:Object.entries(tacticalOrderById(id).modifiers).every(([key,value])=>effectiveBattleModifier(key)===value),
  paused:state.paused,
 }),offered.ids[0]);
 expect(resolved).toEqual({selected:1,history:1,points:0,offer:null,secondAttempt:false,active:true,paused:false});
 const duplicate=await page.evaluate(id=>{
  const alternatives=tacticalOrderPoolForBattle().filter(value=>value!==id).slice(0,2);
  Object.assign(state.gameplay.orders,{points:1,offer:[id,...alternatives],dialogOpen:true});
  const accepted=chooseTacticalOrder(id);
  return {accepted,points:state.gameplay.orders.points,selected:state.gameplay.orders.selected.filter(value=>value===id).length,history:state.gameplay.orders.history.filter(value=>value===id).length};
 },offered.ids[0]);
 expect(duplicate).toEqual({accepted:false,points:1,selected:1,history:1});
 await expect(page.getByRole('dialog',{name:'選擇軍令'})).toBeHidden();
 await expect(page.locator('#strategyBtn')).toBeDisabled();
});

test('attack milestones grant at most two strategy points without interrupting either season',async({page})=>{
 await openApp(page);
 const results=[];
 for(const season of [1,2])results.push(await page.evaluate(season=>{
  currentSeason=season;
  for(let level=1;level<=10;level++)completeCampaignLevel('plants',level,season);
  selectedLevel=1;start('zombies');clearInterval(timer);state.nextAI=Infinity;state.aiResource=0;
  const defender=state.plants[0],attacker=addZombie(season===2?'s2Rat':'normal',5,defender.r);
  applyBattleDamage(defender,defender.hp,{source:attacker,kind:'test-break'});cleanup();tick();
  const first={points:state.gameplay.orders.points,offer:state.gameplay.orders.offer,paused:state.paused,milestones:[...state.gameplay.orders.attackMilestones]};
  state.time=Math.ceil(state.levelConfig.attackTimeLimit*.6);tick();
  const second={points:state.gameplay.orders.points,offer:state.gameplay.orders.offer,paused:state.paused,milestones:[...state.gameplay.orders.attackMilestones]};
  for(let i=0;i<20;i++){state.time=Math.ceil(state.levelConfig.attackTimeLimit*.75);tick()}
  return {season,first,second,after:{points:state.gameplay.orders.points,offer:state.gameplay.orders.offer,nextOfferId:state.gameplay.orders.nextOfferId,milestones:[...state.gameplay.orders.attackMilestones]}};
 },season));
 for(const result of results){
  expect(result.first).toEqual({points:1,offer:null,paused:false,milestones:['defender-break']});
  expect(result.second).toEqual({points:2,offer:null,paused:false,milestones:['defender-break','time-pressure']});
  expect(result.after).toEqual({points:2,offer:null,nextOfferId:1,milestones:['defender-break','time-pressure']});
 }
});

test('strategy points and a pending offer survive reload without reopening while retry starts fresh',async({page})=>{
 await openApp(page);
 const before=await page.evaluate(()=>{
  currentSeason=1;for(let level=1;level<=10;level++)completeCampaignLevel('plants',level,1);saveProfile();
  selectedLevel=1;start('zombies');clearInterval(timer);state.nextAI=Infinity;state.aiResource=0;
  state.time=Math.ceil(state.levelConfig.attackTimeLimit*.6);tick();openTacticalOrderMenu();persistBattleState();
  return {points:state.gameplay.orders.points,offer:[...state.gameplay.orders.offer],dialogOpen:state.gameplay.orders.dialogOpen};
 });
 expect(before.points).toBe(1);expect(before.offer).toHaveLength(3);expect(before.dialogOpen).toBe(true);
 await page.reload();
 const restored=await page.evaluate(()=>({paused:state.paused,points:state.gameplay.orders.points,offer:[...(state.gameplay.orders.offer||[])],dialogOpen:state.gameplay.orders.dialogOpen,milestones:[...(state.gameplay.orders.attackMilestones||[])]}));
 expect(restored).toEqual({paused:true,points:1,offer:before.offer,dialogOpen:false,milestones:['time-pressure']});
 await expect(page.getByRole('dialog',{name:'選擇軍令'})).toBeHidden();
 await expect(page.locator('#pauseOverlay')).toHaveClass(/show/);
 await page.locator('#strategyBtn').click();
 await expect(page.getByRole('dialog',{name:'選擇軍令'})).toBeVisible();
 expect(await page.evaluate(()=>state.gameplay.orders.offer)).toEqual(before.offer);
 const retry=await page.evaluate(()=>{selectedLevel=1;start('zombies');clearInterval(timer);return structuredClone(state.gameplay.orders)});
 expect(retry).toEqual({selected:[],offer:null,history:[],nextOfferId:1,attackMilestones:[],points:0,dialogOpen:false});
});

test('order cards stay readable at desktop, portrait phone, and landscape phone sizes',async({page},testInfo)=>{
 await openApp(page);
 await page.evaluate(()=>{
  currentSeason=1;currentFaction='plants';selectedLevel=6;for(let level=1;level<6;level++)completeCampaignLevel('plants',level);saveProfile();
  start('plants');clearInterval(timer);grantStrategyPoint('visual-test');openTacticalOrderMenu();
 });
 for(const [name,viewport] of [['desktop',{width:1440,height:900}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
  await page.setViewportSize(viewport);
  const dialog=page.getByRole('dialog',{name:'選擇軍令'}),shell=dialog.locator('.tactical-order-shell');
  await expect(dialog).toBeVisible();await expect(dialog.locator('[data-tactical-order]')).toHaveCount(3);
  await expect(dialog.locator('.benefit')).toHaveCount(3);await expect(dialog.locator('.cost')).toHaveCount(3);
  const geometry=await shell.evaluate(element=>{const box=element.getBoundingClientRect();return {left:box.left,top:box.top,right:box.right,bottom:box.bottom,scrollOk:element.scrollHeight<=element.clientHeight+1}});
  expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(viewport.width+1);expect(geometry.bottom).toBeLessThanOrEqual(viewport.height+1);expect(geometry.scrollOk).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`tactical-orders-${name}.png`)});
 }
});
