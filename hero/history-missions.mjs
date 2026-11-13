import {HISTORICAL_STAGES} from './history-stages.mjs?v=multilane-controls-1';
import {FACTIONS,factionFor} from './factions.mjs?v=multilane-controls-1';
const laneList=b=>Array.from({length:b.laneTotal||3},(_,i)=>i);
const routeName=(b,l)=>(b.laneTotal||3)>3?`第 ${l+1}`:['上','中','下'][l];
const siteNames=['道路','水井','宗廟'],laneNames=['上','中','下'];
const kinds=HISTORICAL_STAGES.map(s=>s.mission);
export function createHistoryMission(level){return {level,kind:kinds[level-17],hold:0,done:false,message:'',lane:1,travel:0,rescued:0,delivered:0,charge:0,withdrawAt:null,ordered:false,decoyUsed:false,decoyLane:null,site:-1,sites:[0,0,0]}}
const active=b=>b?.mission&&b.level>=17&&!b.over&&!b.paused&&!b.duel&&!b.introPending;
const safe=(b,lane)=>b.allies.some(u=>u.hp>0&&u.lane===lane)&&!b.enemies.some(e=>e.hp>0&&e.lane===lane&&e.x<.48);
export function historyAction(b,action,index=0){
 if(!active(b)||b.mission.done)return false;const m=b.mission;
 if(action==='route'&&m.kind==='dispatch'&&Number.isInteger(index)&&index>=0&&index<(b.laneTotal||3)){m.lane=index;return true}
 if(action==='supply'&&m.kind==='supply'&&m.charge>=10&&m.delivered<3){m.delivered++;m.charge=0;m.done=m.delivered>=3;m.message=`第 ${m.delivered} 批軍糧送達！`;return true}
 if(action==='decoy'&&m.kind==='decoy'&&!m.decoyUsed&&Number.isInteger(index)&&index>=0&&index<3){const boss=b.enemies.find(e=>e.boss&&e.hp>0);if(!boss||boss.castAt)return false;boss.lane=index;m.decoyUsed=true;m.decoyLane=index;m.message='赤幘引開追兵，趁機照應退路！';return true}
 if(action==='retreat'&&['withdraw','decoy'].includes(m.kind)&&m.withdrawAt!==null&&b.time>=m.withdrawAt&&(m.kind!=='decoy'||m.decoyUsed)){
  m.ordered=true;for(const u of b.allies){u.order='back';u.targetX=.08;u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100}m.message='正在撤離！主將與護衛都要存活，所有在場友軍退回左側。';return true;
 }
 if(action==='site'&&m.kind==='restoration'&&Number.isInteger(index)&&index>=0&&index<3&&m.sites[index]<8){m.site=index;return true}return false;
}
export function stepHistoryMission(b,dt){
 const m=b.mission;
 // Completed logistics stay complete; withdrawal is rechecked after damage each tick.
 if(m.done&&['dispatch','supply','restoration','holdout'].includes(m.kind))return;
 if(m.kind==='dispatch'){if(m.rescued<3&&safe(b,m.lane)){m.travel+=dt/8;if(m.travel>=1){m.travel=0;m.rescued++;m.lane=(m.lane+1)%(b.laneTotal||3);m.message=`第 ${m.rescued} 隊聯絡使者平安回營。`}}m.done=m.rescued>=3}
 if(m.kind==='supply'){if(laneList(b).every(l=>safe(b,l)))m.charge=Math.min(10,m.charge+dt);m.done=m.delivered>=3}
 if(['withdraw','decoy'].includes(m.kind)){
  if(b.bossSpawned&&m.withdrawAt===null)m.withdrawAt=b.time+18;
  m.done=m.ordered&&['liubei','zhangfei'].every(key=>b.allies.some(u=>u.key===key&&u.hp>0&&u.x<=.18))&&b.allies.filter(u=>u.hp>0).every(u=>u.x<=.18);
 }
 if(m.kind==='restoration'){if(m.site>=0&&safe(b,m.site)){m.sites[m.site]=Math.min(8,m.sites[m.site]+dt);if(m.sites[m.site]>=8){m.message=['道路已清理，行人能通過了。','水井已整理，可以取水了。','宗廟已整理，準備祭祀。'][m.site];m.site=-1}}m.done=m.sites.every(t=>t>=8)}
 if(m.kind==='holdout'){if(laneList(b).every(l=>safe(b,l)))m.hold=Math.min(24,m.hold+dt);m.done=m.hold>=24}
 if(m.kind==='formation')m.done=true;
}
export function protectHistoricalOutcome(b){if(['withdraw','decoy'].includes(b.mission?.kind))for(const e of b.enemies)if(e.boss&&!e.escaped)e.hp=Math.max(e.hp,e.maxHp*.35)}
export const extracted=b=>['withdraw','decoy'].includes(b.mission?.kind)&&b.mission.done;
export function historyMissionText(b){const fronts=['','','','三','四','五'][b.laneTotal||3];const m=b.mission,stage=HISTORICAL_STAGES[b.level-17],opponent=stage.bossName,holdTitle=stage.missionTitle||'鄄城接應';
 if(m.done&&['dispatch','supply','restoration','holdout'].includes(m.kind)){
  const title={dispatch:'接應 3／3 隊使者',supply:'軍糧 3／3 批',restoration:'城內整備 3／3',holdout:holdTitle+' 24／24 秒'}[m.kind];
  return `${title} · 任務已完成`+(b.won?'':b.bossSpawned?'，清退剩餘敵軍後過關':'，守住防線並清退後續敵軍');
 }
 if(m.kind==='dispatch')return `接應 ${m.rescued}／3 隊使者 · ${routeName(b,m.lane)}路 ${Math.floor(m.travel*100)}% · 守住道路才能前進`;
 if(m.kind==='supply'){
  const missing=laneList(b).filter(l=>!b.allies.some(u=>u.hp>0&&u.lane===l)).map(l=>((b.laneTotal||3)>3?`第 ${l+1}`:laneNames[l])+'路');
  const blocked=laneList(b).filter(l=>b.enemies.some(e=>e.hp>0&&e.lane===l&&e.x<.48)).map(l=>((b.laneTotal||3)>3?`第 ${l+1}`:laneNames[l])+'路');
  const next=m.charge>=10?'備車完成！請按「發送糧車」':missing.length?`請派友軍駐守${missing.join('、')}，每路都有人才會備車`:blocked.length?`${blocked.join('、')}敵軍逼近，清退後繼續備車`:'各路接應就位，正在備車；完成後按「發送糧車」';
  return `${b.bossSpawned&&!b.enemies.some(e=>e.hp>0)?'敵軍已清退，還要完成運糧！ · ':''}軍糧 ${m.delivered}／3 批 · 備車 ${Math.floor(m.charge/10*100)}% · ${next}`;
 }
 if(['withdraw','decoy'].includes(m.kind)&&m.ordered){
  const heroes=b.roster||FACTIONS[factionFor(b.level)].heroes,missing=['liubei','zhangfei'].filter(key=>!b.allies.some(u=>u.key===key&&u.hp>0)).map(key=>heroes[key].name);
  if(missing.length)return `${missing.join('、')}尚未在場，請整備後召回，再帶隊撤離 · ${opponent}無須擊倒`;
  const remaining=b.allies.filter(u=>u.hp>0&&u.x>.18).length;
  return remaining?`撤離中：尚有 ${remaining} 名友軍未回到左側 · 所有在場友軍都需撤回`:'隊伍已撤回左側，確認全員平安';
 }
 if(['withdraw','decoy'].includes(m.kind))return `${m.kind==='decoy'&&!m.decoyUsed?'先放置赤幘誘餌 · ':''}`+(m.withdrawAt===null?(stage.noBoss?`守住${fronts}路，等待後隊接應`:`守住${fronts}路，等${opponent}出陣`):b.time<m.withdrawAt?`接應尚需 ${Math.ceil(m.withdrawAt-b.time)} 秒`:'接應完成，按全軍撤離')+` · 本關目標是撤退，不是擊倒${opponent}`;
 if(m.kind==='restoration'){
  const detail=m.site<0?'選一處整備，派友軍守住對應路線':`${siteNames[m.site]}・${routeName(b,m.site)}路 · ${!b.allies.some(u=>u.hp>0&&u.lane===m.site)?'等候友軍接應':!safe(b,m.site)?'敵軍逼近，整備暫停':'整備中'}`;
  return `城內整備 ${m.sites.filter(t=>t>=8).length}／3 · ${detail}`;
 }
 if(m.kind==='holdout')return `${holdTitle} ${Math.floor(m.hold)}／24 秒 · 每路皆有友軍、敵人未逼近才計時 · 受阻暫停，進度保留`;
 if(b.bossCaptured)return `${opponent}已被俘 · ${b.won?'本關完成':`守住${fronts}路，清退餘兵後過關`}`;
 if(b.level>=23)return HISTORICAL_STAGES[b.level-17].bossTip;
 return '陽人之戰 · 三將合陣、避開重斧再反擊 · 史書記孫堅軍破敵，非關羽單挑';
}
export function renderHistoryMission(b,panel,scene,refresh){
 const m=b.mission,locked=!active(b),choices=panel.querySelector('#missionChoices');
 panel.querySelector('#missionObjective').textContent=historyMissionText(b);panel.querySelector('#missionMessage').textContent=m.message;
 const items=m.kind==='dispatch'?laneList(b).map(i=>['route',i,`使者走${routeName(b,i)}路`]):m.kind==='supply'?[['supply',0,'發送糧車']]:m.kind==='restoration'?siteNames.map((x,i)=>['site',i,`${x}・${routeName(b,i)}路 ${Math.floor(m.sites[i]/8*100)}%`]):['withdraw','decoy'].includes(m.kind)?[...(m.kind==='decoy'?[0,1,2].map(i=>['decoy',i,`赤幘放${['上','中','下'][i]}路`]):[]),['retreat',0,m.ordered?'重新下令撤離 ←':'全軍撤離 ←']]:[];
 const mode=`${m.kind}:${b.laneTotal||3}`;if(choices.dataset.mode!==mode){choices.dataset.mode=mode;choices.replaceChildren(...items.map(()=>{const el=document.createElement('button');el.type='button';return el}))}
 items.forEach(([action,i,label],n)=>{const button=choices.children[n];button.textContent=label;button.dataset.action=action;button.disabled=locked||m.done||(action==='supply'&&(m.charge<10||m.delivered>=3))||(action==='decoy'&&(m.decoyUsed||!b.enemies.some(e=>e.boss&&!e.castAt)))||(action==='retreat'&&(m.withdrawAt===null||b.time<m.withdrawAt||m.kind==='decoy'&&!m.decoyUsed))||(action==='site'&&m.sites[i]>=8);button.setAttribute('aria-pressed',String(action==='route'?m.lane===i:action==='site'&&m.site===i));button.onclick=()=>{historyAction(b,action,i);refresh()}});
 scene.querySelector('.mission-fog').style.opacity='0';const group=scene.querySelector('.civilian-group');group.hidden=m.kind!=='dispatch'||m.done;group.querySelector('span').textContent='聯絡使者';group.style.left=`${18+m.travel*65}%`;group.style.top=`${(m.lane+.75)/(b.laneTotal||3)*100}%`;
 let marker=scene.querySelector('.history-decoy');if(!marker){marker=document.createElement('span');marker.className='history-decoy';marker.textContent='赤幘誘餌';scene.append(marker)}marker.hidden=m.decoyLane===null;marker.style.top=`${(m.decoyLane+.5)/(b.laneTotal||3)*100}%`;
 scene.dataset.warning='';
}
