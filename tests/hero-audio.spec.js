const {test,expect}=require('@playwright/test');
test('music switch mutes the actual output bus, including rapid toggles',async({page})=>{
 await page.addInitScript(()=>{window.audioGains=[];const original=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){const gain=original.call(this),connect=gain.connect.bind(gain),disconnect=gain.disconnect.bind(gain);gain.outputConnected=false;gain.connect=(...args)=>{gain.outputConnected=true;return connect(...args)};gain.disconnect=(...args)=>{gain.outputConnected=false;return disconnect(...args)};window.audioGains.push(gain);return gain}});
 await page.goto('/hero/');await page.locator('#musicBtn').click();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>window.audioGains[0].gain.value)).toBeGreaterThan(0);
 await page.locator('#musicBtn').click();await expect(page.locator('#musicBtn')).toHaveAttribute('aria-pressed','false');
 expect(await page.evaluate(()=>window.audioGains[0].outputConnected)).toBe(false);
 await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=duel-audio-1');await Promise.all([a.setMusic(true),a.setMusic(false),a.setMusic(true),a.setMusic(false)])});
 expect(await page.evaluate(()=>window.audioGains[0].outputConnected)).toBe(false);
 await page.getByRole('button',{name:'音效：開',exact:true}).click();expect(await page.evaluate(()=>window.audioGains[1].gain.value)).toBe(0);
});
