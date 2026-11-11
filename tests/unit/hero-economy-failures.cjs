const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=import('../../hero/engine.mjs'),campaign=import('../../hero/campaign.mjs');
for(const id of ['grain','herb','liubei','guanyu','zhangfei'])test(`failed ${id} purchase changes neither wallet nor inventory, then retry charges once`,async()=>{
 const {normalizeProgress}=await engine,{purchase}=await campaign,p=normalizeProgress({completed:3,coins:500}),before=JSON.stringify(p);
 for(const save of [()=>false,()=>{throw new Error('storage blocked')}]){assert.match(purchase(p,id,save),/保存/);assert.equal(JSON.stringify(p),before)}
 let stored;assert.equal(purchase(p,id,next=>{stored=JSON.stringify(next);return true}),'');assert.equal(stored,JSON.stringify(p));assert.equal(p.coins,500-({grain:20,herb:25}[id]||60));
});
for(const id of ['herb','grain'])test(`failed ${id} consumption has no battle effect and a successful retry persists before use`,async()=>{
 const {normalizeProgress,createBattle,deploy}=await engine,{useSupply}=await campaign,p=normalizeProgress({completed:2,coins:10,inventory:{herb:1,grain:1}}),b=createBattle(1);deploy(b,'liubei',1);b.food=100;b.allies[0].hp=20;
 const before=JSON.stringify({p,b});for(const save of [()=>false,()=>{throw new Error('storage blocked')}]){assert.equal(useSupply(b,p,id,save),false);assert.equal(JSON.stringify({p,b}),before)}
 let stored;assert.equal(useSupply(b,p,id,next=>{stored=JSON.stringify(next);return true}),true);assert.equal(JSON.parse(stored).inventory[id],0);assert.equal(p.inventory[id],0);assert.equal(id==='herb'?b.allies[0].hp:b.food,id==='herb'?80:180);assert.equal(useSupply(b,p,id,()=>true),false);
});
