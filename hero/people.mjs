import {ALL_GENERALS as GENERALS} from './roster.mjs?v=yuesui-wukou-taoxi-1';
import {skillSummary} from './roster-view.mjs?v=hero-audio-settings-1';
import {PEOPLE,searchPeople} from './people-data.mjs?v=yuesui-wukou-taoxi-1';
import {paintPortrait} from './factions.mjs?v=yuesui-wukou-taoxi-1';
import {STAGES,chapterInfo} from './story.mjs?v=yuesui-wukou-taoxi-1';
import {historyEntries} from './people-history.mjs?v=hero-people-sources-1';
import {storyScenes} from './people-stories.mjs?v=hero-all-people-stories-1';

const $=id=>document.getElementById(id);
const node=(tag,text,className)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e};
const stages=STAGES.map((stage,i)=>{
 const level=i+1,{chapter,title}=chapterInfo(level);
 // The first chapter's prologue sets the story in 184. The next two have no exact dates.
 return {level,chapter,title,name:stage.name,year:stage.year??(chapter===1?184:null)};
});
const eras=new Map();
for(const stage of stages){
 if(!eras.has(stage.chapter))eras.set(stage.chapter,[]);
 eras.get(stage.chapter).push(stage);
}
const undatedEras={2:'黃巾戰事',3:'原創支線'};
const generalsByName=new Map(Object.values(GENERALS).map(g=>[g.name,g]));
let kind='all';

function eraLabel(entries){
 const years=entries.flatMap(stage=>stage.year?[stage.year]:[]);
 if(!years.length)return undatedEras[entries[0].chapter]||'未標年份';
 const first=Math.min(...years),last=Math.max(...years);
 return first===last?`${first} 年`:`${first}–${last} 年`;
}

function renderAppearanceList(levels){
 const groups=new Map();
 for(const level of levels){
  const stage=stages[level-1];
  if(!groups.has(stage.chapter))groups.set(stage.chapter,[]);
  groups.get(stage.chapter).push(stage);
 }
 const timeline=node('ul',null,'appearance-timeline stage-pills');
 for(const entries of groups.values()){
  const entry=node('li');
  entry.append(node('div',`${eraLabel(entries)} · ${entries[0].title}`,'appearance-period'));
  const pills=node('div',null,'stage-row');
  for(const stage of entries)pills.append(node('span',`第 ${stage.level} 關`));
  entry.append(pills);
  timeline.append(entry);
 }
 return timeline;
}

function renderHistoryEvents(entries){
 const timeline=node('ol',null,'history-events');
 for(const {label,text,source} of entries){
  const item=node('li');
  item.append(node('strong',label),node('p',text));
  if(source){
   const link=node('a',source.title);
   link.href=source.url;
   link.target='_blank';
   link.rel='noopener';
   item.append(link);
  }
  timeline.append(item);
 }
 return timeline;
}

function personDialog(person,portrait,label,type,content){
 const id=`person-${PEOPLE.indexOf(person)}-${type}`;
 const button=node('button',label,'person-detail-button');
 button.type='button';
 button.setAttribute('aria-haspopup','dialog');
 button.setAttribute('aria-controls',id);
 const dialog=node('dialog',null,'person-dialog');
 dialog.id=id;
 dialog.setAttribute('aria-labelledby',`${id}-title`);
 const header=node('header',null,'person-dialog-header');
 const picture=node('span',null,'person-dialog-portrait');
 picture.setAttribute('aria-hidden','true');
 const titles=node('div');
 const title=node('h2',person.name);
 title.id=`${id}-title`;
 titles.append(node('p',label),title);
 const close=node('button','關閉','person-dialog-close');
 close.type='button';
 close.autofocus=true;
 header.append(picture,titles,close);
 dialog.append(header,content);
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('close',()=>button.focus({preventScroll:true}));
 close.onclick=()=>dialog.close();
 button.onclick=()=>{
  picture.style.backgroundImage=`url("${portrait.src}")`;
  dialog.showModal();
  content.scrollTop=0;
 };
 return [button,dialog];
}

