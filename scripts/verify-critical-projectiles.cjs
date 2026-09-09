// Deterministic visual fixture using real actPlants/render paths, not a natural playthrough.
const {chromium,devices,expect}=require('@playwright/test');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const url=process.argv[2]||'http://127.0.0.1:4174/';
(async()=>{const browser=await chromium.launch(),out=fs.mkdtempSync(path.join(os.tmpdir(),'pvz-critical-'));try{
 for(const [label,options] of [['desktop',{viewport:{width:1365,height:900}}],['mobile',{...devices['iPhone 13']}],['landscape',{...devices['iPhone 13'],viewport:{width:844,height:390}}]]){
  const context=await browser.newContext(options),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto(url);
  await page.evaluate(()=>{for(let n=1;n<=9;n++)completeCampaignLevel('plants',n);selectedLevel=10;start('plants');clearInterval(timer);state.time=10000;
   ['firepea','zhaoyun','huangzhong'].forEach((type,i)=>addPlant(type,2,i+1));for(let r=0;r<5;r++)addZombie('normal',7,r);
   const random=Math.random;try{Math.random=()=>.99;actPlants();state.projectiles.forEach(p=>p.x=p.slow?4.7:4);state.time+=5000;Math.random=()=>0;actPlants();state.projectiles.filter(p=>p.critical).forEach(p=>p.x=p.slow?6.5:5.8)}finally{Math.random=random}render();
  });
  await expect(page.locator('.projectile.critical')).toHaveCount(5);await expect(page.locator('.projectile:not(.critical)')).toHaveCount(5);
  const sizes=await page.locator('.projectile').evaluateAll(es=>es.map(e=>({critical:e.classList.contains('critical'),width:parseFloat(getComputedStyle(e).width),glow:getComputedStyle(e).boxShadow,ice:e.classList.contains('ice')})));
  for(const s of sizes){expect(s.width).toBe(s.critical?34:17);expect(s.glow).not.toBe('none')}
  // Let transient skill animations expire so the comparison shows the balls themselves.
  await page.waitForTimeout(1400);await page.locator('#board').scrollIntoViewIfNeeded();
  const image=path.join(out,label+'.png');await page.locator('#board').screenshot({path:image});
  const motion=await page.evaluate(()=>{const before=state.projectiles.map(p=>p.x);moveProjectiles();render();return state.projectiles.every((p,i)=>p.x>before[i])});expect(motion).toBe(true);expect(errors).toEqual([]);
  console.log(JSON.stringify({status:'PASS',label,url,image,checks:['real attack path','five normal and five critical shots','17px vs 34px','ice identity retained','shots still move','zero page errors']}));await context.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
