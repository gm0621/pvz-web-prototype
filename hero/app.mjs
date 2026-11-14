import {renderPassiveFeedback} from './passive-view.mjs?v=passive-feedback-1';
import {mountSkillIntro} from './skill-intro.mjs?v=passive-feedback-1';
import {beginReading,installStoryReader} from './story-reader.mjs?v=passive-feedback-1';
import {shortPages} from './story-pages.mjs?v=passive-feedback-1';
import {configureRoster,configurePeachRoster,configureSunRoster,awardExperience,SLOTS,ALL_GENERALS as GENERALS} from './roster.mjs?v=passive-feedback-1';
import {openDeployment,mountActiveSkills} from './roster-view.mjs?v=passive-feedback-1';
import {castActive,lanesFor,laneLabel} from './engine.mjs?v=passive-feedback-1';
import {mountSkillGuide} from './skill-guide.mjs?v=passive-feedback-1';
import {renderPeople,STORY_PEOPLE} from './characters.mjs?v=passive-feedback-1';
import {FACTIONS,factionFor,enemyPortrait,paintPortrait} from './factions.mjs?v=passive-feedback-1';
import {mountHistoryLesson} from './history-view.mjs?v=passive-feedback-1';
import {renderSkillCutin} from './skill-cutin.mjs?v=passive-feedback-1';
import {renderMasterCutin} from './master-cutin.mjs?v=passive-feedback-1';
import {renderBossCutin} from './boss-cutin.mjs?v=passive-feedback-1';
import {mountBattleKeys} from './battle-keys.mjs?v=passive-feedback-1';
import {mountJourney} from './journey-view.mjs?v=passive-feedback-1';
import {renderMission} from './chapter-mission-view.mjs?v=passive-feedback-1';
import {mountCampaignMap} from './campaign-map.mjs?v=passive-feedback-1';
import {advanceBattleFrame,normalizeBattleSpeed} from './battle-speed.mjs?v=passive-feedback-1';
import {mountNovel} from './novel.mjs?v=passive-feedback-1';
import {mountCamp} from './camp-view.mjs?v=passive-feedback-1';
import {rewardVictory,useSupply,weaponsForLevel} from './campaign.mjs?v=passive-feedback-1';
import {createFirstGuide} from './first-guide.mjs?v=passive-feedback-1';
import {mountStoryTask} from './story-play.mjs?v=passive-feedback-1';
import {CHAPTER_BACKGROUNDS,STAGE_LEADS} from './prologue.mjs?v=passive-feedback-1';
import {setMusic,setMusicMode,setMusicHome,musicTheme,musicOn,setSfx,unlockAudio,hitSound} from './audio.mjs?v=passive-feedback-1';
import {renderDuel} from './duel-view.mjs?v=passive-feedback-1';
import {chapterInfo,enemyArt,HEROES as BASE_HEROES,heroesForLevel,STAGES,ENEMY_ART,SHIELD_ART,FEATURES,heroDescription} from './story.mjs?v=passive-feedback-1';
import {bossProfile,LANE_CAPACITY,laneCount,ENEMY_SWING,enemyAttackFrame,skipDuelEntrance,positionHero,commandHero,moveHero,BOSS_SKILLS,SAVE_KEY,normalizeProgress,createBattle,deploy,canDeploy,attackFrame,SWING} from './engine.mjs?v=passive-feedback-1';

const $=id=>document.getElementById(id);
let HEROES=BASE_HEROES;
function useRoster(level){HEROES=heroesForLevel(level);document.body.dataset.faction=factionFor(level)||'shu';for(const card of $('cards').children){const d=HEROES[card.dataset.hero];card.hidden=!d;if(!d)continue;paintPortrait(card.querySelector('img'),d);card.querySelector('img').alt=d.name;card.querySelector('strong').textContent=d.short;card.querySelector('.cost').textContent=`🌾 ${d.cost}`;}for(const actor of document.querySelectorAll('[data-actor]')){const d=HEROES[actor.dataset.actor];paintPortrait(actor,d);actor.alt=d.name;}}

