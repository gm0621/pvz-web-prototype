const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const stages=[
 {level:102,chapter:18,title:'祁山運糧',terrain:'',ending:'諸葛亮最後撤兵',next:'木門收兵'},
 {level:106,chapter:18,title:'五丈原歸途',terrain:'pass-defense',ending:'諸葛亮病逝於五丈原',next:'棧道爭路',resultTitle:'全軍撤回'},
 {level:166,chapter:28,title:'洛陽圍城',terrain:'siege',ending:'後來遭張方部下帶走並遇害',resultTitle:'城內接應隊撤回'}
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
 async function reinforce(skipTop,heroesOnly){
  const formation=[1,0,2];
  for(const [slot,key] of ['liubei','guanyu','zhangfei'].entries()){
   if(skipTop&&formation[slot]===0)continue;
   const card=page.locator(`#cards [data-hero=${key}]`),archer=page.locator('#cards [data-hero=archer]');
   const road=lanes.nth(formation[slot]),width=await road.evaluate(node=>node.clientWidth);
   const status=await card.locator('.card-status').textContent();
   if(status==='可出戰'){
    await card.tap();
    await road.tap({position:{x:width*.6,y:25}});
   }else if(!heroesOnly&&status==='出戰中'&&await archer.locator('.card-status').textContent()==='可增援'&&/^[12]/.test(await road.locator('.lane-capacity').textContent())){
    await archer.tap();
    await road.tap({position:{x:width*.6,y:25}});
   }
   while(await skillIntro.isVisible())await tap('#skillIntroContinue');
  }
 }

 async function command(unit,order){
  await page.locator('#unitSelect').selectOption(await unit.getAttribute('data-id'));
  await tap('#commandDrawerButton');
  await tap(`#orders [data-order=${order}]`);
  await tap('#commandDrawerClose');
 }

 async function play({level,title,terrain,ending,resultTitle}){
  await expect(page.locator('#storyTitle')).toHaveText(title);
  await tap('#storySkip');
  if(level===166)await tap('#deploymentStart');
  await expect(page.locator('#battle')).toBeVisible({timeout:30000});
  await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
  await page.locator('#battleSpeed').selectOption('2');
  let sent=0,repairs=0,lastGate=100,repairsSpent=false,retreated=false,forward=false,paused=false;
  const waves=new Set(),sites=['山口','棧道','前營'];
  if(level===102){
   await expect(objective).toContainText('上路山口');
   await expect(quick).toHaveText('查看任務');
  }else{
   await tap('#missionDrawerButton');
   await expect(buttons('retreat')).toBeDisabled();
   if(level===166){
    await expect(page.locator('#lives')).toHaveText('城門 100／100');
    await expect(buttons('repair')).toBeDisabled();
    await expect(buttons('repair')).toContainText('剩 2 次');
   }
   await tap('#missionDrawerClose');
  }

  for(let i=0;i<135&&!await result.isVisible();i++){
   const text=await objective.textContent();
   if(level===102&&await quick.textContent()==='發送糧車'){
    await expect(lanes.nth(sent)).toHaveAttribute('data-supply-route','true');
    await expect(objective).toContainText(`軍糧 ${sent}／3 批`);
    await expect(objective).toContainText(sites[sent]);
    await quick.tap();
    sent++;
    await expect(page.locator('#supplyCart')).toBeVisible();
    await expect(page.locator('#supplyCart')).toContainText(`糧車 ${sent}／3`);
    await expect(quick).toHaveText('查看任務');
   }
   if(level===102&&!paused&&sent===1&&text.includes('%')){
    await pause();
    const before=await page.locator('#supplyCart').getAttribute('style');
    await advance(2000);
    await expect(page.locator('#supplyCart')).toHaveAttribute('style',before);
    await resume();
    const escort=page.locator('#units .ally[data-lane="0"]');
    await expect(escort).toHaveCount(1);
    const escortId=await escort.getAttribute('data-id');
    const selectedEscort=page.locator(`#units .ally[data-id="${escortId}"]`);
    await command(selectedEscort,'down');
    await expect(selectedEscort).toHaveAttribute('data-lane','1');
    const cart=page.locator('#supplyCart');
    const position=()=>cart.evaluate(node=>parseFloat(node.style.left));
    const waiting=await position();
    await expect(objective).toContainText('糧車停下，派友軍回這一路護送');
    await advance(2100);
    expect(await position()).toBe(waiting);
    await expect(objective).toContainText('軍糧 0／3 批');
    await command(selectedEscort,'up');
    await expect(selectedEscort).toHaveAttribute('data-lane','0');
    await expect(objective).toContainText('糧車前進中');
    expect(await position()).toBe(waiting);
    await advance(500);
    expect(await position()).toBeGreaterThan(waiting);
    paused=true;
   }
   if(level===106){
    const wave=text.match(/第 (\d)／3 波 · (.)路來敵/);
    if(wave&&!waves.has(wave[1]+wave[2])){
     await expect(buttons('retreat')).toBeDisabled();
     waves.add(wave[1]+wave[2]);
    }
    if(!paused&&waves.has('2下')){
     await pause();
     const before=await objective.textContent();
     await advance(2000);
     await expect(objective).toHaveText(before);
     await resume();
     paused=true;
    }
   }
   if(level===166&&!repairsSpent){
    const gate=Number((await page.locator('#lives').textContent()).match(/城門 (\d+)/)?.[1]);
    if(gate<lastGate){
     await tap('#missionDrawerButton');
     const repair=buttons('repair');
     await expect(repair).toContainText(`剩 ${2-repairs} 次`);
     if(repairs<2){
      await repair.tap();
      repairs++;
      lastGate=Math.min(100,gate+30);
      await expect(page.locator('#lives')).toHaveText(`城門 ${lastGate}／100`);
      await expect(repair).toContainText(`剩 ${2-repairs} 次`);
     }else{
      await expect(repair).toBeDisabled();
      await expect(buttons('retreat')).toBeEnabled();
      repairsSpent=true;
     }
     await tap('#missionDrawerClose');
    }
   }
   if(level!==102&&!forward&&i>=7){
    await command(page.locator('#units .ally[data-lane="1"]').first(),'forward');
    forward=true;
   }
   if((level===106||level===166&&repairsSpent)&&!retreated&&await quick.textContent()==='全軍撤離'){
    if(level===106){
     await expect(objective).toContainText('第 3 波已到');
     expect(await page.locator('#units .enemy').count()).toBeGreaterThan(0);
    }
    await quick.tap();
    await expect(result).toBeHidden();
    await expect(objective).toContainText('隊友軍尚未回到左側');
    retreated=true;
   }
   if(!retreated)await reinforce(level===166&&!repairsSpent,level===102&&!paused);
   await advance(1000);
  }
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('data-outcome','victory');
  if(resultTitle)await expect(page.locator('#resultTitle')).toHaveText(resultTitle);
  await expect(page.locator('#resultText')).toContainText(ending);
  if(level===102){
   expect(sent).toBe(3);
   expect(paused).toBe(true);
   await expect(page.locator('#missionObjective')).toContainText('軍糧 3／3 批');
   await expect(page.locator('#waveText')).toContainText('已全數出現');
  }
  if(level===106){
   expect([...waves]).toEqual(['1上','2下','3中']);
   expect(retreated&&paused).toBe(true);
  }
  if(level===166)expect(repairs===2&&repairsSpent&&retreated).toBe(true);
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
  if(level===166){
   await expect(page.locator('#homeChangan')).toBeEnabled();
   await expect(page.locator('#story')).toBeHidden();
  }else await expect(page.locator('#storyTitle')).toHaveText(next);
  return progress;
 }
 async function checkReload(next,progress){
  await page.reload();
  if(level===166){
   await expect(page.locator('#homeLuoyangProgress')).toContainText('6 / 6');
   await expect(page.locator('#homeChangan')).toBeEnabled();
  }else await expect(page.locator('#homeProgress')).toContainText(next);
  expect(await save()).toEqual(progress);
 }

 if(level===166)await expect(page.locator('#homeChangan')).toBeDisabled();
 await tap(level===166?'#homeLuoyang':'#startBtn');
 await play(stage);
 const first=await finish(stage,'+80',230);
 await checkReload(next,first);
 if(level===166)await tap('#homeLuoyang');
 else{
  await tap('#chapterPicker > summary');
  await tap(`#chapterTabs [data-chapter="${chapter}"]`);
 }
 await tap(`#chapterDots [data-level="${level}"]`);
 await play(stage);
 const replay=await finish(stage,'+0',230);
 expect(replay.battleRecords[level]).toBeLessThanOrEqual(first.battleRecords[level]);
 await checkReload(next,replay);
 if(level===166){
  await tap('#homeChangan');
  await expect(page.locator('#storyTitle')).toHaveText('洛陽清點');
  expect(await save()).toEqual(replay);
 }
 expect(errors).toEqual([]);
});
