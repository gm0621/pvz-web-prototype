import {HISTORICAL_STAGES} from './history-stages.mjs?v=three-battles-2';
import {FACTIONS,factionFor} from './factions.mjs?v=three-battles-2';
import {OUTPOSTS,RAID_POINTS,OUTPOST_SECONDS,outpostLane,pointCompleted,nextOutpost,canIgniteRaid,igniteRaid,stepOutposts,selectOutpost,passWave,passLane,hasFireRoutes,canClearFire,clearFireLane,GATE_MAX,channelHazard,channelName,fleetChannel,fleetStatus,canRepairGate,repairGate,selectFleetChannel,siegeLane,stepFleet} from './field-missions.mjs?v=three-battles-2';
import {PEACH_HEROES} from './hero-base.mjs?v=passive-feedback-1';
const defaultRetreatSlots=['liubei','zhangfei'];
const retreatSlots=battle=>HISTORICAL_STAGES[battle.level-17]?.retreatKeys||defaultRetreatSlots;
const aliveInSlot=(battle,key)=>battle.allies.some(unit=>unit.key===key&&unit.hp>0);
export function retreatPartyNames(battle,{missingOnly=false}={}){
 const roster=battle.roster||FACTIONS[factionFor(battle.level)]?.heroes||PEACH_HEROES;
 return retreatSlots(battle).filter(key=>!missingOnly||!aliveInSlot(battle,key)).map(key=>roster[key].name);
}
export function retreatPartyLabel(battle,escorts='在場友軍'){
 const names=retreatPartyNames(battle);
 return names.length?names.join('、')+'與'+escorts:'所有'+escorts;
}
const laneList=b=>Array.from({length:b.laneTotal||3},(_,i)=>i);
const routeName=(b,l)=>(b.laneTotal||3)>3?`第 ${l+1}`:['上','中','下'][l];
const defaultSites=['道路','水井','宗廟'],laneNames=['上','中','下'];
export const restorationSites=level=>HISTORICAL_STAGES[level-17]?.missionSites||defaultSites;
const kinds=HISTORICAL_STAGES.map(s=>s.mission);
export function createHistoryMission(level){
 const stage=HISTORICAL_STAGES[level-17],kind=kinds[level-17];
 if(kind==='outposts'||kind==='fire-raid')return {level,kind,points:kind==='fire-raid'?RAID_POINTS:stage.outpostSites||OUTPOSTS,positions:[0,0],target:-1,...(kind==='outposts'&&!stage.outpostSites?{nextVolley:8}:{}),done:false,message:''};
 if(kind==='pass-defense')return {level,kind,done:false,message:''};
 if(kind==='naval')return {level,kind,destination:stage.fleetDestination||'西陵',lane:null,travel:0,done:false,message:''};
 if(kind==='siege')return {level,kind,gate:GATE_MAX,repairs:2,done:false,message:''};
 return {level,kind,...((level===87||stage?.fireRoutes)?{clearings:1}:{}),...(stage?.fireRoutes?{fireAttack:{lane:1,at:13}}:{}),hold:0,done:false,message:'',lane:1,travel:0,rescued:0,delivered:0,charge:0,withdrawAt:null,ordered:false,decoyUsed:false,decoyLane:null,site:-1,sites:[0,0,0]}}
