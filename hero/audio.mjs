import {playScorePulse} from './battle-score.mjs?v=hero-score-1';
import {skillPresentation} from './skill-presentation.mjs?v=passive-feedback-1';
import {MASTER_STYLES} from './master-style.mjs?v=passive-feedback-1';
import {STAGES,chapterInfo} from './story.mjs?v=yuesui-wukou-taoxi-1';
// Recorded interludes, stage scores and chapter codas share one switchable music bus.
let context,musicBus,sfxBus,scoreBus,timer=null,step=0,enabled=false,sfx=true,revision=0,scene=0,recordedMode='home',chapterEnding=false,pageInactive=false,backgroundPaused=false;
const recordedTracks=new Map(),recordedSources=[];
const sceneLevels={home:.34,story:.25,prepare:.23,duel:.25,camp:.27,victory:.23};
let cachedRecording,decodedPlayback,rewindTrack=false,musicPlaying=false,fading=false;
let backgroundEpoch=0,gentleMusicEntry=false;

let battlePaused=false,effectsOutput,combatBus,skillBus,previewOutput,effectsEpoch=0;
let warningUntil=0,skillUntil=0;
const audioBlocked=()=>battlePaused||backgroundPaused||isBackground();
const musicLevel=()=>sceneLevels[recordedMode]??(recordedMode?.36:.40);
function mixLevel(param,base,warning,skill,now,recovery=.13){
 param.cancelScheduledValues(now);
 if(warningUntil>now){param.setTargetAtTime(base*warning,now,.012);now=warningUntil}
 if(skillUntil>now){param.setTargetAtTime(base*skill,now,.023);now=skillUntil}
 param.setTargetAtTime(base,now,recovery);
}
function updateMix(starting=false){
 const now=context.currentTime;
 const musicRecovery=starting&&gentleMusicEntry ? .25 : .13;
 if(enabled&&musicPlaying&&!fading&&!audioBlocked())mixLevel(musicBus.gain,musicLevel(),.22,.50,now,musicRecovery);
 if(effectsOutput){
  mixLevel(combatBus.gain,1,.20,.48,now);
  mixLevel(skillBus.gain,1,.70,1,now);
 }
}
function stopEffects(){
 effectsEpoch++;
 effectsOutput?.disconnect();
 effectsOutput=null;
 warningUntil=skillUntil=0;
 lastSound.clear();
}
export function setBattleAudioPaused(paused){
 if(battlePaused===paused)return;
 battlePaused=paused;
 if(paused){
  ++revision;
  stopEffects();
  silencePlayback();
 }else if(enabled&&!audioBlocked())void setMusic(true);
}

