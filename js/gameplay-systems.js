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
  bySource:{},
  byTarget:{}
 };
}
function createBattleReportState(initialized=true){
 const telemetry=createBattleTelemetry();
 return {initialized,baseline:{totals:telemetry.totals,bySource:telemetry.bySource,byTarget:telemetry.byTarget,eventCount:0},current:null,attackMilestones:[]};
}
function createGameplayState(){return {version:GAMEPLAY_STATE_VERSION,telemetry:createBattleTelemetry(),report:createBattleReportState()}}
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
function normalizeGameplayState(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==GAMEPLAY_STATE_VERSION)return createGameplayState();
 const gameplay={version:GAMEPLAY_STATE_VERSION,telemetry:normalizeBattleTelemetry(raw.telemetry),report:normalizeBattleReport(raw.report)};
 if(!Object.prototype.hasOwnProperty.call(raw,'report'))gameplay.report.initialized=false;
 return gameplay;
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
 if(!telemetry||!['damage','kill','control','resource','wave'].includes(type))return false;
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
 }else{
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
 const playerSide=state.faction,field=side===playerSide?'resource':'aiResource';state[field]+=Number(amount);recordBattleEvent('resource',{side,amount:Number(amount),reason});return true;
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
