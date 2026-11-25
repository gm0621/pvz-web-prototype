const source=(title,path)=>({title,url:`https://zh.wikisource.org/zh-hant/${path}`});
const hui=source('《晉書》・惠帝紀','晉書/卷004');
const jia=source('《晉書》・惠賈皇后','晉書/卷031');
const hua=source('《晉書》・張華傳','晉書/卷036#張華');
const pei=source('《晉書》・裴頠傳','晉書/卷035#子頠');
const prince=source('《晉書》・愍懷太子傳','晉書/卷053#愍懷太子');
const zhao=source('《晉書》・趙王倫傳','晉書/卷059#趙王倫');
const huainan=source('《晉書》・淮南王允傳','晉書/卷064#淮南忠壯王允');
const era=source('《資治通鑑》・卷八十二','資治通鑑/卷082');
const later=source('《資治通鑑》・卷八十三','資治通鑑/卷083');
const adaptation='行軍圖畫出史書地點及遊戲示意路線。出戰隊伍、接應、守備、撤離和營地對話為遊戲改編，人物結局依史書。';

const stages=[
 {
  name:'賈后掌權',year:291,origin:'luoyangPalace',place:'luoyangPalace',shift:true,factionLabel:'洛陽朝廷',campBanner:'晉',
  leader:'賈南風',guest:'張華',opponent:'張華',mapOpponentRole:'處理朝政',mapStationRole:'議事地',historyCast:['賈南風','張華','司馬衷'],
  mission:'restoration',missionTitle:'朝廷整備',missionSites:['奏章','官籍','驛書'],scene:'supply-road',enemyArmy:'朝廷整備',successTitle:'朝廷文書備妥',
  history:'楚王司馬瑋死後，賈皇后逐漸掌握朝政。她任用張華等大臣處理政務，洛陽一度平穩。皇帝仍是晉惠帝司馬衷。',
  briefing:'派友軍照應對應路線，整理奏章、官籍和送往各地的文書。',
  ending:'賈南風掌權，張華等大臣在朝廷處理政務。幾年後，朝中又為太子的去留發生爭執。',
  camp:'先把奏章按日期放好，驛書也要寫清楚送往哪裡。收件的人才能知道先處理哪一件。',
  question:'賈皇后掌權時，誰仍然是皇帝？',choices:['晉惠帝司馬衷','早先的楚王','朝廷的文書官'],refs:[hui,jia,hua,era]
 },
 {
  name:'東宮廢立',year:299,origin:'luoyangEastPalace',place:'luoyangEastPalace',shift:true,factionLabel:'東宮傳令隊',campBanner:'東',
  leader:'司馬遹',guest:'裴頠',opponent:'賈南風',mapOpponentRole:'主張廢立',mapStationRole:'東宮',historyCast:['司馬遹','賈南風','張華','裴頠'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'東宮傳令',successTitle:'東宮消息送達',
  history:'299 年末，賈皇后拿出一份太子司馬遹在受欺騙下寫的文字，指控他有謀反的意思。張華、裴頠出面為太子辯護，太子仍被廢為平民。',
  briefing:'接應三隊送消息的使者，可選擇有友軍照應的路線。',
  ending:'司馬遹失去太子身分。原先的東宮隊伍收到消息，朝廷接著安排把司馬遹送出洛陽。',
  camp:'一張公文也要問清楚從哪裡來。凡是沒收到消息的人，都得有人去告訴他們。',
  question:'哪兩位大臣在朝議中替太子辯護？',choices:['張華和裴頠','洛陽的兩位糧官','城外的兩隊守兵'],refs:[prince,hua,pei,era]
 },
 {
  name:'許昌幽居',year:300,origin:'luoyang',place:'jinXuchang',shift:true,factionLabel:'許昌隨行隊',campBanner:'行',
  leader:'司馬遹',guest:'司馬衷',historyCast:['司馬遹','賈南風'],
  mission:'supply',scene:'supply-road',enemyArmy:'許昌隨行補給',successTitle:'隨行補給送達',
  history:'300 年，已失去太子身分的司馬遹被送到許昌，關在城內一處宮院。他後來在許昌被賈皇后派來的人殺害。朝廷中反對賈皇后的人，因這件事採取了行動。',
  briefing:'讓每一路都有友軍接應。備車完成後按「發送糧車」，送出三批路上補給。',
  ending:'司馬遹在許昌遇害。消息傳回洛陽，趙王準備動手廢掉賈皇后。',
  camp:'隨行隊先在驛站整隊，點查剩下的糧袋，再把遠方傳來的消息交給大家。',
  question:'司馬遹被廢後，在哪裡遭到幽禁？',choices:['許昌','建業','襄陽'],refs:[prince,jia,hui,era]
 },
 {
  name:'賈后被廢',year:300,origin:'luoyangPalace',place:'jinJinyong',shift:true,factionLabel:'洛陽護送隊',campBanner:'護',
  leader:'司馬倫',guest:'孫秀',opponent:'賈南風',mapOpponentRole:'被廢皇后',historyCast:['司馬倫','孫秀','賈南風','張華','裴頠'],
  mission:'holdout',missionTitle:'洛陽護送守備',scene:'enemy-camp',enemyArmy:'城中亂兵',enemyCount:12,successTitle:'護送守備完成',
  history:'司馬遹死後，趙王司馬倫和謀士孫秀發動政變。賈南風被廢，後來在金墉城被賜死，張華、裴頠等大臣也在這次政變中被殺。',
  briefing:'各路都要有友軍照應。累積守備 24 秒後，清退場上的亂兵。',
  ending:'賈南風被廢，張華與裴頠遇害。司馬倫與孫秀掌握政局。',
  camp:'把走散的隊伍找到，先通報哪些路還能走，讓大家不必留在混亂的街上。',
  question:'賈南風被廢後，掌握朝政的是誰？',choices:['司馬倫和孫秀','東吳舊臣','許昌的守門人'],refs:[hui,jia,zhao,era]
 },
 {
  name:'淮南王起兵',year:300,origin:'luoyangStreets',place:'luoyangGate',shift:true,factionLabel:'洛陽撤離隊',campBanner:'護',
  leader:'司馬允',guest:'司馬衷',opponent:'司馬倫',mapOpponentRole:'掌權一方',historyCast:['司馬允','司馬倫','孫秀'],
  mission:'withdraw',scene:'enemy-camp',enemyArmy:'城中亂兵',enemyCount:12,successTitle:'撤離隊平安返回',
  history:'淮南王司馬允反對司馬倫掌權，在洛陽起兵。交戰先有進展，後來司馬允被殺，政變以司馬倫一方得勢告終。',
  briefing:'至少保住一隊友軍。等「全軍撤離」亮起再按下，讓所有存活的友軍回到左側。',
  ending:'淮南王司馬允敗亡。趙王控制洛陽，朝廷內的爭權還沒有結束。',
  camp:'安全撤回的人先去休息。把姓名記下來，免得城裡的人還在四處找家人。',
  question:'誰曾在洛陽起兵反對司馬倫掌權？',choices:['淮南王司馬允','許昌的使者','早先的東吳皇帝'],refs:[hui,huainan,zhao,era]
 },
 {
  name:'趙王篡位',year:301,origin:'luoyangPalace',place:'jinJinyong',shift:true,factionLabel:'洛陽傳訊隊',campBanner:'晉',
  leader:'司馬衷',guest:'司馬衷',opponent:'司馬倫',mapOpponentRole:'篡取皇位',historyCast:['司馬衷','司馬倫','孫秀'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'洛陽傳令',successTitle:'皇位消息送達',
  history:'301 年初，孫秀等人假造讓位詔書，趙王司馬倫奪取皇位。晉惠帝司馬衷被迫離開宮城，住到受人看守的金墉城。各地宗王很快有了新的動作。',
  briefing:'接應三隊使者，把洛陽的消息送出去。派友軍照應使者前進的路線。',
  ending:'趙王司馬倫篡位，惠帝司馬衷被幽禁於金墉城。八王之亂接下來將擴及更多地方。',
  camp:'京城的消息要分送出去，讓每一處都知道發生了什麼。先核對走失的隊伍和遺落的文書。',
  question:'司馬倫奪取皇位後，司馬衷被迫住到哪裡？',choices:['金墉城','襄陽','建業石頭城'],refs:[hui,zhao,later]
 }
];

export const TWENTY_SIXTH_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:26,number:index+1,faction:'cao',factionLabel:stage.factionLabel||'西晉軍',place:stage.name,campBanner:stage.campBanner||'晉',
 mapPlace:stage.place,originPlace:stage.origin,detailedRoute:true,viaPlaces:[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
 leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,matchupLabel:stage.matchupLabel,mapOpponentRole:stage.mapOpponentRole,mapStationRole:stage.mapStationRole,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
 successTitle:stage.successTitle,successRibbon:'戰 事 記 錄 ・ 回 營 整 備',
 ...(stage.mission==='withdraw'?{retreatKeys:[]}:{}),
 noBoss:true,bossName:stage.enemyArmy,bossHp:0,enemyArmy:stage.enemyArmy,enemyCount:stage.enemyCount??0,interval:3.8,
 lead:stage.history,history:stage.history,adaptation,note:adaptation,bossTip:stage.briefing,
 novel:[['說書人',stage.history],[stage.leader,stage.briefing]],
 opening:[['說書人',stage.history],[stage.leader,stage.briefing],['說書人',adaptation]],
 ending:[['說書人',stage.ending],[stage.guest,stage.camp]],campLine:stage.ending,victory:stage.ending,
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
  guanyu:[`${stage.guest}：先清點隊伍，再整備出發。`],
  zhangfei:[`${stage.guest}：${stage.briefing}`]
 },
 references:stage.refs
}));
