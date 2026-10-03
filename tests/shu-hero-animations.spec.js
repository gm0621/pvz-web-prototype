const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

const HEROES=['machao','huangzhong','zhangfei','liubei','kongming','pangtong'];

test('six Shu heroes use eight aligned frames and resolve gameplay on the fifth frame',async({page})=>{
 await open(page);
 const result=await page.evaluate(heroKeys=>{
  playerProfile.campaignProgress.plants={completedLevels:{1:1},highestLevel:1};
  markStoryRead('plants',2,'opening',1);currentSeason=1;selectedLevel=2;start('plants');clearInterval(timer);
  const originalRandom=Math.random;Math.random=()=>.99;
  const run=key=>{
   state.plants=[];state.zombies=[];state.projectiles=[];state.pendingPlantShots=[];state.time=2000;
   addPlant(key,2,2);const hero=state.plants[0],d=PLANT_TYPES[key];
   if(key==='machao'){addZombie('normal',3,2);addZombie('normal',4,2);addZombie('normal',5,2)}
   else{addZombie('normal',key==='zhangfei'?3:5,2);addZombie('normal',5,1);addZombie('normal',5,3)}
   const beforeHp=state.zombies.map(z=>z.hp),beforePlants=state.plants.length;
   hero.last=-999999;actPlants();render();
   const firstSrc=document.querySelector(`#board .type-${key} .char-img`)?.getAttribute('src');
   const beforeHit={hp:state.zombies.map(z=>z.hp),plants:state.plants.length,shots:state.projectiles.length,pending:state.pendingPlantShots.length};
   state.time=hero.attackStartedAt+d.attackHitAt;processPendingPlantShots();render();
   const hitSrc=document.querySelector(`#board .type-${key} .char-img`)?.getAttribute('src');
   return {frames:d.attackFrames,battleAsset:d.battleAsset,hitAt:d.attackHitAt,beforeHp,beforePlants,beforeHit,afterHp:state.zombies.map(z=>z.hp),afterPlants:state.plants.length,shots:state.projectiles.length,firstSrc,hitSrc,heroAlive:state.plants.some(p=>p.id===hero.id),expireAt:hero.expireAt,attackUntil:hero.attackUntil};
  };
  const out=Object.fromEntries(heroKeys.map(key=>[key,run(key)]));Math.random=originalRandom;return out;
 },HEROES);
 for(const key of HEROES){
  const hero=result[key];
  expect(hero.frames,key).toHaveLength(8);
  expect(hero.frames[0]).toMatch(new RegExp(`${key}/attack-00\\.webp$`));
  expect(hero.frames[7]).toMatch(new RegExp(`${key}/attack-07\\.webp$`));
  expect(hero.battleAsset).toMatch(new RegExp(`${key}/idle\\.webp$`));
  expect(hero.hitAt).toBe(320);
  expect(hero.firstSrc).toMatch(/attack-00\.webp$/);
  expect(hero.hitSrc).toMatch(/attack-04\.webp$/);
  expect(hero.beforeHit.hp).toEqual(hero.beforeHp);
  expect(hero.beforeHit.plants).toBe(hero.beforePlants);
  expect(hero.beforeHit.shots).toBe(0);
  expect(hero.beforeHit.pending).toBeGreaterThan(0);
 }
 expect(result.machao.afterHp.every((hp,i)=>hp<result.machao.beforeHp[i])).toBe(true);
 expect(result.huangzhong.shots).toBe(3);
 expect(result.zhangfei.afterHp[0]).toBeLessThan(result.zhangfei.beforeHp[0]);
 expect(result.liubei.afterPlants).toBeGreaterThan(result.liubei.beforePlants);
 expect(result.kongming.afterHp.every((hp,i)=>hp<result.kongming.beforeHp[i])).toBe(true);
 expect(result.pangtong.afterHp.every((hp,i)=>hp<result.pangtong.beforeHp[i])).toBe(true);
 for(const key of ['kongming','pangtong']){
  expect(result[key].heroAlive).toBe(true);
  expect(result[key].expireAt).toBeGreaterThanOrEqual(result[key].attackUntil);
 }
 for(const key of HEROES)for(const src of result[key].frames){
  const response=await page.request.get(new URL(src,page.url()).href);expect(response.ok(),src).toBe(true);
 }
});

test('six Shu heroes stay inside the first legal column on desktop and mobile',async({page})=>{
 await open(page);
 const bounds=await page.evaluate(heroKeys=>{
  playerProfile.campaignProgress.plants={completedLevels:{1:1},highestLevel:1};
  markStoryRead('plants',2,'opening',1);currentSeason=1;selectedLevel=2;start('plants');clearInterval(timer);
  const out={};
  for(const key of heroKeys){
   state.plants=[];state.zombies=[];state.projectiles=[];state.pendingPlantShots=[];state.time=2000;
   addPlant(key,0,2);markAttack(state.plants[0]);state.time=2320;render();
   const board=document.querySelector('#board').getBoundingClientRect();
   const entity=document.querySelector(`#board .type-${key}`),image=entity.querySelector('.char-img'),label=entity.querySelector('.label');
   const imageBox=image.getBoundingClientRect(),labelBox=label.getBoundingClientRect();
   out[key]={edge:entity.classList.contains('edge-left'),imageLeft:imageBox.left-board.left,labelLeft:labelBox.left-board.left};
  }
  return out;
 },HEROES);
 for(const [key,item] of Object.entries(bounds)){
  expect(item.edge,key).toBe(true);
  expect(item.imageLeft,key).toBeGreaterThanOrEqual(-0.5);
  expect(item.labelLeft,key).toBeGreaterThanOrEqual(-0.5);
 }
});

test('six Shu battle idle images match their opening and closing attack footprint',async({page})=>{
 await open(page);
 const visible=await page.evaluate(async heroKeys=>{
  const bounds=async src=>{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');context.drawImage(image,0,0);const {data,width,height}=context.getImageData(0,0,canvas.width,canvas.height);let left=width,top=height,right=-1,bottom=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>8){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}return {width:right-left+1,height:bottom-top+1,bottom:bottom+1,canvasHeight:height}};
  const out={};for(const key of heroKeys){const d=PLANT_TYPES[key];out[key]={idle:await bounds(d.battleAsset),first:await bounds(d.attackFrames[0]),last:await bounds(d.attackFrames[7])}}return out;
 },HEROES);
 for(const [key,frames] of Object.entries(visible))for(const frame of [frames.first,frames.last]){
  expect(frames.idle.height/frame.height,key).toBeGreaterThan(.88);
  expect(frames.idle.height/frame.height,key).toBeLessThan(1.12);
  expect(Math.abs(frames.idle.bottom-frame.bottom)/frame.canvasHeight,key).toBeLessThan(.025);
 }
});

test('Liu Bei uses the updated idle artwork in battle and the character guide',async({page})=>{
 await open(page);
 const assets=await page.evaluate(()=>{
  buildCharacterGrid('plants');
  return {
   battle:PLANT_TYPES.liubei.battleAsset,
   guide:guideV2Model('plants','liubei').asset,
   card:document.querySelector('#characterGrid .type-liubei img')?.getAttribute('src'),
  };
 });
 const expected='assets/characters/future-generals/liubei/idle.webp';
 expect(assets).toEqual({battle:expected,guide:expected,card:expected});
 const response=await page.request.get(new URL(expected,page.url()).href);
 expect(response.ok()).toBe(true);
});
