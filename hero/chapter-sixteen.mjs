const source=(volume,name)=>({title:`《三國志》卷${volume}・${name}`,url:`https://zh.wikisource.org/wiki/三國志/卷${volume}`});
const firstRuler=source(32,'先主傳'),laterRuler=source(33,'後主傳'),zhuge=source(35,'諸葛亮傳及裴松之注');
const liYan=source(40,'李嚴傳'),liHui=source(43,'李恢傳'),deng=source(45,'鄧芝傳'),sun=source(47,'吳主傳');
const chronicle={title:'《資治通鑑》卷 70',url:'https://zh.wikisource.org/wiki/資治通鑑/卷070'};
const adaptation='營地對話和過關任務為遊戲改編，行軍圖標示大致方位。三路兵卡沿用原有養成，史實中在場的人物請看劇情與歷史小檔案。';

const stages=[
 {
  name:'白帝託孤',historyCast:['劉備', '諸葛亮', '李嚴', '劉禪'],year:223,place:'yongan',origin:'chengdu',leader:'諸葛亮',guest:'李嚴',
  mission:'holdout',missionTitle:'永安驛道接應',scene:'mountain-front',enemyArmy:'道上游兵',
  history:'223 年，劉備在永安病重，從成都召來諸葛亮，並託付諸葛亮與李嚴輔佐太子劉禪。諸葛亮負責主持大局，李嚴留下鎮守永安。',
  briefing:'在改編的驛道任務裡，派友軍照應三路，累計守住 24 秒，再清退餘兵。',
  ending:'驛道接應告一段落。四月，劉備在永安去世。成都的劉禪即將接下新的責任。',
  camp:'託孤，就是把照顧孩子和幫他站穩的責任交給信任的人。我先守住永安。',
  question:'劉備託付哪兩人輔佐劉禪？',choices:['諸葛亮與李嚴','只託付一名守將','只託付一名成都官員'],refs:[firstRuler,zhuge,liYan]
 },
 {
  name:'劉禪即位',historyCast:['劉禪', '諸葛亮'],year:223,place:'chengdu',origin:'chengdu',leader:'劉禪',guest:'劉禪',shift:true,
  mission:'dispatch',scene:'supply-road',enemyArmy:'道路游兵',
  history:'223 年五月，劉備的兒子劉禪在成都即位，改年號為建興。諸葛亮繼續擔任丞相，協助處理政事。此時南中已有一些郡縣反叛，朝廷還要顧好內外。',
  briefing:'在改編任務中，接回三隊傳令使者，把成都的新消息送到各處。',
  ending:'三隊使者都已回報。建興元年從這裡開始，朝廷先派人往東和吳國談合作。',
  camp:'當皇帝有好多事要學。我會先聽聽大家怎麼說，再作決定。',
  question:'劉禪即位後的新年號叫什麼？',choices:['建興','章武','黃初'],refs:[laterRuler,zhuge]
 },
 {
  name:'使吳修好',historyCast:['鄧芝', '孫權'],year:223,place:'wuchang',origin:'chengdu',leader:'鄧芝',guest:'鄧芝',opponent:'孫權',
  diplomaticMeeting:true,matchupLabel:'吳王・會談對象',mission:'dispatch',scene:'supply-road',enemyArmy:'沿途游兵',
  history:'劉禪即位後，鄧芝出使吳國，向吳王孫權說明蜀、吳各有長處，合力可以應對魏國。兩方恢復往來，後來互派使者。',
  briefing:'接應三隊聯絡使者。遇到敵兵擋路，可以請使者改走有守軍的路。',
  ending:'使者順利回報。鄧芝代表蜀漢與孫權修好，長江兩邊重新有了消息往來。',
  camp:'出使就像替兩隊人搭一座橋。先讓彼此懂得對方在擔心什麼，才有機會一起做事。',
  question:'誰代表蜀漢出使與吳修好？',choices:['鄧芝','永安的守軍','押糧的士兵'],refs:[laterRuler,deng,sun,chronicle]
 },
 {
  name:'務農息民',historyCast:['劉禪', '諸葛亮'],year:224,place:'chengdu',origin:'chengdu',leader:'諸葛亮',guest:'劉禪',shift:true,
  mission:'restoration',missionTitle:'農務整備',missionSites:['田間道路','水渠','糧倉'],scene:'supply-road',enemyArmy:'地方游兵',
  history:'224 年，史書記蜀漢鼓勵耕種、暫歇兵事，讓百姓休息。南中的問題還沒解決，蜀漢先累積糧食，也讓戰後疲累的地方有時間恢復。',
  briefing:'派人守住對應路線，依序整備田間道路、水渠和糧倉。每處完成後，再選下一處。',
  ending:'三處整備完畢。這是遊戲用來呈現休養生息的任務。隔年，諸葛亮才率軍南征。',
  camp:'種子下了土，還要靠水和時間才能發芽。先讓大家好好過日子，隊伍也才能走得遠。',
  question:'224 年的蜀漢先做了什麼？',choices:['鼓勵耕種、讓百姓休息','立刻出兵北伐','移都永安'],refs:[laterRuler,zhuge]
 },
 {
  name:'南征越巂',historyCast:['諸葛亮', '高定', '李恢'],year:225,place:'yuesui',origin:'chengdu',leader:'諸葛亮',guest:'諸葛亮',opponent:'高定',
  matchupLabel:'越巂地方首領・戰區示意',mission:'holdout',missionTitle:'越巂山道接應',scene:'mountain-front',enemyArmy:'越巂守隊',
  history:'225 年春，諸葛亮出兵南中，主軍從越巂進入，擊敗高定。這次行動有幾條路線，李恢與馬忠也各自帶隊，朝不同郡縣前進。',
  briefing:'山道各路都要有人接應。每路有人且敵人未逼近，才會累計 24 秒接應時間。',
  ending:'越巂戰事告一段落。蜀軍分路進入南中，各隊仍須互通消息和照應補給。',
  camp:'這是一場分路行動。一隊走得快，其他隊還在後頭時，也要記得彼此照應。',
  question:'諸葛亮的主軍從哪裡進入南中？',choices:['越巂','樊城','下邳'],refs:[laterRuler,zhuge,chronicle]
 },
 {
  name:'南中收兵',historyCast:['諸葛亮', '李恢', '孟獲'],year:225,place:'dianchi',origin:'yuesui',leader:'諸葛亮',guest:'李恢',opponent:'孟獲',mapOpponent:false,
  matchupLabel:'南中地方首領・史書注引記載',mission:'supply',supplyStops:['越巂營地','山路驛站','滇池營地'],scene:'supply-road',enemyArmy:'山道餘兵',
  history:'李恢從另一條路進軍，曾在史書稱為昆明的地方受圍，突圍後繼續南下。史書記南中四郡平定，部分地區重新劃設。《三國志》正文只簡記南中平定，裴松之注引《漢晉春秋》另載諸葛亮「七擒孟獲」的說法。',
  briefing:'派友軍守住亮起的路，再按「發送糧車」。護衛離開時糧車會停，回到這一路就繼續。三批糧車都送到，再清完剩下的敵兵。',
  ending:'南中四郡平定。225 年十二月，諸葛亮回到成都。南征的故事在這裡告一段落。',
  camp:'我們從不同的路來。打完仗還得整理糧食和地方事務，好讓大家能重新過日子。',
  question:'南征後，諸葛亮在哪裡結束這趟行程？',choices:['成都','永安','武昌'],refs:[laterRuler,zhuge,liHui,chronicle]
 }
];

