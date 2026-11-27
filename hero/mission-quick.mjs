import {HISTORICAL_STAGES} from './history-stages.mjs?v=mangshui-qianluo-duangu-1';
import {missionText} from './chapter-missions.mjs?v=mangshui-qianluo-duangu-1';
import {retreatPartyNames,retreatPartyLabel,retreatRallyHint,supplyReady,coverWaveText,historyMissionText} from './history-missions.mjs?v=mangshui-qianluo-duangu-1';
import {hasFireRoutes,hasGate,hasOutposts,canRepairGate} from './field-missions.mjs?v=mangshui-qianluo-duangu-1';
const names=['上','中','下'];
export function missionQuickState(b){
 const m=b.mission;if(!m)return null;
 const stage=HISTORICAL_STAGES[b.level-17];
 if(m.kind==='fire-raid')return {heading:'火攻 · 點燃兩處糧屯',doneHeading:'兩處已點火 · 繼續作戰',text:missionText(b),button:m.done?'查看任務':'選火攻點'};
 if(m.kind==='outposts'){
  const relief=stage?.outpostSites;
  return {heading:stage?.outpostHeading||(relief?'解圍戰 · 拿下兩處據點':'攻城戰 · 拿下城外據點'),doneHeading:relief?'兩處已拿下 · 繼續作戰':undefined,text:missionText(b),button:m.done?'查看任務':'選擇據點'};
 }
 if(m.kind==='pass-defense')return {heading:`${stage?.missionTitle||'守關戰'} · 擋住三波`,text:missionText(b),button:'查看任務'};
 if(m.kind==='naval')return {heading:m.cargoRuns?'水路運糧 · 護送三批':'水戰 · 護送主船',doneHeading:m.cargoRuns?(stage.enemyCount?'三批軍糧已送到 · 清退餘船':'三批軍糧已送達'):'主船已靠岸 · 清退餘船',text:missionText(b),button:m.done?'查看任務':'改走航道'};
 if(m.kind==='siege')return {heading:'守城戰 · 守住城門',text:missionText(b),button:'修補城門',action:'repair'};
 if(!['supply','withdraw','decoy'].includes(m.kind))return {text:missionText(b),button:m.done?'查看目標':'進行任務'};
 if(m.stops){
  const ready=supplyReady(b);
  return {heading:'分段運糧 · 護送三批',doneHeading:stage.enemyCount?'三批軍糧送達 · 清退餘兵':'三批軍糧送達',
   text:historyMissionText(b,{compact:true}),button:ready?'發送糧車':'查看任務',action:ready?'supply':undefined};
 }
 if(m.kind==='supply'){
  const cleared=stage?.enemyCount!==0&&b.bossSpawned&&!b.enemies.some(e=>e.hp>0),prefix=`軍糧 ${m.delivered}／3`;
  if(m.done)return {text:`${prefix} · 運糧完成${stage?.enemyCount===0?'':'，清退餘兵'}`,button:'查看任務'};
  if(b.paused)return {text:missionText(b),button:supplyReady(b)?'發送糧車':'查看任務'};
  if(supplyReady(b))return {text:`${prefix} · ${cleared?'敵軍已清退，仍需送糧':'備車完成！'}`,button:'發送糧車',action:'supply'};
  const lanes=Array.from({length:b.laneTotal||3},(_,i)=>i),missing=lanes.filter(l=>!b.allies.some(u=>u.hp>0&&u.lane===l));
  const blocked=lanes.filter(l=>b.enemies.some(e=>e.hp>0&&e.lane===l&&e.x<.48));
  const label=ls=>ls.map(l=>lanes.length===3?names[l]:String(l+1)).join('、')+'路';
  return {text:`${prefix} · `+(missing.length?`${label(missing)}缺接應，派友軍駐守`:blocked.length?`${label(blocked)}受阻，先清退敵人`:`備車 ${Math.floor(m.charge/10*100)}%，完成後送出`),button:'查看任務'};
 }
 const ready=m.withdrawAt!==null&&b.time>=m.withdrawAt;
 const paused=b.paused?'已暫停，保留進度 · ':'';
 const noBoss=stage?.noBoss;
 const fire=hasFireRoutes(m),clearing=fire?` · 開路剩 ${m.clearings} 次`:'';
 const fireButton=fire&&m.clearings?'開路選項':'查看任務';
 const gate=hasGate(m),outposts=hasOutposts(m);
 const heading=gate?'城門守備 · 掩護撤離':outposts?'攻城戰 · 掩護撤離':m.coverWaves?'分波掩護撤離':undefined;
 if(outposts&&m.withdrawAt===null)return {heading,text:missionText(b),button:'選擇陣地'};
 if(gate&&!ready){
  const canRepair=canRepairGate(m);
  return {heading,text:missionText(b),button:canRepair?'修補城門':'查看任務',action:canRepair?'repair':undefined};
 }
 const wait=m.coverWaves?coverWaveText(b):outposts&&!ready?`掩護後隊 ${Math.ceil(m.withdrawAt-b.time)} 秒`:m.withdrawAt===null?(noBoss?'守線等待接應':'等待敵將出場'):ready?'接應完成':`接應尚需 ${Math.ceil(m.withdrawAt-b.time)} 秒`;
 if(m.ordered){
  const missing=retreatPartyNames(b,{missingOnly:true});
  const living=b.allies.filter(u=>u.hp>0);
  const remaining=living.filter(u=>u.x>.18).length;
  const status=missing.length?`請召回${missing.join('、')}，才能撤離`:!living.length?'請先召回至少一隊友軍':`${b.paused?'':'撤離中 · '}${remaining} ${fire||m.coverWaves||gate||outposts?'隊':'名'}友軍尚未回到左側${retreatRallyHint(b)}`;
  return {heading,text:paused+status+clearing,button:'重新撤離',action:'retreat'};
 }
 if(gate||outposts)return {heading,text:`${paused}${wait} · ${ready?(gate?`讓${retreatPartyLabel(b,'友軍')}退回左側`:'把友軍帶回左側'):'守住兩處陣地，準備撤離'}`,button:ready?'全軍撤離':'查看任務',action:ready?'retreat':undefined};
 if(m.coverWaves)return {heading,text:`${paused}${wait} · ${ready?`帶${stage.retreatKeys?.length?retreatPartyLabel(b,'友軍'):'友軍'}撤回左側`:'派友軍守線'}`,button:ready?'全軍撤離':'查看任務',action:ready?'retreat':undefined};
 if(m.kind==='decoy'&&!m.decoyUsed)return {text:`${paused}${wait} · 先放赤幘誘餌`,button:'放置誘餌'};
 return {heading,text:`${paused}${wait}${clearing} · ${noBoss||stage?.retreatKeys?`帶${retreatPartyLabel(b,'友軍')}撤回左側`:'不必擊倒敵將'}`,button:ready?'全軍撤離':fireButton,action:ready?'retreat':undefined};
}
export function mountMissionQuick(field,openMission){
 const root=document.createElement('aside');root.id='missionQuick';root.hidden=true;root.setAttribute('aria-label','過關任務');const text=document.createElement('p'),button=document.createElement('button');button.id='missionQuickAction';button.className='gold-button';const heading=document.createElement('strong');heading.textContent='⚑ 過關任務';heading.className='mission-quick-heading';const copy=document.createElement('div');copy.append(heading,text);root.append(copy,button);field.append(root);
 return b=>{const state=missionQuickState(b);root.hidden=!state||b.over||!!b.duel||!!b.introPending;field.classList.toggle('has-mission-quick',!root.hidden);if(!state)return;heading.textContent=b.mission.done?(state.doneHeading||'✓ 任務已完成'):state.heading||'⚑ 過關任務 · 別忘了這一步';text.textContent=state.text;text.title=state.text;button.textContent=state.button;const source=state.action?document.querySelector(`#missionChoices [data-action="${state.action}"]`):null;button.disabled=!!b.paused||!!b.duel||!!b.introPending||b.over||!!source?.disabled;button.onclick=()=>{if(state.action&&source)source.click();else openMission()};const needsChoice=!b.mission.done&&[...document.querySelectorAll('#missionChoices button')].some(x=>!x.disabled);root.dataset.ready=String((!!state.action||needsChoice)&&!button.disabled);root.style.setProperty('--mission-glow',String(matchMedia('(prefers-reduced-motion: reduce)').matches?0:.35+.25*Math.sin(b.time*3)));const top=document.getElementById('missionDrawerButton');if(top){top.textContent=b.mission.done?'任務 ✓':needsChoice?'任務！':'任務';top.dataset.pending=String(needsChoice)}};
}
