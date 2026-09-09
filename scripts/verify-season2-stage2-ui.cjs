// Injected results exercise UI only. Balance is verified separately with legal ticks.
const {chromium,devices,expect}=require('@playwright/test');const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
(async()=>{const b=await chromium.launch(),out=fs.mkdtempSync(path.join(os.tmpdir(),'pvz-stage2-'));try{
 for(const [label,options] of [['desktop',{viewport:{width:1365,height:900}}],['mobile',{...devices['iPhone 13']}],['landscape',{...devices['iPhone 13'],viewport:{width:844,height:390}}]]){
 const c=await b.newContext(options),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await p.goto(process.env.GAME_URL||'http://127.0.0.1:4174/');
 for(const faction of ['plants','zombies']){
 await p.evaluate(f=>{backToHome();completeCampaignLevel(f,1,2);saveProfile()},faction);await p.locator(faction==='plants'?'#plantStartBtn':'#zombieStartBtn').click();await p.locator('[data-season-choice="2"]').click();await expect(p.locator('[data-jump-level="3"]')).toBeDisabled();await p.locator('[data-jump-level="2"]').click();await expect(p.locator('#storyTitle')).toContainText('石壘營門');await p.locator('#storyPortrait').evaluate(im=>im.decode());
 const shot=path.join(out,`${label}-${faction}-story.png`);await p.screenshot({path:shot});await p.locator('#storyNext').click();await p.locator('#storyPrev').click();await p.locator('#storySkip').click();await expect(p.locator('#game')).toHaveClass(/active/);
 const key=faction==='plants'?'s2Shield':'s2Coffin';await p.locator(`#cards [data-key="${key}"]`).click();await p.locator(`.cell[data-r="2"][data-c="${faction==='plants'?4:7}"]`).click();await expect(p.locator(`#board .type-${key}`)).toHaveCount(1);
 await p.locator('#pauseBtn').click();await p.reload();await expect(p.locator('#game')).toHaveClass(/active/);expect(await p.evaluate(()=>({level:state.level,season:state.season,paused:state.paused}))).toEqual({level:2,season:2,paused:true});
 await p.evaluate(async()=>{clearInterval(timer);await end(true,'勝利','UI fixture')});await expect(p.locator('#storyDialog')).not.toBeVisible();await p.screenshot({path:path.join(out,`${label}-${faction}-result.png`)});await p.locator('#modalStory').click();await expect(p.locator('#storyDialog')).toBeVisible();await p.locator('#storySkip').click();await p.locator('#modalMainMenu').click();
 console.log(JSON.stringify({status:'PASS',label,faction,shot,checks:['intro controls','stage-two legal deployment','paused reload','results first','explicit story','third stage locked','home return']}));
 }
 expect(errors).toEqual([]);await c.close();
 }
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
