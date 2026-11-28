const {expectExpressionPortrait}=require('./support/hero-portraits.cjs');
const {test,expect}=require('@playwright/test');
const gameEntry=process.env.HERO_PEOPLE_ENTRY||'/hero/';
const peopleEntry=gameEntry+'people.html'+(process.env.HERO_PEOPLE_VERSION?'?v='+process.env.HERO_PEOPLE_VERSION:'');
test('people book: portraits, aliases, filters, readable cards and unchanged save',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const save={completed:28,coins:123,weapons:{liubei:2},inventory:{grain:3}};
 await page.addInitScript(s=>{if(!localStorage.getItem('heroLegendProgress_v1'))localStorage.setItem('heroLegendProgress_v1',JSON.stringify(s))},save);
 await page.goto(peopleEntry);await expect(page.locator('.person-card')).toHaveCount(155);
 const {PEOPLE}=await import('../hero/people-data.mjs');
 const expectedOrder=PEOPLE.slice().sort((a,b)=>a.levels[0]-b.levels[0]).map(person=>person.name);
 await expect(page.locator('.person-name')).toHaveText(expectedOrder);
 const stories=await page.locator('.person-card').evaluateAll(cards=>cards.map(card=>({
  name:card.dataset.person,
  headings:[...card.querySelectorAll('.person-story-scene h3')].map(heading=>heading.textContent),
  category:card.querySelector('.kind-tag').textContent,
  storyType:card.querySelector('button[aria-controls$="-history"]').textContent
 })));
 expect(stories.every(person=>person.headings.length>=2)).toBe(true);
 const storyTypes={
  '史實人物':'詳細歷史',
  '演義人物':'演義故事',
  '遊戲原創（虛構人物）':'遊戲故事'
 };
 expect(stories.every(person=>storyTypes[person.category]===person.storyType)).toBe(true);
 await expect(page.locator('.era-heading').first()).toHaveText('184 年 · 桃園同心');
 await expect(page.locator('.era-heading').last()).toHaveText('304 年 · 長安西行');
 const portraits=await page.locator('.person-card img').evaluateAll(async images=>{
  return Promise.all(images.map(async img=>{
   img.loading='eager';
   await img.decode();
   return {name:img.alt,url:img.getAttribute('src'),width:img.naturalWidth,height:img.naturalHeight};
  }));
 });
 const {expressionPortrait}=await import('../hero/portrait-expressions.mjs');
 expect(new Set(portraits.map(p=>p.url)).size).toBe(155);
 for(const portrait of portraits){
  expect(portrait.url).toBe(expressionPortrait(portrait.name));
  expect([portrait.width,portrait.height]).toEqual([320,320]);
 }
 await page.locator('#peopleSearch').fill('盧公');await expect(page.locator('.person-card .person-name')).toHaveText('盧植');await page.locator('button[aria-controls$="-history"]').click();await expect(page.locator('.memory')).toContainText('老師');await expect(page.locator('.stage-pills')).toContainText('第 7 關');await page.locator('.person-dialog[open] .person-dialog-close').click();
 await page.locator('#peopleSearch').fill('劉協');await expect(page.locator('.person-card .person-name')).toHaveText('漢獻帝');await page.locator('button[aria-controls$="-history"]').click();await expect(page.locator('.appearance-timeline li').filter({hasText:'迎駕與下邳'})).toContainText('第 29 關');await page.screenshot({path:info.outputPath('people-search.png'),fullPage:true});await page.locator('.person-dialog[open] .person-dialog-close').click();
 await page.locator('#clearSearch').click();await page.locator('[data-kind="遊戲原創"]').click();await expect(page.locator('.person-card')).toHaveCount(5);await expect(page.locator('.kind-tag')).toHaveText(Array(5).fill('遊戲原創（虛構人物）'));
 await page.locator('[data-kind="演義人物"]').click();await expect(page.locator('.person-card')).toHaveCount(2);await page.locator('#peopleSearch').fill('沒有這個名字');await expect(page.locator('#peopleEmpty')).toBeVisible();await page.locator('#clearSearch').click();await expect(page.locator('.person-card')).toHaveCount(155);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const l of [page.locator('#clearSearch'),page.locator('button[aria-controls$="-history"]').first(),page.locator('[data-kind=all]')]){const b=await l.boundingBox();expect(b.height).toBeGreaterThanOrEqual(44);expect(b.width).toBeGreaterThanOrEqual(44)}
 await page.screenshot({path:info.outputPath('people-home.png')});await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')))).toEqual(save);expect(errors).toEqual([]);
});
test('game opens book separately and retains chapter six story',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({completed:28,coins:321})));
 await page.goto(gameEntry);const popupPromise=page.waitForEvent('popup');await page.locator('#home .people-link').click();const popup=await popupPromise;await expect(popup.locator('.person-card')).toHaveCount(155);await popup.close();await page.locator('#startBtn').click();await expect(page.locator('#storyTitle')).toHaveText('洛陽接駕');
 await page.locator('#storyMore').click();
 const link=page.locator('#storyDetails').getByRole('link',{name:/人物圖鑑/});await link.scrollIntoViewIfNeeded();expect(await link.evaluate(e=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e})).toBe(true);await expect(link).toHaveAttribute('target','_blank');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')).completed)).toBe(28);
});
test('book matches named portraits and narrative appearances, excluding source-only names',async({page})=>{
 await page.goto(peopleEntry);
 for(const name of ['漢獻帝','袁術','典韋','曹昂','曹安民','賈詡','郭嘉','荀攸','棗祗']){
  await page.locator('#peopleSearch').fill(name);
  await expectExpressionPortrait(page.locator(`[data-person="${name}"] img`),name);
 }
 for(const [name,yes,no] of [['張角',1,34],['盧植',8,34],['典韋',31,34],['呂布',34,30]]){await page.locator('#peopleSearch').fill(name);const card=page.locator(`[data-person="${name}"]`);await card.locator('button[aria-controls$="-history"]').click();await expect(card.locator('.stage-pills span').filter({hasText:new RegExp(`^第 ${yes} 關$`)})).toHaveCount(1);await expect(card.locator('.stage-pills span').filter({hasText:new RegExp(`^第 ${no} 關$`)})).toHaveCount(0);await card.locator('.person-dialog[open] .person-dialog-close').click()}
 await page.locator('#peopleSearch').fill('賈詡');await page.locator('[data-person="賈詡"] button[aria-controls$="-history"]').click();await expect(page.locator('[data-person="賈詡"] .stage-pills span')).toHaveText(['第 35 關','第 64 關']);
});

