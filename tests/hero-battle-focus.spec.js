const {test,expect}=require('@playwright/test');
async function setup(page,late=false){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 await page.addInitScript(late=>{localStorage.setItem('heroLegendProgress_v1',JSON.stringify({completed:late?46:0,coins:500,battleLanes:5,caoTeam:['caocao','xiahoudun','caohong','caoren','xiahouyuan'],heroGrowth:{liubei:{xp:810},caocao:{xp:810}},skillSeen:['liubei','caocao'].flatMap(id=>[1,3,5,7,10].map(n=>id+':'+n))}));Element.prototype.requestFullscreen=undefined},late);
 await page.route('**/hero/engine.mjs?*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('return {level,mission:','return window.testBattle={level,mission:')})});
 await page.goto('/hero/');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+500));await page.locator('#startBtn').click();await page.locator('#storySkip').click();if(late)await page.locator('#deploymentStart').click();await expect(page.locator('#battle')).toBeVisible();
 await page.evaluate(()=>{window.testBattle.nextSpawn=Infinity;window.testBattle.food=300});await page.clock.runFor(100);return errors;
}
async function deploy(page,key='liubei'){await page.locator(`[data-hero=${key}]`).click();await page.locator('.lane').first().click();await page.clock.runFor(100);await page.locator('#unitSelect').selectOption({index:1});await page.clock.runFor(100)}
async function fits(page){return page.evaluate(()=>{const s=document.getElementById('battle'),f=document.getElementById('field').getBoundingClientRect(),dock=document.getElementById('battleDock').getBoundingClientRect();return {scroll:s.scrollHeight-s.clientHeight,wide:s.scrollWidth-s.clientWidth,field:f.height,bottom:Math.max(f.bottom,dock.bottom),height:innerHeight}})}
test('battle fits screen, compact selected skills, details and controls remain accessible',async({page},info)=>{
 const errors=await setup(page);await deploy(page);await expect(page.locator('#activeSkills')).toBeVisible();await expect(page.locator('#autoSkillButton')).toHaveAttribute('aria-pressed','false');
 let layout=await fits(page);expect(layout.scroll).toBeLessThanOrEqual(1);expect(layout.wide).toBeLessThanOrEqual(1);expect(layout.bottom).toBeLessThanOrEqual(layout.height);expect(layout.field).toBeGreaterThan(240);
 await page.locator('#commandDrawerButton').click();await expect(page.locator('[data-order=forward]')).toBeVisible();await page.locator('[data-order=forward]').click();await expect.poll(()=>page.evaluate(()=>window.testBattle.allies[0].order)).toBe('forward');await page.locator('#commandDrawerClose').click();
 await page.locator('#selectedDetails').click();await expect(page.locator('#skillGuide')).toBeVisible();expect(await page.evaluate(()=>window.testBattle.paused)).toBe(true);await page.locator('#skillGuide header button').click();await page.clock.runFor(100);await expect(page.locator('#skillGuide')).not.toBeVisible();expect(await page.evaluate(()=>window.testBattle.paused)).toBe(false);
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
 await page.keyboard.press('f');await expect(page.locator('#autoSkillButton')).toHaveAttribute('aria-pressed','true');await page.keyboard.press('Space');expect(await page.evaluate(()=>window.testBattle.paused)).toBe(true);const snapshot=await page.evaluate(()=>({time:window.testBattle.time,mp:window.testBattle.heroResources.liubei.mp}));await page.clock.runFor(2000);expect(await page.evaluate(()=>({time:window.testBattle.time,mp:window.testBattle.heroResources.liubei.mp}))).toEqual(snapshot);
 await page.keyboard.press('Space');await page.keyboard.press('f');await expect(page.locator('#autoSkillButton')).toHaveAttribute('aria-pressed','false');expect(errors).toEqual([]);
});
test('tactics drawer is usable without shrinking battlefield and spends battle resource',async({page},info)=>{
 const errors=await setup(page);await deploy(page);const before=await fits(page);await page.locator('#battleMenuButton').click();await page.locator('#tacticDrawerButton').click();await expect(page.locator('#tacticDrawer')).toBeVisible();await expect(page.locator('#tacticDrawer')).toContainText('劉備軍・同袍');await expect(page.locator('#tactic-charge')).toBeDisabled();await page.screenshot({path:info.outputPath('tactics.png')});await page.locator('#tactic-rescue').click();await page.clock.runFor(100);await expect(page.locator('#tacticDrawer')).not.toBeVisible();expect(await page.evaluate(()=>window.testBattle.allies[0].shield)).toBe(55);expect(await page.evaluate(()=>window.testBattle.armyDoctrine.points)).toBeLessThan(10);expect((await fits(page)).field).toBe(before.field);expect(errors).toEqual([]);
});
test('home cover keeps one clear entry and a collapsed accessible chapter catalogue',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/hero/');await expect(page.locator('#homeTitle')).toBeVisible();await expect(page.locator('#startBtn')).toBeVisible();expect(await page.locator('.chapter-label').count()).toBe(0);expect(await page.locator('#chapterPicker').getAttribute('open')).toBe(null);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('home-cover.png'),fullPage:true});await page.locator('.home-secondary a[href="#chapterPicker"]').click();await expect(page.locator('#chapterTabs')).toBeVisible();expect(await page.locator('#chapterTabs button').count()).toBe(11);await page.locator('#chapterPicker summary').click();await page.locator('#startBtn').click();await expect(page.locator('#story')).toBeVisible();expect(errors).toEqual([]);
});

