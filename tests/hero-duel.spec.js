const {test,expect}=require('@playwright/test');
test('duel renders attack frames, counter, block and a lethal finisher on mobile and desktop',async({page},testInfo)=>{
 await page.goto('/hero/');
 await page.evaluate(async()=>{
  const e=await import('/hero/engine.mjs?v=yellow-boss-2'),v=await import('/hero/duel-view.mjs?v=yellow-boss-2');
  const b=e.createBattle(3,1);b.nextSpawn=Infinity;e.deploy(b,'zhangfei',1);b.enemies.push({id:90,lane:1,x:.17,hp:240,maxHp:240,boss:true,name:'鄧茂'});e.stepBattle(b,.1);
  window.fixture={b,e,v};document.getElementById('duelDialog').showModal();v.renderDuel(b);
 });
 for(const [time,beat] of [[3.2,'hero'],[5,'enemy'],[6.4,'block'],[8.2,'hero'],[10.2,'charge'],[12,'finish'],[13.2,'victory']]){
  await page.evaluate(t=>{const {b,e,v}=window.fixture;while(b.duel.elapsed<t)e.stepBattle(b,.05);v.renderDuel(b)},time);
  await expect(page.locator('#duelDialog')).toHaveAttribute('data-beat',beat);
 }
 await expect(page.locator('#duelCallout')).toHaveText('敵將討取');await expect(page.locator('#duelHp')).toHaveAttribute('style',/width: 0%/);
 await page.evaluate(()=>{const {b,v}=window.fixture;b.duel.elapsed=5.4;v.renderDuel(b)});
 await expect(page.locator('#duelEnemySprite')).toHaveAttribute('data-frame','2');await expect(page.locator('#duelSprite')).toHaveAttribute('data-dodging','true');
 await page.screenshot({path:testInfo.outputPath('counter-dodge.png')});
 expect(await page.evaluate(()=>document.getElementById('duelDialog').scrollWidth<=document.getElementById('duelDialog').clientWidth)).toBe(true);
});

test('Liu Bei has his own duel dialogue, enemy mace poses and finishing move',async({page},info)=>{
 await page.goto('/hero/');await page.evaluate(async()=>{const e=await import('/hero/engine.mjs?v=yellow-boss-2'),v=await import('/hero/duel-view.mjs?v=yellow-boss-2');const b=e.createBattle(5,1);b.nextSpawn=Infinity;e.deploy(b,'liubei',1);b.enemies.push({id:90,lane:1,x:.17,hp:180,maxHp:290,boss:true,name:'石魁'});e.stepBattle(b,.1);window.fixture={b,e,v};document.getElementById('duelTitle').textContent='劉備 對 石魁';document.getElementById('duelHero').alt='劉備';document.getElementById('duelDialog').showModal();v.renderDuel(b)});
 await expect(page.locator('#duelDialogue')).toContainText('石魁');
 await page.evaluate(()=>{const {b,e,v}=window.fixture;while(b.duel.elapsed<5.4)e.stepBattle(b,.05);v.renderDuel(b)});await expect(page.locator('#duelEnemySprite')).toHaveAttribute('style',/shi-kui/);await expect(page.locator('#duelCaption')).toContainText('重錘');await page.screenshot({path:info.outputPath('liubei-duel.png')});
 await page.evaluate(()=>{const {b,e,v}=window.fixture;while(b.duel.elapsed<12)e.stepBattle(b,.05);v.renderDuel(b)});await expect(page.locator('#duelCallout')).toHaveText('雙劍破陣！');await expect(page.locator('#duelDialogue')).toContainText('劉備');
});
