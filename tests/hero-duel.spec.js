const {test,expect}=require('@playwright/test');
test('duel renders attack frames, counter, block and a lethal finisher on mobile and desktop',async({page},testInfo)=>{
 await page.goto('/hero/');
 await page.evaluate(async()=>{
  const e=await import('/hero/engine.mjs?v=yellow-boss-2'),v=await import('/hero/duel-view.mjs?v=yellow-boss-2');
  const b=e.createBattle(3,1);b.nextSpawn=Infinity;e.deploy(b,'zhangfei',1);b.enemies.push({id:90,lane:1,x:.17,hp:240,maxHp:240,boss:true,name:'鄧茂'});e.stepBattle(b,.1);
  e.skipDuelEntrance(b);window.fixture={b,e,v};document.getElementById('duelDialog').showModal();v.renderDuel(b);
 });
 for(const [time,beat] of [[3.2,'hero'],[5,'enemy'],[6.4,'block'],[8.2,'hero'],[10.2,'charge'],[11.6,'charge'],[12.8,'maneuver'],[13.3,'combo'],[15.2,'finish'],[17.3,'victory']]){
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
 await page.goto('/hero/');await page.evaluate(async()=>{const e=await import('/hero/engine.mjs?v=yellow-boss-2'),v=await import('/hero/duel-view.mjs?v=yellow-boss-2');const b=e.createBattle(5,1);b.nextSpawn=Infinity;e.deploy(b,'liubei',1);b.enemies.push({id:90,lane:1,x:.17,hp:180,maxHp:290,boss:true,name:'石魁'});e.stepBattle(b,.1);e.skipDuelEntrance(b);window.fixture={b,e,v};document.getElementById('duelTitle').textContent='劉備 對 石魁';document.getElementById('duelHero').alt='劉備';document.getElementById('duelDialog').showModal();v.renderDuel(b)});
 await expect(page.locator('#duelEnemyLine')).toContainText('石魁');
 await page.evaluate(()=>{const {b,e,v}=window.fixture;while(b.duel.elapsed<e.duelBeats(b.duel).find(beat=>beat.side==='enemy').at+.6)e.stepBattle(b,.05);v.renderDuel(b)});await expect(page.locator('#duelEnemySprite')).toHaveAttribute('style',/shi-kui/);await expect(page.locator('#duelCaption')).toContainText('重錘');await page.screenshot({path:info.outputPath('liubei-duel.png')});
 await page.evaluate(()=>{const {b,e,v}=window.fixture;while(b.duel.elapsed<e.duelBeats(b.duel).find(beat=>beat.side==='finish').at+.1)e.stepBattle(b,.05);v.renderDuel(b)});await expect(page.locator('#duelCallout')).toHaveText('雌雄雙劍・十字破盾');await expect(page.locator('#duelDialogue')).toContainText('劉備');
});


test('Guan Yu crosses behind, turns to face the foe and freezes named finisher FX on pause',async({page})=>{
 await page.goto('/hero/');
 await page.evaluate(async()=>{
  const e=await import('/hero/engine.mjs?v=duel-cinema-1'),v=await import('/hero/duel-view.mjs?v=duel-cinema-1');
  const b=e.createBattle(4);b.nextSpawn=Infinity;e.deploy(b,'guanyu',1);b.enemies.push({id:90,lane:1,x:.17,hp:180,maxHp:300,boss:true,name:'程遠志'});e.stepBattle(b,.1);e.skipDuelEntrance(b);
  while(b.duel.elapsed<13.7)e.stepBattle(b,.05);
  document.querySelector('#duelDialog').showModal();v.renderDuel(b);window.fixture={b,e,v};
 });
 await expect(page.locator('.cinema-name')).toHaveText('青龍偃月・回身絕影斬');
 await expect(page.locator('#duelSprite')).toHaveAttribute('data-facing','left');
 await expect(page.locator('#duelEnemySprite')).toHaveAttribute('data-facing','right');
 const hero=await page.locator('#duelSprite').boundingBox(),foe=await page.locator('#duelEnemySprite').boundingBox();expect(hero.x).toBeGreaterThan(foe.x);
 const before=await page.locator('.duel-portraits').innerHTML();
 await page.evaluate(()=>{const {b,e,v}=window.fixture;b.paused=true;for(let i=0;i<20;i++){e.stepBattle(b,.1);v.renderDuel(b)}});
 expect(await page.locator('.duel-portraits').innerHTML()).toBe(before);
});
