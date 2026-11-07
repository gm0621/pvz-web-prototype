const {test,expect}=require('@playwright/test');
async function open(page){await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto('/');await page.waitForFunction(()=>authIdentityResolved)}
test('home has exactly two adventures for new and returning players',async({page})=>{
 await open(page);
 for(const returning of [false,true]){
  if(returning)await page.evaluate(()=>{completeCampaignLevel('plants',1,1);saveProfile(false,false);backToHome()});
  await expect(page.locator('#start .mode-banner:visible')).toHaveCount(2);
  await expect(page.locator('#zombieCampaignBtn')).toBeVisible();await expect(page.locator('#romanceStartBtn')).toBeVisible();
  await expect(page.locator('#newPlayerStartBtn')).toBeHidden();await expect(page.locator('#plantStartBtn')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('zombie adventure retains first-battle and campaign routes, back returns to two modes',async({page})=>{
 await open(page);await page.locator('#zombieCampaignBtn').click();
 await expect(page.locator('[data-new-player-start]:visible')).toHaveCount(1);await expect(page.locator('#romanceStartBtn')).toBeHidden();
 await page.locator('#homeModeBackBtn').click();await expect(page.locator('#start .mode-banner:visible')).toHaveCount(2);
 await page.evaluate(()=>{completeCampaignLevel('plants',1,1);saveProfile(false,false);backToHome()});
 await page.locator('#zombieCampaignBtn').click();await expect(page.locator('#plantStartBtn')).toBeVisible();await expect(page.locator('#zombieStartBtn')).toBeVisible();
 await page.locator('#plantStartBtn').click();await expect(page.locator('#seasonPicker')).toBeVisible();
 await page.locator('#backFactionBtn').click();await expect(page.locator('#start .mode-banner:visible')).toHaveCount(2);
});
test('romance enters its own chapter and shared utilities remain reachable',async({page})=>{
 await open(page);await page.locator('#romanceStartBtn').click();await expect(page.locator('#campaignHeading')).toHaveText('第一章・桃園結義');
 await page.locator('#backFactionBtn').click();await expect(page.locator('#zombieCampaignBtn')).toBeFocused();
 await page.locator('#charactersBtn').click();await expect(page.locator('#characters')).toHaveClass(/active/);
});
