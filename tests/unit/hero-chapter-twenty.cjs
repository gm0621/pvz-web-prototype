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
 const chapter=STAGES.slice(112);
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
 assert.equal(rewardVictory(progress,119),0);
 assert.match(chapter[3].victory,/費禕在漢壽遇害/);
 assert.match(chapter[4].victory,/南安仍在魏國手中/);
 assert.match(chapter[5].victory,/狄道仍由魏軍守住/);
 assert.match(campaignMapSvg(114),/map-opponent" data-person="郭淮"/);
 assert.doesNotMatch(campaignMapSvg(118),/map-opponent/);
 assert.match(campaignMapSvg(118),/>狄道<\/text>/);
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
 assert.equal(new Set(PEOPLE.map(p=>expressionPortrait(p.name))).size,107);
});
