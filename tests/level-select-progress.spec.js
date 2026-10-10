const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('level select leads with current progress and continues the next mainline stage',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  playerProfile=normalizeProfile({campaignProgress:{plants:{highestLevel:2,completedLevels:{1:1,2:1}}}});
  chooseFaction('plants',1);
 });
 const overview=page.locator('#campaignProgressPanel');
 await expect(overview).toBeVisible();
 await expect(overview).toContainText('已完成 2 / 10');
 await expect(overview).toContainText('下一關');
 await expect(overview).toContainText('第三關');
 await expect(page.locator('#continueCampaignBtn')).toHaveText(/繼續第三關/);
 await expect(page.locator('#levelGrid .level-card').first().locator('.level-card-details')).toBeHidden();
 await expect(page.locator('#levelGrid .level-card').nth(2).locator('.level-start')).toBeVisible();
 await page.locator('#continueCampaignBtn').click();
 await expect(page.locator('#storyDialog')).toHaveAttribute('open','');
 await page.locator('#storySkip').click();
 expect(await page.evaluate(()=>state.level)).toBe(3);
});

test('level details are progressive disclosure and an unfinished battle remains a distinct priority',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  playerProfile=normalizeProfile({});
  currentSeason=1;selectedLevel=1;start('plants');clearInterval(timer);state.time=4321;
  state.waveDirector={version:1,plan:[{after:3,count:2},{after:7,count:3}],index:1,active:{id:2,count:3,sent:1},restUntil:0,story:{version:1,seen:{},event:null}};
  persistBattleState();backToLevelSelect(false);
 });
 const overview=page.locator('#campaignProgressPanel');
 await expect(overview).toContainText('未完成戰局');
 await expect(overview).toContainText('第 2 / 2 波');
 await expect(page.locator('#continueCampaignBtn')).toHaveText(/繼續未完成戰局/);
 await expect(page.locator('#browseLevelsBtn')).toHaveAttribute('aria-expanded','false');
 await expect(page.locator('#levelGrid .level-card').first().locator('.level-card-details')).toBeHidden();
 await page.locator('#browseLevelsBtn').click();
 await expect(page.locator('#browseLevelsBtn')).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('#levelGrid .level-card').first().locator('.level-card-details')).toBeVisible();
 await expect(page.locator('#levelGrid .level-card').first().locator('.difficulty-selector')).toBeVisible();
 await page.locator('#continueCampaignBtn').click();
 expect(await page.evaluate(()=>({level:state.level,time:state.time,active:$('game').classList.contains('active')}))).toEqual({level:1,time:4321,active:true});
});

test('progress track shows previous current and next stage around the recommendation',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  playerProfile=normalizeProfile({campaignProgress:{plants:{highestLevel:2,completedLevels:{1:1,2:1}}}});
  chooseFaction('plants',1);
 });
 const nodes=page.locator('#campaignProgressTrack .campaign-track-node');
 await expect(nodes).toHaveCount(3);
 await expect(nodes.nth(0)).toHaveAttribute('data-state','completed');
 await expect(nodes.nth(0)).toContainText('第二關');
 await expect(nodes.nth(1)).toHaveAttribute('data-state','current');
 await expect(nodes.nth(1)).toContainText('第三關');
 await expect(nodes.nth(2)).toHaveAttribute('data-state','next');
 await expect(nodes.nth(2)).toContainText('第四關');
});

test('progress track keeps three meaningful nodes at the start boundary',async({page})=>{
 await open(page);
 await page.evaluate(()=>chooseFaction('plants',1));
 const nodes=page.locator('#campaignProgressTrack .campaign-track-node');
 await expect(nodes).toHaveCount(3);
 await expect(nodes.nth(0)).toHaveAttribute('data-state','current');
 await expect(nodes.nth(0)).toContainText('第一關');
 await expect(nodes.nth(1)).toContainText('第二關');
 await expect(nodes.nth(2)).toContainText('第三關');
});

test('browse action preserves the single-open accordion contract',async({page})=>{
 await open(page);
 await page.evaluate(()=>chooseFaction('plants',1));
 await expect(page.locator('#browseLevelsBtn')).toHaveText('查看目前關卡與設定');
 await page.locator('#browseLevelsBtn').click();
 await expect(page.locator('#levelGrid .level-card-details:not([hidden])')).toHaveCount(1);
 await expect(page.locator('#levelGrid .level-card').first().locator('.level-card-details')).toBeVisible();
});

