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

test('Qin finale offers the Wei sequel as the main route and zombie season one as an alternate chronicle',async({page})=>{
 await openApp(page);
 await page.evaluate(async()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;markStoryRead('plants',11,'opening');markStoryRead('plants',11,'victory');start('plants');clearInterval(timer);
  await end(true,'終章完成','秦皇已敗');
 });
 await expect(page.locator('#finaleRouteChoice')).toBeVisible();
 await expect(page.locator('#finaleWeiRoute')).toContainText('第二季');
 await expect(page.locator('#finaleWeiRoute')).toContainText('魏軍');
 await expect(page.locator('#finaleZombieRoute')).toContainText('平行戰記');
 await page.locator('#finaleZombieRoute').click();
 await expect(page.locator('#levelScreen')).toHaveClass(/active/);
 await expect(page.locator('#game')).not.toHaveClass(/active/);
 expect(await page.evaluate(()=>({season:currentSeason,faction:currentFaction}))).toEqual({season:1,faction:'zombies'});
 await page.evaluate(async()=>{
  currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);
  await end(true,'終章完成','秦皇已敗');
 });
 await expect(page.locator('#finaleRouteChoice')).toBeVisible();
 await page.locator('#finaleWeiRoute').click();
 expect(await page.evaluate(()=>({season:currentSeason,faction:currentFaction}))).toEqual({season:2,faction:'plants'});
 await expect(page.locator('#chosenFactionText')).toContainText('第二季・魏國守城');
 await expect(page.locator('#game')).not.toHaveClass(/active/);
});

test('unread Qin victory story finishes before the route choice and both choices fit mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await openApp(page);
 await page.evaluate(async()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;markStoryRead('plants',11,'opening');start('plants');clearInterval(timer);
  await end(true,'終章完成','秦皇已敗');
 });
 await expect(page.locator('#finaleRouteChoice')).toBeHidden();
 await expect(page.locator('#modalStory')).toBeVisible();
 await page.locator('#modalStory').click();
 await expect(page.locator('#storyDialog')).toBeVisible();
 await expect(page.locator('#finaleRouteChoice')).toBeHidden();
 await page.locator('#storySkip').click();
 await expect(page.locator('#finaleRouteChoice')).toBeVisible();
 const fit=await page.locator('#finaleRouteChoice').evaluate(element=>{
  const panel=element.getBoundingClientRect(),buttons=[...element.querySelectorAll('button')].map(button=>button.getBoundingClientRect());
  return {panel:{left:panel.left,right:panel.right,top:panel.top,bottom:panel.bottom},buttons:buttons.map(box=>({left:box.left,right:box.right,top:box.top,bottom:box.bottom})),width:innerWidth,height:innerHeight};
 });
 expect(fit.panel.left).toBeGreaterThanOrEqual(0);expect(fit.panel.right).toBeLessThanOrEqual(fit.width);
 fit.buttons.forEach(button=>{expect(button.left).toBeGreaterThanOrEqual(fit.panel.left);expect(button.right).toBeLessThanOrEqual(fit.panel.right);expect(button.bottom).toBeLessThanOrEqual(fit.height)});
});

test('Qin defeat story never reveals the post-finale route choice',async({page})=>{
 await openApp(page);
 await page.evaluate(async()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;markStoryRead('plants',11,'opening');start('plants');clearInterval(timer);
  await end(false,'終章失利','秦皇軍陣仍在');
 });
 await expect(page.locator('#finaleRouteChoice')).toBeHidden();
 await expect(page.locator('#modalStory')).toBeVisible();
 await page.locator('#modalStory').click();
 await expect(page.locator('#storyDialog')).toBeVisible();
 await page.locator('#storySkip').click();
 await expect(page.locator('#finaleRouteChoice')).toBeHidden();
 await expect(page.locator('#modal')).toBeVisible();
});

