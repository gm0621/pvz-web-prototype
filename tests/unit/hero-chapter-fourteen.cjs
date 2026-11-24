const {test}=require('node:test');
const assert=require('node:assert/strict');

test('Xiangfan chapter preserves saved equipment, geography, historical outcomes and first-clear rewards',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {stagePeople}=await import('../../hero/characters.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory,weaponsForLevel}=await import('../../hero/campaign.mjs');
 const {factionFor}=await import('../../hero/factions.mjs');
 const {routeThrough,campaignMapSvg}=await import('../../hero/campaign-map.mjs');
 let progress=normalizeProgress({completed:76,coins:100,inventory:{grain:2},weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1}}});
 assert.equal(rewardVictory(progress,76),0);
 for(let level=77;level<=82;level++){
  const stage=STAGES[level-1];
  assert.deepEqual(chapterInfo(level),{chapter:14,number:level-76,count:6,title:'襄樊風雲'});
  assert.equal(stage.year,219);
  assert.ok(stage.references.length>=2&&stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  assert.equal(factionFor(level),level===80?'cao':null);
  assert.equal(weaponsForLevel(progress,level).guanyu,level===80?1:2);
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
  assert.equal(progress.completed,level);
 }
 assert.equal(progress.coins,580);
 assert.equal(progress.inventory.grain,2);
 assert.equal(progress.heroGrowth.xiahoudun.weapon,1);
 assert.deepEqual(routeThrough(78),['jiangling','xiangyang','fancheng']);
 assert.match(campaignMapSvg(78),/<text [^>]+>襄陽<\/text>/);
 assert.deepEqual(routeThrough(82),['maicheng','zhangxiang']);
 assert.doesNotMatch(campaignMapSvg(81),/map-person map-leader/);
 assert.match(campaignMapSvg(81),/data-person="呂蒙"/);
 assert.doesNotMatch(campaignMapSvg(82),/data-person="孫權"/);
 assert.equal(stagePeople(79).opponent.name,'于禁');
 assert.equal(stagePeople(80).leader.name,'徐晃');
 assert.notEqual(STAGES[79].bossName,'關羽');
 assert.match(STAGES[78].history,/大雨.*于禁向關羽投降.*龐德.*被俘後遇害/);
 assert.match(STAGES[81].ending[0][1],/關羽、關平.*擒獲.*遇害/);
 for(const [query,levels] of [['令明',[79]],['子明',[81]],['伯言',[81]],['關平',[78,79,81,82]]]){
  assert.deepEqual(searchPeople(query)[0].levels,levels);
 }
});

test('Maicheng retreat can finish with Guan Yu and living escorts but still requires the retreat order',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {missionQuickState}=await import('../../hero/mission-quick.mjs');
 const battle=createBattle(82,42);
 battle.spawned=12;
 battle.nextSpawn=0;
 assert.ok(deploy(battle,'archer',0));
 stepBattle(battle,.1);
 assert.match(missionQuickState(battle).text,/帶關羽與友軍撤回左側/);
 for(let i=0;i<181;i++)stepBattle(battle,.1);
 assert.equal(battle.won,false);
 assert.ok(historyAction(battle,'retreat'));
 stepBattle(battle,.1);
 assert.equal(battle.won,false);
 assert.match(missionQuickState(battle).text,/請召回關羽/);
 assert.ok(deploy(battle,'guanyu',1));
 for(let i=0;i<20&&!battle.over;i++)stepBattle(battle,.1);
 assert.equal(battle.won,true);
});
