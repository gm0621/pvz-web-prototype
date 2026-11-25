const {test,expect}=require('@playwright/test');
const KEY='heroLegendProgress_v1';
const chapters=[
 {name:'成都即位',route:'成都',guest:'諸葛亮',opponent:'曹丕',offMapOpponent:true,goal:'dispatch'},
 {name:'閬中噩耗',route:'閬中',guest:'劉備',offMapLeader:true,offMapOpponent:true,goal:'holdout'},
 {name:'巫口進兵',route:'巫縣 → 秭歸',leader:'吳班',guest:'馮習',opponent:'陸遜',offMapOpponent:true,goal:'supply'},
 {name:'猇亭對峙',route:'秭歸 → 夷道猇亭一帶',guest:'黃權',opponent:'孫桓',goal:'holdout'},
 {name:'夷陵撤退',route:'夷道猇亭一帶 → 秭歸',guest:'劉備',opponent:'陸遜',offMapOpponent:true,goal:'withdraw'},
 {name:'白帝收兵',route:'秭歸 → 永安（白帝一帶）',guest:'劉備',opponent:'孫權',offMapOpponent:true,goal:'supply'}
];

test('chapter fifteen carries a completed Xiangfan save through the retreat to Yong’an',async({page})=>{
 test.setTimeout(300000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(key=>{
  if(!localStorage.getItem(key)){
   const ids=['caocao','xiahoudun','caohong','caoren','xiahouyuan','yujin','liubei','guanyu','zhangfei'];
   localStorage.setItem(key,JSON.stringify({
    completed:82,coins:100,weapons:{guanyu:2},heroGrowth:{caocao:{weapon:1}},inventory:{grain:2},
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
 const advanceUntil=async predicate=>{
  for(let i=0;i<100;i++){
   if(await page.evaluate(predicate))return;
   await advance(250);
  }
  expect(await page.evaluate(predicate)).toBe(true);
 };
 const unit=key=>page.evaluate(key=>window.chapterBattle.allies.find(ally=>ally.key===key),key);
 const selectUnit=async key=>page.locator('#unitSelect').selectOption(String((await unit(key)).id));
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
 await expect(page.locator('#homeProgress')).toContainText('82 / 154');
 await page.locator('#chapterPicker').evaluate(el=>el.open=true);
 await tap('#chapterTabs [data-chapter="14"]');
 await tap('#chapterDots [data-level="82"]');
 await tap('#storySkip');
 await expect(page.locator('#battle')).toBeVisible({timeout:25000});
 await page.locator('#battleSpeed').selectOption('2');
 await suppressWaves();
 await deploy('guanyu',1);
 await advance(14000);
 await tap('#missionQuickAction');
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 await toCamp();
 await expect(page.locator('#campContinue')).toContainText('第十四章尾聲');
 await tap('#campContinue');
 await expect(page.locator('#storyLine')).toContainText('後來遇害');
 await tap('#storySkip');

 for(const [index,stage] of chapters.entries()){
  await expect(page.locator('#storyTitle')).toHaveText(stage.name);
  await expect(page.locator('#storyChapter')).toContainText('第十五章');
  if(stage.offMapLeader){
   await expect(page.locator('#journeyIntro .journey-heading small')).toContainText('閬中後方消息');
   await expect(page.locator('#storyNext')).toHaveText('查看後方消息 →');
   await tap('#storyNext');
   await expect(page.locator('#novelPage')).toBeVisible();
  }
  await tap('#storyMore');
  await tap('.history-toggle');
  await expect(page.locator('#historyLesson [aria-current=step]')).toContainText(index<3?'221':'222');
  await expect(page.locator('#historyLesson h3')).toContainText('劉備軍');
  await expect(page.locator('.history-sources a').first()).toHaveAttribute('href',/wikisource/);
  await tap('#storyDetails header button');
  await tap('#storySkip');
  await expect(page.locator('#battle')).toBeVisible({timeout:25000});
  await expect(page.locator('#battleTitle')).toContainText('劉備軍');
  await expect(page.locator('.lane')).toHaveCount(3);
  expect(await page.evaluate(()=>window.chapterBattle.weapons.guanyu)).toBe(2);
  await page.locator('#battleSpeed').selectOption('2');

  await tap('#battleMenuButton');
  await tap('#battleMapButton');
  await expect(page.locator('#campaignMapRoute')).toHaveText(stage.route);
  const leader=page.locator('#campaignMapCanvas .map-leader');
  const opponent=page.locator('#campaignMapCanvas .map-opponent');
  if(stage.offMapLeader)await expect(leader).toHaveCount(0);
  else await expect(leader).toHaveAttribute('data-person',stage.leader||'劉備');
  if(stage.offMapOpponent)await expect(opponent).toHaveCount(0);
  else await expect(opponent).toHaveAttribute('data-person',stage.opponent);
  if(stage.opponent)await expect(page.locator('#campaignMapMatchup [data-side=enemy] img')).toHaveAttribute('alt',stage.opponent);
  const before=await page.evaluate(()=>window.chapterBattle.time);
  await advance(1000);
  expect(await page.evaluate(()=>window.chapterBattle.time)).toBe(before);
  await tap('#campaignMapClose');
  if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
  await advance(100);
  expect(await page.evaluate(()=>window.chapterBattle.time)).toBeGreaterThan(before);

  // Control the wave setup while exercising the actual touch controls and mission timers.
  if(stage.goal==='withdraw'){
   await page.evaluate(()=>{window.chapterBattle.spawned=999;window.chapterBattle.nextSpawn=0});
   await advance(100);
   await expect(page.locator('#bossIntroTitle')).toContainText('吳軍追兵主將');
   await tap('#bossIntroContinue');
   await expect(page.locator('#missionQuick')).toContainText('帶劉備與友軍撤回左側');
   await deploy('guanyu',1);
   await deploy('zhangfei',1);
   await page.evaluate(()=>{
    const battle=window.chapterBattle;
    battle.enemies[0].speed=0;
    for(const ally of battle.allies)ally.x=.31;
   });
   await advance(150);
   await expect(page.locator('.boss-cutin-skill')).toHaveText('火路追擊');
   await advance(360);
   await expect(page.locator('#bossHudState')).toContainText('中路即將起火');
   expect(await page.locator('#bossHudState').evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
   await expect(page.locator('.lane').nth(1)).toHaveClass(/danger/);
   const duringWarning=await page.evaluate(()=>window.chapterBattle.time);
   await tap('#battleMenuButton');
   await tap('#battleMapButton');
   await advance(1800);
   expect(await page.evaluate(()=>window.chapterBattle.time)).toBe(duringWarning);
   await tap('#campaignMapClose');
   if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
   await advance(100);
   expect(await page.evaluate(()=>window.chapterBattle.time)).toBeGreaterThan(duringWarning);
   const safeBefore=(await unit('guanyu')).hp;
   const exposedBefore=(await unit('zhangfei')).hp;
   await selectUnit('guanyu');
   await tap('#commandDrawerButton');
   await tap('#orders [data-order="up"]');
   await tap('#commandDrawerClose');
   expect((await unit('guanyu')).lane).toBe(0);
   await advanceUntil(()=>window.chapterBattle.hazards.some(h=>h.lane===1));
   await expect(page.locator('#bossHudState')).toContainText('中路仍在燃燒');
   await expect(page.locator('.lane').nth(1)).toHaveClass(/burning/);
   await advanceUntil(()=>window.chapterBattle.hazards.some(h=>h.lane===1&&h.nextTick>h.until-1.3));
   expect((await unit('guanyu')).hp).toBe(safeBefore);
   expect((await unit('zhangfei')).hp).toBeLessThan(exposedBefore);
   await advanceUntil(()=>window.chapterBattle.time>=window.chapterBattle.mission.withdrawAt);
   await expect(page.locator('#missionQuickAction')).toHaveText('全軍撤離');
   await tap('#missionQuickAction');
   await expect(page.locator('#missionQuick')).toContainText('請召回劉備');
   await selectUnit('guanyu');
   await tap('#commandDrawerButton');
   await tap('#orders [data-order="down"]');
   expect(await unit('guanyu')).toMatchObject({lane:1,order:'back'});
   await tap('#commandDrawerClose');
   await advance(7000);
   await expect(page.locator('#result')).toBeHidden();
   await deploy('liubei',2);
   await advance(400);
   await expect(page.locator('#resultTitle')).toHaveText('撤出猇亭');
   await expect(page.locator('#resultText')).toContainText('由陸遜取勝');
  }else{
   await suppressWaves();
   if(index===5){
    await deploy('liubei',0);
    await deploy('guanyu',1);
    await advance(6500);
    await expect(page.locator('#missionQuick')).toContainText('下路缺接應');
    expect(await page.evaluate(()=>window.chapterBattle.mission.charge)).toBe(0);
    await deploy('zhangfei',2);
   }else for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries())await deploy(key,lane);
   if(index===5)await page.evaluate(()=>window.blockSave=true);
   if(stage.goal==='supply')await supply();
   else await advance(18500);
  }
  await advance(100);
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  if(index===5){
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   expect(await save()).toMatchObject({completed:87,coins:500});
   await page.evaluate(()=>window.blockSave=false);
   await tap('#resultRetrySave');
  }
  expect(await save()).toMatchObject({
   completed:83+index,coins:180+80*index,weapons:{guanyu:2},heroGrowth:{caocao:{weapon:1}},inventory:{grain:2}
  });
  await toCamp();
  await expect(page.locator('#campTitle')).toContainText(stage.name);
  await tap('[data-talk=guanyu]');
  await expect(page.locator('#campTalkName')).toHaveText(stage.guest);
  await expect(page.locator('#campTalkPortrait')).toHaveAttribute('alt',stage.guest);
  await tap('#campTalkNext');
  if(index===5){
   await tap('[data-talk=zhangfei]');
   await expect(page.locator('#campTalkText')).toContainText('孫權派人請和');
   await tap('#campTalkNext');
   await tap('[data-shop=items]');
   await tap('[data-buy=herb]');
   await expect(page.locator('#campCoins')).toHaveText('555');
   await tap('#campShopBack');
  }
  await tap('#campContinue');
  if(index===5){
   await expect(page.locator('#storyChapter')).toContainText('戰後');
   await expect(page.locator('#storyLine')).toContainText('孫權派人請和');
  }
  await tap('#storySkip');
 }
 await expect(page.locator('#storyTitle')).toHaveText('白帝託孤');
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText('88 / 154');
 expect(await save()).toMatchObject({completed:88,coins:555,weapons:{guanyu:2},inventory:{grain:2,herb:1}});
 await page.locator('#chapterPicker').evaluate(el=>el.open=true);
 await tap('#chapterTabs [data-chapter="15"]');
 await tap('#chapterDots [data-level="88"]');
 await tap('#storySkip');
 await expect(page.locator('#battle')).toBeVisible();
 await suppressWaves();
 await page.evaluate(()=>{window.chapterBattle.lives=0});
 await advance(300);
 await toCamp();
 await expect(page.locator('#campTitle')).toHaveText('重整行裝，再來一次');
 await tap('[data-talk=zhangfei]');
 await expect(page.locator('#campTalkPortrait')).toHaveAttribute('alt','劉備');
 await expect(page.locator('#campTalkText')).toContainText('三批軍糧');
 await tap('#campTalkNext');
 await tap('#campContinue');
 if(await page.locator('#story').isVisible())await tap('#storySkip');
 await expect(page.locator('#battle')).toBeVisible();
 await page.locator('#battleSpeed').selectOption('2');
 await suppressWaves();
 for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries())await deploy(key,lane);
 await supply();
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 expect(await save()).toMatchObject({completed:88,coins:555,weapons:{guanyu:2},inventory:{grain:2,herb:1}});
 await page.goto('/hero/people.html',{waitUntil:'domcontentloaded'});
 for(const [query,name,level] of [['元雄','吳班',85],['休元','馮習',87],['公衡','黃權',88],['叔武','孫桓',86]]){
  await page.locator('#peopleSearch').fill(query);
  const card=page.locator(`[data-person="${name}"]`);
  await expect(card).toContainText('史實人物');
  await expect(card.locator('.stage-pills')).toContainText(`第 ${level} 關`);
  expect(await card.locator('img').evaluate(img=>img.decode().then(()=>img.naturalWidth))).toBe(320);
 }
 expect(errors).toEqual([]);
});
