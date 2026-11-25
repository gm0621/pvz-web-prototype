const {test,expect}=require('@playwright/test');
const saveKey='heroLegendProgress_v1';
const stages=[
 {name:'白帝託孤',route:'成都 → 永安（白帝一帶）',leader:'諸葛亮',guest:'李嚴',kind:'holdout',year:223},
 {name:'劉禪即位',route:'成都',leader:'劉禪',guest:'劉禪',kind:'dispatch',year:223},
 {name:'使吳修好',route:'成都 → 武昌（吳都）',leader:'鄧芝',guest:'鄧芝',opponent:'孫權',onMap:true,host:true,kind:'dispatch',year:223},
 {name:'務農息民',route:'成都',leader:'諸葛亮',guest:'劉禪',kind:'restoration',year:224},
 {name:'南征越巂',route:'成都 → 越巂',leader:'諸葛亮',guest:'諸葛亮',opponent:'高定',onMap:true,kind:'holdout',year:225},
 {name:'南中收兵',route:'越巂 → 滇池一帶',leader:'諸葛亮',guest:'李恢',opponent:'孟獲',kind:'supply',year:225}
];
const places=['永安（白帝一帶）','成都','武昌（吳都）','成都','越巂','滇池一帶'];
const historyCast=[
 ['劉備','諸葛亮','李嚴','劉禪'],['劉禪','諸葛亮'],['鄧芝','孫權'],
 ['劉禪','諸葛亮'],['諸葛亮','高定','李恢'],['諸葛亮','李恢','孟獲']
];

