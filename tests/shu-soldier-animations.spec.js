const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('Shu archer uses four transparent attack frames and releases the arrow on frame three',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  playerProfile.campaignProgress.plants={completedLevels:{1:1},highestLevel:1};
  markStoryRead('plants',2,'opening',1);currentSeason=1;selectedLevel=2;start('plants');clearInterval(timer);
  state.plants=[];state.zombies=[];state.projectiles=[];state.pendingPlantShots=[];state.time=2000;
  addPlant('peashooter',2,2);const archer=state.plants.at(-1);addZombie('normal',5,2);archer.last=0;
  actPlants();render();
  const firstSrc=document.querySelector('#board .type-peashooter .char-img')?.getAttribute('src');
  const beforeHit={shots:state.projectiles.length,pending:state.pendingPlantShots.length,started:archer.attackStartedAt};
  state.time=archer.attackStartedAt+PLANT_TYPES.peashooter.attackHitAt;
  processPendingPlantShots();render();
  const hitSrc=document.querySelector('#board .type-peashooter .char-img')?.getAttribute('src');
  const assets=await Promise.all(PLANT_TYPES.peashooter.attackFrames.map(async src=>{
   const image=new Image();image.src=src;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const context=canvas.getContext('2d');context.drawImage(image,0,0);
   return {width:image.naturalWidth,height:image.naturalHeight,cornerAlpha:context.getImageData(0,0,1,1).data[3]};
  }));
  return {frames:PLANT_TYPES.peashooter.attackFrames,durations:PLANT_TYPES.peashooter.attackFrameDurations,hitAt:PLANT_TYPES.peashooter.attackHitAt,firstSrc,beforeHit,shots:state.projectiles.length,hitSrc,assets};
 });
 expect(result.frames).toHaveLength(4);
 expect(result.frames[0]).toMatch(/shu-soldiers\/peashooter\/attack-00\.webp$/);
 expect(result.frames[3]).toMatch(/shu-soldiers\/peashooter\/attack-03\.webp$/);
 expect(result.durations).toEqual([120,120,100,160]);
 expect(result.hitAt).toBe(240);
 expect(result.firstSrc).toMatch(/attack-00\.webp$/);
 expect(result.beforeHit).toEqual({shots:0,pending:1,started:2000});
 expect(result.shots).toBe(1);
 expect(result.hitSrc).toMatch(/attack-02\.webp$/);
 for(const asset of result.assets)expect(asset).toEqual({width:1024,height:1024,cornerAlpha:0});
});

test('the remaining five Shu soldiers expose four transparent action frames',async({page})=>{
 await open(page);
 const result=await page.evaluate(async()=>{
  const specs=[
   ['sunflower','attackFrames'],
   ['wallnut','hitFrames'],
   ['potato','attackFrames'],
   ['swordSoldier','attackFrames'],
   ['whiteFeatherGuard','attackFrames'],
  ];
  const out={};
  for(const [key,field] of specs){
   const d=PLANT_TYPES[key],frames=d[field]||[];
   out[key]={field,frames,durations:d[`${field.slice(0,-6)}FrameDurations`]||[],hitAt:d.attackHitAt};
   out[key].assets=await Promise.all(frames.map(async src=>{
    const image=new Image();image.src=src;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
    const context=canvas.getContext('2d');context.drawImage(image,0,0);
    return {width:image.naturalWidth,height:image.naturalHeight,cornerAlpha:context.getImageData(0,0,1,1).data[3]};
   }));
  }
  return out;
 });
 for(const [key,item] of Object.entries(result)){
  expect(item.frames,key).toHaveLength(4);
  expect(item.frames[0],key).toMatch(new RegExp(`shu-soldiers/${key}/attack-00\\.webp$`));
  expect(item.frames[3],key).toMatch(new RegExp(`shu-soldiers/${key}/attack-03\\.webp$`));
  expect(item.durations,key).toEqual([120,120,100,160]);
  expect(item.assets,key).toEqual(Array(4).fill({width:1024,height:1024,cornerAlpha:0}));
 }
 expect(result.sunflower.hitAt).toBe(240);
 expect(result.potato.hitAt).toBe(240);
 expect(result.swordSoldier.hitAt).toBe(240);
 expect(result.whiteFeatherGuard.hitAt).toBe(240);
});

test('Shu soldier actions apply their gameplay effect on the visible hit frame',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile.campaignProgress.plants={completedLevels:{1:1},highestLevel:1};
  markStoryRead('plants',2,'opening',1);currentSeason=1;selectedLevel=2;start('plants');clearInterval(timer);
  state.plants=[];state.zombies=[];state.projectiles=[];state.pendingPlantShots=[];state.pendingZombieStrikes=[];state.time=9000;state.resource=0;

  addPlant('sunflower',0,0);const quartermaster=state.plants.at(-1);quartermaster.last=0;actPlants();render();
  const supply={resource:state.resource,started:quartermaster.attackStartedAt,src:document.querySelector('#board .type-sunflower .char-img')?.getAttribute('src')};

  state.plants=[];state.zombies=[];state.pendingZombieStrikes=[];addPlant('wallnut',2,1);const shield=state.plants.at(-1);addZombie('normal',2.3,1);const attacker=state.zombies.at(-1);attacker.last=0;state.time=10000;actZombies();state.time=attacker.attackStartedAt+ZOMBIE_TYPES.normal.attackHitAt;processPendingZombieStrikes();render();
  const block={hp:shield.hp,started:shield.hitStartedAt,src:document.querySelector('#board .type-wallnut .char-img')?.getAttribute('src')};

  const strikes={};
  for(const [type,startC,targetC] of [['potato',3,3],['swordSoldier',3,3.4],['whiteFeatherGuard',3,3.6]]){
   state.plants=[];state.zombies=[];state.pendingPlantShots=[];state.time=12000;
   addPlant(type,startC,2);const unit=state.plants.at(-1);unit.last=0;unit.armedAt=0;
   addZombie('normal',targetC,2);const target=state.zombies.at(-1),before=target.hp;
   actPlants();render();const beforeSrc=document.querySelector(`#board .type-${type} .char-img`)?.getAttribute('src');
   const beforeHit={hp:target.hp,pending:state.pendingPlantShots.length,src:beforeSrc};
   state.time=unit.attackStartedAt+PLANT_TYPES[type].attackHitAt;processPendingPlantShots();render();
   strikes[type]={before,beforeHit,after:target.hp,unitHp:unit.hp,hitSrc:document.querySelector(`#board .type-${type} .char-img`)?.getAttribute('src')};
  }
  return {supply,block,strikes};
 });
 expect(result.supply).toMatchObject({resource:25,started:9000});
 expect(result.supply.src).toMatch(/sunflower\/attack-00\.webp$/);
 expect(result.block.hp).toBeLessThan(420);
 expect(result.block.started).toBe(10240);
 expect(result.block.src).toMatch(/wallnut\/attack-00\.webp$/);
 for(const [type,strike] of Object.entries(result.strikes)){
  expect(strike.beforeHit.hp,type).toBe(strike.before);
  expect(strike.beforeHit.pending,type).toBe(1);
  expect(strike.beforeHit.src,type).toMatch(new RegExp(`${type}/attack-00\\.webp$`));
  expect(strike.after,type).toBeLessThan(strike.before);
  expect(strike.hitSrc,type).toMatch(new RegExp(`${type}/attack-02\\.webp$`));
 }
 expect(result.strikes.potato.unitHp).toBe(0);
});
