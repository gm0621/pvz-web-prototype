const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 await page.goto('/');
 await page.evaluate(()=>{
  currentUser=null;playerProfile=defaultProfile();
  for(const season of [1,2])for(const faction of ['plants','zombies'])for(let level=1;level<=10;level++)completeCampaignLevel(faction,level,season);
  saveProfile();
  window.beginObjectiveTest=(season,faction,level)=>{
   currentSeason=season;currentFaction=faction;selectedLevel=level;start(faction);clearInterval(timer);cancelBattleLesson();state.tutorial=null;state.paused=false;render();updateHUD();
  };
 });
}

test('every playable special route exposes its objective without opening battle intelligence',async({page})=>{
 await open(page);
 const routes=await page.evaluate(()=>{
  const results=[];
  for(const season of [1,2])for(const faction of ['plants','zombies'])for(let level=1;level<=10;level++){
   beginObjectiveTest(season,faction,level);
   results.push({route:`${season}:${faction}:${level}`,id:state.gameplay.stageRule.id,visible:!$('stageRuleStatus').hidden,goal:$('stageRuleStatusGoal').textContent,hint:$('stageRuleStatusHint').textContent,timer:$('attackStatusText').textContent,drawer:$('battleIntelDrawer').hidden});
  }
  beginObjectiveTest(1,'plants',11);
  results.push({route:'finale',id:state.gameplay.stageRule.id,visible:!$('stageRuleStatus').hidden,goal:$('stageRuleStatusGoal').textContent,hint:$('stageRuleStatusHint').textContent,drawer:$('battleIntelDrawer').hidden});
  return results;
 });
 expect(routes).toHaveLength(41);
 for(const route of routes){
  expect(route.visible,route.route).toBe(true);expect(route.drawer,route.route).toBe(true);
  expect(route.goal.length,route.route).toBeGreaterThan(8);expect(route.hint.length,route.route).toBeGreaterThan(8);
  expect(route.goal+route.hint,route.route).not.toMatch(/undefined|NaN/);
  if(route.timer)expect(route.timer,route.route).not.toContain('突破任一路');
 }
});

test('partial objectives tell players what still prevents victory',async({page})=>{
 await open(page);
 const copy=await page.evaluate(()=>{
  const text=()=>{render();updateHUD();return $('stageRuleStatus').textContent};
  beginObjectiveTest(2,'zombies',2);
  recordStageRuleEvent({type:'breach',lane:0});const sealOne=text();
  recordStageRuleEvent({type:'breach',lane:0});const sealRepeat=text();
  recordStageRuleEvent({type:'breach',lane:3});const sealDone=text();
  beginObjectiveTest(2,'zombies',3);const previous=state.gameplay.stageRule.data.requiredLane;
  recordStageRuleEvent({type:'breach',lane:(previous+1)%5});const wrongLane=text();
  recordStageRuleEvent({type:'breach',lane:previous});const nextLane=state.gameplay.stageRule.data.requiredLane,shift=text();
  beginObjectiveTest(2,'zombies',4);const tower=state.plants.find(p=>p.stageTarget==='arrow-tower');tower.hp=0;tickStageRule();const towerDone=text();
  beginObjectiveTest(2,'zombies',1);const ram=state.zombies.find(z=>z.stageEscort==='gate-ram');ram.hp=123;const ramCopy=text();
  beginObjectiveTest(2,'plants',3);state.bossSpawned=true;state.zombies=[];state.resource=30;tickStageRule();const reserve=text(),blocked=checkEnd();
  beginObjectiveTest(2,'plants',4);state.gameplay.stageRule.data.escort.progress=100;const grainDone=text();
  beginObjectiveTest(1,'plants',11);state.qinBoss.seals=3;const qinReady=text();qinBossEntity().vulnerableUntil=state.time+8000;const qinOpen=text();
  return {sealOne,sealRepeat,sealDone,wrongLane,shift,previous,nextLane,towerDone,ramCopy,reserve,blocked,grainDone,qinReady,qinOpen};
 });
 expect(copy.sealOne).toContain('已突破一路，請改攻另一路');expect(copy.sealRepeat).toBe(copy.sealOne);expect(copy.sealDone).toContain('2/2');
 expect(copy.wrongLane).toContain(`現在突破第 ${copy.previous+1} 路`);expect(copy.shift).toContain(`現在突破第 ${copy.nextLane+1} 路`);expect(copy.shift).toContain('1/2');
 expect(copy.towerDone).toContain('還需突破左側城門');expect(copy.ramCopy).toContain('HP 123/');expect(copy.ramCopy).toContain('其他僵屍突破不算');
 expect(copy.reserve).toContain('還差 50 軍糧');expect(copy.reserve).toContain('敵軍已清除');expect(copy.blocked).toBe(false);
 expect(copy.grainDone).toContain('仍須守住城池');expect(copy.qinReady).toContain('按「破陣號令」');expect(copy.qinOpen).toContain('破陣中 8 秒');
});

