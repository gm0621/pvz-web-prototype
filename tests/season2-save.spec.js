const {test,expect}=require('@playwright/test');
async function open(page){await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');await page.evaluate(()=>{for(const f of ['plants','zombies'])markStoryRead(f,1,'opening',2)})}
test('season-two rewards survive reload and unlock only same-route stage two',async({page})=>{
 await open(page);await page.evaluate(async()=>{chooseFaction('plants',2);startLevel('plants',1);state.usedUnits.plants.s2Crossbow=1;await end(true,'勝利','');});
 await expect(page.locator('#modalText')).toContainText('大盾兵');await expect(page.locator('#modalNext')).not.toContainText('全破');
 const progress=await page.evaluate(()=>({first:playerProfile.campaignProgress,second:playerProfile.season2Progress,gold:playerProfile.gold,char:playerProfile.characterLevels.plants.s2Crossbow}));
 expect(progress.first.plants.highestLevel).toBe(0);expect(progress.second.plants.highestLevel).toBe(1);expect(progress.second.zombies.highestLevel).toBe(0);expect(progress.gold).toBeGreaterThan(0);expect(progress.char.xp).toBeGreaterThan(0);
 await page.reload();await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="2"]').click();await page.locator('[data-jump-level="1"]').click();
 await expect(page.locator('#cards [data-key="s2Shield"]')).toBeVisible();expect(await page.evaluate(()=>playerProfile.characterLevels.plants.s2Crossbow)).toEqual(progress.char);
 expect(await page.evaluate(()=>isCampaignLevelUnlocked('plants',2))).toBe(true);
 await page.evaluate(()=>backToHome());await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();await page.locator('[data-jump-level="1"]').click();
 await expect(page.locator('#storyDialog')).toBeVisible();await page.locator('#storySkip').click();
 await expect(page.locator('#cards [data-key^="s2"]')).toHaveCount(0);expect(await page.evaluate(()=>state.season)).toBe(1);
});
test('refresh restores the correct second-season battle and talent state, paused',async({page})=>{
 await open(page);await page.evaluate(()=>{chooseFaction('zombies',2);startLevel('zombies',1);clearInterval(timer);const z=addZombie('s2Coffin',6,2);z.shieldHp=33;state.time=17000;pauseAndSaveBattle();});
 await page.reload();await expect(page.locator('#game')).toHaveClass(/active/);
 expect(await page.evaluate(()=>({season:state.season,name:state.levelConfig.shortName,paused:state.paused,shield:state.zombies.find(z=>z.type==='s2Coffin').shieldHp,time:state.time}))).toEqual({season:2,name:'霜土前哨',paused:true,shield:33,time:17000});
 await expect(page.locator('#cards .name')).toHaveText(['鼠牙群屍','腐釘弩屍']);await expect(page.locator('#game')).toHaveClass(/season2-battle/);
});
