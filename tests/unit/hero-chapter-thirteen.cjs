const {test}=require('node:test');
const assert=require('node:assert/strict');

test('chapter thirteen keeps independent army equipment and extends a completed 70 save',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory,weaponsForLevel}=await import('../../hero/campaign.mjs');
 const {factionFor}=await import('../../hero/factions.mjs');
 const {routeThrough,journeyRoute,campaignMapSvg}=await import('../../hero/campaign-map.mjs');
 const {stagePeople,battleBossPortrait}=await import('../../hero/characters.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 let progress=normalizeProgress({completed:70,coins:100,inventory:{grain:2},weapons:{liubei:3},armyWeapons:{cao:{liubei:1}}});
 assert.equal(rewardVictory(progress,70),0);
 assert.deepEqual(STAGES.slice(70,76).map(stage=>stage.year),[215,216,217,218,219,219]);
 assert.deepEqual(STAGES.slice(70,76).map(stage=>stage.mission),['withdraw','dispatch','naval','holdout','formation','supply']);
 for(let level=71;level<=76;level++){
  assert.deepEqual(chapterInfo(level),{chapter:13,number:level-70,count:6,title:'漢中爭雄'});
  assert.equal(factionFor(level),level<=74?'cao':null);
  assert.equal(weaponsForLevel(progress,level).liubei,level<=74?1:3);
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
  assert.equal(progress.completed,level);
  assert.ok(STAGES[level-1].references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  const route=journeyRoute(level);
  assert.ok(route.viewBox.split(' ').every(value=>Number.isFinite(Number(value))));
 }
 assert.equal(progress.inventory.grain,2);
 assert.equal(progress.coins,580);
 assert.deepEqual(routeThrough(71),['nanzheng','dangqu']);
 assert.deepEqual(routeThrough(73),['juchao','ruxu']);
 assert.deepEqual(routeThrough(74),['yangping','maming']);
 assert.deepEqual(routeThrough(75),['yangping','dingjun']);
 assert.deepEqual(routeThrough(76),['dingjun','mianyang']);
 assert.equal(stagePeople(71).leader.name,'張郃');
 assert.equal(stagePeople(71).opponent.name,'張飛');
 assert.equal(stagePeople(74).opponent.name,'陳式');
 assert.match(campaignMapSvg(75),/class="map-person map-opponent" data-person="夏侯淵"/);
 assert.doesNotMatch(campaignMapSvg(76),/data-person="曹操"/);
 assert.equal(stagePeople(76).opponent.name,'曹操');
 assert.match(stagePeople(76).relation,/撤回長安/);
 assert.equal(stagePeople(75).opponent.asset,battleBossPortrait('夏侯淵',75).asset);
 assert.match(STAGES[70].ending[0][1],/退回南鄭/);
 assert.match(STAGES[74].ending[0][1],/黃忠.*夏侯淵戰死/);
 assert.match(STAGES[75].ending[0][1],/曹操撤回長安.*漢中王/);
 for(const [query,levels] of [['儁乂',[71,74,75,97,103]],['陳式',[74,100]],['漢升',[75]],['孝直',[75,76]]]){
  assert.deepEqual(searchPeople(query)[0].levels,levels);
 }
});

test('stage 71 waits for the relief countdown and an explicit retreat order without an enemy general',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction,historyMissionText}=await import('../../hero/history-missions.mjs');
 const {missionQuickState}=await import('../../hero/mission-quick.mjs');
 const battle=createBattle(71,42);
 assert.match(missionQuickState(battle).text,/守線等待接應.*曹操、曹洪與友軍撤回左側/);
 battle.spawned=12;
 battle.nextSpawn=0;
 deploy(battle,'liubei',0);
 deploy(battle,'zhangfei',2);
 stepBattle(battle,.1);
 assert.ok(battle.bossSpawned);
 assert.equal(battle.enemies.length,0);
 assert.equal(historyAction(battle,'retreat'),false);
 battle.paused=true;
 const time=battle.time;
 stepBattle(battle,.1);
 assert.equal(battle.time,time);
 battle.paused=false;
 for(let i=0;i<181;i++)stepBattle(battle,.1);
 assert.equal(battle.won,false);
 assert.match(historyMissionText(battle),/按全軍撤離/);
 assert.equal(historyAction(battle,'retreat'),true);
 for(let i=0;i<200&&!battle.over;i++)stepBattle(battle,.1);
 assert.ok(battle.won);
});

test('Dingjunshan applies Liu Bei’s saved weapon rank to normal attacks',async()=>{
 const {createBattle,deploy,normalizeProgress,stepBattle}=await import('../../hero/engine.mjs');
 const {configurePeachRoster}=await import('../../hero/roster.mjs');
 const {weaponsForLevel}=await import('../../hero/campaign.mjs');
 const progress=normalizeProgress({completed:74,weapons:{liubei:3},heroGrowth:{caocao:{weapon:1}}});
 const battle=createBattle(75,42,weaponsForLevel(progress,75));
 configurePeachRoster(battle,progress);
 battle.nextSpawn=0;
 stepBattle(battle,.1);
 const [target]=battle.enemies;
 assert.ok(deploy(battle,'liubei',target.lane));
 target.x=.15;
 const initialHp=target.hp;
 for(let i=0;i<4;i++)stepBattle(battle,.1);
 assert.equal(initialHp-target.hp,battle.roster.liubei.damage+9);
});
