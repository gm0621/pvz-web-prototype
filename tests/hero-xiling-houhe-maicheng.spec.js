const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const stages=[
 {level:138,chapter:24,title:'西陵守圍',terrain:'pass-defense',ending:'陸抗拿回西陵，晉軍撤退',next:'襄陽交印',resultTitle:'西陵守備完成'},
 {level:121,chapter:21,title:'侯和退屯',terrain:'',ending:'姜維在侯和失利後留駐沓中',next:'沓中脫身'},
 {level:82,chapter:14,title:'麥城出走',terrain:'pass-defense',ending:'關羽、關平出走途中被潘璋部下馬忠擒獲',next:'成都即位',resultTitle:'離開麥城'}
];

for(const stage of stages)test(`stage ${stage.level} clears and replays from an old save on touch`,async({page})=>{
 test.setTimeout(300000);
 const {level,chapter,next}=stage;
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({level,saveKey})=>{
  if(!localStorage.getItem(saveKey))localStorage.setItem(saveKey,JSON.stringify({
   completed:level-1,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1}},inventory:{grain:2},battleRecords:{20:80},
   skillSeen:['sunjian','chengpu','huanggai','liubei','guanyu','zhangfei'].flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
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
 async function reinforce(heroesOnly){
  const formation=level===82?[0,1,2]:[1,0,2];
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

 async function play({level,title,terrain,ending,resultTitle}){
  await expect(page.locator('#storyTitle')).toHaveText(title);
  await tap('#storySkip');
  await expect(page.locator('#battle')).toBeVisible({timeout:30000});
  await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
  await expect(lanes).toHaveCount(3);
  await page.locator('#battleSpeed').selectOption('2');
  let sent=0,escorted=0,retreated=false,forward=false,paused=false,sawFinalDefense=false;
  const warnings=new Set(),litRoutes=new Set(),sites=['山口','谷道','沓中營地'];
  const positions=['上','下','中'];
  const cart=page.locator('#supplyCart');
  const guanYu=page.locator('#units .ally').filter({has:page.getByText(/^關羽(?: · 駐守)?$/)});
  const distance=unit=>unit.evaluate(node=>parseFloat(node.style.left));
  if(level===121){
   await expect(objective).toContainText('山口');
   await expect(quick).toHaveText('查看任務');
  }
  if(level===82)await expect(buttons('retreat')).toBeDisabled();
  for(let i=0;i<135&&!await result.isVisible();i++){
   const text=await objective.textContent();
   if(level===121&&await quick.textContent()==='發送糧車'){
    await expect(lanes.nth(sent)).toHaveAttribute('data-supply-route','true');
    await expect(objective).toContainText(`軍糧 ${sent}／3 批`);
    await expect(objective).toContainText(sites[sent]);
    await quick.tap();
    sent++;
    await expect(cart).toBeVisible();
    await expect(cart).toContainText(`糧車 ${sent}／3`);
    await expect(quick).toHaveText('查看任務');
   }
   if(level===121&&sent>escorted&&text.includes('糧車前進中')){
    if(!paused){
     await pause();
     const frozen=await distance(cart);
     await advance(1800);
     expect(await distance(cart)).toBe(frozen);
     await resume();
     paused=true;
    }
    const road=sent-1;
    const escort=page.locator(`#units .ally[data-lane="${road}"]`);
    await expect(escort).toHaveCount(1);
    const id=await escort.getAttribute('data-id');
    const unit=page.locator(`#units .ally[data-id="${id}"]`);
    await command(unit,road===2?'up':'down');
    const waiting=await distance(cart);
    expect(waiting).toBeGreaterThan(0);
    await expect(objective).toContainText('糧車停下，派友軍回這一路護送');
    await advance(2100);
    expect(await distance(cart)).toBe(waiting);
    await expect(objective).toContainText(`軍糧 ${sent-1}／3 批`);
    await command(unit,road===2?'down':'up');
    await expect(objective).toContainText('糧車前進中');
    expect(await distance(cart)).toBe(waiting);
    await advance(500);
    expect(await distance(cart)).toBeGreaterThan(waiting);
    escorted++;
   }
   if(level!==121){
    const wave=text.match(/第 (\d)／3 波 · (.+?)路來敵/);
    if(wave&&!warnings.has(wave[1]+wave[2])){
     if(level===82)await expect(buttons('retreat')).toBeDisabled();
     warnings.add(wave[1]+wave[2]);
    }
    if(level===138&&wave){
     const highlighted=page.locator('.lane[data-threat=true]');
     if(await highlighted.count()){
      const expected=[0,2,1][Number(wave[1])-1];
      await expect(highlighted).toHaveAttribute('data-lane',String(expected));
      await expect(highlighted).toContainText('來敵');
      litRoutes.add(Number(wave[1]));
     }
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
   if(level===138&&text.includes('三波已出場')){
    await expect(result).toBeHidden();
    await expect(objective).toContainText(/清退剩下的 [1-9]\d* 名敵兵/);
    expect(await page.locator('#units .enemy').count()).toBeGreaterThan(0);
    sawFinalDefense=true;
   }
   if(level===82&&!forward&&i>=7){
    await command(guanYu,'forward');
    forward=true;
   }
   if(level===82&&!retreated&&await quick.textContent()==='全軍撤離'){
    await expect(objective).toContainText('第 3 波已到');
    await expect(objective).toContainText('帶關羽與友軍撤回左側');
    expect(await page.locator('#units .enemy').count()).toBeGreaterThan(0);
    expect(await distance(guanYu)).toBeGreaterThan(18);
    await quick.tap();
    await expect(result).toBeHidden();
    await expect(objective).toContainText('1 隊友軍尚未回到左側 · 等關羽回到左側');
    const allyPositions=()=>page.locator('#units .ally').evaluateAll(units=>units.map(unit=>unit.style.left));
    await pause();
    const held=await allyPositions();
    await advance(1600);
    expect(await allyPositions()).toEqual(held);
    await resume();
    retreated=true;
   }
   if(!retreated)await reinforce(level===82||level===121&&escorted<3);
   await advance(1000);
  }
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('data-outcome','victory');
  if(resultTitle)await expect(page.locator('#resultTitle')).toHaveText(resultTitle);
  await expect(page.locator('#resultText')).toContainText(ending);
  expect(paused).toBe(true);
  if(level===121){
   expect(sent).toBe(3);
   expect(escorted).toBe(3);
   await expect(page.locator('#waveText')).toContainText('已全數出現');
   await expect(page.locator('#missionObjective')).toContainText('軍糧 3／3 批');
  }else expect([...warnings]).toEqual(positions.map((name,i)=>i+1+name));
  if(level===138){
   expect(sawFinalDefense).toBe(true);
   expect([...litRoutes]).toEqual([1,2,3]);
   await expect(page.locator('#missionObjective')).toHaveText('三波已守住 · 敵軍已清退');
   await expect(page.locator('#waveText')).toContainText('已全數出現');
  }
  if(level===82)expect(retreated).toBe(true);
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
 await play(stage);
 const replay=await finish(stage,'+0',230);
 expect(replay.battleRecords[level]).toBeLessThanOrEqual(first.battleRecords[level]);
 await checkReload(next,replay);
 expect(errors).toEqual([]);
});
