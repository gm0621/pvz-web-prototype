const {test,expect}=require('@playwright/test');
async function setup(page,late=false){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 await page.addInitScript(late=>{localStorage.setItem('heroLegendProgress_v1',JSON.stringify({completed:late?46:0,coins:500,battleLanes:5,caoTeam:['caocao','xiahou','dianwei','caoren','xiahouyuan'],heroGrowth:{liubei:{xp:810},caocao:{xp:810}},skillSeen:['liubei','caocao'].flatMap(id=>[1,3,5,7,10].map(n=>id+':'+n))}));document.documentElement.requestFullscreen=undefined},late);
 await page.route('**/hero/engine.mjs?*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('return {level,mission:','return window.testBattle={level,mission:')})});
 await page.goto('/hero/');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+500));await page.locator('#startBtn').click();await page.locator('#storySkip').click();if(late)await page.locator('#deploymentStart').click();
 await page.evaluate(()=>{window.testBattle.nextSpawn=Infinity;window.testBattle.food=300});await page.clock.runFor(100);return errors;
}
async function deploy(page,key='liubei'){await page.locator(`[data-hero=${key}]`).click();await page.locator('.lane').first().click();await page.clock.runFor(100);await page.locator('#unitSelect').selectOption({index:1});await page.clock.runFor(100)}
async function fits(page){return page.evaluate(()=>{const s=document.getElementById('battle'),f=document.getElementById('field').getBoundingClientRect(),dock=document.getElementById('battleDock').getBoundingClientRect();return {scroll:s.scrollHeight-s.clientHeight,wide:s.scrollWidth-s.clientWidth,field:f.height,bottom:Math.max(f.bottom,dock.bottom),height:innerHeight}})}
test('battle fits screen, compact selected skills, details and controls remain accessible',async({page},info)=>{
 const errors=await setup(page);await deploy(page);await expect(page.locator('#activeSkills')).toBeVisible();await expect(page.locator('#autoSkillButton')).toHaveAttribute('aria-pressed','false');
 let layout=await fits(page);expect(layout.scroll).toBeLessThanOrEqual(1);expect(layout.wide).toBeLessThanOrEqual(1);expect(layout.bottom).toBeLessThanOrEqual(layout.height);expect(layout.field).toBeGreaterThan(240);
 await page.locator('#commandDrawerButton').click();await expect(page.locator('[data-order=forward]')).toBeVisible();await page.locator('[data-order=forward]').click();await expect.poll(()=>page.evaluate(()=>window.testBattle.allies[0].order)).toBe('forward');await page.locator('#commandDrawerClose').click();
 await page.locator('#selectedDetails').click();await expect(page.locator('#skillGuide')).toBeVisible();expect(await page.evaluate(()=>window.testBattle.paused)).toBe(true);await page.locator('#skillGuide header button').click();await expect(page.locator('#skillGuide')).not.toBeVisible();expect(await page.evaluate(()=>window.testBattle.paused)).toBe(false);
 await page.locator('#battleMenuButton').click();await page.locator('#battleMapButton').click();await expect(page.locator('#campaignMapDialog')).toBeVisible();await page.locator('#campaignMapClose').click();await page.locator('#battleMenuClose').click();
 await page.clock.runFor(8000);await page.screenshot({path:info.outputPath('focused-battle.png')});expect(errors).toEqual([]);
});
test('five lanes and full roster do not force page scrolling; rotation works',async({page},info)=>{
 const errors=await setup(page,true);await deploy(page);await expect(page.locator('.lane')).toHaveCount(5);let layout=await fits(page);expect(layout.scroll).toBeLessThanOrEqual(1);expect(layout.bottom).toBeLessThanOrEqual(layout.height);expect(layout.field).toBeGreaterThan(230);
 await page.screenshot({path:info.outputPath('five-lanes.png')});await page.setViewportSize({width:844,height:390});layout=await fits(page);expect(layout.scroll).toBeLessThanOrEqual(1);expect(layout.bottom).toBeLessThanOrEqual(layout.height);expect(errors).toEqual([]);
});
test('keyboard selects, moves, casts, toggles automatic skills and respects pause',async({page})=>{
 const errors=await setup(page);await deploy(page);await page.locator('#unitSelect').evaluate(e=>e.blur());await page.keyboard.press('1');await page.keyboard.press('ArrowRight');expect(await page.evaluate(()=>window.testBattle.allies[0].order)).toBe('forward');await page.keyboard.press('s');expect(await page.evaluate(()=>window.testBattle.allies[0].order)).toBe('hold');await page.keyboard.press('a');expect(await page.evaluate(()=>window.testBattle.allies[0].order)).toBe(null);
 await page.evaluate(()=>{window.testBattle.allies[0].hp-=60});await page.keyboard.press('q');expect(await page.evaluate(()=>window.testBattle.heroResources.liubei.mp)).toBeLessThan(60);
 await page.keyboard.press('f');await expect(page.locator('#autoSkillButton')).toHaveAttribute('aria-pressed','true');await page.keyboard.press('Space');const snapshot=await page.evaluate(()=>({time:window.testBattle.time,mp:window.testBattle.heroResources.liubei.mp}));await page.clock.runFor(2000);expect(await page.evaluate(()=>({time:window.testBattle.time,mp:window.testBattle.heroResources.liubei.mp}))).toEqual(snapshot);
 await page.keyboard.press('Space');await page.keyboard.press('f');await expect(page.locator('#autoSkillButton')).toHaveAttribute('aria-pressed','false');expect(errors).toEqual([]);
});
