const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const levels=[
 {level:45,title:'鄴城合圍',terrain:'outposts',record:'通關時間',first:0},
 {level:45,title:'鄴城合圍',terrain:'outposts',record:'通關時間',first:1},
 {level:87,title:'夷陵撤退',terrain:'fire',record:'損失隊伍'},
 {level:124,title:'劍閣守關',terrain:'pass-defense',record:'剩餘防線'}
];

for(const {level,title,terrain,record,first=0} of levels)test(`${level} ${level===45?(first===0?'arrow tower first':'supply point first'):'mission'} saves a personal record on touch`,async({page})=>{
 test.setTimeout(300000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({level,saveKey})=>{
  if(!localStorage.getItem(saveKey))localStorage.setItem(saveKey,JSON.stringify({
   completed:level-1,coins:150,weapons:{guanyu:2},inventory:{grain:2},
   skillSeen:['caocao','xiahoudun','caohong','liubei','guanyu','zhangfei'].flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
  }));
  Element.prototype.requestFullscreen=undefined;
 },{level,saveKey});
 await page.clock.install();
 await page.goto('/hero/');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+650));
 const tap=selector=>page.locator(selector).tap();
 const advance=ms=>page.clock.runFor(ms);
 const save=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),saveKey);
 const lanes=page.locator('.lane');
 const result=page.locator('#result');
 const quick=page.locator('#missionQuickAction');
 async function closeSkills(){
  if(await page.locator('#skillIntro[open]').isVisible())await tap('#skillIntroContinue');
 }
 async function start(){
  await expect(page.locator('#storyTitle')).toHaveText(title);
  await tap('#storySkip');
  if(level===45)await tap('#deploymentStart');
  await expect(page.locator('#battle')).toBeVisible({timeout:25000});
  await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
  await page.locator('#battleSpeed').selectOption('2');
 }
 async function reinforce(){
  for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries()){
   const card=page.locator(`#cards [data-hero=${key}]`);
   const archer=page.locator('#cards [data-hero=archer]');
   const status=await card.locator('.card-status').textContent();
   const road=lanes.nth(lane),width=await road.evaluate(node=>node.clientWidth);
   if(status==='可出戰'){
    await card.tap();
    await road.tap({position:{x:width*.63,y:12}});
   }else if(status==='出戰中'&&await archer.locator('.card-status').textContent()==='可增援'&&/^[12]/.test(await road.locator('.lane-capacity').textContent())){
    await archer.tap();
    await road.tap({position:{x:width*.63,y:12}});
   }
   await closeSkills();
  }
 }
 async function chooseOutpost(index){
  await expect(quick).toHaveText('選擇據點');
  await quick.tap();
  const buttons=page.locator('#missionChoices [data-action=outpost]');
  await expect(buttons.nth(index)).toContainText(index===0?'箭樓 · 停掉箭樓射擊':'補給點 · 軍糧補得更快');
  await buttons.nth(index).tap();
  await tap('#missionDrawerClose');
 }

 async function play(delaySecond=false){
  await start();
  const waves=new Set(),fireWarnings=new Set();
  let choseSecond=false,clearedFire=false,retreated=false,paused=false;
  if(level===45){
   const markers=page.locator('.outpost-marker:visible');
   await expect(markers).toHaveText(['箭樓','補給點']);
   const lowerMarker=await markers.last().boundingBox(),quickPanel=await page.locator('#missionQuick').boundingBox();
   expect(lowerMarker.y+lowerMarker.height).toBeLessThanOrEqual(quickPanel.y);
   await chooseOutpost(first);
  }
  if(level===87)await expect(page.locator('.lane-label')).toHaveText(['上路・安全','中路・安全','下路・安全']);
  for(let i=0;i<100&&!await result.isVisible();i++){
   await closeSkills();
   if(await page.locator('#bossIntro[open]').isVisible())await tap('#bossIntroContinue');
   const objective=await page.locator('#missionQuick p').textContent();
   if(level===45&&!choseSecond&&objective.includes('城外據點 1／2')){
    await expect(page.locator('.outpost-marker[data-captured=true]')).toHaveText(first===0?'箭樓 ✓':'補給點 ✓');
    // Delay after combat so clearing the same enemy waves cannot hide the time difference.
    const wavesCleared=/已全數出現|敵將已出陣/.test(await page.locator('#waveText').textContent())&&await page.locator('#units .enemy').count()===0;
    if(!delaySecond||wavesCleared){
     if(delaySecond)await advance(12000);
     await chooseOutpost(1-first);
     choseSecond=true;
    }
   }
   if(level===124){
    const wave=objective.match(/第 (\d)／3 波 · (.)路來敵/);
    if(wave)waves.add(wave[1]+wave[2]);
    if(!paused&&wave){
     await tap('#pauseBtn');
     await advance(100);
     await expect(page.locator('#missionQuick p')).toContainText('已暫停');
     await advance(3000);
     await expect(page.locator('#missionQuick p')).toContainText(wave[0]);
     await tap('#resumeBtn');
     await advance(100);
     paused=true;
    }
   }
   if(level===87){
    const states=await lanes.evaluateAll(items=>items.map(lane=>lane.dataset.fire));
    for(const [index,state] of states.entries()){
     if(state==='warning'){
      await expect(lanes.nth(index).locator('.lane-label')).toContainText('快起火');
      fireWarnings.add(index);
     }
    }
    const burning=states.indexOf('burning');
    if(!clearedFire&&burning>=0&&fireWarnings.has(burning)){
     await expect(lanes.nth(burning).locator('.lane-label')).toContainText('燃燒中');
     await tap('#missionDrawerButton');
     const clear=page.locator('#missionChoices [data-action=clear-fire]').nth(burning);
     if(await clear.isEnabled()){
      await clear.tap();
      await expect(lanes.nth(burning)).toHaveAttribute('data-fire','safe');
      await expect(page.locator('#missionQuick')).toContainText('開路剩 0 次');
      for(const option of await page.locator('#missionChoices [data-action=clear-fire]').all())await expect(option).toBeDisabled();
      clearedFire=true;
     }
     await tap('#missionDrawerClose');
    }
    if(clearedFire&&!retreated&&await quick.textContent()==='全軍撤離'){
     await quick.tap();
     retreated=true;
    }
   }
   if(!retreated)await reinforce();
   await advance(level===87?850:2000);
  }
  await expect(result).toBeVisible();
  if(level===45)expect(choseSecond).toBe(true);
  if(level===87)expect(clearedFire&&retreated).toBe(true);
  if(level===124)expect([...waves]).toEqual(['1上','2下','3中']);
  await expect(page.locator('#resultRecordCurrent')).toContainText(record);
  expect(await page.locator('#result').evaluate(node=>node.scrollWidth<=innerWidth)).toBe(true);
 }

 await tap('#startBtn');
 const replay=level===45&&first===0;
 await play(replay);
 await expect(page.locator('#resultRecordBest')).toContainText('個人新紀錄');
 await expect(page.locator('#resultEarned')).toHaveText('+80');
 let progress=await save();
 expect(progress).toMatchObject({completed:level,coins:230,weapons:{guanyu:2},inventory:{grain:2}});
 expect(progress.battleRecords[level]).toEqual(expect.any(Number));
 if(replay){
  const firstRecord=progress.battleRecords[level];
  async function replayLevel(){
   if(await page.locator('#experienceSkip').isVisible())await tap('#experienceSkip');
   await advance(3800);
   await closeSkills();
   await tap('#replayLevel');
  }
  await replayLevel();
  await play();
  await expect(page.locator('#resultRecordBest')).toContainText('個人新紀錄');
  await expect(page.locator('#resultEarned')).toHaveText('+0');
  const improved=(await save()).battleRecords[level];
  expect(improved).toBeLessThan(firstRecord);
  await replayLevel();
  await play(true);
  await expect(page.locator('#resultRecordBest')).toHaveText(`個人最佳 · ${improved} 秒`);
  const slower=Number((await page.locator('#resultRecordCurrent').textContent()).match(/\d+/)[0]);
  expect(slower).toBeGreaterThan(improved);
  await expect(page.locator('#resultEarned')).toHaveText('+0');
  progress=await save();
  expect(progress).toMatchObject({completed:level,coins:230,weapons:{guanyu:2},inventory:{grain:2},battleRecords:{[level]:improved}});
 }
 await page.reload();
 await expect(page.locator('#homeProgress')).toContainText(`${level} / 142`);
 expect(await save()).toEqual(progress);
 expect(errors).toEqual([]);
});
