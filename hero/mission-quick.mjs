const names=['上','中','下'];
export function missionQuickState(b){
 const m=b.mission;if(!m||!['supply','withdraw','decoy'].includes(m.kind))return null;
 if(m.kind==='supply'){
  const cleared=b.bossSpawned&&!b.enemies.some(e=>e.hp>0),prefix=`軍糧 ${m.delivered}／3`;
  if(m.done)return {text:`${prefix} · 運糧完成，清退餘兵`,button:'查看任務'};
  if(m.charge>=10)return {text:`${prefix} · ${cleared?'敵軍已清退，仍需送糧':'備車完成！'}`,button:'發送糧車',action:'supply'};
  const lanes=Array.from({length:b.laneTotal||3},(_,i)=>i),missing=lanes.filter(l=>!b.allies.some(u=>u.hp>0&&u.lane===l));
  const blocked=lanes.filter(l=>b.enemies.some(e=>e.hp>0&&e.lane===l&&e.x<.48));
  const label=ls=>ls.map(l=>lanes.length===3?names[l]:String(l+1)).join('、')+'路';
  return {text:`${prefix} · `+(missing.length?`${label(missing)}缺接應，派友軍駐守`:blocked.length?`${label(blocked)}受阻，先清退敵人`:`備車 ${Math.floor(m.charge/10*100)}%，完成後送出`),button:'查看任務'};
 }
 const wait=m.withdrawAt===null?'等待敵將出場':b.time<m.withdrawAt?`接應尚需 ${Math.ceil(m.withdrawAt-b.time)} 秒`:'接應完成';
 if(m.ordered){const missing=['liubei','zhangfei'].filter(key=>!b.allies.some(u=>u.key===key&&u.hp>0)).map(key=>b.roster?.[key]?.name||key);return {text:missing.length?`請召回${missing.join('、')}，才能撤離`:`撤離中 · ${b.allies.filter(u=>u.hp>0&&u.x>.18).length} 名友軍尚未回到左側`,button:'重新撤離',action:'retreat'}}
 if(m.kind==='decoy'&&!m.decoyUsed)return {text:`${wait} · 先放赤幘誘餌`,button:'放置誘餌'};
 return {text:`${wait} · 不必擊倒敵將`,button:m.withdrawAt!==null&&b.time>=m.withdrawAt?'全軍撤離':'查看任務',action:m.withdrawAt!==null&&b.time>=m.withdrawAt?'retreat':undefined};
}
export function mountMissionQuick(field,openMission){
 const root=document.createElement('aside');root.id='missionQuick';root.hidden=true;root.setAttribute('aria-label','過關任務');const text=document.createElement('p'),button=document.createElement('button');button.id='missionQuickAction';button.className='gold-button';root.append(text,button);field.append(root);
 return b=>{const state=missionQuickState(b);root.hidden=!state||b.over||!!b.duel||!!b.introPending;field.classList.toggle('has-mission-quick',!root.hidden);if(!state)return;text.textContent=state.text;button.textContent=state.button;const source=state.action?document.querySelector(`#missionChoices [data-action="${state.action}"]`):null;button.disabled=!!b.paused||!!b.duel||!!b.introPending||b.over||!!source?.disabled;button.onclick=()=>{if(state.action&&source)source.click();else openMission()};root.dataset.ready=String(!!state.action&&!button.disabled)};
}
