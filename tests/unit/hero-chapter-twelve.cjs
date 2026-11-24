const {test}=require('node:test');
const assert=require('node:assert/strict');

test('chapter twelve brings a finished chapter eleven save forward and credits each new clear once',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,journeyRoute}=await import('../../hero/campaign-map.mjs');
 const {stagePeople}=await import('../../hero/characters.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 let progress=normalizeProgress({completed:64,coins:100,inventory:{grain:2},armyWeapons:{cao:{liubei:2}}});
 assert.equal(progress.completed,64);
 assert.equal(rewardVictory(progress,64),0);
 assert.deepEqual(STAGES.slice(64,70).map(s=>s.year),[212,213,214,215,215,215]);
 for(let level=65;level<=70;level++){
  assert.equal(chapterInfo(level).chapter,12);
  assert.equal(chapterInfo(level).number,level-64);
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
  assert.equal(progress.completed,level);
  assert.ok(STAGES[level-1].references.every(r=>r.url.startsWith('https://')));
  assert.ok(journeyRoute(level).viewBox.split(' ').every(n=>Number.isFinite(Number(n))));
 }
 assert.equal(progress.coins,580);
 assert.equal(progress.inventory.grain,2);
 assert.equal(progress.heroGrowth.caocao.weapon,2);
 assert.equal(rewardVictory(progress,77),0);
 assert.deepEqual(routeThrough(69),['sanguan','wudu','yangping']);
 assert.equal(stagePeople(67).leader.name,'夏侯淵');
 assert.equal(stagePeople(69).opponent.name,'張魯');
 assert.notEqual(STAGES[68].bossName,'張魯');
 assert.equal(STAGES[68].duelOutcome,'retreat');
 assert.match(STAGES[69].ending[0][1],/從巴中率部歸降/);
 assert.equal(searchPeople('公祺')[0].name,'張魯');
 assert.deepEqual(searchPeople('公祺')[0].levels,[67,69,70,71,74,76]);
});
