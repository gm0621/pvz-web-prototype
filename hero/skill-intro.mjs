import {ALL_GENERALS} from './roster.mjs?v=sun-growth-1';
import {paintPortrait} from './factions.mjs?v=sun-growth-1';
// One small lesson at a time. Reading freezes the same battle clock as Pause.
export function mountSkillIntro({getBattle,getProgress,save,setPaused}){
 const dialog=document.createElement('dialog');dialog.id='skillIntro';dialog.setAttribute('aria-labelledby','skillIntroTitle');
 dialog.innerHTML='<div class="skill-intro-body"><span class="skill-intro-kicker"></span><div class="skill-intro-hero"><img alt=""><h2 id="skillIntroTitle"></h2></div><div class="skill-intro-copy"></div></div><footer><p class="skill-intro-how">被動自動生效；主動請點武將 → 按技能。</p><button id="skillIntroContinue" class="gold-button">知道了，繼續戰鬥 →</button></footer>';
 document.body.append(dialog);let queue=[],source,wasPaused=false,interrupted=false,focusBefore;
 const sessionSeen=new Set();
 function render(){const item=queue[0],g=ALL_GENERALS[item.id];dialog.dataset.hero=item.id;dialog.dataset.kind=item.upgrade?'upgrade':'arrival';dialog.querySelector('.skill-intro-kicker').textContent=item.upgrade?'升級！學會新招':'首次出場 · 認識武將';dialog.querySelector('h2').textContent=`${g.name} · Lv.${item.level}`;const img=dialog.querySelector('img');paintPortrait(img,g);img.alt=g.name;const copy=dialog.querySelector('.skill-intro-copy');copy.replaceChildren();const line=(title,text)=>{const p=document.createElement('p'),b=document.createElement('strong');b.textContent=title+'｜';p.append(b,text);copy.append(p)};
  if(!item.upgrade)line('被動・自動',g.passive);
  for(const skill of g.skills.filter(s=>s.level<=item.level&&(!item.upgrade||s.level>item.before)))line('主動・'+skill.name,`${skill.text}（${skill.mp} MP）`);
  if(item.level<3)line('下一招',`Lv.3 學會「${g.skills[1].name}」。`);
  dialog.querySelector('button').textContent=queue.length>1?'下一位 →':item.upgrade?'記住了，看戰報 →':'知道了，繼續戰鬥 →';dialog.querySelector('.skill-intro-body').scrollTop=0;
 }
 function open(items){if(!items.length||dialog.open)return;queue=items;source=getBattle();wasPaused=!!source?.paused;interrupted=false;focusBefore=document.activeElement;setPaused(true);render();dialog.showModal();dialog.querySelector('button').focus({preventScroll:true})}
 function acknowledge(){const item=queue.shift();if(!item)return;const p=getProgress(),old=p.skillSeen;const keys=ALL_GENERALS[item.id].skills.filter(s=>s.level<=item.level).map(s=>item.id+':'+s.level);keys.forEach(k=>sessionSeen.add(k));p.skillSeen=[...new Set([...old,...keys])];if(!save())p.skillSeen=old;if(queue.length)render();else dialog.close()}
 dialog.querySelector('button').onclick=acknowledge;dialog.addEventListener('cancel',event=>{event.preventDefault();acknowledge()});dialog.addEventListener('close',()=>{if(dialog.open)return;queue=[];if(getBattle()===source&&!source?.over)setPaused(wasPaused||interrupted||document.hidden);if(focusBefore?.isConnected)focusBefore.focus({preventScroll:true})});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)interrupted=true});window.addEventListener('pagehide',()=>{if(dialog.open)interrupted=true});
 return {check(){const b=getBattle();if(!b?.heroMode||b.over||b.paused||b.duel||b.introPending||document.querySelector('dialog[open]'))return;const p=getProgress();const unit=b.allies.find(u=>{const g=b.roster[u.key];return u.hp>0&&g?.heroId&&g.skills.some(s=>s.level<=g.heroLevel&&!p.skillSeen.includes(g.heroId+':'+s.level)&&!sessionSeen.has(g.heroId+':'+s.level))});if(unit){const g=b.roster[unit.key];open([{id:g.heroId,level:g.heroLevel}])}},upgrades(changes){open(changes.filter(x=>ALL_GENERALS[x.id].skills.some(s=>s.level>x.before&&s.level<=x.level)).map(x=>({...x,upgrade:true})))}};
}
