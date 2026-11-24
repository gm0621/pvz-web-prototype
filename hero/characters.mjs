import {GENERALS} from './roster.mjs?v=chapter-fifteen-1';
import {WEATHER_GENERALS} from './weather-generals.mjs?v=passive-feedback-1';
import {HEROES,STAGES,ENEMY_ART,enemyArt} from './story.mjs?v=chapter-fifteen-1';
import {BLANK_PORTRAIT,FACTIONS,factionFor,enemyPortrait,paintPortrait} from './factions.mjs?v=chapter-fifteen-1';
const fifthPortraits=['董卓','王允','荀彧','程昱','陳宮','鮑信'].map((name,i)=>({name,aliases:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-five.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:['掌權於洛陽、長安的軍閥','參與誅董卓的朝臣','守住鄄城的曹操軍謀士','協助保全兗州據點的謀士','迎呂布入兗州的謀士','迎曹操領兗州、戰死壽張的盟友'][i]}));
const sixthPortraits=['漢獻帝','袁術','典韋','曹昂','曹安民','賈詡','郭嘉','荀攸','棗祗'].map((name,i)=>({name,aliases:name==='漢獻帝'?['漢獻帝','劉協']:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-six.png',row:Math.floor(i/3),col:i%3,role:['東漢皇帝・輾轉遷到許縣','淮南軍閥・197 年稱帝','曹操護衛・宛城遇害','曹操長子・宛城遇害','曹操的侄子・宛城遇害','張繡的謀士・後歸曹操','曹操軍謀士・參與下邳之計','曹操軍謀士・參與下邳之計','推動屯田的官員'][i]}));
const seventhPortraits=['袁紹','顏良','文醜','許攸','張遼','淳于瓊'].map((name,i)=>({name,aliases:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-seven.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:['河北軍閥・官渡敗退','袁紹部將・白馬戰死','袁紹部將・延津戰死','由袁紹轉投曹操的謀士','白馬先鋒・與關羽同戰','袁軍糧屯守將・烏巢戰敗'][i]}));
const eighthPortraits=['袁譚','袁尚','審配','辛毗','劉表'].map((name,i)=>({name,aliases:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-eight.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:['袁紹長子・與弟弟袁尚爭奪勢力','袁紹之子・繼掌父親勢力','袁尚部下・守衛鄴城','袁譚的使者・前往曹操軍求援','荊州牧・劉備曾投奔他'][i]}));
const ninthPortraits=["高幹", "袁熙", "田疇", "蹋頓", "公孫康"].map((name,i)=>({name,aliases:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-nine.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:["袁紹外甥・并州起兵", "袁紹之子・與袁尚北走", "北征嚮導・指出盧龍舊路", "烏桓首領・白狼山戰死", "遼東掌權者・袁氏兄弟投奔對象"][i]}));
const tenthPortraits=["劉琮", "趙雲", "諸葛亮", "孫權", "周瑜", "魯肅"].map((name,i)=>({name,aliases:[name,...({趙雲:['子龍'],諸葛亮:['孔明'],孫權:['仲謀'],周瑜:['公瑾'],魯肅:['子敬']}[name]||[])],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-ten.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:["劉表之子・荊州歸降", "劉備部將・長坂護人", "劉備的謀士・出使孫權", "江東領袖・決定抗曹", "孫權軍統帥・赤壁抗曹", "孫權的謀士・聯絡劉備"][i]}));
const eleventhPortraits=['馬超','韓遂','許褚','徐晃','曹丕'].map((name,i)=>({name,aliases:[name,...({馬超:['孟起'],韓遂:['文約'],許褚:['仲康'],徐晃:['公明'],曹丕:['子桓']}[name]||[])],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-eleven.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:['關中將領・潼關迎戰曹操','關中將領・與馬超聯合','曹操護衛・危急渡河護主','曹操部將・渡河設營','曹操之子・留守鄴城'][i]}));
export const STORY_PEOPLE=[
 {name:'吳班',aliases:['吳班','元雄'],asset:'./assets/portraits/wu-ban.webp',role:'劉備部將・巫縣先鋒'},
 {name:'馮習',aliases:['馮習','休元'],asset:'./assets/portraits/feng-xi.webp',role:'劉備部將・在夷陵戰死'},
 {name:'黃權',aliases:['黃權','公衡'],asset:'./assets/portraits/huang-quan.webp',role:'劉備部將・守江北，後因歸路被截降魏'},
 {name:'孫桓',aliases:['孫桓','叔武'],asset:'./assets/portraits/sun-huan.webp',role:'孫權部將・受圍仍守住夷道'},
 {name:'龐德',aliases:['龐德','令明'],asset:'./assets/portraits/pang-de.webp',role:'曹操軍將領・漢水暴漲後拒降'},
 {name:'呂蒙',aliases:['呂蒙','子明'],asset:'./assets/portraits/lu-meng.webp',role:'孫權部將・取得公安與江陵'},
 {name:'陸遜',aliases:['陸遜','伯言'],asset:'./assets/portraits/lu-xun.webp',role:'孫權部將・進取宜都'},
 {name:'關平',aliases:['關平'],asset:'./assets/portraits/guan-ping.webp',role:'關羽之子・隨軍至麥城'},
 {...GENERALS.yujin,aliases:['于禁','文則'],role:'曹操軍援將・漢水暴漲後投降'},
 {name:'張郃',aliases:['張郃','儁乂','雋乂'],asset:'./assets/portraits/zhang-he.webp',role:'曹操軍將領・在瓦口退回南鄭'},
 {name:'陳式',aliases:['陳式'],asset:'./assets/portraits/chen-shi.webp',role:'劉備部將・曾試圖切斷馬鳴閣道'},
 {name:'黃忠',aliases:['黃忠','漢升'],asset:'./assets/portraits/huang-zhong.webp',role:'劉備軍將領・定軍山從高處出擊'},
 {name:'法正',aliases:['法正','孝直'],asset:'./assets/portraits/fa-zheng.webp',role:'劉備的謀士・看準定軍山出擊時機'},
 {name:'張魯',aliases:['張魯','公祺'],asset:'./assets/portraits/zhang-lu.webp',role:'漢中主事者・退往巴中後歸降'},
 ...eleventhPortraits,...tenthPortraits,{...HEROES.liubei,aliases:['劉備','玄德'],role:'劉備軍領袖・長坂後與孫權合作'},{...HEROES.zhangfei,aliases:['張飛','翼德'],role:'劉備的夥伴・長坂斷後'},{...FACTIONS.sun.heroes.guanyu,aliases:['程普'],role:'孫氏將領・與周瑜等抗曹'},{...FACTIONS.sun.heroes.zhangfei,aliases:['黃蓋'],role:'孫氏將領・赤壁提出火攻'},...ninthPortraits,...eighthPortraits,...seventhPortraits,{...HEROES.guanyu,aliases:['關羽','雲長'],role:'劉備的夥伴・白馬斬顏良'},
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
export function battleBossPortrait(name,level){
 const opponent=STAGES[level-1].opponentName;
 return (level===75&&name===opponent&&STORY_PEOPLE.find(p=>p.name===name))||enemyPortrait(name,level)||{asset:enemyArt(name)};
}
export function stagePeople(level){
 const stage=STAGES[level-1],faction=factionFor(level),leader=STORY_PEOPLE.find(p=>p.name===stage.leaderName)||(faction?FACTIONS[faction].heroes.liubei:HEROES.liubei);
 const fallback={name:stage.bossName,asset:stage.noBoss?ENEMY_ART:enemyArt(stage.bossName)};
 const opponent=STORY_PEOPLE.find(p=>p.name===stage.opponentName)||(stage.chapter>=13&&stage.noBoss?fallback:enemyPortrait(stage.bossName,level)||fallback);
 return {leader,opponent,supports:level===8?Object.values(WEATHER_GENERALS):[],relation:stage.matchupLabel||(stage.opponentName?(['withdraw','decoy'].includes(stage.mission)?'保全撤離・對方主事者（劇情）':'對方主事者・劇情人物'):['withdraw','decoy'].includes(stage.mission)?'保全撤離・追擊方':stage.noBoss?'本關遭遇':'本關對手')};
}
// Nested SVG viewports select the existing atlas cell without creating new bitmap assets.
export function mapPersonSvg(person,kind,x,y){
 const image=person.atlas?`<svg x="-27" y="-29" width="54" height="54" viewBox="${(person.col||0)*100} ${person.row*100} 100 65"><image href="${person.atlas}" width="300" height="${person.atlasRows===2?200:300}"/></svg>`:`<svg x="-27" y="-29" width="54" height="54" viewBox="15 0 70 65"><image href="${person.asset}" width="100" height="100"/></svg>`;
 return `<g class="map-person ${kind}" data-person="${person.name}" transform="translate(${x} ${y})"><title>${person.name}</title><path d="M-6 26L0 34 6 26"/><circle r="29"/>${image}<text y="46" text-anchor="middle">${person.name}</text></g>`;
}
export function renderMatchup(root,level){const {leader,opponent,supports,relation}=stagePeople(level);root.replaceChildren();for(const [person,label] of [[leader,'目前軍隊'],[opponent,relation],...supports.map(p=>[p,`支援將・${p.lane===0?'上路':'下路'}`])]){const card=document.createElement('div');card.className='map-side';card.setAttribute('data-side',person===leader?'army':'enemy');const img=document.createElement('img');paintPortrait(img,person);img.alt=person.name;const copy=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');small.textContent=label;strong.textContent=person.name;copy.append(small,strong);card.append(img,copy);root.append(card)}}
