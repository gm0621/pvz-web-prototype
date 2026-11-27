const {test}=require('node:test');
const assert=require('node:assert/strict');

test('Xingshi extends the Wuzhang campaign save with six distinct narrated stages',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg}=await import('../../hero/campaign-map.mjs');
 const {STORY_PEOPLE}=await import('../../hero/characters.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const routes=[['xiegu','southValley'],['chengdu'],['chengdu','mianyang'],['mianyang','fu'],['nanzheng','xingshi'],['chengdu','xingshi']];
 let progress=normalizeProgress({completed:106,coins:150,weapons:{guanyu:2},inventory:{grain:2},heroGrowth:{caoren:{weapon:2}}});
 assert.equal(rewardVictory(progress,106),0);
 assert.deepEqual(STAGES.slice(106,112).map(stage=>stage.year),[234,234,238,243,244,244]);
 assert.deepEqual(STAGES.slice(106,112).map(stage=>stage.mission),['dispatch','restoration','pass-defense','supply','pass-defense','dispatch']);
 assert.deepEqual(STAGES[109].supplyStops,['山路口','接應站','涪縣營地']);
 for(let level=107;level<=112;level++){
  const stage=STAGES[level-1];
  assert.deepEqual(chapterInfo(level),{chapter:19,number:level-106,count:6,title:'興勢守漢中'});
  assert.deepEqual(routeThrough(level),routes[level-107]);
  assert.ok(stage.historyCast.includes(stage.leaderName));
  assert.ok(stage.historyCast.includes(stage.quiz.speaker));
  assert.ok(stage.historyCast.every(name=>STORY_PEOPLE.some(person=>person.name===name)));
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  assert.match(campaignMapSvg(level),new RegExp('map-leader" data-person="'+stage.leaderName+'"'));
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,112);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.inventory.grain,2);
 assert.equal(progress.heroGrowth.caoren.weapon,2);
 assert.equal(rewardVictory(progress,173),0);
 assert.match(STAGES[106].victory,/蜀軍內部的爭端/);
 assert.match(STAGES[111].victory,/曹爽率魏軍退去，漢中守住了/);
 assert.doesNotMatch(campaignMapSvg(112),/data-person="曹爽"/);
 for(const [query,levels] of [['文長',[107]],['公琰',[108,109,110,113]],['文偉',[110,111,112,113,116,117]],['昭伯',[111,112,115]]]){
  assert.deepEqual(searchPeople(query)[0].levels,levels,query);
 }
});
