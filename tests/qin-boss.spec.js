const {test,expect}=require('@playwright/test');

async function openApp(page){
 await page.addInitScript(()=>{const read={};for(const side of ['plants','zombies'])for(let level=1;level<=10;level++)for(const scene of ['opening','victory','defeat'])read[`${side}:${level}:${scene}`]=true;localStorage.setItem('sgzStoryRead_v1',JSON.stringify(read));});
 for(let attempt=0;attempt<3;attempt++){
  await page.goto('/?qin-boss-test=1');
  try{await page.waitForFunction(()=>typeof normalizeProfile==='function'&&typeof isQinBossUnlocked==='function'&&typeof campaignLevels==='function'&&typeof start==='function'&&typeof LEVELS==='object'&&!!LEVELS[11]&&typeof ZOMBIE_TYPES==='object',null,{timeout:5000});break}
  catch(error){if(attempt===2)throw error}
 }
 await expect(page.locator('#start')).toHaveClass(/active/);
}

test('Qin emperor becomes a separate finale after defense level ten',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});currentSeason=1;currentFaction='plants';
  const before={hasApi:typeof isQinBossUnlocked==='function',weights:[9,10].map(level=>LEVELS[level].zombieWeights.includes('qinEmperor'))};
  for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  buildLevelCards();
  const card=document.querySelector('[data-qin-boss-card]');
  return {before,unlocked:typeof isQinBossUnlocked==='function'&&isQinBossUnlocked(),card:card?.textContent||'',button:card?.querySelector('button')?.textContent||'',next:nextCampaignStep('plants',10,true)};
 });
 expect(result.before.hasApi).toBeTruthy();
 expect(result.before.weights).toEqual([false,false]);
 expect(result.unlocked).toBeTruthy();
 expect(result.card).toContain('終章');
 expect(result.card).toContain('始皇陵決戰');
 expect(result.card).toContain('御駕換陣');
 expect(result.card).toContain('減傷');
 expect(result.button).toContain('挑戰秦皇');
 expect(result.next).toEqual({faction:'plants',level:11,label:'終章：挑戰秦皇 ▶'});
});

test('all first-season stages and Qin finale use their accepted card art',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(async()=>{
  playerProfile=normalizeProfile({});currentSeason=1;currentFaction='plants';
  for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  buildLevelCards();
  const inspect=async level=>{
   const card=document.querySelector(`[data-jump-level="${level}"]`).closest('.level-card');
   const art=card.querySelector('.level-art');
   const src=LEVELS[level].cardArt;
   const image=new Image();image.src=src;await image.decode();
   return {level,src,background:getComputedStyle(art).backgroundImage,width:image.naturalWidth,height:image.naturalHeight};
  };
  const levels=[];
  for(let level=1;level<=11;level++)levels.push(await inspect(level));
  return levels;
 });
 const expected=[
  'level-01-custom-card.webp','level-02-custom-card.webp','level-03-custom-card.webp',
  'level-04-custom-card.webp','level-05-custom-card.webp','level-06-custom-card.webp',
  'level-07-custom-card.webp','level-08-custom-card.webp','level-09-custom-card.webp',
  'level-10-custom-card.webp','qin-finale-custom-card.webp'
 ];
 expect(result).toHaveLength(expected.length);
 result.forEach((item,index)=>{
  expect(item.src).toBe(`assets/backgrounds/${expected[index]}`);
  expect(item.background).toContain(expected[index]);
  expect(item.width).toBeGreaterThan(1000);
  expect(item.height).toBeGreaterThan(500);
 });
});

