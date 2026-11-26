import {createPractice,castPractice,strikePracticeShield,mountPractice} from './skill-practice.mjs?v=changan-bonus-2';
import {ALL_GENERALS,activeText} from './roster.mjs?v=changan-bonus-2';
import {paintPortrait} from './factions.mjs?v=changan-bonus-2';
import {skillPresentation,skillArtwork} from './skill-presentation.mjs?v=passive-feedback-1';
import {MASTER_STYLES} from './master-style.mjs?v=passive-feedback-1';
import {masterArtwork} from './master-cutin.mjs?v=changan-bonus-2';
import {createSoundPreview} from './audio.mjs?v=changan-bonus-2';
import {passiveName} from './passive-feedback.mjs?v=passive-feedback-1';
let dialog,player,frame=0,origin,current,practiceView;
function stop(){cancelAnimationFrame(frame);player?.stop();if(dialog){dialog.dataset.playing='false';dialog.querySelector('[data-replay]').disabled=false}}
function mount(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.id='skillPreview';dialog.setAttribute('aria-labelledby','previewTitle');dialog.innerHTML='<header><small>演武場 · 技能展示</small><h2 id="previewTitle"></h2><p data-state></p></header><div class="preview-scroll"><div class="preview-stage"><img alt=""><div class="preview-art" aria-hidden="true"></div><span class="preview-passive"></span></div><p data-description></p><small data-note></small></div><footer><button data-replay class="gold-button">再看一次 ↻</button><button data-close class="quiet-button">返回營地</button></footer>';
 document.body.append(dialog);player=createSoundPreview();dialog.querySelector('[data-replay]').onclick=play;dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{stop();origin?.isConnected&&origin.focus({preventScroll:true})});dialog.addEventListener('cancel',stop);
 const background=()=>{if(dialog.open){stop();dialog.querySelector('[data-note]').textContent='預覽已暫停，按「再看一次」重新播放。'}};document.addEventListener('visibilitychange',()=>{if(document.hidden)background()});window.addEventListener('pagehide',background);
}
function play(){
 stop();if(!dialog.open||document.hidden)return;
 practiceView?.remove();practiceView=null;
 const {id,s,passive,level}=current,g=ALL_GENERALS[id],index=g.skills.indexOf(s),style=passive?MASTER_STYLES[id]:index===2?MASTER_STYLES[id]:skillPresentation(id,index),duration=passive?1500:3200;
 dialog.dataset.playing='true';dialog.dataset.tier=passive?'passive':String(s.level);dialog.querySelector('[data-replay]').disabled=true;
 dialog.style.setProperty('--preview-color',style.color);const art=dialog.querySelector('.preview-art'),portrait=dialog.querySelector('img'),cue=dialog.querySelector('.preview-passive');
 art.innerHTML=passive?'<svg viewBox="0 0 300 140"><circle cx="150" cy="70" r="40"/><path d="M140 70h20m-10 -10v20"/></svg>':`<svg viewBox="0 0 300 140">${index===2?masterArtwork(style.motif):skillArtwork(style.motif)}</svg>`;
 cue.textContent=passive?`✦ ${passiveName(s)} · 自動生效`:'';
 dialog.querySelector('[data-note]').textContent=passive?'被動提示示意：戰鬥中以小提示與光效提醒，不播放音效。':'沿用戰鬥招式特效與音效；遵循音效開關。預覽不消耗 MP，也不會提前學會。';
 const practice=passive?null:createPractice(id,index,level);if(practice)practiceView=mountPractice(dialog.querySelector('.preview-stage'),practice);
 if(practice)dialog.querySelector('[data-note]').textContent='練習場沿用技能實際計算；不消耗存檔資源。補血不超過生命上限，護盾會先擋傷害。';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,start=performance.now();
 function draw(now){if(!dialog.open)return;const age=now-start;if(practice){if(age>=650&&!practice.cast){castPractice(practice);practiceView.report();void player.play(index===2?'master-'+id:`skill-${id}-${index}`)}if(age>=1800&&!practice.struck){strikePracticeShield(practice);practiceView.report()}practiceView.render(age)}const p=Math.min(1,(now-start)/duration);art.style.opacity=String(practice?(age<650?0:age<1350?Math.min(1,(1350-age)/200):0):(p>.8?(1-p)*5:1));art.style.transform=`scale(${reduced?1:passive?.85+p*.15:index===2?.65+p*.8:.75+p*.35})`;art.querySelector('svg').style.strokeDashoffset=String(reduced?0:150*(1-Math.min(1,p*3)));portrait.style.transform=`translateX(${reduced?0:-20*Math.max(0,1-p*5)}px)`;cue.style.opacity=passive?String(Math.min(1,(1-p)*5)):'0';if(p<1)frame=requestAnimationFrame(draw);else stop()}
 frame=requestAnimationFrame(draw);
}
export function previewSkill(id,s,passive,level,trigger){
 mount();stop();origin=trigger;current={id,s,passive,level};dialog.querySelector('[data-close]').textContent=trigger?.closest('#deployment')?'返回選將':trigger?.closest('#skillGuide')?'返回技能介紹':'返回營地';const g=ALL_GENERALS[id];dialog.querySelector('h2').textContent=`${g.name} · ${passive?passiveName(s):s.name}`;dialog.querySelector('[data-state]').textContent=`${passive?'被動 · 自動生效':'主動技能'} · Lv.${s.level} ${level>=s.level?'已學會':'解鎖（尚未學會）'}`;paintPortrait(dialog.querySelector('img'),g);dialog.querySelector('img').alt=g.name;dialog.querySelector('[data-description]').textContent=passive?s.text:activeText(g,s,Math.max(level,s.level));if(!dialog.open)dialog.showModal();dialog.querySelector('[data-close]').focus();play();
}
export function previewButton(id,s,passive,level){const b=document.createElement('button');b.className='quiet-button skill-preview-button';b.type='button';b.dataset.preview=`${id}:${passive?'passive':'active'}:${s.level}`;b.textContent=`${passive?'被動':'主動'}｜${passive?passiveName(s):s.name} · Lv.${s.level}${level<s.level?' 🔒':' ✓'}`;b.setAttribute('aria-label',`${passive?passiveName(s):s.name}，Lv.${s.level}，${level<s.level?'尚未學會':'已學會'}，查看介紹與展示`);b.onclick=()=>previewSkill(id,s,passive,level,b);return b}

export function skillButtons(id,g,level){const list=document.createElement('div');list.className='compact-skill-list';for(const s of g.skills)list.append(previewButton(id,s,false,level));for(const s of g.passives)list.append(previewButton(id,s,true,level));return list}
