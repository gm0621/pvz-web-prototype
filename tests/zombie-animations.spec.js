const{test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('red-band zombie attacks with four transparent frames and lands damage on frame three',async({page})=>{
 await open(page);
 const def=await page.evaluate(()=>({frames:ZOMBIE_TYPES.normal.attackFrames,durations:ZOMBIE_TYPES.normal.attackFrameDurations,hitAt:ZOMBIE_TYPES.normal.attackHitAt}));
 expect(def.frames).toHaveLength(4);
 expect(def.durations).toEqual([120,120,100,160]);
 expect(def.hitAt).toBe(240);
 for(const src of def.frames){
  const meta=await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=false;for(let i=3;i<data.length;i+=4)if(data[i]===0){transparent=true;break}return{width:img.naturalWidth,height:img.naturalHeight,transparent}},src);
  expect(meta).toEqual({width:1024,height:1024,transparent:true});
 }
 const result=await page.evaluate(()=>{
  playerProfile.campaignProgress.plants={completedLevels:{1:1},highestLevel:1};markStoryRead('plants',2,'opening',1);currentSeason=1;selectedLevel=2;start('plants');clearInterval(timer);state.paused=false;state.countdownActive=false;state.plants=[];state.zombies=[];state.projectiles=[];state.pendingZombieStrikes=[];state.time=10000;
  addPlant('wallnut',1,1);const defender=state.plants.at(-1);addZombie('normal',1.25,1);const zombie=state.zombies.at(-1);zombie.last=0;
  const before=defender.hp;actZombies();render();const windup={hp:defender.hp,pending:state.pendingZombieStrikes?.length||0,src:document.querySelector('#board .type-normal .char-img')?.getAttribute('src')};
  state.time+=240;processPendingZombieStrikes?.();render();return{before,windup,after:defender.hp,hitSrc:document.querySelector('#board .type-normal .char-img')?.getAttribute('src')};
 });
 expect(result.windup.hp).toBe(result.before);
 expect(result.windup.pending).toBe(1);
 expect(result.windup.src).toMatch(/zombie-animations\/normal\/attack-00\.webp$/);
 expect(result.after).toBeLessThan(result.before);
 expect(result.hitSrc).toMatch(/zombie-animations\/normal\/attack-02\.webp$/);
});

test('iron-helmet zombie exposes four transparent attack frames',async({page})=>{
 await open(page);
 const def=await page.evaluate(()=>({frames:ZOMBIE_TYPES.cone.attackFrames,durations:ZOMBIE_TYPES.cone.attackFrameDurations,hitAt:ZOMBIE_TYPES.cone.attackHitAt}));
 expect(def.frames).toHaveLength(4);
 expect(def.durations).toEqual([120,120,100,160]);
 expect(def.hitAt).toBe(240);
 for(const src of def.frames){
  const meta=await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=false;for(let i=3;i<data.length;i+=4)if(data[i]===0){transparent=true;break}return{width:img.naturalWidth,height:img.naturalHeight,transparent}},src);
  expect(meta).toEqual({width:1024,height:1024,transparent:true});
 }
});

test('giant-mace brute exposes four transparent attack frames',async({page})=>{
 await open(page);
 const def=await page.evaluate(()=>({frames:ZOMBIE_TYPES.bucket.attackFrames,durations:ZOMBIE_TYPES.bucket.attackFrameDurations,hitAt:ZOMBIE_TYPES.bucket.attackHitAt}));
 expect(def.frames).toHaveLength(4);
 expect(def.durations).toEqual([120,120,100,160]);
 expect(def.hitAt).toBe(240);
 for(const src of def.frames){
  const meta=await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=false;for(let i=3;i<data.length;i+=4)if(data[i]===0){transparent=true;break}return{width:img.naturalWidth,height:img.naturalHeight,transparent}},src);
  expect(meta).toEqual({width:1024,height:1024,transparent:true});
 }
});

test('white-haired king exposes four transparent attack frames',async({page})=>{
 await open(page);
 const def=await page.evaluate(()=>({frames:ZOMBIE_TYPES.football.attackFrames,durations:ZOMBIE_TYPES.football.attackFrameDurations,hitAt:ZOMBIE_TYPES.football.attackHitAt}));
 expect(def.frames).toHaveLength(4);
 expect(def.durations).toEqual([120,120,100,160]);
 expect(def.hitAt).toBe(240);
 for(const src of def.frames){
  const meta=await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=false;for(let i=3;i<data.length;i+=4)if(data[i]===0){transparent=true;break}return{width:img.naturalWidth,height:img.naturalHeight,transparent}},src);
  expect(meta).toEqual({width:1024,height:1024,transparent:true});
 }
});

