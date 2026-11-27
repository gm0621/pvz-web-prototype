const {test,expect}=require('@playwright/test');
test('recorded scene themes follow home, story, preparation, battle, duel, camp and victory',async({page})=>{
 await page.addInitScript(()=>{
  const make=AudioContext.prototype.createGain;
  AudioContext.prototype.createGain=function(){
   const gain=make.call(this);
   if(!window.sceneMusic)window.sceneMusic={context:this,gain};
   return gain;
  };
 });
 await page.goto('/hero/');
 const menuAudio=page.locator('#menuBgm');
 await expect(menuAudio).toHaveAttribute('loop','');
 expect(await menuAudio.locator('source').count()).toBe(2);
 expect(await page.locator('audio[data-music-mode]').count()).toBe(7);
 await page.locator('#musicBtn').click();
 await expect(page.locator('#musicBtn')).toContainText('桃園歡宴');
 await expect.poll(()=>page.evaluate(()=>!document.getElementById('menuBgm').paused)).toBe(true);
 await page.locator('#startBtn').click();
 await expect(page.locator('#story')).toBeVisible();
 await expect(page.locator('#musicBtn')).toContainText('桃園說書');
 await expect.poll(()=>page.evaluate(()=>document.getElementById('menuBgm').paused)).toBe(true);
 await expect.poll(()=>page.locator('audio[data-music-mode="story"]').evaluate(el=>!el.paused)).toBe(true);
 for(let turn=0;turn<8&&await page.locator('#storyPrologue').isVisible();turn++){
  await page.locator('#storyNext').click();
 }
 await expect(page.locator('#storyPrologue')).toBeHidden();
 await expect(page.locator('#musicBtn')).toContainText('整軍出發');
 await expect.poll(()=>page.locator('audio[data-music-mode="prepare"]').evaluate(el=>el.currentTime)).toBeGreaterThan(.2);
 const preparationPeak=await page.evaluate(async()=>{
  const {context,gain}=window.sceneMusic;
  const analyser=context.createAnalyser();
  gain.connect(analyser);
  const values=new Float32Array(analyser.fftSize);
  let peak=0;
  for(let i=0;i<6;i++){
   await new Promise(resolve=>setTimeout(resolve,60));
   analyser.getFloatTimeDomainData(values);
   for(const value of values)peak=Math.max(peak,Math.abs(value));
  }
  gain.disconnect(analyser);
  return peak;
 });
 expect(preparationPeak).toBeGreaterThan(.01);
 await page.locator('#storySkip').click();
 await expect(page.locator('#battle')).toBeVisible();
 await expect(page.locator('#musicBtn')).toContainText('義軍初成・行軍');
 await expect.poll(()=>page.locator('audio[data-music-mode="battle"]').evaluate(el=>el.paused)).toBe(true);
 await page.locator('#battle [data-home]').click();
 await expect(page.locator('#home')).toBeVisible();
 await expect(page.locator('#musicBtn')).toContainText('桃園歡宴');
 await expect.poll(()=>page.evaluate(()=>!document.getElementById('menuBgm').paused)).toBe(true);
 const extraModes=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=hero-audio-settings-1'),results=[];for(const mode of ['duel','camp','victory']){await a.setMusicMode(mode,1);const track=document.querySelector(`audio[data-music-mode="${mode}"]`);results.push({mode,theme:a.audioStatus().theme,paused:track.paused,src:track.currentSrc})}a.setMusicHome();return results});
 expect(extraModes).toEqual([{mode:'duel',theme:'陣前爭鋒',paused:false,src:expect.stringContaining('duel.m4a')},{mode:'camp',theme:'軍帳小聚',paused:false,src:expect.stringContaining('camp.m4a')},{mode:'victory',theme:'凱歌同樂',paused:false,src:expect.stringContaining('victory.m4a')}]);
});

