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

test('progress is a separate, bounded campaign record',async()=>{
 const {normalizeProgress,SAVE_KEY}=await engine;
 assert.equal(SAVE_KEY,'heroLegendProgress_v1');
 for(const raw of [null,{},[],{completed:-9},{completed:'bad'}])assert.equal(normalizeProgress(raw).completed,0);
 assert.equal(normalizeProgress({completed:99}).completed,40);
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
 for(let i=0;i<250&&b.duel;i++)stepBattle(b,.1);
 assert.equal(b.duel,null);assert.equal(b.enemies[0].hp,0);assert.equal(b.duelSeen,true);
 assert.equal(b.time,time);assert.equal(b.food,food);
});
test('duel exchanges hit once, finisher kills and surviving troops prevent premature victory',async()=>{
 const {createBattle,deploy,stepBattle}=await engine,b=createBattle(3,1);b.nextSpawn=Infinity;b.bossSpawned=true;
 deploy(b,'zhangfei',1);b.enemies.push({...testEnemy(90,.17),boss:true,name:'鄧茂'},testEnemy(91,.9,2));
 stepBattle(b,.1);(await engine).skipDuelEntrance(b);const start=b.enemies[0].hp;
 for(let i=0;i<31;i++)stepBattle(b,.1);assert.equal(b.enemies[0].hp,start*.88);
 b.paused=true;const frozen=JSON.stringify(b);stepBattle(b,.1);assert.equal(JSON.stringify(b),frozen);b.paused=false;
 for(let i=0;i<165;i++)stepBattle(b,.1);assert.equal(b.duel,null);assert.equal(b.enemies.some(e=>e.id===90),false);assert.equal(b.over,false);
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
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');const b=createBattle(1,1);b.nextSpawn=Infinity;deploy(b,'guanyu',1);(await engine).commandHero(b,'guanyu','auto');const id=b.allies[0].id;
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

test('Liu Bei is told to break the shield before dueling Shi Kui',async()=>{
 const {createBattle,deploy,stepBattle}=await engine,b=createBattle(5,1);b.nextSpawn=Infinity;b.bossSpawned=true;deploy(b,'liubei',1);
 const boss={...testEnemy(90,.17),hp:290,maxHp:290,boss:true,name:'石魁',shielded:true};b.enemies.push(boss);stepBattle(b,.1);assert.equal(b.duel,null);assert.match(b.duelHint.text,/先破盾.*65%/);b.allies[0].lane=0;boss.hp=180;stepBattle(b,.1);assert.equal(b.duelHint,null);b.allies[0].lane=1;stepBattle(b,.1);assert.equal(b.duel.heroKey,'liubei');assert.equal(b.duel.bossName,'石魁');const frozen=b.time;(await engine).skipDuelEntrance(b);
 while(b.duel)stepBattle(b,.1);assert.equal(b.time,frozen);assert.equal(boss.hp,0);
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
 const {normalizeProgress,createBattle}=await engine;assert.equal(normalizeProgress({version:1,completed:6}).completed,6);assert.equal(createBattle(7).level,7);assert.equal(createBattle(10).level,10);assert.throws(()=>createBattle(41));
 const {STAGES,FEATURES}=await import('../../hero/story.mjs');assert.equal(STAGES.length,40);assert.equal(FEATURES.length,40);assert.equal(STAGES[4].duelHero,'liubei');assert.equal(STAGES[9].bossName,'張角');assert.equal(STAGES[9].duelHero,'liubei');assert.equal(STAGES[9].duelOutcome,'retreat');
});
test('Zhang Jiao withdraws instead of using a death or duel finisher',async()=>{
 const {createBattle,stepBattle}=await engine,b=createBattle(10,1);b.nextSpawn=Infinity;b.bossSpawned=true;b.enemies.push({...testEnemy(90,.5),boss:true,name:'張角',hp:0});stepBattle(b,.1);assert.equal(b.bossRetreated,true);assert.equal(b.duel,null);assert.ok(b.effects.some(e=>e.type==='retreat'));assert.equal(b.effects.some(e=>e.type==='defeat'),false);
});

test('chapter-two duels use the nominated hero and freeze hazards, ending in retreat for Zhang Jiao',async()=>{
 const {createBattle,deploy,stepBattle,duelBeat}=await engine;const {STAGES}=await import('../../hero/story.mjs');
 for(let level=7;level<=10;level++){
  const stage=STAGES[level-1],b=createBattle(level);b.nextSpawn=Infinity;b.bossSpawned=true;deploy(b,stage.duelHero,1);
  b.enemies.push({...testEnemy(90,.17),boss:true,name:stage.bossName,hp:40,maxHp:300});b.hazards.push({lane:1,nextTick:1,until:4});stepBattle(b,.1);assert.ok(b.duel);
  const t=b.time,hp=b.allies[0].hp;stepBattle(b,.1);assert.equal(b.time,t);assert.equal(b.allies[0].hp,hp);
  b.duel.elapsed=17.3;if(level===10)assert.equal(duelBeat(b.duel).text,'張角退走');
 }
});

test('rally buffs troops temporarily and fire damage freezes on pause and can be avoided',async()=>{
 const {createBattle,deploy,stepBattle}=await engine;
 const b=createBattle(7);b.nextSpawn=Infinity;b.duelSeen=true;deploy(b,'liubei',1);
 const boss={...testEnemy(90,.3),boss:true,hp:300,maxHp:300,castAt:.05},troop={...testEnemy(91,.8),lane:2};b.enemies.push(boss,troop);stepBattle(b,.1);assert.ok(troop.rallyUntil>b.time);assert.ok(b.effects.some(e=>e.type==='rally'));
 const expiry=troop.rallyUntil;b.time=expiry;const x=troop.x;stepBattle(b,.1);assert.ok(Math.abs(x-troop.x-troop.speed*.1)<.00001);
 const f=createBattle(8);f.nextSpawn=Infinity;f.duelSeen=true;deploy(f,'liubei',1);f.enemies.push({...testEnemy(90,.3),boss:true,hp:300,maxHp:300,castAt:.05});stepBattle(f,.1);assert.equal(f.hazards.length,1);
 const hp=f.allies[0].hp;f.paused=true;stepBattle(f,.1);assert.equal(f.allies[0].hp,hp);f.paused=false;f.allies[0].lane=0;f.time=1.2;stepBattle(f,.1);assert.equal(f.allies[0].hp,hp);
});

test('hook locks a target, interrupts its attack, and misses after a lane change',async()=>{
 const {createBattle,deploy,stepBattle}=await engine;
 for(const dodge of [false,true]){
  const b=createBattle(9);b.nextSpawn=Infinity;b.duelSeen=true;deploy(b,'zhangfei',1);const u=b.allies[0];u.order='hold';u.lastSkill=100;const x=u.x,hp=u.hp;
  b.enemies.push({...testEnemy(90,.3),boss:true,hp:300,maxHp:300,castAt:.05,castTargetId:u.id});if(dodge)u.lane=0;stepBattle(b,.1);
  assert.equal(u.hp,hp-(dodge?0:24));assert.equal(u.x,x+(dodge?0:.09));if(!dodge){assert.equal(u.order,'hold');assert.equal(u.pendingStrike,null)}
 }
});

 test('all deployed units hold and heroes advance only after an explicit order',async()=>{
 const {createBattle,deploy,stepBattle,commandHero}=await engine;
 for(const key of ['liubei','guanyu','zhangfei','archer']){const b=createBattle(1);b.nextSpawn=Infinity;deploy(b,key,1);for(let i=0;i<100;i++)stepBattle(b,.1);assert.equal(b.allies[0].x,.1);assert.equal(b.allies[0].order,'hold');if(key!=='archer'){commandHero(b,key,'forward');stepBattle(b,.1);assert.ok(b.allies[0].x>.1)}}
 });

test('weapon reach differs and a spear attacks from behind a friendly front line',async()=>{
 const {createBattle,deploy,stepBattle}=await engine;const {HEROES}=await import('../../hero/story.mjs');assert.ok(HEROES.zhangfei.range>HEROES.guanyu.range&&HEROES.guanyu.range>HEROES.liubei.range);
 const b=createBattle(1);b.nextSpawn=Infinity;b.food=300;deploy(b,'liubei',1);deploy(b,'zhangfei',1);b.allies[0].x=.4;b.allies[1].x=.37;const enemy={...testEnemy(90,.47),lastAttack:100};b.enemies.push(enemy);stepBattle(b,.1);assert.ok(b.allies.every(u=>u.pendingStrike));for(let i=0;i<3;i++)stepBattle(b,.1);assert.equal(enemy.hp,200-15-24);
});
test('a commanded short-range hero can pass a holding ally to reach the enemy',async()=>{
 const {createBattle,deploy,commandHero,stepBattle}=await engine;const b=createBattle(1);b.nextSpawn=Infinity;b.food=300;deploy(b,'zhangfei',1);deploy(b,'liubei',1);b.allies[0].x=.35;const u=b.allies[1];u.x=.2;const enemy={...testEnemy(90,.5),hp:10000,maxHp:10000,lastAttack:100,speed:0};b.enemies.push(enemy);commandHero(b,'liubei','auto');for(let i=0;i<80;i++)stepBattle(b,.1);assert.ok(u.x>.35);assert.ok(u.lastAttack>0);assert.equal(b.allies[0].x,.35);
});
test('campaign migration, first-clear rewards, purchase caps and reloads preserve the economy',async()=>{
 const {normalizeProgress}=await engine;const {purchase,rewardVictory}=await import('../../hero/campaign.mjs');let p=normalizeProgress({completed:2});assert.equal(p.coins,160);assert.equal(rewardVictory(p,2),0);assert.equal(rewardVictory(p,3),80);assert.equal(rewardVictory(p,3),0);assert.equal(p.coins,240);
 assert.equal(purchase(p,'liubei'),'');assert.equal(p.coins,180);assert.equal(p.weapons.liubei,1);p=normalizeProgress(JSON.parse(JSON.stringify(p)));assert.equal(p.coins,180);assert.equal(p.weapons.liubei,1);assert.equal(purchase(p,'liubei'),'');assert.equal(purchase(p,'liubei'),'軍資不足，先去完成新的關卡吧。');assert.equal(p.weapons.liubei,2);
 p.inventory.herb=9;const coins=p.coins;assert.ok(purchase(p,'herb'));assert.equal(p.coins,coins);assert.equal(normalizeProgress({completed:1,coins:-1,weapons:{zhangfei:99},inventory:{herb:Infinity}}).inventory.herb,0);
});
test('weapon upgrades change actual damage and supplies consume once only during active battle',async()=>{
 const {createBattle,deploy,stepBattle,normalizeProgress}=await engine;const {purchase,useSupply}=await import('../../hero/campaign.mjs');const p=normalizeProgress({completed:2});purchase(p,'liubei');purchase(p,'herb');purchase(p,'grain');const b=createBattle(1,1,p.weapons);b.nextSpawn=Infinity;deploy(b,'liubei',1);const enemy={...testEnemy(90,.17),lastAttack:100};b.enemies.push(enemy);for(let i=0;i<4;i++)stepBattle(b,.1);assert.equal(enemy.hp,182);
 b.allies[0].hp=50;b.paused=true;assert.equal(useSupply(b,p,'herb'),false);b.paused=false;assert.equal(useSupply(b,p,'herb'),true);assert.equal(b.allies[0].hp,110);assert.equal(useSupply(b,p,'herb'),false);b.duel={};assert.equal(useSupply(b,p,'grain'),false);b.duel=null;b.food=290;assert.equal(useSupply(b,p,'grain'),true);assert.equal(b.food,300);assert.equal(p.inventory.grain,0);
});

test('versus entrance freezes combat, pauses exactly and skip never applies duel damage',async()=>{
 const {createBattle,deploy,stepBattle,skipDuelEntrance,DUEL_ENTRANCE_DURATION}=await engine,b=createBattle(3,1);b.nextSpawn=Infinity;deploy(b,'zhangfei',1);b.enemies.push({...testEnemy(90,.17),boss:true,name:'鄧茂'});stepBattle(b,.1);
 const time=b.time,food=b.food,hp=b.enemies[0].hp;
 for(let i=0;i<20;i++)stepBattle(b,.1);
 assert.equal(b.duel.elapsed,0);assert.equal(b.time,time);assert.equal(b.food,food);assert.equal(b.enemies[0].hp,hp);
 b.paused=true;const frozen=JSON.stringify(b);stepBattle(b,.1);assert.equal(skipDuelEntrance(b),false);assert.equal(JSON.stringify(b),frozen);
 b.paused=false;assert.equal(skipDuelEntrance(b),true);assert.equal(b.duel.entranceElapsed,DUEL_ENTRANCE_DURATION);assert.equal(b.duel.elapsed,0);assert.equal(b.enemies[0].hp,hp);stepBattle(b,.1);assert.ok(b.duel.elapsed>0);assert.equal(b.time,time);assert.equal(b.food,food);
});
test('individual archers move and hold by id without commanding or redeploying the other archer',async()=>{
 const {createBattle,deploy,stepBattle,commandHero,positionHero}=await engine,b=createBattle(1);b.nextSpawn=Infinity;deploy(b,'archer',0);b.cooldowns.archer=0;deploy(b,'archer',1);const [a,c]=b.allies,food=b.food;
 assert.equal(commandHero(b,'archer','forward'),false);assert.equal(commandHero(b,a.id,'forward'),true);for(let i=0;i<10;i++)stepBattle(b,.1);assert.ok(a.x>.1);assert.equal(c.x,.1);assert.equal(b.allies.length,2);
 assert.equal(commandHero(b,a.id,'back'),true);const x=a.x;stepBattle(b,.1);assert.ok(a.x<x);commandHero(b,a.id,'hold');const held=a.x;stepBattle(b,.1);assert.equal(a.x,held);assert.equal(c.order,'hold');assert.ok(b.food>=food);
 assert.equal(positionHero(b,a.id,2,.45),true);assert.equal(a.lane,2);assert.equal(c.lane,1);b.paused=true;assert.equal(commandHero(b,a.id,'forward'),false);b.paused=false;b.duel={};assert.equal(positionHero(b,a.id,0,.5),false);
});
test('enemy troop sword winds up before damage and freezes on pause, with a dodge cancelling the hit',async()=>{
 const {createBattle,deploy,stepBattle,enemyAttackFrame,moveHero}=await engine;
 for(const dodge of [false,true]){const b=createBattle(1);b.nextSpawn=Infinity;deploy(b,'archer',1);const u=b.allies[0];u.lastAttack=100;const e={...testEnemy(90,.17),damage:10,rate:2,lastAttack:-10};b.enemies.push(e);stepBattle(b,.1);const hp=u.hp;assert.equal(enemyAttackFrame(e,b.time),0);assert.equal(u.hp,hp);assert.ok(e.pendingStrike);
 b.paused=true;const frozen=JSON.stringify(b);stepBattle(b,.1);assert.equal(JSON.stringify(b),frozen);b.paused=false;if(dodge)moveHero(b,u.id,0);for(let i=0;i<3;i++)stepBattle(b,.1);assert.equal(enemyAttackFrame(e,b.time),1);assert.equal(u.hp,hp-(dodge?0:10));for(let i=0;i<3;i++)stepBattle(b,.1);assert.equal(enemyAttackFrame(e,b.time),2);assert.equal(u.hp,hp-(dodge?0:10));}
});
test('an explicitly advancing archer repositions even with an enemy in bow range',async()=>{
 const {createBattle,deploy,stepBattle,commandHero}=await engine,b=createBattle(1);b.nextSpawn=Infinity;deploy(b,'archer',1);const u=b.allies[0];b.enemies.push({...testEnemy(90,.36),lastAttack:100,speed:0});commandHero(b,u.id,'forward');stepBattle(b,.1);assert.ok(u.x>.1);assert.equal(u.action,'marching');assert.equal(b.enemies[0].hp,200);
});


test('early enemy troops can counterattack held melee heroes before dying',async()=>{
 const {createBattle,deploy,stepBattle}=await engine;
 for(const key of ['guanyu','zhangfei'])for(const level of [1,2])for(const seed of [1,42,2026]){
  const b=createBattle(level,seed);deploy(b,key,1);const hero=b.allies[0];
  b.nextSpawn=0;stepBattle(b,.05);const enemy=b.enemies[0];b.nextSpawn=Infinity;
  for(let i=0;i<900&&enemy.hp>0;i++)stepBattle(b,.05);
  assert.ok(enemy.hp<=0,`${key} level ${level} defeats the approaching troop`);
  assert.ok(hero.hp>0&&hero.hp<hero.maxHp,`${key} level ${level} seed ${seed} must exchange blows`);
 }
});

test('later stages add visible cross-lane raiders without advancing the normal wave counter twice',async()=>{
 const {createBattle,stepBattle}=await engine,{STAGES}=await import('../../hero/story.mjs');
 for(const level of [3,6,10]){
  const stage=STAGES[level-1],threshold=Math.max(3,Math.ceil(stage.enemyCount*.35)),b=createBattle(level,42);
  b.spawned=threshold-1;b.nextSpawn=0;stepBattle(b,.1);
  const normal=b.enemies.find(e=>!e.elite&&!e.boss),raider=b.enemies.find(e=>e.elite);
  assert.ok(raider,`level ${level} spawns a raider`);assert.equal(raider.name,'黃巾疾行兵');assert.notEqual(raider.lane,normal.lane);assert.ok(raider.speed>normal.speed);assert.equal(b.spawned,threshold);assert.match(b.notice,/突襲.*換路補位/);assert.match(b.skillNotice.text,/突襲.*疾行兵/);
 }
});

test('all three brothers can deploy together or converge into one lane',async()=>{
 const {createBattle,deploy,moveHero,laneCount}=await engine;
 for(const regroup of [false,true]){const b=createBattle(1);for(const [i,key] of ['liubei','guanyu','zhangfei'].entries()){b.food=300;assert.equal(deploy(b,key,regroup?i:1),true)}
 if(regroup){assert.equal(moveHero(b,'liubei',1),true);assert.equal(moveHero(b,'zhangfei',1),true)}assert.equal(laneCount(b,1),3);assert.deepEqual(b.allies.map(u=>u.key),['liubei','guanyu','zhangfei']);}
});
test('Zhang Liang and Zhang Bao actually spawn at Changshe and retreat without stealing the main duel',async()=>{
 const {createBattle,deploy,stepBattle}=await engine;
 for(const [name,count] of [['張梁',5],['張寶',11]]){const b=createBattle(8);b.spawned=count;b.nextSpawn=0;stepBattle(b,.1);const general=b.enemies.find(e=>e.name===name);assert.ok(general?.support);assert.equal(b.bossSpawned,false);b.nextSpawn=Infinity;b.food=300;deploy(b,'zhangfei',general.lane);general.x=.17;general.hp=1;stepBattle(b,.1);assert.equal(b.duel,null);general.hp=0;stepBattle(b,.1);assert.ok(b.effects.some(e=>e.type==='retreat'&&e.bossName===name));assert.equal(b.over,false)}
});
test('wind and rain telegraph, freeze on pause and can be dodged by changing lanes',async()=>{
 const {createBattle,deploy,stepBattle,moveHero}=await engine;
 for(const name of ['張梁','張寶'])for(const dodge of [false,true]){const b=createBattle(8);b.nextSpawn=Infinity;deploy(b,'archer',1);const u=b.allies[0],hp=u.hp;
 const e={...testEnemy(90,.3),boss:true,support:true,name,hp:500,maxHp:500,lastAttack:100};b.enemies.push(e);stepBattle(b,.1);assert.ok(e.castAt>b.time);assert.equal(u.hp,hp);
 b.paused=true;const frozen=JSON.stringify(b);stepBattle(b,1);assert.equal(JSON.stringify(b),frozen);b.paused=false;if(dodge)moveHero(b,u.id,0);
 for(let i=0;i<26;i++)stepBattle(b,.1);assert.equal(u.hp,hp-(dodge?0:name==='張梁'?12:8));assert.ok(b.effects.some(e=>e.type===(name==='張梁'?'wind':'rain')));if(!dodge)assert.ok(name==='張梁'?u.x<.1:u.slowUntil>b.time);
 }
});

test('main commander breach loses even with two lives, without granting rewards',async()=>{
 const {createBattle,stepBattle,normalizeProgress}=await engine;
 const b=createBattle(1);b.bossSpawned=true;b.enemies=[{id:90,lane:0,x:.024,hp:100,maxHp:100,boss:true,name:'黃巾前哨',lastAttack:0,speed:.02}];
 stepBattle(b,.1);assert.equal(b.lives,2);assert.equal(b.over,true);assert.equal(b.won,false);assert.equal(b.lossReason,'commander-breach');
 const p=normalizeProgress();if(b.won)(await import('../../hero/campaign.mjs')).rewardVictory(p,1);assert.equal(p.completed,0);assert.equal(p.coins,0);
});
test('ordinary and support breaches keep the existing three-life rule',async()=>{
 const {createBattle,stepBattle}=await engine;
 for(const support of [false,true]){const b=createBattle(8);b.nextSpawn=Infinity;b.enemies=[{id:90,lane:0,x:.024,hp:100,maxHp:100,boss:support,support,name:support?'張梁':'黃巾刀賊',lastAttack:0,speed:.02}];stepBattle(b,.1);assert.equal(b.lives,2);assert.equal(b.over,false);assert.equal(b.lossReason,undefined);}
});
test('a defeated commander still wins after an earlier ordinary breach',async()=>{
 const {createBattle,stepBattle}=await engine,b=createBattle(1);b.bossSpawned=true;b.lives=2;b.enemies=[{id:90,lane:1,x:.4,hp:0,maxHp:100,boss:true,name:'黃巾前哨'}];stepBattle(b,.1);assert.equal(b.won,true);
});
test('nine duel matchups have distinct ordered choreography',async()=>{
 const {duelBeats}=await engine,{STAGES}=await import('../../hero/story.mjs');const sequences=STAGES.filter(s=>s.duelHero&&!s.duelPartner).map(s=>duelBeats({bossName:s.bossName,outcome:s.duelOutcome}));
 assert.equal(sequences.length,9);assert.equal(new Set(sequences.map(beats=>JSON.stringify(beats.map(b=>[b.at,b.side,b.damage])))).size,9);
 for(const beats of sequences){assert.ok(beats.every((b,i)=>!i||b.at>beats[i-1].at));assert.equal(beats.filter(b=>b.side==='finish').length,1);assert.ok(Math.abs(beats.filter(b=>b.side!=='finish').reduce((sum,b)=>sum+(b.damage||0),0)-.7)<1e-8);}
});
for(const level of [3,4,5,7,8,9,10])test(`duel ${level} counters hit once at impact, freeze and preserve the intended outcome`,async()=>{
 const {createBattle,deploy,stepBattle,skipDuelEntrance,duelBeats}=await engine,{STAGES}=await import('../../hero/story.mjs');const stage=STAGES[level-1],b=createBattle(level);b.nextSpawn=Infinity;deploy(b,stage.duelHero,1);const hero=b.allies[0];hero.hp=hero.maxHp*.8;
 const boss={id:90,lane:1,x:.17,hp:30,maxHp:stage.bossHp,boss:true,name:stage.bossName};b.enemies=[boss];b.bossSpawned=true;stepBattle(b,.1);assert.ok(b.duel);skipDuelEntrance(b);
 const counter=duelBeats(b.duel).find(x=>x.heroDamage),hp=hero.hp,time=b.time,food=b.food;
 while(b.duel.elapsed+.1<counter.at+.6-1e-8)stepBattle(b,.1);
 assert.equal(hero.hp,hp);b.paused=true;for(let i=0;i<50;i++)stepBattle(b,.1);assert.equal(hero.hp,hp);assert.equal(b.time,time);assert.equal(b.food,food);b.paused=false;
 stepBattle(b,.1);assert.ok(Math.abs(hero.hp-(hp-hero.maxHp*.03))<1e-8);
 for(let i=0;i<3;i++)stepBattle(b,.1);assert.ok(Math.abs(hero.hp-(hp-hero.maxHp*.03))<1e-8);
 while(b.duel)stepBattle(b,.1);assert.ok(Math.abs(hero.hp-(hp-hero.maxHp*.06))<1e-8);assert.equal(boss.hp,0);stepBattle(b,.1);assert.equal(b.won,true);assert.equal(!!b.bossRetreated,level===10);
});
test('scripted duel counters never kill a hero entering with one HP',async()=>{
 const {createBattle,deploy,stepBattle,skipDuelEntrance}=await engine,b=createBattle(5);b.nextSpawn=Infinity;deploy(b,'liubei',1);b.allies[0].hp=1;b.enemies=[{id:90,lane:1,x:.17,hp:30,maxHp:290,boss:true,name:'石魁'}];stepBattle(b,.1);skipDuelEntrance(b);while(b.duel)stepBattle(b,.1);assert.equal(b.allies[0].hp,1);
});

test('cinematic finishers have names, distinct movement and opposing facing directions',async()=>{
 const {duelPose}=await import('../../hero/duel-cinematic.mjs');
 const {duelFinisher}=await import('../../hero/duel-patterns.mjs');
 const {STAGES}=await import('../../hero/story.mjs');
 const traces=[];
 for(const s of STAGES.filter(s=>s.duelHero&&!s.duelPartner)){
  const d={bossName:s.bossName,heroKey:s.duelHero,outcome:s.duelOutcome};
  assert.ok(duelFinisher(d).name.length>6);
  const trace=[];
  for(let t=0;t<19;t+=.05){
   d.elapsed=t;const p=duelPose(d);assert.equal(p.heroFacing,p.hero<p.enemy?1:-1);assert.equal(p.enemyFacing,-p.heroFacing);
   assert.ok(p.hero>=15&&p.hero<=80);assert.ok(p.enemy>=30&&p.enemy<=85);
   assert.deepEqual(duelPose(d),p);trace.push([p.hero,p.enemy,p.lift]);
   const reduced=duelPose(d,true);assert.equal(reduced.shake,0);assert.equal(reduced.lift,0);
  }
  traces.push(JSON.stringify(trace));
 }
 assert.equal(new Set(traces).size,9);
 const back=duelPose({bossName:'程遠志',heroKey:'guanyu',elapsed:13.7});assert.ok(back.hero>back.enemy);assert.equal(back.heroFacing,-1);assert.equal(back.enemyFacing,1);
});
for(const level of [3,4,5,7,8,9,10])test(`finisher ${level} keeps HP through windup, hits in steps and holds impact before exit`,async()=>{
 const {createBattle,deploy,stepBattle,skipDuelEntrance}=await engine;
 const {duelFinisher}=await import('../../hero/duel-patterns.mjs');
 const {duelPose}=await import('../../hero/duel-cinematic.mjs');const {STAGES}=await import('../../hero/story.mjs');
 const s=STAGES[level-1],b=createBattle(level);b.nextSpawn=Infinity;b.bossSpawned=true;deploy(b,s.duelHero,1);
 const boss={id:90,lane:1,x:.17,hp:50,maxHp:300,boss:true,name:s.bossName};b.enemies=[boss];stepBattle(b,.1);skipDuelEntrance(b);
 const f=duelFinisher(b.duel);
 while(b.duel.elapsed<12.6)stepBattle(b,.05);
 assert.ok(Math.abs(boss.hp-35)<1e-6);
 for(const at of f.hits){
  while(b.duel.elapsed+.05<at-1e-8)stepBattle(b,.05);
  const hp=boss.hp;stepBattle(b,.05);assert.ok(boss.hp<hp);assert.ok(boss.hp>0);
  b.paused=true;const frozen=JSON.stringify(b),pose=duelPose(b.duel);for(let i=0;i<10;i++)stepBattle(b,.1);assert.equal(JSON.stringify(b),frozen);assert.deepEqual(duelPose(b.duel),pose);b.paused=false;
 }
 while(b.duel.elapsed+.05<f.finish-1e-8)stepBattle(b,.05);
 assert.ok(boss.hp>0);stepBattle(b,.05);assert.equal(boss.hp,0);assert.equal(duelPose(b.duel).defeat,0);
 while(b.duel)stepBattle(b,.1);
});

for(const fps of [10,30,60])test(`battle speed scales the common simulation clock at ${fps} FPS`,async()=>{
 const {createBattle}=await engine;const {advanceBattleFrame}=await import('../../hero/battle-speed.mjs');
 for(const speed of [1,1.5,2]){
  const b=createBattle(1);b.nextSpawn=Infinity;b.food=0;
  for(let i=0;i<fps;i++)advanceBattleFrame(b,1/fps,speed);
  assert.ok(Math.abs(b.time-.7*speed)<1e-8);assert.ok(Math.abs(b.food-12*.7*speed)<1e-8);
 }
});
test('speed changes take effect immediately, never unpause, and do not advance boss introductions',async()=>{
 const {createBattle}=await engine;const {advanceBattleFrame,normalizeBattleSpeed}=await import('../../hero/battle-speed.mjs');
 const b=createBattle(1);b.nextSpawn=Infinity;advanceBattleFrame(b,.1,1);advanceBattleFrame(b,.1,2);assert.ok(Math.abs(b.time-.21)<1e-8);
 for(const flag of ['paused','introPending']){b[flag]=true;const frozen=JSON.stringify(b);advanceBattleFrame(b,.1,2);assert.equal(JSON.stringify(b),frozen);b[flag]=false}
 for(const bad of [0,3,NaN,Infinity,'bad'])assert.equal(normalizeBattleSpeed(bad),1);
});
test('duels and their entrance keep the original pace at all selected speeds',async()=>{
 const {createBattle,deploy,stepBattle,skipDuelEntrance}=await engine;const {advanceBattleFrame}=await import('../../hero/battle-speed.mjs');
 for(const speed of [1,1.5,2]){
  const b=createBattle(3);b.nextSpawn=Infinity;deploy(b,'zhangfei',1);b.enemies=[{...testEnemy(90,.17),boss:true,name:'鄧茂'}];stepBattle(b,.1);
  const time=b.time,food=b.food;advanceBattleFrame(b,.1,speed);assert.ok(Math.abs(b.duel.entranceElapsed-.0805)<1e-8);
  skipDuelEntrance(b);advanceBattleFrame(b,.1,speed);assert.ok(Math.abs(b.duel.elapsed-.0805)<1e-8);assert.equal(b.time,time);assert.equal(b.food,food);
 }
});
test('2x frame crossing into a duel uses normal speed for the rest of that frame',async()=>{
 const {createBattle,deploy}=await engine;const {advanceBattleFrame}=await import('../../hero/battle-speed.mjs');
 const b=createBattle(3);b.nextSpawn=Infinity;deploy(b,'zhangfei',1);b.enemies=[{...testEnemy(90,.17),boss:true,name:'鄧茂'}];
 advanceBattleFrame(b,.1,2);assert.ok(b.duel);assert.ok(Math.abs(b.duel.entranceElapsed-(.1-.1/1.4)*.805)<1e-8);
});

async function rangedFixture(){
 const {createBattle,deploy}=await engine,b=createBattle(4);b.nextSpawn=Infinity;deploy(b,'liubei',1);
 const hero=b.allies[0];hero.x=.3;hero.order='hold';hero.targetX=.3;
 const archer={id:90,lane:1,x:.55,hp:60,maxHp:60,boss:false,ranged:true,name:'黃巾弓手',damage:8,rate:2.6,speed:.03,lastAttack:-10};b.enemies=[archer];
 return {b,hero,archer};
}
test('enemy archer aims from distance then launches a leftward arrow before applying damage',async()=>{
 const {stepBattle}=await engine,{b,hero,archer}=await rangedFixture(),hp=hero.hp;stepBattle(b,.1);assert.equal(archer.action,'aiming');assert.equal(archer.x,.55);assert.equal(hero.hp,hp);
 for(let i=0;i<6;i++)stepBattle(b,.1);assert.equal(hero.hp,hp);assert.equal(b.projectiles.length,1);const arrow=b.effects.find(e=>e.type==='enemy-arrow');assert.ok(arrow.from>arrow.to);
 for(let i=0;i<4;i++)stepBattle(b,.1);assert.equal(hero.hp,hp-8);
});
test('enemy arrows freeze on pause and can be dodged by changing lanes',async()=>{
 const {stepBattle}=await engine,{b,hero}=await rangedFixture();for(let i=0;i<7;i++)stepBattle(b,.1);const hp=hero.hp;
 b.paused=true;const frozen=JSON.stringify(b);for(let i=0;i<10;i++)stepBattle(b,.1);assert.equal(JSON.stringify(b),frozen);
 b.paused=false;hero.lane=0;for(let i=0;i<5;i++)stepBattle(b,.1);assert.equal(hero.hp,hp);assert.equal(b.projectiles.length,0);
});
test('stunning or defeating an aiming archer cancels unreleased arrows',async()=>{
 const {stepBattle}=await engine;
 for(const kind of ['stun','defeat']){const {b,archer}=await rangedFixture();stepBattle(b,.1);if(kind==='stun')archer.stunnedUntil=b.time+2;else archer.hp=0;for(let i=0;i<10;i++)stepBattle(b,.1);assert.equal(b.projectiles.length,0);assert.ok(!b.effects.some(e=>e.type==='enemy-arrow'));}
});
test('archers appear only from level four and replace a minority of regular enemies',async()=>{
 const {createBattle,stepBattle}=await engine;
 for(let level=1;level<=10;level++){const b=createBattle(level);let ranged=0;for(let n=0;n<6;n++){b.nextSpawn=b.time;b.enemies=[];stepBattle(b,.1);ranged+=b.enemies.filter(e=>e.ranged).length;}assert.equal(ranged,level>=4?1:0);}
});

async function teamFixture(partner=true){
 const e=await engine,b=e.createBattle(6);b.nextSpawn=Infinity;b.bossSpawned=true;e.deploy(b,'guanyu',1);if(partner)e.deploy(b,'zhangfei',2);
 b.enemies=[{id:90,lane:1,x:.17,hp:340,maxHp:340,boss:true,name:'雷烈'}];return {e,b,g:b.allies[0],z:b.allies[1],boss:b.enemies[0]};
}
test('stage six requires two living deployed heroes; partner can join from a different lane',async()=>{
 for(const missing of ['absent','dead']){const {b,e,z}=await teamFixture(missing==='dead');if(z)z.hp=0;e.stepBattle(b,.1);assert.equal(b.duel,null);assert.equal(b.duelSeen,false)}
 const {b,e,g,z}=await teamFixture();e.stepBattle(b,.1);assert.equal(b.duel.format,'two-v-one');assert.equal(b.duel.heroId,g.id);assert.equal(b.duel.partnerId,z.id);assert.notEqual(g.lane,z.lane);
});
test('team counters hit the intended hero once, preserve low HP, and pause freezes both fighters',async()=>{
 for(const low of [false,true]){
 const {b,e,g,z,boss}=await teamFixture();if(low)g.hp=z.hp=1;e.stepBattle(b,.1);e.skipDuelEntrance(b);const gh=g.hp,zh=z.hp,time=b.time,food=b.food;
 while(b.duel.elapsed<4.3-1e-8)e.stepBattle(b,.1);assert.equal(g.hp,gh);assert.equal(z.hp,zh);
 b.paused=true;const saved=JSON.stringify(b);for(let i=0;i<40;i++)e.stepBattle(b,.1);assert.equal(JSON.stringify(b),saved);b.paused=false;
 e.stepBattle(b,.1);assert.ok(Math.abs(g.hp-Math.max(1,gh-g.maxHp*.03))<1e-6);assert.equal(z.hp,zh);
 while(b.duel.elapsed<7.9-1e-8)e.stepBattle(b,.1);assert.equal(z.hp,zh);e.stepBattle(b,.1);assert.ok(Math.abs(z.hp-Math.max(1,zh-z.maxHp*.03))<1e-6);
 while(b.duel)e.stepBattle(b,.1);assert.equal(b.time,time);assert.equal(b.food,food);assert.equal(boss.hp,0);assert.ok(Math.abs(g.hp-Math.max(1,gh-g.maxHp*.03))<1e-6);assert.ok(Math.abs(z.hp-Math.max(1,zh-z.maxHp*.03))<1e-6);
 }
});
test('team finisher hits in steps, holds defeat, clears both pending attacks and resumes three lanes',async()=>{
 const {b,e,g,z,boss}=await teamFixture();e.stepBattle(b,.1);e.skipDuelEntrance(b);const positions=b.allies.map(u=>[u.lane,u.x]);g.pendingStrike=z.pendingStrike={targetId:90,impactAt:0,damage:999};g.pendingCleave=z.pendingCleave={};
 b.enemies.push({id:91,lane:0,x:.85,hp:100,maxHp:100,boss:false,speed:0,damage:0,lastAttack:0});
 while(b.duel.elapsed<11.6-1e-8)e.stepBattle(b,.1);assert.ok(Math.abs(boss.hp-238)<1e-6);
 for(const [at,hp] of [[13,170],[14,102],[15.5,0]]){while(b.duel.elapsed<at-1e-8)e.stepBattle(b,.1);assert.ok(Math.abs(boss.hp-hp)<1e-6)}
 assert.ok(b.duel);while(b.duel)e.stepBattle(b,.1);assert.deepEqual(b.allies.map(u=>[u.lane,u.x]),positions);
 for(const u of [g,z]){assert.equal(u.pendingStrike,null);assert.equal(u.pendingCleave,null)}
 e.stepBattle(b,.1);assert.equal(b.over,false);assert.equal(b.enemies.length,1);assert.equal(b.enemies[0].id,91);assert.equal(b.duel,null);
});
test('team pincer turns both heroes and the boss toward their actual opponent, with deterministic paused poses',async()=>{
 const {teamPose,TEAM_BEATS}=await import('../../hero/team-duel-beats.mjs');assert.ok(TEAM_BEATS.every((b,i)=>!i||b.at>TEAM_BEATS[i-1].at));
 for(let t=0;t<19;t+=.05){const p=teamPose({elapsed:t});assert.deepEqual(teamPose({elapsed:t}),p);for(const key of ['guanyu','zhangfei']){assert.equal(p[key].facing,p[key].x<p.enemy.x?1:-1);assert.ok(p[key].x>=17&&p[key].x<=83)}assert.equal(teamPose({elapsed:t},true).shake,0)}
 const p=teamPose({elapsed:9.7});assert.ok(p.guanyu.x>p.enemy.x);assert.ok(p.zhangfei.x<p.enemy.x);assert.equal(p.guanyu.facing,-1);assert.equal(p.enemy.facing,1);assert.equal(teamPose({elapsed:15.7}).enemy.fallen,false);assert.equal(teamPose({elapsed:16.2}).enemy.fallen,true);
});
