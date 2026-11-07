const {test,expect}=require('@playwright/test');

async function openRomance(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 await page.goto('/');
 await page.waitForFunction(()=>authIdentityResolved);
 await page.locator('#romanceStartBtn').click();
}
async function startChapterBattle(page,level){
 await page.evaluate(level=>{
  for(let n=1;n<level;n++)completeRomanceLevel(n);
  markStoryRead('plants',level,'opening',3);selectedLevel=level;currentSeason=3;currentFaction='plants';start('plants',{difficulty:'medium'});clearInterval(timer);
 },level);
}
async function offerDuel(page,level=3){
 await startChapterBattle(page,level);
 await page.evaluate(level=>{
  state.time=30000;const hero=addPlant(level===3?'zhangfei':'firepea',3,2),boss=addZombie(level===3?'rDengMao':'rChengYuanzhi',4,2);boss.boss=true;state.bossSpawned=true;advanceRomanceArmy();
 },level);
}

test('chapter entry, six stages and full prologue before battle',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await openRomance(page);
 await expect(page.locator('#campaignHeading')).toHaveText('第一章・桃園結義');
 await expect(page.locator('#levelGrid .level-card')).toHaveCount(6);
 await expect(page.locator('#levelGrid .level-start:enabled')).toHaveCount(1);
 await page.locator('#continueCampaignBtn').click();await page.locator('.level-detail-start:visible').click();
 await expect(page.locator('#storyDialog')).toBeVisible();
 await expect(page.locator('#storyText')).toContainText('黃巾起事');
 expect(await page.evaluate(()=>state?.over===false)).toBe(false);
 await page.locator('#storySkip').click();
 await expect(page.locator('#game')).toHaveClass(/active/);
 expect(await page.evaluate(()=>({season:state.season,roster:[...document.querySelectorAll('#cards .card')].map(x=>x.dataset.key)}))).toEqual({season:3,roster:expect.arrayContaining(['rMilitia','firepea','zhangfei','liubei'])});
 expect(errors).toEqual([]);
});

test('chapter wins and reload preserve independent progress without economy changes',async({page})=>{
 await openRomance(page);await startChapterBattle(page,1);
 const before=await page.evaluate(()=>JSON.stringify(playerProfile));
 await page.evaluate(()=>end(true,'test','test'));
 expect(await page.evaluate(()=>romanceProgress().highestLevel)).toBe(1);
 expect(await page.evaluate(()=>JSON.stringify(playerProfile))).toBe(before);
 await page.reload();await page.waitForFunction(()=>authIdentityResolved);await page.waitForTimeout(100);
 if(await page.locator('#storyDialog').isVisible())await page.locator('#storySkip').click();
 await page.locator('#romanceStartBtn').click();
 await expect(page.locator('#levelGrid .level-start:enabled')).toHaveCount(2);
 expect(await page.evaluate(()=>isCampaignLevelCompleted('plants',1,1))).toBe(false);
});

test('dual advance attacks enemy camp; enemy breaches attack our camp',async({page})=>{
 await openRomance(page);await startChapterBattle(page,3);
 const result=await page.evaluate(()=>{
  const p=addPlant('rMilitia',1,0);state.time=20000;actPlants();const advanced=p.c>1;
  p.c=8.2;advanceRomanceArmy();const damage=state.gameplay.stageRule.data.enemyCamp;
  recordStageRuleEvent({type:'breach'});const own=state.gameplay.stageRule.data.ownCamp;
  return {advanced,damage,own,canDeploy:deploymentCellReason(1,3),rule:activeStageRule().id};
 });
 expect(result).toEqual({advanced:true,damage:782,own:800,canDeploy:expect.stringContaining('1～3'),rule:'romance-clash'});
 await page.evaluate(()=>{state.gameplay.stageRule.data.enemyCamp=0;checkEnd()});
 await expect(page.locator('#modalTitle')).toContainText('通關');
});

