import {DUEL_ENTRANCE_DURATION} from './engine.mjs?v=coalition-fixes-1';
import {HEROES,STAGES,enemyArt} from './story.mjs?v=coalition-fixes-1';
import {hitSound} from './audio.mjs?v=coalition-fixes-1';
const HERO_LABELS={liubei:['仁義之將','雌雄雙劍','為了身後的百姓，出戰！'],guanyu:['美髯公','青龍偃月刀','關雲長在此，請賜教！'],zhangfei:['燕人翼德','丈八蛇矛','燕人張翼德在此！']};
const ENEMY_WEAPONS={'張寶':'符杖與雨鈴','張梁':'環刀與風旗','鄧茂':'山賊大刀','程遠志':'旋風大刀','石魁':'巨盾・重錘','韓旌':'黃旗長矛','焦魯':'餘燼雙刀','杜衡':'鉤鐮雙刃','張角':'黃天符杖'};
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>1-(1-clamp(n))**3;
// All motion samples the duel state: pause/home/hidden-tab freeze the same clock.
export function renderDuelEntrance(b){
 const $=id=>document.getElementById(id),d=b.duel,dialog=$('duelDialog');
 const hadSkipFocus=document.activeElement===$('duelEnter');
 const active=d.elapsed===0&&(d.entranceElapsed??DUEL_ENTRANCE_DURATION)<DUEL_ENTRANCE_DURATION;
 $('duelVersus').hidden=!active;$('duelCombat').hidden=active;$('duelEnter').hidden=!active;
 dialog.dataset.phase=active?'entrance':'combat';
 if(!active){if(hadSkipFocus)$('duelPause').focus({preventScroll:true});return false}
 const t=d.entranceElapsed,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,hero=HEROES[d.heroKey],stage=STAGES[b.level-1],labels=HERO_LABELS[d.heroKey];
 const set=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value};
 $('versusHero').src=hero.asset;$('versusHero').alt=hero.name;$('versusEnemy').src=enemyArt(d.bossName);$('versusEnemy').alt=d.bossName;
 set('versusHeroTitle',`義軍 · ${labels[0]}`);set('versusHeroName',hero.name);set('versusHeroWeapon',labels[1]);set('versusEnemyTitle',`黃巾軍 · ${stage.bossTitle||'敵軍大將'}`);set('versusEnemyName',d.bossName);set('versusEnemyWeapon',ENEMY_WEAPONS[d.bossName]||'黃巾兵器');
 set('versusCallout',t<.65?'戰鼓驟起，兩軍讓開！':t<2.45?labels[2]:'兵刃相向——一決勝負！');
 const arrival=ease((t-.12)/.8),impact=clamp(1-Math.abs(t-1.05)/.38),exit=ease((t-2.75)/.45);
 const vars={'--arrival':reduced?1:arrival,'--name-in':reduced?1:ease((t-.7)/.6),'--clash':reduced?0:impact,'--seal':reduced?1:ease((t-.85)/.4),'--seal-scale':reduced?1:1+(1-ease((t-.85)/.4))*2,'--rush':`${reduced?0:t*85}px`,'--ring-size':reduced?1:1+clamp((t-1.02)/.8)*2.5,'--exit':reduced?0:exit,'--progress':t/DUEL_ENTRANCE_DURATION};
 for(const [key,value] of Object.entries(vars))dialog.style.setProperty(key,String(value));
 dialog.style.setProperty('--shake',`${reduced?0:Math.sin(t*55)*impact*3}px`);dialog.dataset.reduced=String(reduced);
 const sparks=$('duelVersus').querySelector('.versus-sparks');
 if(!sparks.childElementCount)for(let i=0;i<14;i++){const spark=document.createElement('i');sparks.append(spark)}
 const flight=clamp((t-1.02)/1.2);
 for(const [i,spark] of [...sparks.children].entries()){const angle=i/14*Math.PI*2,distance=flight*(120+(i%4)*40);spark.style.transform=`translate(${Math.cos(angle)*distance}px,${Math.sin(angle)*distance+flight*flight*45}px) rotate(${i*31}deg)`;spark.style.opacity=String(reduced||t<1.02?0:(1-flight)*.85)}
 const sounds=[[0,'boss'],[.48,'slash'],[1.02,'block'],[2.72,'finish']];
 if(!b.paused){d.entranceSounds??=[];for(const [at,sound] of sounds)if(t>=at&&!d.entranceSounds.includes(at)){void hitSound(sound);d.entranceSounds.push(at)}}
 $('duelEnter').disabled=b.paused;set('duelPause',b.paused?'繼續開場':'暫停開場');
 return true;
}

