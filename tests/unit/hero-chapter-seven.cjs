const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=import('../../hero/engine.mjs'),history=import('../../hero/history-missions.mjs');
for(let level=35;level<=40;level++)test(`chapter seven ${level} wins with legal deployment and objective actions`,async()=>{
 const {createBattle,deploy,stepBattle}=await engine,{historyAction}=await history;
 for(const seed of [1,42,2026]){const b=createBattle(level,seed);for(let i=0;i<5000&&!b.over;i++){
 if(b.introPending)b.introPending=false;
 for(const lane of [1,0,2]){const row=b.allies.filter(u=>u.lane===lane),key={0:'liubei',1:'zhangfei',2:'guanyu'}[lane];deploy(b,!row.some(u=>u.key==='archer')?'archer':!b.allies.some(u=>u.key===key)?key:row.filter(u=>u.key==='archer').length<2?'archer':key,lane)}
 if([35,38].includes(level))historyAction(b,'supply');stepBattle(b,.1);
 }assert.ok(b.won,JSON.stringify({level,seed,time:b.time,lives:b.lives,mission:b.mission,enemies:b.enemies.map(e=>[e.name,e.hp,e.x])}));assert.ok(b.mission.done);assert.equal(b.duelSeen,false);}
});
test('chapter seven old save and geography preserve progress',async()=>{const {normalizeProgress}=await engine,{rewardVictory}=await import('../../hero/campaign.mjs'),{STAGES,chapterInfo}=await import('../../hero/story.mjs'),{routeThrough}=await import('../../hero/campaign-map.mjs');let p=normalizeProgress({completed:34,coins:115,weapons:{liubei:3},inventory:{grain:2}});for(let n=35;n<=40;n++){assert.equal(rewardVictory(p,n),80);assert.equal(rewardVictory(p,n),0);p=normalizeProgress(JSON.parse(JSON.stringify(p)))}assert.equal(p.completed,40);assert.equal(p.coins,595);assert.equal(p.weapons.liubei,3);assert.equal(p.inventory.grain,2);assert.equal(rewardVictory(p,65),0);assert.equal(chapterInfo(40).title,'官渡風雲');assert.deepEqual(routeThrough(40),['xiapi','xuxian','guandu','baima','yanjin','guandu','wuchao']);assert.equal(STAGES[39].bossName,'淳于瓊');assert.match(STAGES[39].history,/袁紹逃回河北/);assert.match(STAGES[36].history,/關羽斬顏良/);});

test('Xiahou Yuan grain service follows the Yuan defeat',async()=>{const {STAGES}=await import('../../hero/story.mjs');assert.match(STAGES[38].opening[1][1],/袁紹戰敗之後/);assert.match(STAGES[39].ending[2][1],/袁紹戰敗後，夏侯淵督運/);});
