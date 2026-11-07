const {test,expect}=require('@playwright/test');
async function open(page){await page.goto('/hero/');await expect(page.locator('#startBtn')).toBeVisible()}
async function battle(page){await open(page);await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('#battle')).toBeVisible()}

test('hero game has its own small home and loads no zombie, account or shop systems',async({page})=>{
 const requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await open(page);await expect(page).toHaveTitle('英雄演義｜桃園同心');
 await expect(page.locator('#home')).toContainText('桃園結義');
 await expect(page.locator('#home button')).toHaveCount(7);
 await expect(page.locator('#chapterDots button')).toHaveCount(6);
 expect(requests.some(url=>/supabase|js\/app.js|js\/cloud.js|js\/shop.js|js\/romance-game.js/.test(url))).toBe(false);
 expect(await page.evaluate(()=>typeof currentUser)).toBe('undefined');
 expect(errors).toEqual([]);
});
test('three lanes, four cards and a real paid deployment are usable on touch and desktop',async({page})=>{
 await battle(page);await expect(page.locator('#lanes button')).toHaveCount(3);await expect(page.locator('#cards button')).toHaveCount(4);
 await page.locator('[data-hero="zhangfei"]').click();await page.locator('[data-lane="1"].lane').click();
 await expect(page.locator('#units .ally[data-kind="zhangfei"]')).toHaveCount(1);
 expect(Number(await page.locator('#food').textContent())).toBeLessThan(140);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const card of await page.locator('#cards button').all()){const rect=await card.boundingBox();expect(rect.width).toBeGreaterThan(44);expect(rect.height).toBeGreaterThan(44)}
});
test('home and pause freeze battle and continue resumes the same units',async({page})=>{
 await battle(page);await page.locator('[data-hero="archer"]').click();await page.locator('.lane[data-lane="0"]').click();
 await page.locator('#pauseBtn').click();const x=await page.locator('.ally').getAttribute('style'),food=await page.locator('#food').textContent();await page.waitForTimeout(250);
 expect(await page.locator('.ally').getAttribute('style')).toBe(x);expect(await page.locator('#food').textContent()).toBe(food);
 await page.locator('#battle [data-home]').click();await expect(page.locator('#home')).toBeVisible();await expect(page.locator('#startBtn')).toContainText('繼續戰鬥');
 await page.locator('#startBtn').click();await expect(page.locator('.ally')).toHaveCount(1);await expect(page.locator('#pauseOverlay')).toBeHidden();
});
test('own progress survives reload and leaves original zombie and legacy story records untouched',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('sgZombieProfile','{"gold":12345}');localStorage.setItem('sgzRomance_progress_v1:guest%3Aold','{"highestLevel":4}');localStorage.setItem('heroLegendProgress_v1','{"version":1,"completed":2}')});
 await open(page);await expect(page.locator('#homeProgress')).toContainText('2 / 6');await page.locator('#startBtn').click();await expect(page.locator('#storyTitle')).toHaveText('大興山迎敵');
 await page.reload();await expect(page.locator('#homeProgress')).toContainText('2 / 6');
 expect(await page.evaluate(()=>localStorage.getItem('sgZombieProfile'))).toBe('{"gold":12345}');
 expect(await page.evaluate(()=>localStorage.getItem('sgzRomance_progress_v1:guest%3Aold'))).toBe('{"highestLevel":4}');
});
test('zombie game opens directly to its own factions without shared adventure menus',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto('/');
 await expect(page.locator('#start')).toHaveAttribute('data-home-view','zombies');await expect(page.locator('#romanceStartBtn')).toHaveCount(0);await expect(page.locator('#zombieCampaignBtn')).toHaveCount(0);
 await expect(page.locator('#start .mode-banner:visible strong')).toHaveText(['萌將守城','屍軍攻城']);
 await page.locator('#zombieStartBtn').click();await expect(page.locator('#seasonPicker')).toBeVisible();await page.locator('#backFactionBtn').click();await expect(page.locator('#start')).toHaveAttribute('data-home-view','zombies');
});
test('a full first chapter battle can be won through real UI deployments and saves progress',async({page})=>{
 test.setTimeout(90000);await page.clock.install();await battle(page);
 const costs={archer:50,zhangfei:110,liubei:90,guanyu:100};
 for(let second=0;second<245;second++){
  if(await page.locator('#bossIntro').isVisible())await page.locator('#bossIntroContinue').click();
  if(await page.locator('#result').isVisible())break;
  for(const lane of [1,0,2]){
   const kinds=await page.locator(`.ally[data-lane="${lane}"]`).evaluateAll(nodes=>nodes.map(n=>n.dataset.kind));
   const hero={0:'liubei',1:'zhangfei',2:'guanyu'}[lane],key=!kinds.includes('archer')?'archer':!await page.locator(`.ally[data-kind="${hero}"]`).count()?hero:kinds.filter(k=>k==='archer').length<2?'archer':hero,card=page.locator(`[data-hero="${key}"]`);
   if(kinds.length>=3||Number(await page.locator('#food').textContent())<costs[key]||await card.getAttribute('class').then(s=>s.includes('unavailable')))continue;
   await card.click();await page.locator(`.lane[data-lane="${lane}"]`).click();
  }
  await page.clock.runFor(1000);
 }
 await expect(page.locator('#resultTitle')).toHaveText('此戰告捷');
 await expect(page.locator('body')).not.toHaveClass(/battle-focus/);await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')).completed)).toBe(1);
 await page.locator('#resultNext').click();await expect(page.locator('#storyTitle')).toHaveText('義軍初成');await expect(page.locator('#storyChapter')).toContainText('戰後');await page.locator('#storySkip').click();await expect(page.locator('#storyTitle')).toHaveText('糧道遇襲');
});

