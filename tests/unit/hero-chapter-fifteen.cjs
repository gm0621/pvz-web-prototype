const {test}=require('node:test');
const assert=require('node:assert/strict');

test('Yiling chapter keeps a completed Maicheng save and preserves history, routes and portraits',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {rewardVictory,weaponsForLevel}=await import('../../hero/campaign.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {routeThrough,campaignMapSvg}=await import('../../hero/campaign-map.mjs');
 const {stagePeople}=await import('../../hero/characters.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {campConversation}=await import('../../hero/camp-talk.mjs');
 let progress=normalizeProgress({completed:82,coins:100,weapons:{guanyu:2},inventory:{grain:2},armyWeapons:{cao:{liubei:1}}});
 assert.equal(rewardVictory(progress,82),0);
 assert.deepEqual(STAGES.slice(82,88).map(stage=>stage.year),[221,221,221,222,222,222]);
 for(let level=83;level<=88;level++){
  assert.deepEqual(chapterInfo(level),{chapter:15,number:level-82,count:6,title:'夷陵之戰'});
  assert.ok(STAGES[level-1].references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  for(const slot of ['guanyu','zhangfei']){
   const prompt=STAGES[level-1].campRetryPrompts[slot];
   assert.ok(campConversation(level,slot,false).every(line=>line.startsWith(prompt.speaker+'：')));
  }
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
  assert.equal(progress.completed,level);
  assert.equal(weaponsForLevel(progress,level).guanyu,2);
 }
 assert.equal(progress.coins,580);
 assert.equal(progress.inventory.grain,2);
 assert.equal(progress.heroGrowth.caocao.weapon,1);
 assert.deepEqual(routeThrough(85),['wuxian','zigui']);
 assert.deepEqual(routeThrough(87),['xiaoting','zigui']);
 assert.deepEqual(routeThrough(88),['zigui','yongan']);
 assert.doesNotMatch(campaignMapSvg(84),/map-person map-leader/);
 assert.doesNotMatch(campaignMapSvg(88),/data-person="孫權"/);
 assert.equal(stagePeople(86).opponent.name,'孫桓');
 assert.match(STAGES[82].history,/220 年曹丕.*隔年四月，劉備在成都稱帝/);
 assert.match(STAGES[83].history,/張飛被部下所害/);
 assert.match(STAGES[86].history,/陸遜以火攻反擊.*馮習、張南等戰死/);
 assert.match(STAGES[87].history,/歸路被截而率部降魏/);
 for(const [query,levels] of [['元雄',[85]],['休元',[85,87]],['公衡',[86,88]],['叔武',[86]]]){
  assert.deepEqual(searchPeople(query)[0].levels,levels);
 }
});

test('Yiling withdrawal requires Liu Bei to return and keeps the pursuing commander alive',async()=>{
 const {createBattle,deploy,commandHero,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const battle=createBattle(87,42);
 battle.spawned=12;
 battle.nextSpawn=0;
 stepBattle(battle,.1);
 assert.ok(battle.introPending);
 const [commander]=battle.enemies;
 battle.introPending=false;
 commander.hp=1;
 commander.speed=0;
 for(let i=0;i<183;i++)stepBattle(battle,.1);
 assert.ok(commander.hp>=commander.maxHp*.35);
 assert.equal(battle.won,false);
 assert.ok(deploy(battle,'guanyu',0));
 const ally=battle.allies[0];
 ally.x=.33;
 assert.ok(historyAction(battle,'retreat'));
 assert.ok(commandHero(battle,'guanyu','down'));
 assert.equal(ally.lane,1);
 assert.equal(ally.order,'back');
 assert.equal(ally.targetX,.08);
 stepBattle(battle,.1);
 assert.equal(battle.won,false);
 assert.ok(deploy(battle,'liubei',1));
 stepBattle(battle,.1);
 assert.equal(battle.won,false);
 for(let i=0;i<30&&!battle.over;i++)stepBattle(battle,.1);
 assert.ok(battle.won);
 assert.equal(battle.enemies[0],commander);
});
