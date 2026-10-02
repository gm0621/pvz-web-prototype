const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('Zhao Yun uses eight aligned spear frames and resolves melee or ice shot on the fifth frame',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile.campaignProgress.plants={completedLevels:{1:1,2:1},highestLevel:2};
  markStoryRead('plants',3,'opening',1);currentSeason=1;selectedLevel=3;start('plants');clearInterval(timer);
  const run=distance=>{
   state.plants=[];state.zombies=[];state.projectiles=[];state.pendingPlantShots=[];state.time=3000;
   addPlant('zhaoyun',2,2);const hero=state.plants[0];hero.last=0;
   const target=addZombie('bucket',2+distance,2),before=target.hp;
   const old=Math.random;Math.random=()=>.99;actPlants();Math.random=old;render();
   const firstSrc=document.querySelector('#board .type-zhaoyun .char-img')?.getAttribute('src');
   const beforeHit={hp:target.hp,shots:state.projectiles.length};
   state.time=hero.attackStartedAt+PLANT_TYPES.zhaoyun.attackHitAt-1;processPendingPlantShots();
   const early={hp:target.hp,shots:state.projectiles.length};
   state.time=hero.attackStartedAt+PLANT_TYPES.zhaoyun.attackHitAt;processPendingPlantShots();render();
   return {before,firstSrc,beforeHit,early,after:{hp:target.hp,shots:state.projectiles.length,slow:target.slowUntil>state.time},hitSrc:document.querySelector('#board .type-zhaoyun .char-img')?.getAttribute('src')};
  };
  return {frames:PLANT_TYPES.zhaoyun.attackFrames,melee:run(1),ranged:run(4)};
 });
 expect(result.frames).toHaveLength(8);
 expect(result.melee.firstSrc).toContain('attack-00.webp');
 expect(result.melee.beforeHit.hp).toBe(result.melee.before);
 expect(result.melee.early.hp).toBe(result.melee.before);
 expect(result.melee.after.hp).toBeLessThan(result.melee.before);
 expect(result.melee.after.slow).toBeTruthy();
 expect(result.melee.hitSrc).toContain('attack-04.webp');
 expect(result.ranged.beforeHit.shots).toBe(0);
 expect(result.ranged.early.shots).toBe(0);
 expect(result.ranged.after.shots).toBe(1);
 expect(result.ranged.hitSrc).toContain('attack-04.webp');
 const visibleBounds=await page.evaluate(async()=>{
  const bounds=async src=>{
   const image=new Image();image.src=src;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);
   const {data,width,height}=context.getImageData(0,0,canvas.width,canvas.height);let top=height,bottom=-1;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>8){top=Math.min(top,y);bottom=Math.max(bottom,y)}
   return {height:bottom-top+1,bottom:bottom+1,canvasHeight:height};
  };
  return {idle:await bounds(PLANT_TYPES.zhaoyun.battleAsset||PLANT_TYPES.zhaoyun.asset),first:await bounds(PLANT_TYPES.zhaoyun.attackFrames[0]),last:await bounds(PLANT_TYPES.zhaoyun.attackFrames[7])};
 });
 for(const frame of [visibleBounds.first,visibleBounds.last]){
  expect(visibleBounds.idle.height/frame.height).toBeGreaterThan(.92);
  expect(visibleBounds.idle.height/frame.height).toBeLessThan(1.08);
  expect(Math.abs(visibleBounds.idle.bottom-frame.bottom)/frame.canvasHeight).toBeLessThan(.02);
 }
});
