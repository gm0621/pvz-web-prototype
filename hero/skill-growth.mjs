// Fictional gameplay techniques, not claims about historical deeds.
export const LEARNING_LEVELS=[1,3,5,7,10];
const passive=(name,text,bonus,level)=>({name,text,bonus,level,type:'passive'});
const master=(name,text,effects)=>({id:'master',name,text,effects,level:7,mp:50,cooldown:24,type:'active'});
export const ADVANCED_GROWTH={
 liubei:[passive('醫者仁心','主動治療技每人額外回復 10 生命。',{healBonus:10},5),master('仁德濟世','全隊回復 55 生命，獲得 25 護盾，持續 6 秒。',{allies:'all',heal:55,shield:25}),passive('仁德長存','主動治療另給 20 護盾，持續 6 秒；護盾取較高值，不疊加。',{healShield:20},10)],
 guanyu:[passive('凝神蓄勢','主動攻擊技每個目標額外受到 10 傷害。',{skillDamage:10},5),master('青龍斷陣','同路前方近敵各受 95 傷害，暈眩 1 秒。',{damage:95,stun:1}),passive('義勇無雙','普攻再加 5，主動攻擊技每個目標再加 15 傷害。',{damage:5,skillDamage:15},10)],
 zhangfei:[passive('不退勇氣','戰場受擊每次少 3 傷害，至少受 1；不影響單挑。',{damageReduction:3},5),master('燕人震陣','同路近敵受 55 傷害、暈眩 2 秒；推退小兵，同路友軍獲得 30 護盾／6 秒。',{damage:55,stun:2,push:.08,shield:30}),passive('勇戰不屈','生命上限再加 30，在場每 5 秒自己回復 8 生命。',{hp:30,selfRegen:8},10)],
 caocao:[passive('屯糧有方','在場每 5 秒補糧額外增加 4，合計 8 軍糧。',{foodBonus:4},5),master('雄略軍令','補充 80 軍糧；全隊回復 30 生命、獲得 25 護盾／6 秒。',{allies:'all',food:80,heal:30,shield:25}),passive('眾志成城','主動治療另給 15 護盾／6 秒；護盾取較高值，不疊加。',{healShield:15},10)],
 xiahoudun:[passive('奮戰先鋒','普通攻擊額外增加 4 傷害。',{damage:4},5),master('烈槍突陣','同路前方近敵各受 90 傷害、暈眩 2 秒；自己獲得 20 護盾／6 秒。',{damage:90,stun:2,allies:'self',shield:20}),passive('破陣鋒芒','主動攻擊每個目標額外受 15 傷害，所有主動技冷卻減 2 秒。',{skillDamage:15,cooldownReduction:2},10)],
 caohong:[passive('護軍之志','主動技給予的護盾額外增加 10。',{shieldBonus:10},5),master('血戰護軍','同路近敵受 40 傷害、暈眩 2 秒；推退小兵，同路友軍獲得 65 護盾／6 秒。',{damage:40,stun:2,push:.08,shield:65}),passive('捨身守望','戰場受擊每次少 3 傷害（至少 1，不含單挑）；主動護盾再加 10。',{damageReduction:3,shieldBonus:10},10)],
 caoren:[passive('堅壁守軍','戰場受擊每次少 3 傷害，至少受 1；不影響單挑。',{damageReduction:3},5),master('八方守禦','全隊回復 15 生命，獲得 75 護盾，持續 6 秒。',{allies:'all',heal:15,shield:75}),passive('固若金湯','主動護盾額外增加 15，持續時間延長 2 秒。',{shieldBonus:15,shieldDuration:2},10)],
 xiahouyuan:[passive('快弦連發','普通攻擊間隔縮短 0.15 秒。',{rateReduction:.15},5),master('穿雲連矢','射程內同路最近敵人受到 120 傷害，暈眩 2 秒。',{damage:120,stun:2,nearest:true}),passive('神射破軍','主動攻擊技每個目標額外受到 20 傷害。',{skillDamage:20},10)],
 yujin:[passive('嚴整號令','所有主動技能冷卻縮短 1 秒。',{cooldownReduction:1},5),master('鐵律封陣','同路近敵各受 35 傷害、停步 4 秒；同路友軍獲得 45 護盾／6 秒。',{damage:35,stun:4,shield:45}),passive('軍紀如山','主動護盾額外增加 15；戰場受擊每次少 2 傷害（至少 1，不含單挑）。',{shieldBonus:15,damageReduction:2},10)],
 sunjian:[passive('虎膽先登','生命上限額外增加 25，普通攻擊額外增加 3 傷害。',{hp:25,damage:3},5),master('猛虎裂陣','同路近敵各受 100 傷害，推退小兵；自己獲得 30 護盾／6 秒。',{damage:100,push:.08,allies:'self',shield:30}),passive('猛虎威勢','主動攻擊每個目標額外受 15 傷害；戰場受擊少 2（至少 1，不含單挑）。',{skillDamage:15,damageReduction:2},10)],
 chengpu:[passive('熟習兵法','所有主動技能冷卻縮短 1 秒。',{cooldownReduction:1},5),master('鐵脊連環','同路近敵各受 55 傷害、停步 3 秒；同路友軍獲得 45 護盾／6 秒。',{damage:55,stun:3,shield:45}),passive('護陣老將','主動護盾額外增加 15，MP 每秒再回復 1，合計每秒 5。',{shieldBonus:15,mpRegen:1},10)],
 huanggai:[passive('護軍老練','主動技給予的護盾額外增加 10。',{shieldBonus:10},5),master('鐵壁護援','同路近敵各受 30 傷害並推退小兵；全隊獲得 65 護盾／6 秒。',{damage:30,push:.08,allies:'all',shield:65}),passive('百戰堅心','戰場受擊每次少 4（至少 1，不含單挑），在場每 5 秒自己回復 5 生命。',{damageReduction:4,selfRegen:5},10)]
};
export function growthBonuses(g,level){const result={};for(const p of g.passives||[])if(p.level<=level)for(const [key,n] of Object.entries(p.bonus||{}))result[key]=(result[key]||0)+n;return result}
export function learningLevels(g){return [...new Set([...g.skills,...(g.passives||[])].map(s=>s.level))].sort((a,b)=>a-b)}
export function activeText(g,skill,level){const b=growthBonuses(g,level);let text=skill.text;
 if(b.skillDamage)text=text.replace(/(\d+) 傷害/,(_,n)=>`${Number(n)+b.skillDamage} 傷害`);
 if(b.healBonus)text=text.replace(/(\d+) 生命/,(_,n)=>`${Number(n)+b.healBonus} 生命`);
 if(b.shieldBonus)text=text.replace(/(\d+) 護盾/,(_,n)=>`${Number(n)+b.shieldBonus} 護盾`);
 if(b.shieldDuration)text=text.replace(/6 秒/g,`${6+b.shieldDuration} 秒`);
 if(b.healShield&&['heal','rally','supply'].includes(skill.id))text+=` 受治療者另獲 ${b.healShield+(b.shieldBonus||0)} 護盾／${6+(b.shieldDuration||0)} 秒。`;
 return text;
}
