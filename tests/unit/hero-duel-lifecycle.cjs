const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=import('../../hero/engine.mjs'),story=import('../../hero/story.mjs');
for(const level of [3,4,5,6,7,8,9,10,13,15])test(`duel ${level} preserves the battlefield, applies counters once and resumes against surviving troops`,async()=>{
 const e=await engine,{STAGES}=await story,stage=STAGES[level-1],b=e.createBattle(level,42);
 b.nextSpawn=Infinity;b.bossSpawned=true;b.food=300;
 if(b.mission)b.mission.flags=b.mission.needed;
 assert.equal(e.deploy(b,stage.duelHero,1),true);
 if(stage.duelPartner)assert.equal(e.deploy(b,stage.duelPartner,2),true);
 assert.equal(e.deploy(b,'archer',0),true);
 const fighters=b.allies.filter(u=>u.key!=='archer'),archer=b.allies.find(u=>u.key==='archer');
 for(const u of fighters)u.hp=u.maxHp*.8;
 const boss={id:90,boss:true,name:stage.bossName,lane:1,x:.17,hp:stage.bossHp*.5,maxHp:stage.bossHp,damage:0,rate:2,lastAttack:100,speed:0};
 const troop={id:91,boss:false,name:'守兵',lane:0,x:.8,hp:100,maxHp:100,damage:0,rate:2,lastAttack:100,speed:.01};b.enemies=[boss,troop];
 e.stepBattle(b,.1);assert.ok(b.duel);
 const frozen={time:b.time,food:b.food,spawned:b.spawned,troopX:troop.x,positions:b.allies.map(u=>[u.id,u.x,u.lane]),cooldowns:{...b.cooldowns}};
 b.projectiles.push({targetId:archer.id,lane:0,aimX:archer.x,impactAt:b.time+.05,damage:10});
 for(const u of fighters){u.pendingStrike={targetId:91,impactAt:b.time,damage:999};u.pendingCleave={ids:[91],impactAt:b.time};}
 assert.equal(e.commandHero(b,fighters[0].id,'auto'),false);
 e.stepBattle(b,.1);b.paused=true;const paused=JSON.stringify(b);
 assert.equal(e.skipDuelEntrance(b),false);for(let i=0;i<20;i++)e.stepBattle(b,.1);assert.equal(JSON.stringify(b),paused);b.paused=false;
 assert.equal(e.skipDuelEntrance(b),true);
 for(let i=0;i<200&&b.duel;i++)e.stepBattle(b,.1);
 assert.equal(b.duel,null);assert.equal(boss.hp,0);assert.equal(b.over,false);
 assert.deepEqual({time:b.time,food:b.food,spawned:b.spawned,troopX:troop.x,positions:b.allies.map(u=>[u.id,u.x,u.lane]),cooldowns:{...b.cooldowns}},frozen);
 assert.equal(archer.hp,archer.maxHp);assert.equal(b.projectiles.length,1);
 for(const u of fighters){assert.ok(Math.abs(u.hp-u.maxHp*(stage.duelPartner?.77:.74))<1e-6);assert.equal(u.pendingStrike,null);assert.equal(u.pendingCleave,null)}
 e.stepBattle(b,.1);assert.equal(b.over,false);assert.equal(b.duel,null);assert.equal(b.enemies.some(u=>u.id===90),false);assert.ok(troop.hp>0);assert.equal(archer.hp,archer.maxHp-10);assert.equal(b.projectiles.length,0);assert.ok(b.time>frozen.time);
 assert.ok(b.effects.some(f=>f.bossName===stage.bossName&&f.type===(stage.duelOutcome==='retreat'?'retreat':'defeat')));
});
test('enraging during a cast preserves its announced lane and expands the next cast',async()=>{
 const e=await engine,b=e.createBattle(7,42);b.nextSpawn=Infinity;b.bossSpawned=true;e.deploy(b,'liubei',1);
 const boss={id:90,boss:true,name:'韓旌',lane:1,x:.3,hp:400,maxHp:400,damage:0,rate:2,lastAttack:100,speed:0,nextSkill:0};b.enemies=[boss];
 e.stepBattle(b,.1);assert.deepEqual(boss.castLanes,[1]);const impact=boss.castAt;boss.hp=190;
 e.stepBattle(b,.1);assert.equal(boss.enraged,true);assert.deepEqual(boss.castLanes,[1]);assert.equal(boss.castAt,impact);
 while(b.time<impact)e.stepBattle(b,.1);assert.equal(boss.skillsCast,1);
 while(!boss.castAt)e.stepBattle(b,.1);
 assert.deepEqual(boss.castLanes,[1,2]);
});
