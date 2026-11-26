const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const stages=[
 {name:'洛陽清點',route:'洛陽宮城',leader:'司馬穎',opponent:'司馬衷',guest:'司馬穎',sites:['傷員名冊','糧冊','公文'],end:'回到自己原先駐守的鄴城'},
 {name:'鄴城傳詔',route:'鄴城 → 洛陽宮城',leader:'司馬穎',opponent:'羊獻容',guest:'司馬覃',messenger:'傳詔',end:'準備奉惠帝北上'},
 {name:'河橋護駕',route:'洛陽宮城 → 河橋',leader:'司馬衷',opponent:'司馬越',guest:'嵇紹',supply:true,end:'兩軍將在蕩陰相遇'},
 {name:'蕩陰撤離',route:'河橋 → 蕩陰',leader:'司馬衷',opponent:'石超',guest:'司馬越',withdraw:true,end:'嵇紹護駕遇害，惠帝後來被帶往鄴城'},
 {name:'鄴城返洛',route:'鄴城 → 洛陽',leader:'司馬衷',opponent:'王浚',guest:'司馬穎',end:'張方掌控朝政'},
 {name:'長安西行',route:'洛陽 → 長安',leader:'司馬衷',opponent:'張方',guest:'司馬衷',supply:true,end:'張方把晉惠帝和司馬穎從洛陽帶往長安'}
];

