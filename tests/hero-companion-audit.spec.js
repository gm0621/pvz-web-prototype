const {test,expect}=require('@playwright/test');
async function tap(l){await l.scrollIntoViewIfNeeded();const r=await l.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);await l.click()}
async function face(page,selector,name){const img=page.locator(selector);await expect(img).toHaveAttribute('alt',name);await expect.poll(()=>img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);const actual=await img.evaluate(e=>({src:e.getAttribute('src'),bg:e.style.backgroundImage,pos:e.style.backgroundPosition,size:e.style.backgroundSize}));const expected=await page.evaluate(async name=>{const {PEOPLE}=await import('./people-data.mjs?v=cao-people-1');const {paintPortrait}=await import('./factions.mjs?v=chapter-six-1');const e=document.createElement('img');paintPortrait(e,PEOPLE.find(p=>p.name===name).portrait);return{src:e.getAttribute('src'),bg:e.style.backgroundImage,pos:e.style.backgroundPosition,size:e.style.backgroundSize}},name);expect(actual).toEqual(expected)}
test('all twelve camps: every speaker matches book, revisits and loss clear companion portraits',async({page},info)=>{
 test.setTimeout(120000);await page.goto('/hero/');const saved=await page.evaluate(()=>localStorage.getItem('heroLegendProgress_v1'));
 for(let level=23;level<=34;level++)for(const won of [true,false]){
  const lines=await page.evaluate(async({level,won})=>{const {mountCamp}=await import('./camp-view.mjs?v=cao-people-1');const {STAGES,heroesForLevel}=await import('./story.mjs?v=cao-people-1');const {campConversation}=await import('./camp-talk.mjs?v=cao-people-1');document.querySelectorAll('.screen').forEach(e=>{e.hidden=e.id!=='camp';e.classList.toggle('active',e.id==='camp')});const progress={coins:100,weapons:{liubei:0,guanyu:0,zhangfei:0},inventory:{herb:0,grain:0}};mountCamp({progress,level,heroes:heroesForLevel(level),stage:STAGES[level-1],won,onSave:()=>true,onContinue:()=>{}});return Object.fromEntries(['guanyu','zhangfei'].map(key=>[key,campConversation(level,key,won)]))},{level,won});
  for(const key of ['guanyu','zhangfei']){await tap(page.locator(`[data-talk=${key}]`));for(const line of lines[key]){const name=line.includes('：')?line.split('：')[0]:key==='guanyu'?'夏侯惇':'曹洪';await expect(page.locator('#campTalkName')).toHaveText(name);await face(page,'#campTalkPortrait',name);for(const img of await page.locator('#campTalkPeople img').all()){const name=await img.getAttribute('alt');await face(page,`#campTalkPeople img[alt="${name}"]`,name)}expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await tap(page.locator('#campTalkNext'))}await expect(page.locator('#campTalk')).toBeHidden()}
  if(won){await tap(page.locator('#campVisitors'));await expect(page.locator('#campTalkPeople')).toBeHidden();await expect(page.locator('#campTalkPortrait')).toBeHidden();await tap(page.locator('#campTalkNext'))}else await expect(page.locator('#campVisitors')).toBeHidden();
 }
 expect(await page.evaluate(()=>localStorage.getItem('heroLegendProgress_v1'))).toBe(saved);
});
test('twelve openings: forward and backward portraits agree with book',async({page},info)=>{
 test.setTimeout(180000);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/hero/');
 for(let level=23;level<=34;level++){
  await page.evaluate(level=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({completed:level-1,coins:100})),level);await page.reload();await tap(page.locator('#startBtn'));
  for(const mode of ['novel','story']){
   if(mode==='story')await tap(page.locator('#prologueContinue'));
   const total=Number((await page.locator(`#${mode}Count`).textContent()).split('/')[1]);
   const check=async()=>{const name=await page.locator(`#${mode}Speaker`).textContent();const known=await page.evaluate(async name=>(await import('./people-data.mjs?v=cao-people-1')).PEOPLE.some(p=>p.name===name),name);if(known)await face(page,`#${mode}Portrait`,name);else await expect(page.locator(`#${mode}Portrait`)).toBeHidden();for(const img of await page.locator(`#${mode}People img`).all())await face(page,`#${mode}People img[alt="${await img.getAttribute('alt')}"]`,await img.getAttribute('alt'));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)};
   for(let n=0;n<total;n++){await check();if(level===25&&['曹仁','夏侯淵'].includes(await page.locator(`#${mode}Speaker`).textContent()))await page.screenshot({path:info.outputPath(`${mode}-${await page.locator(`#${mode}Speaker`).textContent()}.png`),fullPage:true});if(n<total-1)await tap(page.locator(`#${mode}Next`))}
   for(let n=total-1;n>0;n--){await tap(page.locator(`#${mode}Previous`));await check()}
  }
 }
});
