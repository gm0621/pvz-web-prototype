import {lateJinChapter} from './late-jin-chapter.mjs?v=maming-hanzhong-jigu-1';

const source=(title,path)=>({title,url:'https://zh.wikisource.org/zh-hant/'+path});
const hui=source('《晉書》・惠帝紀','晉書/卷004');
const tongjian={title:'《資治通鑑》卷八十五',url:'https://www.shidianguji.com/zh/book/NGJ892411999017170217910/chapter/1lujea9s129zd'};
const court=source('《晉書》・惠羊后','晉書/卷031#惠羊后');
const jiShao=source('《晉書》・嵇紹傳','晉書/卷089#嵇紹');
const zhang=source('《晉書》・張方傳','晉書/卷060#張方');
const wang=source('《晉書》・王浚傳','晉書/卷039#王浚');

export const TWENTY_NINTH_CHAPTER=lateJinChapter(29,[
 {
  name:'洛陽清點',year:304,origin:'luoyangPalace',place:'luoyangPalace',factionLabel:'洛陽整備隊',campBanner:'晉',
  leader:'司馬穎',guest:'司馬穎',opponent:'司馬衷',mapLeaderRole:'接掌朝政',mapOpponentRole:'仍是皇帝',mapStationRole:'清點地',historyCast:['司馬乂','司馬穎','司馬衷'],
  mission:'restoration',missionTitle:'洛陽清點',missionSites:['傷員名冊','糧冊','公文'],scene:'supply-road',enemyArmy:'宮城清點',successTitle:'三處清點完成',
  history:'司馬乂遇害後，成都王司馬穎進入洛陽，接手朝廷大事。晉惠帝司馬衷仍是皇帝；這時許多決定得看司馬穎的意思。',
  briefing:'分路照應傷員名冊、糧冊和公文，逐一完成清點。',
  ending:'司馬穎離開洛陽，回到自己原先駐守的鄴城。接下來，他仍能從鄴城左右洛陽的決定。',
  camp:'傷員和軍糧要分開造冊。先把失散的人找回來，再把留在宮裡的公文整理好。',
  question:'司馬穎接掌朝政後，誰仍是皇帝？',choices:['晉惠帝司馬衷','長沙王司馬乂','成都王司馬穎'],refs:[hui,tongjian]
 },
 {
  name:'鄴城傳詔',year:304,origin:'ye',place:'luoyangPalace',shift:true,factionLabel:'洛陽接令隊',campBanner:'信',
  leader:'司馬穎',guest:'司馬覃',opponent:'羊獻容',mapMessenger:'傳詔',mapLeaderRole:'鄴城發令',mapOpponentRole:'宮中受命',historyCast:['司馬穎','司馬覃','羊獻容'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'鄴洛傳令',successTitle:'鄴城消息送達',
  history:'司馬穎在鄴城掌權。羊獻容被廢去皇后身分，太子司馬覃也被免去太子身分。司馬穎受封為皇太弟，也就是以皇帝弟弟的身分排在繼位的第一位。',
  briefing:'讓三隊使者走有隊伍照應的路，把鄴城的消息送到洛陽。',
  ending:'詔令送進洛陽後，宮中的人更不安。東海王司馬越等人接著在洛陽起兵，準備奉惠帝北上。',
  camp:'每封詔書都要記下送達的地方。宮裡接到消息的人很多，先把誰已經收到弄清楚。',
  question:'皇太弟司馬穎平時在哪裡駐守？',choices:['鄴城','建業','成都'],refs:[hui,court,tongjian]
 },
 {
  name:'河橋護駕',year:304,origin:'luoyangPalace',place:'jinRiverBridge',shift:true,factionLabel:'北上補給隊',campBanner:'糧',
  leader:'司馬衷',guest:'嵇紹',opponent:'司馬越',mapLeaderRole:'惠帝北上',mapOpponentRole:'奉帝北上',historyCast:['司馬衷','司馬越','嵇紹','司馬穎'],
  mission:'supply',supplyStops:['出城路口','河畔驛站','河橋營地'],scene:'supply-road',enemyArmy:'北上補給',successTitle:'河橋補給送達',
  history:'司馬越等人奉晉惠帝離開洛陽，北上討伐司馬穎。嵇紹是跟在惠帝身邊的侍中，負責在皇帝身邊辦事，也隨隊北上。',
  briefing:'派友軍守住亮起的路，再按「發送糧車」。護衛離開時糧車會停，回到這一路就繼續。三批補給送到就過關。',
  ending:'北上的隊伍繼續往鄴城方向走。司馬穎派出石超迎戰，兩軍將在蕩陰相遇。',
  camp:'走遠路前先把糧袋分好。隊伍在哪一路，就把補給送到那一路。',
  question:'誰奉晉惠帝北上討伐司馬穎？',choices:['司馬越等人','建業的船隊','黃河的渡工'],refs:[hui,tongjian,jiShao]
 },
 {
  name:'蕩陰撤離',year:304,origin:'jinRiverBridge',place:'jinTangyin',shift:true,factionLabel:'蕩陰撤離隊',campBanner:'護',
  leader:'司馬衷',guest:'司馬越',opponent:'石超',mapLeaderRole:'北上至蕩陰',mapOpponentRole:'鄴軍迎戰',historyCast:['司馬衷','司馬越','嵇紹','石超','司馬穎'],
  mission:'withdraw',coverWaves:true,scene:'enemy-camp',enemyArmy:'鄴軍追兵',enemyCount:12,successTitle:'接應隊撤回',
  history:'石超在蕩陰打敗北上的軍隊。嵇紹守在晉惠帝身邊，最後遇害。晉惠帝受了傷，戰後被司馬穎一方帶到鄴城。',
  briefing:'看亮起的路，派友軍擋追兵。第三波一到就能按「全軍撤離」。至少保住一隊，讓所有還在場的友軍回到左側。',
  ending:'接應隊帶著撤回的人回營。史書記載，晉惠帝在蕩陰受傷，嵇紹護駕遇害，惠帝後來被帶往鄴城。',
  camp:'先點清回來的人。未到的人另記在名冊上，讓下一隊知道要找誰。',
  question:'蕩陰敗戰後，晉惠帝被帶到哪裡？',choices:['鄴城','長安','建業'],refs:[hui,tongjian,jiShao]
 },
 {
  name:'鄴城返洛',year:304,origin:'ye',place:'luoyang',shift:true,factionLabel:'返洛接應隊',campBanner:'信',
  leader:'司馬衷',guest:'司馬穎',opponent:'王浚',mapLeaderRole:'車駕返洛',mapOpponentRole:'自幽州進逼鄴城',historyCast:['司馬衷','司馬穎','王浚','石超','張方'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'返洛通報',successTitle:'返洛消息送達',
  history:'王浚與東嬴公司馬騰合兵進逼鄴城。司馬穎的軍隊失利，只得帶著晉惠帝離開鄴城，向洛陽走。惠帝回到洛陽後，手握軍隊的張方掌管朝廷。',
  briefing:'照應三隊先行報信的使者，讓收信的人知道車駕正往洛陽回來。',
  ending:'晉惠帝回到洛陽，司馬穎也到了洛陽。張方掌控朝政，朝廷接著又被迫改往西邊。',
  camp:'有人先到洛陽報信，有人還在回程。送達的文書和沒回來的隊伍要分開記。',
  question:'王浚進逼鄴城後，車駕回到哪裡？',choices:['洛陽','河間','成都'],refs:[hui,tongjian,wang]
 },
 {
  name:'長安西行',year:304,origin:'luoyang',place:'jinChangan',shift:true,factionLabel:'西行補給隊',campBanner:'糧',
  leader:'司馬衷',guest:'司馬衷',opponent:'張方',mapLeaderRole:'被迫向西',mapOpponentRole:'挾車駕西行',historyCast:['司馬衷','張方','司馬穎','司馬顒'],
  mission:'supply',supplyStops:['西行路口','途中驛站','長安城門'],scene:'supply-road',enemyArmy:'西行補給',successTitle:'西行補給送達',
  history:'張方帶兵進宮，迫使晉惠帝離開洛陽。車駕一路向西，到了河間王司馬顒控制的長安。晉惠帝仍是皇帝，卻無法自行決定留在哪裡。',
  briefing:'派友軍守住亮起的路，再按「發送糧車」。護衛離開時糧車會停，回到這一路就繼續。三批補給送到就過關。',
  ending:'隨行人員收到補給。史書記載，張方把晉惠帝和司馬穎從洛陽帶往長安。惠帝到了長安，宗王間的爭鬥仍未結束。',
  camp:'路遠又辛苦，先讓同行的人吃飽。把到達的人逐一記下，還在路上的也要留心。',
  question:'張方迫使晉惠帝離開洛陽後，車駕去了哪裡？',choices:['長安','鄴城','建業'],refs:[hui,tongjian,zhang]
 }
]);
