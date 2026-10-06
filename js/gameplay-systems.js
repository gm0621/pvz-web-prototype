const GAMEPLAY_STATE_VERSION=1;
const BATTLE_SIDES=['plants','zombies'];

function emptySideNumber(){return {plants:0,zombies:0}}
function emptyControl(){return {plants:{count:0,duration:0},zombies:{count:0,duration:0}}}
function emptyResources(){return {plants:{gained:0,spent:0,net:0},zombies:{gained:0,spent:0,net:0}}}
function createBattleTelemetry(){
 return {
  nextEventId:1,
  events:[],
  totals:{damageDealt:emptySideNumber(),damageTaken:emptySideNumber(),kills:emptySideNumber(),control:emptyControl(),resources:emptyResources(),waves:{started:0,completed:0,current:0}},
  bySource:{}
 };
}
function createGameplayState(){return {version:GAMEPLAY_STATE_VERSION,telemetry:createBattleTelemetry()}}
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
 if(Array.isArray(raw.events))telemetry.events=raw.events.filter(event=>event&&typeof event==='object'&&!Array.isArray(event)).map(event=>jsonSafeEvent(event));
 telemetry.nextEventId=Math.max(finiteNonnegative(raw.nextEventId)||1,...telemetry.events.map(event=>finiteNonnegative(event.id)+1));
 return telemetry;
}
function normalizeGameplayState(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==GAMEPLAY_STATE_VERSION)return createGameplayState();
 return {version:GAMEPLAY_STATE_VERSION,telemetry:normalizeBattleTelemetry(raw.telemetry)};
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
 state.gameplay=normalizeGameplayState(state.gameplay);
 return state.gameplay.telemetry;
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
function recordBattleEvent(type,payload={}){
 const telemetry=gameplayTelemetry();
 if(!telemetry||!['damage','kill','control','resource','wave'].includes(type))return false;
 const clean=jsonSafeEvent(payload),event={id:telemetry.nextEventId++,type,time:finiteNonnegative(state.time),...clean};
 if(type==='damage'){
  const amount=finiteNonnegative(clean.amount);if(!amount||!BATTLE_SIDES.includes(clean.sourceSide)||!BATTLE_SIDES.includes(clean.targetSide))return false;
  telemetry.totals.damageDealt[clean.sourceSide]+=amount;telemetry.totals.damageTaken[clean.targetSide]+=amount;
  const source=sourceStats(telemetry,clean);if(source)source.damage+=amount;
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
 }else{
  const wave=Math.max(0,Math.floor(finiteNonnegative(clean.wave)));telemetry.totals.waves.current=wave;
  if(clean.phase==='start')telemetry.totals.waves.started++;else if(clean.phase==='complete')telemetry.totals.waves.completed++;
 }
 telemetry.events.push(event);return true;
}
function battleStatsSnapshot(){
 const telemetry=gameplayTelemetry()||createBattleTelemetry();
 return JSON.parse(JSON.stringify({totals:telemetry.totals,bySource:telemetry.bySource,eventCount:telemetry.events.length}));
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
 const playerSide=state.faction,field=side===playerSide?'resource':'aiResource';state[field]+=Number(amount);recordBattleEvent('resource',{side,amount:Number(amount),reason});return true;
}
