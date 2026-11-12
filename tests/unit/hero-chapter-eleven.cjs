const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=import('../../hero/engine.mjs'),history=import('../../hero/history-missions.mjs');
for(let level=59;level<=64;level++)test(`chapter eleven ${level} wins with legal deployment and objective actions`,async()=>{
 const {createBattle,deploy,stepBattle}=await engine,{historyAction}=await history;
 for(const seed of [1,42,2026]){const b=createBattle(level,seed);for(let i=0;i<5000&&!b.over;i++){
 if(b.introPending)b.introPending=false;
 for(const lane of [1,0,2]){const row=b.allies.filter(u=>u.lane===lane),key={0:'liubei',1:'zhangfei',2:'guanyu'}[lane];deploy(b,!row.some(u=>u.key==='archer')?'archer':!b.allies.some(u=>u.key===key)?key:row.filter(u=>u.key==='archer').length<2?'archer':key,lane)}
 if([59,63].includes(level))historyAction(b,'supply');if(level===60)historyAction(b,'retreat');stepBattle(b,.1);
 }assert.ok(b.won,JSON.stringify({level,seed,time:b.time,lives:b.lives,mission:b.mission,enemies:b.enemies.map(e=>[e.name,e.hp,e.x])}));assert.ok(b.mission.done);assert.equal(b.duelSeen,false);}
});



test('chapter eleven history, identities and old save progression agree',async()=>{
 const {STAGES,chapterInfo,heroesForLevel}=await import('../../hero/story.mjs'),{PEOPLE}=await import('../../hero/people-data.mjs'),{normalizeProgress}=await engine,{rewardVictory}=await import('../../hero/campaign.mjs'),{routeThrough,journeyRoute}=await import('../../hero/campaign-map.mjs');
 let p=normalizeProgress({completed:58,coins:115,weapons:{liubei:3},inventory:{grain:2}});
 for(let n=59;n<=64;n++){assert.equal(chapterInfo(n).chapter,11);assert.equal(heroesForLevel(n).liubei.name,'曹操');assert.equal(rewardVictory(p,n),80);assert.equal(rewardVictory(p,n),0);p=normalizeProgress(JSON.parse(JSON.stringify(p)));assert.equal(p.completed,n);assert.ok(STAGES[n-1].references.length);const j=journeyRoute(n),[x,y,w,h]=j.viewBox.split(' ').map(Number);for(const a of [j.start,j.end,{x:j.to.x+36,y:j.to.y-44}]){assert.ok(a.x-29>=x&&a.x+29<=x+w);assert.ok(a.y-29>=y&&a.y+49<=y+h)}}
 assert.equal(p.coins,595);assert.equal(p.weapons.liubei,3);assert.equal(p.inventory.grain,2);assert.equal(rewardVictory(p,65),0);assert.equal(normalizeProgress({completed:99}).completed,64);
 assert.deepEqual(STAGES.slice(58).map(s=>s.year),[209,209,210,211,211,211]);assert.equal(STAGES[59].successTitle,'保全撤離');assert.match(STAGES[59].history,/曹仁最後撤離/);assert.match(STAGES[63].history,/沒有在這裡被俘或戰死/);
 assert.deepEqual(routeThrough(60),['jiangling']);assert.deepEqual(routeThrough(64),['ye','tongguan','puban','weinan']);
 for(const [i,name] of ['馬超','韓遂','許褚','徐晃','曹丕'].entries()){const p=PEOPLE.find(p=>p.name===name);assert.equal(p.kind,'史實人物');assert.ok(p.levels.some(n=>n>=59));assert.equal(p.portrait.row,Math.floor(i/3));assert.equal(p.portrait.col,i%3)}
});
