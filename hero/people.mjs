import {GENERALS} from './roster.mjs?v=dispatch-score-1';
import {skillSummary} from './roster-view.mjs?v=dispatch-score-1';
import {PEOPLE,searchPeople} from './people-data.mjs?v=dispatch-score-1';
import {paintPortrait} from './factions.mjs?v=dispatch-score-1';
const $=id=>document.getElementById(id);let kind='all';
const node=(tag,text,className)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e};
function render(){
 const people=searchPeople($('peopleSearch').value,kind);$('peopleCount').textContent=`找到 ${people.length} 位人物 · 共 ${PEOPLE.length} 位`;$('peopleEmpty').hidden=people.length>0;
 $('peopleGrid').replaceChildren(...people.map(p=>{const card=node('article',null,'person-card');card.dataset.person=p.name;const top=node('div',null,'person-top'),disc=node('div',null,'portrait-disc'),img=node('img');paintPortrait(img,p.portrait);img.alt=p.name;img.loading='lazy';disc.append(img);const heading=node('div');heading.append(node('span',p.kind==='遊戲原創'?'遊戲原創（虛構人物）':p.kind,'kind-tag'),node('h2',p.name));top.append(disc,heading);const body=node('div',null,'person-body');body.append(node('h3',p.title),node('p',p.intro));const details=node('details');details.append(node('summary','記憶小提示 · 在哪裡遇見他'),node('p',p.remember,'memory'),node('p',p.note,'note'),node('div','劇情、問答或營地提到的關卡','stage-label'));const levels=node('div',null,'stage-pills');if(p.levels.length)levels.append(...p.levels.map(n=>node('span',`第 ${n} 關`)));else levels.append(node('span','延伸認識的人物'));details.append(levels);body.append(details);const g=Object.values(GENERALS).find(g=>g.name===p.name);if(g){const tips=node('p','曹操軍可出戰 · '+g.role+'\n'+skillSummary(g,1),'skill-copy');body.append(tips)}card.append(top,body);return card}));
}
$('peopleSearch').addEventListener('input',render);$('clearSearch').onclick=()=>{$('peopleSearch').value='';kind='all';syncFilters();render();$('peopleSearch').focus()};
function syncFilters(){for(const button of document.querySelectorAll('[data-kind]'))button.setAttribute('aria-pressed',String(button.dataset.kind===kind))}
for(const button of document.querySelectorAll('[data-kind]'))button.onclick=()=>{kind=button.dataset.kind;syncFilters();render()};
render();
