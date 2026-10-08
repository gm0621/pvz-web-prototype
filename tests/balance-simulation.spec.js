const {test,expect}=require('@playwright/test');

async function open(page){
 await page.goto('/?phase7-balance-test=1');
 await page.waitForFunction(()=>typeof campaignRouteMatrixFor==='function'&&typeof resolveBattleUnit==='function'&&typeof createTacticalOrderOffer==='function');
}

function mulberry32(seed){return function(){let value=seed+=0x6D2B79F5;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return ((value^value>>>14)>>>0)/4294967296}}

const simulationSource=`({seedCount})=>{
 const EPSILON=1e-9;
 const mean=values=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:0;
 const battleFor=(route,selected=[])=>{
  const [seasonText,faction,levelText]=route.split(':'),season=Number(seasonText),level=Number(levelText);
  return {season,faction,level,levelConfig:campaignLevels(season)[level],plants:[],zombies:[],permanent:{},gameplay:{orders:{selected:[...selected],offer:null,history:[],nextOfferId:0,attackMilestones:[]},stageRule:null}};
 };
 const vectorFor=(route,orderId=null)=>{
  const battle=battleFor(route,orderId?[orderId]:[]),faction=battle.faction,capabilities=campaignRouteCapabilities(battle.season,faction,battle.level),keys=campaignRouteAvailableUnitIds(battle.season,faction,battle.level);
  const resolved=keys.map(key=>({key,base:baseUnit(faction,key),unit:resolveBattleUnit(faction,key,battle).unit})).filter(row=>row.base&&row.unit);
  const valuesFor=(predicate,read)=>resolved.filter(predicate).map(read).filter(Number.isFinite);
  const ranged=row=>challengeUnitIsRanged(faction,row.key),attacker=row=>Number(row.base.damage||row.base.explodeDamage||row.base.shotDamage)>0||ranged(row);
  const damageValue=row=>Number(row.unit.damage||row.unit.explodeDamage||row.unit.shotDamage||0);
  const cadenceValue=row=>1000/Math.max(1,Number(row.unit.rate||row.unit.attackRate||700));
  const vector={
   resourceIncome:battleIncomeAmount(100,'player',battle),enemyResourceIncome:100/Math.max(1,battleIncomeAmount(100,'enemy',battle)),
   deploymentCost:100/Math.max(1,battleDeploymentCost(100,battle)),relocationCost:20/Math.max(1,battleRelocationCost(20,battle)),
   enemySpawnInterval:battleEnemySpawnInterval(1000,battle),healing:battleHealingAmount(100,faction,battle),damageTaken:100/Math.max(1,battleDamageTaken(100,faction,battle)),
   unitHealth:mean(valuesFor(()=>true,row=>Number(row.unit.hp||0))),shield:mean(valuesFor(row=>Number(row.base.shieldHp||row.base.shield||row.base.block)>0,row=>Number(row.unit.shieldHp||row.unit.shield||row.unit.block||0))),
   movementSpeed:mean(valuesFor(row=>Number(row.base.speed||row.base.spentSpeed)>0,row=>battleMovementSpeed(faction,row.key,0,battle,{stat:row.base.speed?'speed':'spentSpeed'}))),
   attackSpeed:mean(valuesFor(attacker,cadenceValue)),damage:mean(valuesFor(attacker,damageValue)),rangedDamage:mean(valuesFor(ranged,damageValue)),meleeDamage:mean(valuesFor(row=>attacker(row)&&!ranged(row),damageValue))
  };
  return Object.fromEntries([...capabilities].map(key=>[key,vector[key]]).filter(([,value])=>Number.isFinite(value)&&value>0));
 };
 const baselineByRoute=Object.fromEntries(Object.keys(CAMPAIGN_ROUTE_MATRIX).map(route=>[route,vectorFor(route)]));
 const utility=(route,orderId,priorityKey=null)=>{const baseline=baselineByRoute[route],candidate=vectorFor(route,orderId),deltas=Object.fromEntries(Object.keys(baseline).filter(key=>candidate[key]>0).map(key=>[key,candidate[key]/baseline[key]-1]));return mean(Object.values(deltas))*.25+(Number(deltas[priorityKey])||0)*.75};
 const offersFor=(route,seed)=>{const [seasonText,faction,levelText]=route.split(':'),previous=state;try{state=battleFor(route);state.season=Number(seasonText);state.faction=faction;state.level=Number(levelText);const offer=createTacticalOrderOffer(seed);return [...offer]}finally{state=previous}};
 const run=()=>{
  const picked=Object.fromEntries(TACTICAL_ORDERS.map(order=>[order.id,0])),offered=Object.fromEntries(TACTICAL_ORDERS.map(order=>[order.id,0])),utilityTotals=Object.fromEntries(TACTICAL_ORDERS.map(order=>[order.id,{sum:0,count:0}]));let ordinary=0,best=0,samples=0;
  for(const route of Object.keys(CAMPAIGN_ROUTE_MATRIX))for(let seed=1;seed<=seedCount;seed++){
   const offer=offersFor(route,seed),rng=(${mulberry32.toString()})(seed+route.split('').reduce((sum,char)=>sum+char.charCodeAt(0),0)),priorityKeys=[...new Set(offer.flatMap(id=>CAMPAIGN_ORDER_REQUIREMENTS[id].benefitKeys))],priorityKey=priorityKeys[Math.floor(rng()*priorityKeys.length)];offer.forEach(id=>offered[id]++);
   const scored=offer.map(id=>({id,score:utility(route,id,priorityKey)}));scored.forEach(({id,score})=>{utilityTotals[id].sum+=score;utilityTotals[id].count++});ordinary+=scored[Math.floor(rng()*scored.length)].score;scored.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));best+=scored[0].score;picked[scored[0].id]++;samples++;
  }
  return {samples,noOrder:0,ordinary:ordinary/samples,best:best/samples,picked,offered,averageUtility:Object.fromEntries(Object.entries(utilityTotals).map(([id,total])=>[id,total.count?total.sum/total.count:0]))};
 };
 const directions=[];
 for(const [route,row] of Object.entries(CAMPAIGN_ROUTE_MATRIX))for(const orderId of row.orderPool){const base=baselineByRoute[route],candidate=vectorFor(route,orderId),requirements=CAMPAIGN_ORDER_REQUIREMENTS[orderId];directions.push({route,orderId,benefit:requirements.benefitKeys.some(key=>candidate[key]>base[key]+EPSILON),cost:requirements.costKeys.some(key=>candidate[key]<base[key]-EPSILON),benefitValues:requirements.benefitKeys.map(key=>[key,base[key],candidate[key]]),costValues:requirements.costKeys.map(key=>[key,base[key],candidate[key]])})}
 return {first:run(),second:run(),directions};
}`;

