const {test}=require('node:test');const assert=require('node:assert/strict');
test('legacy upgrades belong only to Liu army; all nine ranks persist independently and rollback failed writes',async()=>{
 const {normalizeProgress,createBattle}=await import('../../hero/engine.mjs');const {purchase,weaponsForLevel}=await import('../../hero/campaign.mjs');
 let p=normalizeProgress({completed:22,coins:2000,weapons:{liubei:2,guanyu:1,zhangfei:3}});
 assert.deepEqual(weaponsForLevel(p,16),{liubei:2,guanyu:1,zhangfei:3});
 for(const level of [17,20]){assert.deepEqual(weaponsForLevel(p,level),{liubei:0,guanyu:0,zhangfei:0});for(const key of ['liubei','guanyu','zhangfei'])assert.equal(purchase(p,key,()=>true,level),'')}
 const before=JSON.stringify(p);assert.match(purchase(p,'liubei',()=>false,17),/未購買/);assert.equal(JSON.stringify(p),before);
 p=normalizeProgress(JSON.parse(JSON.stringify(p)));assert.equal(p.coins,1640);assert.equal(weaponsForLevel(p,1).liubei,2);assert.equal(weaponsForLevel(p,64).liubei,1);assert.equal(weaponsForLevel(p,22).liubei,1);
 const b=createBattle(17,1,weaponsForLevel(p,17));purchase(p,'liubei',()=>true,17);assert.equal(b.weapons.liubei,1);assert.equal(weaponsForLevel(p,17).liubei,2);assert.equal(weaponsForLevel(p,20).liubei,1);
});
test('stage 18 explains the active road and waits for three shipments, respecting pause',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyMissionText,historyAction}=await import('../../hero/history-missions.mjs');
 const battle=createBattle(18,1);
 battle.bossSpawned=true;
 battle.nextSpawn=Infinity;
 assert.match(historyMissionText(battle),/上路酸棗營外.*派友軍到這一路/);
 assert.equal(historyAction(battle,'supply'),false);
 battle.food=1000;
 for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries())assert.ok(deploy(battle,key,lane));
 for(let batch=0;batch<3;batch++){
  battle.paused=true;
  assert.equal(historyAction(battle,'supply'),false);
  battle.paused=false;
  assert.ok(historyAction(battle,'supply'));
  for(let step=0;step<79;step++)stepBattle(battle,.1);
  assert.equal(battle.won,false);
  stepBattle(battle,.1);
  assert.equal(battle.won,batch===2);
 }
});
