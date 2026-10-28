const {test,expect}=require('@playwright/test');
test.use({hasTouch:true,isMobile:true,deviceScaleFactor:1});
for(const [width,height] of [[768,1024],[1024,768],[820,1180],[1180,820],[1366,1024]])for(const faction of ['plants','zombies'])for(const fallback of [false,true]){
 test(`tablet ${width}x${height} ${faction} ${fallback?'fallback':'native'}`,async({page,browserName},info)=>{
  await page.setViewportSize({width,height});await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto(process.env.GAME_URL||'/');
  await page.evaluate(({faction,fallback})=>{currentUser=null;playerProfile=defaultProfile();for(let n=1;n<=10;n++)completeCampaignLevel('plants',n,1);currentSeason=1;selectedLevel=1;start(faction);clearInterval(timer);if(fallback)battleFullscreenHost().requestFullscreen=undefined},{faction,fallback});
  const key=faction==='plants'?'peashooter':'normal';await page.locator(`#cards [data-key="${key}"]`).click();
  await expect(page.locator('#grid .deploy-allowed')).toHaveCount(faction==='plants'?35:10);
  await page.locator('#fullscreenBtn').click();await expect(page.locator('#game')).toHaveClass(/fullscreen-mode/);
  const metrics=()=>page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right}},board=box('#board'),cards=box('.cards-panel');return {board,cards,game:box('#game'),viewport:visualViewport.height,rows:[...document.querySelectorAll('.cell[data-r="4"]')].map(e=>{const r=e.getBoundingClientRect();return {height:r.height,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})}});
  await expect.poll(async()=>{const m=await metrics();return m.board.bottom<=m.cards.top+1&&m.rows.every(r=>r.hit&&r.height>=24)&&m.game.top>=-1&&m.game.bottom<=m.viewport+1}).toBe(true);
  if(fallback){await page.addStyleTag({content:'.game.fullscreen-mode .cards-panel{height:180px!important}'});await expect.poll(async()=>{const m=await metrics();return m.board.bottom<=m.cards.top+1&&m.rows.every(r=>r.hit&&r.height>=24)}).toBe(true)}
  if(width===1024)await page.screenshot({path:info.outputPath(`${faction}-${fallback?'fallback':'native'}.png`)});
  await page.locator(`.cell[data-r="4"][data-c="${faction==='plants'?0:8}"]`).click();await expect(page.locator(`#board .type-${key}`)).toHaveCount(1);
  if(fallback||browserName!=='chromium')await page.setViewportSize({width:height,height:width});else{const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setDeviceMetricsOverride',{width:height,height:width,deviceScaleFactor:1,mobile:true});await cdp.detach()}
  await expect.poll(async()=>{const m=await metrics();return m.board.bottom<=m.cards.top+1&&m.rows.every(r=>r.hit&&r.height>=24)}).toBe(true);
  await page.locator('#fullscreenBtn').click();await expect(page.locator('#game')).not.toHaveClass(/fullscreen-mode/);
 });
}

test('mobile fullscreen pause keeps deployment cards compact and unclipped',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));
 await page.goto(process.env.GAME_URL||'/');
 await page.evaluate(()=>{currentUser=null;playerProfile=defaultProfile();currentSeason=1;selectedLevel=1;start('plants');clearInterval(timer);battleFullscreenHost().requestFullscreen=undefined});
 await page.locator('#fullscreenBtn').click();
 await page.locator('#pauseBtn').click();
 await expect(page.locator('#game')).toHaveClass(/paused.*fullscreen-mode|fullscreen-mode.*paused/);
 const cards=await page.locator('#cards .card').evaluateAll(nodes=>nodes.map(card=>({clientHeight:card.clientHeight,scrollHeight:card.scrollHeight,descDisplay:getComputedStyle(card.querySelector('.card-desc')).display,bottom:card.getBoundingClientRect().bottom,viewport:innerHeight})));
 expect(cards.length).toBeGreaterThan(0);
 expect(cards.every(card=>card.scrollHeight<=card.clientHeight&&card.descDisplay==='none'&&card.bottom<=card.viewport)).toBe(true);
});

test('native fullscreen exit restores the ordinary battle layout',async({page})=>{
 await page.setViewportSize({width:768,height:1024});await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto(process.env.GAME_URL||'/');
 await page.evaluate(()=>{currentUser=null;playerProfile=defaultProfile();currentSeason=1;selectedLevel=1;start('plants');clearInterval(timer)});
 await page.locator('#fullscreenBtn').click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
 await page.evaluate(()=>document.exitFullscreen());await expect.poll(()=>page.evaluate(()=>!document.fullscreenElement)).toBe(true);
 await expect(page.locator('#game')).not.toHaveClass(/fullscreen-mode/);await expect(page.locator('html')).not.toHaveClass(/battle-fullscreen-open/);await expect(page.locator('#fullscreenBtn')).toHaveText('⛶ 全螢幕');
});

test('mobile battle controls provide 44px touch targets in portrait and short landscape',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));
 const measure=()=>page.locator('#game .top-toolbar button,#gameFloatBackBtn,#battleIntelToggle').evaluateAll(elements=>elements.filter(el=>{const style=getComputedStyle(el),rect=el.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&rect.width&&rect.height}).map(el=>{const rect=el.getBoundingClientRect();return{id:el.id,width:rect.width,height:rect.height}}).filter(box=>box.width<44||box.height<44));
 for(const viewport of [{width:320,height:740},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.goto('/');
  await page.evaluate(()=>{currentUser=null;playerProfile=defaultProfile();currentSeason=1;selectedLevel=1;start('plants');clearInterval(timer);battleFullscreenHost().requestFullscreen=undefined});
  expect(await measure(),`${viewport.width}x${viewport.height} ordinary`).toEqual([]);
  await page.locator('#fullscreenBtn').click();
  expect(await measure(),`${viewport.width}x${viewport.height} fullscreen`).toEqual([]);
 }
});
