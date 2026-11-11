const {test,expect}=require('@playwright/test');
test.use({hasTouch:true});
async function touchable(locator){await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);expect(await locator.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el===hit||el.contains(hit)})).toBe(true)}
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
test('story navigation stays readable and touchable across army viewpoints',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({completed:22,coins:500})));await page.goto('/hero/');
 for(const level of [1,17,20]){
  await page.locator('#chapterPicker').evaluate(e=>e.open=true);await page.locator(`#chapterTabs [data-chapter="${level===1?1:4}"]`).tap();await page.locator(`#chapterDots [data-level="${level}"]`).tap();
  await touchable(page.locator('#prologueContinue'));await page.locator('#prologueContinue').tap();await page.locator('#storyNext').scrollIntoViewIfNeeded();await page.locator('#storyNext').tap();
  await touchable(page.locator('#storyPrevious'));await page.locator('#storyPrevious').tap();await touchable(page.locator('#storyNext'));
  const boxes=await page.evaluate(()=>{const d=document.querySelector('.scene-dialogue').getBoundingClientRect();return {top:d.top,actors:[...document.querySelectorAll('.scene-cast img')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect().bottom),previousHeight:document.querySelector('#storyPrevious').getBoundingClientRect().height}});
  for(const bottom of boxes.actors)expect(bottom).toBeLessThanOrEqual(boxes.top+1);
  expect(boxes.previousHeight).toBeLessThanOrEqual(48);await noOverflow(page);if(level===20)await page.screenshot({path:info.outputPath('story.png'),fullPage:true});await page.locator('#story [data-home]').tap();
 }
});
test('camp panels do not sit behind departure controls and purchases remain touchable',async({page},info)=>{
 await page.goto('/hero/');await page.evaluate(async()=>{const {mountCamp}=await import('/hero/camp-view.mjs?v=history-coalition-1'),{heroesForLevel,STAGES}=await import('/hero/story.mjs?v=history-coalition-1'),{normalizeProgress}=await import('/hero/engine.mjs?v=withdrawal-settlement-1');const p=normalizeProgress({completed:20,coins:500});document.querySelector('#home').hidden=true;document.querySelector('#camp').hidden=false;document.querySelector('#camp').classList.add('active');mountCamp({progress:p,level:20,heroes:heroesForLevel(20),stage:STAGES[19],onSave:()=>localStorage.setItem('touchTestSave',JSON.stringify(p)),onContinue:()=>{}})});
 for(const shop of ['weapons','items']){
  const trigger=page.locator(`[data-shop=${shop}]`);await trigger.tap();await expect(page.locator('#campShop')).toBeVisible();
  expect(await page.evaluate(()=>{const panel=document.querySelector('#campShop').getBoundingClientRect(),footer=document.querySelector('.camp-departure').getBoundingClientRect();return footer.top>=panel.bottom})).toBe(true);
  const buy=page.locator(`[data-buy=${shop==='weapons'?'zhangfei':'grain'}]`);await touchable(buy);await buy.tap();await touchable(page.locator('#campShopBack'));await page.locator('#campShopBack').tap();await expect(page.locator('#campShop')).toBeHidden();await expect(trigger).toBeFocused();
 }
 expect(await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('touchTestSave'));return [p.coins,p.weapons.zhangfei,p.inventory.grain]})).toEqual([420,1,1]);
 await page.locator('[data-talk=guanyu]').tap();await touchable(page.locator('#campTalkNext'));await page.locator('#campTalkNext').tap();await noOverflow(page);await page.screenshot({path:info.outputPath('camp-talk.png'),fullPage:true});
 await page.locator('#campPrepare').tap();await expect(page.locator('#campRoster')).toBeVisible();await noOverflow(page);await touchable(page.locator('#campContinue'));
});
test('solo and team duels keep HP and pause controls reachable without horizontal clipping',async({page},info)=>{
 await page.goto('/hero/');await page.emulateMedia({reducedMotion:'reduce'});
 for(const level of [3,6]){
  await page.evaluate(async level=>{const e=await import('/hero/engine.mjs?v=withdrawal-settlement-1'),v=await import('/hero/duel-view.mjs?v=withdrawal-settlement-1'),b=e.createBattle(level);b.nextSpawn=Infinity;e.deploy(b,level===6?'guanyu':'zhangfei',1);if(level===6)e.deploy(b,'zhangfei',2);b.enemies=[{id:90,boss:true,name:level===6?'雷烈':'鄧茂',lane:1,x:.17,hp:240,maxHp:340}];e.stepBattle(b,.1);e.skipDuelEntrance(b);while(b.duel.elapsed<5)e.stepBattle(b,.1);b.paused=true;document.querySelector('#duelTitle').textContent=level===6?'關羽 ＋ 張飛 對 雷烈':'張飛 對 鄧茂';const d=document.querySelector('#duelDialog');if(!d.open)d.showModal();v.renderDuel(b);window.touchDuel={e,v,b};document.querySelector('#duelPause').onclick=()=>{b.paused=!b.paused;v.renderDuel(b)}},level);
  await touchable(page.locator('#duelPause'));await page.locator('#duelPause').tap();await expect(page.locator('#duelPause')).toHaveText('暫停單挑');await page.locator('#duelPause').tap();
  const bar=page.locator(level===6?'#teamDuel [role=progressbar]':'#duelHeroHealth').first();await bar.scrollIntoViewIfNeeded();await expect(bar).toBeInViewport();expect(await page.locator('#duelDialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  if(page.viewportSize().height<=500){
   await page.locator('#duelDialog').evaluate(e=>e.scrollTop=0);
   const arena=page.locator(level===6?'.team-arena':'.duel-portraits');await expect(arena).toBeInViewport({ratio:1});
   const a=await arena.boundingBox(),controls=await page.locator('.duel-controls').boundingBox();expect(a.y+a.height).toBeLessThanOrEqual(controls.y+1);await expect(page.locator('#duelPause')).toBeInViewport({ratio:1});await expect(bar).toBeInViewport({ratio:1});
  }
  await page.screenshot({path:info.outputPath(`duel-${level}.png`)});
  const size=page.viewportSize(),before=await page.evaluate(()=>JSON.stringify(window.touchDuel.b));
  await page.setViewportSize({width:size.height,height:size.width});await touchable(page.locator('#duelPause'));expect(await page.evaluate(()=>JSON.stringify(window.touchDuel.b))).toBe(before);
  expect(await page.locator('#duelDialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.setViewportSize(size);
 }
});
