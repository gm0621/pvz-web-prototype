const {test,expect}=require('@playwright/test');
test('short background introduction precedes dialogue and can be skipped into battle',async({page},info)=>{
 await page.goto('/hero/');await page.locator('#startBtn').click();await expect(page.locator('#storyPrologue')).toBeVisible();await expect(page.locator('#prologueEra')).toContainText('184');await expect(page.locator('#prologueHistory')).toContainText('黃巾');await expect(page.locator('#prologueStory')).toContainText('三國演義');await expect(page.locator('.scene-dialogue')).toBeHidden();
 await page.screenshot({path:info.outputPath('background-intro.png')});await page.locator('#prologueContinue').click();await expect(page.locator('#storyPrologue')).toBeHidden();await expect(page.locator('#storySpeaker')).toBeVisible();await expect(page.locator('#storySpeaker')).toHaveText('張飛');await page.locator('#storyNext').click();await expect(page.locator('#storySpeaker')).toHaveText('劉備');
 await page.locator('#story [data-home]').click();await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('#field')).toBeVisible();
});
test('chapter-two introduction explains prior events and the present mission',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({version:1,completed:6})));
 await page.goto('/hero/');await page.locator('#startBtn').click();await expect(page.locator('#storyPrologue')).toBeVisible();await expect(page.locator('#prologueStory')).toContainText('青州');await expect(page.locator('#prologueLead')).toContainText('盧植');await page.locator('#prologueContinue').click();await expect(page.locator('#storyLine')).toContainText('廣宗');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
