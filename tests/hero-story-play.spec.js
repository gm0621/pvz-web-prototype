const {test,expect}=require('@playwright/test');
test('optional story choices give hints, celebrate discovery, reset and allow skipping',async({page},info)=>{
 await page.goto('/hero/');await page.locator('#startBtn').click();await page.locator('#novelQuiz').click();
 await expect(page.locator('#taskKind')).toHaveText('演義故事');
 await page.locator('.story-choice').nth(2).click();await expect(page.locator('#taskFeedback')).toContainText('再想想');
 await page.locator('.story-choice').nth(0).click();await expect(page.locator('#storyTask')).toHaveAttribute('data-solved','true');await expect(page.locator('#taskFeedback')).toContainText('張飛');
 await page.screenshot({path:info.outputPath('story-choice.png')});
 await page.locator('#prologueContinue').click();await expect(page.locator('.scene-dialogue')).toBeVisible();
 await page.locator('#story [data-home]').click();await page.locator('#startBtn').click();await page.locator('#novelQuiz').click();await expect(page.locator('#storyTask')).toHaveAttribute('data-solved','false');await page.locator('#storySkip').click();await expect(page.locator('#field')).toBeVisible();
});
test('every chapter task has a distinct scenario and classification',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({version:1,completed:10})));
 await page.goto('/hero/');
 for(let i=0;i<10;i++){
  await page.locator('#chapterPicker').evaluate(e=>e.open=true);await page.locator(`#chapterTabs button[data-chapter="${i<6?1:2}"]`).click();await page.locator('#chapterDots button').nth(i).click();await page.locator('#novelQuiz').click();await expect(page.locator('#taskChoices button')).toHaveCount(3);await expect(page.locator('#taskKind')).toHaveText(/歷史記載|演義故事|遊戲想像/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#story [data-home]').click();
 }
});
for(const level of [7,8,9,10])test(`chapter ${level} has unique counter poses and dialogue`,async({page},info)=>{
 await page.goto('/hero/');
 const result=await page.evaluate(async level=>{
  const e=await import('/hero/engine.mjs?v=boss-cutin-1'),v=await import('/hero/duel-view.mjs?v=boss-cutin-1'),{STAGES}=await import('/hero/story.mjs?v=boss-cutin-1');
  const s=STAGES[level-1],b=e.createBattle(level);b.nextSpawn=Infinity;e.deploy(b,s.duelHero,1);b.enemies.push({id:90,lane:1,x:.17,hp:40,maxHp:300,boss:true,name:s.bossName});e.stepBattle(b,.1);b.duel.elapsed=5.4;document.getElementById('duelDialog').showModal();v.renderDuel(b);window.fixture={b,e,v};
  const portrait=new Image();portrait.src='/hero/'+s.bossArt;await portrait.decode();const pc=document.createElement('canvas');pc.width=portrait.width;pc.height=portrait.height;const pctx=pc.getContext('2d');pctx.drawImage(portrait,0,0);if(pctx.getImageData(0,0,1,1).data[3]!==0)throw new Error('Portrait is not transparent');
  const image=new Image();image.src=`/hero/assets/attacks/${s.duelSheet}`;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;let clear=0;for(let i=3;i<data.length;i+=4)if(data[i]<20)clear++;return {name:s.bossName,sheet:s.duelSheet,clear:clear/(data.length/4),ratio:image.width/image.height};
 },level);
 await expect(page.locator('#duelEnemyLine')).toContainText(result.name);await expect(page.locator('#duelEnemySprite')).toHaveAttribute('data-frame','2');expect(result.ratio).toBe(3);expect(result.clear).toBeGreaterThan(.1);
 await page.screenshot({path:info.outputPath(`boss-${level}.png`)});
 if(level===10){await page.evaluate(()=>{const {b,v}=window.fixture;b.duel.elapsed=17.3;v.renderDuel(b)});await expect(page.locator('#duelCaption')).toContainText('退走');await expect(page.locator('#duelOutcomeNote')).not.toContainText('斬殺')}
});

