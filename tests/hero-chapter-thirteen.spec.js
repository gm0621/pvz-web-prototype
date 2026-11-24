const {test,expect}=require('@playwright/test');
const KEY='heroLegendProgress_v1';
const stages=[
 {name:'宕渠收兵',lanes:4,map:'南鄭 → 宕渠',leader:'張郃',opponent:'張飛',guest:'張郃'},
 {name:'鄴城魏王',lanes:5,map:'鄴城',leader:'曹操',opponent:'道路游軍',guest:'曹丕'},
 {name:'濡須對峙',lanes:3,map:'居巢 → 濡須',leader:'曹操',opponent:'孫權',guest:'曹操'},
 {name:'馬鳴閣道',lanes:5,map:'陽平關 → 馬鳴閣道',leader:'徐晃',opponent:'陳式',guest:'徐晃'},
 {name:'定軍山爭高地',lanes:3,map:'陽平關 → 定軍山',leader:'劉備',opponent:'夏侯淵',guest:'黃忠'},
 {name:'漢中歸劉',lanes:3,map:'定軍山 → 沔陽',leader:'劉備',opponent:'曹操',offMap:true,guest:'法正'}
];

test('chapter thirteen continues old saves through the Hanzhong finale',async({page})=>{
 test.setTimeout(300000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(key=>{
  const ids=['caocao','xiahoudun','caohong','caoren','xiahouyuan','yujin','liubei','guanyu','zhangfei'];
  const skillSeen=ids.flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level));
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({
   completed:70,coins:100,inventory:{grain:2},weapons:{liubei:3},
   heroGrowth:{caocao:{weapon:1}},skillSeen
  }));
  const write=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,value){if(k===key&&window.blockSave)throw Error('test quota');return write.call(this,k,value)};
  Element.prototype.requestFullscreen=undefined;
 },KEY);
 await page.route('**/hero/engine.mjs?*',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:(await response.text()).replace('return {level,mission:','return window.chapterBattle={level,mission:')});
 });
 await page.clock.install();
 const tap=selector=>page.locator(selector).tap();
 const advance=ms=>page.clock.runFor(ms);
 const battle=page.locator('#battle');
 const save=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
 const suppressWaves=()=>page.evaluate(()=>{
  window.chapterBattle.bossSpawned=true;
  window.chapterBattle.nextSpawn=Infinity;
 });
 const deploy=async(key,lane)=>{
  await page.evaluate(()=>window.chapterBattle.food=300);
  await tap(`#cards [data-hero=${key}]`);
  await page.locator('.lane').nth(lane).tap({position:{x:40,y:25}});
  await advance(200);
 };
 const toCamp=async()=>{
  await advance(4000);
  while(await page.locator('#skillIntro[open]').isVisible())await tap('#skillIntroContinue');
  await tap('#resultNext');
 };

 await page.goto('/hero/');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+600));
 await expect(page.locator('#homeProgress')).toContainText('70 / 88');
 await page.locator('#chapterPicker').evaluate(el=>el.open=true);
 await tap('#chapterTabs [data-chapter="12"]');
 await tap('#chapterDots [data-level="70"]');
 await tap('#storySkip');
 await tap('#deploymentStart');
 await expect(battle).toBeVisible({timeout:25000});
 await page.locator('#battleSpeed').selectOption('2');
 await suppressWaves();
 await deploy('liubei',1);
 await advance(18500);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 await toCamp();
 await expect(page.locator('#campContinue')).toContainText('第十二章尾聲');
 await tap('#campContinue');
 await expect(page.locator('#storyLine')).toContainText('張魯從巴中率部歸降');
 await tap('#storySkip');

 for(const [i,stage] of stages.entries()){
  const shu=i>=4;
  await expect(page.locator('#storyTitle')).toHaveText(stage.name);
  await expect(page.locator('#storyChapter')).toContainText('第十三章');
  await expect(page.locator('#journeyIntro .map-leader')).toBeVisible();
  await tap('#storyMore');
  await tap('.history-toggle');
  await expect(page.locator('#historyLesson [aria-current=step]')).toHaveCount(1);
  await expect(page.locator('#historyLesson h3')).toContainText(shu?'劉備軍':'曹操軍');
  await expect(page.locator('.history-sources a').first()).toHaveAttribute('href',/wikisource/);
  await tap('#storyDetails header button');
  await tap('#storySkip');
  if(!shu){
   await expect(page.locator('#deployment')).toBeVisible();
   await page.locator('#deployment select').selectOption(String(stage.lanes));
   const chosen=page.locator('#deployment [data-choose][aria-pressed=true]');
   for(let count=await chosen.count();count<stage.lanes;count++)await page.locator('#deployment [data-choose][aria-pressed=false]').first().tap();
   await tap('#deploymentStart');
  }
  await expect(battle).toBeVisible({timeout:25000});
  await expect(page.locator('#battleTitle')).toContainText(shu?'劉備軍':'曹操軍');
  await expect(page.locator('#cards [data-hero=liubei] strong')).toHaveText(shu?'劉備':'曹操');
  await expect(page.locator('.lane')).toHaveCount(stage.lanes);
  await page.locator('#battleSpeed').selectOption('2');
  if(stage.map){
   await tap('#battleMenuButton');
   await tap('#battleMapButton');
   await expect(page.locator('#campaignMapRoute')).toHaveText(stage.map);
   await expect(page.locator('#campaignMapCanvas .map-leader')).toHaveAttribute('data-person',stage.leader);
   const marker=page.locator('#campaignMapCanvas .map-opponent');
   if(stage.offMap){
    await expect(marker).toHaveCount(0);
    const matchup=page.locator('#campaignMapMatchup [data-side=enemy]');
    await expect(matchup.locator('img')).toHaveAttribute('alt',stage.opponent);
    await expect(matchup).toContainText('曹操撤回長安');
   }else await expect(marker).toHaveAttribute('data-person',stage.opponent);
   const time=await page.evaluate(()=>window.chapterBattle.time);
   await advance(1000);
   expect(await page.evaluate(()=>window.chapterBattle.time)).toBe(time);
   await tap('#campaignMapClose');
   if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
   await advance(100);
   expect(await page.evaluate(()=>window.chapterBattle.time)).toBeGreaterThan(time);
  }
  // Control enemy waves while exercising the actual touch controls, mission clock and settlement.
  if(i===4){
   expect(await page.evaluate(()=>window.chapterBattle.weapons.liubei)).toBe(3);
   for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries())await deploy(key,lane);
   expect(await page.evaluate(()=>window.chapterBattle.skillNotice.text)).toBe('合擊・桃園同心');
   await page.evaluate(()=>{window.chapterBattle.spawned=999;window.chapterBattle.nextSpawn=0});
   await advance(100);
   await expect(page.locator('#bossIntroTitle')).toContainText('夏侯淵');
   await expect(page.locator('#bossIntroArt')).toHaveAttribute('src',/xiahou-yuan\.png$/);
   await tap('#bossIntroContinue');
   await page.evaluate(()=>window.chapterBattle.enemies[0].hp=0);
  }else{
   await suppressWaves();
   const slots=['liubei','guanyu','zhangfei','hero4','hero5'];
   for(let lane=0;lane<stage.lanes;lane++)if(i!==0||lane!==2)await deploy(slots[lane],lane);
   if(i===0){
    const requiredHero=await page.locator('#cards [data-hero=zhangfei] strong').innerText();
    await expect(page.locator('#missionQuick p')).toContainText(`${requiredHero}與友軍撤回左側`);
    expect(await page.locator('#missionQuick p').evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
    await page.evaluate(()=>window.chapterBattle.allies.forEach(unit=>unit.x=.35));
    await expect(page.locator('#missionQuickAction')).toHaveText('查看任務');
    await advance(14000);
    await expect(page.locator('#missionQuickAction')).toHaveText('全軍撤離');
    await tap('#missionQuickAction');
    await advance(7000);
    await expect(page.locator('#result')).toBeHidden();
    await expect(page.locator('#missionQuick p')).toContainText(`請召回${requiredHero}`);
    await deploy('zhangfei',2);
    await expect(page.locator('#resultTitle')).toHaveText('保全撤離');
   }else if(i===5){
    expect(await page.evaluate(()=>window.chapterBattle.weapons.guanyu)).toBe(1);
    for(let cart=0;cart<3;cart++){
     await advance(7500);
     await expect(page.locator('#missionQuickAction')).toHaveText('發送糧車');
     if(cart===2)await page.evaluate(()=>window.blockSave=true);
     await tap('#missionQuickAction');
    }
   }else await advance(18500);
  }
  await advance(100);
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  if(i===4){
   const outcome=await page.evaluate(()=>({
    defeated:window.chapterBattle.effects.some(e=>e.bossName==='夏侯淵'&&e.type==='defeat'),
    retreated:!!window.chapterBattle.bossRetreated,duel:window.chapterBattle.duelSeen
   }));
   expect(outcome).toEqual({defeated:true,retreated:false,duel:false});
   await expect(page.locator('#resultText')).toContainText('夏侯淵戰死');
  }
  if(i===5){
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   expect(await save()).toMatchObject({completed:75,coins:440,weapons:{guanyu:1}});
   await page.evaluate(()=>window.blockSave=false);
   await tap('#resultRetrySave');
  }
  expect(await save()).toMatchObject({completed:71+i,coins:180+80*i-(i===5?60:0),inventory:{grain:2},weapons:{liubei:3},heroGrowth:{caocao:{weapon:1}}});
  await toCamp();
  await expect(page.locator('#campTitle')).toContainText(stage.name);
  await tap('[data-talk=guanyu]');
  await expect(page.locator('#campTalkName')).toHaveText(stage.guest);
  await expect(page.locator('#campTalkPortrait')).toHaveAttribute('alt',stage.guest);
  await tap('#campTalkNext');
  if(i===4){
   await tap('#campPrepare');
   await expect(page.locator('#campHeroes [data-hero=liubei]')).toContainText('兵器強化 3／3');
   await tap('[data-shop=weapons]');
   const sword=page.locator('[data-buy=guanyu]');
   await expect(page.locator('[data-buy=liubei]')).toBeDisabled();
   await page.evaluate(()=>window.blockSave=true);
   await sword.tap();
   await expect(page.locator('#campMessage')).toContainText('無法保存');
   expect(await save()).toMatchObject({coins:500,weapons:{guanyu:0}});
   await page.evaluate(()=>window.blockSave=false);
   await sword.tap();
   expect(await save()).toMatchObject({coins:440,weapons:{guanyu:1},heroGrowth:{caocao:{weapon:1}}});
   await tap('#campShopBack');
  }
  await tap('#campContinue');
  if(i===4)await expect(page.locator('#storyLine')).toContainText('夏侯淵戰死');
  if(i===5){
   await expect(page.locator('#storyChapter')).toContainText('戰後');
   await expect(page.locator('#storyLine')).toContainText('漢中王');
  }
  await tap('#storySkip');
 }
 await expect(page.locator('#storyTitle')).toHaveText('沔陽傳令');
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText('76 / 88');
 expect(await save()).toMatchObject({completed:76,coins:520,weapons:{liubei:3,guanyu:1}});
 await page.goto('/hero/people.html',{waitUntil:'domcontentloaded'});
 for(const [query,name,level] of [['儁乂','張郃',71],['陳式','陳式',74],['漢升','黃忠',75],['孝直','法正',76]]){
  await page.locator('#peopleSearch').fill(query);
  const card=page.locator(`[data-person="${name}"]`);
  await expect(card).toContainText('史實人物');
  await expect(card.locator('.stage-pills')).toContainText(`第 ${level} 關`);
  expect(await card.locator('img').evaluate(img=>img.decode().then(()=>img.naturalWidth))).toBe(320);
 }
 expect(errors).toEqual([]);
});
