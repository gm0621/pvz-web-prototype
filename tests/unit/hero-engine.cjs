const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=import('../../hero/engine.mjs');

test('progress is a separate, bounded six-stage record',async()=>{
 const {normalizeProgress,SAVE_KEY}=await engine;
 assert.equal(SAVE_KEY,'heroLegendProgress_v1');
 for(const raw of [null,{},[],{completed:-9},{completed:'bad'}])assert.equal(normalizeProgress(raw).completed,0);
 assert.equal(normalizeProgress({completed:99}).completed,6);
 assert.equal(normalizeProgress({completed:3}).completed,3);
});
test('deployments pay once, respect cooldown and three-unit lane capacity',async()=>{
 const {createBattle,deploy}=await engine,b=createBattle(1,1);
 assert.equal(deploy(b,'archer',0),true);assert.equal(b.food,170);
 assert.equal(deploy(b,'archer',1),false);assert.equal(b.food,170);
 assert.equal(deploy(b,'archer',3),false);assert.equal(b.food,170);
 b.allies.push({...b.allies[0],id:9},{...b.allies[0],id:10});b.time=10;
 assert.equal(deploy(b,'archer',0),false);assert.equal(b.food,170);
});
test('pause freezes battle, and auto duel freezes combat and supply without any input',async()=>{
 const {createBattle,deploy,stepBattle}=await engine,b=createBattle(3,1);
 deploy(b,'zhangfei',1);b.enemies.push({id:99,lane:1,x:.17,hp:240,maxHp:240,boss:true,name:'鄧茂',damage:20,rate:2,speed:.02,lastAttack:0});
 b.paused=true;const snapshot=JSON.stringify(b);stepBattle(b,.1);assert.equal(JSON.stringify(b),snapshot);
 b.paused=false;stepBattle(b,.1);assert.ok(b.duel);
 const time=b.time,food=b.food,hp=b.enemies[0].hp;
 stepBattle(b,.1);assert.equal(b.time,time);assert.equal(b.food,food);assert.equal(b.enemies[0].hp,hp);
 for(let i=0;i<30&&b.duel;i++)stepBattle(b,.1);
 assert.equal(b.duel,null);assert.equal(b.enemies[0].hp,168);assert.equal(b.duelSeen,true);
});
test('three undefended breaches lose naturally',async()=>{
 const {createBattle,stepBattle}=await engine,b=createBattle(1,1);
 for(let i=0;i<2000&&!b.over;i++)stepBattle(b,.1);
 assert.equal(b.over,true);assert.equal(b.won,false);assert.equal(b.lives,0);
});
for(let level=1;level<=6;level++)test(`chapter ${level} can be won with legal deployments and unmodified battle stats`,async()=>{
 const {createBattle,deploy,stepBattle}=await engine;
 for(const seed of [1,42,2026]){
  const b=createBattle(level,seed);
  for(let i=0;i<3000&&!b.over;i++){
   for(const lane of [1,0,2]){
    const units=b.allies.filter(u=>u.lane===lane),keys=units.map(u=>u.key);
    const hero={0:'liubei',1:'zhangfei',2:'guanyu'}[lane];
    const key=!keys.includes('archer')?'archer':!b.allies.some(u=>u.key===hero)?hero:keys.filter(k=>k==='archer').length<2?'archer':hero;
    deploy(b,key,lane);
   }
   stepBattle(b,.1);
  }
  assert.equal(b.won,true,`level ${level}, seed ${seed}, lives ${b.lives}, time ${b.time}`);
 }
});