test('home loads responsive cover only; battle sheets start after entering story',async({page},info)=>{
 const urls=[];page.on('request',r=>{if(r.resourceType()==='image')urls.push(r.url())});await page.goto('/hero/');await expect(page.locator('#startBtn')).toBeVisible();await page.locator('.home-art img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));expect(urls.filter(u=>u.includes('/assets/attacks/'))).toEqual([]);expect(urls.filter(u=>/assets\/(liubei.png|guanyu.webp|zhangfei.png|scenes\/peach-garden.jpg)/.test(u))).toEqual([]);const cover=await page.locator('.home-art img').evaluateAll(xs=>xs.map(x=>({src:x.currentSrc,width:x.naturalWidth})));expect(cover.every(x=>x.src.includes('/assets/home/')&&x.width>0)).toBe(true);await page.screenshot({path:info.outputPath('optimized-home.png'),fullPage:true});await page.locator('#startBtn').click();await expect.poll(()=>urls.filter(u=>u.includes('/assets/attacks/')).length).toBeGreaterThanOrEqual(4);
});
test('failed battle image can retry or cancel without starting combat',async({page})=>{
 await page.route('**/assets/attacks/liubei.png',route=>route.abort());await page.goto('/hero/');await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('#battleLoading')).toBeVisible();await expect(page.locator('#battleLoading')).toContainText('部分圖片未能載入');await expect(page.locator('#battle')).not.toBeVisible();await page.locator('#battleLoading .quiet-button').click();await expect(page.locator('#battleLoading')).toHaveCount(0);await page.unroute('**/assets/attacks/liubei.png');await page.locator('#storySkip').click();await expect(page.locator('#battle')).toBeVisible();
});

test('mouse movement and keyboard shortcuts coexist for the same selected unit',async({page},info)=>{
 const press=locator=>info.project.use.hasTouch?locator.tap():locator.click();
 const errors=await setup(page,true);await deploy(page);await page.locator('.ally[data-kind=liubei]').click();
 const direct=page.viewportSize().width>=900&&page.viewportSize().height>500;
 const order=name=>page.locator(direct?`[data-quick-order=${name}]`:`[data-order=${name}]`);
 if(!direct)await page.locator('#commandDrawerButton').click();
 await expect(order('forward')).toBeVisible();await press(order('forward'));expect(await page.evaluate(()=>window.testBattle.allies[0].order)).toBe('forward');await page.clock.runFor(2000);
 await press(order('back'));expect(await page.evaluate(()=>window.testBattle.allies[0].order)).toBe('back');
 await press(order('down'));expect(await page.evaluate(()=>window.testBattle.allies[0].lane)).toBe(1);await expect(order('up')).toBeDisabled();await page.clock.runFor(3100);
 await press(order('up'));expect(await page.evaluate(()=>window.testBattle.allies[0].lane)).toBe(0);await expect(order('up')).toBeDisabled();
 if(!direct)await page.locator('#commandDrawerClose').click();
 await page.keyboard.press('ArrowRight');expect(await page.evaluate(()=>window.testBattle.allies[0].order)).toBe('forward');await page.keyboard.press('s');expect(await page.evaluate(()=>window.testBattle.allies[0].order)).toBe('hold');await page.clock.runFor(3100);
 // Click a destination in another lane, then resume mouse button commands.
 const lane=await page.locator('.lane').nth(1).boundingBox();if(info.project.use.hasTouch)await page.touchscreen.tap(lane.x+lane.width*.55,lane.y+lane.height*.5);else await page.mouse.click(lane.x+lane.width*.55,lane.y+lane.height*.5);expect(await page.evaluate(()=>window.testBattle.allies[0].lane)).toBe(1);
 if(!direct)await page.locator('#commandDrawerButton').click();await press(order('hold'));expect(await page.evaluate(()=>window.testBattle.allies[0].order)).toBe('hold');
 await page.locator('#pauseBtn').click();await page.clock.runFor(100);await expect(order('forward')).toBeDisabled();const snap=await page.evaluate(()=>JSON.stringify(window.testBattle.allies));await page.keyboard.press('ArrowRight');expect(await page.evaluate(()=>JSON.stringify(window.testBattle.allies))).toBe(snap);await page.locator('#resumeBtn').click();await page.clock.runFor(100);await expect(order('forward')).toBeEnabled();
 if(!direct)await page.locator('#commandDrawerClose').click();const layout=await fits(page);expect(layout.scroll).toBeLessThanOrEqual(1);expect(layout.wide).toBeLessThanOrEqual(1);await page.screenshot({path:info.outputPath('mouse-and-keyboard.png')});expect(errors).toEqual([]);
});