test('story opens in a real scene with conversations, speaker emphasis and previous-line navigation',async({page})=>{
 await open(page);await page.locator('#startBtn').click();
 await expect(page.locator('#sceneBackdrop')).toHaveAttribute('src',/peach-garden/);
 await expect(page.locator('#storySpeaker')).toHaveText('張飛');await expect(page.locator('[data-actor="zhangfei"]')).toHaveClass(/speaking/);
 await expect(page.locator('#storyPrevious')).toBeDisabled();const first=await page.locator('#storyLine').textContent();
 await page.locator('#storyNext').click();await expect(page.locator('#storySpeaker')).toHaveText('劉備');
 await expect(page.locator('[data-actor="liubei"]')).toHaveClass(/speaking/);
 await page.locator('#storyPrevious').click();await expect(page.locator('#storyLine')).toHaveText(first);
 const data=await page.evaluate(async()=>{const {STAGES}=await import('/hero/story.mjs');return STAGES.map(s=>({scene:s.scene,opening:s.opening.length,ending:s.ending.length,speakers:[...s.opening,...s.ending].map(l=>l[0])}))});
 expect(new Set(data.map(d=>d.scene)).size).toBe(6);for(const d of data){expect(d.opening).toBeGreaterThanOrEqual(7);expect(d.ending).toBeGreaterThanOrEqual(4);expect(d.speakers.every(s=>['劉備','關羽','張飛'].includes(s))).toBe(true)}
 expect(await page.locator('#sceneBackdrop').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const selector of ['#storyNext','#storyPrevious','#storySkip']){const r=await page.locator(selector).boundingBox();expect(r.height).toBeGreaterThanOrEqual(44)}
});

