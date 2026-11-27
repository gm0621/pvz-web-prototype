const source=(volume,name,section=name)=>({title:`《三國志》・${name}傳`,url:`https://zh.wikisource.org/zh-hant/三國志/卷${volume}#${section}`});
const ruler=source(33,'後主','後主_劉禪'),wei=source(40,'魏延'),yang=source(40,'楊儀'),wang=source(43,'王平');
const jiang=source(44,'蔣琬'),fei=source(44,'費禕'),jiangWei=source(44,'姜維'),cao=source('09','曹爽','子_爽');
const adaptation='地圖為歷史區域示意。三路任務、營地對話和兵卡為遊戲改編，史實登場人物請看歷史小檔案。';

const stages=[
 {
  name:'棧道爭路',year:234,origin:'xiegu',place:'southValley',leader:'楊儀',guest:'王平',opponent:'魏延',shift:true,
  historyCast:['楊儀','魏延','王平'],matchupLabel:'蜀軍內部爭端・魏延部',
  mission:'dispatch',scene:'mountain-front',enemyArmy:'魏延部',
  history:'回看五丈原撤軍途中。楊儀安排各營南退，魏延想繼續作戰，兩人發生衝突。魏延先行南返，燒斷棧道，在南谷口阻攔楊儀的隊伍。王平上前阻止。',
  briefing:'派友軍照應各路，接回三隊傳令使者，讓分散的隊伍知道往哪裡集合。',
  ending:'魏延部眾散去。魏延逃往漢中，後被楊儀派出的馬岱追殺。這是蜀軍內部的爭端，沒有魏軍參戰。',
  camp:'棧道斷了，先把路上的人接回來。各隊收到同一個消息，才知道往哪裡走。',
  question:'南谷口阻止魏延的是哪位將領？',choices:['王平','成都的使者','魏國守軍'],refs:[wei,yang,wang]
 },
 {
  name:'成都接任',year:234,origin:'chengdu',place:'chengdu',leader:'蔣琬',guest:'蔣琬',
  historyCast:['蔣琬','劉禪','諸葛亮'],mission:'restoration',missionTitle:'交接整備',missionSites:['案卷','糧冊','驛站'],scene:'supply-road',enemyArmy:'沿路游兵',
  history:'諸葛亮病逝後，劉禪任蔣琬為尚書令。蔣琬以前負責替北伐軍備糧、補充人手，諸葛亮也曾向劉禪推薦他。',
  briefing:'選擇案卷、糧冊和驛站，派友軍守住對應路線，完成三處交接。',
  ending:'蔣琬接下朝廷事務。許多人擔心失去諸葛亮後該怎麼辦，蔣琬沉著處理政務，逐漸讓大家安心。',
  camp:'糧冊寫著各營有多少米。點清這些小事，才知道哪裡最需要幫忙。',
  question:'諸葛亮病逝後，誰受命接掌朝廷事務？',choices:['蔣琬','吳國使者','魏軍主帥'],refs:[jiang,ruler]
 },
 {
  name:'漢中整軍',year:238,origin:'chengdu',place:'mianyang',leader:'蔣琬',guest:'姜維',
  historyCast:['蔣琬','姜維','王平'],mission:'pass-defense',missionTitle:'漢中布防',scene:'mountain-front',enemyArmy:'沿道游兵',
  history:'238 年，蔣琬奉命進駐漢中沔陽，姜維隨行。王平在漢中任前護軍，協助蔣琬處理營中事務。次年，蔣琬升任大司馬。',
  briefing:'哪一路亮起，就派友軍去守。擋住上路、下路、中路三波，保住防線，再清完剩下的敵兵。',
  ending:'漢中的隊伍整備完成。蔣琬駐在沔陽，蜀軍仍在觀察魏軍的動向。',
  camp:'我第一次到漢中是跟著諸葛丞相。這一回，換我幫忙熟悉路線、照應各營。',
  question:'蔣琬在 238 年率軍前往哪裡駐守？',choices:['漢中','洛陽','武昌'],refs:[jiang,jiangWei,wang,ruler]
 },
 {
  name:'涪城轉運',year:243,origin:'mianyang',place:'fu',leader:'蔣琬',guest:'費禕',
  historyCast:['蔣琬','費禕','王平'],mission:'supply',supplyStops:['山路口','接應站','涪縣營地'],scene:'supply-road',enemyArmy:'山路游兵',
  history:'243 年，蔣琬離開漢中，移駐涪縣。涪可以聯絡成都與漢中，便於互相支援。同年費禕升任大將軍，王平統領漢中守軍。',
  briefing:'派友軍守住亮起的路，再按「發送糧車」。護衛離開時糧車會停，回來就繼續。送到三批糧，再清完剩下的敵兵。',
  ending:'補給送到涪縣。蜀軍在後方備好人手，王平繼續守在漢中。',
  camp:'把糧補到中途的營地，前面缺糧時就能快些送到。涪是兩地之間的一個接應點。',
  question:'蔣琬移駐涪縣後，誰統領漢中守軍？',choices:['王平','成都的使者','來攻的魏軍主帥'],refs:[ruler,jiang,fei,wang]
 },
 {
  name:'興勢守關',year:244,origin:'nanzheng',place:'xingshi',leader:'王平',guest:'王平',opponent:'曹爽',
  historyCast:['王平','曹爽'],matchupLabel:'魏軍主帥・經駱谷進兵',
  mission:'pass-defense',scene:'mountain-front',enemyArmy:'魏軍前鋒',
  history:'244 年，曹爽率魏軍經駱谷進攻漢中。守軍少，王平主張先守住興勢，不讓魏軍進入平地。他派劉敏等先去守關，自己帶隊在後接應。',
  briefing:'看預警，派友軍守住來敵的路。上路、下路、中路各來一波。守住防線、清完三波就過關。',
  ending:'興勢仍由蜀軍守住。涪縣援軍趕往漢中，費禕也從成都出發。',
  camp:'前面的隊伍守山口，我們在後面照應。援軍到了，大家就能互相支援。',
  question:'王平為什麼先派人守住興勢？',choices:['不讓魏軍踏入漢中平地','要把軍糧全搬去洛陽','等魏軍送來援兵'],refs:[wang,fei,cao,ruler]
 },
 {
  name:'援軍解圍',year:244,origin:'chengdu',place:'xingshi',leader:'費禕',guest:'費禕',opponent:'曹爽',shift:true,
  historyCast:['費禕','王平','曹爽'],mapOpponent:false,matchupLabel:'魏軍主帥・糧運不繼後退兵',
  mission:'dispatch',scene:'mountain-front',enemyArmy:'魏軍後隊',
  history:'王平穩住興勢守軍。涪縣的隊伍與費禕率領的成都援軍相繼到達。魏軍在山道前進受阻，運糧困難，曹爽最後下令退兵。',
  briefing:'選有友軍守住的路，接回三隊使者，通知各營援軍抵達，再守住防線。',
  ending:'曹爽率魏軍退去，漢中守住了。費禕因救援有功，受封成鄉侯。',
  camp:'使者已把消息送到各營。先清點回來的人，再把糧食分給守關的隊伍。',
  question:'興勢守軍等到了哪位從成都來的援將？',choices:['費禕','蜀漢的皇帝','來攻的魏軍主帥'],refs:[fei,wang,cao,ruler]
 }
];

export const NINETEENTH_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:19,number:index+1,faction:'shu',factionLabel:'蜀漢軍',place:stage.name,
 mapPlace:stage.place,originPlace:stage.origin,viaPlaces:[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
 leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,matchupLabel:stage.matchupLabel,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
 ...(stage.supplyStops?{supplyStops:stage.supplyStops}:{}),
 noBoss:true,bossName:stage.enemyArmy,bossHp:0,enemyArmy:stage.enemyArmy,enemyCount:12,interval:3.8,
 lead:stage.history,history:stage.history,adaptation,note:adaptation,bossTip:stage.briefing,
 novel:[['說書人',stage.history],[stage.guest,stage.camp]],
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
