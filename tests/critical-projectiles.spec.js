const {test,expect}=require('@playwright/test');
async function setup(page){await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto('/');await page.evaluate(()=>{for(let n=1;n<=9;n++)completeCampaignLevel('plants',n);saveProfile();selectedLevel=10;start('plants');clearInterval(timer)});}
test('only actual ranged super hits produce larger highlighted balls without changing damage or rolls',async({page})=>{
 await setup(page);
 const result=await page.evaluate(()=>{
  const run=(type,roll)=>{state.time=10000;state.plants=[];state.zombies=[];state.projectiles=[];addPlant(type,2,2);state.plants[0].last=0;for(const r of [1,2,3])addZombie('normal',4,r);
   const original=Math.random;let rolls=0;Math.random=()=>{rolls++;return roll};try{actPlants()}finally{Math.random=original}render();
   return{rolls,shots:state.projectiles.map(p=>({damage:p.damage,critical:p.critical,fire:!!p.fire,slow:!!p.slow})),visuals:[...document.querySelectorAll('.projectile')].map(e=>({critical:e.classList.contains('critical'),width:parseFloat(getComputedStyle(e).width),background:getComputedStyle(e).backgroundImage,shadow:getComputedStyle(e).boxShadow})),base:PLANT_TYPES[type].damage,bonus:superSkillDamage(PLANT_TYPES[type].damage)};
  };return Object.fromEntries(['peashooter','firepea','zhaoyun','huangzhong'].map(t=>[t,{ordinary:run(t,.99),proc:run(t,0)}]));
 });
 for(const [type,pair] of Object.entries(result)){
  expect(pair.proc.rolls).toBe(pair.ordinary.rolls);
  for(const shot of pair.ordinary.shots){expect(shot.critical).toBe(false);expect(shot.damage).toBe(pair.ordinary.base)}
  const triggers=type!=='peashooter';
  for(const shot of pair.proc.shots){expect(shot.critical).toBe(triggers);expect(shot.damage).toBe(triggers?pair.proc.bonus:pair.proc.base)}
  for(const ball of pair.proc.visuals){expect(ball.critical).toBe(triggers);expect(ball.width).toBe(triggers?34:17);if(triggers){expect(ball.background).toContain('radial-gradient');expect(ball.shadow).not.toBe('none')}}
 }
 expect(result.huangzhong.proc.shots).toHaveLength(3);expect(result.firepea.proc.shots[0].fire).toBe(true);expect(result.zhaoyun.proc.shots[0].slow).toBe(true);
});
test('critical appearance survives saved shots and old unmarked shots remain normal',async({page})=>{
 await setup(page);
 await page.evaluate(()=>{state.projectiles=[{x:4,y:2.5,r:2,dir:1,damage:100,from:'plant',critical:true},{x:5,y:2.5,r:2,dir:1,damage:100,from:'plant'}];pauseAndSaveBattle();backToHome()});
 await page.reload();await expect(page.locator('#game')).toHaveClass(/active/);
 expect(await page.evaluate(()=>({paused:state.paused,critical:state.projectiles[0].critical}))).toEqual({paused:true,critical:true});await expect(page.locator('.projectile.critical')).toHaveCount(1);await expect(page.locator('.projectile:not(.critical)')).toHaveCount(1);
});
