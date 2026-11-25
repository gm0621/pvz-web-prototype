const {test}=require('node:test');
const assert=require('node:assert/strict');

test('the Taikang chapter extends the previous save through the early palace crises',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg,MAP_PLACES}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {expressionPortrait}=await import('../../hero/portrait-expressions.mjs');
 const chapter=STAGES.slice(142,148);
 const routes=[['shitou','luoyang'],['luoyang'],['luoyangPalace'],['luoyangPalace','luoyangStreets'],['jinXuchang','luoyang'],['luoyangStreets','luoyangGate']];
 let progress=normalizeProgress({completed:142,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1},sun:{zhangfei:2}},inventory:{grain:2}});
 assert.equal(rewardVictory(progress,142),0);
 assert.equal(chapter.length,6);
 assert.deepEqual(chapter.map(s=>s.year),[280,280,290,291,291,291]);
 assert.deepEqual(chapter.map(s=>s.faction),['sun','cao','cao','cao','cao','cao']);
 assert.deepEqual(chapter.map(s=>s.mission),['supply','restoration','dispatch','holdout','restoration','withdraw']);
 for(const [index,stage] of chapter.entries()){
  const level=143+index;
  assert.deepEqual(chapterInfo(level),{chapter:25,number:index+1,count:6,title:'太康之後'});
  assert.deepEqual(routeThrough(level),routes[index]);
  assert.ok(stage.historyCast.every(name=>expressionPortrait(name)));
  assert.ok(stage.references.length>=2);
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  for(const key of routes[index])assert.match(campaignMapSvg(level),new RegExp('>'+MAP_PLACES[key].name+'</text>'));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,148);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.armyWeapons.cao.guanyu,1);
 assert.equal(progress.armyWeapons.sun.zhangfei,2);
 assert.equal(progress.inventory.grain,2);
 assert.equal(rewardVictory(progress,167),0);
 assert.match(chapter[0].victory,/受封歸命侯/);
 assert.match(chapter[2].victory,/司馬衷即位/);
 assert.match(chapter[3].victory,/楊駿被殺/);
 assert.match(chapter[5].victory,/司馬亮與衛瓘遇害.*司馬瑋隨後也被處死/);
 assert.match(campaignMapSvg(145),/route-inset-opponent-role[^>]*>輔政<\/text>/);
 const portraits=new Set();
 for(const [alias,name,levels] of [
  ['晉惠帝','司馬衷',[145,147,148,149,151,153,154,159,160,163,164,166]],['楊駿','楊駿',[145,146,147]],
  ['賈皇后','賈南風',[145,146,148,149,150,151,152]],['汝南王','司馬亮',[146,147,148]],['彥度','司馬瑋',[146,147,148,149]]
 ]){
  const [entry]=searchPeople(alias);
  assert.equal(entry.name,name);
  assert.deepEqual(entry.levels,levels);
  portraits.add(expressionPortrait(name));
 }
 assert.equal(portraits.size,5);
});

test('Taikang objectives finish normally with combat confined to the two palace crises',async()=>{
 const {normalizeProgress,createBattle,deploy,stepBattle,castActive}=await import('../../hero/engine.mjs');
 const {SLOTS,configureRoster,configureSunRoster}=await import('../../hero/roster.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {heroesForLevel}=await import('../../hero/story.mjs');
 for(const level of [143,144,145,146,147,148]){
  const combat=level===146||level===148;
  for(const seed of combat?[1,42,2026]:[42]){
   const battle=createBattle(level,seed),progress=normalizeProgress({completed:142}),archer=heroesForLevel(level).archer;
   if(level===143)configureSunRoster(battle,progress,archer);
   else configureRoster(battle,progress,archer);
   for(let step=0;step<3000&&!battle.over;step++){
    if(step%10===0){
     if(level===148)historyAction(battle,'retreat');
     if(!battle.mission.ordered)for(const [lane,key] of SLOTS.slice(0,3).entries()){
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
   if(level===148)assert.equal(battle.mission.ordered,true);
  }
 }
});
