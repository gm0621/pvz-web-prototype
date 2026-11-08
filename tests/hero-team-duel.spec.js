const {test,expect}=require('@playwright/test');
test('stage six renders three HP bars, pincer facing, paused FX, and can return to a solo duel',async({page},info)=>{
 await page.goto('/hero/');
 await page.evaluate(async()=>{
  const e=await import('/hero/engine.mjs?v=history-coalition-1'),v=await import('/hero/duel-view.mjs?v=history-coalition-1'),b=e.createBattle(6);b.nextSpawn=Infinity;
  e.deploy(b,'guanyu',1);e.deploy(b,'zhangfei',2);b.enemies=[{id:90,lane:1,x:.17,hp:340,maxHp:340,boss:true,name:'雷烈'}];e.stepBattle(b,.1);
  document.getElementById('duelTitle').textContent='關羽 ＋ 張飛 對 雷烈';document.getElementById('duelDialog').showModal();v.renderDuel(b);window.fixture={e,v,b};
 });
 await expect(page.locator('#teamDuel')).toBeVisible();await expect(page.locator('#duelCombat')).toBeHidden();await expect(page.locator('#teamDuel [role="progressbar"]')).toHaveCount(3);await expect(page.locator('.team-rule')).toContainText('未來也可能一打二');
 await page.evaluate(()=>{const {e,v,b}=window.fixture;e.skipDuelEntrance(b);while(b.duel.elapsed<9.7)e.stepBattle(b,.05);v.renderDuel(b)});
 await expect(page.locator('[data-fighter="guanyu"]')).toHaveAttribute('data-facing','-1');await expect(page.locator('[data-fighter="enemy"]')).toHaveAttribute('data-facing','1');
 await page.evaluate(()=>{const {e,v,b}=window.fixture;while(b.duel.elapsed<15.55)e.stepBattle(b,.05);v.renderDuel(b);b.paused=true;v.renderDuel(b)});
 await expect(page.locator('.team-move')).toHaveText('青龍蛇矛・雙雄破陣');await expect(page.locator('[data-health="enemy"] [role="progressbar"]')).toHaveAttribute('aria-valuenow','0');
 const frozen=await page.locator('#teamDuel').innerHTML();await page.evaluate(()=>{const {e,v,b}=window.fixture;for(let i=0;i<30;i++){e.stepBattle(b,.1);v.renderDuel(b)}});expect(await page.locator('#teamDuel').innerHTML()).toBe(frozen);
 expect(await page.locator('#duelDialog').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 const arena=await page.locator('.team-arena').boundingBox(),line=await page.locator('.team-line').boundingBox();expect(line.y).toBeGreaterThanOrEqual(arena.y+arena.height);
 await page.screenshot({path:info.outputPath('team-finisher.png')});
 await page.evaluate(()=>{const {e,v}=window.fixture,b=e.createBattle(3);b.nextSpawn=Infinity;e.deploy(b,'zhangfei',1);b.enemies=[{id:90,lane:1,x:.17,hp:240,maxHp:240,boss:true,name:'鄧茂'}];e.stepBattle(b,.1);v.renderDuel(b)});
 await expect(page.locator('#teamDuel')).toBeHidden();await expect(page.locator('#duelVersus')).toBeVisible();await expect(page.locator('#duelDialog')).toHaveAttribute('data-team','false');
});
