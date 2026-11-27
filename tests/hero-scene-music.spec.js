const {test,expect}=require('@playwright/test');
const entry=process.env.HERO_TEST_ENTRY||'/hero/';
const audioPath='audio.mjs?v=hero-finale-audio-1';

async function open(page,level){
 await page.addInitScript(level=>{
  localStorage.setItem('heroLegendProgress_v1',JSON.stringify({
   completed:level-1,skillSeen:['zhangfei:1','guanyu:1','liubei:1']
  }));
  Element.prototype.requestFullscreen=undefined;
  const probe=window.trackProbe={starts:[],gains:[],loops:[],fades:[],sources:new Map()};
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){
   if(this.dataset.musicMode){
    probe.starts.push({
     mode:this.dataset.musicMode,at:this.currentTime,
     others:[...document.querySelectorAll('audio')].filter(t=>t!==this&&!t.paused).map(t=>t.dataset.musicMode)
    });
    if(probe.block===this.dataset.musicMode)return Promise.reject(new DOMException('Blocked for this test','NotAllowedError'));
   }
   return play.call(this);
  };
  const gain=AudioContext.prototype.createGain;
  AudioContext.prototype.createGain=function(){
   const bus=gain.call(this);
   if(!probe.context){
    probe.context=this;
    probe.music=bus;
    probe.analyser=this.createAnalyser();
    probe.analyser.fftSize=2048;
    const connect=bus.connect.bind(bus);
    bus.connect=(node,...args)=>{
     if(node===this.destination)connect(probe.analyser);
     return connect(node,...args);
    };
    const param=bus.gain;
    Object.defineProperty(bus,'gain',{value:param});
    const target=param.setTargetAtTime.bind(param);
    param.setTargetAtTime=(value,at,time)=>{
     probe.gains.push(value);
     if(value===0)probe.fades.push(time);
     return target(value,at,time);
    };
   }
   return bus;
  };
  const buffer=AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource=function(){
   const source=buffer.call(this),start=source.start.bind(source),stop=source.stop.bind(source);
   source.start=(...args)=>{
    if(source.loop&&source.buffer.duration>3){
     probe.loops.push(args[1]);
     probe.sources.set(source,true);
    }
    return start(...args);
   };
   source.stop=(...args)=>{
    if(probe.sources.has(source))probe.sources.set(source,false);
    return stop(...args);
   };
   return source;
  };
 },level);
 await page.route('**/hero/engine.mjs?*',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:(await response.text()).replace('return {level,mission:','return window.musicBattle={level,mission:')});
 });
 await page.goto(entry);
 await page.locator('#musicBtn').click();
 await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','true');
}

