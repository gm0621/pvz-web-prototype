const source=(title,path)=>({title,url:`https://zh.wikisource.org/zh-hant/${path}`});
const hui=source('《晉書》・惠帝紀','晉書/卷004');
const qi=source('《晉書》・齊王冏傳','晉書/卷059#齊武閔王冏');
const chengdu=source('《晉書》・成都王穎傳','晉書/卷059#成都王穎');
const hejian=source('《晉書》・河間王顒傳','晉書/卷059#河間王顒');
const chronicle=source('《資治通鑑》・卷八十四','資治通鑑/卷084');
const adaptation='行軍圖標示史書地名和遊戲示意路線。傳檄、守營、收兵、追擊、接應和營地對話均為改編。';

const stages=[
 {
  name:'許昌傳檄',year:301,origin:'jinXuchang',place:'ye',shift:true,factionLabel:'齊王傳令隊',campBanner:'齊',
  leader:'司馬冏',guest:'司馬穎',opponent:'司馬穎',mapLeaderRole:'發出檄文',mapMessenger:'傳檄',mapOpponentRole:'起兵響應',historyCast:['司馬冏','司馬穎','盧志','司馬顒','司馬倫'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'許昌傳令',successTitle:'討趙消息送達',
  history:'趙王司馬倫奪取皇位後，鎮守許昌的齊王司馬冏起兵討伐他。司馬冏派人傳送檄文，也就是號召各地出兵的公開文書。成都王司馬穎當時駐在鄴城，聽了盧志的建議也起兵響應。',
  briefing:'接應三隊使者，把齊王發出的消息送出去。可改走有友軍照應的路線。',
  ending:'司馬冏從許昌傳檄，司馬穎在鄴城響應。河間王司馬顒起初出兵助趙，後來改支持兩王。',
  camp:'送消息的人走得很遠。先讓他們喝水歇腳，再把每封信的去處記清楚。',
  question:'齊王發出檄文時，成都王司馬穎駐在哪裡？',choices:['鄴城','成都','許昌'],refs:[qi,chengdu,hejian,chronicle]
 },
 {
  name:'潁陰守營',year:301,origin:'jinXuchang',place:'jinYingyin',shift:false,factionLabel:'齊王守營隊',campBanner:'齊',
  leader:'司馬冏',guest:'司馬冏',opponent:'張泓',mapOpponentRole:'趙王將領',historyCast:['司馬冏','張泓','司馬倫'],
  mission:'holdout',missionTitle:'潁陰守營',scene:'enemy-camp',enemyArmy:'張泓軍',enemyCount:12,successTitle:'潁陰防線守住',
  history:'司馬倫派張泓等將領迎戰。張泓先在陽翟一帶打勝幾仗，又逼近齊王駐守的潁陰。齊王反擊，打敗張泓派出的部分將領，張泓暫時退兵。',
  briefing:'派友軍照應各路。累積守備 24 秒，並等敵軍全數出場後清退。',
  ending:'齊王在潁陰反擊，張泓暫退。張泓的隊伍仍在，雙方的戰事尚未結束。',
  camp:'把每條路的守衛名單拿來。剛從前線下來的人先休息，輪到下一隊接手。',
  question:'誰替趙王出兵攻打齊王？',choices:['張泓','許昌縣令','宮門守衛'],refs:[qi,chronicle]
 },
 {
  name:'黃橋收兵',year:301,origin:'ye',place:'jinHuangqiao',shift:true,factionLabel:'成都王收兵隊',campBanner:'成',
  leader:'司馬穎',guest:'盧志',opponent:'孫會',mapOpponentRole:'趙王前線將領',historyCast:['司馬穎','盧志','孫會','孫秀'],
  mission:'withdraw',coverWaves:true,scene:'enemy-camp',enemyArmy:'孫會軍',enemyCount:12,successTitle:'黃橋散兵撤回',
  history:'司馬穎的前鋒到黃橋，被趙王部下孫會、士猗與許超打敗。司馬穎本想退守朝歌，盧志和王彥勸他重整兵力，再找機會出戰。',
  briefing:'看亮起的路，派友軍擋追兵。第三波一到就能按「全軍撤離」。至少保住一隊，讓所有還在場的友軍回到左側。',
  ending:'黃橋一戰，成都王前鋒吃了敗仗。司馬穎聽取盧志、王彥的建議整隊，準備反擊。',
  camp:'大家先按原來的隊伍報到。有人走散就登記名字，別急著把守衛全叫去找人。',
  question:'黃橋一戰過後，司馬穎採用了什麼建議？',choices:['重整兵力，再找機會出戰','立即返回成都','推舉孫會當皇帝'],refs:[chengdu,chronicle]
 },
 {
  name:'湨水反擊',year:301,origin:'jinHuangqiao',place:'jinJushui',shift:false,factionLabel:'成都王反擊隊',campBanner:'成',
  leader:'司馬穎',guest:'盧志',opponent:'孫會',mapOpponentRole:'退敗一方',historyCast:['司馬穎','盧志','孫會','司馬倫'],
  mission:'holdout',missionTitle:'湨水渡路守備',scene:'enemy-camp',enemyArmy:'趙王守兵',enemyCount:12,successTitle:'湨水渡路守住',
  history:'黃橋得勝後，孫會等人各自領兵，彼此不聽號令。司馬穎整軍後在湨水大敗對方。孫會等人丟下部隊向南逃走，成都王的軍隊趁勝渡過黃河。',
  briefing:'派友軍照應各路，守住渡路累積 24 秒，並等敵軍全數出場後清退。',
  ending:'成都王在湨水得勝並渡河。趙王軍失利的消息傳到洛陽，宮裡也有了變化。',
  camp:'前一隊先回報哪條路已經通了，後一隊再走。讓後面的人知道該往哪裡渡河。',
  question:'湨水一戰後，哪一方趁勝渡過黃河？',choices:['成都王司馬穎','趙王司馬倫','許昌的傳令隊'],refs:[chengdu,chronicle]
 },
 {
  name:'惠帝復位',year:301,origin:'jinJinyong',place:'luoyangPalace',shift:true,factionLabel:'洛陽迎駕隊',campBanner:'晉',
  leader:'司馬衷',guest:'王輿',opponent:'王輿',mapLeaderRole:'回宮復位',mapOpponentRole:'發兵迎回惠帝',historyCast:['司馬衷','王輿','司馬倫','孫秀'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'洛陽迎駕傳令',successTitle:'復位消息送達',
  history:'趙王軍在外接連受挫。左衛將軍王輿等人帶兵進宮，殺了孫秀。司馬衷被從金墉城迎回，重新當上皇帝。趙王司馬倫後來被賜死。',
  briefing:'接應三隊送信的使者，把惠帝回宮的消息送出去。',
  ending:'司馬衷回到洛陽宮城並復位。趙王司馬倫被賜死，這場奪位暫告一段落。',
  camp:'回宮的消息已經送到。把尚未回報的地方標出來，再請使者逐一核對。',
  question:'晉惠帝是從哪裡被迎回宮城的？',choices:['金墉城','鄴城','潁陰'],refs:[hui,chronicle]
 },
 {
  name:'齊王輔政',year:301,origin:'jinXuchang',place:'luoyang',shift:true,factionLabel:'齊王入洛隊',campBanner:'齊',
  leader:'司馬冏',guest:'司馬穎',opponent:'司馬穎',mapLeaderRole:'入洛輔政',mapOpponentRole:'辭別返鄴',historyCast:['司馬冏','司馬衷','司馬穎','盧志'],
  mission:'restoration',missionTitle:'入洛整備',missionSites:['印信','名冊','公文'],scene:'supply-road',enemyArmy:'入洛整備',successTitle:'入洛文書備妥',
  history:'惠帝復位後，齊王司馬冏帶兵進入洛陽，獲任大司馬，握有重要權力。成都王司馬穎聽從盧志建議，推辭一部分禮遇，回到鄴城。惠帝仍在位，朝政主要由齊王掌管。',
  briefing:'指派友軍照應各路，依序整備印信、名冊和公文。',
  ending:'司馬冏以大司馬身分掌管朝政，司馬穎回到鄴城。司馬倫已倒台，諸王間的爭權還沒有結束。',
  camp:'進城的隊伍要逐一登記。公文得先查日期和印信，再交給負責的人。',
  question:'惠帝復位後，哪位宗王成為大司馬？',choices:['齊王司馬冏','趙王司馬倫','宮門守衛'],refs:[hui,qi,chengdu,chronicle]
 }
];

export const TWENTY_SEVENTH_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:27,number:index+1,faction:'cao',factionLabel:stage.factionLabel||'西晉軍',place:stage.name,campBanner:stage.campBanner||'晉',
 mapPlace:stage.place,originPlace:stage.origin,detailedRoute:true,viaPlaces:[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
 leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,matchupLabel:stage.matchupLabel,mapOpponentRole:stage.mapOpponentRole,mapStationRole:stage.mapStationRole,mapLeaderRole:stage.mapLeaderRole,mapMessenger:stage.mapMessenger,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
 successTitle:stage.successTitle,successRibbon:'戰 事 記 錄 ・ 回 營 整 備',
 ...(stage.coverWaves?{coverWaves:true}:{}),
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
