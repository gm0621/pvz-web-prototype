const {test,expect}=require('@playwright/test');
const saveKey='heroLegendProgress_v1';
const stages=[
 {name:'襄陽屯田',year:269,route:'洛陽 → 襄陽',leader:'羊祜',guest:'羊祜',kind:'restoration',sites:['田地','水渠','糧倉'],outcome:'羊祜在襄陽屯田'},
 {name:'西陵守圍',year:272,route:'樂鄉 → 西陵',leader:'陸抗',guest:'陸抗',opponent:'羊祜',role:'江陵另路',matchup:'晉援軍・羊祜另一路往江陵',wu:true,enemyArmy:'晉軍援兵',kind:'holdout',outcome:'陸抗拿回西陵，晉軍撤退'},
 {name:'襄陽交印',year:278,route:'襄陽',leader:'杜預',guest:'杜預',opponent:'羊祜',role:'舉薦',station:'接任地',kind:'dispatch',outcome:'羊祜舉薦的杜預接掌荊州'},
 {name:'益州備舟',year:279,route:'益州',leader:'王濬',guest:'王濬',station:'備舟地',kind:'supply',outcome:'王濬的船隊從長江上游出發'},
 {name:'西陵順流',year:280,route:'永安 → 西陵',leader:'王濬',guest:'王濬',enemyArmy:'吳軍沿江守兵',kind:'dispatch',outcome:'這次西陵落入晉軍手中'},
 {name:'石頭城受降',year:280,route:'武昌 → 石頭城',leader:'王濬',guest:'孫皓',opponent:'孫皓',role:'請降',kind:'restoration',sites:['降書','印綬','城門'],outcome:'孫皓在石頭城向王濬投降'}
];