test('objective survives paused battle reload and does not advance its deadline',async({page})=>{
 await open(page);
 const before=await page.evaluate(()=>{beginObjectiveTest(2,'zombies',2);recordStageRuleEvent({type:'breach',lane:1});state.time=30000;render();updateHUD();pauseAndSaveBattle('test');return $('stageRuleStatus').textContent});
 await page.reload();
 const restored=await page.evaluate(()=>{const ok=restoreBattleIfAvailable();clearInterval(timer);render();updateHUD();return {ok,paused:state.paused,time:state.time,text:$('stageRuleStatus').textContent}});
 expect(restored).toEqual({ok:true,paused:true,time:30000,text:before});
});

test('objective remains readable above the board and leaves deployment cells clear in fullscreen',async({page},testInfo)=>{
 await open(page);await page.evaluate(()=>beginObjectiveTest(2,'zombies',2));
 for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:844,height:390}]){
  await page.evaluate(()=>leaveFullscreenIfNeeded());
  await page.setViewportSize(viewport);
  for(const fullscreen of [false,true]){
   if(fullscreen){await page.locator('#fullscreenBtn').click();await expect(page.locator('#game')).toHaveClass(/fullscreen-mode/)}else await page.evaluate(async()=>{await leaveFullscreenIfNeeded();render();updateHUD()});
   const panel=page.locator('#stageRuleStatus');await expect(panel).toBeVisible();await expect(panel).toBeInViewport();
   const geometry=await page.evaluate(()=>{
    const panel=$('stageRuleStatus'),rect=panel.getBoundingClientRect(),board=$('board').getBoundingClientRect(),cell=document.querySelector('.cell[data-r="4"][data-c="8"]'),c=cell.getBoundingClientRect();
    return {left:rect.left,right:rect.right,bottom:rect.bottom,boardTop:board.top,overflow:panel.scrollWidth>panel.clientWidth+1,cellHeight:c.height,clear:cell.contains(document.elementFromPoint(c.x+c.width/2,c.y+c.height/2))};
   });
   expect(geometry.left).toBeGreaterThanOrEqual(0);expect(geometry.right).toBeLessThanOrEqual(viewport.width+1);expect(geometry.bottom).toBeLessThanOrEqual(geometry.boardTop+1);expect(geometry.overflow).toBe(false);
   if(fullscreen){expect(geometry.clear).toBe(true);expect(geometry.cellHeight).toBeGreaterThanOrEqual(24)}
  }
  await page.screenshot({path:testInfo.outputPath(`objective-${viewport.width}.png`),fullPage:true});
 }
});

test('escort and finale objectives fit narrow and short fullscreen screens',async({page},testInfo)=>{
 await open(page);
 for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  for(const [season,faction,level] of [[2,'plants',4],[2,'zombies',1],[1,'plants',11]]){
   await page.evaluate(({season,faction,level})=>{
    beginObjectiveTest(season,faction,level);
    // Exercise CSS fullscreen fallback, independent of native browser support.
    $('game').classList.add('fullscreen-mode');syncFullscreenUI();
   },{season,faction,level});
   const summary=page.locator('#stageRuleStatus');await expect(summary).toBeInViewport();
   const box=await summary.boundingBox(),board=await page.locator('#board').boundingBox();
   expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);expect(box.y+box.height).toBeLessThanOrEqual(board.y+1);
   expect(board.height/5).toBeGreaterThanOrEqual(20);
   await page.screenshot({path:testInfo.outputPath(`${faction}-${level}-${viewport.width}.png`),fullPage:true});
   await page.evaluate(()=>leaveFullscreenIfNeeded());
  }
 }
});