let battlePressure=0;
export function setBattleMusicPressure(value){battlePressure=Math.max(0,Math.min(2,value))}
export const RECORDED_THEMES={
 home:{name:'桃園歡宴',instrument:'笛、琵琶與揚琴'},
 story:{name:'桃園說書',instrument:'輕笛與撥弦'},
 prepare:{name:'整軍出發',instrument:'笛聲、撥弦與輕鼓'},
 battle:{name:'晴野行軍',instrument:'明亮笛聲、琵琶與輕鼓'},
 duel:{name:'陣前爭鋒',instrument:'急鼓、笛聲與快撥弦'},
 camp:{name:'軍帳小聚',instrument:'木魚與撥弦'},
 victory:{name:'凱歌同樂',instrument:'笛聲、撥弦與節慶鼓'}
};
export const MENU_THEME=RECORDED_THEMES.home;
const MOTIFS=[
 {name:'桃園出陣',instrument:'撥弦、戰鼓與號角',root:62,beat:250,drum:8,notes:[0,4,7,9,12,9,7,null,4,7,4,2,0,null,2,4]},
 {name:'山道交鋒',instrument:'撥弦、戰鼓與號角',root:69,beat:240,drum:4,notes:[7,9,12,null,9,7,4,2,4,null,7,4,2,0,null,0]},
 {name:'大興戰鼓',instrument:'撥弦、戰鼓與號角',root:50,beat:220,drum:2,notes:[0,null,0,7,null,7,4,null,0,0,null,12,9,null,7,0]},
 {name:'青龍破陣',instrument:'撥弦、戰鼓與號角',root:55,beat:245,drum:8,notes:[7,12,14,12,9,7,4,null,7,9,12,16,14,12,7,null]},
 {name:'險道破盾',instrument:'撥弦、戰鼓與號角',root:48,beat:260,drum:3,notes:[0,null,7,0,null,2,4,null,0,12,null,9,7,4,null,2]},
 {name:'青州合圍',instrument:'撥弦、戰鼓與號角',root:57,beat:225,drum:2,notes:[0,7,12,12,null,9,7,4,0,0,7,12,14,16,14,12]},
 {name:'廣宗進軍',instrument:'撥弦、戰鼓與號角',root:60,beat:250,drum:6,notes:[0,2,4,7,null,9,7,4,2,null,0,7,4,2,null,0]},
 {name:'長社風雨',instrument:'撥弦、戰鼓與號角',root:52,beat:215,drum:2,notes:[0,0,null,7,4,null,9,7,0,null,12,7,4,2,0,null]},
 {name:'驛道突圍',instrument:'撥弦、戰鼓與號角',root:50,beat:235,drum:8,notes:[12,null,9,7,4,null,2,0,2,null,4,7,4,2,0,null]},
 {name:'天公雷陣',instrument:'撥弦、戰鼓與號角',root:55,beat:210,drum:2,notes:[0,7,0,12,7,null,9,7,0,4,7,14,12,9,7,0]}
];
// Reuse a small instrumental vocabulary, but give all stages their own
// melodic phrase, register and pulse. Chapter codas are slower and drum-free.
export const THEMES=STAGES.map((stage,i)=>{
 const info=chapterInfo(i+1),base=MOTIFS[i%MOTIFS.length],shift=(info.chapter-1)%5,rotation=(info.number-1)*2;
 return {...base,name:`${stage.name}・行軍`,root:base.root+shift,beat:Math.round(base.beat*.95)+info.chapter*2,retreat:['withdraw','decoy'].includes(stage.mission),
  notes:base.notes.map((_,n)=>{const note=base.notes[(n+rotation)%16];return n===14?(note??0)+info.chapter:note})};
});
export const CHAPTER_THEMES=Array.from({length:chapterInfo(STAGES.length).chapter},(_,i)=>{
 const base=MOTIFS[i%MOTIFS.length];return {...base,name:`${chapterInfo(STAGES.findIndex(s=>(s.chapter||1)===i+1)+1).title}・章末`,root:60+i%5,beat:370+i*7,calm:true,
 notes:[0,4,7,null,9,7,4,null,2,4,7,9+i,7,4,0,null]};
});
function synthTheme(){return chapterEnding?CHAPTER_THEMES[chapterInfo(scene+1).chapter-1]:THEMES[scene]}
export function musicTheme(){return RECORDED_THEMES[recordedMode]||synthTheme()}
export function audioStatus(){return {backgroundPaused,state:context?.state||'locked',music:enabled,sfx,theme:musicTheme().name,source:recordedMode?`${recordedMode}-recording`:chapterEnding?'chapter-synth':'stage-synth'}}
export function setMusicMode(mode,level=scene+1){
 const next=Math.max(0,Math.min(THEMES.length-1,Math.trunc(Number(level)||1)-1)),info=chapterInfo(next+1);
 const ending=mode==='victory'&&info.number===info.count;
 const nextMode=mode!=='battle'&&!ending&&RECORDED_THEMES[mode]?mode:null;
 const changed=nextMode!==recordedMode||next!==scene||ending!==chapterEnding;
 if(!changed)return;
 gentleMusicEntry=ending||chapterEnding||((fading||backgroundPaused)&&gentleMusicEntry);
 recordedMode=nextMode;
 chapterEnding=ending;
 scene=next;
 rewindTrack=true;
 step=0;
 battlePressure=0;
 stopEffects();
 if(enabled)return setMusic(true,true);
}
export function setMusicScene(level){setMusicMode(null,level)}
export function setMusicHome(){setMusicMode('home',1)}
function init(){if(!context){context=new AudioContext();musicBus=context.createGain();sfxBus=context.createGain();musicBus.gain.value=0;musicBus.connect(context.destination);sfxBus.gain.value=sfx?.7:0;const limiter=context.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=12;limiter.ratio.value=6;limiter.attack.value=.003;limiter.release.value=.15;sfxBus.connect(limiter);limiter.connect(context.destination);for(const track of document.querySelectorAll('audio[data-music-mode]')){recordedTracks.set(track.dataset.musicMode,track);const source=context.createMediaElementSource(track);source.connect(musicBus);recordedSources.push(source)}}return context}
function tone(bus,freq,duration,volume,type='sine',slide=0,attack=.006,delay=0){const c=init(),o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(bus);o.start(t);o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect()}}
function noise(bus,duration,volume,freq=1800){const c=init(),buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.min(1,i/200)*Math.exp(-6*i/data.length);const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=.6;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(bus);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()}}
function pluck(bus,freq,volume=.32){const c=init(),buffer=c.createBuffer(1,Math.ceil(c.sampleRate*2.2),c.sampleRate),data=buffer.getChannelData(0),period=Math.max(2,Math.round(c.sampleRate/freq));for(let i=0;i<data.length;i++)data[i]=i<period?(Math.random()*2-1)*volume:.496*(data[i-period]+data[i-period+1]);const source=c.createBufferSource();source.buffer=buffer;source.connect(bus);source.start();source.onended=()=>source.disconnect()}
function beginScore(){
 scoreBus=context.createGain();
 scoreBus.connect(musicBus);
 const bus=scoreBus;
 const voices={
  tone:(...args)=>tone(bus,...args),
  pluck:(...args)=>pluck(bus,...args),
  noise:(...args)=>noise(bus,...args)
 };
 const theme=synthTheme();
 function tick(){
  if(!enabled||audioBlocked()||bus!==scoreBus)return;
  playScorePulse(theme,step++,battlePressure,voices);
 }
 tick();
 timer=setInterval(tick,theme.beat);
}
function isBackground(){return document.hidden||pageInactive}
function silencePlayback(){
 fading=false;
 musicPlaying=false;
 if(decodedPlayback){
  const {track,source,started,offset}=decodedPlayback;
  track.currentTime=(offset+context.currentTime-started)%source.buffer.duration;
  source.stop();
  source.disconnect();
  decodedPlayback=null;
 }
 for(const track of document.querySelectorAll('audio[data-music-mode]'))track.pause();
 if(timer){clearInterval(timer);timer=null}
 if(scoreBus){scoreBus.disconnect();scoreBus=null}
 if(musicBus){musicBus.disconnect();musicBus.gain.cancelScheduledValues(context.currentTime);musicBus.gain.setValueAtTime(0,context.currentTime)}
}
function pauseBackgroundAudio(){
 backgroundPaused=true;++backgroundEpoch;++revision;stopEffects();silencePlayback();
 previewOutput?.disconnect();
 previewOutput=null;
 if(sfxBus)sfxBus.gain.value=0;
 if(context)void context.suspend().catch(()=>{});
}
async function decodeRecording(track){
 if(!context.decodeAudioData)return null;
 if(cachedRecording?.track===track)return cachedRecording.pending;
 const url=track.currentSrc||track.querySelector('source')?.src;
 if(!url)return null;
 const request={track};
 cachedRecording=request;
 request.pending=(async()=>{
  try{
   const response=await fetch(url);
   if(response.ok)return await context.decodeAudioData(await response.arrayBuffer());
  }catch{/* The score remains available if the recording is unreachable. */}
  if(cachedRecording===request)cachedRecording=null;
  return null;
 })();
 return request.pending;
}

