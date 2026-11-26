const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const surrender={level:70,title:'南鄭迎使',terrain:'',ending:'張魯從巴中率部歸降',next:'宕渠收兵'};
const stages=[
 {level:69,chapter:12,title:'陽平關夜進',terrain:'outposts',ending:'張魯此時退往巴中',next:'南鄭迎使'},
 {level:79,chapter:14,title:'漢水暴漲',terrain:'naval',ending:'于禁歸降',next:'樊城解圍'},
 {level:97,chapter:17,title:'街亭撤離',terrain:'pass-defense',ending:'街亭仍由魏軍取勝',next:'箕谷收兵'}
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
 const markers=page.locator('.outpost-marker:visible');
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
 async function reinforce(level){
  const formation=level===97?[0,1,2]:[1,0,2];
  for(const [slot,key] of ['liubei','guanyu','zhangfei'].entries()){
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
  await quick.tap();
  await buttons('outpost').nth(index).tap();
  await tap('#missionDrawerClose');
 }

 async function play({level,title,terrain,ending},first=0){
  await expect(page.locator('#storyTitle')).toHaveText(title);
  await tap('#storySkip');
  if(level<=70){
   if(level===69)await expect(page.locator('#deployment')).toContainText('側路關卡');
   await tap('#deploymentStart');
  }
  await expect(page.locator('#battle')).toBeVisible({timeout:30000});
  await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
  await page.locator('#battleSpeed').selectOption('2');
  let choseSecond=false,sawBoss=false,sawRetreat=false,switched=false,paused=false,retreated=false;
  const batches=new Set(),waves=new Set();
  if(level===69){
   await expect(markers).toHaveText(['關前哨點','側路關卡']);
   await expect(page.locator('.mission-quick-heading')).toContainText('攻關戰');
   await chooseOutpost(first);
  }
  if(level===97){
   await expect(quick).toHaveText('查看任務');
   await quick.tap();
   await expect(buttons('retreat')).toBeDisabled();
   await tap('#missionDrawerClose');
  }
  for(let i=0;i<220&&!await result.isVisible();i++){
   if(await page.locator('#bossIntro[open]').isVisible()){
    await expect(page.locator('#bossIntroTitle')).toContainText('陽平守軍主將');
    await tap('#bossIntroContinue');
    sawBoss=true;
   }
   if(level===69)sawRetreat||=await page.locator('#effects .retreat').count()>0;
   const text=await objective.textContent();
   if(level===70&&i===4){
    await quick.tap();
    await buttons('route').first().tap();
    await tap('#missionDrawerClose');
   }
   if(level===69&&!choseSecond&&text.includes('攻關據點 1／2')){
    await expect(markers.nth(first)).toHaveAttribute('data-captured','true');
    await chooseOutpost(1-first);
    choseSecond=true;
   }
   if(level===79){
    const batch=text.match(/軍糧 (\d)／3 批/)?.[1];
    if(batch)batches.add(Number(batch));
    const percent=text.match(/糧船 (\d+)%/)?.[1];
    const switchNow=first===0?await lanes.nth(1).getAttribute('data-hazard')==='warning':batch==='1'&&Number(percent)>0;
    if(!switched&&switchNow){
     expect(Number(percent)).toBeGreaterThan(0);
     await expect(page.locator('#fleetMarker span')).toHaveText(`糧船 ${Number(batch)+1}／3`);
     await pause();
     await advance(1900);
     await expect(objective).toContainText(`軍糧 ${batch}／3 批 · 糧船 ${percent}%`);
     await resume();
     const before=(await objective.textContent()).match(/糧船 (\d+)%/)?.[1];
     const delivered=(await objective.textContent()).match(/軍糧 (\d)／3 批/)?.[1];
     await quick.tap();
     await buttons('channel').nth(first===0?0:2).tap();
     await expect(objective).toContainText(`軍糧 ${delivered}／3 批 · 糧船 ${before}% · ${first===0?'北岸':'南岸'}`);
     await tap('#missionDrawerClose');
     switched=true;
    }
   }
   if(level===97){
    const wave=text.match(/第 (\d)／3 波 · (.)路來敵/);
    if(wave)waves.add(wave[1]+wave[2]);
    if(!paused&&waves.has('2下')){
     await pause();
     await advance(2400);
     await expect(objective).toContainText('第 2／3 波 · 下路來敵');
     await resume();
     const escort=page.locator('#units .ally[data-lane="1"]').first();
     await page.locator('#unitSelect').selectOption(await escort.getAttribute('data-id'));
     await tap('#commandDrawerButton');
     await tap('#orders [data-order=forward]');
     await tap('#commandDrawerClose');
     await expect(escort).toHaveAttribute('data-order','forward');
     paused=true;
    }
    if(!retreated&&await quick.textContent()==='全軍撤離'){
     await expect(objective).toContainText('第 3 波已到');
     expect(await page.locator('#units .enemy').count()).toBeGreaterThan(0);
     const forward=await page.locator('#units .ally').evaluateAll(units=>units.some(unit=>parseFloat(unit.style.left)>18));
     expect(forward).toBe(true);
     await quick.tap();
     await expect(result).toBeHidden();
     await expect(objective).toContainText('隊友軍尚未回到左側');
     retreated=true;
    }
   }
   if(!retreated)await reinforce(level);
   const nearRetreat=level===69&&await page.locator('#units .boss .health i').evaluateAll(bars=>bars.some(bar=>parseFloat(bar.style.width)<30));
   await advance(nearRetreat?350:level===79?1000:1700);
  }
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('data-outcome','victory');
  if(level===69){
   expect(choseSecond&&sawBoss).toBe(true);
   expect(sawRetreat||await page.locator('#effects .retreat').count()>0).toBe(true);
  }
  if(level===79){
   expect(switched).toBe(true);
   expect([...batches].slice(0,3)).toEqual([0,1,2]);
   await expect(page.locator('#missionObjective')).toContainText('軍糧 3／3 批');
   await expect(page.locator('#resultTitle')).toHaveText('三批軍糧平安送達');
  }
  if(level===97){
   expect([...waves]).toEqual(['1上','2下','3中']);
   expect(retreated&&paused).toBe(true);
   await expect(page.locator('#resultTitle')).toHaveText('全軍撤回');
  }
  await expect(page.locator('#resultText')).toContainText(ending);
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
  for(let i=1;i<pages&&!(await storyLine.textContent()).includes(ending);i++)await tap('#storyNext');
  await expect(storyLine).toContainText(ending);
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
 if(level===69){
  await play(surrender);
  const continued=await finish(surrender,'+80',310);
  expect(continued.battleRecords[69]).toBe(replay.battleRecords[69]);
  await checkReload(surrender.next,continued);
 }else await checkReload(next,replay);
 expect(errors).toEqual([]);
});
