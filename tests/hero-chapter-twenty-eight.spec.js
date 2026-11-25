const {test,expect}=require('@playwright/test');
const saveKey='heroLegendProgress_v1';
const stages=[
 {name:'齊府勸諫',year:302,route:'齊王府',station:'上書地',leader:'鄭方',guest:'鄭方',opponent:'司馬冏',role:'接到建議',leaderRole:'上書勸諫',faction:'齊府送文隊',banner:'齊',kind:'dispatch',outcome:'齊王收到鄭方的建議'},
 {name:'河間傳檄',year:302,route:'長安 → 洛陽',leader:'司馬顒',guest:'李含',opponent:'司馬乂',role:'檄文點名',leaderRole:'自長安發檄',messenger:true,faction:'長安傳檄隊',banner:'河',kind:'dispatch',outcome:'檄文傳到洛陽'},
 {name:'宮城三日',year:302,route:'洛陽街巷 → 洛陽宮城',leader:'司馬乂',guest:'司馬衷',opponent:'董艾',role:'齊王部將',leaderRole:'入宮護帝',faction:'宮門守衛隊',banner:'長',waves:true,kind:'holdout',enemy:'齊府軍',hold:'宮門守備',outcome:'齊王司馬冏戰敗遇害'},
 {name:'長沙輔政',year:303,route:'洛陽宮城',station:'整備地',leader:'司馬乂',guest:'司馬乂',opponent:'司馬衷',role:'仍為皇帝',leaderRole:'輔理朝政',faction:'洛陽整備隊',banner:'長',kind:'restoration',sites:['糧倉','城防','公文'],outcome:'司馬乂仍在洛陽輔政'},
 {name:'兩王攻洛',year:303,route:'鄴城 → 洛陽',secondary:['長安','洛陽'],leader:'陸機',guest:'司馬乂',opponent:'張方',role:'長安路・司馬顒部',leaderRole:'鄴路・司馬穎部',faction:'洛陽迎戰隊',banner:'長',waves:true,kind:'holdout',enemy:'攻洛聯軍',hold:'洛陽外圍守備',outcome:'圍城卻仍未解除'},
 {name:'洛陽圍城',year:304,route:'洛陽宮城 → 金墉城',leader:'司馬乂',guest:'司馬衷',opponent:'司馬越',role:'在宮中拘押',leaderRole:'後被拘押',faction:'洛陽撤離隊',banner:'護',waves:true,kind:'withdraw',outcome:'後來遭張方部下帶走並遇害'}
];

