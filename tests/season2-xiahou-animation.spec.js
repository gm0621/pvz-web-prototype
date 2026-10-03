const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('Xiahou Dun uses eight aligned attack frames and lands damage on the fifth frame',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile.season2Progress.plants={completedLevels:{1:1,2:1,3:1},highestLevel:3};markStoryRead('plants',4,'opening',2);currentSeason=2;selectedLevel=4;start('plants');clearInterval(timer);
  state.plants=[];state.zombies=[];state.projectiles=[];state.pendingHits=[];state.time=2000;
  addPlant('s2Xiahou',2,2);const xiahou=state.plants.at(-1);const target=addZombie('s2Rat',2.8,2);
  xiahou.last=0;const before=target.hp;actPlants();render();
  const firstSrc=document.querySelector('#board .type-s2Xiahou .char-img')?.getAttribute('src');
  const beforeHit={hp:target.hp,pending:state.pendingHits.length,started:xiahou.attackStartedAt};
  state.time=xiahou.attackStartedAt+SEASON2_UNITS.plants.s2Xiahou.attackHitAt;
  processSeason2PendingHits();render();
  const hitSrc=document.querySelector('#board .type-s2Xiahou .char-img')?.getAttribute('src');
  return {frames:SEASON2_UNITS.plants.s2Xiahou.attackFrames,before,firstSrc,beforeHit,after:target.hp,hitSrc};
 });
 expect(result.frames).toHaveLength(8);
 expect(result.frames[0]).toMatch(/xiahou-dun\/attack-00\.webp$/);
 expect(result.frames[7]).toMatch(/xiahou-dun\/attack-07\.webp$/);
 expect(result.firstSrc).toMatch(/attack-00\.webp$/);
 expect(result.beforeHit.hp).toBe(result.before);
 expect(result.beforeHit.pending).toBe(1);
 expect(result.beforeHit.started).toBe(2000);
 expect(result.after).toBeLessThan(result.before);
 expect(result.hitSrc).toMatch(/attack-04\.webp$/);
 for(const src of result.frames){
  const response=await page.request.get(new URL(src,page.url()).href);
  expect(response.ok(),src).toBe(true);
 }
});

test('Xiahou Dun keeps one visual scale and baseline from idle through every attack frame',async({page})=>{
 await open(page);
 const visible=await page.evaluate(async()=>{
  const bounds=async src=>{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');context.drawImage(image,0,0);const {data,width,height}=context.getImageData(0,0,canvas.width,canvas.height);let left=width,top=height,right=-1,bottom=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>8){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}return {width:right-left+1,height:bottom-top+1,bottom:bottom+1,canvasHeight:height}};
  const d=SEASON2_UNITS.plants.s2Xiahou;
  return {idle:await bounds(d.battleAsset||d.asset),frames:await Promise.all(d.attackFrames.map(bounds))};
 });
 for(const [index,frame] of visible.frames.entries()){
  expect(frame.height/visible.idle.height,`frame ${index+1} visible height`).toBeGreaterThan(.92);
  expect(frame.height/visible.idle.height,`frame ${index+1} visible height`).toBeLessThan(1.08);
  expect(Math.abs((frame.canvasHeight-frame.bottom)-(visible.idle.canvasHeight-visible.idle.bottom)),`frame ${index+1} baseline`).toBeLessThanOrEqual(4);
 }
});
