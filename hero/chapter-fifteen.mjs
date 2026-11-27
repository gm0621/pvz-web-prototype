const source=(volume,name)=>({title:`《三國志》卷${volume}・${name}`,url:`https://zh.wikisource.org/wiki/三國志/卷${volume}`});
const liu=source('32','先主傳'),lu=source('58','陸遜傳'),huang=source('43','黃權傳');
const chronicle={title:'《資治通鑑》卷 69',url:'https://zh.wikisource.org/wiki/資治通鑑/卷069'};
const adaptation='對話、行軍圖和任務為遊戲改編。戰鬥沿用劉備軍的三路兵卡與養成，歷史人物是否在場以故事和歷史小檔案為準。';

const stages=[
 {
  name:'成都即位',year:221,place:'chengdu',origin:'chengdu',leader:'劉備',opponent:'曹丕',mapOpponent:false,
  matchupLabel:'220 年在北方稱帝・時局消息',mission:'dispatch',scene:'supply-road',enemyArmy:'道路游軍',
  history:'麥城之後，220 年曹丕取代漢獻帝，建立魏。隔年四月，劉備在成都稱帝，改年號為章武，以漢為國號，任命諸葛亮為丞相。',
  briefing:'派友軍接回三隊傳令使者，讓各處收到成都的新消息。',
  ending:'三隊使者平安回報。劉備從漢中王成為皇帝，故事也將轉向長江東邊。',
  guest:'諸葛亮',camp:'年號像一本新冊子的封面。章武元年，就是這段故事的 221 年。',
  question:'劉備在哪裡即位？',choices:['成都','白帝','洛陽'],refs:[liu,chronicle]
 },
 {
  name:'閬中噩耗',year:221,place:'langzhong',origin:'langzhong',leader:'劉備',mapLeader:false,mapReportRegion:'閬中',
  mission:'holdout',missionTitle:'閬中渡口接應',scene:'mountain-front',enemyArmy:'地方游軍',mapOpponent:false,shift:true,
  history:'出兵前，張飛原定率兵由閬中到江州會合。六月，張飛被部下所害。此處轉看閬中傳來的消息，劉備並未親自到場。',
  briefing:'在改編的渡口任務裡，派友軍接應各路，累計守住 24 秒，再清退餘兵。',
  ending:'各隊安頓完畢。張飛已在出征前遇害，劉備仍決定於七月東征。',
  guest:'劉備',camp:'關羽和張飛都沒能回來。先照應留下的人，也把消息確實送到各營。',
  question:'張飛原定在哪裡與劉備會合？',choices:['江州','襄陽','鄴城'],refs:[liu,source('36','張飛傳'),chronicle]
 },
 {
  name:'巫口進兵',year:221,place:'zigui',origin:'wuxian',leader:'吳班',opponent:'陸遜',shift:true,mapOpponent:false,
  matchupLabel:'吳軍前線部署・劇情人物',mission:'supply',scene:'supply-road',enemyArmy:'守道敵軍',
  history:'章武元年七月，劉備出兵伐吳。吳班、馮習自巫縣進擊，打退李異等吳軍，抵達秭歸。陸遜也參與這一帶的防守部署。',
  briefing:'各路都要有人接應。等糧車備妥，分三批發送，再清退餘兵。',
  ending:'吳班、馮習到達秭歸。接下來，劉備的隊伍還要沿江向東。',
  guest:'馮習',camp:'這趟先照應糧車。人和糧都到齊了，才能再往前走。',
  question:'吳班、馮習從巫縣進軍後，駐軍在哪裡？',choices:['秭歸','成都','樊城'],refs:[liu,lu]
 },
 {
  name:'猇亭對峙',year:222,place:'xiaoting',origin:'zigui',leader:'劉備',opponent:'孫桓',
  mission:'holdout',missionTitle:'猇亭各路接應',scene:'enemy-camp',enemyArmy:'吳軍守隊',
  history:'章武二年春，劉備在夷道猇亭一帶紮營，黃權帶兵守江北。孫桓在夷道受圍，陸遜判斷他仍能守住，沒有立刻派兵救援。',
  briefing:'把各路照應妥當。每路有友軍且敵兵未逼近，才會累計接應時間。',
  ending:'兩軍仍在對峙，孫桓守住夷道。陸遜等到入夏，才發動反擊。',
  guest:'黃權',camp:'我的隊伍守在江北，主力在另一岸。過不了江時，消息就更難送了。',
  question:'劉備進軍猇亭時，誰帶兵守江北？',choices:['黃權','張飛','曹仁'],refs:[liu,lu,huang]
 },
 {
  name:'夷陵撤退',year:222,place:'zigui',origin:'xiaoting',leader:'劉備',opponent:'陸遜',mapOpponent:false,
  matchupLabel:'猇亭反擊・吳軍統帥',mission:'withdraw',scene:'ambush-valley',enemyArmy:'吳軍追兵',
  commander:'吳軍追兵主將',retreatKeys:['liubei'],successTitle:'撤出猇亭',
  history:'章武二年夏，陸遜以火攻反擊，劉備軍在猇亭敗退。馮習、張南等戰死。劉備離開猇亭，退回秭歸收攏散兵。',
  briefing:'看哪一路安全。燃燒時，有友軍在該路可開路一次。接應完成後按「全軍撤離」，帶劉備和在場友軍回左側。',
  ending:'劉備退回秭歸收攏散兵。夷陵一戰由陸遜取勝，馮習、張南等沒有回來。',
  guest:'劉備',camp:'先清點回來的人。糧食和傷藥都要分好，還有一段路才能安頓。',
  question:'夷陵之戰後，劉備先在哪裡收攏散兵？',choices:['秭歸','江陵','長安'],refs:[liu,lu,chronicle]
 },
 {
  name:'白帝收兵',year:222,place:'yongan',origin:'zigui',leader:'劉備',opponent:'孫權',mapOpponent:false,
  matchupLabel:'遣使請和・戰後消息',mission:'supply',supplyStops:['秭歸營地','山路驛站','永安營地'],scene:'supply-road',enemyArmy:'沿途追兵',
  history:'劉備從秭歸撤到魚復，將魚復改名永安，留在白帝一帶。黃權在江北，因歸路被截而率部降魏。後來孫權遣使請和，劉備同意。',
  briefing:'派友軍守住亮起的路，再按「發送糧車」。護衛離開時糧車會停，回到這一路就繼續。三批糧車都送到，再清完剩下的敵兵。',
  ending:'劉備留在永安安頓軍隊。孫權派人請和，劉備接受了。故事停在夷陵戰後。',
  guest:'劉備',camp:'先讓傷兵歇息，讓大家吃上飯。使者帶來了和談消息。',
  question:'劉備撤到魚復後，把這個地方改名為什麼？',choices:['永安','建業','許都'],refs:[liu,huang,chronicle]
 }
];

