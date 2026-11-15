// Keyboard and touch share the same validated orders and skill casting.
export function mountBattleKeys({getBattle,getSelected,isBattle,refresh,onOrder,selectUnit,cast,toggleAutoSkill,togglePause}){
 const orders={arrowleft:'back',arrowright:'forward',arrowup:'up',arrowdown:'down',a:'auto',s:'hold'};
 document.addEventListener('keydown',event=>{
  const key=event.key.toLowerCase(),b=getBattle();
  if(!isBattle()||!b||b.over||event.ctrlKey||event.metaKey||event.altKey||event.isComposing||event.target?.closest?.('input,textarea,select,[contenteditable="true"]')||document.querySelector('dialog[open]'))return;
  if(key===' '&&event.target?.closest?.('button,summary,a')&&!event.target?.closest?.('#field'))return;
  const recognized=orders[key]||/^[1-5]$/.test(key)||['q','w','e','f',' '].includes(key);if(!recognized)return;
  event.preventDefault();if(key===' ')event.stopPropagation();if(event.repeat||b.duel||b.introPending)return;
  if(key===' '){togglePause?.();return}if(b.paused)return;
  if(/^[1-5]$/.test(key)){const heroId=b.team?.[Number(key)-1],unit=b.allies.find(u=>u.hp>0&&u.heroId===heroId);if(unit)selectUnit?.(unit);return}
  const unit=getSelected();if(!unit)return;
  if(orders[key])onOrder(b,unit.id,orders[key]);
  else if(key==='f')toggleAutoSkill?.();
  else if(unit.heroId)cast?.(b,unit.key,['q','w','e'].indexOf(key));
  refresh();
 },true);
 const hint=document.createElement('p');hint.id='battleKeyHint';hint.textContent='1–5 選武將 · ↑↓ 換路 · ← 後退 · → 前進 · A 自動前進 · S 駐守 · Q/W/E 施放技能 · F 切換目前武將自動技能 · 空白鍵暫停（按鈕取得焦點時仍可用空白鍵操作按鈕）。普通攻擊自動進行。';document.getElementById('orders').after(hint);
}
