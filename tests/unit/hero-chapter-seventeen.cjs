const {test}=require('node:test');
const assert=require('node:assert/strict');

test('first northern expedition extends saved progress, links routes and assigns real historical casts',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {routeThrough,campaignMapSvg}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const routes=[['chengdu','mianyang'],['qishan','tianshui'],['qishan','jieting'],['jigu','nanzheng'],['sanguan','chencang'],['wudu','yinping']];
 let progress=normalizeProgress({completed:94,coins:150,weapons:{guanyu:2},inventory:{grain:2}});
 assert.equal(rewardVictory(progress,94),0);
 assert.deepEqual(STAGES.slice(94,100).map(stage=>stage.year),[227,228,228,228,228,229]);
 for(let level=95;level<=100;level++){
  const stage=STAGES[level-1];
  assert.deepEqual(chapterInfo(level),{chapter:17,number:level-94,count:6,title:'北伐初征'});
  assert.deepEqual(routeThrough(level),routes[level-95]);
  assert.ok(stage.historyCast.includes(stage.quiz.speaker));
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,100);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.inventory.grain,2);
 assert.match(STAGES[96].victory,/街亭仍由魏軍取勝/);
 assert.match(STAGES[98].victory,/陳倉未被攻下/);
 assert.match(STAGES[99].victory,/取得武都、陰平/);
 assert.doesNotMatch(campaignMapSvg(100),/data-person="郭淮"/);
 for(const [query,level] of [['伯約',96],['幼常',97],['子均',97],['子丹',98],['伯道',99],['伯濟',100]]){
  assert.ok(searchPeople(query)[0].levels.includes(level),query);
 }
});

test('retreats without named hero slots still require living allies to reach the left edge',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction,historyMissionText}=await import('../../hero/history-missions.mjs');
 for(const level of [97,99]){
  const battle=createBattle(level);
  battle.bossSpawned=true;
  battle.mission.withdrawAt=0;
  assert.ok(historyAction(battle,'retreat'));
  stepBattle(battle,.1);
  assert.equal(battle.over,false);
  assert.match(historyMissionText(battle),/請先召回至少一隊友軍/);
  assert.ok(deploy(battle,'archer',0));
  battle.allies[0].x=.35;
  assert.ok(historyAction(battle,'retreat'));
  stepBattle(battle,.1);
  assert.equal(battle.over,false);
  for(let step=0;step<60&&!battle.over;step++)stepBattle(battle,.1);
  assert.ok(battle.won);
 }
});

test('stage 100 keeps a travelling cart at the same position when its road is blocked',async()=>{
 const {createBattle,deploy}=await import('../../hero/engine.mjs');
 const {historyAction,stepHistoryMission,supplyLeg}=await import('../../hero/history-missions.mjs');
 const battle=createBattle(100);
 assert.deepEqual(supplyLeg(battle),{lane:0,name:'武都營地',progress:0});
 assert.equal(historyAction(battle,'supply'),false);
 assert.ok(deploy(battle,'liubei',0));
 assert.ok(historyAction(battle,'supply'));
 stepHistoryMission(battle,2);
 assert.equal(supplyLeg(battle).progress,.25);
 battle.enemies.push({hp:10,x:.3,lane:0});
 stepHistoryMission(battle,2);
 assert.equal(supplyLeg(battle).progress,.25);
 assert.equal(historyAction(battle,'supply'),false);
 battle.enemies=[];
 stepHistoryMission(battle,6);
 assert.equal(battle.mission.delivered,1);
 assert.deepEqual(supplyLeg(battle),{lane:1,name:'山路驛站',progress:0});
});

test('stage 100 still waits for remaining enemies after the third cart arrives',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction,stepHistoryMission}=await import('../../hero/history-missions.mjs');
 const battle=createBattle(100);
 battle.spawned=11;
 battle.nextSpawn=0;
 stepBattle(battle,.1);
 battle.nextSpawn=battle.time;
 stepBattle(battle,.1);
 assert.ok(battle.bossSpawned);
 const [enemy]=battle.enemies;
 enemy.lane=0;
 battle.mission.delivered=2;
 assert.ok(deploy(battle,'liubei',2));
 assert.ok(historyAction(battle,'supply'));
 stepHistoryMission(battle,8);
 assert.equal(battle.mission.delivered,3);
 stepBattle(battle,.1);
 assert.equal(battle.over,false);
 enemy.hp=0;
 stepBattle(battle,.1);
 assert.ok(battle.won);
});
