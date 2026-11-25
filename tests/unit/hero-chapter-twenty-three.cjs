const {test}=require('node:test');
const assert=require('node:assert/strict');

test('the six post-surrender stages preserve the previous chapter save and historical outcomes',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg,MAP_PLACES}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {expressionPortrait}=await import('../../hero/portrait-expressions.mjs');
 const chapter=STAGES.slice(130,136);
 const routes=[['qiCounty','fu'],['chengdu'],['fu','chengdu'],['chengduOffice','chengduStreets'],['chengdu','luoyang'],['luoyang']];
 let progress=normalizeProgress({completed:130,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1}},inventory:{grain:2}});
 assert.equal(rewardVictory(progress,130),0);
 assert.equal(chapter.length,6);
 assert.deepEqual(chapter.map(s=>s.year),[263,264,264,264,264,265]);
 assert.deepEqual(chapter.map(s=>s.mission),['dispatch','restoration','dispatch','withdraw','supply','restoration']);
 for(const [index,stage] of chapter.entries()){
  const level=131+index;
  assert.deepEqual(chapterInfo(level),{chapter:23,number:index+1,count:6,title:'成都餘波'});
  assert.deepEqual(routeThrough(level),routes[index]);
  assert.ok(stage.historyCast.every(name=>expressionPortrait(name)));
  assert.ok(stage.references.length>=2);
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  for(const key of routes[index])assert.match(campaignMapSvg(level),new RegExp('>'+MAP_PLACES[key].name+'</text>'));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,136);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.armyWeapons.cao.guanyu,1);
 assert.equal(progress.inventory.grain,2);
 assert.equal(rewardVictory(progress,143),0);
 assert.match(chapter[0].history,/到涪城向鍾會投降/);
 assert.match(chapter[3].victory,/鍾會和姜維在成都兵變中身亡/);
 assert.match(chapter[5].victory,/東吳仍然存在/);
 assert.match(campaignMapSvg(131),/route-inset-opponent-role[^>]*>受降<\/text>/);
 const portraits=new Set();
 for(const [alias,name,levels] of [
  ['伯玉','衛瓘',[132,133,134]],['胡烈','胡烈',[133,134]],['令先','郤正',[135]],['晉武帝','司馬炎',[136,137,139,140,142]]
 ]){
  const [entry]=searchPeople(alias);
  assert.equal(entry.name,name);
  assert.deepEqual(entry.levels,levels);
  portraits.add(expressionPortrait(name));
 }
 assert.equal(portraits.size,4);
});

test('all post-surrender missions finish with normal waves, and only the uprising spawns enemies',async()=>{
 const {normalizeProgress,createBattle,deploy,stepBattle,castActive}=await import('../../hero/engine.mjs');
 const {SLOTS,configureRoster,configurePeachRoster}=await import('../../hero/roster.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {heroesForLevel}=await import('../../hero/story.mjs');
 for(const level of [131,132,133,134,135,136]){
  const seeds=level===134?[1,42,2026]:[42];
  for(const seed of seeds){
   const battle=createBattle(level,seed);
   const progress=normalizeProgress({completed:130});
   if([132,133,136].includes(level))configureRoster(battle,progress,heroesForLevel(level).archer);
   else configurePeachRoster(battle,progress);
   for(let step=0;step<3000&&!battle.over;step++){
    if(battle.introPending)battle.introPending=false;
    const mission=battle.mission;
    if(step%10===0){
     if(mission.kind==='withdraw')historyAction(battle,'retreat');
     if(!mission.ordered)for(const [lane,key] of SLOTS.slice(0,3).entries()){
      if(!battle.allies.some(unit=>unit.key===key&&unit.hp>0))deploy(battle,key,lane);
      else if(level===134&&battle.allies.filter(unit=>unit.key==='archer'&&unit.hp>0&&unit.lane===lane).length<2)deploy(battle,'archer',lane);
      if(level===134)castActive(battle,key,0);
     }
     if(mission.kind==='restoration'&&mission.site<0)historyAction(battle,'site',mission.sites.findIndex(time=>time<8));
     if(mission.kind==='supply')historyAction(battle,'supply');
    }
    stepBattle(battle,.1);
   }
   assert.equal(battle.won,true,JSON.stringify({level,seed,mission:battle.mission}));
   assert.equal(battle.spawned,level===134?12:0);
   if(level===134)assert.equal(battle.mission.ordered,true);
  }
 }
});
