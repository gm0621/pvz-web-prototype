const {test}=require('node:test');
const assert=require('node:assert/strict');

test('the Eastern Palace chapter keeps prior saves and the historical sequence',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg,MAP_PLACES}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {expressionPortrait}=await import('../../hero/portrait-expressions.mjs');
 const chapter=STAGES.slice(148,154);
 const routes=[['luoyangPalace'],['luoyangEastPalace'],['luoyang','jinXuchang'],['luoyangPalace','jinJinyong'],['luoyangStreets','luoyangGate'],['luoyangPalace','jinJinyong']];
 let progress=normalizeProgress({completed:148,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1},sun:{zhangfei:2}},inventory:{grain:2}});
 assert.equal(rewardVictory(progress,148),0);
 assert.equal(chapter.length,6);
 assert.deepEqual(chapter.map(s=>s.year),[291,299,300,300,300,301]);
 assert.deepEqual(chapter.map(s=>s.faction),Array(6).fill('cao'));
 assert.deepEqual(chapter.map(s=>s.mission),['restoration','dispatch','supply','holdout','withdraw','dispatch']);
 for(const [index,stage] of chapter.entries()){
  const level=149+index;
  assert.deepEqual(chapterInfo(level),{chapter:26,number:index+1,count:6,title:'東宮風雲'});
  assert.deepEqual(routeThrough(level),routes[index]);
  assert.ok(stage.historyCast.every(name=>expressionPortrait(name)));
  assert.ok(stage.references.length>=2);
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  for(const key of routes[index])assert.match(campaignMapSvg(level),new RegExp('>'+MAP_PLACES[key].name+'</text>'));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,154);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.armyWeapons.cao.guanyu,1);
 assert.equal(progress.armyWeapons.sun.zhangfei,2);
 assert.equal(progress.inventory.grain,2);
 assert.equal(rewardVictory(progress,173),0);
 assert.match(chapter[1].victory,/司馬遹失去太子身分/);
 assert.match(chapter[2].victory,/司馬遹在許昌遇害/);
 assert.match(chapter[3].victory,/賈南風被廢.*張華與裴頠遇害/);
 assert.match(chapter[4].victory,/淮南王司馬允敗亡/);
 assert.match(chapter[5].victory,/趙王司馬倫篡位.*惠帝司馬衷被幽禁於金墉城/);
 assert.match(campaignMapSvg(154),/route-inset-opponent-role[^>]*>篡取皇位<\/text>/);
 const portraits=new Set();
 for(const [alias,name,levels] of [
  ['茂先','張華',[149,150,152]],['裴頠','裴頠',[150,152]],['熙祖','司馬遹',[150,151,152]],
  ['趙王','司馬倫',[151,152,153,154,155,156,157,158,159,160]],['孫秀','孫秀',[152,153,154,157,159]],['淮南王','司馬允',[153]]
 ]){
  const [entry]=searchPeople(alias);
  assert.equal(entry.name,name);
  assert.deepEqual(entry.levels,levels);
  portraits.add(expressionPortrait(name));
 }
 assert.equal(portraits.size,6);
});

test('Eastern Palace missions finish normally with combat confined to Luoyang holdout and withdrawal',async()=>{
 const {normalizeProgress,createBattle,deploy,stepBattle,castActive}=await import('../../hero/engine.mjs');
 const {SLOTS,configureRoster}=await import('../../hero/roster.mjs');
 const {historyAction}=await import('../../hero/history-missions.mjs');
 const {heroesForLevel}=await import('../../hero/story.mjs');
 for(const level of [149,150,151,152,153,154]){
  const combat=level===152||level===153;
  for(const seed of combat?[1,42,2026]:[42]){
   const battle=createBattle(level,seed),progress=normalizeProgress({completed:148}),archer=heroesForLevel(level).archer;
   configureRoster(battle,progress,archer);
   for(let step=0;step<3000&&!battle.over;step++){
    if(step%10===0){
     if(level===153)historyAction(battle,'retreat');
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
   if(level===153)assert.equal(battle.mission.ordered,true);
  }
 }
});
