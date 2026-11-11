const {test}=require('node:test'),assert=require('node:assert/strict');
const modules=Promise.all([import('../../hero/engine.mjs'),import('../../hero/story.mjs'),import('../../hero/skills.mjs')]);
function enemy(id=90,x=.3,lane=1){return {id,name:'測試敵兵',lane,x,hp:1000,maxHp:1000,boss:false,damage:0,rate:999,speed:0,lastAttack:999,stunnedUntil:0}}
async function fixture(level,key,rank=0){const [e]=await modules,b=e.createBattle(level,1,{liubei:rank,guanyu:rank,zhangfei:rank});b.nextSpawn=Infinity;b.oathUsed=true;b.food=300;e.deploy(b,key,1);const u=b.allies[0];u.lastAttack=999;return {e,b,u}}
for(const level of [17,18,19,20,21,22])test(`army stage ${level}: all equipment ranks use this army's base stats and only buff normal attacks`,async()=>{
 const [,s]=await modules;const expected=level<20?[[175,19],[205,28],[280,22]]:[[235,28],[215,26],[310,23]];
 for(const [i,key] of ['liubei','guanyu','zhangfei'].entries())for(let rank=0;rank<=3;rank++){
  const {e,b,u}=await fixture(level,key,rank);assert.equal(u.maxHp,expected[i][0]);assert.equal(s.heroesForLevel(level)[key].damage,expected[i][1]);b.enemies=[enemy(90,.15)];u.lastAttack=-10;e.stepBattle(b,.01);assert.equal(b.enemies[0].hp,1000);assert.equal(u.pendingStrike.damage,expected[i][1]+rank*(i===0?3:4));[.1,.1,.04].forEach(dt=>e.stepBattle(b,dt));assert.equal(b.enemies[0].hp,1000-expected[i][1]-rank*(i===0?3:4));
 }
});
for(const level of [17,20])for(const key of ['guanyu','zhangfei'])test(`army ${level} ${key}: own skill power, cooldown, lane limits and pause`,async()=>{
 const {e,b,u}=await fixture(level,key,3),[, ,s]=await modules,skill=s.heroSkill(key,key==='guanyu'?'cleave':'roar',level);b.enemies=[enemy(),enemy(91,.32),enemy(92,.3,0),enemy(93,.6)];
 b.time=skill.cooldown-.02;e.stepBattle(b,.01);assert.equal(u.lastSkill,0);e.stepBattle(b,.02);assert.ok(u.lastSkill>=skill.cooldown);
 if(key==='guanyu'){assert.equal(b.enemies[0].hp,1000);const snapshot=JSON.stringify(b);b.paused=true;e.stepBattle(b,1);b.paused=false;assert.equal(JSON.stringify(b),snapshot);[.1,.1,.04].forEach(dt=>e.stepBattle(b,dt))}
 assert.equal(b.enemies[0].hp,1000-skill.power);assert.equal(b.enemies[1].hp,1000-skill.power);assert.equal(b.enemies[2].hp,1000);assert.equal(b.enemies[3].hp,1000);assert.match(b.skillNotice.text,new RegExp(skill.name));
 if(key==='zhangfei'){assert.ok(b.enemies[0].stunnedUntil>b.time);assert.equal(b.enemies[0].x,.365)}
});
test('Cao Cao heals his lane by 10 and adds 4 food, including a visible notice at full health',async()=>{
 const {e,b,u}=await fixture(17,'liubei');b.allies.push({...u,id:2,key:'archer',lane:0,hp:20,maxHp:100});u.hp=100;b.food=100;b.time=3.99;e.stepBattle(b,.01);assert.equal(u.hp,110);assert.equal(b.allies[1].hp,20);assert.ok(Math.abs(b.food-104.12)<1e-8);assert.equal(b.skillNotice.text,'曹操・整軍號令');
 u.hp=u.maxHp;b.skillNotice=null;b.time=7.99;e.stepBattle(b,.01);assert.equal(b.skillNotice?.text,'曹操・整軍號令');assert.ok(Math.abs(b.food-108.24)<1e-8);
});
test('Sun Jian waits for targets, winds up his own 22 damage strike and never heals or grants food',async()=>{
 const {e,b,u}=await fixture(20,'liubei',3);b.food=100;u.hp=100;b.time=4.99;e.stepBattle(b,.01);assert.equal(u.lastHeal,0,'empty battlefield must not consume an offensive cooldown');
 b.enemies=[enemy(),enemy(91,.3,0)];e.stepBattle(b,.01);assert.ok(u.pendingCleave);assert.equal(b.enemies[0].hp,1000,'damage waits for swing impact');assert.equal(u.hp,100);assert.equal(b.skillNotice,null);const old=b.time;
 b.paused=true;e.stepBattle(b,1);assert.equal(b.time,old);assert.equal(b.enemies[0].hp,1000);b.paused=false;[.1,.1,.04].forEach(dt=>e.stepBattle(b,dt));assert.equal(b.enemies[0].hp,978);assert.equal(b.enemies[1].hp,1000);assert.equal(u.hp,100);assert.ok(Math.abs(b.food-103.12)<1e-8);assert.equal(b.skillNotice.text,'孫堅・虎威奮擊');assert.equal(b.effects.some(x=>x.type==='heal'),false);
});
test('Sun Jian pending skill is cancelled when the unit changes lanes',async()=>{
 const {e,b,u}=await fixture(20,'liubei');b.enemies=[enemy()];b.time=5;e.stepBattle(b,.01);assert.ok(u.pendingCleave);assert.equal(e.moveHero(b,u.id,0),true);[.1,.1,.1].forEach(dt=>e.stepBattle(b,dt));assert.equal(b.enemies[0].hp,1000);
});
test('new army battles copy equipment but never carry old cooldowns, buffs or pending attacks',async()=>{
 const [e,s]=await modules,weapons={liubei:2,guanyu:3,zhangfei:1};
 for(const level of [6,17,20,18,21,3]){const b=e.createBattle(level,1,weapons);assert.deepEqual(b.weapons,weapons);assert.notEqual(b.weapons,weapons);assert.deepEqual(b.cooldowns,{});assert.equal(b.oathUsed,false);assert.equal(b.oathBuffUntil,undefined);e.deploy(b,'liubei',1);assert.equal(b.allies[0].maxHp,s.heroesForLevel(level).liubei.hp);assert.equal(b.allies[0].lastHeal,0);assert.equal(b.allies[0].pendingCleave,undefined)}
});
for(const level of [17,20])test(`army ${level}: shared formation heals 55 once and buffs normal attacks by 20 percent`,async()=>{
 const [e]=await modules,b=e.createBattle(level,1,{liubei:3});b.nextSpawn=Infinity;b.food=1000;for(const [i,k] of ['liubei','guanyu','zhangfei'].entries())e.deploy(b,k,i);for(const u of b.allies)u.hp=50;e.stepBattle(b,.01);assert.ok(b.allies.every(u=>u.hp===105));assert.equal(b.skillNotice.text,'合擊・同袍合陣');assert.equal(b.oathBuffUntil,b.time+5);b.enemies=[enemy(90,.15,0)];e.stepBattle(b,.01);assert.equal(b.allies[0].pendingStrike.damage,((level===17?19:28)+9)*1.2);assert.ok(b.allies.every(u=>u.hp===105));
});
test('Dong army enrages with its own label rather than Yellow Turban magic',async()=>{
 const {e,b}=await fixture(21,'liubei');b.enemies=[{...enemy(90,.7),name:'華雄',boss:true,hp:400,maxHp:1000,nextSkill:999}];e.stepBattle(b,.01);assert.match(b.skillNotice.text,/華雄・破陣狂攻/);assert.doesNotMatch(b.skillNotice.text,/黃天/);
});
