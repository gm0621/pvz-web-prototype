const {test,expect}=require('@playwright/test');

const entry=process.env.HERO_TEST_ENTRY||'/hero/';
const audioPath='audio.mjs?v=hero-audio-settings-1';
const key='heroLegendProgress_v1';
const ending='西晉一統・章末';
const bonuses=[
 {completed:142,button:'#homeExtra',title:'西晉後日談',stage:'孫皓入洛',initial:143},
 {completed:160,button:'#homeLuoyang',title:'洛陽風雲',stage:'齊府勸諫',initial:161},
 {completed:166,button:'#homeChangan',title:'長安西行',stage:'洛陽清點',initial:167}
];

async function open(page,completed){
 await page.addInitScript(({completed,key})=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({completed,coins:100,weapons:{guanyu:2},inventory:{grain:2}}));
  Element.prototype.requestFullscreen=undefined;
  const probe=window.finaleAudio={starts:[],gains:[]};
  const original=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){
   if(this.dataset.musicMode)probe.starts.push({
    mode:this.dataset.musicMode,
    at:this.currentTime,
    others:[...document.querySelectorAll('audio')].filter(node=>node!==this&&!node.paused).map(node=>node.dataset.musicMode)
   });
   return original.call(this);
  };
  const createGain=AudioContext.prototype.createGain;
  AudioContext.prototype.createGain=function(){
   const gain=createGain.call(this);
   if(!probe.context){
    probe.context=this;
    probe.meter=this.createAnalyser();
    probe.meter.fftSize=2048;
    const connect=gain.connect.bind(gain);
    gain.connect=(node,...args)=>{
     if(node===this.destination)connect(probe.meter);
     return connect(node,...args);
    };
    const param=gain.gain;
    Object.defineProperty(gain,'gain',{value:param});
    const schedule=param.setTargetAtTime.bind(param);
    param.setTargetAtTime=(value,at,time)=>{
     probe.gains.push({value,time});
     return schedule(value,at,time);
    };
   }
   return gain;
  };
 },{completed,key});
 await page.route('**/hero/engine.mjs?*',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:(await response.text()).replace('return {level,mission:','window.finaleDeploy=deploy;return window.finaleBattle={level,mission:')});
 });
 await page.goto(entry);
 await page.locator('#musicBtn').tap();
 await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','true');
}

const tap=(page,css)=>page.locator(css).tap();
const audio=page=>page.evaluate(async path=>(await import(new URL(path,location.href))).audioStatus(),audioPath);
const saved=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
const active=page=>page.locator('audio[data-music-mode]').evaluateAll(elements=>elements.filter(e=>!e.paused).map(e=>e.dataset.musicMode));

async function signal(page){
 return page.evaluate(async()=>{
  const {meter}=window.finaleAudio,values=new Float32Array(meter.fftSize);
  let peak=0;
  for(let i=0;i<8;i++){
   meter.getFloatTimeDomainData(values);
   for(const v of values)peak=Math.max(peak,Math.abs(v));
   await new Promise(resolve=>setTimeout(resolve,35));
  }
  return peak;
 });
}
async function coda(page,theme=ending){
 await expect.poll(async()=>(await audio(page)).theme).toBe(theme);
 await expect.poll(()=>active(page)).toEqual([]);
 await expect.poll(()=>signal(page)).toBeGreaterThan(.008);
}
async function recording(page,mode,limit){
 await expect.poll(()=>active(page)).toEqual([mode]);
 await expect.poll(()=>page.locator(`audio[data-music-mode="${mode}"]`).evaluate(el=>el.currentTime)).toBeGreaterThan(.15);
 await expect.poll(async()=>{
  const peak=await signal(page);
  expect(peak).toBeLessThan(limit);
  return peak;
 }).toBeGreaterThan(.01);
}
async function noOverlaps(page){
 expect(await page.evaluate(()=>window.finaleAudio.starts.every(s=>s.others.length===0))).toBe(true);
}
async function bonusBattle(page,bonus){
 await expect(page.locator('#storyTitle')).toHaveText(bonus.stage);
 await recording(page,'story',.28);
 await tap(page,'#storySkip');
 const deployment=page.locator('#deployment');
 if(bonus.initial!==143){
  await expect(deployment).toBeVisible();
  await recording(page,'prepare',.26);
  await tap(page,'#deploymentStart');
 }
 await expect(page.locator('#battle')).toBeVisible({timeout:45000});
 await expect.poll(async()=>(await audio(page)).theme).toBe(bonus.stage+'・行軍');
 await expect.poll(()=>active(page)).toEqual([]);
 await expect.poll(()=>signal(page)).toBeGreaterThan(.008);
 await noOverlaps(page);
}