test('route pools expose only production-applicable benefit and cost consumers',async({page})=>{
 await open(page);
 const rows=await page.evaluate(()=>Object.entries(CAMPAIGN_ROUTE_MATRIX).map(([route,row])=>{const [season,faction,level]=route.split(':');return {route,pool:row.orderPool,capabilities:[...campaignRouteCapabilities(Number(season),faction,Number(level))]}}));
 expect(rows).toHaveLength(40);
 const seen=new Set();
 for(const row of rows){
  expect(row.pool.length,row.route).toBeGreaterThanOrEqual(3);
  for(const id of row.pool){seen.add(id);const requirements=await page.evaluate(orderId=>CAMPAIGN_ORDER_REQUIREMENTS[orderId],id);expect(requirements,`${row.route}:${id}`).toBeTruthy();expect(requirements.benefitKeys.some(key=>row.capabilities.includes(key)),`${row.route}:${id}:benefit`).toBe(true);expect(requirements.costKeys.some(key=>row.capabilities.includes(key)),`${row.route}:${id}:cost`).toBe(true)}
 }
 expect([...seen].sort()).toEqual((await page.evaluate(()=>TACTICAL_ORDERS.map(order=>order.id))).sort());
});

test('seeded simulations use production offers and consumers for no order ordinary and best strategies',async({page})=>{
 await open(page);
 const report=await page.evaluate(eval(simulationSource),{seedCount:128});
 expect(report.second).toEqual(report.first);
 expect(report.first.samples).toBe(40*128);
 expect(report.first.noOrder).toBe(0);
 expect(report.first.ordinary).toBeGreaterThanOrEqual(-.005);
 expect(report.first.best).toBeGreaterThan(report.first.ordinary);
 expect(report.first.best).toBeGreaterThan(report.first.noOrder);
 for(const row of report.directions){expect(row.benefit,`${row.route}:${row.orderId}:benefit ${JSON.stringify(row.benefitValues)}`).toBe(true);expect(row.cost,`${row.route}:${row.orderId}:cost ${JSON.stringify(row.costValues)}`).toBe(true)}
 const overall=Object.entries(report.first.picked).map(([id,count])=>({id,rate:count/report.first.samples,count})),conditional=Object.keys(report.first.picked).filter(id=>report.first.offered[id]>0).map(id=>({id,rate:report.first.picked[id]/report.first.offered[id],picked:report.first.picked[id],offered:report.first.offered[id]}));
 expect(overall.filter(item=>item.rate>0).length,JSON.stringify({overall,offered:report.first.offered,averageUtility:report.first.averageUtility})).toBe(9);
 const highestOverall=overall.sort((a,b)=>b.rate-a.rate)[0],highestConditional=conditional.sort((a,b)=>b.rate-a.rate)[0],averageUtilities=Object.values(report.first.averageUtility),utilitySpread=Math.max(...averageUtilities)-Math.min(...averageUtilities);
 expect(highestOverall.rate,JSON.stringify(overall)).toBeLessThan(.25);
 expect(highestConditional.rate,JSON.stringify(conditional)).toBeLessThanOrEqual(.65);
 expect(utilitySpread,JSON.stringify(report.first.averageUtility)).toBeLessThan(.12);
});