test('stage 160 unlocks the optional Luoyang campaign and keeps campaign saves on touch screens',async({page})=>{
 test.setTimeout(360000);
 const {expressionPortrait}=await import('../hero/portrait-expressions.mjs');
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(key=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({
   completed:159,coins:70,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1},sun:{zhangfei:2}},inventory:{grain:2},
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
 async function controlledBattle({faction='西晉軍',sites,kind}={}){
  await tap('#storySkip');
  if(sites)await expect(page.locator('#deployment')).toContainText(sites.join('、')+'整備');
  if(kind==='dispatch')await expect(page.locator('#deployment')).toContainText('派友軍接應三隊使者');
  await tap('#deploymentStart');
  await expect(page.locator('#battle')).toBeVisible({timeout:25000});
  await expect(page.locator('#battleTitle')).toContainText(faction);
  expect(await page.evaluate(()=>window.chapterBattle.weapons)).toMatchObject({liubei:0,guanyu:1,zhangfei:0});
  await page.locator('#battleSpeed').selectOption('2');
  // Only enemy waves and starting food are sandboxed. Mission and save paths run through UI.
  await page.evaluate(kind=>{
   const battle=window.chapterBattle;
   battle.bossSpawned=kind!=='holdout';
   battle.nextSpawn=Infinity;
   battle.food=300;
  },kind);
  for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries()){
   await tap(`#cards [data-hero=${key}]`);
   await page.locator('.lane').nth(lane).tap({position:{x:40,y:25}});
   await advance(200);
  }
 }
 async function restore(sites){
  await tap('#missionDrawerButton');
  for(const [lane,site] of sites.entries()){
   const option=page.locator('#missionChoices [data-action=site]').nth(lane);
   await expect(option).toContainText(site);
   await option.tap();
   if(lane===0){
    await advance(1100);
    await tap('#pauseBtn');
    const frozen=await snapshot();
    expect(frozen.mission.site).toBe(lane);
    expect(frozen.mission.sites[lane]).toBeGreaterThan(0);
    await advance(800);
    expect(await snapshot()).toEqual(frozen);
    await expect(option).toBeDisabled();
    await tap('#pauseBtn');
   }
   await advance(6700);
   await expect(option).toBeDisabled();
  }
 }
 async function withdraw(){
  await advance(4400);
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
  await advance(4100);
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
  await expect(page.locator('#missionQuick p')).toHaveText('已暫停，保留進度 · 1 名友軍尚未回到左側');
  await expect(page.locator('#missionObjective')).toContainText('已暫停，保留進度');
  await expect(page.locator('#missionQuickAction')).toBeDisabled();
  await tap('#pauseBtn');
  await advance(4500);
 }
 async function checkRouteInset(scope,{route,leaderRole='我軍',messenger=false,station,secondary}){
  const map=page.locator(scope+' .route-inset');
  const places=route.split(' → ');
  await expect(map.locator('.route-inset-side')).toHaveText(leaderRole);
  await expect(map.locator('.route-inset-place')).toHaveText(places);
  if(secondary){
   await expect(map.locator('.route-inset-secondary text')).toHaveText(secondary);
   await expect(map.locator('.route-inset-secondary path')).toBeVisible();
  }
  if(station){
   await expect(map.locator('.route-inset-role')).toHaveText([station]);
   await expect(map.locator('.route-inset-arrow')).toHaveCount(0);
   return;
  }
  await expect(map.locator('.route-inset-role')).toHaveText(messenger?['發信處','收信處']:['起點','終點']);
  await expect(map.locator('.route-inset-arrow')).toBeVisible();
  const clear=await map.evaluate(svg=>{
   const frame=svg.getBoundingClientRect();
   const badge=svg.querySelector('.route-inset-direction');
   const leader=svg.querySelector('.map-leader,.map-messenger');
   const leaderCircle=leader.querySelector('circle');
   const shapes=[...svg.querySelectorAll('.route-inset-stop rect,.map-person circle,.map-messenger circle'),badge];
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
 async function readEpilogue(){
  const count=Number((await page.locator('#storyCount').textContent()).split(' / ')[1]);
  const lines=[];
  for(let i=0;i<count;i++){
   lines.push(await page.locator('#storyLine').textContent());
   if(i===count-1)await expect(page.locator('#storyNext')).toHaveText('回主選單 →');
   await tap('#storyNext');
  }
  await expect(page.locator('#home')).toBeVisible();
  return lines.join('');
 }
 await page.goto('/hero/');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+700));
 await expect(page.locator('#homeProgress')).toHaveText('英雄演義・全篇通關');
 await expect(page.locator('#homeExtraProgress')).toContainText('17 / 18');
 await expect(page.locator('#homeChapterCount')).toHaveText('主篇 142 關');
 await expect(page.locator('#homeLuoyang')).toBeDisabled();
 await expect(page.locator('#chapterDots [data-level="161"]')).toBeDisabled();
 await tap('#homeExtra');
 await expect(page.locator('#storyTitle')).toHaveText('齊王輔政');
 const westernJin={faction:'齊王入洛隊',sites:['印信','名冊','公文'],kind:'restoration'};
 await controlledBattle(westernJin);
 await restore(westernJin.sites);
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+80');
 expect(await readSave()).toMatchObject({completed:160,coins:150});
 await camp();
 await expect(page.locator('#campContinue')).toContainText('第二十七章尾聲');
 await tap('#campContinue');
 expect(await readEpilogue()).toContain('司馬冏以大司馬身分掌管朝政');
 await expect(page.locator('#story')).toBeHidden();
 await expect(page.locator('#homeExtraProgress')).toContainText('18 / 18');
 await expect(page.locator('#homeLuoyangProgress')).toContainText('0 / 6');
 await tap('#homeLuoyang');

 for(const [index,stage] of stages.entries()){
  const level=161+index;
  await expect(page.locator('#storyTitle')).toHaveText(stage.name);
  await expect(page.locator('#storyChapter')).toContainText('第二十八章');
  const routeSummary=stage.secondary?`${stage.route} ／ ${stage.secondary.join(' → ')}`:stage.route;
  await expect(page.locator('#journeyIntro h3')).toContainText(routeSummary);
  const courier=page.locator('#journeyIntro .map-messenger');
  const departure=stage.messenger?await courier.getAttribute('transform'):null;
  await advance(4400);
  await expect(page.locator('#journeyIntro')).toHaveAttribute('data-arrived','true');
  if(stage.messenger){
   await expect(courier).not.toHaveAttribute('transform',departure);
   await expect(courier.locator('title')).toHaveText('傳檄使者');
   await expect(page.locator('#journeyIntro .journey-army')).toHaveCount(0);
  }
  await checkRouteInset('#journeyIntro',stage);
  const travelerPortrait=page.locator(stage.messenger?'#journeyIntro .map-sender':'#journeyIntro .journey-army');
  await expect(travelerPortrait).toHaveAttribute('data-person',stage.leader);
  await expect(travelerPortrait.locator('image')).toHaveAttribute('href',expressionPortrait(stage.leader));
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
  await controlledBattle(stage);
  if(!stage.waves)await expect(page.locator('#waveText')).not.toContainText(/追兵|敵軍/);

  await tap('#battleMenuButton');
  await tap('#battleMapButton');
  await expect(page.locator('#campaignMapRoute')).toHaveText(routeSummary);
  await checkRouteInset('#campaignMapCanvas',stage);
  if(stage.messenger){
   await expect(page.locator('#campaignMapLocation')).toHaveText('傳檄目的地：洛陽');
   const ends=await page.locator('#journeyIntro .map-messenger,#campaignMapCanvas .map-messenger').evaluateAll(nodes=>
    nodes.map(node=>{const {e,f}=node.transform.baseVal.consolidate().matrix;return [Math.round(e),Math.round(f)]})
   );
   expect(ends).toHaveLength(2);
   expect(ends[0]).toEqual(ends[1]);
  }
  await expect(page.locator('#campaignMapPeriod')).toHaveText(`${stage.year} 年・${stage.faction||'西晉軍'}`);
  const mapLeader=page.locator(stage.messenger?'#campaignMapCanvas .map-sender':'#campaignMapCanvas .map-leader');
  await expect(mapLeader).toHaveAttribute('data-person',stage.leader);
  await expect(mapLeader.locator('image')).toHaveAttribute('href',expressionPortrait(stage.leader));
  const matchup=page.locator(`#campaignMapMatchup [data-side=${stage.waves?'enemy':'guest'}]`);
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

  if(level===166)await page.evaluate(()=>window.blockSave=true);
  if(stage.kind==='restoration'){
   await restore(stage.sites);
  }else if(stage.kind==='holdout'){
   await advance(4500);
   await expect(page.locator('#missionQuick')).toContainText(stage.hold);
   await tap('#pauseBtn');
   const frozen=await snapshot();
   expect(frozen.mission.hold).toBeGreaterThan(0);
   expect(frozen.mission.hold).toBeLessThan(24);
   await advance(1000);
   expect(await snapshot()).toEqual(frozen);
   await tap('#pauseBtn');
   await advance(18500);
   expect((await snapshot()).mission).toMatchObject({hold:24,done:true});
   await expect(page.locator('#result')).toBeHidden();
   await expect(page.locator('#missionQuick')).toContainText('清退後續敵軍');
   await page.evaluate(()=>{
    const battle=window.chapterBattle;
    battle.spawned=11;
    battle.nextSpawn=battle.time;
   });
   await advance(3300);
   await expect(page.locator('#waveText')).toHaveText(stage.enemy+'已全數出現');
   await expect(page.locator('#result')).toBeHidden();
   await advance(31000);
  }else if(stage.kind==='withdraw'){
   await withdraw();
  }else if(stage.kind==='dispatch'){
   await tap('#missionDrawerButton');
   await tap('#missionChoices [data-action=route]:first-child');
   await advance(650);
   expect((await snapshot()).mission.travel).toBeGreaterThan(0);
   await tap('#pauseBtn');
   const frozen=await snapshot();
   await advance(800);
   expect(await snapshot()).toEqual(frozen);
   await expect(page.locator('#missionQuick')).toContainText('已暫停，保留進度');
   await expect(page.locator('#missionObjective')).toContainText('已暫停，保留進度');
   await expect(page.locator('#missionChoices [data-action=route]:nth-child(2)')).toBeDisabled();
   await tap('#pauseBtn');
   await advance(100);
   await tap('#missionChoices [data-action=route]:nth-child(2)');
   await tap('#missionDrawerClose');
   await advance(18500);
  }else await advance(18500);

  await advance(300);
  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  await expect(page.locator('#resultText')).toContainText(stage.outcome);
  if(level===166){
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   expect(await readSave()).toMatchObject({completed:165,coins:550});
   await page.evaluate(()=>window.blockSave=false);
   await tap('#resultRetrySave');
  }
  expect(await readSave()).toMatchObject({completed:level,coins:230+80*index,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1},sun:{zhangfei:2}},inventory:{grain:2}});
  await camp();
  await expect(page.locator('#campTitle')).toContainText(stage.name);
  await expect(page.locator('.tent-banner')).toHaveText(stage.banner||'晉');
  await tap('[data-talk=guanyu]');
  const portrait=page.locator('#campTalkPortrait');
  await expect(portrait).toHaveAttribute('alt',stage.guest);
  await expect(portrait).toHaveAttribute('src',expressionPortrait(stage.guest));
  await portrait.evaluate(img=>img.decode());
  await tap('#campTalkNext');
  if(level===166){
   await tap('[data-shop=items]');
   await page.evaluate(()=>window.blockSave=true);
   await tap('[data-buy=herb]');
   await expect(page.locator('#campMessage')).toContainText('無法保存');
   await expect(page.locator('#campCoins')).toHaveText('630');
   expect((await readSave()).inventory.herb).toBe(0);
   await page.evaluate(()=>window.blockSave=false);
   await tap('[data-buy=herb]');
   await expect(page.locator('#campCoins')).toHaveText('605');
   await tap('#campShopBack');
   await expect(page.locator('#campContinue')).toContainText('第二十八章尾聲');
  }
  await tap('#campContinue');
  if(level===166){
   const ending=await readEpilogue();
   expect(ending).toContain('撤離隊護住了撤回的人');
   expect(ending).toContain('長沙王司馬乂被關在金墉城，後來遭張方部下帶走並遇害');
  }else await tap('#storySkip');
 }

 await page.reload();
 await expect(page.locator('#homeExtraProgress')).toContainText('18 / 18');
 await expect(page.locator('#homeLuoyangProgress')).toContainText('6 / 6');
 await expect(page.locator('#homeProgress')).toHaveText('英雄演義・全篇通關');
 const cleared={completed:166,coins:605,weapons:{liubei:0,guanyu:2,zhangfei:0},armyWeapons:{cao:{liubei:0,guanyu:1,zhangfei:0},sun:{zhangfei:2}},inventory:{grain:2,herb:1}};
 expect(await readSave()).toMatchObject(cleared);
 await tap('#homeLuoyang');
 await expect(page.locator('#luoyangChapterTabs [data-chapter="28"]')).toHaveAttribute('aria-pressed','true');
 await tap('#chapterDots [data-level="166"]');
 await controlledBattle(stages[5]);
 await withdraw();
 await advance(300);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 expect(await readSave()).toMatchObject(cleared);

 await page.goto('/hero/people.html',{waitUntil:'domcontentloaded'});
 for(const [query,name,levels] of [['士度','司馬乂',[162,163,164,165,166]],['子回','鄭方',[161]],['李含','李含',[162,164]],['士衡','陸機',[165]],['張方','張方',[165,166]],['元超','司馬越',[166]],['董艾','董艾',[162,163]]]){
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
