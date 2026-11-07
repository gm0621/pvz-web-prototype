const {test,expect}=require('@playwright/test');
test('music switch mutes the actual output bus, including rapid toggles',async({page})=>{
 await page.addInitScript(()=>{window.audioGains=[];const original=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){const gain=original.call(this),connect=gain.connect.bind(gain),disconnect=gain.disconnect.bind(gain);gain.outputConnected=false;gain.connect=(...args)=>{gain.outputConnected=true;return connect(...args)};gain.disconnect=(...args)=>{gain.outputConnected=false;return disconnect(...args)};window.audioGains.push(gain);return gain}});
 await page.goto('/hero/');await page.locator('#musicBtn').click();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>window.audioGains[0].gain.value)).toBeGreaterThan(0);
 await page.locator('#musicBtn').click();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>window.audioGains[0].outputConnected)).toBe(false);
 await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=counter-position-1');await Promise.all([a.setMusic(true),a.setMusic(false),a.setMusic(true),a.setMusic(false)])});
 expect(await page.evaluate(()=>window.audioGains[0].outputConnected)).toBe(false);
 await page.getByRole('button',{name:'音效：開',exact:true}).click();expect(await page.evaluate(()=>window.audioGains[1].gain.value)).toBe(0);
});

test('stage themes are distinct and fullscreen rejection preserves focused play',async({page})=>{
 await page.addInitScript(()=>{document.documentElement.requestFullscreen=()=>Promise.reject(new Error('unsupported'))});
 await page.goto('/hero/');
 const themes=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=counter-position-1');a.setMusicScene(4);return a.THEMES.map(t=>JSON.stringify(t.notes))});expect(new Set(themes).size).toBe(6);
 await page.locator('#startBtn').click();await page.locator('#storySkip').click();await expect(page.locator('body')).toHaveClass(/battle-focus/);await expect(page.locator('#field')).toBeVisible();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
 await page.locator('#battle [data-home]').click();await expect(page.locator('body')).not.toHaveClass(/battle-focus/);
});