export const SIXTEENTH_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:16,number:index+1,faction:'shu',factionLabel:'蜀漢軍',place:stage.name,
 mapPlace:stage.place,originPlace:stage.origin,viaPlaces:[],viewpointShift:!!stage.shift,
 historyCast:stage.historyCast,leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,diplomaticMeeting:stage.diplomaticMeeting,matchupLabel:stage.matchupLabel,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
 ...(stage.supplyStops?{supplyStops:stage.supplyStops}:{}),
 noBoss:true,bossName:stage.enemyArmy,bossHp:0,enemyArmy:stage.enemyArmy,enemyCount:12,interval:3.8,
 lead:stage.history,history:stage.history,adaptation,note:adaptation,
 novel:[['說書人',stage.history],[stage.guest,stage.camp]],
 opening:[['說書人',stage.history],[stage.leader,stage.briefing],['說書人',adaptation]],
 ending:[['說書人',stage.ending],[stage.guest,stage.camp]],campLine:stage.ending,victory:stage.ending,bossTip:stage.briefing,
 quiz:{kind:'史書小偵探',speaker:stage.guest,title:stage.question,scene:stage.history,question:stage.question,choices:stage.choices,answer:0,hint:stage.history,reply:stage.history},
 campTalkPrompts:{
  guanyu:{speaker:stage.guest,title:stage.guest,hint:'聊聊這一關'},
  zhangfei:{speaker:stage.guest,title:'後續消息',hint:'看看後來怎麼了'}
 },
 campTalk:{guanyu:[`${stage.guest}：${stage.camp}`],zhangfei:[`${stage.guest}：${stage.ending}`]},
 campRetryPrompts:{
  guanyu:{speaker:stage.guest,title:stage.guest,hint:'先照應傷兵'},
  zhangfei:{speaker:stage.guest,title:'再試一次',hint:'看看任務要點'}
 },
 campRetryTalk:{
  guanyu:[`${stage.guest}：先安排傷兵休息，再準備出發。`],
  zhangfei:[`${stage.guest}：${stage.briefing}`]
 },
 references:stage.refs
}));
