// Stage six only. Damage, movement and effects all sample the paused duel clock.
export const TEAM_BEATS=Object.freeze([
 {at:0,side:'ready',text:'雙雄出陣 · 二打一',line:'關羽：「翼德，你我左右照應！」'},
 {at:1.3,side:'reply',text:'雷烈迎戰',line:'雷烈：「兩個一起上，我也不懼！」'},
 {at:2.7,side:'hero',actor:'guanyu',damage:.1,text:'青龍探路',line:'關羽正面試刀，張飛守住側翼。'},
 {at:3.8,side:'enemy',counterTarget:'hero',heroDamage:.03,text:'雷烈・裂地反劈',line:'雷烈逼退關羽，張飛準備接應！'},
 {at:5,side:'block',actor:'zhangfei',text:'橫矛救援',line:'張飛：「二哥退半步，俺來接這一斧！」'},
 {at:6.2,side:'hero',actor:'zhangfei',damage:.1,text:'蛇矛破勢',line:'關羽牽住斧勢，張飛踏步突刺！'},
 {at:7.4,side:'enemy',counterTarget:'partner',heroDamage:.03,text:'雷烈・回身橫掃',line:'雷烈轉攻張飛，關羽趁隙繞向背後。'},
 {at:8.6,side:'maneuver',text:'換位夾擊',line:'張飛正面牽制，關羽繞背回身！'},
 {at:9.6,side:'hero',actor:'guanyu',damage:.1,text:'青龍・背身反斬',line:'關羽：「翼德，就趁現在！」'},
 {at:10.6,side:'block',actor:'zhangfei',text:'刀矛鎖斧',line:'雷烈回斧欲追，張飛架矛攔截！'},
 {at:11.6,side:'charge',text:'青龍蛇矛・雙雄破陣',line:'關羽蓄刀，張飛挺矛——左右合擊！'},
 {at:13,side:'combo',actor:'zhangfei',damage:.2,text:'蛇矛封路',line:'第一擊！張飛截住雷烈退路。'},
 {at:14,side:'combo',actor:'guanyu',damage:.2,text:'青龍斷勢',line:'第二擊！關羽回身斬落大斧。'},
 {at:15.5,side:'finish',actor:'both',damage:1,text:'青龍蛇矛・雙雄破陣',line:'刀矛齊至——雙雄合擊！'},
 {at:17.2,side:'victory',text:'雙雄破陣 · 雷烈敗北',line:'張飛：「痛快！二哥，咱們再去照應大哥！」'}
].map(Object.freeze));
export function teamBeat(t){return TEAM_BEATS.filter(b=>b.at<=t+1e-8).at(-1)||TEAM_BEATS[0]}
const clamp=n=>Math.max(0,Math.min(1,n));
export function teamPose(d,reduced=false){
 const t=d.elapsed,beat=teamBeat(t),age=Math.max(0,t-beat.at),flank=clamp((t-8.6)/.7),active=['hero','combo','finish'].includes(beat.side),pulse=active?clamp(1-age/.45):beat.side==='block'?clamp(1-age/.4):0;
 let gx=21+57*flank,zx=42-18*flank,ex=74-24*flank;
 const contact=active?1-clamp(age/.8):0;
 if(beat.actor==='guanyu'||beat.actor==='both')gx+=(ex-Math.sign(ex-gx)*21-gx)*contact;
 if(beat.actor==='zhangfei'||beat.actor==='both')zx+=(ex-Math.sign(ex-zx)*21-zx)*contact;
 if(beat.side==='block')zx=ex-22;
 const counterPulse=beat.side==='enemy'?clamp(1-Math.abs(age-.6)/.3):0;
 if(beat.side==='enemy')ex-=Math.sin(clamp(age/1.1)*Math.PI)*15;
 const target=beat.side==='enemy'?(beat.counterTarget==='partner'?zx:gx):beat.actor==='zhangfei'?zx:gx;
 const frame=key=>{if(beat.side==='charge'||beat.side==='block'&&beat.actor===key)return 2;if(active&&(beat.actor===key||beat.actor==='both'))return age<.3?3:5;return 0};
 return {beat,age,pulse:reduced?0:pulse,counterPulse:reduced?0:counterPulse,guanyu:{x:gx,facing:gx<ex?1:-1,frame:frame('guanyu')},zhangfei:{x:zx,facing:zx<ex?1:-1,frame:frame('zhangfei')},enemy:{x:ex,facing:target<ex?-1:1,rotation:reduced?0:beat.side==='enemy'?Math.sin(clamp(age/1.1)*Math.PI)*-18:0,fallen:t>=16.1},shake:reduced?0:Math.sin(age*65)*pulse*(beat.side==='finish'?5:2)};
}