function renderHistory(person,portrait){
 const historical=person.kind==='史實人物';
 const label=historical?'詳細歷史':person.kind==='演義人物'?'演義故事':'遊戲故事';
 const content=node('div',null,'person-dialog-content history-panel');
 const story=node('div',null,'person-story');
 const scenes=storyScenes(person);
 for(const [heading,text] of scenes){
  const scene=node('section',null,'person-story-scene');
  if(heading)scene.append(node('h3',heading));
  scene.append(node('p',text));
  story.append(scene);
 }
 content.append(story,node('p',person.remember,'memory'));
 const records=node('details',null,'person-records');
 records.append(node('summary',historical?'史料與登場關卡':'故事背景與登場關卡'));
 if(scenes[0]?.[0])records.append(node('p',person.intro));
 const notes=node('div',null,'history-notes');
 records.append(node('p',person.note,'note'),notes);
 if(person.levels.length){
  records.append(node('p','登場或被提到的關卡','stage-label'),renderAppearanceList(person.levels));
 }else records.append(node('p','延伸認識的人物'));
 content.append(records);
 if(historical)records.addEventListener('toggle',function populate(){
  if(!records.open)return;
  records.removeEventListener('toggle',populate);
  const entries=historyEntries(person,STAGES);
  const previewSize=6;
  notes.append(node('h3','史書中的事蹟'),renderHistoryEvents(entries.slice(0,previewSize)));
  if(entries.length>previewSize){
   const more=node('details');
   more.append(node('summary',`更多史料（${entries.length-previewSize} 則）`),renderHistoryEvents(entries.slice(previewSize)));
   notes.append(more);
  }
 });
 return personDialog(person,portrait,label,'history',content);
}

function renderCard(person){
 const card=node('article',null,'person-card');
 card.dataset.person=person.name;
 const top=node('div',null,'person-top'),disc=node('div',null,'portrait-disc'),img=node('img');
 paintPortrait(img,person.portrait);
 img.alt=person.name;
 img.loading='lazy';
 disc.append(img);
 const heading=node('div');
 heading.append(node('span',person.kind==='遊戲原創'?'遊戲原創（虛構人物）':person.kind,'kind-tag'),node('h3',person.name,'person-name'));
 const first=stages[person.levels[0]-1];
 if(first){
  const moment=first.year?`${first.year} 年 · `:'';
  heading.append(node('p',`首次出現 · ${moment}第 ${first.level} 關 ${first.name}`,'first-appearance'));
 }
 top.append(disc,heading);

 const body=node('div',null,'person-body');
 body.append(node('h4',person.title));
 const actions=node('div',null,'person-actions');
 actions.append(...renderHistory(person,img));
 const general=generalsByName.get(person.name);
 if(general){
  const army=general.faction==='cao'?'曹操軍':general.faction==='sun'?'孫堅軍':'劉備軍';
  const skills=node('div',null,'person-dialog-content skill-panel');
  skills.append(node('p',`${army}可出戰 · ${general.role}`,'skill-intro'));
  const list=node('ul',null,'skill-list');
  for(const line of skillSummary(general,1).split('\n'))list.append(node('li',line));
  skills.append(list);
  actions.append(...personDialog(person,img,'遊戲技能','skills',skills));
 }
 body.append(actions);
 card.append(top,body);
 return card;
}

function render(){
 const query=$('peopleSearch').value.trim().normalize('NFKC').toLocaleLowerCase();
 const matches=searchPeople(query,kind);
 // A full name or alias should find its owner before incidental mentions in other bios.
 const named=matches.filter(person=>[person.name,...person.aliases].some(name=>name.normalize('NFKC').toLocaleLowerCase()===query));
 const people=(named.length?named:matches).sort((a,b)=>(a.levels[0]??Infinity)-(b.levels[0]??Infinity));
 $('peopleCount').textContent=`找到 ${people.length} 位人物 · 共 ${PEOPLE.length} 位`;
 $('peopleEmpty').hidden=people.length>0;
 const groups=new Map();
 for(const person of people){
  const chapter=stages[person.levels[0]-1]?.chapter??0;
  if(!groups.has(chapter))groups.set(chapter,[]);
  groups.get(chapter).push(person);
 }
 const sections=[];
 for(const [chapter,people] of groups){
  const entries=eras.get(chapter);
  const section=node('section',null,'people-era');
  const title=entries?`${eraLabel(entries)} · ${entries[0].title}`:'延伸認識';
  const heading=node('h2',title,'era-heading');
  heading.id=`people-era-${chapter}`;
  section.setAttribute('aria-labelledby',heading.id);
  const grid=node('div',null,'people-grid');
  grid.append(...people.map(renderCard));
  section.append(heading,grid);
  sections.push(section);
 }
 $('peopleGrid').replaceChildren(...sections);
}

$('peopleSearch').addEventListener('input',render);
$('clearSearch').onclick=()=>{$('peopleSearch').value='';kind='all';syncFilters();render();$('peopleSearch').focus()};
function syncFilters(){for(const button of document.querySelectorAll('[data-kind]'))button.setAttribute('aria-pressed',String(button.dataset.kind===kind))}
for(const button of document.querySelectorAll('[data-kind]'))button.onclick=()=>{kind=button.dataset.kind;syncFilters();render()};
render();
