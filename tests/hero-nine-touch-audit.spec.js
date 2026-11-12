const {test,expect}=require('@playwright/test');
const KEY='heroLegendProgress_v1';
async function touch(page,selector){const el=page.locator(selector);await el.scrollIntoViewIfNeeded();const r=await el.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);await el.tap()}
async function setup(page){await page.clock.install();await page.addInitScript(()=>{const original=Storage.prototype.setItem;window.blockSupplySave=false;Storage.prototype.setItem=function(k,v){if(k==='heroLegendProgress_v1'&&window.blockSupplySave)throw Error('storage unavailable');return original.call(this,k,v)}});await page.route('**/hero/engine.mjs?*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('return {level,mission:','return window.touchBattle={level,mission:')})});await page.goto('/hero/');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000))}
async function level(page,n){await page.evaluate(n=>{window.blockSupplySave=false;localStorage.setItem('heroLegendProgress_v1',JSON.stringify({completed:n-1,coins:160,weapons:{liubei:1},inventory:{herb:2,grain:2}}))},n);await page.reload();await touch(page,'#startBtn')}
test('chapter nine touch: marching animation, repeated maps and prior pause remain consistent',async({page},info)=>{
 test.setTimeout(120000);await page.emulateMedia({reducedMotion:'no-preference'});await setup(page);
 for(let n=47;n<=52;n++){
  await level(page,n);const save=await page.evaluate(k=>localStorage.getItem(k),KEY),army=page.locator('.journey-army');await expect(army).toHaveAttribute('data-person','曹操');const first=await army.getAttribute('transform');await page.clock.runFor(1800);expect(await army.getAttribute('transform')).not.toBe(first);await expect(page.locator('#journeyIntro')).toHaveAttribute('data-arrived','false');
  if(n%2)await touch(page,'.journey-heading button');else await page.clock.runFor(3000);await expect(page.locator('#journeyIntro')).toHaveAttribute('data-arrived','true');const last=await army.getAttribute('transform');await page.clock.runFor(1000);expect(await army.getAttribute('transform')).toBe(last);
  await touch(page,'#storySkip');await page.evaluate(()=>{window.touchBattle.nextSpawn=Infinity;window.touchBattle.enemies=[]});
  for(const paused of [false,true]){
   if(paused)await touch(page,'#pauseBtn');await touch(page,'#battleMapButton');const frozen=await page.evaluate(()=>JSON.stringify(window.touchBattle));await page.clock.runFor(1000);expect(await page.evaluate(()=>JSON.stringify(window.touchBattle))).toBe(frozen);
   await touch(page,'#campaignMapDialog details summary');await expect(page.locator('#campaignMapStages li[aria-current]')).toContainText(`${n}.`);await touch(page,'#campaignMapClose');await page.clock.runFor(100);expect(await page.evaluate(()=>window.touchBattle.paused)).toBe(paused);if(paused)await touch(page,'#resumeBtn');
  }
  await touch(page,'#battleMapButton');await page.keyboard.press('Escape');await page.clock.runFor(100);await expect(page.locator('#campaignMapDialog')).not.toBeVisible();expect(await page.evaluate(()=>window.touchBattle.paused)).toBe(false);expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(save);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('chapter nine touch supplies: failed saves roll back and retry does not grant free effects',async({page})=>{
 test.setTimeout(120000);await page.emulateMedia({reducedMotion:'reduce'});await setup(page);
 for(let n=47;n<=52;n++){
  await level(page,n);await touch(page,'#storySkip');await page.evaluate(()=>{const b=window.touchBattle;b.nextSpawn=Infinity;b.enemies=[];b.food=200;b.oathUsed=true});await touch(page,'#cards [data-hero=liubei]');await page.locator('.lane').first().tap();await page.evaluate(()=>{const b=window.touchBattle;b.food=100;b.allies[0].hp=50;b.allies[0].lastHeal=999;b.allies[0].lastSkill=999});await page.clock.runFor(100);
  const before=await page.evaluate(()=>({hp:window.touchBattle.allies[0].hp,food:window.touchBattle.food,save:localStorage.getItem('heroLegendProgress_v1')}));await page.evaluate(()=>window.blockSupplySave=true);
  for(const id of ['herb','grain']){await touch(page,`[data-supply=${id}]`);await expect(page.locator('#storageNotice')).toBeVisible();expect(await page.evaluate(()=>window.touchBattle.allies[0].hp)).toBe(before.hp);expect(await page.evaluate(()=>window.touchBattle.food)).toBe(before.food);expect(await page.evaluate(k=>localStorage.getItem(k),KEY)).toBe(before.save)}
  await page.evaluate(()=>window.blockSupplySave=false);await touch(page,'#storageRetry');expect(await page.evaluate(()=>window.touchBattle.food)).toBe(before.food);expect(await page.evaluate(()=>window.touchBattle.allies[0].hp)).toBe(before.hp);
  await touch(page,'[data-supply=herb]');await touch(page,'[data-supply=grain]');expect(await page.evaluate(()=>window.touchBattle.allies[0].hp)).toBe(before.hp+60);expect(await page.evaluate(()=>window.touchBattle.food)).toBe(before.food+80);await page.reload();expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)).toMatchObject({completed:n-1,coins:160,weapons:{liubei:1},inventory:{herb:1,grain:1}});
 }
});
