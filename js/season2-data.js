let currentSeason=1;
// Only the six accepted first-stage units are combat-ready. Guide identities stay stable.
const SEASON2_UNIT_ORDER={plants:['s2Tuntian','s2Crossbow','s2Shield'],zombies:['s2Rat','s2Nail','s2Coffin']};
const SEASON2_GUIDE_KEYS={s2Tuntian:'tuntian-soldier',s2Crossbow:'crossbow-soldier',s2Shield:'shield-soldier',s2Rat:'rat-fang',s2Nail:'rot-nail-crossbow',s2Coffin:'coffin-shield'};
const SEASON2_UNITS={
 plants:{
  s2Tuntian:{name:'屯田兵',cost:50,emoji:'🌾',hp:125,produce:25,rate:8500,cooldown:4200,desc:'屯田積穀：連續 8 秒未受傷，下次補給多 15 軍糧。'},
  s2Crossbow:{name:'強弩兵',cost:100,emoji:'🏹',hp:160,damage:32,rate:2000,range:9,cooldown:4800,desc:'校射：連續射擊同一目標，每次傷害提高 20%，最多 60%；換目標歸零。'},
  s2Shield:{name:'大盾兵',cost:75,emoji:'🛡️',hp:470,damage:14,rate:1400,range:.8,cooldown:7000,clearRequired:1,desc:'列盾：脫離交戰 4 秒後架盾，正面傷害減少 40%；近戰接敵後收盾。'}
 },
 zombies:{
  s2Rat:{name:'鼠牙群屍',cost:45,emoji:'🧟',hp:135,damage:16,rate:750,speed:.015,range:.75,cooldown:2900,desc:'群牙撕咬：同伴一起攻擊同一守軍時傷害 +25%，不隨數量無限疊加。'},
  s2Nail:{name:'腐釘弩屍',cost:100,emoji:'🎯',hp:150,damage:15,rate:2200,speed:.011,range:4.8,cooldown:6000,desc:'釘骨留傷：射中留下骨釘，友軍近戰消耗追加 20 傷害；最多 2 枚、維持 5 秒。20% 機率雙釘齊發。'},
  s2Coffin:{name:'棺盾小屍',cost:90,emoji:'⚰️',hp:260,damage:18,rate:1100,speed:.010,range:.75,cooldown:6500,shieldHp:140,clearRequired:1,desc:'棺板掩護：獨立 140 耐久盾牌吸收 60% 普通直射傷害，也能掩護緊鄰後方友軍；盾破不重生。'}
 }
};
for(const side of ['plants','zombies'])for(const [key,d] of Object.entries(SEASON2_UNITS[side])){
 d.season=2;d.asset=`assets/characters/${side==='plants'?'future-generals/wei-season2':'zombie-army/season2'}/${SEASON2_GUIDE_KEYS[key]}.webp`;
 Object.assign(side==='plants'?PLANT_TYPES:ZOMBIE_TYPES,{[key]:d});
}
const SEASON2_LEVELS={1:{level:1,name:'第二季・霜土前哨',shortName:'霜土前哨',theme:'night',nightMode:false,difficulty:'入門',cardArt:'assets/backgrounds/season2/s2-01.webp',cardText:'霜土上屍群開始試探。先建立屯田補給，讓強弩兵分路校射；最後擊退持棺盾的領隊。',plantHint:'先種屯田兵，再補各路強弩；棺盾领隊最後單獨登場。',zombieHint:'鼠牙群屍集中一路，腐釘弩屍先留下骨釘，再由近戰接手。',plantStart:325,zombieStart:260,plantAI:180,zombieAI:240,plantIncome:25,zombieIncome:40,plantAIIncome:25,zombieAIIncome:35,incomeMin:5500,incomeMax:6500,firstZombieDelay:12000,openingZombies:['s2Rat','s2Rat','s2Rat','s2Nail'],openingSpacing:8500,minSpawnSpacing:6000,enemyCount:14,zombieWeights:['s2Rat','s2Rat','s2Rat','s2Nail'],bossType:'s2Coffin',bossHpMultiplier:1.5,plantAIMin:6000,plantAIMax:8500,zombieAIMin:8000,zombieAIMax:11000,attackTimeLimit:180000}};
function campaignLevels(season=currentSeason){return season===2?SEASON2_LEVELS:LEVELS}
function allCharacterKeys(side){return [...UNIT_ORDER[side],...SEASON2_UNIT_ORDER[side]]}
function seasonUnitAvailable(side,key,level,forPlayer=false){
 const d=(side==='plants'?PLANT_TYPES:ZOMBIE_TYPES)[key];if(!d||(d.season||1)!==currentSeason)return false;
 if(currentSeason===1)return level>=(UNLOCK_LEVEL[side]?.[key]||1);
 return !d.clearRequired||(forPlayer&&isCampaignLevelCompleted(side,d.clearRequired,2));
}