test('escort has a real convoy, finale provides three advancing squads',async({page})=>{
 await openRomance(page);await startChapterBattle(page,2);
 expect(await page.evaluate(()=>({rule:activeStageRule().id,escort:!!state.gameplay.stageRule.data.escort}))).toEqual({rule:'escort-grain',escort:true});
 await startChapterBattle(page,6);
 expect(await page.evaluate(()=>state.plants.filter(p=>p.type==='rMilitia').map(p=>p.r))).toEqual([0,2,4]);
});

test('duel freezes battle, resolves three rounds and applies outcome once',async({page})=>{
 await openRomance(page);await offerDuel(page);
 await expect(page.locator('#romanceDuelDialog')).toBeVisible();
 const time=await page.evaluate(()=>{tick();return state.time});expect(time).toBe(30000);
 await page.getByRole('button',{name:'接受單挑',exact:true}).click();
 await page.evaluate(()=>{Math.random=()=>.99});
 for(let n=0;n<3;n++)await page.getByRole('button',{name:'強攻',exact:true}).click();
 await expect(page.locator('#romanceDuelStatus')).toHaveText('單挑獲勝！');
 const before=await page.evaluate(()=>state.zombies[0].hp);
 await page.getByRole('button',{name:'返回戰場',exact:true}).click();
 expect(await page.evaluate(()=>({hp:state.zombies[0].hp,paused:state.paused,pending:!!state.romanceDuel}))).toEqual({hp:before*.65,paused:false,pending:false});
 await page.evaluate(()=>advanceRomanceArmy());await expect(page.locator('#romanceDuelDialog')).not.toBeVisible();
});

test('declining duel is harmless; duel and clash resume after refresh',async({page})=>{
 await openRomance(page);await offerDuel(page,4);
 const hp=await page.evaluate(()=>state.zombies[0].hp);
 await page.getByRole('button',{name:'繼續混戰',exact:true}).click();
 expect(await page.evaluate(()=>state.zombies[0].hp)).toBe(hp);
 await offerDuel(page,3);await page.getByRole('button',{name:'接受單挑',exact:true}).click();
 await page.getByRole('button',{name:'格擋',exact:true}).click();
 await page.reload();await page.waitForFunction(()=>authIdentityResolved);
 await expect(page.locator('#romanceDuelDialog')).toBeVisible();
 expect(await page.evaluate(()=>({round:state.romanceDuel.round,season:state.season,paused:state.paused,rule:activeStageRule().id}))).toEqual({round:1,season:3,paused:true,rule:'romance-clash'});
});

test('old routes remain ten stages; chapter remains scoped to its account',async({page})=>{
 await openRomance(page);await page.evaluate(()=>{completeRomanceLevel(1);backToHome()});
 await page.evaluate(()=>showSeasonPicker('plants'));await page.locator('[data-season-choice="1"]').click();
 await expect(page.locator('#levelGrid .level-card')).toHaveCount(10);
 expect(await page.evaluate(()=>({currentSeason,unit:seasonUnitAvailable('plants','zhangfei',1)}))).toEqual({currentSeason:1,unit:false});
 expect(await page.evaluate(()=>{currentUser={id:'another-player'};return romanceProgress().highestLevel})).toBe(0);
});

test('signed-in chapter never starts or claims an original-season cloud match',async({page})=>{
 await openRomance(page);
 const result=await page.evaluate(async()=>{
  currentUser={id:'chapter-user'};let calls=0;initSupabaseClient=()=>({rpc:async()=>{calls++;throw Error('unexpected RPC')}});
  currentSeason=3;selectedLevel=1;start('plants',{difficulty:'medium'});clearInterval(timer);await end(true,'test','test');
  return {calls,completed:romanceProgress().highestLevel,gold:playerProfile.gold};
 });
 expect(result).toEqual({calls:0,completed:1,gold:0});
});
