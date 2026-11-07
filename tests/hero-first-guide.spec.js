const {test,expect}=require('@playwright/test');
test('first battle teaches deployment, selection, movement and hold with optional dismissal',async({page},info)=>{
 await page.goto('/hero/');await page.locator('#startBtn').click();await page.locator('#storySkip').click();
 await expect(page.locator('#firstGuide')).toHaveAttribute('data-step','0');
 await page.locator('[data-hero=zhangfei]').click();await expect(page.locator('#firstGuide')).toHaveAttribute('data-step','1');
 await page.locator('.lane').nth(1).click();await expect(page.locator('#firstGuide')).toHaveAttribute('data-step','2');
 const unit=page.locator('.ally[data-kind=zhangfei]');const x=await unit.evaluate(el=>el.style.left);await page.waitForTimeout(700);expect(await unit.evaluate(el=>el.style.left)).toBe(x);
 await unit.click();await expect(page.locator('#firstGuide')).toHaveAttribute('data-step','3');
 const field=await page.locator('#field').boundingBox();await page.mouse.click(field.x+field.width*.45,field.y+field.height*.5);await expect(page.locator('#firstGuide')).toHaveAttribute('data-step','4');
 await expect.poll(()=>unit.evaluate(el=>el.style.left)).not.toBe(x);await unit.click();await expect(page.locator('#firstGuide')).toHaveAttribute('data-step','5');await expect(unit).toHaveClass(/holding/);
 await page.screenshot({path:info.outputPath('guide-complete.png')});await page.locator('#guideDismiss').click();await expect(page.locator('#firstGuide')).toBeHidden();expect(await page.locator('.guide-target').count()).toBe(0);
});
test('guide can be skipped immediately and does not appear in stage two',async({page})=>{
 await page.goto('/hero/');await page.locator('#startBtn').click();await page.locator('#storySkip').click();await page.locator('#guideDismiss').click();await expect(page.locator('#firstGuide')).toBeHidden();
 await page.evaluate(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({version:1,completed:1})));await page.reload();await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('#firstGuide')).toBeHidden();
});