export const FIFTEENTH_CHAPTER=stages.map((stage,index)=>{
 const {name,year,place,origin,leader,opponent,shift=false,mission,missionTitle,scene,enemyArmy,commander,retreatKeys,successTitle,history,briefing,ending,guest,camp,question,choices,refs,mapOpponent,mapLeader,mapReportRegion,matchupLabel}=stage;
 return {
  name,year,chapter:15,number:index+1,faction:'shu',place:name,mapPlace:place,originPlace:origin,viaPlaces:[],viewpointShift:shift,
  scene:`./assets/scenes/${scene}.jpg`,mission,missionTitle,enemyArmy,enemyCount:12,interval:3.8,
  noBoss:!commander,bossName:commander||enemyArmy,bossHp:commander?580:0,
  ...(stage.supplyStops?{supplyStops:stage.supplyStops}:{}),
  ...(commander?{skillType:'fire',skillName:'火路追擊',bossTitle:'追兵軍官・遊戲改編'}:{}),
  retreatKeys,successTitle,leaderName:leader,opponentName:opponent,mapOpponent,mapLeader,mapReportRegion,matchupLabel,
  lead:history,history,adaptation,note:adaptation,novel:[['說書人',history],[guest,camp]],
  opening:[['說書人',history],[leader,briefing],['說書人',adaptation]],
  ending:[['說書人',ending],[guest,camp]],campLine:ending,victory:ending,bossIntro:briefing,bossTip:commander?'標籤會顯示安全、快起火或燃燒中。可換安全路，或在有友軍的火路按「開路」一次。接應後全軍回左側。':briefing,
  quiz:{kind:'史書小偵探',hero:'liubei',title:question,scene:history,question,choices,answer:0,hint:history,reply:history},
  campTalkPrompts:{
   guanyu:{speaker:guest,title:guest,hint:'聊聊這一戰'},
   zhangfei:{speaker:guest,title:'戰後消息',hint:'看看這一戰的結果'}
  },
  campRetryPrompts:{
   guanyu:{speaker:guest,title:guest,hint:'先照應傷兵'},
   zhangfei:{speaker:guest,title:'再試一次',hint:'看看任務要點'}
  },
  campRetryTalk:{
   guanyu:[`${guest}：先照顧傷兵，清點軍糧，再整隊出發。`],
   zhangfei:[`${guest}：${briefing}`]
  },
  campTalk:{guanyu:[`${guest}：${camp}`],zhangfei:[`${guest}：${ending}`]},references:refs
 };
});
