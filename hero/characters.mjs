import {WEATHER_GENERALS} from './weather-generals.mjs?v=history-coalition-1';
import {HEROES,STAGES,ENEMY_ART,enemyArt} from './story.mjs?v=cao-people-1';
import {BLANK_PORTRAIT,FACTIONS,factionFor,enemyPortrait,paintPortrait} from './factions.mjs?v=chapter-six-1';
const fifthPortraits=['董卓','王允','荀彧','程昱','陳宮','鮑信'].map((name,i)=>({name,aliases:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-five.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:['掌權於洛陽、長安的軍閥','參與誅董卓的朝臣','守住鄄城的曹操軍謀士','協助保全兗州據點的謀士','迎呂布入兗州的謀士','迎曹操領兗州、戰死壽張的盟友'][i]}));
const sixthPortraits=['漢獻帝','袁術','典韋','曹昂','曹安民','賈詡','郭嘉','荀攸','棗祗'].map((name,i)=>({name,aliases:name==='漢獻帝'?['漢獻帝','劉協']:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-six.png',row:Math.floor(i/3),col:i%3,role:['東漢皇帝・輾轉遷到許縣','淮南軍閥・197 年稱帝','曹操護衛・宛城遇害','曹操長子・宛城遇害','曹操的侄子・宛城遇害','張繡的謀士・後歸曹操','曹操軍謀士・參與下邳之計','曹操軍謀士・參與下邳之計','推動屯田的官員'][i]}));
export const STORY_PEOPLE=[
 {...FACTIONS.cao.heroes.zhangfei,aliases:['曹洪','子廉'],role:'曹操軍護衛・字子廉，與曹仁不同人'},
 {...FACTIONS.cao.heroes.guanyu,aliases:['夏侯惇','元讓'],role:'曹操軍將領・字元讓，與夏侯淵不同人'},
 {name:'曹仁',aliases:['曹仁','子孝'],asset:'./assets/portraits/cao-ren.png',role:'曹操軍將領・字子孝，與曹洪不同人'},
 {name:'夏侯淵',aliases:['夏侯淵','妙才'],asset:'./assets/portraits/xiahou-yuan.png',role:'早期跟隨曹操的將領・字妙才，與夏侯惇不同人'},...sixthPortraits,...fifthPortraits,{...enemyPortrait('張繡',31),aliases:['張繡'],role:'宛城將領・曾使曹操敗退'},{...enemyPortrait('橋蕤',32),aliases:['橋蕤'],role:'袁術部將・陳地迎戰曹操'},{...enemyPortrait('呂布',27),aliases:['呂布'],role:'飛將・與曹操爭奪兗州'},
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
 return {leader,opponent:enemyPortrait(stage.bossName,level)||{name:stage.bossName,asset:stage.noBoss?ENEMY_ART:enemyArt(stage.bossName)},supports:level===8?Object.values(WEATHER_GENERALS):[],relation:['withdraw','decoy'].includes(stage.mission)?'保全撤離・追擊方':stage.noBoss?'本關遭遇':'本關對手'};
}
// Nested SVG viewports select the existing atlas cell without creating new bitmap assets.
export function mapPersonSvg(person,kind,x,y){
 const image=person.atlas?`<svg x="-27" y="-29" width="54" height="54" viewBox="${(person.col||0)*100} ${person.row*100} 100 65"><image href="${person.atlas}" width="300" height="300"/></svg>`:`<svg x="-27" y="-29" width="54" height="54" viewBox="15 0 70 65"><image href="${person.asset}" width="100" height="100"/></svg>`;
 return `<g class="map-person ${kind}" data-person="${person.name}" transform="translate(${x} ${y})"><title>${person.name}</title><path d="M-6 26L0 34 6 26"/><circle r="29"/>${image}<text y="46" text-anchor="middle">${person.name}</text></g>`;
}
export function renderMatchup(root,level){const {leader,opponent,supports,relation}=stagePeople(level);root.replaceChildren();for(const [person,label] of [[leader,'目前軍隊'],[opponent,relation],...supports.map(p=>[p,`支援將・${p.lane===0?'上路':'下路'}`])]){const card=document.createElement('div');card.className='map-side';card.setAttribute('data-side',person===leader?'army':'enemy');const img=document.createElement('img');paintPortrait(img,person);img.alt=person.name;const copy=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');small.textContent=label;strong.textContent=person.name;copy.append(small,strong);card.append(img,copy);root.append(card)}}
