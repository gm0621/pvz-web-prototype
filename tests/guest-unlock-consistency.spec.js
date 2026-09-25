const {test,expect}=require('@playwright/test');

async function openGuest(page,{gap=false,final=true}={}){
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
 await page.goto(process.env.GAME_URL||'/');
 await page.evaluate(({gap,final})=>{
  currentUser=null;currentSeason=1;playerProfile=defaultProfile();
  for(let n=1;n<=(final?10:8);n++)completeCampaignLevel('plants',n,1);
  if(gap){delete playerProfile.campaignProgress.plants.completedLevels[4];delete playerProfile.campaignProgress.plants.completedLevels[5];}
  playerProfile=normalizeProfile(playerProfile);saveProfile(false,false);
 },{gap,final});
}

test('guest recorded final clear opens first-season attack without inventing missing clears',async({page})=>{
 await openGuest(page,{gap:true});
 await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();
 await expect(page.locator('#levelGrid .level-card').nth(9)).toContainText('已通關');
 await page.evaluate(()=>backToHome());
 await page.locator('#zombieStartBtn').click();
 await expect(page.locator('[data-season-choice="1"]')).toBeEnabled();
 await page.locator('[data-season-choice="1"]').click();
 await page.locator('[data-jump-level="1"]').click();await page.locator('#storySkip').click();
 await expect(page.locator('#game')).toHaveClass(/active/);
 expect(await page.evaluate(()=>({season:state.season,faction:state.faction,level:state.level}))).toEqual({season:1,faction:'zombies',level:1});
 await page.reload();
 expect(await page.evaluate(()=>({unlocked:isCampaignFactionUnlocked('zombies',1),gap4:isCampaignLevelCompleted('plants',4,1),gap5:isCampaignLevelCompleted('plants',5,1),frontier:campaignSideProgress('plants',1).highestLevel}))).toEqual({unlocked:true,gap4:false,gap5:false,frontier:3});
});

test('sparse guest final victory CTA starts attack and keeps unearned zombie characters locked',async({page})=>{
 await openGuest(page,{gap:true,final:false});
 await page.evaluate(()=>{completeCampaignLevel('plants',9,1);saveProfile(false,false);markStoryRead('plants',10,'opening')});
 await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();
 await page.locator('[data-jump-level="10"]').click();
 await page.evaluate(()=>{clearInterval(timer);end(true,'防守成功！','隔離結算流程測試')});
 await expect(page.locator('#modalNext')).toBeEnabled();
 await expect(page.locator('#modalNext')).toContainText('開始攻城');
 await page.locator('#modalNext').click();await page.locator('#storySkip').click();
 await expect(page.locator('#game')).toHaveClass(/active/);
 expect(await page.evaluate(()=>({faction:state.faction,level:state.level,final:isCampaignLevelCompleted('plants',10,1),missing:isCampaignLevelCompleted('plants',5,1)}))).toEqual({faction:'zombies',level:1,final:true,missing:false});
 await page.evaluate(()=>backToHome());await page.locator('#charactersBtn').click();await page.locator('[data-roster="zombies"]').click();
 const actual=await page.evaluate(()=>Object.keys(UNLOCK_LEVEL.zombies).filter(k=>!ZOMBIE_TYPES[k].hidden).map(k=>({key:k,unlocked:isCharacterGuideUnlocked('zombies',k),expected:UNLOCK_LEVEL.zombies[k]===1&&!isFinalRewardUnit('zombies',k)})));
 for(const row of actual)expect(row.unlocked,row.key).toBe(row.expected);
 await expect(page.locator('#characterGrid .type-necromancer')).toHaveClass(/locked/);
});

test('guest guide lights characters available in later completed stages despite legacy gaps',async({page},testInfo)=>{
 await openGuest(page,{gap:true});await page.locator('#charactersBtn').click();
 await expect(page.locator('#characterGrid .char-profile')).not.toHaveCount(0);
 await expect(page.locator('#characterGrid .locked')).toHaveCount(0);
 expect(await page.locator('#characterGrid .char-profile img').evaluateAll(imgs=>imgs.every(i=>getComputedStyle(i).filter==='none'))).toBe(true);
 await page.screenshot({path:testInfo.outputPath('guest-shu-unlocked.png'),fullPage:true});
});

test('first-season guide remains unlocked after navigating second season, including final reward',async({page})=>{
 await openGuest(page);
 await page.evaluate(()=>{for(let n=1;n<=10;n++)completeCampaignLevel('zombies',n,1);saveProfile(false,false)});
 await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="2"]').click();
 await page.evaluate(()=>backToHome());await page.locator('#charactersBtn').click();
 await expect(page.locator('#characterGrid .locked')).toHaveCount(0);
 await page.locator('[data-roster="zombies"]').click();
 await expect(page.locator('#characterGrid .locked')).toHaveCount(0);
 await expect(page.locator('#characterGrid .type-necromancer .unlock-badge')).toContainText('已解鎖');
});

test('guest compatibility preserves fresh, unfinished, authenticated and future-season gates without mutations',async({page})=>{
 await openGuest(page,{gap:true,final:false});
 const actual=await page.evaluate(()=>{
  const before=JSON.stringify(playerProfile);
  const unfinished={attack:isCampaignFactionUnlocked('zombies',1),next:isCampaignLevelUnlocked('plants',9,1),ten:isCampaignLevelUnlocked('plants',10,1),future:isCampaignLevelUnlocked('plants',3,2),reward:isCharacterGuideUnlocked('zombies','necromancer')};
  const untouched=before===JSON.stringify(playerProfile);
  playerProfile.campaignProgress.plants.completedLevels[10]=1;currentUser={id:'isolated-auth-fixture'};
  const authAttack=isCampaignFactionUnlocked('zombies',1);
  currentUser=null;playerProfile=defaultProfile();
  const fresh={attack:isCampaignFactionUnlocked('zombies',1),ten:isCampaignLevelUnlocked('plants',10,1),reward:isCharacterGuideUnlocked('zombies','necromancer')};
  return {unfinished,untouched,authAttack,fresh};
 });
 expect(actual).toEqual({unfinished:{attack:false,next:true,ten:false,future:false,reward:false},untouched:true,authAttack:false,fresh:{attack:false,ten:false,reward:false}});
});
