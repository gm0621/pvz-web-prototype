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
 await page.locator('#battleLessonContinue').click();
 await page.evaluate(()=>{clearInterval(timer);backToLevelSelect()});
 await page.evaluate(()=>replayCampaignStory('plants',1));
 await expect(page.locator('#storyDialog')).toBeVisible();
 await expect(page.locator('#storyCount')).toHaveText('1 / 16');
});

test('first battle pauses safely and teaches three roles through real deployment',async({page})=>{
 await openFresh(page);
 await page.locator('[data-new-player-start]:visible').click();
 await page.locator('#storySkip').click();
 await expect(page.locator('#battleLessonDialog')).toBeVisible();
 await expect(page.locator('#battleLessonTitle')).toContainText('備妥軍糧');
 expect(await page.evaluate(()=>state.paused)).toBe(true);
 await expect(page.locator('#cards .card:visible')).toHaveCount(1);
 await expect(page.locator('#cards [data-key="sunflower"]')).toBeVisible();

 await page.locator('#battleLessonContinue').click();
 await page.waitForTimeout(150);
 expect(await page.evaluate(()=>({paused:state.paused,time:state.time,pauseDisabled:document.getElementById('pauseBtn').disabled}))).toEqual({paused:true,time:0,pauseDisabled:true});
 await page.locator('#cards [data-key="sunflower"]').click();
 await page.locator('.cell[data-r="2"][data-c="0"]').focus();
 await page.keyboard.press('Enter');
 await expect(page.locator('#battleLessonDialog')).toBeVisible();
 await expect(page.locator('#battleLessonTitle')).toContainText('擋住敵人');
 await expect(page.locator('#cards [data-key="wallnut"]')).toBeVisible();

 await page.locator('#battleLessonContinue').click();
 await page.locator('#cards [data-key="wallnut"]').click();
 await page.locator('.cell[data-r="2"][data-c="2"]').click();
 await expect(page.locator('#battleLessonTitle')).toContainText('後方攻擊');
 await expect(page.locator('#cards [data-key="peashooter"]')).toBeVisible();

 await page.locator('#battleLessonContinue').click();
 await page.waitForTimeout(150);
 expect(await page.evaluate(()=>({paused:state.paused,time:state.time}))).toEqual({paused:true,time:0});
 await page.locator('#cards [data-key="peashooter"]').click();
 await page.locator('.cell[data-r="2"][data-c="1"]').click();
 await expect(page.locator('#battleLessonDialog')).toBeHidden();
 await expect(page.locator('#cards .card:visible')).toHaveCount(4);
 const learned=await page.evaluate(()=>({learned:JSON.parse(localStorage.getItem('sgzBattleLessons_v1')).firstDefense,paused:state.paused,time:state.time}));
 expect(learned.learned).toBe(true);
 expect(learned.paused).toBe(false);
 expect(learned.time).toBeLessThanOrEqual(100);
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
 await expect(page.locator('#battleLessonTitle')).toContainText('備妥軍糧');
 await page.locator('#battleLessonContinue').click();
 await page.evaluate(()=>backToHome());
 await page.evaluate(()=>{selectedLevel=1;start('plants');clearInterval(timer)});
 await expect(page.locator('#battleLessonDialog')).toBeVisible();
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
 await expect(page.locator('#pauseBtn')).toBeDisabled();
 await page.evaluate(()=>backToHome());
 await page.evaluate(()=>{localStorage.setItem('sgzBattleLessons_v1',JSON.stringify({firstDefense:true}));selectedLevel=1;start('plants');clearInterval(timer)});
 await expect(page.locator('#pauseBtn')).toBeEnabled();
 expect(await page.evaluate(()=>({paused:state.paused,tutorial:state.tutorial}))).toEqual({paused:false,tutorial:null});
});
