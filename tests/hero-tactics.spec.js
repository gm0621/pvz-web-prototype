const {test,expect}=require('@playwright/test');
test('completed stages can be replayed and a deployed hero can change lanes',async({page},testInfo)=>{
 await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({version:1,completed:3})));
 await page.goto('/hero/');await page.locator('#chapterPicker').evaluate(e=>e.open=true);await page.locator(`#chapterTabs button[data-chapter="${1}"]`).click();await page.locator('#chapterDots button').nth(2).click();
 await expect(page.locator('#storyTitle')).toHaveText('大興山迎敵');await page.locator('#storySkip').click();
 const card=page.locator('[data-hero="zhangfei"]');await card.click();await page.locator('.lane[data-lane="1"]').click();
 await expect(card).toBeEnabled();await card.click();await page.locator('.lane[data-lane="2"]').click();
 await expect(page.locator('.ally[data-kind="zhangfei"]')).toHaveAttribute('data-lane','2');
 await page.locator('.ally[data-kind="zhangfei"]').click();await page.locator('button[data-order="hold"]').click();await expect(page.locator('#orderStatus')).toContainText('駐守');
 await page.locator('button[data-order="forward"]').click();await expect(page.locator('#orderStatus')).toContainText('前進中');
 await page.locator('button[data-order="back"]').click();await expect(page.locator('#orderStatus')).toContainText('後退中');
 await page.screenshot({path:testInfo.outputPath('focused-battle.png')});
 expect(await page.locator('#cards').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
 expect(await page.evaluate(()=>document.body.classList.contains('battle-focus'))).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')).completed)).toBe(3);
 await page.locator('#battle [data-home]').click();await expect(page.locator('body')).not.toHaveClass(/battle-focus/);
 await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
});
