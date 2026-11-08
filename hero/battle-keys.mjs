// Desktop shortcuts use the same validated orders as touch controls.
export function mountBattleKeys({getBattle,getSelected,isBattle,refresh,onOrder}){
 const orders={arrowleft:'back',arrowright:'forward',arrowup:'up',arrowdown:'down',a:'auto',s:'hold'};
 document.addEventListener('keydown',event=>{
  const order=orders[event.key.toLowerCase()],b=getBattle(),unit=getSelected();
  if(!order||!isBattle()||!unit||!b||b.paused||b.over||b.duel||b.introPending||event.ctrlKey||event.metaKey||event.altKey||event.target?.closest?.('input,textarea,select,[contenteditable="true"]')||document.querySelector('dialog[open]'))return;
  event.preventDefault();if(event.repeat)return;onOrder(b,unit.id,order);refresh();
 });
 const hint=document.createElement('p');hint.id='battleKeyHint';hint.textContent='先點選武將或弓兵：方向鍵移動 · A 自動前進 · S 駐守';document.getElementById('orders').after(hint);
}
