const {test}=require('node:test');
const assert=require('node:assert/strict');

test('the new chapter extends white emperor saves with six documented routes, coda and first clear rewards',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {STORY_PEOPLE}=await import('../../hero/characters.mjs');
 const {campConversation}=await import('../../hero/camp-talk.mjs');
 const routes=[['chengdu','yongan'],['chengdu'],['chengdu','wuchang'],['chengdu'],['chengdu','yuesui'],['yuesui','dianchi']];
 let progress=normalizeProgress({completed:88,coins:100,weapons:{guanyu:2},inventory:{grain:2},heroGrowth:{caocao:{weapon:1}}});
 assert.equal(rewardVictory(progress,88),0);
 assert.deepEqual(STAGES.slice(88,94).map(stage=>stage.year),[223,223,223,224,225,225]);
 for(let level=89;level<=94;level++){
  const stage=STAGES[level-1];
  assert.deepEqual(chapterInfo(level),{chapter:16,number:level-88,count:6,title:'託孤與南征'});
  assert.equal(stage.factionLabel,'蜀漢軍');
  assert.ok(stage.historyCast.every(name=>STORY_PEOPLE.some(person=>person.name===name)));
  assert.ok(stage.historyCast.includes(stage.quiz.speaker));
  assert.deepEqual(routeThrough(level),routes[level-89]);
  assert.match(campaignMapSvg(level),new RegExp('data-person="'+stage.leaderName+'"'));
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  for(const won of [true,false]){
   const prompt=(won?stage.campTalkPrompts:stage.campRetryPrompts).guanyu;
   assert.ok(campConversation(level,'guanyu',won).every(line=>line.startsWith(prompt.speaker+'：')));
  }
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,94);
 assert.equal(progress.coins,580);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.inventory.grain,2);
 assert.equal(progress.heroGrowth.caocao.weapon,1);
 assert.match(STAGES[88].victory,/劉備在永安去世/);
 assert.match(STAGES[89].history,/劉禪在成都即位.*建興/);
 assert.match(STAGES[93].history,/裴松之注引《漢晉春秋》.*七擒孟獲/);
 assert.match(STAGES[93].victory,/十二月.*回到成都/);
 assert.match(campaignMapSvg(91),/map-host" data-person="孫權"/);
 assert.doesNotMatch(campaignMapSvg(91),/map-opponent/);
 assert.doesNotMatch(campaignMapSvg(94),/data-person="孟獲"/);
 for(const [query,levels] of [['阿斗',[89,90,91,92,95]],['正方',[89]],['伯苗',[91,98]],['高定',[93]],['德昂',[93,94]],['孟獲',[94]]]){
  assert.deepEqual(searchPeople(query)[0].levels,levels,query);
 }
});

test('field restoration shows the selected rural site and freezes when paused',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction,historyMissionText}=await import('../../hero/history-missions.mjs');
 const battle=createBattle(92);
 battle.bossSpawned=true;
 assert.ok(historyAction(battle,'site',1));
 assert.match(historyMissionText(battle),/農務整備.*水渠.*等候友軍接應/);
 assert.ok(deploy(battle,'liubei',1));
 battle.paused=true;
 for(let i=0;i<20;i++)stepBattle(battle,.1);
 assert.equal(battle.mission.sites[1],0);
 assert.match(historyMissionText(battle),/水渠.*已暫停 0%/);
 battle.paused=false;
 for(let i=0;i<82;i++)stepBattle(battle,.1);
 assert.equal(battle.mission.sites[1],8);
 assert.equal(battle.mission.message,'水渠已整備完成。');
 assert.equal(battle.won,false);
});
