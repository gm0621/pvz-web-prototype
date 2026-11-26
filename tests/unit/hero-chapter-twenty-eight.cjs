const {test}=require('node:test');
const assert=require('node:assert/strict');

test('the optional Luoyang campaign extends stage 160 saves and preserves the historical sequence',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg,MAP_PLACES}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {expressionPortrait}=await import('../../hero/portrait-expressions.mjs');
 const chapter=STAGES.slice(160,166);
 const routes=[
  ['jinQiCourt'],['jinChangan','luoyang'],['luoyangStreets','luoyangPalace'],
  ['luoyangPalace'],['ye','luoyang'],['luoyangPalace','jinJinyong']
 ];
 let progress=normalizeProgress({completed:160,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1},sun:{zhangfei:2}},inventory:{grain:2}});
 assert.equal(rewardVictory(progress,160),0);
 assert.equal(chapter.length,6);
 assert.deepEqual(chapter.map(stage=>stage.year),[302,302,302,303,303,304]);
 assert.deepEqual(chapter.map(stage=>stage.mission),['dispatch','dispatch','holdout','restoration','holdout','withdraw']);
 for(const [index,stage] of chapter.entries()){
  const level=161+index;
  assert.deepEqual(chapterInfo(level),{chapter:28,number:index+1,count:6,title:'洛陽風雲'});
  assert.deepEqual(routeThrough(level),routes[index]);
  assert.ok(stage.historyCast.every(name=>expressionPortrait(name)));
  assert.ok(stage.references.length>=2);
  for(const key of routes[index])assert.match(campaignMapSvg(level),new RegExp('>'+MAP_PLACES[key].name+'</text>'));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,166);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.armyWeapons.cao.guanyu,1);
 assert.equal(progress.armyWeapons.sun.zhangfei,2);
 assert.equal(progress.inventory.grain,2);
 assert.equal(rewardVictory(progress,173),0);
 assert.match(chapter[2].victory,/司馬冏戰敗遇害/);
 assert.match(chapter[3].victory,/司馬乂仍在洛陽輔政/);
 assert.match(chapter[4].victory,/圍城卻仍未解除/);
 assert.match(chapter[5].victory,/長沙王司馬乂被關在金墉城.*張方部下帶走並遇害/);
 assert.match(campaignMapSvg(162),/map-messenger/);
 assert.match(campaignMapSvg(165),/route-inset-secondary[\s\S]*>長安<\/text>[\s\S]*>洛陽<\/text>/);
 const portraits=new Set();
 for(const [alias,name,levels] of [
  ['士度','司馬乂',[162,163,164,165,166,167]],['子回','鄭方',[161]],['李含','李含',[162,164]],
  ['士衡','陸機',[165]],['張方','張方',[165,166,171,172]],['元超','司馬越',[166,168,169,170]],['董艾','董艾',[162,163]]
 ]){
  const entry=searchPeople(alias).find(person=>person.name===name);
  assert.ok(entry,name);
  assert.deepEqual(entry.levels,levels);
  portraits.add(expressionPortrait(name));
 }
 assert.equal(portraits.size,7);
});

test('the Luoyang campaign can finish all six objectives with normal waves and original resources',async()=>{
 const {normalizeProgress,createBattle,deploy,stepBattle,castActive}=await import('../../hero/engine.mjs');
 const {SLOTS,configureRoster}=await import('../../hero/roster.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {STAGES,heroesForLevel}=await import('../../hero/story.mjs');
 for(let level=161;level<=166;level++){
  const {enemyCount}=STAGES[level-1];
  for(const seed of enemyCount?[1,42,2026]:[42]){
   const battle=createBattle(level,seed);
   configureRoster(battle,normalizeProgress({completed:160}),heroesForLevel(level).archer);
   for(let step=0;step<3000&&!battle.over;step++){
    if(step%10===0){
     const mission=battle.mission;
     if(mission.kind==='withdraw')historyAction(battle,'retreat');
     if(!mission.ordered)for(const [lane,key] of SLOTS.slice(0,3).entries()){
      if(!battle.allies.some(unit=>unit.key===key&&unit.hp>0))deploy(battle,key,lane);
      else if(enemyCount&&battle.allies.filter(unit=>unit.key==='archer'&&unit.hp>0&&unit.lane===lane).length<2)deploy(battle,'archer',lane);
      if(enemyCount)castActive(battle,key,0);
     }
     if(mission.kind==='restoration'&&mission.site<0)historyAction(battle,'site',mission.sites.findIndex(time=>time<8));
    }
    stepBattle(battle,.1);
   }
   assert.equal(battle.won,true,JSON.stringify({level,seed,mission:battle.mission}));
   assert.equal(battle.spawned,enemyCount);
   if(level===166)assert.equal(battle.mission.ordered,true);
  }
 }
});
