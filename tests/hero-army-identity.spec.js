const {test,expect}=require('@playwright/test');
const names={cao:['曹操','夏侯惇','曹洪'],sun:['孫堅','程普','黃蓋'],shu:['劉備','關羽','張飛']},keys=['liubei','guanyu','zhangfei'];
const army=n=>n>=20?'sun':n>=17?'cao':'shu';
async function setup(page){
 await page.clock.install();await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({completed:22,coins:2000})));
 // Expose only the test battle; keep production roster and UI transitions intact.
 await page.route('**/hero/engine.mjs?*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('return {level,mission:','return window.armyBattle={level,mission:')})});
 await page.goto('/hero/');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
}
async function select(page,level){await page.locator('#chapterPicker').evaluate(e=>e.open=true);await page.locator(`#chapterTabs [data-chapter="${level>=17?4:1}"]`).click();await page.locator(`#chapterDots [data-level="${level}"]`).click()}
async function portrait(locator,name,faction,row){
 await expect(locator).toHaveAttribute('alt',name);
 const art=await locator.evaluate(async e=>{const bg=e.style.backgroundImage;const url=bg?bg.slice(5,-2):e.src;const loaded=await new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(true);i.onerror=()=>resolve(false);i.src=url});return {bg,pos:e.style.backgroundPosition,src:e.src,loaded}});
 expect(art.loaded).toBe(true);
 if(faction==='shu'){expect(art.bg).toBe('');expect(art.src).toContain(`/assets/${keys[row]}.`)}else{expect(art.bg).toContain(`/factions/${faction}.png`);expect(art.pos).toBe(`0% ${row*50}%`)}
}
async function speaker(page,id,face,faction){const name=await page.locator(id).textContent(),row=names[faction].indexOf(name);if(row>=0){await expect(page.locator(face)).toBeVisible();await portrait(page.locator(face),name,faction,row)}else await expect(page.locator(face)).toBeHidden()}
async function dialogue(page,faction){const count=Number((await page.locator('#storyCount').textContent()).split('/')[1]);for(let i=0;i<count;i++){await speaker(page,'#storySpeaker','#storyPortrait',faction);if(i<count-1)await page.locator('#storyNext').click()}}
async function fits(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
test('all six coalition stages retain their identities in novels, dialogue and cards across switches',async({page},info)=>{
 test.setTimeout(180000);await setup(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const level of [17,20,18,21,19,22,3]){
  const faction=army(level);await select(page,level);const count=Number((await page.locator('#novelCount').textContent()).split('/')[1]);
  for(let i=0;i<count;i++){await speaker(page,'#novelSpeaker','#novelPortrait',faction);if(i<count-1)await page.locator('#novelNext').click()}
  await page.locator('#novelQuiz').click();const taskName=await page.locator('#taskPortrait').getAttribute('alt');expect(names[faction]).toContain(taskName);await portrait(page.locator('#taskPortrait'),taskName,faction,names[faction].indexOf(taskName));
  await page.locator('#prologueContinue').click();for(const [i,key] of keys.entries())await portrait(page.locator(`[data-actor=${key}]`),names[faction][i],faction,i);await dialogue(page,faction);await fits(page);
  await page.locator('#storySkip').click();for(const [i,key] of keys.entries()){const card=page.locator(`#cards [data-hero=${key}]`);await expect(card.locator('strong')).toHaveText(names[faction][i]);await expect(card).toHaveAttribute('aria-label',new RegExp(names[faction][i]));await portrait(card.locator('img'),names[faction][i],faction,i)}
  await fits(page);if(level===20)await page.screenshot({path:info.outputPath('sun-cards.png'),fullPage:true,timeout:10000});await page.locator('#battle [data-home]').click();
 }expect(errors).toEqual([]);
});
test('victory camps and ending dialogue retain all six stage rosters, equipment and conversation speakers',async({page},info)=>{
 test.setTimeout(180000);await setup(page);
 for(const level of [17,20,18,21,19,22]){
  const faction=army(level);await select(page,level);await page.locator('#storySkip').click();
  // Controlled completion validates result -> camp -> ending, not natural battle balance.
  await page.evaluate(async()=>{const b=window.armyBattle,{deploy}=await import('/hero/engine.mjs?v=economy-save-1');b.food=1000;deploy(b,'liubei',0);deploy(b,'zhangfei',1);b.allies.forEach(u=>u.x=.1);b.enemies=[];b.bossSpawned=true;b.nextSpawn=Infinity;Object.assign(b.mission,{rescued:3,delivered:3,sites:[8,8,8],ordered:true,withdrawAt:0,decoyUsed:true});});await page.clock.runFor(100);
  await expect(page.locator('#result')).toBeVisible();await page.locator('#resultNext').click();
  for(const [i,key] of keys.entries()){
   if(key==='liubei')continue;const button=page.locator(`[data-talk=${key}]`);await expect(button.locator('strong')).toHaveText(names[faction][i]);await portrait(button.locator('img'),names[faction][i],faction,i);await button.click();
   for(let line=0;line<2;line++){await speaker(page,'#campTalkName','#campTalkPortrait',faction);if(level===20&&line===0)await page.screenshot({path:info.outputPath(`camp-${key}.png`),fullPage:true,timeout:10000});await page.locator('#campTalkNext').click()}
  }
  await page.locator('#campPrepare').click();for(let i=0;i<3;i++){const card=page.locator('#campHeroes .camp-hero').nth(i);await expect(card.locator('strong')).toContainText(names[faction][i]);await portrait(card.locator('img'),names[faction][i],faction,i)}
  await page.locator('[data-shop=weapons]').click();for(let i=0;i<3;i++)await expect(page.locator('#shopGoods h4').nth(i)).toHaveText(names[faction][i]+'・兵器整備');if([17,20].includes(level)){await page.locator('[data-buy=guanyu]').click();await expect(page.locator('#campMessage')).toContainText(names[faction][1]+'兵器')}await fits(page);
  await page.locator('#campContinue').click();await dialogue(page,faction);if(level===22)await expect(page.locator('#storyNext')).toHaveText('回主選單 →');await page.locator('#story [data-home]').click();
 }
});
test('defeat camps preserve the active army and retry uses the same cards',async({page})=>{
 await setup(page);for(const level of [19,20]){const faction=army(level);await select(page,level);await page.locator('#storySkip').click();await page.evaluate(()=>window.armyBattle.lives=0);await page.clock.runFor(100);await page.locator('#resultNext').click();for(const [i,key] of keys.entries()){if(i===0)continue;await page.locator(`[data-talk=${key}]`).click();await speaker(page,'#campTalkName','#campTalkPortrait',faction);await page.locator('#campTalkNext').click();await speaker(page,'#campTalkName','#campTalkPortrait',faction);await page.locator('#campTalkNext').click()}await page.locator('#campContinue').click();await expect(page.locator('[data-hero=liubei] strong')).toHaveText(names[faction][0]);await page.locator('#battle [data-home]').click()}
});
test('coalition combat cannot start invented duels; switching back restores Zhang Fei duel portraits',async({page})=>{
 test.setTimeout(60000);await setup(page);
 for(const level of [19,20,21,3]){await select(page,level);await page.locator('#storySkip').click();await page.evaluate(async level=>{const b=window.armyBattle,{deploy}=await import('/hero/engine.mjs?v=economy-save-1');b.food=1000;b.nextSpawn=Infinity;b.bossSpawned=true;for(const key of ['liubei','guanyu','zhangfei'])deploy(b,key,1);b.enemies=[{id:900,name:level===3?'鄧茂':level===21?'華雄':'徐榮',boss:true,lane:1,x:.17,hp:100,maxHp:500,damage:0,rate:100,speed:0,lastAttack:0,nextSkill:Infinity}];},level);await page.clock.runFor(100);
 if(level!==3){await expect(page.locator('#duelDialog')).toBeHidden();await page.locator('#battle [data-home]').click()}else{
 await expect(page.locator('#duelTitle')).toHaveText('張飛 對 鄧茂');await portrait(page.locator('#versusHero'),'張飛','shu',2);await expect(page.locator('#versusHeroName')).toHaveText('張飛');await page.locator('#duelEnter').click();await page.clock.runFor(100);await portrait(page.locator('#duelHeroFace'),'張飛','shu',2);await expect(page.locator('#duelHeroHpText')).toContainText('張飛');await expect(page.locator('#duelEnemyFace')).toHaveAttribute('alt','鄧茂');expect(await page.locator('#duelDialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 }}
});
