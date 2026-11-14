const {test,expect}=require('@playwright/test');
async function setup(page,completed){
 await page.clock.install();await page.addInitScript(n=>{if(!localStorage.getItem('heroLegendProgress_v1'))localStorage.setItem('heroLegendProgress_v1',JSON.stringify({completed:n,coins:1000}));const set=Storage.prototype.setItem;window.blockSave=false;Storage.prototype.setItem=function(k,v){if(window.blockSave&&k==='heroLegendProgress_v1')throw Error('blocked');return set.call(this,k,v)}},completed);
 await page.route('**/hero/engine.mjs?*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('return {level,mission:','window.testDeploy=deploy;return window.testBattle={level,mission:')})});
 await page.goto('/hero/');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#startBtn').tap();await page.locator('#storySkip').tap();if(completed>=16&&completed<19)await page.locator('#deploymentStart').tap();
}
test('level 17 empty final field completes remaining dispatch with one escort, pause and retry save',async({page},info)=>{
 test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page,16);
 // Controlled cleared-wave fixture; messenger travel, deployment and settlement use real logic.
 await page.evaluate(()=>{const b=window.testBattle;b.nextSpawn=Infinity;b.bossSpawned=true;b.enemies=[]});await page.clock.runFor(100);
 await expect(page.locator('#missionObjective')).toContainText('請派一名友軍');await expect(page.locator('#result')).toBeHidden();
 await page.locator('#cards [data-hero=archer]').tap();await page.locator('.lane').first().tap();await page.clock.runFor(3000);
 await expect(page.locator('#missionObjective')).toContainText('上路');await expect(page.locator('#missionObjective')).toContainText('敵軍已清退');
 await page.locator('#pauseBtn').tap();const before=await page.evaluate(()=>JSON.stringify(window.testBattle.mission));await page.clock.runFor(3000);expect(await page.evaluate(()=>JSON.stringify(window.testBattle.mission))).toBe(before);await page.locator('#resumeBtn').tap();
 await page.locator('#chapterMission').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('dispatch-hint.png')});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>window.blockSave=true);await page.clock.runFor(37000);expect(await page.evaluate(()=>window.testBattle.mission.rescued)).toBe(3);await expect(page.locator('#resultRetrySave')).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')).completed)).toBe(16);
 await page.evaluate(()=>window.blockSave=false);await page.locator('#resultRetrySave').tap();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')));expect(saved.completed).toBe(17);expect(saved.coins).toBe(1080);await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')))).toEqual(saved);expect(errors).toEqual([]);
});
test('chapter ending, camp, next story and next battle change music without resetting preference',async({page})=>{
 test.setTimeout(90000);await setup(page,21);await page.locator('#musicBtn').tap();await expect(page.locator('#musicBtn')).toContainText('洛陽');
 await page.evaluate(()=>{const b=window.testBattle;b.nextSpawn=Infinity;b.bossSpawned=true;b.enemies=[];b.mission.sites=[8,8,8]});await page.clock.runFor(100);await expect(page.locator('#result')).toBeVisible();await expect(page.locator('#musicBtn')).toContainText('群雄討董・章末');
 await page.locator('#resultNext').tap();await expect(page.locator('#musicBtn')).toContainText('軍帳小聚');await page.locator('#campContinue').tap();await expect(page.locator('#musicBtn')).toContainText('群雄討董・章末');await page.locator('#storySkip').tap();await expect(page.locator('#musicBtn')).toContainText('桃園說書');await page.locator('#storySkip').tap();await page.locator('#deploymentStart').tap();await expect(page.locator('#musicBtn')).toContainText('行軍');await expect(page.locator('#musicBtn')).not.toContainText('洛陽');await page.locator('#musicBtn').tap();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
});