test('166 returns home and Changan plays through on touch with original enemies and resources',async({page})=>{
 test.setTimeout(480000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const {expressionPortrait}=await import('../hero/portrait-expressions.mjs');
 await page.addInitScript(key=>{
  if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify({
   completed:165,coins:70,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1}},inventory:{grain:2},
   skillSeen:['caocao','xiahoudun','caohong'].flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
  }));
  const write=Storage.prototype.setItem;
  Storage.prototype.setItem=function(name,value){
   if(name===key&&window.blockSave)throw Error('test quota');
   return write.call(this,name,value);
  };
  Element.prototype.requestFullscreen=undefined;
 },saveKey);
 await page.clock.install();
 await page.goto('/hero/');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+700));
 const tap=selector=>page.locator(selector).tap();
 const advance=ms=>page.clock.runFor(ms);
 const save=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),saveKey);
 const result=page.locator('#result'),quick=page.locator('#missionQuickAction');
 const lanes=page.locator('#lanes .lane');
 const next=page.locator('#storyNext');
 const choose=page.locator('#missionChoices');
 async function dismissSkills(){
  while(await page.locator('#skillIntro[open]').isVisible())await tap('#skillIntroContinue');
 }
 async function deploy(key,lane){
  await tap(`#cards [data-hero=${key}]`);
  const laneButton=lanes.nth(lane);
  const width=await laneButton.evaluate(el=>el.clientWidth);
  // Deploy from an open part of the lane, away from the stacked units at its left edge.
  await laneButton.tap({position:{x:width*.6,y:12}});
  await dismissSkills();
 }
 async function begin(){
  await tap('#storySkip');
  await tap('#deploymentStart');
  await expect(page.locator('#battle')).toBeVisible({timeout:25000});
  await page.locator('#battleSpeed').selectOption('2');
 }
 async function withdraw(){
  let sawWave=false,ordered=false;
  for(let step=0;step<65&&!await result.isVisible();step++){
   sawWave||=/ [1-9][0-9]* \/ 12$/.test(await page.locator('#waveText').textContent());
   if(!ordered&&await quick.textContent()==='全軍撤離'){
    await quick.tap();
    ordered=true;
   }
   if(!ordered)for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries()){
    const status=await page.locator(`#cards [data-hero=${key}] .card-status`).textContent();
    if(status==='可出戰')await deploy(key,lane);
    else if(status==='出戰中'&&await page.locator('#cards [data-hero=archer] .card-status').textContent()==='可增援'&&
      /^[12]/.test(await lanes.nth(lane).locator('.lane-capacity').textContent()))await deploy('archer',lane);
   }
   await advance(2000);
  }
  expect(sawWave&&ordered).toBe(true);
  await expect(result).toBeVisible();
 }
 async function epilogue(button,expected){
  const count=Number((await page.locator('#storyCount').textContent()).split(' / ')[1]);
  const lines=[];
  for(let i=0;i<count;i++){
   lines.push(await page.locator('#storyLine').textContent());
   if(i===count-1)await expect(next).toHaveText(button);
   await next.tap();
  }
  expect(lines.join('')).toContain(expected);
 }
 async function enterCamp(){
  await advance(4500);
  await dismissSkills();
  await tap('#resultNext');
 }
 async function logistics(stage){
  for(let lane=0;lane<3;lane++){
   if(lane)await advance(3300);
   await deploy('archer',lane);
   await expect(page.locator(`#units .ally[data-lane="${lane}"]`)).toHaveCount(1);
  }
  if(stage.sites){
   await tap('#missionDrawerButton');
   for(const [lane,site] of stage.sites.entries()){
    const item=choose.locator('[data-action=site]').nth(lane);
    await expect(item).toHaveText(new RegExp(site));
    await item.tap();
    for(let step=0;step<8&&!await item.isDisabled();step++)await advance(1500);
    await expect(item).toBeDisabled();
   }
  }else if(stage.supply){
   for(let batch=0;batch<3;batch++){
    for(let step=0;step<9&&await quick.textContent()!=='發送糧車';step++)await advance(1500);
    await expect(quick).toHaveText('發送糧車');
    if(batch===0){
     await tap('#pauseBtn');
     await advance(1000);
     await expect(quick).toBeDisabled();
     await expect(page.locator('#missionQuick p')).toContainText('軍糧 0／3 批');
     await tap('#pauseBtn');
     await advance(100);
    }
    await quick.tap();
   }
  }else{
   await advance(1200);
   await tap('#missionDrawerButton');
   await choose.locator('[data-action=route]').first().tap();
   await tap('#missionDrawerClose');
   await tap('#pauseBtn');
   const objective=page.locator('#missionQuick p');
   await advance(100);
   await expect(objective).toContainText('已暫停，保留進度');
   const old=await objective.textContent();
   await advance(900);
   await expect(objective).toHaveText(old);
   await tap('#pauseBtn');
   for(let step=0;step<18&&!await result.isVisible();step++)await advance(1700);
  }
  await advance(500);
  await expect(result).toBeVisible();
 }

 await expect(page.locator('#homeChapterCount')).toHaveText('主篇 142 關');
 await expect(page.locator('#homeChangan')).toBeDisabled();
 await expect(page.locator('#chapterDots [data-level="167"]')).toBeDisabled();
 await tap('#homeLuoyang');
 await expect(page.locator('#storyTitle')).toHaveText('洛陽圍城');
 await begin();
 await withdraw();
 expect(await save()).toMatchObject({completed:166,coins:150});
 await enterCamp();
 await tap('#campContinue');
 await epilogue('回主選單 →','後來遭張方部下帶走並遇害');
 await expect(page.locator('#home')).toBeVisible();
 await expect(page.locator('#homeLuoyangProgress')).toContainText('6 / 6 關');
 await expect(page.locator('#homeChanganProgress')).toContainText('0 / 6 關');
 await tap('#homeChangan');

 for(const [index,stage] of stages.entries()){
  const level=167+index;
  await expect(page.locator('#storyTitle')).toHaveText(stage.name);
  await expect(page.locator('#storyChapter')).toContainText('第二十九章');
  await expect(page.locator('#journeyIntro h3')).toContainText(stage.route);
  const traveler=page.locator(stage.messenger?'#journeyIntro .map-messenger':'#journeyIntro .journey-army');
  const departure=await traveler.getAttribute('transform');
  await advance(4400);
  await expect(page.locator('#journeyIntro')).toHaveAttribute('data-arrived','true');
  if(stage.messenger){
   await expect(traveler).not.toHaveAttribute('transform',departure);
   await expect(traveler.locator('title')).toHaveText(`${stage.messenger}使者`);
   await expect(page.locator('#journeyIntro .route-inset')).toHaveAttribute('aria-label',new RegExp(`${stage.messenger}使者`));
  }
  await tap('#storyMore');
  await tap('.history-toggle');
  await expect(page.locator('#historyLesson [aria-current=step]')).toHaveText(`304 · ${stage.name}`);
  await tap('#historyLesson details summary');
  await expect(page.locator('.history-sources a').first()).toBeVisible();
  await tap('#storyDetails header button');
  await begin();
  await tap('#battleMenuButton');
  await tap('#battleMapButton');
  await expect(page.locator('#campaignMapRoute')).toHaveText(stage.route);
  const map=page.locator('#campaignMapCanvas .route-inset');
  const mapLeader=map.locator(stage.messenger?'.map-sender':'.map-leader');
  await expect(mapLeader).toHaveAttribute('data-person',stage.leader);
  await expect(mapLeader.locator('image')).toHaveAttribute('href',expressionPortrait(stage.leader));
  const opponent=map.locator('.map-opponent');
  await expect(opponent).toHaveAttribute('data-person',stage.opponent);
  await expect(opponent.locator('image')).toHaveAttribute('href',expressionPortrait(stage.opponent));
  if(stage.messenger){
   await expect(map.locator('.map-messenger title')).toHaveText(`${stage.messenger}使者`);
   await expect(page.locator('#campaignMapLocation')).toHaveText('傳詔目的地：洛陽宮城');
   await expect(page.locator('#campaignMapDetail')).toContainText('信封表示傳詔使者。');
  }
  await expect(page.locator('#pauseBtn')).toHaveAttribute('aria-pressed','true');
  await tap('#campaignMapClose');
  if(await page.locator('#battleMenu').isVisible())await tap('#battleMenuClose');
  await expect(page.locator('#pauseBtn')).toHaveAttribute('aria-pressed','false');

  if(index===5)await page.evaluate(()=>window.blockSave=true);
  if(stage.withdraw)await withdraw();
  else await logistics(stage);
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  await expect(page.locator('#resultText')).toContainText(stage.end);
  if(index===5){
   expect(await save()).toMatchObject({completed:171,coins:550});
   await expect(page.locator('#resultRetrySave')).toBeVisible();
   await page.evaluate(()=>window.blockSave=false);
   await tap('#resultRetrySave');
  }
  expect(await save()).toMatchObject({completed:level,coins:230+80*index,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1}},inventory:{grain:2}});
  await enterCamp();
  await expect(page.locator('#campTitle')).toContainText(stage.name);
  await tap('[data-talk=guanyu]');
  const portrait=page.locator('#campTalkPortrait');
  await expect(portrait).toHaveAttribute('alt',stage.guest);
  await expect(portrait).toHaveAttribute('src',expressionPortrait(stage.guest));
  await portrait.evaluate(img=>img.decode());
  await tap('#campTalkNext');
  if(index===5){
   await tap('[data-shop=items]');
   await tap('[data-buy=herb]');
   await expect(page.locator('#campCoins')).toHaveText('605');
   await tap('#campShopBack');
  }
  await tap('#campContinue');
  if(level===172)await epilogue('回主選單 →',stage.end);
  else if(level===170||level===171)await epilogue('下一段故事 →',stage.end);
  else await tap('#storySkip');
 }

 await page.reload();
 await expect(page.locator('#homeChanganProgress')).toContainText('6 / 6 關');
 await expect(page.locator('#homeLuoyangProgress')).toContainText('6 / 6 關');
 await expect(page.locator('#homeProgress')).toHaveText('英雄演義・全篇通關');
 const saved=await save();
 await tap('#homeChangan');
 await expect(page.locator('#changanChapterTabs [data-chapter="29"]')).toHaveAttribute('aria-pressed','true');
 await tap('#chapterDots [data-level="172"]');
 await begin();
 await logistics(stages[5]);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 expect(await save()).toEqual(saved);

 await page.goto('/hero/people.html',{waitUntil:'domcontentloaded'});
 for(const [query,name,levels] of [
  ['羊皇后','羊獻容',[168]],['清河王','司馬覃',[168]],['延祖','嵇紹',[169,170]],
  ['石超','石超',[169,170,171]],['彭祖','王浚',[171]]
 ]){
  await page.locator('#peopleSearch').fill(query);
  const card=page.locator(`[data-person="${name}"]`);
  await expect(card.locator('.stage-pills span')).toHaveText(levels.map(level=>new RegExp(`第 ${level} 關`)));
  await expect(card.locator('img')).toHaveAttribute('src',expressionPortrait(name));
  expect(await card.locator('img').evaluate(img=>img.decode().then(()=>img.naturalWidth))).toBe(320);
 }
 await page.locator('#peopleSearch').fill('王浚');
 await expect(page.locator('.person-card').first()).toHaveAttribute('data-person','王浚');
 await expect(page.locator('[data-person="王濬"]')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));
 expect(await save()).toEqual(saved);
 expect(errors).toEqual([]);
});