export async function setMusic(on,transition=false){
 enabled=!!on;
 const request=++revision;
 if(enabled&&transition&&musicPlaying&&!audioBlocked()&&context.state==='running'){
  fading=true;
  const now=context.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setTargetAtTime(0,now,.009);
  await new Promise(resolve=>setTimeout(resolve,55));
  if(request!==revision)return enabled;
 }
 silencePlayback();
 if(!enabled)return false;
 // Keep the preference, but never start media or fallback music in background.
 if(audioBlocked())return enabled;
 try{
  init();await context.resume();
  if(isBackground()||backgroundPaused){pauseBackgroundAudio();return enabled}
  if(!enabled||request!==revision||battlePaused)return enabled;
  musicBus.connect(context.destination);sfxBus.gain.value=sfx?.7:0;
  const track=recordedTracks.get(recordedMode);
  if(track){
   if(rewindTrack)track.currentTime=0;
   rewindTrack=false;
   let recorded=true;try{await track.play()}catch{recorded=false}
   if(isBackground()||backgroundPaused){pauseBackgroundAudio();return enabled}
   if(!enabled||request!==revision||battlePaused){if(!enabled||battlePaused||track!==recordedTracks.get(recordedMode))track.pause();return enabled}
   if(recorded){musicPlaying=true;updateMix(true)}
   else{
    track.pause();
    const buffer=await decodeRecording(track);
    if(request!==revision||!enabled||audioBlocked())return enabled;
    musicPlaying=true;
    updateMix(true);
    if(buffer){
     const source=context.createBufferSource();
     const offset=track.currentTime%buffer.duration;
     source.buffer=buffer;
     source.loop=true;
     source.connect(musicBus);
     source.start(0,offset);
     decodedPlayback={track,source,offset,started:context.currentTime};
    }else beginScore();
   }
  }else{musicPlaying=true;updateMix(true);beginScore()}
  return enabled;
 }catch{
  if(request===revision&&!audioBlocked()){enabled=false;silencePlayback()}
  return enabled;
 }
}
export function musicOn(){return enabled}
export function setSfx(on){
 sfx=on;
 if(!sfx){
  stopEffects();
  previewOutput?.disconnect();
  previewOutput=null;
  if(context)updateMix();
 }
 if(sfxBus)sfxBus.gain.value=on&&!isBackground()&&!backgroundPaused?.7:0;
}
export async function unlockAudio(){
 if(isBackground())return false;
 const epoch=backgroundEpoch;
 try{
  await init().resume();
  if(isBackground()){pauseBackgroundAudio();return false}
  // Scene selection can change while the browser resumes. Restore the latest
  // scene unless the page entered the background again during this request.
  if(epoch!==backgroundEpoch)return false;
  const restore=backgroundPaused;backgroundPaused=false;sfxBus.gain.value=sfx?.7:0;
  if(sfx)void preloadCombatSounds();
  if(restore&&enabled&&!battlePaused)await setMusic(true);
  return !isBackground()&&!backgroundPaused&&context.state==='running';
 }catch{return false}
}
const combatSounds={
 swing:{clip:'swing',gain:.53,rate:1.06},
 'enemy-swing':{clip:'swing',gain:.33,rate:.88},
 slash:{clip:'impact',gain:.73,rate:1},
 'enemy-slash':{clip:'impact',gain:.53,rate:.91},
 hero:{clip:'impact',gain:.77,rate:1},
 enemy:{clip:'impact',gain:.58,rate:.89},
 arrow:{clip:'bow',gain:.62,rate:1},
 'enemy-arrow':{clip:'bow',gain:.43,rate:.94},
 'arrow-impact':{clip:'impact',gain:.35,rate:1.04},
 block:{clip:'parry',gain:.69,rate:1},
 finish:{clip:'impact',gain:.85,rate:.74},
 cleave:{clip:'impact',gain:.81,rate:.83}
};
const combatBuffers=new Map();
let combatLoad;
export function preloadCombatSounds(){
 const audio=init();
 if(!audio.decodeAudioData)return Promise.resolve();
 combatLoad??=Promise.all(['swing','impact','bow','parry'].map(async clip=>{
  try{
   const response=await fetch(new URL(`./assets/audio/combat/${clip}.wav`,import.meta.url));
   if(response.ok)combatBuffers.set(clip,await audio.decodeAudioData(await response.arrayBuffer()));
  }catch{/* The game can still play a quiet cue without the recording. */}
 }));
 return combatLoad;
}
const arrowKinds=new Set(['arrow','enemy-arrow']);
const skillKinds=new Set(['cleave','roar','heal','oath']);
const cooldowns={swing:.13,'enemy-swing':.17,slash:.115,'enemy-slash':.16,bow:.16,'arrow-impact':.12,block:.1,deploy:.1,fire:.25,rock:.18,hook:.18};
const lastSound=new Map();
export async function hitSound(kind='slash'){
 if(!sfx||audioBlocked())return false;
 const epoch=effectsEpoch;
 // Retry browser audio unlocking instead of silently discarding the first strike.
 if(init().state!=='running'&&!await unlockAudio())return false;
 if(!sfx||audioBlocked()||epoch!==effectsEpoch)return false;
 const key=arrowKinds.has(kind)?'bow':kind;
 const now=context.currentTime,cooldown=cooldowns[key];
 if(cooldown&&now-(lastSound.get(key)??-Infinity)<cooldown)return true;
 if(cooldown)lastSound.set(key,now);
 if(!effectsOutput){
  effectsOutput=context.createGain();
  effectsOutput.connect(sfxBus);
  combatBus=context.createGain();
  combatBus.connect(effectsOutput);
  skillBus=context.createGain();
  skillBus.connect(effectsOutput);
 }
 if(kind.startsWith('warning-')){
  warningUntil=Math.max(warningUntil,now+.53);
  updateMix();
  return soundRecipe(kind,effectsOutput);
 }
 if(kind.startsWith('skill-')||kind.startsWith('master-')||skillKinds.has(kind)){
  if(!chapterEnding&&(!recordedMode||recordedMode==='duel')){
   skillUntil=Math.max(skillUntil,now+.42);
   updateMix();
  }
  return soundRecipe(kind,skillBus);
 }
 return soundRecipe(kind,combatBus);
}
function soundRecipe(kind,bus){
 const combat=combatSounds[kind];
 if(combat){
  const buffer=combatBuffers.get(combat.clip);
  if(buffer){
   const source=context.createBufferSource(),gain=context.createGain();
   source.buffer=buffer;
   source.playbackRate.value=combat.rate;
   gain.gain.value=combat.gain;
   source.connect(gain);gain.connect(bus);
   source.start();
   source.onended=()=>{source.disconnect();gain.disconnect()};
  }else{
   noise(bus,.12,combat.gain*.75,combat.clip==='swing'?1600:combat.clip==='impact'?900:2700);
  }
  return true;
 }
 if(kind==='deploy'){
  tone(bus,126,.2,.29,'sine',65);noise(bus,.085,.21,920);
  tone(bus,370,.16,.12,'triangle',0,.014,.045);
  tone(bus,555,.18,.08,'sine',0,.017,.10);
  return true;
 }
 if(kind==='warning-wave'){
  tone(bus,108,.32,.39,'sine',48);
  tone(bus,415,.40,.22,'triangle',0,.016,.045);
  tone(bus,622,.52,.21,'triangle',0,.016,.17);
  noise(bus,.28,.16,1760);
  return true;
 }
 if(kind==='hook'){
  noise(bus,.21,.30,2900);
  for(const delay of [0,.08,.16])tone(bus,1450,.15,.13,'triangle',390,.013,delay);
  return true;
 }
 if(kind==='fire'||kind==='rock'){
  const fire=kind==='fire';
  noise(bus,fire?.55:.28,fire?.38:.54,fire?1150:710);
  tone(bus,fire?137:104,.36,.36,'sine',44,.018);
  if(!fire)tone(bus,950,.18,.13,'triangle',310,.012,.06);
  return true;
 }
 if(kind==='experience'){tone(bus,523,.28,.09,'sine',784);tone(bus,1046,.3,.05);return true}
 if(kind==='level-up'){for(const f of [523,659,784,1046])tone(bus,f,.85,.12,'sine',f*1.01,.03);tone(bus,196,.4,.14,'triangle',392);return true}
 const early=/^skill-([a-z]+)-([01])$/.exec(kind),small=early&&skillPresentation(early[1],Number(early[2]));
 if(small){for(const f of small.notes)tone(bus,f,small.soundDuration,small.volume,small.wave,f*small.slide);noise(bus,small.soundDuration,small.weight,small.noise);return true}
 const master=kind.startsWith('master-')&&MASTER_STYLES[kind.slice(7)];
 if(master){for(const f of master.notes)tone(bus,f,.65,.18,master.wave,f*master.slide);noise(bus,.4,master.weight,master.noise);return true}
 if(kind.startsWith('warning-')){
  // A short gong + low drum separates the warning from the later impact.
  const spell=/wind|rain|thunder/.test(kind),base=spell?330:220;
  tone(bus,95,.42,.65,'sine',38);noise(bus,.16,.32,700);
  for(const [ratio,volume] of [[1,.28],[1.47,.17],[2.13,.1]])tone(bus,base*ratio,.62,volume,'sine',0,.008);
  if(spell){noise(bus,.45,.2,kind.endsWith('rain')?3200:1100);tone(bus,440,.45,.12,'triangle',880)}else tone(bus,180,.35,.14,'triangle',360);
  return true;
 }
 if(kind==='wind'){noise(bus,1.1,.5,800);tone(bus,260,.7,.16,'triangle',90);return true}
 if(kind==='rain'){noise(bus,.9,.35,3500);for(const f of [750,1100,1450])tone(bus,f,.25,.08);return true}
 if(kind==='thunder'){noise(bus,.8,.75,200);tone(bus,90,.9,.55,'sine',28);noise(bus,.12,.45,3000);return true}
 if(kind==='heal'){for(const f of [523,659,784])tone(bus,f,.9,.13);return true}
 if(kind==='oath'){for(const f of [196,294,392,587])tone(bus,f,1.3,.16);noise(bus,.7,.35,1200);tone(bus,110,.7,.6,'sine',35);return true}
 if(kind==='roar'||kind==='boss'){noise(bus,.65,.8,kind==='boss'?350:600);tone(bus,150,.65,.55,'sawtooth',45);tone(bus,80,.8,.6);return true}
 noise(bus,.22,.75,2400);tone(bus,900,.2,.34,'triangle',180);tone(bus,150,.18,.3,'sine',60);return true;
}
// iOS backgrounding/navigation can emit pagehide separately from visibilitychange.
// A live fight still requires Continue. Post-battle screens can restore their own track.
function resumePostBattleAudio(){
 if(enabled&&backgroundPaused&&!isBackground()&&!battlePaused&&
    (recordedMode==='camp'||recordedMode==='victory'||chapterEnding))void unlockAudio();
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBackgroundAudio();else resumePostBattleAudio()});
window.addEventListener('pagehide',()=>{pageInactive=true;pauseBackgroundAudio()});
window.addEventListener('pageshow',()=>{pageInactive=false;resumePostBattleAudio()});
document.addEventListener('freeze',pauseBackgroundAudio);

export function createSoundPreview(){
 let bus,revision=0;
 function stop(){revision++;if(bus){bus.gain.value=0;bus.disconnect();bus=null}}
 return {stop,async play(kind){stop();const ticket=revision;if(!sfx||isBackground()||!await unlockAudio()||ticket!==revision||!sfx||isBackground())return false;if(!previewOutput){previewOutput=context.createGain();previewOutput.connect(sfxBus)}bus=context.createGain();bus.connect(previewOutput);return soundRecipe(kind,bus)}};
}