test('stage 136 continues through the surrender of Wu and keeps campaign saves on touch screens',async({page})=>{
 test.setTimeout(300000);
 const {expressionPortrait}=await import('../hero/portrait-expressions.mjs');
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(key=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({
   completed:136,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1},sun:{zhangfei:2}},inventory:{grain:2},
   skillSeen:['liubei','guanyu','zhangfei','caocao','xiahoudun','caohong','sunjian','chengpu','huanggai'].flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
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
 async function controlledBattle({wu=false,faction='西晉軍',sites,kind,enemyArmy,weaponRanks}={}){
  await tap('#storySkip');
  if(!wu){
   if(sites)await expect(page.locator('#deployment')).toContainText(sites.join('、')+'整備');
   if(kind==='dispatch')await expect(page.locator('#deployment')).toContainText('派友軍接應三隊使者');
   await tap('#deploymentStart');
  }
  await expect(page.locator('#battle')).toBeVisible({timeout:25000});
  await expect(page.locator('#battleTitle')).toContainText(wu?'東吳軍':faction);
  expect(await page.evaluate(()=>window.chapterBattle.weapons)).toMatchObject(weaponRanks||{liubei:0,guanyu:1,zhangfei:0});
  await page.locator('#battleSpeed').selectOption('2');
  // Only enemy waves and starting food are sandboxed. Mission and save paths run through UI.
  await page.evaluate(hasWaves=>{
   const battle=window.chapterBattle;
   battle.bossSpawned=!hasWaves;
   battle.nextSpawn=Infinity;
   battle.food=300;
  },Boolean(enemyArmy));
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
 async function checkRouteInset(scope,route,station){
  const map=page.locator(scope+' .route-inset');
  const places=route.split(' → ');
  await expect(map.locator('.route-inset-place')).toHaveText(places);
  if(places.length===1){
   await expect(map.locator('.route-inset-role')).toHaveText([station]);
   await expect(map.locator('.route-inset-arrow')).toHaveCount(0);
   return;
  }
  await expect(map.locator('.route-inset-role')).toHaveText(['起點','終點']);
  await expect(map.locator('.route-inset-arrow')).toBeVisible();
  const clear=await map.evaluate(svg=>{
   const frame=svg.getBoundingClientRect();
   const badge=svg.querySelector('.route-inset-direction');
   const leader=svg.querySelector('.map-leader');
   const leaderCircle=leader.querySelector('circle');
   const shapes=[...svg.querySelectorAll('.route-inset-stop rect,.map-person circle'),badge];
   const boxes=shapes.map(node=>node.getBoundingClientRect());
   const center=badge.parentElement.transform.baseVal.consolidate().matrix;
   const clearance=badge.r.baseVal.value+leaderCircle.r.baseVal.value;
   const separates=point=>Math.hypot(point.x-center.e,point.y-center.f)>=clearance;
   const trail=svg.querySelector('.journey-trail');
   if(trail){
    const length=trail.getTotalLength();
    if(!Array.from({length:41},(_,i)=>trail.getPointAtLength(length*i/40)).every(separates))return false;
   }
   const inside=boxes.every(box=>box.left>=frame.left&&box.right<=frame.right&&box.top>=frame.top&&box.bottom<=frame.bottom);
   const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
   const pose=leader.transform.baseVal.consolidate().matrix;
   return inside&&separates({x:pose.e,y:pose.f})&&boxes.every((box,i)=>boxes.slice(i+1).every((other,j)=>
    (shapes[i]===leaderCircle&&shapes[i+j+1]===badge)||!overlaps(box,other)
   ));
  });
  expect(clear).toBe(true);
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
 await expect(page.locator('#homeProgress')).toContainText('136 / 160');
 await expect(page.locator('#homeChapterCount')).toHaveText('第二十七章已開放');
 await expect(page.locator('#homeStageCount')).toHaveText('160 場征途');
 await expect(page.locator('#chapterDots [data-level="138"]')).toBeDisabled();
 await choose(23,136);
 await expect(page.locator('#storyTitle')).toHaveText('洛陽建晉');
 await controlledBattle({faction:'洛陽交接隊'});
 await tap('#missionDrawerButton');
 for(let lane=0;lane<3;lane++){
  await page.locator('#missionChoices [data-action=site]').nth(lane).tap();
  await advance(6700);
 }
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 await camp();
 await expect(page.locator('#campContinue')).toContainText('第二十三章尾聲');
 await tap('#campContinue');
 await expect(page.locator('#storyLine')).toContainText('西晉建立，曹魏結束');
 await tap('#storySkip');

 for(const [index,stage] of stages.entries()){
  const level=137+index;
  await expect(page.locator('#storyTitle')).toHaveText(stage.name);
  await expect(page.locator('#storyChapter')).toContainText('第二十四章');
  await expect(page.locator('#journeyIntro h3')).toContainText(stage.route);
  if([138,141,142].includes(level)){
   await advance(4400);
   await expect(page.locator('#journeyIntro')).toHaveAttribute('data-arrived','true');
  }
  await checkRouteInset('#journeyIntro',stage.route,stage.station);
  await expect(page.locator('#journeyIntro .journey-army')).toHaveAttribute('data-person',stage.leader);
  await expect(page.locator('#journeyIntro .journey-army image')).toHaveAttribute('href',expressionPortrait(stage.leader));
  if(stage.opponent)await expect(page.locator('#journeyIntro .journey-matchup small').last()).toHaveText(stage.matchup||stage.role);
  await tap('#storyMore');
  await tap('.history-toggle');
  const phase=page.locator('#historyLesson [aria-current=step]');
  await expect(phase).toHaveCount(1);
  await expect(phase).toContainText(stage.name);
  await expect(page.locator('#taskPortrait')).toHaveAttribute('alt',stage.guest);
  expect(await phase.textContent()).toBe(`${stage.year} · ${stage.name}`);
  const atlas=page.locator('.history-roster img');
  expect(await atlas.count()).toBeGreaterThan(0);
  for(const img of await atlas.all())await img.evaluate(node=>node.decode());
  await tap('#historyLesson details summary');
  await expect(page.locator('.history-sources a').first()).toBeVisible();
  await expect(page.locator('.history-sources a').first()).toHaveAttribute('href',/wikisource/);
  await tap('#storyDetails header button');
  const weaponRanks=stage.wu?{liubei:0,guanyu:0,zhangfei:2}:{liubei:level>137?1:0,guanyu:1,zhangfei:0};
  await controlledBattle({...stage,weaponRanks});
  if(stage.enemyArmy)await expect(page.locator('#waveText')).toHaveText(stage.enemyArmy+' 0 / 12');
  else await expect(page.locator('#waveText')).not.toContainText(/追兵|敵軍/);

  await tap('#battleMenuButton');
  await tap('#battleMapButton');
  await expect(page.locator('#campaignMapRoute')).toHaveText(stage.route);
  await checkRouteInset('#campaignMapCanvas',stage.route,stage.station);
  await expect(page.locator('#campaignMapPeriod')).toHaveText(`${stage.year} 年・${stage.wu?'東吳軍':'西晉軍'}`);
  await expect(page.locator('#campaignMapCanvas .map-leader')).toHaveAttribute('data-person',stage.leader);
  await expect(page.locator('#campaignMapCanvas .map-leader image')).toHaveAttribute('href',expressionPortrait(stage.leader));
  const matchup=page.locator(`#campaignMapMatchup [data-side=${stage.wu?'enemy':'guest'}]`);
  const opponent=matchup.locator('img');
  if(stage.opponent){
   await expect(matchup.locator('small')).toHaveText(stage.matchup||stage.role);
   await expect(page.locator('#campaignMapCanvas .route-inset-opponent-role')).toHaveText(stage.role);
   await expect(opponent).toHaveAttribute('alt',stage.opponent);
   await expect(opponent).toHaveAttribute('src',expressionPortrait(stage.opponent));
   await opponent.evaluate(img=>img.decode());
  }else await expect(opponent).toHaveCount(0);
  await expect(page.locator('#campaignMapCanvas .map-opponent')).toHaveCount(stage.opponent?1:0);
  const paused=await snapshot();
  await advance(600);
  expect(await snapshot()).toEqual(paused);
  await tap('#campaignMapClose');
  if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
  await advance(100);
  expect((await snapshot()).time).toBeGreaterThan(paused.time);

  if(level===142)await page.evaluate(()=>window.blockSave=true);
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
   for(const [lane,site] of stage.sites.entries()){
    const option=page.locator('#missionChoices [data-action=site]').nth(lane);
    await expect(option).toContainText(site);
    await option.tap();
    if(level===137&&lane===0){
     await advance(1100);
     await tap('#pauseBtn');
     const frozen=await snapshot();
     expect(frozen.mission.site).toBe(lane);
     expect(frozen.mission.sites[lane]).toBeGreaterThan(0);
     await advance(800);
     expect(await snapshot()).toEqual(frozen);
     await tap('#pauseBtn');
    }
    await advance(6700);
    await expect(option).toBeDisabled();
   }
  }else if(stage.kind==='holdout'){
   await advance(4500);
   await expect(page.locator('#missionQuick')).toContainText('西陵守備');
   await tap('#pauseBtn');
   const frozen=await snapshot();
   expect(frozen.mission.hold).toBeGreaterThan(0);
   expect(frozen.mission.hold).toBeLessThan(24);
   await advance(1000);
   expect(await snapshot()).toEqual(frozen);
   await tap('#pauseBtn');
   await advance(100);
   const guardId=await page.evaluate(()=>String(window.chapterBattle.allies.find(u=>u.key==='zhangfei').id));
   await page.locator('#unitSelect').selectOption(guardId);
   await tap('#commandDrawerButton');
   await tap('#orders [data-order="up"]');
   await tap('#commandDrawerClose');
   const missing=(await snapshot()).mission.hold;
   await advance(1000);
   expect((await snapshot()).mission.hold).toBe(missing);
   await expect(page.locator('#missionQuick')).toContainText('下路缺接應');
   await tap('#cards [data-hero=archer]');
   await page.locator('.lane').nth(2).tap({position:{x:40,y:25}});
   await advance(18500);
  }else if(stage.kind==='dispatch'){
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

  if(stage.enemyArmy){
   expect((await snapshot()).mission.done).toBe(true);
   await expect(page.locator('#result')).toBeHidden();
   await page.evaluate(()=>{
    const battle=window.chapterBattle;
    battle.spawned=11;
    battle.nextSpawn=battle.time;
   });
   await advance(3300);
   await expect(page.locator('#waveText')).toHaveText(stage.enemyArmy+'已全數出現');
   await expect(page.locator('#result')).toBeHidden();
   await advance(31000);
  }
  await advance(300);
  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  await expect(page.locator('#resultText')).toContainText(stage.outcome);
  if(level===142){
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   expect(await readSave()).toMatchObject({completed:141,coins:310});
   await page.evaluate(()=>window.blockSave=false);
   await tap('#resultRetrySave');
  }
  const balance=230+80*index-(level>137?60:0)-(level>138?180:0);
  expect(await readSave()).toMatchObject({
   completed:level,coins:balance,weapons:{guanyu:2},
   armyWeapons:{cao:{liubei:level>137?1:0,guanyu:1},sun:{zhangfei:level>138?3:2}},inventory:{grain:2}
  });
  await camp();
  await expect(page.locator('#campTitle')).toContainText(stage.name);
  await expect(page.locator('.tent-banner')).toHaveText(stage.wu?'吳':'晉');
  await tap('[data-talk=guanyu]');
  const portrait=page.locator('#campTalkPortrait');
  await expect(portrait).toHaveAttribute('alt',stage.guest);
  await expect(portrait).toHaveAttribute('src',expressionPortrait(stage.guest));
  await portrait.evaluate(img=>img.decode());
  await tap('#campTalkNext');
  if(level===137||level===138){
   await tap('[data-shop=weapons]');
   const name=level===137?'曹操':'黃蓋',rank=level===137?0:2,price=level===137?60:180;
   const item=page.locator('#shopGoods .goods-card').filter({hasText:name+'・兵器整備'});
   await expect(item).toContainText(`已強化 ${rank} / 3`);
   await item.getByRole('button',{name:`購買 · ${price} 軍資`}).tap();
   await expect(item).toContainText(`已強化 ${rank+1} / 3`);
   await expect(page.locator('#campCoins')).toHaveText(String(balance-price));
   await tap('#campShopBack');
  }
  if(level===142){
   await tap('[data-shop=items]');
   await page.evaluate(()=>window.blockSave=true);
   await tap('[data-buy=herb]');
   await expect(page.locator('#campMessage')).toContainText('無法保存');
   await expect(page.locator('#campCoins')).toHaveText('390');
   expect((await readSave()).inventory.herb).toBe(0);
   await page.evaluate(()=>window.blockSave=false);
   await tap('[data-buy=herb]');
   await expect(page.locator('#campCoins')).toHaveText('365');
   await tap('#campShopBack');
   await expect(page.locator('#campContinue')).toContainText('第二十四章尾聲');
  }
  await tap('#campContinue');
  if(level===142)await expect(page.locator('#storyLine')).toContainText('孫皓在石頭城向王濬投降');
  await tap('#storySkip');
 }

 await expect(page.locator('#storyTitle')).toHaveText('孫皓入洛');
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText('142 / 160');
 const cleared={completed:142,coins:365,weapons:{liubei:0,guanyu:2,zhangfei:0},armyWeapons:{cao:{liubei:1,guanyu:1,zhangfei:0},sun:{zhangfei:3}},inventory:{grain:2,herb:1}};
 expect(await readSave()).toMatchObject(cleared);
 await choose(24,142);
 await controlledBattle({...stages[5],weaponRanks:{liubei:1,guanyu:1,zhangfei:0}});
 await tap('#missionDrawerButton');
 for(let lane=0;lane<3;lane++){
  await page.locator('#missionChoices [data-action=site]').nth(lane).tap();
  await advance(6700);
 }
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 expect(await readSave()).toMatchObject(cleared);

 await page.goto('/hero/people.html',{waitUntil:'domcontentloaded'});
 for(const [query,name,levels] of [['叔子','羊祜',[137,138,139]],['幼節','陸抗',[137,138,139]],['步闡','步闡',[138]],['元凱','杜預',[139,141]],['王浚','王濬',[140,141,142]],['吳末帝','孫皓',[142,143]]]){
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
