const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const stages=[
 {level:69,title:'陽平關夜進',terrain:'outposts',ending:'張魯此時退往巴中',next:'南鄭迎使'},
 {level:79,title:'漢水暴漲',terrain:'naval',ending:'于禁歸降',next:'樊城解圍'},
 {level:97,title:'街亭撤離',terrain:'pass-defense',ending:'街亭仍由魏軍取勝',next:'箕谷收兵'}
];

for(const {level,title,terrain,ending,next} of stages)test(`stage ${level} clears its new mission and keeps an old save on touch`,async({page})=>{
 test.setTimeout(240000);
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
 async function reinforce(){
  const formation=level===97?[0,2,1]:[1,0,2];
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

 await tap('#startBtn');
 await expect(page.locator('#storyTitle')).toHaveText(title);
 await tap('#storySkip');
 if(level===69){
  await expect(page.locator('#deployment')).toContainText('側路關卡');
  await tap('#deploymentStart');
 }
 await expect(page.locator('#battle')).toBeVisible({timeout:30000});
 await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
 await page.locator('#battleSpeed').selectOption('2');
 const first=page.viewportSize().width<600?0:1;
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
 for(let i=0;i<160&&!await result.isVisible();i++){
  if(await page.locator('#bossIntro[open]').isVisible()){
   await expect(page.locator('#bossIntroTitle')).toContainText('陽平守軍主將');
   await tap('#bossIntroContinue');
   sawBoss=true;
  }
  if(level===69)sawRetreat||=await page.locator('#effects .retreat').count()>0;
  const text=await objective.textContent();
  if(level===69&&!choseSecond&&text.includes('攻關據點 1／2')){
   await expect(markers.nth(first)).toHaveAttribute('data-captured','true');
   await chooseOutpost(1-first);
   choseSecond=true;
  }
  if(level===79){
   const batch=text.match(/軍糧 (\d)／3 批/)?.[1];
   if(batch)batches.add(Number(batch));
   if(!switched&&await lanes.nth(1).getAttribute('data-hazard')==='warning'){
    const percent=text.match(/糧船 (\d+)%/)?.[1];
    expect(Number(percent)).toBeGreaterThan(0);
    await pause();
    await advance(1900);
    await expect(objective).toContainText(`糧船 ${percent}%`);
    await resume();
    const before=(await objective.textContent()).match(/糧船 (\d+)%/)?.[1];
    await quick.tap();
    await buttons('channel').first().tap();
    await expect(objective).toContainText(`糧船 ${before}% · 北岸`);
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
    paused=true;
   }
   if(!retreated&&await quick.textContent()==='全軍撤離'){
    await expect(objective).toContainText('第 3 波已到');
    expect(await page.locator('#units .enemy').count()).toBeGreaterThan(0);
    await quick.tap();
    retreated=true;
   }
  }
  if(!retreated)await reinforce();
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
 await expect(page.locator('#resultEarned')).toHaveText('+80');
 const progress=await save();
 expect(progress).toMatchObject({completed:level,coins:230,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1}},inventory:{grain:2},battleRecords:{20:80,[level]:expect.any(Number)}});
 await advance(4200);
 while(await skillIntro.isVisible())await tap('#skillIntroContinue');
 await tap('#resultNext');
 await expect(page.locator('#campTitle')).toContainText(title);
 await tap('#campContinue');
 await tap('#storySkip');
 await expect(page.locator('#storyTitle')).toHaveText(next);
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText(next);
 expect(await save()).toEqual(progress);
 expect(errors).toEqual([]);
});