const active=b=>b?.mission&&b.level>=17&&!b.over&&!b.paused&&!b.duel&&!b.introPending;
const safe=(b,lane)=>b.allies.some(u=>u.hp>0&&u.lane===lane)&&!b.enemies.some(e=>e.hp>0&&e.lane===lane&&e.x<.48);
export function supplyReady(b){
 return b.mission.charge>=10&&b.mission.delivered<3&&laneList(b).every(lane=>safe(b,lane));
}
export function historyAction(b,action,index=0){
 if(!active(b)||b.mission.done)return false;const m=b.mission;
 if(m.kind==='outposts'&&action==='outpost')return selectOutpost(b,index);
 if(m.kind==='fire-raid'&&action==='ignite')return igniteRaid(b,index);
 if(hasFireRoutes(m)&&action==='clear-fire')return clearFireLane(b,index);
 if(m.kind==='naval'&&action==='channel')return selectFleetChannel(b,index);
 if(m.kind==='siege'&&action==='repair')return repairGate(m);
 if(action==='route'&&m.kind==='dispatch'&&Number.isInteger(index)&&index>=0&&index<(b.laneTotal||3)){m.lane=index;return true}
 if(action==='supply'&&m.kind==='supply'&&supplyReady(b)){m.delivered++;m.charge=0;m.done=m.delivered>=3;m.message=`第 ${m.delivered} 批軍糧送達！`;return true}
 if(action==='decoy'&&m.kind==='decoy'&&!m.decoyUsed&&Number.isInteger(index)&&index>=0&&index<3){const boss=b.enemies.find(e=>e.boss&&e.hp>0);if(!boss||boss.castAt)return false;boss.lane=index;m.decoyUsed=true;m.decoyLane=index;m.message='赤幘引開追兵，趁機照應退路！';return true}
 if(action==='retreat'&&['withdraw','decoy'].includes(m.kind)&&m.withdrawAt!==null&&b.time>=m.withdrawAt&&(m.kind!=='decoy'||m.decoyUsed)){
  m.ordered=true;for(const u of b.allies){u.order='back';u.targetX=.08;u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100}m.message=`正在撤離！${retreatPartyLabel(b)}退回左側。`;return true;
 }
 if(action==='site'&&m.kind==='restoration'&&Number.isInteger(index)&&index>=0&&index<3&&m.sites[index]<8){m.site=index;return true}return false;
}
export function stepHistoryMission(b,dt){
 const m=b.mission;
 if(m.kind==='outposts'){stepOutposts(b,dt);return}
 if(m.kind==='naval'){stepFleet(b,dt);return}
 // Completed logistics stay complete; withdrawal is rechecked after damage each tick.
 if(m.done&&['dispatch','supply','restoration','holdout'].includes(m.kind))return;
 if(m.kind==='dispatch'){
  // Once every wave is cleared, guide the remaining messengers to a living escort.
  // During combat route choice remains manual; partial travel is never discarded.
  if(b.bossSpawned&&!b.enemies.some(e=>e.hp>0)&&!safe(b,m.lane)){
   const lane=laneList(b).find(l=>safe(b,l));
   if(lane!==undefined){m.lane=lane;m.message=`${HISTORICAL_STAGES[b.level-17].enemyCount!==0?'敵軍已清退，':''}使者改走${routeName(b,lane)}路，請友軍繼續接應。`}
  }
  if(m.rescued<3&&safe(b,m.lane)){m.travel+=dt/8;if(m.travel>=1){m.travel=0;m.rescued++;m.lane=(m.lane+1)%(b.laneTotal||3);m.message=`第 ${m.rescued} 隊聯絡使者平安回營。`}}m.done=m.rescued>=3}
 if(m.kind==='supply'){if(laneList(b).every(l=>safe(b,l)))m.charge=Math.min(10,m.charge+dt);m.done=m.delivered>=3}
 if(['withdraw','decoy'].includes(m.kind)){
  if(b.bossSpawned&&m.withdrawAt===null)m.withdrawAt=b.time+18;
  const living=b.allies.filter(u=>u.hp>0);
  m.done=m.ordered&&living.length>0&&retreatSlots(b).every(key=>living.some(u=>u.key===key))&&living.every(u=>u.x<=.18);
 }
 if(m.kind==='restoration'){if(m.site>=0&&safe(b,m.site)){m.sites[m.site]=Math.min(8,m.sites[m.site]+dt);if(m.sites[m.site]>=8){const sites=restorationSites(b.level);m.message=sites===defaultSites?['道路已清理，行人能通過了。','水井已整理，可以取水了。','宗廟已整理，準備祭祀。'][m.site]:sites[m.site]+'已整備完成。';m.site=-1}}m.done=m.sites.every(t=>t>=8)}
 if(m.kind==='holdout'){if(laneList(b).every(l=>safe(b,l)))m.hold=Math.min(24,m.hold+dt);m.done=m.hold>=24}
 if(m.kind==='formation')m.done=true;
}
export function protectHistoricalOutcome(b){if(['withdraw','decoy'].includes(b.mission?.kind))for(const e of b.enemies)if(e.boss&&!e.escaped)e.hp=Math.max(e.hp,e.maxHp*.35)}
export const extracted=b=>['withdraw','decoy'].includes(b.mission?.kind)&&b.mission.done;
export function historyMissionText(b){const fronts=['','','','三','四','五'][b.laneTotal||3];const m=b.mission,stage=HISTORICAL_STAGES[b.level-17],opponent=stage.bossName,holdTitle=stage.missionTitle||'鄄城接應';
 if(m.kind==='fire-raid'){
  const lit=m.positions.filter((_,index)=>pointCompleted(m,index)).length;
  const goal=m.done?'兩處已點火，擊退淳于瓊和餘兵':b.paused?'已暫停':'派友軍守住糧屯所在路，再按點火';
  return `糧屯 ${lit}／2 · ${goal}`;
 }
 if(m.kind==='outposts'){
  if(m.done)return '兩處據點已拿下 · 清退剩餘敵軍';
  const taken=m.positions.filter(time=>time>=OUTPOST_SECONDS).length;
  const prefix=`${stage.outpostSites?'解圍據點':'城外據點'} ${taken}／2`;
  if(b.paused)return prefix+' · 已暫停';
  const target=m.target;
  if(target<0)return prefix+(taken?` · 選${m.points[nextOutpost(m)].name}開始佔領`:' · 選一處先拿下');
  const lane=outpostLane(b,target),point=m.points[target];
  const status=safe(b,lane)?'佔領中':`請守住${routeName(b,lane)}路`;
  return `${prefix} · ${point.name} ${Math.floor(m.positions[target]/OUTPOST_SECONDS*100)}% · ${status}`;
 }
 if(m.kind==='pass-defense'){
  if(b.spawned>=stage.enemyCount)return '三波已出場 · 清退餘兵，守住關口';
  return `第 ${passWave(b)}／3 波 · ${routeName(b,passLane(b))}路來敵 · ${b.paused?'已暫停':'派友軍守住'}`;
 }
 if(m.kind==='naval'){
  if(m.done)return `主船已抵達${m.destination} · 清退剩餘敵軍`;
  const progress=`主船 ${Math.floor(m.travel*100)}% · ${channelName(b,fleetChannel(b))}`;
  return progress+' · '+(b.paused?'暫停，航程保留':fleetStatus(b));
 }
 if(m.kind==='siege'){
  const progress=`城門 ${m.gate}／${GATE_MAX} · 修補剩 ${m.repairs} 次`;
  const next=b.spawned<stage.enemyCount?`下一波：${routeName(b,siegeLane(b))}路`:'清退剩餘敵軍';
  return progress+' · '+(b.paused?'已暫停':next);
 }
 if(m.done&&['dispatch','supply','restoration','holdout'].includes(m.kind)){
  const title={dispatch:'接應 3／3 隊使者',supply:'軍糧 3／3 批',restoration:(stage.missionTitle||'城內整備')+' 3／3',holdout:holdTitle+' 24／24 秒'}[m.kind];
  return `${title} · 任務已完成`+(b.won||stage.enemyCount===0?'':b.bossSpawned?'，清退剩餘敵軍後過關':'，守住防線並清退後續敵軍');
 }
 if(m.kind==='dispatch'){
  const progress=`接應 ${m.rescued}／3 隊使者 · ${routeName(b,m.lane)}路 ${Math.floor(m.travel*100)}%`;
  if(b.paused)return progress+' · 已暫停，保留進度';
  const guarded=b.allies.some(u=>u.hp>0&&u.lane===m.lane),blocked=b.enemies.some(e=>e.hp>0&&e.lane===m.lane&&e.x<.48);
  const next=!guarded?`請派一名友軍到${routeName(b,m.lane)}路，或按下方按鈕改走有友軍的路線`:blocked?'敵軍逼近，使者暫停；清退後會繼續前進':'友軍正在接應，請等使者回營';
  return `${stage.enemyCount!==0&&b.bossSpawned&&!b.enemies.some(e=>e.hp>0)?'敵軍已清退 · ':''}${progress} · ${next}`;
 }
 if(m.kind==='supply'){
  const progress=`軍糧 ${m.delivered}／3 批 · 備車 ${Math.floor(m.charge/10*100)}%`;
  if(b.paused)return progress+' · 已暫停，保留進度';
  const missing=laneList(b).filter(l=>!b.allies.some(u=>u.hp>0&&u.lane===l)).map(l=>((b.laneTotal||3)>3?`第 ${l+1}`:laneNames[l])+'路');
  const blocked=laneList(b).filter(l=>b.enemies.some(e=>e.hp>0&&e.lane===l&&e.x<.48)).map(l=>((b.laneTotal||3)>3?`第 ${l+1}`:laneNames[l])+'路');
  const next=missing.length?`請派友軍駐守${missing.join('、')}，每路都有人才會備車`:blocked.length?`${blocked.join('、')}敵軍逼近，清退後繼續運糧`:m.charge>=10?'備車完成！請按「發送糧車」':'各路接應就位，正在備車；完成後按「發送糧車」';
  return `${stage.enemyCount!==0&&b.bossSpawned&&!b.enemies.some(e=>e.hp>0)?'敵軍已清退，還要完成運糧！ · ':''}${progress} · ${next}`;
 }
 if(['withdraw','decoy'].includes(m.kind)&&m.ordered){
  const paused=b.paused?' · 已暫停，保留進度':'';
  const missing=retreatPartyNames(b,{missingOnly:true});
  if(missing.length)return `${missing.join('、')}尚未在場，請整備後召回，再帶隊撤離${stage.noBoss?'':` · ${opponent}無須擊倒`}${paused}`;
  if(!b.allies.some(u=>u.hp>0))return '請先召回至少一隊友軍，再撤回左側'+paused;
  const remaining=b.allies.filter(u=>u.hp>0&&u.x>.18).length;
  return (remaining?`${b.paused?'':'撤離中：'}尚有 ${remaining} ${hasFireRoutes(m)?'隊':'名'}友軍未回到左側 · 所有在場友軍都需撤回`:'隊伍已撤回左側，確認全員平安')+paused;
 }
 if(['withdraw','decoy'].includes(m.kind)){
  const status=m.withdrawAt===null?(stage.noBoss?`守住${fronts}路，等待後隊接應`:`守住${fronts}路，等${opponent}出陣`):b.time<m.withdrawAt?`接應尚需 ${Math.ceil(m.withdrawAt-b.time)} 秒`:'接應完成，按全軍撤離';
  const party=stage.noBoss||stage.retreatKeys?` · ${retreatPartyLabel(b)}須撤回左側`:'';
  const goal=stage.noBoss?'':` · 無須擊倒${opponent}`;
  return (m.kind==='decoy'&&!m.decoyUsed?'先放置赤幘誘餌 · ':'')+status+party+goal+(b.paused?' · 已暫停，保留進度':'');
 }
 if(m.kind==='restoration'){
  const title=`${stage.missionTitle||'城內整備'} ${m.sites.filter(t=>t>=8).length}／3`;
  if(m.site<0)return title+' · 選一處整備，派友軍守住對應路線';
  const place=`${restorationSites(b.level)[m.site]}・${routeName(b,m.site)}路`;
  const guarded=b.allies.some(u=>u.hp>0&&u.lane===m.site);
  const status=b.paused?'已暫停':!guarded?'等候友軍接應':!safe(b,m.site)?'敵軍逼近，整備暫停':'整備中';
  return `${title} · ${place} · ${status} ${Math.floor(m.sites[m.site]/8*100)}%`;
 }
 if(m.kind==='holdout'){
  const progress=`${holdTitle} ${Math.floor(m.hold)}／24 秒`;
  if(b.paused)return progress+' · 已暫停，保留進度';
  const lanes=laneList(b);
  const missing=lanes.filter(lane=>!b.allies.some(unit=>unit.hp>0&&unit.lane===lane));
  if(missing.length)return `${progress} · ${missing.map(lane=>routeName(b,lane)+'路').join('、')}缺接應，請派友軍駐守`;
  const blocked=lanes.filter(lane=>!safe(b,lane));
  if(blocked.length)return `${progress} · ${blocked.map(lane=>routeName(b,lane)+'路').join('、')}受阻，保留進度`;
  return progress+' · 各路安全，接應計時中';
 }
 if(b.bossCaptured)return `${opponent}已被俘 · ${b.won?'本關完成':`守住${fronts}路，清退餘兵後過關`}`;
 if(b.level>=23)return HISTORICAL_STAGES[b.level-17].bossTip;
 return '陽人之戰 · 三將合陣、避開重斧再反擊 · 史書記孫堅軍破敵，非關羽單挑';
}
export function renderHistoryMission(b,panel,scene,refresh,onAction=()=>{}){
 const m=b.mission,locked=!active(b),choices=panel.querySelector('#missionChoices');
 panel.querySelector('#missionObjective').textContent=historyMissionText(b);panel.querySelector('#missionMessage').textContent=m.message;
 const items=m.kind==='outposts'?m.points.map((point,i)=>['outpost',i,`${point.name} · ${pointCompleted(m,i)?'已拿下':point.benefit||routeName(b,outpostLane(b,i))+'路'}`])
 :m.kind==='fire-raid'?m.points.map((point,i)=>['ignite',i,pointCompleted(m,i)?`${point.name} · 已點火`:`點火・${point.name}（${routeName(b,outpostLane(b,i))}路）`])
 :m.kind==='naval'?laneList(b).map(i=>['channel',i,`${channelName(b,i)}${channelHazard(b,i)==='blocked'?' · 封航':i===fleetChannel(b)?' ✓':''}`])
 :m.kind==='siege'?[['repair',0,'修補城門']]
 :m.kind==='dispatch'?laneList(b).map(i=>['route',i,`使者走${routeName(b,i)}路`]):m.kind==='supply'?[['supply',0,'發送糧車']]:m.kind==='restoration'?restorationSites(b.level).map((x,i)=>['site',i,`${x}・${routeName(b,i)}路 ${Math.floor(m.sites[i]/8*100)}%`]):['withdraw','decoy'].includes(m.kind)?[...(hasFireRoutes(m)?laneList(b).map(i=>['clear-fire',i,`開路・${routeName(b,i)}路`]):[]),...(m.kind==='decoy'?[0,1,2].map(i=>['decoy',i,`赤幘放${['上','中','下'][i]}路`]):[]),['retreat',0,m.ordered?'重新下令撤離 ←':'全軍撤離 ←']]:[];
 const mode=`${m.kind}:${b.laneTotal||3}:${items.length}`;if(choices.dataset.mode!==mode){choices.dataset.mode=mode;choices.replaceChildren(...items.map(()=>{const el=document.createElement('button');el.type='button';return el}))}
 items.forEach(([action,i,label],n)=>{const button=choices.children[n];button.textContent=label;button.dataset.action=action;button.disabled=locked||m.done||(action==='outpost'&&(m.positions[i]>=OUTPOST_SECONDS||m.target===i))||(action==='ignite'&&!canIgniteRaid(b,i))||(action==='clear-fire'&&!canClearFire(b,i))||(action==='repair'&&!canRepairGate(m))||(action==='channel'&&(i===fleetChannel(b)||channelHazard(b,i)==='blocked'))||(action==='supply'&&!supplyReady(b))||(action==='decoy'&&(m.decoyUsed||!b.enemies.some(e=>e.boss&&!e.castAt)))||(action==='retreat'&&(m.withdrawAt===null||b.time<m.withdrawAt||m.kind==='decoy'&&!m.decoyUsed))||(action==='site'&&m.sites[i]>=8);button.setAttribute('aria-pressed',String(action==='outpost'?m.target===i:action==='channel'?fleetChannel(b)===i:action==='route'?m.lane===i:action==='site'&&m.site===i));button.onclick=()=>{if(historyAction(b,action,i))onAction(b,action,i);refresh()}});
 scene.querySelector('.mission-fog').style.opacity='0';const group=scene.querySelector('.civilian-group');group.hidden=m.kind!=='dispatch'||m.done;group.querySelector('span').textContent='聯絡使者';group.style.left=`${18+m.travel*65}%`;group.style.top=`${(m.lane+.75)/(b.laneTotal||3)*100}%`;
 let marker=scene.querySelector('.history-decoy');if(!marker){marker=document.createElement('span');marker.className='history-decoy';marker.textContent='赤幘誘餌';scene.append(marker)}marker.hidden=m.decoyLane===null;marker.style.top=`${(m.decoyLane+.5)/(b.laneTotal||3)*100}%`;
 scene.dataset.warning='';
}
