import {duelBeat} from './engine.mjs?v=bandit-duel-1';
export function renderDuel(b){
 const d=b.duel,dialog=document.getElementById('duelDialog');if(!d)return;
 const beat=duelBeat(d),age=d.elapsed-beat.at,pulse=Math.max(0,1-age/.28),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
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
 if(d.bossName==='鄧茂')enemy.style.transform+=' scaleX(-1)';
 enemy.style.opacity=['finish','victory'].includes(beat.side)?String(Math.max(0,1-(d.elapsed-4.85)/.65)):'1';
 document.getElementById('duelCallout').textContent=beat.side==='finish'?(d.heroKey==='zhangfei'?'蛇矛穿陣！':'青龍斷陣！'):beat.text;
 document.getElementById('duelCaption').textContent=beat.side==='victory'?`${d.bossName}已斬殺！`:beat.side==='charge'?'勝負，就在這一招。':beat.side==='block'?'刀矛相撞，火星四濺！':'三路戰局暫停・武將決勝';
 const boss=b.enemies.find(e=>e.id===d.bossId);document.getElementById('duelHp').style.width=`${Math.max(0,(boss?.hp||0)/d.startHp*100)}%`;
 document.getElementById('duelPause').textContent=b.paused?'繼續單挑':'暫停單挑';
}
