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
 const visibleBounds=await page.evaluate(async()=>{
  const bounds=async src=>{
   const image=new Image();image.src=src;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const context=canvas.getContext('2d');context.drawImage(image,0,0);
   const {data,width,height}=context.getImageData(0,0,canvas.width,canvas.height);
   let left=width,top=height,right=-1,bottom=-1;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>8){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}
   return {width:right-left+1,height:bottom-top+1,bottom:bottom+1,canvasHeight:height};
  };
  return {idle:await bounds(PLANT_TYPES.firepea.battleAsset),first:await bounds(PLANT_TYPES.firepea.attackFrames[0]),last:await bounds(PLANT_TYPES.firepea.attackFrames[7])};
 });
 for(const frame of [visibleBounds.first,visibleBounds.last]){
  expect(visibleBounds.idle.height/frame.height).toBeGreaterThan(.92);
  expect(visibleBounds.idle.height/frame.height).toBeLessThan(1.08);
  expect(Math.abs(visibleBounds.idle.bottom-frame.bottom)/frame.canvasHeight).toBeLessThan(.02);
 }
 for(const src of result.frames){
  const response=await page.request.get(new URL(src,page.url()).href);
  expect(response.ok(),src).toBe(true);
 }
});
