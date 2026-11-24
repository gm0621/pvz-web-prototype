const {test,expect}=require('@playwright/test');
const KEY='heroLegendProgress_v1';
const chapters=[
 {name:'沔陽傳令',route:'沔陽',guest:'劉備',opponent:'關羽',offMapOpponent:true,goal:'dispatch'},
 {name:'襄樊圍城',route:'江陵 → 襄陽 → 樊城',guest:'關平',opponent:'曹仁',goal:'holdout'},
 {name:'漢水暴漲',route:'樊城 → 漢水北岸',guest:'關平',opponent:'于禁',goal:'supply'},
 {name:'樊城解圍',route:'偃城 → 樊城',guest:'徐晃',opponent:'關羽',goal:'commander'},
 {name:'江陵失守',route:'江陵',guest:'關平',opponent:'呂蒙',offMapLeader:true,goal:'dispatch'},
 {name:'麥城出走',route:'麥城 → 章鄉一帶',guest:'劉備',opponent:'孫權',offMapOpponent:true,goal:'withdraw'}
];
const PINS={'沔陽傳令':'劉備','樊城解圍':'徐晃'};

test('chapter fourteen continues a completed Hanzhong save through Xiangfan',async({page})=>{
 test.setTimeout(300000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(key=>{
  if(!localStorage.getItem(key)){
   const ids=['caocao','xiahoudun','caohong','caoren','xiahouyuan','yujin','liubei','guanyu','zhangfei'];
   localStorage.setItem(key,JSON.stringify({
    completed:76,coins:100,weapons:{guanyu:2},heroGrowth:{caocao:{weapon:1}},inventory:{grain:2},
    skillSeen:ids.flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
   }));
  }
  const write=Storage.prototype.setItem;
  Storage.prototype.setItem=function(id,value){
   if(id===key&&window.blockSave)throw Error('test quota');
   return write.call(this,id,value);
  };
  Element.prototype.requestFullscreen=undefined;
 },KEY);
 await page.route('**/hero/engine.mjs?*',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:(await response.text()).replace('return {level,mission:','return window.chapterBattle={level,mission:')});
 });
 await page.clock.install();
 const tap=selector=>page.locator(selector).tap();
 const advance=ms=>page.clock.runFor(ms);
 const save=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
 const deploy=async(key,lane)=>{
  await page.evaluate(()=>window.chapterBattle.food=300);
  await tap(`#cards [data-hero=${key}]`);
  await page.locator('.lane').nth(lane).tap({position:{x:40,y:25}});
  await advance(200);
 };
 const suppressWaves=()=>page.evaluate(()=>{
  window.chapterBattle.bossSpawned=true;
  window.chapterBattle.nextSpawn=Infinity;
 });
 const toCamp=async()=>{
  await advance(4200);
  while(await page.locator('#skillIntro[open]').isVisible())await tap('#skillIntroContinue');
  await tap('#resultNext');
 };
 const supply=async()=>{
  for(let cart=0;cart<3;cart++){
   await advance(7600);
   await expect(page.locator('#missionQuickAction')).toHaveText('發送糧車');
   await tap('#missionQuickAction');
  }
 };

 await page.goto('/hero/');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+600));
 await expect(page.locator('#homeProgress')).toContainText('76 / 106');
 await page.locator('#chapterPicker').evaluate(el=>el.open=true);
 await tap('#chapterTabs [data-chapter="13"]');
 await tap('#chapterDots [data-level="76"]');
 await tap('#storySkip');
 await expect(page.locator('#battle')).toBeVisible({timeout:25000});
 await page.locator('#battleSpeed').selectOption('2');
 await suppressWaves();
 for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries())await deploy(key,lane);
 await supply();
 await advance(100);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 await toCamp();
 await expect(page.locator('#campContinue')).toContainText('第十三章尾聲');
 await tap('#campContinue');
 await expect(page.locator('#storyLine')).toContainText('漢中王');
 await tap('#storySkip');

 for(const [index,stage] of chapters.entries()){
  const cao=index===3;
  await expect(page.locator('#storyTitle')).toHaveText(stage.name);
  await expect(page.locator('#storyChapter')).toContainText('第十四章');
  if(index===1)await expect(page.locator('#journeyIntro h3')).toContainText(stage.route);
  if(stage.offMapLeader){
   await expect(page.locator('#journeyIntro .journey-heading small')).toContainText('荊州後方消息');
   await expect(page.locator('#journeyIntro .map-opponent')).toBeVisible();
   await expect(page.locator('#storyNext')).toHaveText('查看後方消息 →');
   await tap('#storyNext');
   await expect(page.locator('#story')).toHaveAttribute('data-reader-phase','novel');
   await expect(page.locator('#novelPage')).toBeVisible();
  }
  await tap('#storyMore');
  await tap('.history-toggle');
  await expect(page.locator('#historyLesson [aria-current=step]')).toContainText('219');
  await expect(page.locator('#historyLesson h3')).toContainText(cao?'曹操軍':'劉備軍');
  await expect(page.locator('.history-sources a').first()).toHaveAttribute('href',/wikisource/);
  await tap('#storyDetails header button');
  await tap('#storySkip');
  if(cao){
   await expect(page.locator('#deployment')).toBeVisible();
   await page.locator('#deployment select').selectOption('5');
   const chosen=page.locator('#deployment [data-choose][aria-pressed=true]');
   for(let count=await chosen.count();count<5;count++)await page.locator('#deployment [data-choose][aria-pressed=false]').first().tap();
   await tap('#deploymentStart');
  }
  await expect(page.locator('#battle')).toBeVisible({timeout:25000});
  await expect(page.locator('#battleTitle')).toContainText(cao?'曹操軍':'劉備軍');
  await expect(page.locator('.lane')).toHaveCount(cao?5:3);
  expect(await page.evaluate(key=>window.chapterBattle.weapons[key],cao?'liubei':'guanyu')).toBe(cao?1:2);
  await page.locator('#battleSpeed').selectOption('2');

  await tap('#battleMenuButton');
  await tap('#battleMapButton');
  await expect(page.locator('#campaignMapRoute')).toHaveText(stage.route);
  if(index===1)await expect(page.locator('#campaignMapCanvas .map-city text').filter({hasText:/^襄陽$/})).toBeVisible();
  const leader=page.locator('#campaignMapCanvas .map-leader');
  const opponent=page.locator('#campaignMapCanvas .map-opponent');
  if(stage.offMapLeader)await expect(leader).toHaveCount(0);
  else await expect(leader).toHaveAttribute('data-person',PINS[stage.name]||'關羽');
  if(stage.offMapOpponent)await expect(opponent).toHaveCount(0);
  else await expect(opponent).toHaveAttribute('data-person',stage.opponent);
  await expect(page.locator('#campaignMapMatchup [data-side=enemy] img')).toHaveAttribute('alt',stage.opponent);
  const before=await page.evaluate(()=>window.chapterBattle.time);
  await advance(1000);
  expect(await page.evaluate(()=>window.chapterBattle.time)).toBe(before);
  await tap('#campaignMapClose');
  if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
  await advance(100);
  expect(await page.evaluate(()=>window.chapterBattle.time)).toBeGreaterThan(before);

  // Hold enemy setup constant while exercising actual touch controls and mission timing.
  if(stage.goal==='commander'){
   await page.evaluate(()=>{window.chapterBattle.spawned=999;window.chapterBattle.nextSpawn=0});
   await advance(100);
   await expect(page.locator('#bossIntroTitle')).toContainText('圍陣守將');
   await tap('#bossIntroContinue');
   await page.evaluate(()=>window.chapterBattle.enemies[0].hp=0);
  }else{
   await suppressWaves();
   if(stage.goal==='withdraw')await deploy('archer',0);
   else for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries())await deploy(key,lane);
   if(stage.goal==='supply')await supply();
   else if(stage.goal==='withdraw'){
    await expect(page.locator('#missionQuick p')).toContainText('帶關羽與友軍撤回左側');
    await page.evaluate(()=>{
     window.chapterBattle.allies[0].x=.35;
     window.blockSave=true;
    });
    await advance(14000);
    await tap('#missionQuickAction');
    await advance(7000);
    await expect(page.locator('#result')).toBeHidden();
    await expect(page.locator('#missionQuick p')).toContainText('請召回關羽');
    await deploy('guanyu',1);
    await expect(page.locator('#resultTitle')).toHaveText('離開麥城');
    await expect(page.locator('#resultText')).toContainText('被潘璋部下馬忠擒獲');
   }else await advance(18500);
  }
  await advance(100);
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  if(stage.goal==='commander')expect(await page.evaluate(()=>window.chapterBattle.bossRetreated)).toBe(true);
  if(index===5){
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   expect(await save()).toMatchObject({completed:81,coins:380,weapons:{guanyu:2},heroGrowth:{caocao:{weapon:2}}});
   await page.evaluate(()=>window.blockSave=false);
   await tap('#resultRetrySave');
  }
  expect(await save()).toMatchObject({
   completed:77+index,coins:180+80*index-(index>3?120:0),weapons:{guanyu:2},heroGrowth:{caocao:{weapon:index>3?2:1}},inventory:{grain:2}
  });
  await toCamp();
  await expect(page.locator('#campTitle')).toContainText(stage.name);
  await tap('[data-talk=guanyu]');
  await expect(page.locator('#campTalkName')).toHaveText(stage.guest);
  await expect(page.locator('#campTalkPortrait')).toHaveAttribute('alt',stage.guest);
  await tap('#campTalkNext');
  if(cao){
   await tap('[data-shop=weapons]');
   const weapon=page.locator('[data-buy-hero=caocao]');
   await expect(weapon).toHaveText('購買 · 120 軍資');
   await page.evaluate(()=>window.blockSave=true);
   await weapon.tap();
   await expect(page.locator('#campMessage')).toContainText('無法保存');
   expect(await save()).toMatchObject({coins:420,weapons:{guanyu:2},heroGrowth:{caocao:{weapon:1}}});
   await page.evaluate(()=>window.blockSave=false);
   await weapon.tap();
   expect(await save()).toMatchObject({coins:300,weapons:{guanyu:2},heroGrowth:{caocao:{weapon:2}}});
   await tap('#campShopBack');
  }
  if(index===5){
   await expect(page.locator('[data-talk=guanyu] strong')).toHaveText('劉備');
   await expect(page.locator('[data-talk=zhangfei] strong')).toHaveText('戰後消息');
   await tap('[data-talk=zhangfei]');
   await expect(page.locator('#campTalkText')).toContainText('關羽、關平');
   await expect(page.locator('#campTalkText')).toContainText('後來遇害');
   await tap('#campTalkNext');
  }
  await tap('#campContinue');
  if(index===5){
   await expect(page.locator('#storyChapter')).toContainText('戰後');
   await expect(page.locator('#storyLine')).toContainText('後來遇害');
  }
  await tap('#storySkip');
 }
 await expect(page.locator('#storyTitle')).toHaveText('成都即位');
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText('82 / 106');
 expect(await save()).toMatchObject({completed:82,coins:460,weapons:{guanyu:2},heroGrowth:{caocao:{weapon:2}}});
 await page.locator('#chapterPicker').evaluate(el=>el.open=true);
 await tap('#chapterTabs [data-chapter="14"]');
 await tap('#chapterDots [data-level="80"]');
 await tap('#storySkip');
 await tap('#deploymentStart');
 await expect(page.locator('#battle')).toBeVisible({timeout:25000});
 expect(await page.evaluate(()=>window.chapterBattle.weapons.liubei)).toBe(2);
 await page.goto('/hero/people.html',{waitUntil:'domcontentloaded'});
 for(const [query,name,level] of [['令明','龐德',79],['子明','呂蒙',81],['伯言','陸遜',81],['關平','關平',82]]){
  await page.locator('#peopleSearch').fill(query);
  const card=page.locator(`[data-person="${name}"]`);
  await expect(card).toContainText('史實人物');
  await expect(card.locator('.stage-pills')).toContainText(`第 ${level} 關`);
  expect(await card.locator('img').evaluate(img=>img.decode().then(()=>img.naturalWidth))).toBe(320);
 }
 expect(errors).toEqual([]);
});
