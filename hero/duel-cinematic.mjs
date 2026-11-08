import {duelBeats,duelFinisher} from './duel-patterns.mjs?v=boss-cutin-1';
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
// Pure samples of the paused engine clock. No CSS animation or wall-clock timer.
export function duelPose(d,reduced=false){
 const f=duelFinisher(d),beats=duelBeats(d),beat=beats.filter(b=>b.at<=d.elapsed).at(-1)||beats[0],age=d.elapsed-beat.at;
 const special=d.elapsed>=11.5,attack=['hero','combo','finish'].includes(beat.side),impact=attack?clamp(1-age/.42):beat.side==='block'?clamp(1-age/.3):0;
 let hero=24,enemy=76,lift=0,frame=0;
 if(attack){hero=43;frame=age<.22?3:age<.45?4:5;enemy+=impact*3}
 if(beat.side==='enemy'){hero-=Math.sin(clamp(age/1.1)*Math.PI)*8;enemy-=Math.sin(clamp(age/.9)*Math.PI)*19;lift=-Math.sin(clamp(age/1.1)*Math.PI)*4}
 if(beat.side==='block'){hero=36;enemy=64;frame=2}
 if(beat.side==='charge')frame=2;
 // Different spacing and movement throughout the bout, not only different text.
 if(!special){
  if(f.id==='dragon-shadow'&&beat.side==='hero'){hero=58;enemy=35}
  if(f.id==='sky-cleave'&&attack)lift=-18*Math.max(0,1-age/1.1);
  if(f.id==='cross-break'&&beat.side==='block'){hero=40;enemy=62}
  if(f.id==='twin-dance'&&attack){hero=beat.at>7?67:39;enemy=beat.at>7?36:70}
  if(f.id==='seal-break'&&beat.side==='enemy'){hero=24+8*Math.sin(age*5);lift=-8*Math.sin(clamp(age)*Math.PI)}
 }
 if(special){
  const run=ease((d.elapsed-12.7)/.45);
  switch(f.id){
   case 'dragon-shadow':hero=24+52*run;enemy=65-29*run;break;
   case 'sky-cleave':hero=24+23*run;enemy=76;lift=-30*Math.sin(clamp((d.elapsed-12.7)/2.8)*Math.PI);break;
   case 'cross-break':hero=24+19*run;enemy=70+impact*5;break;
   case 'lion-roar':hero=24+19*run;enemy=70+impact*9;lift=attack?-impact*7:0;break;
   case 'twin-dance':{const side=f.hits.filter(t=>d.elapsed>=t).length%2;hero=run*(side?70:38)+(1-run)*24;enemy=side?36:73;break;}
   case 'seal-break':hero=24+19*run;enemy=76;lift=beat.side==='maneuver'?-12*Math.sin(run*Math.PI):0;break;
   default:hero=24+run*21;enemy=70+impact*7;
  }
 }
 const heroFacing=hero<enemy?1:-1,enemyFacing=-heroFacing;
 // Hold the hit pose before the defeated enemy falls/retreats; never vanish on hit.
 const defeat=clamp((d.elapsed-f.finish-.5)/1.1);
 if(reduced){hero=heroFacing===1?28:72;enemy=heroFacing===1?72:28;lift=0}
 return {hero,enemy,lift,frame: d.heroKey==='zhangfei'&&frame===4?3:frame,heroFacing,enemyFacing,impact:reduced?impact*.3:impact,
  special,beat:beat.side,age,finisher:f,defeat,ring:special?clamp((d.elapsed-11.5)/1.2):0,
  shake:reduced?0:Math.sin(age*65)*impact*(beat.side==='finish'?5:2)};
}
export function renderDuelCinematic(b,sprite,foe){
 const d=b.duel,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,p=duelPose(d,reduced),dialog=document.getElementById('duelDialog'),arena=dialog.querySelector('.duel-portraits');
 let fx=arena.querySelector('.cinema-fx');
 if(!fx){fx=document.createElement('div');fx.className='cinema-fx';fx.setAttribute('aria-hidden','true');fx.innerHTML='<i class="cinema-ring"></i><i class="cinema-cut cut-a"></i><i class="cinema-cut cut-b"></i><i class="cinema-ray"></i><div class="cinema-sparks">'+Array.from({length:12},()=>'<i></i>').join('')+'</div><strong class="cinema-name"></strong>';arena.append(fx)}
 dialog.dataset.cinema=p.finisher.id;dialog.dataset.special=String(p.special);dialog.dataset.reduced=String(reduced);
 dialog.style.setProperty('--cinema-color',p.finisher.color);dialog.style.setProperty('--shake',`${p.shake}px`);
 dialog.style.setProperty('--impact','0');dialog.style.setProperty('--enemy-slash',String(p.beat==='enemy'?Math.max(0,1-Math.abs(p.age-.6)/.25):0));
 for(const [el,x,face] of [[sprite,p.hero,p.heroFacing],[foe,p.enemy,p.enemyFacing]]){
  el.style.left=`${x}%`;el.dataset.facing=face===1?'right':'left';
  el.style.transform=`translateX(-50%) translateY(${el===sprite?p.lift:0}%) scaleX(${face})${el===foe&&d.outcome!=='retreat'?` rotate(${-p.defeat*65}deg)`:''}`;
 }
 sprite.style.backgroundPosition=`${p.frame%3*50}% ${Math.floor(p.frame/3)*100}%`;
 foe.style.opacity=String(1-p.defeat*.9);
 if(d.outcome==='retreat'&&p.defeat){foe.style.left=`${p.enemy+p.enemyFacing*-p.defeat*18}%`;foe.style.transform=`translateX(-50%) scaleX(${-p.enemyFacing})`;foe.dataset.facing=p.enemyFacing===1?'left':'right'}
 fx.style.setProperty('--power',String(p.impact));fx.style.setProperty('--ring-scale',String(.5+p.ring*.65+p.impact*.5));
 fx.style.setProperty('--ring-opacity',String(p.special&&p.beat==='charge'?.65:p.impact));
 fx.style.setProperty('--strike-x',`${p.enemy}%`);
 const label=fx.querySelector('.cinema-name');label.textContent=p.finisher.name;label.style.opacity=p.special&&d.elapsed<16.8?'1':'0';
 for(const [i,spark] of [...fx.querySelector('.cinema-sparks').children].entries()){
  const flight=clamp(p.age/.65),a=i/12*Math.PI*2,r=flight*(40+(i%3)*20);
  spark.style.transform=`translate(${reduced?0:Math.cos(a)*r}px,${reduced?0:Math.sin(a)*r}px) rotate(${i*30}deg)`;
  spark.style.opacity=String(['hero','combo','finish','block'].includes(p.beat)?(1-flight)*(reduced?.2:1):0);
 }
 return p;
}
