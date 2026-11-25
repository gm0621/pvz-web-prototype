const {test,expect}=require('@playwright/test');
const saveKey='heroLegendProgress_v1';
const stages=[
 {name:'涪城新訊',route:'成都',leader:'費禕',guest:'費禕',kind:'restoration',year:246,outcome:'費禕繼續照料各營'},
 {name:'洮西接應',route:'沔陽 → 洮西',leader:'姜維',guest:'姜維',opponent:'郭淮',marker:true,kind:'dispatch',year:247,outcome:'姜維把投向蜀漢的部眾帶回安置'},
 {name:'陰平迎將',route:'陰平 → 沔陽',leader:'夏侯霸',guest:'夏侯霸',kind:'supply',year:249,outcome:'蜀漢派人迎接夏侯霸'},
 {name:'漢壽新訊',route:'漢壽',leader:'費禕',guest:'姜維',opponent:'郭循',kind:'dispatch',year:253,outcome:'費禕在漢壽遇害'},
 {name:'南安糧盡',route:'沔陽 → 南安',leader:'姜維',guest:'姜維',opponent:'陳泰',kind:'withdraw',year:253,outcome:'南安仍在魏國手中'},
 {name:'洮西收兵',route:'洮西 → 狄道 → 鍾題',leader:'姜維',guest:'夏侯霸',opponent:'王經',kind:'withdraw',year:255,outcome:'姜維退駐鍾題'}
];

