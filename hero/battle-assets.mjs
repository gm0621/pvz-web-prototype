// Shared promises avoid duplicate downloads. Failed requests remain retryable.
const images=new Map();
export function preloadBattleAssets(urls){
 return Promise.all([...new Set(urls)].filter(Boolean).map(url=>{
  if(images.has(url))return images.get(url).promise;
  const entry={ready:false};images.set(url,entry);
  entry.promise=new Promise(resolve=>{
   const img=new Image();img.decoding='async';img.fetchPriority='low';
   const timer=setTimeout(()=>finish(false),20000);
   function finish(ok){clearTimeout(timer);img.onload=null;img.onerror=null;entry.ready=ok;if(!ok)images.delete(url);resolve(ok)}
   img.onload=()=>img.decode().then(()=>finish(true),()=>finish(false));img.onerror=()=>finish(false);img.src=url;
  });return entry.promise;
 })).then(results=>results.every(Boolean));
}
export const battleAssetsReady=urls=>urls.every(url=>images.get(url)?.ready);
let pending=null;
export function prepareBattleAssets(urls,onReady){
 if(pending)return;
 const dialog=document.createElement('dialog');dialog.id='battleLoading';dialog.className='duel-dialog';dialog.setAttribute('aria-labelledby','battleLoadingTitle');
 dialog.innerHTML='<h2 id="battleLoadingTitle">準備戰場</h2><p role="status">正在載入本關圖片，準備好就出發。</p><button type="button" class="gold-button" hidden>重試載入</button> <button type="button" class="quiet-button">返回</button>';
 document.body.append(dialog);pending=dialog;const status=dialog.querySelector('p'),retry=dialog.querySelector('.gold-button');
 function close(){if(pending!==dialog)return;pending=null;dialog.close();dialog.remove()}
 dialog.querySelector('.quiet-button').onclick=close;dialog.oncancel=event=>{event.preventDefault();close()};
 async function load(){retry.hidden=true;status.textContent='正在載入本關圖片，準備好就出發。';const ok=await preloadBattleAssets(urls);if(pending!==dialog)return;if(ok){close();onReady()}else{status.textContent='部分圖片未能載入，請重試；本場戰鬥尚未開始。';retry.hidden=false}}
 retry.onclick=load;dialog.showModal();void load();
}
