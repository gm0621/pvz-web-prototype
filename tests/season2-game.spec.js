const {test,expect}=require('@playwright/test');
async function startLevelCard(page,selector){if(await page.locator('#levelScreen').evaluate(node=>node.classList.contains('newcomer-simple')))await page.locator('#continueCampaignBtn').click();else{await page.locator(selector).click();await page.locator('.level-card-details:not([hidden]) .level-detail-start').click()}}
async function open(page){await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');await page.evaluate(()=>{playerProfile=normalizeProfile({campaignProgress:{zombies:{highestLevel:1,completedLevels:{1:1}}}});backToHome();updateProgressUI();for(const f of ['plants','zombies'])markStoryRead(f,1,'opening',2)})}
test('second season first defense starts with its own two soldiers and no stage-two bypass',async({page})=>{
 await open(page);
 await page.locator('#plantStartBtn').click();
 await page.locator('[data-season-choice="2"]').click();
 await expect(page.locator('#chosenFactionText')).toContainText('第二季');
 await expect(page.locator('#levelGrid button[data-jump-level="1"]')).toBeEnabled();
 await expect(page.locator('#levelGrid button[data-jump-level="2"]')).toBeDisabled();
 await startLevelCard(page,'#levelGrid button[data-jump-level="1"]');
 await expect(page.locator('#game')).toHaveClass(/active/);
 await expect(page.locator('#modeTitle')).toContainText('霜土前哨');
 await expect(page.locator('#cards .name')).toHaveText(['屯田兵','強弩兵']);
 expect(await page.evaluate(()=>{const original=state;startLevel('plants',2);return {same:state===original,season:state.season,level:state.level};})).toEqual({same:true,season:2,level:1});
 await page.locator('#cards [data-key="s2Crossbow"]').click();await page.locator('.cell[data-r="2"][data-c="1"]').click();
 await expect(page.locator('#board .type-s2Crossbow')).toHaveCount(1);
 expect(await page.evaluate(()=>playerProfile.campaignProgress.plants.highestLevel)).toBe(0);
});

test('Wei soldiers accumulate safe supplies, focus their target, and brace their shield',async({page})=>{
 await open(page);const result=await page.evaluate(()=>{
  chooseFaction('plants',2);startLevel('plants',1);clearInterval(timer);state.plants=[];state.zombies=[];state.resource=0;
  addPlant('s2Tuntian',0,0);addPlant('s2Crossbow',1,1);addPlant('s2Shield',2,2);
  state.time=9000;actPlants();const safeSupply=state.resource;
  const target=addZombie('s2Rat',6,1);state.time=10000;actPlants();const first=state.projectiles.at(-1)?.damage;
  state.time=12100;actPlants();const second=state.projectiles.at(-1)?.damage;
  target.hp=0;addZombie('s2Rat',7,1);state.time=14200;actPlants();const changed=state.projectiles.at(-1)?.damage;
  return {safeSupply,first,second,changed,braced:state.plants.find(p=>p.type==='s2Shield').braced};
 });
 expect(result.safeSupply).toBe(40);expect(result.first).toBe(32);expect(result.second).toBeGreaterThan(result.first);expect(result.changed).toBe(32);expect(result.braced).toBe(true);
});

test('battle cards use the same current idle art as deployed Wei generals',async({page})=>{
 await open(page);const result=await page.evaluate(()=>{
  for(let level=1;level<=3;level++)completeCampaignLevel('plants',level,2);
  chooseFaction('plants',2);state={faction:'plants',season:2,level:4,time:0,over:false,paused:false,resource:9999,lastHuman:{},plants:[],zombies:[],projectiles:[],lawnmowers:[]};
  buildCards();const d=PLANT_TYPES.s2Xiahou,img=document.querySelector('#cards [data-key="s2Xiahou"] .card-img');
  return {card:img?.getAttribute('src'),battle:d.battleAsset,legacy:d.asset};
 });
 expect(result.card).toBe(result.battle);expect(result.card).not.toBe(result.legacy);
});

test('Wei shield soldier never attacks, repeatedly hops forward, and keeps high defense',async({page})=>{
 await open(page);const result=await page.evaluate(()=>{
  chooseFaction('plants',2);startLevel('plants',1);clearInterval(timer);state.plants=[];state.zombies=[];
  addPlant('s2Shield',2,2);const shield=state.plants[0];const enemy=addZombie('s2Rat',6,2),enemyHp=enemy.hp,positions=[];
  for(const time of [700,1400,2100]){state.time=time;actPlants();positions.push(shield.c)}
  render();const hopping=document.querySelector('.type-s2Shield')?.classList.contains('hopping');
  for(const time of [2800,3500,4200,4900,5600]){state.time=time;actPlants()}
  const afterHops={enemyHp:enemy.hp,attackStartedAt:shield.attackStartedAt,hopUntil:shield.hopUntil,expectedEnemyHp:enemyHp};
  const hpBefore=shield.hp;damageSeason2Plant(shield,100,true);const normalLoss=hpBefore-shield.hp;
  shield.armorWeakenedUntil=state.time+1000;const weakenedBefore=shield.hp;damageSeason2Plant(shield,100,true);const weakenedLoss=weakenedBefore-shield.hp;
  render();
  return {nonAttacking:PLANT_TYPES.s2Shield.nonAttacking,positions,stoppedAt:shield.c,afterHops,normalLoss,weakenedLoss,hopping};
 });
 expect(result.nonAttacking).toBe(true);
 expect(result.positions[0]).toBeGreaterThan(2);expect(result.positions[1]).toBeGreaterThan(result.positions[0]);expect(result.positions[2]).toBeGreaterThan(result.positions[1]);
 expect(result.stoppedAt).toBeGreaterThan(5);expect(result.stoppedAt).toBeLessThanOrEqual(5.2);
 expect(result.afterHops.enemyHp).toBe(result.afterHops.expectedEnemyHp);expect(result.afterHops.attackStartedAt).toBeUndefined();
 expect(result.normalLoss).toBe(60);expect(result.weakenedLoss).toBe(85);expect(result.hopping).toBe(true);
});

test('second-season attack uses Wei enemies, bone marks, pack damage and a breakable coffin shield',async({page})=>{
 await open(page);await page.locator('#zombieStartBtn').click();await page.locator('[data-season-choice="2"]').click();await startLevelCard(page,'[data-jump-level="1"]');
 await expect(page.locator('#cards .name')).toHaveText(['鼠牙群屍','腐釘弩屍']);
 expect(await page.evaluate(()=>state.plants.every(p=>p.type.startsWith('s2')))).toBe(true);
 const result=await page.evaluate(()=>{
  clearInterval(timer);state.plants=[];state.zombies=[];state.projectiles=[];addPlant('s2Shield',2,2);const p=state.plants[0];
  addZombie('s2Nail',5,2);state.time=5000;const random=Math.random;Math.random=()=>.99;actZombies();Math.random=random;
  const projectile=state.projectiles[0];projectile.x=p.c+.55;moveProjectiles();const marks=p.boneMarks;
  const before=p.hp;state.zombies=[];addZombie('s2Rat',2.5,2);addZombie('s2Rat',2.6,2);state.time=6000;actZombies();const packDamage=before-p.hp;
  state.zombies=[];const shield=addZombie('s2Coffin',5,1);state.projectiles=[{x:5.42,r:1,dir:1,from:'plant',damage:100,speed:.08}];moveProjectiles();const firstShield={hp:shield.hp,shield:shield.shieldHp};
  for(let i=0;i<3;i++){state.projectiles=[{x:shield.c+.42,r:1,dir:1,from:'plant',damage:100,speed:.08}];moveProjectiles()}
  return {marks,packDamage,remaining:p.boneMarks,firstShield,finalShield:shield.shieldHp};
 });
 expect(result.marks).toBe(1);expect(result.packDamage).toBe(36);expect(result.remaining).toBe(0);
 expect(result.firstShield).toEqual({hp:220,shield:80});expect(result.finalShield).toBe(0);
});

test('season-two smoke, break mark, haste, and finale fallback all affect combat',async({page})=>{
 await open(page);const result=await page.evaluate(()=>{
  chooseFaction('plants',2);startLevel('plants',1);clearInterval(timer);state.plants=[];state.zombies=[];state.projectiles=[];state.time=1000;
  const smoke=addZombie('s2Smoke',4,2),covered=addZombie('s2Rat',5,2);const coveredBefore=covered.hp;state.projectiles=[{x:covered.c+.32,r:2,dir:1,from:'plant',damage:100,speed:.08,sourceId:'shot',sourceType:'s2Crossbow'}];moveProjectiles();const smokeLoss=coveredBefore-covered.hp;
  state.zombies=[];state.plants=[];const marked=addZombie('s2Rat',5,1),ally=addPlant('s2Crossbow',1,1);marked.breakMarkedUntil=state.time+5000;const markedBefore=marked.hp;damageZombie(marked,100,{source:ally,kind:'projectile'});const markedLoss=markedBefore-marked.hp;
  state.zombies=[];state.plants=[];const target=addPlant('s2Tuntian',2,3),rat=addZombie('s2Rat',2.6,3);rat.last=0;rat.hasteUntil=1000;state.time=600;const hpBefore=target.hp;actZombies();const hasteLoss=hpBefore-target.hp;
  state.zombies=[];state.plants=[];state.level=1;state.time=24000;state.bossSpawned=false;addZombie('s2Rat',1,2);for(let c=0;c<5;c++)addPlant('s2Tuntian',c,2);processSeason2AttackEvents();const boss=state.plants.find(p=>p.boss);
  return {smokeLoss,markedLoss,hasteLoss,bossSpawned:state.bossSpawned,bossRow:boss?.r,blockedRow:2};
 });
 expect(result.smokeLoss).toBe(75);expect(result.markedLoss).toBe(115);expect(result.hasteLoss).toBeGreaterThan(0);expect(result.bossSpawned).toBe(true);expect(result.bossRow).not.toBe(result.blockedRow);
});

test('late Wei utility and the hexer counter work in real season-two combat',async({page})=>{
 await open(page);const result=await page.evaluate(()=>{
  chooseFaction('plants',2);startLevel('plants',1);clearInterval(timer);state.plants=[];state.zombies=[];state.projectiles=[];state.pendingHits=[];state.time=12000;
  const random=Math.random;Math.random=()=>0;
  const xuChu=addPlant('s2XuChu',2,0),xuTarget=addZombie('s2Coffin',2.7,0);xuChu.last=0;actPlants();state.time+=PLANT_TYPES.s2XuChu.attackHitAt;processSeason2PendingHits();const xuChuStun=xuTarget.stunUntil-state.time;
  state.plants=[];state.zombies=[];state.pendingHits=[];state.projectiles=[];state.gameplay.telegraphs.active=[];state.time=20000;
  const guoJia=addPlant('s2GuoJia',1,1),ram=addZombie('s2Ram',3.7,1),dummy=addPlant('s2Shield',3,1);ram.charge=60;actZombies();const beforeDelay=state.gameplay.telegraphs.active[0]?.executeAt;guoJia.last=0;actPlants();state.time+=PLANT_TYPES.s2GuoJia.attackHitAt;processSeason2PendingHits();const shot=state.projectiles.at(-1);shot.x=ram.c+.32;moveProjectiles();const afterDelay=state.gameplay.telegraphs.active[0]?.executeAt;
  state.plants=[];state.zombies=[];state.pendingHits=[];state.projectiles=[];state.gameplay.telegraphs.active=[];state.time=30000;
  const cao=addPlant('s2CaoCao',2,2),crossbow=addPlant('s2Crossbow',1,2),caoTarget=addZombie('s2Coffin',5,2);cao.last=0;crossbow.last=state.time-1600;actPlants();const shieldGranted=crossbow.shieldHp||0,crossbowBefore=crossbow.hp;damageSeason2Plant(crossbow,100,true,{source:caoTarget,kind:'melee'});const command={haste:crossbow.caoHasteUntil-state.time,shield:shieldGranted,shieldedLoss:crossbowBefore-crossbow.hp,shots:state.pendingHits.length+state.projectiles.length};
  state.plants=[];state.zombies=[];state.pendingHits=[];state.projectiles=[];state.time=40000;
  const dian=addPlant('s2DianWei',1,3),protectedUnit=addPlant('s2Crossbow',2,3),hexer=addZombie('s2Hexer',2.6,3);hexer.last=0;actZombies();const guardBefore=dian.hp,protectedBefore=protectedUnit.hp;damageSeason2Plant(protectedUnit,100,true,{source:hexer,kind:'melee'});const blockedGuard={dianLoss:guardBefore-dian.hp,protectedLoss:protectedBefore-protectedUnit.hp,buffBlockedUntil:protectedUnit.buffBlockedUntil-state.time};
  Math.random=random;return {xuChuStun,beforeDelay,afterDelay,command,blockedGuard};
 });
 expect(result.xuChuStun).toBeGreaterThanOrEqual(1000);
 expect(result.afterDelay-result.beforeDelay).toBe(1000);
 expect(result.command.haste).toBeGreaterThanOrEqual(2500);expect(result.command.shield).toBe(45);expect(result.command.shieldedLoss).toBe(55);expect(result.command.shots).toBeGreaterThan(0);
 expect(result.blockedGuard.buffBlockedUntil).toBe(4000);expect(result.blockedGuard.dianLoss).toBe(0);expect(result.blockedGuard.protectedLoss).toBe(100);
});

test('mobile attack keeps a zombie deployed in column nine visibly inside the board',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);
 await page.evaluate(()=>{chooseFaction('zombies',2);startLevel('zombies',1);clearInterval(timer)});
 await page.locator('#cards [data-key="s2Rat"]').click();await page.locator('.cell[data-r="2"][data-c="8"]').click();
 const zombie=page.locator('#board .type-s2Rat');await expect(zombie).toHaveCount(1);
 await page.evaluate(()=>{state.zombies.push({id:'offboard-rat',type:'s2Rat',r:0,c:9.2,hp:100,maxHp:100,last:0,bornAt:state.time});state.plants.push({id:'right-defender',type:'s2Crossbow',r:1,c:8,hp:100,maxHp:100,last:0,bornAt:state.time});render()});
 const attackEdgeClasses=await page.evaluate(()=>({rats:[...document.querySelectorAll('#board .type-s2Rat')].map(entity=>entity.classList.contains('attack-edge-right')),defender:document.querySelector('#board .type-s2Crossbow')?.classList.contains('attack-edge-right')}));
 expect(attackEdgeClasses.rats).toEqual([true,false]);expect(attackEdgeClasses.defender).toBe(false);await page.waitForTimeout(500);
 const geometry=await page.evaluate(()=>{const board=document.querySelector('#board').getBoundingClientRect(),entity=document.querySelector('#board .type-s2Rat'),image=entity.querySelector('.char-img').getBoundingClientRect(),style=getComputedStyle(entity);return {board:{left:board.left,right:board.right},image:{left:image.left,right:image.right},className:entity.className,marginLeft:style.marginLeft,left:style.left}});
 expect(geometry.image.left,JSON.stringify(geometry)).toBeGreaterThanOrEqual(geometry.board.left-1);expect(geometry.image.right,JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.board.right+1);
});
