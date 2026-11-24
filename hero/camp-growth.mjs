import {previewButton,skillButtons} from './skill-preview.mjs?v=chapter-eighteen-3';
import {LEVEL_XP,heroLevel,nextLesson,activeText} from './roster.mjs?v=chapter-eighteen-3';
import {paintPortrait} from './factions.mjs?v=chapter-eighteen-3';
const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e};
// Read-only cards: use the same thresholds and skill definitions as battle rewards.
export function campGrowthCard(id,g,xp,weapon,summary){
 const level=heroLevel(xp),max=level===LEVEL_XP.length,base=LEVEL_XP[level-1],needed=max?0:LEVEL_XP[level]-base,earned=xp-base,lesson=nextLesson(g,level);
 const card=el('article');card.className='camp-hero camp-growth-card';card.dataset.hero=id;
 const portrait=el('img');paintPortrait(portrait,g);portrait.alt=g.name;
 const body=el('div');body.className='camp-growth-body';body.append(el('h4',`${g.name} · Lv.${level}`));
 const bar=el('div');bar.className='camp-growth-track';bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',`${g.name}升級經驗`);bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(max?1:needed));bar.setAttribute('aria-valuenow',String(max?1:earned));bar.setAttribute('aria-valuetext',max?'已達滿級':`${earned}／${needed}，還差 ${needed-earned} 經驗升到 Lv.${level+1}`);
 const fill=el('i');fill.style.width=`${max?100:earned/needed*100}%`;bar.append(fill);body.append(bar,el('p',max?'★ 已達滿級！':`本級經驗 ${earned}／${needed} · 還差 ${needed-earned} 升到 Lv.${level+1}`));
 const goal=el('section');goal.className='camp-growth-goal';
 if(lesson){
  goal.append(el('strong',`下一招 · Lv.${lesson}（還差 ${LEVEL_XP[lesson-1]-xp} 經驗）`));
  if(lesson>level+1)goal.append(el('small',`Lv.${level+1} 先提升體力與普攻，再往新招前進！`));
  for(const s of g.skills.filter(s=>s.level===lesson))goal.append(previewButton(id,s,false,level));
  for(const s of g.passives.filter(s=>s.level===lesson))goal.append(previewButton(id,s,true,level));
 }else goal.append(el('strong','全部招式已學會！'),el('small','帶著拿手絕招，繼續幫助夥伴吧。'));
 body.append(goal,el('small',`兵器強化 ${weapon}／3`));
 const details=el('details');details.append(el('summary','點技能，看介紹與展示'),skillButtons(id,g,level));body.append(details);card.append(portrait,body);return card;
}
