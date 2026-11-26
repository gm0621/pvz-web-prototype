const {test}=require('node:test');
const assert=require('node:assert/strict');

test('the princes campaign extends stage 154 saves and preserves the historical sequence',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg,MAP_PLACES}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {expressionPortrait}=await import('../../hero/portrait-expressions.mjs');
 const chapter=STAGES.slice(154,160);
 const routes=[
  ['jinXuchang','ye'],['jinXuchang','jinYingyin'],['ye','jinHuangqiao'],
  ['jinHuangqiao','jinJushui'],['jinJinyong','luoyangPalace'],['jinXuchang','luoyang']
 ];
 let progress=normalizeProgress({completed:154,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1},sun:{zhangfei:2}},inventory:{grain:2}});
 assert.equal(rewardVictory(progress,154),0);
 assert.equal(chapter.length,6);
 assert.deepEqual(chapter.map(stage=>stage.year),Array(6).fill(301));
 assert.deepEqual(chapter.map(stage=>stage.mission),['dispatch','holdout','withdraw','holdout','dispatch','restoration']);
 for(const [index,stage] of chapter.entries()){
  const level=155+index;
  assert.deepEqual(chapterInfo(level),{chapter:27,number:index+1,count:6,title:'諸王討趙'});
  assert.deepEqual(routeThrough(level),routes[index]);
  assert.ok(stage.historyCast.every(name=>expressionPortrait(name)));
  assert.ok(stage.references.length>=2);
  for(const key of routes[index])assert.match(campaignMapSvg(level),new RegExp('>'+MAP_PLACES[key].name+'</text>'));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,160);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.armyWeapons.cao.guanyu,1);
 assert.equal(progress.armyWeapons.sun.zhangfei,2);
 assert.equal(progress.inventory.grain,2);
 assert.equal(rewardVictory(progress,173),0);
 assert.match(chapter[2].victory,/前鋒吃了敗仗/);
 assert.match(chapter[3].victory,/湨水得勝並渡河/);
 assert.match(chapter[4].victory,/復位.*司馬倫被賜死/);
 assert.match(chapter[5].victory,/司馬冏以大司馬身分掌管朝政.*司馬穎回到鄴城/);
 assert.match(campaignMapSvg(159),/route-inset-side[^>]*>回宮復位<\/text>/);
 const portraits=new Set();
 for(const [alias,name,levels] of [
  ['景治','司馬冏',[155,156,160,161,162,163]],['成都王','司馬穎',[155,157,158,160,164,165,167,168,169,170,171,172]],['子道','盧志',[155,157,158,160]],
  ['左衛將軍','王輿',[159]],['征虜將軍','張泓',[156]],['孫秀之子','孫會',[157,158]],['河間王','司馬顒',[155,162,164,165,172]]
 ]){
  const entry=searchPeople(alias).find(person=>person.name===name);
  assert.ok(entry,name);
  assert.deepEqual(entry.levels,levels);
  portraits.add(expressionPortrait(name));
 }
 assert.equal(portraits.size,7);
});

test('the princes campaign can finish all six objectives with normal waves and original resources',async()=>{
 const {normalizeProgress,createBattle,deploy,stepBattle,castActive}=await import('../../hero/engine.mjs');
 const {SLOTS,configureRoster}=await import('../../hero/roster.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {STAGES,heroesForLevel}=await import('../../hero/story.mjs');
 for(let level=155;level<=160;level++){
  const {enemyCount}=STAGES[level-1];
  for(const seed of enemyCount?[1,42,2026]:[42]){
   const battle=createBattle(level,seed);
   configureRoster(battle,normalizeProgress({completed:154}),heroesForLevel(level).archer);
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
   if(level===157)assert.equal(battle.mission.ordered,true);
  }
 }
});
