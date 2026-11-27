const {test}=require('node:test');
const assert=require('node:assert/strict');
let serial=0;
async function setup(t){
 const old={document:global.document,window:global.window,AudioContext:global.AudioContext,setInterval:global.setInterval,clearInterval:global.clearInterval};
 const docEvents=new Map(),winEvents=new Map();
 const tracks=['home','battle','duel','victory','camp'].map(mode=>({dataset:{musicMode:mode},paused:true,plays:0,currentTime:0,starts:[],pause(){this.paused=true},async play(){this.plays++;this.starts.push(this.currentTime);this.paused=false;if(this.pending)await this.pending}}));
 const param=()=>({
  value:0,targets:[],
  setValueAtTime(v){this.value=v},
  setTargetAtTime(value,at){this.targets.push([value,at]);if(at===ctx.currentTime)this.value=value},
  cancelScheduledValues(at){this.targets=this.targets.filter(([,time])=>time<at)},
  exponentialRampToValueAtTime(){}
 });
 const node=()=>({gain:{...param(),value:1},connected:false,connect(){this.connected=true},disconnect(){this.connected=false}});
 let ctx;const timers=new Set();global.setInterval=fn=>{timers.add(fn);return fn};global.clearInterval=fn=>timers.delete(fn);
 global.document={hidden:false,querySelectorAll:()=>tracks,addEventListener:(n,fn)=>docEvents.set(n,fn)};
 global.window={addEventListener:(n,fn)=>winEvents.set(n,fn)};
 global.AudioContext=class{
  constructor(){ctx=this;this.state='suspended';this.currentTime=0;this.destination={};this.gains=[];this.effects=[]}
  createGain(){const n=node();this.gains.push(n);return n}
  createDynamicsCompressor(){return {connect(){},threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()}}
  createMediaElementSource(){return node()}
  createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)}}
  createBufferSource(){return {...node(),start(){ctx.effects.push(ctx.currentTime)},stop(){}}}
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
 const f=await setup(t);await f.audio.setMusic(true);f.hide();f.audio.setMusicMode('battle');await Promise.resolve();assert.equal(f.tracks[1].plays,0);f.show();await f.audio.unlockAudio();assert.equal(f.tracks[0].paused,true);assert.equal(f.tracks[1].paused,true);assert.equal(f.timers.size,1);assert.equal(f.audio.audioStatus().source,'stage-synth');
});
test('background events before audio initialization do not create an audio context',async t=>{
 const f=await setup(t);f.hide();assert.equal(f.ctx,undefined);await f.audio.setMusic(true);assert.equal(f.ctx,undefined);assert.equal(f.audio.musicOn(),true);f.show();assert.equal(f.ctx,undefined);
});

test('fallback synth timer is cleared on background and not restarted by foregrounding alone',async t=>{
 const f=await setup(t);f.tracks[0].play=async()=>{throw new Error('media unavailable')};await f.audio.setMusic(true);assert.equal(f.timers.size,1);
 f.hide();assert.equal(f.timers.size,0);assert.equal(f.ctx.gains[0].gain.value,0);f.show();assert.equal(f.timers.size,0);await f.audio.unlockAudio();assert.equal(f.timers.size,1);await f.audio.setMusic(false);assert.equal(f.timers.size,0);
});

for(const level of [6,10,16,22,28,34,40,46,52,58,64,70,76,82,88,94,100,106,112,118,124,130,136,142,148,154,160,166,172])test(`chapter ending ${level} switches to a distinct coda and next stage switches back`,async t=>{
 const f=await setup(t);f.audio.setMusicMode('victory',level);assert.equal(f.audio.audioStatus().source,'chapter-synth');assert.match(f.audio.musicTheme().name,/章末/);assert.equal(f.audio.musicTheme().calm,true);
 await f.audio.setMusic(true);assert.equal(f.timers.size,1);f.hide();assert.equal(f.timers.size,0);f.show();await f.audio.unlockAudio();assert.equal(f.timers.size,1);
 f.audio.setMusicMode('battle',Math.min(172,level+1));await Promise.resolve();assert.equal(f.audio.audioStatus().source,'stage-synth');assert.match(f.audio.musicTheme().name,/行軍/);await f.audio.setMusic(false);
});
test('all 172 stages and 29 chapter codas have distinct musical scores',async t=>{
 const {audio}=await setup(t);assert.equal(audio.THEMES.length,172);assert.equal(audio.CHAPTER_THEMES.length,29);
 assert.equal(new Set(audio.THEMES.map(t=>JSON.stringify(t.notes))).size,172);
 assert.equal(new Set(audio.CHAPTER_THEMES.map(t=>JSON.stringify(t.notes))).size,29);
 audio.setMusicMode('victory',17);assert.equal(audio.audioStatus().source,'victory-recording');
});


