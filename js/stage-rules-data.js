// Stage-rule registry. Runtime data is JSON-safe and advances only from battle time.
function stageRouteKey(context){return `${context.season||1}:${context.faction}:${context.level}`}
function defenseCleared(context){return !!context.bossSpawned&&!(context.zombies||[]).some(unit=>unit.hp>0)}
function attackExpired(context){return context.time>=(context.levelConfig?.attackTimeLimit||90000)}
function immutableRule(spec){
 const contract={
  id:spec.id,title:spec.title,brief:spec.brief||spec.title,archetype:spec.archetype||null,
  objective:spec.objective,
  start:spec.start||(()=>({breached:false})),
  tick:spec.tick||((runtime)=>runtime),
  onEvent:spec.onEvent||((runtime,event)=>event.type==='breach'?{...runtime,breached:true}:runtime),
  isComplete:spec.isComplete,
  isFailed:spec.isFailed
 };
 return Object.freeze(contract)
}
function standardDefenseObjective(context){return ['守住五條戰線，不讓敵軍進入左側城池',`擊敗本關 ${context.levelConfig?.enemyCount||0} 名敵軍與關底大魔王`,'推車只能救場一次；被突破即告失敗']}
function standardAttackObjective(context){return ['從右側第 8、9 欄持續派兵，突破守軍防線','先消耗該路推車，再讓後續僵屍抵達最左側',`在 ${Math.round((context.levelConfig?.attackTimeLimit||90000)/1000)} 秒內完成突破`]}
const STANDARD_DEFENSE_RULE=immutableRule({
 id:'standard-defense',title:'標準守城',objective:standardDefenseObjective,
 isComplete:(runtime,context)=>defenseCleared(context),
 isFailed:runtime=>!!runtime.breached
});
const STANDARD_ATTACK_RULE=immutableRule({
 id:'standard-attack',title:'標準攻城',objective:standardAttackObjective,
 isComplete:runtime=>!!runtime.breached,
 isFailed:(runtime,context)=>attackExpired(context)
});
const QIN_FINALE_RULE=immutableRule({
 id:'qin-finale',title:'虎符破陣・始皇終章',
 objective:()=>['擊敗金色百夫長，收集 3 枚虎符','在軍令值滿前發動破陣，打開 8 秒輸出窗口','擊敗始皇屍帝；任何一路被突破仍會失敗'],
 start:()=>({breached:false,bossDefeated:false}),
 tick:(runtime,context)=>context.bossSpawned&&!context.qinBossAlive?{...runtime,bossDefeated:true}:runtime,
 isComplete:runtime=>!!runtime.bossDefeated,
 isFailed:runtime=>!!runtime.breached
});
const KEEP_MOWERS_RULE=immutableRule({
 id:'keep-mowers',title:'五路推車守備',archetype:'protect',
 objective:()=>['保住五路推車，全關不得啟動任何一台','運用基礎守軍擋住每一路試探','擊敗全數敵軍與關底大魔王'],
 start:()=>({kind:'keep-mowers',breached:false,mowersRemaining:5}),
 onEvent:(runtime,event)=>event.type==='mower-used'?{...runtime,mowersRemaining:Math.max(0,runtime.mowersRemaining-1)}:event.type==='breach'?{...runtime,breached:true}:runtime,
 isComplete:(runtime,context)=>runtime.mowersRemaining===5&&defenseCleared(context),
 isFailed:runtime=>runtime.mowersRemaining<5||!!runtime.breached
});
const ESCORT_GRAIN_RULE=immutableRule({
 id:'escort-grain',title:'護送運糧兵',archetype:'escort',
 objective:()=>['護送中央路運糧兵走完全程','清除靠近運糧兵的敵軍，避免其生命歸零','運糧兵抵達後再擊敗關底大魔王'],
 start:context=>({kind:'escort-grain',breached:false,lastTick:context.time||0,lastDamageAt:context.time||0,escort:{hp:300,maxHp:300,progress:0,c:.7,r:2}}),
 tick:(runtime,context)=>{
  const escort={...runtime.escort},now=context.time||0,dt=Math.max(0,now-(runtime.lastTick||0));
  escort.progress=Math.min(100,escort.progress+dt/500);escort.c=.7+escort.progress*.066;
  let lastDamageAt=runtime.lastDamageAt||0;
  const pressure=(context.zombies||[]).some(z=>z.hp>0&&z.r===escort.r&&Math.abs(z.c-escort.c)<=1.05);
  if(pressure){const pulses=Math.floor(Math.max(0,now-lastDamageAt)/1000);if(pulses){escort.hp=Math.max(0,escort.hp-pulses*12);lastDamageAt+=pulses*1000}}
  else lastDamageAt=now;
  return {...runtime,lastTick:now,lastDamageAt,escort}
 },
 onEvent:(runtime,event)=>event.type==='breach'?{...runtime,breached:true}:runtime,
 isComplete:(runtime,context)=>runtime.escort.hp>0&&runtime.escort.progress>=100&&defenseCleared(context),
 isFailed:runtime=>runtime.escort.hp<=0||!!runtime.breached
});
const LANE_LOCK_RULE=immutableRule({
 id:'lane-lock',title:'烽火封路',archetype:'hazard-lane',
 objective:()=>['每 12 秒會有一路遭烽火封鎖','封鎖路線期間不可在該路部署新守軍','調動既有守軍，擊敗全數敵軍與大魔王'],
 start:context=>({kind:'lane-lock',breached:false,cycle:Math.floor((context.time||0)/12000),blockedLane:Math.floor((context.time||0)/12000)%5}),
 tick:(runtime,context)=>{const cycle=Math.floor((context.time||0)/12000);return cycle===runtime.cycle?runtime:{...runtime,cycle,blockedLane:cycle%5}},
 onEvent:(runtime,event)=>event.type==='breach'?{...runtime,breached:true}:runtime,
 isComplete:(runtime,context)=>defenseCleared(context),
 isFailed:runtime=>!!runtime.breached
});
const DESTROY_ARROW_TOWER_RULE=immutableRule({
 id:'destroy-arrow-tower',title:'限時拔除箭塔',archetype:'destroy-target',
 objective:context=>[`${Math.floor((context.levelConfig?.attackTimeLimit||90000)*.7/1000)} 秒內摧毀標記的守軍箭塔`,'箭塔未毀前抵達城門不算完成任務','箭塔摧毀後護送任一僵屍突破左側'],
 start:context=>({kind:'destroy-arrow-tower',deadline:(context.time||0)+Math.floor((context.levelConfig?.attackTimeLimit||90000)*.7),targetId:null,targetHp:360,targetDestroyed:false,breached:false}),
 tick:(runtime,context)=>{
  const target=(context.plants||[]).find(p=>p.stageTarget==='arrow-tower'&&p.hp>0);
  if(target)return {...runtime,targetId:target.id,targetHp:Math.max(0,target.hp)};
  return runtime.targetId?{...runtime,targetHp:0,targetDestroyed:true}:runtime
 },
 onEvent:(runtime,event)=>event.type==='breach'?{...runtime,breached:true}:runtime,
 isComplete:runtime=>!!runtime.targetDestroyed&&!!runtime.breached,
 isFailed:(runtime,context)=>(context.time>=runtime.deadline&&!runtime.targetDestroyed)||false
});
const ROTATING_FROST_RULE=immutableRule({
 id:'rotating-frost',title:'輪轉霜徑',archetype:'hazard-lane',
 objective:()=>['寒霜每 10 秒依序輪轉到下一路','霜徑上的敵軍移動速度降低 45%','利用減速窗口調整防線並擊敗關底敵軍'],
 start:context=>({kind:'rotating-frost',breached:false,cycle:Math.floor((context.time||0)/10000),frozenLane:Math.floor((context.time||0)/10000)%5}),
 tick:(runtime,context)=>{const cycle=Math.floor((context.time||0)/10000);return cycle===runtime.cycle?runtime:{...runtime,cycle,frozenLane:cycle%5}},
 onEvent:(runtime,event)=>event.type==='breach'?{...runtime,breached:true}:runtime,
 isComplete:(runtime,context)=>defenseCleared(context),
 isFailed:runtime=>!!runtime.breached
});
const ESCORT_RAM_RULE=immutableRule({
 id:'escort-ram',title:'護送破門衝車',archetype:'escort',
 objective:()=>['保護任務衝車沿中央路推進','其他僵屍突破不能取代衝車任務','任務衝車存活並抵達左側城門才算勝利'],
 start:()=>({kind:'escort-ram',escortId:null,escortAlive:true,escortBreached:false}),
 tick:(runtime,context)=>runtime.escortId&&!runtime.escortBreached&&!(context.zombies||[]).some(z=>z.id===runtime.escortId&&z.hp>0)?{...runtime,escortAlive:false}:runtime,
 onEvent:(runtime,event)=>event.type==='breach'&&event.unitId===runtime.escortId&&event.stageEscort==='gate-ram'?{...runtime,escortBreached:true}:runtime,
 isComplete:runtime=>!!runtime.escortAlive&&!!runtime.escortBreached,
 isFailed:(runtime,context)=>!runtime.escortAlive||attackExpired(context)
});
const HOLD_RESERVE_RULE=immutableRule({
 id:'hold-reserve',title:'留糧守城',archetype:'survive-resource',
 objective:()=>['保留至少 80 軍糧直到戰鬥結束','軍糧不足時可等待補給回升，不會立即判負','守住五路並擊敗全數敵軍與關底大魔王'],
 start:context=>({kind:'hold-reserve',breached:false,minimum:stageRuleConfigFor(context).params.minimum,current:Math.floor(context.resource||0)}),
 tick:(runtime,context)=>({...runtime,current:Math.floor(context.resource||0)}),
 onEvent:(runtime,event)=>event.type==='breach'?{...runtime,breached:true}:runtime,
 isComplete:(runtime,context)=>runtime.current>=runtime.minimum&&defenseCleared(context),
 isFailed:runtime=>!!runtime.breached
});
const CAPTURE_SEALS_RULE=immutableRule({
 id:'capture-seals',title:'分路奪印',archetype:'capture-seals',
 objective:context=>['從兩條不同路線突破並奪取軍印','同一路重複突破只計算一次',`在 ${Math.round((context.levelConfig?.attackTimeLimit||90000)/1000)} 秒內奪得兩枚軍印`],
 start:context=>({kind:'capture-seals',requiredLanes:stageRuleConfigFor(context).params.requiredLanes,capturedLanes:[]}),
 onEvent:(runtime,event)=>event.type==='breach'&&Number.isInteger(event.lane)?{...runtime,capturedLanes:[...new Set([...runtime.capturedLanes,event.lane])].sort((a,b)=>a-b)}:runtime,
 isComplete:runtime=>runtime.capturedLanes.length>=runtime.requiredLanes,
 isFailed:(runtime,context)=>attackExpired(context)
});
const FOG_VISION_RULE=immutableRule({
 id:'fog-vision',title:'烽煙視界',archetype:'fog-vision',
 objective:()=>['斥候視界每 9 秒輪轉到下一路','視界外敵軍借霧加速 12%，視界內維持原速','跟隨視界調整防線並擊敗關底敵軍'],
 start:context=>{const {cycleMs,speedMultiplier}=stageRuleConfigFor(context).params,cycle=Math.floor((context.time||0)/cycleMs);return {kind:'fog-vision',breached:false,cycleMs,speedMultiplier,cycle,visibleLane:cycle%5}},
 tick:(runtime,context)=>{const cycle=Math.floor((context.time||0)/runtime.cycleMs);return cycle===runtime.cycle?runtime:{...runtime,cycle,visibleLane:cycle%5}},
 onEvent:(runtime,event)=>event.type==='breach'?{...runtime,breached:true}:runtime,
 isComplete:(runtime,context)=>defenseCleared(context),
 isFailed:runtime=>!!runtime.breached
});
const FORMATION_SHIFT_RULE=immutableRule({
 id:'formation-shift',title:'輪轉破陣',archetype:'formation-shift',
 objective:context=>['依軍陣標記的路線完成突破','錯誤路線不計入破陣進度',`完成兩次輪轉突破，並在 ${Math.round((context.levelConfig?.attackTimeLimit||90000)/1000)} 秒內結束`],
 start:context=>{const {requiredShifts,laneStep}=stageRuleConfigFor(context).params;return {kind:'formation-shift',completedShifts:0,requiredShifts,laneStep,requiredLane:((context.season||1)+(context.level||1))%5}},
 onEvent:(runtime,event)=>event.type==='breach'&&event.lane===runtime.requiredLane?{...runtime,completedShifts:runtime.completedShifts+1,requiredLane:(runtime.requiredLane+runtime.laneStep)%5}:runtime,
 isComplete:runtime=>runtime.completedShifts>=runtime.requiredShifts,
 isFailed:(runtime,context)=>attackExpired(context)
});
const STAGE_RULE_REGISTRY=Object.freeze({
 [STANDARD_DEFENSE_RULE.id]:STANDARD_DEFENSE_RULE,[STANDARD_ATTACK_RULE.id]:STANDARD_ATTACK_RULE,[QIN_FINALE_RULE.id]:QIN_FINALE_RULE,
 [KEEP_MOWERS_RULE.id]:KEEP_MOWERS_RULE,[ESCORT_GRAIN_RULE.id]:ESCORT_GRAIN_RULE,[LANE_LOCK_RULE.id]:LANE_LOCK_RULE,
 [DESTROY_ARROW_TOWER_RULE.id]:DESTROY_ARROW_TOWER_RULE,[ROTATING_FROST_RULE.id]:ROTATING_FROST_RULE,[ESCORT_RAM_RULE.id]:ESCORT_RAM_RULE,
 [HOLD_RESERVE_RULE.id]:HOLD_RESERVE_RULE,[CAPTURE_SEALS_RULE.id]:CAPTURE_SEALS_RULE,[FOG_VISION_RULE.id]:FOG_VISION_RULE,[FORMATION_SHIFT_RULE.id]:FORMATION_SHIFT_RULE
});
const STAGE_RULE_ROUTE_IDS=Object.freeze({
 '1:plants:1':'keep-mowers','1:plants:2':'escort-grain','1:plants:3':'lane-lock','1:plants:4':'hold-reserve','1:plants:5':'fog-vision',
 '1:plants:6':'keep-mowers','1:plants:7':'escort-grain','1:plants:8':'hold-reserve','1:plants:9':'lane-lock','1:plants:10':'fog-vision',
 '1:zombies:1':'destroy-arrow-tower','1:zombies:2':'capture-seals','1:zombies:3':'formation-shift','1:zombies:4':'destroy-arrow-tower','1:zombies:5':'capture-seals',
 '1:zombies:6':'formation-shift','1:zombies:7':'destroy-arrow-tower','1:zombies:8':'capture-seals','1:zombies:9':'formation-shift','1:zombies:10':'destroy-arrow-tower',
 '2:plants:1':'rotating-frost','2:plants:2':'keep-mowers','2:plants:3':'hold-reserve','2:plants:4':'escort-grain','2:plants:5':'fog-vision',
 '2:plants:6':'lane-lock','2:plants:7':'keep-mowers','2:plants:8':'hold-reserve','2:plants:9':'rotating-frost','2:plants:10':'fog-vision',
 '2:zombies:1':'escort-ram','2:zombies:2':'capture-seals','2:zombies:3':'formation-shift','2:zombies:4':'destroy-arrow-tower','2:zombies:5':'escort-ram',
 '2:zombies:6':'capture-seals','2:zombies:7':'formation-shift','2:zombies:8':'destroy-arrow-tower','2:zombies:9':'capture-seals','2:zombies:10':'escort-ram'
});
function stageRuleRouteParams(ruleId){return {
 'keep-mowers':{requiredMowers:5},'escort-grain':{escortHp:300},'lane-lock':{cycleMs:12000},'destroy-arrow-tower':{deadlineRatio:.7},
 'rotating-frost':{cycleMs:10000,slowMultiplier:.55},'escort-ram':{escortHp:620},'hold-reserve':{minimum:80},'capture-seals':{requiredLanes:2},
 'fog-vision':{cycleMs:9000,speedMultiplier:1.12},'formation-shift':{requiredShifts:2,laneStep:2}
 }[ruleId]||{mode:'standard'}}