test('stage 142 plays the coda through the recap and the optional Western Jin entry',async({page})=>{
 await open(page,141);
 await tap(page,'#startBtn');
 await expect(page.locator('#storyTitle')).toHaveText('孫皓受降');
 await tap(page,'#storySkip');
 await tap(page,'#deploymentStart');
 await expect(page.locator('#battle')).toBeVisible({timeout:45000});
 // Seed the completed restoration. The actual engine still writes the result and save.
 await page.evaluate(()=>{
  const b=window.finaleBattle;
  b.mission.sites=[8,8,8];
  b.bossSpawned=true;
  b.nextSpawn=Infinity;
 });
 await expect(page.locator('#result')).toHaveAttribute('data-outcome','victory');
 expect(await saved(page)).toMatchObject({completed:142,coins:180,inventory:{grain:2}});
 await coda(page);
 await tap(page,'#resultNext');
 await recording(page,'camp',.29);
 await tap(page,'#campContinue');
 await expect(page.locator('#storyChapter')).toContainText('戰後');
 await coda(page);
 const muteTargets=()=>page.evaluate(()=>window.finaleAudio.gains.filter(g=>g.value===0).length);
 const transitions=await muteTargets();
 await tap(page,'#storySkip');
 await expect(page.locator('#finaleCard h2')).toHaveText('桃園與黃巾');
 for(let recap=0;recap<5;recap++)await tap(page,'#finaleNext');
 await expect(page.locator('#finaleComplete h2')).toHaveText('英雄演義・全篇通關');
 await coda(page);
 expect(await muteTargets()).toBe(transitions);
 await tap(page,'#finaleComplete [data-home]');
 await recording(page,'home',.345);
 expect(await page.evaluate(()=>window.finaleAudio.gains.some(g=>g.value===.34&&g.time===.25))).toBe(true);
 await tap(page,'#homeExtra');
 await bonusBattle(page,bonuses[0]);
});

for(const bonus of bonuses){
 test(`legacy save replays the finale and opens ${bonus.title} with the selected soundtrack`,async({page})=>{
  await open(page,bonus.completed);
  await expect(page.locator('#startBtn')).toContainText('重看主篇結局');
  await tap(page,'#startBtn');
  await expect(page.locator('#finaleCard h2')).toHaveText('桃園與黃巾');
  await coda(page);
  await tap(page,'#finaleSkip');
  await expect(page.locator('#finaleComplete')).toBeVisible();
  expect(await saved(page)).toEqual({completed:bonus.completed,coins:100,weapons:{guanyu:2},inventory:{grain:2}});
  if(bonus.initial===167){
   await page.evaluate(()=>{
    const {context}=window.finaleAudio;
    window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
    const resume=context.resume.bind(context);
    let release;
    const pending=new Promise(resolve=>{release=resolve});
    context.resume=()=>pending.then(resume);
    window.releaseFinaleAudio=()=>{context.resume=resume;release()};
   });
   await expect.poll(async()=>(await audio(page)).state).toBe('suspended');
   await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
   await tap(page,'#finaleComplete [data-home]');
   await expect(page.locator('#home')).toBeVisible();
   await tap(page,bonus.button);
   await expect(page.locator('#storyTitle')).toHaveText(bonus.stage);
   // No extra gesture. The original audio unlock must follow the latest screen.
   await page.evaluate(()=>window.releaseFinaleAudio());
  }else{
   await tap(page,'#finaleComplete [data-home]');
   await recording(page,'home',.345);
   await tap(page,bonus.button);
  }
  await bonusBattle(page,bonus);
  expect(await saved(page)).toMatchObject({completed:bonus.completed,coins:100,inventory:{grain:2}});
 });
}

