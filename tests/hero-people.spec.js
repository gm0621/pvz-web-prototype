const {test,expect}=require('@playwright/test');
test('people book: portraits, aliases, filters, readable cards and unchanged save',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const save={completed:28,coins:123,weapons:{liubei:2},inventory:{grain:3}};
 await page.addInitScript(s=>{if(!localStorage.getItem('heroLegendProgress_v1'))localStorage.setItem('heroLegendProgress_v1',JSON.stringify(s))},save);
 await page.goto('/hero/people.html');await expect(page.locator('.person-card')).toHaveCount(71);
 const broken=await page.locator('main').evaluate(async e=>{const urls=new Set();for(const n of e.querySelectorAll('img')){urls.add(n.src);const bg=getComputedStyle(n).backgroundImage.match(/url\(["']?(.*?)["']?\)/);if(bg)urls.add(bg[1])}return (await Promise.all([...urls].map(src=>new Promise(r=>{const i=new Image();i.onload=()=>r(null);i.onerror=()=>r(src);i.src=src})))).filter(Boolean)});expect(broken).toEqual([]);
 await page.locator('#peopleSearch').fill('盧公');await expect(page.locator('.person-card h2')).toHaveText('盧植');await page.locator('summary').click();await expect(page.locator('.memory')).toContainText('老師');await expect(page.locator('.stage-pills')).toContainText('第 7 關');
 await page.locator('#peopleSearch').fill('劉協');await expect(page.locator('.person-card h2')).toHaveText('漢獻帝');await page.locator('summary').click();await expect(page.locator('.stage-pills')).toContainText('第 29 關');await page.screenshot({path:info.outputPath('people-search.png'),fullPage:true});
 await page.locator('#clearSearch').click();await page.locator('[data-kind="遊戲原創"]').click();await expect(page.locator('.person-card')).toHaveCount(5);await expect(page.locator('.kind-tag')).toHaveText(Array(5).fill('遊戲原創（虛構人物）'));
 await page.locator('[data-kind="演義人物"]').click();await expect(page.locator('.person-card')).toHaveCount(2);await page.locator('#peopleSearch').fill('沒有這個名字');await expect(page.locator('#peopleEmpty')).toBeVisible();await page.locator('#clearSearch').click();await expect(page.locator('.person-card')).toHaveCount(71);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const l of [page.locator('#clearSearch'),page.locator('summary').first(),page.locator('[data-kind=all]')]){const b=await l.boundingBox();expect(b.height).toBeGreaterThanOrEqual(44);expect(b.width).toBeGreaterThanOrEqual(44)}
 await page.screenshot({path:info.outputPath('people-home.png')});await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')))).toEqual(save);expect(errors).toEqual([]);
});
test('game opens book separately and retains chapter six story',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({completed:28,coins:321})));
 await page.goto('/hero/');const popupPromise=page.waitForEvent('popup');await page.locator('#home .people-link').click();const popup=await popupPromise;await expect(popup.locator('.person-card')).toHaveCount(71);await popup.close();await page.locator('#startBtn').click();await expect(page.locator('#storyTitle')).toHaveText('洛陽接駕');
 const link=page.locator('#storyPrologue .people-link');await link.scrollIntoViewIfNeeded();expect(await link.evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e})).toBe(true);await expect(link).toHaveAttribute('target','_blank');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')).completed)).toBe(28);
});
test('book matches named atlas cells and narrative appearances, excluding source-only names',async({page})=>{
 await page.goto('/hero/people.html');
 for(const [name,row,col] of [['漢獻帝',0,0],['袁術',0,1],['典韋',0,2],['曹昂',1,0],['曹安民',1,1],['賈詡',1,2],['郭嘉',2,0],['荀攸',2,1],['棗祗',2,2]]){
  await page.locator('#peopleSearch').fill(name);const card=page.locator(`[data-person="${name}"]`);await expect(card.locator('img')).toHaveAttribute('alt',name);expect(await card.locator('img').evaluate(e=>e.style.backgroundPosition)).toBe(`${col*50}% ${row*50}%`);expect(await card.locator('img').evaluate(e=>e.style.backgroundImage)).toContain('portraits/chapter-six.png');
 }
 for(const [name,yes,no] of [['張角',1,34],['盧植',8,34],['典韋',31,34],['呂布',34,30]]){await page.locator('#peopleSearch').fill(name);const card=page.locator(`[data-person="${name}"]`);await card.locator('summary').click();await expect(card.locator('.stage-pills span').filter({hasText:new RegExp(`^第 ${yes} 關$`)})).toHaveCount(1);await expect(card.locator('.stage-pills span').filter({hasText:new RegExp(`^第 ${no} 關$`)})).toHaveCount(0)}
 await page.locator('#peopleSearch').fill('賈詡');await page.locator('[data-person="賈詡"] summary').click();await expect(page.locator('[data-person="賈詡"] .stage-pills')).toHaveText('第 35 關');
});
