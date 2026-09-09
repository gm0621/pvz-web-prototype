const {test,expect}=require('@playwright/test');
test('halberds intercept only real rapid movement; cleavers weaken shields without generic critical damage',async({page})=>{
 await open(page);const r=await page.evaluate(()=>{
  chooseFaction('plants',2);selectedLevel=1;start('plants');clearInterval(timer);state.plants=[];state.zombies=[];state.time=10000;
  addPlant('s2Halberd',2,1);const p=state.plants[0],z=addZombie('s2Rat',3,1),hp=z.hp;actPlants();const stab=hp-z.hp;
  z.c=5;z.previousC=5;z.c=3;z.movementKind='dash';z.movementAt=state.time;const before=z.hp;actPlants();const intercept=before-z.hp;
  const cooldown=z.hp;actPlants();const again=cooldown-z.hp;
  state.plants=[];state.zombies=[];addPlant('s2Shield',2,2);const shield=state.plants[0];shield.braced=true;const axe=addZombie('s2Cleaver',2.6,2);Math.random=()=>.99;actZombies();state.time+=2000;actZombies();const weakened=shield.armorWeakenedUntil>state.time;
  state.plants=[];state.zombies=[];addPlant('s2Crossbow',2,0);const plain=state.plants[0],plainHp=plain.hp;addZombie('s2Cleaver',2.6,0);Math.random=()=>0;actZombies();
  return {stab,intercept,again,weakened,plainDamage:plainHp-plain.hp};
 });expect(r).toEqual({stab:38,intercept:55,again:0,weakened:true,plainDamage:30});
});
async function open(page){await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto('/');}
test('second stage releases only after same-route first clear, rewards fourth unit and preserves progress',async({page})=>{
 await open(page);const r=await page.evaluate(()=>{chooseFaction('plants',2);const locked=!isCampaignLevelUnlocked('plants',2);completeCampaignLevel('plants',1,2);return {locked,open:isCampaignLevelUnlocked('plants',2),other:isCampaignLevelUnlocked('zombies',2),future:isCampaignLevelUnlocked('plants',3)}});expect(r).toEqual({locked:true,open:true,other:false,future:false});
 await page.evaluate(()=>{selectedLevel=2;start('plants');clearInterval(timer)});await expect(page.locator('#cards .name')).toHaveText(['屯田兵','大盾兵','強弩兵']);await expect(page.locator('#modeTitle')).toContainText('石壘營門');
 await page.evaluate(async()=>{await end(true,'勝利','')});await expect(page.locator('#modalText')).toContainText('長戟兵');await expect(page.locator('#modalNext')).not.toContainText('全破');await page.reload();
 expect(await page.evaluate(()=>({done:playerProfile.season2Progress.plants.highestLevel,first:playerProfile.campaignProgress.plants.highestLevel,future:isCampaignLevelUnlocked('plants',3,2)}))).toEqual({done:2,first:0,future:false});
 await page.evaluate(()=>{chooseFaction('plants',2);selectedLevel=2;start('plants');clearInterval(timer)});await expect(page.locator('#cards .name')).toHaveText(['屯田兵','大盾兵','強弩兵','長戟兵']);
});
