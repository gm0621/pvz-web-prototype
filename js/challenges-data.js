const CHALLENGE_PROFILE_VERSION=1;
const CHALLENGE_TEMPLATE_IDS=Object.freeze(['no-hero','gate-health','resource-cap','no-relocation','melee-only','time-limit','protect-unit','no-enemy-leak']);
const CHALLENGE_TEMPLATES=Object.freeze({
 'no-hero':Object.freeze({id:'no-hero',name:'不用武將',description:'本關不得部署武將。'}),
 'gate-health':Object.freeze({id:'gate-health',name:'城門無傷',description:'守住指定比例以上的關卡目標生命。',minHealthPct:.5}),
 'resource-cap':Object.freeze({id:'resource-cap',name:'精兵節糧',description:'資源支出不得超過本關上限。',maxSpent:500}),
 'no-relocation':Object.freeze({id:'no-relocation',name:'陣地不移',description:'本關不得使用換列。'}),
 'melee-only':Object.freeze({id:'melee-only',name:'近戰破陣',description:'只以近戰單位完成本關。'}),
 'time-limit':Object.freeze({id:'time-limit',name:'兵貴神速',description:'在指定戰鬥時間內獲勝。',maxMs:180000}),
 'protect-unit':Object.freeze({id:'protect-unit',name:'全員護持',description:'指定任務單位必須存活。'}),
 'no-enemy-leak':Object.freeze({id:'no-enemy-leak',name:'滴水不漏',description:'不可讓任何敵軍突破防線。'})
});
const CHALLENGE_ROUTE_POOLS=Object.freeze({
 '1:plants':Object.freeze(['no-hero','gate-health','resource-cap','no-relocation','protect-unit','no-enemy-leak','melee-only','time-limit']),
 '1:zombies':Object.freeze(['no-hero','time-limit','melee-only','resource-cap','no-relocation','protect-unit','no-enemy-leak']),
 '2:plants':Object.freeze(['no-enemy-leak','protect-unit','resource-cap','no-hero','gate-health','no-relocation','time-limit','melee-only']),
 '2:zombies':Object.freeze(['time-limit','melee-only','no-hero','resource-cap','protect-unit','no-relocation','no-enemy-leak'])
});
function challengeProtectedUnitType(season,faction){return season===2?(faction==='plants'?'s2Tuntian':'s2Rat'):(faction==='plants'?'peashooter':'normal')}
const CHALLENGE_ROUTE_DEFINITIONS=(()=>{
 const routes={};
 for(const season of [1,2])for(const faction of ['plants','zombies'])for(let level=1;level<=10;level++){
  const pool=CHALLENGE_ROUTE_POOLS[`${season}:${faction}`],offset=(level-1)%pool.length;
  routes[`${season}:${faction}:${level}`]=Object.freeze(Array.from({length:3},(_,index)=>{
   const id=pool[(offset+index)%pool.length],template=CHALLENGE_TEMPLATES[id];
   return Object.freeze({...template,...(id==='protect-unit'?{protectedUnitType:challengeProtectedUnitType(season,faction)}:{}),medalId:`${season}:${faction}:${level}:${id}`,season,faction,level});
  }));
 }
 return Object.freeze(routes);
})();
function challengesForRoute(season,faction,level){return CHALLENGE_ROUTE_DEFINITIONS[`${Number(season)}:${faction}:${Number(level)}`]||Object.freeze([])}
function createChallengeBattleState(activeIds=[]){
 const ids=Array.isArray(activeIds)?[...new Set(activeIds.filter(id=>CHALLENGE_TEMPLATE_IDS.includes(id)))]:[];
 return {version:1,activeIds:ids,fairMode:ids.length>0,protectedEntityId:null};
}
function normalizeChallengeBattleState(raw){const normalized=createChallengeBattleState(raw?.activeIds);normalized.protectedEntityId=typeof raw?.protectedEntityId==='string'?raw.protectedEntityId:null;return normalized}
function defaultChallengeProfile(){return {version:CHALLENGE_PROFILE_VERSION,medals:{},claims:{}}}
function normalizeChallengeProfile(raw){
 const profile=defaultChallengeProfile();
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return profile;
 if(raw.medals&&typeof raw.medals==='object'&&!Array.isArray(raw.medals))for(const [id,value] of Object.entries(raw.medals))if(typeof id==='string'&&value)profile.medals[id]=value;
 if(raw.claims&&typeof raw.claims==='object'&&!Array.isArray(raw.claims))for(const [id,value] of Object.entries(raw.claims))if(typeof id==='string'&&value)profile.claims[id]=value;
 return profile;
}
const CHALLENGE_HERO_TYPES=new Set(['firepea','zhaoyun','pangtong','machao','huangzhong','zhangfei','kongming','liubei','football','jester','bombJester','corpseTitan','fireCatapult','qinEmperor','necromancer','s2Xiahou','s2DianWei','s2XuChu','s2ZhangLiao','s2XuHuang','s2GuoJia','s2SimaYi','s2CaoCao','s2Smoke','s2Hook','s2Medic','s2Venom','s2Decoy','s2Hexer','s2Ram','s2Overseer']);
function challengeUnitIsHero(type){return CHALLENGE_HERO_TYPES.has(type)}
function challengeUnitIsRanged(side,type){const unit=typeof baseUnit==='function'?baseUnit(side,type):null;return !!(unit&&((unit.range||0)>1.2||unit.shoot||unit.catapult||unit.curse||unit.laugh||unit.tripleShot))}
function challengeOutcomeEvent(telemetry){const events=Array.isArray(telemetry?.events)?telemetry.events:[];return [...events].reverse().find(event=>event?.type==='outcome')||null}
function evaluateChallengeVerdict(definition,telemetry){
 const id=definition?.id,outcome=challengeOutcomeEvent(telemetry);if(!outcome)return {id,passed:false,reason:'missing-outcome'};
 if(outcome.win!==true)return {id,passed:false,reason:'battle-lost'};
 const events=Array.isArray(telemetry?.events)?telemetry.events:[],side=definition?.faction;
 let passed=false;
 if(id==='no-hero')passed=!events.some(event=>event.type==='deploy'&&event.side===side&&event.hero===true);
 else if(id==='gate-health')passed=Number(outcome.objectiveHealthPct)>=Number(definition.minHealthPct??.5);
 else if(id==='resource-cap')passed=Number(telemetry?.totals?.resources?.[side]?.spent||0)<=Number(definition.maxSpent??500);
 else if(id==='no-relocation')passed=!events.some(event=>event.type==='relocation'&&event.side===side);
 else if(id==='melee-only')passed=!events.some(event=>event.type==='deploy'&&event.side===side&&event.ranged===true);
 else if(id==='time-limit')passed=Number(outcome.elapsedMs)<=Number(definition.maxMs??180000);
 else if(id==='protect-unit')passed=outcome.protectedUnitAlive===true;
 else if(id==='no-enemy-leak')passed=!events.some(event=>event.type==='leak'&&event.side!==side);
 return {id,passed,reason:passed?'completed':'condition-failed'};
}
function challengeObjectiveSnapshot(battle=state){
 const playerUnits=battle?.faction==='plants'?battle?.plants||[]:battle?.zombies||[],objective=playerUnits.find(unit=>(unit.stageTarget||unit.stageEscort)&&Number(unit.maxHp)>0),mowers=battle?.lawnmowers||[];
 const protectedType=activeChallengeDefinitions(battle).find(definition=>definition.id==='protect-unit')?.protectedUnitType,protectedId=battle?.gameplay?.challenge?.protectedEntityId;
 const objectiveHealthPct=objective?Math.max(0,Math.min(1,Number(objective.hp)/Number(objective.maxHp))):mowers.length?mowers.filter(mower=>!mower.used).length/mowers.length:1;
 return {objectiveHealthPct,protectedUnitAlive:!!protectedType&&!!protectedId&&playerUnits.some(unit=>unit.id===protectedId&&unit.type===protectedType&&Number(unit.hp)>0)};
}
function recordChallengeOutcome(win,battle=state){if(!battle?.gameplay?.telemetry)return false;return recordBattleEvent('outcome',{win:win===true,elapsedMs:Math.max(0,Number(battle.time)||0),...challengeObjectiveSnapshot(battle)})}
function activeChallengeDefinitions(battle=state){const active=new Set(battle?.gameplay?.challenge?.activeIds||[]);return challengesForRoute(battle?.season,battle?.faction,battle?.level).filter(definition=>active.has(definition.id))}
function claimGuestChallengeResults(win,battle=state){
 if(currentUser)return {awarded:[],reason:'cloud-required'};
 if(win!==true)return {awarded:[],reason:'battle-lost'};
 const awarded=[];
 for(const definition of activeChallengeDefinitions(battle)){
  const verdict=evaluateChallengeVerdict(definition,battle?.gameplay?.telemetry);if(!verdict.passed||playerProfile.challenges.medals[definition.medalId])continue;
  playerProfile.challenges.medals[definition.medalId]={earnedAt:new Date().toISOString(),season:definition.season,faction:definition.faction,level:definition.level,challengeId:definition.id};awarded.push(definition.medalId);
 }
 if(awarded.length)saveProfile();
 return {awarded,reason:awarded.length?'awarded':'no-new-medals'};
}
function challengeTelemetryPayload(battle=state,challengeIds=[]){
 const telemetry=battle?.gameplay?.telemetry||{},events=Array.isArray(telemetry.events)?telemetry.events.filter(event=>['deploy','relocation','leak','outcome'].includes(event.type)):[];
 return {version:1,season:Number(battle?.season)||1,faction:battle?.faction||null,level:Number(battle?.level)||0,challengeIds:[...challengeIds].sort(),totals:telemetry.totals||{},events};
}
function challengeTelemetryCanonical(battle=state,challengeIds=[]){return JSON.stringify(challengeTelemetryPayload(battle,challengeIds))}
async function challengeTelemetryDigest(battle=state,challengeIds=[]){
 const bytes=new TextEncoder().encode(challengeTelemetryCanonical(battle,challengeIds)),hash=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(hash)].map(value=>value.toString(16).padStart(2,'0')).join('');
}
