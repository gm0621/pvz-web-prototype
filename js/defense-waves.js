// Finite encounter pacing. Only new defense battles opt in; legacy snapshots
// without waveDirector keep their original scheduler and never replay a wave.
function createDefenseWaves(lv){
 const n=lv.enemyCount;
 const plan=n<25?[
  {after:Math.floor(n*.35),count:Math.floor(n*.24)},
  {after:Math.floor(n*.72),count:n-Math.floor(n*.72)}
 ]:[
  {after:Math.floor(n*.25),count:Math.floor(n*.15)},
  {after:Math.floor(n*.52),count:Math.floor(n*.18)},
  {after:Math.floor(n*.75),count:n-Math.floor(n*.75)}
 ];
 return {version:1,plan,index:0,active:null,restUntil:0};
}
function updateDefenseWaves(){
 const director=state.waveDirector,lv=state.levelConfig;
 if(!director||state.faction!=='plants')return false;
 if(state.over||state.paused||state.bossSpawned)return true;
 if(state.enemiesSpawned>=lv.enemyCount)return true;
 if(state.openingQueue.length)return false;
 if(state.time<director.restUntil)return true;
 const next=director.plan[director.index];
 if(!director.active&&next&&state.enemiesSpawned>=next.after){
  director.active={id:director.index+1,count:Math.min(next.count,lv.enemyCount-state.enemiesSpawned),sent:0,warnedAt:state.time,nextAt:state.time+5000,rallied:false,rows:[]};
  log(`⚠ 一大波屍潮即將來襲！第 ${director.index+1}/${director.plan.length} 波，5 秒後進攻。`);
  persistBattleState();return true;
 }
 const wave=director.active;
 if(!wave)return false;
 if(state.time<wave.nextAt)return true;
 // Each finite wave has a bounded, one-time reinforcement budget, exposed in
 // the existing AI brain HUD. Unit costs, cooldowns and unlock delays still apply.
 if(!wave.rallied){
  const supply=wave.count*(lv.enemyCount<25?25:40);
  state.aiResource+=supply;wave.rallied=true;
  log(`第 ${wave.id} 波集結完成，敵方增援補給 +${supply} 腦。`);
 }
 let opts=affordableAI(ZOMBIE_TYPES,state.aiResource).filter(([k])=>lv.zombieWeights.includes(k)&&!(state.season===2&&state.level===2&&k==='s2Coffin'&&state.lastSpawnedZombie==='s2Coffin'));
 // Same finite-quota cheap-unit fallback as ordinary AI; never manufacture an
 // unaffordable elite or bypass its cooldown to force a burst.
 const cheap=state.season===2?'s2Rat':'normal',basic=ZOMBIE_TYPES[cheap];
 if(!opts.length&&lv.zombieWeights.includes(cheap)&&state.time-(state.lastAI[cheap]??-999999)>=basic.cooldown){
  state.aiResource=Math.max(state.aiResource,basic.cost);opts=[[cheap,basic]];
 }
 if(!opts.length){wave.nextAt=state.time+250;return true}
 const front=['corpseTitan','bucket','cone','s2Coffin'],rear=['fireCatapult','peaZombie','s2Nail'],fast=['football','poleVault','s2Rat'];
 const role=wave.sent===0?front:wave.sent===1?rear:wave.sent===2?fast:[];
 const preferred=opts.filter(([k])=>role.includes(k));
 const [key,d]=preferred.length?preferred.sort((a,b)=>b[1].cost-a[1].cost)[0]:chooseZombieAI(opts);
 let row=smartZombieRow(key);
 // Spread the first three arrivals, then let the existing weak-lane AI decide.
 if(wave.rows.length<3){if(wave.rows.includes(row))row=Array.from({length:ROWS},(_,r)=>r).filter(r=>!wave.rows.includes(r)).sort((a,b)=>rowLoad('zombie',a)-rowLoad('zombie',b))[0];wave.rows.push(row)}
 state.aiResource-=d.cost;state.lastAI[key]=state.time;
 addZombie(key,8.8,row);if(state.season===2)state.lastSpawnedZombie=key;
 state.enemiesSpawned++;wave.sent++;
 log(`第 ${wave.id} 波 ${wave.sent}/${wave.count}：${d.name} 進攻第 ${row+1} 路（總數 ${state.enemiesSpawned}/${lv.enemyCount}）。`);
 wave.nextAt=state.time+(lv.enemyCount<25?1700:1100);
 if(wave.sent>=wave.count){
  director.index++;director.active=null;
  director.restUntil=state.time+(lv.enemyCount<25?10000:8000);
  state.nextAI=director.restUntil;
  log(state.enemiesSpawned>=lv.enemyCount?'最後一波已全數出陣，準備迎戰大魔王！':'本波已全數出陣，敵軍暫停增援；趁空檔補陣。');
 }
 persistBattleState();return true;
}
function updateDefenseWaveHUD(){
 const el=document.getElementById('waveStatus');if(!el)return;
 const d=state.waveDirector,lv=state.levelConfig;
 el.hidden=state.faction!=='plants'||!d;if(el.hidden)return;
 const wave=d.active;let text,phase='calm';
 if(state.bossSpawned){text='大魔王登場｜擊敗剩餘敵人即可過關';phase='boss'}
 else if(wave&&!wave.rallied){text=`⚠ 一大波屍潮即將來襲！${Math.max(0,Math.ceil((wave.nextAt-state.time)/1000))} 秒｜第 ${wave.id}/${d.plan.length} 波`;phase='warning'}
 else if(wave){text=`⚔ 第 ${wave.id}/${d.plan.length} 波進攻！本波已出陣 ${wave.sent}/${wave.count}`;phase='active'}
 else if(state.enemiesSpawned>=lv.enemyCount){text=`最後一波已出陣｜${Math.max(0,Math.ceil((state.nextAI-state.time)/1000))} 秒後頭目登場`;phase='warning'}
 else if(state.time<d.restUntil){text=`本波已出陣，補陣空檔 ${Math.ceil((d.restUntil-state.time)/1000)} 秒｜已完成 ${d.index}/${d.plan.length} 波`}
 else{text=`零散試探｜大波進攻 ${d.index}/${d.plan.length}`}
 const label=`${text} · 敵軍 ${state.enemiesSpawned}/${lv.enemyCount}`;
 if(el.textContent!==label)el.textContent=label;
 el.dataset.phase=phase;
}
