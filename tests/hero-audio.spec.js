const {test,expect}=require('@playwright/test');
test('recorded scene themes follow home, story, preparation, battle, duel, camp and victory',async({page})=>{
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
 expect(await page.evaluate(()=>document.getElementById('menuBgm').paused)).toBe(true);
 await expect.poll(()=>page.locator('audio[data-music-mode="story"]').evaluate(el=>!el.paused)).toBe(true);
 await page.locator('#prologueContinue').click();
 await expect(page.locator('#musicBtn')).toContainText('整軍出發');
 await expect.poll(()=>page.locator('audio[data-music-mode="prepare"]').evaluate(el=>!el.paused)).toBe(true);
 await page.locator('#storySkip').click();
 await expect(page.locator('#battle')).toBeVisible();
 await expect(page.locator('#musicBtn')).toContainText('晴野行軍');
 await expect.poll(()=>page.locator('audio[data-music-mode="battle"]').evaluate(el=>!el.paused)).toBe(true);
 await page.locator('#battle [data-home]').click();
 await expect(page.locator('#home')).toBeVisible();
 await expect(page.locator('#musicBtn')).toContainText('桃園歡宴');
 await expect.poll(()=>page.evaluate(()=>!document.getElementById('menuBgm').paused)).toBe(true);
 const extraModes=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=scene-audio-3'),results=[];for(const mode of ['duel','camp','victory']){a.setMusicMode(mode,1);await new Promise(resolve=>setTimeout(resolve,120));const track=document.querySelector(`audio[data-music-mode="${mode}"]`);results.push({mode,theme:a.audioStatus().theme,paused:track.paused,src:track.currentSrc})}a.setMusicHome();return results});
 expect(extraModes).toEqual([{mode:'duel',theme:'陣前爭鋒',paused:false,src:expect.stringContaining('duel.m4a')},{mode:'camp',theme:'軍帳小聚',paused:false,src:expect.stringContaining('camp.m4a')},{mode:'victory',theme:'凱歌同樂',paused:false,src:expect.stringContaining('victory.m4a')}]);
});

test('music switch mutes the actual output bus, including rapid toggles',async({page})=>{
 await page.addInitScript(()=>{window.audioGains=[];const original=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){const gain=original.call(this),connect=gain.connect.bind(gain),disconnect=gain.disconnect.bind(gain);gain.outputConnected=false;gain.connect=(...args)=>{gain.outputConnected=true;return connect(...args)};gain.disconnect=(...args)=>{gain.outputConnected=false;return disconnect(...args)};window.audioGains.push(gain);return gain}});
 await page.goto('/hero/');await page.locator('#musicBtn').click();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>window.audioGains[0].gain.value)).toBeGreaterThan(0);
 await page.locator('#musicBtn').click();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>window.audioGains[0].outputConnected)).toBe(false);
 await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=scene-audio-3');await Promise.all([a.setMusic(true),a.setMusic(false),a.setMusic(true),a.setMusic(false)])});
 expect(await page.evaluate(()=>window.audioGains[0].outputConnected)).toBe(false);
 await page.getByRole('button',{name:'音效：開',exact:true}).click();expect(await page.evaluate(()=>window.audioGains[1].gain.value)).toBe(0);
});

test('stage themes are distinct and fullscreen rejection preserves focused play',async({page})=>{
 await page.addInitScript(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new Error('unsupported'))});
 await page.goto('/hero/');
 const themes=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=scene-audio-3');a.setMusicScene(4);return a.THEMES.map(t=>JSON.stringify(t.notes))});expect(new Set(themes).size).toBe(10);
 await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('body')).toHaveClass(/battle-focus/);await expect(page.locator('#field')).toBeVisible();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
 await page.locator('#battle [data-home]').click();await expect(page.locator('body')).not.toHaveClass(/battle-focus/);
});

test('audible effect output survives audio suspension and becomes silent when disabled',async({page})=>{
 await page.addInitScript(()=>{window.buses=[];const original=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){window.soundContext=this;const g=original.call(this);window.buses.push(g);return g}});
 await page.goto('/hero/');await page.locator('#soundTest').click();await expect(page.locator('#audioNotice')).toContainText('已播放揮擊');
 const result=await page.evaluate(async()=>{
  const a=await import('/hero/audio.mjs?v=scene-audio-3'),ctx=window.soundContext,analyser=ctx.createAnalyser();analyser.fftSize=2048;window.buses[1].connect(analyser);
  async function peak(){let p=0;const values=new Float32Array(analyser.fftSize);for(let i=0;i<18;i++){await new Promise(r=>setTimeout(r,20));analyser.getFloatTimeDomainData(values);for(const v of values)p=Math.max(p,Math.abs(v))}return p}
  await ctx.suspend();const resumed=await a.hitSound('slash'),normal=await peak();await a.hitSound('cleave');const heavy=await peak();await new Promise(r=>setTimeout(r,500));a.setSfx(false);await a.hitSound('slash');const muted=await peak();
  return {resumed,normal,heavy,muted,state:a.audioStatus().state};
 });
 expect(result.resumed).toBe(true);expect(result.state).toBe('running');expect(result.normal).toBeGreaterThan(.01);expect(result.heavy).toBeGreaterThan(.01);expect(result.muted).toBeLessThan(.00001);
});

test('an actual general duel switches to the urgent duel recording',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('heroLegendProgress_v1',JSON.stringify({version:1,completed:2})));
 await page.route('**/hero/engine.mjs?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('spawned:0,nextSpawn:6','spawned:STAGES[level-1].enemyCount,nextSpawn:0').replace('lane,x:.94,hp','lane,x:.17,hp')})});
 await page.goto('/hero/');await page.locator('#musicBtn').click();await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('#bossIntro')).toBeVisible();await page.locator('#bossIntroContinue').click();
 const lane=Number(await page.locator('.enemy.boss').getAttribute('data-lane'));await page.locator('[data-hero="zhangfei"]').click();await page.locator('.lane').nth(lane).click();
 await expect(page.locator('#duelDialog')).toBeVisible();await expect(page.locator('#musicBtn')).toContainText('陣前爭鋒');await expect.poll(()=>page.locator('audio[data-music-mode="duel"]').evaluate(track=>!track.paused)).toBe(true);
});

test('battle arrangement produces audio and its output becomes silent when music is off',async({page})=>{
 await page.addInitScript(()=>{window.battleBuses=[];const make=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){window.battleContext=this;const g=make.call(this);window.battleBuses.push(g);return g}});
 await page.goto('/hero/');await page.locator('#startBtn').click();await page.locator('#storySkip').click();await page.locator('#musicBtn').click();
 const output=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=scene-audio-3'),ctx=window.battleContext,analyser=ctx.createAnalyser();analyser.fftSize=2048;window.battleBuses[0].connect(analyser);const sample=async()=>{let peak=0;for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,80));const wave=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(wave);peak=Math.max(peak,...wave.map(Math.abs))}return peak};const playing=await sample();await a.setMusic(false);const muted=await sample();return {playing,muted}});
 expect(output.playing).toBeGreaterThan(.005);expect(output.muted).toBeLessThan(.001);
});
