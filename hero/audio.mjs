import {STAGES,chapterInfo} from './story.mjs?v=peach-growth-1';
// Recorded interludes, stage scores and chapter codas share one switchable music bus.
let context,musicBus,sfxBus,timer=null,step=0,enabled=false,sfx=true,revision=0,scene=0,recordedMode='home',chapterEnding=false,pageInactive=false,backgroundPaused=false;
const recordedTracks=new Map(),recordedSources=[];
export const RECORDED_THEMES={
 home:{name:'桃園歡宴',instrument:'笛、琵琶與揚琴'},
 story:{name:'桃園說書',instrument:'輕笛與撥弦'},
 prepare:{name:'整軍出發',instrument:'琵琶與輕鼓'},
 battle:{name:'晴野行軍',instrument:'明亮笛聲、琵琶與輕鼓'},
 duel:{name:'陣前爭鋒',instrument:'急鼓、號角與快撥弦'},
 camp:{name:'軍帳小聚',instrument:'木魚與撥弦'},
 victory:{name:'凱歌同樂',instrument:'揚琴與節慶鼓'}
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
// Reuse a small instrumental vocabulary, but give all 64 stages their own
// melodic phrase, register and pulse. Chapter codas are slower and drum-free.
export const THEMES=STAGES.map((stage,i)=>{
 const info=chapterInfo(i+1),base=MOTIFS[i%MOTIFS.length],shift=(info.chapter-1)%5,rotation=(info.number-1)*2;
 return {...base,name:`${stage.name}・行軍`,root:base.root+shift,beat:base.beat+info.chapter*3,
  notes:base.notes.map((_,n)=>{const note=base.notes[(n+rotation)%16];return n===14?(note??0)+info.chapter:note})};
});
export const CHAPTER_THEMES=Array.from({length:11},(_,i)=>{
 const base=MOTIFS[i%MOTIFS.length];return {...base,name:`${chapterInfo(STAGES.findIndex(s=>(s.chapter||1)===i+1)+1).title}・章末`,root:60+i%5,beat:370+i*7,calm:true,
 notes:[0,4,7,null,9,7,4,null,2,4,7,9+i,7,4,0,null]};
});
function synthTheme(){return chapterEnding?CHAPTER_THEMES[chapterInfo(scene+1).chapter-1]:THEMES[scene]}
const hz=n=>440*2**((n-69)/12);
export function musicTheme(){return RECORDED_THEMES[recordedMode]||synthTheme()}
export function audioStatus(){return {backgroundPaused,state:context?.state||'locked',music:enabled,sfx,theme:musicTheme().name,source:recordedMode?`${recordedMode}-recording`:chapterEnding?'chapter-synth':'stage-synth'}}
export function setMusicMode(mode,level=scene+1){
 const next=Math.max(0,Math.min(THEMES.length-1,Math.trunc(Number(level)||1)-1)),info=chapterInfo(next+1);
 const ending=mode==='victory'&&info.number===info.count;
 const nextMode=mode!=='battle'&&!ending&&RECORDED_THEMES[mode]?mode:null;
 const changed=nextMode!==recordedMode||next!==scene||ending!==chapterEnding;
 recordedMode=nextMode;chapterEnding=ending;scene=next;if(!changed)return;step=0;if(enabled)void setMusic(true);
}
export function setMusicScene(level){setMusicMode(null,level)}
export function setMusicHome(){setMusicMode('home',1)}
function init(){if(!context){context=new AudioContext();musicBus=context.createGain();sfxBus=context.createGain();musicBus.gain.value=0;musicBus.connect(context.destination);sfxBus.gain.value=sfx?.7:0;const limiter=context.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=12;limiter.ratio.value=6;limiter.attack.value=.003;limiter.release.value=.15;sfxBus.connect(limiter);limiter.connect(context.destination);for(const track of document.querySelectorAll('audio[data-music-mode]')){recordedTracks.set(track.dataset.musicMode,track);const source=context.createMediaElementSource(track);source.connect(musicBus);recordedSources.push(source)}}return context}
function tone(bus,freq,duration,volume,type='sine',slide=0,attack=.006){const c=init(),o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(bus);o.start();o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect()}}
function noise(bus,duration,volume,freq=1800){const c=init(),buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.min(1,i/200)*Math.exp(-6*i/data.length);const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=.6;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(bus);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()}}
function pluck(freq,volume=.32){const c=init(),buffer=c.createBuffer(1,Math.ceil(c.sampleRate*2.2),c.sampleRate),data=buffer.getChannelData(0),period=Math.max(2,Math.round(c.sampleRate/freq));for(let i=0;i<data.length;i++)data[i]=i<period?(Math.random()*2-1)*volume:.496*(data[i-period]+data[i-period+1]);const source=c.createBufferSource();source.buffer=buffer;source.connect(musicBus);source.start();source.onended=()=>source.disconnect()}
function tick(){
 if(!enabled||isBackground()||backgroundPaused)return;
 const theme=synthTheme(),pulse=step%16,phrase=Math.floor(step/16)%4,note=theme.notes[pulse],root=hz(theme.root-12);
 if(theme.calm){
  if(note!==null)pluck(hz(theme.root+note),.16);
  if(pulse%4===0){tone(musicBus,root,.95,.045,'sine');tone(musicBus,root*1.5,.8,.025,'triangle')}
  step++;return;
 }
 // Eighth-note pulse: low marching ostinato, alternating drum hands and a bar-end fill.
 if(note!==null)pluck(hz(theme.root+note+(phrase===3?-12:0)),phrase%2?.28:.18);
 tone(musicBus,root*([0,4,8,12].includes(pulse)?1:1.5),.19,.085,'triangle');
 if(pulse%2===0){tone(musicBus,pulse%8===0?105:145,.36,pulse%8===0?.48:.27,'sine',42);noise(musicBus,.09,.14,680)}
 if(pulse%4===2){noise(musicBus,.12,.15,1500);tone(musicBus,220,.1,.1,'triangle',100)}
 if(pulse>=13&&phrase%2===1){tone(musicBus,165+25*(pulse%2),.12,.16,'sine',65);noise(musicBus,.06,.08,900)}
 // Short horn answers leave space for weapon sounds; each stage has its own melody.
 if(note!==null&&pulse%4===0&&phrase%2===0){tone(musicBus,hz(theme.root+note),.42,.09,'triangle',0,.035);tone(musicBus,hz(theme.root+note-12),.4,.045,'sawtooth',0,.04)}
 if(pulse===0){noise(musicBus,.65,.1,3800);tone(musicBus,root,.75,.07)}
 step++;
}
function isBackground(){return document.hidden||pageInactive}
function silencePlayback(){
 for(const track of document.querySelectorAll('audio[data-music-mode]'))track.pause();
 if(timer){clearInterval(timer);timer=null}
 if(musicBus){musicBus.disconnect();musicBus.gain.cancelScheduledValues(context.currentTime);musicBus.gain.setValueAtTime(0,context.currentTime)}
}
function pauseBackgroundAudio(){
 backgroundPaused=true;++revision;silencePlayback();if(sfxBus)sfxBus.gain.value=0;
 if(context)void context.suspend().catch(()=>{});
}
export async function setMusic(on){
 enabled=!!on;const request=++revision;silencePlayback();
 if(!enabled)return false;
 // Keep the preference, but never start media or fallback music in background.
 if(isBackground()||backgroundPaused)return enabled;
 try{
  init();await context.resume();
  if(isBackground()||backgroundPaused){pauseBackgroundAudio();return enabled}
  if(!enabled||request!==revision)return enabled;
  musicBus.connect(context.destination);sfxBus.gain.value=sfx?.7:0;
  musicBus.gain.setValueAtTime(recordedMode==='home'?.42:recordedMode?.36:.32,context.currentTime);
  const track=recordedTracks.get(recordedMode);
  if(track){
   let recorded=true;try{await track.play()}catch{recorded=false}
   if(isBackground()||backgroundPaused){pauseBackgroundAudio();return enabled}
   if(!enabled||request!==revision){if(!enabled||track!==recordedTracks.get(recordedMode))track.pause();return enabled}
   if(!recorded){tick();timer=setInterval(tick,synthTheme().beat)}
  }else{tick();timer=setInterval(tick,synthTheme().beat)}
  return enabled;
 }catch{if(request===revision&&!isBackground()&&!backgroundPaused)enabled=false;return enabled}
}
export function musicOn(){return enabled}
export function setSfx(on){sfx=on;if(sfxBus)sfxBus.gain.value=on&&!isBackground()&&!backgroundPaused?.7:0}
export async function unlockAudio(){
 if(isBackground())return false;
 const request=revision;
 try{
  await init().resume();
  if(isBackground()||request!==revision){if(isBackground())pauseBackgroundAudio();return false}
  const restore=backgroundPaused;backgroundPaused=false;sfxBus.gain.value=sfx?.7:0;
  if(restore&&enabled)await setMusic(true);
  return !isBackground()&&!backgroundPaused&&context.state==='running';
 }catch{return false}
}
export async function hitSound(kind='slash'){
 if(!sfx||isBackground()||backgroundPaused)return false;
 // Retry browser audio unlocking instead of silently discarding the first strike.
 if(init().state!=='running'&&!await unlockAudio())return false;
 if(!sfx||isBackground()||backgroundPaused)return false;
 if(kind.startsWith('warning-')){
  // A short gong + low drum separates the warning from the later impact.
  const spell=/wind|rain|thunder/.test(kind),base=spell?330:220;
  tone(sfxBus,95,.42,.65,'sine',38);noise(sfxBus,.16,.32,700);
  for(const [ratio,volume] of [[1,.28],[1.47,.17],[2.13,.1]])tone(sfxBus,base*ratio,.62,volume,'sine',0,.008);
  if(spell){noise(sfxBus,.45,.2,kind.endsWith('rain')?3200:1100);tone(sfxBus,440,.45,.12,'triangle',880)}else tone(sfxBus,180,.35,.14,'triangle',360);
  return true;
 }
 if(kind==='wind'){noise(sfxBus,1.1,.5,800);tone(sfxBus,260,.7,.16,'triangle',90);return true}
 if(kind==='rain'){noise(sfxBus,.9,.35,3500);for(const f of [750,1100,1450])tone(sfxBus,f,.25,.08);return true}
 if(kind==='thunder'){noise(sfxBus,.8,.75,200);tone(sfxBus,90,.9,.55,'sine',28);noise(sfxBus,.12,.45,3000);return true}
 if(kind==='heal'){for(const f of [523,659,784])tone(sfxBus,f,.9,.13);return true}
 if(kind==='oath'){for(const f of [196,294,392,587])tone(sfxBus,f,1.3,.16);noise(sfxBus,.7,.35,1200);tone(sfxBus,110,.7,.6,'sine',35);return true}
 if(kind==='roar'||kind==='boss'){noise(sfxBus,.65,.8,kind==='boss'?350:600);tone(sfxBus,150,.65,.55,'sawtooth',45);tone(sfxBus,80,.8,.6);return true}
 if(kind==='arrow'){noise(sfxBus,.18,.6,3300);tone(sfxBus,950,.16,.3,'triangle',250);return true}
 if(kind==='block'){noise(sfxBus,.12,.5,4000);for(const f of [1600,2310,3490])tone(sfxBus,f,.45,.2,'sine');return true}
 if(kind==='finish'||kind==='cleave'){noise(sfxBus,.45,.9,1500);tone(sfxBus,1500,.35,.4,'triangle',120);tone(sfxBus,110,.7,.7,'sine',35);return true}
 noise(sfxBus,.22,.75,kind==='enemy-slash'||kind==='enemy'?1200:2400);tone(sfxBus,900,.2,.34,'triangle',180);tone(sfxBus,150,.18,.3,'sine',60);return true;
}
// iOS backgrounding/navigation can emit pagehide separately from visibilitychange.
// Foregrounding alone stays silent; the existing pointer/key unlock path resumes.
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBackgroundAudio()});
window.addEventListener('pagehide',()=>{pageInactive=true;pauseBackgroundAudio()});
window.addEventListener('pageshow',()=>{pageInactive=false});
document.addEventListener('freeze',pauseBackgroundAudio);
