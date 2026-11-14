export const passiveName=p=>p.level===1?p.text.split('：')[0]:p.name;
export const learnedPassives=d=>(d.passives||[]).filter(p=>p.level<=d.heroLevel);
export function passiveLabel(d,key,fallback){return learnedPassives(d).filter(p=>p.bonus?.[key]).map(passiveName).join('、')||fallback}
// One small notice per general, throttled by battle time. No audio or modal.
export function passiveCue(b,u,text,kind='ready'){
 if(!u?.heroId)return;const last=u.passiveFeedbackAt?.[kind]??-100;
 if(b.time-last<3||(u.passiveNotice?.kind!=='ready'&&kind!=='boost'&&b.time-(u.passiveNotice?.at??-100)<.65))return;
 u.passiveFeedbackAt??={};u.passiveFeedbackAt[kind]=b.time;u.passiveNotice={text,kind,at:b.time};
}
export function tickPassives(b,u,d,dt){
 const r=b.heroResources[d.heroId],fast=['yujin','chengpu'].includes(d.heroId),beforeMP=r.mp;
 r.mp=Math.min(60,r.mp+dt*((fast?4:3)+(d.mpRegen||0)));
 if((fast||d.mpRegen)&&r.mp>beforeMP&&b.time-(u.passiveFeedbackAt?.mp??-100)>=5)passiveCue(b,u,`${d.mpRegen?passiveLabel(d,'mpRegen','回氣'):d.passive.split('：')[0]} · MP 回復加快`,'mp');
 if(d.selfRegen&&b.time>=u.regenAt){const gain=Math.min(u.maxHp-u.hp,d.selfRegen);u.hp=Math.min(u.maxHp,u.hp+d.selfRegen);if(gain>.001)passiveCue(b,u,`${passiveLabel(d,'selfRegen','回復')} · 回復 ${Number(gain.toFixed(2))}`,'heal');u.regenAt=b.time+5}
 if(d.heroId==='liubei'&&b.time>=u.passiveAt){let healed=0;for(const a of b.allies)if(a.hp>0&&a.lane===u.lane){healed+=Math.min(a.maxHp-a.hp,5);a.hp=Math.min(a.maxHp,a.hp+5)}if(healed>.001)passiveCue(b,u,`仁心 · 同路回復 ${Number(healed.toFixed(2))}`,'heal');u.passiveAt=b.time+5}
 if(d.heroId==='caocao'&&b.time>=u.passiveAt){const gain=Math.min(300-b.food,4+(d.foodBonus||0));b.food=Math.min(300,b.food+4+(d.foodBonus||0));if(gain>.001)passiveCue(b,u,`${d.foodBonus?'屯糧有方':'軍糧小幫手'} · 軍糧 +${Number(gain.toFixed(1))}`,'food');u.passiveAt=b.time+5}
}
export function passiveSnapshot(b){return {allies:b.allies.map(a=>({id:a.id,hp:a.hp,shield:a.shield||0,until:a.shieldUntil||0})),enemies:b.enemies.map(e=>({id:e.id,hp:e.hp}))}}
export function castPassiveFeedback(b,u,d,s,before){
 const healing=before.allies.some(a=>{const n=b.allies.find(x=>x.id===a.id),base=s.effects?.heal||(s.id==='supply'?15:35);return n&&n.hp>a.hp&&n.maxHp-a.hp>base}),shield=before.allies.some(a=>(b.allies.find(x=>x.id===a.id)?.shield||0)>a.shield),duration=before.allies.some(a=>(b.allies.find(x=>x.id===a.id)?.shieldUntil||0)>a.until),damage=before.enemies.some(e=>(b.enemies.find(x=>x.id===e.id)?.hp??e.hp)<e.hp);
 const keys=[...(healing?['healBonus']:[]),...(shield?['shieldBonus',...((d.healShield>(s.effects?.shield||0)&&(s.effects?.heal||['heal','rally','supply'].includes(s.id)))?['healShield']:[])]:[]),...(duration?['shieldDuration']:[]),...(damage?['skillDamage']:[]),'cooldownReduction'];
 const names=learnedPassives(d).filter(p=>keys.some(k=>p.bonus?.[k])).map(passiveName);
 if(names.length)passiveCue(b,u,`${names[0]}${names.length>1?'等 '+names.length+' 項':''} · 招式強化`,'boost');
}
