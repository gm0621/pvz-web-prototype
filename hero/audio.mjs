// Original pentatonic arrangement: plucked strings, low drum and sustained reed tones.
let context,musicBus,sfxBus,timer=null,step=0,enabled=false,sfx=true,revision=0;
export const THEMES=[
 {name:'桃園春風',root:62,beat:620,drum:8,notes:[0,4,7,9,12,9,7,null,4,7,4,2,0,null,2,4]},
 {name:'山徑行軍',root:57,beat:560,drum:4,notes:[0,7,9,7,4,2,0,null,2,4,7,12,9,7,4,null]},
 {name:'大興戰鼓',root:50,beat:520,drum:2,notes:[0,0,7,null,9,7,4,2,0,7,12,9,7,null,4,2]},
 {name:'青龍出陣',root:55,beat:580,drum:4,notes:[7,12,14,12,9,7,4,null,7,9,12,16,14,12,7,null]},
 {name:'青州暮色',root:60,beat:650,drum:8,notes:[12,9,7,4,2,null,0,2,4,7,9,null,7,4,2,0]},
 {name:'桃園同心',root:62,beat:540,drum:4,notes:[0,4,7,12,14,12,9,7,4,7,9,14,16,14,12,null]}
];
let scene=0;
export function setMusicScene(level){const next=Math.max(0,Math.min(5,(Number(level)||1)-1));if(next===scene)return;scene=next;step=0;if(enabled)void setMusic(true)}
const hz=n=>440*2**((n-69)/12);
function pluck(freq){const c=init(),duration=2.2,buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0),period=Math.max(2,Math.round(c.sampleRate/freq));for(let i=0;i<data.length;i++){if(i<period)data[i]=(Math.random()*2-1)*.18;else data[i]=.496*(data[i-period]+data[i-period+1]);data[i]*=Math.min(1,i/100)}const source=c.createBufferSource();source.buffer=buffer;source.connect(musicBus);source.start();source.onended=()=>source.disconnect()}
function init(){if(!context){context=new AudioContext();musicBus=context.createGain();sfxBus=context.createGain();musicBus.gain.value=0;musicBus.connect(context.destination);sfxBus.gain.value=.2;sfxBus.connect(context.destination)}return context}
function tone(bus,freq,duration,volume,type='sine',slide=0){const c=init(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(slide,c.currentTime+duration);g.gain.setValueAtTime(volume,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);o.connect(g);g.connect(bus);o.start();o.stop(c.currentTime+duration);o.onended=()=>{o.disconnect();g.disconnect()}}
function tick(){if(!enabled||document.hidden)return;const theme=THEMES[scene],note=theme.notes[step%theme.notes.length],phrase=Math.floor(step/theme.notes.length)%2;if(note!==null){pluck(hz(theme.root+note));if(phrase&&step%2===0)tone(musicBus,hz(theme.root+note+12),.8,.025)}if(step%theme.drum===0)tone(musicBus,78,.65,.12,'sine',32);if(step%8===0){pluck(hz(theme.root-12));tone(musicBus,hz(theme.root-12),2.8,.025)}step++}
export async function setMusic(on){init();const request=++revision;enabled=on;musicBus.disconnect();if(timer){clearInterval(timer);timer=null}musicBus.gain.cancelScheduledValues(context.currentTime);musicBus.gain.setValueAtTime(0,context.currentTime);if(!on)return false;try{await context.resume();if(enabled&&request===revision){musicBus.connect(context.destination);musicBus.gain.setValueAtTime(.55,context.currentTime);tick();timer=setInterval(tick,THEMES[scene].beat)}return enabled}catch{if(request===revision)enabled=false;return enabled}}
export function musicOn(){return enabled}
export function setSfx(on){sfx=on;if(sfxBus)sfxBus.gain.value=on?.2:0}
export function unlockAudio(){init();context.resume().catch(()=>{})}
export function hitSound(kind='slash'){if(!sfx||document.hidden)return;init();if(context.state!=='running')return;
 if(kind==='heal'){for(const f of [523,659,784])tone(sfxBus,f,1.1,.09);return}
 if(kind==='oath'){for(const f of [196,294,392,587])tone(sfxBus,f,1.5,.12);tone(sfxBus,110,.6,.5,'sine',35);return}
 if(kind==='roar'){tone(sfxBus,130,.8,.5,'sawtooth',35);tone(sfxBus,65,1,.4);return}
 if(kind==='cleave'){tone(sfxBus,1800,.5,.35,'triangle',90);tone(sfxBus,95,.6,.45,'sine',35);return}
 const metal=kind==='block',heavy=kind==='finish';tone(sfxBus,metal?1400:heavy?140:600,heavy?.65:.18,heavy?.7:.35,metal?'triangle':'sawtooth',metal?600:45);if(metal)tone(sfxBus,2150,.3,.2);}
document.addEventListener('visibilitychange',()=>{if(!context)return;if(document.hidden)context.suspend().catch(()=>{});else if(enabled||sfx)context.resume().catch(()=>{})});
