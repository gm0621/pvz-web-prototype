const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

const EXPECTED_SYNERGIES=[
 {id:'peach-oath',name:'桃園同心',season:1,side:'plants',members:['firepea','zhangfei','liubei'],memberNames:['關羽','張飛','劉備'],effect:{damagePct:.15},bonusLabel:'組合成員攻擊 +15%'},
 {id:'sleeping-dragon-phoenix',name:'臥龍鳳雛',season:1,side:'plants',members:['kongming','pangtong'],memberNames:['孔明','龐統'],effect:{ratePct:-.12},bonusLabel:'組合成員攻擊間隔 -12%'},
 {id:'tiger-guards',name:'虎衛並肩',season:2,side:'plants',members:['s2DianWei','s2XuChu'],memberNames:['典韋','許褚'],effect:{damagePct:.12},bonusLabel:'組合成員攻擊 +12%'},
 {id:'formation-crossbow',name:'破陣強弩',season:2,side:'plants',members:['s2XuHuang','s2Crossbow'],memberNames:['徐晃','強弩兵'],effect:{damagePct:.10},bonusLabel:'組合成員攻擊 +10%'},
 {id:'necromancer-flame',name:'屍巫烈焰',season:1,side:'zombies',members:['necromancer','fireCatapult'],memberNames:['冥火屍巫','烈焰屍車'],effect:{ratePct:-.10},bonusLabel:'組合成員攻擊間隔 -10%'},
 {id:'titan-siege',name:'巨屍攻城',season:1,side:'zombies',members:['corpseTitan','fireCatapult'],memberNames:['屍旗大胖','烈焰屍車'],effect:{damagePct:.12},bonusLabel:'組合成員攻擊 +12%'},
 {id:'coffin-rat-swarm',name:'棺盾鼠群',season:2,side:'zombies',members:['s2Coffin','s2Rat'],memberNames:['棺盾小屍','鼠牙群屍'],effect:{damagePct:.10},bonusLabel:'組合成員攻擊 +10%'},
 {id:'smoke-medic-cover',name:'煙醫掩護',season:2,side:'zombies',members:['s2Smoke','s2Medic'],memberNames:['煙罐小屍','縫屍醫官'],effect:{ratePct:-.10},bonusLabel:'組合成員攻擊間隔 -10%'}
];

test('immutable synergy registry defines the exact eight approved combinations',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>({
  definitions:SYNERGIES.map(item=>({id:item.id,name:item.name,season:item.season,side:item.side,members:[...item.members],memberNames:[...item.memberNames],effect:{...item.effect},bonusLabel:item.bonusLabel})),
  frozen:Object.isFrozen(SYNERGIES)&&SYNERGIES.every(item=>Object.isFrozen(item)&&Object.isFrozen(item.members)&&Object.isFrozen(item.memberNames)&&Object.isFrozen(item.effect)),
  validMembers:SYNERGIES.every(item=>item.members.every(key=>(item.side==='plants'?PLANT_TYPES:ZOMBIE_TYPES)[key])),
  aliases:SYNERGIES===COMBINATION_DEFINITIONS&&SYNERGIES.every(item=>synergyById(item.id)===item)
 }));
 expect(result.definitions).toEqual(EXPECTED_SYNERGIES);
 expect(new Set(result.definitions.map(item=>item.id)).size).toBe(8);
 expect(result.definitions.filter(item=>item.side==='plants'&&item.season===1)).toHaveLength(2);
 expect(result.definitions.filter(item=>item.side==='plants'&&item.season===2)).toHaveLength(2);
 expect(result.definitions.filter(item=>item.side==='zombies'&&item.season===1)).toHaveLength(2);
 expect(result.definitions.filter(item=>item.side==='zombies'&&item.season===2)).toHaveLength(2);
 expect(result.definitions.every(item=>item.members.length>=2&&new Set(item.members).size===item.members.length&&item.memberNames.length===item.members.length)).toBe(true);
 expect(result.definitions.every(item=>Object.values(item.effect).every(value=>Math.abs(value)>=.10&&Math.abs(value)<=.15))).toBe(true);
 expect(result.frozen&&result.validMembers&&result.aliases).toBe(true);
});