test('chapter sixteen continues a White Emperor save and completes the southern expedition on touch screens',async({page})=>{
 test.setTimeout(300000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(key=>{
  if(!localStorage.getItem(key)){
   const ids=['liubei','guanyu','zhangfei'];
   localStorage.setItem(key,JSON.stringify({
    completed:88,coins:150,weapons:{guanyu:2},heroGrowth:{caocao:{weapon:1}},inventory:{grain:2},
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
 const snapshot=()=>page.evaluate(()=>({time:window.chapterBattle.time,mission:window.chapterBattle.mission}));
 const readSave=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),saveKey);
 async function deploy(key,lane){
  await tap(`#cards [data-hero=${key}]`);
  await page.locator('.lane').nth(lane).tap({position:{x:40,y:25}});
  await advance(200);
 }

 async function arrangeWaves(cleared=true){
  await page.evaluate(cleared=>{
   const battle=window.chapterBattle;
   battle.bossSpawned=cleared;
   battle.nextSpawn=Infinity;
   battle.food=300;
  },cleared);
 }
 async function supply(){
  for(let batch=0;batch<3;batch++){
   await advance(7600);
   await expect(page.locator('#missionQuickAction')).toHaveText('發送糧車');
   await tap('#missionQuickAction');
  }
 }
 async function openCamp(){
  await advance(4200);
  while(await page.locator('#skillIntro[open]').isVisible())await tap('#skillIntroContinue');
  await tap('#resultNext');
 }

 await page.goto('/hero/');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+600));
 await expect(page.locator('#homeProgress')).toContainText('88 / 118');
 await page.locator('#chapterPicker').evaluate(el=>el.open=true);
 await tap('#chapterTabs [data-chapter="15"]');
 await tap('#chapterDots [data-level="88"]');
 await tap('#storySkip');
 await expect(page.locator('#battle')).toBeVisible({timeout:25000});
 await page.locator('#battleSpeed').selectOption('2');
 await arrangeWaves();
 for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries())await deploy(key,lane);
 await supply();
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 await openCamp();
 await expect(page.locator('#campContinue')).toContainText('第十五章尾聲');
 await tap('#campContinue');
 await expect(page.locator('#storyLine')).toContainText('孫權派人請和');
 await tap('#storySkip');

 for(const [index,stage] of stages.entries()){
  await expect(page.locator('#storyTitle')).toHaveText(stage.name);
  await expect(page.locator('#storyChapter')).toContainText('第十六章');
  await expect(page.locator('#journeyIntro .journey-army')).toHaveAttribute('data-person',stage.leader);
  await tap('#storyMore');
  await tap('.history-toggle');
  await expect(page.locator('#historyLesson [aria-current=step]')).toContainText(String(stage.year));
  await expect(page.locator('#historyLesson h3')).toContainText('蜀漢軍');
  await expect(page.locator('#historyLesson figcaption')).toHaveText(historyCast[index]);
  const portraits=await page.locator('#historyLesson figure').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().right));
  const rosterRight=(await page.locator('.history-roster').boundingBox());
  expect(Math.max(...portraits)).toBeLessThanOrEqual(rosterRight.x+rosterRight.width+1);
  await expect(page.locator('#taskPortrait')).toHaveAttribute('alt',stage.guest);
  if(index===0)await expect(page.locator('.history-fact')).toContainText('諸葛亮與李嚴輔佐太子劉禪');
  if(index===1)await expect(page.locator('.history-fact')).toContainText('在成都即位，改年號為建興');
  if(index===5)await expect(page.locator('.history-fact')).toContainText('裴松之注引《漢晉春秋》');
  await expect(page.locator('.history-sources a').first()).toHaveAttribute('href',/wikisource/);
  await tap('#storyDetails header button');
  if(index<3){
   for(let pageNumber=0;pageNumber<20&&await page.locator('#story').getAttribute('data-reader-phase')!=='quiz';pageNumber++)await tap('#storyNext');
   await expect(page.locator('#story')).toHaveAttribute('data-reader-phase','quiz');
   await expect(page.locator('#taskPortrait')).toBeVisible();
   await tap('#taskChoices button:first-child');
   await expect(page.locator('#taskFeedback')).toContainText('★');
   await tap('#storyNext');
   await expect(page.locator('.scene-cast')).toBeHidden();
  }
  await tap('#storySkip');
  await expect(page.locator('#battle')).toBeVisible({timeout:25000});
  await expect(page.locator('#battleTitle')).toContainText('蜀漢軍');
  await expect(page.locator('.lane')).toHaveCount(3);
  expect(await page.evaluate(()=>window.chapterBattle.weapons.guanyu)).toBe(2);
  await page.locator('#battleSpeed').selectOption('2');

  await tap('#battleMenuButton');
  await tap('#battleMapButton');
  await expect(page.locator('#campaignMapRoute')).toHaveText(stage.route);
  await expect(page.locator('#campaignMapCanvas .map-leader')).toHaveAttribute('data-person',stage.leader);
  await expect(page.locator('#campaignMapLocation')).toHaveText('目前：'+places[index]);
  if(stage.opponent){
   const side=stage.host?'host':'enemy';
   await expect(page.locator(`#campaignMapMatchup [data-side=${side}] img`)).toHaveAttribute('alt',stage.opponent);
  }
  const opponent=page.locator('#campaignMapCanvas .map-opponent');
  if(stage.onMap&&!stage.host)await expect(opponent).toHaveAttribute('data-person',stage.opponent);
  else await expect(opponent).toHaveCount(0);
  if(stage.host){
   await expect(page.locator('#campaignMapCanvas .map-host')).toHaveAttribute('data-person','孫權');
   await expect(page.locator('#campaignMapMatchup [data-side=host]')).toContainText('會談對象');
   await expect(page.locator('#campaignMapMatchup [data-side=army]')).toContainText('蜀漢使者');
  }
  const mapPaused=await snapshot();
  await advance(800);
  expect(await snapshot()).toEqual(mapPaused);
  await tap('#campaignMapClose');
  if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
  await advance(100);
  expect((await snapshot()).time).toBeGreaterThan(mapPaused.time);

  // Keep this browser suite focused on the real task controls and mission timers.
  // A separate engine suite plays all six stages against their regular waves.
  await arrangeWaves(!stage.host);
  await deploy('liubei',0);
  await deploy('guanyu',1);
  if(stage.host){
   await advance(1300);
   await tap('#missionDrawerButton');
   const progress=(await snapshot()).mission.travel;
   expect(progress).toBeGreaterThan(0);
   await tap('#missionChoices [data-action=route]:nth-child(3)');
   await advance(700);
   expect((await snapshot()).mission).toMatchObject({travel:progress,lane:2});
   await expect(page.locator('#missionObjective')).toContainText('請派一名友軍到下路');
   await tap('#missionChoices [data-action=route]:nth-child(1)');
   await advance(700);
   expect((await snapshot()).mission.travel).toBeGreaterThan(progress);
   await tap('#missionDrawerClose');
   await page.evaluate(()=>window.chapterBattle.bossSpawned=true);
  }
  if(stage.kind==='restoration'){
   await tap('#missionDrawerButton');
   await tap('#missionChoices [data-action=site]:nth-child(3)');
   await expect(page.locator('#missionObjective')).toContainText('糧倉・下路 · 等候友軍接應');
   await advance(700);
   expect((await snapshot()).mission.sites[2]).toBe(0);
   await tap('#missionDrawerClose');
  }
  await deploy('zhangfei',2);
  if(index===5)await page.evaluate(()=>window.blockSave=true);

  if(stage.kind==='restoration'){
   await tap('#missionDrawerButton');
   await tap('#missionChoices [data-action=site]:nth-child(1)');
   await expect(page.locator('#missionObjective')).toContainText('田間道路');
   await advance(1000);
   await tap('#pauseBtn');
   const paused=await snapshot();
   await advance(1000);
   expect(await snapshot()).toEqual(paused);
   expect(paused.mission.sites[0]).toBeGreaterThan(0);
   await expect(page.locator('#missionObjective')).toContainText('田間道路');
   await expect(page.locator('#missionQuick')).toContainText(/田間道路.*已暫停 \d+%/);
   await expect(page.locator('#missionChoices [data-action=site]:nth-child(2)')).toBeDisabled();
   await tap('#battleMenuButton');
   await tap('#battleMapButton');
   await tap('#campaignMapClose');
   if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
   await advance(500);
   await expect(page.locator('#pauseBtn')).toHaveAttribute('aria-pressed','true');
   expect(await snapshot()).toEqual(paused);
   await tap('#pauseBtn');
   await tap('#missionDrawerButton');
   await advance(6200);
   await expect(page.locator('#missionMessage')).toHaveText('田間道路已整備完成。');
   await tap('#missionChoices [data-action=site]:nth-child(2)');
   await advance(6200);
   await expect(page.locator('#missionMessage')).toHaveText('水渠已整備完成。');
   await tap('#missionChoices [data-action=site]:nth-child(3)');
   await advance(6200);
  }else if(stage.kind==='supply')await supply();
  else await advance(18500);

  await advance(300);
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  if(index===0)await expect(page.locator('#resultText')).toContainText('劉備在永安去世');
  if(index===5){
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   expect(await readSave()).toMatchObject({completed:93,coins:550});
   await page.evaluate(()=>window.blockSave=false);
   await tap('#resultRetrySave');
  }
  expect(await readSave()).toMatchObject({
   completed:89+index,coins:230+80*index,weapons:{guanyu:2},heroGrowth:{caocao:{weapon:1}},inventory:{grain:2}
  });
  await openCamp();
  await expect(page.locator('#campTitle')).toContainText(stage.name);
  await tap('[data-talk=guanyu]');
  await expect(page.locator('#campTalkName')).toHaveText(stage.guest);
  await expect(page.locator('#campTalkPortrait')).toHaveAttribute('alt',stage.guest);
  await tap('#campTalkNext');
  if(index===5){
   await tap('[data-shop=items]');
   await page.evaluate(()=>window.blockSave=true);
   await tap('[data-buy=herb]');
   await expect(page.locator('#campMessage')).toContainText('無法保存');
   await expect(page.locator('#campCoins')).toHaveText('630');
   expect(await readSave()).toMatchObject({coins:630,inventory:{herb:0}});
   await page.evaluate(()=>window.blockSave=false);
   await tap('[data-buy=herb]');
   await expect(page.locator('#campCoins')).toHaveText('605');
   await tap('#campShopBack');
  }
  await tap('#campContinue');
  if(index===5)await expect(page.locator('#storyLine')).toContainText('諸葛亮回到成都');
  await tap('#storySkip');
 }
 await expect(page.locator('#storyTitle')).toHaveText('漢中出師');
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText('94 / 118');
 expect(await readSave()).toMatchObject({completed:94,coins:605,weapons:{guanyu:2},inventory:{herb:1,grain:2}});
 await page.locator('#chapterPicker').evaluate(el=>el.open=true);
 await tap('#chapterTabs [data-chapter="16"]');
 await tap('#chapterDots [data-level="94"]');
 await tap('#storySkip');
 await expect(page.locator('#battle')).toBeVisible();
 await page.locator('#battleSpeed').selectOption('2');
 await arrangeWaves();
 for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries())await deploy(key,lane);
 await supply();
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 expect(await readSave()).toMatchObject({completed:94,coins:605,weapons:{guanyu:2},inventory:{herb:1,grain:2}});

 await page.goto('/hero/people.html',{waitUntil:'domcontentloaded'});
 for(const [query,name,level] of [['阿斗','劉禪',90],['正方','李嚴',89],['伯苗','鄧芝',91],['高定','高定',93],['德昂','李恢',94],['孟獲','孟獲',94]]){
  await page.locator('#peopleSearch').fill(query);
  const card=page.locator(`[data-person="${name}"]`);
  await expect(card).toContainText('史實人物');
  await expect(card.locator('.stage-pills')).toContainText(`第 ${level} 關`);
  expect(await card.locator('img').evaluate(img=>img.decode().then(()=>img.naturalWidth))).toBe(320);
 }
 expect(errors).toEqual([]);
});