test('finale starts the three-phase boss and three tiger seals break formation',async({page})=>{
 await openApp(page);
 const initial=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);
  const boss=state.zombies.find(z=>z.boss);
  return {bossCount:state.zombies.filter(z=>z.boss).length,type:boss?.type,hp:boss?.maxHp,row:boss?.r,phase:state.qinBoss?.phase,command:state.qinBoss?.command,seals:state.qinBoss?.seals,hudHidden:document.querySelector('#qinBossHud')?.hidden,buttonDisabled:document.querySelector('#qinBreakBtn')?.disabled};
 });
 expect(initial).toMatchObject({bossCount:1,type:'qinEmperor',row:2,phase:1,command:0,seals:0,hudHidden:false,buttonDisabled:true});
 expect(initial.hp).toBeGreaterThan(3000);
 const ready=await page.evaluate(()=>{collectQinTigerSeal();collectQinTigerSeal();collectQinTigerSeal();updateQinBossHud();state.qinBoss.command=88;return {seals:state.qinBoss.seals,buttonDisabled:document.querySelector('#qinBreakBtn').disabled,beforeHp:state.zombies.find(z=>z.boss).hp}});
 expect(ready).toMatchObject({seals:3,buttonDisabled:false});
 await page.locator('#qinBreakBtn').click();
 const after=await page.evaluate(()=>{
  const boss=state.zombies.find(z=>z.boss);
  const base={seals:state.qinBoss.seals,command:state.qinBoss.command,hp:boss.hp,stunnedUntil:boss.stunUntil,vulnerableUntil:boss.vulnerableUntil};
  boss.hp=boss.maxHp*.69;processQinBoss();base.phase2={phase:state.qinBoss.phase,row:boss.r};
  boss.hp=boss.maxHp*.34;processQinBoss();base.phase3={phase:state.qinBoss.phase,row:boss.r};
  boss.stunUntil=0;boss.vulnerableUntil=0;state.qinBoss.command=100;processQinBoss();base.commandRow=boss.r;
  return base;
 });
 expect(after.seals).toBe(0);
 expect(after.command).toBeLessThanOrEqual(40);
 expect(after.hp).toBeLessThan(ready.beforeHp);
 expect(after.stunnedUntil).toBeGreaterThan(0);
 expect(after.vulnerableUntil).toBe(after.stunnedUntil);
 expect(after.phase2).toEqual({phase:2,row:0});
 expect(after.phase3).toEqual({phase:3,row:4});
 expect(after.commandRow).toBe(1);
});

test('Qin formation guard resists lane focus until tiger seals open the damage window',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);
  const boss=qinBossEntity(),initial=boss.hp;
  damageZombie(boss,100,{sourceId:'focus-fire',sourceType:'test'});
  const guardedLoss=initial-boss.hp;render();
  const guardedVisual=document.querySelector('.entity.boss')?.classList.contains('qin-guarded');
  collectQinTigerSeal();collectQinTigerSeal();collectQinTigerSeal();breakQinFormation();
  const beforeOpenHit=boss.hp;
  damageZombie(boss,100,{sourceId:'open-window',sourceType:'test'});
  const openLoss=beforeOpenHit-boss.hp;
  updateQinBossHud();render();
  const vulnerableVisual=document.querySelector('.entity.boss')?.classList.contains('qin-vulnerable'),openHud=document.querySelector('#qinPhaseText').textContent;
  state.time=boss.vulnerableUntil-3500;updateQinBossHud();
  const midwayHud=document.querySelector('#qinPhaseText').textContent;
  state.time=boss.vulnerableUntil;
  const beforeExpiredHit=boss.hp;
  damageZombie(boss,100,{sourceId:'expired-window',sourceType:'test'});
  updateQinBossHud();render();
  return {guardedLoss,openLoss,expiredLoss:beforeExpiredHit-boss.hp,guarded:boss.qinGuarded,guardedVisual,vulnerableVisual,restoredGuardVisual:document.querySelector('.entity.boss')?.classList.contains('qin-guarded'),openHud,midwayHud,expiredHud:document.querySelector('#qinPhaseText').textContent};
 });
 expect(result.guardedLoss).toBe(55);
 expect(result.openLoss).toBe(100);
 expect(result.expiredLoss).toBe(55);
 expect(result.guarded).toBeTruthy();
 expect(result.guardedVisual).toBeTruthy();
 expect(result.vulnerableVisual).toBeTruthy();
 expect(result.restoredGuardVisual).toBeTruthy();
 expect(result.openHud).toContain('破陣中・8 秒');
 expect(result.midwayHud).toContain('破陣中・4 秒');
 expect(result.expiredHud).toContain('減傷 45%');
});

