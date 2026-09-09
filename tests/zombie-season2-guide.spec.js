const {test,expect}=require('@playwright/test');
const names=['棺盾小屍','裂盾斧屍','煙罐小屍','鉤鎖屍卒','縫屍醫官','斷旗咒屍','替身偶屍','陷城屍督','鼠牙群屍','腐釘弩屍','毒囊噴屍','破門撞屍'];
test('season-two zombie preview is separate, complete and never changes playable rosters',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto('/');
 const before=await page.evaluate(()=>JSON.stringify({plants:PLANT_TYPES,zombies:ZOMBIE_TYPES,profile:playerProfile,storage:{...localStorage}}));
 await page.locator('#charactersBtn').click();await page.locator('[data-roster=zombies]').click();
 await expect(page.locator('#zombieSeasonTabs')).toBeVisible();
 await expect(page.locator('#characterGrid .char-profile')).toHaveCount(12);
 await page.locator('[data-zombie-season="2"]').click();
 await expect(page.locator('[data-roster=zombies]')).toHaveClass(/primary/);
 await expect(page.locator('[data-zombie-season="2"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#zombieSeasonIntro')).toContainText('尚未開放出戰');
 await expect(page.locator('#zombieSeasonIntro')).toContainText('12 位');
 await expect(page.locator('.zombie2-profile')).toHaveCount(12);
 await expect(page.locator('#characterGrid h3')).toHaveText(names);
 await page.locator('.zombie2-profile img').evaluateAll(ims=>Promise.all(ims.map(im=>im.decode())));
 expect(await page.locator('.zombie2-profile img').evaluateAll(ims=>ims.every(im=>im.naturalWidth===1024&&im.naturalHeight===1024))).toBe(true);
 for(let i=0;i<names.length;i++){
  const card=page.locator('.zombie2-profile').nth(i);await expect(card).toContainText('第二季預告');await card.focus();await card.press('Enter');
  await expect(page.locator('#charModalName')).toHaveText(names[i]);await expect(page.locator('#charModalRole')).toContainText('僵屍方｜第二季');
  await expect(page.locator('#charModalSkill')).toContainText('天賦：');await expect(page.locator('#charModalStats')).toContainText(['棺盾小屍','鼠牙群屍','腐釘弩屍'].includes(names[i])?'第一關':names[i]==='裂盾斧屍'?'第二關':'尚未開放出戰');
  await expect(page.locator('#charModalRange')).toBeHidden();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#charModalClose').click();
 }
 await page.locator('[data-zombie-season="1"]').click();await expect(page.locator('#characterGrid .char-profile')).toHaveCount(12);
 await expect(page.locator('.zombie2-profile')).toHaveCount(0);await page.locator('#characterGrid .type-normal').click();
 await expect(page.locator('#charModalRange')).toBeVisible();await expect(page.locator('#charModalStatsTitle')).toHaveText('能力數值');await page.locator('#charModalClose').click();
 await page.locator('[data-roster=wei]').click();await expect(page.locator('#zombieSeasonTabs')).toBeHidden();await expect(page.locator('#zombieSeasonIntro')).toBeHidden();
 await expect(page.locator('.wei-profile')).toHaveCount(12);await page.locator('.wei-profile').first().click();await expect(page.locator('#charModalRole')).toContainText('魏國');await expect(page.locator('#charModal')).not.toHaveClass(/zombie2-preview/);await page.locator('#charModalClose').click();
 await page.locator('[data-roster=plants]').click();await expect(page.locator('.zombie2-profile')).toHaveCount(0);await expect(page.locator('#characterRosterIntro')).toBeHidden();
 expect(await page.evaluate(()=>JSON.stringify({plants:PLANT_TYPES,zombies:ZOMBIE_TYPES,profile:playerProfile,storage:{...localStorage}}))).toBe(before);
 expect(await page.evaluate(()=>ZOMBIE_SEASON2_GUIDE.some(d=>d.key in ZOMBIE_TYPES||d.key in PLANT_TYPES))).toBe(false);
 expect(errors).toEqual([]);
});
