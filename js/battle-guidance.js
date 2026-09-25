// Battle-only presentation and legal placement rules; never writes campaign progress.
function deploymentReadyReason(key){
 if(!state||state.over)return '戰鬥已結束';
 if(state.paused)return '已暫停，繼續後才能出兵';
 const d=(state.faction==='plants'?PLANT_TYPES:ZOMBIE_TYPES)[key];
 if(!d||!canUseUnit(state.faction,key,state.level))return '角色尚未開放';
 if(state.resource<d.cost)return `${d.name} 資源不足`;
 if(isCooling(key))return `${d.name} 還在冷卻`;
 return '';
}
function deploymentCellReason(r,c){
 if(!Number.isInteger(r)||!Number.isInteger(c)||r<0||r>=ROWS||c<0||c>=COLS)return '請選戰場內的格子';
 if(state.faction==='plants'){
  if(c>6)return '守軍只能放左側第 1～7 欄';
  if(state.plants.some(p=>p.r===r&&p.c===c))return '這格已有守方角色';
 }else if(c<7)return '殭屍只能從右側第 8、9 欄出兵';
 return '';
}
function clearDeploymentSelection(){
 if(!state)return;state.selected=null;
 document.querySelectorAll('#cards .selected,#cards .dragging').forEach(el=>el.classList.remove('selected','dragging'));
 document.querySelectorAll('#grid .drop-preview').forEach(el=>el.classList.remove('drop-preview'));
 updateDeploymentGuide();
}
function setBattleText(id,text){const el=$(id);if(el&&el.textContent!==text)el.textContent=text}
function updateDeploymentGuide(){
 const grid=$('grid');if(!state||!grid)return;
 const key=state.selected,reason=key?deploymentReadyReason(key):'',active=!!key&&!state.over&&!state.paused&&!state.actionMode;
 const signature=[key,reason,active,state.faction,state.plants.map(p=>`${p.r},${p.c}`).join(';')].join('|');
 if(grid.dataset.deploymentSignature!==signature){
  grid.dataset.deploymentSignature=signature;
  grid.querySelectorAll('.cell').forEach(cell=>{
   const r=Number(cell.dataset.r),c=Number(cell.dataset.c),blocked=deploymentCellReason(r,c),allowed=active&&!reason&&!blocked;
   cell.classList.toggle('deploy-allowed',allowed);cell.classList.toggle('deploy-blocked',active&&!allowed);
   cell.setAttribute('aria-label',`第 ${r+1} 路，第 ${c+1} 欄${active?`：${reason||blocked||'可放置'}`:''}`);
  });
 }
 const side=state.faction==='plants'?'左側第 1～7 欄空格':'右側第 8、9 欄';
 setBattleText('deploymentHint',state.over?'戰鬥已結束':state.paused?'已暫停，繼續後才能出兵':state.actionMode?'操作模式中；選角色可返回出兵':key?(reason||`✓ 綠框可放｜${side}｜再點角色取消`):`選角色查看可放位置｜${side}`);
}
function updateAttackStatus(){
 const el=$('attackStatus');if(!el||!state)return;
 el.hidden=state.faction!=='zombies';if(el.hidden)return;
 const seconds=Math.max(0,Math.ceil((state.levelConfig.attackTimeLimit-state.time)/1000));
 setBattleText('attackTimer',`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`);
 el.classList.toggle('warning',seconds<=30);el.classList.toggle('critical',seconds<=10);
 setBattleText('attackStatusText',state.over?'戰鬥結束':state.paused?'已暫停':seconds<=10?'最後衝刺！未突破就失敗':seconds<=30?'時間將盡！未突破就失敗':'突破任一路｜時間到未突破就失敗');
 // Announce thresholds once, not every frame or second. Repeated HUD updates do not spam assistive tech.
 const band=state.over?'over':state.paused?'paused':seconds<=10?'critical':seconds<=30?'warning':'normal';
 if(el.dataset.band!==band){el.dataset.band=band;setBattleText('attackAlert',band==='critical'?'剩餘十秒內，未突破就失敗':band==='warning'?'剩餘三十秒內，請準備突破':band==='paused'?'攻城倒數已暫停':'')}
}
// A narrow first-season rescue plan at existing AI turns. Costs/delays/cooldowns stay in aiAct.
// undefined = ordinary strategy; null = genuine breach but no legal rescue plan this turn.
function chooseBreachDefense(opts){
 if(state.season!==1)return undefined;
 const lanes=Array.from({length:ROWS},(_,r)=>{
  const zs=state.zombies.filter(z=>z.hp>0&&z.r===r),closest=zs.length?Math.min(...zs.map(z=>z.c)):COLS;
  const spent=!!state.lawnmowers[r]?.used;
  return {r,closest,urgent:closest<3.5&&(spent||closest<2),score:(spent?120:0)+(COLS-closest)*20+zs.length*15};
 }).filter(l=>l.urgent).sort((a,b)=>b.score-a.score);
 if(!lanes.length)return undefined;
 for(const lane of lanes){
  // Avoid new blockers appearing on the wrong (right) side of an already passing zombie.
  const cells=Array.from({length:7},(_,c)=>c).filter(c=>c<lane.closest-.45&&!plantAtCell(lane.r,c));
  if(!cells.length)continue;
  const preference=['wallnut','zhangfei','zhaoyun','firepea','peashooter'];
  const entry=preference.map(k=>opts.find(([key])=>key===k)).find(Boolean);if(!entry)continue;
  const [key,d]=entry,isBlocker=key==='wallnut'||key==='zhangfei';
  return {key,d,r:lane.r,c:isBlocker?cells[cells.length-1]:cells[0]};
 }
 return null;
}
