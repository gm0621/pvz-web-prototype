const {test,expect}=require('@playwright/test');
async function openGame(page){await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');await expect(page.locator('#start')).toHaveClass(/active/);}
async function chooseFirst(page){await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();await page.locator('[data-jump-level="1"]').click();}
test('attack story keeps the alternate timeline and normal unlock gate',async({page})=>{
 await openGame(page);expect(await page.evaluate(()=>requestCampaignBattle('zombies',1))).toBe(false);
 await page.evaluate(()=>{for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);refreshCampaignUI()});
 await page.locator('#zombieStartBtn').click();await page.locator('[data-season-choice="1"]').click();await page.locator('[data-jump-level="1"]').click();await expect(page.locator('#storyRoute')).toContainText('另一種可能');await expect(page.locator('#storyText')).toContainText('你已看過蜀軍');
 await page.locator('#storySkip').click();expect(await page.evaluate(()=>state.faction)).toBe('zombies');expect(await page.evaluate(()=>isCampaignLevelCompleted('zombies',1))).toBe(false);
});
test('cloud pending waits before its ending; an older saved battle also gets its ending',async({page})=>{
 await openGame(page);await page.evaluate(()=>{selectedLevel=1;start('plants');clearInterval(timer);currentUser={id:'story-test'};claimCloudMatchReward=()=>new Promise(resolve=>window.__resolveStoryClaim=resolve);window.__ending=end(true,'防守成功','測試')});
 await expect(page.locator('#modalTitle')).toHaveText('⏳ 正在確認戰果');await expect(page.locator('#storyDialog')).not.toBeVisible();
 await page.evaluate(async()=>{window.__resolveStoryClaim(true);await window.__ending});await expect(page.locator('#storyDialog')).toBeVisible();
});
test('all ten stages have both routes and every scene renders with real portraits',async({page})=>{
 await openGame(page);
 expect(await page.evaluate(()=>Object.keys(SEASON1_STORY.plants).length)).toBe(10);
 expect(await page.evaluate(()=>Object.keys(SEASON1_STORY.zombies).length)).toBe(10);
 const report=await page.evaluate(async()=>{
  const portraits=new Set(),issues=[];let scenes=0;
  for(const faction of ['plants','zombies'])for(let level=1;level<=10;level++)for(const scene of ['opening','victory','defeat']){
   const data=SEASON1_STORY[faction][level];if(!data[scene]?.length){issues.push(`${faction}/${level}/${scene}`);continue}
   openCampaignStory(faction,level,scene,{replay:true});scenes++;
   for(let i=0;i<activeCampaignStory.lines.length;i++){activeCampaignStory.index=i;renderCampaignStory();const speaker=activeCampaignStory.lines[i].speaker;if(speaker!=='旁白'){const img=document.getElementById('storyPortrait');if(img.hidden)issues.push('missing portrait '+speaker);else portraits.add(img.src)}}
   closeCampaignStory(false);
  }
  await Promise.all([...portraits].map(async src=>{const img=new Image();img.src=src;await img.decode()}));return {scenes,issues};
 });expect(report).toEqual({scenes:60,issues:[]});
});
test('next stage opens its own story and closing it never starts or completes that stage',async({page})=>{
 await openGame(page);await chooseFirst(page);await page.locator('#storySkip').click();await page.evaluate(async()=>{clearInterval(timer);await end(true,'防守成功','結算')});await page.locator('#storySkip').click();
 await page.locator('#modalNext').click();await expect(page.locator('#storyTitle')).toHaveText('第二關：軍糧小徑');await expect(page.locator('#storyDialog')).toBeVisible();
 await page.locator('#storyClose').click();expect(await page.evaluate(()=>({level:state.level,over:state.over,completed:isCampaignLevelCompleted('plants',2)}))).toEqual({level:1,over:true,completed:false});
 await expect(page.locator('#levelScreen')).toHaveClass(/active/);await page.locator('[data-jump-level="2"]').click();await page.locator('#storySkip').click();expect(await page.evaluate(()=>state.level)).toBe(2);
});
test('cloud verification failure cannot play or mark a victory story',async({page})=>{
 await openGame(page);await chooseFirst(page);await page.locator('#storySkip').click();
 await page.evaluate(async()=>{clearInterval(timer);currentUser={id:'story-test'};claimCloudMatchReward=async()=>false;await end(true,'防守成功','測試')});
 await expect(page.locator('#storyDialog')).not.toBeVisible();await expect(page.locator('#modalTitle')).toHaveText('戰果同步失敗');expect(await page.evaluate(()=>hasReadStory('plants',1,'victory'))).toBe(false);
});
test('back and reload cancel unread intros while paused battles resume without replay',async({page})=>{
 await openGame(page);await chooseFirst(page);await page.goBack();await expect(page.locator('#storyDialog')).not.toBeVisible();expect(await page.evaluate(()=>hasReadStory('plants',1,'opening'))).toBe(false);
 await page.evaluate(()=>backToHome());await chooseFirst(page);await page.reload();await expect(page.locator('#storyDialog')).not.toBeVisible();expect(await page.evaluate(()=>!!state&&!state.over)).toBe(false);
 await chooseFirst(page);await page.locator('#storySkip').click();await page.locator('#backBtn').click();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY)).state.time);
 await page.locator('#resumeBattleBtn').click();await expect(page.locator('#storyDialog')).not.toBeVisible();expect(await page.evaluate(()=>({paused:state.paused,time:state.time}))).toEqual({paused:true,time:saved});
});
test('locked scenes cannot be replayed and defeat never advances the campaign',async({page})=>{
 await openGame(page);expect(await page.evaluate(()=>replayCampaignStory('plants',2))).toBe(false);expect(await page.evaluate(()=>replayCampaignStory('plants',1,'victory'))).toBe(false);
 await chooseFirst(page);await page.locator('#storySkip').click();await page.evaluate(async()=>{clearInterval(timer);await end(false,'防守失敗','測試')});await expect(page.locator('#storyText')).toContainText('往城門退');
 await page.locator('#storySkip').click();expect(await page.evaluate(()=>isCampaignLevelCompleted('plants',1))).toBe(false);await page.locator('#modalRestart').click();await expect(page.locator('#storyDialog')).not.toBeVisible();await expect(page.locator('#game')).toHaveClass(/active/);
});
test('verified victory opens its ending and replay never grants rewards or starts a battle',async({page})=>{
 await openGame(page);await chooseFirst(page);await page.locator('#storySkip').click();await page.evaluate(async()=>{clearInterval(timer);await end(true,'防守成功','測試結算')});
 await expect(page.locator('#storyDialog')).toBeVisible();await expect(page.locator('#storyText')).toContainText('鐵盔頭目');
 await page.locator('#storySkip').click();await page.locator('#modalMainMenu').click();
 await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();
 const before=await page.evaluate(()=>JSON.stringify(playerProfile));await page.locator('[data-story-level="1"]').click();await expect(page.locator('#storyReplayTabs')).toBeVisible();
 await page.locator('#storyReplayVictory').click();await expect(page.locator('#storyText')).toContainText('鐵盔頭目');await page.locator('#storySkip').click();
 expect(await page.evaluate(()=>JSON.stringify(playerProfile))).toBe(before);await expect(page.locator('#levelScreen')).toHaveClass(/active/);
 await page.locator('[data-jump-level="1"]').click();await expect(page.locator('#storyDialog')).not.toBeVisible();await expect(page.locator('#game')).toHaveClass(/active/);
});
test('first-season opening blocks simulation and cloud match creation until skipped',async({page})=>{
 await openGame(page);await page.evaluate(()=>{window.__storyStarts=0;startCloudMatch=()=>{window.__storyStarts++}});await chooseFirst(page);
 await expect(page.getByRole('dialog',{name:'第一關：草坪試煉'})).toBeVisible();await expect(page.locator('#storyText')).toContainText('午後');
 expect(await page.evaluate(()=>({starts:window.__storyStarts,playing:!!state&&!state.over&&!state.paused}))).toEqual({starts:0,playing:false});
 await page.locator('#storyNext').click();await expect(page.locator('#storySpeaker')).toHaveText('蜀軍弓兵');await expect(page.locator('#storyPortrait')).toBeVisible();
 await page.locator('#storySkip').click();await expect(page.locator('#storyDialog')).not.toBeVisible();await expect(page.locator('#game')).toHaveClass(/active/);
 expect(await page.evaluate(()=>window.__storyStarts)).toBe(1);expect(await page.evaluate(()=>state.time)).toBeLessThan(2000);
});
