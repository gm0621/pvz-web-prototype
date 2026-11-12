const {test,expect}=require('@playwright/test');
const KEY='heroLegendProgress_v1';
const names=n=>n>=20&&n<=22?['孫堅','程普','黃蓋']:n>=17?['曹操','夏侯惇','曹洪']:['劉備','關羽','張飛'];
const faction=n=>n>=20&&n<=22?'sun':n>=17?'cao':'shu';
const chapter=n=>n>=59?11:n>=53?10:n>=47?9:n>=41?8:n>=35?7:n>=29?6:n>=23?5:n>=17?4:n>=11?3:n>=7?2:1;
async function setup(page,completed=0){await page.clock.install();await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(completed=>{const key='heroLegendProgress_v1';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({completed,coins:completed*80}));const set=Storage.prototype.setItem;window.blockSave=false;Storage.prototype.setItem=function(k,v){if(k===key&&window.blockSave)throw Error('blocked');return set.call(this,k,v)}},completed);await page.route('**/hero/engine.mjs?*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('return {level,mission:','window.transitionDeploy=deploy;return window.transitionBattle={level,mission:')})});await page.goto('/hero/');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000))}
async function tap(locator){await locator.scrollIntoViewIfNeeded();const r=await locator.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);expect(await locator.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===hit||e.contains(hit)})).toBe(true);await locator.click()}
async function stored(page){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)}
async function win(page){await page.evaluate(()=>{const b=window.transitionBattle;b.food=1000;for(const key of ['liubei','guanyu','zhangfei'])window.transitionDeploy(b,key,1);for(const u of b.allies)u.x=.1;b.enemies=[];b.bossSpawned=true;b.nextSpawn=Infinity;if(b.mission)Object.assign(b.mission,{hold:24,rescued:3,delivered:3,sites:[8,8,8],flags:3,finaleAt:.001,ordered:true,withdrawAt:0,decoyUsed:true})});await page.clock.runFor(100);await expect(page.locator('#result')).toBeVisible()}
async function select(page,n){await page.locator('#chapterPicker').evaluate(e=>e.open=true);await tap(page.locator(`#chapterTabs [data-chapter="${chapter(n)}"]`));await tap(page.locator(`#chapterDots [data-level="${n}"]`))}
async function unlocks(page,completed){await page.locator('#chapterPicker').evaluate(e=>e.open=true);for(let c=1;c<=11;c++){await tap(page.locator(`#chapterTabs [data-chapter="${c}"]`));for(const b of await page.locator(`#chapterDots [data-chapter="${c}"]`).all()){const n=Number(await b.getAttribute('data-level'));if(n<=completed+1)await expect(b).toBeEnabled();else await expect(b).toBeDisabled();expect(await b.evaluate(e=>e.classList.contains('complete'))).toBe(n<=completed)}}expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}

test('Cao archers retain natural colors, Dong soldiers face left, and skill guide pauses and restores',async({page},info)=>{
 await setup(page,16);await tap(page.locator('#startBtn'));await tap(page.locator('#storySkip'));await page.evaluate(()=>window.transitionDeploy(window.transitionBattle,'archer',1));await page.clock.runFor(10000);
 await expect(page.locator('.ally[data-kind=archer] .unit-figure')).toHaveCSS('filter','none');await expect(page.locator('.enemy.atlas-unit .frame-figure').first()).toHaveCSS('transform','matrix(-1, 0, 0, 1, 0, 0)');
 await tap(page.locator('#skillGuideButton'));const before=await page.evaluate(()=>window.transitionBattle.time);await page.clock.runFor(4000);expect(await page.evaluate(()=>window.transitionBattle.time)).toBe(before);
 for(const [army,people] of [['17',['曹操','夏侯惇','曹洪']],['20',['孫堅','程普','黃蓋']],['1',['劉備','關羽','張飛']]]){await page.locator('#skillGuide select').selectOption(army);for(const name of people)await expect(page.locator('#skillGuide')).toContainText(name);expect(await page.locator('#skillGuide').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true)}
 await page.screenshot({path:info.outputPath('skill-guide.png'),fullPage:true});await tap(page.locator('#skillGuide header button'));await expect.poll(()=>page.evaluate(()=>window.transitionBattle.paused)).toBe(false);
 await tap(page.locator('#pauseBtn'));await tap(page.locator('#skillGuideButton'));await tap(page.locator('#skillGuide header button'));await expect.poll(()=>page.evaluate(()=>window.transitionBattle.paused)).toBe(true);
});
test('stage 18 cleared battlefield guides missing lane and three real shipment clicks finish and save',async({page},info)=>{
 test.setTimeout(90000);await setup(page,17);await tap(page.locator('#startBtn'));await tap(page.locator('#storySkip'));
 await page.evaluate(()=>{const b=window.transitionBattle;b.bossSpawned=true;b.nextSpawn=Infinity;b.enemies=[];b.food=300;window.transitionDeploy(b,'liubei',0);window.transitionDeploy(b,'guanyu',1)});await page.clock.runFor(100);
 await expect(page.locator('#missionObjective')).toContainText('下路');await expect(page.locator('#missionObjective')).toContainText('敵軍已清退');await expect(page.locator('#result')).not.toBeVisible();
 await tap(page.locator('[data-hero=archer]'));await tap(page.locator('.lane[data-lane="2"]'));
 for(let i=0;i<3;i++){await page.clock.runFor(15000);await tap(page.locator('[data-action=supply]'));await page.clock.runFor(100)}
 await expect(page.locator('#result')).toBeVisible();expect(await stored(page)).toMatchObject({completed:18,coins:1440});await page.screenshot({path:info.outputPath('supply-complete.png'),fullPage:true});await page.reload();expect(await stored(page)).toMatchObject({completed:18,coins:1440});
});
test('legacy Liu ranks never equip Cao or Sun; purchases, failed writes and reload preserve distinct ranks',async({page})=>{
 test.setTimeout(90000);await setup(page,22);await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('heroLegendProgress_v1'));p.weapons={liubei:3,guanyu:2,zhangfei:1};localStorage.setItem('heroLegendProgress_v1',JSON.stringify(p))});await page.reload();
 for(const n of [17,20,1,23]){await select(page,n);await tap(page.locator('#storySkip'));expect(await page.evaluate(()=>window.transitionBattle.weapons.liubei)).toBe(n===1?3:n===23?1:0);await win(page);await tap(page.locator('#resultNext'));await tap(page.locator('[data-shop=weapons]'));
 if(n===17||n===20){await page.evaluate(()=>window.blockSave=true);await tap(page.locator('[data-buy=liubei]'));await expect(page.locator('#campMessage')).toContainText('未購買');await page.evaluate(()=>window.blockSave=false);await tap(page.locator('[data-buy=liubei]'));await expect(page.locator('#shopGoods')).toContainText('已強化 1 / 3');}
 await page.reload();}
 expect(await stored(page)).toMatchObject({weapons:{liubei:3,guanyu:2,zhangfei:1},armyWeapons:{cao:{liubei:1},sun:{liubei:1}}});
});

