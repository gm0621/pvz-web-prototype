const {test}=require('node:test'),assert=require('node:assert/strict');const engine=import('../../hero/engine.mjs'),history=import('../../hero/history-missions.mjs');
for(const level of [19,20])for(const key of ['liubei','zhangfei'])test(`retreat ${level} does not complete when ${key} falls on the extraction tick`,async()=>{
 const {createBattle,deploy,stepBattle}=await engine,{historyAction}=await history;
 const b=createBattle(level,1);b.nextSpawn=Infinity;b.food=300;
 deploy(b,'liubei',0);deploy(b,'zhangfei',1);b.bossSpawned=true;b.mission.withdrawAt=0;
 b.enemies=[{id:90,name:'徐榮',boss:true,lane:2,x:.7,hp:440,maxHp:440,damage:0,rate:3,speed:0,lastAttack:0}];
 if(level===20)assert.equal(historyAction(b,'decoy',2),true);
 assert.equal(historyAction(b,'retreat'),true);
 const victim=b.allies.find(u=>u.key===key);victim.hp=1;
 b.projectiles=[{targetId:victim.id,lane:victim.lane,aimX:victim.x,impactAt:.1,damage:10}];
 stepBattle(b,.1);
 assert.equal(b.allies.some(u=>u.key===key),false);
 assert.equal(b.won,false);assert.equal(b.over,false);assert.equal(b.mission.done,false);
 // A surviving army can recall the fallen general after the existing recovery period.
 for(let i=0;i<121;i++)stepBattle(b,.1);
 assert.equal(deploy(b,key,victim.lane),true);
 assert.equal(historyAction(b,'retreat'),true);stepBattle(b,.1);
 assert.equal(b.won,true);assert.equal(b.mission.done,true);
});
for(let level=17;level<=22;level++)test(`historical stage ${level} completes using legal deployment and its objective`,async()=>{
 const {createBattle,deploy,stepBattle}=await engine,{historyAction}=await history;
 for(const seed of [1,42,2026]){const b=createBattle(level,seed);for(let i=0;i<5000&&!b.over;i++){
  if(b.introPending)b.introPending=false;
  for(const lane of [1,0,2]){const row=b.allies.filter(u=>u.lane===lane),key={0:'liubei',1:'zhangfei',2:'guanyu'}[lane];deploy(b,!row.some(u=>u.key==='archer')?'archer':!b.allies.some(u=>u.key===key)?key:row.filter(u=>u.key==='archer').length<2?'archer':key,lane)}
  if(level===18)historyAction(b,'supply');if(level===20)historyAction(b,'decoy',2);if([19,20].includes(level))historyAction(b,'retreat');if(level===22&&b.mission.site<0){const site=b.mission.sites.findIndex(n=>n<8);if(site>=0)historyAction(b,'site',site)}stepBattle(b,.1);
 }assert.ok(b.won,JSON.stringify({level,seed,time:b.time,lives:b.lives,mission:b.mission,allies:b.allies.map(a=>[a.key,a.hp,a.lane]),enemies:b.enemies.map(e=>[e.name,e.hp,e.x])}));assert.ok(b.mission.done);if([19,20].includes(level)){assert.ok(b.enemies.some(e=>e.name==='徐榮'&&e.hp>0));assert.equal(b.duelSeen,false)}}
});
test('faction names, stats and skills change without mutating the original trio',async()=>{const {heroesForLevel,HEROES}=await import('../../hero/story.mjs'),{heroSkill}=await import('../../hero/skills.mjs'),{createBattle,deploy}=await engine;assert.equal(heroesForLevel(17).liubei.name,'曹操');assert.equal(heroesForLevel(20).liubei.name,'孫堅');assert.equal(HEROES.liubei.name,'劉備');assert.equal(heroesForLevel(16),HEROES);for(const level of [17,20]){const b=createBattle(level);deploy(b,'liubei',1);assert.equal(b.allies[0].maxHp,heroesForLevel(level).liubei.hp)}assert.equal(heroSkill('liubei','heal',20).name,'虎威奮擊');assert.equal(heroSkill('liubei','heal',1).name,'仁德回春')});
test('withdrawal requires the right living generals, is paused safely and cannot kill Xu Rong',async()=>{const {createBattle,deploy,stepBattle,hurtEnemy}=await engine,{historyAction}=await history,b=createBattle(19);b.nextSpawn=Infinity;b.food=300;deploy(b,'liubei',0);deploy(b,'zhangfei',1);b.bossSpawned=true;b.enemies=[{id:90,name:'徐榮',boss:true,lane:2,x:.7,hp:400,maxHp:440,damage:0,rate:3,speed:0,lastAttack:0}];stepBattle(b,.1);assert.equal(historyAction(b,'retreat'),false);hurtEnemy(b,b.enemies[0],10000);stepBattle(b,.1);assert.ok(b.enemies[0].hp>=154);b.paused=true;const snapshot=JSON.stringify(b);stepBattle(b,.1);assert.equal(historyAction(b,'retreat'),false);assert.equal(JSON.stringify(b),snapshot);b.paused=false;for(let i=0;i<190;i++)stepBattle(b,.1);assert.equal(b.over,false);assert.equal(historyAction(b,'retreat'),true);stepBattle(b,.1);assert.equal(b.won,true);assert.ok(b.enemies[0].hp>0)});
test('twenty-two-stage saves preserve purchases and reward new clears once',async()=>{const {normalizeProgress}=await engine,{rewardVictory}=await import('../../hero/campaign.mjs');const p=normalizeProgress({completed:16,coins:30,inventory:{herb:2},weapons:{guanyu:3}});for(let n=17;n<=22;n++){assert.equal(rewardVictory(p,n),80);assert.equal(rewardVictory(p,n),0)}assert.equal(p.coins,510);assert.equal(p.weapons.guanyu,3);assert.equal(p.inventory.herb,2);assert.equal(normalizeProgress(p).completed,22);assert.equal(rewardVictory(p,41),0)});
test('historical geography changes viewpoint instead of joining Cao and Sun routes',async()=>{const {routeThrough}=await import('../../hero/campaign-map.mjs');assert.deepEqual(routeThrough(19),['luoyang','chenliu','suanzhao','bian']);assert.deepEqual(routeThrough(20),['luyang','liangdong']);assert.deepEqual(routeThrough(22),['luyang','liangdong','yangren','luoyang'])});
