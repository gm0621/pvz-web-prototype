const {test,expect}=require('@playwright/test');
test('faction entry offers seasons before levels while first-season attack stays gated',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');
 await expect(page.locator('#season2DefenseBtn,#season2AttackBtn')).toHaveCount(0);
 for(const faction of ['plants','zombies']){
  await page.locator(faction==='plants'?'#plantStartBtn':'#zombieStartBtn').click();
  await expect(page.locator('#seasonPicker')).toBeVisible();await expect(page.locator('#levelGrid')).toBeHidden();
  await expect(page.locator('#seasonPicker [data-season-choice]')).toHaveCount(2);
  await expect(page.locator('[data-season-choice="1"] .season-name')).toHaveText('蜀國篇．屍潮來襲');
  await page.locator('[data-season-choice]').evaluateAll(buttons=>Promise.all(buttons.map(async button=>{const src=getComputedStyle(button).backgroundImage.match(/url\("?([^"\)]+)/)?.[1];if(!src||src.includes('undefined'))throw Error('Missing season artwork');const image=new Image();image.src=src;await image.decode()})));
  if(faction==='zombies')await expect(page.locator('[data-season-choice="1"]')).toBeDisabled();
  else await expect(page.locator('[data-season-choice="1"]')).toBeEnabled();
  await page.locator('[data-season-choice="2"]').click();await expect(page.locator('#seasonPicker')).toBeHidden();await expect(page.locator('#chosenFactionText')).toContainText('第二季');
  await expect(page.locator('#levelGrid button:disabled')).toHaveCount(9);
  await page.locator('#backFactionBtn').click();await expect(page.locator('#seasonPicker')).toBeVisible();
  await page.locator('#backFactionBtn').click();await expect(page.locator('#start')).toHaveClass(/active/);
 }
 await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();await page.locator('#levelGrid button').first().click();await expect(page.locator('#storyDialog')).toBeVisible();await page.locator('#storySkip').click();await expect(page.locator('#game')).toHaveClass(/active/); expect(await page.evaluate(()=>state.season)).toBe(1);
});
test('browser back follows levels to seasons to home',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');
 await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="2"]').click();await page.goBack();
 await expect(page.locator('#seasonPicker')).toBeVisible();await page.goBack();await expect(page.locator('#start')).toHaveClass(/active/);
});
test('browsing another season preserves and resumes the paused battle',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');
 await page.locator('#zombieStartBtn').click();await page.locator('[data-season-choice="2"]').click();await page.locator('#levelGrid button').first().click();
 await page.locator('#storySkip').click();await page.locator('#cards .card').first().click();await page.locator('.cell[data-r="2"][data-c="8"]').click();await page.locator('#backBtn').click();
 const saved=await page.evaluate(()=>localStorage.getItem(BATTLE_SAVE_KEY));
 await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();expect(await page.evaluate(()=>localStorage.getItem(BATTLE_SAVE_KEY))).toBe(saved);
 await page.locator('#resumeBattleLevelBtn').click();await expect(page.locator('#game')).toHaveClass(/active/);
 expect(await page.evaluate(()=>({season:state.season,faction:state.faction,paused:state.paused}))).toEqual({season:2,faction:'zombies',paused:true});
 await page.locator('#gameFloatBackBtn').click();await expect(page.locator('#levelGrid')).toBeVisible();await expect(page.locator('#seasonPicker')).toBeHidden();
});