test('all first-season stages and Qin finale use their accepted card art',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(async()=>{
  playerProfile=normalizeProfile({});currentSeason=1;currentFaction='plants';
  for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  $('start').classList.remove('active');$('levelScreen').classList.add('active');buildLevelCards();setCampaignDetailsExpanded(true);
  const inspect=async level=>{
   const card=document.querySelector(`[data-jump-level="${level}"]`).closest('.level-card');
   const art=card.querySelector('.level-art');
   const src=LEVELS[level].cardArt;
   const image=new Image();image.src=src;await image.decode();
   return {level,src,background:getComputedStyle(art).backgroundImage,width:image.naturalWidth,height:image.naturalHeight,visible:art.getBoundingClientRect().height>0,directChild:art.parentElement===card};
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
  expect(item.visible).toBe(true);
  expect(item.directChild).toBe(true);
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

test('Qin commands strike more lanes each phase while escorts stay secondary',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);
  const boss=qinBossEntity(),phases=[];
  for(const phase of [1,2,3]){
   state.zombies=state.zombies.filter(unit=>unit===boss);state.plants=[];gameplayTelegraphs().active=[];
   for(let row=0;row<5;row++)for(let column=0;column<=row;column++)addPlant('wallnut',column,row);
   boss.hp=boss.maxHp*({1:.9,2:.6,3:.2}[phase]);state.qinBoss.lastPhase=phase;state.qinBoss.phase=phase;state.qinBoss.command=100;state.qinBoss.nextCaptainAt=Infinity;
   processQinBoss();
   const telegraph=gameplayTelegraphs().active.find(item=>item.kind==='qin-unification'),summons=state.zombies.filter(unit=>unit.summoned).length,before=state.plants.map(unit=>({id:unit.id,hp:unit.hp}));
   state.time=telegraph?.executeAt||state.time;processEnemyTelegraphs();
   const hitRows=[...new Set(state.plants.filter(unit=>unit.hp<before.find(item=>item.id===unit.id).hp).map(unit=>unit.r))];
   const losses=hitRows.map(row=>{const unit=state.plants.find(plant=>plant.r===row),old=before.find(item=>item.id===unit.id);return old.hp-unit.hp});
   const stuns=hitRows.map(row=>Math.max(...state.plants.filter(unit=>unit.r===row).map(unit=>(unit.stunUntil||state.time)-state.time)));
   phases.push({phase,targets:telegraph?.targets.map(target=>target.r)||[],summons,hitRows,losses,stuns});
  }
  return phases;
 });
 expect(result).toEqual([
  {phase:1,targets:[4],summons:0,hitRows:[4],losses:[60],stuns:[600]},
  {phase:2,targets:[4,3],summons:1,hitRows:[3,4],losses:[85,85],stuns:[1000,1000]},
  {phase:3,targets:[4,3,2],summons:0,hitRows:[2,3,4],losses:[110,110,110],stuns:[1500,1500,1500]}
 ]);
});

test('Qin personally slashes his current lane and rotates through the first ten stage generals',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants',{difficulty:'medium'});clearInterval(timer);
  const boss=qinBossEntity();state.plants=[];const defender=addPlant('wallnut',4,boss.r),before=defender.hp;
  state.time=state.qinBoss.nextSlashAt;processQinBoss();
  const slash=gameplayTelegraphs().active.find(item=>item.kind==='qin-lane-slash');state.time=slash?.executeAt||state.time;processEnemyTelegraphs();
  const summoned=[];state.zombies=state.zombies.filter(unit=>unit===boss);
  for(let index=0;index<10;index++){const unit=spawnQinVeteran();summoned.push({type:unit?.type,level:unit?.qinVeteranLevel,veteran:unit?.qinVeteran===true});state.zombies=state.zombies.filter(item=>item===boss)}
  return {slash:{row:slash?.targets?.[0]?.r,damage:before-defender.hp},summoned,roster:QIN_VETERAN_ROSTER.map(item=>({type:item.type,level:item.level}))};
 });
 expect(result.slash).toEqual({row:2,damage:34});
 expect(result.summoned).toEqual(result.roster.map(item=>({...item,veteran:true})));
 expect(result.roster).toEqual([
  {level:1,type:'cone'},{level:2,type:'bucket'},{level:3,type:'poleVault'},{level:4,type:'football'},{level:5,type:'jester'},
  {level:6,type:'bombJester'},{level:7,type:'corpseTitan'},{level:8,type:'fireCatapult'},{level:9,type:'corpseTitan'},{level:10,type:'necromancer'}
 ]);
});

test('hard Qin is stronger without removing generals from the player roster',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants',{difficulty:'medium'});clearInterval(timer);const medium={hp:qinBossEntity().maxHp,slashAt:state.qinBoss.nextSlashAt,generalAt:state.qinBoss.nextGeneralAt};
  start('plants',{difficulty:'hard'});clearInterval(timer);state.resource=9999;const hard={hp:qinBossEntity().maxHp,slashAt:state.qinBoss.nextSlashAt,generalAt:state.qinBoss.nextGeneralAt,guanyu:deploymentReadyReason('firepea'),zhaoyun:deploymentReadyReason('zhaoyun')};
  return {medium,hard};
 });
 expect(result.medium).toEqual({hp:4200,slashAt:5000,generalAt:18000});
 expect(result.hard).toEqual({hp:4830,slashAt:4500,generalAt:16200,guanyu:'',zhaoyun:''});
});

