const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const stages=[
 {level:33,title:'下邳合圍',terrain:'outposts',hint:'拿下箭樓',storyHint:'先選箭樓',ending:'不能再把下邳當成定陶',next:'白門樓前'},
 {level:57,title:'江上聯盟',terrain:'naval',hint:'護船',ending:'交戰失利後退到江北',next:'赤壁撤軍'},
 {level:58,title:'赤壁撤軍',terrain:'fire',hint:'快起火',ending:'擊敗曹軍',next:'譙縣整備'},
 {level:111,title:'興勢守關',terrain:'pass-defense',hint:'三波',storyHint:'王平主張先守住興勢',ending:'興勢仍由蜀軍守住',next:'援軍解圍'}
];

for(const stage of stages)test(`stage ${stage.level} plays from an old save through its new objective and ending on touch`,async({page})=>{
 test.setTimeout(200000);
 const {level,title,terrain,hint,ending,next}=stage;
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({level,saveKey})=>{
  if(!localStorage.getItem(saveKey))localStorage.setItem(saveKey,JSON.stringify({
   completed:level-1,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1}},inventory:{grain:2},
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
 const result=page.locator('#result');
 const skillIntro=page.locator('#skillIntro[open]');
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
  const formation=level===57?[1,0,2]:[0,1,2];
  for(const [slot,key] of ['liubei','guanyu','zhangfei'].entries()){
   const card=page.locator(`#cards [data-hero=${key}]`);
   const archer=page.locator('#cards [data-hero=archer]');
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
 async function chooseOutpost(i){
  await quick.tap();
  await page.locator('#missionChoices [data-action=outpost]').nth(i).tap();
  await tap('#missionDrawerClose');
 }

 await tap('#startBtn');
 await expect(page.locator('#storyTitle')).toHaveText(title);
 await expect(page.locator('#storyLine')).toContainText(stage.storyHint||hint);
 await tap('#storySkip');
 if(level!==111){
  await expect(page.locator('#deployment')).toContainText(hint);
  await tap('#deploymentStart');
 }
 await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
 await page.locator('#battleSpeed').selectOption('2');
 const first=page.viewportSize().width<600?0:1;
 const waves=new Set();
 let choseSecond=false,changedChannel=false,sawWarning=false,clearedFire=false,retreated=false,paused=false;
 if(level===33){
  await expect(page.locator('.outpost-marker:visible')).toHaveText(['箭樓','補給點']);
  await chooseOutpost(first);
 }
 for(let i=0;i<100&&!await result.isVisible();i++){
  const text=await objective.textContent();
  if(level===33&&!choseSecond&&text.includes('城外據點 1／2')){
   await expect(page.locator('.outpost-marker[data-captured=true]')).toHaveText(first===0?'箭樓 ✓':'補給點 ✓');
   await chooseOutpost(1-first);
   choseSecond=true;
  }
  if(level===57&&!changedChannel&&await lanes.nth(1).getAttribute('data-hazard')==='warning'){
   const travel=text.match(/主船 (\d+)%/)?.[1];
   expect(Number(travel)).toBeGreaterThan(0);
   await pause();
   await advance(2300);
   await expect(objective).toContainText(`主船 ${travel}%`);
   await resume();
   const beforeSwitch=(await objective.textContent()).match(/主船 (\d+)%/)?.[1];
   await quick.tap();
   await expect(page.locator('#missionChoices [data-action=channel]').nth(0)).toHaveText('北岸');
   await page.locator('#missionChoices [data-action=channel]').nth(0).tap();
   await expect(objective).toContainText(`主船 ${beforeSwitch}% · 北岸`);
   await tap('#missionDrawerClose');
   changedChannel=true;
  }
  if(level===58){
   const middle=lanes.nth(1);
   if(!sawWarning&&await middle.getAttribute('data-fire')==='warning'){
    await expect(middle.locator('.lane-label')).toContainText('快起火');
    await pause();
    await advance(2300);
    await expect(middle).toHaveAttribute('data-fire','warning');
    await resume();
    sawWarning=true;
   }
   if(sawWarning&&!clearedFire&&await middle.getAttribute('data-fire')==='burning'){
    await expect(middle.locator('.lane-label')).toContainText('燃燒中');
    await tap('#missionDrawerButton');
    await page.locator('#missionChoices [data-action=clear-fire]').nth(1).tap();
    await expect(middle).toHaveAttribute('data-fire','safe');
    await expect(objective).toContainText('開路剩 0 次');
    await tap('#missionDrawerClose');
    clearedFire=true;
   }
   if(clearedFire&&!retreated&&await quick.textContent()==='全軍撤離'){
    await quick.tap();
    await expect(objective).toContainText('友軍尚未回到左側');
    await expect(result).toBeHidden();
    retreated=true;
   }
  }
  if(level===111){
   const wave=text.match(/第 (\d)／3 波 · (.)路來敵/);
   if(wave)waves.add(wave[1]+wave[2]);
   if(!paused&&waves.has('2下')){
    await pause();
    await advance(2500);
    await expect(objective).toContainText('第 2／3 波 · 下路來敵 · 已暫停');
    await resume();
    paused=true;
   }
  }
  if(!retreated)await reinforce();
  await advance(level===57||level===58?850:2000);
 }
 await expect(result).toBeVisible();
 if(level===33)expect(choseSecond).toBe(true);
 if(level===57){
  expect(changedChannel).toBe(true);
  await expect(page.locator('#resultTitle')).toHaveText('主船平安抵達');
 }
 if(level===58){
  expect(clearedFire&&retreated).toBe(true);
  await expect(page.locator('#resultTitle')).toHaveText('保全撤離');
 }
 if(level===111)expect([...waves]).toEqual(['1上','2下','3中']);
 await expect(page.locator('#resultText')).toContainText(ending);
 await expect(page.locator('#resultEarned')).toHaveText('+80');
 const cleared=await save();
 expect(cleared).toMatchObject({completed:level,coins:230,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1}},inventory:{grain:2},battleRecords:{[level]:expect.any(Number)}});
 await advance(4200);
 while(await skillIntro.isVisible())await tap('#skillIntroContinue');
 await tap('#resultNext');
 await expect(page.locator('#campTitle')).toContainText(title);
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText(next);
 expect(await save()).toEqual(cleared);
 expect(errors).toEqual([]);
});
