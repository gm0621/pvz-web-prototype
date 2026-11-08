// Recorded scene themes use one music bus; the per-stage synth remains the fallback when media playback is unavailable.
let context,musicBus,sfxBus,timer=null,step=0,enabled=false,sfx=true,revision=0,scene=0,recordedMode='home',lastVoice=null;
const recordedTracks=new Map(),recordedSources=[],voiceBuffers=new Map();
export const RECORDED_THEMES={
 home:{name:'桃園歡宴',instrument:'笛、琵琶與揚琴'},
 story:{name:'桃園說書',instrument:'輕笛與撥弦'},
 prepare:{name:'整軍出發',instrument:'琵琶與輕鼓'},
 battle:{name:'義軍疾行',instrument:'快笛與戰鼓'},
 duel:{name:'陣前爭鋒',instrument:'急鼓、號角與快撥弦'},
 camp:{name:'軍帳小聚',instrument:'木魚與撥弦'},
 victory:{name:'凱歌同樂',instrument:'揚琴與節慶鼓'}
};
export const MENU_THEME=RECORDED_THEMES.home;
const VOICE_URLS={};
for(const hero of ['liubei','guanyu','zhangfei'])for(const kind of ['shout','victory'])VOICE_URLS[`${hero}-${kind}`]=`./assets/audio/voices/${hero}-${kind}.m4a?v=scene-audio-2`;
export const THEMES=[
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
const hz=n=>440*2**((n-69)/12);
export function musicTheme(){return RECORDED_THEMES[recordedMode]||THEMES[scene]}
export function audioStatus(){return {state:context?.state||'locked',music:enabled,sfx,theme:musicTheme().name,source:recordedMode?`${recordedMode}-recording`:'stage-synth',voice:lastVoice}}
export function setMusicMode(mode,level=scene+1){const next=Math.max(0,Math.min(THEMES.length-1,Math.trunc(Number(level)||1)-1)),nextMode=RECORDED_THEMES[mode]?mode:null,changed=nextMode!==recordedMode||next!==scene;recordedMode=nextMode;scene=next;if(!changed)return;step=0;if(enabled)void setMusic(true)}
export function setMusicScene(level){setMusicMode(null,level)}
export function setMusicHome(){setMusicMode('home',1)}
function init(){if(!context){context=new AudioContext();musicBus=context.createGain();sfxBus=context.createGain();musicBus.gain.value=0;musicBus.connect(context.destination);sfxBus.gain.value=sfx?.7:0;const limiter=context.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=12;limiter.ratio.value=6;limiter.attack.value=.003;limiter.release.value=.15;sfxBus.connect(limiter);limiter.connect(context.destination);for(const track of document.querySelectorAll('audio[data-music-mode]')){recordedTracks.set(track.dataset.musicMode,track);const source=context.createMediaElementSource(track);source.connect(musicBus);recordedSources.push(source)}}return context}
function tone(bus,freq,duration,volume,type='sine',slide=0,attack=.006){const c=init(),o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(bus);o.start();o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect()}}
function noise(bus,duration,volume,freq=1800){const c=init(),buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.min(1,i/200)*Math.exp(-6*i/data.length);const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=.6;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(bus);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()}}
function pluck(freq,volume=.32){const c=init(),buffer=c.createBuffer(1,Math.ceil(c.sampleRate*2.2),c.sampleRate),data=buffer.getChannelData(0),period=Math.max(2,Math.round(c.sampleRate/freq));for(let i=0;i<data.length;i++)data[i]=i<period?(Math.random()*2-1)*volume:.496*(data[i-period]+data[i-period+1]);const source=c.createBufferSource();source.buffer=buffer;source.connect(musicBus);source.start();source.onended=()=>source.disconnect()}
function tick(){
 if(!enabled||document.hidden)return;
 const theme=THEMES[recordedMode==='home'?0:scene],pulse=step%16,phrase=Math.floor(step/16)%4,note=theme.notes[pulse],root=hz(theme.root-12);
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
export async function setMusic(on){init();const request=++revision;enabled=on;for(const track of recordedTracks.values())track.pause();musicBus.disconnect();if(timer){clearInterval(timer);timer=null}musicBus.gain.cancelScheduledValues(context.currentTime);musicBus.gain.setValueAtTime(0,context.currentTime);if(!on)return false;try{await context.resume();if(!enabled||request!==revision)return false;musicBus.connect(context.destination);musicBus.gain.setValueAtTime(recordedMode==='home' ? .42 : recordedMode ? .36 : .32,context.currentTime);const track=recordedTracks.get(recordedMode);if(track){let recorded=true;try{await track.play()}catch{recorded=false}if(!enabled||request!==revision){if(!enabled)track.pause();return false}if(!recorded){tick();timer=setInterval(tick,THEMES[scene].beat)}}else{tick();timer=setInterval(tick,musicTheme().beat)}return enabled}catch{if(request===revision)enabled=false;return enabled}}
export function musicOn(){return enabled}
export function setSfx(on){sfx=on;if(sfxBus)sfxBus.gain.value=on?.7:0}
async function loadVoice(hero,kind){const key=`${hero}-${kind}`,url=VOICE_URLS[key];if(!url)throw new Error('unknown voice');if(!voiceBuffers.has(key))voiceBuffers.set(key,fetch(url).then(response=>{if(!response.ok)throw new Error('voice load failed');return response.arrayBuffer()}).then(data=>init().decodeAudioData(data)));return voiceBuffers.get(key)}
export function preloadHeroVoices(){for(const key of Object.keys(VOICE_URLS)){const [hero,kind]=key.split('-');void loadVoice(hero,kind).catch(()=>{})}}
export async function heroVoice(hero,kind='shout'){const key=`${hero}-${kind}`;if(!sfx||document.hidden||!VOICE_URLS[key])return false;if(init().state!=='running'&&!await unlockAudio())return false;try{const buffer=await loadVoice(hero,kind);if(!sfx||document.hidden)return false;const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=hero==='zhangfei' ? .95 : hero==='guanyu' ? .84 : .8;source.connect(gain);gain.connect(sfxBus);source.start();lastVoice=key;source.onended=()=>{source.disconnect();gain.disconnect()};return true}catch{return false}}
export async function unlockAudio(){try{await init().resume();preloadHeroVoices();return context.state==='running'}catch{return false}}
export async function hitSound(kind='slash'){
 if(!sfx||document.hidden)return false;
 // Retry browser audio unlocking instead of silently discarding the first strike.
 if(init().state!=='running'&&!await unlockAudio())return false;
 if(!sfx||document.hidden)return false;
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
document.addEventListener('visibilitychange',()=>{if(!context)return;if(document.hidden)context.suspend().catch(()=>{});else if(enabled||sfx)void unlockAudio()});
