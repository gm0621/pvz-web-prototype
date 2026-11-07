import {STAGES} from './story.mjs?v=hold-guide-1';
import {hitSound} from './audio.mjs?v=yellow-boss-2';
import {duelBeat} from './engine.mjs?v=hold-guide-1';
export function renderDuel(b){
 const d=b.duel,dialog=document.getElementById('duelDialog');if(!d)return;
 const stage=STAGES[b.level-1]||{},custom=stage.bossName===d.bossName?stage:{},retreat=d.outcome==='retreat';
 document.getElementById('duelOutcomeNote').textContent=retreat?'破陣退敵・張角撤離戰場':'終結一擊擊敗敵將・其餘敵兵仍需清除';
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
 const attacking=['hero','finish'].includes(beat.side),rawFrame=attacking?Math.min(5,Math.floor(age/.09)):beat.side==='charge'?1:0,frame=d.heroKey==='zhangfei'&&rawFrame===4?3:rawFrame;
 sprite.style.backgroundPosition=`${frame%3*50}% ${Math.floor(frame/3)*100}%`;
 const dodge=beat.side==='enemy'?Math.sin(Math.min(1,Math.max(0,(age-.35)/.75))*Math.PI):0;
 sprite.dataset.dodging=String(dodge>0);
 sprite.style.transform=`translateX(${reduced?0:attacking?Math.sin(Math.min(1,age/.5)*Math.PI)*25:beat.side==='block'?-8:-dodge*35}px) translateY(${reduced?0:dodge*12}px) rotate(${reduced?0:-dodge*14}deg)`;
 enemy.style.transform=`translateX(${reduced?0:beat.side==='enemy'?-Math.sin(Math.min(1,age/.65)*Math.PI)*32:attacking?pulse*20:0}px) rotate(${!retreat&&beat.side==='victory'?18:0}deg)`;
 if(custom.duelSheet||['鄧茂','程遠志','石魁'].includes(d.bossName))enemy.style.transform+=' scaleX(-1)';
 let foe=document.getElementById('duelEnemySprite');if(!foe){foe=document.createElement('div');foe.id='duelEnemySprite';foe.setAttribute('role','img');enemy.after(foe)}
 enemy.style.display='none';foe.setAttribute('aria-label',d.bossName);
 const enemyFrame=beat.side==='enemy'?(age<.45?1:age<1.05?2:0):beat.side==='block'?2:0;
 foe.style.backgroundImage=`url('./assets/attacks/${custom.duelSheet||(d.bossName==='石魁'?'shi-kui.png':'enemy-counter.png')}')`;foe.style.backgroundSize=custom.duelSheet||d.bossName==='石魁'?'300% 100%':'300% 200%';foe.dataset.frame=String(enemyFrame);foe.style.backgroundPosition=`${enemyFrame*50}% ${d.bossName==='程遠志'?100:0}%`;
 foe.style.transform=enemy.style.transform+(retreat&&['finish','victory'].includes(beat.side)?` translateX(${-Math.min(100,(d.elapsed-11.8)*40)}px)`:'');
 dialog.style.setProperty('--enemy-slash',String(beat.side==='enemy'?Math.max(0,1-Math.abs(age-.6)/.25):0));
 enemy.style.opacity=['finish','victory'].includes(beat.side)?String(Math.max(0,1-(d.elapsed-11.8)/.65)):'1';
 foe.style.opacity=enemy.style.opacity;
 document.getElementById('duelCallout').textContent=beat.side==='finish'?(custom.duelFinish||(d.heroKey==='zhangfei'?'蛇矛穿陣！':d.heroKey==='liubei'?'雙劍破陣！':'青龍斷陣！')):beat.text;
 document.getElementById('duelCaption').textContent=beat.side==='enemy'?(custom.duelCounter||(d.heroKey==='liubei'?'重錘砸落！側身閃開！':'敵將揮刀！側身閃開！')):beat.side==='victory'?`${d.bossName}${retreat?'退走了！':'已擊敗！'}`:beat.side==='charge'?'勝負，就在這一招。':beat.side==='block'?'刀矛相撞，火星四濺！':'三路戰局暫停・武將決勝';
 const lines=custom.duelLines||(d.heroKey==='liubei'?{ready:'石魁：「賣草鞋的，也敢破我的盾？」',hero:'劉備：「我這雙劍，為救百姓而出！」',enemy:'石魁：「吃我一錘！」',block:'劉備：「盾有縫隙，心不可亂。」',charge:'劉備：「讓開道路，莫再阻我救人！」',finish:'劉備：「雙劍——破！」',victory:'劉備：「道路已開，先護傷者退後！」'}:d.heroKey==='zhangfei'?{ready:'鄧茂：「無名小卒，也敢攔我？」',hero:'張飛：「燕人張翼德在此！接招！」',enemy:'鄧茂：「休要猖狂，看刀！」',block:'張飛：「這點力氣，也敢欺壓百姓？」',charge:'張飛：「這一矛，替鄉親討個公道！」',finish:'張飛：「喝——破！」',victory:'張飛：「敵將已倒，兄弟們穩住三路！」'}:{ready:'程遠志：「殺我先鋒，今日定不饒你！」',hero:'關羽：「關雲長在此，請賜教。」',enemy:'程遠志：「吃我一記旋風斬！」',block:'關羽：「刀勢雖猛，破綻已露。」',charge:'關羽：「此刀，為受苦百姓而出。」',finish:'關羽：「青龍——斷陣！」',victory:'關羽：「敵將已斬，莫傷無辜。」'});
 document.getElementById('duelDialogue').textContent=beat.side==='hero'&&d.elapsed>=8?(custom.duelCombo||(d.heroKey==='liubei'?'劉備：「重錘已過，破綻在此！」':d.heroKey==='zhangfei'?'張飛：「還敢逞強？再接俺一矛！」':'關羽：「刀鋒所向，斷你退路！」')):lines[beat.side];
 const boss=b.enemies.find(e=>e.id===d.bossId);document.getElementById('duelHp').style.width=`${Math.max(0,(boss?.hp||0)/d.startHp*100)}%`;
 document.getElementById('duelPause').textContent=b.paused?'繼續單挑':'暫停單挑';
}