test('Qin finale clear is persisted and visible in the permanent campaign summary',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(async()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);
  await end(true,'終章勝利！','測試通關');
  const stored=JSON.parse(localStorage.getItem('sgZombieProfile'));
  playerProfile=normalizeProfile(stored);currentFaction='plants';buildLevelCards();backToHome(false);
  const card=document.querySelector('[data-qin-boss-card]'),menu=document.querySelector('#menuProgressStats')?.textContent||'';
  showProfileCenter();
  return {stored:stored.campaignProgress.plants.completedLevels['11'],normalized:isCampaignLevelCompleted('plants',11,1),summary:campaignProgressText(),card:card?.textContent||'',menu,profile:document.querySelector('#profileStats')?.textContent||'',profileActive:document.querySelector('#profile')?.classList.contains('active')};
 });
 expect(result.stored).toBe(1);
 expect(result.normalized).toBeTruthy();
 expect(result.summary).toContain('秦皇終章已破');
 expect(result.menu).toContain('秦皇終章已破');
 expect(result.card).toContain('✅ 已通關');
 expect(result.profileActive).toBeTruthy();
 expect(result.profile).toContain('終章進度已破');
});

test('legacy Qin battle saves restore formation guard and continue the lane cycle',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);
  const boss=qinBossEntity();boss.r=4;delete boss.qinGuarded;delete state.qinBoss.laneIndex;
  persistBattleState();
  const restored=restoreBattleIfAvailable();clearInterval(timer);
  const restoredBoss=qinBossEntity();
  return {restored,guarded:restoredBoss.qinGuarded,laneIndex:state.qinBoss.laneIndex,row:restoredBoss.r,paused:state.paused};
 });
 expect(result).toEqual({restored:true,guarded:true,laneIndex:2,row:4,paused:true});
});

test('malformed legacy Qin state is clamped and resynchronized to the canonical lane cycle',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);
  const boss=qinBossEntity();boss.r=99;boss.hp=boss.maxHp*.69;boss.qinGuarded='broken';
  Object.assign(state.qinBoss,{phase:'broken',lastPhase:99,command:-40,seals:99,nextCaptainAt:'soon',laneIndex:99});
  persistBattleState();restoreBattleIfAvailable();clearInterval(timer);
  const restoredBoss=qinBossEntity();
  return {phase:state.qinBoss.phase,lastPhase:state.qinBoss.lastPhase,command:state.qinBoss.command,seals:state.qinBoss.seals,laneIndex:state.qinBoss.laneIndex,row:restoredBoss.r,guarded:restoredBoss.qinGuarded,nextCaptainFinite:Number.isFinite(state.qinBoss.nextCaptainAt)};
 });
 expect(result).toEqual({phase:2,lastPhase:2,command:0,seals:3,laneIndex:0,row:2,guarded:true,nextCaptainFinite:true});
});

test('Qin boss HUD and shifted boss stay drawable on desktop, portrait and short landscape',async({page},testInfo)=>{
 await openApp(page);
 await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);
  const boss=qinBossEntity();boss.hp=boss.maxHp*.69;processQinBoss();render();updateHUD();
 });
 for(const [name,viewport] of [['desktop',{width:1440,height:900}],['portrait',{width:390,height:844}],['short-landscape',{width:844,height:390}]]){
  await page.setViewportSize(viewport);
  await page.locator('#qinBossHud').scrollIntoViewIfNeeded();
  const layout=await page.evaluate(()=>{
   const hud=document.querySelector('#qinBossHud').getBoundingClientRect(),board=document.querySelector('#board').getBoundingClientRect(),boss=document.querySelector('.entity.boss').getBoundingClientRect();
   return {hud:{left:hud.left,right:hud.right,width:hud.width,height:hud.height},boss:{left:boss.left,right:boss.right,top:boss.top,bottom:boss.bottom},board:{left:board.left,right:board.right,top:board.top,bottom:board.bottom},documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,phase:document.querySelector('#qinPhaseText').textContent};
  });
  expect(layout.hud.left).toBeGreaterThanOrEqual(-1);
  expect(layout.hud.right).toBeLessThanOrEqual(viewport.width+1);
  expect(layout.hud.height).toBeGreaterThan(0);
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth+1);
  expect(layout.boss.left).toBeGreaterThanOrEqual(layout.board.left-2);
  expect(layout.boss.right).toBeLessThanOrEqual(layout.board.right+2);
  expect(layout.boss.top).toBeLessThan(layout.board.bottom);
  expect(layout.boss.bottom).toBeGreaterThan(layout.board.top);
  expect(layout.phase).toContain('第二階段');
  await page.screenshot({path:testInfo.outputPath(`qin-${name}.png`),fullPage:true});
 }
});