const GENERAL_ATTACK_SHEETS={'張梁':'zhang-liang.png','張寶':'zhang-bao.png'};
let firstGuide=null,battleSpeed=1;
let progress,screen='home',battle=null,selected=null,selectedUnitId=null,storyLevel=1,lineIndex=0,storyPhase='opening',lastFrame=0,resultShown=false,duelShown=false;
let storageReadFailed=false;
try{progress=normalizeProgress(JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'))}catch{
 progress=normalizeProgress();storageReadFailed=true;$('storageNotice').textContent='無法讀取原存檔。為保護已有進度，本頁不會覆寫；請重新整理後再試。';$('storageNotice').hidden=false;
}
function saveProgress(next=progress){
 if(storageReadFailed)return false;
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(next));$('storageNotice').hidden=true;$('storageRetry').hidden=true;$('resultRetrySave').hidden=true;return true}catch{$('storageNotice').textContent='目前無法保存；未保存的通關與軍資在重整後可能遺失。購買或使用道具失敗時不會扣除。';$('storageNotice').hidden=false;$('storageRetry').hidden=false;return false}
}
function syncMusicButton(on=musicOn()){$('musicBtn').textContent=on?`♫ ${musicTheme().name}`:'♫ 音樂：關';$('musicBtn').setAttribute('aria-pressed',String(on))}
let ownsFullscreen=false,focusRevision=0;
function focusBattle(active){
 document.body.classList.toggle('battle-focus',active);const revision=++focusRevision;
 if(active&&!document.fullscreenElement&&document.documentElement.requestFullscreen){
  document.documentElement.requestFullscreen().then(()=>{ownsFullscreen=true;if(screen==='battle'){for(const dialog of document.querySelectorAll('dialog[open]')){dialog.close();dialog.showModal()}}if(revision!==focusRevision&&screen!=='battle'){ownsFullscreen=false;document.exitFullscreen?.().catch(()=>{})}}).catch(()=>{});
 }else if(!active&&ownsFullscreen){ownsFullscreen=false;if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{})}
}
function show(id){screen=id;document.body.classList.toggle('story-focus',id==='story');focusBattle(id==='battle');for(const s of document.querySelectorAll('.screen')){s.hidden=s.id!==id;s.classList.toggle('active',s.id===id)}window.scrollTo(0,0)}
function updateHome(){
 const unfinished=battle&&!battle.over;
 $('startBtn').innerHTML=`${unfinished?'繼續戰鬥':progress.completed===STAGES.length?'重溫故事':progress.completed?'繼續故事':'開始故事'} <span>→</span>`;
 $('homeProgress').textContent=unfinished?`停在 ${chapterInfo(battle.level).chapter}-${chapterInfo(battle.level).number} · ${STAGES[battle.level-1].name}`:progress.completed===STAGES.length?`第${['','一','二','三','四','五','六','七','八','九','十','十一'][chapterInfo(STAGES.length).chapter]}章完成 · ${chapterInfo(STAGES.length).title}`:`已完成 ${progress.completed} / ${STAGES.length} 關 · 下一站：${STAGES[progress.completed].name}`;
 const currentChapter=chapterInfo(Math.min(progress.completed+1,STAGES.length)).chapter;
 const chapters=[...new Set(STAGES.map((_,i)=>chapterInfo(i+1).chapter))];
 function selectChapter(chapter){
  for(const button of $('chapterTabs').children)button.setAttribute('aria-pressed',String(Number(button.dataset.chapter)===chapter));
  for(const button of $('chapterDots').children)button.hidden=Number(button.dataset.chapter)!==chapter;
 }
 $('chapterTabs').replaceChildren(...chapters.map(chapter=>{const button=document.createElement('button');button.type='button';button.dataset.chapter=chapter;const level=STAGES.findIndex((_,i)=>chapterInfo(i+1).chapter===chapter)+1;button.textContent=`第 ${chapter} 章 · ${chapterInfo(level).title}`;button.onclick=()=>selectChapter(chapter);return button}));
 $('chapterDots').replaceChildren(...STAGES.map((stage,i)=>{const button=document.createElement('button');button.type='button';const info=chapterInfo(i+1);button.dataset.chapter=info.chapter;button.dataset.level=i+1;button.disabled=i>progress.completed;button.classList.toggle('complete',i<progress.completed);const number=document.createElement('span'),name=document.createElement('strong'),status=document.createElement('small');number.textContent=String(info.number).padStart(2,'0');name.textContent=stage.name;status.textContent=i<progress.completed?'✓ 已完成・重溫':i===progress.completed?'下一站 →':'尚未解鎖';button.append(number,name,status);button.onclick=()=>startStory(i+1);return button}));
 selectChapter(currentChapter);
}
function goHome(){
 if(battle&&!battle.over)battle.paused=true;
 if($('duelDialog').open)$('duelDialog').close();duelShown=false;
 setMusicHome();syncMusicButton();
 show('home');updateHome();$('startBtn').focus({preventScroll:true});
}
function startStory(level,phase='opening'){useRoster(level);mountHistoryLesson(STAGES[level-1],HEROES);
 setMusicMode(phase==='ending'?'victory':'story',level);syncMusicButton();storyLevel=level;storyPhase=phase;lineIndex=0;battle=null;selected=null;selectedUnitId=null;show('story');
 const stage=STAGES[level-1];$('sceneBackdrop').src=stage.scene;$('sceneBackdrop').alt=stage.place+'，'+stage.name+'的故事場景';renderStory();setPrologue(phase==='opening');beginReading(phase==='ending');
}
function setPrologue(visible){
 if(visible){mountStoryTask(storyLevel,HEROES,()=>hitSound('heal'));$('storyPrologue').scrollTop=0;mountNovel(storyLevel,HEROES,CHAPTER_BACKGROUNDS[chapterInfo(storyLevel).chapter],STAGE_LEADS[storyLevel-1]);mountJourney(storyLevel,STAGES[storyLevel-1])}
 const info=chapterInfo(storyLevel),background=CHAPTER_BACKGROUNDS[info.chapter];
 $('storyPrologue').hidden=!visible;$('storyScene').classList.toggle('has-prologue',visible);
 $('storyScene').querySelector('.scene-cast').hidden=visible;$('storyScene').querySelector('.scene-dialogue').hidden=visible;
 $('prologueEra').textContent=STAGES[storyLevel-1].year?`${STAGES[storyLevel-1].year} 年・${FACTIONS[STAGES[storyLevel-1].faction].title}`:background.era;
 if(!visible&&storyPhase==='opening'){setMusicMode('prepare',storyLevel);syncMusicButton()}
 (visible?$('prologueContinue'):$('storyNext')).focus({preventScroll:true});
}
function storyLines(){const stage=STAGES[storyLevel-1];return shortPages(storyPhase==='ending'?stage.ending:stage.opening,40)}
function finishStory(){if(storyPhase==='opening')beginBattle(storyLevel);else if(storyLevel<STAGES.length)startStory(storyLevel+1);else goHome()}
function renderStory(){
 const stage=STAGES[storyLevel-1],lines=storyLines(),[speaker,text]=lines[lineIndex],last=lineIndex===lines.length-1;
 $('storyChapter').textContent=`第${['','一','二','三','四','五','六','七','八','九','十','十一'][chapterInfo(storyLevel).chapter]}章 · 第 ${chapterInfo(storyLevel).number} / ${chapterInfo(storyLevel).count} 關 · ${storyPhase==='ending'?'戰後':'戰前'}`;$('storyTitle').textContent=stage.name;$('storyAdaptation').textContent=storyLevel>=5?stage.note:'劇情依《三國演義》第一回改編；對話與小型遭遇為遊戲補寫。';$('storyPlace').textContent=stage.place;
 $('storySpeaker').textContent=speaker;$('storyLine').textContent=text;renderPeople($('storyPeople'),text,speaker);$('storyCount').textContent=`${lineIndex+1} / ${lines.length}`;
 $('storyPrevious').disabled=lineIndex===0;
 const finalLabel=storyPhase==='ending'?(storyLevel<STAGES.length?'下一段故事 →':'回主選單 →'):'出發迎戰 →';
 $('storyNext').textContent=last?finalLabel:'下一句 →';$('storySkip').textContent=storyPhase==='ending'?(storyLevel<STAGES.length?'前往下一關':'回主選單'):'直接開戰';
 const key=Object.keys(HEROES).find(k=>HEROES[k].name===speaker);
 const person=HEROES[key]||STORY_PEOPLE.find(p=>p.name===speaker);$('storyPortrait').hidden=!person;if(person){paintPortrait($('storyPortrait'),person);$('storyPortrait').alt=speaker}
 $('storyScene').dataset.level=String(storyLevel);
 const partner=lines.slice(lineIndex+1).find(line=>line[0]!==speaker)?.[0]||lines.slice(0,lineIndex).reverse().find(line=>line[0]!==speaker)?.[0];
 const partnerKey=Object.keys(HEROES).find(k=>HEROES[k].name===partner);
 for(const actor of document.querySelectorAll('[data-actor]')){actor.classList.toggle('listening',actor.dataset.actor===partnerKey);actor.classList.toggle('speaking',actor.dataset.actor===key);actor.setAttribute('aria-label',actor.alt+(actor.dataset.actor===key?'，正在說話':''))}
 $('storyScene').dataset.speaker=key;
}
function beginBattle(level,ready=false){if(factionFor(level)==='cao'&&!ready){
 const returnMode=screen==='camp'?'camp':storyPhase==='ending'?'victory':$('storyPrologue').hidden?'prepare':'story';
 setMusicMode('prepare',level);syncMusicButton();
 openDeployment({level,progress,save:saveProgress,onStart:()=>beginBattle(level,true),onCancel:()=>{setMusicMode(returnMode,level);syncMusicButton()}});return
}useRoster(level);setMusicMode('battle',level);syncMusicButton();battle=createBattle(level,Date.now(),weaponsForLevel(progress,level));if(factionFor(level)==='cao'){configureRoster(battle,progress,HEROES.archer);HEROES=battle.roster;battle.food=Math.min(300,battle.food+60*(lanesFor(battle)-3))}else if(factionFor(level)==='sun'){configureSunRoster(battle,progress,HEROES.archer);HEROES=battle.roster}else if(!factionFor(level)){configurePeachRoster(battle,progress);HEROES=battle.roster}buildDeploymentControls();firstGuide=createFirstGuide(level);selected=null;selectedUnitId=null;resultShown=false;duelShown=false;show('battle');$('battleChapter').textContent=`第${['','一','二','三','四','五','六','七','八','九','十','十一'][chapterInfo(level).chapter]}章 · ${chapterInfo(level).number}`;$('battleTitle').textContent=STAGES[level-1].name+(factionFor(level)?` · ${FACTIONS[factionFor(level)].title}`:'');$('featureBadge').textContent=FEATURES[level-1].name;$('field').style.backgroundImage=`linear-gradient(#d4dfb655,#b9cda588),url("${STAGES[level-1].scene}")`;renderBattle();$('cards').querySelector('button')?.focus({preventScroll:true})}
function selectedUnit(){return battle?.allies.find(u=>u.hp>0&&(selectedUnitId!==null?u.id===selectedUnitId:selected!=='archer'&&!HEROES[selected]?.troop&&u.key===selected))}
function syncPause(){if(!battle)return;$('field').classList.toggle('is-paused',battle.paused||!!battle.duel||!!battle.introPending);$('pauseOverlay').hidden=!battle.paused;$('pauseBtn').textContent=battle.paused?'▶ 繼續':'Ⅱ 暫停';$('pauseBtn').setAttribute('aria-pressed',String(battle.paused))}
function setPause(value){if(!battle||battle.over)return;battle.paused=value;syncPause()}
function buildControls(){
 const picker=document.createElement('label');picker.id='unitPicker';picker.className='unit-picker';picker.append('選擇場上友軍 ');const select=document.createElement('select');select.id='unitSelect';select.setAttribute('aria-label','選擇場上友軍');select.onchange=()=>{if(!battle||battle.paused||battle.over||battle.duel||battle.introPending)return;const unit=battle.allies.find(u=>u.hp>0&&String(u.id)===select.value);selected=unit?.key||null;selectedUnitId=unit?.id??null;renderBattle()};picker.append(select);$('field').after(picker);
 const controls=document.createElement('div');controls.id='orders';controls.className='orders';controls.setAttribute('aria-label','部隊調動');
 const marker=document.createElement('span');marker.id='moveTarget';marker.setAttribute('aria-hidden','true');$('field').append(marker);
 const label=document.createElement('span');label.id='orderStatus';controls.append(label);
 for(const [order,title] of [['up','↑ 上移'],['back','← 後退'],['hold','駐守'],['forward','前進 →'],['down','↓ 下移'],['auto','自動前進']]){const button=document.createElement('button');button.type='button';button.dataset.order=order;button.textContent=title;button.onclick=()=>{if(commandHero(battle,selectedUnit()?.id,order))firstGuide?.event(order==='hold'?'hold':order==='forward'?'move':'');renderBattle()};controls.append(button)}
 $('cards').before(controls);const feedback=document.createElement('p');feedback.id='commandFeedback';feedback.setAttribute('role','status');feedback.hidden=true;controls.after(feedback);
 buildDeploymentControls();
}
function buildDeploymentControls(){
 const labels=Array.from({length:battle?.laneTotal||3},(_,i)=>(battle?.laneTotal>3?`第 ${i+1}`:['上','中','下'][i])+'路');$('lanes').style.gridTemplateRows=`repeat(${labels.length},1fr)`;$('field').dataset.lanes=labels.length;
 $('lanes').replaceChildren(...labels.map((label,lane)=>{const b=document.createElement('button');b.type='button';b.className='lane';b.dataset.lane=lane;b.setAttribute('aria-label',`${label}，點擊出兵`);b.innerHTML=`<span class="lane-label">${label}</span><span class="lane-capacity"></span><span class="deploy-zone-label">出兵區</span><span class="lane-direction" aria-hidden="true">→　→　→</span><span class="enemy-zone-label" aria-hidden="true">敵軍 ←</span>`;b.onclick=event=>{
  if(!selected){battle.notice='先選下方一張兵卡，再點路線。';battle.noticeUntil=battle.time+3;renderBattle();return}
  const active=selectedUnit();
  if(active){const rect=$('field').getBoundingClientRect();const unit=active;if(positionHero(battle,unit.id,lane,event.detail===0?unit.x:(event.clientX-rect.left)/rect.width)&&unit.order==='forward')firstGuide?.event('move')}else {const deploying=selected;if(deploy(battle,deploying,lane)){if(deploying!=='archer')firstGuide?.event('deploy');selected=null;selectedUnitId=null;}}renderBattle();
 };return b}));
 $('cards').replaceChildren(...Object.entries(HEROES).map(([key,d])=>{const b=document.createElement('button');b.type='button';b.className='card';b.dataset.hero=key;b.setAttribute('aria-label',`${d.name}，${d.cost} 軍糧，${d.description}`);b.innerHTML=`<img src="${d.asset}" alt=""><div><strong>${d.short}</strong><span class="cost">🌾 ${d.cost}</span><span class="card-status"></span><small class="ability-description">${d.description}</small></div><span class="cooldown" aria-hidden="true"><i></i></span>`;paintPortrait(b.querySelector('img'),d);b.querySelector('img').alt=d.name;b.onclick=()=>{if(!battle||battle.over||battle.paused||battle.duel)return;selected=selected===key&&selectedUnitId===null?null:key;selectedUnitId=null;if(selected&&key!=='archer')firstGuide?.event(battle.allies.some(u=>u.key===key)?'select-unit':'select-card');renderBattle()};return b}));
}
function unitNode(u,enemy){
 const d=enemy?null:HEROES[u.key],el=document.createElement('div');el.dataset.id=String(u.id);el.dataset.lane=String(u.lane);el.dataset.kind=enemy?'enemy':u.key;
 if(!enemy){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`選取${d.name}，調動位置`);el.onclick=()=>{if(battle.paused||battle.duel||battle.introPending||battle.over)return;if(selected&&!selectedUnit()){const deploying=selected;if(deploy(battle,deploying,u.lane)){firstGuide?.event('deploy');selected=null;selectedUnitId=null;}renderBattle();return;}if(selectedUnit()?.id===u.id){if(commandHero(battle,u.id,'hold'))firstGuide?.event('hold')}else {selected=u.key;selectedUnitId=u.id;firstGuide?.event('select-unit')}renderBattle()};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}}}
 const sheet=enemy?(GENERAL_ATTACK_SHEETS[u.name]||(!u.boss&&!u.ranged?'yellow-turban-troops.png':null)):u.key!=='archer'&&!d.troop&&!d.atlas?`${u.key}.png`:null,asset=enemy?(u.boss?enemyArt(u.name):u.ranged?HEROES.archer.asset:u.shielded?SHIELD_ART:ENEMY_ART):d.asset,name=enemy?u.name:d.name;
 el.innerHTML=`<span class="unit-shadow"></span><div class="unit-figure${sheet?' frame-figure':''}">${sheet?`<span class="attack-sprite" style="background-image:url('./assets/attacks/${sheet}')"></span>`:`<img class="sprite-upper" src="${asset}" alt=""><img class="sprite-leg leg-left" src="${asset}" alt=""><img class="sprite-leg leg-right" src="${asset}" alt="">`}</div><div class="health"><i></i></div><span class="unit-name">${name}</span>`;const atlas=enemy?enemyPortrait(u.name,battle.level):d.atlas?d:null;if(atlas){el.querySelector('.unit-figure').className='unit-figure frame-figure';el.querySelector('.unit-figure').innerHTML='<span class="attack-sprite faction-sprite"></span>';el.querySelector('.attack-sprite').style.backgroundImage=`url("${atlas.atlas}")`;}return el;
}
function renderUnits(){
 const root=$('units'),existing=new Map([...root.children].map(el=>[el.dataset.id,el])),ids=new Set();
 for(const [list,enemy] of [[battle.allies,false],[battle.enemies,true]])for(const u of list){
  const id=String(u.id);ids.add(id);let el=existing.get(id);if(!el){el=unitNode(u,enemy);root.append(el)}
  const atlas=enemy?enemyPortrait(u.name,battle.level):HEROES[u.key].atlas?HEROES[u.key]:null,generalFramed=enemy&&!!GENERAL_ATTACK_SHEETS[u.name],framed=!!atlas||(enemy?(!u.boss&&!u.ranged||generalFramed):u.key!=='archer'&&!HEROES[u.key].troop),attacking=u.ranged?battle.time-(u.shotAt??-100)<.32:generalFramed?!!u.castAt:framed?battle.time-(u.swingStartedAt??-100)<(enemy?ENEMY_SWING.duration:SWING.duration):battle.time-u.lastAttack<.32;
  el.setAttribute('aria-pressed',String(!enemy&&selectedUnit()?.id===u.id));el.dataset.order=u.order||'auto';el.dataset.lane=String(u.lane);el.dataset.bossName=u.boss?u.name:'';el.dataset.bossPhase=!u.boss?'':battle.time<(u.recoveryUntil||0)?'exposed':u.castAt?'casting':u.enraged?'enraged':!u.skillsCast?'guard':'fighting';el.dataset.skill=u.boss?bossProfile(battle,u).skillType||'':'';el.style.setProperty('--cast-progress',String(u.castAt?Math.max(0,1-(u.castAt-battle.time)/2.5):0));
  el.className=`unit ${atlas?.atlas.endsWith('/dong.png')?'atlas-unit ':''}${enemy?'enemy':'ally'}${framed?' has-attack-frames':''}${u.boss?' boss':''}${u.elite?' elite':''}${u.ranged?' ranged-enemy':''}${battle.time<(u.rallyUntil||0)?' rallied':''}${u.shielded?' shielded':''}${battle.time<(u.slowUntil||0)?' rain-slowed':''} ${u.action||'guarding'}${attacking?(u.key==='archer'||u.ranged?' shooting':' striking'):''}${u.flash>0&&!attacking?' hit':''}`;
  if(framed){const frame=generalFramed?(u.castAt?(u.castAt-battle.time>.45?0:1):2):enemy?enemyAttackFrame(u,battle.time):attackFrame(u,battle.time),sprite=el.querySelector('.attack-sprite');sprite.dataset.frame=frame;sprite.style.backgroundSize=generalFramed?'300% 100%':'300% 200%';sprite.style.backgroundPosition=`${(frame%3)*50}% ${generalFramed?0:enemy?(u.shielded?100:0):Math.floor(frame/3)*100}%`;el.classList.toggle('impact',generalFramed?frame===1:battle.time<(u.impactUntil||0))}
  if(atlas){const sprite=el.querySelector('.attack-sprite'),age=battle.time-(u.swingStartedAt??-100),frame=u.castAt?(u.castAt-battle.time>.45?1:2):u.boss?(battle.time-u.lastAttack<.32?2:0):age>=0&&age<.58?(age<.24?1:2):0;sprite.style.backgroundSize='300% 300%';sprite.style.backgroundPosition=`${frame*50}% ${atlas.row*50}%`;sprite.dataset.frame=String(frame);}
  el.style.left=u.boss?`clamp(50px, ${u.x*100}%, calc(100% - 50px))`:`${u.x*100}%`;const row=list.filter(a=>a.lane===u.lane&&a.hp>0).sort((a,b)=>a.id-b.id),offset=!enemy&&row.length>1?(row.indexOf(u)-(row.length-1)/2)*18:0;el.style.top=`calc(${(u.lane+.5)/lanesFor(battle)*100}% + ${offset}px)`;el.querySelector('.unit-name').textContent=(enemy?u.name:HEROES[u.key].name)+(u.action==='holding'?' · 駐守':'');el.querySelector('.health i').style.width=`${Math.max(0,u.hp/u.maxHp*100)}%`;
 }
 for(const [id,el] of existing)if(!ids.has(id))el.remove();
}
function renderEffects(){
 const sounded=new Set();const root=$('effects'),existing=new Map([...root.children].map(el=>[el.dataset.id,el])),ids=new Set();
 for(const e of battle.effects){const id=String(e.id);ids.add(id);let el=existing.get(id);if(!el){if(!e.master&&['slash','enemy-slash','arrow','enemy-arrow','cleave','heal','oath','roar','boss','block','rally','fire','hook','thunder','wind','rain','rock'].includes(e.type)&&!sounded.has(e.type)){hitSound(({'enemy-arrow':'arrow',rally:'roar',fire:'boss',hook:'cleave',thunder:'thunder',rock:'boss'})[e.type]||e.type);sounded.add(e.type)}el=document.createElement('span');el.dataset.id=id;el.className=`combat-effect ${e.type}`;if(e.type==='defeat'||e.type==='breach'||e.type==='retreat'||e.type==='capture'){const img=document.createElement('img');img.src=e.key?HEROES[e.key].asset:e.boss?enemyArt(e.bossName):e.ranged?HEROES.archer.asset:e.shielded?SHIELD_ART:ENEMY_ART;const portrait=e.key?HEROES[e.key]:enemyPortrait(e.bossName,battle.level);if(portrait)paintPortrait(img,portrait);img.alt=e.type==='capture'?e.bossName+'被俘':'';el.append(img);if(e.type==='capture'){const label=document.createElement('small');label.textContent='被俘';el.append(label)};el.classList.toggle('enemy-exit',!!e.enemy);el.classList.toggle('ranged-exit',!!e.ranged);el.classList.toggle('left-facing-exit',!!e.enemy&&!!portrait?.atlas&&!portrait.atlas.endsWith('/dong.png'))}else el.textContent=e.type==='heal'||e.type==='oath'?'+':e.type==='roar'?'震':e.type==='cleave'?'斬':e.type==='arrow'?'➶':({rally:'旗',fire:'♨',hook:'⛓',thunder:'ϟ',wind:'風',rain:'雨'})[e.type]||'';root.append(el)}
 const progress=1-e.remaining/e.duration,x=['arrow','enemy-arrow','breach','retreat'].includes(e.type)?e.from+(e.to-e.from)*progress:e.to;
 el.style.left=`${x*100}%`;el.style.top=`${(e.lane+.5)/lanesFor(battle)*100}%`;el.style.opacity=String(['arrow','enemy-arrow'].includes(e.type)?1:['defeat','breach','retreat','capture'].includes(e.type)?1-progress:Math.sin(Math.PI*progress));
 if(e.type==='slash'&&e.weapon==='zhangfei'){el.classList.add('spear-thrust');el.style.width=`${Math.max(.03,e.to-e.from)*100}%`}
 el.style.setProperty('--effect-progress',String(progress));
 }
 for(const [id,el] of existing)if(!ids.has(id))el.remove();
}
function renderBattle(){
 if(!battle)return;renderBossCutin(battle);renderMasterCutin(battle);renderSkillCutin(battle);renderPassiveFeedback(battle);renderMission(battle,renderBattle);campaignMap.update(battle);
 const boss=battle.enemies.find(e=>e.boss&&e.hp>0&&e.castAt)||battle.enemies.find(e=>e.boss&&e.hp>0),stage=STAGES[battle.level-1];
 $('bossHud').hidden=!boss;
 if(boss){$('bossHudName').textContent=`${bossProfile(battle,boss).title}・${boss.name}`;$('bossHudHp').style.width=`${boss.hp/boss.maxHp*100}%`;$('bossHudState').textContent=boss.castAt?`${bossProfile(battle,boss).skillName}蓄力！${stage.skillType==='rally'?'敵兵即將加速':'換路閃避'}`:boss.support?`${bossProfile(battle,boss).skillName}・預警後換路閃避`:stage.skillType?`${bossProfile(battle,boss).skillName}・${boss.hp/boss.maxHp>stage.duelHpRatio?'先削弱主將':(stage.duelHero?HEROES[stage.duelHero].short+'近身單挑':'避開大招，趁破綻反擊')}`:boss.enraged?'狂攻・兩路重擊':battle.level===5?(boss.hp/boss.maxHp>.65?`先破盾：生命 ${Math.ceil(boss.hp/boss.maxHp*100)}% → 65% 以下，劉備才可單挑`:'盾勢已破！劉備同路近身 → 自動單挑'):'大將出陣';}
 if(boss&&!boss.support){$('bossHud').dataset.phase=battle.time<(boss.recoveryUntil||0)?'exposed':boss.castAt?'casting':boss.enraged?'enraged':'guard';$('bossHudState').textContent=(battle.time<(boss.recoveryUntil||0)?'破綻！2 秒內反擊傷害提高 · ':!boss.skillsCast?'護身架勢：先誘出大招 · ':boss.enraged?'狂攻階段 · ':'')+$('bossHudState').textContent;}
 if(boss&&['withdraw','decoy'].includes(battle.mission?.kind))$('bossHudState').textContent=(boss.castAt?`${bossProfile(battle,boss).skillName}蓄力！換路閃避 · `:battle.time<(boss.recoveryUntil||0)?'敵將收招，趁機拉開距離 · ':'避開追擊 · ')+`接應完成後全軍撤離，無須擊倒${stage.bossName}`;
 if(boss&&stage.duelPartner&&!battle.duelSeen)$('bossHudState').textContent+=(b => b?' · 關羽同路近身 → 二打一':' · 召集關羽、張飛 → 聯手單挑')(battle.allies.some(u=>u.key==='guanyu'&&u.hp>0)&&battle.allies.some(u=>u.key==='zhangfei'&&u.hp>0));
 if(boss&&battle.level===5&&boss.castAt)$('bossHudState').textContent+=boss.hp/boss.maxHp>.65?' · 先破盾至 65% 以下':' · 劉備可近身單挑';
 for(const lane of $('lanes').children){const index=Number(lane.dataset.lane),burning=battle.hazards.some(h=>h.lane===index&&h.until>battle.time);lane.classList.toggle('burning',burning);lane.classList.toggle('danger',burning||battle.mission?.weather?.lane===index||battle.enemies.some(e=>e.hp>0&&e.castAt&&(e.castLanes||[e.lane]).includes(index)));}
 if(musicOn())$('musicBtn').textContent=`♫ ${musicTheme().name}`;
 if(selectedUnitId!==null&&!selectedUnit()){selected=null;selectedUnitId=null}
 const controlled=selectedUnit();
 $('moveTarget').hidden=!controlled||!controlled.order; if(controlled){$('moveTarget').style.left=`${controlled.targetX*100}%`;$('moveTarget').style.top=`${(controlled.lane+.5)/lanesFor(battle)*100}%`}
 $('attackRange').hidden=!controlled;if(controlled){$('attackRange').style.left=`${controlled.x*100}%`;$('attackRange').style.width=`${HEROES[controlled.key].range*100}%`;$('attackRange').style.top=`${(controlled.lane+.5)/lanesFor(battle)*100}%`}
 $('orders').hidden=!controlled;$('orderStatus').textContent=controlled?`${HEROES[selected].short} · ${{forward:'前進中',back:'後退中',hold:'駐守'}[controlled.order]||'自動前進'} · 換路${Math.max(0,Math.ceil((controlled.moveReadyAt||0)-battle.time))}秒`:'選擇已出戰武將，可調整位置';
 for(const button of $('orders').querySelectorAll('button')){const order=button.dataset.order;if(order==='up'||order==='down'){const target=controlled?controlled.lane+(order==='up'?-1:1):-1;const full=target>=0&&target<lanesFor(battle)&&laneCount(battle,target)>=LANE_CAPACITY;button.textContent=(order==='up'?'↑ ':'↓ ')+(full?'該路已滿':order==='up'?'上移':'下移');button.title=full?'先調走該路一名友軍，再移入':''}button.disabled=!controlled||battle.paused||battle.over||!!battle.duel||!!battle.introPending||((order==='up'||order==='down')&&(battle.time<(controlled.moveReadyAt||0)||(order==='up'?controlled.lane===0:controlled.lane===lanesFor(battle)-1)));}
 if(battle.introPending&&!$('bossIntro').open){const stage=STAGES[battle.level-1];paintPortrait($('bossIntroArt'),enemyPortrait(stage.bossName,battle.level)||{asset:enemyArt(stage.bossName)});$('bossIntroArt').alt=stage.bossName;$('bossIntroTitle').textContent=`${stage.bossTitle||'敵軍大將'}・${stage.bossName}`; $('bossIntroText').textContent=stage.bossIntro||(battle.level===3?'鄧茂：「黃巾先鋒鄧茂在此！誰敢擋我大軍？」\n張飛：「燕人張翼德在此！待俺前來會你！」':`${stage.bossName}：「想過此地，先接我一招！」\n劉備：「眾將留意，照應三路！」`); $('bossIntroTip').textContent=stage.bossTip||`${BOSS_SKILLS[battle.level-1]}：蓄力後重擊同路近處友軍。點場上武將，再點戰場位置即可調動（換路冷卻 2 秒）。`;const steps=[];if(stage.duelHero){if(stage.mission==='barrier')steps.push('先依符號提示，破掉兩面真旗');if(stage.duelPartner)steps.push(`${HEROES[stage.duelHero].short}與${HEROES[stage.duelPartner].short}都要存活在場`);if(stage.duelHpRatio)steps.push(`將${stage.bossName}生命打到 ${Math.round(stage.duelHpRatio*100)}% 以下`);steps.push(`讓${HEROES[stage.duelHero].short}與${stage.bossName}同路近身 → ${stage.duelPartner?'聯手交鋒':'自動單挑'}`);}$('bossDuelSteps').replaceChildren(...steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li}));$('bossDuelSteps').hidden=!steps.length;$('bossIntro').showModal();}
 $('food').textContent=Math.floor(battle.food);$('lives').textContent='♥ '.repeat(Math.max(0,battle.lives)).trim()||'防線失守';$('lives').setAttribute('aria-label',`剩餘 ${Math.max(0,battle.lives)} 次防線`);
 $('waveText').textContent=battle.bossSpawned?(STAGES[battle.level-1].noBoss?'追兵已全數出現':'敵將已出陣'):`敵軍 ${battle.spawned} / ${STAGES[battle.level-1].enemyCount}`;
 const notice=battle.time<battle.noticeUntil?battle.notice:FEATURES[battle.level-1].text;
 const commandMessage=battle.duelHint&&battle.time<battle.duelHint.until?battle.duelHint.text:battle.time<battle.noticeUntil?battle.notice:'';
 $('commandFeedback').hidden=!/路已滿|調動整備中|軍糧不足|先破盾/.test(commandMessage);if(!$('commandFeedback').hidden)$('commandFeedback').textContent=commandMessage;
 if($('battleNotice').textContent!==notice)$('battleNotice').textContent=notice;
 $('selectionHint').textContent=selected==='archer'&&selectedUnitId===null?'已選弓兵增援 · 點一路部署新弓兵':selected?`已選${HEROES[selected].short} · ${HEROES[selected].weapon||({liubei:'雙劍近距離',guanyu:'大刀近戰',zhangfei:'長矛稍長',archer:'弓箭遠程'})[selected]} · 點地移動／再點本人駐守`:'點場上武將或弓兵調動 · 再點本人駐守';
 for(const card of $('cards').children){
  const key=card.dataset.hero,d=HEROES[key],remaining=Math.max(0,(battle.cooldowns[key]||0)-battle.time),active=key!=='archer'&&!d.troop&&battle.allies.some(u=>u.hp>0&&u.key===key),description=(battle.heroMode?d.description:heroDescription(key,battle.level))+' · '+(d.weapon||({liubei:'雙劍近距離',guanyu:'大刀近戰',zhangfei:'長矛稍長',archer:'弓箭遠程'})[key]);
  card.classList.toggle('selected',selected===key&&(key!=='archer'||selectedUnitId===null));card.classList.toggle('unavailable',active||battle.food<d.cost||remaining>0);card.classList.toggle('in-field',active);card.setAttribute('aria-pressed',String(selected===key&&(key!=='archer'||selectedUnitId===null)));
  card.disabled=(!active&&remaining>0)||battle.paused||!!battle.duel||battle.over;
  card.querySelector('.card-status').textContent=active?'出戰中 · 點選換路':remaining>0?`整備 ${Math.ceil(remaining)} 秒`:battle.food<d.cost?'等待軍糧':(key==='archer'||d.troop)?'可增援':'可出戰';
  card.querySelector('.ability-description').textContent=description;card.setAttribute('aria-label',`${d.name}，${d.cost} 軍糧，${description}，${card.querySelector('.card-status').textContent}`);
  card.querySelector('.cooldown i').style.width=`${active?100:Math.max(0,100-remaining/((key==='archer'||d.troop)?d.cooldown:12)*100)}%`;
 }
 for(const lane of $('lanes').children){const index=Number(lane.dataset.lane),unit=selectedUnit(),ready=unit?unit.lane!==index&&battle.time>=(unit.moveReadyAt||0)&&laneCount(battle,index)<LANE_CAPACITY:selected&&!canDeploy(battle,selected,index);const count=laneCount(battle,index),full=count>=LANE_CAPACITY;lane.querySelector('.lane-capacity').textContent=`${full?'已滿 ':''}${count}／${LANE_CAPACITY}`;lane.classList.toggle('full',full);lane.setAttribute('aria-label',`${laneLabel(battle,index)}路，${count}／${LANE_CAPACITY} 名友軍${full?'，已滿；可調動本路單位，不能再增援或換入':''}`);lane.classList.toggle('ready',!!ready);lane.disabled=battle.paused||!!battle.duel||!!battle.introPending||battle.over}
 for(const button of $('supplies').children){const id=button.dataset.supply;button.textContent=`${id==='herb'?'藥包':'糧袋'} ×${progress.inventory[id]}`;button.disabled=!progress.inventory[id]||battle.paused||battle.over||!!battle.duel||!!battle.introPending}
 $('supplies').hidden=!progress.inventory.herb&&!progress.inventory.grain;
 const living=battle.allies.filter(u=>u.hp>0),picker=$('unitPicker'),select=$('unitSelect');picker.hidden=!living.length;const labels=living.map(u=>{const same=living.filter(a=>a.key===u.key);return {id:String(u.id),label:HEROES[u.key].name+(same.length>1?' '+(same.indexOf(u)+1):'')+' · '+laneLabel(battle,u.lane)+'路'}}),signature=JSON.stringify(labels);if(select.dataset.options!==signature){select.dataset.options=signature;select.replaceChildren(new Option('選友軍，再點路線或調動指令',''),...labels.map(u=>new Option(u.label,u.id)))}select.value=String(selectedUnit()?.id||'');select.disabled=battle.paused||battle.over||!!battle.duel||!!battle.introPending;
 renderActiveSkills();renderUnits();renderEffects();syncPause();const skill=battle.skillNotice&&battle.time<battle.skillNotice.until?battle.skillNotice:null;$('skillBanner').hidden=!skill;if(skill){$('skillBanner').textContent=skill.text;$('skillBanner').dataset.hero=skill.key}
 if(battle.duel&&!duelShown){const d=battle.duel;setMusicMode('duel',battle.level);syncMusicButton();$('duelTitle').textContent=`${HEROES[d.heroKey].short}${d.partnerKey?' ＋ '+HEROES[d.partnerKey].short:''} 對 ${d.bossName}`;$('duelHero').src=HEROES[d.heroKey].asset;$('duelHero').alt=HEROES[d.heroKey].name;$('duelEnemy').src=enemyArt(d.bossName);$('duelDialog').showModal();duelShown=true}
 if(battle.duel)renderDuel(battle);
 if(!battle.duel&&duelShown){$('duelDialog').close();duelShown=false;setMusicMode('battle',battle.level);syncMusicButton()}
 if(battle.over&&!resultShown)showResult();else if(screen==='battle')skillIntro.check();
}
function showResult(){
 resultShown=true;selected=null;selectedUnitId=null;setMusicMode(battle.won?'victory':'prepare',battle.level);syncMusicButton();const stage=STAGES[battle.level-1];
 const balanceBefore=progress.coins;let earned=0,saved=true;const xp=awardExperience(progress,battle);if(battle.won)earned=rewardVictory(progress,battle.level);if(battle.won||xp.length)saved=saveProgress();let xpLine=$('resultExperience');if(!xpLine){xpLine=document.createElement('p');xpLine.id='resultExperience';$('resultText').after(xpLine)}xpLine.textContent=xp.map(x=>`${GENERALS[x.id].name} +${x.amount} 經驗${x.level>x.before?' · 升至 Lv.'+x.level:''}`).join('／');
 const resultKeys=battle.heroMode?SLOTS.slice(0,battle.team.length):['guanyu','liubei','zhangfei'];document.querySelector('.result-company').replaceChildren(...resultKeys.map(key=>{const img=document.createElement('img');paintPortrait(img,HEROES[key]);img.alt=HEROES[key].name;return img}));
 document.querySelector('.result-next-step').textContent=battle.level>=17?'戰報看完了？回營整備，再聽同伴說說這一戰。':'戰報看完了？回營歇一歇，再聽三兄弟的故事。';
 document.querySelector('.victory-ribbon').textContent=stage.successTitle?'保 全 隊 伍 ・ 回 營 整 備':'捷 報 傳 回 ・ 凱 旋 歸 營';
 $('resultMark').textContent=battle.won?(stage.successTitle?'全':'勝'):'再起';$('resultChapter').textContent=`第${['','一','二','三','四','五','六','七','八','九','十','十一'][chapterInfo(battle.level).chapter]}章 · ${chapterInfo(battle.level).number}`;
 $('resultTitle').textContent=battle.won?(stage.successTitle||((!STAGES[battle.level]||chapterInfo(battle.level+1).chapter!==chapterInfo(battle.level).chapter)?chapterInfo(battle.level).title:'此戰告捷')):'重整陣形，再來一次';
 $('resultText').textContent=battle.won?stage.victory:battle.lossReason==='commander-breach'?'敵方主將突破防線，本關未完成。調動部隊攔住主將，再挑戰一次。':(battle.level>=17?`先讓友軍照應${['','','','三','四','五'][lanesFor(battle)]}路，閱讀本關任務；撤軍關不必擊倒主將，接應完成後帶隊退回左側。`:'先讓弓兵照應三路，再用張飛頂住前線、關羽斬擊敵軍、劉備回復友軍。軍糧會持續補給，留意空著的路線。');
 $('result').dataset.outcome=battle.won?'victory':'defeat';$('result').dataset.reward=String(progress.coins>balanceBefore);if(battle.won)void hitSound('oath');
 $('resultEarned').textContent=`+${progress.coins-balanceBefore}`;$('resultBalance').textContent=progress.coins.toLocaleString('en-US');
 $('resultRewardReason').textContent=!battle.won?'這次未能守住防線，沒有獲得軍資；已有軍資不扣除。':!earned?'本關首次通關獎勵已領取，重玩不重複發放。':progress.coins-balanceBefore<earned?'首次通關！軍資已補至持有上限 99,999。':'首次通關獎勵・80 軍資';
 $('resultSaved').textContent=!saved?'進度、經驗與軍資僅暫存於本頁，尚未保存；關閉或重新整理後可能遺失。':battle.won&&earned?'軍資、經驗與進度已保存，可在營地使用':'保留目前軍資，可到營地整備';
 $('resultRetrySave').hidden=saved||storageReadFailed;
 $('resultNext').textContent='前往戰後營地 →';show('result');$('resultTitle').focus({preventScroll:true});skillIntro.upgrades(xp);
}
function openCamp(level,won){useRoster(level);setMusicMode('camp',level);syncMusicButton();show('camp');mountCamp({progress,level,won,heroes:HEROES,stage:STAGES[level-1],onSave:saveProgress,onContinue:()=>won?startStory(level,'ending'):beginBattle(level)});$('campTitle').tabIndex=-1;$('campTitle').focus({preventScroll:true})}
function frame(now){
 const dt=Math.min(.1,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
 if(screen==='battle'&&battle&&!battle.over){advanceBattleFrame(battle,dt,battleSpeed);renderBattle()}
 requestAnimationFrame(frame);
}
$('startBtn').onclick=()=>{if(battle&&!battle.over){setMusicMode('battle',battle.level);syncMusicButton();show('battle');setPause(false);renderBattle()}else startStory(progress.completed<STAGES.length?progress.completed+1:1)};
$('storyNext').onclick=()=>{if(lineIndex<storyLines().length-1){lineIndex++;renderStory()}else finishStory()};
$('prologueContinue').onclick=()=>setPrologue(false);
$('storyPrevious').onclick=()=>{if(lineIndex>0){lineIndex--;renderStory()}};
$('storySkip').onclick=finishStory;
$('resultNext').onclick=()=>openCamp(battle.level,battle.won);
$('storageRetry').onclick=()=>{if(saveProgress())$('resultSaved').textContent='軍資、經驗與進度已保存，可在營地使用'};
$('resultRetrySave').onclick=()=>{if(battle&&saveProgress()){$('resultSaved').textContent='軍資、經驗與進度已保存，可在營地使用';$('resultRetrySave').hidden=true;$('resultSaved').tabIndex=-1;$('resultSaved').focus({preventScroll:true})}};

for(const button of $('supplies').children)button.onclick=()=>{if(useSupply(battle,progress,button.dataset.supply,saveProgress)){hitSound('heal');renderBattle()}};
for(const button of document.querySelectorAll('[data-home]'))button.onclick=goHome;
$('battleSpeed').onchange=()=>{battleSpeed=normalizeBattleSpeed($('battleSpeed').value);$('battleSpeed').value=String(battleSpeed)};
$('pauseBtn').onclick=()=>setPause(!battle.paused);$('resumeBtn').onclick=()=>setPause(false);
$('duelDialog').addEventListener('cancel',event=>event.preventDefault());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&battle&&!battle.over)setPause(true)});
window.addEventListener('pagehide',()=>{if(battle&&!battle.over)setPause(true)});
$('musicBtn').onclick=async()=>{const on=!musicOn();syncMusicButton(await setMusic(on))};
const sfxButton=document.createElement('button');sfxButton.className='quiet-button';sfxButton.textContent='音效：開';sfxButton.setAttribute('aria-pressed','true');let effectsEnabled=true;sfxButton.onclick=async()=>{effectsEnabled=!effectsEnabled;setSfx(effectsEnabled);sfxButton.textContent=effectsEnabled?'音效：開':'音效：關';sfxButton.setAttribute('aria-pressed',String(effectsEnabled));if(effectsEnabled){const ok=await hitSound('block');$('audioNotice').textContent=ok?'音效已開啟':'聲音尚未啟動，請點「試聽音效」重試';}};$('musicBtn').before(sfxButton);
$('soundTest').onclick=async()=>{const ok=await hitSound('slash');$('audioNotice').textContent=!effectsEnabled?'請先開啟音效':ok?'已播放揮擊音效；若無聲，請檢查裝置音量／靜音設定':'瀏覽器未啟動音訊，請再點一次試聽';};
document.addEventListener('pointerdown',unlockAudio);document.addEventListener('keydown',unlockAudio);
for(const key of ['liubei','guanyu','zhangfei','yellow-turban-troops']){const preload=new Image();preload.src=`./assets/attacks/${key}.png`}
$('bossIntroContinue').onclick=()=>{battle.introPending=false;$('bossIntro').close();renderBattle()};
$('bossIntro').addEventListener('cancel',e=>e.preventDefault());
$('replayLevel').onclick=()=>startStory(battle.level);
$('duelEnter').onclick=()=>{if(skipDuelEntrance(battle))renderBattle()};
$('duelPause').onclick=()=>{setPause(!battle.paused);renderBattle()};
const campaignMap=mountCampaignMap({stages:STAGES,getBattle:()=>battle,setPaused:setPause});
installStoryReader();buildControls();const renderActiveSkills=mountActiveSkills({getBattle:()=>battle,cast:(b,key,index)=>{const ok=castActive(b,key,index);if(ok){const rect=$('field').getBoundingClientRect();if(rect.bottom<80||rect.top>innerHeight*.65)$('field').scrollIntoView({block:'center',behavior:'instant'})}return ok},refresh:renderBattle,getSelected:selectedUnit});mountBattleKeys({getBattle:()=>battle,getSelected:selectedUnit,isBattle:()=>screen==='battle',refresh:renderBattle,onOrder:(b,id,order)=>{if(commandHero(b,id,order))firstGuide?.event(order==='hold'?'hold':order==='forward'?'move':'')}});updateHome();requestAnimationFrame(frame);

mountSkillGuide({getBattle:()=>battle,getProgress:()=>progress,setPaused:setPause});
const skillIntro=mountSkillIntro({getBattle:()=>battle,getProgress:()=>progress,save:()=>{const saved=saveProgress();if(saved&&battle?.over)$('resultSaved').textContent='軍資、經驗與進度已保存，可在營地使用';return saved},setPaused:setPause});