const status=page=>page.evaluate(async path=>(await import(new URL(path,location.href))).audioStatus(),audioPath);
const track=(page,mode)=>page.locator(`audio[data-music-mode="${mode}"]`);
const tap=(page,id)=>page.locator(id).click();
const active=page=>page.locator('audio[data-music-mode]').evaluateAll(nodes=>nodes.filter(n=>!n.paused).map(n=>n.dataset.musicMode));
async function enterBattle(page,from='#startBtn'){
 await tap(page,from);
 await tap(page,'#storySkip');
 await expect(page.locator('#battle')).toBeVisible({timeout:45000});
}
async function finish(page){
 // The engine resolves victory on its next tick and runs the normal result UI.
 await page.evaluate(()=>{window.musicBattle.enemies.length=0;window.musicBattle.bossSpawned=true;window.musicBattle.nextSpawn=Infinity});
 await expect(page.locator('#result')).toBeVisible();
 await expect(page.locator('#result')).toHaveAttribute('data-outcome','victory');
}
const peak=page=>page.evaluate(async()=>{
 const {analyser}=window.trackProbe,values=new Float32Array(analyser.fftSize);
 let peak=0;
 for(let i=0;i<12;i++){
  analyser.getFloatTimeDomainData(values);
  for(const value of values)peak=Math.max(peak,Math.abs(value));
  await new Promise(resolve=>setTimeout(resolve,35));
 }
 return peak;
});
async function hearRecording(page,mode,level){
 await expect.poll(()=>active(page)).toEqual([mode]);
 await expect.poll(()=>track(page,mode).evaluate(el=>el.currentTime)).toBeGreaterThan(.13);
 await expect.poll(()=>page.evaluate(()=>window.trackProbe.music.gain.value)).toBeGreaterThan(level*.85);
 const volume=await peak(page);
 expect(volume).toBeGreaterThan(.013);
 expect(volume).toBeLessThan(.32);
 expect((await status(page)).source).toBe(mode+'-recording');
}
async function hide(page,byPageEvent=false){
 await page.evaluate(byPageEvent=>{
  if(byPageEvent){
   window.showGame=()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
   window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
  }else{
   let hidden=true;
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});
   window.showGame=()=>{hidden=false;document.dispatchEvent(new Event('visibilitychange'));delete document.hidden};
   document.dispatchEvent(new Event('visibilitychange'));
  }
 },byPageEvent);
 await expect.poll(async()=>(await status(page)).state).toBe('suspended');
 expect(await active(page)).toEqual([]);
}
async function returnToRecording(page,mode){
 const time=await track(page,mode).evaluate(el=>el.currentTime);
 const restarts=await page.evaluate(()=>window.trackProbe.starts.length);
 await page.evaluate(()=>window.showGame());
 await expect.poll(()=>track(page,mode).evaluate(el=>el.currentTime)).toBeGreaterThan(time+.12);
 const resumes=await page.evaluate(i=>window.trackProbe.starts.slice(i),restarts);
 expect(resumes).toHaveLength(1);
 expect(resumes[0].mode).toBe(mode);
 expect(resumes[0].at).toBeCloseTo(time,2);
}

test('duel, replayed victory and camp switch music cleanly and resume the active scene',async({page})=>{
 await open(page,3);
 await enterBattle(page);
 await page.evaluate(()=>Object.assign(window.musicBattle,{spawned:999,nextSpawn:0}));
 await expect(page.locator('#bossIntro')).toBeVisible();
 await tap(page,'#bossIntroContinue');
 const lane=Number(await page.locator('.enemy.boss').getAttribute('data-lane'));
 await page.evaluate(()=>{
  const b=window.musicBattle,e=b.enemies.find(e=>e.boss);
  Object.assign(e,{x:.17,nextSkill:Infinity,speed:0});
  b.enemies.push({id:9000,hp:100,maxHp:100,name:'追兵',lane:0,x:.86,damage:0,speed:0,lastAttack:b.time,rate:999});
 });
 await tap(page,'#cards [data-hero=zhangfei]');
 await page.locator('.lane').nth(lane).click({position:{x:110,y:25}});
 await expect(page.locator('#duelDialog')).toBeVisible();
 await hearRecording(page,'duel',.25);
 await hide(page,true);
 const duelTime=await track(page,'duel').evaluate(el=>el.currentTime);
 await page.evaluate(()=>window.showGame());
 expect(await active(page)).toEqual([]);
 await expect.poll(async()=>(await status(page)).state).toBe('suspended');
 await tap(page,'#duelPause');
 await expect.poll(()=>track(page,'duel').evaluate(el=>el.currentTime)).toBeGreaterThan(duelTime+.12);
 if(await page.locator('#duelEnter').isVisible())await tap(page,'#duelEnter');
 await page.evaluate(()=>{window.musicBattle.duel.entranceElapsed=3.2;window.musicBattle.duel.elapsed=18.95});
 await expect(page.locator('#duelDialog')).toBeHidden();
 await expect.poll(async()=>(await status(page)).source).toBe('stage-synth');
 await expect.poll(()=>active(page)).toEqual([]);
 await expect.poll(()=>peak(page)).toBeGreaterThan(.01);
 await finish(page);
 await hearRecording(page,'victory',.23);
 await hide(page);
 await returnToRecording(page,'victory');
 const oldTime=await track(page,'victory').evaluate(el=>el.currentTime);
 expect(oldTime).toBeGreaterThan(.25);
 await enterBattle(page,'#replayLevel');
 await finish(page);
 await hearRecording(page,'victory',.23);
 const victoryStarts=await page.evaluate(()=>window.trackProbe.starts.filter(x=>x.mode==='victory'));
 expect(victoryStarts.map(x=>x.at)).toEqual([0,expect.any(Number),0]);
 expect(victoryStarts[1].at).toBeGreaterThan(.13);
 await tap(page,'#resultNext');
 await expect(page.locator('#camp')).toBeVisible();
 await hearRecording(page,'camp',.27);
 await hide(page,true);
 await returnToRecording(page,'camp');
 const probe=await page.evaluate(()=>({starts:window.trackProbe.starts,gains:window.trackProbe.gains,fades:window.trackProbe.fades}));
 expect(probe.starts.every(x=>x.others.length===0)).toBe(true);
 expect(probe.gains).toEqual(expect.arrayContaining([.25,.23,.27]));
 expect(probe.fades.length).toBeGreaterThanOrEqual(5);
});