test('strategist support cadence receives its declared synergy and overlapping synergies stay within fifteen percent throughput',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  selectedLevel=1;currentSeason=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];
  addPlant('kongming',1,1);addPlant('pangtong',2,2);addZombie('normal',7,1);
  const kongming=state.plants.find(unit=>unit.type==='kongming');kongming.used=true;kongming.supportLast=0;state.time=4401;
  const baseSupport=effectiveUnit('plants','kongming').supportRate,boostedSupport=activeUnit('plants','kongming').supportRate,supportTriggered=strategistSupport(kongming,activeUnit('plants','kongming'));
  state.faction='zombies';state.season=1;state.plants=[];state.zombies=[];
  addZombie('necromancer',7,0);addZombie('corpseTitan',7,1);addZombie('fireCatapult',7,2);
  const baseCatapult=effectiveUnit('zombies','fireCatapult'),boostedCatapult=activeUnit('zombies','fireCatapult');
  const throughput=(boostedCatapult.catapultDamage/baseCatapult.catapultDamage)/(boostedCatapult.catapultRate/baseCatapult.catapultRate);renderCombinationStatus();
  return {baseSupport,boostedSupport,supportTriggered,baseCatapult:{damage:baseCatapult.catapultDamage,rate:baseCatapult.catapultRate},boostedCatapult:{damage:boostedCatapult.catapultDamage,rate:boostedCatapult.catapultRate},throughput,overlapText:document.querySelector('#combinationStatus').textContent};
 });
 expect(result.boostedSupport).toBe(Math.round(result.baseSupport*.88));
 expect(result.supportTriggered).toBe(true);
 expect(result.throughput).toBeGreaterThan(1.10);
 expect(result.throughput).toBeLessThanOrEqual(1.15);
 expect(result.overlapText).toContain('重疊成員總效益上限 +15%');
});

test('all eight synergies activate once only for living members in their own season',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>SYNERGIES.map(definition=>{
  const units=definition.members.map((type,index)=>({id:`${type}-${index}`,type,hp:100}));
  const battle={season:definition.season,faction:definition.side,plants:definition.side==='plants'?units:[],zombies:definition.side==='zombies'?units:[]};
  const partial={...battle,[definition.side]:units.slice(0,-1)};
  const duplicate={...battle,[definition.side]:[...units,{id:'duplicate',type:units[0].type,hp:100}]};
  const dead={...battle,[definition.side]:units.map((unit,index)=>index===0?{...unit,hp:0}:unit)};
  return {id:definition.id,complete:combinationIsActive(definition,battle),partial:combinationIsActive(definition,partial),duplicate:activeCombinationDefinitions(definition.side,duplicate).filter(item=>item.id===definition.id).length,dead:combinationIsActive(definition,dead),wrongSeason:combinationIsActive(definition,{...battle,season:definition.season===1?2:1})};
 }));
 expect(result.every(item=>item.complete&&!item.partial&&item.duplicate===1&&!item.dead&&!item.wrongSeason)).toBe(true);
});

test('player synergy changes a real projectile, cancels on death, and never buffs hidden enemy AI',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  selectedLevel=1;currentSeason=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];state.shots=[];Math.random=()=>1;
  addPlant('firepea',1,1);addPlant('zhangfei',2,2);addPlant('liubei',3,3);const target=addZombie('normal',7,1),targetHp=target.hp;
  const base=effectiveUnit('plants','firepea').damage;state.time=5000;actPlants();
  const boostedShot=state.pendingPlantShots.find(shot=>shot.sourceType==='firepea'),boosted=boostedShot?.damage;
  state.time=boostedShot.at;processPendingPlantShots();for(let step=0;step<100&&target.hp===targetHp;step++)moveProjectiles();const hitDamage=targetHp-target.hp;
  state.plants.find(unit=>unit.type==='zhangfei').hp=0;state.pendingPlantShots=[];state.projectiles=[];state.plants.find(unit=>unit.type==='firepea').last=0;state.time=10000;actPlants();
  const cancelled=state.pendingPlantShots.find(shot=>shot.sourceType==='firepea')?.damage;
  currentSeason=2;selectedLevel=1;start('plants');clearInterval(timer);state.zombies=[];
  addZombie('s2Coffin',7,1);addZombie('s2Rat',7,2);
  const enemyBase=ZOMBIE_TYPES.s2Rat.damage,enemyEffective=activeUnit('zombies','s2Rat').damage;
  return {base,boosted,hitDamage,cancelled,enemyBase,enemyEffective,baseStored:PLANT_TYPES.firepea.damage};
 });
 expect(result.boosted).toBe(Math.round(result.base*1.15));
 expect(result.hitDamage).toBe(result.boosted);
 expect(result.cancelled).toBe(result.base);
 expect(result.enemyEffective).toBe(result.enemyBase);
 expect(result.baseStored).toBe(result.base);
});

