const {test,expect}=require('@playwright/test');

async function openFresh(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/?progressive-onboarding=1');
 await expect(page.locator('#start')).toHaveClass(/active/);
}

async function openReturning(page){
 await page.addInitScript(()=>{
  const read={};
  for(const side of ['plants','zombies'])for(let level=1;level<=10;level++)for(const scene of ['opening','victory','defeat'])read[`${side}:${level}:${scene}`]=true;
  localStorage.setItem('sgzStoryRead_v1',JSON.stringify(read));
 });
 await openFresh(page);
}

test('first entry uses a three-line hook while replay preserves the complete opening',async({page})=>{
 await openFresh(page);
 await page.locator('[data-new-player-start]:visible').click();
 await expect(page.locator('#storyDialog')).toBeVisible();
 await expect(page.locator('#storyCount')).toHaveText('1 / 3');
 await page.locator('#storySkip').click();
 await expect(page.locator('#battleLessonDialog')).toBeVisible();
 expect(await page.locator('#battleLessonDialog').evaluate(dialog=>dialog.parentElement?.id)).toBe('battleFullscreenHost');
 await expect(page.locator('#battleLessonContinue')).toBeFocused();
 await page.locator('#battleLessonContinue').click();
 await page.evaluate(()=>{clearInterval(timer);backToLevelSelect()});
 await page.evaluate(()=>replayCampaignStory('plants',1));
 await expect(page.locator('#storyDialog')).toBeVisible();
 await expect(page.locator('#storyCount')).toHaveText('1 / 16');
});

test('first battle reveals a real threat, locks a solvable lane, and teaches all four roles',async({page})=>{
 await openFresh(page);
 await page.locator('[data-new-player-start]:visible').click();
 await page.locator('#storySkip').click();
 await expect(page.locator('#battleLessonDialog')).toBeVisible();
 await expect(page.locator('#battleLessonTitle')).toContainText('第 3 路');
 expect(await page.evaluate(()=>({
  paused:state.paused,
  time:state.time,
  resource:state.resource,
  enemies:state.zombies.map(z=>({type:z.type,row:z.r,column:z.c})),
  spawned:state.enemiesSpawned
 }))).toEqual({paused:true,time:0,resource:300,enemies:[{type:'normal',row:2,column:7.6}],spawned:1});
 const scoutBox=await page.locator('.entity.zombie').boundingBox(),boardBox=await page.locator('#board').boundingBox();
 expect(scoutBox).not.toBeNull();expect(boardBox).not.toBeNull();
 expect(scoutBox.x).toBeLessThan(boardBox.x+boardBox.width);expect(scoutBox.x+scoutBox.width).toBeGreaterThan(boardBox.x);

 await page.locator('#battleLessonContinue').click();
 await expect(page.locator('#battleLessonTitle')).toContainText('備妥軍糧');
 await expect(page.locator('#battleLessonText')).toContainText('50 軍糧');
 await page.locator('#battleLessonContinue').click();
 await expect(page.locator('#cards .card:visible')).toHaveCount(1);
 await page.locator('#cards [data-key="sunflower"]').click();
 await expect(page.locator('.cell[data-r="2"][data-c="0"]')).toHaveClass(/deploy-allowed/);
 await expect(page.locator('.cell[data-r="1"][data-c="0"]')).toHaveClass(/deploy-blocked/);
 await page.locator('.cell[data-r="1"][data-c="0"]').click();
 expect(await page.evaluate(()=>state.plants.length)).toBe(0);
 await page.locator('.cell[data-r="2"][data-c="0"]').click();

 await expect(page.locator('#battleLessonTitle')).toContainText('擋住第 3 路');
 await page.locator('#battleLessonContinue').click();
 await page.locator('#cards [data-key="wallnut"]').click();
 await expect(page.locator('.cell[data-r="2"][data-c="4"]')).toHaveClass(/deploy-allowed/);
 await page.locator('.cell[data-r="2"][data-c="4"]').click();

 await expect(page.locator('#battleLessonTitle')).toContainText('後方攻擊');
 await page.locator('#battleLessonContinue').click();
 await page.locator('#cards [data-key="peashooter"]').click();
 await expect(page.locator('.cell[data-r="2"][data-c="2"]')).toHaveClass(/deploy-allowed/);
 await page.locator('.cell[data-r="2"][data-c="2"]').click();

 await expect(page.locator('#battleLessonTitle')).toContainText('伏兵');
 await expect(page.locator('#battleLessonText')).toContainText('4.5 秒');
 await page.locator('#battleLessonContinue').click();
 await page.locator('#cards [data-key="potato"]').click();
 await expect(page.locator('.cell[data-r="2"][data-c="5"]')).toHaveClass(/deploy-allowed/);
 await page.locator('.cell[data-r="2"][data-c="5"]').click();

 await expect(page.locator('#battleLessonDialog')).toBeHidden();
 await expect(page.locator('#cards .card:visible')).toHaveCount(4);
 const learned=await page.evaluate(()=>({
  learned:JSON.parse(localStorage.getItem('sgzBattleLessons_v1')).firstDefense,
  paused:state.paused,
  time:state.time,
  resource:state.resource,
  rows:state.plants.map(p=>p.r),
  guided:state.guidedDefense
 }));
 expect(learned).toMatchObject({learned:true,paused:false,resource:75,rows:[2,2,2,2],guided:{lane:2,remaining:2}});
 expect(learned.time).toBeLessThanOrEqual(100);
});

