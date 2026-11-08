const {test,expect}=require('@playwright/test');
test('commander warning produces an audible waveform and the effects switch mutes it',async({page})=>{
 await page.addInitScript(()=>{window.warningBuses=[];const make=AudioContext.prototype.createGain;AudioContext.prototype.createGain=function(){window.warningContext=this;const g=make.call(this);window.warningBuses.push(g);return g}});
 await page.goto('/hero/');await page.locator('#soundTest').click();
 const output=await page.evaluate(async()=>{const a=await import('/hero/audio.mjs?v=history-coalition-1'),ctx=window.warningContext,analyser=ctx.createAnalyser();analyser.fftSize=2048;window.warningBuses[1].connect(analyser);const sample=async()=>{let peak=0;for(let i=0;i<5;i++){await new Promise(r=>setTimeout(r,50));const wave=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(wave);peak=Math.max(peak,...wave.map(Math.abs))}return peak};a.setSfx(true);await a.hitSound('warning-strike');const strike=await sample();await a.hitSound('warning-thunder');const thunder=await sample();a.setSfx(false);const accepted=await a.hitSound('warning-rain');const muted=await sample();return {strike,thunder,accepted,muted}});
 expect(output.strike).toBeGreaterThan(.005);expect(output.thunder).toBeGreaterThan(.005);expect(output.accepted).toBe(false);expect(output.muted).toBeLessThan(.001);
});
