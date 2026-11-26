import {archerArtwork} from './factions.mjs?v=historical-battles-1';
import {createBattle,deploy,castActive,damageAlly} from './engine.mjs?v=historical-battles-1';
import {ALL_GENERALS,PEACH_GENERALS,SUN_GENERALS,rosterFor,growthState,LEVEL_XP} from './roster.mjs?v=historical-battles-1';
import {PEACH_HEROES} from './hero-base.mjs?v=passive-feedback-1';
// A disposable battle. No campaign, storage, rewards, timers or normal wave stepping.
export function createPractice(id,index,level){
 const b=createBattle(1,1),xp=LEVEL_XP[Math.max(level,ALL_GENERALS[id].skills[index].level)-1],growth=growthState({[id]:{xp}});
 Object.assign(b,{heroMode:true,peachMode:!!PEACH_GENERALS[id],sunMode:!!SUN_GENERALS[id],roster:rosterFor([id],growth),participants:[],heroResources:{},food:300,time:10,nextSpawn:Infinity});
 deploy(b,'liubei',0);b.food=100;const hero=b.allies[0];hero.x=.3;hero.hp=hero.maxHp-90;
 b.allies.push({id:90,key:'archer',lane:0,x:.16,hp:35,maxHp:100,shield:0},{id:91,key:'archer',lane:1,x:.16,hp:35,maxHp:100,shield:0});
 b.enemies=[.4,.44].map((x,i)=>({id:100+i,name:'練習兵',lane:0,x,hp:200,maxHp:200,shield:0}));
 const snapshot=()=>[...b.allies,...b.enemies].map(u=>({...u}));return {b,id,index,before:snapshot(),snapshot,cast:false,blocked:0};
}
export function castPractice(p){if(p.cast)return false;p.cast=castActive(p.b,'liubei',p.index);return p.cast}
export function strikePracticeShield(p){if(p.struck)return;p.struck=true;const target=p.b.allies.find(u=>u.shield>0);if(target){const shield=target.shield,hp=target.hp;damageAlly(p.b,target,12);p.blocked=shield-target.shield;p.shieldTarget=target.id;p.shieldHpLoss=hp-target.hp;p.reduced=12-p.blocked-p.shieldHpLoss}}
const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e};
export function mountPractice(stage,p){
 const field=make('div','practice-field');field.setAttribute('aria-label','練習場');const note=make('p','practice-report','準備好了，看武將出招！');note.setAttribute('role','status');stage.append(field,note);stage.classList.add('with-practice');const rows=[];
 for(const u of [...p.b.allies,...p.b.enemies]){
  const enemy=u.id>=100,hero=u.id===p.b.allies[0].id,g=hero?ALL_GENERALS[p.id]:null,card=make('div','practice-unit'),name=hero?g.name:enemy?'練習兵':u.lane?'另一路友軍':'受傷友軍';card.dataset.practiceUnit=String(u.id);card.style.left=(hero?29:enemy?57+(u.id-100)*22:10)+'%';card.style.top=(u.lane?145:20)+'px';
  const sprite=make('span','practice-sprite');sprite.setAttribute('role','img');sprite.setAttribute('aria-label',name);let atlas=false;
  if(hero){atlas=!!g.atlas;sprite.style.backgroundImage=`url("${g.atlas||'./assets/attacks/'+p.id+'.png'}")`;sprite.style.backgroundSize=atlas?`300% ${g.atlasRows===2?200:300}%`:'300% 200%'}
  else if(enemy){sprite.style.backgroundImage='url("./assets/attacks/yellow-turban-troops.png")';sprite.style.backgroundSize='300% 200%'}
  else{const art=archerArtwork(ALL_GENERALS[p.id].faction);sprite.style.backgroundImage=`url("${art.atlas||PEACH_HEROES.archer.asset}")`;sprite.style.backgroundSize=art.atlas?'300% 300%':'contain';sprite.style.backgroundRepeat='no-repeat';sprite.style.backgroundPosition=art.atlas?`0% ${art.row*50}%`:'center'}
  const title=make('small','',name),hp=make('div','practice-hp'),fill=make('i',''),value=make('small','practice-value'),shield=make('small','practice-shield'),delta=make('b','practice-delta');hp.append(fill);card.append(title,sprite,hp,value,shield,delta);field.append(card);rows.push({u,card,sprite,fill,value,shield,delta,hero,enemy,g,atlas,old:p.before.find(a=>a.id===u.id)});
 }
 function render(age){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const r of rows){const {u,old,hero,enemy,g,sprite,card}=r,hit=p.cast,progress=Math.max(0,Math.min(1,(age-650)/450));
   r.fill.style.width=((old.hp+(u.hp-old.hp)*progress)/u.maxHp*100)+'%';r.value.textContent=`${Math.max(0,u.hp)}／${u.maxHp}`;r.shield.textContent=u.shield?`◇ 護盾 ${u.shield}`:'';card.dataset.shield=String(u.shield>0);
   const change=u.hp-old.hp;let text=hit&&change?`${change>0?'+':''}${change}`:'';if(enemy&&hit)r.shield.textContent=(u.x>old.x?'擊退 ':'')+(u.stunnedUntil>p.b.time?'暈眩':'');if(p.struck&&u.id===p.shieldTarget)text=`擋下 ${p.blocked}！`;
   r.delta.textContent=text;r.delta.dataset.kind=change>0?'heal':'hit';const swing=age>=250&&age<1000,phase=Math.min(5,Math.max(0,Math.floor((age-250)/120)));
   if(hero){const f=swing&&!reduced?(p.id==='zhangfei'&&phase===4?3:phase):0;sprite.style.backgroundPosition=r.atlas?`${(swing&&!reduced?(age<650?1:2):0)*50}% ${g.row*(g.atlasRows===2?100:50)}%`:`${(f%3)*50}% ${Math.floor(f/3)*100}%`}
   if(enemy)sprite.style.backgroundPosition=`${p.struck&&u.id===100&&age<2100&&!reduced?50:100}% 0%`;
   const pushed=enemy?(u.x-old.x)*280:0,recoil=enemy&&hit&&!reduced&&age<1050?Math.sin(progress*Math.PI)*10:0;card.style.transform=`translateX(calc(-50% + ${pushed+recoil}px))`;
   sprite.style.filter=enemy&&hit&&age<1000?'brightness(1.5)':'none';
  }
 }
 function report(){const b=p.b,damage=b.enemies.reduce((n,u)=>n+200-u.hp,0),heal=b.allies.reduce((n,u)=>n+u.hp-p.before.find(x=>x.id===u.id).hp,0),shield=b.allies.reduce((n,u)=>n+u.shield,0),push=b.enemies.some(u=>u.x>p.before.find(x=>x.id===u.id).x),stun=b.enemies.some(u=>u.stunnedUntil>b.time);note.textContent=[damage?`敵軍受傷 ${damage}`:'',push?'小兵被推退':'',stun?'敵軍暫時無法行動':'',heal>0?`友軍回復 ${heal} 生命`:'',shield?`友軍獲得護盾`:'',b.food>100?`軍糧 +${b.food-100}`:''].filter(Boolean).join(' · ');if(p.struck&&p.blocked)note.textContent=`練習兵試打 12 → ${p.reduced?`護身減傷 ${p.reduced}，`:""}護盾擋下 ${p.blocked}，${p.shieldHpLoss?'生命減少 '+p.shieldHpLoss:'生命沒有減少'}！`}
 render(0);return {render,report,remove(){field.remove();note.remove();stage.classList.remove('with-practice')}};
}
