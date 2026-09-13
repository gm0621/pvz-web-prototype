// Controlled battle fixtures drive actual UI, relocation, actPlants and rendering.
// Not a natural campaign playthrough; account calls are disabled in this isolated browser.
const {chromium,devices,expect}=require('@playwright/test');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const base=process.argv[2]||'http://127.0.0.1:4173/',out=fs.mkdtempSync(path.join(os.tmpdir(),'pvz-relocation-sword-'));
(async()=>{const browser=await chromium.launch();try{
 for(const [name,options] of [['desktop',{viewport:{width:1365,height:900}}],['mobile',{...devices['iPhone 13']}],['landscape',{...devices['iPhone 13'],viewport:{width:844,height:390}}]]){
  const ctx=await browser.newContext(options),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto(base);
  await page.evaluate(()=>{for(let l=1;l<6;l++)completeCampaignLevel('plants',l);saveProfile();selectedLevel=6;start('plants');clearInterval(timer);state.time=10000;state.resource=100;state.plants=[];state.zombies=[];state.projectiles=[];addPlant('zhaoyun',2,2);state.plants[0].hp-=25;render();updateHUD()});
  const before=await page.evaluate(()=>({...state.plants[0]})),press=async sel=>options.hasTouch?page.locator(sel).tap():page.locator(sel).click();
  await press('#relocateUnitBtn');await press('.cell[data-r="2"][data-c="2"]');await expect(page.locator('.relocation-target')).toHaveCount(2);await expect(page.locator('#relocationHint')).toBeVisible();
  await page.locator('#board').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,name+'-choose.png')});
  await press('.cell[data-r="1"][data-c="2"]');
  const moved=await page.evaluate(()=>({...state.plants[0],food:state.resource}));assert.equal(moved.r,1);assert.equal(moved.food,80);for(const k of ['hp','last','bornAt','maxHp'])assert.equal(moved[k],before[k]);
  await press('#relocateUnitBtn');await press('.cell[data-r="1"][data-c="2"]');await press('.cell[data-r="0"][data-c="2"]');assert.equal(await page.evaluate(()=>state.resource),60);
  // Verify saved paid move survives reload; gameplay is paused on restoration.
  await page.reload();await expect(page.locator('#game')).toHaveClass(/active/);assert.deepEqual(await page.evaluate(()=>({r:state.plants[0].r,food:state.resource,paused:state.paused})),{r:0,food:60,paused:true});
  await page.evaluate(()=>{
   clearInterval(timer);state.paused=false;applyPausedBattleUI();state.time=10000;state.plants=[];state.zombies=[];state.projectiles=[];addPlant('zhaoyun',2,2);addZombie('bucket',2.8,2);
   // Hold effect cleanup for still capture only, retaining the real attack path.
   window.__timeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>ms===620?0:window.__timeout(fn,ms,...args);window.__roll=rollSuperSkill;rollSuperSkill=()=>false;actPlants();render();
   for(const a of document.querySelector('.zhaoyun-sword-fx').getAnimations({subtree:true})){a.pause();a.currentTime=180}
  });
  assert.equal(await page.evaluate(()=>state.projectiles.length),0);await expect(page.locator('.zhaoyun-sword-fx')).toBeVisible();
  const css=await page.locator('.qinggang-blade').evaluate(e=>({w:e.getBoundingClientRect().width,bg:getComputedStyle(e).backgroundImage}));assert.ok(css.w>20&&css.bg.includes('linear-gradient'));
  await page.locator('#board').screenshot({path:path.join(out,name+'-sword.png')});
  await page.evaluate(()=>{document.querySelectorAll('.zhaoyun-sword-fx').forEach(e=>e.remove());window.setTimeout=window.__timeout;state.zombies[0].c=5;state.time+=2000;actPlants();render();rollSuperSkill=window.__roll});
  await expect(page.locator('.projectile.ice')).toHaveCount(1);await expect(page.locator('.zhaoyun-sword-fx')).toHaveCount(0);await page.locator('#board').screenshot({path:path.join(out,name+'-ice.png')});
  assert.deepEqual(errors,[]);await ctx.close();console.log('PASS '+name+': actual '+(options.hasTouch?'touch':'mouse')+' move, 20 grain, repeat, HP/cadence, reload, sword and ranged ice');
 }
 console.log('AD-HOC BROWSER PASS; screenshots: '+out);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