test('bell jester exposes four transparent attack frames',async({page})=>{
 await open(page);
 const def=await page.evaluate(()=>({frames:ZOMBIE_TYPES.jester.attackFrames,durations:ZOMBIE_TYPES.jester.attackFrameDurations,hitAt:ZOMBIE_TYPES.jester.attackHitAt}));
 expect(def.frames).toHaveLength(4);
 expect(def.durations).toEqual([120,120,100,160]);
 expect(def.hitAt).toBe(240);
 for(const src of def.frames){
  const meta=await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=false;for(let i=3;i<data.length;i+=4)if(data[i]===0){transparent=true;break}return{width:img.naturalWidth,height:img.naturalHeight,transparent}},src);
  expect(meta).toEqual({width:1024,height:1024,transparent:true});
 }
});

test('bomb carrier exposes four transparent attack frames',async({page})=>{
 await open(page);
 const def=await page.evaluate(()=>({frames:ZOMBIE_TYPES.bombJester.attackFrames,durations:ZOMBIE_TYPES.bombJester.attackFrameDurations,hitAt:ZOMBIE_TYPES.bombJester.attackHitAt}));
 expect(def.frames).toHaveLength(4);
 expect(def.durations).toEqual([120,120,100,160]);
 expect(def.hitAt).toBe(240);
 for(const src of def.frames){
  const meta=await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=false;for(let i=3;i<data.length;i+=4)if(data[i]===0){transparent=true;break}return{width:img.naturalWidth,height:img.naturalHeight,transparent}},src);
  expect(meta).toEqual({width:1024,height:1024,transparent:true});
 }
});

test('banner titan exposes four transparent attack frames',async({page})=>{
 await open(page);
 const def=await page.evaluate(()=>({idle:ZOMBIE_TYPES.corpseTitan.battleAsset,frames:ZOMBIE_TYPES.corpseTitan.attackFrames,durations:ZOMBIE_TYPES.corpseTitan.attackFrameDurations,hitAt:ZOMBIE_TYPES.corpseTitan.attackHitAt}));
 expect(def.idle).toMatch(/zombie-animations\/corpseTitan\/idle-battle\.webp$/);
 expect(def.frames).toHaveLength(4);
 expect(def.durations).toEqual([120,120,100,160]);
 expect(def.hitAt).toBe(240);
 for(const src of [def.idle,...def.frames]){
  const meta=await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=false;for(let i=3;i<data.length;i+=4)if(data[i]===0){transparent=true;break}return{width:img.naturalWidth,height:img.naturalHeight,transparent}},src);
  expect(meta).toEqual({width:1024,height:1024,transparent:true});
 }
 const result=await page.evaluate(()=>{
  playerProfile.campaignProgress.plants={completedLevels:{1:1},highestLevel:1};markStoryRead('plants',2,'opening',1);currentSeason=1;selectedLevel=2;start('plants');clearInterval(timer);state.paused=false;state.countdownActive=false;state.plants=[];state.zombies=[];state.projectiles=[];state.pendingZombieStrikes=[];state.time=10000;
  addPlant('wallnut',3,2);const defender=state.plants.at(-1);addZombie('corpseTitan',3.25,2);const titan=state.zombies.at(-1);titan.last=0;titan.smashLast=0;titan.bornAt=0;const before=defender.hp;render();const idle=document.querySelector('#board .type-corpseTitan .char-img')?.getAttribute('src');actZombies();render();const windup=document.querySelector('#board .type-corpseTitan .char-img')?.getAttribute('src');const after=defender.hp;state.time+=240;render();const hit=document.querySelector('#board .type-corpseTitan .char-img')?.getAttribute('src');state.time+=270;render();const recovered=document.querySelector('#board .type-corpseTitan .char-img')?.getAttribute('src');return{before,after,idle,windup,hit,recovered};
 });
 expect(result.after).toBeLessThan(result.before);
 expect(result.idle).toMatch(/zombie-animations\/corpseTitan\/idle-battle\.webp$/);
 expect(result.windup).toMatch(/zombie-animations\/corpseTitan\/attack-00\.webp$/);
 expect(result.hit).toMatch(/zombie-animations\/corpseTitan\/attack-02\.webp$/);
 expect(result.recovered).toMatch(/zombie-animations\/corpseTitan\/idle-battle\.webp$/);
});
