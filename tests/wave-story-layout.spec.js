const {test,expect}=require('@playwright/test');
for(const [name,viewport] of [['portrait',{width:390,height:844}],['narrow',{width:320,height:740}],['landscape',{width:844,height:390}],['desktop',{width:1440,height:900}]])for(const fullscreen of [false,true]){
 test(`story keeps battlefield stationary: ${name} ${fullscreen?'fullscreen':'normal'}`,async({page},info)=>{
  await page.setViewportSize(viewport);await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto(process.env.GAME_URL||'/');
  await page.evaluate(()=>{for(let l=1;l<10;l++)completeCampaignLevel('plants',l,1);saveProfile();selectedLevel=10;start('plants');clearInterval(timer);state.time=80000;state.nextAI=100000;state.openingQueue=[];updateHUD()});
  if(fullscreen){await page.locator('#fullscreenBtn').click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement||document.body.classList.contains('is-fullscreen'))).toBe(true)}
  await page.locator('#waveStatus').scrollIntoViewIfNeeded();
  const positions=[];
  async function record(phase){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));positions.push(await page.evaluate(phase=>{const b=document.getElementById('board').getBoundingClientRect(),h=document.getElementById('waveStatus').getBoundingClientRect(),c=document.querySelector('.cards-panel').getBoundingClientRect();return{phase,top:b.top,height:b.height,left:b.left,width:b.width,hud:h.height,cards:c.top,scroll:scrollY}},phase))}
  await record('calm');await page.evaluate(()=>{state.enemiesSpawned=state.waveDirector.plan[0].after-1;prepareDefenseWaveStory();updateHUD()});await expect(page.locator('#waveStory')).toBeVisible();await page.waitForFunction(()=>{const i=document.getElementById('waveStoryPortrait');return i.complete&&i.naturalWidth>0});await record('scout');
  await page.screenshot({path:info.outputPath('scout.png')});
  // Sweep every authored line without changing the actual layout viewport.
  const overflow=await page.evaluate(()=>{const issues=[];for(const levels of Object.values(DEFENSE_WAVE_STORY))for(const copy of Object.values(levels))for(const text of [...copy.scout,...copy.charge]){document.getElementById('waveStoryText').textContent='蜀軍弓兵：'+text;const e=document.getElementById('waveStory'),h=document.getElementById('waveStatus');if(e.getBoundingClientRect().bottom>h.getBoundingClientRect().bottom||h.scrollHeight>h.clientHeight+1)issues.push(text)}updateHUD();return issues});expect(overflow).toEqual([]);
  await page.locator('#waveStorySkip').click();await record('dismiss');
  await page.evaluate(()=>{state.enemiesSpawned=state.waveDirector.plan[0].after;aiAct();updateHUD()});await record('warning');
  await page.evaluate(()=>{state.time=state.waveDirector.active.nextAt;aiAct();updateHUD()});await record('entry');
  await page.evaluate(()=>{state.time=state.waveDirector.story.event.until+1;updateHUD()});await record('expired');
  await page.evaluate(()=>{state.waveDirector.active=null;state.waveDirector.index=1;state.waveDirector.restUntil=state.time+8000;updateHUD()});await record('rest');
  await page.evaluate(()=>{state.bossSpawned=true;updateHUD()});await record('boss');
  require('fs').writeFileSync(info.outputPath('positions.json'),JSON.stringify(positions,null,2));
  for(const k of ['top','height','left','width','hud','cards','scroll'])expect(Math.max(...positions.map(p=>p[k]))-Math.min(...positions.map(p=>p[k])),k+' '+JSON.stringify(positions)).toBeLessThan(1);
  if(fullscreen){const b=positions[0];expect(b.top+b.height).toBeLessThanOrEqual(b.cards);expect(b.height).toBeGreaterThan(60)}
 });
}
