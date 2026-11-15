// Battle-local tactics: no progress writes, wall clocks, or scripted-outcome changes.
export const ARMY_STYLE={
 shu:{name:'劉備軍・同袍',text:'救援護盾更強；單挑後回復同袍士氣。',rate:1},
 cao:{name:'曹操軍・謀略',text:'軍略累積較快；伏兵持續更久，適合先布陣再接敵。',rate:1.4},
 sun:{name:'孫堅軍・破陣',text:'擊破敵軍與突破前線鼓舞士氣；全軍突擊持續更久。',rate:1}
};
export const SIGNATURES={liubei:'仁德：施技護住最危急的同袍。',guanyu:'武聖：施技標記破綻，後續傷害提高。',zhangfei:'威震：施技打斷近敵的普通蓄力攻擊。',caocao:'號令：施技補充軍略，調度下一次戰術。',xiahoudun:'先鋒：施技獲得短暫護盾，承受前線反擊。',caohong:'救主：施技護住最危急的同袍。',caoren:'堅守：施技加固同路友軍。',xiahouyuan:'疾射：施技壓制最靠近城門的同路敵兵。',yujin:'軍紀：施技打斷近敵普通蓄力，穩住陣線。',sunjian:'猛虎：施技鼓舞軍勢，加快下次全軍突擊。',chengpu:'宿將：施技掩護其他路最危急的同袍。',huanggai:'破甲：施技標記近敵弱點，方便全軍集中攻擊。'};
export const TACTICS=[{id:'rescue',name:'同袍救援',cost:35,text:'所選路友軍獲護盾 6 秒；劉備軍護盾更強。'},{id:'ambush',name:'設伏誘敵',cost:40,text:'所選路前方埋伏；敵軍進入後暈眩並弱化，曹操軍伏兵更持久。'},{id:'charge',name:'全軍突擊',cost:60,text:'全軍傷害提高 20%；孫堅軍持續 8 秒，其餘 5 秒。保持手動調動命令。'}];
export function doctrine(b){return b.armyDoctrine??=( {army:b.sunMode?'sun':b.peachMode?'shu':'cao',points:40,ready:0,traps:[],breakthrough:[],chargeUntil:0} )}
const shield=(b,u,n)=>{u.shield=Math.max(u.shield||0,n);u.shieldUntil=Math.max(u.shieldUntil||0,b.time+6)};
const living=b=>b.allies.filter(u=>u.hp>0);
export function useTactic(b,id,lane){
 if(!b?.heroMode||b.over||b.paused||b.duel||b.introPending)return false;
 const s=TACTICS.find(s=>s.id===id),d=doctrine(b),allies=living(b);if(!s||!Number.isInteger(lane)||lane<0||lane>=(b.laneTotal||3)||d.points<s.cost||b.time<d.ready)return false;
 const same=allies.filter(u=>u.lane===lane);if(!(id==='charge'?allies.length:same.length))return false;
 if(id==='ambush'&&d.traps.some(t=>t.lane===lane&&t.until>b.time))return false;
 if(id==='rescue')for(const u of same)shield(b,u,d.army==='shu'?55:35);
 if(id==='ambush'){const front=Math.max(...same.map(u=>u.x));d.traps.push({lane,x:Math.min(.88,front+.16),until:b.time+(d.army==='cao'?14:9)});}
 if(id==='charge')d.chargeUntil=b.time+(d.army==='sun'?8:5);
 d.points-=s.cost;d.ready=b.time+8;b.notice=s.name+'！'+s.text;b.noticeUntil=b.time+3;return true;
}
export function stepDoctrine(b,dt){
 if(!b.heroMode)return;const d=doctrine(b);d.points=Math.min(100,d.points+dt*ARMY_STYLE[d.army].rate);
 for(const e of b.enemies)if(e.hp<=0&&!e.escaped&&!e.doctrineCounted){e.doctrineCounted=true;d.points=Math.min(100,d.points+(d.army==='sun'?6:3))}
 for(const t of d.traps)if(t.until>b.time){const targets=b.enemies.filter(e=>e.hp>0&&e.lane===t.lane&&e.x<=t.x);if(targets.length){for(const e of targets){e.stunnedUntil=Math.max(e.stunnedUntil||0,b.time+1.5);e.tacticWeakenUntil=b.time+6;}t.until=0;b.notice='伏兵發動！此路敵軍攻勢削弱 6 秒。';b.noticeUntil=b.time+3}}
 d.traps=d.traps.filter(t=>t.until>b.time);
 if(d.army==='sun')for(const u of living(b))if(u.heroId&&u.x>=.65&&!d.breakthrough.includes(u.lane)){d.breakthrough.push(u.lane);d.points=Math.min(100,d.points+15);for(const ally of living(b).filter(a=>a.lane!==u.lane))shield(b,ally,20);b.notice='突破前線！其他路獲得掩護，士氣 +15。';b.noticeUntil=b.time+3;}
}
export function duelDoctrine(b){if(!b.heroMode)return;const d=doctrine(b);d.points=Math.min(100,d.points+(d.army==='shu'?30:20));if(d.army==='shu')for(const u of living(b))shield(b,u,25)}
export function signature(b,u,d,near){
 const id=d.heroId,army=doctrine(b),allies=living(b),weakest=xs=>[...xs].sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];
 if(['liubei','caohong','chengpu'].includes(id)){const target=weakest(allies.filter(a=>id!=='chengpu'||a.lane!==u.lane));if(target)shield(b,target,id==='liubei'?20:25)}
 if(['guanyu','huanggai'].includes(id))for(const e of near)e.exposedUntil=b.time+4;
 if(['zhangfei','yujin'].includes(id))for(const e of near)if(!e.boss){e.pendingStrike=null;e.lastAttack=b.time;e.stunnedUntil=Math.max(e.stunnedUntil||0,b.time+1)}
 if(['caocao','sunjian'].includes(id))army.points=Math.min(100,army.points+8);
 if(id==='xiahoudun')shield(b,u,25);
 if(id==='caoren')for(const a of allies.filter(a=>a.lane===u.lane))shield(b,a,25);
 if(id==='xiahouyuan'){const e=[...near].filter(e=>!e.boss).sort((a,c)=>a.x-c.x)[0];if(e)e.stunnedUntil=Math.max(e.stunnedUntil||0,b.time+1.5)}
}
