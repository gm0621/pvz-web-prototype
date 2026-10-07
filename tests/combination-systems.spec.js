const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('data-driven combinations activate only while every unique member is deployed and alive',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  selectedLevel=1;currentSeason=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];
  const baseDamage=effectiveUnit('plants','firepea').damage;
  addPlant('firepea',1,1);addPlant('zhangfei',2,2);
  const partial={active:activeCombinationDefinitions('plants').map(item=>item.id),damage:activeUnit('plants','firepea').damage};
  addPlant('liubei',3,3);
  const complete={active:activeCombinationDefinitions('plants').map(item=>item.id),damage:activeUnit('plants','firepea').damage};
  state.plants.find(unit=>unit.type==='zhangfei').hp=0;
  const broken={active:activeCombinationDefinitions('plants').map(item=>item.id),damage:activeUnit('plants','firepea').damage};
  return {definitions:COMBINATION_DEFINITIONS.map(({id,side,members})=>({id,side,members})),baseDamage,partial,complete,broken};
 });
 expect(result.definitions.length).toBeGreaterThanOrEqual(3);
 expect(new Set(result.definitions.map(item=>item.side))).toEqual(new Set(['plants','zombies']));
 expect(result.definitions.every(item=>new Set(item.members).size===item.members.length)).toBe(true);
 expect(result.partial).toEqual({active:[],damage:result.baseDamage});
 expect(result.complete.active).toContain('peach-oath');
 expect(result.complete.damage).toBe(Math.round(result.baseDamage*1.15));
 expect(result.broken).toEqual({active:[],damage:result.baseDamage});
});

test('active combinations expose their exact bonus in battle UI and disappear immediately when broken',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  selectedLevel=1;currentSeason=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];
  addPlant('firepea',1,1);addPlant('zhangfei',2,2);addPlant('liubei',3,3);updateHUD();
  const panel=document.querySelector('#combinationStatus');
  const active={hidden:panel?.hidden,text:panel?.textContent,live:panel?.getAttribute('aria-live'),badge:panel?.querySelector('[data-combination-id="peach-oath"]')?.textContent};
  state.plants.find(unit=>unit.type==='liubei').hp=0;updateHUD();
  return {active,broken:{hidden:panel?.hidden,text:panel?.textContent}};
 });
 expect(result.active.hidden).toBe(false);
 expect(result.active.live).toBe('polite');
 expect(result.active.text).toContain('桃園結義');
 expect(result.active.badge).toContain('攻擊 +15%');
 expect(result.broken.hidden).toBe(true);
 expect(result.broken.text).toBe('');
});

test('combination HUD remains visible and contained at desktop, portrait, and landscape sizes',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  selectedLevel=1;currentSeason=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];
  addPlant('firepea',1,1);addPlant('zhangfei',2,2);addPlant('liubei',3,3);updateHUD();render();
 });
 for(const [name,width,height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390]]){
  await page.setViewportSize({width,height});
  const layout=await page.locator('#combinationStatus').evaluate(element=>{const rect=element.getBoundingClientRect();return {hidden:element.hidden,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth}});
  expect(layout.hidden).toBe(false);expect(layout.left).toBeGreaterThanOrEqual(0);expect(layout.right).toBeLessThanOrEqual(width);expect(layout.top).toBeGreaterThanOrEqual(0);expect(layout.bottom).toBeLessThanOrEqual(height);expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth+1);
  await page.screenshot({path:`test-results/task-5-1-combination-${name}.png`,fullPage:false});
 }
});

test('attacking-side combination modifier is derived from living zombies without mutating base data',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  for(let level=1;level<=10;level++){completeCampaignLevel('plants',level,1);completeCampaignLevel('zombies',level,1)}
  selectedLevel=1;currentSeason=2;start('zombies');clearInterval(timer);state.plants=[];state.zombies=[];
  const baseRate=ZOMBIE_TYPES.s2Medic.rate;
  addZombie('s2Coffin',7,1);addZombie('s2Smoke',7,2);addZombie('s2Medic',7,3);
  const modified=activeUnit('zombies','s2Medic').rate;
  const active=activeCombinationDefinitions('zombies').map(item=>item.id);
  state.zombies.find(unit=>unit.type==='s2Smoke').hp=0;
  return {baseRate,modified,restored:activeUnit('zombies','s2Medic').rate,stored:ZOMBIE_TYPES.s2Medic.rate,active};
 });
 expect(result.active).toContain('corpse-sustain-line');
 expect(result.modified).toBe(Math.round(result.baseRate*.9));
 expect(result.restored).toBe(result.baseRate);
 expect(result.stored).toBe(result.baseRate);
});