test('music switch mutes the actual output bus, including rapid toggles',async({page})=>{
 await page.addInitScript(()=>{window.audioGains=[];const original=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){const gain=original.call(this),connect=gain.connect.bind(gain),disconnect=gain.disconnect.bind(gain);gain.outputConnected=false;gain.connect=(...args)=>{gain.outputConnected=true;return connect(...args)};gain.disconnect=(...args)=>{gain.outputConnected=false;return disconnect(...args)};window.audioGains.push(gain);return gain}});
 await page.goto('/hero/');await page.locator('#musicBtn').click();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>page.evaluate(()=>window.audioGains[0].gain.value)).toBeGreaterThan(0);
 await page.locator('#musicBtn').click();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>window.audioGains[0].outputConnected)).toBe(false);
 await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=hero-audio-settings-1');await Promise.all([a.setMusic(true),a.setMusic(false),a.setMusic(true),a.setMusic(false)])});
 expect(await page.evaluate(()=>window.audioGains[0].outputConnected)).toBe(false);
 await page.getByRole('button',{name:'音效：開',exact:true}).click();expect(await page.evaluate(()=>window.audioGains[1].gain.value)).toBe(0);
});

test('stage themes are distinct and fullscreen rejection preserves focused play',async({page})=>{
 await page.addInitScript(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new Error('unsupported'))});
 await page.goto('/hero/');
 const themes=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=hero-audio-settings-1');a.setMusicScene(4);return a.THEMES.map(t=>JSON.stringify(t.notes))});expect(new Set(themes).size).toBe(172);
 await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('body')).toHaveClass(/battle-focus/);await expect(page.locator('#field')).toBeVisible();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
 await page.locator('#battle [data-home]').click();await expect(page.locator('body')).not.toHaveClass(/battle-focus/);
});

test('audible effect output survives audio suspension and becomes silent when disabled',async({page})=>{
 await page.addInitScript(()=>{window.buses=[];const original=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){window.soundContext=this;const g=original.call(this);window.buses.push(g);return g}});
 await page.goto('/hero/');await page.locator('#soundTest').click();await expect(page.locator('#audioNotice')).toContainText('已播放揮擊');
 const result=await page.evaluate(async()=>{
  const a=await import('/hero/audio.mjs?v=hero-audio-settings-1'),ctx=window.soundContext,analyser=ctx.createAnalyser();analyser.fftSize=2048;window.buses[1].connect(analyser);
  async function peak(){let p=0;const values=new Float32Array(analyser.fftSize);for(let i=0;i<18;i++){await new Promise(r=>setTimeout(r,20));analyser.getFloatTimeDomainData(values);for(const v of values)p=Math.max(p,Math.abs(v))}return p}
  await ctx.suspend();const resumed=await a.hitSound('slash'),normal=await peak();await a.hitSound('cleave');const heavy=await peak();await new Promise(r=>setTimeout(r,500));a.setSfx(false);await a.hitSound('slash');const muted=await peak();
  return {resumed,normal,heavy,muted,state:a.audioStatus().state};
 });
 expect(result.resumed).toBe(true);expect(result.state).toBe('running');expect(result.normal).toBeGreaterThan(.01);expect(result.heavy).toBeGreaterThan(.01);expect(result.muted).toBeLessThan(.00001);
});

test('an actual general duel switches to the urgent duel recording',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({version:1,completed:2,skillSeen:['zhangfei:1']})));
 await page.route('**/hero/engine.mjs?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('spawned:0,nextSpawn:6','spawned:STAGES[level-1].enemyCount,nextSpawn:0').replace('lane,x:.94,hp','lane,x:.17,hp')})});
 await page.goto('/hero/');await page.locator('#musicBtn').click();await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('#bossIntro')).toBeVisible();await page.locator('#bossIntroContinue').click();
 const lane=Number(await page.locator('.enemy.boss').getAttribute('data-lane'));await page.locator('[data-hero="zhangfei"]').click();await page.locator('.lane').nth(lane).click();
 await expect(page.locator('#duelDialog')).toBeVisible();await expect(page.locator('#musicBtn')).toContainText('陣前爭鋒');await expect.poll(()=>page.locator('audio[data-music-mode="duel"]').evaluate(track=>!track.paused)).toBe(true);
});

