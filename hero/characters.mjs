import {portraitForDisplay} from './portrait-expressions.mjs?v=gate-siege-cargo-2';
import {GENERALS} from './roster.mjs?v=gate-siege-cargo-2';
import {WEATHER_GENERALS} from './weather-generals.mjs?v=passive-feedback-1';
import {HEROES,STAGES,ENEMY_ART,enemyArt} from './story.mjs?v=gate-siege-cargo-2';
import {BLANK_PORTRAIT,FACTIONS,factionFor,enemyPortrait,paintPortrait} from './factions.mjs?v=gate-siege-cargo-2';
const fifthPortraits=['董卓','王允','荀彧','程昱','陳宮','鮑信'].map((name,i)=>({name,aliases:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-five.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:['掌權於洛陽、長安的軍閥','參與誅董卓的朝臣','守住鄄城的曹操軍謀士','協助保全兗州據點的謀士','迎呂布入兗州的謀士','迎曹操領兗州、戰死壽張的盟友'][i]}));
const sixthPortraits=['漢獻帝','袁術','典韋','曹昂','曹安民','賈詡','郭嘉','荀攸','棗祗'].map((name,i)=>({name,aliases:name==='漢獻帝'?['漢獻帝','劉協']:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-six.png',row:Math.floor(i/3),col:i%3,role:['東漢皇帝・輾轉遷到許縣','淮南軍閥・197 年稱帝','曹操護衛・宛城遇害','曹操長子・宛城遇害','曹操的侄子・宛城遇害','張繡的謀士・後歸曹操','曹操軍謀士・參與下邳之計','曹操軍謀士・參與下邳之計','推動屯田的官員'][i]}));
const seventhPortraits=['袁紹','顏良','文醜','許攸','張遼','淳于瓊'].map((name,i)=>({name,aliases:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-seven.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:['河北軍閥・官渡敗退','袁紹部將・白馬戰死','袁紹部將・延津戰死','由袁紹轉投曹操的謀士','白馬先鋒・與關羽同戰','袁軍糧屯守將・烏巢戰敗'][i]}));
const eighthPortraits=['袁譚','袁尚','審配','辛毗','劉表'].map((name,i)=>({name,aliases:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-eight.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:['袁紹長子・與弟弟袁尚爭奪勢力','袁紹之子・繼掌父親勢力','袁尚部下・守衛鄴城','袁譚的使者・前往曹操軍求援','荊州牧・劉備曾投奔他'][i]}));
const ninthPortraits=["高幹", "袁熙", "田疇", "蹋頓", "公孫康"].map((name,i)=>({name,aliases:[name],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-nine.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:["袁紹外甥・并州起兵", "袁紹之子・與袁尚北走", "北征嚮導・指出盧龍舊路", "烏桓首領・白狼山戰死", "遼東掌權者・袁氏兄弟投奔對象"][i]}));
const tenthPortraits=["劉琮", "趙雲", "諸葛亮", "孫權", "周瑜", "魯肅"].map((name,i)=>({name,aliases:[name,...({趙雲:['子龍'],諸葛亮:['孔明'],孫權:['仲謀'],周瑜:['公瑾'],魯肅:['子敬']}[name]||[])],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-ten.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:["劉表之子・荊州歸降", "劉備部將・長坂護人", "劉備的謀士・出使孫權", "江東領袖・決定抗曹", "孫權軍統帥・赤壁抗曹", "孫權的謀士・聯絡劉備"][i]}));
const eleventhPortraits=['馬超','韓遂','許褚','徐晃','曹丕'].map((name,i)=>({name,aliases:[name,...({馬超:['孟起'],韓遂:['文約'],許褚:['仲康'],徐晃:['公明'],曹丕:['子桓']}[name]||[])],asset:BLANK_PORTRAIT,atlas:'./assets/portraits/chapter-eleven.png',atlasRows:2,row:Math.floor(i/3),col:i%3,role:['關中將領・潼關迎戰曹操','關中將領・與馬超聯合','曹操護衛・危急渡河護主','曹操部將・渡河設營','曹操之子・留守鄴城'][i]}));
export const STORY_PEOPLE=[
 {name:'羊獻容',aliases:['羊獻容','羊皇后','惠羊后'],asset:'./assets/portraits/yang-xianrong.webp',role:'晉惠帝皇后・在宮廷角力中被廢'},
 {name:'司馬覃',aliases:['司馬覃','清河王'],asset:'./assets/portraits/sima-qin-jin.webp',role:'西晉清河王・幼年曾任太子'},
 {name:'嵇紹',aliases:['嵇紹','延祖','嵇侍中'],asset:'./assets/portraits/ji-shao-jin.webp',role:'西晉侍中・蕩陰護駕'},
 {name:'石超',aliases:['石超'],asset:'./assets/portraits/shi-chao-jin.webp',role:'成都王部將・奉命在蕩陰迎戰'},
 {name:'王浚',aliases:['王浚','彭祖','幽州王浚'],asset:'./assets/portraits/wang-jun-youzhou.webp',role:'幽州刺史・合兵進逼鄴城'},
 {name:'司馬乂',aliases:['司馬乂','士度','長沙王'],asset:'./assets/portraits/sima-yi-changsha.webp',role:'西晉長沙王・保衛晉惠帝'},
 {name:'鄭方',aliases:['鄭方','子回'],asset:'./assets/portraits/zheng-fang-jin.webp',role:'西晉讀書人・到洛陽勸諫齊王'},
 {name:'李含',aliases:['李含'],asset:'./assets/portraits/li-han-jin.webp',role:'西晉官員・說服河間王討伐齊王'},
 {name:'陸機',aliases:['陸機','士衡'],asset:'./assets/portraits/lu-ji-jin.webp',role:'西晉文人・受成都王委派統兵'},
 {name:'張方',aliases:['張方'],asset:'./assets/portraits/zhang-fang-jin.webp',role:'河間王部將・自關中進攻洛陽'},
 {name:'司馬越',aliases:['司馬越','元超','東海王'],asset:'./assets/portraits/sima-yue-jin.webp',role:'西晉東海王・參與拘押司馬乂'},
 {name:'董艾',aliases:['董艾'],asset:'./assets/portraits/dong-ai-jin.webp',role:'齊王部將・奉命進攻長沙王'},
 {name:'司馬顒',aliases:['司馬顒','文載','河間王'],asset:'./assets/portraits/sima-yong-jin.webp',role:'西晉河間王・先助趙王，後改支持齊王與成都王'},
 {name:'司馬冏',aliases:['司馬冏','景治','齊王'],asset:'./assets/portraits/sima-jiong.webp',role:'西晉齊王・由許昌起兵討趙'},
 {name:'司馬穎',aliases:['司馬穎','章度','成都王'],asset:'./assets/portraits/sima-ying.webp',role:'西晉成都王・由鄴城響應討趙'},
 {name:'盧志',aliases:['盧志','子道'],asset:'./assets/portraits/lu-zhi-jin.webp',role:'西晉謀士・協助成都王'},
 {name:'王輿',aliases:['王輿','左衛將軍'],asset:'./assets/portraits/wang-yu-jin.webp',role:'西晉左衛將軍・參與迎回晉惠帝'},
 {name:'張泓',aliases:['張泓','征虜將軍'],asset:'./assets/portraits/zhang-hong-jin.webp',role:'趙王部將・與齊王在潁陰交戰'},
 {name:'孫會',aliases:['孫會','孫秀之子'],asset:'./assets/portraits/sun-hui-jin.webp',role:'西晉將領・孫秀的兒子'},
 {name:'張華',aliases:['張華','茂先'],asset:'./assets/portraits/zhang-hua.webp',role:'西晉大臣・賈后掌權期間處理朝政'},
 {name:'裴頠',aliases:['裴頠','逸民'],asset:'./assets/portraits/pei-wei.webp',role:'西晉大臣・曾為司馬遹辯護'},
 {name:'司馬遹',aliases:['司馬遹','熙祖','愍懷太子'],asset:'./assets/portraits/sima-yu.webp',role:'晉惠帝的太子・被廢後送往許昌'},
 {name:'司馬倫',aliases:['司馬倫','子彝','趙王'],asset:'./assets/portraits/sima-lun.webp',role:'西晉趙王・301 年奪取皇位'},
 {name:'孫秀',aliases:['孫秀'],asset:'./assets/portraits/sun-xiu-jin.webp',role:'西晉謀士・協助趙王司馬倫掌權'},
 {name:'司馬允',aliases:['司馬允','淮南王'],asset:'./assets/portraits/sima-yun.webp',role:'西晉淮南王・在洛陽起兵反對趙王'},
 {name:'司馬衷',aliases:['司馬衷','正度','晉惠帝'],asset:'./assets/portraits/sima-zhong.webp',role:'晉武帝之子・290 年在洛陽即位'},
 {name:'楊駿',aliases:['楊駿'],asset:'./assets/portraits/yang-jun.webp',role:'晉惠帝即位後的輔政大臣'},
 {name:'賈南風',aliases:['賈南風','賈皇后','賈后'],asset:'./assets/portraits/jia-nanfeng.webp',role:'晉惠帝的皇后・參與洛陽的朝廷政變'},
 {name:'司馬亮',aliases:['司馬亮','子翼','汝南王'],asset:'./assets/portraits/sima-liang.webp',role:'西晉汝南王・與衛瓘共同輔政'},
 {name:'司馬瑋',aliases:['司馬瑋','彥度','楚王'],asset:'./assets/portraits/sima-wei.webp',role:'西晉楚王・捲入洛陽兩次政變'},
 {name:'羊祜',aliases:['羊祜','叔子'],asset:'./assets/portraits/yang-hu.webp',role:'西晉將領・駐守襄陽、屯田存糧'},
 {name:'陸抗',aliases:['陸抗','幼節'],asset:'./assets/portraits/lu-kang.webp',role:'東吳將領・陸遜之子、守住西陵'},
 {name:'步闡',aliases:['步闡'],asset:'./assets/portraits/bu-chan.webp',role:'東吳西陵守將・反叛並向西晉求援'},
 {name:'杜預',aliases:['杜預','元凱'],asset:'./assets/portraits/du-yu.webp',role:'西晉將領・接掌荊州、進軍江陵'},
 {name:'王濬',aliases:['王濬','王浚','士治'],mentionPattern:/王濬|士治/u,asset:'./assets/portraits/wang-jun.webp',role:'西晉水軍統帥・率船隊順長江伐吳'},
 {name:'孫皓',aliases:['孫皓','元宗','吳末帝'],asset:'./assets/portraits/sun-hao.webp',role:'東吳末代皇帝・在石頭城向王濬投降'},
 {name:'衛瓘',aliases:['衛瓘','伯玉','衞瓘'],asset:'./assets/portraits/wei-guan.webp',role:'魏朝官員・奉命處理鄧艾收押'},
 {name:'胡烈',aliases:['胡烈'],asset:'./assets/portraits/hu-lie.webp',role:'魏將・在成都被鍾會扣住'},
 {name:'郤正',aliases:['郤正','令先'],asset:'./assets/portraits/xi-zheng.webp',role:'蜀漢舊臣・隨劉禪遷居洛陽'},
 {name:'司馬炎',aliases:['司馬炎','安世','晉武帝'],asset:'./assets/portraits/sima-yan.webp',role:'西晉第一位皇帝・在洛陽接受魏帝讓位'},
 {name:'諸葛瞻',aliases:['諸葛瞻','思遠'],asset:'./assets/portraits/zhuge-zhan.webp',role:'諸葛亮之子・在綿竹迎戰鄧艾'},
 {name:'黃崇',aliases:['黃崇','黃祟'],asset:'./assets/portraits/huang-chong.webp',role:'蜀漢官員・主張先守險要'},
 {name:'諸葛尚',aliases:['諸葛尚'],asset:'./assets/portraits/zhuge-shang.webp',role:'諸葛瞻長子・與父親一同守綿竹'},
 {name:'譙周',aliases:['譙周','允南'],asset:'./assets/portraits/qiao-zhou.webp',role:'蜀漢大臣・在朝議中勸劉禪降魏'},
 {name:'鄧艾',aliases:['鄧艾','士載'],asset:'./assets/portraits/deng-ai.webp',role:'魏軍將領・段谷與侯和擊敗姜維'},
 {name:'鍾會',aliases:['鍾會','鐘會','士季'],asset:'./assets/portraits/zhong-hui.webp',role:'魏軍將領・攻劍閣受阻'},
 {name:'廖化',aliases:['廖化','元儉','廖淳'],asset:'./assets/portraits/liao-hua.webp',role:'蜀漢老將・支援姜維守劍閣'},
 {name:'張翼',aliases:['張翼','伯恭'],mentionPattern:/張翼(?!德)|伯恭/,asset:'./assets/portraits/zhang-yi.webp',role:'蜀漢將領・漢壽會師後守劍閣'},
 {name:'夏侯霸',aliases:['夏侯霸','仲權'],asset:'./assets/portraits/xiahou-ba.webp',role:'夏侯淵之子・由魏入蜀'},
 {name:'郭循',aliases:['郭循','郭脩'],asset:'./assets/portraits/guo-xun.webp',role:'原為魏人・費禕遇害事件相關人物'},
 {name:'陳泰',aliases:['陳泰','玄伯'],asset:'./assets/portraits/chen-tai.webp',role:'魏將・帶兵救援狄道'},
 {name:'王經',aliases:['王經','彥緯'],asset:'./assets/portraits/wang-jing.webp',role:'魏將・洮西敗退後守狄道'},
 {name:'魏延',aliases:['魏延','文長'],asset:'./assets/portraits/wei-yan.webp?v=expression-1',role:'蜀漢將領・曾鎮守漢中'},
 {name:'蔣琬',aliases:['蔣琬','公琰'],asset:'./assets/portraits/jiang-wan.webp?v=expression-1',role:'蜀漢大臣・接掌諸葛亮身後政務'},
 {name:'費禕',aliases:['費禕','文偉'],asset:'./assets/portraits/fei-yi.webp?v=expression-1',role:'蜀漢大將軍・率援軍救興勢'},
 {name:'曹爽',aliases:['曹爽','昭伯'],asset:'./assets/portraits/cao-shuang.webp?v=expression-1',role:'曹魏大將軍・由駱谷攻漢中'},
 {name:'司馬懿',aliases:['司馬懿','仲達'],asset:'./assets/portraits/sima-yi.webp',role:'魏軍主帥・與蜀軍相持於渭南'},
 {name:'楊儀',aliases:['楊儀','威公'],asset:'./assets/portraits/yang-yi.webp',role:'蜀漢長史・安排五丈原撤軍'},
 {name:'姜維',aliases:['姜維','伯約'],asset:'./assets/portraits/jiang-wei.webp',role:'天水官員・首次北伐投奔蜀漢'},
 {name:'馬謖',aliases:['馬謖','幼常'],asset:'./assets/portraits/ma-su.webp',role:'蜀漢前軍主將・街亭失守'},
 {name:'王平',aliases:['王平','子均'],asset:'./assets/portraits/wang-ping.webp',role:'蜀漢將領・在街亭收攏散兵'},
 {name:'曹真',aliases:['曹真','子丹'],asset:'./assets/portraits/cao-zhen.webp',role:'魏軍統帥・迎戰箕谷牽制軍'},
 {name:'郝昭',aliases:['郝昭','伯道'],asset:'./assets/portraits/hao-zhao.webp',role:'魏將・守住陳倉'},
 {name:'郭淮',aliases:['郭淮','伯濟'],asset:'./assets/portraits/guo-huai.webp',role:'魏軍將領・曾率軍救援武都、陰平'},
 {name:'劉禪',aliases:['劉禪','公嗣','阿斗'],asset:'./assets/portraits/liu-shan.webp?v=moe-1',role:'劉備之子・223 年在成都即位'},
 {name:'李嚴',aliases:['李嚴','正方','李平'],asset:'./assets/portraits/li-yan.webp?v=moe-1',role:'同受託孤・留守永安'},
 {name:'鄧芝',aliases:['鄧芝','伯苗'],asset:'./assets/portraits/deng-zhi.webp?v=moe-1',role:'蜀漢使者・出使與吳修好'},
 {name:'高定',aliases:['高定'],asset:'./assets/portraits/gao-ding.webp?v=moe-1',role:'越巂地方首領・225 年敗於蜀軍'},
 {name:'李恢',aliases:['李恢','德昂'],asset:'./assets/portraits/li-hui.webp?v=moe-1',role:'蜀漢將領・分路進軍南中'},
 {name:'孟獲',aliases:['孟獲'],asset:'./assets/portraits/meng-huo.webp?v=moe-1',role:'南中地方人物・見史書注文'},

 {name:'吳班',aliases:['吳班','元雄'],asset:'./assets/portraits/wu-ban.webp?v=moe-1',role:'劉備部將・巫縣先鋒'},
 {name:'馮習',aliases:['馮習','休元'],asset:'./assets/portraits/feng-xi.webp?v=moe-1',role:'劉備部將・在夷陵戰死'},
 {name:'黃權',aliases:['黃權','公衡'],asset:'./assets/portraits/huang-quan.webp?v=moe-1',role:'劉備部將・守江北，後因歸路被截降魏'},
 {name:'孫桓',aliases:['孫桓','叔武'],asset:'./assets/portraits/sun-huan.webp?v=moe-1',role:'孫權部將・受圍仍守住夷道'},
 {name:'龐德',aliases:['龐德','令明'],asset:'./assets/portraits/pang-de.webp?v=moe-1',role:'曹操軍將領・漢水暴漲後拒降'},
 {name:'呂蒙',aliases:['呂蒙','子明'],asset:'./assets/portraits/lu-meng.webp?v=moe-1',role:'孫權部將・取得公安與江陵'},
 {name:'陸遜',aliases:['陸遜','伯言'],asset:'./assets/portraits/lu-xun.webp?v=moe-1',role:'孫權部將・進取宜都'},
 {name:'關平',aliases:['關平'],asset:'./assets/portraits/guan-ping.webp?v=moe-1',role:'關羽之子・隨軍至麥城'},
 {...GENERALS.yujin,aliases:['于禁','文則'],role:'曹操軍援將・漢水暴漲後投降'},
 {name:'張郃',aliases:['張郃','儁乂','雋乂'],asset:'./assets/portraits/zhang-he.webp?v=moe-1',role:'曹操軍將領・在瓦口退回南鄭'},
 {name:'陳式',aliases:['陳式'],asset:'./assets/portraits/chen-shi.webp?v=moe-1',role:'劉備部將・曾試圖切斷馬鳴閣道'},
 {name:'黃忠',aliases:['黃忠','漢升'],asset:'./assets/portraits/huang-zhong.webp?v=moe-1',role:'劉備軍將領・定軍山從高處出擊'},
 {name:'法正',aliases:['法正','孝直'],asset:'./assets/portraits/fa-zheng.webp?v=moe-1',role:'劉備的謀士・看準定軍山出擊時機'},
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
export function hasPersonMention(text,person,aliases=person.aliases){return person.mentionPattern?.test(text)??aliases.some(alias=>text.includes(alias))}
export function mentionedPeople(text,speaker=''){return STORY_PEOPLE.filter(p=>p.name!==speaker&&hasPersonMention(text,p))}
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
 return {leader,opponent,diplomaticMeeting:!!stage.diplomaticMeeting,supports:level===8?Object.values(WEATHER_GENERALS):[],relation:stage.matchupLabel||stage.mapOpponentRole||(stage.opponentName?(['withdraw','decoy'].includes(stage.mission)?'保全撤離・對方主事者（劇情）':'對方主事者・劇情人物'):['withdraw','decoy'].includes(stage.mission)?'保全撤離・追擊方':stage.noBoss?'本關遭遇':'本關對手')};
}
// Nested SVG viewports select the existing atlas cell without creating new bitmap assets.
export function mapPersonSvg(person,kind,x,y){
 person=portraitForDisplay(person);
 const image=person.atlas?`<svg x="-27" y="-29" width="54" height="54" viewBox="${(person.col||0)*100} ${person.row*100} 100 65"><image href="${person.atlas}" width="300" height="${person.atlasRows===2?200:300}"/></svg>`:`<svg x="-27" y="-29" width="54" height="54" viewBox="15 0 70 65"><image href="${person.asset}" width="100" height="100"/></svg>`;
 return `<g class="map-person ${kind}" data-person="${person.name}" transform="translate(${x} ${y})"><title>${person.name}</title><path d="M-6 26L0 34 6 26"/><circle r="29"/>${image}<text y="46" text-anchor="middle">${person.name}</text></g>`;
}
export function renderMatchup(root,level){
 const {leader,opponent,diplomaticMeeting,supports,relation}=stagePeople(level),stage=STAGES[level-1];
 const cards=[[leader,diplomaticMeeting?'蜀漢使者':stage.factionLabel||'目前軍隊','army']];
 if(stage.enemyCount!==0||stage.opponentName){
  const side=diplomaticMeeting?'host':stage.enemyCount===0&&stage.mapOpponentRole?'guest':'enemy';
  cards.push([opponent,relation,side]);
 }
 cards.push(...supports.map(p=>[p,`支援將・${p.lane===0?'上路':'下路'}`,'enemy']));
 root.replaceChildren(...cards.map(([person,label,side])=>{
  const card=document.createElement('div');
  card.className='map-side';
  card.setAttribute('data-side',side);
  const img=document.createElement('img');
  paintPortrait(img,person);
  img.alt=person.name;
  const copy=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('strong');
  small.textContent=label;
  strong.textContent=person.name;
  copy.append(small,strong);
  card.append(img,copy);
  return card;
 }));
}
