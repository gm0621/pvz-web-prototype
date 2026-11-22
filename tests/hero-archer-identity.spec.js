const {test,expect}=require('@playwright/test');
for(const [level,faction,row] of [[1,'shu',null],[18,'cao',1],[20,'sun',2]])test(`${faction}: distinct archer identity and general`,async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/hero/test.html?testStage=${level}&testLevel=1&testMode=battle&testLessons=0`);
 if(level===18){await page.locator('[data-choose=caohong]').click();await page.locator('[data-choose=xiahouyuan]').click();await expect(page.locator('#deployment [data-preview="xiahouyuan:active:1"]')).toHaveCount(1);await page.locator('#deploymentStart').click()}
 await expect(page.locator('#battle')).toBeVisible({timeout:30000});
 if(level===1){const skip=page.locator('#firstGuideSkip');if(await skip.isVisible())await skip.click()}
 await page.locator('[data-hero=archer]').click();await page.locator('.lane').first().click();
 const troop=page.locator('.ally[data-kind=archer]');await expect(troop).toHaveCount(1);
 if(row===null)await expect(troop.locator('img').first()).toHaveAttribute('src',/shu-archer/);
 else {await expect(troop.locator('.attack-sprite')).toHaveCSS('background-image',/archer-identity/);await expect(page.locator('[data-hero=archer] img')).toHaveCSS('background-position',`0% ${row*50}%`)}
 if(level===18){await page.locator('[data-hero=zhangfei]').click();await page.locator('.lane').nth(1).click();const hero=page.locator('.ally[data-kind=zhangfei]');await expect(hero).toContainText('夏侯淵');await expect(hero.locator('.attack-sprite')).toHaveCSS('background-image',/archer-identity/);await expect(hero.locator('.attack-sprite')).toHaveCSS('background-position','0% 0%')}
 await page.screenshot({path:info.outputPath(faction+'.png')});expect(errors).toEqual([]);
});
