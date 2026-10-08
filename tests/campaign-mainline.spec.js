const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function data(file,key){return vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8')+';'+key)}
test('mainline has a cause, a goal for every chapter, connected outcomes and a resolved motive',()=>{
 const s=data('js/season1-story-data.js','SEASON1_STORY');
 const text=lines=>lines.map(x=>x.text).join('\n');
 expect(text(s.plants[1].opening)).toMatch(/古戰場/);
 expect(text(s.plants[1].opening)).toMatch(/甦醒/);
 for(const side of ['plants','zombies'])for(let level=1;level<=(side==='plants'?11:10);level++){
  const chapter=s[side][level];expect(chapter.goal).toBeTruthy();expect(text(chapter.opening)).toContain(chapter.goal);
  for(const scene of ['opening','victory','defeat']){
   expect(chapter[scene].length).toBeGreaterThan(0);
   for(const line of chapter[scene]){expect(line.speaker).toBeTruthy();expect(line.text.length).toBeLessThanOrEqual(125)}
  }
  if(level<(side==='plants'?11:10)){expect(chapter.lead).toBeTruthy();expect(text(chapter.victory)).toContain(chapter.lead);expect(text(s[side][level+1].opening)).toContain(chapter.lead)}
 }
 expect(text(s.plants[10].opening)).toMatch(/官道/);expect(text(s.plants[10].opening)).toMatch(/魂火/);
 expect(text(s.plants[10].victory)).toMatch(/鈴聲.*停止/);
 expect(text(s.plants[10].victory)).toMatch(/始皇陵|古陵/);
 expect(text(s.plants[10].victory)).not.toMatch(/守城戰記，完|北運.*棺車/);
 expect(text(s.plants[11].opening)).toMatch(/三枚虎符/);
 expect(text(s.plants[11].opening)).toMatch(/八秒|8 秒/);
 expect(text(s.plants[11].victory)).toMatch(/北運.*棺車/);
 expect(text(s.plants[11].victory)).toMatch(/守城戰記，完/);
 expect(text(s.plants[11].defeat)).toMatch(/虎符/);
 expect(text(s.zombies[1].opening)).toMatch(/另一種/);
 expect(text(s.zombies[10].victory)).toMatch(/不是你的祭品/);
 const s2=data('js/season2-story-data.js','SEASON2_STORY');
 expect(Object.keys(s2.plants)).toEqual(['1','2']);expect(Object.keys(s2.zombies)).toEqual(['1','2']);
 expect(text(s2.plants[1].opening)).toMatch(/蜀地.*急報/);
 expect(text(s2.plants[1].opening)).toMatch(/棺車/);
 expect(text(s2.zombies[1].opening)).toMatch(/另一種可能/);
});
test('defense story teaches the real special rule of every ordinary stage',()=>{
 const s=data('js/season1-story-data.js','SEASON1_STORY'),chapter=level=>[...s.plants[level].opening,...s.plants[level].victory,...s.plants[level].defeat].map(x=>x.text).join('\n');
 expect(chapter(1)).toMatch(/五路推車.*不得啟動|不得動用.*推車/);
 expect(chapter(2)).toMatch(/運糧兵|中央路.*糧/);
 expect(chapter(3)).toMatch(/烽火.*封鎖|封鎖.*部署/);
 expect(chapter(4)).toMatch(/保留.*80.*軍糧|80.*軍糧.*保留/);
 expect(chapter(5)).toMatch(/視界.*輪轉|斥候.*輪轉/);
 expect(chapter(6)).toMatch(/五路推車.*不得啟動|不得動用.*推車/);
 expect(chapter(7)).toMatch(/運糧兵|中央路.*糧/);
 expect(chapter(8)).toMatch(/保留.*80.*軍糧|80.*軍糧.*保留/);
 expect(chapter(9)).toMatch(/烽火.*封鎖|封鎖.*部署/);
 expect(s.plants[9].opening.map(x=>x.text).join('\n')).not.toMatch(/屍帝/);
 expect(chapter(10)).toMatch(/視界.*輪轉|烽煙.*視界/);
});
test('first-season level cards match the accepted art themes and real defense rules',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
 const copy=await page.evaluate(()=>Object.fromEntries([1,6,7,8,9,10].map(level=>[level,{name:LEVELS[level].name,text:LEVELS[level].cardText,hint:LEVELS[level].plantHint}])));
 expect(copy[1].name).toContain('草坪軍營初戰');expect(copy[1].text).toMatch(/軍營.*推車.*不得啟動/);expect(copy[1].text).not.toContain('推車還能救急');
 expect(copy[6].name).toContain('夜半爆破');expect(copy[6].hint).toMatch(/五路推車.*不得啟動|不得動用.*推車/);
 expect(copy[7].name).toContain('屍旗巨人');expect(copy[7].text).toContain('屍旗大胖');expect(copy[7].text).not.toContain('火石');expect(copy[7].hint).toContain('運糧兵');
 expect(copy[8].text).toContain('孔明');expect(copy[8].hint).toMatch(/80.*軍糧|軍糧.*80/);
 expect(copy[9].name).toContain('蜀將集結');expect(`${copy[9].text}\n${copy[9].hint}`).toMatch(/烽火.*封路|封鎖.*部署/);
 expect(copy[10].hint).toMatch(/烽煙視界.*輪轉|視界.*輪轉/);
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
