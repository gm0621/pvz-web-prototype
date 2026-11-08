const {test,expect}=require('@playwright/test');
test('recorded menu theme loops and hands music back to the stage score',async({page})=>{
 await page.goto('/hero/');
 const menuAudio=page.locator('#menuBgm');
 await expect(menuAudio).toHaveAttribute('loop','');
 expect(await menuAudio.locator('source').count()).toBe(2);
 await page.locator('#musicBtn').click();
 await expect(page.locator('#musicBtn')).toContainText('桃園歡宴');
 await expect.poll(()=>page.evaluate(()=>!document.getElementById('menuBgm').paused)).toBe(true);
 await page.locator('#startBtn').click();
 await expect(page.locator('#story')).toBeVisible();
 await expect(page.locator('#musicBtn')).toContainText('桃園出陣');
 expect(await page.evaluate(()=>document.getElementById('menuBgm').paused)).toBe(true);
 await page.locator('#story [data-home]').click();
 await expect(page.locator('#home')).toBeVisible();
 await expect(page.locator('#musicBtn')).toContainText('桃園歡宴');
 await expect.poll(()=>page.evaluate(()=>!document.getElementById('menuBgm').paused)).toBe(true);
});

test('music switch mutes the actual output bus, including rapid toggles',async({page})=>{
 await page.addInitScript(()=>{window.audioGains=[];const original=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){const gain=original.call(this),connect=gain.connect.bind(gain),disconnect=gain.disconnect.bind(gain);gain.outputConnected=false;gain.connect=(...args)=>{gain.outputConnected=true;return connect(...args)};gain.disconnect=(...args)=>{gain.outputConnected=false;return disconnect(...args)};window.audioGains.push(gain);return gain}});
 await page.goto('/hero/');await page.locator('#musicBtn').click();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>window.audioGains[0].gain.value)).toBeGreaterThan(0);
 await page.locator('#musicBtn').click();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>window.audioGains[0].outputConnected)).toBe(false);
 await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=storm-battle-1');await Promise.all([a.setMusic(true),a.setMusic(false),a.setMusic(true),a.setMusic(false)])});
 expect(await page.evaluate(()=>window.audioGains[0].outputConnected)).toBe(false);
 await page.getByRole('button',{name:'音效：開',exact:true}).click();expect(await page.evaluate(()=>window.audioGains[1].gain.value)).toBe(0);
});

test('stage themes are distinct and fullscreen rejection preserves focused play',async({page})=>{
 await page.addInitScript(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new Error('unsupported'))});
 await page.goto('/hero/');
 const themes=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=storm-battle-1');a.setMusicScene(4);return a.THEMES.map(t=>JSON.stringify(t.notes))});expect(new Set(themes).size).toBe(10);
 await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('body')).toHaveClass(/battle-focus/);await expect(page.locator('#field')).toBeVisible();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
 await page.locator('#battle [data-home]').click();await expect(page.locator('body')).not.toHaveClass(/battle-focus/);
});

test('audible effect output survives audio suspension and becomes silent when disabled',async({page})=>{
 await page.addInitScript(()=>{window.buses=[];const original=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){window.soundContext=this;const g=original.call(this);window.buses.push(g);return g}});
 await page.goto('/hero/');await page.locator('#soundTest').click();await expect(page.locator('#audioNotice')).toContainText('已播放揮擊');
 const result=await page.evaluate(async()=>{
  const a=await import('/hero/audio.mjs?v=storm-battle-1'),ctx=window.soundContext,analyser=ctx.createAnalyser();analyser.fftSize=2048;window.buses[1].connect(analyser);
  async function peak(){let p=0;const values=new Float32Array(analyser.fftSize);for(let i=0;i<18;i++){await new Promise(r=>setTimeout(r,20));analyser.getFloatTimeDomainData(values);for(const v of values)p=Math.max(p,Math.abs(v))}return p}
  await ctx.suspend();const resumed=await a.hitSound('slash'),normal=await peak();await a.hitSound('cleave');const heavy=await peak();await new Promise(r=>setTimeout(r,500));a.setSfx(false);await a.hitSound('slash');const muted=await peak();
  return {resumed,normal,heavy,muted,state:a.audioStatus().state};
 });
 expect(result.resumed).toBe(true);expect(result.state).toBe('running');expect(result.normal).toBeGreaterThan(.01);expect(result.heavy).toBeGreaterThan(.01);expect(result.muted).toBeLessThan(.00001);
});

test('battle arrangement produces audio and its output becomes silent when music is off',async({page})=>{
 await page.addInitScript(()=>{window.battleBuses=[];const make=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){window.battleContext=this;const g=make.call(this);window.battleBuses.push(g);return g}});
 await page.goto('/hero/');await page.locator('#startBtn').click();await page.locator('#storySkip').click();await page.locator('#musicBtn').click();
 const output=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=storm-battle-1'),ctx=window.battleContext,analyser=ctx.createAnalyser();analyser.fftSize=2048;window.battleBuses[0].connect(analyser);const sample=async()=>{let peak=0;for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,80));const wave=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(wave);peak=Math.max(peak,...wave.map(Math.abs))}return peak};const playing=await sample();await a.setMusic(false);const muted=await sample();return {playing,muted}});
 expect(output.playing).toBeGreaterThan(.005);expect(output.muted).toBeLessThan(.001);
});
