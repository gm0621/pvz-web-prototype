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

test('Jiange sends four attackers per forecast lane and clears only with a surviving defense',async()=>{
 const {createBattle,stepBattle}=await import('../../hero/engine.mjs');
 const {passLane}=await import('../../hero/field-missions.mjs');
 const b=createBattle(124,42),lanes=[];
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
