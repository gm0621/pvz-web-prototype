const { test, expect } = require('@playwright/test');

const names = ['屯田兵','大盾兵','強弩兵','長戟兵','夏侯惇','典韋','許褚','張遼','徐晃','郭嘉','司馬懿','曹操'];

test('Wei preview guide has separate Shu Wei zombie tabs and cannot change the playable roster', async ({page}) => {
  const errors=[];
  page.on('pageerror', error=>errors.push(error.message));
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', route=>route.fulfill({contentType:'application/javascript',body:''}));
  await page.goto('/?wei-guide-test');
  const before=await page.evaluate(()=>JSON.stringify({plants:PLANT_TYPES,zombies:ZOMBIE_TYPES,order:UNIT_ORDER,unlocks:UNLOCK_LEVEL,levels:LEVELS,profile:playerProfile}));
  await page.locator('#charactersBtn').click();
  await expect(page.locator('#characters [data-roster]')).toHaveText(['蜀國','魏國','僵屍方']);
  const shuNames=await page.locator('#characterGrid h3').allTextContents();
  await page.getByRole('button',{name:'魏國',exact:true}).click();
  await expect(page.locator('[data-roster="wei"]')).toHaveClass(/active/);
  await expect(page.locator('[data-roster="wei"]')).toHaveClass(/primary/);
  await expect(page.locator('[data-roster="plants"]')).not.toHaveClass(/primary/);
  await expect(page.locator('#characterGrid h3')).toHaveText(names);
  await expect(page.locator('#characterRosterIntro')).toContainText('第二季預告');
  await expect(page.locator('#characterRosterIntro')).toContainText('尚未開放出戰');
  await expect(page.locator('#characterGrid .costline, #characterGrid .hp-line, #characterGrid .locked')).toHaveCount(0);
  const cards=page.locator('#characterGrid .wei-profile');
  await expect(cards).toHaveCount(12);
  for(let i=0;i<names.length;i++){
    const card=cards.nth(i);
    await expect(card.locator('.ability-summary')).toContainText('天賦');
    await expect(card.locator('img')).toHaveJSProperty('naturalWidth',1024);
    await card.click();
    await expect(page.locator('#charModal')).toHaveClass(/show/);
    await expect(page.locator('#charModalName')).toHaveText(names[i]);
    await expect(page.locator('#charModalRole')).toContainText('魏國');
    await expect(page.locator('#charModalSkill')).toContainText('天賦');
    await expect(page.locator('#charModalStats')).toContainText('尚未開放出戰');
    await expect(page.locator('#charModalRange')).toBeHidden();
    await expect(page.locator('#charModalStats')).not.toContainText('下一級');
    if(i>=4) await expect(page.locator('#charModalSkill')).toContainText('機率技能');
    expect(await page.locator('.char-detail-card').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await page.locator('#charModalClose').click();
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'僵屍方',exact:true}).click();
  await expect(page.locator('#characterGrid .wei-profile')).toHaveCount(0);
  await expect(page.locator('#characterGrid .type-qinEmperor')).toHaveCount(1);
  await page.getByRole('button',{name:'蜀國',exact:true}).click();
  await expect(page.locator('#characterGrid h3')).toHaveText(shuNames);
  await page.locator('#characterGrid .char-profile').first().click();
  await expect(page.locator('#charModalRange')).toBeVisible();
  await expect(page.locator('#charModalRole')).toContainText('蜀國');
  await expect(page.locator('#charModalStats')).toContainText('生命值');
  await page.locator('#charModalClose').click();
  const after=await page.evaluate(()=>JSON.stringify({plants:PLANT_TYPES,zombies:ZOMBIE_TYPES,order:UNIT_ORDER,unlocks:UNLOCK_LEVEL,levels:LEVELS,profile:playerProfile}));
  expect(after).toBe(before);
  await page.locator('#charactersFloatBackBtn').click();
  await expect(page.locator('#start')).toHaveClass(/active/);
  expect(errors).toEqual([]);
});