test('details behave as an accessible accordion and restore focus when returning from battle',async({page})=>{
 await open(page);
 await page.evaluate(()=>chooseFaction('plants',1));
 const first=page.locator('#levelGrid .level-card').first();
 const second=page.locator('#levelGrid .level-card').nth(1);
 await first.locator('.level-detail-toggle').click();
 await expect(first.locator('.level-card-details')).toBeVisible();
 await second.locator('.level-detail-toggle').click();
 await expect(first.locator('.level-card-details')).toBeHidden();
 await expect(first.locator('.level-detail-toggle')).toHaveAttribute('aria-expanded','false');
 const controls=await second.locator('.level-detail-toggle').getAttribute('aria-controls');
 expect(controls).toBeTruthy();
 await expect(second.locator('.level-card-details')).toHaveAttribute('id',controls);
 await page.evaluate(()=>{selectedLevel=1;start('plants');clearInterval(timer);backToLevelSelect(false)});
 await expect(first.locator('.level-start')).toBeFocused();
});

test('first visit tip appears once and mobile sticky continue appears only after primary action scrolls away',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await open(page);
 await page.evaluate(()=>{localStorage.removeItem('sgZombieLevelSelectTipSeen');chooseFaction('plants',1)});
 await expect(page.locator('#levelSelectTip')).toBeVisible();
 await expect(page.locator('#dismissLevelSelectTip')).toBeFocused();
 await page.locator('#dismissLevelSelectTip').click();
 await expect(page.locator('#levelSelectTip')).toBeHidden();
 await expect(page.locator('#continueCampaignBtn')).toBeFocused();
 await expect(page.locator('#campaignStickyCta')).toBeHidden();
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
 await expect(page.locator('#campaignStickyCta')).toBeVisible();
 await expect(page.locator('#campaignStickyCta button')).toContainText('第一關');
 await page.evaluate(()=>chooseFaction('plants',1));
 await expect(page.locator('#levelSelectTip')).toBeHidden();
 await page.setViewportSize({width:844,height:390});
 await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
 await expect(page.locator('#campaignStickyCta')).toBeVisible();
});

test('season and faction navigation restore focus to the semantic opener',async({page})=>{
 await open(page);
 await page.locator('#plantStartBtn').click();
 await expect(page.locator('[data-season-choice="1"]')).toBeFocused();
 await page.locator('#backFactionBtn').click();
 await expect(page.locator('#plantStartBtn')).toBeFocused();
 await page.locator('#plantStartBtn').click();
 await page.locator('[data-season-choice="1"]').click();
 await page.locator('#backFactionBtn').click();
 await expect(page.locator('[data-season-choice="1"]')).toBeFocused();
});

test('cross-route resume names the saved route and ignores incompatible snapshots',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  playerProfile=normalizeProfile({season2Progress:{zombies:{highestLevel:3,completedLevels:{1:1,2:1,3:1}}}});
  currentSeason=2;selectedLevel=4;start('zombies');clearInterval(timer);state.time=61000;persistBattleState();
  chooseFaction('plants',1);
 });
 await expect(page.locator('#campaignProgressTitle')).toContainText('第二季・僵屍進攻');
 await expect(page.locator('#campaignProgressTitle')).toContainText('第 4 關');
 await page.evaluate(()=>{
  const snapshot=JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY));
  snapshot.version=-1;
  localStorage.setItem(BATTLE_SAVE_KEY,JSON.stringify(snapshot));
  chooseFaction('plants',1);
 });
 await expect(page.locator('#campaignProgressKicker')).toHaveText('下一關');
 await expect(page.locator('#continueCampaignBtn')).not.toContainText('未完成戰局');
});

