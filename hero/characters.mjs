import {HEROES,STAGES,enemyArt} from './story.mjs?v=history-coalition-1';
import {FACTIONS,factionFor,enemyPortrait,paintPortrait} from './factions.mjs?v=history-coalition-1';
export const STORY_PEOPLE=[
 {name:'盧植',aliases:['盧植','盧公'],asset:'./assets/portraits/lu-zhi.webp?v=portrait-web-1',role:'劉備的老師・在廣宗討伐黃巾'},
 {name:'皇甫嵩',aliases:['皇甫嵩'],asset:'./assets/portraits/huangfu-song.webp?v=portrait-web-1',role:'朝廷將領・長社火攻的指揮者'},
 {name:'朱儁',aliases:['朱儁'],asset:'./assets/portraits/zhu-jun.webp?v=portrait-web-1',role:'朝廷將領・與皇甫嵩共同討黃巾'},
 {...FACTIONS.cao.heroes.liubei,aliases:['曹操'],role:'曹操軍主將'},
 {...FACTIONS.sun.heroes.liubei,aliases:['孫堅'],role:'孫堅軍主將'},
 {name:'張角',aliases:['張角'],asset:enemyArt('張角'),role:'黃巾領袖・大賢良師'},
 {name:'張梁',aliases:['張梁'],asset:enemyArt('張梁'),role:'黃巾將領・人公將軍'},
 {name:'張寶',aliases:['張寶'],asset:enemyArt('張寶'),role:'黃巾將領・地公將軍'}
];
export function mentionedPeople(text,speaker=''){return STORY_PEOPLE.filter(p=>p.name!==speaker&&p.aliases.some(alias=>text.includes(alias)))}
export function renderPeople(root,text,speaker=''){
 const people=mentionedPeople(text,speaker);root.hidden=!people.length;root.replaceChildren();
 if(!people.length)return;
 const label=document.createElement('small');label.className='people-label';label.textContent='這句提到的人物';root.append(label);
 for(const person of people){const card=document.createElement('div');card.className='person-note';const img=document.createElement('img');paintPortrait(img,person);img.alt=person.name;const copy=document.createElement('div'),name=document.createElement('strong'),role=document.createElement('small');name.textContent=person.name;role.textContent=person.role;copy.append(name,role);card.append(img,copy);root.append(card)}
}
export function stagePeople(level){
 const stage=STAGES[level-1],faction=factionFor(level),leader=faction?FACTIONS[faction].heroes.liubei:HEROES.liubei;
 return {leader,opponent:enemyPortrait(stage.bossName,level)||{name:stage.bossName,asset:enemyArt(stage.bossName)},relation:[19,20].includes(level)?'保全撤離・追擊方':stage.noBoss?'本關遭遇':'本關對手'};
}
// Nested SVG viewports select the existing atlas cell without creating new bitmap assets.
export function mapPersonSvg(person,kind,x,y){
 const image=person.atlas?`<svg x="-27" y="-29" width="54" height="54" viewBox="0 ${person.row*100} 100 65"><image href="${person.atlas}" width="300" height="300"/></svg>`:`<svg x="-27" y="-29" width="54" height="54" viewBox="15 0 70 65"><image href="${person.asset}" width="100" height="100"/></svg>`;
 return `<g class="map-person ${kind}" data-person="${person.name}" transform="translate(${x} ${y})"><title>${person.name}</title><path d="M-6 26L0 34 6 26"/><circle r="29"/>${image}<text y="46" text-anchor="middle">${person.name}</text></g>`;
}
export function renderMatchup(root,level){const {leader,opponent,relation}=stagePeople(level);root.replaceChildren();for(const [person,label] of [[leader,'目前軍隊'],[opponent,relation]]){const card=document.createElement('div');card.className='map-side';const img=document.createElement('img');paintPortrait(img,person);img.alt=person.name;const copy=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');small.textContent=label;strong.textContent=person.name;copy.append(small,strong);card.append(img,copy);root.append(card)}}
