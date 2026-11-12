const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=import('../../hero/engine.mjs'),history=import('../../hero/history-missions.mjs');
for(let level=53;level<=58;level++)test(`chapter ten ${level} wins with legal deployment and objective actions`,async()=>{
 const {createBattle,deploy,stepBattle}=await engine,{historyAction}=await history;
 for(const seed of [1,42,2026]){const b=createBattle(level,seed);for(let i=0;i<5000&&!b.over;i++){
 if(b.introPending)b.introPending=false;
 for(const lane of [1,0,2]){const row=b.allies.filter(u=>u.lane===lane),key={0:'liubei',1:'zhangfei',2:'guanyu'}[lane];deploy(b,!row.some(u=>u.key==='archer')?'archer':!b.allies.some(u=>u.key===key)?key:row.filter(u=>u.key==='archer').length<2?'archer':key,lane)}
 if(level===56)historyAction(b,'supply');if(level===58)historyAction(b,'retreat');stepBattle(b,.1);
 }assert.ok(b.won,JSON.stringify({level,seed,time:b.time,lives:b.lives,mission:b.mission,enemies:b.enemies.map(e=>[e.name,e.hp,e.x])}));assert.ok(b.mission.done);assert.equal(b.duelSeen,false);}
});


test('chapter ten keeps old purchases, identifies new people and preserves the Red Cliffs defeat',async()=>{
 const {normalizeProgress}=await engine,{rewardVictory}=await import('../../hero/campaign.mjs'),{STAGES,chapterInfo,heroesForLevel}=await import('../../hero/story.mjs'),{PEOPLE}=await import('../../hero/people-data.mjs'),{stagePeople}=await import('../../hero/characters.mjs'),{routeThrough}=await import('../../hero/campaign-map.mjs');
 let p=normalizeProgress({completed:52,coins:115,weapons:{liubei:3},inventory:{grain:2}});
 for(let n=53;n<=58;n++){assert.equal(rewardVictory(p,n),80);assert.equal(rewardVictory(p,n),0);p=normalizeProgress(JSON.parse(JSON.stringify(p)));assert.equal(p.completed,n);assert.equal(chapterInfo(n).chapter,10);assert.equal(heroesForLevel(n).liubei.name,'曹操');assert.equal(STAGES[n-1].year,208);assert.ok(STAGES[n-1].references.length);assert.equal(STAGES[n-1].noBoss,true)}
 assert.equal(p.coins,595);assert.equal(p.weapons.liubei,3);assert.equal(p.inventory.grain,2);assert.equal(rewardVictory(p,65),0);assert.equal(normalizeProgress({completed:99}).completed,64);
 for(const [i,name] of ['劉琮','趙雲','諸葛亮','孫權','周瑜','魯肅'].entries()){const person=PEOPLE.find(p=>p.name===name);assert.ok(person.levels.some(n=>n>=53));assert.equal(person.portrait.row,Math.floor(i/3));assert.equal(person.portrait.col,i%3);assert.equal(person.kind,'史實人物')}
 assert.equal(stagePeople(58).opponent.name,'周瑜');assert.equal(STAGES[57].successTitle,'保全撤離');assert.match(STAGES[57].history,/擊敗曹軍/);assert.match(STAGES[57].history,/留下曹仁/);
 assert.deepEqual(routeThrough(58),['yishuiSouth','ye','wan','xiangyang','changban','jiangling','chibi','jiangling']);
});
test('Red Cliffs withdrawal requires living leader, guard, every ally home and respects pause',async()=>{
 const {createBattle,deploy,stepBattle}=await engine,{historyAction}=await history,b=createBattle(58);b.nextSpawn=Infinity;b.bossSpawned=true;b.food=999;deploy(b,'liubei',0);stepBattle(b,.1);assert.equal(historyAction(b,'retreat'),false);b.paused=true;const frozen=JSON.stringify(b);stepBattle(b,20);assert.equal(JSON.stringify(b),frozen);b.paused=false;for(let i=0;i<190;i++)stepBattle(b,.1);assert.equal(historyAction(b,'retreat'),true);for(let i=0;i<200;i++)stepBattle(b,.1);assert.equal(b.won,false);deploy(b,'zhangfei',1);deploy(b,'archer',2);b.allies.find(u=>u.key==='archer').x=.6;historyAction(b,'retreat');stepBattle(b,.1);assert.equal(b.won,false);for(let i=0;i<400&&!b.over;i++)stepBattle(b,.1);assert.equal(b.won,true);
});
