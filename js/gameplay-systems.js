const GAMEPLAY_STATE_VERSION=1;
var BATTLE_MODIFIER_LAYER_ORDER=Object.freeze(['base-equipment','character-level','fixed-talent','synergy','tactical-order','temporary-stage-status','clamp']);
var BATTLE_MODIFIER_CONSUMERS=Object.freeze({
 resourceIncome:'battleIncomeAmount',damage:'resolveBattleUnit',rangedDamage:'resolveBattleUnit',meleeDamage:'resolveBattleUnit',shield:'resolveBattleUnit',movementSpeed:'battleMovementSpeed',attackSpeed:'resolveBattleUnit',damageTaken:'battleDamageTaken',deploymentCost:'battleDeploymentCost',unitHealth:'resolveBattleUnit',enemySpawnInterval:'battleEnemySpawnInterval',healing:'battleHealingAmount',relocationCost:'battleRelocationCost',enemyResourceIncome:'battleIncomeAmount'
});
function combinationUnits(side,battle=state){return side==='plants'?battle?.plants||[]:battle?.zombies||[]}
function combinationIsActive(definition,battle=state){
 if(!definition||!battle||definition.season!==(battle.season||1))return false;
 const livingTypes=new Set(combinationUnits(definition.side,battle).filter(unit=>unit&&unit.hp>0).map(unit=>unit.type));
 return definition.members.every(type=>livingTypes.has(type));
}
function activeCombinationDefinitions(side,battle=state){return COMBINATION_DEFINITIONS.filter(definition=>definition.side===side&&combinationIsActive(definition,battle))}
const MAX_COMBINATION_THROUGHPUT=1.15;
function cappedCombinationEffects(effects){
 const damagePct=effects.reduce((sum,effect)=>sum+(effect.damagePct||0),0),ratePct=effects.reduce((sum,effect)=>sum+(effect.ratePct||0),0);
 const throughput=scale=>(1+damagePct*scale)/Math.max(.05,1+ratePct*scale);
 if(throughput(1)<=MAX_COMBINATION_THROUGHPUT)return {damagePct,ratePct};
 let low=0,high=1;for(let i=0;i<24;i++){const middle=(low+high)/2;if(throughput(middle)>MAX_COMBINATION_THROUGHPUT)high=middle;else low=middle}
 return {damagePct:damagePct*low,ratePct:ratePct*low};
}
function applyCombinationUnitModifier(side,key,unit,battle=state){
 if(!unit||!battle||side!==battle.faction)return unit;
 const effects=activeCombinationDefinitions(side,battle).filter(definition=>definition.members.includes(key)).map(definition=>definition.effect);
 if(!effects.length)return unit;
 const modified={...unit},{damagePct,ratePct}=cappedCombinationEffects(effects);
 if(damagePct)['damage','meleeDamage','catapultDamage','smashDamage','bombDamage','laughDamage','curseDamage','curseAdjacentDamage'].forEach(stat=>{if(modified[stat]!=null)modified[stat]=Math.max(1,Math.round(modified[stat]*(1+damagePct)))});
 if(ratePct)['rate','supportRate','catapultRate','smashRate','laughRate','curseRate'].forEach(stat=>{if(modified[stat]!=null)modified[stat]=Math.max(1,Math.round(modified[stat]*(1+ratePct)))});
 return modified;
}
function renderCombinationStatus(){
 if(!state)return false;
 const host=document.querySelector('.battle-resource-strip');if(!host)return false;
 let panel=document.getElementById('combinationStatus');
 if(!panel){panel=document.createElement('section');panel.id='combinationStatus';panel.className='combination-status';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');panel.setAttribute('aria-atomic','true');panel.setAttribute('aria-label','我方已啟動組合');host.prepend(panel)}
 const active=activeCombinationDefinitions(state.faction),signature=active.map(definition=>definition.id).join('|');
 if(panel.dataset.signature===signature)return active.length>0;
 panel.dataset.signature=signature;panel.replaceChildren();panel.hidden=!active.length;
 if(!active.length)return false;
 const memberCounts=new Map();for(const definition of active)for(const member of definition.members)memberCounts.set(member,(memberCounts.get(member)||0)+1);
 const hasOverlap=[...memberCounts.values()].some(count=>count>1),title=document.createElement('strong');title.className='combination-status-title';title.textContent=hasOverlap?'⚔ 我方組合｜重疊成員總效益上限 +15%':'⚔ 我方組合';panel.appendChild(title);
 for(const definition of active){const badge=document.createElement('span');badge.className='combination-badge';badge.dataset.combinationId=definition.id;badge.textContent=`${definition.name}｜${definition.memberNames.join('＋')}｜${definition.bonusLabel}`;panel.appendChild(badge)}
 return true;
}
const ENEMY_TELEGRAPH_RULES=Object.freeze({
 'fire-catapult':{duration:1200,label:'烈焰落石',icon:'☄',counter:'換列離開九宮格，或在落石前擊倒烈焰屍車'},
 'necromancer-curse':{duration:1000,label:'幽冥禁咒',icon:'咒',counter:'換列離開標記路線，或優先擊倒冥火屍巫'},
 'jester-laugh':{duration:800,label:'狂笑混亂',icon:'鈴',counter:'換列離開該路，或在狂笑前擊倒鈴鐺丑屍'},
 'titan-smash':{duration:800,label:'破城重槌',icon:'槌',counter:'換列離開九宮格，或在落槌前擊倒屍旗大胖'},
 'qin-unification':{duration:1400,label:'天下一統',icon:'令',counter:'換列離開被標記路線'},
 's2-shield-break':{duration:700,label:'斷盾重劈',icon:'斬',counter:'換列，或在重劈前擊倒劈盾屍'},
 's2-hook-drag':{duration:800,label:'纏鏈拖行',icon:'鏈',counter:'換列、卡住前方位置、派許褚免疫，或擊倒纏鏈屍'},
 's2-ram-charge':{duration:900,label:'蓄勢衝撞',icon:'衝',counter:'換列，或在衝撞前擊倒衝車屍'}
});
const BATTLE_SIDES=['plants','zombies'];

function emptySideNumber(){return {plants:0,zombies:0}}
function emptyControl(){return {plants:{count:0,duration:0},zombies:{count:0,duration:0}}}
function emptyResources(){return {plants:{gained:0,spent:0,net:0},zombies:{gained:0,spent:0,net:0}}}
function createBattleTelemetry(){
 return {
  nextEventId:1,
  events:[],
  totals:{damageDealt:emptySideNumber(),damageTaken:emptySideNumber(),kills:emptySideNumber(),control:emptyControl(),resources:emptyResources(),waves:{started:0,completed:0,current:0}},
  bySource:{},
  byTarget:{}
 };
}
function createBattleReportState(initialized=true){
 const telemetry=createBattleTelemetry();
 return {initialized,baseline:{totals:telemetry.totals,bySource:telemetry.bySource,byTarget:telemetry.byTarget,eventCount:0},current:null,attackMilestones:[]};
}
function createBattleTelegraphState(){return {nextId:1,active:[]}}
function createTacticalOrderState(){return {selected:[],offer:null,history:[],nextOfferId:1,attackMilestones:[]}}
function gameplayStageRuleContext(context){
 if(context)return context;
 if(typeof state!=='undefined'&&state?.levelConfig)return {season:state.season??1,faction:state.faction,level:state.level,levelConfig:state.levelConfig,time:state.time||0,zombies:state.zombies||[],bossSpawned:!!state.bossSpawned,qinBossAlive:!!state.zombies?.some(unit=>unit.boss&&unit.type==='qinEmperor'&&unit.hp>0)};
 const season=typeof currentSeason==='number'?currentSeason:1,faction=typeof currentFaction==='string'?currentFaction:'plants',level=typeof selectedLevel==='number'?selectedLevel:1;
 let levelConfig=null;try{levelConfig=typeof campaignLevels==='function'?campaignLevels(season)?.[level]:null}catch(error){}
 return {season,faction,level,levelConfig,time:0,zombies:[],bossSpawned:false,qinBossAlive:false};
}
function createGameplayState(context){const ruleContext=gameplayStageRuleContext(context);return {version:GAMEPLAY_STATE_VERSION,telemetry:createBattleTelemetry(),report:createBattleReportState(),telegraphs:createBattleTelegraphState(),orders:createTacticalOrderState(),challenge:createChallengeBattleState(context?.challengeIds),stageRule:createStageRuleRuntime(ruleContext)}}
function finiteNonnegative(value){value=Number(value);return Number.isFinite(value)&&value>=0?value:0}
function normalizeSource(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 return {
  side:BATTLE_SIDES.includes(raw.side)?raw.side:null,
  type:typeof raw.type==='string'?raw.type:null,
  damage:finiteNonnegative(raw.damage),
  kills:finiteNonnegative(raw.kills),
  controlCount:finiteNonnegative(raw.controlCount),
  controlDuration:finiteNonnegative(raw.controlDuration)
 };
}
function normalizeBattleTelemetry(raw){
 const telemetry=createBattleTelemetry();
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return telemetry;
 const totals=raw.totals||{};
 for(const side of BATTLE_SIDES){
  telemetry.totals.damageDealt[side]=finiteNonnegative(totals.damageDealt?.[side]);
  telemetry.totals.damageTaken[side]=finiteNonnegative(totals.damageTaken?.[side]);
  telemetry.totals.kills[side]=finiteNonnegative(totals.kills?.[side]);
  telemetry.totals.control[side].count=finiteNonnegative(totals.control?.[side]?.count);
  telemetry.totals.control[side].duration=finiteNonnegative(totals.control?.[side]?.duration);
  telemetry.totals.resources[side].gained=finiteNonnegative(totals.resources?.[side]?.gained);
  telemetry.totals.resources[side].spent=finiteNonnegative(totals.resources?.[side]?.spent);
  telemetry.totals.resources[side].net=Number.isFinite(Number(totals.resources?.[side]?.net))?Number(totals.resources[side].net):telemetry.totals.resources[side].gained-telemetry.totals.resources[side].spent;
 }
 telemetry.totals.waves.started=finiteNonnegative(totals.waves?.started);
 telemetry.totals.waves.completed=finiteNonnegative(totals.waves?.completed);
 telemetry.totals.waves.current=finiteNonnegative(totals.waves?.current);
 if(raw.bySource&&typeof raw.bySource==='object'&&!Array.isArray(raw.bySource))for(const [id,value] of Object.entries(raw.bySource)){const source=normalizeSource(value);if(source)telemetry.bySource[id]=source}
 if(raw.byTarget&&typeof raw.byTarget==='object'&&!Array.isArray(raw.byTarget))for(const [id,value] of Object.entries(raw.byTarget)){
  if(!value||typeof value!=='object'||Array.isArray(value))continue;
  telemetry.byTarget[id]={side:BATTLE_SIDES.includes(value.side)?value.side:null,type:typeof value.type==='string'?value.type:null,damageTaken:finiteNonnegative(value.damageTaken)};
 }
 if(Array.isArray(raw.events))telemetry.events=raw.events.filter(event=>event&&typeof event==='object'&&!Array.isArray(event)).map(event=>jsonSafeEvent(event));
 telemetry.nextEventId=finiteNonnegative(raw.nextEventId)||1;
 for(const event of telemetry.events)telemetry.nextEventId=Math.max(telemetry.nextEventId,finiteNonnegative(event.id)+1);
 return telemetry;
}
function normalizeBattleReport(raw){
 const report=createBattleReportState();
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return report;
 report.initialized=Object.prototype.hasOwnProperty.call(raw,'initialized')?raw.initialized!==false:false;
 if(raw.baseline&&typeof raw.baseline==='object'&&!Array.isArray(raw.baseline))report.baseline=JSON.parse(JSON.stringify(raw.baseline));
 if(raw.current&&typeof raw.current==='object'&&!Array.isArray(raw.current))report.current=JSON.parse(JSON.stringify(raw.current));
 if(Array.isArray(raw.attackMilestones))report.attackMilestones=raw.attackMilestones.map(Number).filter(value=>[30,60,90].includes(value));
 return report;
}
function normalizeBattleTelegraphs(raw){
 const result=createBattleTelegraphState();
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
 if(Array.isArray(raw.active))result.active=raw.active.filter(item=>item&&typeof item==='object'&&!Array.isArray(item)).map(item=>{
  const clean=JSON.parse(JSON.stringify(item));
  clean.id=Math.max(1,Math.floor(finiteNonnegative(clean.id)||1));
  clean.createdAt=finiteNonnegative(clean.createdAt);clean.executeAt=Math.max(clean.createdAt,finiteNonnegative(clean.executeAt));clean.duration=Math.max(0,clean.executeAt-clean.createdAt);
  clean.targets=Array.isArray(clean.targets)?clean.targets.filter(target=>target&&typeof target==='object'&&!Array.isArray(target)).map(target=>jsonSafeEvent(target)):[];
  clean.data=jsonSafeEvent(clean.data);return clean;
 });
 result.nextId=Math.max(1,Math.floor(finiteNonnegative(raw.nextId)||1));
 for(const item of result.active)result.nextId=Math.max(result.nextId,item.id+1);
 return result;
}
function normalizeTacticalOrders(raw){
 const result=createTacticalOrderState();
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
 const known=id=>typeof id==='string'&&!!tacticalOrderById(id),uniqueKnown=value=>Array.isArray(value)?[...new Set(value.filter(known))]:[];
 result.selected=uniqueKnown(raw.selected);
 result.history=uniqueKnown(raw.history);
 const offer=uniqueKnown(raw.offer);
 if(offer.length===3){result.offer=offer;result.resumeAfterSelection=raw.resumeAfterSelection===true}
 result.nextOfferId=Math.max(1,Math.floor(finiteNonnegative(raw.nextOfferId)||1));
 result.attackMilestones=Array.isArray(raw.attackMilestones)?[...new Set(raw.attackMilestones.filter(id=>['defender-break','time-pressure'].includes(id)))]:[];
 return result;
}
function normalizeGameplayState(raw,context){
 const ruleContext=gameplayStageRuleContext(context);
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==GAMEPLAY_STATE_VERSION)return createGameplayState(ruleContext);
 const gameplay={version:GAMEPLAY_STATE_VERSION,telemetry:normalizeBattleTelemetry(raw.telemetry),report:normalizeBattleReport(raw.report),telegraphs:normalizeBattleTelegraphs(raw.telegraphs),orders:normalizeTacticalOrders(raw.orders),stageRule:normalizeStageRuleRuntime(raw.stageRule,ruleContext),challenge:normalizeChallengeBattleState(raw.challenge)};
 if(!Object.prototype.hasOwnProperty.call(raw,'report'))gameplay.report.initialized=false;
 return gameplay;
}
function effectiveBattleModifier(key,battle=state){
 if(typeof key!=='string'||!key)return 1;
 const selected=battle?.gameplay?.orders?.selected;
 if(!Array.isArray(selected))return 1;
 let value=1;
 for(const id of selected){const modifier=Number(tacticalOrderById(id)?.modifiers?.[key]);if(Number.isFinite(modifier))value+=modifier-1}
 return Math.round(Math.max(.5,Math.min(1.5,value))*10000)/10000;
}
function roundBattleValue(value){return Math.max(1,Math.round(value))}
function applyTacticalOrderUnitModifier(side,key,unit,battle=state){
 if(!unit||!battle||side!==battle.faction)return unit;
 const out={...unit},generic=effectiveBattleModifier('damage',battle),ranged=effectiveBattleModifier('rangedDamage',battle),melee=effectiveBattleModifier('meleeDamage',battle),health=effectiveBattleModifier('unitHealth',battle),speed=effectiveBattleModifier('movementSpeed',battle),attackSpeed=effectiveBattleModifier('attackSpeed',battle),shield=effectiveBattleModifier('shield',battle),healing=effectiveBattleModifier('healing',battle);
 const isRanged=(out.range||0)>1.2||out.shoot||out.catapult||out.curse||out.laugh||out.tripleShot;
 const rangedStats=new Set(['catapultDamage','laughDamage','curseDamage','curseAdjacentDamage']);
 const meleeStats=new Set(['meleeDamage','smashDamage','bombDamage']);
 for(const stat of ['damage','meleeDamage','catapultDamage','smashDamage','bombDamage','laughDamage','curseDamage','curseAdjacentDamage'])if(out[stat]!=null){const role=rangedStats.has(stat)||stat==='damage'&&isRanged?ranged:meleeStats.has(stat)||stat==='damage'&&!isRanged?melee:1;out[stat]=roundBattleValue(out[stat]*generic*role)}
 if(out.hp!=null)out.hp=roundBattleValue(out.hp*health);
 for(const stat of ['rate','supportRate','catapultRate','smashRate','laughRate','curseRate','shootRate','summonRate'])if(out[stat]!=null)out[stat]=roundBattleValue(out[stat]/attackSpeed);
 for(const stat of ['speed','spentSpeed'])if(out[stat]!=null)out[stat]=Math.max(.001,out[stat]*speed);
 for(const stat of ['shieldHp','shield','block'])if(out[stat]!=null)out[stat]=roundBattleValue(out[stat]*shield);
 for(const stat of ['heal','healing','healAmount'])if(out[stat]!=null)out[stat]=roundBattleValue(out[stat]*healing);
 return out;
}
function clampBattleUnit(unit,baseline){
 const out={...unit};
 for(const stat of ['hp','damage','meleeDamage','catapultDamage','smashDamage','bombDamage','laughDamage','curseDamage','curseAdjacentDamage','shieldHp','shield','block','heal','healing','healAmount'])if(out[stat]!=null&&baseline?.[stat]!=null)out[stat]=Math.max(1,Math.min(roundBattleValue(baseline[stat]*1.5),roundBattleValue(out[stat])));
 const minimums={rate:350,supportRate:350,catapultRate:1200,smashRate:900,laughRate:1600,curseRate:1400,shootRate:350,summonRate:350};
 for(const [stat,minimum] of Object.entries(minimums))if(out[stat]!=null){const floor=baseline?.[stat]!=null?Math.max(minimum,Math.round(baseline[stat]/1.5)):minimum,ceiling=baseline?.[stat]!=null?Math.round(baseline[stat]/.5):Infinity;out[stat]=Math.max(floor,Math.min(ceiling,Math.round(out[stat])))}
 for(const stat of ['speed','spentSpeed'])if(out[stat]!=null&&baseline?.[stat]!=null)out[stat]=Math.max(baseline[stat]*.5,Math.min(baseline[stat]*1.5,out[stat]));
 return out;
}
function resolveBattleUnit(side,key,battle=state,context={}){
 const playerControlled=!!battle&&battle.faction===side,base=baseUnit(side,key);if(!base)return {unit:base,layers:[],sources:[]};
 const fairMode=playerControlled&&battle?.gameplay?.challenge?.fairMode===true,permanentLayers=playerControlled&&!fairMode&&typeof permanentUnitLayers==='function'?permanentUnitLayers(side,key):null,permanent=permanentLayers?.fixedTalent||base;
 const layers=[
  {id:'base-equipment',unit:{...(permanentLayers?.equipment||base)}},
  {id:'character-level',unit:{...(permanentLayers?.characterLevel||base)}},
  {id:'fixed-talent',unit:{...permanent}},
 ],sources=permanentLayers?[{layer:'base-equipment',effects:permanentLayers.sources.equipmentEffects},{layer:'character-level',...permanentLayers.sources.level},{layer:'fixed-talent',effects:permanentLayers.sources.talentEffects}]:[];
 let unit=applyCombinationUnitModifier(side,key,permanent,battle);const synergies=activeCombinationDefinitions(side,battle).filter(definition=>definition.members.includes(key));if(synergies.length)sources.push({layer:'synergy',ids:synergies.map(definition=>definition.id)});layers.push({id:'synergy',unit:{...unit}});
 const tacticalBefore=unit;unit=applyTacticalOrderUnitModifier(side,key,unit,battle);if(JSON.stringify(unit)!==JSON.stringify(tacticalBefore))sources.push({layer:'tactical-order',ids:[...(battle?.gameplay?.orders?.selected||[])]});layers.push({id:'tactical-order',unit:{...unit}});
 const row=Number.isInteger(context?.row)?context.row:null,stage=row!==null&&typeof stageRuleMovementMultiplier==='function'?stageRuleMovementMultiplier(side,row,battle?.gameplay?.stageRule?.data):1,temporary=Number.isFinite(Number(context?.movementMultiplier))?Number(context.movementMultiplier):1;
 if(stage!==1||temporary!==1)for(const stat of ['speed','spentSpeed'])if(unit[stat]!=null)unit[stat]*=stage*temporary;
 layers.push({id:'temporary-stage-status',unit:{...unit}});if(stage!==1||temporary!==1)sources.push({layer:'temporary-stage-status',ids:[...(stage!==1&&battle?.gameplay?.stageRule?.id?[battle.gameplay.stageRule.id]:[]),...(temporary!==1?['entity-movement-status']:[])]});
 unit=clampBattleUnit(unit,permanent);sources.push({layer:'clamp',min:.5,max:1.5});layers.push({id:'clamp',unit:{...unit}});return {unit,layers,sources};
}
function battleDeploymentCost(amount,battle=state){return Math.max(0,Math.round(Number(amount||0)*effectiveBattleModifier('deploymentCost',battle)))}
function battleRelocationCost(amount,battle=state){return Math.max(0,Math.round(Number(amount||0)*effectiveBattleModifier('relocationCost',battle)))}
function battleIncomeAmount(amount,recipient='player',battle=state){const key=recipient==='enemy'?'enemyResourceIncome':'resourceIncome';return Math.max(0,Math.round(Number(amount||0)*effectiveBattleModifier(key,battle)))}
function battleEnemySpawnInterval(amount,battle=state){return Math.max(1,Math.round(Number(amount||0)*effectiveBattleModifier('enemySpawnInterval',battle)))}
function battleHealingAmount(amount,healerSide=state?.faction,battle=state){const modifier=battle&&healerSide===battle.faction?effectiveBattleModifier('healing',battle):1;return Math.max(0,Math.round(Number(amount||0)*modifier))}
function battleDamageTaken(amount,side,battle=state){return side===battle?.faction?Number(amount||0)*effectiveBattleModifier('damageTaken',battle):Number(amount||0)}
function battleMovementSpeed(side,key,row,battle=state,{stat='speed',movementMultiplier=1}={}){return resolveBattleUnit(side,key,battle,{row,movementMultiplier}).unit?.[stat]||0}
function battleAttackInterval(side,key,stat='rate',fallback=700,battle=state){const resolved=resolveBattleUnit(side,key,battle).unit?.[stat];if(Number.isFinite(Number(resolved)))return Number(resolved);const speed=side===battle?.faction?effectiveBattleModifier('attackSpeed',battle):1;return Math.max(350,Math.round(Number(fallback)/speed))}
function tacticalOrderState(){
 if(!state)return null;
 if(!state.gameplay||state.gameplay.version!==GAMEPLAY_STATE_VERSION)state.gameplay=normalizeGameplayState(state.gameplay);
 if(!state.gameplay.orders)state.gameplay.orders=createTacticalOrderState();
 return state.gameplay.orders;
}
function tacticalOrderPoolForBattle(battle=state){
 const route=typeof campaignRouteMatrixFor==='function'?campaignRouteMatrixFor(battle?.season,battle?.faction,battle?.level):null;
 return route?.orderPool?[...route.orderPool]:TACTICAL_ORDERS.map(order=>order.id);
}
window.tacticalOrderPoolForBattle=tacticalOrderPoolForBattle;
function createTacticalOrderOffer(triggerId){
 const orders=tacticalOrderState();
 if(!orders||orders.offer||!BATTLE_SIDES.includes(state.faction)||state.over||typeof activeCampaignStory!=='undefined'&&activeCampaignStory)return false;
 const routePool=tacticalOrderPoolForBattle(state);
 let pool=routePool.filter(id=>!orders.selected.includes(id));
 if(pool.length<3)pool=[...routePool];
 const seed=(Number(state.season)||1)*17+(Number(state.level)||1)*7+orders.nextOfferId*3+(Number(triggerId)||0);
 const offset=((seed%pool.length)+pool.length)%pool.length;
 orders.offer=Array.from({length:3},(_,index)=>pool[(offset+index)%pool.length]);
 orders.resumeAfterSelection=!state.paused;
 orders.nextOfferId++;
 state.paused=true;state.actionMode=null;state.movingPlantId=null;
 applyPausedBattleUI();updateBattleActionUI();renderTacticalOrderOffer();persistBattleState();
 return orders.offer;
}
function updateAttackTacticalOrders(){
 if(!state||state.faction!=='zombies'||state.over)return false;
 const orders=tacticalOrderState();
 if(!orders||orders.offer||orders.attackMilestones.length>=2)return false;
 const limit=Number(state.levelConfig?.attackTimeLimit)||0;
 let milestone=null,triggerId=0;
 if(!orders.attackMilestones.includes('defender-break')&&finiteNonnegative(state.gameplay?.telemetry?.totals?.kills?.zombies)>0){milestone='defender-break';triggerId=101}
 else if(!orders.attackMilestones.includes('time-pressure')&&limit>0&&finiteNonnegative(state.time)>=limit*.6){milestone='time-pressure';triggerId=102}
 if(!milestone||!createTacticalOrderOffer(triggerId))return false;
 orders.attackMilestones.push(milestone);persistBattleState();return true;
}
function tacticalOrderEntitySnapshot(){
 if(!state||!BATTLE_SIDES.includes(state.faction))return [];
 const entities=state.faction==='plants'?state.plants:state.zombies;
 return (entities||[]).map(entity=>({id:entity.id,unit:resolveBattleUnit(state.faction,entity.type,state).unit}));
}
function applyTacticalOrderEntityTransition(before){
 if(!state||!Array.isArray(before))return;
 const entities=state.faction==='plants'?state.plants:state.zombies,byId=new Map(before.map(item=>[item.id,item.unit]));
 for(const entity of entities||[]){
  const oldUnit=byId.get(entity.id),nextUnit=resolveBattleUnit(state.faction,entity.type,state).unit;if(!oldUnit||!nextUnit)continue;
  if(Number.isFinite(oldUnit.hp)&&oldUnit.hp>0&&Number.isFinite(nextUnit.hp)&&Number.isFinite(entity.maxHp)&&entity.maxHp>0){const ratio=Math.max(0,Math.min(1,entity.hp/entity.maxHp)),nextMax=Math.max(1,Math.round(entity.maxHp*nextUnit.hp/oldUnit.hp));entity.maxHp=nextMax;entity.hp=Math.max(entity.hp>0?1:0,Math.round(nextMax*ratio))}
  if(Number.isFinite(oldUnit.shieldHp)&&oldUnit.shieldHp>0&&Number.isFinite(nextUnit.shieldHp)&&Number.isFinite(entity.maxShieldHp)&&entity.maxShieldHp>0){const ratio=Math.max(0,Math.min(1,entity.shieldHp/entity.maxShieldHp)),nextMax=Math.max(0,Math.round(entity.maxShieldHp*nextUnit.shieldHp/oldUnit.shieldHp));entity.maxShieldHp=nextMax;entity.shieldHp=Math.round(nextMax*ratio)}
 }
}
function chooseTacticalOrder(id){
 const orders=tacticalOrderState();
 if(!orders?.offer?.includes(id))return false;
 const entitySnapshot=tacticalOrderEntitySnapshot();
 if(!orders.selected.includes(id))orders.selected.push(id);
 if(!orders.history.includes(id))orders.history.push(id);
 applyTacticalOrderEntityTransition(entitySnapshot);
 const resume=orders.resumeAfterSelection===true;
 orders.offer=null;delete orders.resumeAfterSelection;
 state.paused=!resume;
 renderTacticalOrderOffer();applyPausedBattleUI();if(typeof updateDeploymentCardCosts==='function')updateDeploymentCardCosts();updateBattleActionUI();updateHUD();persistBattleState();
 const focusTarget=document.getElementById(state.paused?'pauseResumeBtn':'pauseBtn');focusTarget?.focus({preventScroll:true});
 log(`軍令生效：${tacticalOrderById(id)?.name||id}。`);sfx('click');
 return true;
}
function renderTacticalOrderOffer(){
 const dialog=document.getElementById('tacticalOrderDialog');if(!dialog)return;
 const game=document.getElementById('game'),offer=state?.gameplay?.orders?.offer,visible=Array.isArray(offer)&&offer.length===3&&!state.over&&game?.classList.contains('active');
 if(game)game.inert=visible;
 dialog.hidden=!visible;dialog.classList.toggle('show',visible);
 const options=dialog.querySelector('.tactical-order-options');
 if(!visible){options?.replaceChildren();if(options)delete options.dataset.offerSignature;return}
 const signature=offer.join('|');
 if(options.dataset.offerSignature!==signature){
  options.replaceChildren(...offer.map(id=>{
   const order=tacticalOrderById(id),button=document.createElement('button');button.type='button';button.className='tactical-order-card';button.dataset.tacticalOrder=id;
   const title=document.createElement('strong'),benefit=document.createElement('span'),cost=document.createElement('span'),duration=document.createElement('small');
   title.textContent=order.name;benefit.className='benefit';benefit.textContent=`收益｜${order.benefit}`;cost.className='cost';cost.textContent=`代價｜${order.cost}`;duration.textContent=order.duration==='battle'?'作用時間｜本局永久':`作用時間｜${order.duration}`;
   button.append(title,benefit,cost,duration);button.onclick=()=>chooseTacticalOrder(id);return button;
  }));options.dataset.offerSignature=signature;
 }
 queueMicrotask(()=>options.querySelector('button')?.focus({preventScroll:true}));
}
function jsonSafeEvent(raw){
 const event={};
 for(const [key,value] of Object.entries(raw||{})){
  if(value===null||typeof value==='string'||typeof value==='boolean'||(typeof value==='number'&&Number.isFinite(value)))event[key]=value;
 }
 return event;
}
function gameplayTelemetry(){
 if(!state)return null;
 if(!state.gameplay||state.gameplay.version!==GAMEPLAY_STATE_VERSION)state.gameplay=normalizeGameplayState(state.gameplay);
 return state.gameplay.telemetry;
}
function gameplayTelegraphs(){
 if(!state)return null;
 if(!state.gameplay||state.gameplay.version!==GAMEPLAY_STATE_VERSION)state.gameplay=normalizeGameplayState(state.gameplay);
 if(!state.gameplay.telegraphs)state.gameplay.telegraphs=createBattleTelegraphState();
 return state.gameplay.telegraphs;
}
function createEnemyTelegraph(kind,{source=null,sourceId=null,sourceType=null,duration=null,targets=[],cancelOnSourceDeath=true,data={}}={}){
 const telegraphs=gameplayTelegraphs();if(!telegraphs||typeof kind!=='string'||!kind)return null;
 const rule=ENEMY_TELEGRAPH_RULES[kind]||{},createdAt=finiteNonnegative(state.time),delay=finiteNonnegative(duration??rule.duration),safeData={...jsonSafeEvent(data),label:rule.label||data.label||kind,icon:rule.icon||data.icon||'!',counter:rule.counter||data.counter||''},item={id:telegraphs.nextId++,kind,sourceId:sourceId||source?.id||null,sourceType:sourceType||source?.type||null,createdAt,executeAt:createdAt+delay,duration:delay,cancelOnSourceDeath:cancelOnSourceDeath!==false,targets:Array.isArray(targets)?targets.map(target=>jsonSafeEvent(target)):[],data:safeData};
 telegraphs.active.push(item);return item;
}
function cancelEnemyTelegraphsForSource(sourceId){
 const telegraphs=gameplayTelegraphs();if(!telegraphs||!sourceId)return 0;
 const before=telegraphs.active.length;telegraphs.active=telegraphs.active.filter(item=>item.sourceId!==sourceId);return before-telegraphs.active.length;
}
function hasEnemyTelegraph(sourceId,kind){return !!gameplayTelegraphs()?.active.some(item=>item.sourceId===sourceId&&(!kind||item.kind===kind))}
function processEnemyTelegraphs(){
 const telegraphs=gameplayTelegraphs();if(!telegraphs||!telegraphs.active.length)return 0;
 const waiting=[],due=[];
 for(const item of telegraphs.active){
  const source=[...(state.zombies||[]),...(state.plants||[])].find(unit=>unit.id===item.sourceId);
  if(item.cancelOnSourceDeath&&(!source||source.hp<=0))continue;
  if(item.executeAt>finiteNonnegative(state.time))waiting.push(item);else due.push(item);
 }
 telegraphs.active=waiting;
 for(const item of due)if(typeof resolveEnemyTelegraph==='function')resolveEnemyTelegraph(item);
 return due.length;
}
function sourceStats(telemetry,payload){
 const id=typeof payload.sourceId==='string'&&payload.sourceId?payload.sourceId:(typeof payload.sourceType==='string'&&payload.sourceType?`type:${payload.sourceType}`:null);
 if(!id)return null;
 const current=telemetry.bySource[id]||{side:BATTLE_SIDES.includes(payload.sourceSide)?payload.sourceSide:null,type:typeof payload.sourceType==='string'?payload.sourceType:null,damage:0,kills:0,controlCount:0,controlDuration:0};
 if(!current.side&&BATTLE_SIDES.includes(payload.sourceSide))current.side=payload.sourceSide;
 if(!current.type&&typeof payload.sourceType==='string')current.type=payload.sourceType;
 telemetry.bySource[id]=current;
 return current;
}
function targetStats(telemetry,payload){
 const id=typeof payload.targetId==='string'&&payload.targetId?payload.targetId:(typeof payload.targetType==='string'&&payload.targetType?`type:${payload.targetType}`:null);
 if(!id)return null;
 const current=telemetry.byTarget[id]||{side:BATTLE_SIDES.includes(payload.targetSide)?payload.targetSide:null,type:typeof payload.targetType==='string'?payload.targetType:null,damageTaken:0};
 if(!current.side&&BATTLE_SIDES.includes(payload.targetSide))current.side=payload.targetSide;
 if(!current.type&&typeof payload.targetType==='string')current.type=payload.targetType;
 telemetry.byTarget[id]=current;
 return current;
}
function recordBattleEvent(type,payload={}){
 const telemetry=gameplayTelemetry();
 if(!telemetry||!['damage','kill','control','resource','wave','deploy','relocation','leak','outcome'].includes(type))return false;
 const clean=jsonSafeEvent(payload),event={id:telemetry.nextEventId++,type,time:finiteNonnegative(state.time),...clean};
 if(type==='damage'){
  const amount=finiteNonnegative(clean.amount);if(!amount||!BATTLE_SIDES.includes(clean.sourceSide)||!BATTLE_SIDES.includes(clean.targetSide))return false;
  telemetry.totals.damageDealt[clean.sourceSide]+=amount;telemetry.totals.damageTaken[clean.targetSide]+=amount;
  const source=sourceStats(telemetry,clean);if(source)source.damage+=amount;
  const target=targetStats(telemetry,clean);if(target)target.damageTaken+=amount;
 }else if(type==='kill'){
  if(!BATTLE_SIDES.includes(clean.sourceSide))return false;
  telemetry.totals.kills[clean.sourceSide]++;const source=sourceStats(telemetry,clean);if(source)source.kills++;
 }else if(type==='control'){
  if(!BATTLE_SIDES.includes(clean.sourceSide))return false;
  const duration=finiteNonnegative(clean.duration);telemetry.totals.control[clean.sourceSide].count++;telemetry.totals.control[clean.sourceSide].duration+=duration;
  const source=sourceStats(telemetry,clean);if(source){source.controlCount++;source.controlDuration+=duration}
 }else if(type==='resource'){
  if(!BATTLE_SIDES.includes(clean.side)||!Number.isFinite(Number(clean.amount))||Number(clean.amount)===0)return false;
  const amount=Number(clean.amount),bucket=telemetry.totals.resources[clean.side];if(amount>0)bucket.gained+=amount;else bucket.spent+=-amount;bucket.net+=amount;
 }else if(type==='wave'){
  const wave=Math.max(0,Math.floor(finiteNonnegative(clean.wave)));telemetry.totals.waves.current=wave;
  if(clean.phase==='start')telemetry.totals.waves.started++;else if(clean.phase==='complete')telemetry.totals.waves.completed++;
 }
 telemetry.events.push(event);return true;
}
function battleStatsSnapshot(){
 const telemetry=gameplayTelemetry()||createBattleTelemetry();
 return JSON.parse(JSON.stringify({totals:telemetry.totals,bySource:telemetry.bySource,byTarget:telemetry.byTarget,eventCount:telemetry.events.length}));
}
function battleEntitySide(entity){
 if(!state||!entity)return null;
 if(state.plants?.some(unit=>unit===entity||unit.id===entity.id))return 'plants';
 if(state.zombies?.some(unit=>unit===entity||unit.id===entity.id))return 'zombies';
 return null;
}
function applyBattleDamage(target,amount,context={}){
 if(!target||!Number.isFinite(Number(amount)))return target?.hp;
 const damage=Number(amount),before=Number(target.hp);target.hp=before-damage;
 if(damage<=0||before<=0)return target.hp;
 const actual=Math.min(before,damage),source=context.source||null,sourceSide=context.sourceSide||battleEntitySide(source),targetSide=context.targetSide||battleEntitySide(target);
 const payload={sourceSide,sourceId:context.sourceId||source?.summonerId||source?.id||null,sourceType:context.sourceType||source?.summonerType||source?.type||null,targetSide,targetId:target.id||null,targetType:target.type||null,amount:actual,kind:context.kind||'direct'};
 if(actual>0)recordBattleEvent('damage',payload);
 if(target.hp<=0)recordBattleEvent('kill',payload);
 return target.hp;
}
function recordBattleControl(target,context={}){
 if(!target||Number(target.hp)<=0)return false;
 const source=context.source||null;
 return recordBattleEvent('control',{sourceSide:context.sourceSide||battleEntitySide(source),sourceId:context.sourceId||source?.summonerId||source?.id||null,sourceType:context.sourceType||source?.summonerType||source?.type||null,targetSide:context.targetSide||battleEntitySide(target),targetId:target.id||null,targetType:target.type||null,kind:context.kind||'control',duration:finiteNonnegative(context.duration)});
}
function changeBattleResource(side,amount,reason='unknown'){
 if(!state||!BATTLE_SIDES.includes(side)||!Number.isFinite(Number(amount)))return false;
 const playerSide=state.faction,field=side===playerSide?'resource':'aiResource',applied=Number(amount);
 state[field]+=applied;recordBattleEvent('resource',{side,amount:applied,reason});return true;
}
function grantBattleIncome(side,amount,reason='income'){
 if(!state||!BATTLE_SIDES.includes(side)||!Number.isFinite(Number(amount)))return 0;
 const applied=battleIncomeAmount(amount,side===state.faction?'player':'enemy');changeBattleResource(side,applied,reason);return applied;
}
function initializeBattleReports(){
 if(!state)return false;
 if(!state.gameplay||state.gameplay.version!==GAMEPLAY_STATE_VERSION||!state.gameplay.telemetry||!state.gameplay.report)state.gameplay=normalizeGameplayState(state.gameplay);
 const report=state.gameplay.report;
 if(!report.initialized){
  report.baseline=battleStatsSnapshot();
  if(state.faction==='zombies'){
   const limit=Number(state.levelConfig?.attackTimeLimit)||0;
   if(limit>0)report.attackMilestones=[30,60,90].filter(milestone=>finiteNonnegative(state.time)>=limit*milestone/100);
  }
  report.initialized=true;
 }
 if(!report.baseline)report.baseline=battleStatsSnapshot();
 return true;
}
function beginBattleReportSegment(kind,segmentId,label){
 if(!state)return false;
 initializeBattleReports();
 state.gameplay.report.baseline=battleStatsSnapshot();
 state.gameplay.report.segment={kind,segmentId,label};
 return true;
}
function reportLeader(current,baseline,side,metric){
 let leader=null;
 for(const [id,value] of Object.entries(current||{})){
  if(value.side!==side)continue;
  const amount=finiteNonnegative(value[metric])-finiteNonnegative(baseline?.[id]?.[metric]);
  if(amount>0&&(!leader||amount>leader.amount))leader={id,type:value.type,amount};
 }
 return leader;
}
function unitReportName(side,type){
 const unit=(side==='plants'?PLANT_TYPES:ZOMBIE_TYPES)?.[type];
 return unit?.name||null;
}
function completeBattleReportSegment(kind,segmentId,label){
 if(!state)return false;
 initializeBattleReports();
 const report=state.gameplay.report,baseline=report.baseline||battleStatsSnapshot(),current=battleStatsSnapshot(),side=state.faction;
 const outputLeader=reportLeader(current.bySource,baseline.bySource,side,'damage');
 const takenLeader=reportLeader(current.byTarget,baseline.byTarget,side,'damageTaken');
 const controlLeader=reportLeader(current.bySource,baseline.bySource,side,'controlDuration');
 report.current={
  kind,segmentId,label,
  damageDealt:finiteNonnegative(current.totals.damageDealt[side])-finiteNonnegative(baseline.totals?.damageDealt?.[side]),
  damageTaken:finiteNonnegative(current.totals.damageTaken[side])-finiteNonnegative(baseline.totals?.damageTaken?.[side]),
  kills:finiteNonnegative(current.totals.kills[side])-finiteNonnegative(baseline.totals?.kills?.[side]),
  controlDuration:finiteNonnegative(current.totals.control[side].duration)-finiteNonnegative(baseline.totals?.control?.[side]?.duration),
  resourceNet:Number(current.totals.resources[side].net||0)-Number(baseline.totals?.resources?.[side]?.net||0),
  outputLeader:outputLeader?{...outputLeader,name:unitReportName(side,outputLeader.type)}:null,
  takenLeader:takenLeader?{...takenLeader,name:unitReportName(side,takenLeader.type)}:null,
  controlLeader:controlLeader?{...controlLeader,name:unitReportName(side,controlLeader.type)}:null,
  shownAt:finiteNonnegative(state.time),expiresAt:finiteNonnegative(state.time)+6000,dismissed:false
 };
 report.baseline=current;
 renderBattleReport();
 return report.current;
}
function updateAttackMilestoneReports(){
 if(!state||state.faction!=='zombies'||state.over)return false;
 initializeBattleReports();
 const report=state.gameplay.report,limit=Number(state.levelConfig?.attackTimeLimit)||0;
 if(!limit)return false;
 let changed=false;
 for(const milestone of [30,60,90]){
  if(report.attackMilestones.includes(milestone)||state.time<limit*milestone/100)continue;
  report.attackMilestones.push(milestone);
  completeBattleReportSegment('attack-milestone',milestone,`攻城 ${milestone}%`);
  changed=true;
 }
 if(changed)persistBattleState();
 return changed;
}
function dismissBattleReport(){
 const current=state?.gameplay?.report?.current;if(!current)return false;
 current.dismissed=true;renderBattleReport();persistBattleState();return true;
}
function reportNumber(value){return Math.round(finiteNonnegative(value))}
function reportStatRow(label,value){const row=document.createElement('span'),heading=document.createElement('b');heading.textContent=label;row.append(heading,document.createTextNode(String(value)));return row}
function renderBattleReport(){
 const el=document.getElementById('waveReport');if(!el)return;
 const current=state?.gameplay?.report?.current;
 const visible=!!current&&!current.dismissed&&finiteNonnegative(state.time)<finiteNonnegative(current.expiresAt);
 if(!visible){if(!el.hidden)el.hidden=true;delete el.dataset.reportSignature;return}
 const title=current.kind==='attack-milestone'?`${current.label} 戰報`:`${current.label}戰報`;
 const outputName=current.outputLeader?unitReportName(state.faction,current.outputLeader.type):null;
 const takenName=current.takenLeader?unitReportName(state.faction,current.takenLeader.type):null;
 const controlName=current.controlLeader?unitReportName(state.faction,current.controlLeader.type):null;
 const net=Number(current.resourceNet)||0;
 const rows=[];
 if(outputName)rows.push(['最高輸出',`${outputName} ${reportNumber(current.outputLeader.amount)}`]);
 if(takenName)rows.push(['最高承傷',`${takenName} ${reportNumber(current.takenLeader.amount)}`]);
 if(controlName)rows.push(['控制貢獻',`${controlName} ${(finiteNonnegative(current.controlLeader.amount)/1000).toFixed(1)} 秒`]);
 rows.push(['擊殺',reportNumber(current.kills)],['資源淨變化',`${net>=0?'+':''}${Math.round(net)}`]);
 const signature=JSON.stringify([title,rows]);
 if(!el.hidden&&el.dataset.reportSignature===signature)return;
 const titleEl=el.querySelector('.wave-report-title'),statsEl=el.querySelector('.wave-report-stats');
 titleEl.textContent=title;statsEl.replaceChildren(...rows.map(([label,value])=>reportStatRow(label,value)));
 el.dataset.reportSignature=signature;if(el.hidden)el.hidden=false;
}
