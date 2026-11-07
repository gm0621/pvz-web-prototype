// Chapter progression is device-local and scoped to the current battle owner.
// It never calls the first/second-season reward or progression RPCs.
const romanceProgressCache=new Map();
function setHomeMode(view='hub'){
 const hub=view!=='zombies',home=$('start');if(!home)return;
 home.dataset.homeView=hub?'hub':'zombies';
 home.querySelector('.main-actions')?.setAttribute('aria-label',hub?'選擇遊戲模式':'大戰殭屍戰役');
 $('homeModeBackBtn')?.classList.toggle('hidden',hub);
 requestAnimationFrame(()=>$(hub?'zombieCampaignBtn':refreshNewPlayerEntry()?'newPlayerStartBtn':'plantStartBtn')?.focus({preventScroll:true}));
}
function romanceStorageKey(kind='progress'){
 const owner=currentBattlePrincipal();return owner?`sgzRomance_${kind}_v1:${encodeURIComponent(owner)}`:null;
}
function romanceProgress(){
 const key=romanceStorageKey();if(!key)return {highestLevel:0,completedLevels:{}};
 let raw=romanceProgressCache.get(key)||{};
 try{raw=JSON.parse(localStorage.getItem(key)||JSON.stringify(raw))}catch{}
 const completedLevels={};let highestLevel=0;
 for(let n=1;n<=6;n++){if(!raw?.completedLevels?.[n])break;completedLevels[n]=1;highestLevel=n}
 return {highestLevel,completedLevels};
}
function completeRomanceLevel(level){
 if(!Number.isInteger(level)||level<1||level>6||level>romanceProgress().highestLevel+1)return false;
 const key=romanceStorageKey();if(!key)return false;
 const progress=romanceProgress();progress.completedLevels[level]=1;progress.highestLevel=Math.max(progress.highestLevel,level);
 romanceProgressCache.set(key,progress);
 try{localStorage.setItem(key,JSON.stringify(progress))}catch{}
 return true;
}
function romanceStoryRead(level,scene,write=false){
 const key=romanceStorageKey('story');if(!key)return false;
 try{const flags=JSON.parse(localStorage.getItem(key)||'{}'),id=`${level}:${scene}`;if(write){flags[id]=true;localStorage.setItem(key,JSON.stringify(flags));return true}return flags[id]===true}catch{return false}
}
function enterRomanceMode(){
 if(!authIdentityResolved)return false;
 backToHome(false);chooseFaction('plants',ROMANCE_SEASON);
 $('backFactionBtn').setAttribute('aria-label','回主選單');
 return true;
}
function buildRomanceLevelCards(){
 const wrap=$('levelGrid');wrap.replaceChildren();
 ROMANCE_STAGE_SPECS.forEach((spec,index)=>{
  const level=index+1,done=isCampaignLevelCompleted('plants',level,3),open=isCampaignLevelUnlocked('plants',level,3),card=document.createElement('article');
  card.className=`level-card campaign-card romance-level ${done?'completed':open?'current':'locked'}`;
  card.innerHTML=`<div class="level-ribbon"><span>第一章・1-${level}｜${ROMANCE_LEVELS[level].battleLabel}</span><strong>${spec.name}</strong></div><div class="romance-card-scene" aria-hidden="true"><span>${['🌸','🌾','⚔️','🐉','🏯','🚩'][index]}</span><small>${spec.place}</small></div><div class="level-quick-status">${done?'✓ 已通關':open?'目前可玩':`完成 1-${level-1} 後解鎖`}</div><button class="level-start" data-jump-level="${level}" ${open?'':'disabled'}>${done?'重玩本關':'開始本關'}</button><button type="button" class="level-detail-toggle secondary" aria-expanded="false">查看劇情與設定</button><div class="level-card-details" hidden><p>${spec.focus}</p><p class="romance-adaptation">${spec.adapted?'遊戲補充情節：本關的戰鬥遭遇為改編。':'劇情依《三國演義》事件改編，戰場採五路部署與推進。'}</p><div class="level-cast"><b>出場人物</b><p>劉備、關羽、張飛、軍糧官、盾將、弓兵、伏兵、義軍刀兵</p><p>對手：${ROMANCE_LEVELS[level].zombieWeights.map(key=>ZOMBIE_TYPES[key].name).join('、')}；關底：${ZOMBIE_TYPES[ROMANCE_LEVELS[level].bossType].name}</p></div>${stageRuleCardHtml(ROMANCE_LEVELS[level],'plants',3,level)}</div>`;
  const details=card.querySelector('.level-card-details');details.append(appendDifficultySelector(card,3,'plants',level,open));appendStoryReplayButton(details,'plants',level);
  card.querySelector('.level-start').onclick=()=>startLevel('plants',level,[],selectedBattleDifficulty(card));bindLevelCardDisclosure(card);wrap.append(card);
 });
 renderCampaignProgressOverview();
}
function renderRomanceProgressOverview(){
 const progress=romanceProgress(),next=Math.min(6,progress.highestLevel+1),resume=campaignResumeSnapshot();
 $('levelScreen').classList.remove('newcomer-simple');$('levelGrid').hidden=false;
 $('campaignHeading').textContent='第一章・桃園結義';$('chosenFactionText').textContent='英雄演義｜六場戰鬥，從桃園起誓到青州解圍';
 $('campaignProgressPanel').classList.remove('hidden');$('campaignProgressPanel').querySelector('.campaign-progress-meter').hidden=false;
 $('campaignProgressText').textContent=`演義第一章｜已完成 ${progress.highestLevel} / 6`;
 $('campaignProgressFill').style.width=`${progress.highestLevel/6*100}%`;
 $('campaignProgressKicker').textContent=resume?'未完成戰局':progress.highestLevel===6?'桃園同心・第一章完成':'下一段故事';
 $('campaignProgressTitle').textContent=resume?`${campaignRouteLabel(resume.season,resume.faction)}・${resume.config.shortName}`:progress.highestLevel===6?'青州之圍已解':`1-${next}・${ROMANCE_LEVELS[next].shortName}`;
 $('campaignProgressHint').textContent=resume?'繼續會回到已暫停的戰局。':progress.highestLevel===6?'下一章「黃巾烽火」尚未開放；可回看故事或重玩本章。':'沿用軍糧、部署、冷卻與波次玩法。演義進度儲存在此瀏覽器；本章不發放金幣與角色經驗。';
 const browse=$('browseLevelsBtn');browse.hidden=false;browse.textContent=progress.highestLevel===6?'回看章末劇情':'回看桃園結義';browse.setAttribute('aria-expanded','false');
 browse.onclick=()=>openCampaignStory('plants',progress.highestLevel===6?6:1,progress.highestLevel===6?'epilogue':'prologue',{replay:true,season:3});
 $('campaignProgressTrack').hidden=false;$('campaignProgressTrack').replaceChildren(...ROMANCE_STAGE_SPECS.map((_,i)=>{const node=document.createElement('span');node.className='campaign-track-node';node.dataset.state=i<progress.highestLevel?'completed':i+1===next?'current':'next';node.textContent=`${i<progress.highestLevel?'✓':'•'} 1-${i+1}`;if(i+1===next)node.setAttribute('aria-current','step');return node}));
 syncCampaignPrimaryAction('桃園結義',resume?'▶ 繼續未完成戰局':progress.highestLevel===6?'重玩章末決戰':'繼續故事 ▶',()=>resume?restoreBattleIfAvailable():document.querySelector(`#levelGrid [data-jump-level="${next}"]`)?.click());
 $('levelSelectTip').classList.add('hidden');
}
function romanceReward(win){
 if(win)completeRomanceLevel(state.level);
 state.lastReward=null;
 return win?(state.level===6?'獲得章節紀念「桃園同心」，本章已完成。':'本關故事完成，下一關已解鎖。'):'重整陣形後可再次挑戰。';
}
function romanceResultCopy(win,level){
 return win?{title:level===6?'桃園同心・第一章完成！':`${ROMANCE_LEVELS[level].shortName}通關！`,text:level===6?'青州之圍已解。繼續劇情，看看三兄弟下一步的去向。':'敵軍已退，下一段演義故事已開啟。'}:{title:'義軍暫退',text:'本關尚未通過。先補軍糧，再以盾將、弓兵與三兄弟互相支援。'};
}
ROMANCE_STORY.plants[1].prologue=ROMANCE_CHAPTER_OPENING;
ROMANCE_STORY.plants[1].opening=[...ROMANCE_CHAPTER_OPENING,...ROMANCE_STORY.plants[1].opening];
ROMANCE_STORY.plants[6].epilogue=ROMANCE_CHAPTER_ENDING;
ROMANCE_STORY.plants[6].victory=[...ROMANCE_STORY.plants[6].victory,...ROMANCE_CHAPTER_ENDING];

