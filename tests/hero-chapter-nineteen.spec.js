const {test,expect}=require('@playwright/test');
const saveKey='heroLegendProgress_v1';
const stages=[
 {name:'棧道爭路',route:'斜谷 → 南谷口一帶',leader:'楊儀',guest:'王平',opponent:'魏延',marker:true,kind:'dispatch',year:234,outcome:'蜀軍內部的爭端'},
 {name:'成都接任',route:'成都',leader:'蔣琬',guest:'蔣琬',kind:'restoration',year:234,outcome:'蔣琬接下朝廷事務'},
 {name:'漢中整軍',route:'成都 → 沔陽',leader:'蔣琬',guest:'姜維',kind:'holdout',year:238,outcome:'漢中的隊伍整備完成'},
 {name:'涪城轉運',route:'沔陽 → 涪縣',leader:'蔣琬',guest:'費禕',kind:'supply',year:243,outcome:'補給送到涪縣'},
 {name:'興勢守關',route:'南鄭 → 興勢一帶',leader:'王平',guest:'王平',opponent:'曹爽',marker:true,kind:'holdout',year:244,outcome:'興勢仍由蜀軍守住'},
 {name:'援軍解圍',route:'成都 → 興勢一帶',leader:'費禕',guest:'費禕',opponent:'曹爽',kind:'dispatch',year:244,outcome:'曹爽率魏軍退去'}
];

test('stage 106 continues through Xingshi and keeps campaign saves on touch screens',async({page})=>{
 test.setTimeout(300000);
 const {expressionPortrait}=await import('../hero/portrait-expressions.mjs');
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(key=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({
   completed:106,coins:150,weapons:{guanyu:2},inventory:{grain:2},
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
  await page.evaluate(()=>window.chapterBattle.allies[0].x=.43);
  await advance(14000);
  await expect(page.locator('#missionQuickAction')).toHaveText('全軍撤離');
  await tap('#missionQuickAction');
  await advance(200);
  await expect(page.locator('#result')).toBeHidden();
  await advance(3600);
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
 await expect(page.locator('#homeProgress')).toContainText('106 / 112');
 await expect(page.locator('#homeChapterCount')).toHaveText('第十九章已開放');
 await expect(page.locator('#homeStageCount')).toHaveText('112 場征途');
 await choose(18,106);
 await expect(page.locator('#storyTitle')).toHaveText('五丈原歸途');
 await controlledBattle();
 await withdraw();
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 await camp();
 await expect(page.locator('#campContinue')).toContainText('第十八章尾聲');
 await tap('#campContinue');
 await expect(page.locator('#storyLine')).toContainText('楊儀收束隊伍');
 await tap('#storySkip');

 for(const [index,stage] of stages.entries()){
  const level=107+index;
  await expect(page.locator('#storyTitle')).toHaveText(stage.name);
  await expect(page.locator('#storyChapter')).toContainText('第十九章');
  await expect(page.locator('#journeyIntro h3')).toContainText(stage.route);
  await expect(page.locator('#journeyIntro .journey-army')).toHaveAttribute('data-person',stage.leader);
  await expect(page.locator('#journeyIntro .journey-army image')).toHaveAttribute('href',expressionPortrait(stage.leader));
  await tap('#storyMore');
  await tap('.history-toggle');
  await expect(page.locator('#historyLesson [aria-current=step]')).toContainText(String(stage.year));
  await expect(page.locator('#taskPortrait')).toHaveAttribute('alt',stage.guest);
  await tap('#historyLesson details summary');
  await expect(page.locator('.history-sources a').first()).toBeVisible();
  await expect(page.locator('.history-sources a').first()).toHaveAttribute('href',/wikisource/);
  await tap('#storyDetails header button');
  await controlledBattle();

  await tap('#battleMenuButton');
  await tap('#battleMapButton');
  await expect(page.locator('#campaignMapRoute')).toHaveText(stage.route);
  await expect(page.locator('#campaignMapCanvas .map-leader')).toHaveAttribute('data-person',stage.leader);
  await expect(page.locator('#campaignMapCanvas .map-leader image')).toHaveAttribute('href',expressionPortrait(stage.leader));
  const opponent=page.locator('#campaignMapMatchup [data-side=enemy] img');
  if(stage.opponent)await expect(opponent).toHaveAttribute('alt',stage.opponent);
  await opponent.evaluate(img=>img.decode());
  await expect(page.locator('#campaignMapCanvas .map-opponent')).toHaveCount(stage.marker?1:0);
  const snapshot=()=>page.evaluate(()=>({time:window.chapterBattle.time,mission:window.chapterBattle.mission}));
  const paused=await snapshot();
  await advance(600);
  expect(await snapshot()).toEqual(paused);
  await tap('#campaignMapClose');
  if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
  await advance(100);
  expect((await snapshot()).time).toBeGreaterThan(paused.time);

  if(level===112)await page.evaluate(()=>window.blockSave=true);
  if(stage.kind==='supply'){
   await advance(7600);
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
  }
  else if(stage.kind==='restoration'){
   await tap('#missionDrawerButton');
   for(const [i,site] of ['案卷','糧冊','驛站'].entries()){
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
  }else if(level===111){
   await advance(2600);
   await expect(page.locator('#missionQuick')).toContainText('接應計時中');
   const guardId=await page.evaluate(()=>String(window.chapterBattle.allies.find(u=>u.key==='zhangfei').id));
   await page.locator('#unitSelect').selectOption(guardId);
   await tap('#commandDrawerButton');
   await tap('#orders [data-order="up"]');
   await tap('#commandDrawerClose');
   await expect(page.locator('#missionQuick')).toContainText('下路缺接應');
   const held=(await snapshot()).mission.hold;
   expect(held).toBeGreaterThan(0);
   await advance(1000);
   expect((await snapshot()).mission.hold).toBe(held);
   await tap('#cards [data-hero=archer]');
   await page.locator('.lane').nth(2).tap({position:{x:40,y:25}});
   await advance(18500);
  }else if(level===112){
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
  if(level===112){
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   expect(await readSave()).toMatchObject({completed:111,coins:550});
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
  if(level===112){
   await tap('[data-shop=items]');
   await tap('[data-buy=herb]');
   await expect(page.locator('#campCoins')).toHaveText('605');
   await tap('#campShopBack');
   await expect(page.locator('#campContinue')).toContainText('第十九章尾聲');
  }
  await tap('#campContinue');
  if(level===112)await expect(page.locator('#storyLine')).toContainText('曹爽率魏軍退去');
  await tap('#storySkip');
 }

 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText('第十九章完成');
 const cleared={completed:112,coins:605,weapons:{guanyu:2},inventory:{grain:2,herb:1}};
 expect(await readSave()).toMatchObject(cleared);
 await choose(19,112);
 await controlledBattle();
 await advance(18500);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 expect(await readSave()).toMatchObject(cleared);

 await page.goto('/hero/people.html',{waitUntil:'domcontentloaded'});
 for(const [query,name,level] of [['文長','魏延',107],['公琰','蔣琬',108],['文偉','費禕',112],['昭伯','曹爽',111]]){
  await page.locator('#peopleSearch').fill(query);
  const card=page.locator(`[data-person="${name}"]`);
  await expect(card.locator('.stage-pills')).toContainText(`第 ${level} 關`);
  await expect(card.locator('img')).toHaveAttribute('src',/expression-1$/);
  expect(await card.locator('img').evaluate(img=>img.decode().then(()=>img.naturalWidth))).toBe(320);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));
 expect(errors).toEqual([]);
});
