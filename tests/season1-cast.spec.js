const {test,expect}=require('@playwright/test');
test('first-season introductions only recommend heroes and attack units available at that stage',async({page})=>{
 await open(page);
 const errors=await page.evaluate(()=>{
  const aliases={firepea:'關羽',zhaoyun:'趙雲',pangtong:'龐統',machao:'馬超',huangzhong:'黃忠',zhangfei:'張飛',kongming:'孔明',liubei:'劉備'},errors=[];
  for(const lv of Object.values(LEVELS)){
   for(const [key,name] of Object.entries(aliases))if(UNLOCK_LEVEL.plants[key]>lv.level&&(lv.cardText+lv.plantHint).includes(name))errors.push(`stage ${lv.level}: ${name} too early`);
   for(const key of UNIT_ORDER.zombies)if(UNLOCK_LEVEL.zombies[key]>lv.level&&lv.zombieHint.includes(ZOMBIE_TYPES[key].name))errors.push(`stage ${lv.level}: attack recommends locked ${key}`);
  }
  if(LEVELS[9].plantHint.includes('定時召出三路刀兵'))errors.push('Liu Bei ordinary summon is not three lanes');
  if((LEVELS[9].cardText+LEVELS[9].zombieHint+LEVELS[9].difficulty).match(/全角色解鎖|全僵屍解鎖|雙方所有將領/))errors.push('stage nine is not all-zombie unlock');
  return errors;
 });expect(errors).toEqual([]);
});
test('ten stage cards match battle rosters in both routes without clipped text',async({page},testInfo)=>{
 await open(page);
 // Local progression fixture only; this does not claim gameplay completion.
 await page.evaluate(()=>{for(let n=1;n<=10;n++)completeCampaignLevel('plants',n);for(let n=1;n<10;n++)completeCampaignLevel('zombies',n);backToHome()});
 for(const faction of ['plants','zombies'])for(let n=1;n<=10;n++){
  await page.locator(faction==='plants'?'#plantStartBtn':'#zombieStartBtn').click();await page.locator('[data-season-choice="1"]').click();
  const card=page.locator('#levelGrid .level-card').nth(n-1),cast=card.locator('.level-cast');
  await card.scrollIntoViewIfNeeded();
  expect(await cast.evaluate(el=>el.scrollWidth<=el.clientWidth&&el.scrollHeight<=el.clientHeight)).toBe(true);
  await card.screenshot({path:testInfo.outputPath(`${faction}-${n}.png`)});
  const castText=await cast.innerText();
  if(faction==='zombies'&&n===10){expect(castText).toContain('首次通關獎勵：冥火屍巫');expect(castText.split('本關可用僵屍：')[1].split('首次通關獎勵')[0]).not.toContain('冥火屍巫');}
  await page.locator(`[data-jump-level="${n}"]`).click();await page.locator('#storySkip').click();await expect(page.locator('#game')).toHaveClass(/active/);
  const names=await page.locator('#cards .card').allTextContents();for(const text of names){const name=await page.evaluate(text=>Object.values(state.faction==='plants'?PLANT_TYPES:ZOMBIE_TYPES).find(d=>text.includes(d.name))?.name,text);expect(name).toBeTruthy();expect(castText).toContain(name);}
  await page.evaluate(()=>{clearInterval(timer);backToHome()});
 }
});
async function open(page){await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto(process.env.GAME_URL||'/');await page.locator('#plantStartBtn').click();await page.locator('[data-season-choice="1"]').click();}
test('first-season cast keeps all defenders and separates actual enemy waves from bosses',async({page})=>{
 await open(page);
 const rows=await page.evaluate(()=>Object.values(LEVELS).map(lv=>({level:lv.level,cast:document.querySelectorAll('#levelGrid .level-cast')[lv.level-1].innerText,plants:UNIT_ORDER.plants.filter(k=>UNLOCK_LEVEL.plants[k]<=lv.level).map(k=>PLANT_TYPES[k].name),enemies:[...new Set([...lv.zombieWeights,...(lv.openingZombies||[])])].filter(k=>!ZOMBIE_TYPES[k].hidden&&Number.isFinite(aiDelay(ZOMBIE_TYPES,k))).map(k=>ZOMBIE_TYPES[k].name),boss:ZOMBIE_TYPES[lv.bossType].name})));
 for(const row of rows){for(const name of [...row.plants,...row.enemies])expect(row.cast,`stage ${row.level}`).toContain(name);expect(row.cast).toContain(`關卡頭目：${row.boss}`);}
});