test('hard Qin finale remains beatable through legal economy deployment removal relocation and tiger-seal actions',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  let seed=20261019;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants',{difficulty:'hard'});clearInterval(timer);state.paused=false;
  const laneTieOrder=[2,0,4,1,3],formation=()=>[['wallnut',6],['firepea',1],['machao',2],[state.time<70000?'sunflower':'zhaoyun',0],['zhangfei',5],['huangzhong',3],['kongming',4]],seenGenerals=new Set(),deployments=[],relocations=[];let economyConverted=false;
  for(let steps=0;steps<8400&&!state.over;steps++){
   if(state.qinBoss?.seals>=3)breakQinFormation();
   if(!economyConverted&&state.time>=70000){for(let r=0;r<5;r++)if(plantAtCell(r,0)?.type==='sunflower'){state.actionMode='remove';removePlantAt(r,0)}economyConverted=true}
   if(state.time%500===0){
    const threats=[0,1,2,3,4].map(r=>({r,nearest:Math.min(9,...state.zombies.filter(unit=>unit.hp>0&&!unit.boss&&unit.r===r).map(unit=>unit.c))}));
    const endangered=threats.filter(row=>state.lawnmowers[row.r].used&&row.nearest<4.5).sort((a,b)=>a.nearest-b.nearest)[0];
    if(endangered){
     const donor=state.plants.filter(unit=>unit.hp>0&&Math.abs(unit.r-endangered.r)===1&&!plantAtCell(endangered.r,Math.round(unit.c))).sort((a,b)=>b.c-a.c||b.hp-a.hp)[0];
     if(donor){state.actionMode='relocate';state.movingPlantId=donor.id;const from=donor.r,c=Math.round(donor.c);if(relocatePlantAt(endangered.r,c))relocations.push({from,to:endangered.r,c,at:state.time})}
    }
    const lanes=[...laneTieOrder].sort((a,b)=>{const score=row=>{const enemies=state.zombies.filter(unit=>unit.hp>0&&!unit.boss&&unit.r===row),nearest=enemies.length?Math.min(...enemies.map(unit=>unit.c)):9;return enemies.length*20+(9-nearest)*20+(state.lawnmowers[row].used?50:0)};return score(b)-score(a)||laneTieOrder.indexOf(a)-laneTieOrder.indexOf(b)});
    for(const [type,c] of formation())for(const r of lanes){
     if(state.plants.some(unit=>unit.hp>0&&unit.type===type&&unit.r===r&&Math.round(unit.c)===c))continue;
     if(deploymentReadyReason(type)||deploymentCellReason(r,c))continue;
     if(deploySelected(type,r,c))deployments.push({type,c,r,at:state.time});
    }
   }
   for(const unit of state.zombies)if(unit.qinVeteranLevel)seenGenerals.add(unit.qinVeteranLevel);
   tick();
  }
  return {over:state.over,title:$('modalTitle').textContent,time:state.time,resource:state.resource,deployments:deployments.length,relocations:relocations.length,generals:[...seenGenerals].sort((a,b)=>a-b),bossHp:qinBossEntity()?.hp??0,mowersUsed:state.lawnmowers.filter(mower=>mower.used).length,breachers:state.zombies.filter(unit=>unit.c<1.2).map(unit=>({type:unit.type,row:unit.r,c:unit.c,hp:unit.hp,qinveteran:unit.qinVeteranLevel||0,captain:!!unit.qinCaptain,summoned:!!unit.summoned}))};
 });
 expect(result.over,JSON.stringify(result)).toBe(true);
 expect(result.title,JSON.stringify(result)).toBe('終章勝利！');
 expect(result.time).toBeLessThanOrEqual(420000);
 expect(result.deployments).toBeGreaterThanOrEqual(10);
 expect(result.generals.length).toBeGreaterThanOrEqual(4);
});

test('breaking Qin formation cancels an already telegraphed unification command',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);
  const boss=qinBossEntity();boss.hp=boss.maxHp*.2;state.qinBoss.lastPhase=3;state.qinBoss.phase=3;state.qinBoss.command=100;state.qinBoss.nextCaptainAt=Infinity;
  state.plants=[];for(let row=0;row<5;row++)addPlant('wallnut',4,row);
  processQinBoss();
  const pending=gameplayTelegraphs().active.find(item=>item.kind==='qin-unification'),before=state.plants.map(unit=>unit.hp);
  collectQinTigerSeal();collectQinTigerSeal();collectQinTigerSeal();const broken=breakQinFormation();
  const activeAfterBreak=gameplayTelegraphs().active.filter(item=>item.kind==='qin-unification').length;
  state.time=pending.executeAt;const resolved=processEnemyTelegraphs();
  return {broken,activeAfterBreak,resolved,damage:state.plants.map((unit,index)=>before[index]-unit.hp)};
 });
 expect(result).toEqual({broken:true,activeAfterBreak:0,resolved:0,damage:[0,0,0,0,0]});
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
 expect(result.guardedLoss).toBe(70);
 expect(result.openLoss).toBe(100);
 expect(result.expiredLoss).toBe(70);
 expect(result.guarded).toBeTruthy();
 expect(result.guardedVisual).toBeTruthy();
 expect(result.vulnerableVisual).toBeTruthy();
 expect(result.restoredGuardVisual).toBeTruthy();
 expect(result.openHud).toContain('破陣中・8 秒');
 expect(result.midwayHud).toContain('破陣中・4 秒');
 expect(result.expiredHud).toContain('減傷 30%');
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
