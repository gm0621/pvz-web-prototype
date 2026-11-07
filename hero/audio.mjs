// Original arrangements: each chapter has its own lead instrument and percussion pattern.
let context,musicBus,sfxBus,timer=null,step=0,enabled=false,sfx=true,revision=0,scene=0;
export const THEMES=[
 {name:'桃園春風',instrument:'琴',root:62,beat:680,drum:8,notes:[0,4,7,9,12,9,7,null,4,7,4,2,0,null,2,4]},
 {name:'山徑笛行',instrument:'笛',root:69,beat:460,drum:4,notes:[7,9,12,null,9,7,4,2,4,null,7,4,2,0,null,0]},
 {name:'大興戰鼓',instrument:'戰鼓與號角',root:50,beat:370,drum:2,notes:[0,null,0,7,null,7,4,null,0,0,null,12,9,null,7,0]},
 {name:'青龍長吟',instrument:'弓弦',root:55,beat:720,drum:8,notes:[7,12,14,12,9,7,4,null,7,9,12,16,14,12,7,null]},
 {name:'險道破盾',instrument:'低琴與木鼓',root:48,beat:530,drum:3,notes:[0,null,7,0,null,2,4,null,0,12,null,9,7,4,null,2]},
 {name:'黃天決戰',instrument:'號角與大鼓',root:57,beat:410,drum:2,notes:[0,7,12,12,null,9,7,4,0,0,7,12,14,16,14,12]},
 {name:'廣宗師門',instrument:'笛與低鼓',root:60,beat:640,drum:6,notes:[0,2,4,7,null,9,7,4,2,null,0,7,4,2,null,0]},
 {name:'長社餘燼',instrument:'急鼓與號角',root:52,beat:330,drum:2,notes:[0,0,null,7,4,null,9,7,0,null,12,7,4,2,0,null]},
 {name:'囚車遠影',instrument:'低弓弦',root:50,beat:820,drum:8,notes:[12,null,9,7,4,null,2,0,2,null,4,7,4,2,0,null]},
 {name:'天公戰陣',instrument:'重鼓與號角',root:55,beat:390,drum:2,notes:[0,7,0,12,7,null,9,7,0,4,7,14,12,9,7,0]}
];
const hz=n=>440*2**((n-69)/12);
export function musicTheme(){return THEMES[scene]}
export function audioStatus(){return {state:context?.state||'locked',music:enabled,sfx,theme:musicTheme().name}}
export function setMusicScene(level){const next=Math.max(0,Math.min(THEMES.length-1,Math.trunc(Number(level)||1)-1));if(next===scene)return;scene=next;step=0;if(enabled)void setMusic(true)}
function init(){if(!context){context=new AudioContext();musicBus=context.createGain();sfxBus=context.createGain();musicBus.gain.value=0;musicBus.connect(context.destination);sfxBus.gain.value=sfx?.7:0;const limiter=context.createDynamicsCompressor();limiter.threshold.value=-10;limiter.knee.value=12;limiter.ratio.value=6;limiter.attack.value=.003;limiter.release.value=.15;sfxBus.connect(limiter);limiter.connect(context.destination)}return context}
function tone(bus,freq,duration,volume,type='sine',slide=0,attack=.006){const c=init(),o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(bus);o.start();o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect()}}
function noise(bus,duration,volume,freq=1800){const c=init(),buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.min(1,i/200)*Math.exp(-6*i/data.length);const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=freq;filter.Q.value=.6;gain.gain.value=volume;source.connect(filter);filter.connect(gain);gain.connect(bus);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()}}
function pluck(freq,volume=.32){const c=init(),buffer=c.createBuffer(1,Math.ceil(c.sampleRate*2.2),c.sampleRate),data=buffer.getChannelData(0),period=Math.max(2,Math.round(c.sampleRate/freq));for(let i=0;i<data.length;i++)data[i]=i<period?(Math.random()*2-1)*volume:.496*(data[i-period]+data[i-period+1]);const source=c.createBufferSource();source.buffer=buffer;source.connect(musicBus);source.start();source.onended=()=>source.disconnect()}
function tick(){
 if(!enabled||document.hidden)return;
 const theme=THEMES[scene],note=theme.notes[step%theme.notes.length],f=hz(theme.root+(note||0));
 if(note!==null){
  if(scene===0||scene===4)pluck(f,scene===4?.5:.35);
  if(scene===1||scene===6){tone(musicBus,f,.65,.17,'sine',0,.06);tone(musicBus,f*2,.5,.035,'sine',0,.06)}
  if(scene===2||scene===7){tone(musicBus,f,.28,.13,'triangle');tone(musicBus,f/2,.4,.09)}
  if(scene===3||scene===8){tone(musicBus,f,1.1,.12,'triangle',f*1.005,.16);tone(musicBus,f*2,.9,.025,'sine',0,.15)}
  if(scene===5||scene===9){tone(musicBus,f,.5,.14,'sawtooth',0,.04);tone(musicBus,f*1.5,.5,.06,'triangle',0,.04)}
 }
 if(step%theme.drum===0){tone(musicBus,[2,5,7,9].includes(scene)?95:125,.45,[2,5,7,9].includes(scene)?.4:.12,'sine',38);if([2,5,7,9].includes(scene))noise(musicBus,.12,.2,700)}
 if(scene===1&&step%4===2)tone(musicBus,850,.08,.15,'triangle');
 if(scene===4&&step%3===1)tone(musicBus,430,.12,.22,'triangle',250);
 if(step%8===0)tone(musicBus,hz(theme.root-12),2.5,.07);
 step++;
}
export async function setMusic(on){init();const request=++revision;enabled=on;musicBus.disconnect();if(timer){clearInterval(timer);timer=null}musicBus.gain.cancelScheduledValues(context.currentTime);musicBus.gain.setValueAtTime(0,context.currentTime);if(!on)return false;try{await context.resume();if(enabled&&request===revision){musicBus.connect(context.destination);musicBus.gain.setValueAtTime(.32,context.currentTime);tick();timer=setInterval(tick,musicTheme().beat)}return enabled}catch{if(request===revision)enabled=false;return enabled}}
export function musicOn(){return enabled}
export function setSfx(on){sfx=on;if(sfxBus)sfxBus.gain.value=on?.7:0}
export async function unlockAudio(){try{await init().resume();return context.state==='running'}catch{return false}}
export async function hitSound(kind='slash'){
 if(!sfx||document.hidden)return false;
 // Retry browser audio unlocking instead of silently discarding the first strike.
 if(init().state!=='running'&&!await unlockAudio())return false;
 if(!sfx||document.hidden)return false;
 if(kind==='heal'){for(const f of [523,659,784])tone(sfxBus,f,.9,.13);return true}
 if(kind==='oath'){for(const f of [196,294,392,587])tone(sfxBus,f,1.3,.16);noise(sfxBus,.7,.35,1200);tone(sfxBus,110,.7,.6,'sine',35);return true}
 if(kind==='roar'||kind==='boss'){noise(sfxBus,.65,.8,kind==='boss'?350:600);tone(sfxBus,150,.65,.55,'sawtooth',45);tone(sfxBus,80,.8,.6);return true}
 if(kind==='arrow'){noise(sfxBus,.18,.6,3300);tone(sfxBus,950,.16,.3,'triangle',250);return true}
 if(kind==='block'){noise(sfxBus,.12,.5,4000);for(const f of [1600,2310,3490])tone(sfxBus,f,.45,.2,'sine');return true}
 if(kind==='finish'||kind==='cleave'){noise(sfxBus,.45,.9,1500);tone(sfxBus,1500,.35,.4,'triangle',120);tone(sfxBus,110,.7,.7,'sine',35);return true}
 noise(sfxBus,.22,.75,kind==='enemy-slash'||kind==='enemy'?1200:2400);tone(sfxBus,900,.2,.34,'triangle',180);tone(sfxBus,150,.18,.3,'sine',60);return true;
}
document.addEventListener('visibilitychange',()=>{if(!context)return;if(document.hidden)context.suspend().catch(()=>{});else if(enabled||sfx)void unlockAudio()});
