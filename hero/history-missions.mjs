const kinds=['dispatch','supply','withdraw','decoy','formation','restoration'];
export function createHistoryMission(level){return {level,kind:kinds[level-17],done:false,message:'',lane:1,travel:0,rescued:0,delivered:0,charge:0,withdrawAt:null,ordered:false,decoyUsed:false,decoyLane:null,site:-1,sites:[0,0,0]}}
const active=b=>b?.mission&&b.level>=17&&!b.over&&!b.paused&&!b.duel&&!b.introPending;
const safe=(b,lane)=>b.allies.some(u=>u.hp>0&&u.lane===lane)&&!b.enemies.some(e=>e.hp>0&&e.lane===lane&&e.x<.48);
export function historyAction(b,action,index=0){
 if(!active(b))return false;const m=b.mission;
 if(action==='route'&&m.kind==='dispatch'&&Number.isInteger(index)&&index>=0&&index<3){m.lane=index;return true}
 if(action==='supply'&&m.kind==='supply'&&m.charge>=10&&m.delivered<3){m.delivered++;m.charge=0;m.message=`第 ${m.delivered} 批軍糧送達！`;return true}
 if(action==='decoy'&&m.kind==='decoy'&&!m.decoyUsed&&Number.isInteger(index)&&index>=0&&index<3){const boss=b.enemies.find(e=>e.boss&&e.hp>0);if(!boss||boss.castAt)return false;boss.lane=index;m.decoyUsed=true;m.decoyLane=index;m.message='赤幘引開追兵，趁機照應退路！';return true}
 if(action==='retreat'&&['withdraw','decoy'].includes(m.kind)&&m.withdrawAt!==null&&b.time>=m.withdrawAt&&(m.kind!=='decoy'||m.decoyUsed)){
  m.ordered=true;for(const u of b.allies){u.order='back';u.targetX=.08;u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100}m.message='正在撤離！主將與護衛都要存活，所有在場友軍退回左側。';return true;
 }
 if(action==='site'&&m.kind==='restoration'&&Number.isInteger(index)&&index>=0&&index<3&&m.sites[index]<8){m.site=index;return true}return false;
}
export function stepHistoryMission(b,dt){
 const m=b.mission;
 if(m.kind==='dispatch'){if(m.rescued<3&&safe(b,m.lane)){m.travel+=dt/8;if(m.travel>=1){m.travel=0;m.rescued++;m.lane=(m.lane+1)%3;m.message=`第 ${m.rescued} 隊聯絡使者平安回營。`}}m.done=m.rescued>=3}
 if(m.kind==='supply'){if([0,1,2].every(l=>safe(b,l)))m.charge=Math.min(10,m.charge+dt);m.done=m.delivered>=3}
 if(['withdraw','decoy'].includes(m.kind)){
  if(b.bossSpawned&&m.withdrawAt===null)m.withdrawAt=b.time+18;
  m.done=m.ordered&&['liubei','zhangfei'].every(key=>b.allies.some(u=>u.key===key&&u.hp>0&&u.x<=.18))&&b.allies.filter(u=>u.hp>0).every(u=>u.x<=.18);
 }
 if(m.kind==='restoration'){if(m.site>=0&&safe(b,m.site)){m.sites[m.site]=Math.min(8,m.sites[m.site]+dt);if(m.sites[m.site]>=8){m.message=['道路已清理，行人能通過了。','水井已整理，可以取水了。','宗廟已整理，準備祭祀。'][m.site];m.site=-1}}m.done=m.sites.every(t=>t>=8)}
 if(m.kind==='formation')m.done=true;
}
export function protectHistoricalOutcome(b){if(['withdraw','decoy'].includes(b.mission?.kind))for(const e of b.enemies)if(e.boss&&!e.escaped)e.hp=Math.max(e.hp,e.maxHp*.35)}
export const extracted=b=>['withdraw','decoy'].includes(b.mission?.kind)&&b.mission.done;
export function historyMissionText(b){const m=b.mission;
 if(m.kind==='dispatch')return `接應 ${m.rescued}／3 隊使者 · ${['上','中','下'][m.lane]}路 ${Math.floor(m.travel*100)}% · 守住道路才能前進`;
 if(m.kind==='supply')return `軍糧 ${m.delivered}／3 批 · 備車 ${Math.floor(m.charge/10*100)}% · 三路皆有接應、敵人未逼近才備車`;
 if(['withdraw','decoy'].includes(m.kind))return `${m.kind==='decoy'&&!m.decoyUsed?'先放置赤幘誘餌 · ':''}`+(m.withdrawAt===null?'守住三路，等徐榮出陣':b.time<m.withdrawAt?`接應尚需 ${Math.ceil(m.withdrawAt-b.time)} 秒`:'接應完成，按全軍撤離')+' · 本關目標是撤退，不是擊倒徐榮';
 if(m.kind==='restoration')return `城內整備 ${m.sites.filter(t=>t>=8).length}／3 · 點一處，再派友軍守住同路；敵人逼近時停工`;
 return '陽人之戰 · 三將合陣、避開重斧再反擊 · 史書記孫堅軍破敵，非關羽單挑';
}
export function renderHistoryMission(b,panel,scene,refresh){
 const m=b.mission,locked=!active(b),choices=panel.querySelector('#missionChoices');
 panel.querySelector('#missionObjective').textContent=historyMissionText(b);panel.querySelector('#missionMessage').textContent=m.message;
 const items=m.kind==='dispatch'?[0,1,2].map(i=>['route',i,`使者走${['上','中','下'][i]}路`]):m.kind==='supply'?[['supply',0,'發送糧車']]:m.kind==='restoration'?['道路','水井','宗廟'].map((x,i)=>['site',i,`${x} ${Math.floor(m.sites[i]/8*100)}%`]):['withdraw','decoy'].includes(m.kind)?[...(m.kind==='decoy'?[0,1,2].map(i=>['decoy',i,`赤幘放${['上','中','下'][i]}路`]):[]),['retreat',0,'全軍撤離 ←']]:[];
 if(choices.dataset.mode!==m.kind){choices.dataset.mode=m.kind;choices.replaceChildren(...items.map(()=>{const el=document.createElement('button');el.type='button';return el}))}
 items.forEach(([action,i,label],n)=>{const button=choices.children[n];button.textContent=label;button.dataset.action=action;button.disabled=locked||m.done||(action==='supply'&&(m.charge<10||m.delivered>=3))||(action==='decoy'&&(m.decoyUsed||!b.enemies.some(e=>e.boss&&!e.castAt)))||(action==='retreat'&&(m.withdrawAt===null||b.time<m.withdrawAt||m.kind==='decoy'&&!m.decoyUsed))||(action==='site'&&m.sites[i]>=8);button.setAttribute('aria-pressed',String(action==='route'?m.lane===i:action==='site'&&m.site===i));button.onclick=()=>{historyAction(b,action,i);refresh()}});
 scene.querySelector('.mission-fog').style.opacity='0';const group=scene.querySelector('.civilian-group');group.hidden=m.kind!=='dispatch'||m.done;group.querySelector('span').textContent='聯絡使者';group.style.left=`${18+m.travel*65}%`;group.style.top=`${(m.lane+.75)/3*100}%`;
 let marker=scene.querySelector('.history-decoy');if(!marker){marker=document.createElement('span');marker.className='history-decoy';marker.textContent='赤幘誘餌';scene.append(marker)}marker.hidden=m.decoyLane===null;marker.style.top=`${(m.decoyLane+.5)/3*100}%`;
 scene.dataset.warning='';
}
