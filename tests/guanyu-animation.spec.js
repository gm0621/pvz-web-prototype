const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('Guan Yu uses eight aligned slash frames and releases his fire shot on the fifth frame',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile.campaignProgress.plants={completedLevels:{1:1},highestLevel:1};
  markStoryRead('plants',2,'opening',1);currentSeason=1;selectedLevel=2;start('plants');clearInterval(timer);
  state.plants=[];state.zombies=[];state.projectiles=[];state.pendingPlantShots=[];state.time=2000;
  addPlant('firepea',2,2);const guanyu=state.plants.at(-1);const target=addZombie('normal',5,2);
  guanyu.last=0;const before=target.hp;actPlants();render();
  const firstSrc=document.querySelector('#board .type-firepea .char-img')?.getAttribute('src');
  const beforeHit={hp:target.hp,shots:state.projectiles.length,pending:state.pendingPlantShots.length,started:guanyu.attackStartedAt};
  state.time=guanyu.attackStartedAt+PLANT_TYPES.firepea.attackHitAt;
  processPendingPlantShots();render();
  const hitSrc=document.querySelector('#board .type-firepea .char-img')?.getAttribute('src');
  return {frames:PLANT_TYPES.firepea.attackFrames,before,firstSrc,beforeHit,after:target.hp,shots:state.projectiles.length,hitSrc};
 });
 expect(result.frames).toHaveLength(8);
 expect(result.frames[0]).toMatch(/guanyu\/attack-00\.webp$/);
 expect(result.frames[7]).toMatch(/guanyu\/attack-07\.webp$/);
 expect(result.firstSrc).toMatch(/attack-00\.webp$/);
 expect(result.beforeHit).toMatchObject({hp:result.before,shots:0,pending:1,started:2000});
 expect(result.after).toBe(result.before);
 expect(result.shots).toBe(1);
 expect(result.hitSrc).toMatch(/attack-04\.webp$/);
 for(const src of result.frames){
  const response=await page.request.get(new URL(src,page.url()).href);
  expect(response.ok(),src).toBe(true);
 }
});