test('the next two guided enemies stay in the taught lane before adaptive AI unlocks',async({page})=>{
 await openFresh(page);
 await page.evaluate(()=>{
  selectedLevel=1;
  start('plants',{guidedOpening:true});
  clearInterval(timer);
  while(activeBattleLesson)closeBattleLesson();
  const placements=[['sunflower',2,0],['wallnut',2,4],['peashooter',2,2],['potato',2,5]];
  for(const [key,row,column] of placements){if(activeBattleLesson)closeBattleLesson();deploySelected(key,row,column)}
  spawnRandomZombie('normal');
  spawnRandomZombie('cone');
 });
 expect(await page.evaluate(()=>({rows:state.zombies.map(z=>z.r),remaining:state.guidedDefense.remaining}))).toEqual({rows:[2,2,2],remaining:0});
});

test('unfinished and saved lessons resume instead of being skipped',async({page})=>{
 await openFresh(page);
 await page.locator('[data-new-player-start]:visible').click();
 await page.locator('#storySkip').click();
 await expect(page.locator('#battleLessonDialog')).toBeVisible();
 await page.evaluate(()=>persistBattleState());
 await page.reload();
 await page.evaluate(()=>restoreBattleIfAvailable());
 await expect(page.locator('#battleLessonDialog')).toBeVisible();
 await expect(page.locator('#battleLessonTitle')).toContainText('第 3 路');
 await page.locator('#battleLessonContinue').click();
 await page.evaluate(()=>backToHome());
 await page.evaluate(()=>{selectedLevel=1;start('plants');clearInterval(timer)});
 await expect(page.locator('#battleLessonDialog')).toBeVisible();
});

test('restoring a partially completed first lesson never grants its 300 resource twice',async({page})=>{
 await openFresh(page);
 await page.evaluate(()=>{
  selectedLevel=1;start('plants',{guidedOpening:true});clearInterval(timer);
  while(activeBattleLesson)closeBattleLesson();
  deploySelected('sunflower',2,0);persistBattleState();restoreBattleIfAvailable();clearInterval(timer);
 });
 expect(await page.evaluate(()=>({resource:state.resource,step:state.tutorial.step,granted:state.tutorial.resourceGranted,plants:state.plants.length}))).toEqual({resource:250,step:'shield',granted:true,plants:1});
});

