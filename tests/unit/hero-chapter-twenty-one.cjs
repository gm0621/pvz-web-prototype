const {test}=require('node:test');
const assert=require('node:assert/strict');

test('Jiange extends a finished Di Dao save with six historical routes and distinct portraits',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg,MAP_PLACES}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {mentionedPeople}=await import('../../hero/characters.mjs');
 const {expressionPortrait,portraitForDisplay}=await import('../../hero/portrait-expressions.mjs');
 const routes=[['zhongti','duangu'],['luogu','mangshui'],['houhe','tazhong'],['tazhong','yinping'],['yinping','hanshou'],['hanshou','jiange']];
 let progress=normalizeProgress({completed:118,coins:150,weapons:{guanyu:2},inventory:{grain:2},heroGrowth:{caoren:{weapon:2}}});
 assert.equal(rewardVictory(progress,118),0);
 const chapter=STAGES.slice(118,124);
 assert.deepEqual(chapter.map(stage=>stage.year),[256,257,262,263,263,263]);
 assert.deepEqual(chapter.map(stage=>stage.mission),['withdraw','holdout','supply','withdraw','dispatch','holdout']);
 for(const [i,stage] of chapter.entries()){
  const level=119+i;
  assert.deepEqual(chapterInfo(level),{chapter:21,number:i+1,count:6,title:'劍閣守關'});
  assert.deepEqual(routeThrough(level),routes[i]);
  assert.ok(stage.historyCast.includes(stage.leaderName));
  assert.ok(stage.historyCast.includes(stage.quiz.speaker));
  assert.ok(stage.historyCast.every(name=>expressionPortrait(name)));
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  const map=campaignMapSvg(level);
  for(const place of routes[i])assert.ok(map.includes('>'+MAP_PLACES[place].name+'</text>'),place);
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,124);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.inventory.grain,2);
 assert.equal(progress.heroGrowth.caoren.weapon,2);
 assert.equal(rewardVictory(progress,167),0);
 assert.match(chapter[0].victory,/段谷戰敗/);
 assert.match(chapter[2].victory,/侯和失利.*留駐沓中/);
 assert.match(chapter[5].victory,/劍閣擋住了鍾會.*鄧艾走陰平/);
 assert.doesNotMatch(campaignMapSvg(122),/map-opponent/);
 assert.match(campaignMapSvg(124),/map-opponent" data-person="鍾會"/);
 assert.doesNotMatch(campaignMapSvg(124),/data-person="鄧艾"/);
 assert.deepEqual(mentionedPeople('燕人張翼德在此！').map(p=>p.name),['張飛']);
 assert.deepEqual(mentionedPeople('張翼與廖化守關。').map(p=>p.name).sort(),['廖化','張翼']);
 for(const [alias,name,levels] of [
  ['士載','鄧艾',[119,120,121,122,124,125,126,127,128,129,130,131,132,133,134]],['士季','鍾會',[122,123,124,125,130,131,132,133,134]],['元儉','廖化',[122,123,124,129]],['伯恭','張翼',[123,124]]
 ]){
  const [entry]=searchPeople(alias);
  assert.equal(entry.name,name);
  assert.deepEqual(entry.levels,levels);
  assert.equal(portraitForDisplay(entry.portrait).asset,expressionPortrait(name));
 }
});