test('chapter coda survives the background and returns after camp before the next chapter',async({page})=>{
 await open(page,6);
 await enterBattle(page);
 await finish(page);
 await expect(page.locator('#musicBtn')).toContainText('章末');
 await expect.poll(async()=>(await status(page)).source).toBe('chapter-synth');
 await expect.poll(()=>active(page)).toEqual([]);
 await expect.poll(()=>peak(page)).toBeGreaterThan(.01);
 await hide(page);
 await page.evaluate(()=>window.showGame());
 await expect.poll(async()=>(await status(page)).state).toBe('running');
 await expect.poll(()=>peak(page)).toBeGreaterThan(.01);
 expect(await active(page)).toEqual([]);
 await tap(page,'#resultNext');
 await hearRecording(page,'camp',.27);
 await tap(page,'#campContinue');
 await expect(page.locator('#story')).toBeVisible();
 await expect.poll(async()=>(await status(page)).source).toBe('chapter-synth');
 await expect.poll(()=>active(page)).toEqual([]);
 await expect.poll(()=>peak(page)).toBeGreaterThan(.01);
 await tap(page,'#storySkip');
 await expect(page.locator('#storyTitle')).toHaveText('廣宗拜師');
 await hearRecording(page,'story',.25);
 expect(await page.evaluate(()=>window.trackProbe.starts.some(x=>x.mode==='victory'))).toBe(false);
});

test('a blocked media element plays the same recording through Web Audio and stops it on the next scene',async({page})=>{
 await open(page,3);
 await page.evaluate(async path=>{
  window.trackProbe.block='camp';
  const audio=await import(new URL(path,location.href));
  await audio.setMusicMode('camp',3);
 },audioPath);
 expect(await active(page)).toEqual([]);
 expect(await page.evaluate(()=>window.trackProbe.loops)).toEqual([0]);
 expect(await peak(page)).toBeGreaterThan(.013);
 await hide(page,true);
 expect(await page.evaluate(()=>[...window.trackProbe.sources.values()])).toEqual([false]);
 await page.evaluate(()=>window.showGame());
 await expect.poll(()=>page.evaluate(()=>window.trackProbe.loops.length)).toBe(2);
 expect(await page.evaluate(()=>window.trackProbe.loops[1])).toBeGreaterThan(.13);
 await page.evaluate(async path=>(await import(new URL(path,location.href))).setMusicMode('victory',3),audioPath);
 await hearRecording(page,'victory',.23);
 expect(await page.evaluate(()=>[...window.trackProbe.sources.values()])).toEqual([false,false]);
});
