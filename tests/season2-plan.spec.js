const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const vm=require('node:vm');

test('season-two preview has two ten-stage plans, valid independent unlocks and no gameplay writes',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto('/');
 const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
 const defs=await page.evaluate(()=>JSON.stringify({plants:PLANT_TYPES,zombies:ZOMBIE_TYPES,levels:LEVELS}));
 await page.locator('#season2PreviewLink').click();
 await expect(page).toHaveURL(/season2\.html/);
 await expect(page.locator('#previewNotice')).toContainText('尚未開放遊玩');
 await expect(page.locator('#season2Title')).toContainText('北境鐵壁');
 for(const mode of ['defense','attack']){
  await page.locator(`[data-plan-mode="${mode}"]`).click();
  await expect(page.locator(`[data-plan-mode="${mode}"]`)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.stage-plan')).toHaveCount(10);
  await expect(page.locator('#starterRoster .unit-chip')).toHaveCount(2);
  for(let i=0;i<10;i++){
   const card=page.locator('.stage-plan').nth(i);
   await expect(card.locator('.stage-number')).toHaveText(`第 ${i+1} 關`);
   await expect(card.locator('.reward-name')).toHaveText(await page.evaluate(({mode,i})=>season2Roster(mode).find(d=>d.key===SEASON2_PLAN.rewards[mode][i]).name,{mode,i}));
   const cover=card.locator('.scene-art img');
   await expect(cover).toHaveAttribute('src',`assets/backgrounds/season2/s2-${String(i+1).padStart(2,'0')}.webp`);
   await cover.evaluate(im=>im.decode());
   expect(await cover.evaluate(im=>[im.naturalWidth,im.naturalHeight])).toEqual([1672,i===4?940:941]);
   await expect(card.locator('.scene-placeholder')).toBeHidden();
   await card.locator('summary').click();
   await expect(card.locator('.available-roster .unit-name')).toHaveCount(i+2);
   await expect(card.locator('.art-brief')).not.toBeEmpty();
   await card.locator('summary').click();
  }
  await page.locator('img').evaluateAll(ims=>Promise.all(ims.map(im=>im.decode())));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 const check=await page.evaluate(()=>{
  const p=SEASON2_PLAN;
  for(const mode of ['defense','attack']){
   const units=season2Roster(mode).map(d=>d.key),all=[...p.initial[mode],...p.rewards[mode]];
   if(new Set(all).size!==12||!all.every(k=>units.includes(k)))return false;
   for(let level=1;level<=10;level++){
    const available=season2Available(mode,level);
    if(available.length!==level+1||available.includes(p.rewards[mode][level-1]))return false;
    const opponent=season2Roster(mode==='defense'?'attack':'defense').map(d=>d.key);
    const challenge=p.stages[level-1][mode];
    if(![...challenge.enemies,challenge.leader].every(k=>opponent.includes(k)))return false;
   }
  }
  return p.stages.length===10&&new Set(p.stages.map(s=>s.name)).size===10&&p.stages.every((s,i)=>s.cardArt===`assets/backgrounds/season2/s2-${String(i+1).padStart(2,'0')}.webp`)&&season2Available('attack',11).length===0&&season2Available('defense',0).length===0;
 });
 expect(check).toBe(true);
 await page.locator('#backToGame').click();
 await expect(page.locator('#start')).toBeVisible();
 expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(before);
 expect(await page.evaluate(()=>JSON.stringify({plants:PLANT_TYPES,zombies:ZOMBIE_TYPES,levels:LEVELS}))).toBe(defs);
 expect(errors).toEqual([]);
});

test('visiting season-two plans preserves and resumes a paused first-season battle',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto('/');
 await page.evaluate(()=>{
  selectedLevel=1;start('plants');clearInterval(timer);state.time=23450;state.resource=287;
  addPlant('peashooter',2,2);addZombie('normal',7.2,2);render();
 });
 await page.locator('#backBtn').click();
 await expect(page.locator('#resumeBattleBtn')).toBeVisible();
 await expect(page.locator('#season2PreviewLink')).toBeInViewport();
 const cached=await page.evaluate(()=>JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY)).state);
 await page.locator('#season2PreviewLink').click();
 await expect(page.locator('#previewNotice')).toBeVisible();
 await page.locator('[data-plan-mode="attack"]').click();
 await page.goBack();
 // Existing boot behavior restores saved battles directly into the paused battlefield.
 await expect(page.locator('#game')).toHaveClass(/active/);
 await expect(page.locator('#pauseOverlay')).toHaveClass(/show/);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY)).state)).toEqual(cached);
 expect(await page.evaluate(()=>({time:state.time,resource:state.resource,paused:state.paused,plants:state.plants.length,zombies:state.zombies.length}))).toEqual({time:23450,resource:287,paused:true,plants:1,zombies:1});
});

test('season-two direct link and missing future artwork use safe readable fallbacks',async({page})=>{
 await page.goto('/season2.html?mode=attack');
 await expect(page.locator('[data-plan-mode="attack"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.stage-plan').last().locator('.reward-name')).toHaveText('陷城屍督');
 await page.evaluate(()=>{
  const art=season2SceneArt({...SEASON2_PLAN.stages[0],cardArt:'assets/backgrounds/season2/not-supplied.webp'});
  art.id='missingArtFixture';document.querySelector('#stagePlans').append(art);
 });
 await expect(page.locator('#missingArtFixture .scene-placeholder')).toBeVisible();
 await expect(page.locator('#missingArtFixture img')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const data=fs.readFileSync('js/season2-plan-data.js','utf8');
 new vm.Script(data);
});
