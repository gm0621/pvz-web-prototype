const {openZombieHome}=require('./support/home-navigation');
const {test,expect}=require('@playwright/test');
async function savedBattle(page){
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 await page.goto('/');
 await page.evaluate(()=>{
  currentUser=null;playerProfile=defaultProfile();completeCampaignLevel('plants',1,1);playerProfile.gold=321;saveProfile();
  currentSeason=1;currentFaction='plants';selectedLevel=1;start('plants');clearInterval(timer);cancelBattleLesson();state.tutorial=null;
  state.time=12345;state.resource=234;backToHome();setHomeMode('zombies');
 });
}

test('reload and repeated auth completion stay on the menu until resume is clicked',async({page})=>{
 await savedBattle(page);
 for(let attempt=0;attempt<2;attempt++){
  await page.reload();
  await expect(page.locator('#start')).toHaveClass(/active/);await expect(page.locator('#game')).not.toHaveClass(/active/);
  await openZombieHome(page);await expect(page.locator('#resumeBattleBtn')).toBeVisible();
  await page.evaluate(()=>{finalizeBattleIdentity(true);finalizeBattleIdentity(true)});
  await expect(page.locator('#start')).toHaveClass(/active/);await expect(page.locator('#pauseOverlay')).not.toBeVisible();
 }
 await page.locator('#resumeBattleBtn').click();
 await expect(page.locator('#game')).toHaveClass(/active/);
 expect(await page.evaluate(()=>({time:state.time,resource:state.resource,paused:state.paused}))).toEqual({time:12345,resource:234,paused:true});
});

test('discard can be cancelled and confirmed without changing campaign progress or rewards',async({page})=>{
 await savedBattle(page);
 const before=await page.evaluate(()=>({profile:JSON.stringify(playerProfile),saved:localStorage.getItem(battleSaveStorageKey())}));
 await page.locator('#discardBattleBtn').click();await expect(page.locator('#confirmDialog')).toHaveClass(/show/);
 await page.locator('#confirmDialogCancel').click();
 expect(await page.evaluate(()=>localStorage.getItem(battleSaveStorageKey()))).toBe(before.saved);await expect(page.locator('#resumeBattleBtn')).toBeVisible();
 await page.locator('#discardBattleBtn').click();await page.locator('#confirmDialogConfirm').click();
 await expect(page.locator('#resumeBattleCard')).toBeHidden();
 expect(await page.evaluate(()=>({profile:JSON.stringify(playerProfile),saved:localStorage.getItem(battleSaveStorageKey()),state:state==null,resaved:pauseAndSaveBattle('background')}))).toEqual({profile:before.profile,saved:null,state:true,resaved:false});
 await page.reload();await expect(page.locator('#start')).toHaveClass(/active/);await expect(page.locator('#resumeBattleCard')).toBeHidden();
});

test('discard from level select restores the next-stage recommendation',async({page})=>{
 await savedBattle(page);await page.evaluate(()=>chooseFaction('plants',1));
 await expect(page.locator('#continueCampaignBtn')).toContainText('繼續未完成戰局');
 await page.locator('#discardBattleLevelBtn').click();await page.locator('#confirmDialogConfirm').click();
 await expect(page.locator('#continueCampaignBtn')).toHaveText('繼續第二關 ▶');await expect(page.locator('#discardBattleLevelBtn')).toBeHidden();
 await expect(page.locator('#levelScreen')).toHaveClass(/active/);
});

test('stale discard confirmation cannot delete a newer snapshot or another account save',async({page})=>{
 await savedBattle(page);
 await page.locator('#discardBattleBtn').click();
 const newer=await page.evaluate(()=>{const key=battleSaveStorageKey(),snapshot=JSON.parse(localStorage.getItem(key));snapshot.state.time=99999;const value=JSON.stringify(snapshot);localStorage.setItem(key,value);return value});
 await page.locator('#confirmDialogConfirm').click();
 expect(await page.evaluate(()=>localStorage.getItem(battleSaveStorageKey()))).toBe(newer);
 await page.locator('#discardBattleBtn').click();
 const accountKey=await page.evaluate(()=>{currentUser={id:'different-account'};const key=battleSaveStorageKey();localStorage.setItem(key,'another-account-save');return key});
 await page.locator('#confirmDialogConfirm').click();
 expect(await page.evaluate(key=>localStorage.getItem(key),accountKey)).toBe('another-account-save');
 expect(await page.evaluate(()=>{currentUser=null;return localStorage.getItem(battleSaveStorageKey())})).toBe(newer);
});

test('both resume actions fit the menu on desktop and mobile',async({page},testInfo)=>{
 await savedBattle(page);
 for(const id of ['resumeBattleBtn','discardBattleBtn']){
  const button=page.locator('#'+id);await button.scrollIntoViewIfNeeded();await expect(button).toBeInViewport();
  const b=await button.boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));expect(b.height).toBeGreaterThanOrEqual(44);
 }
 const overlap=await page.evaluate(()=>{const a=$('resumeBattleBtn').getBoundingClientRect(),b=$('discardBattleBtn').getBoundingClientRect();return a.right>b.left&&a.left<b.right&&a.bottom>b.top&&a.top<b.bottom});expect(overlap).toBe(false);
 await page.screenshot({path:testInfo.outputPath('manual-resume-menu.png'),fullPage:true});
});

test('choosing romance does not redirect to a saved zombie campaign',async({page})=>{
 await savedBattle(page);
 const before=await page.evaluate(()=>localStorage.getItem(battleSaveStorageKey()));
 await page.locator('#homeModeBackBtn').click();await page.locator('#romanceStartBtn').click();
 await expect(page.locator('#campaignHeading')).toHaveText('第一章・桃園結義');
 await expect(page.locator('#continueCampaignBtn')).toHaveText('繼續故事 ▶');await expect(page.locator('#discardBattleLevelBtn')).toBeHidden();
 expect(await page.evaluate(()=>localStorage.getItem(battleSaveStorageKey()))).toBe(before);
});

test('romance battle resumes only on request and discard retains chapter completion',async({page})=>{
 await savedBattle(page);
 await page.evaluate(()=>{
  completeRomanceLevel(1);currentSeason=3;currentFaction='plants';selectedLevel=2;start('plants');clearInterval(timer);cancelBattleLesson();state.tutorial=null;state.time=6789;backToHome();
 });
 await page.reload();await expect(page.locator('#start')).toHaveClass(/active/);await expect(page.locator('#game')).not.toHaveClass(/active/);
 await page.locator('#romanceStartBtn').click();await expect(page.locator('#continueCampaignBtn')).toContainText('繼續未完成戰局');
 await page.locator('#continueCampaignBtn').click();
 expect(await page.evaluate(()=>({season:state.season,level:state.level,time:state.time,paused:state.paused}))).toEqual({season:3,level:2,time:6789,paused:true});
 await page.locator('#gameFloatBackBtn').click();await page.locator('#discardBattleLevelBtn').click();await page.locator('#confirmDialogConfirm').click();
 await expect(page.locator('#continueCampaignBtn')).toHaveText('繼續故事 ▶');await expect(page.locator('#discardBattleLevelBtn')).toBeHidden();
 expect(await page.evaluate(()=>({highest:romanceProgress().highestLevel,gold:playerProfile.gold,saved:localStorage.getItem(battleSaveStorageKey())}))).toEqual({highest:1,gold:321,saved:null});
});
