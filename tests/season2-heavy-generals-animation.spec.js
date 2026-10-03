const {test,expect}=require('@playwright/test');

const generals=[
 {key:'s2DianWei',slug:'dian-wei'},
 {key:'s2XuChu',slug:'xu-chu'},
 {key:'s2ZhangLiao',slug:'zhang-liao'},
 {key:'s2XuHuang',slug:'xu-huang'},
];

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('four Wei heavy generals use eight attack frames and land damage on the fifth frame',async({page})=>{
 await open(page);
 const result=await page.evaluate(keys=>{
  playerProfile.season2Progress.plants={completedLevels:{1:1,2:1,3:1},highestLevel:3};markStoryRead('plants',4,'opening',2);currentSeason=2;selectedLevel=4;start('plants');clearInterval(timer);
  const out={};
  for(const key of keys){
   state.plants=[];state.zombies=[];state.projectiles=[];state.pendingHits=[];state.time=3000;
   addPlant(key,2,2);const hero=state.plants.at(-1);const target=addZombie('s2Rat',2.8,2);
   hero.last=0;const before=target.hp;actPlants();render();
   const firstSrc=document.querySelector(`#board .type-${key} .char-img`)?.getAttribute('src');
   const beforeHit={hp:target.hp,pending:state.pendingHits.length,started:hero.attackStartedAt};
   const data=SEASON2_UNITS.plants[key];state.time=hero.attackStartedAt+data.attackHitAt;
   processSeason2PendingHits();render();
   const hitSrc=document.querySelector(`#board .type-${key} .char-img`)?.getAttribute('src');
   out[key]={frames:data.attackFrames,battleAsset:data.battleAsset,before,firstSrc,beforeHit,after:target.hp,hitSrc};
  }
  return out;
 },generals.map(({key})=>key));
 for(const {key,slug} of generals){
  const value=result[key];
  expect(value.frames).toHaveLength(8);
  expect(value.battleAsset).toMatch(new RegExp(`${slug}/idle\\.webp$`));
  expect(value.frames[0]).toMatch(new RegExp(`${slug}/attack-00\\.webp$`));
  expect(value.frames[7]).toMatch(new RegExp(`${slug}/attack-07\\.webp$`));
  expect(value.firstSrc).toMatch(/attack-00\.webp$/);
  expect(value.beforeHit.hp).toBe(value.before);
  expect(value.beforeHit.pending).toBe(1);
  expect(value.beforeHit.started).toBe(3000);
  expect(value.after).toBeLessThan(value.before);
  expect(value.hitSrc).toMatch(/attack-04\.webp$/);
  for(const src of [value.battleAsset,...value.frames]){
   const response=await page.request.get(new URL(src,page.url()).href);
   expect(response.ok(),src).toBe(true);
  }
 }
});

test('updated Wei battle art is also used by the character guide',async({page})=>{
 await open(page);
 const assets=await page.evaluate(()=>{
  const slugs=['xiahou-dun','dian-wei','xu-chu','zhang-liao','xu-huang'];
  buildCharacterGrid('wei');
  return slugs.map(slug=>({
   slug,
   modelAsset:guideV2Model('wei',slug).asset,
   cardAsset:document.querySelector(`[data-wei-key="${slug}"] img`)?.getAttribute('src'),
  }));
 });
 for(const {slug,modelAsset,cardAsset} of assets){
  const expected=`assets/characters/future-generals/wei-season2/${slug}/idle.webp`;
  expect(modelAsset).toBe(expected);
  expect(cardAsset).toBe(expected);
  const response=await page.request.get(new URL(expected,page.url()).href);
  expect(response.ok(),expected).toBe(true);
 }
});

test('four Wei heavy generals have transparent aligned frames in one runtime box',async({page})=>{
 await open(page);
 const result=await page.evaluate(async keys=>{
  const inspect=async src=>{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');context.drawImage(image,0,0);const {data,width,height}=context.getImageData(0,0,canvas.width,canvas.height);let opaque=0,bottom=-1;for(let y=0;y<height;y++)for(let x=0;x<width;x++){const alpha=data[(y*width+x)*4+3];if(alpha>8){opaque++;bottom=Math.max(bottom,y)}}return {width,height,opaque,bottom,cornerAlpha:[data[3],data[(width-1)*4+3],data[((height-1)*width)*4+3],data[(height*width-1)*4+3]]}};
  const out={};
  for(const key of keys){const d=SEASON2_UNITS.plants[key];out[key]=await Promise.all([d.battleAsset,...d.attackFrames].map(inspect))}
  return out;
 },generals.map(({key})=>key));
 for(const {key} of generals){
  for(const [index,image] of result[key].entries()){
   expect(image.width,`${key} image ${index} width`).toBe(1024);
   expect(image.height,`${key} image ${index} height`).toBe(1024);
   expect(image.opaque,`${key} image ${index} foreground`).toBeGreaterThan(30000);
   expect(image.opaque,`${key} image ${index} transparent background`).toBeLessThan(700000);
   expect(image.cornerAlpha,`${key} image ${index} transparent corners`).toEqual([0,0,0,0]);
   expect(1024-image.bottom,`${key} image ${index} baseline`).toBeLessThanOrEqual(106);
   expect(1024-image.bottom,`${key} image ${index} baseline`).toBeGreaterThanOrEqual(100);
  }
 }
});
