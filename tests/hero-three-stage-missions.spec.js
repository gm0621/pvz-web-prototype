const {test,expect}=require('@playwright/test');

const saveKey='heroLegendProgress_v1';
const stages=[
 {level:138,kind:'defense',chapter:24,title:'西陵守圍',terrain:'pass-defense',ending:'陸抗拿回西陵，晉軍撤退',next:'襄陽交印',resultTitle:'西陵守備完成'},
 {level:121,kind:'supply',stops:['山口','谷道','沓中營地'],chapter:21,title:'侯和退屯',terrain:'',ending:'姜維在侯和失利後留駐沓中',next:'沓中脫身'},
 {level:82,kind:'withdrawal',chapter:14,title:'麥城出走',terrain:'pass-defense',ending:'關羽、關平出走途中被潘璋部下馬忠擒獲',next:'成都即位',resultTitle:'離開麥城'},
 {level:146,kind:'defense',chapter:25,title:'楊駿之變',terrain:'pass-defense',ending:'楊駿被殺',next:'汝南王入朝',resultTitle:'街巷守備完成',bonusButton:'homeExtra',bonusClears:4},
 {level:110,kind:'supply',stops:['山路口','接應站','涪縣營地'],chapter:19,title:'涪城轉運',terrain:'',ending:'補給送到涪縣',next:'興勢守關'},
 {level:170,kind:'withdrawal',chapter:29,title:'蕩陰撤離',terrain:'pass-defense',ending:'嵇紹護駕遇害，惠帝後來被帶往鄴城',next:'鄴城返洛',resultTitle:'接應隊撤回',bonusButton:'homeChangan',bonusClears:4},
 {level:151,kind:'supply',stops:['出城路口','路上驛站','許昌城門'],chapter:26,title:'許昌幽居',terrain:'',ending:'司馬遹在許昌遇害',next:'賈后被廢',resultTitle:'隨行補給送達',bonusButton:'homeExtra',bonusClears:9,peaceful:true},
 {level:152,kind:'defense',chapter:26,title:'賈后被廢',terrain:'pass-defense',ending:'賈南風被廢，張華與裴頠遇害',next:'淮南王起兵',resultTitle:'護送守備完成',bonusButton:'homeExtra',bonusClears:10},
 {level:157,kind:'withdrawal',chapter:27,title:'黃橋收兵',terrain:'pass-defense',ending:'成都王前鋒吃了敗仗',next:'湨水反擊',resultTitle:'黃橋散兵撤回',bonusButton:'homeExtra',bonusClears:15},
 {level:153,kind:'withdrawal',chapter:26,title:'淮南王起兵',terrain:'pass-defense',ending:'淮南王司馬允敗亡',next:'趙王篡位',resultTitle:'撤離隊平安返回',bonusButton:'homeExtra',bonusClears:11},
 {level:156,kind:'defense',chapter:27,title:'潁陰守營',terrain:'pass-defense',ending:'齊王在潁陰反擊，張泓暫退',next:'黃橋收兵',resultTitle:'潁陰防線守住',bonusButton:'homeExtra',bonusClears:14},
 {level:169,kind:'supply',stops:['出城路口','河畔驛站','河橋營地'],chapter:29,title:'河橋護駕',terrain:'',ending:'兩軍將在蕩陰相遇',next:'蕩陰撤離',resultTitle:'河橋補給送達',bonusButton:'homeChangan',bonusClears:3,peaceful:true},
 {level:148,kind:'withdrawal',chapter:25,title:'洛陽再變',terrain:'pass-defense',ending:'司馬亮與衛瓘遇害，楚王司馬瑋隨後也被處死',next:'賈后掌權',resultTitle:'撤離隊平安返回',bonusButton:'homeExtra',bonusClears:6},
 {level:158,kind:'defense',chapter:27,title:'湨水反擊',terrain:'pass-defense',ending:'成都王在湨水得勝並渡河',next:'惠帝復位',resultTitle:'湨水渡路守住',bonusButton:'homeExtra',bonusClears:16},
 {level:172,kind:'supply',stops:['西行路口','途中驛站','長安城門'],chapter:29,title:'長安西行',terrain:'',ending:'張方把晉惠帝和司馬穎從洛陽帶往長安',resultTitle:'西行補給送達',bonusButton:'homeChangan',bonusClears:6,peaceful:true},
 {level:109,kind:'defense',chapter:19,title:'漢中整軍',terrain:'pass-defense',ending:'漢中的隊伍整備完成',next:'涪城轉運'},
 {level:122,kind:'withdrawal',chapter:21,title:'沓中脫身',terrain:'pass-defense',ending:'姜維趕過陰平橋頭',next:'漢壽會師',resultTitle:'全軍撤回'},
 {level:143,kind:'supply',stops:['石頭城外','途中驛站','洛陽城門'],chapter:25,title:'孫皓入洛',terrain:'',ending:'孫皓到了洛陽，受封歸命侯',next:'太康裁兵',resultTitle:'隨行補給送達',bonusButton:'homeExtra',bonusClears:1,peaceful:true,sun:true},
 {level:119,kind:'withdrawal',chapter:21,title:'段谷撤兵',terrain:'pass-defense',ending:'蜀軍在段谷戰敗',next:'芒水相持',resultTitle:'全軍撤回'},
 {level:120,kind:'defense',chapter:21,title:'芒水相持',terrain:'pass-defense',ending:'兩軍在芒水一帶相持',next:'侯和退屯'},
 {level:135,kind:'supply',stops:['成都城外','途中驛站','洛陽城門'],chapter:23,title:'安樂公入洛',terrain:'',ending:'劉禪到洛陽後受封安樂公',next:'洛陽建晉',resultTitle:'隨行補給送達',peaceful:true},
 {level:71,kind:'withdrawal',chapter:13,title:'宕渠收兵',terrain:'pass-defense',ending:'張郃收攏隊伍，退回南鄭',next:'鄴城魏王',resultTitle:'保全撤離',selectArmy:true},
 {level:100,kind:'supply',stops:['武都營地','山路驛站','陰平營地'],chapter:17,title:'武都陰平',terrain:'',ending:'蜀軍取得武都、陰平兩郡',next:'雨阻漢中'},
 {level:123,kind:'defense',chapter:21,title:'漢壽會師',terrain:'pass-defense',ending:'退下來的蜀軍會合',next:'劍閣守關'},
 {level:74,kind:'defense',chapter:13,title:'馬鳴閣道',terrain:'pass-defense',ending:'徐晃保住了閣道',next:'定軍山爭高地',selectArmy:true,laneTotal:5},
 {level:76,kind:'supply',stops:['定軍山營地','山路驛站','沔陽營地'],chapter:13,title:'漢中歸劉',terrain:'',ending:'曹操撤回長安，漢中由劉備掌握',next:'沔陽傳令',chapterEnd:'第十三章尾聲',nextChapter:'第十四章'},
 {level:98,kind:'withdrawal',chapter:17,title:'箕谷收兵',terrain:'pass-defense',ending:'趙雲與鄧芝收兵回漢中',next:'陳倉糧盡',resultTitle:'全軍撤回'},
 {level:94,kind:'supply',stops:['越巂營地','山路驛站','滇池營地'],chapter:16,title:'南中收兵',terrain:'',ending:'諸葛亮回到成都',next:'漢中出師',chapterEnd:'第十六章尾聲',nextChapter:'第十七章'},
 {level:96,kind:'defense',chapter:17,title:'隴右響應',terrain:'pass-defense',ending:'蜀軍在隴右獲得響應',next:'街亭撤離'},
 {level:103,kind:'withdrawal',chapter:18,title:'木門收兵',terrain:'pass-defense',ending:'張郃在木門中箭身亡',next:'斜谷再出',resultTitle:'全軍撤回'},
 {level:88,kind:'supply',stops:['秭歸營地','山路驛站','永安營地'],chapter:15,title:'白帝收兵',terrain:'',ending:'劉備留在永安安頓軍隊',next:'白帝託孤',chapterEnd:'第十五章尾聲',nextChapter:'第十六章',nextMission:'永安驛道守備',campGuest:'劉備'},
 {level:101,kind:'defense',chapter:18,title:'雨阻漢中',terrain:'pass-defense',ending:'魏軍因大雨與道路中斷撤回',next:'祁山運糧',campGuest:'李嚴'},
 {level:134,kind:'withdrawal',chapter:23,title:'成都亂起',terrain:'pass-defense',ending:'鍾會和姜維在成都兵變中身亡',next:'安樂公入洛',resultTitle:'護送隊平安撤回',campGuest:'胡烈'},
 {level:18,kind:'supply',stops:['酸棗營外','糧道驛站','聯軍營地'],chapter:4,title:'酸棗會盟',terrain:'',ending:'三批糧食到營了',resultText:'接下來的汴水之戰',next:'汴水撤軍',nextMission:'等待敵將出場',nextWithRoster:true,selectArmy:true},
 {level:89,kind:'defense',chapter:16,title:'白帝託孤',terrain:'pass-defense',ending:'劉備在永安去世',next:'劉禪即位',campGuest:'李嚴'},
 {level:117,kind:'withdrawal',chapter:20,title:'南安糧盡',terrain:'pass-defense',ending:'南安仍在魏國手中',next:'洮西收兵',resultTitle:'全軍撤回',campGuest:'姜維'},
 {level:85,kind:'supply',stops:['巫縣營地','沿江驛站','秭歸營地'],chapter:15,title:'巫口進兵',terrain:'',ending:'吳班、馮習到達秭歸',next:'猇亭對峙',campGuest:'馮習'},
 {level:93,kind:'defense',chapter:16,title:'南征越巂',terrain:'pass-defense',ending:'越巂戰事告一段落',next:'南中收兵',campGuest:'諸葛亮'},
 {level:118,kind:'withdrawal',chapter:20,title:'洮西收兵',terrain:'pass-defense',ending:'姜維退駐鍾題',next:'段谷撤兵',resultTitle:'全軍撤回',campGuest:'夏侯霸',chapterEnd:'第二十章尾聲',nextChapter:'第二十一章'}
];

