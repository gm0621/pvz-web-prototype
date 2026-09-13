const {test,expect}=require('@playwright/test');
async function fixture(page){
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto('/');
 await page.evaluate(()=>{for(let l=1;l<6;l++)completeCampaignLevel('plants',l);saveProfile();selectedLevel=6;start('plants');clearInterval(timer);state.time=0;state.plants=[];state.zombies=[];state.resource=100;addPlant('firepea',2,2);render();updateHUD()});
}
test('visible move costs 20 immediately, highlights targets and preserves health',async({page})=>{
 await fixture(page);await expect(page.locator('#relocateUnitBtn')).toContainText('20');
 await page.locator('#relocateUnitBtn').click();await page.locator('.cell[data-r="2"][data-c="2"]').click();
 await expect(page.locator('.cell.relocation-target')).toHaveCount(2);
 await expect(page.locator('#relocationHint')).toContainText('20');
 await page.locator('.cell[data-r="1"][data-c="2"]').click();
 expect(await page.evaluate(()=>({r:state.plants[0].r,c:state.plants[0].c,food:state.resource,hp:state.plants[0].hp,max:state.plants[0].maxHp,mode:state.actionMode}))).toMatchObject({r:1,c:2,food:80,mode:null});
 await page.locator('#relocateUnitBtn').click();await page.locator('.cell[data-r="1"][data-c="2"]').click();await page.locator('.cell[data-r="0"][data-c="2"]').click();
 expect(await page.evaluate(()=>({r:state.plants[0].r,food:state.resource}))).toEqual({r:0,food:60});
 await page.evaluate(()=>pauseAndSaveBattle());await page.reload();
 expect(await page.evaluate(()=>({r:state.plants[0].r,food:state.resource,paused:state.paused}))).toEqual({r:0,food:60,paused:true});
});
test('invalid destinations, insufficient grain, cancel and lost source never charge',async({page})=>{
 await fixture(page);
 const out=await page.evaluate(()=>{
  const results=[];const reset=()=>{state.actionMode=null;state.movingPlantId=null;state.resource=100;setBattleActionMode('relocate');place(2,2)};
  for(const [r,c] of [[2,2],[0,2],[1,3],[-1,2],[1,9]]){reset();place(r,c);results.push([state.resource,state.plants[0].r])}
  addPlant('wallnut',2,1);reset();place(1,2);results.push([state.resource,state.plants[0].r]);
  reset();state.resource=19;place(3,2);results.push([state.resource,state.plants[0].r]);
  reset();setBattleActionMode('relocate');results.push([state.resource,state.plants[0].r]);
  reset();state.plants=[];place(3,2);results.push([state.resource,null]);
  return results;
 });expect(out).toEqual([[100,2],[100,2],[100,2],[100,2],[100,2],[100,2],[19,2],[100,2],[100,null]]);
});
test('eligibility, exact cost, paused guard, and second-season defenders',async({page})=>{
 await fixture(page);
 const result=await page.evaluate(()=>{
  const excluded=['potato','pangtong','kongming','swordSoldier','whiteFeatherGuard'].map(k=>relocationRule(k));
  state.plants=[];addPlant('zhaoyun',2,2);state.resource=20;setBattleActionMode('relocate');place(2,2);state.paused=true;place(1,2);const paused=[state.plants[0].r,state.resource];state.paused=false;place(1,2);const exact=[state.plants[0].r,state.resource];
  currentSeason=2;selectedLevel=1;start('plants');clearInterval(timer);state.plants=[];state.resource=100;addPlant('s2Crossbow',2,2);setBattleActionMode('relocate');place(2,2);place(3,2);const wei=[state.plants[0].r,state.resource];
  state.faction='zombies';state.actionMode='relocate';state.movingPlantId=state.plants[0].id;relocatePlantAt(4,2);const hostile=[state.plants[0].r,state.resource];
  return{excluded,paused,exact,wei,hostile};
 });expect(result).toEqual({excluded:[null,null,null,null,null],paused:[2,20],exact:[1,0],wei:[3,80],hostile:[3,80]});
});
test('Zhao Yun chooses nearest living front target: sword up close, unchanged ice at distance',async({page})=>{
 await fixture(page);
 const out=await page.evaluate(()=>{
  const saved=rollSuperSkill;const run=(distance,proc)=>{
   rollSuperSkill=()=>proc;state.plants=[];state.zombies=[];state.projectiles=[];state.time=10000;
   addPlant('zhaoyun',2,2);const p=state.plants[0];addZombie('normal',6,2);const near=addZombie('bucket',2+distance,2);const hp=near.hp;const d=activeUnit('plants','zhaoyun');actPlants();
   return {damage:hp-near.hp,expected:proc?superSkillDamage(d.meleeDamage):d.meleeDamage,shots:state.projectiles.map(x=>({damage:x.damage,slow:x.slow,critical:x.critical})),slow:near.slowUntil>state.time,sword:p.attackStyle,fx:!!document.querySelector('.zhaoyun-sword-fx'),ranged:d.damage};
  };
  const a=run(.5,false),b=run(1.2,true),c=run(1.21,false);rollSuperSkill=saved;return{a,b,c};
 });
 for(const x of [out.a,out.b]){expect(x.damage).toBe(x.expected);expect(x.shots).toEqual([]);expect(x.slow).toBe(true);expect(x.sword).toBe('sword');expect(x.fx).toBe(true)}
 expect(out.c.damage).toBe(0);expect(out.c.shots).toEqual([{damage:out.c.ranged,slow:true,critical:false}]);
});