test('HUD explains members and exact benefit, updates only on signature change, and clears on real removal',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  selectedLevel=1;currentSeason=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];
  addPlant('firepea',1,1);addPlant('zhangfei',2,2);addPlant('liubei',3,3);updateHUD();
  const panel=document.querySelector('#combinationStatus'),firstChild=panel.firstChild;
  updateHUD();
  const active={hidden:panel.hidden,text:panel.textContent,live:panel.getAttribute('aria-live'),atomic:panel.getAttribute('aria-atomic'),stable:firstChild===panel.firstChild};
  removePlantAt(3,3);
  return {active,broken:{hidden:panel.hidden,text:panel.textContent}};
 });
 expect(result.active).toEqual(expect.objectContaining({hidden:false,live:'polite',atomic:'true',stable:true}));
 expect(result.active.text).toContain('桃園同心');
 expect(result.active.text).toContain('關羽＋張飛＋劉備');
 expect(result.active.text).toContain('組合成員攻擊 +15%');
 expect(result.broken).toEqual({hidden:true,text:''});
});

test('derived synergy and paused time survive browser reload through the canonical resume path',async({page})=>{
 await open(page);
 const before=await page.evaluate(()=>{
  selectedLevel=1;currentSeason=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];
  addPlant('kongming',1,1);addPlant('pangtong',2,2);state.time=4321;state.paused=true;persistBattleState();
  return {ids:activeCombinationDefinitions('plants').map(item=>item.id),time:state.time};
 });
 await page.reload();await page.waitForFunction(()=>typeof restoreBattleIfAvailable==='function');
 const after=await page.evaluate(()=>{const restored=restoreBattleIfAvailable();clearInterval(timer);return {restored,ids:activeCombinationDefinitions('plants').map(item=>item.id),time:state.time,paused:state.paused}});
 expect(after).toEqual({restored:true,ids:before.ids,time:before.time,paused:true});
});

test('combination HUD stays on-screen without shifting the board at desktop and phone viewports',async({page})=>{
 await open(page);
 for(const [name,width,height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390]]){
  await page.setViewportSize({width,height});
  const layout=await page.evaluate(()=>{
   selectedLevel=1;currentSeason=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];render();
   const boardBefore=document.querySelector('#board').getBoundingClientRect();
   addPlant('firepea',1,1);addPlant('zhangfei',2,2);addPlant('liubei',3,3);updateHUD();render();
   const panelElement=document.querySelector('#combinationStatus'),panel=panelElement.getBoundingClientRect(),boardAfter=document.querySelector('#board').getBoundingClientRect();
   const overlaps=[...document.querySelectorAll('.top-toolbar button,#gameFloatBackBtn')].filter(button=>{const rect=button.getBoundingClientRect();return rect.width>0&&rect.height>0&&panel.left<rect.right&&panel.right>rect.left&&panel.top<rect.bottom&&panel.bottom>rect.top}).map(button=>button.id);
   return {panel:{left:panel.left,right:panel.right,top:panel.top,bottom:panel.bottom},boardShift:Math.abs(boardAfter.top-boardBefore.top),overlaps,visible:!panelElement.hidden};
  });
  expect(layout.visible).toBe(true);expect(layout.panel.left).toBeGreaterThanOrEqual(0);expect(layout.panel.right).toBeLessThanOrEqual(width);expect(layout.panel.top).toBeGreaterThanOrEqual(0);expect(layout.panel.bottom).toBeLessThanOrEqual(height);expect(layout.overlaps).toEqual([]);expect(layout.boardShift).toBeLessThanOrEqual(width>720&&height>500?50:1);
  await page.screenshot({path:`test-results/task-5-1-synergy-${name}.png`,fullPage:false});
 }
});

for(const fallback of [false,true])test(`landscape ${fallback?'fallback':'native'} fullscreen keeps synergy HUD and deployment operable`,async({page},testInfo)=>{
 await page.setViewportSize({width:844,height:390});await open(page);
 await page.evaluate(fallback=>{
  selectedLevel=1;currentSeason=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];state.resource=999;
  addPlant('firepea',1,1);addPlant('zhangfei',2,2);addPlant('liubei',3,3);updateHUD();render();
  if(fallback)document.getElementById('game').requestFullscreen=undefined;
 },fallback);
 await page.locator('#cards [data-key="peashooter"]').click();await page.locator('#fullscreenBtn').click();await expect(page.locator('#game')).toHaveClass(/fullscreen-mode/);
 await expect(page.locator('#combinationStatus')).toContainText('桃園同心');
 const cell=page.locator('.cell[data-r="4"][data-c="0"]');await expect(cell).toBeInViewport();
 await expect.poll(()=>cell.evaluate(element=>{const rect=element.getBoundingClientRect();return element.contains(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2))})).toBe(true);
 await cell.click();await expect(page.locator('#board .type-peashooter')).toHaveCount(1);
 await page.screenshot({path:testInfo.outputPath(`synergy-landscape-${fallback?'fallback':'native'}.png`)});
});
