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
  const limit=state.levelConfig.attackTimeLimit;
  recordBattleEvent('damage',{sourceSide:'zombies',sourceId:'attacker',sourceType:'normal',targetSide:'plants',targetId:'guard',targetType:'wallnut',amount:12});
  state.time=Math.ceil(limit*.3);updateAttackMilestoneReports();updateHUD();
  updateAttackMilestoneReports();
  pauseAndSaveBattle('test');
  return {current:state.gameplay.report.current,milestones:state.gameplay.report.attackMilestones,html:document.getElementById('waveReport').innerText};
 });
 expect(before.current).toEqual(expect.objectContaining({kind:'attack-milestone',segmentId:30,damageDealt:12}));
 expect(before.milestones).toEqual([30]);
 expect(before.html).toContain('攻城 30% 戰報');
 await page.reload();
 const after=await page.evaluate(()=>({paused:state.paused,current:state.gameplay.report.current,milestones:state.gameplay.report.attackMilestones,text:document.getElementById('waveReport').innerText}));
 expect(after.paused).toBe(true);
 expect(after.current).toEqual(before.current);
 expect(after.milestones).toEqual([30]);
 expect(after.text).toContain('攻城 30% 戰報');
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