test('battle arrangement produces audio and its output becomes silent when music is off',async({page,hasTouch})=>{
 await page.addInitScript(()=>{window.battleBuses=[];const make=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){window.battleContext=this;const g=make.call(this);window.battleBuses.push(g);return g}});
 const press=selector=>hasTouch?page.locator(selector).tap():page.locator(selector).click();
 await page.goto('/hero/');await press('#musicBtn');await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','true');await press('#startBtn');await press('#storySkip');await expect(page.locator('#battle')).toBeVisible();
 await expect.poll(()=>page.locator('audio[data-music-mode]').evaluateAll(tracks=>tracks.every(track=>track.paused))).toBe(true);
 const output=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=hero-audio-settings-1'),ctx=window.battleContext,analyser=ctx.createAnalyser();analyser.fftSize=2048;window.battleBuses[0].connect(analyser);const sample=async()=>{let peak=0;for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,80));const wave=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(wave);peak=Math.max(peak,...wave.map(Math.abs))}return peak};const playing=await sample();await a.setMusic(false);const muted=await sample();return {playing,muted}});
 expect(output.playing).toBeGreaterThan(.005);expect(output.muted).toBeLessThan(.001);
});


test('later stage scores and chapter coda produce actual output with all recordings stopped',async({page})=>{
 await page.addInitScript(()=>{const make=AudioContext.prototype.createGain;window.scoreBuses=[];AudioContext.prototype.createGain=function(){window.scoreContext=this;const g=make.call(this);window.scoreBuses.push(g);return g}});
 await page.goto('/hero/');await page.locator('#musicBtn').click();
 const samples=await page.evaluate(async()=>{
  const a=await import('/hero/audio.mjs?v=hero-audio-settings-1'),ctx=window.scoreContext,analyser=ctx.createAnalyser();analyser.fftSize=2048;
  const results=[];for(const [mode,level] of [['battle',17],['battle',18],['victory',22]]){
   await a.setMusicMode(mode,level);window.scoreBuses[0].connect(analyser);let peak=0;
   for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,80));const wave=new Float32Array(2048);analyser.getFloatTimeDomainData(wave);for(const n of wave)peak=Math.max(peak,Math.abs(n))}
   results.push({theme:a.musicTheme().name,source:a.audioStatus().source,peak,recordingsStopped:[...document.querySelectorAll('audio')].every(t=>t.paused)});
  }await a.setMusic(false);return results;
 });
 expect(new Set(samples.map(s=>s.theme)).size).toBe(3);expect(samples.map(s=>s.source)).toEqual(['stage-synth','stage-synth','chapter-synth']);for(const s of samples){expect(s.peak).toBeGreaterThan(.005);expect(s.recordingsStopped).toBe(true)}
});


test('deployment and the first wave play distinct cues exactly once without music',async({page,hasTouch})=>{
 await page.addInitScript(()=>{
  const key='heroLegendProgress_v1';
  localStorage.setItem(key,JSON.stringify({completed:88,skillSeen:['liubei','guanyu','zhangfei'].map(id=>id+':1')}));
  window.cueFrequencies=[];
  const create=AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator=function(){
   const oscillator=create.call(this);
   const set=oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
   oscillator.frequency.setValueAtTime=(value,time)=>{window.cueFrequencies.push(value);return set(value,time)};
   return oscillator;
  };
  Element.prototype.requestFullscreen=undefined;
 });
 await page.clock.install();
 await page.goto('/hero/');
 await expect(page.locator('#homeProgress')).toContainText('下一站：白帝託孤');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+500));
 const press=(locator,options)=>hasTouch?locator.tap(options):locator.click(options);
 await press(page.locator('#startBtn'));
 await press(page.locator('#storySkip'));
 await expect(page.locator('#battle')).toBeVisible();
 await press(page.locator('#cards [data-hero=liubei]'));
 await press(page.locator('.lane').first(),{position:{x:110,y:25}});
 const marks=value=>page.evaluate(value=>window.cueFrequencies.filter(n=>n===value).length,value);
 await expect.poll(()=>marks(370)).toBe(1);
 for(let interval=0;interval<12&&!(await marks(415));interval++){
  await page.clock.runFor(500);
 }
 await expect(page.locator('.lane[data-threat="true"]')).toHaveAttribute('data-lane','0');
 await expect.poll(()=>marks(415)).toBe(1);
 await page.clock.runFor(9500);
 expect(await marks(415)).toBe(1);
 await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
});


