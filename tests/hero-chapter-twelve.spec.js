const {test,expect}=require('@playwright/test');
const KEY='heroLegendProgress_v1';

test('chapter twelve continues from the prior chapter camp through all six stages',async({page})=>{
 test.setTimeout(210000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(key=>{
  if(!localStorage.getItem(key)){
   const skillSeen=['caocao','xiahoudun','caohong','caoren','xiahouyuan','yujin'].flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level));
   localStorage.setItem(key,JSON.stringify({completed:64,coins:100,inventory:{grain:2},armyWeapons:{cao:{liubei:2}},skillSeen}));
  }
  const write=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,value){if(k===key&&window.blockSave)throw Error('test quota');return write.call(this,k,value)};
  Element.prototype.requestFullscreen=undefined;
 },KEY);
 await page.route('**/hero/engine.mjs?*',async route=>{
  const response=await route.fetch();
  const body=(await response.text()).replace('return {level,mission:','return window.chapterBattle={level,mission:');
  await route.fulfill({response,body});
 });
 await page.clock.install();
 const tap=selector=>page.locator(selector).tap();
 const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
 await page.goto('/hero/');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+600));
 await expect(page.locator('#homeProgress')).toContainText('64 / 106');
 // Revisit the previous finale through the normal chapter picker and complete its mission.
 await page.locator('#chapterPicker').evaluate(e=>e.open=true);
 await tap('#chapterTabs [data-chapter="11"]');
 await tap('#chapterDots [data-level="64"]');
 await tap('#storySkip');
 await tap('#deploymentStart');
 await expect(page.locator('#battle')).toBeVisible({timeout:25000});
 await page.locator('#battleSpeed').selectOption('2');
 await page.evaluate(()=>{window.chapterBattle.bossSpawned=true;window.chapterBattle.nextSpawn=Infinity});
 await tap('#cards [data-hero=liubei]');
 await page.locator('.lane').nth(1).tap({position:{x:40,y:25}});
 await page.clock.runFor(19000);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 await page.clock.runFor(3500);
 await tap('#resultNext');
 await expect(page.locator('#campContinue')).toContainText('第十一章尾聲');
 await tap('#campContinue');
 await expect(page.locator('#storyChapter')).toContainText('第十一章');
 await tap('#storySkip');
 for(const [i,name] of ['長安收隊','鄴城魏公','祁山解圍','散關送糧','陽平關夜進','南鄭迎使'].entries()){
  await expect(page.locator('#storyTitle')).toHaveText(name);
  await expect(page.locator('#storyChapter')).toContainText('第十二章');
  await expect(page.locator('#journeyIntro .map-leader')).toBeVisible();
  await tap('#storyMore');
  await tap('.history-toggle');
  await expect(page.locator('#historyLesson [aria-current=step]')).toHaveCount(1);
  await expect(page.locator('.history-sources a').first()).toHaveAttribute('href',/wikisource/);
  await tap('#storyDetails header button');
  await tap('#storySkip');
  await expect(page.locator('#deployment')).toBeVisible();
  const lanes=i%2?5:4;
  await page.locator('#deployment select').selectOption(String(lanes));
  const chosen=page.locator('#deployment [data-choose][aria-pressed=true]');
  for(let count=await chosen.count();count<lanes;count++)await page.locator('#deployment [data-choose][aria-pressed=false]').first().tap();
  await tap('#deploymentStart');
  await expect(page.locator('#battle')).toBeVisible({timeout:25000});
  await expect(page.locator('.lane')).toHaveCount(lanes);
  await page.locator('#battleSpeed').selectOption('2');
  if(i===4||i===5){
   await tap('#battleMenuButton');
   await tap('#battleMapButton');
   await expect(page.locator('#campaignMapRoute')).toHaveText(i===4?'散關 → 武都 → 陽平關':'陽平關 → 南鄭');
   await expect(page.locator('#campaignMapCanvas .map-opponent')).toHaveAttribute('data-person','張魯');
   const before=await page.evaluate(()=>window.chapterBattle.time);
   await page.clock.runFor(1000);
   expect(await page.evaluate(()=>window.chapterBattle.time)).toBe(before);
   await tap('#campaignMapClose');
   if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
   await page.clock.runFor(100);
   expect(await page.evaluate(()=>window.chapterBattle.time)).toBeGreaterThan(before);
  }
  if(i===5)await page.evaluate(()=>window.blockSave=true);
  // Control waves to isolate the UI and settlement. Mission timing and orders run normally.
  if(i===4){
   await page.evaluate(()=>{window.chapterBattle.spawned=999;window.chapterBattle.nextSpawn=0});
   await page.clock.runFor(100);
   await expect(page.locator('#bossIntroTitle')).toContainText('陽平守軍主將');
   await tap('#bossIntroContinue');
   await page.evaluate(()=>window.chapterBattle.enemies[0].hp=0);
  }else{
   await page.evaluate(()=>{window.chapterBattle.bossSpawned=true;window.chapterBattle.nextSpawn=Infinity});
   for(let lane=0;lane<lanes;lane++){
    await page.evaluate(()=>window.chapterBattle.food=300);
    const slot=['liubei','guanyu','zhangfei','hero4','hero5'][lane];
    await tap(`#cards [data-hero=${slot}]`);
    await page.locator('.lane').nth(lane).tap({position:{x:40,y:25}});
    await page.clock.runFor(200);
   }
   if(i===0||i===3){
    for(let cart=0;cart<3;cart++){
     await page.clock.runFor(7500);
     await expect(page.locator('#missionQuickAction')).toContainText('發送糧車');
     await tap('#missionQuickAction');
    }
   }else await page.clock.runFor(18500);
  }
  await page.clock.runFor(100);
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  if(i===4)expect(await page.evaluate(()=>window.chapterBattle.bossRetreated)).toBe(true);
  if(i===5){
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   expect(await saved()).toMatchObject({completed:69,coins:500});
   await page.evaluate(()=>window.blockSave=false);
   await tap('#resultRetrySave');
  }
  expect(await saved()).toMatchObject({completed:65+i,coins:180+80*i,inventory:{grain:2}});
  await page.clock.runFor(3500);
  while(await page.locator('#skillIntro[open]').isVisible())await tap('#skillIntroContinue');
  await tap('#resultNext');
  await expect(page.locator('#campTitle')).toContainText(name);
  await tap('#campContinue');
  if(i===5){
   await expect(page.locator('#storyChapter')).toContainText('戰後');
   await expect(page.locator('#storyLine')).toContainText('張魯從巴中率部歸降');
   await tap('#storyNext');
   await expect(page.locator('#storySpeaker')).toHaveText('張魯');
   await expect(page.locator('#storyPortrait')).toHaveAttribute('alt','張魯');
  }
  await tap('#storySkip');
 }
 await expect(page.locator('#storyTitle')).toHaveText('宕渠收兵');
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText('70 / 106');
 await page.goto('/hero/people.html');
 await page.locator('#peopleSearch').fill('公祺');
 const card=page.locator('[data-person="張魯"]');
 await expect(card).toContainText('史實人物');
 expect(await card.locator('img').evaluate(img=>img.decode().then(()=>img.naturalWidth))).toBeGreaterThan(0);
 expect(errors).toEqual([]);
});
