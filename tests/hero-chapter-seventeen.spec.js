const {test,expect}=require('@playwright/test');
const saveKey='heroLegendProgress_v1';
const stages=[
 {name:'漢中出師',route:'成都 → 沔陽',leader:'諸葛亮',guest:'諸葛亮',kind:'dispatch',year:227},
 {name:'隴右響應',route:'祁山 → 天水一帶',leader:'諸葛亮',guest:'姜維',kind:'holdout',year:228},
 {name:'街亭撤離',route:'祁山 → 街亭一帶',leader:'馬謖',guest:'王平',opponent:'張郃',onMap:true,kind:'withdraw',year:228},
 {name:'箕谷收兵',route:'箕谷一帶 → 南鄭',leader:'趙雲',guest:'鄧芝',opponent:'曹真',kind:'holdout',year:228},
 {name:'陳倉糧盡',route:'散關 → 陳倉',leader:'諸葛亮',guest:'諸葛亮',opponent:'郝昭',onMap:true,kind:'withdraw',year:228},
 {name:'武都陰平',route:'武都 → 陰平',leader:'陳式',guest:'陳式',opponent:'郭淮',kind:'supply',year:229}
];

test('chapter seventeen preserves the southern campaign save and completes all six Northern Expedition stages',async({page})=>{
 test.setTimeout(300000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(key=>{
  if(!localStorage.getItem(key)){
   const ids=['liubei','guanyu','zhangfei'];
   localStorage.setItem(key,JSON.stringify({
    completed:94,coins:150,weapons:{guanyu:2},inventory:{grain:2},
    skillSeen:ids.flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
   }));
  }
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
 async function deploy(key,lane){
  await tap(`#cards [data-hero=${key}]`);
  await page.locator('.lane').nth(lane).tap({position:{x:40,y:25}});
  await advance(200);
 }
 async function deployTeam(){
  for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries())await deploy(key,lane);
 }

 async function sendCarts(){
  for(let batch=0;batch<3;batch++){
   await advance(7600);
   await expect(page.locator('#missionQuickAction')).toHaveText('發送糧車');
   await tap('#missionQuickAction');
  }
 }

 await page.goto('/hero/');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+700));
 await expect(page.locator('#homeProgress')).toContainText('94 / 154');
 await page.locator('#chapterPicker').evaluate(el=>el.open=true);
 await tap('#chapterTabs [data-chapter="16"]');
 await tap('#chapterDots [data-level="94"]');
 await expect(page.locator('#storyTitle')).toHaveText('南中收兵');
 await tap('#storySkip');
 await expect(page.locator('#battle')).toBeVisible({timeout:25000});
 await page.locator('#battleSpeed').selectOption('2');
 await page.evaluate(()=>{
  const battle=window.chapterBattle;
  battle.bossSpawned=true;
  battle.nextSpawn=Infinity;
  battle.food=300;
 });
 await deployTeam();
 await sendCarts();
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 expect(await readSave()).toMatchObject({completed:94,coins:150,weapons:{guanyu:2},inventory:{grain:2}});
 await advance(4200);
 while(await page.locator('#skillIntro[open]').isVisible())await tap('#skillIntroContinue');
 await tap('#resultNext');
 await expect(page.locator('#campContinue')).toContainText('第十六章尾聲');
 await tap('#campContinue');
 await expect(page.locator('#storyLine')).toContainText('諸葛亮回到成都');
 await tap('#storySkip');

 for(const [index,stage] of stages.entries()){
  await expect(page.locator('#storyTitle')).toHaveText(stage.name);
  await expect(page.locator('#storyChapter')).toContainText('第十七章');
  await expect(page.locator('#journeyIntro .journey-army')).toHaveAttribute('data-person',stage.leader);
  await tap('#storyMore');
  await tap('.history-toggle');
  await expect(page.locator('#historyLesson [aria-current=step]')).toContainText(String(stage.year));
  await expect(page.locator('#historyLesson figcaption').filter({hasText:stage.guest})).toHaveCount(1);
  await expect(page.locator('#taskPortrait')).toHaveAttribute('alt',stage.guest);
  await expect(page.locator('.history-sources a').first()).toHaveAttribute('href',/wikisource/);
  await tap('#storyDetails header button');
  await tap('#storySkip');
  await expect(page.locator('#battle')).toBeVisible({timeout:25000});
  await expect(page.locator('#battleTitle')).toContainText('蜀漢軍');
  expect(await page.evaluate(()=>window.chapterBattle.weapons.guanyu)).toBe(2);
  await page.locator('#battleSpeed').selectOption('2');

  await tap('#battleMenuButton');
  await tap('#battleMapButton');
  await expect(page.locator('#campaignMapRoute')).toHaveText(stage.route);
  await expect(page.locator('#campaignMapCanvas .map-leader')).toHaveAttribute('data-person',stage.leader);
  if(stage.opponent)await expect(page.locator('#campaignMapMatchup [data-side=enemy] img')).toHaveAttribute('alt',stage.opponent);
  if(stage.onMap)await expect(page.locator('#campaignMapCanvas .map-opponent')).toHaveAttribute('data-person',stage.opponent);
  else await expect(page.locator('#campaignMapCanvas .map-opponent')).toHaveCount(0);
  const paused=await page.evaluate(()=>window.chapterBattle.time);
  await advance(600);
  expect(await page.evaluate(()=>window.chapterBattle.time)).toBe(paused);
  await tap('#campaignMapClose');
  if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
  await advance(100);

  // Control enemy waves in the browser. The engine suite uses ordinary combat waves.
  await page.evaluate(()=>{
   const battle=window.chapterBattle;
   battle.bossSpawned=true;
   battle.nextSpawn=Infinity;
   battle.food=300;
  });
  if(index!==2)await deployTeam();
  if(index===5)await page.evaluate(()=>window.blockSave=true);
  if(stage.kind==='withdraw'){
   if(index===4)await page.evaluate(()=>window.chapterBattle.allies[0].x=.43);
   await advance(14000);
   await expect(page.locator('#missionQuickAction')).toHaveText('全軍撤離');
   await tap('#missionQuickAction');
   await advance(200);
   await expect(page.locator('#result')).toBeHidden();
   if(index===2){
    await expect(page.locator('#missionQuick')).toContainText('請先召回至少一隊友軍');
    await deploy('archer',1);
   }
   await advance(3600);
   await expect(page.locator('#resultText')).toContainText(index===2?'街亭仍由魏軍取勝':'陳倉未被攻下');
  }else if(stage.kind==='supply'){
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
   expect(await page.evaluate(()=>window.chapterBattle.mission)).toMatchObject({charge:10,delivered:0});
   await tap('#missionDrawerClose');
   await deploy('archer',2);
   await expect(page.locator('#missionQuickAction')).toHaveText('發送糧車');
   await sendCarts();
  }else await advance(18500);

  await advance(300);
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  if(index===5){
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   expect(await readSave()).toMatchObject({completed:99,coins:550});
   await page.evaluate(()=>window.blockSave=false);
   await tap('#resultRetrySave');
  }
  expect(await readSave()).toMatchObject({completed:95+index,coins:230+80*index,weapons:{guanyu:2},inventory:{grain:2}});
  await advance(4200);
  while(await page.locator('#skillIntro[open]').isVisible())await tap('#skillIntroContinue');
  await tap('#resultNext');
  await expect(page.locator('#campTitle')).toContainText(stage.name);
  await tap('[data-talk=guanyu]');
  await expect(page.locator('#campTalkPortrait')).toHaveAttribute('alt',stage.guest);
  await tap('#campTalkNext');
  if(index===5){
   await tap('[data-shop=items]');
   await tap('[data-buy=herb]');
   await expect(page.locator('#campCoins')).toHaveText('605');
   await tap('#campShopBack');
  }
  await tap('#campContinue');
  if(index===5)await expect(page.locator('#storyLine')).toContainText('蜀軍取得武都、陰平兩郡');
  await tap('#storySkip');
 }
 await expect(page.locator('#storyTitle')).toHaveText('雨阻漢中');
 await tap('#story [data-home]');
 await expect(page.locator('#homeProgress')).toContainText('100 / 154');
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText('100 / 154');
 const cleared=await readSave();
 expect(cleared).toMatchObject({completed:100,coins:605,weapons:{guanyu:2},inventory:{grain:2,herb:1}});
 await page.locator('#chapterPicker').evaluate(el=>el.open=true);
 await tap('#chapterTabs [data-chapter="17"]');
 await tap('#chapterDots [data-level="100"]');
 await tap('#storySkip');
 await expect(page.locator('#battle')).toBeVisible();
 await page.locator('#battleSpeed').selectOption('2');
 await page.evaluate(()=>{
  const battle=window.chapterBattle;
  battle.bossSpawned=true;
  battle.nextSpawn=Infinity;
  battle.food=300;
 });
 await deployTeam();
 await sendCarts();
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 expect(await readSave()).toMatchObject({completed:100,coins:605,weapons:{guanyu:2},inventory:{grain:2,herb:1}});
 await page.goto('/hero/people.html',{waitUntil:'domcontentloaded'});
 for(const [query,name,level] of [['伯約','姜維',96],['幼常','馬謖',97],['子均','王平',97],['子丹','曹真',98],['伯道','郝昭',99],['伯濟','郭淮',100]]){
  await page.locator('#peopleSearch').fill(query);
  const card=page.locator(`[data-person="${name}"]`);
  await expect(card.locator('.stage-pills')).toContainText(`第 ${level} 關`);
  expect(await card.locator('img').evaluate(img=>img.decode().then(()=>img.naturalWidth))).toBe(320);
 }
 expect(errors).toEqual([]);
});
