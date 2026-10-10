const {test,expect}=require('@playwright/test');
async function open(page){await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');}

for(const faction of ['plants','zombies'])test(`season two ${faction} unlocks and starts all ten stages in order`,async({page})=>{
  await open(page);
  const result=await page.evaluate(faction=>{
    chooseFaction(faction,2);
    const started=[];
    for(let level=1;level<=10;level++){
      if(!isCampaignLevelUnlocked(faction,level,2))return {error:`level ${level} locked`,started};
      markStoryRead(faction,level,'opening',2);
      selectedLevel=level;start(faction);clearInterval(timer);
      started.push({level:state.level,name:state.levelConfig.shortName,cards:[...document.querySelectorAll('#cards .name')].map(x=>x.textContent),enemies:state.levelConfig.enemyCount,boss:state.levelConfig.bossType});
      state.over=false;completeCampaignLevel(faction,level,2);
    }
    return {started,highest:campaignSideProgress(faction,2).highestLevel};
  },faction);
  expect(result.error).toBeUndefined();expect(result.highest).toBe(10);expect(result.started).toHaveLength(10);
  result.started.forEach((stage,i)=>{expect(stage.level).toBe(i+1);expect(stage.name).toBeTruthy();expect(stage.cards).toHaveLength(i+2);expect(stage.enemies).toBeGreaterThanOrEqual(14);expect(stage.boss).toMatch(/^s2/)});
});

test('stages three to ten carry distinct story, difficulty and battle data',async({page})=>{
  await open(page);
  const data=await page.evaluate(()=>Array.from({length:8},(_,i)=>i+3).map(level=>({
    level,name:SEASON2_LEVELS[level]?.shortName,difficulty:SEASON2_LEVELS[level]?.difficulty,
    art:SEASON2_LEVELS[level]?.cardArt,plantHint:SEASON2_LEVELS[level]?.plantHint,zombieHint:SEASON2_LEVELS[level]?.zombieHint,
    plantStory:SEASON2_STORY.plants[level],zombieStory:SEASON2_STORY.zombies[level]
  })));
  for(const row of data){expect(row.name).toBeTruthy();expect(row.difficulty).toBeTruthy();expect(row.art).toMatch(new RegExp(`s2-${String(row.level).padStart(2,'0')}\\.webp`));expect(row.plantHint.length).toBeGreaterThan(12);expect(row.zombieHint.length).toBeGreaterThan(12);for(const story of [row.plantStory,row.zombieStory]){expect(story.opening.length).toBeGreaterThanOrEqual(3);expect(story.victory.length).toBeGreaterThanOrEqual(2);expect(story.defeat.length).toBeGreaterThanOrEqual(2)}}
  expect(new Set(data.map(x=>x.difficulty)).size).toBeGreaterThanOrEqual(3);
});

test('a first clear shows a celebratory character unlock reveal with skill, replay does not',async({page})=>{
  await open(page);await page.evaluate(()=>{chooseFaction('plants',2);completeCampaignLevel('plants',1,2);completeCampaignLevel('plants',2,2);markStoryRead('plants',3,'opening',2);selectedLevel=3;start('plants');clearInterval(timer)});
  await page.evaluate(async()=>{await end(true,'勝利','fixture')});
  await expect(page.locator('#unlockReveal')).toBeVisible();await expect(page.locator('#unlockReveal')).toContainText('恭喜解鎖');await expect(page.locator('#unlockReveal')).toContainText('夏侯惇');await expect(page.locator('#unlockReveal')).toContainText('拔矢不屈');await expect(page.locator('#unlockReveal img')).toHaveAttribute('src',/xiahou-dun\.webp/);
  await expect(page.locator('#unlockReveal .unlock-demo-board svg')).toBeVisible();await expect(page.locator('#unlockReveal .unlock-demo-replay')).toBeVisible();await expect(page.locator('#unlockReveal .unlock-demo-detail')).toBeVisible();
  await page.evaluate(()=>{backToLevelSelect();markStoryRead('plants',3,'opening',2);selectedLevel=3;start('plants');clearInterval(timer)});await page.evaluate(async()=>{await end(true,'勝利','fixture')});
  await expect(page.locator('#unlockReveal')).toHaveCount(0);
});

test('first-season unlocks also show an immediate ability demonstration',async({page})=>{
 await open(page);await page.evaluate(()=>{chooseFaction('plants',1);for(let level=1;level<5;level++)completeCampaignLevel('plants',level,1);markStoryRead('plants',5,'opening',1);selectedLevel=5;start('plants');clearInterval(timer)});
 await page.evaluate(async()=>{await end(true,'勝利','fixture')});
 await expect(page.locator('#unlockReveal')).toContainText('黃忠');
 await expect(page.locator('#unlockReveal .unlock-demo-board svg')).toBeVisible();
 await expect(page.locator('#unlockReveal .unlock-demo-status')).toContainText('天賦');
});

test('season-two selector and preview state the complete campaign is playable',async({page})=>{
  await open(page);await page.locator('#plantStartBtn').click();await expect(page.locator('[data-season-choice="2"] .season-status')).toContainText('十關已開放');await page.locator('[data-season-choice="2"]').click();await expect(page.locator('#chosenFactionText')).toContainText('第二季・魏國守城');await expect(page.locator('#campaignProgressPanel')).toContainText('已完成 0 / 10');
  await page.goto('/season2.html');await expect(page.locator('#previewNotice')).toContainText('全十關已開放遊玩');await expect(page.locator('.play-stage-link')).toHaveCount(10);
});
