import {FACTIONS,BLANK_PORTRAIT} from './factions.mjs?v=roster-chapters-1';
export const SLOTS=['liubei','guanyu','zhangfei','hero4','hero5'];
export const DEFAULT_TEAM=['caocao','xiahoudun','caohong'];
const skill=(id,name,text,mp,cooldown,level=1)=>({id,name,text,mp,cooldown,level});
const extra=(name,row,stats,weapon)=>({name,short:name,faction:'cao',asset:BLANK_PORTRAIT,atlas:'./assets/factions/cao-reinforcements.png',row,cost:100,speed:.043,cooldown:5,...stats,weapon});
export const GENERALS={
 caocao:{...FACTIONS.cao.heroes.liubei,cost:90,speed:.043,cooldown:5,role:'補給',passive:'軍糧小幫手：在場每 5 秒補充 4 軍糧。',skills:[skill('heal','整軍號令','同路友軍回復 35 生命。',20,8),skill('supply','整備再戰','補充 60 軍糧，全隊回復 15 生命。',40,18,3)]},
 xiahoudun:{...FACTIONS.cao.heroes.guanyu,cost:100,speed:.05,cooldown:5,role:'穿擊',passive:'勇猛：普通攻擊額外 +2 傷害。',skills:[skill('pierce','奮槍突進','穿擊同路前方近處敵人，各造成 45 傷害。',20,8),skill('sweep','破陣長槍','同路前方近處敵人各受 65 傷害，暈眩 2 秒。',40,18,3)]},
 caohong:{...FACTIONS.cao.heroes.zhangfei,cost:110,speed:.04,cooldown:6,role:'擊退',passive:'護衛體魄：生命上限額外 +25。',skills:[skill('push','捨身斷後','同路近敵受到 20 傷害並暈眩 1 秒；小兵被推回。',20,8),skill('escape','護軍撤離','同路友軍獲得 45 護盾，持續 6 秒。',40,18,3)]},
 caoren:{...extra('曹仁',0,{hp:290,damage:20,range:.08},'劍盾／近戰'),rate:1.4,role:'守護',passive:'堅守：生命上限額外 +35。',skills:[skill('shield','堅城護軍','同路友軍獲得 35 護盾，持續 6 秒。',20,8),skill('fort','不動堅陣','全隊獲得 45 護盾，持續 6 秒。',40,18,3)]},
 xiahouyuan:{...extra('夏侯淵',1,{hp:155,damage:22,range:.31},'弓箭／遠程'),rate:1.2,ranged:true,role:'遠射',passive:'鷹眼：射程比普通弓兵更遠。',skills:[skill('volley','疾風連射','射擊同路射程內最近敵人，造成 60 傷害。',20,8),skill('rain','箭雨支援','射程內同路敵人各受到 45 傷害。',40,18,3)]},
 yujin:{...extra('于禁',2,{hp:230,damage:23,range:.11},'槍盾／近戰'),rate:1.3,role:'阻擋',passive:'紀律：每秒恢復 4 MP，比其他武將快。',skills:[skill('halt','列陣止步','同路近敵各受 15 傷害，停步 2 秒。',20,8),skill('lock','整軍固守','同路近敵停步 3 秒，同路友軍獲得 30 護盾。',40,18,3)]}
};
for(const g of Object.values(GENERALS))g.description=g.role+' · '+g.skills[0].text;
export const LEVEL_XP=[0,30,75,135,210,300,405,525,660,810];
export const heroLevel=xp=>1+LEVEL_XP.slice(1).filter(n=>xp>=n).length;
const number=(v,max)=>Number.isFinite(Number(v))?Math.max(0,Math.min(max,Math.floor(Number(v)))):0;
export function growthState(raw){return Object.fromEntries(Object.keys(GENERALS).map(id=>[id,{xp:number(raw?.[id]?.xp,810),weapon:number(raw?.[id]?.weapon,3)}]))}
export function validTeam(team){return Array.isArray(team)&&team.length>=3&&team.length<=5&&new Set(team).size===team.length&&team.every(id=>Object.hasOwn(GENERALS,id))}
export function selectedTeam(raw){return validTeam(raw)?[...raw]:[...DEFAULT_TEAM]}
export function rosterFor(team,growth){return Object.fromEntries(SLOTS.slice(0,team.length).map((slot,i)=>{const id=team[i],g=GENERALS[id],level=heroLevel(growth[id].xp);return [slot,{...g,heroId:id,heroLevel:level,hp:g.hp+(level-1)*5+(id==='caoren'?35:id==='caohong'?25:0),damage:g.damage+(level-1)+(id==='xiahoudun'?2:0),heal:undefined}]}))}
export function configureRoster(b,progress,archer){b.heroMode=true;b.laneTotal=Math.min(maxLanes(b.level),[3,4,5].includes(progress.battleLanes)?progress.battleLanes:3);b.team=selectedTeam(progress.caoTeam).slice(0,b.laneTotal);for(const id of Object.keys(GENERALS))if(b.team.length<b.laneTotal&&!b.team.includes(id))b.team.push(id);b.roster={...rosterFor(b.team,progress.heroGrowth),archer,...TROOPS};b.weapons=Object.fromEntries(SLOTS.slice(0,b.team.length).map((key,i)=>[key,progress.heroGrowth[b.team[i]].weapon]));b.participants=[];b.heroResources={};return b}
export function awardExperience(progress,b){if(!b.heroMode||b.experienceAwarded)return [];b.experienceAwarded=true;if(!b.won&&b.time<10)return [];return (b.participants||[]).map(id=>{const hero=progress.heroGrowth[id],before=heroLevel(hero.xp),amount=Math.min(b.won?20:5,810-hero.xp);hero.xp+=amount;return {id,amount,before,level:heroLevel(hero.xp)}})}
export function buyHeroWeapon(progress,id,save){if(!Object.hasOwn(GENERALS,id))return '找不到武將';const h=progress.heroGrowth[id];if(h.weapon>=3)return '已強化到最高級';const price=(h.weapon+1)*60;if(progress.coins<price)return '軍資不足';progress.coins-=price;h.weapon++;const oldKey=SLOTS[DEFAULT_TEAM.indexOf(id)],oldRank=oldKey?progress.armyWeapons.cao[oldKey]:null;if(oldKey)progress.armyWeapons.cao[oldKey]=h.weapon;let ok=false;try{ok=save(progress)!==false}catch{}if(!ok){progress.coins+=price;h.weapon--;if(oldKey)progress.armyWeapons.cao[oldKey]=oldRank;return '無法保存，這次未購買；軍資與強化未變動。'}return ''}
export const TROOPS={
 shield:{name:'盾兵',short:'盾兵',cost:65,hp:200,damage:8,rate:1.5,range:.07,speed:.03,cooldown:4,description:'盾牆：耐打，替後排擋敵人。',weapon:'刀盾／近戰',asset:'./assets/yellow-turban-shield.png',troop:true},
 sword:{name:'刀兵',short:'刀兵',cost:45,hp:100,damage:19,rate:1.1,range:.08,speed:.05,cooldown:3,description:'近戰：便宜、出手快。',weapon:'刀／近戰',asset:'./assets/yellow-turban-raider.png',troop:true},
 ambush:{name:'伏兵',short:'伏兵',cost:75,hp:85,damage:14,rate:1.2,range:.09,speed:.05,cooldown:6,description:'伏擊：第一次普攻額外 +35 傷害。',weapon:'短刀／近戰',asset:'./assets/yellow-turban-raider.png',troop:true}
};
export const maxLanes=level=>level>=47?5:level>=35?4:3;

for(const [row,g] of Object.values(TROOPS).entries()){g.asset=BLANK_PORTRAIT;g.atlas='./assets/factions/cao-troops.png';g.row=row}
