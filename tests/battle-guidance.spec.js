const {test,expect}=require('@playwright/test');
async function battle(page,{faction='zombies',season=1,level=1}={}){
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 await page.goto(process.env.GAME_URL||'/');
 await page.waitForFunction(()=>typeof defaultProfile==='function'&&typeof updateDeploymentGuide==='function');
 await page.evaluate(({faction,season,level})=>{currentUser=null;playerProfile=defaultProfile();for(let n=1;n<=10;n++)completeCampaignLevel('plants',n,1);for(let n=1;n<level;n++)completeCampaignLevel(faction,n,season);saveProfile();markStoryRead(faction,level,'opening',season);chooseFaction(faction,season);startLevel(faction,level);clearInterval(timer)}, {faction,season,level});
}
test('attack countdown, warning, pause and reload preserve simulation time; deadline loses',async({page})=>{
 await battle(page);await expect(page.locator('#attackTimer')).toHaveText('02:00');
 await page.evaluate(()=>{state.time=90000;updateHUD()});await expect(page.locator('#attackStatus')).toHaveClass(/warning/);
 await expect(page.locator('#attackStatus')).toContainText('未突破就失敗');
 await page.locator('#pauseBtn').click();expect(await page.evaluate(()=>{const t=state.time;tick();return state.time===t})).toBe(true);
 await expect(page.locator('#attackStatus')).toContainText('已暫停');
 await page.evaluate(()=>persistBattleState());await page.reload();
 await expect(page.locator('#attackTimer')).toHaveText('00:30');expect(await page.evaluate(()=>state.paused)).toBe(true);
 await page.locator('#pauseBtn').click();await page.evaluate(()=>{clearInterval(timer);state.time=110000;updateHUD()});
 await expect(page.locator('#attackStatus')).toHaveClass(/critical/);
 await page.evaluate(()=>{state.time=state.levelConfig.attackTimeLimit-50;tick()});
 await expect(page.locator('#modalTitle')).toHaveText('進攻失敗');await expect(page.locator('#attackTimer')).toHaveText('00:00');
 await expect(page.locator('#grid .deploy-allowed')).toHaveCount(0);
});
test('zombie click highlights exactly right two columns; invalid cell costs nothing and valid placement clears',async({page},testInfo)=>{
 await battle(page);await page.locator('#cards [data-key="normal"]').click();
 await expect(page.locator('#grid .deploy-allowed')).toHaveCount(10);await expect(page.locator('#grid .deploy-blocked')).toHaveCount(35);
 await expect(page.locator('#deploymentHint')).toContainText('右側第 8、9 欄');
 const before=await page.evaluate(()=>state.resource);await page.locator('.cell[data-r="2"][data-c="3"]').click();
 expect(await page.evaluate(()=>state.resource)).toBe(before);await expect(page.locator('#grid .deploy-allowed')).toHaveCount(10);
 await page.locator('#board').scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath('zombie-deployment.png')});
 await page.locator('.cell[data-r="2"][data-c="7"]').click();expect(await page.evaluate(()=>state.resource)).toBe(before-50);
 await expect(page.locator('#board .type-normal')).toHaveCount(1);await expect(page.locator('#grid .deploy-allowed')).toHaveCount(0);
 await page.locator('#cards [data-key="normal"]').click();await expect(page.locator('#grid .deploy-allowed')).toHaveCount(0);
 await expect(page.locator('#deploymentHint')).toContainText('冷卻');
});
test('defender occupied cells, cancel, action mode, insufficient resource and paused deployment use one rule',async({page})=>{
 await battle(page,{faction:'plants'});await expect(page.locator('#attackStatus')).toBeHidden();
 await page.locator('#cards [data-key="peashooter"]').click();await expect(page.locator('#grid .deploy-allowed')).toHaveCount(35);
 await page.locator('.cell[data-r="2"][data-c="1"]').click();await page.locator('#cards [data-key="sunflower"]').click();
 await expect(page.locator('#grid .deploy-allowed')).toHaveCount(34);await expect(page.locator('.cell[data-r="2"][data-c="1"]')).toHaveClass(/deploy-blocked/);
 await page.locator('#cards [data-key="sunflower"]').click();await expect(page.locator('#grid .deploy-allowed')).toHaveCount(0);
 await page.locator('#cards [data-key="sunflower"]').click();await page.locator('#removeUnitBtn').click();await expect(page.locator('#grid .deploy-allowed')).toHaveCount(0);
 await page.locator('#cards [data-key="sunflower"]').click();await page.locator('#pauseBtn').click();await expect(page.locator('#grid .deploy-allowed')).toHaveCount(0);
 expect(await page.evaluate(()=>{const n=state.plants.length;deploySelected('sunflower',0,0);deploySelected('sunflower',-1,0);return n===state.plants.length})).toBe(true);
 await page.locator('#pauseBtn').click();await page.evaluate(()=>{clearInterval(timer);state.resource=0;updateHUD()});await expect(page.locator('#grid .deploy-allowed')).toHaveCount(0);
 await expect(page.locator('#deploymentHint')).toContainText('資源不足');
});
test('desktop drag exposes legal cells, clears cancellation, and drops legally',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='mobile','mobile uses tap instead of native drag');await battle(page);
 const card=page.locator('#cards [data-key="normal"]'),cell=page.locator('.cell[data-r="2"][data-c="8"]');
 const dt=await page.evaluateHandle(()=>new DataTransfer());await card.dispatchEvent('dragstart',{dataTransfer:dt});
 await expect(page.locator('#grid .deploy-allowed')).toHaveCount(10);await card.dispatchEvent('dragend');await expect(page.locator('#grid .deploy-allowed')).toHaveCount(0);
 await card.dragTo(cell);await expect(page.locator('#board .type-normal')).toHaveCount(1);await expect(page.locator('#grid .deploy-allowed')).toHaveCount(0);
});
test('second season and night use same placement tint, fullscreen does not cover last row',async({page},testInfo)=>{
 await battle(page,{season:2});await page.locator('#cards [data-key="s2Rat"]').click();await expect(page.locator('#grid .deploy-allowed')).toHaveCount(10);
 await expect(page.locator('#attackTimer')).not.toBeEmpty();
 await page.evaluate(()=>{backToHome();currentSeason=1;for(let n=1;n<5;n++)completeCampaignLevel('zombies',n,1);markStoryRead('zombies',5,'opening',1);chooseFaction('zombies',1);startLevel('zombies',5);clearInterval(timer)});
 await page.locator('#cards [data-key="normal"]').click();
 expect(await page.locator('#grid .deploy-allowed').evaluateAll(es=>es.every(e=>getComputedStyle(e,'::after').content.includes('✓')))).toBe(true);
 await page.locator('#fullscreenBtn').click();await expect(page.locator('#game')).toHaveClass(/fullscreen-mode/);
 const last=page.locator('.cell[data-r="4"][data-c="8"]');await expect(last).toBeInViewport();
 expect(await last.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})).toBe(true);
 await page.screenshot({path:testInfo.outputPath('night-fullscreen.png')});
});
test('landscape fullscreen keeps deploy cells and attack warning above cards',async({page},testInfo)=>{
 await page.setViewportSize({width:844,height:390});await battle(page);
 await page.locator('#cards [data-key="normal"]').click();await page.locator('#fullscreenBtn').click();await expect(page.locator('#game')).toHaveClass(/fullscreen-mode/);
 await page.evaluate(()=>{state.time=110000;updateHUD()});
 const last=page.locator('.cell[data-r="4"][data-c="8"]');await expect(last).toBeInViewport();
 await expect.poll(()=>last.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})).toBe(true);
 expect((await last.boundingBox()).height).toBeGreaterThanOrEqual(24);
 await expect(page.locator('#attackTimer')).toHaveText('00:10');await page.screenshot({path:testInfo.outputPath('attack-warning-landscape.png')});
 await last.click();await expect(page.locator('#board .type-normal')).toHaveCount(1);
});
test('reinforcement has no free budget, occupied cells cannot be overwritten, and season two placement remains legal',async({page})=>{
 await battle(page,{level:5});expect(await page.evaluate(()=>{
  state.time=25000;state.plants=[];state.zombies=[];state.lawnmowers[2].used=true;addZombie('normal',1.7,2);addPlant('wallnut',0,2);addPlant('wallnut',1,2);
  const blocked=chooseBreachDefense([['wallnut',PLANT_TYPES.wallnut]])===null;
  state.aiResource=0;state.nextAI=state.time;const n=state.plants.length;aiAct();
  return blocked&&state.plants.length===n&&state.aiResource===0;
 })).toBe(true);
 await battle(page,{faction:'plants',season:2});await page.locator('#cards [data-key="s2Crossbow"]').click();await expect(page.locator('#grid .deploy-allowed')).toHaveCount(35);
 await page.locator('.cell[data-r="1"][data-c="0"]').click();await expect(page.locator('#board .type-s2Crossbow')).toHaveCount(1);
});
test('reactive defense fills spent-mower breach in front, respects occupied cells, costs, cooldown and pace',async({page})=>{
 await battle(page,{level:5});const result=await page.evaluate(()=>{
  state.time=25000;state.plants=[];state.zombies=[];state.lawnmowers[1].used=true;addZombie('normal',1.7,1);addZombie('normal',1.7,3);
  const d=PLANT_TYPES.wallnut,plan=choosePlantAI([['wallnut',d]]);
  state.plants=[];state.aiResource=d.cost;state.lastAI={};state.nextAI=state.time;
  const choose=choosePlantAI;choosePlantAI=()=>plan;aiAct();choosePlantAI=choose;
  const deployed={cost:state.aiResource,count:state.plants.length,last:state.lastAI.wallnut,future:state.nextAI>state.time};
  const count=state.plants.length;aiAct();const noInstant=state.plants.length===count;
  return {row:plan.r,inFront:plan.c<1.7,deployed,noInstant,cooling:!affordableAI(PLANT_TYPES,1000).some(([k])=>k==='wallnut')};
 });expect(result).toEqual({row:1,inFront:true,deployed:{cost:0,count:1,last:25000,future:true},noInstant:true,cooling:true});
});