test('skill guide stays paused after leaving the page and after fullscreen dialog reattachment',async({page})=>{
 await setup(page,16);await tap(page.locator('#startBtn'));await tap(page.locator('#storySkip'));await tap(page.locator('#skillGuideButton'));
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await tap(page.locator('#skillGuide header button'));await expect.poll(()=>page.evaluate(()=>window.transitionBattle.paused)).toBe(true);
 await tap(page.locator('#resumeBtn'));await tap(page.locator('#skillGuideButton'));await page.evaluate(()=>{const d=document.getElementById('skillGuide');d.close();d.showModal()});await page.clock.runFor(1000);await expect.poll(()=>page.evaluate(()=>window.transitionBattle.paused)).toBe(true);await tap(page.locator('#skillGuide header button'));await expect.poll(()=>page.evaluate(()=>window.transitionBattle.paused)).toBe(false);
});

test('stage 17 escort completes via three routes, freezes in guide, and recovers failed victory save',async({page},info)=>{
 test.setTimeout(90000);await setup(page,16);await tap(page.locator('#startBtn'));await tap(page.locator('#storySkip'));
 await page.evaluate(()=>{const b=window.transitionBattle;b.bossSpawned=true;b.nextSpawn=Infinity;b.enemies=[];b.food=300});
 for(const lane of [0,1,2]){await tap(page.locator('[data-hero=archer]'));await tap(page.locator(`.lane[data-lane="${lane}"]`));await page.clock.runFor(4500)}
 await tap(page.locator('#skillGuideButton'));const frozen=await page.evaluate(()=>JSON.stringify(window.transitionBattle));await page.clock.runFor(2000);expect(await page.evaluate(()=>JSON.stringify(window.transitionBattle))).toBe(frozen);await tap(page.locator('#skillGuide header button'));
 await page.evaluate(()=>window.blockSave=true);await page.clock.runFor(30000);await expect(page.locator('#result')).toBeVisible();expect(await stored(page)).toMatchObject({completed:16,coins:1280});await expect(page.locator('#resultRetrySave')).toBeVisible();await page.evaluate(()=>window.blockSave=false);await tap(page.locator('#resultRetrySave'));expect(await stored(page)).toMatchObject({completed:17,coins:1360});await page.screenshot({path:info.outputPath('escort-save.png'),fullPage:true});await page.reload();await tap(page.locator('#startBtn'));await tap(page.locator('#storySkip'));expect(await page.evaluate(()=>window.transitionBattle.level)).toBe(18);
});

test('all nine weapon purchases remain with their named generals after switching armies and reloading',async({page})=>{
 test.setTimeout(120000);await setup(page,64);const expected={1:{liubei:1,guanyu:2,zhangfei:3},17:{liubei:3,guanyu:1,zhangfei:2},20:{liubei:2,guanyu:3,zhangfei:1}};let spent=0;
 for(const level of [1,17,20]){await select(page,level);await tap(page.locator('#storySkip'));await win(page);await tap(page.locator('#resultNext'));await tap(page.locator('[data-shop=weapons]'));
 for(const [key,rank] of Object.entries(expected[level]))for(let n=1;n<=rank;n++){await tap(page.locator(`[data-buy=${key}]`));spent+=60*n}
 await tap(page.locator('#campPrepare'));for(const [i,rank] of Object.values(expected[level]).entries())await expect(page.locator('#campHeroes .camp-hero').nth(i)).toContainText(`兵器強化 ${rank} / 3`);await page.reload();}
 for(const level of [20,1,17,23]){await select(page,level);await tap(page.locator('#storySkip'));expect(await page.evaluate(()=>window.transitionBattle.weapons)).toEqual(expected[level===23?17:level]);await tap(page.locator('#skillGuideButton'));await expect(page.locator('#skillGuide select')).toHaveValue(String(level===23?17:level));await tap(page.locator('#skillGuide header button'));await page.locator('#battle [data-home]').click()}
 expect(await stored(page)).toMatchObject({coins:5120-spent,weapons:expected[1],armyWeapons:{cao:expected[17],sun:expected[20]}});
});