test('stage 71 opens from home with an old save before and after reload',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{
  if(response.status()>=400&&response.request().resourceType()==='script')errors.push(`${response.status()} ${response.url()}`);
 });
 await page.addInitScript(key=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({completed:70,coins:150,inventory:{grain:2}}));
 },saveKey);
 await page.goto('/hero/');
 for(const reload of [false,true]){
  if(reload)await page.reload();
  await expect(page.locator('#homeProgress')).toHaveText('已完成 70 / 142 關 · 下一站：宕渠收兵',{timeout:12000});
  await page.locator('#startBtn').tap();
  await expect(page.locator('#storyTitle')).toHaveText('宕渠收兵');
  await expect(page.locator('#storyChapter')).toContainText('第十三章');
 }
 expect(errors).toEqual([]);
});

for(const stage of stages)test(`stage ${stage.level} clears and replays from an old save on touch`,async({page})=>{
 test.setTimeout(420000);
 const {level,chapter,next,kind,bonusButton,bonusClears,stops,peaceful,sun,selectArmy,laneTotal=3}=stage;
 const waveLanes=[0,laneTotal-1,Math.floor(laneTotal/2)];
 const savedRecordLevel=Math.min(20,level-1);
 const cargo=kind==='supply',defense=kind==='defense',withdrawal=kind==='withdrawal',maicheng=level===82;
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('requestfailed',request=>{
  if(request.resourceType()==='script')errors.push(`${request.url()}: ${request.failure()?.errorText}`);
 });
 await page.addInitScript(({level,saveKey,sun,savedRecordLevel})=>{
  if(!localStorage.getItem(saveKey))localStorage.setItem(saveKey,JSON.stringify({
   completed:level-1,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1},...(sun?{sun:{zhangfei:2}}:{})},inventory:{grain:2},battleRecords:{[savedRecordLevel]:80},
   skillSeen:['sunjian','chengpu','huanggai','liubei','guanyu','zhangfei','caocao','xiahoudun','caohong'].flatMap(id=>[1,3,5,7,10].map(level=>id+':'+level))
  }));
  Element.prototype.requestFullscreen=undefined;
 },{level,saveKey,sun,savedRecordLevel});
 await page.clock.install({time:new Date('2026-11-27T00:00:00Z')});
 await page.goto('/hero/');
 const continueStory=page.locator(bonusButton?`#${bonusButton}`:'#startBtn');
 if(bonusButton)await expect(page.locator(`#${bonusButton}Progress`)).toContainText(`${bonusClears-1} /`);
 else await expect(page.locator('#homeProgress'),`Saved stage on home screen. Script errors: ${errors.join('; ')}`).toContainText(`下一站：${stage.title}`,{timeout:12000});
 await expect(continueStory).toBeVisible();
 await expect(continueStory).toBeEnabled();
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
 async function reinforce(escorted){
  const formation=withdrawal?[0,1,2]:[waveLanes[2],waveLanes[0],waveLanes[1]];
  for(const [slot,key] of ['liubei','guanyu','zhangfei'].entries()){
   const card=page.locator(`#cards [data-hero=${key}]`),archer=page.locator('#cards [data-hero=archer]');
   const road=lanes.nth(formation[slot]),width=await road.evaluate(node=>node.clientWidth);
   const status=await card.locator('.card-status').textContent();
   // Keep one escort on each untested cargo route and a free slot for the lane swap.
   const archerAllowed=!maicheng&&(!cargo||formation[slot]<escorted);
   const capacity=cargo&&escorted<3?/^1/:/^[12]/;
   if(status==='可出戰'){
    await card.tap();
    await road.tap({position:{x:width*.6,y:25}});
   }else if(archerAllowed&&status==='出戰中'&&await archer.locator('.card-status').textContent()==='可增援'&&capacity.test(await road.locator('.lane-capacity').textContent())){
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
  if(selectArmy&&laneTotal>3){
   const deployment=page.locator('#deployment');
   await deployment.getByRole('combobox',{name:'戰線與出戰名額'}).selectOption(String(laneTotal));
   const chosen=deployment.locator('[data-choose][aria-pressed=true]');
   for(let count=await chosen.count();count<laneTotal;count++)await deployment.locator('[data-choose][aria-pressed=false]').first().tap();
  }
  if(selectArmy||(bonusButton&&!sun))await tap('#deploymentStart');
  await expect(page.locator('#battle')).toBeVisible({timeout:30000});
  if(sun)await expect(page.locator('#cards [data-hero=zhangfei]')).toContainText('黃蓋');
  await expect(page.locator('#field')).toHaveAttribute('data-terrain',terrain);
  await expect(lanes).toHaveCount(laneTotal);
  await page.locator('#battleSpeed').selectOption('2');
  let sent=0,escorted=0,retreated=false,forward=false,paused=false;
  const remainingCounts=new Set();
  let departure=0;
  const warnings=new Set(),litRoutes=new Set(),enemyRoutes=new Map();
  const waveText=page.locator('#waveText');
  const positions=laneTotal===3?['上','下','中']:waveLanes.map(lane=>`第 ${lane+1}`);
  const cart=page.locator('#supplyCart');
  const lead=maicheng?page.locator('#units .ally').filter({has:page.getByText(/^關羽(?: · 駐守)?$/)}):page.locator('#units .ally[data-lane="1"]').first();
  const distance=unit=>unit.evaluate(node=>parseFloat(node.style.left));
  const cargoSave=cargo?await save():null;
  if(cargo){
   await expect(objective).toContainText(stops[0]);
   await expect(quick).toHaveText('查看任務');
  }
  if(withdrawal)await expect(buttons('retreat')).toBeDisabled();
  for(let i=0;i<135&&!await result.isVisible();i++){
   const text=await objective.textContent();
   if(cargo&&await quick.textContent()==='發送糧車'){
    await expect(lanes.nth(sent)).toHaveAttribute('data-supply-route','true');
    await expect(objective).toContainText(`軍糧 ${sent}／3 批`);
    await expect(objective).toContainText(stops[sent]);
    await expect(result).toBeHidden();
    expect(await save()).toEqual(cargoSave);
    await quick.tap();
    sent++;
    await expect(cart).toBeVisible();
    await expect(cart).toContainText(`糧車 ${sent}／3`);
    departure=await distance(cart);
    await expect(quick).toHaveText('查看任務');
   }
   if(cargo&&sent>escorted&&text.includes('糧車前進中')){
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
    await expect(escort).toHaveCount(0);
    const waiting=await distance(cart);
    expect(waiting).toBeGreaterThan(departure);
    await expect(lanes.nth(road)).toHaveAttribute('data-supply-route','true');
    await expect(objective).toContainText('糧車停下，派友軍回這一路護送');
    expect(await objective.evaluate(p=>p.scrollHeight<=p.clientHeight)).toBe(true);
    await expect(page.locator('#missionObjective')).toContainText(/\d+% · 糧車停下/);
    const details=page.locator('#missionObjective');
    const stoppedText=await details.textContent();
    const beforeDelivery=await save();
    await advance(2100);
    expect(await distance(cart)).toBe(waiting);
    await expect(details).toHaveText(stoppedText);
    await expect(result).toBeHidden();
    expect(await save()).toEqual(beforeDelivery);
    await expect(objective).toContainText(`軍糧 ${sent-1}／3 批`);
    await command(unit,road===2?'down':'up');
    await expect(unit).toHaveAttribute('data-lane',String(road));
    await expect(objective).toContainText('糧車前進中');
    expect(await distance(cart)).toBe(waiting);
    await expect(details).toHaveText(stoppedText.replace('糧車停下，派友軍回這一路護送','糧車前進中'));
    await advance(500);
    expect(await distance(cart)).toBeGreaterThan(waiting);
    const progress=value=>Number(value.match(/(\d+)%/)?.[1]);
    expect(progress(await details.textContent())).toBeGreaterThan(progress(stoppedText));
    escorted++;
   }
   if(!cargo){
    const wave=text.match(/第 (\d)／3 波 · (.+?)路來敵/);
    if(wave&&!warnings.has(wave[1]+wave[2])){
     if(withdrawal){
      await expect(buttons('retreat')).toBeDisabled();
      if(wave[1]==='3')await expect(waveText).toHaveText(/ 8 \/ 12$/);
     }
     warnings.add(wave[1]+wave[2]);
    }
    if(defense&&wave&&!litRoutes.has(Number(wave[1]))){
     const highlighted=page.locator('.lane[data-threat=true]');
     if(await highlighted.count()){
      const expected=waveLanes[Number(wave[1])-1];
      await expect(highlighted).toHaveAttribute('data-lane',String(expected));
      await expect(highlighted).toContainText('來敵');
      await expect(highlighted).toBeVisible();
      litRoutes.add(Number(wave[1]));
     }
    }
    if(defense&&enemyRoutes.size<12){
     const enemies=await page.locator('#units .enemy').evaluateAll(units=>units.map(unit=>[Number(unit.dataset.id),Number(unit.dataset.lane)]));
     for(const [id,lane] of enemies)if(!enemyRoutes.has(id))enemyRoutes.set(id,lane);
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
   if(defense&&text.includes('三波已出場')){
    const remaining=Number(text.match(/清退剩下的 (\d+) 名敵兵/)?.[1]);
    if(!remainingCounts.has(remaining)){
     expect(remaining).toBeGreaterThan(0);
     await expect(result).toBeHidden();
     await expect(page.locator('#units .enemy')).toHaveCount(remaining);
     remainingCounts.add(remaining);
    }
   }
   if(withdrawal&&!forward&&i>=7){
    await command(lead,'forward');
    forward=true;
   }
   if(withdrawal&&!retreated&&await quick.textContent()==='全軍撤離'){
    await expect(objective).toContainText('第 3 波已到');
    await expect(objective).toContainText(maicheng?'帶關羽與友軍撤回左側':'帶友軍撤回左側');
    expect(await page.locator('#units .enemy').count()).toBeGreaterThan(0);
    expect(await distance(lead)).toBeGreaterThan(18);
    const beforeRetreat=await save();
    await quick.tap();
    await expect(result).toBeHidden();
    await expect(objective).toContainText(maicheng?'1 隊友軍尚未回到左側 · 等關羽回到左側':'隊友軍尚未回到左側');
    if(!maicheng){
     await expect(waveText).toHaveText(/ 9 \/ 12$/);
     const id=await lead.getAttribute('data-id');
     const straggler=page.locator(`#units .ally[data-id="${id}"]`);
     await command(straggler,'hold');
     const heldAhead=await distance(straggler);
     expect(heldAhead).toBeGreaterThan(18);
     await advance(2000);
     expect(await distance(straggler)).toBe(heldAhead);
     const returned=await page.locator(`#units .ally:not([data-id="${id}"])`).evaluateAll(units=>units.map(unit=>parseFloat(unit.style.left)));
     expect(returned.length).toBeGreaterThan(0);
     expect(Math.max(...returned)).toBeLessThanOrEqual(18);
     await expect(result).toBeHidden();
     await expect(objective).toContainText('1 隊友軍尚未回到左側');
     expect(await save()).toEqual(beforeRetreat);
     await expect(quick).toHaveText('重新撤離');
     await quick.tap();
    }
    const allyPositions=()=>page.locator('#units .ally').evaluateAll(units=>units.map(unit=>unit.style.left));
    await pause();
    const held=await allyPositions();
    await advance(1600);
    expect(await allyPositions()).toEqual(held);
    await resume();
    retreated=true;
   }
   if(!retreated)await reinforce(escorted);
   await advance(1000);
  }
  await expect(result).toBeVisible();
  await expect(result).toHaveAttribute('data-outcome','victory');
  if(resultTitle)await expect(page.locator('#resultTitle')).toHaveText(resultTitle);
  await expect(page.locator('#resultText')).toContainText(stage.resultText||ending);
  expect(paused).toBe(true);
  if(cargo){
   expect(sent).toBe(3);
   expect(escorted).toBe(3);
   await expect(page.locator('#units .enemy')).toHaveCount(0);
   if(!peaceful)await expect(page.locator('#waveText')).toContainText('已全數出現');
   await expect(page.locator('#missionObjective')).toContainText('軍糧 3／3 批');
  }else expect([...warnings]).toEqual(positions.map((name,i)=>i+1+name));
  if(defense){
   expect(remainingCounts.size).toBeGreaterThan(1);
   expect([...remainingCounts]).toEqual([...remainingCounts].sort((a,b)=>b-a));
   expect([...litRoutes]).toEqual([1,2,3]);
   const routes=[...enemyRoutes].sort(([first],[second])=>first-second).map(([,lane])=>lane);
   expect(routes).toEqual(waveLanes.flatMap(lane=>Array(4).fill(lane)));
   await expect(page.locator('#missionObjective')).toHaveText('三波已守住 · 敵軍已清退');
   await expect(page.locator('#units .enemy')).toHaveCount(0);
   await expect(page.locator('#waveText')).toContainText('已全數出現');
  }
  if(withdrawal){
   expect(retreated).toBe(true);
   const survivors=await page.locator('#units .ally').evaluateAll(units=>units.map(unit=>parseFloat(unit.style.left)));
   expect(survivors.length).toBeGreaterThan(0);
   expect(Math.max(...survivors)).toBeLessThanOrEqual(18);
  }
 }

 async function finish({level,title,ending,next,chapterEnd,nextChapter,campGuest},reward,coins,wuRank){
  await expect(page.locator('#resultEarned')).toHaveText(reward);
  const progress=await save();
  expect(progress).toMatchObject({completed:level,coins,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1},...(sun?{sun:{zhangfei:wuRank}}:{})},inventory:{grain:2},battleRecords:{[savedRecordLevel]:80,[level]:expect.any(Number)}});
  await advance(4200);
  while(await skillIntro.isVisible())await tap('#skillIntroContinue');
  await tap('#resultNext');
  await expect(page.locator('#campTitle')).toContainText(title);
  await expect(page.locator('#campCoins')).toHaveText(String(coins));
  if(campGuest){
   await tap('#camp [data-talk=guanyu]');
   await expect(page.locator('#campTalkName')).toHaveText(campGuest);
   await expect(page.locator('#campTalkPortrait')).toHaveAttribute('alt',campGuest);
   await expect(page.locator('#campTalkText')).not.toBeEmpty();
   await tap('#campTalkNext');
   await expect(page.locator('#campTalk')).toBeHidden();
  }
  if(sun){
   await tap('[data-shop=weapons]');
   const huanggai=page.locator('#shopGoods .goods-card').filter({hasText:'黃蓋・兵器整備'});
   await expect(huanggai).toContainText(`已強化 ${wuRank} / 3`);
   if(wuRank===2){
    await huanggai.getByRole('button',{name:'購買 · 180 軍資'}).tap();
    await expect(huanggai).toContainText('已強化 3 / 3');
    await expect(page.locator('#campCoins')).toHaveText('50');
   }else await expect(huanggai.getByRole('button',{name:'已滿'})).toBeDisabled();
   await tap('#campShopBack');
  }
  if(chapterEnd)await expect(page.locator('#campContinue')).toContainText(chapterEnd);
  await tap('#campContinue');
  const storyLine=page.locator('#storyLine');
  const pages=Number((await page.locator('#storyCount').textContent()).split('/')[1]);
  let story=await storyLine.textContent();
  for(let i=1;i<pages&&(chapterEnd||!next||!story.includes(ending));i++){
   await tap('#storyNext');
   story+=await storyLine.textContent();
  }
  expect(story).toContain(ending);
  if(next){
   if(chapterEnd){
    await expect(page.locator('#storyNext')).toHaveText('下一段故事 →');
    await tap('#storyNext');
   }else await tap('#storySkip');
   await expect(page.locator('#storyTitle')).toHaveText(next);
   if(nextChapter)await expect(page.locator('#storyChapter')).toContainText(`${nextChapter} · 第 1 / 6 關 · 戰前`);
  }else{
   const final=page.locator('#storyNext');
   await expect(final).toHaveText('回主選單 →');
   await final.tap();
   await expect(page.locator('#home')).toBeVisible();
   await expect(page.locator('#homeChanganProgress')).toHaveText('八王之亂外傳：長安西行 6 / 6 關');
   await expect(page.locator('#homeProgress')).toHaveText('英雄演義・全篇通關');
   await expect(continueStory).toContainText('重玩');
  }
  if(!sun)return progress;
  const afterCamp=await save();
  expect(afterCamp).toMatchObject({completed:143,coins:50,weapons:{guanyu:2},armyWeapons:{cao:{liubei:1},sun:{zhangfei:3}},inventory:{grain:2}});
  await tap('#storySkip');
  const deployment=page.locator('#deployment');
  await expect(deployment).toBeVisible();
  const caoCao=deployment.locator('article').filter({has:page.getByAltText('曹操',{exact:true})});
  await expect(caoCao).toContainText('兵器 1/3');
  await expect(deployment.getByAltText('黃蓋',{exact:true})).toHaveCount(0);
  expect(await save()).toEqual(afterCamp);
  return afterCamp;
 }
 async function checkReload(next,progress){
  await page.reload();
  if(bonusButton)await expect(page.locator(`#${bonusButton}Progress`)).toContainText(`${bonusClears} /`);
  else await expect(page.locator('#homeProgress')).toContainText(next);
  expect(await save()).toEqual(progress);
 }

 await continueStory.tap();
 await play(stage);
 const first=await finish(stage,'+80',230,2);
 if(stage.nextMission){
  await tap('#storySkip');
  if(stage.nextWithRoster){
   await expect(page.locator('#deployment')).toBeVisible();
   await tap('#deploymentStart');
  }
  await expect(page.locator('#battle')).toBeVisible({timeout:30000});
  await expect(page.locator('#battleTitle')).toContainText(next);
  await expect(page.locator('#missionQuick')).toContainText(stage.nextMission);
  expect(await save()).toEqual(first);
 }
 await checkReload(next,first);
 if(stage.nextChapter||stage.nextWithRoster){
  await continueStory.tap();
  await expect(page.locator('#storyTitle')).toHaveText(next);
  if(stage.nextChapter)await expect(page.locator('#storyChapter')).toContainText(`${stage.nextChapter} · 第 1 / 6 關 · 戰前`);
  await tap('#story [data-home]');
 }
 await tap('#chapterPicker > summary');
 await tap(`#chapterTabs [data-chapter="${chapter}"]`);
 await tap(`#chapterDots [data-level="${level}"]`);
 await play(stage);
 const replay=await finish(stage,'+0',sun?50:230,3);
 expect(replay.battleRecords[level]).toBeLessThanOrEqual(first.battleRecords[level]);
 await checkReload(next,replay);
 expect(errors).toEqual([]);
});
