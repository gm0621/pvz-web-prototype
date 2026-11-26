const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const stages=[
 {level:40,title:'烏巢奇襲',terrain:'fire-raid',hint:'點火',ending:'袁紹逃回河北',next:'倉亭再戰',boss:'淳于瓊'},
 {level:73,title:'濡須對峙',terrain:'naval',hint:'回營渡口',ending:'孫權遣使修好',next:'馬鳴閣道'},
 {level:80,title:'樊城解圍',terrain:'outposts',hint:'城門圍陣',ending:'關羽引軍撤離',next:'江陵失守',boss:'圍陣守將'}
];

for(const {level,title,terrain,hint,ending,next,boss} of stages)test(`stage ${level} completes the new mission and keeps an old save on touch`,async({page})=>{
 test.setTimeout(200000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({level,saveKey})=>{
  if(!localStorage.getItem(saveKey))localStorage.setItem(saveKey,JSON.stringify({
   completed:level-1,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1}},inventory:{grain:2},battleRecords:{20:80},
   skillSeen:['caocao','xiahoudun','caohong'].flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
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
  const formation=level===73?[1,0,2]:[0,1,2];
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
 await expect(page.locator('#deployment')).toContainText(hint);
 await tap('#deploymentStart');
 await expect(page.locator('#battle')).toBeVisible({timeout:30000});
 await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
 await page.locator('#battleSpeed').selectOption('2');
 const first=page.viewportSize().width<600?0:1;
 let lit=0,switched=false,completedSite=false,paused=false,sawBoss=false;
 if(level===40){
  await expect(markers).toHaveText(['一號糧屯','二號糧屯']);
  await quick.tap();
  for(const option of await buttons('ignite').all())await expect(option).toBeDisabled();
  await tap('#missionDrawerClose');
 }
 if(level===80){
  await expect(markers).toHaveText(['外圍營地','城門圍陣']);
  await chooseOutpost(first);
 }
 for(let i=0;i<120&&!await result.isVisible();i++){
  if(await page.locator('#bossIntro[open]').isVisible()){
   await expect(page.locator('#bossIntroTitle')).toContainText(boss);
   await tap('#bossIntroContinue');
   sawBoss=true;
  }
  const text=await objective.textContent();
  if(level===40&&lit<2){
   await quick.tap();
   const index=lit===0?first:1-first,option=buttons('ignite').nth(index);
   if(await option.isEnabled()){
    await option.tap();
    lit++;
    await expect(markers.nth(index)).toHaveAttribute('aria-label',/已點火/);
    await expect(option).toBeDisabled();
    await expect(objective).toContainText(`糧屯 ${lit}／2`);
    if(lit===2){
     await expect(page.locator('.mission-quick-heading')).toContainText('繼續作戰');
     await expect(result).toBeHidden();
    }
   }
   await tap('#missionDrawerClose');
  }
  if(level===73&&!switched&&await lanes.nth(1).getAttribute('data-hazard')==='warning'){
   const progress=Number(text.match(/主船 (\d+)%/)?.[1]);
   expect(progress).toBeGreaterThan(0);
   await pause();
   await advance(2000);
   await expect(objective).toContainText(`主船 ${progress}%`);
   await resume();
   const before=(await objective.textContent()).match(/主船 (\d+)%/)?.[1];
   await quick.tap();
   await buttons('channel').first().tap();
   await expect(objective).toContainText(`主船 ${before}% · 北岸`);
   await tap('#missionDrawerClose');
   switched=true;
  }
  if(level===80){
   if(!paused&&text.includes('佔領中')){
    const marker=await markers.nth(first).textContent();
    await pause();
    await advance(1500);
    await expect(markers.nth(first)).toHaveText(marker);
    await resume();
    paused=true;
   }
   if(!completedSite&&text.includes('解圍據點 1／2')){
    await expect(markers.nth(first)).toHaveAttribute('data-captured','true');
    await chooseOutpost(1-first);
    completedSite=true;
   }
  }
  await reinforce();
  await advance(level===73?850:1700);
 }
 await expect(result).toHaveAttribute('data-outcome','victory');
 if(level===40)expect(lit).toBe(2);
 if(level===73){
  expect(switched).toBe(true);
  await expect(page.locator('#resultTitle')).toHaveText('船隊平安回營');
 }
 if(level===80){
  expect(completedSite&&paused).toBe(true);
  await expect(page.locator('#resultTitle')).toHaveText(title);
 }
 if(boss)expect(sawBoss).toBe(true);
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
