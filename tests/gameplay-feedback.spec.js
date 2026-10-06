const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

async function unlockAttack(page,season=1){
 await page.evaluate(season=>{
  currentSeason=season;
  for(let level=1;level<=10;level++)completeCampaignLevel('plants',level,season);
  saveProfile();
 },season);
}

test('defense wave completion shows one nonblocking telemetry report with real leaders',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  selectedLevel=1;start('plants');clearInterval(timer);
  state.openingQueue=[];
  const director=state.waveDirector;
  state.time=1000;
  director.active={id:1,count:1,sent:0,warnedAt:state.time,nextAt:state.time,rallied:true,rows:[]};
  beginBattleReportSegment('defense-wave',1,'第 1 波');
  const guard={id:'guard-1',type:'wallnut',r:2,c:2,hp:400,maxHp:400};
  const archer={id:'archer-1',type:'peashooter',r:2,c:1,hp:100,maxHp:100};
  const enemy={id:'enemy-1',type:'normal',r:2,c:4,hp:100,maxHp:100};
  state.plants=[guard,archer];state.zombies=[enemy];
  applyBattleDamage(enemy,35,{source:archer,sourceSide:'plants',targetSide:'zombies'});
  applyBattleDamage(guard,20,{source:enemy,sourceSide:'zombies',targetSide:'plants'});
  recordBattleControl(enemy,{source:archer,sourceSide:'plants',targetSide:'zombies',duration:1200,kind:'slow'});
  changeBattleResource('plants',25,'income');changeBattleResource('plants',-10,'deploy');
  state.aiResource=1000;state.enemiesSpawned=0;
  updateDefenseWaves();updateHUD();
  const first=JSON.parse(JSON.stringify(state.gameplay.report.current));
  updateDefenseWaves();updateHUD();
  return {
   helperTypes:[typeof beginBattleReportSegment,typeof completeBattleReportSegment,typeof renderBattleReport],
   first,
   completed:state.gameplay.telemetry.totals.waves.completed,
   reportText:document.getElementById('waveReport').innerText,
   pointerEvents:getComputedStyle(document.getElementById('waveReport')).pointerEvents,
   boardPointerEvents:getComputedStyle(document.getElementById('grid')).pointerEvents
  };
 });
 expect(result.helperTypes).toEqual(['function','function','function']);
 expect(result.completed).toBe(1);
 expect(result.first).toEqual(expect.objectContaining({kind:'defense-wave',segmentId:1,damageDealt:35,damageTaken:20,kills:0,controlDuration:1200,resourceNet:15}));
 expect(result.reportText).toContain('最高輸出');
 expect(result.reportText).toContain('蜀軍弓兵');
 expect(result.reportText).toContain('最高承傷');
 expect(result.reportText).toContain('盾將');
 expect(result.reportText).toContain('控制貢獻');
 expect(result.reportText).toContain('1.2 秒');
 expect(result.reportText).toContain('資源淨變化');
 expect(result.reportText).toContain('+15');
 expect(result.pointerEvents).toBe('none');
 expect(result.boardPointerEvents).not.toBe('none');
});

test('attack milestones report at 30 60 90 percent once and persist through reload',async({page})=>{
 await open(page);await unlockAttack(page,1);
 const before=await page.evaluate(()=>{
  currentSeason=1;selectedLevel=1;start('zombies');clearInterval(timer);
  const limit=state.levelConfig.attackTimeLimit,reports=[];
  const damage=amount=>recordBattleEvent('damage',{sourceSide:'zombies',sourceId:'attacker',sourceType:'normal',targetSide:'plants',targetId:'guard',targetType:'wallnut',amount});
  damage(12);state.time=Math.ceil(limit*.3);updateAttackMilestoneReports();reports.push(JSON.parse(JSON.stringify(state.gameplay.report.current)));
  damage(7);state.time=Math.ceil(limit*.6);updateAttackMilestoneReports();reports.push(JSON.parse(JSON.stringify(state.gameplay.report.current)));
  damage(3);state.time=Math.ceil(limit*.9);updateAttackMilestoneReports();reports.push(JSON.parse(JSON.stringify(state.gameplay.report.current)));
  updateAttackMilestoneReports();updateHUD();pauseAndSaveBattle('test');
  return {reports,current:state.gameplay.report.current,milestones:state.gameplay.report.attackMilestones,html:document.getElementById('waveReport').innerText};
 });
 expect(before.reports.map(report=>[report.segmentId,report.damageDealt])).toEqual([[30,12],[60,7],[90,3]]);
 expect(before.milestones).toEqual([30,60,90]);
 expect(before.html).toContain('攻城 90% 戰報');
 await page.reload();
 const after=await page.evaluate(()=>({paused:state.paused,current:state.gameplay.report.current,milestones:state.gameplay.report.attackMilestones,text:document.getElementById('waveReport').innerText}));
 expect(after.paused).toBe(true);
 expect(after.current).toEqual(before.current);
 expect(after.milestones).toEqual([30,60,90]);
 expect(after.text).toContain('攻城 90% 戰報');
});

