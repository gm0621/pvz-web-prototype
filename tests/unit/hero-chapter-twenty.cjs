const {test}=require('node:test');
const assert=require('node:assert/strict');

test('Jiang Wei’s campaign preserves the Xingshi save and distinguishes historic routes, outcomes and portraits',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg,journeyRoute,MAP_PLACES}=await import('../../hero/campaign-map.mjs');
 const {searchPeople,PEOPLE}=await import('../../hero/people-data.mjs');
 const {expressionPortrait,portraitForDisplay}=await import('../../hero/portrait-expressions.mjs');
 const routes=[['chengdu'],['mianyang','taoxi'],['yinping','mianyang'],['hanshou'],['mianyang','nanan'],['taoxi','didao','zhongti']];
 let progress=normalizeProgress({completed:112,coins:150,weapons:{guanyu:2},inventory:{grain:2},heroGrowth:{caoren:{weapon:2}}});
 assert.equal(rewardVictory(progress,112),0);
 const chapter=STAGES.slice(112,118);
 assert.deepEqual(chapter.map(stage=>stage.year),[246,247,249,253,253,255]);
 assert.deepEqual(chapter.map(stage=>stage.mission),['restoration','dispatch','supply','dispatch','withdraw','withdraw']);
 for(const [i,stage] of chapter.entries()){
  const level=113+i;
  assert.deepEqual(chapterInfo(level),{chapter:20,number:i+1,count:6,title:'姜維北伐'});
  assert.deepEqual(routeThrough(level),routes[i]);
  assert.ok(stage.historyCast.includes(stage.leaderName));
  assert.ok(stage.historyCast.includes(stage.quiz.speaker));
  assert.ok(stage.historyCast.every(name=>expressionPortrait(name)));
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  assert.match(campaignMapSvg(level),new RegExp('map-leader" data-person="'+stage.leaderName+'"'));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,118);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.inventory.grain,2);
 assert.equal(progress.heroGrowth.caoren.weapon,2);
 assert.equal(rewardVictory(progress,173),0);
 assert.match(chapter[3].victory,/費禕在漢壽遇害/);
 assert.match(chapter[4].victory,/南安仍在魏國手中/);
 assert.match(chapter[5].victory,/狄道仍由魏軍守住/);
 assert.match(campaignMapSvg(114),/map-opponent" data-person="郭淮"/);
 assert.doesNotMatch(campaignMapSvg(118),/map-opponent/);
 for(const name of ['洮西','狄道','鍾題'])assert.ok(campaignMapSvg(118).includes('>'+name+'</text>'),name);
 const [left,top,width,height]=journeyRoute(118).viewBox.split(' ').map(Number);
 const {x,y}=MAP_PLACES.didao;
 assert.ok(x>left&&x<left+width&&y>top&&y<top+height);
 for(const [alias,name,levels] of [
  ['仲權','夏侯霸',[114,115,118]],['郭脩','郭循',[116]],['玄伯','陳泰',[117,118]],['彥緯','王經',[118]]
 ]){
  const [entry]=searchPeople(alias);
  assert.equal(entry.name,name);
  assert.deepEqual(entry.levels,levels);
  assert.equal(portraitForDisplay(entry.portrait).asset,expressionPortrait(name));
 }
 assert.equal(new Set(PEOPLE.map(p=>expressionPortrait(p.name))).size,155);
});

test('both chapter twenty retreats require a surviving party and wait for soldiers as well as heroes',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {STAGES}=await import('../../hero/story.mjs');
 for(const level of [117,118]){
  assert.match(STAGES[level-1].bossTip,/武將和士兵/);
  const battle=createBattle(level);
  battle.bossSpawned=true;
  battle.mission.withdrawAt=0;
  assert.ok(historyAction(battle,'retreat'));
  stepBattle(battle,.1);
  assert.equal(battle.won,false,'an empty field cannot win');

  assert.ok(deploy(battle,'liubei',0));
  assert.ok(deploy(battle,'archer',1));
  const [hero,archer]=battle.allies;
  archer.x=.45;
  assert.ok(historyAction(battle,'retreat'));
  stepBattle(battle,.1);
  assert.equal(battle.won,false,'a soldier outside the retreat zone blocks victory');

  hero.hp=0;
  for(let i=0;i<100&&!battle.over;i++)stepBattle(battle,.1);
  assert.equal(battle.won,true,'a living soldier can be the last unit to return');
  assert.ok(archer.x<=.18);
 }
});
