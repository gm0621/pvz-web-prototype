const {test}=require('node:test');
const assert=require('node:assert/strict');
let serial=0;
async function setup(t){
 const old={document:global.document,window:global.window,AudioContext:global.AudioContext,setInterval:global.setInterval,clearInterval:global.clearInterval};
 const docEvents=new Map(),winEvents=new Map();
 const tracks=['home','battle'].map(mode=>({dataset:{musicMode:mode},paused:true,plays:0,pause(){this.paused=true},async play(){this.plays++;this.paused=false;if(this.pending)await this.pending}}));
 const param=()=>({value:0,setValueAtTime(v){this.value=v},cancelScheduledValues(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),connect(){},disconnect(){}});
 let ctx;const timers=new Set();global.setInterval=fn=>{timers.add(fn);return fn};global.clearInterval=fn=>timers.delete(fn);
 global.document={hidden:false,querySelectorAll:()=>tracks,addEventListener:(n,fn)=>docEvents.set(n,fn)};
 global.window={addEventListener:(n,fn)=>winEvents.set(n,fn)};
 global.AudioContext=class{
  constructor(){ctx=this;this.state='suspended';this.currentTime=0;this.destination={};this.gains=[]}
  createGain(){const n=node();this.gains.push(n);return n}
  createDynamicsCompressor(){return {connect(){},threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()}}
  createMediaElementSource(){return node()}
  createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)}}
  createBufferSource(){return {...node(),start(){},stop(){}}}
  createOscillator(){return {...node(),frequency:param(),start(){},stop(){}}}
  createBiquadFilter(){return {...node(),frequency:param(),Q:param()}}
  get sampleRate(){return 8000}
  async resume(){if(this.pending)await this.pending;this.state='running'}
  async suspend(){this.state='suspended'}
 };
 t.after(()=>Object.assign(global,old));
 const audio=await import(`../../hero/audio.mjs?background-test=${serial++}`);
 return {audio,tracks,timers,get ctx(){return ctx},hide(){document.hidden=true;docEvents.get('visibilitychange')()},show(){document.hidden=false;docEvents.get('visibilitychange')()},pagehide(){winEvents.get('pagehide')()},pageshow(){winEvents.get('pageshow')()}};
}
test('background pauses every media track, mutes effects and preserves user preferences',async t=>{
 const f=await setup(t);await f.audio.setMusic(true);assert.equal(f.tracks[0].paused,false);
 f.hide();assert.ok(f.tracks.every(x=>x.paused));assert.equal(f.ctx.state,'suspended');assert.equal(f.ctx.gains[1].gain.value,0);assert.equal(f.audio.musicOn(),true);
 assert.equal(await f.audio.hitSound(),false);assert.equal(await f.audio.unlockAudio(),false);
 f.show();assert.equal(f.tracks[0].paused,true);await f.audio.unlockAudio();assert.equal(f.tracks[0].paused,false);assert.equal(f.ctx.gains[1].gain.value,.7);
});
test('music off remains off after background and foreground interaction, effects remain usable',async t=>{
 const f=await setup(t);await f.audio.unlockAudio();await f.audio.setMusic(true);await f.audio.setMusic(false);assert.equal(f.ctx.gains[1].gain.value,.7);
 f.hide();f.show();await f.audio.unlockAudio();assert.equal(f.audio.musicOn(),false);assert.ok(f.tracks.every(x=>x.paused));assert.equal(f.ctx.gains[1].gain.value,.7);
});
test('pagehide works even before visibility changes, and pageshow never autoplays',async t=>{
 const f=await setup(t);await f.audio.setMusic(true);f.pagehide();assert.equal(document.hidden,false);assert.ok(f.tracks.every(x=>x.paused));assert.equal(await f.audio.unlockAudio(),false);
 f.pageshow();assert.ok(f.tracks.every(x=>x.paused));await f.audio.unlockAudio();assert.equal(f.tracks[0].paused,false);
});
test('late play completion cannot restart music while backgrounded',async t=>{
 const f=await setup(t);let done;f.tracks[0].pending=new Promise(r=>done=r);const playing=f.audio.setMusic(true);await Promise.resolve();assert.equal(f.tracks[0].plays,1);
 f.hide();done();await playing;assert.ok(f.tracks.every(x=>x.paused));assert.equal(f.audio.musicOn(),true);assert.equal(f.ctx.state,'suspended');
});
test('late context resume cannot start music after switching apps',async t=>{
 const f=await setup(t);await f.audio.unlockAudio();let done;f.ctx.pending=new Promise(r=>done=r);const playing=f.audio.setMusic(true);f.hide();done();await playing;
 assert.equal(f.tracks[0].plays,0);assert.equal(f.ctx.state,'suspended');assert.ok(f.tracks.every(x=>x.paused));
});
test('hidden scene changes never play; foreground interaction resumes only the selected scene',async t=>{
 const f=await setup(t);await f.audio.setMusic(true);f.hide();f.audio.setMusicMode('battle');await Promise.resolve();assert.equal(f.tracks[1].plays,0);f.show();await f.audio.unlockAudio();assert.equal(f.tracks[0].paused,true);assert.equal(f.tracks[1].paused,false);
});
test('background events before audio initialization do not create an audio context',async t=>{
 const f=await setup(t);f.hide();assert.equal(f.ctx,undefined);await f.audio.setMusic(true);assert.equal(f.ctx,undefined);assert.equal(f.audio.musicOn(),true);f.show();assert.equal(f.ctx,undefined);
});

test('fallback synth timer is cleared on background and not restarted by foregrounding alone',async t=>{
 const f=await setup(t);f.tracks[0].play=async()=>{throw new Error('media unavailable')};await f.audio.setMusic(true);assert.equal(f.timers.size,1);
 f.hide();assert.equal(f.timers.size,0);assert.equal(f.ctx.gains[0].gain.value,0);f.show();assert.equal(f.timers.size,0);await f.audio.unlockAudio();assert.equal(f.timers.size,1);await f.audio.setMusic(false);assert.equal(f.timers.size,0);
});
