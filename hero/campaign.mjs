import {LEARNING_LEVELS} from './skill-growth.mjs?v=skill-tiers-1';
import {growthState,selectedTeam,DEFAULT_TEAM,ALL_GENERALS} from './roster.mjs?v=skill-tiers-1';
import {factionFor} from './factions.mjs?v=skill-tiers-1';
import {CAMPAIGN_LENGTH} from './campaign-config.mjs?v=skill-tiers-1';
// Local campaign economy, independent of the original zombie game's account/store.
export const GOODS={
 herb:{name:'行軍藥包',shop:'items',price:25,icon:'✚',description:'戰鬥中使用，所有在場友軍回復 60 生命。'},
 grain:{name:'備用糧袋',shop:'items',price:20,icon:'穀',description:'戰鬥中使用，增加 80 軍糧（上限 300）。'},
 liubei:{name:'雙股劍・精鍛',shop:'weapons',price:60,icon:'雙劍',description:'劉備每次普攻 +3；最多強化三次。'},
 guanyu:{name:'青龍刀・精鍛',shop:'weapons',price:60,icon:'大刀',description:'關羽每次普攻 +4；最多強化三次。'},
 zhangfei:{name:'蛇矛・精鍛',shop:'weapons',price:60,icon:'長矛',description:'張飛每次普攻 +4；最多強化三次。'}
};
const bounded=(value,max)=>Number.isFinite(Number(value))?Math.max(0,Math.min(max,Math.floor(Number(value)))):0;
const ranks=raw=>Object.fromEntries(['liubei','guanyu','zhangfei'].map(k=>[k,bounded(raw?.[k],3)]));
export function weaponsForLevel(progress,level=1){const army=factionFor(level);return army?progress.armyWeapons[army]:progress.weapons}
export function campaignState(raw,completed){
 const legacy=!raw||!Object.hasOwn(raw,'coins');const heroGrowth=growthState(raw?.heroGrowth);if(!raw?.heroGrowth)for(const [i,id] of DEFAULT_TEAM.entries())heroGrowth[id].weapon=ranks(raw?.armyWeapons?.cao)[['liubei','guanyu','zhangfei'][i]];
 return {skillSeen:Array.isArray(raw?.skillSeen)?[...new Set(raw.skillSeen.filter(key=>Object.keys(ALL_GENERALS).some(id=>LEARNING_LEVELS.some(level=>key===id+':'+level))))]:[],heroGrowth,caoTeam:selectedTeam(raw?.caoTeam),battleLanes:[3,4,5].includes(raw?.battleLanes)?raw.battleLanes:3,coins:legacy?completed*80:bounded(raw.coins,99999),rewarded:Array.from({length:completed},(_,i)=>i+1),inventory:{herb:bounded(raw?.inventory?.herb,9),grain:bounded(raw?.inventory?.grain,9)},weapons:ranks(raw?.weapons),armyWeapons:{cao:ranks(raw?.armyWeapons?.cao),sun:ranks(raw?.armyWeapons?.sun)}};
}
export function rewardVictory(progress,level){
 if(!Number.isInteger(level)||level<1||level>CAMPAIGN_LENGTH)return 0;
 const fresh=level>progress.completed;
 progress.completed=Math.max(progress.completed,level);
 // First clear only: replay, reload and repeated result rendering cannot farm rewards.
 if(!fresh)return 0;
 const reward=80;progress.coins=Math.min(99999,progress.coins+reward);progress.rewarded=Array.from({length:progress.completed},(_,i)=>i+1);return reward;
}
// A caller may require durable storage before accepting an economy change.
function persist(progress,save){try{return !save||save(progress)!==false}catch{return false}}
export function purchase(progress,id,save,level=1){
 const item=Object.hasOwn(GOODS,id)?GOODS[id]:null;if(!item)return '找不到這件商品。';
 const weapons=weaponsForLevel(progress,level),weapon=item.shop==='weapons',owned=weapon?weapons[id]:progress.inventory[id],cap=weapon?3:9;
 if(owned>=cap)return weapon?'這件兵器已強化到最高級。':'行囊已裝滿這種道具。';
 const price=item.price*(weapon?owned+1:1);if(progress.coins<price)return '軍資不足，先去完成新的關卡吧。';
 progress.coins-=price;if(weapon)weapons[id]++;else progress.inventory[id]++;
 if(!persist(progress,save)){progress.coins+=price;if(weapon)weapons[id]--;else progress.inventory[id]--;return '無法保存，這次未購買；軍資與物品未變動，請稍後再試。'}
 return '';
}
export function weaponBonus(key,rank){return Math.max(0,Math.min(3,rank||0))*(key==='liubei'?3:4)}
export function useSupply(battle,progress,id,save){
 if(!battle||battle.over||battle.paused||battle.duel||battle.introPending)return false;
 if(!['herb','grain'].includes(id)||!progress.inventory[id])return false;
 if(id==='herb'&&!battle.allies.some(u=>u.hp>0&&u.hp<u.maxHp)||id==='grain'&&battle.food>=300)return false;
 progress.inventory[id]--;
 if(!persist(progress,save)){progress.inventory[id]++;return false}
 if(id==='herb'){for(const u of battle.allies)if(u.hp>0)u.hp=Math.min(u.maxHp,u.hp+60)}
 else battle.food=Math.min(300,battle.food+80);
 battle.notice=id==='herb'?'行軍藥包：全軍回復！':'備用糧袋：軍糧補充！';battle.noticeUntil=battle.time+3;return true;
}
