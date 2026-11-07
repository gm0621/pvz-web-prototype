import {HEROES,STAGES,ENEMY_ART,BOSS_ART,FEATURES,heroDescription} from './story.mjs?v=attack-frames-5';
import {SAVE_KEY,normalizeProgress,createBattle,deploy,canDeploy,stepBattle,attackFrame,SWING} from './engine.mjs?v=attack-frames-5';

const $=id=>document.getElementById(id);
let progress,screen='home',battle=null,selected=null,storyLevel=1,lineIndex=0,storyPhase='opening',lastFrame=0,resultShown=false,duelShown=false;
try{progress=normalizeProgress(JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'))}catch{progress=normalizeProgress()}
function saveProgress(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(progress))}catch{$('storageNotice').hidden=false}}
function show(id){screen=id;for(const s of document.querySelectorAll('.screen')){s.hidden=s.id!==id;s.classList.toggle('active',s.id===id)}window.scrollTo(0,0)}
function updateHome(){
 const unfinished=battle&&!battle.over;
 $('startBtn').innerHTML=`${unfinished?'繼續戰鬥':progress.completed===6?'重溫第一章':progress.completed?'繼續故事':'開始故事'} <span>→</span>`;
 $('homeProgress').textContent=unfinished?`停在 1-${battle.level} · ${STAGES[battle.level-1].name}`:progress.completed===6?'桃園同心 · 第一章已完成':`已完成 ${progress.completed} / 6 關 · 下一站：${STAGES[progress.completed].name}`;
 $('chapterDots').replaceChildren(...STAGES.map((stage,i)=>{const dot=document.createElement('span');dot.classList.toggle('complete',i<progress.completed);dot.setAttribute('aria-label',`${stage.name}${i<progress.completed?'，已完成':''}`);return dot}));
}
function goHome(){
 if(battle&&!battle.over)battle.paused=true;
 if($('duelDialog').open)$('duelDialog').close();duelShown=false;
 show('home');updateHome();$('startBtn').focus({preventScroll:true});
}
function startStory(level,phase='opening'){
 storyLevel=level;storyPhase=phase;lineIndex=0;battle=null;selected=null;show('story');
 const stage=STAGES[level-1];$('sceneBackdrop').src=stage.scene;$('sceneBackdrop').alt=stage.place+'，'+stage.name+'的故事場景';renderStory();$('storyNext').focus({preventScroll:true});
}
function storyLines(){const stage=STAGES[storyLevel-1];return storyPhase==='ending'?stage.ending:stage.opening}
function finishStory(){if(storyPhase==='opening')beginBattle(storyLevel);else if(storyLevel<6)startStory(storyLevel+1);else goHome()}
function renderStory(){
 const stage=STAGES[storyLevel-1],lines=storyLines(),[speaker,text]=lines[lineIndex],last=lineIndex===lines.length-1;
 $('storyChapter').textContent=`第一章 · 第 ${storyLevel} / 6 關 · ${storyPhase==='ending'?'戰後':'戰前'}`;$('storyTitle').textContent=stage.name;$('storyPlace').textContent=stage.place;
 $('storySpeaker').textContent=speaker;$('storyLine').textContent=text;$('storyCount').textContent=`${lineIndex+1} / ${lines.length}`;
 $('storyPrevious').disabled=lineIndex===0;
 const finalLabel=storyPhase==='ending'?(storyLevel<6?'下一段故事 →':'回到桃園 →'):'出發迎戰 →';
 $('storyNext').textContent=last?finalLabel:'下一句 →';$('storySkip').textContent=storyPhase==='ending'?(storyLevel<6?'前往下一關':'回主選單'):'直接開戰';
 const key={劉備:'liubei',關羽:'guanyu',張飛:'zhangfei'}[speaker];
 const partner=lines.slice(lineIndex+1).find(line=>line[0]!==speaker)?.[0]||lines.slice(0,lineIndex).reverse().find(line=>line[0]!==speaker)?.[0];
 const partnerKey={劉備:'liubei',關羽:'guanyu',張飛:'zhangfei'}[partner];
 for(const actor of document.querySelectorAll('[data-actor]')){actor.classList.toggle('listening',actor.dataset.actor===partnerKey);actor.classList.toggle('speaking',actor.dataset.actor===key);actor.setAttribute('aria-label',actor.alt+(actor.dataset.actor===key?'，正在說話':''))}
 $('storyScene').dataset.speaker=key;
}
function beginBattle(level){battle=createBattle(level);selected=null;resultShown=false;duelShown=false;show('battle');$('battleChapter').textContent=`第一章 · 1-${level}`;$('battleTitle').textContent=STAGES[level-1].name;$('featureBadge').textContent=FEATURES[level-1].name;$('field').style.backgroundImage=`linear-gradient(#d4dfb655,#b9cda588),url("${STAGES[level-1].scene}")`;renderBattle();$('cards').querySelector('button')?.focus({preventScroll:true})}
function syncPause(){if(!battle)return;$('field').classList.toggle('is-paused',battle.paused||!!battle.duel);$('pauseOverlay').hidden=!battle.paused;$('pauseBtn').textContent=battle.paused?'▶ 繼續':'Ⅱ 暫停';$('pauseBtn').setAttribute('aria-pressed',String(battle.paused))}
function setPause(value){if(!battle||battle.over)return;battle.paused=value;syncPause()}
function buildControls(){
 $('lanes').replaceChildren(...['上路','中路','下路'].map((label,lane)=>{const b=document.createElement('button');b.type='button';b.className='lane';b.dataset.lane=lane;b.setAttribute('aria-label',`${label}，點擊出兵`);b.innerHTML=`<span class="lane-label">${label}</span><span class="deploy-zone-label">出兵區</span><span class="lane-direction" aria-hidden="true">→　→　→</span><span class="enemy-zone-label" aria-hidden="true">敵軍 ←</span>`;b.onclick=()=>{
  if(!selected){battle.notice='先選下方一張兵卡，再點路線。';battle.noticeUntil=battle.time+3;renderBattle();return}
  if(deploy(battle,selected,lane))selected=null;renderBattle();
 };return b}));
 $('cards').replaceChildren(...Object.entries(HEROES).map(([key,d])=>{const b=document.createElement('button');b.type='button';b.className='card';b.dataset.hero=key;b.setAttribute('aria-label',`${d.name}，${d.cost} 軍糧，${d.description}`);b.innerHTML=`<img src="${d.asset}" alt=""><div><strong>${d.short}</strong><span class="cost">🌾 ${d.cost}</span><span class="card-status"></span><small class="ability-description">${d.description}</small></div><span class="cooldown" aria-hidden="true"><i></i></span>`;b.onclick=()=>{if(!battle||battle.over||battle.paused||battle.duel)return;selected=selected===key?null:key;renderBattle()};return b}));
}
function unitNode(u,enemy){
 const d=enemy?null:HEROES[u.key],el=document.createElement('div');el.dataset.id=String(u.id);el.dataset.lane=String(u.lane);el.dataset.kind=enemy?'enemy':u.key;
 const sheet=!enemy&&u.key!=='archer';const asset=enemy?(u.boss||u.shielded?BOSS_ART:ENEMY_ART):d.asset,name=enemy?u.name:d.name;
 el.innerHTML=`<span class="unit-shadow"></span><div class="unit-figure${sheet?' frame-figure':''}">${sheet?`<span class="attack-sprite" style="background-image:url('./assets/attacks/${u.key}.png')"></span>`:`<img class="sprite-upper" src="${asset}" alt=""><img class="sprite-leg leg-left" src="${asset}" alt=""><img class="sprite-leg leg-right" src="${asset}" alt="">`}</div><div class="health"><i></i></div><span class="unit-name">${name}</span>`;return el;
}
function renderUnits(){
 const root=$('units'),existing=new Map([...root.children].map(el=>[el.dataset.id,el])),ids=new Set();
 for(const [list,enemy] of [[battle.allies,false],[battle.enemies,true]])for(const u of list){
  const id=String(u.id);ids.add(id);let el=existing.get(id);if(!el){el=unitNode(u,enemy);root.append(el)}
  const framed=!enemy&&u.key!=='archer',attacking=framed?battle.time-(u.swingStartedAt??-100)<SWING.duration:battle.time-u.lastAttack<.32;
  el.className=`unit ${enemy?'enemy':'ally'}${framed?' has-attack-frames':''}${u.boss?' boss':''}${u.shielded?' shielded':''} ${u.action||'guarding'}${attacking?(u.key==='archer'?' shooting':' striking'):''}${u.flash>0&&!attacking?' hit':''}`;
  if(framed){const frame=attackFrame(u,battle.time),sprite=el.querySelector('.attack-sprite');sprite.dataset.frame=frame;sprite.style.backgroundPosition=`${(frame%3)*50}% ${Math.floor(frame/3)*100}%`;el.classList.toggle('impact',battle.time<(u.impactUntil||0))}
  el.style.left=`${u.x*100}%`;el.style.top=`${(u.lane+.5)/3*100}%`;el.querySelector('.unit-name').textContent=(enemy?u.name:HEROES[u.key].name)+(u.action==='holding'?' · 駐守':'');el.querySelector('.health i').style.width=`${Math.max(0,u.hp/u.maxHp*100)}%`;
 }
 for(const [id,el] of existing)if(!ids.has(id))el.remove();
}
function renderEffects(){
 const root=$('effects'),existing=new Map([...root.children].map(el=>[el.dataset.id,el])),ids=new Set();
 for(const e of battle.effects){const id=String(e.id);ids.add(id);let el=existing.get(id);if(!el){el=document.createElement('span');el.dataset.id=id;el.className=`combat-effect ${e.type}`;if(e.type==='defeat'||e.type==='breach'){const img=document.createElement('img');img.src=e.key?HEROES[e.key].asset:e.boss?BOSS_ART:ENEMY_ART;img.alt='';el.append(img);el.classList.toggle('enemy-exit',!!e.enemy)}else el.textContent=e.type==='heal'||e.type==='oath'?'+':e.type==='roar'?'震':e.type==='cleave'?'斬':e.type==='arrow'?'➶':'';root.append(el)}
 const progress=1-e.remaining/e.duration,x=['arrow','breach'].includes(e.type)?e.from+(e.to-e.from)*progress:e.to;
 el.style.left=`${x*100}%`;el.style.top=`${(e.lane+.5)/3*100}%`;el.style.opacity=String(e.type==='arrow'?1:['defeat','breach'].includes(e.type)?1-progress:Math.sin(Math.PI*progress));
 el.style.setProperty('--effect-progress',String(progress));
 }
 for(const [id,el] of existing)if(!ids.has(id))el.remove();
}
function renderBattle(){
 if(!battle)return;
 $('food').textContent=Math.floor(battle.food);$('lives').textContent='♥ '.repeat(Math.max(0,battle.lives)).trim()||'防線失守';$('lives').setAttribute('aria-label',`剩餘 ${Math.max(0,battle.lives)} 次防線`);
 $('waveText').textContent=battle.bossSpawned?'敵將已出陣':`敵軍 ${battle.spawned} / ${STAGES[battle.level-1].enemyCount}`;
 const notice=battle.time<battle.noticeUntil?battle.notice:FEATURES[battle.level-1].text;
 if($('battleNotice').textContent!==notice)$('battleNotice').textContent=notice;
 $('selectionHint').textContent=selected?`已選${HEROES[selected].short} · 點上、中或下路出兵`:'選兵卡，再點路線 · 抵達前線後自動駐守';
 for(const card of $('cards').children){
  const key=card.dataset.hero,d=HEROES[key],remaining=Math.max(0,(battle.cooldowns[key]||0)-battle.time),active=key!=='archer'&&battle.allies.some(u=>u.hp>0&&u.key===key),description=heroDescription(key,battle.level);
  card.classList.toggle('selected',selected===key);card.classList.toggle('unavailable',active||battle.food<d.cost||remaining>0);card.classList.toggle('in-field',active);card.setAttribute('aria-pressed',String(selected===key));
  card.disabled=active||remaining>0||battle.paused||!!battle.duel||battle.over;
  card.querySelector('.card-status').textContent=active?'出戰中':remaining>0?`整備 ${Math.ceil(remaining)} 秒`:battle.food<d.cost?'等待軍糧':key==='archer'?'可增援':'可出戰';
  card.querySelector('.ability-description').textContent=description;card.setAttribute('aria-label',`${d.name}，${d.cost} 軍糧，${description}，${card.querySelector('.card-status').textContent}`);
  card.querySelector('.cooldown i').style.width=`${active?100:Math.max(0,100-remaining/(key==='archer'?d.cooldown:12)*100)}%`;
 }
 for(const lane of $('lanes').children){const ready=selected&&!canDeploy(battle,selected,Number(lane.dataset.lane));lane.classList.toggle('ready',!!ready);lane.disabled=battle.paused||!!battle.duel||battle.over}
 renderUnits();renderEffects();syncPause();const skill=battle.skillNotice&&battle.time<battle.skillNotice.until?battle.skillNotice:null;$('skillBanner').hidden=!skill;if(skill){$('skillBanner').textContent=skill.text;$('skillBanner').dataset.hero=skill.key}
 if(battle.duel&&!duelShown){const d=battle.duel;$('duelTitle').textContent=`${HEROES[d.heroKey].short} 對 ${d.bossName}`;$('duelHero').src=HEROES[d.heroKey].asset;$('duelHero').alt=HEROES[d.heroKey].name;$('duelEnemy').src=BOSS_ART;$('duelDialog').showModal();duelShown=true}
 if(!battle.duel&&duelShown){$('duelDialog').close();duelShown=false}
 if(battle.over&&!resultShown)showResult();
}
function showResult(){
 resultShown=true;selected=null;const stage=STAGES[battle.level-1];
 if(battle.won){progress.completed=Math.max(progress.completed,battle.level);saveProgress()}
 $('resultMark').textContent=battle.won?'勝':'再起';$('resultChapter').textContent=`第一章 · 1-${battle.level}`;
 $('resultTitle').textContent=battle.won?(battle.level===6?'桃園同心':'此戰告捷'):'重整陣形，再來一次';
 $('resultText').textContent=battle.won?stage.victory:'先讓弓兵照應三路，再用張飛頂住前線、關羽斬擊敵軍、劉備回復友軍。軍糧會持續補給，留意空著的路線。';
 $('resultNext').textContent=battle.won?'繼續劇情 →':'再試一次 →';show('result');$('resultNext').focus({preventScroll:true});
}
function frame(now){
 const dt=Math.min(.1,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
 if(screen==='battle'&&battle&&!battle.over){stepBattle(battle,dt);renderBattle()}
 requestAnimationFrame(frame);
}
$('startBtn').onclick=()=>{if(battle&&!battle.over){show('battle');setPause(false);renderBattle()}else startStory(progress.completed<6?progress.completed+1:1)};
$('storyNext').onclick=()=>{if(lineIndex<storyLines().length-1){lineIndex++;renderStory()}else finishStory()};
$('storyPrevious').onclick=()=>{if(lineIndex>0){lineIndex--;renderStory()}};
$('storySkip').onclick=finishStory;
$('resultNext').onclick=()=>{if(!battle.won)beginBattle(battle.level);else startStory(battle.level,'ending')};
for(const button of document.querySelectorAll('[data-home]'))button.onclick=goHome;
$('pauseBtn').onclick=()=>setPause(!battle.paused);$('resumeBtn').onclick=()=>setPause(false);
$('duelDialog').addEventListener('cancel',event=>event.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&battle&&!battle.over)setPause(true)});
$('musicBtn').onclick=async()=>{const music=$('music'),on=music.paused;try{if(on){music.volume=.25;await music.play()}else music.pause();$('musicBtn').textContent=`♫ 音樂：${on?'開':'關'}`;$('musicBtn').setAttribute('aria-pressed',String(on))}catch{$('musicBtn').textContent='♫ 再點一次播放'}};
for(const key of ['liubei','guanyu','zhangfei']){const preload=new Image();preload.src=`./assets/attacks/${key}.png`}
buildControls();updateHome();requestAnimationFrame(frame);