test('the stage score adds percussion under pressure and the coda keeps a distinct quiet arrangement',async t=>{
 const {audio}=await setup(t);
 const {playScorePulse}=await import('../../hero/battle-score.mjs');
 const sounds=(theme,step,pressure)=>{
  const events=[];
  const voices=Object.fromEntries(['tone','noise','pluck'].map(name=>[name,(...args)=>events.push([name,...args])]));
  playScorePulse(theme,step,pressure,voices);
  return events;
 };
 const theme=audio.THEMES[16],calm=audio.CHAPTER_THEMES[3];
 const ordinary=sounds(theme,3,0),urgent=sounds(theme,3,2);
 assert.ok(urgent.length>ordinary.length);
 assert.ok(urgent.some(([name,,volume,frequency])=>name==='noise'&&frequency===2900&&volume>0));
 assert.ok(sounds(theme,0,0).some(([name])=>name==='noise'));
 assert.ok(sounds(calm,0,2).every(([name])=>name!=='noise'));
});

test('warning keeps its level while skill and ordinary combat duck and recover',async t=>{
 const f=await setup(t);
 f.audio.setMusicMode('battle',40);
 await f.audio.setMusic(true);
 const before=f.ctx.gains.length,effectsBefore=f.ctx.effects.length;
 await f.audio.hitSound('arrow');
 await f.audio.hitSound('enemy-arrow');
 assert.equal(f.ctx.effects.length,effectsBefore+1);
 const [effects,combat,skill]=f.ctx.gains.slice(before);
 await f.audio.hitSound('master-caocao');
 assert.equal(f.ctx.gains[0].gain.value,.40*.50);
 assert.equal(combat.gain.value,.48);
 f.ctx.currentTime=.05;
 await f.audio.hitSound('warning-wave');
 assert.equal(effects.gain.value,1);
 assert.equal(effects.gain.targets.length,0);
 assert.equal(f.ctx.gains[0].gain.value,.40*.22);
 assert.equal(combat.gain.value,.20);
 assert.equal(skill.gain.value,.70);
 assert.equal(f.ctx.gains[0].gain.targets.at(-1)[0],.40);
 assert.equal(combat.gain.targets.at(-1)[0],1);
 await f.audio.setMusic(false);
 await f.audio.hitSound('warning-fire');
 assert.equal(f.ctx.gains[0].gain.value,0);
});

test('pausing a battle drops ongoing effects and stays quiet through foreground gestures',async t=>{
 const f=await setup(t);
 f.audio.setMusicMode('battle',40);
 await f.audio.setMusic(true);
 const before=f.ctx.gains.length;
 await f.audio.hitSound('warning-wave');
 const effects=f.ctx.gains[before];
 assert.equal(effects.connected,true);
 f.audio.setBattleAudioPaused(true);
 assert.equal(effects.connected,false);
 assert.equal(f.timers.size,0);
 assert.equal(await f.audio.hitSound('master-caocao'),false);
 f.hide();
 f.show();
 await f.audio.unlockAudio();
 assert.equal(f.timers.size,0);
 assert.equal(await f.audio.hitSound('arrow'),false);
 f.audio.setBattleAudioPaused(false);
 await Promise.resolve();
 assert.equal(f.timers.size,1);
 assert.equal(await f.audio.hitSound('arrow'),true);
 assert.equal(effects.connected,false);
});

test('replayed scenes start over while foregrounding preserves the current recording position',async t=>{
 const f=await setup(t);
 const victory=f.tracks[3],camp=f.tracks[4];
 f.audio.setMusicMode('victory',3);
 await f.audio.setMusic(true);
 victory.currentTime=7;
 f.hide();
 f.show();
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(victory.starts,[0,7]);
 await f.audio.setMusicMode('camp',3);
 assert.equal(victory.paused,true);
 assert.equal(camp.paused,false);
 await f.audio.setMusicMode('victory',3);
 assert.equal(camp.paused,true);
 assert.deepEqual(victory.starts,[0,7,0]);
});

test('rapid scene changes discard the obsolete recording and stop the spent combat sounds',async t=>{
 const f=await setup(t);
 f.audio.setMusicMode('duel',3);
 await f.audio.setMusic(true);
 const before=f.ctx.gains.length;
 await f.audio.hitSound('warning-wave');
 const effects=f.ctx.gains[before];
 const stale=f.audio.setMusicMode('victory',3);
 const latest=f.audio.setMusicMode('camp',3);
 assert.equal(effects.connected,false);
 await Promise.all([stale,latest]);
 assert.deepEqual(f.tracks.map(track=>track.plays),[0,0,1,0,1]);
 assert.equal(f.tracks[2].paused,true);
 assert.equal(f.tracks[4].paused,false);
 assert.equal(f.ctx.gains[0].gain.value,.27);
});

test('foreground audio unlock follows the bonus selected while the browser is resuming',async t=>{
 const f=await setup(t);
 f.audio.setMusicMode('victory',142);
 await f.audio.setMusic(true);
 f.hide();
 let ready;
 f.ctx.pending=new Promise(resolve=>{ready=resolve});
 f.show();
 const unlock=f.audio.unlockAudio();
 f.audio.setMusicHome();
 await f.audio.setMusicMode('story',143);
 ready();
 await unlock;
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.audio.audioStatus().backgroundPaused,false);
 assert.equal(f.audio.audioStatus().theme,'桃園說書');
 assert.equal(f.timers.size,1); // The test has no recorded story track, so it uses the score.
 assert.equal(f.tracks[0].plays,0);
});
