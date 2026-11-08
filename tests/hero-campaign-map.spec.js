const {test,expect}=require('@playwright/test');
for(const viewport of [{width:390,height:844},{width:768,height:1024},{width:1024,height:768}])test(`battle map opens without obscuring controls at ${viewport.width}x${viewport.height}`,async({page})=>{
 await page.setViewportSize(viewport);await page.goto('/hero/');await page.locator('#startBtn').click();await page.locator('#storySkip').click();
 await expect(page.locator('#battleMapPlace')).toHaveText('涿縣・桃園');await page.locator('#battleMapButton').click();
 await expect(page.locator('#campaignMapDialog')).toBeVisible();await expect(page.locator('#pauseBtn')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#campaignMapLocation')).toContainText('涿縣');
 expect(await page.locator('#campaignMapDialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await page.locator('#campaignMapClose').click();await expect(page.locator('#pauseBtn')).toHaveAttribute('aria-pressed','false');
 await page.locator('#pauseBtn').click();await page.locator('#battleMapButton').click();await page.keyboard.press('Escape');await expect(page.locator('#pauseBtn')).toHaveAttribute('aria-pressed','true');
});
