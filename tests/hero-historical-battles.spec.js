const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const whiteGate={level:34,title:'白門樓前',terrain:'',hint:'還有敵兵',ending:'呂布與陳宮被俘'};
const relief={level:112,title:'援軍解圍',terrain:'',hint:'王平穩住興勢守軍',ending:'曹爽率魏軍退去'};
const stages=[
 {level:33,title:'下邳合圍',terrain:'outposts',hint:'拿下箭樓',storyHint:'先選箭樓',ending:'不能再把下邳當成定陶',next:'白門樓前'},
 {level:57,title:'江上聯盟',terrain:'naval',hint:'護船',ending:'交戰失利後退到江北',next:'赤壁撤軍'},
 {level:58,title:'赤壁撤軍',terrain:'fire',hint:'快起火',ending:'擊敗曹軍',next:'譙縣整備'},
 {level:111,title:'興勢守關',terrain:'pass-defense',hint:'三波',storyHint:'王平主張先守住興勢',ending:'興勢仍由蜀軍守住',next:'援軍解圍'}
];

for(const stage of stages)test(`stage ${stage.level} plays from an old save through its new objective and ending on touch`,async({page})=>{
 test.setTimeout(300000);
 const {level,title,next}=stage;
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
 async function reinforce(battleLevel){
  const formation=[34,57].includes(battleLevel)?[1,0,2]:[0,1,2];
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

 async function play({level,title,terrain,hint,ending,storyHint},first=0){
  let captured=false;
  await expect(page.locator('#storyTitle')).toHaveText(title);
  await expect(page.locator('#storyLine')).toContainText(storyHint||hint);
  await tap('#storySkip');
  if(level<100){
   if(level!==34)await expect(page.locator('#deployment')).toContainText(hint);
   await tap('#deploymentStart');
  }
  await expect(page.locator('#battle')).toBeVisible({timeout:30000});
  await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
  await page.locator('#battleSpeed').selectOption('2');
  const waves=new Set();
  let choseSecond=false,changedChannel=false,sawWarning=false,clearedFire=false,retreated=false,paused=false;
  if(level===33){
   await expect(page.locator('.outpost-marker:visible')).toHaveText(['箭樓','補給點']);
   await chooseOutpost(first);
  }
  for(let i=0;i<100&&!await result.isVisible();i++){
   const text=await objective.textContent();
   if(level===34){
    if(await page.locator('#bossIntro[open]').isVisible()){
     await expect(page.locator('#bossIntroTitle')).toContainText('呂布');
     await tap('#bossIntroContinue');
    }
    captured||=await page.locator('#effects .capture').count()>0;
    await expect(page.locator('#duelDialog')).toBeHidden();
   }
   if(level===112&&i===4){
    await tap('#missionDrawerButton');
    await page.locator('#missionChoices [data-action=route]').last().tap();
    await tap('#missionDrawerClose');
   }
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
     for(const option of await page.locator('#missionChoices [data-action=clear-fire]').all())await expect(option).toBeDisabled();
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
   if(!retreated)await reinforce(level);
   const nearCapture=level===34&&await page.locator('#units .boss .health i').evaluateAll(bars=>bars.some(bar=>parseFloat(bar.style.width)<30));
   await advance(nearCapture?350:level===57||level===58?850:level===34?1200:2000);
  }
  await expect(result).toBeVisible();
  if(level===33)expect(choseSecond).toBe(true);
  if(level===34){
   expect(captured||await page.locator('#effects .capture').count()>0).toBe(true);
   await expect(page.locator('#missionObjective')).toContainText('呂布已被俘');
  }
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
 }
 async function finishGrowth(){
  await advance(4200);
  while(await skillIntro.isVisible())await tap('#skillIntroContinue');
 }
 async function enterCamp(battleTitle){
  await finishGrowth();
  await tap('#resultNext');
  await expect(page.locator('#campTitle')).toContainText(battleTitle);
 }
 async function openClearedStage(){
  const chapter={33:6,57:10,58:10,111:19}[level];
  await tap('#chapterPicker > summary');
  await tap(`#chapterTabs [data-chapter="${chapter}"]`);
  await tap(`#chapterDots [data-level="${level}"]`);
 }
 function checkSave(value,completed,coins){
  expect(value).toMatchObject({completed,coins,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1}},inventory:{grain:2},battleRecords:{20:80,[completed]:expect.any(Number)}});
 }

 await tap('#startBtn');
 await play(stage);
 await expect(page.locator('#resultEarned')).toHaveText('+80');
 const firstClear=await save();
 checkSave(firstClear,level,230);
 await enterCamp(title);
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText(next);
 expect(await save()).toEqual(firstClear);

 await openClearedStage();
 await play(stage,1);
 await expect(page.locator('#resultEarned')).toHaveText('+0');
 const replayed=await save();
 checkSave(replayed,level,230);
 expect(replayed.battleRecords[level]).toBeLessThanOrEqual(firstClear.battleRecords[level]);

 const followup={33:whiteGate,57:stages.find(s=>s.level===58),111:relief}[level];
 if(followup){
  await enterCamp(title);
  await tap('#campContinue');
  await expect(page.locator('#storySkip')).toHaveText('前往下一關');
  await tap('#storySkip');
  await play(followup);
  await expect(page.locator('#resultEarned')).toHaveText('+80');
  const advanced=await save();
  checkSave(advanced,level+1,310);
  expect(advanced.battleRecords[level]).toBe(replayed.battleRecords[level]);
  if(level===33){
   await enterCamp(followup.title);
   await tap('#campContinue');
   await expect(page.locator('#storyLine')).toContainText('呂布與陳宮被俘');
  }
  await page.reload();
  expect(await save()).toEqual(advanced);
 }else{
  await page.reload();
  expect(await save()).toEqual(replayed);
 }
 expect(errors).toEqual([]);
});