test('stage 112 continues through Jiang Wei’s northern campaigns and keeps campaign saves on touch screens',async({page})=>{
 test.setTimeout(300000);
 const {expressionPortrait}=await import('../hero/portrait-expressions.mjs');
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(key=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({
   completed:112,coins:150,weapons:{guanyu:2},inventory:{grain:2},
   skillSeen:['liubei','guanyu','zhangfei'].flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
  }));
  const write=Storage.prototype.setItem;
  Storage.prototype.setItem=function(name,value){
   if(name===key&&window.blockSave)throw Error('test quota');
   return write.call(this,name,value);
  };
  Element.prototype.requestFullscreen=undefined;
 },saveKey);
 await page.route('**/hero/engine.mjs?*',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:(await response.text()).replace('return {level,mission:','return window.chapterBattle={level,mission:')});
 });
 await page.clock.install();
 const tap=selector=>page.locator(selector).tap();
 const advance=ms=>page.clock.runFor(ms);
 const snapshot=()=>page.evaluate(()=>({time:window.chapterBattle.time,mission:window.chapterBattle.mission}));
 const readSave=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),saveKey);
 async function controlledBattle(){
  await tap('#storySkip');
  await expect(page.locator('#battle')).toBeVisible({timeout:25000});
  await expect(page.locator('#battleTitle')).toContainText('蜀漢軍');
  expect(await page.evaluate(()=>window.chapterBattle.weapons.guanyu)).toBe(2);
  await page.locator('#battleSpeed').selectOption('2');
  // Only enemy waves and starting food are sandboxed. Mission and save paths run through UI.
  await page.evaluate(()=>{
   const battle=window.chapterBattle;
   battle.bossSpawned=true;
   battle.nextSpawn=Infinity;
   battle.food=300;
  });
  for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries()){
   await tap(`#cards [data-hero=${key}]`);
   await page.locator('.lane').nth(lane).tap({position:{x:40,y:25}});
   await advance(200);
  }
 }
 async function sendCarts(){
  for(let batch=0;batch<3;batch++){
   await advance(7600);
   await expect(page.locator('#missionQuickAction')).toHaveText('發送糧車');
   await tap('#missionQuickAction');
  }
 }
 async function withdraw(){
  await advance(2300);
  await tap('#cards [data-hero=archer]');
  await page.locator('.lane').first().tap({position:{x:40,y:25}});
  await advance(100);
  const archer=await page.evaluate(()=>String(window.chapterBattle.allies.find(u=>u.key==='archer').id));
  await page.locator('#unitSelect').selectOption(archer);
  await tap('#commandDrawerButton');
  for(let move=0;move<2;move++){
   await tap('#orders [data-order="forward"]');
   await advance(3300);
  }
  await tap('#commandDrawerClose');
  await advance(6200);
  await expect(page.locator('#missionQuickAction')).toHaveText('全軍撤離');
  await tap('#missionQuickAction');
  await advance(200);
  await expect(page.locator('#missionQuick')).toContainText('1 名友軍尚未回到左側');
  await expect(page.locator('#result')).toBeHidden();
  await tap('#pauseBtn');
  const frozen=await snapshot();
  const position=()=>page.evaluate(()=>window.chapterBattle.allies.find(u=>u.key==='archer').x);
  const before=await position();
  await advance(550);
  expect(await snapshot()).toEqual(frozen);
  expect(await position()).toBe(before);
  await tap('#pauseBtn');
  await advance(4500);
 }
 async function camp(){
  await advance(4200);
  while(await page.locator('#skillIntro[open]').isVisible())await tap('#skillIntroContinue');
  await tap('#resultNext');
 }
 async function choose(chapter,level){
  await page.locator('#chapterPicker').evaluate(el=>el.open=true);
  await tap(`#chapterTabs [data-chapter="${chapter}"]`);
  await tap(`#chapterDots [data-level="${level}"]`);
 }

 await page.goto('/hero/');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+700));
 await expect(page.locator('#homeProgress')).toContainText('112 / 142');
 await expect(page.locator('#homeChapterCount')).toHaveText('主篇 142 關');
 await expect(page.locator('#homeStageCount')).toHaveText('番外 18 關');
 await expect(page.locator('#chapterDots [data-level="114"]')).toBeDisabled();
 await choose(19,112);
 await expect(page.locator('#storyTitle')).toHaveText('援軍解圍');
 await controlledBattle();
 await advance(18500);
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 await camp();
 await expect(page.locator('#campContinue')).toContainText('第十九章尾聲');
 await tap('#campContinue');
 await expect(page.locator('#storyLine')).toContainText('曹爽率魏軍退去');
 await tap('#storySkip');

 for(const [index,stage] of stages.entries()){
  const level=113+index;
  await expect(page.locator('#storyTitle')).toHaveText(stage.name);
  await expect(page.locator('#storyChapter')).toContainText('第二十章');
  await expect(page.locator('#journeyIntro h3')).toContainText(stage.route);
  if(level===118)for(const place of ['洮西','狄道','鍾題'])await expect(page.locator('#journeyIntro .map-city text').filter({hasText:new RegExp(`^${place}$`)})).toBeVisible();
  await expect(page.locator('#journeyIntro .journey-army')).toHaveAttribute('data-person',stage.leader);
  await expect(page.locator('#journeyIntro .journey-army image')).toHaveAttribute('href',expressionPortrait(stage.leader));
  await tap('#storyMore');
  await tap('.history-toggle');
  await expect(page.locator('#historyLesson [aria-current=step]')).toContainText(String(stage.year));
  await expect(page.locator('#taskPortrait')).toHaveAttribute('alt',stage.guest);
  if(level===118){
   const atlas=page.locator('.history-roster img');
   await expect(atlas).toHaveCount(4);
   for(const img of await atlas.all())await img.evaluate(node=>node.decode());
  }
  await tap('#historyLesson details summary');
  await expect(page.locator('.history-sources a').first()).toBeVisible();
  await expect(page.locator('.history-sources a').first()).toHaveAttribute('href',/wikisource/);
  await tap('#storyDetails header button');
  await controlledBattle();

  await tap('#battleMenuButton');
  await tap('#battleMapButton');
  await expect(page.locator('#campaignMapRoute')).toHaveText(stage.route);
  if(level===118)for(const place of ['洮西','狄道','鍾題'])await expect(page.locator('#campaignMapCanvas .map-city text').filter({hasText:new RegExp(`^${place}$`)})).toBeVisible();
  await expect(page.locator('#campaignMapCanvas .map-leader')).toHaveAttribute('data-person',stage.leader);
  await expect(page.locator('#campaignMapCanvas .map-leader image')).toHaveAttribute('href',expressionPortrait(stage.leader));
  const opponent=page.locator('#campaignMapMatchup [data-side=enemy] img');
  if(stage.opponent)await expect(opponent).toHaveAttribute('alt',stage.opponent);
  if(stage.opponent)await expect(opponent).toHaveAttribute('src',expressionPortrait(stage.opponent));
  await opponent.evaluate(img=>img.decode());
  await expect(page.locator('#campaignMapCanvas .map-opponent')).toHaveCount(stage.marker?1:0);
  const paused=await snapshot();
  await advance(600);
  expect(await snapshot()).toEqual(paused);
  await tap('#campaignMapClose');
  if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
  await advance(100);
  expect((await snapshot()).time).toBeGreaterThan(paused.time);

  if(level===118)await page.evaluate(()=>window.blockSave=true);
  if(stage.kind==='supply'){
   await advance(2500);
   await tap('#pauseBtn');
   const prepping=await snapshot();
   expect(prepping.mission.charge).toBeGreaterThan(0);
   expect(prepping.mission.charge).toBeLessThan(10);
   await advance(650);
   expect(await snapshot()).toEqual(prepping);
   await expect(page.locator('#missionQuickAction')).toBeDisabled();
   await tap('#pauseBtn');
   await advance(5100);
   await expect(page.locator('#missionQuickAction')).toHaveText('發送糧車');
   const guardId=await page.evaluate(()=>String(window.chapterBattle.allies.find(u=>u.key==='zhangfei').id));
   await page.locator('#unitSelect').selectOption(guardId);
   await tap('#commandDrawerButton');
   await tap('#orders [data-order="up"]');
   await tap('#commandDrawerClose');
   await expect(page.locator('#missionQuick')).toContainText('下路缺接應');
   await tap('#missionQuickAction');
   await expect(page.locator('#missionChoices [data-action=supply]')).toBeDisabled();
   expect((await snapshot()).mission).toMatchObject({charge:10,delivered:0});
   await tap('#missionDrawerClose');
   await tap('#cards [data-hero=archer]');
   await page.locator('.lane').nth(2).tap({position:{x:40,y:25}});
   await advance(100);
   await expect(page.locator('#missionQuickAction')).toHaveText('發送糧車');
   await sendCarts();
   await expect(page.locator('#missionQuick')).toContainText('軍糧 3／3');
  }
  else if(stage.kind==='restoration'){
   await tap('#missionDrawerButton');
   for(const [i,site] of ['糧冊','驛站','營簿'].entries()){
    await tap(`#missionChoices [data-action=site]:nth-child(${i+1})`);
    await expect(page.locator('#missionObjective')).toContainText(site);
    await expect(page.locator('#missionActionFx strong')).toHaveText(`開始整備${site}，請守住對應路線`);
    if(i===0){
     await advance(1000);
     await tap('#pauseBtn');
     const progress=await snapshot();
     expect(progress.mission.sites[0]).toBeGreaterThan(0);
     await advance(1200);
     expect(await snapshot()).toEqual(progress);
     await expect(page.locator('#missionObjective')).toContainText('已暫停');
     await tap('#battleMenuButton');
     await tap('#battleMapButton');
     await tap('#campaignMapClose');
     if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
     await advance(100);
     await expect(page.locator('#pauseBtn')).toHaveAttribute('aria-pressed','true');
     expect(await snapshot()).toEqual(progress);
     await tap('#pauseBtn');
     await advance(100);
     await tap('#missionDrawerButton');
    }
    await advance(6200);
   }
  }else if(stage.kind==='withdraw'){
   await withdraw();
  }else if(level===114){
   await tap('#missionDrawerButton');
   await tap('#missionChoices [data-action=route]:first-child');
   await advance(650);
   expect((await snapshot()).mission.travel).toBeGreaterThan(0);
   await tap('#pauseBtn');
   const frozen=await snapshot();
   await advance(800);
   expect(await snapshot()).toEqual(frozen);
   await expect(page.locator('#missionChoices [data-action=route]:nth-child(2)')).toBeDisabled();
   await tap('#pauseBtn');
   await advance(100);
   await tap('#missionChoices [data-action=route]:nth-child(2)');
   await tap('#missionDrawerClose');
   await advance(18500);
  }else await advance(18500);

  await advance(300);
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  await expect(page.locator('#resultText')).toContainText(stage.outcome);
  if(level===118){
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   expect(await readSave()).toMatchObject({completed:117,coins:550});
   await page.evaluate(()=>window.blockSave=false);
   await tap('#resultRetrySave');
  }
  expect(await readSave()).toMatchObject({completed:level,coins:230+80*index,weapons:{guanyu:2},inventory:{grain:2}});
  await camp();
  await expect(page.locator('#campTitle')).toContainText(stage.name);
  await tap('[data-talk=guanyu]');
  const portrait=page.locator('#campTalkPortrait');
  await expect(portrait).toHaveAttribute('alt',stage.guest);
  await expect(portrait).toHaveAttribute('src',expressionPortrait(stage.guest));
  await portrait.evaluate(img=>img.decode());
  await tap('#campTalkNext');
  if(level===118){
   await tap('[data-shop=items]');
   await tap('[data-buy=herb]');
   await expect(page.locator('#campCoins')).toHaveText('605');
   await tap('#campShopBack');
   await expect(page.locator('#campContinue')).toContainText('第二十章尾聲');
  }
  await tap('#campContinue');
  if(level===118)await expect(page.locator('#storyLine')).toContainText('陳泰解了狄道之圍');
  await tap('#storySkip');
 }

 await expect(page.locator('#storyTitle')).toHaveText('段谷撤兵');
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText('118 / 142');
 const cleared={completed:118,coins:605,weapons:{guanyu:2},inventory:{grain:2,herb:1}};
 expect(await readSave()).toMatchObject(cleared);
 await choose(20,118);
 await controlledBattle();
 await withdraw();
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 expect(await readSave()).toMatchObject(cleared);

 await page.goto('/hero/people.html',{waitUntil:'domcontentloaded'});
 for(const [query,name,levels] of [['仲權','夏侯霸',[114,115,118]],['郭脩','郭循',[116]],['玄伯','陳泰',[117,118]],['彥緯','王經',[118]]]){
  await page.locator('#peopleSearch').fill(query);
  const card=page.locator(`[data-person="${name}"]`);
  await expect(card.locator('.stage-pills span')).toHaveText(levels.map(level=>new RegExp(`第 ${level} 關`)));
  await expect(card.locator('img')).toHaveAttribute('src',expressionPortrait(name));
  expect(await card.locator('img').evaluate(img=>img.decode().then(()=>img.naturalWidth))).toBe(320);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));
 expect(await readSave()).toMatchObject(cleared);
 expect(errors).toEqual([]);
});
