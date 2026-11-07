const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=import('../../hero/engine.mjs');
test('point orders combine lane and position, preserve bounds and reject paused commands',async()=>{
 const {createBattle,deploy,positionHero,stepBattle}=await engine,b=createBattle(3,1);b.nextSpawn=Infinity;deploy(b,'zhangfei',1);const u=b.allies[0];
 assert.equal(positionHero(b,'zhangfei',2,.45),true);assert.equal(u.lane,2);assert.equal(u.targetX,.45);
 assert.equal(positionHero(b,'zhangfei',0,.4),false);b.time+=2;assert.equal(positionHero(b,'zhangfei',0,.4),true);
 for(let i=0;i<100;i++)stepBattle(b,.1);assert.equal(u.order,'hold');assert.equal(u.x,.4);
 b.paused=true;assert.equal(positionHero(b,'zhangfei',0,.1),false);b.paused=false;assert.equal(positionHero(b,'zhangfei',0,-2),true);assert.equal(u.targetX,.06);
});
test('manual orders move gradually, hold position, freeze and resume automatic advance',async()=>{
 const {createBattle,deploy,commandHero,stepBattle}=await engine,b=createBattle(1,1);b.nextSpawn=Infinity;deploy(b,'zhangfei',1);const u=b.allies[0];
 commandHero(b,'zhangfei','forward');stepBattle(b,.1);assert.ok(u.x>.1&&u.x<.26);
 for(let i=0;i<200;i++)stepBattle(b,.1);assert.equal(u.order,'hold');assert.ok(Math.abs(u.x-.26)<.001);
 commandHero(b,'zhangfei','back');const x=u.x;b.paused=true;stepBattle(b,.1);assert.equal(u.x,x);assert.equal(commandHero(b,'zhangfei','auto'),false);b.paused=false;stepBattle(b,.1);assert.ok(u.x<x);
 commandHero(b,'zhangfei','hold');const held=u.x;stepBattle(b,.1);assert.equal(u.x,held);
 commandHero(b,'zhangfei','auto');stepBattle(b,.1);assert.ok(u.x>held);
 commandHero(b,'zhangfei','up');assert.equal(u.lane,0);assert.equal(commandHero(b,'zhangfei','up'),false);
});

