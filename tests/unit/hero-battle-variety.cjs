const {test}=require('node:test');
const assert=require('node:assert/strict');

test('Ye takes either outpost first and applies separate field benefits on completion',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {OUTPOST_SECONDS}=await import('../../hero/field-missions.mjs');
 for(const first of [0,1]){
  const b=createBattle(45,42);
  b.nextSpawn=Infinity;
  assert.equal(historyAction(b,'outpost',first),true);
  for(let i=0;i<10;i++)stepBattle(b,.1);
  assert.equal(b.mission.positions[first],0);
  assert.equal(deploy(b,'liubei',0),true);
  assert.equal(deploy(b,'guanyu',2),true);
  b.paused=true;
  assert.equal(historyAction(b,'outpost',1-first),false);
  stepBattle(b,.1);
  assert.equal(b.mission.positions[first],0);
  b.paused=false;
  for(let i=0;i<72;i++)stepBattle(b,.1);
  assert.equal(b.mission.positions[first],OUTPOST_SECONDS);
  assert.equal(b.mission.positions[1-first],0);
  b.food=100;
  b.mission.nextVolley=b.time;
  stepBattle(b,.1);
  assert.ok(Math.abs(b.food-(first===1?101.7:101.2))<.001);
  assert.equal(Boolean(b.projectiles.length),first===1);
  assert.equal(historyAction(b,'outpost',1-first),true);
  for(let i=0;i<72;i++)stepBattle(b,.1);
  assert.equal(b.mission.done,true);
  assert.equal(b.over,false);
  b.bossSpawned=true;
  stepBattle(b,.1);
  assert.equal(b.won,true);
 }
});

test('Xingshi and Jiange send four attackers per forecast lane and keep fighting until the last wave',async()=>{
 const {createBattle,stepBattle}=await import('../../hero/engine.mjs');
 const {passLane}=await import('../../hero/field-missions.mjs');
 for(const level of [111,124]){
  const b=createBattle(level,42),lanes=[];
  for(let wave=0;wave<12;wave++){
   b.nextSpawn=b.time;
   const next=passLane(b);
   stepBattle(b,.1);
   assert.equal(b.enemies.length,1);
   assert.equal(b.enemies[0].lane,next);
   lanes.push(next);
   b.enemies=[];
   assert.equal(b.over,false);
  }
  assert.deepEqual(lanes,[0,0,0,0,2,2,2,2,1,1,1,1]);
  b.nextSpawn=b.time;
  stepBattle(b,.1);
  assert.equal(b.won,true);
 }
});

test('Red Cliffs warns before fire, freezes the warning on pause and leaves the safe lanes unharmed',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {fireLaneState}=await import('../../hero/field-missions.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const b=createBattle(58,42);
 b.nextSpawn=Infinity;
 b.laneTotal=5;
 assert.equal(deploy(b,'liubei',0),true);
 assert.equal(deploy(b,'guanyu',1),true);
 const [safe,exposed]=b.allies;
 const health=[safe.hp,exposed.hp];
 for(let i=0;i<105;i++)stepBattle(b,.1);
 assert.equal(fireLaneState(b,1),'warning');
 assert.equal(historyAction(b,'clear-fire',1),false);
 b.paused=true;
 const time=b.time;
 stepBattle(b,2);
 assert.equal(b.time,time);
 assert.equal(fireLaneState(b,1),'warning');
 b.paused=false;
 for(let i=0;i<38;i++)stepBattle(b,.1);
 assert.equal(fireLaneState(b,1),'burning');
 assert.equal(safe.hp,health[0]);
 assert.ok(exposed.hp<health[1]);
 assert.equal(historyAction(b,'clear-fire',1),true);
 assert.equal(fireLaneState(b,1),'safe');
 assert.equal(b.mission.clearings,0);
 for(let i=0;i<100;i++)stepBattle(b,.1);
 assert.equal(fireLaneState(b,2),'warning');
});

