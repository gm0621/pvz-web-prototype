import {lateJinChapter} from './late-jin-chapter.mjs?v=maming-hanzhong-jigu-1';

const source=(title,path)=>({title,url:`https://zh.wikisource.org/zh-hant/${path}`});
const hui=source('《晉書》・惠帝紀','晉書/卷004');
const qi=source('《晉書》・齊王冏傳','晉書/卷059#齊武閔王冏');
const changsha=source('《晉書》・長沙王乂傳','晉書/卷059#長沙厲王乂');
const hejian=source('《晉書》・河間王顒傳','晉書/卷059#河間王顒');
const zhang=source('《晉書》・張方傳','晉書/卷060#張方');
const lu=source('《晉書》・陸機傳','晉書/卷054#陸機');

const stages=[
 {
  name:'齊府勸諫',year:302,origin:'jinQiCourt',place:'jinQiCourt',shift:true,factionLabel:'齊府送文隊',campBanner:'齊',
  leader:'鄭方',guest:'鄭方',opponent:'司馬冏',mapLeaderRole:'上書勸諫',mapOpponentRole:'接到建議',mapStationRole:'上書地',historyCast:['鄭方','司馬冏'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'齊府傳令',successTitle:'勸諫文書送達',
  history:'齊王司馬冏掌管朝政後，許多重要決定都由他做主。鄭方特地到洛陽，上書提醒齊王照顧戰後生活困難的百姓，也要聽聽不同的意見。',
  briefing:'接應三隊送文書的使者，可改走有友軍照應的路線。',
  ending:'齊王收到鄭方的建議，朝政依舊由齊王主導。其他宗王對他的做法越來越不滿。',
  camp:'送進府裡的公文已點清楚。把哪一封是百姓的請求、哪一封是大臣的建議分開放。',
  question:'鄭方用什麼方法提醒齊王？',choices:['親自到洛陽上書','率兵進城','召集水軍'],refs:[qi,hui]
 },
 {
  name:'河間傳檄',year:302,origin:'jinChangan',place:'luoyang',shift:true,factionLabel:'長安傳檄隊',campBanner:'河',
  leader:'司馬顒',guest:'李含',opponent:'司馬乂',mapLeaderRole:'自長安發檄',mapOpponentRole:'檄文點名',mapMessenger:'傳檄',historyCast:['司馬顒','李含','司馬冏','司馬乂'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'關中傳令',successTitle:'河間檄文送達',
  history:'李含從洛陽到長安，向河間王司馬顒建議討伐齊王。司馬顒發出檄文，邀其他宗王出兵，還點名長沙王司馬乂在洛陽響應。',
  briefing:'讓三隊使者沿有友軍照應的路線送信，傳達河間王的消息。',
  ending:'檄文傳到洛陽，齊王派部下董艾攻打長沙王。城裡的衝突很快擴大。',
  camp:'幾封文書分開送，每封寫清楚送往哪裡。回來的人先報告哪一處已收到。',
  question:'河間王在檄文裡點名誰從洛陽響應？',choices:['長沙王司馬乂','城外的糧官','齊府的門衛'],refs:[hui,hejian,changsha]
 },
 {
  name:'宮城三日',year:302,origin:'luoyangStreets',place:'luoyangPalace',shift:true,factionLabel:'宮門守衛隊',campBanner:'長',
  leader:'司馬乂',guest:'司馬衷',opponent:'董艾',mapLeaderRole:'入宮護帝',mapOpponentRole:'齊王部將',historyCast:['司馬乂','司馬衷','司馬冏','董艾'],
  mission:'holdout',missionTitle:'宮門守備',scene:'enemy-camp',enemyArmy:'齊府軍',enemyCount:12,successTitle:'宮門守備完成',
  history:'齊王的部將董艾出兵後，長沙王司馬乂趕入宮城，奉晉惠帝守住宮門。洛陽城內交戰三天，齊王司馬冏最後戰敗，被俘後遇害。',
  briefing:'在各路駐守，累積守備 24 秒，並清退全部敵軍。',
  ending:'齊王司馬冏戰敗遇害。惠帝仍在位，長沙王司馬乂接掌朝政。',
  camp:'宮門外還有走散的人。先清點回來的守衛，讓受傷的人到營裡休息。',
  question:'長沙王進入宮城後，奉誰守住宮門？',choices:['晉惠帝司馬衷','齊王的傳令官','長安守將'],refs:[hui,qi,changsha]
 },
 {
  name:'長沙輔政',year:303,origin:'luoyangPalace',place:'luoyangPalace',factionLabel:'洛陽整備隊',campBanner:'長',
  leader:'司馬乂',guest:'司馬乂',opponent:'司馬衷',mapLeaderRole:'輔理朝政',mapOpponentRole:'仍為皇帝',mapStationRole:'整備地',historyCast:['司馬乂','司馬衷','李含','司馬顒'],
  mission:'restoration',missionTitle:'洛陽整備',missionSites:['糧倉','城防','公文'],scene:'supply-road',enemyArmy:'洛陽整備',successTitle:'洛陽整備完成',
  history:'司馬乂當上太尉，開始處理朝廷大事。李含後來因與司馬乂對立而被殺，河間王司馬顒和成都王司馬穎隨後聯手向洛陽出兵。',
  briefing:'分路照應糧倉、城防、公文三處，逐一完成整備。',
  ending:'司馬乂仍在洛陽輔政。當長安和鄴城兩方都向洛陽出兵，城內又要準備守備。',
  camp:'糧倉先分好份量，城門交接要留名冊。發出的公文都記一份，日後有人來查才查得到。',
  question:'司馬乂輔政時，誰仍然是皇帝？',choices:['晉惠帝','河間王','掌管城門的人'],refs:[hui,changsha,hejian]
 },
 {
  name:'兩王攻洛',year:303,origin:'ye',place:'luoyang',shift:true,factionLabel:'洛陽迎戰隊',campBanner:'長',
  leader:'陸機',guide:'司馬乂',guest:'司馬乂',opponent:'張方',mapLeaderRole:'鄴路・司馬穎部',mapOpponentRole:'長安路・司馬顒部',mapSecondaryOrigin:'jinChangan',historyCast:['司馬穎','司馬顒','陸機','張方','司馬乂'],
  mission:'siege',scene:'enemy-camp',enemyArmy:'攻洛聯軍',enemyCount:12,successTitle:'這一輪守住了',
  history:'成都王司馬穎以陸機統兵，從鄴城一方進逼洛陽。河間王司馬顒派張方從關中出兵。司馬乂在洛陽抵抗，戰事打了幾個月。',
  briefing:'看下一波從哪一路來，派友軍擋在城門前。城門受損可修兩次。撐到敵軍全數清退，就守住這一輪。',
  ending:'司馬乂率軍抵抗兩路攻勢，圍城卻仍未解除。城內糧食漸少，守軍和百姓都越來越辛苦。',
  camp:'先把糧袋交給缺糧的地方。每一隊回報還能走哪條路，好讓下一班守衛有路可走。',
  question:'兩路攻洛的軍隊，分別從哪兩地出兵？',choices:['鄴城與長安','成都與建業','許昌與江陵'],refs:[hui,changsha,lu,zhang]
 },
 {
  name:'洛陽圍城',year:304,origin:'luoyangPalace',place:'jinJinyong',shift:true,factionLabel:'洛陽撤離隊',campBanner:'護',
  leader:'司馬乂',guide:'說書人',guest:'司馬衷',opponent:'司馬越',mapLeaderRole:'後被拘押',mapOpponentRole:'在宮中拘押',historyCast:['司馬乂','司馬越','司馬衷','張方'],
  mission:'withdraw',gateHold:40,scene:'enemy-camp',enemyArmy:'圍城敵軍',enemyCount:12,successTitle:'城內接應隊撤回',
  history:'洛陽守了很久，城裡糧食不足。東海王司馬越等人在宮中拘押司馬乂，把他送到金墉城。隨後，張方派人從金墉城帶走司馬乂，司馬乂最終遇害。',
  briefing:'守住城門 40 秒，城門受損可修補兩次。倒數結束就按「全軍撤離」，讓所有存活友軍回到左側，至少保住一隊。',
  ending:'撤離隊護住了撤回的人。史書記載，長沙王司馬乂被關在金墉城，後來遭張方部下帶走並遇害。這段洛陽故事到此告一段落。',
  camp:'平安回來的人先歇一會兒。把已找到的人記下來，讓家人知道該到哪裡等消息。',
  question:'東海王等人拘押司馬乂後，先把他送到哪裡？',choices:['金墉城','鄴城','長安'],refs:[hui,changsha,zhang]
 }
];

export const TWENTY_EIGHTH_CHAPTER=lateJinChapter(28,stages);
