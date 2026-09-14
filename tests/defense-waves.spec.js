const {test,expect}=require('@playwright/test');
async function setup(page,season=1,level=1){await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto(process.env.GAME_URL||'/');await page.evaluate(({season,level})=>{currentSeason=season;for(let l=1;l<level;l++)completeCampaignLevel('plants',l,season);saveProfile();selectedLevel=level;start('plants');clearInterval(timer)},{season,level})}
test('finite waves cover all defense stages without changing quotas or introducing forbidden troops',async({page})=>{
 await setup(page);
 const runs=await page.evaluate(()=>{
  let seed=77;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const runs=[];
  for(const season of [1,2])for(const lv of Object.values(campaignLevels(season))){
   currentSeason=season;for(let l=1;l<lv.level;l++)completeCampaignLevel('plants',l,season);saveProfile();selectedLevel=lv.level;start('plants');clearInterval(timer);
   if(!state.waveDirector)throw Error('missing wave director');
   const spawns=[],warnings=[],old=addZombie;addZombie=(k,c,r)=>{const z=old(k,c,r);spawns.push({t:state.time,k,r,w:!!state.waveDirector.active});return z};
   try{for(let t=0;t<600000&&!state.bossSpawned;t+=50){state.time=t;income();processLevelEvents();aiAct();const w=state.waveDirector.active;if(w&&!warnings.some(x=>x.id===w.id))warnings.push({id:w.id,t:w.warnedAt,first:w.nextAt});}}
   finally{addZombie=old}
   const troops=spawns.slice(0,-1),waveTroops=troops.filter(x=>x.w),issues=[];
   if(troops.length!==lv.enemyCount||state.zombies.filter(z=>z.boss).length!==1)issues.push('quota/boss');
   if(troops[0].t<lv.firstZombieDelay)issues.push('early');
   if(troops.some(x=>![...lv.zombieWeights,...(lv.openingZombies||[])].includes(x.k)||!Number.isFinite(aiDelay(ZOMBIE_TYPES,x.k))))issues.push('eligibility');
   if(warnings.some(x=>x.first-x.t<5000))issues.push('warning');
   const last={};for(const s of troops){if(last[s.k]!==undefined&&s.t-last[s.k]<ZOMBIE_TYPES[s.k].cooldown)issues.push('cooldown');last[s.k]=s.t}
   if(!waveTroops.some((x,i)=>i&&x.t-waveTroops[i-1].t<lv.minSpawnSpacing))issues.push('no burst');
   if(new Set(waveTroops.map(x=>x.r)).size<3)issues.push('lanes');
   if(state.aiResource<0)issues.push('negative budget');
   runs.push({season,level:lv.level,issues,count:troops.length,waves:warnings.length,duration:state.time});
  }return runs;
 });expect(runs).toHaveLength(12);for(const r of runs){expect(r.issues,JSON.stringify(r)).toEqual([]);expect(r.waves).toBeGreaterThanOrEqual(2)}
});
test('warning and rally resume exactly, repeated HUD updates grant nothing, old snapshots retain old pacing',async({page})=>{
 await setup(page,1,6);
 const before=await page.evaluate(()=>{state.openingQueue=[];state.enemiesSpawned=state.waveDirector.plan[0].after;state.time=80000;aiAct();updateHUD();persistBattleState();return JSON.parse(JSON.stringify({wave:state.waveDirector,food:state.aiResource,time:state.time}))});
 await expect(page.locator('#waveStatus')).toContainText('一大波');await page.reload();
 expect(await page.evaluate(()=>({wave:state.waveDirector,food:state.aiResource,time:state.time}))).toEqual(before);
 expect(await page.evaluate(()=>{const t=state.time;tick();return state.paused&&state.time===t})).toBe(true);
 const result=await page.evaluate(()=>{clearInterval(timer);state.paused=false;state.time=state.waveDirector.active.nextAt;aiAct();const budget=state.aiResource;for(let i=0;i<10;i++){updateHUD();aiAct()}const noDouble=state.aiResource===budget;delete state.waveDirector;updateHUD();return {noDouble,hidden:document.getElementById('waveStatus').hidden}});
 expect(result).toEqual({noDouble:true,hidden:true});
});
test('wave HUD stays readable and grid taps work in portrait, landscape and fullscreen',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page,1,6);
 await page.evaluate(()=>{state.openingQueue=[];state.enemiesSpawned=state.waveDirector.plan[0].after;state.time=80000;aiAct();updateHUD()});
 for(const [name,viewport] of [['wide',{width:1440,height:900}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
  await page.setViewportSize(viewport);
  const box=await page.locator('#waveStatus').boundingBox();expect(box).not.toBeNull();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);
  expect(await page.locator('#waveStatus').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
  await page.locator('#waveStatus').scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath(`wave-${name}.png`)});
  await page.locator('#relocateUnitBtn').click();await expect(page.locator('#relocationHint')).toBeVisible();
  const cell=page.locator('.cell[data-r="4"][data-c="3"]');await cell.click();await expect(page.locator('#relocationHint')).toContainText('先點選場上要換列的守軍');await page.locator('#relocateUnitBtn').click();
 }
 await page.locator('#fullscreenBtn').click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement||document.body.classList.contains('is-fullscreen'))).toBe(true);
 await expect(page.locator('#waveStatus')).toBeVisible();await page.locator('.cell[data-r="4"][data-c="3"]').click();await page.screenshot({path:testInfo.outputPath('wave-fullscreen.png')});
 const geo=await page.evaluate(()=>({board:document.getElementById('board').getBoundingClientRect().bottom,cards:document.querySelector('.cards-panel').getBoundingClientRect().top}));expect(geo.board).toBeLessThanOrEqual(geo.cards);
 expect(errors).toEqual([]);
});
test('attack mode has no defense wave controller or banner',async({page})=>{await setup(page,2);expect(await page.evaluate(()=>{start('zombies');clearInterval(timer);updateHUD();return !state.waveDirector&&document.getElementById('waveStatus').hidden})).toBe(true)});
