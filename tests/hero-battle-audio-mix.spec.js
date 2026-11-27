const {test,expect}=require('@playwright/test');

const team=['caocao','xiahoudun','caohong','caoren','xiahouyuan'];
const entry=process.env.HERO_TEST_ENTRY||'/hero/';
const audioModule='audio.mjs?v=hero-finale-audio-1';

for(const [level,lanes] of [[40,4],[62,5]]){
 test(`${lanes} lanes keep warning, skill and arrows distinct through pause and foregrounding`,async({page,hasTouch})=>{
  const press=(locator,options)=>hasTouch?locator.tap(options):locator.click(options);
  const tap=(selector,options)=>press(page.locator(selector),options);
  await page.addInitScript(({level,lanes,team})=>{
   localStorage.setItem('heroLegendProgress_v1',JSON.stringify({
    completed:level-1,caoTeam:team,battleLanes:lanes,heroGrowth:{caocao:{xp:405}},
    skillSeen:team.flatMap(id=>[1,3,5,7].map(tier=>id+':'+tier))
   }));
   Element.prototype.requestFullscreen=undefined;
   const gains=[],targets=[],bows=[],tones=[];
   const state=window.mixTest={gains,targets,bows,tones};
   const createGain=AudioContext.prototype.createGain;
   AudioContext.prototype.createGain=function(){
    const node=createGain.call(this);
    const index=gains.push(node)-1;
    const param=node.gain;
    Object.defineProperty(node,'gain',{value:param});
    const target=param.setTargetAtTime.bind(param);
    param.setTargetAtTime=(value,at,time)=>{targets.push({index,value,at,time});return target(value,at,time)};
    if(index===0){
     state.context=this;
     state.analyser=this.createAnalyser();
     state.analyser.fftSize=2048;
    }
    return node;
   };
   const connect=AudioNode.prototype.connect;
   AudioNode.prototype.connect=function(node,...args){
    if(node===this.context.destination&&state.analyser)connect.call(this,state.analyser);
    return connect.call(this,node,...args);
   };
   const makeBuffer=AudioContext.prototype.createBufferSource;
   AudioContext.prototype.createBufferSource=function(){
    const source=makeBuffer.call(this),start=source.start.bind(source);
    source.start=(...args)=>{
     if(Math.abs(source.buffer?.duration-.1217)<.0004)bows.push(this.currentTime);
     return start(...args);
    };
    return source;
   };
   const makeTone=AudioContext.prototype.createOscillator;
   AudioContext.prototype.createOscillator=function(){
    const source=makeTone.call(this),set=source.frequency.setValueAtTime.bind(source.frequency);
    source.frequency.setValueAtTime=(frequency,at)=>{tones.push({frequency,at});return set(frequency,at)};
    return source;
   };
  },{level,lanes,team});
  await page.route('**/hero/engine.mjs?*',async route=>{
   const response=await route.fetch();
   const source=await response.text();
   await route.fulfill({response,body:source.replace(
    'return {level,mission:',
    'window.testDeploy=deploy;return window.testBattle={level,mission:'
   )});
  });
  await page.goto(entry);
  await tap('#musicBtn');
  await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','true');
  await page.evaluate(async path=>(await import(new URL(path,location.href))).preloadCombatSounds(),audioModule);
  await tap('#startBtn');
  await tap('#storySkip');
  await expect(page.locator('#deployment')).toBeVisible();
  await expect(page.getByRole('combobox',{name:'戰線與出戰名額'})).toHaveValue(String(lanes));
  await tap('#deploymentStart');
  await expect(page.locator('#battle')).toBeVisible({timeout:45000});
  await expect(page.locator('.lane')).toHaveCount(lanes);
  if(level===40){
   await page.evaluate(()=>Object.assign(window.testBattle,{spawned:999,nextSpawn:0}));
   await expect(page.locator('#bossIntro')).toBeVisible();
   await tap('#bossIntroContinue');
  }
  await page.evaluate(()=>{window.testBattle.nextSpawn=Infinity});
  await tap('#cards [data-hero=liubei]');
  await press(page.locator('.lane').first(),{position:{x:110,y:25}});
  const active=page.locator('#activeSkills [data-skill="2"]');
  if(!await active.isVisible())await tap('#units .ally[data-kind=liubei]');
  await expect(active).toBeEnabled();
  await page.evaluate(({level,lanes})=>{
   const b=window.testBattle,stageBoss=b.enemies.find(e=>e.boss);
   // Real deployed archers fire from all fronts. Control the enemy positions and
   // align the incoming warning with the player's tap so the overlap is repeatable.
   b.roster.archer={...b.roster.archer,rate:.10};
   for(let lane=0;lane<lanes;lane++){
    b.food=1000;
    b.cooldowns.archer=0;
    window.testDeploy(b,'archer',lane);
   }
   document.querySelector('#activeSkills [data-skill="2"]').addEventListener('click',()=>{
    b.enemies=Array.from({length:lanes},(_,lane)=>({
     id:5000+lane,name:'測試敵兵',hp:1000,maxHp:1000,lane,x:.31,speed:0,rate:1000,lastAttack:b.time,damage:0
    }));
    if(level===40){
     Object.assign(stageBoss,{x:.89,lane:lanes-1,castAt:b.time+2.5,castStartedAt:b.time,castLanes:[0,lanes-1]});
     b.enemies.push(stageBoss);
    }else b.nextSpawn=b.time+2.9;
    const mix=window.mixTest;
    mix.targets.length=mix.bows.length=mix.tones.length=0;
    mix.overlap=mix.context.currentTime;
   },{once:true,capture:true});
  },{level,lanes});
  await press(active);
  await expect(page.locator('#masterCutin')).toContainText('雄略軍令');
  if(level===40)await expect(page.locator('#bossCutin')).toBeVisible();
  else await expect(page.locator('.lane[data-threat=true]')).toHaveCount(1);
  await expect.poll(()=>page.evaluate(()=>window.mixTest.bows.length)).toBeGreaterThanOrEqual(2);
  const overlap=await page.evaluate(()=>{
   const {context,targets,bows,tones,overlap}=window.mixTest;
   return {targets,bows,tones,overlap,current:context.currentTime};
  });
  const warned=level===40?95:415;
  expect(overlap.tones.some(t=>t.frequency===warned&&t.at-overlap.overlap<.3)).toBe(true);
  expect(overlap.tones.some(t=>t.frequency===294&&t.at-overlap.overlap<.3)).toBe(true);
  expect(overlap.bows[0]-overlap.overlap).toBeLessThan(.3);
  expect(overlap.bows.slice(1).every((time,i)=>time-overlap.bows[i]>=.158)).toBe(true);
  expect(overlap.targets.some(t=>t.index===0&&Math.abs(t.value-.088)<.0001)).toBe(true);
  expect(overlap.targets.some(t=>t.value===.20)).toBe(true);
  expect(overlap.targets.some(t=>t.value===.70)).toBe(true);
  expect(overlap.targets.some(t=>t.index===0&&t.value===.40&&t.at>overlap.overlap+.5)).toBe(true);

  const sample=()=>page.evaluate(async()=>{
   const {analyser}=window.mixTest,values=new Float32Array(analyser.fftSize);
   let peak=0;
   for(let i=0;i<6;i++){
    analyser.getFloatTimeDomainData(values);
    for(const value of values)peak=Math.max(peak,Math.abs(value));
    await new Promise(resolve=>setTimeout(resolve,35));
   }
   return peak;
  });
  const peak=await sample();
  expect(peak).toBeGreaterThan(.01);
  expect(peak).toBeLessThan(1);
  const battleTime=()=>page.evaluate(()=>window.testBattle.time);
  await tap('#pauseBtn');
  await expect(page.locator('#pauseOverlay')).toBeVisible();
  const pausedTime=await battleTime();
  const beforePause=await page.evaluate(()=>window.mixTest.bows.length);
  // Let the analyser's buffer drain after disconnecting the previous sound nodes.
  await expect.poll(sample).toBeLessThan(.001);
  expect(await battleTime()).toBe(pausedTime);
  expect(await page.evaluate(()=>window.mixTest.bows.length)).toBe(beforePause);
  await tap('#resumeBtn');
  await expect.poll(battleTime).toBeGreaterThan(pausedTime);
  expect(await sample()).toBeGreaterThan(.01);
  await expect.poll(()=>page.evaluate(()=>window.mixTest.gains[0].gain.value)).toBeGreaterThan(.35);

  const status=()=>page.evaluate(async path=>(await import(new URL(path,location.href))).audioStatus(),audioModule);
  await page.evaluate(level=>{
   if(level===40){
    let hidden=true;
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
    window.foreground=()=>{hidden=false;document.dispatchEvent(new Event('visibilitychange'))};
    document.dispatchEvent(new Event('visibilitychange'));
   }else{
    window.foreground=()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
    window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
   }
  },level);
  await expect(page.locator('#pauseOverlay')).toBeVisible();
  await expect.poll(async()=>(await status()).state).toBe('suspended');
  expect((await status()).music).toBe(true);
  const backgroundTime=await battleTime();
  const beforeReturn=await page.evaluate(()=>window.mixTest.bows.length);
  await page.evaluate(()=>window.foreground());
  expect((await status()).state).toBe('suspended');
  await page.locator('#field').dispatchEvent('pointerdown');
  await expect(page.locator('#pauseOverlay')).toBeVisible();
  await expect.poll(sample).toBeLessThan(.001);
  expect(await battleTime()).toBe(backgroundTime);
  expect(await page.evaluate(()=>window.mixTest.bows.length)).toBe(beforeReturn);
  await tap('#resumeBtn');
  await expect.poll(async()=>(await status()).state).toBe('running');
  await expect.poll(battleTime).toBeGreaterThan(backgroundTime);
  await expect.poll(sample).toBeGreaterThan(.01);
  expect((await status()).source).toBe('stage-synth');
  if(level===62){
   await page.evaluate(()=>{
    const b=window.testBattle;
    b.enemies.forEach(enemy=>enemy.hp=0);
    b.nextSpawn=Infinity;
    b.bossSpawned=true;
   });
   await expect(page.locator('#result')).toBeVisible();
   await expect(page.locator('#result')).toHaveAttribute('data-outcome','victory');
   await expect.poll(()=>page.locator('audio[data-music-mode=victory]').evaluate(el=>el.currentTime)).toBeGreaterThan(.15);
   await expect.poll(()=>page.evaluate(()=>window.mixTest.gains[0].gain.value)).toBeGreaterThan(.19);
   expect(await page.evaluate(()=>window.mixTest.gains[0].gain.value)).toBeLessThanOrEqual(.24);
   expect(await page.locator('audio:not([data-music-mode=victory])').evaluateAll(tracks=>tracks.every(el=>el.paused))).toBe(true);
  }
 });
}
