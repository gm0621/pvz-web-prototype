const {test,expect}=require('@playwright/test');
for(const level of [3,6,13])test(`duel ${level} pauses on background, returns to surviving troops, and rewards only after cleanup`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();
 await page.addInitScript(n=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({completed:n,coins:0})),level-1);
 await page.route('**/hero/engine.mjs?*',async route=>{const response=await route.fetch();const body=(await response.text()).replace('return {level,mission:','return window.auditBattle={level,mission:').replace('spawned:0,nextSpawn:6','spawned:STAGES[level-1].enemyCount,nextSpawn:0').replace('lane,x:.94,hp','lane,x:.17,hp');await route.fulfill({response,body})});
 await page.goto('/hero/');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#startBtn').click();await page.locator('#storySkip').click();await page.clock.runFor(100);await page.locator('#bossIntroContinue').click();
 await page.evaluate(()=>{const b=window.auditBattle,boss=b.enemies.find(e=>e.boss);boss.hp=boss.maxHp*.5;if(b.mission)b.mission.flags=b.mission.needed});
 const keys=level===6?['zhangfei','guanyu']:[level===3?'zhangfei':'guanyu'];
 for(const [i,key] of keys.entries()){await page.locator(`[data-hero=${key}]`).click();await page.locator('.lane').nth(keys.length===2&&i===0?2:1).click()}
 await page.clock.runFor(100);await expect(page.locator('#duelDialog')).toBeVisible();await page.locator('#duelEnter').click();
 await page.evaluate(()=>window.auditBattle.enemies.push({id:999,boss:false,name:'黃巾刀兵',lane:0,x:.85,hp:100,maxHp:100,damage:0,rate:2,lastAttack:100,speed:0}));
 await page.clock.runFor(5000);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 const frozen=await page.evaluate(()=>JSON.stringify(window.auditBattle));await page.clock.runFor(2500);expect(await page.evaluate(()=>JSON.stringify(window.auditBattle))).toBe(frozen);
 await expect(page.locator('#duelPause')).toContainText('繼續');await page.locator('#duelPause').click();await page.clock.runFor(23000);
 await expect(page.locator('#duelDialog')).not.toBeVisible();await expect(page.locator('#battle')).toBeVisible();await expect(page.locator('#result')).toBeHidden();
 expect(await page.evaluate(()=>window.auditBattle.enemies.map(e=>e.id))).toEqual([999]);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')))).toEqual({completed:level-1,coins:0});
 await page.evaluate(()=>window.auditBattle.enemies[0].hp=0);await page.clock.runFor(100);
 await expect(page.locator('#resultEarned')).toHaveText('+80');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')).completed)).toBe(level);expect(errors).toEqual([]);
});
