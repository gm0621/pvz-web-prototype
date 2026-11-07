const {test,expect}=require('@playwright/test');
test('duel renders attack frames, counter, block and a lethal finisher on mobile and desktop',async({page})=>{
 await page.goto('/hero/');
 await page.evaluate(async()=>{
  const e=await import('/hero/engine.mjs?v=duel-audio-1'),v=await import('/hero/duel-view.mjs?v=duel-audio-1');
  const b=e.createBattle(3,1);b.nextSpawn=Infinity;e.deploy(b,'zhangfei',1);b.enemies.push({id:90,lane:1,x:.17,hp:240,maxHp:240,boss:true,name:'鄧茂'});e.stepBattle(b,.1);
  window.fixture={b,e,v};document.getElementById('duelDialog').showModal();v.renderDuel(b);
 });
 for(const [time,beat] of [[3.2,'hero'],[5,'enemy'],[6.4,'block'],[8.2,'hero'],[10.2,'charge'],[12,'finish'],[13.2,'victory']]){
  await page.evaluate(t=>{const {b,e,v}=window.fixture;while(b.duel.elapsed<t)e.stepBattle(b,.05);v.renderDuel(b)},time);
  await expect(page.locator('#duelDialog')).toHaveAttribute('data-beat',beat);
 }
 await expect(page.locator('#duelCallout')).toHaveText('敵將討取');await expect(page.locator('#duelHp')).toHaveAttribute('style',/width: 0%/);
 expect(await page.evaluate(()=>document.getElementById('duelDialog').scrollWidth<=document.getElementById('duelDialog').clientWidth)).toBe(true);
});