test('swing, impact, block and bow use different recorded sounds and respect mute',async({page})=>{
 await page.addInitScript(()=>{
  window.playedCombat=[];
  const create=AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource=function(){
   window.testAudioContext=this;
   const source=create.call(this),start=source.start.bind(source);
   source.start=(...args)=>{window.playedCombat.push(source.buffer);return start(...args)};
   return source;
  };
 });
 await page.goto('/hero/');
 await page.locator('#soundTest').click();
 await expect(page.locator('#audioNotice')).toContainText('已播放揮擊');
 const result=await page.evaluate(async()=>{
  const audio=await import('/hero/audio.mjs?v=hero-audio-settings-1');
  const context=window.testAudioContext;
  const sourceFiles=['swing','impact','parry','bow'];
  const recorded=await Promise.all(sourceFiles.map(async file=>{
   const response=await fetch('/hero/assets/audio/combat/'+file+'.wav');
   return context.decodeAudioData(await response.arrayBuffer());
  }));
  function identify(buffer){
   const data=buffer.getChannelData(0);
   const i=recorded.findIndex(clip=>clip.length===buffer.length&&
     data.every((value,index)=>value===clip.getChannelData(0)[index]));
   return sourceFiles[i];
  }
  for(const sound of ['slash','block','arrow'])await audio.hitSound(sound);
  const played=window.playedCombat.map(identify);
  audio.setSfx(false);
  await audio.hitSound('arrow');
  return {played,muted:window.playedCombat.length===played.length};
 });
 expect(result).toEqual({played:['swing','impact','parry','bow'],muted:true});
});

