const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function data(file,key){return vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8')+';'+key)}
test('mainline has a cause, a goal for every chapter, connected outcomes and a resolved motive',()=>{
 const s=data('js/season1-story-data.js','SEASON1_STORY');
 const text=lines=>lines.map(x=>x.text).join('\n');
 expect(text(s.plants[1].opening)).toMatch(/古戰場/);
 expect(text(s.plants[1].opening)).toMatch(/甦醒/);
 for(const side of ['plants','zombies'])for(let level=1;level<=10;level++){
  const chapter=s[side][level];expect(chapter.goal).toBeTruthy();expect(text(chapter.opening)).toContain(chapter.goal);
  for(const scene of ['opening','victory','defeat']){
   expect(chapter[scene].length).toBeGreaterThan(0);
   for(const line of chapter[scene]){expect(line.speaker).toBeTruthy();expect(line.text.length).toBeLessThanOrEqual(125)}
  }
  if(level<10){expect(chapter.lead).toBeTruthy();expect(text(chapter.victory)).toContain(chapter.lead);expect(text(s[side][level+1].opening)).toContain(chapter.lead)}
 }
 expect(text(s.plants[10].opening)).toMatch(/官道/);expect(text(s.plants[10].opening)).toMatch(/魂火/);
 expect(text(s.plants[10].victory)).toMatch(/鈴聲.*停止/);
 expect(text(s.plants[10].victory)).toMatch(/北運.*棺車/);
 expect(text(s.zombies[1].opening)).toMatch(/另一種/);
 expect(text(s.zombies[10].victory)).toMatch(/不是你的祭品/);
 const s2=data('js/season2-story-data.js','SEASON2_STORY');
 expect(Object.keys(s2.plants)).toEqual(['1','2']);expect(Object.keys(s2.zombies)).toEqual(['1','2']);
 expect(text(s2.plants[1].opening)).toMatch(/蜀地.*急報/);
 expect(text(s2.plants[1].opening)).toMatch(/棺車/);
 expect(text(s2.zombies[1].opening)).toMatch(/另一種可能/);
});
test('new prologue is readable, prev/close/replay are safe, and reading to the end starts exactly once',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');await expect(page.locator('#start')).toHaveClass(/active/);
 await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();
 const profile=await page.evaluate(()=>JSON.stringify(playerProfile));
 await page.locator('[data-story-level="1"]').click();await expect(page.locator('#storyText')).toContainText('古戰場');
 await page.locator('#storyNext').click();await page.locator('#storyPrev').click();await expect(page.locator('#storyText')).toContainText('古戰場');
 await page.locator('#storyClose').click();expect(await page.evaluate(()=>JSON.stringify(playerProfile))).toBe(profile);
 expect(await page.evaluate(()=>hasReadStory('plants',1,'opening'))).toBe(false);
 await page.evaluate(()=>{window.__mainlineStarts=0;startCloudMatch=()=>{window.__mainlineStarts++}});
 await page.locator('[data-jump-level="1"]').click();
 const length=await page.evaluate(()=>activeCampaignStory.lines.length);
 for(let i=0;i<length;i++){
  expect(await page.evaluate(()=>window.__mainlineStarts)).toBe(0);
  await expect(page.locator('#storyNext')).toBeInViewport();await expect(page.locator('#storyText')).not.toBeEmpty();
  await page.locator('#storyNext').click();
 }
 await expect(page.locator('#game')).toHaveClass(/active/);expect(await page.evaluate(()=>window.__mainlineStarts)).toBe(1);
 expect(await page.evaluate(()=>isCampaignLevelCompleted('plants',1))).toBe(false);
});
test('all revised dialogue fits desktop/mobile and short landscape with reachable actions',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');await expect(page.locator('#start')).toHaveClass(/active/);
 await page.evaluate(()=>document.fonts.ready);
 for(const landscape of [false,true]){
  if(landscape)await page.setViewportSize({width:844,height:390});
  const issues=await page.evaluate(()=>{
   const out=[];
   for(const season of [1,2])for(const side of ['plants','zombies'])for(const [level,c] of Object.entries(campaignStoryData(season)[side]))for(const scene of ['opening','victory','defeat']){
    openCampaignStory(side,Number(level),scene,{season,replay:true});
    for(let i=0;i<c[scene].length;i++){
     activeCampaignStory.index=i;renderCampaignStory();
     for(const id of ['storyText','storyNext','storyPrev','storySkip','storyClose']){
      const e=document.getElementById(id),r=e.getBoundingClientRect();
      if(r.width<=0||r.height<=0||r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1)out.push(`${season}/${side}/${level}/${scene}/${i}: ${id} off-screen`);
      if(id==='storyText'&&e.scrollWidth>e.clientWidth+1)out.push('text horizontal overflow');
     }
    }closeCampaignStory(false);
   }return out;
  });expect(issues).toEqual([]);
  await page.evaluate(()=>openCampaignStory('plants',1,'opening',{season:1,replay:true}));
  await page.screenshot({path:testInfo.outputPath(landscape?'prologue-landscape.png':'prologue.png')});
  await page.locator('#storyClose').click();
 }
 expect(errors).toEqual([]);
});
