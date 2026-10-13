const BATTLE_LESSON_KEY='sgzBattleLessons_v1';
let activeBattleLesson=null;

function battleLessonProgress(){
 try{const value=JSON.parse(localStorage.getItem(BATTLE_LESSON_KEY)||'{}'),local=value&&typeof value==='object'&&!Array.isArray(value)?value:{};return {...local,...(playerProfile?.onboarding?.battleLessons||{})}}
 catch{return {}}
}
function hasLearnedBattleLesson(id){return typeof onboardingFlag==='function'?onboardingFlag('battleLessons',id):battleLessonProgress()[id]===true}
function hasPendingBattleLesson(id){return battleLessonProgress()[`${id}:pending`]===true}
function markBattleLessonPending(id){
 try{const progress=battleLessonProgress();progress[`${id}:pending`]=true;localStorage.setItem(BATTLE_LESSON_KEY,JSON.stringify(progress))}catch{/* A storage failure must not block play. */}
}
function markBattleLessonLearned(id){
 try{const progress=battleLessonProgress();progress[id]=true;delete progress[`${id}:pending`];localStorage.setItem(BATTLE_LESSON_KEY,JSON.stringify(progress))}catch{/* A storage failure must not block play. */}
 if(typeof markOnboardingComplete==='function')markOnboardingComplete('battleLessons',id);
}
function battleLessonConfig(faction,season,level,guided){
 if(season!==1||faction!=='plants')return null;
 const lessonId=level===1?'firstDefense':level===3?'removeUnit':level===4?'relocateUnit':level===5?'strategy':null;
 if(!lessonId||hasLearnedBattleLesson(lessonId)||!guided&&!hasPendingBattleLesson(lessonId))return null;
 if(guided)markBattleLessonPending(lessonId);
 if(lessonId==='firstDefense')return {id:lessonId,step:'scout'};
 if(lessonId==='removeUnit')return {id:lessonId,step:'remove'};
 if(lessonId==='relocateUnit')return {id:lessonId,step:'await-deploy'};
 if(lessonId==='strategy')return {id:lessonId,step:'await-point'};
 return null;
}
function createBattleTutorialState(faction,season,level,guided=false){return battleLessonConfig(faction,season,level,guided)}
function normalizeBattleTutorial(raw){
 if(!raw||typeof raw!=='object'||!['firstDefense','removeUnit','relocateUnit','strategy'].includes(raw.id))return null;
 return {...raw};
}
function battleFeatureAvailable(feature,battle=state){
 if(!battle)return false;
 if(battle.season!==1)return true;
 if(feature==='remove')return battle.faction==='plants'&&battle.level>=3;
 if(feature==='relocate')return battle.faction==='plants'&&battle.level>=4;
 if(feature==='strategy')return battle.level>=5;
 return false;
}
function battleTutorialUnitAllowed(key,battle=state){
 const tutorial=battle?.tutorial;
 if(tutorial?.id!=='firstDefense'||hasLearnedBattleLesson('firstDefense'))return true;
 const stages={scout:[],food:['sunflower'],shield:['sunflower','wallnut'],archer:['sunflower','wallnut','peashooter'],ambush:['sunflower','wallnut','peashooter','potato']};
 return (stages[tutorial.step]||Object.keys(PLANT_TYPES)).includes(key);
}
function battleTutorialInteractionAllowed(kind,key=null,battle=state){
 const tutorial=battle?.tutorial;if(!tutorial?.interactionPaused||!battle.paused||activeBattleLesson)return false;
 if(kind==='deploy'&&tutorial.id==='firstDefense')return key===({food:'sunflower',shield:'wallnut',archer:'peashooter',ambush:'potato'}[tutorial.step]);
 if(kind==='remove')return tutorial.id==='removeUnit'&&tutorial.step==='remove';
 if(kind==='relocate')return tutorial.id==='relocateUnit'&&tutorial.step==='relocate';
 if(kind==='strategy')return tutorial.id==='strategy'&&tutorial.step==='strategy';
 return false;
}
function battleLessonCopy(id,step){
 const copy={
  firstDefense:{
   scout:{title:'敵軍現身｜第 3 路',speaker:'蜀軍斥候',text:'先看清楚再布防：第一名赤巾小屍已在第 3 路現身。戰鬥暫停期間，敵人不會前進。',action:'看清路線後開始教學'},
   food:{title:'第一步｜備妥軍糧',speaker:'軍糧官',text:'每次部署都會消耗軍糧；軍糧官需要 50 軍糧，部署後會定時補給。請放在第 3 路第 1 欄，不阻擋後方射線。',action:'部署軍糧官'},
   shield:{title:'第二步｜擋住第 3 路',speaker:'盾將',text:'敵人已確認從第 3 路逼近。請把盾將放在第 3 路第 5 欄，替後方弓兵爭取攻擊時間。',action:'部署盾將'},
   archer:{title:'第三步｜從後方攻擊',speaker:'蜀軍弓兵',text:'請把弓兵放在第 3 路第 3 欄；我會隔著盾將持續攻擊同一路的敵人。',action:'部署蜀軍弓兵'},
   ambush:{title:'第四步｜伏兵先埋、接近才爆發',speaker:'伏兵',text:'伏兵需要 25 軍糧，埋下後要準備 4.5 秒，敵人靠近才會引爆。請放在第 3 路第 6 欄；完成後仍保留 75 軍糧供你補防。',action:'部署伏兵'}
  },
  removeUnit:{remove:{title:'新功能｜撤回傷兵',speaker:'盾將',text:'這名盾將已經重傷，繼續留在前排很快會被擊倒。使用「移除武將」，再點擊被標記的傷兵，騰出位置重新部署。',action:'開始撤離'}},
  relocateUnit:{relocate:{title:'新功能｜換列支援',speaker:'蜀軍弓兵',text:'先練習把守軍調往相鄰路線。使用「換列」，選擇剛部署的守軍，再移到同欄相鄰空格；真正遇到轉線敵軍時就能立即補防。',action:'開始調動'}},
  strategy:{strategy:{title:'新功能｜使用軍令',speaker:'軍師',text:'你已取得第一個策略點。使用策略點選擇一項軍令，完成後戰鬥才會繼續。',action:'選擇軍令'}}
 };
 return copy[id]?.[step]||null;
}
function openBattleLesson(id,step){
 if(!state||state.over||activeBattleLesson)return false;
 const copy=battleLessonCopy(id,step),dialog=document.getElementById('battleLessonDialog');if(!copy||!dialog)return false;
 const tutorial=state.tutorial;if(tutorial&&tutorial.resumeAfter===undefined)tutorial.resumeAfter=!state.paused;
 if(tutorial){tutorial.dialogStep=step;tutorial.interactionPaused=false}
 activeBattleLesson={id,step};
 state.paused=true;state.actionMode=null;state.movingPlantId=null;
 document.getElementById('battleLessonKicker').textContent=copy.speaker;
 document.getElementById('battleLessonTitle').textContent=copy.title;
 document.getElementById('battleLessonText').textContent=copy.text;
 document.getElementById('battleLessonContinue').textContent=copy.action;
 document.getElementById('game')?.classList.add('battle-lesson-open');
 applyPausedBattleUI();updateBattleActionUI();persistBattleState();dialog.showModal();document.getElementById('battleLessonContinue').focus();return true;
}
function closeBattleLesson(){
 if(!activeBattleLesson)return false;
 const lesson=activeBattleLesson;activeBattleLesson=null;
 document.getElementById('battleLessonDialog')?.close();document.getElementById('game')?.classList.remove('battle-lesson-open');
 const tutorial=state.tutorial;if(tutorial){delete tutorial.dialogStep;tutorial.interactionPaused=true}
 state.paused=true;applyPausedBattleUI();updateBattleActionUI();persistBattleState();
 if(lesson.id==='firstDefense'&&lesson.step==='scout'&&tutorial){tutorial.step='food';tutorial.interactionPaused=false;buildCards();return openBattleLesson('firstDefense','food')}
 const firstDefenseKey={food:'sunflower',shield:'wallnut',archer:'peashooter',ambush:'potato'}[lesson.step];
 const focus=lesson.id==='firstDefense'?document.querySelector(`#cards [data-key="${firstDefenseKey}"]`):lesson.id==='removeUnit'?document.getElementById('removeUnitBtn'):lesson.id==='relocateUnit'?document.getElementById('relocateUnitBtn'):document.getElementById('strategyBtn');
 focus?.focus({preventScroll:true});return true;
}
function cancelBattleLesson(){
 activeBattleLesson=null;const dialog=document.getElementById('battleLessonDialog');if(dialog?.open)dialog.close();document.getElementById('game')?.classList.remove('battle-lesson-open');
}
function ensureFirstDefenseScenario(){
 if(state?.tutorial?.id!=='firstDefense')return false;
 if(state.tutorial.resourceGranted!==true){
  if(state.tutorial.step==='scout'&&!state.plants.length)state.resource=Math.max(state.resource,300);
  state.tutorial.resourceGranted=true;
 }
 state.guidedDefense=state.guidedDefense||{lane:2,remaining:3};
 if(!state.zombies.some(z=>z.tutorialScout&&z.hp>0)){
  const scout=addZombie('normal',7.6,state.guidedDefense.lane);scout.tutorialScout=true;
  state.enemiesSpawned=(state.enemiesSpawned||0)+1;state.lastAI.normal=state.time||0;
  state.guidedDefense.remaining=Math.max(0,state.guidedDefense.remaining-1);
 }
 return true;
}
function firstDefensePlacement(){
 const tutorial=state?.tutorial;if(tutorial?.id!=='firstDefense')return null;
 return {food:{r:2,c:0},shield:{r:2,c:4},archer:{r:2,c:2},ambush:{r:2,c:5}}[tutorial.step]||null;
}
function initializeBattleTutorial(){
 const tutorial=state?.tutorial;if(!tutorial)return false;
 if(tutorial.id==='firstDefense')ensureFirstDefenseScenario();
 if(tutorial.id==='removeUnit'&&!tutorial.targetId){const wounded=addPlant('wallnut',0,2);wounded.hp=Math.max(1,Math.round(wounded.maxHp*.25));wounded.tutorialTarget='remove';tutorial.targetId=wounded.id}
 return true;
}
function startBattleTutorial(){
 const tutorial=state?.tutorial;if(!tutorial)return false;
 if(tutorial.id==='firstDefense')ensureFirstDefenseScenario();
 if(tutorial.dialogStep)return openBattleLesson(tutorial.id,tutorial.dialogStep);
 if(tutorial.id==='firstDefense')return openBattleLesson(tutorial.id,tutorial.step);
 if(tutorial.id==='removeUnit')return openBattleLesson(tutorial.id,'remove');
 return false;
}
function completeBattleLesson(id){
 const tutorial=state?.tutorial,shouldResume=tutorial?.id===id&&tutorial.resumeAfter===true;if(tutorial?.id===id)state.tutorial=null;
 markBattleLessonLearned(id);state.paused=!shouldResume;buildCards();applyPausedBattleUI();updateBattleActionUI();updateHUD();persistBattleState();
}
function afterTutorialDeployment(key,deployed){
 const tutorial=state?.tutorial;if(!tutorial||state.over)return;
 if(tutorial.id==='firstDefense'){
  if(tutorial.step==='food'&&key==='sunflower'){tutorial.step='shield';buildCards();openBattleLesson('firstDefense','shield')}
  else if(tutorial.step==='shield'&&key==='wallnut'){tutorial.step='archer';buildCards();openBattleLesson('firstDefense','archer')}
  else if(tutorial.step==='archer'&&key==='peashooter'){tutorial.step='ambush';buildCards();openBattleLesson('firstDefense','ambush')}
  else if(tutorial.step==='ambush'&&key==='potato')completeBattleLesson('firstDefense');
  return;
 }
 if(tutorial.id==='relocateUnit'&&tutorial.step==='await-deploy'&&deployed&&key!=='potato'){tutorial.step='relocate';tutorial.targetId=deployed.id;openBattleLesson('relocateUnit','relocate')}
}
function afterTutorialRemoval(plant){if(state?.tutorial?.id==='removeUnit'&&plant?.id===state.tutorial.targetId)completeBattleLesson('removeUnit')}
function afterTutorialRelocation(plant){if(state?.tutorial?.id==='relocateUnit'&&plant?.id===state.tutorial.targetId)completeBattleLesson('relocateUnit')}
function maybeTeachStrategyPoint(){
 const tutorial=state?.tutorial;if(tutorial?.id!=='strategy'||tutorial.step!=='await-point')return false;
 tutorial.step='strategy';return openBattleLesson('strategy','strategy');
}
function afterTutorialStrategyUse(){if(state?.tutorial?.id==='strategy')completeBattleLesson('strategy')}

document.getElementById('battleLessonContinue').onclick=closeBattleLesson;
document.getElementById('battleLessonDialog').addEventListener('cancel',event=>event.preventDefault());
