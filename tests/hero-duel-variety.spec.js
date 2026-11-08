const {test,expect}=require('@playwright/test');
test('all seven duels show actual two-sided HP, distinct choreography and frozen counter damage',async({page})=>{
 await page.goto('/hero/');
 const rows=await page.evaluate(async()=>{
  const e=await import('/hero/engine.mjs?v=history-coalition-1'),v=await import('/hero/duel-view.mjs?v=history-coalition-1'),{STAGES}=await import('/hero/story.mjs?v=history-coalition-1');const rows=[];
  for(const level of [3,4,5,7,8,9,10]){
   const stage=STAGES[level-1],b=e.createBattle(level);b.nextSpawn=Infinity;e.deploy(b,stage.duelHero,1);const hero=b.allies[0];hero.hp=hero.maxHp*.8;const boss={id:90,lane:1,x:.17,hp:30,maxHp:stage.bossHp,boss:true,name:stage.bossName};b.enemies=[boss];e.stepBattle(b,.1);e.skipDuelEntrance(b);v.renderDuel(b);
   const initialEnemy=Number(document.getElementById('duelHp').style.width.slice(0,-1)),initialHero=Number(document.getElementById('duelHeroHp').style.width.slice(0,-1));const counter=e.duelBeats(b.duel).find(beat=>beat.heroDamage);while(b.duel.elapsed<counter.at+.65)e.stepBattle(b,.05);v.renderDuel(b);
   const text=document.getElementById('duelHeroHpText').textContent,bar=document.getElementById('duelHeroHealth'),after=Number(bar.getAttribute('aria-valuenow'));b.paused=true;for(let i=0;i<20;i++)e.stepBattle(b,.1);v.renderDuel(b);
   rows.push({initialEnemy,expectedEnemy:30/stage.bossHp*100,initialHero,after,expectedAfter:Math.ceil(hero.maxHp*.77),frozen:document.getElementById('duelHeroHpText').textContent===text,name:document.getElementById('duelStyle').textContent});
  }return rows;
 });
 expect(new Set(rows.map(r=>r.name)).size).toBe(7);for(const row of rows){expect(row.initialEnemy).toBeCloseTo(row.expectedEnemy,3);expect(row.initialHero).toBeCloseTo(80,3);expect(row.after).toBe(row.expectedAfter);expect(row.frozen).toBe(true)}
});
test('duel health and controls remain reachable in reduced-motion landscape',async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/hero/');
 await page.evaluate(async()=>{const e=await import('/hero/engine.mjs?v=history-coalition-1'),v=await import('/hero/duel-view.mjs?v=history-coalition-1');const b=e.createBattle(10);b.nextSpawn=Infinity;e.deploy(b,'liubei',1);b.enemies=[{id:90,lane:1,x:.17,hp:100,maxHp:390,boss:true,name:'張角'}];e.stepBattle(b,.1);e.skipDuelEntrance(b);document.getElementById('duelDialog').showModal();v.renderDuel(b)});
 await expect(page.locator('#duelHeroHealth')).toBeVisible();await expect(page.locator('#duelEnemyHealth')).toBeVisible();await page.locator('#duelPause').scrollIntoViewIfNeeded();await expect(page.locator('#duelPause')).toBeInViewport();expect(await page.locator('#duelDialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
});
