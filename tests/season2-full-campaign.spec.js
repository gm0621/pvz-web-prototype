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

test('every season-two first-play route has a compact danger, mechanic, and goal briefing',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>['plants','zombies'].flatMap(faction=>Array.from({length:10},(_,index)=>{
  const level=index+1,chapter=SEASON2_STORY[faction][level];
  return {faction,level,brief:chapter.openingBrief,opening:chapter.opening};
 })));
 expect(result).toHaveLength(20);
 const keywords={
  plants:[/霜徑.*10 秒/,/推車.*第一次漏怪/,/(?:軍糧.*80|80.*軍糧)/,/中央路糧車/,/視界.*9 秒/,/烽火.*12 秒/,/推車.*第一次漏怪/,/(?:軍糧.*80|80.*軍糧)/,/霜徑.*10 秒/,/視界.*9 秒/],
  zombies:[/破門撞屍/,/不同路線/,/標出.*路線/,/箭塔.*倒數/,/破門撞屍/,/不同路線/,/標出.*路線/,/箭塔.*倒數/,/不同路線/,/破門撞屍/]
 };
 for(const route of result){
  expect(route.brief).toHaveLength(3);
  route.brief.forEach(line=>{expect(line.speaker).toBeTruthy();expect(line.text.length).toBeGreaterThan(10)});
  expect(route.brief[0]).toEqual(route.opening[0]);
  expect(route.brief[1].speaker).toBe('戰術提示');expect(route.brief[1].text).toMatch(keywords[route.faction][route.level-1]);
  expect(route.brief[2].speaker).toBe('本關目標');
  expect(route.brief[2].text).toMatch(/守住|擊敗|保護|突破|摧毀|拆掉|奪得|完成/);
 }
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

test('all season-two stage cards visibly render their accepted art',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  completeCampaignLevel('plants',1,1);
  chooseFaction('plants',2);setCampaignDetailsExpanded(true);
  const rows=[];
  for(let level=1;level<=10;level++){
   const card=document.querySelector(`[data-jump-level="${level}"]`).closest('.level-card'),art=card.querySelector('.level-art'),src=SEASON2_LEVELS[level].cardArt,image=new Image();
   image.src=src;await image.decode();
   rows.push({level,src,background:getComputedStyle(art).backgroundImage,visible:art.getBoundingClientRect().height>0,directChild:art.parentElement===card,width:image.naturalWidth,height:image.naturalHeight});
  }
  return rows;
 });
 expect(result).toHaveLength(10);
 result.forEach((item,index)=>{
  expect(item.src).toContain(`s2-${String(index+1).padStart(2,'0')}.webp`);
  expect(item.background).toContain(`s2-${String(index+1).padStart(2,'0')}.webp`);
  expect(item.visible).toBe(true);expect(item.directChild).toBe(true);
  expect(item.width).toBeGreaterThan(1000);expect(item.height).toBeGreaterThan(500);
 });
});

test('a first clear shows a celebratory character unlock reveal with skill, replay does not',async({page})=>{
  await open(page);await page.evaluate(()=>{chooseFaction('plants',2);completeCampaignLevel('plants',1,2);completeCampaignLevel('plants',2,2);markStoryRead('plants',3,'opening',2);selectedLevel=3;start('plants');clearInterval(timer)});
  await page.evaluate(async()=>{await end(true,'勝利','fixture')});
  await expect(page.locator('#unlockReveal')).toBeVisible();await expect(page.locator('#unlockReveal')).toContainText('恭喜解鎖');await expect(page.locator('#unlockReveal')).toContainText('夏侯惇');await expect(page.locator('#unlockReveal')).toContainText('拔矢不屈');await expect(page.locator('#unlockReveal img')).toHaveAttribute('src',/xiahou-dun\.webp/);
  await expect(page.locator('#unlockReveal .unlock-demo-board svg')).toBeVisible();await expect(page.locator('#unlockReveal .unlock-demo-replay')).toBeVisible();await expect(page.locator('#unlockReveal .unlock-demo-detail')).toBeVisible();
  await page.locator('#unlockReveal .unlock-demo-detail').click();await expect(page.locator('#charModal')).toBeVisible();
  await expect(page.locator('#modal')).toBeVisible();
  await page.locator('#charModalClose').click();await expect(page.locator('#charModal')).not.toBeVisible();
  await expect(page.locator('#modal')).toBeVisible();
  await page.evaluate(()=>{backToLevelSelect();markStoryRead('plants',3,'opening',2);selectedLevel=3;start('plants');clearInterval(timer)});await page.evaluate(async()=>{await end(true,'勝利','fixture')});
  await expect(page.locator('#unlockReveal')).toHaveCount(0);
});

test('final Wei first clear immediately shows Cao Cao unlock above the fold',async({page})=>{
 await open(page);
 await page.evaluate(()=>{
  chooseFaction('plants',2);
  for(let level=1;level<10;level++)completeCampaignLevel('plants',level,2);
  markStoryRead('plants',10,'opening',2);
  selectedLevel=10;start('plants');clearInterval(timer);
 });
 await page.evaluate(async()=>{await end(true,'勝利','fixture')});
 const reveal=page.locator('#unlockReveal');
 await expect(reveal).toBeVisible();
 await expect(reveal).toContainText('恭喜解鎖');
 await expect(reveal).toContainText('曹操');
 await expect(reveal.locator('img')).toHaveAttribute('src',/cao-cao(?:\/idle)?\.webp/);
 const geometry=await reveal.evaluate(element=>{const rect=element.getBoundingClientRect();return {top:rect.top,bottom:rect.bottom,viewport:innerHeight,scrollTop:element.closest('.modal-card')?.scrollTop||0}});
 expect(geometry.top).toBeGreaterThanOrEqual(0);
 expect(geometry.top).toBeLessThan(geometry.viewport);
 expect(geometry.bottom).toBeGreaterThan(0);
 expect(geometry.scrollTop).toBe(0);
});

test('first-season unlocks also show an immediate ability demonstration',async({page})=>{
 await open(page);await page.evaluate(()=>{chooseFaction('plants',1);for(let level=1;level<5;level++)completeCampaignLevel('plants',level,1);markStoryRead('plants',5,'opening',1);selectedLevel=5;start('plants');clearInterval(timer)});
 await page.evaluate(async()=>{await end(true,'勝利','fixture')});
 await expect(page.locator('#unlockReveal')).toContainText('黃忠');
 await expect(page.locator('#unlockReveal .unlock-demo-board svg')).toBeVisible();
 await expect(page.locator('#unlockReveal .unlock-demo-status')).toContainText('天賦');
});

test('season-two selector and preview state the complete campaign is playable',async({page})=>{
  await open(page);await page.evaluate(()=>{completeCampaignLevel('plants',1,1);backToHome();updateProgressUI()});await page.locator('#plantStartBtn').click();await expect(page.locator('[data-season-choice="2"] .season-status')).toContainText('十關已開放');await page.locator('[data-season-choice="2"]').click();await expect(page.locator('#chosenFactionText')).toContainText('第二季・魏國守城');await expect(page.locator('#campaignProgressPanel')).toContainText('已完成 0 / 10');
  await page.goto('/season2.html');await expect(page.locator('#previewNotice')).toContainText('全十關已開放遊玩');await expect(page.locator('.play-stage-link')).toHaveCount(10);
});