const STAGE_RULE_ROUTES=Object.freeze(Object.fromEntries(Object.entries(STAGE_RULE_ROUTE_IDS).map(([key,ruleId])=>[key,Object.freeze({ruleId,params:Object.freeze(stageRuleRouteParams(ruleId))})])));
const STAGE_RULES=Object.freeze([STANDARD_DEFENSE_RULE,STANDARD_ATTACK_RULE,QIN_FINALE_RULE,KEEP_MOWERS_RULE,ESCORT_GRAIN_RULE,LANE_LOCK_RULE,DESTROY_ARROW_TOWER_RULE,ROTATING_FROST_RULE,ESCORT_RAM_RULE,HOLD_RESERVE_RULE,CAPTURE_SEALS_RULE,FOG_VISION_RULE,FORMATION_SHIFT_RULE]);
window.STAGE_RULES=STAGE_RULES;
function stageRuleById(id){return STAGE_RULE_REGISTRY[id]||null}
function stageRuleConfigFor(context){if(context.levelConfig?.qinBoss)return {ruleId:'qin-finale',params:{boss:true}};return STAGE_RULE_ROUTES[stageRouteKey(context)]||{ruleId:context.faction==='zombies'?'standard-attack':'standard-defense',params:{mode:context.faction==='zombies'?'attack':'defense'}}}
function stageRuleFor(context){return stageRuleById(stageRuleConfigFor(context).ruleId)}
window.stageRuleById=stageRuleById;window.stageRuleConfigFor=stageRuleConfigFor;window.stageRuleFor=stageRuleFor;
function createStageRuleState(context){const rule=stageRuleFor(context);return {id:rule.id,data:rule.start(context)}}
function normalizeStageRuleState(saved,context){const expected=stageRuleFor(context),rule=stageRuleById(saved?.id)||expected,id=rule===expected?rule.id:expected.id,fallback=expected.start(context),data=saved?.id===id&&saved.data&&typeof saved.data==='object'?{...fallback,...saved.data}:fallback;return {id,data}}
const createStageRuleRuntime=createStageRuleState;
const normalizeStageRuleRuntime=normalizeStageRuleState;
function stageRuleBlockedLane(runtime){return runtime?.kind==='lane-lock'?runtime.blockedLane:null}
function stageRuleMovementMultiplier(side,row,runtime){if(side!=='zombies')return 1;if(runtime?.kind==='rotating-frost'&&row===runtime.frozenLane)return 0.55;if(runtime?.kind==='fog-vision'&&row!==runtime.visibleLane)return runtime.speedMultiplier||1.12;return 1}
