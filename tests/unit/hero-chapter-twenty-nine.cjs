const {test}=require('node:test');
const assert=require('node:assert/strict');

test('the Changan side story preserves the main ending and extends a stage 166 save',async()=>{
 const {MAIN_STORY_END,LUOYANG_END,CAMPAIGN_LENGTH}=await import('../../hero/campaign-config.mjs');
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {campaignMapSvg,routeThrough,MAP_PLACES}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {expressionPortrait}=await import('../../hero/portrait-expressions.mjs');
 assert.equal(MAIN_STORY_END,142);
 assert.equal(LUOYANG_END,166);
 assert.equal(CAMPAIGN_LENGTH,172);
 const chapter=STAGES.slice(LUOYANG_END);
 const routes=[
  ['luoyangPalace'],['ye','luoyangPalace'],['luoyangPalace','jinRiverBridge'],
  ['jinRiverBridge','jinTangyin'],['ye','luoyang'],['luoyang','jinChangan']
 ];
 assert.deepEqual(chapter.map(stage=>stage.mission),['restoration','dispatch','supply','withdraw','dispatch','supply']);
 let progress=normalizeProgress({completed:166,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1}},inventory:{grain:2}});
 assert.equal(rewardVictory(progress,166),0);
 assert.equal(rewardVictory(progress,173),0);
 for(const [index,stage] of chapter.entries()){
  const level=167+index;
  assert.deepEqual(chapterInfo(level),{chapter:29,number:index+1,count:6,title:'長安西行'});
  assert.equal(stage.year,304);
  assert.ok(stage.references.length>=2);
  assert.ok(stage.historyCast.every(name=>expressionPortrait(name)),stage.name);
  assert.deepEqual(routeThrough(level),routes[index]);
  for(const key of routes[index])assert.ok(campaignMapSvg(level).includes('>'+MAP_PLACES[key].name+'</text>'));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,172);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.armyWeapons.cao.guanyu,1);
 assert.equal(progress.inventory.grain,2);
 assert.match(campaignMapSvg(168),/map-messenger/);
 assert.match(chapter[3].victory,/嵇紹護駕遇害，惠帝後來被帶往鄴城/);
 assert.match(chapter[5].victory,/張方把晉惠帝和司馬穎從洛陽帶往長安/);
 const actual=searchPeople('王浚').filter(p=>['王浚','王濬'].includes(p.name)).map(p=>[p.name,p.levels]);
 assert.deepEqual(actual,[['王浚',[171]],['王濬',[140,141,142]]]);
 assert.notEqual(expressionPortrait('王浚'),expressionPortrait('王濬'));
});
