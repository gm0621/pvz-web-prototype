const {test,expect}=require('@playwright/test');
async function open(page){await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');}
test('second season first defense starts with its own two soldiers and no stage-two bypass',async({page})=>{
 await open(page);
 await page.locator('#plantStartBtn').click();
 await page.locator('[data-season-choice="2"]').click();
 await expect(page.locator('#chosenFactionText')).toContainText('第二季');
 await expect(page.locator('#levelGrid button[data-jump-level="1"]')).toBeEnabled();
 await expect(page.locator('#levelGrid button[data-jump-level="2"]')).toBeDisabled();
 await page.locator('#levelGrid button[data-jump-level="1"]').click();
 await expect(page.locator('#game')).toHaveClass(/active/);
 await expect(page.locator('#modeTitle')).toContainText('霜土前哨');
 await expect(page.locator('#cards .name')).toHaveText(['屯田兵','強弩兵']);
 expect(await page.evaluate(()=>{const original=state;startLevel('plants',2);return {same:state===original,season:state.season,level:state.level};})).toEqual({same:true,season:2,level:1});
 await page.locator('#cards [data-key="s2Crossbow"]').click();await page.locator('.cell[data-r="2"][data-c="1"]').click();
 await expect(page.locator('#board .type-s2Crossbow')).toHaveCount(1);
 expect(await page.evaluate(()=>playerProfile.campaignProgress.plants.highestLevel)).toBe(0);
});

test('Wei soldiers accumulate safe supplies, focus their target, and brace their shield',async({page})=>{
 await open(page);const result=await page.evaluate(()=>{
  chooseFaction('plants',2);startLevel('plants',1);clearInterval(timer);state.plants=[];state.zombies=[];state.resource=0;
  addPlant('s2Tuntian',0,0);addPlant('s2Crossbow',1,1);addPlant('s2Shield',2,2);
  state.time=9000;actPlants();const safeSupply=state.resource;
  const target=addZombie('s2Rat',6,1);state.time=10000;actPlants();const first=state.projectiles.at(-1)?.damage;
  state.time=12100;actPlants();const second=state.projectiles.at(-1)?.damage;
  target.hp=0;addZombie('s2Rat',7,1);state.time=14200;actPlants();const changed=state.projectiles.at(-1)?.damage;
  return {safeSupply,first,second,changed,braced:state.plants.find(p=>p.type==='s2Shield').braced};
 });
 expect(result.safeSupply).toBe(40);expect(result.first).toBe(32);expect(result.second).toBeGreaterThan(result.first);expect(result.changed).toBe(32);expect(result.braced).toBe(true);
});

test('second-season attack uses Wei enemies, bone marks, pack damage and a breakable coffin shield',async({page})=>{
 await open(page);await page.locator('#zombieStartBtn').click();await page.locator('[data-season-choice="2"]').click();await page.locator('[data-jump-level="1"]').click();
 await expect(page.locator('#cards .name')).toHaveText(['鼠牙群屍','腐釘弩屍']);
 expect(await page.evaluate(()=>state.plants.every(p=>p.type.startsWith('s2')))).toBe(true);
 const result=await page.evaluate(()=>{
  clearInterval(timer);state.plants=[];state.zombies=[];state.projectiles=[];addPlant('s2Shield',2,2);const p=state.plants[0];
  addZombie('s2Nail',5,2);state.time=5000;const random=Math.random;Math.random=()=>.99;actZombies();Math.random=random;
  const projectile=state.projectiles[0];projectile.x=p.c+.55;moveProjectiles();const marks=p.boneMarks;
  const before=p.hp;state.zombies=[];addZombie('s2Rat',2.5,2);addZombie('s2Rat',2.6,2);state.time=6000;actZombies();const packDamage=before-p.hp;
  state.zombies=[];const shield=addZombie('s2Coffin',5,1);state.projectiles=[{x:5.42,r:1,dir:1,from:'plant',damage:100,speed:.08}];moveProjectiles();const firstShield={hp:shield.hp,shield:shield.shieldHp};
  for(let i=0;i<3;i++){state.projectiles=[{x:shield.c+.42,r:1,dir:1,from:'plant',damage:100,speed:.08}];moveProjectiles()}
  return {marks,packDamage,remaining:p.boneMarks,firstShield,finalShield:shield.shieldHp};
 });
 expect(result.marks).toBe(1);expect(result.packDamage).toBe(60);expect(result.remaining).toBe(0);
 expect(result.firstShield).toEqual({hp:220,shield:80});expect(result.finalShield).toBe(0);
});
