const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

const EXPECTED_NAMES=['桃園同心','臥龍鳳雛','虎衛並肩','破陣強弩','屍巫烈焰','巨屍攻城','棺盾鼠群','煙醫掩護'];

test('immutable synergy registry defines the exact eight approved combinations',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>({
  definitions:SYNERGIES.map(item=>({id:item.id,name:item.name,season:item.season,side:item.side,members:[...item.members],memberNames:[...item.memberNames],effect:{...item.effect},bonusLabel:item.bonusLabel})),
  frozen:Object.isFrozen(SYNERGIES)&&SYNERGIES.every(item=>Object.isFrozen(item)&&Object.isFrozen(item.members)&&Object.isFrozen(item.memberNames)&&Object.isFrozen(item.effect)),
  validMembers:SYNERGIES.every(item=>item.members.every(key=>(item.side==='plants'?PLANT_TYPES:ZOMBIE_TYPES)[key])),
  aliases:SYNERGIES===COMBINATION_DEFINITIONS&&SYNERGIES.every(item=>synergyById(item.id)===item)
 }));
 expect(result.definitions).toHaveLength(8);
 expect(result.definitions.map(item=>item.name)).toEqual(EXPECTED_NAMES);
 expect(new Set(result.definitions.map(item=>item.id)).size).toBe(8);
 expect(result.definitions.filter(item=>item.side==='plants'&&item.season===1)).toHaveLength(2);
 expect(result.definitions.filter(item=>item.side==='plants'&&item.season===2)).toHaveLength(2);
 expect(result.definitions.filter(item=>item.side==='zombies'&&item.season===1)).toHaveLength(2);
 expect(result.definitions.filter(item=>item.side==='zombies'&&item.season===2)).toHaveLength(2);
 expect(result.definitions.every(item=>item.members.length>=2&&new Set(item.members).size===item.members.length&&item.memberNames.length===item.members.length)).toBe(true);
 expect(result.definitions.every(item=>Object.values(item.effect).every(value=>Math.abs(value)>=.10&&Math.abs(value)<=.15))).toBe(true);
 expect(result.frozen&&result.validMembers&&result.aliases).toBe(true);
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
  addPlant('firepea',1,1);addPlant('zhangfei',2,2);addPlant('liubei',3,3);addZombie('normal',7,1);
  const base=effectiveUnit('plants','firepea').damage;state.time=5000;actPlants();
  const boosted=state.pendingPlantShots.find(shot=>shot.sourceType==='firepea')?.damage;
  state.plants.find(unit=>unit.type==='zhangfei').hp=0;state.pendingPlantShots=[];state.plants.find(unit=>unit.type==='firepea').last=0;state.time=10000;actPlants();
  const cancelled=state.pendingPlantShots.find(shot=>shot.sourceType==='firepea')?.damage;
  currentSeason=2;selectedLevel=1;start('plants');clearInterval(timer);state.zombies=[];
  addZombie('s2Coffin',7,1);addZombie('s2Rat',7,2);
  const enemyBase=ZOMBIE_TYPES.s2Rat.damage,enemyEffective=activeUnit('zombies','s2Rat').damage;
  return {base,boosted,cancelled,enemyBase,enemyEffective,baseStored:PLANT_TYPES.firepea.damage};
 });
 expect(result.boosted).toBe(Math.round(result.base*1.15));
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
