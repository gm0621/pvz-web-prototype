import {hitSound} from './audio.mjs?v=duel-audio-1';
import {duelBeat} from './engine.mjs?v=duel-audio-1';
export function renderDuel(b){
 const d=b.duel,dialog=document.getElementById('duelDialog');if(!d)return;
 const beat=duelBeat(d),age=d.elapsed-beat.at,pulse=Math.max(0,1-age/.28),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(d.lastSoundBeat!==beat.at&&!b.paused){if(['hero','enemy','block','finish'].includes(beat.side))hitSound(beat.side);d.lastSoundBeat=beat.at}
 dialog.dataset.beat=beat.side;
 dialog.style.setProperty('--impact',String(['hero','block','finish'].includes(beat.side)?pulse:0));
 dialog.style.setProperty('--shake',`${reduced?0:Math.sin(age*70)*pulse*(beat.side==='finish'?9:3)}px`);
 const hero=document.getElementById('duelHero'),enemy=document.getElementById('duelEnemy');
 hero.style.display='none';
 let sprite=document.getElementById('duelSprite');
 if(!sprite){sprite=document.createElement('div');sprite.id='duelSprite';sprite.setAttribute('role','img');hero.after(sprite)}
 sprite.setAttribute('aria-label',hero.alt);sprite.style.backgroundImage=`url('./assets/attacks/${d.heroKey}.png')`;
 const attacking=['hero','finish'].includes(beat.side),frame=attacking?Math.min(5,Math.floor(age/.09)):beat.side==='charge'?1:0;
 sprite.style.backgroundPosition=`${frame%3*50}% ${Math.floor(frame/3)*100}%`;
 sprite.style.transform=`translateX(${reduced?0:attacking?Math.sin(Math.min(1,age/.5)*Math.PI)*25:beat.side==='block'?-8:0}px)`;
 enemy.style.transform=`translateX(${reduced?0:beat.side==='enemy'?-Math.sin(Math.min(1,age/.65)*Math.PI)*32:attacking?pulse*20:0}px) rotate(${beat.side==='victory'?18:0}deg)`;
 if(['鄧茂','程遠志'].includes(d.bossName))enemy.style.transform+=' scaleX(-1)';
 enemy.style.opacity=['finish','victory'].includes(beat.side)?String(Math.max(0,1-(d.elapsed-11.8)/.65)):'1';
 document.getElementById('duelCallout').textContent=beat.side==='finish'?(d.heroKey==='zhangfei'?'蛇矛穿陣！':'青龍斷陣！'):beat.text;
 document.getElementById('duelCaption').textContent=beat.side==='victory'?`${d.bossName}已斬殺！`:beat.side==='charge'?'勝負，就在這一招。':beat.side==='block'?'刀矛相撞，火星四濺！':'三路戰局暫停・武將決勝';
 const lines=d.heroKey==='zhangfei'?{ready:'鄧茂：「無名小卒，也敢攔我？」',hero:'張飛：「燕人張翼德在此！接招！」',enemy:'鄧茂：「休要猖狂，看刀！」',block:'張飛：「這點力氣，也敢欺壓百姓？」',charge:'張飛：「這一矛，替鄉親討個公道！」',finish:'張飛：「喝——破！」',victory:'張飛：「敵將已倒，兄弟們穩住三路！」'}:{ready:'程遠志：「殺我先鋒，今日定不饒你！」',hero:'關羽：「關雲長在此，請賜教。」',enemy:'程遠志：「吃我一記旋風斬！」',block:'關羽：「刀勢雖猛，破綻已露。」',charge:'關羽：「此刀，為受苦百姓而出。」',finish:'關羽：「青龍——斷陣！」',victory:'關羽：「敵將已斬，莫傷無辜。」'};
 document.getElementById('duelDialogue').textContent=lines[beat.side];
 const boss=b.enemies.find(e=>e.id===d.bossId);document.getElementById('duelHp').style.width=`${Math.max(0,(boss?.hp||0)/d.startHp*100)}%`;
 document.getElementById('duelPause').textContent=b.paused?'繼續單挑':'暫停單挑';
}
