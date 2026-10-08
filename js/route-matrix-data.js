// Canonical Phase 7 inventory for the forty playable campaign routes.
// Qin level 11 remains a separate finale and is deliberately excluded.
const CAMPAIGN_TELEGRAPH_BY_UNIT=Object.freeze({
 jester:'jester-laugh',corpseTitan:'titan-smash',fireCatapult:'fire-catapult',necromancer:'necromancer-curse',
 s2Cleaver:'s2-shield-break',s2Hook:'s2-hook-drag',s2Ram:'s2-ram-charge'
});
const CAMPAIGN_ORDER_REQUIREMENTS=Object.freeze(Object.fromEntries(TACTICAL_ORDERS.map(order=>[order.id,Object.freeze({benefitKeys:order.tradeoffs.benefit,costKeys:order.tradeoffs.cost})])));
function campaignRouteTelegraphKinds(season,faction,level){
 if(faction!=='plants')return [];
 const config=campaignLevels(season)?.[level]||{},types=[...(config.zombieWeights||[]),config.bossType].filter(Boolean);
 return [...new Set(types.map(type=>CAMPAIGN_TELEGRAPH_BY_UNIT[type]).filter(Boolean))];
}
function campaignRouteAvailableUnitIds(season,faction,level){
 const definitions=faction==='plants'?PLANT_TYPES:ZOMBIE_TYPES;
 return Object.entries(definitions).filter(([,unit])=>(unit.season||1)===Number(season)).filter(([id,unit])=>Number(season)===1?(Number(UNLOCK_LEVEL[faction]?.[id])||1)<=Number(level):!unit.clearRequired||Number(unit.clearRequired)<Number(level)).map(([id])=>id);
}
function campaignRouteCapabilities(season,faction,level){
 const definitions=faction==='plants'?PLANT_TYPES:ZOMBIE_TYPES,ids=campaignRouteAvailableUnitIds(season,faction,level),units=ids.map(id=>({id,unit:definitions[id]}));
 const attacks=({unit})=>!unit.nonAttacking&&Number(unit.damage||unit.explodeDamage||unit.shotDamage)>0;
 const ranged=row=>attacks(row)&&challengeUnitIsRanged(faction,row.id);
 const capabilities=new Set(['resourceIncome','deploymentCost','unitHealth','damageTaken','enemyResourceIncome']);
 if(units.some(attacks)){capabilities.add('damage');capabilities.add('attackSpeed')}
 if(units.some(ranged))capabilities.add('rangedDamage');
 if(units.some(row=>attacks(row)&&!ranged(row)))capabilities.add('meleeDamage');
 if(units.some(({unit})=>Number(unit.shieldHp||unit.shield||unit.block)>0))capabilities.add('shield');
 if(units.some(({unit})=>Number(unit.speed||unit.spentSpeed)>0))capabilities.add('movementSpeed');
 if(units.some(({unit})=>Number(unit.heal)>0))capabilities.add('healing');
 if(faction==='plants'){capabilities.add('relocationCost');capabilities.add('enemySpawnInterval')}
 return capabilities;
}
function campaignRouteOrderPool(season,faction,level){
 const capabilities=campaignRouteCapabilities(season,faction,level);
 return TACTICAL_ORDERS.map(order=>order.id).filter(id=>{
  const requirements=CAMPAIGN_ORDER_REQUIREMENTS[id];
  return requirements.benefitKeys.some(key=>capabilities.has(key))&&requirements.costKeys.some(key=>capabilities.has(key));
 });
}
const CAMPAIGN_ROUTE_MATRIX=(()=>{
 const matrix={};
 for(const season of [1,2])for(const faction of ['plants','zombies'])for(let level=1;level<=10;level++){
  const context={season,faction,level,levelConfig:campaignLevels(season)[level]},route=`${season}:${faction}:${level}`,rule=stageRuleFor(context);
  const challengeIds=Object.freeze(challengesForRoute(season,faction,level).map(challenge=>challenge.id));
  const kinds=Object.freeze(campaignRouteTelegraphKinds(season,faction,level));
  matrix[route]=Object.freeze({
   ruleId:rule.id,challengeIds,
   requiredUnitIds:rule.requirements.playerUnits,
   encounterProvidedUnitIds:rule.requirements.encounterProvidedUnits,
   get orderPool(){return Object.freeze(campaignRouteOrderPool(season,faction,level))},
   telegraphRequirement:Object.freeze({required:kinds.length>0,kinds})
  });
 }
 return Object.freeze(matrix);
})();
function campaignRouteMatrixFor(season,faction,level){return CAMPAIGN_ROUTE_MATRIX[`${Number(season)}:${faction}:${Number(level)}`]||null}
function campaignRouteResultCopy(context,won){
 const faction=context?.faction,levelConfig=context?.levelConfig||campaignLevels(context?.season)?.[Number(context?.level)],name=levelConfig?.name||'本關';
 if(won)return faction==='zombies'?{title:'突破成功！',text:`${name}完成：僵屍突破推車後抵達左側。`}:{title:'防守成功！',text:`${name}完成：${Number(levelConfig?.enemyCount)||0} 名殭屍與關底大魔王已全數擊敗。`};
 return faction==='zombies'?{title:'進攻失敗',text:`進攻時間已到；本關可持續出兵 ${Math.round((Number(levelConfig?.attackTimeLimit)||0)/1000)} 秒。`}:{title:'防線被突破！',text:'僵屍突破推車後進入城池。'};
}
window.CAMPAIGN_ORDER_REQUIREMENTS=CAMPAIGN_ORDER_REQUIREMENTS;
window.campaignRouteAvailableUnitIds=campaignRouteAvailableUnitIds;
window.campaignRouteCapabilities=campaignRouteCapabilities;
window.CAMPAIGN_ROUTE_MATRIX=CAMPAIGN_ROUTE_MATRIX;
window.campaignRouteMatrixFor=campaignRouteMatrixFor;
window.campaignRouteResultCopy=campaignRouteResultCopy;
