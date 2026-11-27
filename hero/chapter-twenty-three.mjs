const source=(title,path)=>({title,url:`https://zh.wikisource.org/zh-hant/${path}`});
const jiangWei=source('《三國志》・姜維傳','三國志/卷44#姜維');
const zhongHui=source('《三國志》・鍾會傳','三國志/卷28#鍾會');
const dengAi=source('《三國志》・鄧艾傳','三國志/卷28#鄧艾');
const ruler=source('《三國志》・後主傳','三國志/卷33#後主_劉禪');
const xiZheng=source('《三國志》・郤正傳','三國志/卷42#郤正');
const weiGuan=source('《晉書》・衛瓘傳','晉書/卷036#衛瓘');
const jin=source('《晉書》・武帝紀','晉書/卷003');
const tongjian=source('《資治通鑑》・卷七十八','資治通鑑/卷078');
const adaptation='行軍圖以史書中的地名示意方向，遠程路線省略中途站。任務、營地對話和出戰兵卡為遊戲改編，人物結局依史書。';

const stages=[
 {
  name:'涪城繳兵',campBanner:'蜀',year:263,origin:'qiCounty',place:'fu',shift:true,
  leader:'姜維',guest:'姜維',opponent:'鍾會',mapOpponentRole:'受降',historyCast:['姜維','鍾會','劉禪'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'涪城交接',successTitle:'停戰軍令送達',
  history:'成都受降後，姜維等人在郪縣一帶查問消息。收到劉禪的命令後，他們放下兵器，到涪城向鍾會投降。',
  briefing:'派友軍在各路接應，讓三隊傳令使者都平安抵達。',
  ending:'姜維奉劉禪命令投降。鍾會優待姜維等人，暫時歸還他們的印信。',
  camp:'先把停戰的消息告訴還沒收到命令的人。大家放下兵器後，還得數清回來的隊伍。',
  question:'姜維到涪城向誰投降？',choices:['鍾會','鄧艾','東吳的使者'],refs:[jiangWei,zhongHui,tongjian]
 },
 {
  name:'鄧艾被徵',campBanner:'魏',year:264,origin:'chengdu',place:'chengdu',wei:true,shift:true,
  leader:'衛瓘',guest:'衛瓘',opponent:'鄧艾',mapOpponentRole:'被收押',mapStationRole:'交接地',historyCast:['衛瓘','鄧艾','鍾會'],
  mission:'restoration',missionTitle:'移交整備',missionSites:['詔令','車馬','名冊'],scene:'supply-road',enemyArmy:'軍令交接',successTitle:'移交整備完成',
  history:'攻下成都後，鄧艾自行安排官職。鍾會等人上報，魏廷下令收押鄧艾。衛瓘進成都執行命令，鄧艾被送進囚車。',
  briefing:'選擇一處整備，派友軍照應對應路線，備齊詔令、車馬和名冊。',
  ending:'鄧艾與兒子鄧忠被收押，移交魏廷。攻下成都的兩位魏軍主將，從此走上不同的道路。',
  camp:'命令已經交接。先把車馬和隊伍查點完，再讓後隊出發。',
  question:'誰進成都執行收押鄧艾的命令？',choices:['衛瓘','蜀漢的守將','東吳的使者'],refs:[dengAi,weiGuan,tongjian]
 },
 {
  name:'成都閉署',campBanner:'鍾',year:264,origin:'fu',place:'chengdu',wei:true,
  leader:'鍾會',guest:'胡烈',opponent:'胡烈',mapOpponentRole:'被扣魏將',historyCast:['鍾會','姜維','胡烈','衛瓘'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'府署急報',successTitle:'城中急報送達',
  history:'鄧艾被押後，鍾會在成都起兵反抗魏廷，把胡烈等魏將扣在府署。消息傳到城外軍營，士兵十分不安。',
  briefing:'護送三隊傳令使者。哪條路有友軍接應，就可以讓使者改走那條路。',
  ending:'魏軍得知將領被扣的消息，成都局勢更緊張。城外的士兵很快自行聚集起來。',
  camp:'城裡城外的人都在等消息。把傳話的人護送到安全的地方，再問清楚發生了什麼。',
  question:'被鍾會扣在府署的魏將當中，有哪一位？',choices:['胡烈','成都的百姓','洛陽的使者'],refs:[zhongHui,tongjian]
 },
 {
  name:'成都亂起',campBanner:'護',year:264,origin:'chengduOffice',place:'chengduStreets',shift:true,factionLabel:'成都護送隊',
  leader:'衛瓘',guest:'胡烈',opponent:'鍾會',mapOpponentRole:'兵變',historyCast:['衛瓘','鍾會','姜維','胡烈','鄧艾'],
  mission:'withdraw',coverWaves:true,scene:'mountain-front',enemyArmy:'混亂中的兵卒',enemyCount:12,successTitle:'護送隊平安撤回',
  history:'魏兵在成都反擊，鍾會和姜維都死在兵變中。裴松之引述的史料提到姜維曾想趁亂恢復蜀漢，事情最後沒有成功。鄧艾後來也在押送途中被殺。',
  briefing:'哪一路亮起，就派友軍去擋。第三波追兵出現後按「全軍撤離」。至少保住一隊，讓所有還在場的友軍回到左側。',
  ending:'鍾會和姜維在成都兵變中身亡，蜀漢沒有復國。兵變過後，成都重新由魏朝派員接管。',
  camp:'先把撤回來的人安頓好。城門外還有人不知道家人在哪裡，讓大家慢慢查問。',
  question:'鍾會和姜維最後怎麼了？',choices:['兩人都在成都兵變中身亡','一起返回劍閣','成功恢復蜀漢'],refs:[zhongHui,jiangWei,dengAi,tongjian]
 },
 {
  name:'安樂公入洛',campBanner:'行',year:264,origin:'chengdu',place:'luoyang',shift:true,factionLabel:'安樂公隨行隊',
  leader:'劉禪',guest:'郤正',historyCast:['劉禪','郤正'],
  mission:'supply',supplyStops:['成都城外','途中驛站','洛陽城門'],scene:'supply-road',enemyArmy:'遷居補給',successTitle:'隨行補給送達',
  history:'魏廷讓劉禪一家遷往洛陽，封他為安樂公。熟悉典章的蜀漢舊臣郤正跟他同行，幫他適應新的生活。',
  briefing:'派友軍守住亮起的路，再按「發送糧車」。護衛離開時糧車會停，回到這一路就繼續。三批補給送到就過關。',
  ending:'劉禪到洛陽後受封安樂公。郤正也到了洛陽，協助劉禪處理禮節。',
  camp:'換了地方，連拜見人的禮節也不同。先安頓同行的人，明天我再慢慢說給你聽。',
  question:'哪位蜀漢舊臣跟隨劉禪來到洛陽？',choices:['郤正','劍閣的守軍','東吳的使者'],refs:[ruler,xiZheng,tongjian]
 },
 {
  name:'洛陽建晉',campBanner:'晉',year:265,origin:'luoyang',place:'luoyang',wei:true,shift:true,factionLabel:'洛陽交接隊',
  leader:'司馬炎',guest:'司馬炎',mapStationRole:'受禪地',historyCast:['司馬炎'],
  mission:'restoration',missionTitle:'洛陽整備',missionSites:['冊書','禮壇','公告'],scene:'supply-road',enemyArmy:'洛陽交接',successTitle:'洛陽交接完成',
  history:'曹魏末年，司馬炎接過父親的地位，隨後接受魏帝讓位，建立西晉。當時東吳仍在長江以南，天下還沒有統一。',
  briefing:'選取冊書、禮壇和公告，派友軍照應對應路線，完成三處交接準備。',
  ending:'司馬炎於魏咸熙二年受禪，西晉建立，曹魏結束。東吳仍然存在，三國故事還有最後一段。',
  camp:'京城裡換了國號，消息要送到各地。東吳那邊，還是另一個國家。',
  question:'西晉建立時，哪一國仍然存在？',choices:['東吳','蜀漢','曹魏'],refs:[jin,source('《資治通鑑》・卷七十九','資治通鑑/卷079')]
 }
];

export const TWENTY_THIRD_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:23,number:index+1,faction:stage.wei?'cao':'shu',factionLabel:stage.factionLabel||(stage.wei?'魏軍':'蜀漢軍'),place:stage.name,campBanner:stage.campBanner,
 mapPlace:stage.place,originPlace:stage.origin,detailedRoute:true,viaPlaces:[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
 leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,matchupLabel:stage.matchupLabel,mapOpponentRole:stage.mapOpponentRole,mapStationRole:stage.mapStationRole,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
 successTitle:stage.successTitle,successRibbon:'戰 事 記 錄 ・ 回 營 整 備',
 ...(stage.supplyStops?{supplyStops:stage.supplyStops}:{}),
 ...(stage.mission==='withdraw'?{coverWaves:stage.coverWaves,retreatKeys:[]}:{}),
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