function initializeRomanceBattle(){
 if(state?.season!==3)return;
 state.romanceDuels={};
 if(state.levelConfig.romanceBattle==='clash'){
  state.lawnmowers=state.lawnmowers.map(m=>({...m,used:true}));
  // The finale's three-way attack is an actual opening formation.
  if(state.level===6)for(const row of [0,2,4])addPlant('rMilitia',1,row);
 }
}
function advanceRomanceArmy(){
 if(state?.season!==3||state.over||state.paused)return;
 if([3,4].includes(state.level)&&!state.romanceCommanderSpawned&&state.time>=25000){
  if(!state.zombies.some(z=>z.boss&&z.hp>0))spawnLevelBoss();
  state.romanceCommanderSpawned=true;
 }
 const clash=state.levelConfig.romanceBattle==='clash';
 for(const unit of [...state.plants,...state.zombies])if(unit.hp>0&&(unit.duelMoraleUntil||0)>state.time)unit.last-=15;
 for(const p of state.plants){
  if(p.hp<=0||(p.stunUntil||0)>state.time)continue;
  const d=activeUnit('plants',p.type),mobile=ROMANCE_ROSTER.includes(p.type)&&['firepea','zhangfei','liubei'].includes(p.type);
  if(clash&&mobile&&!state.zombies.some(z=>z.hp>0&&z.r===p.r&&z.c>=p.c&&z.c-p.c<=Math.min(3,d.range||1.15)))p.c=Math.min(8.2,p.c+.012);
  if(clash&&(mobile||d.marchingInfantry||['swordSoldier','whiteFeatherGuard'].includes(p.type))&&p.c>=8.1&&state.time-(p.lastCampHit||0)>=Math.max(900,d.rate||1800)){
   p.lastCampHit=state.time;recordStageRuleEvent({type:'camp-hit',damage:Math.max(18,d.damage||0)});flash(p,'破營');
  }
 }
 if(clash){
  const runtime=state.gameplay.stageRule.data;
  $('modeHint').textContent=`己營 ${runtime.ownCamp}/1000｜敵營 ${runtime.enemyCamp}/800｜刀兵與武將向前推進，軍糧官留守。`;
 }
 const pair=state.level===3?['zhangfei','rDengMao']:state.level===4?['firepea','rChengYuanzhi']:null;
 if(!pair)return;
 const [heroType,bossType]=pair,boss=state.zombies.find(z=>z.hp>0&&z.boss&&z.type===bossType),hero=boss&&state.plants.find(p=>p.hp>0&&p.type===heroType&&p.r===boss.r&&Math.abs(p.c-boss.c)<=1.6);
 if(!hero||state.romanceDuels?.[bossType])return;
 state.romanceDuels={...(state.romanceDuels||{}),[bossType]:true};
 state.romanceDuel={heroId:hero.id,bossId:boss.id,round:0,score:0,phase:'offer',message:'強攻克佯攻、佯攻克格擋、格擋克強攻。三回合勝負會影響戰場上的兩將。'};
 state.paused=true;applyPausedBattleUI();persistBattleState();renderRomanceDuel();
}
function romanceDuelDialog(){
 let dialog=$('romanceDuelDialog');if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='romanceDuelDialog';dialog.className='romance-duel-dialog';dialog.setAttribute('aria-labelledby','romanceDuelTitle');
 dialog.innerHTML='<div class="romance-duel-card"><small>武將交鋒</small><h2 id="romanceDuelTitle"></h2><div id="romanceDuelPortraits"></div><p id="romanceDuelStatus" role="status" aria-live="polite"></p><p id="romanceDuelHint"></p><div id="romanceDuelActions"></div></div>';
 dialog.addEventListener('cancel',event=>{event.preventDefault();finishRomanceDuel(state?.romanceDuel?.phase==='result')});document.body.append(dialog);return dialog;
}
function renderRomanceDuel(){
 const duel=state?.romanceDuel;if(!duel)return;
 const hero=state.plants.find(p=>p.id===duel.heroId),boss=state.zombies.find(z=>z.id===duel.bossId);
 if(!hero||!boss)return finishRomanceDuel(false);
 const dialog=romanceDuelDialog(),heroName=hero.type==='zhangfei'?'張飛':'關羽';
 $('romanceDuelTitle').textContent=`${heroName} 對 ${ZOMBIE_TYPES[boss.type].name}`;
 $('romanceDuelPortraits').innerHTML=`<img src="${PLANT_TYPES[hero.type].asset}" alt="${heroName}"><b>對決</b><img class="romance-enemy-portrait" src="${ZOMBIE_TYPES[boss.type].asset}" alt="${ZOMBIE_TYPES[boss.type].name}">`;
 $('romanceDuelStatus').textContent=duel.phase==='offer'?'敵將叫陣，全軍暫停。':duel.phase==='result'?duel.score>0?'單挑獲勝！':duel.score<0?'單挑失利':'雙方平手':`第 ${duel.round+1} / 3 回合｜目前得分 ${duel.score}`;
 $('romanceDuelHint').textContent=duel.message;
 const actions=$('romanceDuelActions');actions.replaceChildren();
 const button=(label,handler)=>{const b=document.createElement('button');b.type='button';b.className='primary';b.textContent=label;b.onclick=handler;actions.append(b)};
 if(duel.phase==='offer'){button('接受單挑',()=>{duel.phase='fight';renderRomanceDuel();persistBattleState()});button('繼續混戰',()=>finishRomanceDuel(false))}
 else if(duel.phase==='result')button('返回戰場',()=>finishRomanceDuel(true));
 else for(const [move,label] of Object.entries({attack:'強攻',guard:'格擋',feint:'佯攻'}))button(label,()=>playRomanceDuelRound(move));
 if(!dialog.open)dialog.showModal();actions.querySelector('button')?.focus();
}
function playRomanceDuelRound(move){
 const duel=state?.romanceDuel;if(!duel||duel.phase!=='fight'||!['attack','guard','feint'].includes(move))return;
 const enemy=pick(['attack','guard','feint']),wins={attack:'feint',feint:'guard',guard:'attack'},names={attack:'強攻',guard:'格擋',feint:'佯攻'},score=move===enemy?0:wins[move]===enemy?1:-1;
 duel.score+=score;duel.round++;
 duel.message=`你選擇${names[move]}，敵將使出${names[enemy]}：${score>0?'你佔上風':score<0?'敵將佔上風':'不分勝負'}。`;
 if(duel.round>=3){duel.phase='result';duel.message+=duel.score>0?'敵將損失 35% 最大生命，己將振奮 5 秒。':duel.score<0?'己將損失 25% 最大生命，敵將振奮 5 秒。':'雙方各損失 10% 最大生命。';duel.message+=' 單挑不會直接擊倒武將。'}
 persistBattleState();renderRomanceDuel();
}
function finishRomanceDuel(apply){
 const duel=state?.romanceDuel;if(!duel)return;
 // Closing an unfinished duel chooses mixed combat; never grants a victory.
 if(apply&&duel.phase==='result'){
  const hero=state.plants.find(p=>p.id===duel.heroId),boss=state.zombies.find(z=>z.id===duel.bossId);
  if(hero&&boss){
   if(duel.score>0){boss.hp=Math.max(1,boss.hp-boss.maxHp*.35);hero.duelMoraleUntil=state.time+5000;flash(hero,'單挑得勝')}
   else if(duel.score<0){hero.hp=Math.max(1,hero.hp-hero.maxHp*.25);boss.duelMoraleUntil=state.time+5000;flash(boss,'單挑得勝')}
   else{hero.hp=Math.max(1,hero.hp-hero.maxHp*.1);boss.hp=Math.max(1,boss.hp-boss.maxHp*.1)}
  }
 }
 delete state.romanceDuel;$('romanceDuelDialog')?.close();
 state.paused=false;applyPausedBattleUI();persistBattleState();$('pauseBtn')?.focus();
}
function restoreRomanceDuel(){if(state?.season===3&&state.romanceDuel){state.paused=true;applyPausedBattleUI();renderRomanceDuel()}}
function updateRomanceHUD(){
 const hud=$('romanceCampHud');if(!hud)return;
 hud.hidden=state?.season!==3||state.levelConfig.romanceBattle!=='clash';
 if(hud.hidden)return;
 const runtime=state.gameplay.stageRule.data;
 $('romanceOwnCamp').textContent=`${runtime.ownCamp} / 1000`;
 $('romanceEnemyCamp').textContent=`${runtime.enemyCamp} / 800`;
}