test('malformed active wave fields are normalized before resume',async({page})=>{
 await open(page);
 const restored=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});currentSeason=1;selectedLevel=1;start('plants');clearInterval(timer);
  state.waveDirector={version:1,plan:[{after:3,count:2},{after:7,count:3}],index:0,active:{id:99,count:-2,sent:999,warnedAt:'bad',nextAt:'bad',rallied:'yes',rows:'bad'},restUntil:'bad',story:{version:1,seen:{},event:null}};
  persistBattleState();backToLevelSelect(false);
  const visible=$('campaignProgressKicker').textContent;
  const ok=restoreBattleIfAvailable();clearInterval(timer);
  const normalized={active:state.waveDirector.active?{...state.waveDirector.active}:null,index:state.waveDirector.index,restUntil:state.waveDirector.restUntil};
  state.paused=false;updateDefenseWaves();clearInterval(timer);
  return {visible,ok,normalized,afterUpdate:{active:state.waveDirector.active,index:state.waveDirector.index,zombies:state.zombies.length}};
 });
 expect(restored.visible).toBe('未完成戰局');
 expect(restored.ok).toBe(true);
 expect(restored.normalized.active).toBeNull();
 expect(restored.normalized.index).toBe(1);
 expect(Number.isFinite(restored.normalized.restUntil)).toBe(true);
 expect(restored.afterUpdate).toEqual({active:null,index:1,zombies:0});
});

test('finished second-season route recommends the unfinished opposite route once',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  const completed={};for(let level=1;level<=10;level++)completed[level]=1;
  playerProfile=normalizeProfile({season2Progress:{plants:{highestLevel:10,completedLevels:completed}}});
  chooseFaction('plants',2);
 });
 await expect(page.locator('#campaignProgressKicker')).toHaveText('下一條戰線');
 await expect(page.locator('#campaignProgressTitle')).toHaveText('第二季・僵屍進攻');
 await expect(page.locator('#campaignProgressPanel .continue-campaign:visible')).toHaveCount(1);
 await page.locator('#continueCampaignBtn').click();
 expect(await page.evaluate(()=>({season:currentSeason,faction:currentFaction}))).toEqual({season:2,faction:'zombies'});
});

test('completion recommendation skips routes that are already finished',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  const ten={},eleven={};for(let level=1;level<=10;level++){ten[level]=1;eleven[level]=1}eleven[11]=1;
  playerProfile=normalizeProfile({campaignProgress:{plants:{highestLevel:10,completedLevels:eleven}},season2Progress:{plants:{highestLevel:10,completedLevels:ten}}});
  chooseFaction('plants',1);
 });
 await expect(page.locator('#campaignProgressTitle')).toHaveText('第一季・僵屍攻城');
 await page.evaluate(()=>{
  const completed={};for(let level=1;level<=10;level++)completed[level]=1;
  playerProfile.campaignProgress.zombies={highestLevel:10,completedLevels:completed};
  chooseFaction('plants',1);
 });
 await expect(page.locator('#campaignProgressTitle')).toHaveText('第二季・僵屍進攻');
 await page.locator('#continueCampaignBtn').click();
 expect(await page.evaluate(()=>({season:currentSeason,faction:currentFaction}))).toEqual({season:2,faction:'zombies'});
});

test('completion recommendation skips unfinished routes that are still locked',async({page})=>{
 await open(page);
 const recommendation=await page.evaluate(()=>{
  const completed={};for(let level=1;level<=10;level++)completed[level]=1;
  playerProfile=normalizeProfile({season2Progress:{plants:{highestLevel:10,completedLevels:completed},zombies:{highestLevel:10,completedLevels:completed}}});
  currentSeason=2;currentFaction='plants';
  const next=campaignCompletionRecommendation();next.action();
  return {title:next.title,season:currentSeason,faction:currentFaction};
 });
 expect(recommendation).toEqual({title:'第一季・三國守城',season:1,faction:'plants'});
});

test('finished first-season defense recommends the canonical second-season route',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  const completed={};for(let level=1;level<=11;level++)completed[level]=1;
  playerProfile=normalizeProfile({campaignProgress:{plants:{highestLevel:10,completedLevels:completed}}});
  chooseFaction('plants',1);
 });
 await expect(page.locator('#campaignProgressKicker')).toHaveText('下一條戰線');
 await expect(page.locator('#campaignProgressTitle')).toContainText('第二季・魏國篇');
 await expect(page.locator('#continueCampaignBtn')).toContainText('前往第二季');
 await page.locator('#continueCampaignBtn').click();
 expect(await page.evaluate(()=>({season:currentSeason,faction:currentFaction}))).toEqual({season:2,faction:'plants'});
});
