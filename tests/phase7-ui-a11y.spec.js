const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({body:''}));
 await page.goto('/');
}

const dirtyBattle=()=>{
 const board=document.getElementById('board');
 state.time=1000;
 createEnemyTelegraph('fire-catapult',{sourceId:'phase7-ui-source',targets:[{r:2,c:4}],cancelOnSourceDeath:false});
 render();
 triggerBattleFeedback('critical');
 triggerBattleFeedback('shield-break');
 attackFx({r:2,c:4},'boom');
 phoenixBurnFx(2);
 createTacticalOrderOffer(1);
 return {
  transients:board.querySelectorAll('.enemy-telegraph,[class*="-fx"],.fx,.row-fire,.global-strike,.sigil,.shockwave').length,
  banner:document.querySelectorAll('#battleTelegraphBanner').length,
  telegraphActive:document.getElementById('game').classList.contains('telegraph-active'),
  critical:board.classList.contains('critical-hit-stop'),
  shield:board.classList.contains('shield-break-feedback'),
  timers:[board._criticalFeedbackTimer,board._shieldFeedbackTimer].filter(Boolean).length,
  orderVisible:!document.getElementById('tacticalOrderDialog').hidden,
  inert:document.getElementById('game').inert
 };
};

const overlaySnapshot=()=>{
 const board=document.getElementById('board'),dialog=document.getElementById('tacticalOrderDialog');
 return {
  transients:board.querySelectorAll('.enemy-telegraph,[class*="-fx"],.fx,.row-fire,.global-strike,.sigil,.shockwave').length,
  banner:document.querySelectorAll('#battleTelegraphBanner').length,
  telegraphActive:document.getElementById('game').classList.contains('telegraph-active'),
  critical:board.classList.contains('critical-hit-stop'),
  shield:board.classList.contains('shield-break-feedback'),
  timers:[board._criticalFeedbackTimer,board._shieldFeedbackTimer].filter(Boolean).length,
  orderVisible:!dialog.hidden,
  orderCards:dialog.querySelectorAll('[data-tactical-order]').length,
  inert:document.getElementById('game').inert
 };
};

test('battle overlays and timers clean up immediately on replay level-select and home',async({page})=>{
 await open(page);
 const result=await page.evaluate(async({dirtyBattle,overlaySnapshot})=>{
  dirtyBattle=eval(`(${dirtyBattle})`);overlaySnapshot=eval(`(${overlaySnapshot})`);const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  playerProfile=normalizeProfile({});currentSeason=1;selectedLevel=1;start('plants');clearInterval(timer);
  const beforeReplay=dirtyBattle();
  start('plants');clearInterval(timer);const replayImmediate=overlaySnapshot();await wait(250);const replayDelayed=overlaySnapshot();
  dirtyBattle();backToLevelSelect(false);const levelSelectImmediate=overlaySnapshot();await wait(250);const levelSelectDelayed=overlaySnapshot();
  start('plants');clearInterval(timer);dirtyBattle();backToHome(false);const homeImmediate=overlaySnapshot();await wait(250);const homeDelayed=overlaySnapshot();
  return {beforeReplay,replayImmediate,replayDelayed,levelSelectImmediate,levelSelectDelayed,homeImmediate,homeDelayed};
 },{dirtyBattle:String(dirtyBattle),overlaySnapshot:String(overlaySnapshot)});
 expect(result.beforeReplay).toEqual({transients:4,banner:1,telegraphActive:true,critical:true,shield:true,timers:2,orderVisible:true,inert:true});
 const clean={transients:0,banner:0,telegraphActive:false,critical:false,shield:false,timers:0,orderVisible:false,orderCards:0,inert:false};
 expect(result.replayImmediate).toEqual(clean);
 expect(result.replayDelayed).toEqual(clean);
 expect(result.levelSelectImmediate).toEqual(clean);
 expect(result.levelSelectDelayed).toEqual(clean);
 expect(result.homeImmediate).toEqual(clean);
 expect(result.homeDelayed).toEqual(clean);
});
