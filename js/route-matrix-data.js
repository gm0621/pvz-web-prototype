// Canonical Phase 7 inventory for the forty playable campaign routes.
// Qin level 11 remains a separate finale and is deliberately excluded.
const CAMPAIGN_TELEGRAPH_BY_UNIT=Object.freeze({
 jester:'jester-laugh',corpseTitan:'titan-smash',fireCatapult:'fire-catapult',necromancer:'necromancer-curse',
 s2Cleaver:'s2-shield-break',s2Hook:'s2-hook-drag',s2Ram:'s2-ram-charge'
});
function campaignRouteTelegraphKinds(season,faction,level){
 if(faction!=='plants')return [];
 const config=campaignLevels(season)?.[level]||{},types=[...(config.zombieWeights||[]),config.bossType].filter(Boolean);
 return [...new Set(types.map(type=>CAMPAIGN_TELEGRAPH_BY_UNIT[type]).filter(Boolean))];
}
const CAMPAIGN_ROUTE_MATRIX=(()=>{
 const matrix={},orderPool=Object.freeze(TACTICAL_ORDERS.map(order=>order.id));
 for(const season of [1,2])for(const faction of ['plants','zombies'])for(let level=1;level<=10;level++){
  const context={season,faction,level,levelConfig:campaignLevels(season)[level]},route=`${season}:${faction}:${level}`;
  const challengeIds=Object.freeze(challengesForRoute(season,faction,level).map(challenge=>challenge.id));
  const kinds=Object.freeze(campaignRouteTelegraphKinds(season,faction,level));
  matrix[route]=Object.freeze({ruleId:stageRuleConfigFor(context).ruleId,challengeIds,orderPool,telegraphRequirement:Object.freeze({required:kinds.length>0,kinds})});
 }
 return Object.freeze(matrix);
})();
function campaignRouteMatrixFor(season,faction,level){return CAMPAIGN_ROUTE_MATRIX[`${Number(season)}:${faction}:${Number(level)}`]||null}
function campaignRouteResultCopy(context,won){
 const faction=context?.faction,levelConfig=context?.levelConfig||campaignLevels(context?.season)?.[Number(context?.level)],name=levelConfig?.name||'本關';
 if(won)return faction==='zombies'?{title:'突破成功！',text:`${name}完成：僵屍突破推車後抵達左側。`}:{title:'防守成功！',text:`${name}完成：${Number(levelConfig?.enemyCount)||0} 名殭屍與關底大魔王已全數擊敗。`};
 return faction==='zombies'?{title:'進攻失敗',text:`進攻時間已到；本關可持續出兵 ${Math.round((Number(levelConfig?.attackTimeLimit)||0)/1000)} 秒。`}:{title:'防線被突破！',text:'僵屍突破推車後進入城池。'};
}
window.CAMPAIGN_ROUTE_MATRIX=CAMPAIGN_ROUTE_MATRIX;
window.campaignRouteMatrixFor=campaignRouteMatrixFor;
window.campaignRouteResultCopy=campaignRouteResultCopy;