for(const stage of [
 {level:160,chapter:27,title:'齊王輔政',theme:'諸王討趙・章末',button:'#homeExtra',next:bonuses[1]},
 {level:166,chapter:28,title:'洛陽圍城',theme:'洛陽風雲・章末',button:'#homeLuoyang',next:bonuses[2]},
 {level:172,chapter:29,title:'長安西行',theme:'長安西行・章末',button:'#homeChangan'}
]){
 test(`bonus finale ${stage.level} switches from battle to epilogue, menu and replay`,async({page})=>{
  await open(page,stage.level-1);
  if(stage.next)await expect(page.locator(stage.next.button)).toBeDisabled();
  await tap(page,stage.button);

  async function enterAndSettle(reward){
   await expect(page.locator('#storyTitle')).toHaveText(stage.title);
   await recording(page,'story',.28);
   await tap(page,'#storySkip');
   await recording(page,'prepare',.26);
   await tap(page,'#deploymentStart');
   await expect(page.locator('#battle')).toBeVisible({timeout:45000});
   await expect.poll(async()=>(await audio(page)).theme).toBe(stage.title+'・行軍');
   await expect.poll(()=>active(page)).toEqual([]);
   await expect.poll(()=>signal(page)).toBeGreaterThan(.008);
   // Bring each mission to its final condition and let the real engine award the result.
   await page.evaluate(()=>{
    const b=window.finaleBattle,m=b.mission;
    b.enemies.length=0;
    b.bossSpawned=true;
    b.nextSpawn=Infinity;
    if(m.kind==='restoration')m.sites=[8,8,8];
    if(m.kind==='withdraw'){
     window.finaleDeploy(b,'liubei',0);
     b.time=m.withdrawAt;
     m.ordered=true;
    }
    if(m.kind==='supply'){m.delivered=m.stops.length;m.done=true;}
   });
   await expect(page.locator('#result')).toHaveAttribute('data-outcome','victory');
   await expect(page.locator('#resultEarned')).toHaveText(reward);
   await coda(page,stage.theme);
   expect(await signal(page)).toBeLessThan(.26);
  }
  async function epilogueToMenu(readAll){
   await tap(page,'#resultNext');
   await expect(page.locator('#campTitle')).toContainText(stage.title);
   await recording(page,'camp',.29);
   await tap(page,'#campContinue');
   await expect(page.locator('#storyChapter')).toContainText('戰後');
   await coda(page,stage.theme);
   if(readAll){
    const next=page.locator('#storyNext');
    const pages=Number((await page.locator('#storyCount').textContent()).split('/')[1]);
    for(let i=1;i<pages;i++)await next.tap();
    await expect(next).toContainText('回主選單');
    await next.tap();
   }else await tap(page,'#storySkip');
   await expect(page.locator('#home')).toBeVisible();
   await recording(page,'home',.345);
   expect(await page.evaluate(()=>window.finaleAudio.gains.some(g=>g.value===.34&&g.time===.25))).toBe(true);
  }

  await enterAndSettle('+80');
  await epilogueToMenu(true);
  if(stage.next){
   await expect(page.locator(stage.next.button)).toBeEnabled();
   await tap(page,stage.next.button);
   await expect(page.locator('#storyTitle')).toHaveText(stage.next.stage);
   await recording(page,'story',.28);
   await tap(page,'#story [data-home]');
   await recording(page,'home',.345);
  }
  await tap(page,stage.button);
  await tap(page,`#chapterTabs [data-chapter="${stage.chapter}"]`);
  await tap(page,`#chapterDots [data-level="${stage.level}"]`);
  await enterAndSettle('+0');
  await epilogueToMenu(false);
  expect(await saved(page)).toMatchObject({completed:stage.level,coins:180,weapons:{guanyu:2},inventory:{grain:2}});
  const starts=await page.evaluate(()=>window.finaleAudio.starts);
  expect(starts.filter(s=>['home','camp','story','prepare'].includes(s.mode)).every(s=>s.at<.05)).toBe(true);
  expect(starts.some(s=>s.mode==='victory')).toBe(false);
  await noOverlaps(page);
 });
}
