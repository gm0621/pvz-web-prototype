/* First-season story: UI state is deliberately separate from campaign/rewards. */
const STORY_READ_KEY='sgzStoryRead_v1';
const PENDING_VICTORY_STORY_KEY='sgzPendingVictoryStory_v1';
let activeCampaignStory=null;
const storyElement=id=>document.getElementById(id);
function campaignStoryData(season){return season===2?SEASON2_STORY:SEASON1_STORY}
function storyReadKey(faction,level,scene,season=1){return `${season===1?'':'s'+season+':'}${faction}:${level}:${scene}`}
function hasReadStory(faction,level,scene,season=1){const key=storyReadKey(faction,level,scene,season);if(typeof onboardingFlag==='function')return onboardingFlag('storyRead',key);try{const read=JSON.parse(localStorage.getItem(STORY_READ_KEY)||'{}');return read?.[key]===true}catch{return false}}
function markStoryRead(faction,level,scene,season=1){const key=storyReadKey(faction,level,scene,season);if(typeof markOnboardingComplete==='function')return markOnboardingComplete('storyRead',key);try{const stored=JSON.parse(localStorage.getItem(STORY_READ_KEY)||'{}');const read=stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:{};read[key]=true;localStorage.setItem(STORY_READ_KEY,JSON.stringify(read));return true}catch{return false}}
function pendingVictoryStory(){try{const pending=JSON.parse(localStorage.getItem(PENDING_VICTORY_STORY_KEY)||'null');return pending&&['plants','zombies'].includes(pending.faction)&&[1,2].includes(pending.season)&&Number.isInteger(pending.level)?pending:null}catch{return null}}
function rememberPendingVictoryStory(battle){try{localStorage.setItem(PENDING_VICTORY_STORY_KEY,JSON.stringify({season:battle.season,faction:battle.faction,level:battle.level}))}catch{}}
function clearPendingVictoryStory(){try{localStorage.removeItem(PENDING_VICTORY_STORY_KEY)}catch{}}
function resumePendingVictoryStory(){const pending=pendingVictoryStory();if(!pending)return false;if(hasReadStory(pending.faction,pending.level,'victory',pending.season)){clearPendingVictoryStory();return false}const button=storyElement('modalStory');if(storyElement('game')?.classList.contains('active')&&storyElement('modal')?.classList.contains('show')&&!button?.classList.contains('hidden')&&button?.onclick)return button.onclick();return openCampaignStory(pending.faction,pending.level,'victory',{required:true,season:pending.season,onComplete:clearPendingVictoryStory})}
function closeCampaignStory(complete=false){
 const story=activeCampaignStory;if(!story)return;
 activeCampaignStory=null;storyElement('storyDialog').close();
 if(complete){if(!story.replay){markStoryRead(story.faction,story.level,story.scene,story.season);if(story.scene==='victory')clearPendingVictoryStory()}story.onComplete?.()}
 if(story.focus?.isConnected&&story.focus.getClientRects().length)story.focus.focus({preventScroll:true});
}
function renderCampaignStory(){
 const story=activeCampaignStory;if(!story)return;
 const line=story.lines[story.index],last=story.index===story.lines.length-1;
 storyElement('storySpeaker').textContent=line.speaker;storyElement('storyText').textContent=line.text;
 storyElement('storyCount').textContent=`${story.index+1} / ${story.lines.length}`;
 storyElement('storyNext').textContent=last?(story.replay?'關閉回看':story.scene==='opening'?'開始戰鬥':'查看戰果'):'下一句 →';
 storyElement('storyPrev').disabled=story.index===0;
 const unit=[...Object.values(PLANT_TYPES),...Object.values(ZOMBIE_TYPES)].find(x=>x.name===line.speaker);
 const portrait=storyElement('storyPortrait');portrait.hidden=!unit?.asset;
 if(unit?.asset){portrait.src=unit.asset;portrait.alt=line.speaker}else{portrait.removeAttribute('src');portrait.alt=''}
}
function openCampaignStory(faction,level,scene,{replay=false,required=false,onComplete=null,season=currentSeason,compact=false}={}){
 const data=campaignStoryData(season)[faction]?.[level];if(!data?.[scene]?.length)return false;
 closeCampaignStory(false);
 const lines=compact&&scene==='opening'?(data.openingBrief||data[scene].slice(0,3)).slice():data[scene].slice();

 activeCampaignStory={faction,level,season,scene,replay,required,onComplete,lines,index:0,focus:document.activeElement};
 storyElement('storyTitle').textContent=campaignLevels(season)[level].name;
 storyElement('storyRoute').textContent=`${season===2?'魏國篇．北境鐵壁':'蜀國篇．屍潮來襲'}｜${faction==='plants'?'守城戰記':'攻城戰記・另一種可能'}${replay?'｜回看':''}`;
 storyElement('storySubtitle').textContent=data.subtitle;
 storyElement('storyReplayTabs').hidden=!replay;
 storyElement('storyReplayVictory').hidden=!isCampaignLevelCompleted(faction,level,season);
 storyElement('storyReplayOpening').setAttribute('aria-pressed',String(scene==='opening'));
 storyElement('storyReplayVictory').setAttribute('aria-pressed',String(scene==='victory'));
 storyElement('storyClose').hidden=required;
 storyElement('storyClose').setAttribute('aria-label',!replay&&scene==='opening'?'關閉劇情，不開始戰鬥':'關閉劇情');
 const stage=storyElement('storyStage'),lv=campaignLevels(season)[level];stage.className=`story-stage ${(LEVEL_THEME[lv.theme]||LEVEL_THEME.day).art}`;
 stage.style.cssText=lv.cardArt?`background-image:linear-gradient(180deg,#06142022,#06142088),url('${lv.cardArt}') !important`:'';
 storyElement('storySkip').textContent=replay?'關閉回看':scene==='opening'?'跳過，開始戰鬥':'跳過，查看戰果';
 renderCampaignStory();storyElement('storyDialog').showModal();storyElement('storyNext').focus();return true;
}
function requestCampaignBattle(faction,level=selectedLevel,options={}){
 const season=currentSeason,battleOptions={challengeIds:[...new Set(Array.isArray(options?.challengeIds)?options.challengeIds:[])],difficulty:normalizeBattleDifficulty(options?.difficulty,'medium')},requestFullscreen=options?.fullscreen===true;
 if(!isCampaignLevelUnlocked(faction,level,season))return false;
 if(activeCampaignStory)return false;
 const guidedOpening=!!campaignStoryData(season)[faction]?.[level]&&!hasReadStory(faction,level,'opening',season);
 const begin=()=>{if(currentSeason!==season||!isCampaignLevelUnlocked(faction,level,season))return false;if(requestFullscreen)enterBattleFullscreenByDefault();selectedLevel=level;currentFaction=faction;start(faction,{...battleOptions,guidedOpening});return true};
 if(guidedOpening){
  if(storyElement('game').classList.contains('active')){currentFaction=faction;backToLevelSelect()}
  pauseAndSaveBattle('story');clearInterval(timer);
  return openCampaignStory(faction,level,'opening',{onComplete:begin,season,compact:true});
 }
 return begin();
}
function appendStoryReplayButton(card,faction,level){
 if(!campaignStoryData(currentSeason)[faction]?.[level]||!isCampaignLevelUnlocked(faction,level,currentSeason))return;
 const button=document.createElement('button');button.className='story-replay-button';button.dataset.storyLevel=level;button.textContent='📖 劇情回看';button.onclick=()=>replayCampaignStory(faction,level);card.appendChild(button);
}
function replayCampaignStory(faction,level,scene='opening'){
 if(!isCampaignLevelUnlocked(faction,level,currentSeason)||!['opening','victory'].includes(scene)||scene==='victory'&&!isCampaignLevelCompleted(faction,level,currentSeason))return false;
 return openCampaignStory(faction,level,scene,{replay:true});
}
function setBattleStoryPending(pending){storyElement('modal')?.querySelector('.modal-card')?.classList.toggle('story-pending',pending)}
function resetBattleStoryResult(){const button=storyElement('modalStory');button.classList.add('hidden');button.onclick=null;setBattleStoryPending(false)}
function finishBattleStoryResult(battle,win,verified){resetBattleStoryResult();if(typeof revealFinaleRouteChoice==='function')revealFinaleRouteChoice(battle,win,verified)}
function presentBattleStoryResult(battle,win,verified){
 if(battle!==state)return false;
 resetBattleStoryResult();
 if(!campaignStoryData(battle?.season)[battle?.faction]?.[battle?.level]||!storyElement('game').classList.contains('active')||win&&!verified)return false;
 const scene=win?'victory':'defeat';if(hasReadStory(battle.faction,battle.level,scene,battle.season))return false;
 if(win&&verified)rememberPendingVictoryStory(battle);
 const button=storyElement('modalStory');button.textContent=win?'關閉獎勵':'關閉戰果';button.classList.remove('hidden');setBattleStoryPending(true);
 button.onclick=()=>{
  if(battle!==state||!battle.over||!storyElement('game').classList.contains('active')||!storyElement('modal').classList.contains('show')||activeCampaignStory)return false;
  return openCampaignStory(battle.faction,battle.level,scene,{required:true,onComplete:()=>finishBattleStoryResult(battle,win,verified),season:battle.season});
 };
 return true;
}
storyElement('storyReplayOpening').onclick=()=>{const story=activeCampaignStory;if(story?.replay)replayCampaignStory(story.faction,story.level,'opening')};
storyElement('storyReplayVictory').onclick=()=>{const story=activeCampaignStory;if(story?.replay)replayCampaignStory(story.faction,story.level,'victory')};
storyElement('storyNext').onclick=()=>{if(!activeCampaignStory)return;if(activeCampaignStory.index+1>=activeCampaignStory.lines.length)closeCampaignStory(true);else{activeCampaignStory.index++;renderCampaignStory()}};
storyElement('storyPrev').onclick=()=>{if(activeCampaignStory?.index>0){activeCampaignStory.index--;renderCampaignStory()}};
storyElement('storySkip').onclick=()=>closeCampaignStory(true);
storyElement('storyClose').onclick=()=>closeCampaignStory(false);
storyElement('storyDialog').addEventListener('cancel',event=>{event.preventDefault();if(!activeCampaignStory?.required)closeCampaignStory(false)});
storyElement('storyPortrait').onerror=()=>{storyElement('storyPortrait').hidden=true};
window.addEventListener('popstate',event=>{if(activeCampaignStory?.required){event.stopImmediatePropagation();if(typeof syncAppHistory==='function')syncAppHistory('battle');return}if(pendingVictoryStory()){event.stopImmediatePropagation();if(typeof syncAppHistory==='function')syncAppHistory('battle');resumePendingVictoryStory();return}closeCampaignStory(false)});