test('all eight combinations produce ten to fifteen percent production throughput and respect the overlap cap',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const damageStats=['damage','meleeDamage','catapultDamage','smashDamage','bombDamage','laughDamage','curseDamage','curseAdjacentDamage'],rateStats=['rate','supportRate','catapultRate','smashRate','laughRate','curseRate'];
  const throughput=(base,modified)=>{const baseDamage=damageStats.reduce((sum,key)=>sum+(Number(base[key])||0),0),modifiedDamage=damageStats.reduce((sum,key)=>sum+(Number(modified[key])||0),0),rateKey=rateStats.find(key=>Number(base[key])>0);return (baseDamage?modifiedDamage/baseDamage:1)*(rateKey?base[rateKey]/modified[rateKey]:1)};
  const rows=SYNERGIES.map(definition=>{const units=definition.members.map((type,index)=>({id:`${definition.id}-${index}`,type,hp:1})),battle={season:definition.season,faction:definition.side,plants:definition.side==='plants'?units:[],zombies:definition.side==='zombies'?units:[]},offBattle={...battle,[definition.side]:units.slice(0,-1)},key=definition.members.find(member=>{const unit=baseUnit(definition.side,member)||{};return [...damageStats,...rateStats].some(stat=>Number(unit[stat])>0)})||definition.members[0],base=baseUnit(definition.side,key),modified=applyCombinationUnitModifier(definition.side,key,base,battle);return {id:definition.id,off:combinationIsActive(definition,offBattle),on:combinationIsActive(definition,battle),throughput:throughput(base,modified)}});
  const members=['necromancer','corpseTitan','fireCatapult'],overlapBattle={season:1,faction:'zombies',plants:[],zombies:members.map((type,index)=>({id:`overlap-${index}`,type,hp:1}))},base=baseUnit('zombies','fireCatapult'),modified=applyCombinationUnitModifier('zombies','fireCatapult',base,overlapBattle);
  return {rows,overlap:{active:activeCombinationDefinitions('zombies',overlapBattle).map(definition=>definition.id),throughput:throughput(base,modified)}};
 });
 expect(result.rows).toHaveLength(8);
 for(const row of result.rows){expect(row.off,row.id).toBe(false);expect(row.on,row.id).toBe(true);expect(row.throughput,row.id).toBeGreaterThanOrEqual(1.08);expect(row.throughput,row.id).toBeLessThanOrEqual(1.16)}
 expect(result.overlap.active).toEqual(expect.arrayContaining(['necromancer-flame','titan-siege']));expect(result.overlap.throughput).toBeLessThanOrEqual(1.150001);
});

test('stage requirements distinguish player unlocks from encounter-provided units',async({page})=>{
 await open(page);
 const rows=await page.evaluate(()=>Object.entries(CAMPAIGN_ROUTE_MATRIX).map(([route,row])=>{const [seasonText,faction,levelText]=route.split(':'),season=Number(seasonText),level=Number(levelText),rule=stageRuleFor({season,faction,level,levelConfig:campaignLevels(season)[level]});return {route,requiredUnitIds:row.requiredUnitIds,encounterProvidedUnitIds:row.encounterProvidedUnitIds,ruleRequirements:rule.requirements,available:campaignRouteAvailableUnitIds(season,faction,level)}}));
 for(const row of rows){expect(row.requiredUnitIds).toEqual(row.ruleRequirements.playerUnits);expect(row.encounterProvidedUnitIds).toEqual(row.ruleRequirements.encounterProvidedUnits);expect(row.requiredUnitIds.every(id=>row.available.includes(id)),row.route).toBe(true)}
 const escorts=rows.filter(row=>row.route.startsWith('2:zombies:')&&['1','5','10'].includes(row.route.split(':')[2]));expect(escorts.every(row=>row.encounterProvidedUnitIds.includes('s2Ram'))).toBe(true);
});

test('route challenge sets never combine a protected ranged unit with melee only',async({page})=>{
 await open(page);
 const rows=await page.evaluate(()=>Object.entries(CHALLENGE_ROUTE_DEFINITIONS).map(([route,definitions])=>({route,ids:definitions.map(definition=>definition.id),protectedRanged:definitions.some(definition=>definition.id==='protect-unit'&&challengeUnitIsRanged(definition.faction,definition.protectedUnitType))})));
 for(const row of rows)expect(row.protectedRanged&&row.ids.includes('melee-only'),row.route).toBe(false);
});
