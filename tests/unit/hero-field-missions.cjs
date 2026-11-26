const {test}=require('node:test');
const assert=require('node:assert/strict');

test('Xiling can change channels with the same travel, and the fleet needs cover and clear water',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {channelHazard,channelName,fleetChannel}=await import('../../hero/field-missions.mjs');
 for(const total of [3,4,5]){
  const b=createBattle(141,42);
  b.laneTotal=total;
  b.nextSpawn=Infinity;
  assert.equal(channelName(b,fleetChannel(b)),'主航道');
  assert.equal(deploy(b,'archer',0),true);
  stepBattle(b,.1);
  assert.equal(b.mission.travel,0);
  const main=fleetChannel(b);
  for(let i=0;i<50;i++)stepBattle(b,.1);
  assert.equal(deploy(b,'archer',main),true);
  for(let i=0;i<76;i++)stepBattle(b,.1);
  assert.equal(channelHazard(b,main),'blocked');
  const traveled=b.mission.travel;
  assert.ok(traveled>0);
  stepBattle(b,.1);
  assert.equal(b.mission.travel,traveled);
  b.paused=true;
  assert.equal(historyAction(b,'channel',0),false);
  stepBattle(b,.1);
  assert.equal(b.mission.travel,traveled);
  b.paused=false;
  assert.equal(historyAction(b,'channel',0),true);
  assert.equal(historyAction(b,'channel',main),false);
  assert.equal(b.mission.travel,traveled);
  for(let i=0;i<230;i++)stepBattle(b,.1);
  assert.equal(b.mission.travel,1);
  assert.equal(b.over,false,'ships already at Xiling still need enemies cleared');
  b.bossSpawned=true;
  stepBattle(b,.1);
  assert.equal(b.won,true);
 }
});

test('Luoyang previews the actual lane, charges gate damage and caps repairs at two',async()=>{
 const {createBattle,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {siegeLane}=await import('../../hero/field-missions.mjs');
 for(const total of [3,4,5]){
  const b=createBattle(165,42);
  b.laneTotal=total;
  const lanes=new Set();
  for(let wave=0;wave<total;wave++){
   const predicted=siegeLane(b);
   b.nextSpawn=b.time;
   stepBattle(b,.1);
   assert.equal(b.enemies[0].lane,predicted);
   b.enemies.length=0;
   lanes.add(predicted);
  }
  assert.equal(lanes.size,total);
  b.nextSpawn=Infinity;
  assert.equal(historyAction(b,'repair'),false);
  const breach=(heavy=false)=>{
   b.enemies.push({id:b.nextId++,lane:0,x:.02,hp:50,speed:.03,shielded:heavy,damage:10,lastAttack:-1,rate:2});
   stepBattle(b,.1);
  };
  breach(true);
  assert.equal(b.mission.gate,65);
  b.paused=true;
  assert.equal(historyAction(b,'repair'),false);
  b.paused=false;
  assert.equal(historyAction(b,'repair'),true);
  assert.equal(b.mission.gate,95);
  assert.equal(historyAction(b,'repair'),true);
  assert.equal(b.mission.gate,100);
  breach();
  assert.equal(b.mission.gate,75);
  assert.equal(b.mission.repairs,0);
  assert.equal(historyAction(b,'repair'),false);
  assert.equal(b.lives,3);
  for(let i=0;i<3;i++)breach();
  assert.equal(b.mission.gate,0);
  assert.equal(b.lossReason,'gate-broken');
  assert.equal(b.over,true);
  assert.equal(b.won,false);
 }
 const clean=createBattle(165,42);
 clean.bossSpawned=true;
 stepBattle(clean,.1);
 assert.equal(clean.won,true);
});