test('defense HUD hides AI budget and actions unlock only when their story needs them',async({page})=>{
 await openReturning(page);
 await page.evaluate(()=>{selectedLevel=1;start('plants');clearInterval(timer)});
 await expect(page.locator('.battle-pill.enemy')).toBeHidden();
 await expect(page.locator('#removeUnitBtn')).toBeHidden();
 await expect(page.locator('#relocateUnitBtn')).toBeHidden();
 await expect(page.locator('#strategyBtn')).toBeHidden();

 await page.evaluate(()=>{backToHome();completeCampaignLevel('plants',1);completeCampaignLevel('plants',2);selectedLevel=3;start('plants',{guidedOpening:true});clearInterval(timer)});
 await expect(page.locator('#battleLessonDialog')).toBeVisible();
 await expect(page.locator('#battleLessonTitle')).toContainText('撤回傷兵');
 await expect(page.locator('#removeUnitBtn')).toBeVisible();
 await expect(page.locator('#relocateUnitBtn')).toBeHidden();
 await expect(page.locator('#strategyBtn')).toBeHidden();
 await page.locator('#battleLessonContinue').click();
 await page.locator('#removeUnitBtn').click();
 await page.locator('.cell[data-r="2"][data-c="0"]').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sgzBattleLessons_v1')).removeUnit)).toBe(true);

 await page.evaluate(()=>{backToHome();completeCampaignLevel('plants',3);selectedLevel=4;start('plants',{guidedOpening:true});clearInterval(timer);state.plants=[];state.resource=999;render();updateHUD()});
 await expect(page.locator('#removeUnitBtn')).toBeVisible();
 await expect(page.locator('#relocateUnitBtn')).toBeVisible();
 await expect(page.locator('#strategyBtn')).toBeHidden();
 await page.locator('#cards .card[data-key="potato"]').click();
 await page.locator('.cell[data-r="2"][data-c="2"]').click();
 await expect(page.locator('#battleLessonDialog')).toBeHidden();
 expect(await page.evaluate(()=>state.tutorial.step)).toBe('await-deploy');
 await page.locator('#cards .card[data-key="sunflower"]').click();
 await page.locator('.cell[data-r="2"][data-c="3"]').click();
 await expect(page.locator('#battleLessonTitle')).toContainText('換列支援');
 await page.locator('#battleLessonContinue').click();
 await page.locator('#relocateUnitBtn').click();
 await page.locator('.cell[data-r="2"][data-c="3"]').click();
 await page.locator('.cell[data-r="1"][data-c="3"]').click();
 expect(await page.evaluate(()=>({row:state.plants.find(plant=>plant.type==='sunflower').r,learned:JSON.parse(localStorage.getItem('sgzBattleLessons_v1')).relocateUnit}))).toEqual({row:1,learned:true});

 await page.evaluate(()=>{backToHome();completeCampaignLevel('plants',4);selectedLevel=5;start('plants',{guidedOpening:true});clearInterval(timer);grantStrategyPoint('onboarding-test')});
 await expect(page.locator('#strategyBtn')).toBeVisible();
 await expect(page.locator('#battleLessonDialog')).toBeVisible();
 await expect(page.locator('#battleLessonTitle')).toContainText('軍令');
 await page.locator('#battleLessonContinue').click();
 await page.locator('#strategyBtn').click();
 await page.getByRole('dialog',{name:'選擇軍令'}).locator('[data-tactical-order]').first().click();
 expect(await page.evaluate(()=>({learned:JSON.parse(localStorage.getItem('sgzBattleLessons_v1')).strategy,paused:state.paused}))).toEqual({learned:true,paused:false});
});

test('completed lessons do not interrupt replay and mobile has no horizontal overflow',async({page},testInfo)=>{
 await page.addInitScript(()=>localStorage.setItem('sgzBattleLessons_v1',JSON.stringify({firstDefense:true,removeUnit:true,relocateUnit:true,strategy:true})));
 await openReturning(page);
 await page.evaluate(()=>{completeCampaignLevel('plants',1);completeCampaignLevel('plants',2);selectedLevel=3;start('plants');clearInterval(timer)});
 await expect(page.locator('#battleLessonDialog')).toBeHidden();
 await expect(page.locator('#removeUnitBtn')).toBeVisible();
 if(testInfo.project.name==='mobile')expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('leaving an interactive lesson restores pause controls in the next battle',async({page})=>{
 await openFresh(page);
 await page.locator('[data-new-player-start]:visible').click();
 await page.locator('#storySkip').click();
 await page.locator('#battleLessonContinue').click();
 await page.locator('#battleLessonContinue').click();
 await expect(page.locator('#pauseBtn')).toBeDisabled();
 await page.evaluate(()=>backToHome());
 await page.evaluate(()=>{localStorage.setItem('sgzBattleLessons_v1',JSON.stringify({firstDefense:true}));selectedLevel=1;start('plants');clearInterval(timer)});
 await expect(page.locator('#pauseBtn')).toBeEnabled();
 expect(await page.evaluate(()=>({paused:state.paused,tutorial:state.tutorial}))).toEqual({paused:false,tutorial:null});
});