test('allies reaching the frontline remain on guard instead of disappearing',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');const b=createBattle(1,1);b.nextSpawn=Infinity;deploy(b,'guanyu',1);const id=b.allies[0].id;
 for(let i=0;i<500;i++)stepBattle(b,.1);
 assert.equal(b.allies.length,1);assert.equal(b.allies[0].id,id);assert.equal(b.allies[0].x,.84);assert.equal(b.allies[0].action,'holding');
});
test('combat emits arrow visuals and pause freezes their flight',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');const b=createBattle(1,1);deploy(b,'archer',1);
 for(let i=0;i<300&&!b.effects.some(e=>e.type==='arrow');i++)stepBattle(b,.1);
 assert.ok(b.effects.some(e=>e.type==='arrow'));const before=JSON.stringify(b.effects);b.paused=true;stepBattle(b,.1);assert.equal(JSON.stringify(b.effects),before);
});

test('each hero is unique and only starts the 12-second recall cooldown on retreat',async()=>{
 const {createBattle,deploy,stepBattle}=await engine,b=createBattle(1,1);b.nextSpawn=Infinity;
 assert.equal(deploy(b,'guanyu',0),true);const food=b.food;assert.equal(deploy(b,'guanyu',1),false);assert.equal(b.food,food);
 b.allies[0].hp=0;stepBattle(b,.1);assert.ok(Math.abs(b.cooldowns.guanyu-b.time-12)<.001);assert.equal(deploy(b,'guanyu',1),false);
 for(let i=0;i<121;i++)stepBattle(b,.1);assert.equal(deploy(b,'guanyu',1),true);
});
test('Liu Bei learns healing in stage two rather than overwhelming the first stage',async()=>{
 const {createBattle,deploy,stepBattle}=await engine;
 for(const level of [1,2]){const b=createBattle(level,1);b.nextSpawn=Infinity;deploy(b,'liubei',0);b.allies[0].hp=90;for(let i=0;i<32;i++)stepBattle(b,.1);assert.equal(b.allies[0].hp,level===1?90:103)}
});
function testEnemy(id,x,lane=1){return {id,lane,x,hp:200,maxHp:200,boss:false,name:'測試敵軍',damage:0,rate:1.5,speed:0,lastAttack:10,flash:0}}
test('Zhang Fei roar and Guan Yu cleave appear only in their teaching stages',async()=>{
 const {createBattle,deploy,stepBattle}=await engine;
 for(const [key,level,type] of [['zhangfei',3,'roar'],['guanyu',4,'cleave']])for(const available of [false,true]){
  const b=createBattle(available?level:level-1,1);b.nextSpawn=Infinity;deploy(b,key,1);b.time=9;b.enemies.push(testEnemy(90,.28),testEnemy(91,.3));stepBattle(b,.1);
  assert.equal(b.effects.some(e=>e.type===type),available);
  if(available&&key==='zhangfei')assert.ok(b.enemies.every(e=>e.stunnedUntil>b.time&&e.x>.3));
  if(available&&key==='guanyu')assert.ok(b.enemies.every(e=>e.hp===155));
 }
});
test('shield infantry reduce arrows but do not reduce melee strikes',async()=>{
 const {createBattle,deploy,stepBattle}=await engine;
 for(const [key,x,damage] of [['archer',.35,6.5],['guanyu',.17,32]]){const b=createBattle(5,1);b.nextSpawn=Infinity;deploy(b,key,1);b.time=10;b.allies[0].lastSkill=10;const foe=testEnemy(90,x);foe.shielded=true;b.enemies.push(foe);stepBattle(b,.1);assert.equal(foe.hp,200-damage)}
});
test('Peach Garden team effect requires all three living heroes and fires once in stage six',async()=>{
 const {createBattle,deploy,stepBattle}=await engine,b=createBattle(6,1);b.nextSpawn=Infinity;b.food=300;deploy(b,'liubei',0);deploy(b,'guanyu',1);stepBattle(b,.1);assert.equal(b.oathUsed,false);
 deploy(b,'zhangfei',2);for(const u of b.allies)u.hp=50;stepBattle(b,.1);assert.equal(b.oathUsed,true);assert.ok(b.allies.every(u=>u.hp===105));assert.ok(b.effects.some(e=>e.type==='oath'));
 for(const u of b.allies)u.hp=50;stepBattle(b,.1);assert.ok(b.allies.every(u=>u.hp===50));
});
