import {LEVEL_XP,heroLevel} from './roster.mjs?v=chapter-sixteen-2';
export const EXPERIENCE_DURATION=3200;
const mix=(a,b,p)=>a+(b-a)*Math.max(0,Math.min(1,p));
// Presentation only. The campaign has already awarded and saved the final XP.
export function experienceFrame(from,to,elapsed){
 const oldLevel=heroLevel(from),newLevel=heroLevel(to),up=newLevel>oldLevel,boundary=up?LEVEL_XP[oldLevel]:to;
 let value=up?(elapsed<1550?mix(from,boundary,elapsed/1300):mix(boundary,to,(elapsed-2200)/600)):mix(from,to,elapsed/1300);
 value=Math.min(to,Math.floor(value+1e-7));const level=up&&elapsed<1550?oldLevel:heroLevel(value),base=LEVEL_XP[level-1],cap=LEVEL_XP[level]??810,max=level===10;
 return {value,level,within:max?0:value-base,needed:max?0:cap-base,fraction:max?1:Math.min(1,(value-base)/(cap-base)),celebrate:up&&elapsed>=1550,justLeveled:up&&elapsed>=1550&&elapsed<2200,max};
}
