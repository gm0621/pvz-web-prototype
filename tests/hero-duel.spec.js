const {test,expect}=require('@playwright/test');
test('duel renders attack frames, counter, block and a lethal finisher on mobile and desktop',async({page})=>{
 await page.goto('/hero/');
 await page.evaluate(async()=>{
  const e=await import('/hero/engine.mjs?v=duel-finish-1'),v=await import('/hero/duel-view.mjs?v=duel-finish-1');
  const b=e.createBattle(3,1);b.nextSpawn=Infinity;e.deploy(b,'zhangfei',1);b.enemies.push({id:90,lane:1,x:.17,hp:240,maxHp:240,boss:true,name:'鄧茂'});e.stepBattle(b,.1);
  window.fixture={b,e,v};document.getElementById('duelDialog').showModal();v.renderDuel(b);
 });
 for(const [time,beat] of [[.8,'hero'],[1.8,'enemy'],[2.5,'block'],[3.3,'hero'],[4.2,'charge'],[5,'finish'],[5.7,'victory']]){
  await page.evaluate(t=>{const {b,e,v}=window.fixture;while(b.duel.elapsed<t)e.stepBattle(b,.05);v.renderDuel(b)},time);
  await expect(page.locator('#duelDialog')).toHaveAttribute('data-beat',beat);
 }
 await expect(page.locator('#duelCallout')).toHaveText('敵將討取');await expect(page.locator('#duelHp')).toHaveAttribute('style',/width: 0%/);
 expect(await page.evaluate(()=>document.getElementById('duelDialog').scrollWidth<=document.getElementById('duelDialog').clientWidth)).toBe(true);
});