for(const music of [true,false]){
 test(`independent audio setting survives replay, next stage, reload and foreground: ${music?'music only':'effects only'}`,async({page})=>{
  const settings={music,sfx:!music};
  await page.addInitScript(()=>{
   const key='heroLegendProgress_v1';
   if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({completed:1,coins:100,skillSeen:['liubei:1','guanyu:1','zhangfei:1']}));
   Element.prototype.requestFullscreen=undefined;
   window.audioBuses=[];
   const createGain=AudioContext.prototype.createGain;
   AudioContext.prototype.createGain=function(){
    window.settingsAudioContext=this;
    const bus=createGain.call(this);
    window.audioBuses.push(bus);
    return bus;
   };
  });
  await page.route('**/hero/engine.mjs?*',async route=>{
   const response=await route.fetch();
   await route.fulfill({response,body:(await response.text()).replace('return {level,mission:','return window.settingsBattle={level,mission:')});
  });
  await page.goto(process.env.HERO_TEST_ENTRY||'/hero/');
  const tap=selector=>page.locator(selector).tap();
  const checkSettings=async()=>{
   await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed',String(settings.music));
   await expect(page.locator('.site-bar button:not([id])')).toHaveAttribute('aria-pressed',String(settings.sfx));
   expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendAudio_v1')))).toEqual(settings);
  };
  const output=async(cue=false)=>page.evaluate(async cue=>{
   const context=window.settingsAudioContext;
   const analysers=window.audioBuses.slice(0,2).map(bus=>{
    const analyser=context.createAnalyser();
    analyser.fftSize=2048;
    bus.connect(analyser);
    return analyser;
   });
   const audio=await import(new URL('audio.mjs?v=hero-audio-settings-1',location.href));
   const played=cue?await audio.hitSound('block',true):null;
   const wave=new Float32Array(2048),peaks=[0,0];
   for(let frame=0;frame<12;frame++){
    for(const [i,analyser] of analysers.entries()){
     analyser.getFloatTimeDomainData(wave);
     for(const value of wave)peaks[i]=Math.max(peaks[i],Math.abs(value));
    }
    await new Promise(resolve=>setTimeout(resolve,25));
   }
   for(const [i,analyser] of analysers.entries())window.audioBuses[i].disconnect(analyser);
   return {played,peaks};
  },cue);
  const checkOutput=async(cue=false)=>{
   const {played,peaks}=await output(cue);
   expect(peaks[music?0:1]).toBeGreaterThan(.004);
   expect(peaks[music?1:0]).toBeLessThan(.00001);
   if(cue)expect(played).toBe(!music);
  };

  await tap('#musicBtn');
  if(music)await page.getByRole('button',{name:'音效：開',exact:true}).tap();
  else await tap('#musicBtn');
  await checkSettings();
  await page.reload();
  await checkSettings();
  expect(await page.evaluate(()=>({locked:!window.settingsAudioContext,media:[...document.querySelectorAll('audio')].every(track=>track.paused)}))).toEqual({locked:true,media:true});
  await tap('#soundTest');
  if(music){
   await expect(page.locator('#audioNotice')).toHaveText('請先開啟音效');
   await expect.poll(()=>page.locator('#menuBgm').evaluate(track=>track.currentTime)).toBeGreaterThan(.15);
  }else await expect(page.locator('#audioNotice')).toContainText('已播放揮擊音效');
  await checkOutput(true);

  await tap('#startBtn');
  await expect(page.locator('#storyTitle')).toHaveText('糧道遇襲');
  await tap('#storySkip');
  await expect(page.locator('#battle')).toBeVisible({timeout:45000});
  await checkOutput(true);
  await page.evaluate(music=>{
   if(music){
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    document.dispatchEvent(new Event('visibilitychange'));
   }else window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
  },music);
  await expect(page.locator('#pauseOverlay')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.settingsAudioContext.state)).toBe('suspended');
  await page.evaluate(music=>{
   if(music){
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
   }else window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
  },music);
  await expect(page.locator('#pauseOverlay')).toBeVisible();
  await checkSettings();
  expect(await page.evaluate(()=>[...document.querySelectorAll('audio')].every(track=>track.paused))).toBe(true);
  await tap('#resumeBtn');
  await expect(page.locator('#pauseOverlay')).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>window.settingsAudioContext.state)).toBe('running');
  await checkOutput(true);
  await tap('#battleMenuButton');
  await expect(page.locator('[data-sound-source="musicBtn"]')).toHaveAttribute('aria-pressed',String(settings.music));
  await expect(page.locator('[data-sound-source="sfx"]')).toHaveAttribute('aria-pressed',String(settings.sfx));
  await tap('#battleMenuClose');

  const settle=async()=>{
   await page.evaluate(()=>{
    const battle=window.settingsBattle;
    battle.enemies.length=0;
    battle.bossSpawned=true;
    battle.nextSpawn=Infinity;
   });
   await expect(page.locator('#result')).toHaveAttribute('data-outcome','victory');
  };
  await settle();
  await tap('#replayLevel');
  await expect(page.locator('#storyTitle')).toHaveText('糧道遇襲');
  await tap('#storySkip');
  await expect(page.locator('#battle')).toBeVisible();
  await checkSettings();
  await checkOutput(true);
  await settle();
  await tap('#resultNext');
  await expect(page.locator('#camp')).toBeVisible();
  await tap('#campContinue');
  await tap('#storySkip');
  await expect(page.locator('#storyTitle')).toHaveText('大興山迎敵');
  await checkSettings();
  if(music)await expect.poll(()=>page.locator('audio[data-music-mode="story"]').evaluate(track=>!track.paused)).toBe(true);
  await checkOutput(true);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('heroLegendProgress_v1')).completed)).toBe(2);
 });
}
