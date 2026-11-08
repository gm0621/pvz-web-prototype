const {test,expect}=require('@playwright/test');
test('old chapter-one save continues into four new playable stages',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({version:1,completed:6})));
 await page.goto('/hero/');await expect(page.locator('#chapterDots button')).toHaveCount(10);await expect(page.locator('#chapterDots button').nth(6)).toBeEnabled();await expect(page.locator('#chapterDots button').nth(7)).toBeDisabled();
 await page.locator('#startBtn').click();await expect(page.locator('#storyChapter')).toContainText('第二章');await expect(page.locator('#storyTitle')).toHaveText('廣宗拜師');await page.locator('#storySkip').click();await expect(page.locator('#field')).toBeVisible();
 const theme=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=scene-audio-2');return a.audioStatus().theme});expect(theme).toBe('義軍疾行');
 await page.reload();await expect(page.locator('#homeProgress')).toContainText('6 / 10');
});
test('selected hero taps stop immediately, and point orders can resume movement',async({page})=>{
 await page.clock.install();await page.goto('/hero/');await page.locator('#startBtn').click();await page.locator('#storySkip').click();await page.locator('[data-hero="zhangfei"]').click();await page.locator('.lane[data-lane="1"]').click();
 const unit=page.locator('.ally[data-kind="zhangfei"]');await unit.click();await unit.click();await expect(unit).toHaveAttribute('data-order','hold');const x=await unit.evaluate(e=>e.style.left);await page.clock.runFor(1000);expect(await unit.evaluate(e=>e.style.left)).toBe(x);
 await page.locator('.lane[data-lane="1"]').click({position:{x:250,y:20}});await expect(unit).toHaveAttribute('data-order','forward');await unit.click();await expect(unit).toHaveAttribute('data-order','hold');
});
test('fifth boss arrival has a portrait, shield health bar and duel instructions',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({version:1,completed:4})));
 // Controlled spawn fixture exercises the real arrival/render path without a long battle.
 await page.route('**/hero/engine.mjs?*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('spawned:0,nextSpawn:6','spawned:STAGES[level-1].enemyCount,nextSpawn:0')})});
 await page.goto('/hero/');await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('#bossIntro')).toBeVisible();await expect(page.locator('#bossIntroTitle')).toContainText('石魁');await expect(page.locator('#bossIntroTip')).toContainText('劉備');await expect(page.locator('#bossIntroArt')).toHaveAttribute('src',/shi-kui/);
 await page.screenshot({path:info.outputPath('shi-kui-arrival.png')});await page.locator('#bossIntroContinue').click();await expect(page.locator('#bossHud')).toBeVisible();await expect(page.locator('#bossHudName')).toContainText('石魁');
 await page.locator('[data-hero="liubei"]').click();await page.locator('.lane[data-lane="1"]').click();await page.screenshot({path:info.outputPath('boss-field.png')});
 expect(await page.locator('#cards').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
});
test('all enemy portraits have transparent backgrounds and Yellow Turban assets',async({page})=>{
 await page.goto('/hero/');const data=await page.evaluate(async()=>{const s=await import('/hero/story.mjs?v=yellow-boss-2');const paths=[s.ENEMY_ART,s.SHIELD_ART,...[...new Set(s.STAGES.map(v=>s.enemyArt(v.bossName)))]];return await Promise.all(paths.map(async path=>{const img=new Image();img.src=new URL(path,location.href);await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return {path,alpha:ctx.getImageData(0,0,1,1).data[3]}}))});
 expect(data.every(i=>i.alpha===0)).toBe(true);expect(data.every(i=>i.path.startsWith('./assets/'))).toBe(true);
});
test('chapter two final result saves ten stages and returns home after the ending',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('heroLegendProgress_v1'))localStorage.setItem('heroLegendProgress_v1',JSON.stringify({version:1,completed:9}))});
 // A weakened final-boss fixture checks the complete result/ending boundary, not battle balance.
 await page.route('**/hero/engine.mjs?*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('spawned:0,nextSpawn:6','spawned:STAGES[level-1].enemyCount,nextSpawn:0').replace('const hp=boss?stage.bossHp:','const hp=boss?1:').replace('lane,x:.94,hp','lane,x:.22,hp')})});
 await page.goto('/hero/');await page.locator('#startBtn').click();await expect(page.locator('#storyTitle')).toHaveText('義救董卓');await page.locator('#storySkip').click();await page.locator('#bossIntroContinue').click();await page.locator('[data-hero="guanyu"]').click();await page.locator('.lane[data-lane="1"]').click();
 await expect(page.locator('#resultTitle')).toHaveText('烽火與義氣',{timeout:15000});expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')).completed)).toBe(10);
 await page.locator('#resultNext').click();await page.locator('#campContinue').click();await expect(page.locator('#storyLine')).toContainText('張角敗退');await page.locator('#storySkip').click();await expect(page.locator('#homeProgress')).toContainText('第二章完成');await page.reload();await expect(page.locator('#homeProgress')).toContainText('第二章完成');
});
