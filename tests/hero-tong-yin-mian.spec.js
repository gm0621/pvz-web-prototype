const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const stages=[
 {level:62,chapter:11,title:'潼關相持',terrain:'pass-defense',ending:'此時馬超還不是劉備的部下',next:'渡河接應'},
 {level:125,chapter:22,title:'陰平越險',terrain:'',ending:'魏軍越過陰平險道',next:'江由開城',resultTitle:'山路補給送達'},
 {level:128,chapter:22,title:'綿竹撤兵',terrain:'pass-defense',ending:'諸葛瞻、諸葛尚與黃崇殉難',next:'成都議降',resultTitle:'撤回倖存隊伍'}
];

for(const stage of stages)test(`stage ${stage.level} clears and replays from an old save on touch`,async({page})=>{
 test.setTimeout(300000);
 const {level,chapter,next}=stage;
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({level,saveKey})=>{
  if(!localStorage.getItem(saveKey))localStorage.setItem(saveKey,JSON.stringify({
   completed:level-1,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1}},inventory:{grain:2},battleRecords:{20:80},
   skillSeen:['caocao','xiahoudun','caohong','caoren','xiahouyuan','liubei','guanyu','zhangfei'].flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
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
 async function reinforce(total,heroesOnly){
  const formation=[Math.floor(total/2),0,total-1];
  for(const [slot,key] of ['liubei','guanyu','zhangfei'].entries()){
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

 async function play({level,title,terrain,ending,resultTitle},total=3){
  await expect(page.locator('#storyTitle')).toHaveText(title);
  await tap('#storySkip');
  if(level!==128){
   if(total===5){
    const deployment=page.locator('#deployment');
    await deployment.getByRole('combobox',{name:'戰線與出戰名額'}).selectOption('5');
    for(let i=0;i<2;i++)await deployment.locator('[data-choose][aria-pressed=false]:enabled').first().tap();
   }
   await tap('#deploymentStart');
  }
  await expect(page.locator('#battle')).toBeVisible({timeout:30000});
  await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
  await expect(lanes).toHaveCount(total);
  await page.locator('#battleSpeed').selectOption('2');
  let sent=0,retreated=false,forward=false,paused=false,sawFinalDefense=false;
  const warnings=new Set(),sites=['山口','木橋','谷道'];
  const cargoLanes=[0,Math.floor(total/2),total-1];
  const positions=total===3?['上','下','中']:['第 1','第 5','第 3'];
  const cart=page.locator('#supplyCart');
  if(level===125){
   await expect(objective).toContainText('山口');
   await expect(quick).toHaveText('查看任務');
  }
  if(level===128)await expect(buttons('retreat')).toBeDisabled();
  for(let i=0;i<135&&!await result.isVisible();i++){
   const text=await objective.textContent();
   if(level===125&&await quick.textContent()==='發送糧車'){
    await expect(lanes.nth(cargoLanes[sent])).toHaveAttribute('data-supply-route','true');
    await expect(objective).toContainText(`軍糧 ${sent}／3 批`);
    await expect(objective).toContainText(sites[sent]);
    await quick.tap();
    sent++;
    await expect(cart).toBeVisible();
    await expect(cart).toContainText(`糧車 ${sent}／3`);
    await expect(quick).toHaveText('查看任務');
   }
   if(level===125&&!paused&&sent===1&&text.includes('%')){
    await pause();
    const position=()=>cart.evaluate(node=>parseFloat(node.style.left));
    const frozen=await position();
    await advance(1800);
    expect(await position()).toBe(frozen);
    await resume();
    const escort=page.locator('#units .ally[data-lane="0"]');
    await expect(escort).toHaveCount(1);
    const id=await escort.getAttribute('data-id');
    const unit=page.locator(`#units .ally[data-id="${id}"]`);
    await command(unit,'down');
    const waiting=await position();
    await expect(objective).toContainText('糧車停下，派友軍回這一路護送');
    await advance(2100);
    expect(await position()).toBe(waiting);
    await command(unit,'up');
    await expect(objective).toContainText('糧車前進中');
    expect(await position()).toBe(waiting);
    await advance(500);
    expect(await position()).toBeGreaterThan(waiting);
    paused=true;
   }
   if(level!==125){
    const wave=text.match(/第 (\d)／3 波 · (.+?)路來敵/);
    if(wave&&!warnings.has(wave[1]+wave[2])){
     if(level===128)await expect(buttons('retreat')).toBeDisabled();
     warnings.add(wave[1]+wave[2]);
    }
    if(!paused&&warnings.has('2'+positions[1])){
     await pause();
     const frozen=await objective.textContent();
     await advance(1800);
     await expect(objective).toHaveText(frozen);
     await resume();
     paused=true;
    }
   }
   if(level===62&&text.includes('三波已出場')){
    await expect(result).toBeHidden();
    sawFinalDefense=true;
   }
   if(level===128&&!forward&&i>=7){
    await command(page.locator('#units .ally[data-lane="1"]').first(),'forward');
    forward=true;
   }
   if(level===128&&!retreated&&await quick.textContent()==='全軍撤離'){
    await expect(objective).toContainText('第 3 波已到');
    expect(await page.locator('#units .enemy').count()).toBeGreaterThan(0);
    await quick.tap();
    await expect(result).toBeHidden();
    await expect(objective).toContainText('隊友軍尚未回到左側');
    retreated=true;
   }
   if(!retreated)await reinforce(total,level===125&&!paused);
   await advance(1000);
  }
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('data-outcome','victory');
  if(resultTitle)await expect(page.locator('#resultTitle')).toHaveText(resultTitle);
  await expect(page.locator('#resultText')).toContainText(ending);
  expect(paused).toBe(true);
  if(level===125){
   expect(sent).toBe(3);
   await expect(page.locator('#missionObjective')).toContainText('軍糧 3／3 批');
  }else expect([...warnings]).toEqual(positions.map((name,i)=>i+1+name));
  if(level===62){
   expect(sawFinalDefense).toBe(true);
   await expect(page.locator('#waveText')).toContainText('已全數出現');
  }
  if(level===128)expect(retreated).toBe(true);
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
 await play(stage,level===128?3:5);
 const replay=await finish(stage,'+0',230);
 expect(replay.battleRecords[level]).toBeLessThanOrEqual(first.battleRecords[level]);
 await checkReload(next,replay);
 expect(errors).toEqual([]);
});