test('attack report initialization is stable and migrated elapsed milestones do not emit fake reports',async({page})=>{
 await open(page);await unlockAttack(page,1);
 const result=await page.evaluate(()=>{
  currentSeason=1;selectedLevel=1;start('zombies');clearInterval(timer);
  const originalGameplay=state.gameplay,originalTelemetry=state.gameplay.telemetry,originalReport=state.gameplay.report;
  for(let i=0;i<20;i++)updateAttackMilestoneReports();
  const stable=state.gameplay===originalGameplay&&state.gameplay.telemetry===originalTelemetry&&state.gameplay.report===originalReport;
  const limit=state.levelConfig.attackTimeLimit;
  state.time=Math.ceil(limit*.7);state.gameplay={version:GAMEPLAY_STATE_VERSION,telemetry:state.gameplay.telemetry};
  state.gameplay=normalizeGameplayState(state.gameplay);updateAttackMilestoneReports();
  return {stable,milestones:state.gameplay.report.attackMilestones,current:state.gameplay.report.current,baselineEvents:state.gameplay.report.baseline.eventCount};
 });
 expect(result.stable).toBe(true);
 expect(result.milestones).toEqual([30,60]);
 expect(result.current).toBeNull();
 expect(result.baselineEvents).toBeGreaterThanOrEqual(0);
});

test('report live region renders once with text nodes and ignores serialized markup',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  selectedLevel=1;start('plants');clearInterval(timer);state.time=1000;
  beginBattleReportSegment('defense-wave',1,'<img src=x onerror=alert(1)>');
  state.gameplay.report.current={kind:'defense-wave',segmentId:1,label:'<img src=x onerror=alert(1)>',kills:2,resourceNet:5,outputLeader:{type:'<img src=x>',amount:9},takenLeader:null,controlLeader:null,shownAt:1000,expiresAt:7000,dismissed:false};
  renderBattleReport();
  const el=document.getElementById('waveReport'),observer=new MutationObserver(list=>window.__reportMutations=(window.__reportMutations||0)+list.length);
  observer.observe(el,{subtree:true,childList:true,characterData:true,attributes:true});
  for(let i=0;i<10;i++)updateHUD();
  await Promise.resolve();observer.disconnect();
  return {mutations:window.__reportMutations||0,imgCount:el.querySelectorAll('img').length,text:el.innerText};
 });
 expect(result.mutations).toBe(0);
 expect(result.imgCount).toBe(0);
 expect(result.text).toContain('<img src=x onerror=alert(1)>戰報');
});

test('season two defense and attack both produce battle reports',async({page})=>{
 await open(page);await unlockAttack(page,2);
 const result=await page.evaluate(()=>{
  currentSeason=2;selectedLevel=1;start('plants');clearInterval(timer);state.openingQueue=[];state.time=1000;
  beginBattleReportSegment('defense-wave',1,'第 1 波');
  recordBattleEvent('damage',{sourceSide:'plants',sourceId:'wei-unit',sourceType:'s2Crossbow',targetSide:'zombies',targetId:'s2-enemy',targetType:'s2Rat',amount:14});
  const defense=completeBattleReportSegment('defense-wave',1,'第 1 波');
  start('zombies');clearInterval(timer);
  recordBattleEvent('damage',{sourceSide:'zombies',sourceId:'s2-attacker',sourceType:'s2Rat',targetSide:'plants',targetId:'wei-guard',targetType:'s2Shield',amount:11});
  state.time=Math.ceil(state.levelConfig.attackTimeLimit*.3);updateAttackMilestoneReports();
  return {season:state.season,defense,attack:state.gameplay.report.current};
 });
 expect(result.season).toBe(2);
 expect(result.defense).toEqual(expect.objectContaining({kind:'defense-wave',damageDealt:14}));
 expect(result.attack).toEqual(expect.objectContaining({kind:'attack-milestone',segmentId:30,damageDealt:11}));
});

test('report close and six-second expiry use battle time so pause freezes the countdown',async({page})=>{
 await open(page);
 await page.evaluate(()=>{selectedLevel=1;start('plants');clearInterval(timer);state.time=5000;beginBattleReportSegment('defense-wave',1,'第 1 波');completeBattleReportSegment('defense-wave',1,'第 1 波');updateHUD()});
 await expect(page.locator('#waveReport')).toBeVisible();
 await page.evaluate(()=>{state.paused=true;for(let i=0;i<200;i++)tick();updateHUD()});
 await expect(page.locator('#waveReport')).toBeVisible();
 expect(await page.evaluate(()=>state.time)).toBe(5000);
 await page.evaluate(()=>{state.paused=false;state.time=11001;updateHUD()});
 await expect(page.locator('#waveReport')).toBeHidden();
 await page.evaluate(()=>{state.time=12000;beginBattleReportSegment('defense-wave',2,'第 2 波');completeBattleReportSegment('defense-wave',2,'第 2 波');updateHUD()});
 await expect(page.locator('#waveReport')).toBeVisible();
 await page.locator('#waveReportClose').click();
 await expect(page.locator('#waveReport')).toBeHidden();
 expect(await page.evaluate(()=>state.gameplay.report.current.dismissed)).toBe(true);
});
