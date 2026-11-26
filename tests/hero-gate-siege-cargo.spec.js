const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const stages=[
 {level:60,chapter:11,title:'江陵撤守',terrain:'siege',ending:'曹仁最後撤離，周瑜取得江陵',next:'鄴城新訊',resultTitle:'保全撤離'},
 {level:99,chapter:17,title:'陳倉糧盡',terrain:'outposts',ending:'陳倉未被攻下',next:'武都陰平',resultTitle:'全軍撤回'},
 {level:140,chapter:24,title:'益州備舟',terrain:'naval',ending:'王濬的船隊從長江上游出發',next:'西陵順流',resultTitle:'船隊補給送達'}
];

for(const stage of stages)test(`stage ${stage.level} clears and replays from an old save on touch`,async({page})=>{
 test.setTimeout(300000);
 const {level,chapter,next}=stage;
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({level,saveKey})=>{
  if(!localStorage.getItem(saveKey))localStorage.setItem(saveKey,JSON.stringify({
   completed:level-1,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1}},inventory:{grain:2},battleRecords:{20:80},
   skillSeen:['caocao','xiahoudun','caohong','liubei','guanyu','zhangfei'].flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
  }));
  Element.prototype.requestFullscreen=undefined;
 },{level,saveKey});
 await page.clock.install();
 await page.goto('/hero/');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+650));
 const tap=css=>page.locator(css).tap();
 const advance=ms=>page.clock.runFor(ms);
 const save=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),saveKey);
 const lanes=page.locator('.lane'),quick=page.locator('#missionQuickAction'),objective=page.locator('#missionQuick p');
 const result=page.locator('#result'),skillIntro=page.locator('#skillIntro[open]');

 const buttons=action=>page.locator(`#missionChoices [data-action=${action}]`);
 async function pause(){
  await tap('#pauseBtn');
  await advance(100);
  await expect(page.locator('#pauseOverlay')).toBeVisible();
 }
 async function resume(){
  await tap('#resumeBtn');
  await advance(100);
 }
 async function reinforce(skipTop){
  const formation=[1,0,2];
  for(const [slot,key] of ['liubei','guanyu','zhangfei'].entries()){
   if(skipTop&&formation[slot]===0)continue;
   const card=page.locator(`#cards [data-hero=${key}]`),archer=page.locator('#cards [data-hero=archer]');
   const road=lanes.nth(formation[slot]),width=await road.evaluate(node=>node.clientWidth);
   const status=await card.locator('.card-status').textContent();
   if(status==='可出戰'){
    await card.tap();
    await road.tap({position:{x:width*.6,y:25}});
   }else if(status==='出戰中'&&await archer.locator('.card-status').textContent()==='可增援'&&/^[12]/.test(await road.locator('.lane-capacity').textContent())){
    await archer.tap();
    await road.tap({position:{x:width*.6,y:25}});
   }
   while(await skillIntro.isVisible())await tap('#skillIntroContinue');
  }
 }
 async function chooseOutpost(index){
  await tap('#missionDrawerButton');
  await buttons('outpost').nth(index).tap();
  await tap('#missionDrawerClose');
 }

 async function play(stage,order=0){
  const {level,title,terrain,ending,resultTitle}=stage;
  await expect(page.locator('#storyTitle')).toHaveText(title);
  await tap('#storySkip');
  if(level===60||level===140)await tap('#deploymentStart');
  await expect(page.locator('#battle')).toBeVisible({timeout:30000});
  await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
  await page.locator('#battleSpeed').selectOption('2');
  const secured=page.locator('.outpost-marker[data-captured=true]');
  let repaired=false,retreated=false,second=false,switched=false,covering=false;
  const batches=new Set();

  if(level===60||level===99){
   if(level===60)await expect(page.locator('#lives')).toHaveText('城門 100／100');
   await tap('#missionDrawerButton');
   await expect(buttons('retreat')).toBeDisabled();
   if(level===60)await expect(buttons('repair')).toBeDisabled();
   await tap('#missionDrawerClose');
  }
  if(level===99)await chooseOutpost(order);
  if(level===140){
   await expect(page.locator('#fleetMarker span')).toHaveText('糧船 1／3');
   await advance(1800);
   await expect(objective).toContainText('軍糧 0／3 批 · 糧船 0%');
   await expect(objective).toContainText('請派友軍護航');
  }

  for(let i=0;i<135&&!await result.isVisible();i++){
   const text=await objective.textContent();
   if(level===60&&!repaired&&(await page.locator('#lives').textContent())==='城門 75／100'){
    await pause();
    await advance(2100);
    await expect(objective).toContainText(text);
    await expect(page.locator('#lives')).toHaveText('城門 75／100');
    await resume();
    if(await quick.textContent()==='修補城門')await quick.tap();
    else{
     await tap('#missionDrawerButton');
     await buttons('repair').tap();
     await tap('#missionDrawerClose');
    }
    await expect(page.locator('#lives')).toHaveText('城門 100／100');
    await expect(objective).toContainText('修補剩 1 次');
    repaired=true;
   }
   if(level===99&&!second&&await secured.count()===1){
    await expect(secured).toContainText(order===0?'攻城前陣':'側翼陣地');
    await chooseOutpost(1-order);
    second=true;
   }
   if(level===99&&text.includes('掩護後隊')&&await quick.textContent()!=='全軍撤離'&&i%3===0){
    await expect(secured).toHaveCount(2);
    await tap('#missionDrawerButton');
    await expect(buttons('retreat')).toBeDisabled();
    await tap('#missionDrawerClose');
   }
   if(!covering&&(level===60&&i>=7||level===99&&await secured.count()===2)){
    const center=page.locator('#units .ally[data-lane="1"]').first();
    await page.locator('#unitSelect').selectOption(await center.getAttribute('data-id'));
    await tap('#commandDrawerButton');
    await tap('#orders [data-order=forward]');
    await tap('#commandDrawerClose');
    covering=true;
   }
   if((level===99||level===60&&repaired)&&!retreated&&await quick.textContent()==='全軍撤離'){
    const ahead=await page.locator('#units .ally').evaluateAll(units=>units.some(unit=>parseFloat(unit.style.left)>18));
    expect(ahead).toBe(true);
    await quick.tap();
    await expect(result).toBeHidden();
    await expect(objective).toContainText('隊友軍尚未回到左側');
    retreated=true;
   }
   if(level===140){
    const batch=text.match(/軍糧 (\d)／3 批/)?.[1];
    if(batch)batches.add(Number(batch));
    const percent=text.match(/糧船 (\d+)%/)?.[1];
    if(!switched&&batch==='1'&&Number(percent)>0){
     await expect(page.locator('#fleetMarker span')).toHaveText('糧船 2／3');
     await pause();
     await advance(1800);
     await expect(objective).toContainText(`軍糧 1／3 批 · 糧船 ${percent}%`);
     await resume();
     const currentPercent=(await objective.textContent()).match(/糧船 (\d+)%/)?.[1];
     await quick.tap();
     await buttons('channel').nth(order===0?0:2).tap();
     await expect(objective).toContainText(`軍糧 1／3 批 · 糧船 ${currentPercent}% · ${order===0?'北岸':'南岸'}`);
     await tap('#missionDrawerClose');
     switched=true;
    }
   }
   if(!retreated)await reinforce(level===60&&!repaired);
   await advance(1000);
  }
  await expect(result).toHaveAttribute('data-outcome','victory');
  await expect(result).toBeVisible();
  await expect(page.locator('#resultTitle')).toHaveText(resultTitle);
  await expect(page.locator('#resultText')).toContainText(ending);
  if(level===60)expect(repaired&&retreated).toBe(true);
  if(level===99){
   expect(second&&retreated).toBe(true);
   await expect(secured).toHaveCount(2);
  }
  if(level===140){
   expect(switched).toBe(true);
   expect([...batches]).toEqual([0,1,2]);
   await expect(page.locator('#missionObjective')).toContainText('軍糧 3／3 批 · 已抵達備舟碼頭');
  }
 }

 async function finish({level,title,ending,next},reward,coins){
  await expect(page.locator('#resultEarned')).toHaveText(reward);
  const progress=await save();
  expect(progress).toMatchObject({completed:level,coins,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1}},inventory:{grain:2},battleRecords:{20:80,[level]:expect.any(Number)}});
  await advance(4200);
  while(await skillIntro.isVisible())await tap('#skillIntroContinue');
  await tap('#resultNext');
  await expect(page.locator('#campTitle')).toContainText(title);
  await expect(page.locator('#campCoins')).toHaveText(String(coins));
  await tap('#campContinue');
  const storyLine=page.locator('#storyLine');
  const pages=Number((await page.locator('#storyCount').textContent()).split('/')[1]);
  let story=await storyLine.textContent();
  for(let i=1;i<pages&&!story.includes(ending);i++){
   await tap('#storyNext');
   story+=await storyLine.textContent();
  }
  expect(story).toContain(ending);
  await tap('#storySkip');
  await expect(page.locator('#storyTitle')).toHaveText(next);
  return progress;
 }
 async function checkReload(next,progress){
  await page.reload();
  await expect(page.locator('#homeProgress')).toContainText(next);
  expect(await save()).toEqual(progress);
 }

 await tap('#startBtn');
 await play(stage);
 const first=await finish(stage,'+80',230);
 await checkReload(next,first);
 await tap('#chapterPicker > summary');
 await tap(`#chapterTabs [data-chapter="${chapter}"]`);
 await tap(`#chapterDots [data-level="${level}"]`);
 await play(stage,1);
 const replay=await finish(stage,'+0',230);
 expect(replay.battleRecords[level]).toBeLessThanOrEqual(first.battleRecords[level]);
 await checkReload(next,replay);
 expect(errors).toEqual([]);
});