test('progress is a separate, bounded ten-stage record',async()=>{
 const {normalizeProgress,SAVE_KEY}=await engine;
 assert.equal(SAVE_KEY,'heroLegendProgress_v1');
 for(const raw of [null,{},[],{completed:-9},{completed:'bad'}])assert.equal(normalizeProgress(raw).completed,0);
 assert.equal(normalizeProgress({completed:99}).completed,10);
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
 for(let i=0;i<160&&b.duel;i++)stepBattle(b,.1);
 assert.equal(b.duel,null);assert.equal(b.enemies[0].hp,0);assert.equal(b.duelSeen,true);
 assert.equal(b.time,time);assert.equal(b.food,food);
});
test('duel exchanges hit once, finisher kills and surviving troops prevent premature victory',async()=>{
 const {createBattle,deploy,stepBattle}=await engine,b=createBattle(3,1);b.nextSpawn=Infinity;b.bossSpawned=true;
 deploy(b,'zhangfei',1);b.enemies.push({...testEnemy(90,.17),boss:true,name:'鄧茂'},testEnemy(91,.9,2));
 stepBattle(b,.1);const start=b.enemies[0].hp;
 for(let i=0;i<31;i++)stepBattle(b,.1);assert.equal(b.enemies[0].hp,start*.88);
 b.paused=true;const frozen=JSON.stringify(b);stepBattle(b,.1);assert.equal(JSON.stringify(b),frozen);b.paused=false;
 for(let i=0;i<125;i++)stepBattle(b,.1);assert.equal(b.duel,null);assert.equal(b.enemies.some(e=>e.id===90),false);assert.equal(b.over,false);
});
test('three undefended breaches lose naturally',async()=>{
 const {createBattle,stepBattle}=await engine,b=createBattle(1,1);
 for(let i=0;i<2000&&!b.over;i++){if(b.introPending)b.introPending=false;stepBattle(b,.1)}
 assert.equal(b.over,true);assert.equal(b.won,false);assert.equal(b.lives,0);
});
for(let level=1;level<=10;level++)test(`chapter ${level} can be won with legal deployments and unmodified battle stats`,async()=>{
 const {createBattle,deploy,stepBattle}=await engine;
 for(const seed of [1,42,2026]){
  const b=createBattle(level,seed);
  for(let i=0;i<3000&&!b.over;i++){
   if(b.introPending)b.introPending=false; // Player acknowledges the arrival dialogue.
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
test('redeployment is free, bounded, cooldown protected and frozen during arrival',async()=>{
 const {createBattle,deploy,moveHero,stepBattle}=await engine,b=createBattle(3,1);
 deploy(b,'zhangfei',1);const food=b.food,u=b.allies[0];u.pendingStrike={targetId:99};
 assert.equal(moveHero(b,'zhangfei',2),true);assert.equal(u.lane,2);assert.equal(b.food,food);assert.equal(u.pendingStrike,null);
 assert.equal(moveHero(b,'zhangfei',0),false);b.time+=6;assert.equal(moveHero(b,'zhangfei',0),true);
 b.introPending=true;const snapshot=JSON.stringify(b);stepBattle(b,.1);assert.equal(JSON.stringify(b),snapshot);assert.equal(moveHero(b,'zhangfei',2),false);
});
test('enemy skill telegraphs before damage and can be dodged by changing lanes',async()=>{
 const {createBattle,deploy,moveHero,stepBattle}=await engine;
 for(const dodge of [false,true]){const b=createBattle(3,1);b.nextSpawn=Infinity;b.duelSeen=true;deploy(b,'zhangfei',1);const u=b.allies[0];u.lastAttack=100;u.lastSkill=100;
 b.enemies.push({...testEnemy(90,.23),boss:true,name:'鄧茂'});stepBattle(b,.1);assert.ok(b.enemies[0].castAt);const hp=u.hp;
 if(dodge)moveHero(b,'zhangfei',2);for(let i=0;i<19;i++)stepBattle(b,.1);assert.equal(u.hp,dodge?hp:hp-25);
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
  const b=createBattle(available?level:level-1,1);b.nextSpawn=Infinity;deploy(b,key,1);b.time=9;b.enemies.push(testEnemy(90,.28),testEnemy(91,.3));for(let i=0;i<4;i++)stepBattle(b,.1);
  assert.equal(b.effects.some(e=>e.type===type),available);
  if(available&&key==='zhangfei')assert.ok(b.enemies.every(e=>e.stunnedUntil>b.time&&e.x>.3));
  if(available&&key==='guanyu')assert.ok(b.enemies.every(e=>e.hp===155));
 }
});
test('shield infantry reduce arrows but do not reduce melee strikes',async()=>{
 const {createBattle,deploy,stepBattle}=await engine;
 for(const [key,x,damage] of [['archer',.35,6.5],['guanyu',.17,32]]){const b=createBattle(5,1);b.nextSpawn=Infinity;deploy(b,key,1);b.time=10;b.allies[0].lastSkill=10;const foe=testEnemy(90,x);foe.shielded=true;b.enemies.push(foe);for(let i=0;i<4;i++)stepBattle(b,.1);assert.equal(foe.hp,200-damage)}
});
test('Peach Garden team effect requires all three living heroes and fires once in stage six',async()=>{
 const {createBattle,deploy,stepBattle}=await engine,b=createBattle(6,1);b.nextSpawn=Infinity;b.food=300;deploy(b,'liubei',0);deploy(b,'guanyu',1);stepBattle(b,.1);assert.equal(b.oathUsed,false);
 deploy(b,'zhangfei',2);for(const u of b.allies)u.hp=50;stepBattle(b,.1);assert.equal(b.oathUsed,true);assert.ok(b.allies.every(u=>u.hp===105));assert.ok(b.effects.some(e=>e.type==='oath'));
 for(const u of b.allies)u.hp=50;stepBattle(b,.1);assert.ok(b.allies.every(u=>u.hp===50));
});

test('drawn melee poses wind up before damage, land once at impact, and freeze on pause',async()=>{
 const {createBattle,deploy,stepBattle,attackFrame}=await engine,b=createBattle(1,1);b.nextSpawn=Infinity;deploy(b,'guanyu',1);const u=b.allies[0],e=testEnemy(90,.17);b.enemies.push(e);
 stepBattle(b,.01);assert.equal(e.hp,200);assert.equal(attackFrame(u,b.time),0);assert.ok(u.pendingStrike);
 stepBattle(b,.1);assert.equal(e.hp,200);assert.equal(attackFrame(u,b.time),1);
 b.paused=true;const snapshot=JSON.stringify(b);stepBattle(b,.1);assert.equal(JSON.stringify(b),snapshot);b.paused=false;
 stepBattle(b,.1);assert.equal(e.hp,200);stepBattle(b,.05);assert.equal(e.hp,168);assert.equal(attackFrame(u,b.time),3);assert.ok(b.effects.some(f=>f.type==='slash'));
 stepBattle(b,.1);assert.equal(e.hp,168);assert.equal(u.pendingStrike,null);
});
test('a withdrawn attacker cannot inflict its queued melee strike',async()=>{
 const {createBattle,deploy,stepBattle}=await engine,b=createBattle(1,1);b.nextSpawn=Infinity;deploy(b,'liubei',1);const e=testEnemy(90,.17);b.enemies.push(e);stepBattle(b,.01);b.allies[0].hp=0;stepBattle(b,.1);stepBattle(b,.1);stepBattle(b,.1);assert.equal(e.hp,200);assert.equal(b.allies.length,0);
});

test('Liu Bei duels Shi Kui only after the tower shield is weakened',async()=>{
 const {createBattle,deploy,stepBattle}=await engine,b=createBattle(5,1);b.nextSpawn=Infinity;b.bossSpawned=true;deploy(b,'liubei',1);
 const boss={...testEnemy(90,.17),hp:290,maxHp:290,boss:true,name:'石魁',shielded:true};b.enemies.push(boss);stepBattle(b,.1);assert.equal(b.duel,null);
 boss.hp=180;stepBattle(b,.1);assert.equal(b.duel.heroKey,'liubei');assert.equal(b.duel.bossName,'石魁');const frozen=b.time;
 for(let i=0;i<150;i++)stepBattle(b,.1);assert.equal(b.time,frozen);assert.equal(boss.hp,0);
});
test('late bosses telegraph two lanes on rage and the remaining lane is safe',async()=>{
 const {createBattle,deploy,commandHero,stepBattle}=await engine;
 for(const level of [6,10]){const b=createBattle(level,1);b.nextSpawn=Infinity;b.bossSpawned=true;b.oathUsed=true;b.food=300;
 for(const [key,lane] of [['liubei',0],['guanyu',1],['zhangfei',2]]){deploy(b,key,lane);const u=b.allies.at(-1);u.lastAttack=100;u.lastSkill=100;u.lastHeal=100;commandHero(b,key,'hold')}
 const boss={...testEnemy(90,.2),hp:150,maxHp:340,boss:true,name:level===6?'雷烈':'張角'};b.enemies.push(boss);stepBattle(b,.1);assert.equal(boss.enraged,true);assert.deepEqual(boss.castLanes,[1,2]);
 const before=b.allies.map(u=>u.hp);b.paused=true;stepBattle(b,.1);assert.deepEqual(b.allies.map(u=>u.hp),before);b.paused=false;
 for(let i=0;i<26;i++)stepBattle(b,.1);assert.equal(b.allies[0].hp,before[0]);assert.ok(b.allies[1].hp<before[1]);assert.ok(b.allies[2].hp<before[2]);
 }
});
test('old first-chapter completion unlocks the second chapter without resetting progress',async()=>{
 const {normalizeProgress,createBattle}=await engine;assert.equal(normalizeProgress({version:1,completed:6}).completed,6);assert.equal(createBattle(7).level,7);assert.equal(createBattle(10).level,10);assert.throws(()=>createBattle(11));
 const {STAGES,FEATURES}=await import('../../hero/story.mjs');assert.equal(STAGES.length,10);assert.equal(FEATURES.length,10);assert.equal(STAGES[4].duelHero,'liubei');assert.equal(STAGES[9].bossName,'張角');assert.equal(STAGES[9].duelHero,undefined);
});
test('Zhang Jiao withdraws instead of using a death or duel finisher',async()=>{
 const {createBattle,stepBattle}=await engine,b=createBattle(10,1);b.nextSpawn=Infinity;b.bossSpawned=true;b.enemies.push({...testEnemy(90,.5),boss:true,name:'張角',hp:0});stepBattle(b,.1);assert.equal(b.bossRetreated,true);assert.equal(b.duel,null);assert.ok(b.effects.some(e=>e.type==='retreat'));assert.equal(b.effects.some(e=>e.type==='defeat'),false);
});
