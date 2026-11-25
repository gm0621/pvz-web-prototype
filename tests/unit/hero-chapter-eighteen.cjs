const {test}=require('node:test');
const assert=require('node:assert/strict');

test('the Wuzhang chapter extends chapter seventeen saves and keeps its missions distinct from historical outcomes',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg}=await import('../../hero/campaign-map.mjs');
 const {STORY_PEOPLE}=await import('../../hero/characters.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {campConversation}=await import('../../hero/camp-talk.mjs');
 const routes=[['jiangzhou','nanzheng'],['mianyang','qishan'],['qishan','mumen'],['mianyang','xiegu','wuzhang'],['wuzhang','weiFields'],['wuzhang','xiegu','mianyang']];
 let progress=normalizeProgress({completed:100,coins:150,weapons:{guanyu:2},inventory:{grain:2},heroGrowth:{caoren:{weapon:2}}});
 assert.equal(rewardVictory(progress,100),0);
 assert.deepEqual(STAGES.slice(100,106).map(s=>s.year),[230,231,231,234,234,234]);
 assert.deepEqual(STAGES.slice(100,106).map(s=>s.mission),['holdout','supply','withdraw','dispatch','restoration','withdraw']);
 for(let level=101;level<=106;level++){
  const stage=STAGES[level-1];
  assert.deepEqual(chapterInfo(level),{chapter:18,number:level-100,count:6,title:'五丈原秋風'});
  assert.deepEqual(routeThrough(level),routes[level-101]);
  assert.ok(stage.historyCast.includes(stage.leaderName));
  assert.ok(stage.historyCast.includes(stage.opponentName));
  assert.ok(stage.historyCast.includes(stage.quiz.speaker));
  assert.ok(stage.historyCast.every(name=>STORY_PEOPLE.some(person=>person.name===name)));
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  assert.match(campaignMapSvg(level),new RegExp('map-leader" data-person="'+stage.leaderName+'"'));
  for(const won of [true,false])assert.ok(campConversation(level,'guanyu',won).every(line=>line.startsWith(stage.quiz.speaker+'：')));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,106);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.inventory.grain,2);
 assert.equal(progress.heroGrowth.caoren.weapon,2);
 assert.equal(rewardVictory(progress,119),0);
 assert.match(STAGES[101].victory,/糧運仍接不上/);
 assert.match(STAGES[102].victory,/張郃在木門中箭身亡/);
 assert.match(STAGES[105].victory,/楊儀.*撤回漢中.*諸葛亮病逝於五丈原/);
 assert.doesNotMatch(campaignMapSvg(106),/data-person="司馬懿"/);
 for(const [query,levels] of [['仲達',[102,104,105,106]],['威公',[106,107]],['儁乂',[71,74,75,97,103]]]){
  assert.deepEqual(searchPeople(query)[0].levels,levels,query);
 }
});
