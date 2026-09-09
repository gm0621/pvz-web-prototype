const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const url=process.argv[2]||'http://127.0.0.1:4174/';
const output=fs.mkdtempSync(path.join(os.tmpdir(),'hermes-story-ui-'));
async function checkControls(page){
 const result=await page.evaluate(()=>['storyPrev','storySkip','storyNext','storyClose'].map(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();return {id,fit:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,hit:el.disabled||el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}}));
 assert(result.every(x=>x.fit&&x.hit),JSON.stringify(result));
}
(async()=>{
 const browser=await chromium.launch();
 try{for(const [label,width,height] of [['desktop',1280,900],['mobile',390,844],['landscape',844,390]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Isolated guest browser: no login or real profile writes in production smoke.
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));
  await page.goto(url);await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();await page.locator('[data-jump-level="1"]').click();
  await expect(page.locator('#storyDialog')).toBeVisible();await page.locator('#storyNext').click();await page.locator('#storyPortrait').evaluate(img=>img.decode());await checkControls(page);
  const image=path.join(output,`${label}-story.png`);await page.screenshot({path:image});
  await page.locator('#storySkip').click();await expect(page.locator('#game')).toHaveClass(/active/);
  // Actual player input and normal costs, not injected deployment or free resources.
  await page.locator('#cards [data-key="sunflower"]').click();await page.locator('.cell[data-r="2"][data-c="0"]').click();
  assert(await page.evaluate(()=>state.plants.length)>0,'legal card deployment failed');
  await page.locator('#backBtn').click();await page.locator('#resumeBattleBtn').click();assert(await page.evaluate(()=>state.paused));await expect(page.locator('#storyDialog')).not.toBeVisible();
  await page.locator('#pauseBtn').click();assert.equal(await page.evaluate(()=>state.paused),false);
  await page.locator('#fullscreenBtn').click();
  // Injected loss verifies only result/story UI; not a claim of natural combat completion.
  await page.evaluate(async()=>{clearInterval(timer);await end(false,'防守失敗','UI smoke')});await expect(page.locator('#storyDialog')).toBeVisible();await checkControls(page);
  await page.locator('#storySkip').click();await page.locator('#modalMainMenu').click();await expect(page.locator('#start')).toHaveClass(/active/);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'PASS',label,url,image,checks:['story control hit targets','portrait decode','legal deployment','paused resume','fullscreen result dialog','home return','zero page errors']}));await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
