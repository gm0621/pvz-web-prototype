import {FACTION_SKILLS,factionFor} from './factions.mjs?v=chapter-nine-1';
// Per-hero entries keep future techniques separate from deployment and shop data.
export const HERO_SKILLS={
 liubei:[{id:'heal',name:'仁德回春',level:2,cooldown:3,power:13,text:'定時回復同路友軍。'}],
 guanyu:[{id:'cleave',name:'青龍斬',level:4,cooldown:7,power:45,text:'揮刀斬擊前方多名敵人。'}],
 zhangfei:[{id:'roar',name:'燕人怒吼',level:3,cooldown:8,power:16,text:'震退附近敵兵，短暫打斷進攻。'}]
};
export const heroSkill=(key,id,level=1)=>(FACTION_SKILLS[factionFor(level)]?.[key]||HERO_SKILLS[key])?.find(s=>s.id===id);
