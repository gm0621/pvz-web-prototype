const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const url=process.argv[2]||'http://127.0.0.1:4174/';
const output=fs.mkdtempSync(path.join(os.tmpdir(),'hermes-story-ui-'));
async function checkControls(page){
 const result=await page.evaluate(()=>['storyPrev','storySkip','storyNext','storyClose'].map(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();return {id,fit:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit:el.disabled||el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}}));
 assert(result.every(x=>x.fit&&x.hit),JSON.stringify(result));
}
async function advanceToPortrait(page){
 const portrait=page.locator('#storyPortrait');
 for(let step=0;step<20;step++){
  if(await portrait.isVisible()&&await portrait.getAttribute('src')){await portrait.evaluate(img=>img.decode());return}
  await page.locator('#storyNext').click();
 }
 assert.fail('story did not reach a decodable character portrait');
}
async function checkRouteChoice(page){
 const result=await page.evaluate(()=>{const rectData=rect=>({x:rect.x,y:rect.y,right:rect.right,bottom:rect.bottom,width:rect.width,height:rect.height}),panel=document.getElementById('finaleRouteChoice'),panelRect=panel.getBoundingClientRect();return {viewport:{width:innerWidth,height:innerHeight},panel:{...rectData(panelRect),fit:panelRect.x>=0&&panelRect.y>=0&&panelRect.right<=innerWidth&&panelRect.bottom<=innerHeight},buttons:['finaleWeiRoute','finaleZombieRoute'].map(id=>{const el=document.getElementById(id),rect=el.getBoundingClientRect();return {id,...rectData(rect),fit:rect.x>=panelRect.x&&rect.y>=panelRect.y&&rect.right<=panelRect.right&&rect.bottom<=innerHeight,hit:el.contains(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2))}})}});
 assert(result.panel.fit&&result.buttons.every(button=>button.fit&&button.hit),JSON.stringify(result));
}
(async()=>{
 const browser=await chromium.launch();
 try{for(const [label,width,height] of [['desktop',1280,900],['mobile',390,844],['landscape',844,390]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Isolated guest browser: no login or real profile writes in production smoke.
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
  await page.goto(url);await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();await page.locator('[data-jump-level="1"]').click();
  await expect(page.locator('#storyDialog')).toBeVisible();await advanceToPortrait(page);await checkControls(page);
  const image=path.join(output,`${label}-story.png`);await page.screenshot({path:image});
  await page.locator('#storySkip').click();await expect(page.locator('#game')).toHaveClass(/active/);
  // Actual player input and normal costs, not injected deployment or free resources.
  await page.locator('#cards [data-key="sunflower"]').click();await page.locator('.cell[data-r="2"][data-c="0"]').click();
  assert(await page.evaluate(()=>state.plants.length)>0,'legal card deployment failed');
  await page.locator('#backBtn').click();await page.locator('#resumeBattleBtn').click();assert(await page.evaluate(()=>state.paused));await expect(page.locator('#storyDialog')).not.toBeVisible();
  await page.locator('#pauseBtn').click();assert.equal(await page.evaluate(()=>state.paused),false);
  await page.locator('#fullscreenBtn').click();
  // Injected victory verifies result/story UI only, not natural combat completion.
  await page.evaluate(async()=>{clearInterval(timer);await end(true,'防守成功','本關已完成，先確認戰果，再繼續故事。')});
  await expect(page.locator('#storyDialog')).not.toBeVisible();await expect(page.locator('#modalTitle')).toHaveText('防守成功');
  await page.locator('#modalStory').scrollIntoViewIfNeeded();await expect(page.locator('#game')).not.toHaveClass(/fullscreen-mode/);
  const resultImage=path.join(output,`${label}-result-before-story.png`);await page.screenshot({path:resultImage});
  await page.locator('#modalStory').click();await expect(page.locator('#storyDialog')).toBeVisible();await checkControls(page);
  await page.locator('#storySkip').click();await page.locator('#modalMainMenu').click();await expect(page.locator('#start')).toHaveClass(/active/);
  // Unlock navigation only, then exercise the real level-11 story UI and portrait asset.
  await page.evaluate(()=>{for(let level=1;level<=10;level++)completeCampaignLevel('plants',level)});
  await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();await page.locator('[data-jump-level="11"]').click();
  await expect(page.locator('#storyDialog')).toBeVisible();await expect(page.locator('#storyTitle')).toHaveText('終章：始皇陵決戰');await expect(page.locator('#storyText')).toContainText('始皇陵');
  await advanceToPortrait(page);await checkControls(page);
  const finaleImage=path.join(output,`${label}-finale-story.png`);await page.screenshot({path:finaleImage});
  await page.locator('#storySkip').click();await expect(page.locator('#game')).toHaveClass(/active/);
  await page.evaluate(async()=>{clearInterval(timer);await end(true,'終章完成','秦皇軍陣已破，先看完勝利劇情再選擇下一條戰線。')});
  await expect(page.locator('#finaleRouteChoice')).toBeHidden();await expect(page.locator('#modalStory')).toBeVisible();
  await page.locator('#modalStory').click();await expect(page.locator('#storyDialog')).toBeVisible();await expect(page.locator('#storyTitle')).toHaveText('終章：始皇陵決戰');
  await page.locator('#storySkip').click();await expect(page.locator('#finaleRouteChoice')).toBeVisible();await checkRouteChoice(page);
  const routeChoiceImage=path.join(output,`${label}-finale-route-choice.png`);await page.screenshot({path:routeChoiceImage});
  await page.locator('#finaleZombieRoute').click();await expect(page.locator('#levelScreen')).toHaveClass(/active/);assert.deepEqual(await page.evaluate(()=>({season:currentSeason,faction:currentFaction})),{season:1,faction:'zombies'});
  await page.evaluate(async()=>{currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);await end(true,'終章完成','秦皇軍陣已破。')});await expect(page.locator('#finaleRouteChoice')).toBeVisible();
  await page.locator('#finaleWeiRoute').click();await expect(page.locator('#chosenFactionText')).toContainText('第二季・北境鐵壁');assert.deepEqual(await page.evaluate(()=>({season:currentSeason,faction:currentFaction})),{season:2,faction:'plants'});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'PASS',label,url,image,resultImage,finaleImage,routeChoiceImage,checks:['results before story','explicit continue story','story control hit targets','portrait decode','legal deployment','paused resume','fullscreen result dialog','home return','level 11 story navigation','level 11 portrait decode','victory story before finale route choice','finale route hit targets','zombie parallel chronicle route','Wei sequel route','zero page errors']}));await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