test('people book story and skill dialogs preserve the timeline and disclose the sources',async({page,hasTouch},info)=>{
 await page.goto(peopleEntry);
 await expect(page.locator('.era-heading').first()).toHaveText('184 年 · 桃園同心');
 const marks=await page.evaluate(()=>{
  const root=document.getElementById('peopleGrid');
  return [root,root.querySelector('.era-heading')].map(element=>getComputedStyle(element,'::before').content);
 });
 expect(marks).toEqual(['""','""']);
 await expect(page.locator('.person-card dialog[open]')).toHaveCount(0);
 await page.locator('#peopleSearch').fill('劉備');
 const card=page.locator('[data-person="劉備"]');
 const history=card.getByRole('button',{name:'詳細歷史'}),skills=card.getByRole('button',{name:'遊戲技能'});
 const tap=locator=>hasTouch?locator.tap():locator.click();
 await history.scrollIntoViewIfNeeded();
 const cardBounds=await card.boundingBox();
 const scroll=await page.evaluate(()=>scrollY);
 await tap(history);
 const dialog=page.getByRole('dialog',{name:'劉備'});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('heading',{name:'從一雙草鞋說起'})).toBeVisible();
 const records=dialog.getByText('史料與登場關卡',{exact:true}),notes=dialog.locator('.history-notes');
 await expect(notes).toBeHidden();
 await page.screenshot({path:info.outputPath('book-story-dialog.png')});
 await tap(records);
 await expect(notes.locator('.history-events').first()).toContainText('盧植');
 const source=dialog.getByRole('link',{name:'《三國志・先主傳》',exact:true}).first();
 await expect(source).toHaveAttribute('href',/卷32/);
 if(process.env.HERO_PEOPLE_ENTRY){
  const sourcePopup=page.waitForEvent('popup');
  await tap(source);
  const sourceTab=await sourcePopup;
  await sourceTab.waitForURL(/zh\.wikisource\.org/);
  await sourceTab.close();
  await expect(dialog).toBeVisible();
 }
 const content=dialog.locator('.person-dialog-content');
 await content.evaluate(element=>element.scrollTop=element.scrollHeight);
 expect(await content.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
 expect(await page.evaluate(()=>scrollY)).toBe(scroll);
 await expect(dialog.getByRole('button',{name:'關閉'})).toBeInViewport();
 await tap(dialog.getByText(/^更多史料/));
 await expect(notes.locator('.history-events').nth(1)).toBeVisible();
 if(hasTouch)await tap(dialog.getByRole('button',{name:'關閉'}));
 else await page.keyboard.press('Escape');
 await expect(dialog).toBeHidden();
 await expect(history).toBeFocused();
 expect(await page.evaluate(()=>scrollY)).toBe(scroll);
 expect((await card.boundingBox()).height).toBe(cardBounds.height);
 await tap(skills);
 await expect(dialog.locator('.skill-list')).toContainText('被動');
 await expect(dialog.locator('.history-notes')).toHaveCount(0);
 await tap(dialog.getByRole('button',{name:'關閉'}));
 await expect(skills).toBeFocused();
 await page.locator('#peopleSearch').fill('石魁');
 const original=page.locator('[data-person="石魁"]');
 await tap(original.getByRole('button',{name:'遊戲故事'}));
 await expect(original.locator('.kind-tag')).toHaveText('遊戲原創（虛構人物）');
 const fictionalStory=page.getByRole('dialog',{name:'石魁'});
 await expect(fictionalStory.getByRole('heading',{name:'路上像多了一扇大門'})).toBeVisible();
 await tap(fictionalStory.getByText('故事背景與登場關卡',{exact:true}));
 await expect(fictionalStory.locator('.note')).toBeVisible();
 await expect(fictionalStory.locator('.history-events')).toHaveCount(0);
 await tap(fictionalStory.getByRole('button',{name:'關閉'}));
 await page.locator('#peopleSearch').fill('鄧茂');
 const novel=page.locator('[data-person="鄧茂"]');
 await tap(novel.getByRole('button',{name:'演義故事'}));
 await expect(novel.getByRole('heading',{name:'演義裡，黃巾前鋒來了'})).toBeVisible();
 await expect(novel.locator('.history-events')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
