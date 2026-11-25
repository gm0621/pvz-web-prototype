const {test}=require('node:test');
const assert=require('node:assert/strict');

test('the Jin-Wu chapter extends the previous save and preserves both battles at Xiling',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg,MAP_PLACES}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {expressionPortrait}=await import('../../hero/portrait-expressions.mjs');
 const chapter=STAGES.slice(136,142);
 const routes=[['luoyang','xiangyang'],['lexiangWu','xiling'],['xiangyang'],['jinYizhou'],['jinYongan','xiling'],['wuWuchang','shitou']];
 let progress=normalizeProgress({completed:136,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1},sun:{zhangfei:2}},inventory:{grain:2}});
 assert.equal(rewardVictory(progress,136),0);
 assert.equal(chapter.length,6);
 assert.deepEqual(chapter.map(s=>s.year),[269,272,278,279,280,280]);
 assert.deepEqual(chapter.map(s=>s.faction),['cao','sun','cao','cao','cao','cao']);
 assert.deepEqual(chapter.map(s=>s.mission),['restoration','holdout','dispatch','supply','dispatch','restoration']);
 for(const [index,stage] of chapter.entries()){
  const level=137+index;
  assert.deepEqual(chapterInfo(level),{chapter:24,number:index+1,count:6,title:'西晉一統'});
  assert.deepEqual(routeThrough(level),routes[index]);
  assert.ok(stage.historyCast.every(name=>expressionPortrait(name)));
  assert.ok(stage.references.length>=2);
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  for(const key of routes[index])assert.match(campaignMapSvg(level),new RegExp('>'+MAP_PLACES[key].name+'</text>'));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,142);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.armyWeapons.cao.guanyu,1);
 assert.equal(progress.armyWeapons.sun.zhangfei,2);
 assert.equal(progress.inventory.grain,2);
 assert.equal(rewardVictory(progress,161),0);
 assert.match(chapter[1].victory,/陸抗拿回西陵，晉軍撤退/);
 assert.match(chapter[4].victory,/西陵落入晉軍手中/);
 assert.match(chapter[5].victory,/孫皓在石頭城向王濬投降/);
 assert.match(campaignMapSvg(142),/route-inset-opponent-role[^>]*>請降<\/text>/);
 const portraits=new Set();
 for(const [alias,name,levels] of [
  ['叔子','羊祜',[137,138,139]],['幼節','陸抗',[137,138,139]],['步闡','步闡',[138]],
  ['元凱','杜預',[139,141]],['王浚','王濬',[140,141,142]],['吳末帝','孫皓',[142,143]]
 ]){
  const [entry]=searchPeople(alias);
  assert.equal(entry.name,name);
  assert.deepEqual(entry.levels,levels);
  portraits.add(expressionPortrait(name));
 }
 assert.equal(portraits.size,6);
});

test('Jin-Wu objectives finish normally with combat confined to the two Xiling stages',async()=>{
 const {normalizeProgress,createBattle,deploy,stepBattle,castActive}=await import('../../hero/engine.mjs');
 const {SLOTS,configureRoster,configureSunRoster}=await import('../../hero/roster.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {heroesForLevel}=await import('../../hero/story.mjs');
 for(const level of [137,138,139,140,141,142]){
  const combat=level===138||level===141;
  for(const seed of combat?[1,42,2026]:[42]){
   const battle=createBattle(level,seed),progress=normalizeProgress({completed:136}),archer=heroesForLevel(level).archer;
   if(level===138)configureSunRoster(battle,progress,archer);
   else configureRoster(battle,progress,archer);
   for(let step=0;step<3000&&!battle.over;step++){
    if(step%10===0){
     for(const [lane,key] of SLOTS.slice(0,3).entries()){
      if(!battle.allies.some(unit=>unit.key===key&&unit.hp>0))deploy(battle,key,lane);
      else if(combat&&battle.allies.filter(unit=>unit.key==='archer'&&unit.hp>0&&unit.lane===lane).length<2)deploy(battle,'archer',lane);
      if(combat)castActive(battle,key,0);
     }
     const mission=battle.mission;
     if(mission.kind==='restoration'&&mission.site<0)historyAction(battle,'site',mission.sites.findIndex(time=>time<8));
     if(mission.kind==='supply')historyAction(battle,'supply');
    }
    stepBattle(battle,.1);
   }
   assert.equal(battle.won,true,JSON.stringify({level,seed,mission:battle.mission}));
   assert.equal(battle.spawned,combat?12:0);
  }
 }
});