test('units keep their animation nodes and show real attack effects on clearly marked lanes',async({page})=>{
 await page.clock.install();await battle(page);await expect(page.locator('.lane-label')).toHaveText(['上路','中路','下路']);await expect(page.locator('.deploy-zone-label')).toHaveCount(3);
 await page.locator('[data-hero="zhangfei"]').click();await page.locator('.lane[data-lane="1"]').click();
 await page.locator('.ally').evaluate(el=>{window.firstAnimatedUnit=el});await page.clock.runFor(1000);
 expect(await page.locator('.ally').evaluate(el=>el===window.firstAnimatedUnit)).toBe(true);
 await expect(page.locator('.ally .unit-figure')).toHaveCSS('animation-name','unit-march');
 await page.evaluate(()=>{new MutationObserver(()=>{const unit=document.querySelector('.ally.striking .unit-figure');if(unit&&document.querySelector('.combat-effect.slash')){window.sawAnimatedStrike=true;window.strikeAnimation=getComputedStyle(unit).animationName;window.strikePose=unit.querySelector('.attack-sprite')?.dataset.frame}}).observe(document.querySelector('#field'),{subtree:true,attributes:true,childList:true})});
 await page.clock.runFor(40000);expect(await page.evaluate(()=>!!window.sawAnimatedStrike)).toBe(true);expect(await page.evaluate(()=>window.strikeAnimation)).toBe('none');expect(Number(await page.evaluate(()=>window.strikePose))).toBeGreaterThanOrEqual(3);
 await page.locator('#pauseBtn').click();await expect(page.locator('.ally .unit-figure')).toHaveCSS('animation-play-state','paused');
});

test('hero cards explain uniqueness and progressively introduce the chapter abilities',async({page})=>{
 await battle(page);await expect(page.locator('#featureBadge')).toContainText('三路布陣');await expect(page.locator('[data-hero="liubei"] .ability-description')).toContainText('第2關');
 await page.locator('[data-hero="liubei"]').click();await page.locator('.lane[data-lane="0"]').click();await expect(page.locator('[data-hero="liubei"]')).toBeEnabled();await expect(page.locator('[data-hero="liubei"] .card-status')).toHaveText('出戰中 · 點選換路');await expect(page.locator('.ally[data-kind="liubei"]')).toHaveCount(1);
 for(const [level,name,key,ability] of [[2,'仁德','liubei','仁德'],[3,'燕人怒吼','zhangfei','怒吼'],[4,'青龍斬','guanyu','青龍斬'],[5,'黃巾盾兵','guanyu','青龍斬'],[6,'桃園同心','liubei','仁德']]){
  await page.evaluate(level=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({version:1,completed:level-1})),level);await page.reload();await page.locator('#startBtn').click();await page.locator('#storySkip').click();
  await expect(page.locator('#featureBadge')).toContainText(name);await expect(page.locator(`[data-hero="${key}"] .ability-description`)).toContainText(ability);
 }
});

test('all three generals use transparent redrawn attack frames, not a rotated portrait',async({page})=>{
 test.setTimeout(90000);
 await page.clock.install();
 for(const key of ['liubei','guanyu','zhangfei']){
  await page.goto('/hero/');await page.locator('#startBtn').click();await page.locator('#storySkip').click();await page.locator(`[data-hero="${key}"]`).click();await page.locator('.lane[data-lane="1"]').click();
  const sprite=page.locator(`.ally[data-kind="${key}"] .attack-sprite`);await expect(sprite).toBeVisible();
  const texture=await sprite.evaluate(async el=>{const img=new Image();img.src=getComputedStyle(el).backgroundImage.slice(5,-2);await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const empty=ctx.getImageData(0,0,1,1).data[3],cell=img.width/3;const hash=(x,y)=>{const d=ctx.getImageData(x,y,cell,cell).data;let sum=0;for(let i=0;i<d.length;i+=4)sum=(sum+d[i]*d[i+3]+d[i+1]*17+d[i+2]*31)>>>0;return sum};return {width:img.width,height:img.height,empty,guard:hash(0,0),impact:hash(0,cell)}});
  expect(texture.width/texture.height).toBe(1.5);expect(texture.empty).toBe(0);expect(texture.guard).not.toBe(texture.impact);
  await page.evaluate(key=>{window.drawnFrames=new Set();new MutationObserver(()=>{const el=document.querySelector(`.ally[data-kind="${key}"].striking .attack-sprite`);if(el)window.drawnFrames.add(Number(el.dataset.frame))}).observe(document.querySelector('#units'),{subtree:true,attributes:true})},key);
  await page.clock.runFor(38000);const frames=await page.evaluate(()=>[...window.drawnFrames]);expect(frames).toEqual(expect.arrayContaining([0,1,2,3,5]));
  await expect(page.locator(`.ally[data-kind="${key}"] .sprite-upper`)).toHaveCount(0);
 }
});