test('Yiling needs an ally to clear a burning road and allows it once',async()=>{
 const {createBattle,deploy}=await import('../../hero/engine.mjs');
 const {fireLaneState}=await import('../../hero/field-missions.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const b=createBattle(87,42);
 b.hazards.push({lane:0,until:10},{lane:2,until:10});
 b.enemies.push({boss:true,hp:99,lane:1,castAt:8});
 assert.equal(fireLaneState(b,1),'warning');
 assert.equal(historyAction(b,'clear-fire',0),false);
 assert.ok(deploy(b,'liubei',0));
 b.paused=true;
 assert.equal(historyAction(b,'clear-fire',0),false);
 b.paused=false;
 assert.equal(historyAction(b,'clear-fire',0),true);
 assert.equal(fireLaneState(b,0),'safe');
 assert.equal(fireLaneState(b,2),'burning');
 assert.ok(deploy(b,'zhangfei',2));
 assert.equal(historyAction(b,'clear-fire',2),false);
});

test('personal results keep the better run and hydrate older saves without altering rewards',async()=>{
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {recordBattleVictory}=await import('../../hero/battle-records.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const progress=normalizeProgress({completed:165,coins:99,inventory:{grain:2}});
 assert.deepEqual(progress.battleRecords,{});
 assert.equal(recordBattleVictory(progress,{level:45,won:false,time:10}),null);
 assert.equal(rewardVictory(progress,45),0);
 assert.equal(recordBattleVictory(progress,{level:45,won:true,time:40.3}).improved,true);
 assert.equal(recordBattleVictory(progress,{level:45,won:true,time:50}).best,41);
 assert.equal(recordBattleVictory(progress,{level:45,won:true,time:39}).best,39);
 assert.equal(recordBattleVictory(progress,{level:87,won:true,allyLosses:0}).best,0);
 assert.equal(recordBattleVictory(progress,{level:87,won:true,allyLosses:2}).best,0);
 assert.equal(recordBattleVictory(progress,{level:87,won:true,allyLosses:0}).improved,false);
 assert.equal(recordBattleVictory(progress,{level:124,won:true,lives:1}).best,1);
 assert.equal(recordBattleVictory(progress,{level:124,won:true,lives:3}).improved,true);
 assert.equal(recordBattleVictory(progress,{level:124,won:true,lives:2}).best,3);
 assert.equal(recordBattleVictory(progress,{level:165,won:true,mission:{gate:95}}).best,95);
 assert.equal(recordBattleVictory(progress,{level:165,won:true,mission:{gate:80}}).best,95);
 const saved=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 assert.deepEqual(saved.battleRecords,{45:39,87:0,124:3,165:95});
 assert.equal(saved.coins,99);
 assert.equal(saved.inventory.grain,2);
});

test('Wuchao needs two guarded raid points and every enemy cleared',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const b=createBattle(40,42);
 b.laneTotal=4;
 b.nextSpawn=Infinity;
 assert.equal(historyAction(b,'ignite',0),false);
 assert.equal(deploy(b,'liubei',0),true);
 assert.equal(deploy(b,'guanyu',3),true);
 b.enemies=[{lane:3,x:.4,hp:10}];
 assert.equal(historyAction(b,'ignite',1),false);
 b.paused=true;
 assert.equal(historyAction(b,'ignite',0),false);
 b.paused=false;
 assert.equal(historyAction(b,'ignite',0),true);
 assert.equal(historyAction(b,'ignite',0),false);
 assert.equal(b.mission.done,false);
 b.enemies=[];
 assert.equal(historyAction(b,'ignite',1),true);
 stepBattle(b,.1);
 assert.equal(b.over,false);
 b.bossSpawned=true;
 stepBattle(b,.1);
 assert.equal(b.won,true);
});

test('Fancheng relief retains partial captures and keeps the historic commander retreat',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const b=createBattle(80,42);
 b.nextSpawn=Infinity;
 b.laneTotal=5;
 assert.equal(deploy(b,'liubei',0),true);
 assert.equal(deploy(b,'guanyu',4),true);
 assert.equal(historyAction(b,'outpost',1),true);
 for(let i=0;i<31;i++)stepBattle(b,.1);
 const partial=b.mission.positions[1];
 assert.ok(partial>0);
 assert.equal(historyAction(b,'outpost',0),true);
 for(let i=0;i<71;i++)stepBattle(b,.1);
 assert.equal(b.mission.positions[1],partial);
 assert.equal(b.mission.done,false);
 assert.equal(historyAction(b,'outpost',1),true);
 for(let i=0;i<71;i++)stepBattle(b,.1);
 assert.equal(b.mission.done,true);
 assert.equal(b.over,false);
 b.bossSpawned=true;
 b.enemies.push({id:99,boss:true,lane:2,x:.5,name:'圍陣守將',hp:0});
 stepBattle(b,.1);
 assert.equal(b.bossRetreated,true);
 assert.equal(b.won,true);
});

test('Ruxu shows the next objective after landing while an enemy ship remains',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {missionQuickState}=await import('../../hero/mission-quick.mjs');
 const b=createBattle(73,42);
 b.bossSpawned=true;
 b.mission.travel=.99;
 assert.equal(deploy(b,'liubei',1),true);
 b.enemies.push({id:99,lane:0,x:.85,hp:100,rate:999,speed:0,lastAttack:0});
 stepBattle(b,.1);
 stepBattle(b,.1);
 assert.equal(b.mission.done,true);
 assert.equal(b.over,false);
 assert.equal(missionQuickState(b).doneHeading,'主船已靠岸 · 清退餘船');
 assert.match(missionQuickState(b).text,/主船已抵達回營渡口/);
 b.enemies=[];
 stepBattle(b,.1);
 assert.equal(b.won,true);
});

test('Han River carries three cargo batches across the chosen lane without resetting a switch',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const b=createBattle(79,42);
 b.nextSpawn=Infinity;
 b.bossSpawned=true;
 stepBattle(b,.1);
 assert.equal(b.mission.travel,0);
 assert.equal(deploy(b,'liubei',1),true);
 assert.equal(deploy(b,'guanyu',0),true);
 for(let i=0;i<50;i++)stepBattle(b,.1);
 const travel=b.mission.travel;
 assert.ok(travel>0);
 assert.equal(historyAction(b,'channel',0),true);
 assert.equal(b.mission.travel,travel);
 b.paused=true;
 stepBattle(b,.1);
 assert.equal(b.mission.travel,travel);
 b.paused=false;
 const batches=new Set();
 for(let i=0;i<800&&!b.over;i++){
  stepBattle(b,.1);
  batches.add(b.mission.delivered);
  if(b.mission.delivered<3)assert.equal(b.won,false);
 }
 assert.deepEqual([...batches],[0,1,2,3]);
 assert.equal(b.mission.delivered,3);
 assert.equal(b.won,true);
});

test('Jieting opens withdrawal when the third directed wave starts',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const b=createBattle(97,42);
 assert.equal(deploy(b,'archer',1),true);
 const lanes=[];
 for(let i=0;i<9;i++){
  b.nextSpawn=b.time;
  stepBattle(b,.1);
  lanes.push(b.enemies.at(-1).lane);
  if(i<8)assert.equal(historyAction(b,'retreat'),false);
 }
 assert.deepEqual(lanes,[0,0,0,0,2,2,2,2,1]);
 assert.equal(historyAction(b,'retreat'),true);
 stepBattle(b,.1);
 assert.equal(b.won,true);
 assert.ok(b.enemies.length>0);
});
