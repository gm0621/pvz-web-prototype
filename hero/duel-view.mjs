import {renderTeamDuel} from './team-duel-view.mjs?v=coalition-fixes-1';
import {renderDuelCinematic} from './duel-cinematic.mjs?v=coalition-fixes-1';
import {duelPattern} from './duel-patterns.mjs?v=coalition-fixes-1';
import {renderDuelEntrance} from './duel-entrance.mjs?v=coalition-fixes-1';
import {HEROES,enemyArt,STAGES} from './story.mjs?v=coalition-fixes-1';
import {hitSound} from './audio.mjs?v=coalition-fixes-1';
import {duelBeats,duelBeat} from './engine.mjs?v=coalition-fixes-1';
export function renderDuel(b){
 const d=b.duel,dialog=document.getElementById('duelDialog');if(!d)return;
 dialog.dataset.team=String(d.format==='two-v-one');
 const team=document.getElementById('teamDuel');if(team)team.hidden=d.format!=='two-v-one';
 if(d.format==='two-v-one'){renderTeamDuel(b);return}
 if(renderDuelEntrance(b))return;
 const stage=STAGES[b.level-1]||{},custom=stage.bossName===d.bossName?stage:{},retreat=d.outcome==='retreat';
 document.getElementById('duelOutcomeNote').textContent=retreat?`破陣退敵・${d.bossName}撤離戰場`:'終結一擊擊敗敵將・其餘敵兵仍需清除';
 const beat=duelBeat(d),age=d.elapsed-beat.at,pulse=Math.max(0,1-age/.28),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(d.lastSoundBeat!==beat.at&&!b.paused){if(['hero','combo','enemy','block','finish'].includes(beat.side))hitSound(beat.side==='combo'?'hero':beat.side);d.lastSoundBeat=beat.at}
 dialog.dataset.beat=beat.side;const pattern=duelPattern(d);dialog.dataset.style=pattern.style;dialog.dataset.foe=custom.skillType||'melee';document.getElementById('duelStyle').textContent=pattern.name;
 dialog.style.setProperty('--impact',String(['hero','block','finish'].includes(beat.side)?pulse:0));
 dialog.style.setProperty('--shake',`${reduced?0:Math.sin(age*70)*pulse*(beat.side==='finish'?9:3)}px`);
 const hero=document.getElementById('duelHero'),enemy=document.getElementById('duelEnemy');
 hero.style.display='none';
 let sprite=document.getElementById('duelSprite');
 if(!sprite){sprite=document.createElement('div');sprite.id='duelSprite';sprite.setAttribute('role','img');hero.after(sprite)}
 sprite.setAttribute('aria-label',hero.alt);sprite.style.backgroundImage=`url('./assets/attacks/${d.heroKey}.png')`;
 const attacking=['hero','finish'].includes(beat.side),rawFrame=attacking?Math.min(5,Math.floor((age<1.2?age%.6:age)/.09)):beat.side==='charge'?1:0,frame=d.heroKey==='zhangfei'&&rawFrame===4?3:rawFrame;
 sprite.style.backgroundPosition=`${frame%3*50}% ${Math.floor(frame/3)*100}%`;
 const dodge=beat.side==='enemy'?Math.sin(Math.min(1,Math.max(0,(age-.35)/.75))*Math.PI):0;
 sprite.dataset.dodging=String(dodge>0);
 sprite.style.transform=`translateX(${reduced?0:attacking?Math.sin(Math.min(2,age/(pattern.style==='spear'?.38:.55))*Math.PI)*(pattern.style==='spear'?40:pattern.style==='swords'?18:30):beat.side==='block'?-8:-dodge*35}px) translateY(${reduced?0:dodge*12}px) rotate(${reduced?0:-dodge*14}deg)`;
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
 const cinema=renderDuelCinematic(b,sprite,foe);
 document.getElementById('duelCallout').textContent=beat.text;
 document.getElementById('duelCaption').textContent=cinema.special&&beat.side!=='victory'?(beat.side==='charge'?'凝神蓄力——絕技將出！':beat.side==='finish'?'一擊決勝！':cinema.finisher.setup):beat.side==='enemy'?(custom.duelCounter||(d.heroKey==='liubei'?'重錘砸落！側身閃開！':'敵將揮刀！側身閃開！')):beat.side==='victory'?`${d.bossName}${retreat?'退走了！':'已擊敗！'}`:beat.side==='charge'?'勝負，就在這一招。':beat.side==='block'?'刀矛相撞，火星四濺！':'三路戰局暫停・武將決勝';
 const lines=custom.duelLines||(d.heroKey==='liubei'?{ready:'石魁：「賣草鞋的，也敢破我的盾？」',hero:'劉備：「我這雙劍，為救百姓而出！」',enemy:'石魁：「吃我一錘！」',block:'劉備：「盾有縫隙，心不可亂。」',charge:'劉備：「讓開道路，莫再阻我救人！」',finish:'劉備：「雙劍——破！」',victory:'劉備：「道路已開，先護傷者退後！」'}:d.heroKey==='zhangfei'?{ready:'鄧茂：「無名小卒，也敢攔我？」',hero:'張飛：「燕人張翼德在此！接招！」',enemy:'鄧茂：「休要猖狂，看刀！」',block:'張飛：「這點力氣，也敢欺壓百姓？」',charge:'張飛：「這一矛，替鄉親討個公道！」',finish:'張飛：「喝——破！」',victory:'張飛：「敵將已倒，兄弟們穩住三路！」'}:{ready:'程遠志：「殺我先鋒，今日定不饒你！」',hero:'關羽：「關雲長在此，請賜教。」',enemy:'程遠志：「吃我一記旋風斬！」',block:'關羽：「刀勢雖猛，破綻已露。」',charge:'關羽：「此刀，為受苦百姓而出。」',finish:'關羽：「青龍——斷陣！」',victory:'關羽：「敵將已斬，莫傷無辜。」'});
 const heroName=HEROES[d.heroKey].name;
 const reply=custom.duelLines?.hero||`${heroName}：「為了身後的鄉親，這一陣不能退！」`;
 const lastHeroBeat=duelBeats(d).filter(entry=>entry.at<=d.elapsed&&['reply','hero','block','charge','finish','victory'].includes(entry.side)).at(-1);
 const heroLine=retreat&&beat.side==='victory'?`${heroName}：「受困的人已脫險，收兵！」`:!lastHeroBeat||lastHeroBeat.side==='reply'?reply:lastHeroBeat.side==='hero'&&lastHeroBeat.at>=8?(custom.duelCombo||`${heroName}：「看準了，再接這一招！」`):lines[lastHeroBeat.side]||reply;
 const enemyTurns=duelBeats(d).filter(entry=>entry.side==='enemy'&&entry.at<=d.elapsed).length;
 const enemyLine=retreat&&beat.side==='victory'?lines.victory:enemyTurns>1?`${d.bossName}：「還沒完！再接一招！」`:enemyTurns?lines.enemy:lines.ready;
 document.getElementById('duelEnemyLine').textContent=enemyLine;
 document.getElementById('duelDialogue').textContent=heroLine;
 document.getElementById('duelEnemyFace').src=enemyArt(d.bossName);document.getElementById('duelEnemyFace').alt=d.bossName;
 document.getElementById('duelHeroFace').src=HEROES[d.heroKey].asset;document.getElementById('duelHeroFace').alt=heroName;
 dialog.dataset.speaker=['ready','enemy'].includes(beat.side)?'enemy':'hero';
 const boss=b.enemies.find(e=>e.id===d.bossId),fighter=b.allies.find(u=>u.id===d.heroId);
 for(const [prefix,unit,name] of [['Hero',fighter,heroName],['Enemy',boss,d.bossName]]){const hp=Math.max(0,unit?.hp||0),max=unit?.maxHp||1,bar=document.getElementById(`duel${prefix}Health`);bar.setAttribute('aria-label',`${name}生命`);bar.setAttribute('aria-valuemax',String(max));bar.setAttribute('aria-valuenow',String(Math.ceil(hp)));bar.querySelector('i').style.width=`${Math.min(100,hp/max*100)}%`;document.getElementById(`duel${prefix}HpText`).textContent=`${name} ${Math.ceil(hp)} / ${max}`;}
 document.getElementById('duelPause').textContent=b.paused?'繼續單挑':'暫停單挑';
}
