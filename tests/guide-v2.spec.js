const {test,expect}=require('@playwright/test');
async function open(page){await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',r=>r.fulfill({body:'',contentType:'application/javascript'}));await page.goto(process.env.GAME_URL||'/');await page.locator('#charactersBtn').click()}
test('unified guide covers every roster and summon without mutating game data',async({page})=>{
 await open(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const result=await page.evaluate(()=>{
  const snapshot=()=>JSON.stringify({profile:playerProfile,storage:{...localStorage},plants:PLANT_TYPES,zombies:ZOMBIE_TYPES,order:UNIT_ORDER,season:currentSeason});const before=snapshot();
  const entries=[...Object.keys(PLANT_TYPES).filter(k=>(PLANT_TYPES[k].season||1)===1).map(k=>['plants',k]),...Object.keys(ZOMBIE_TYPES).filter(k=>(ZOMBIE_TYPES[k].season||1)===1).map(k=>['zombies',k]),...WEI_GUIDE.map(d=>['wei',d.key]),...ZOMBIE_SEASON2_GUIDE.map(d=>['zombie2',d.key])];
  const failures=[];for(const [roster,key]of entries){showCharacterDetail(roster,key);const model=guideV2Model(roster,key);if(!model.abilities.length||!document.querySelector('#guideDemo')||!document.querySelector('#charModalStats').textContent.includes('生命值'))failures.push(key);for(const a of model.abilities){if(!a.condition||!a.rangeText||!a.effect||!a.timing||!a.limits)failures.push(key+':'+a.id);document.querySelector('#guideAbility').value=a.id;guideChooseAbility();for(let f=0;f<5;f++)guideAdvance();if(/NaN|undefined/.test(document.querySelector('#charModal').textContent))failures.push(key+':invalid-text');const unmet=guideDemoResult(model,a,3,'unmet');if(unmet.damage||unmet.resource||unmet.hit)failures.push(key+':unmet');}}
  document.querySelector('#charModalClose').click();return {count:entries.length,failures,unchanged:before===snapshot()};
 });expect(result.count).toBeGreaterThan(45);expect(result.failures).toEqual([]);expect(result.unchanged).toBe(true);expect(errors).toEqual([]);
});
test('Wei detail range, values, ability demo, unmet condition and timer isolation',async({page})=>{
 await open(page);await page.getByRole('button',{name:'魏國',exact:true}).click();await page.locator('[data-wei-key="halberd-soldier"]').click();
 await expect(page.locator('#charModalRange')).toBeVisible();await expect(page.locator('#charModalStats')).toContainText('近戰');await expect(page.locator('#charModalStats')).not.toContainText('防禦力');
 await page.locator('#guideAbility').selectOption('talent');await expect(page.locator('#guideAbilityInfo')).toContainText('55');await expect(page.locator('#guideAbilityInfo')).toContainText('6 秒');
 await page.locator('#guideStep').click();await page.locator('#guideStep').click();await page.locator('#guideStep').click();await expect(page.locator('#guideDemoCaption')).toContainText('55');
 expect(await page.locator('#guideDemo').evaluate(el=>JSON.parse(el.dataset.result).damage)).toBe(55);
 await page.locator('#guideScenario').selectOption('unmet');for(let i=0;i<3;i++)await page.locator('#guideStep').click();expect(await page.locator('#guideDemo').evaluate(el=>JSON.parse(el.dataset.result).damage)).toBe(0);
 await page.locator('#guideReplay').click();expect(await page.evaluate(()=>guideDemoTimer!==null)).toBe(true);await page.locator('#guidePlay').click();expect(await page.evaluate(()=>guideDemoTimer)).toBeNull();await page.locator('#guidePlay').click();expect(await page.evaluate(()=>guideDemoTimer!==null)).toBe(true);await page.locator('#charModalClose').click();expect(await page.evaluate(()=>guideDemoTimer)).toBeNull();
 await page.locator('[data-wei-key="xiahou-dun"]').click();await expect(page.locator('#charModalStats')).toContainText('尚未開放出戰');await expect(page.locator('#charModalStats')).toContainText('候選');await page.locator('#guideAbility').selectOption('skill');await expect(page.locator('#guideAbilityInfo')).toContainText('滿怒');
 await expect(page.locator('#guideDemoCaption')).toContainText('概念');
});
test('melee/ranged, support, summons, fractional ranges and all faction switches remain usable',async({page})=>{
 await open(page);await page.evaluate(()=>showCharacterDetail('plants','zhaoyun'));await expect(page.locator('#guideAbility option')).toContainText(['近戰','遠程','天賦','機率技能']);
 await page.locator('#guideAbility').selectOption('ranged');await expect(page.locator('#guideAbilityInfo')).toContainText('1.2');
 const d=await page.evaluate(()=>({actual:effectiveUnit('plants','zhaoyun').meleeDamage,model:guideV2Model('plants','zhaoyun').abilities.find(a=>a.id==='melee').damage}));expect(d.model).toBe(d.actual);
 await page.evaluate(()=>showCharacterDetail('plants','liubei'));await page.locator('[data-guide-summon="swordSoldier"]').click();await expect(page.locator('#charModalName')).toHaveText('蜀軍鄉勇');await expect(page.locator('#charModalStats')).toContainText('召喚物');
 await page.evaluate(()=>showCharacterDetail('zombies','normal'));expect(await page.locator('#charModalRange').getAttribute('data-direction')).toBe('-1');
 await page.evaluate(()=>showCharacterDetail('zombie2','smoke-pot'));await expect(page.locator('#guideAbilityInfo')).toContainText('待定');await expect(page.locator('#guideDemoCaption')).toContainText('概念');
 for(const [side,key]of [['wei','crossbow-soldier'],['plants','sunflower'],['zombies','fireCatapult'],['zombie2','rat-fang']]){
  await page.evaluate(([s,k])=>showCharacterDetail(s,k),[side,key]);await expect(page.locator('#charModalRange')).toBeVisible();expect(await page.locator('.char-detail-card').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 }
 await page.locator('#charModalClose').click();
});
