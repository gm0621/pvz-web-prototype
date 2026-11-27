const source=(volume,name,section=name)=>({title:`《三國志》・${name}傳`,url:`https://zh.wikisource.org/zh-hant/三國志/卷${volume}#${section}`});
const ruler=source(33,'後主','後主_劉禪'),jiangWei=source(44,'姜維');
const dengAi=source(28,'鄧艾'),zhongHui=source(28,'鍾會'),zhangYi=source(45,'張翼'),liaoHua=source(45,'廖化');
const adaptation='行軍圖是歷史區域與方向示意。三路任務、營地對話和可出戰隊伍為遊戲改編，史實人物請看歷史小檔案。';
const retreat='哪一路亮起，就派友軍去擋。第三波追兵出現後按「全軍撤離」。至少保住一隊，讓所有還在場的友軍回到左側。';

const stages=[
 {
  name:'段谷撤兵',year:256,origin:'zhongti',place:'duangu',leader:'姜維',guest:'姜維',opponent:'鄧艾',
  historyCast:['姜維','鄧艾'],matchupLabel:'魏將鄧艾・在段谷擊敗蜀軍',
  mission:'withdraw',coverWaves:true,scene:'mountain-front',enemyArmy:'魏軍追兵',
  history:'從狄道撤兵後，姜維隔年再度出兵，原本約了另一支蜀軍在上邽會合。援軍未到，鄧艾在段谷擊敗姜維，蜀軍有許多人傷亡。',
  briefing:retreat,
  ending:'蜀軍在段谷戰敗。姜維把散開的隊伍撤回，自請降官，仍繼續負責軍務。',
  camp:'快點清各隊回來多少人。這次出了差錯，我會把經過如實報給朝廷。',
  question:'哪位魏將在段谷擊敗姜維？',choices:['鄧艾','東吳的援將','蜀漢的使者'],refs:[jiangWei,dengAi,ruler]
 },
 {
  name:'芒水相持',year:257,origin:'luogu',place:'mangshui',leader:'姜維',guest:'姜維',opponent:'鄧艾',mapOpponent:false,shift:true,
  historyCast:['姜維','鄧艾'],matchupLabel:'魏將鄧艾・魏軍在長城一帶築營',
  mission:'pass-defense',missionTitle:'芒水守營',scene:'mountain-front',enemyArmy:'沿路游兵',
  history:'魏軍有一部分調往東邊平亂，姜維趁機經駱谷北上，在芒水靠山扎營。鄧艾等魏將靠近渭水守住營壘，姜維多次邀戰，魏軍始終不出。',
  briefing:'哪一路亮起，就派友軍去守。擋住上路、下路、中路三波，保住防線，再清完剩下的敵兵。',
  ending:'兩軍在芒水一帶相持。次年姜維得知魏國已平定東邊的叛軍，便撤回成都。',
  camp:'前面還守得很嚴。先讓大家輪替休息，就算等上一段時間，三路也得有人照應。',
  question:'姜維在芒水遇到魏軍堅守，後來怎麼做？',choices:['得知魏國平亂後撤回成都','攻下魏國都城','投奔東吳'],refs:[jiangWei,dengAi,ruler]
 },
 {
  name:'侯和退屯',year:262,origin:'houhe',place:'tazhong',leader:'姜維',guest:'姜維',opponent:'鄧艾',mapOpponent:false,shift:true,
  historyCast:['姜維','鄧艾'],matchupLabel:'魏將鄧艾・在侯和擊敗蜀軍',
  mission:'supply',supplyStops:['山口','谷道','沓中營地'],scene:'supply-road',enemyArmy:'沿路游兵',
  history:'幾年後，姜維再到侯和一帶出兵，又被鄧艾擊敗，退駐沓中。遊戲把這次退屯改編成把糧車護送到沓中的任務。',
  briefing:'派友軍守住亮起的路，再按「發送糧車」。三批糧車依序走山口、谷道、沓中營地，送完後清退餘兵。',
  ending:'姜維在侯和失利後留駐沓中。隔年，魏軍分路攻蜀，沓中也受到進攻。',
  camp:'山路長，糧車不能落單。每一批都要派友軍一路護送。',
  question:'侯和失利後，姜維退駐何處？',choices:['沓中','洛陽','江陵'],refs:[jiangWei,dengAi,ruler]
 },
 {
  name:'沓中脫身',year:263,origin:'tazhong',place:'yinping',leader:'姜維',guest:'廖化',opponent:'鄧艾',mapOpponent:false,
  historyCast:['姜維','廖化','鄧艾','鍾會'],matchupLabel:'鄧艾進逼沓中・鍾會另由漢中進軍',
  mission:'withdraw',coverWaves:true,scene:'mountain-front',enemyArmy:'魏軍追兵',
  history:'魏軍分道進攻。鄧艾在沓中牽制姜維，鍾會另率軍進入漢中。姜維回撤時遇上追兵，又聽說陰平橋頭被魏軍堵住，便改道牽動守兵，再趁空隙返回橋頭。',
  briefing:retreat,
  ending:'姜維趕過陰平橋頭，魏軍沒能及時攔住。廖化奉命救援，之後陪姜維退往劍閣方向。',
  camp:'橋過去了，還得數清楚有幾隊跟上。等後隊到齊，我們再往會合的地方走。',
  question:'鄧艾進逼沓中時，哪位魏將另率軍進入漢中？',choices:['鍾會','蜀軍援將','東吳的守將'],refs:[jiangWei,dengAi,zhongHui,liaoHua]
 },
 {
  name:'漢壽會師',year:263,origin:'yinping',place:'hanshou',leader:'姜維',guest:'張翼',opponent:'鍾會',mapOpponent:false,shift:true,
  historyCast:['姜維','廖化','張翼','鍾會'],matchupLabel:'魏將鍾會・由漢中繼續向南',
  mission:'dispatch',scene:'supply-road',enemyArmy:'沿路魏兵',
  history:'陽安關口失守，魏軍繼續南下。張翼等援軍剛到漢壽，姜維與廖化也離開陰平。幾路蜀軍會合後，一起往劍閣退去。行軍圖以漢壽標示援軍所在的方向。',
  briefing:'派友軍守住路口，接回三隊聯絡使者，讓各隊知道會合方向。',
  ending:'退下來的蜀軍會合，把防線移到劍閣。鍾會率魏軍繼續追來。',
  camp:'陽安關來不及救了。把消息送到各隊手上，大家才知道下一個集合點在劍閣。',
  question:'幾路蜀軍會合後，到哪裡一起守關？',choices:['劍閣','白帝城','洛陽'],refs:[jiangWei,zhongHui,zhangYi]
 },
 {
  name:'劍閣守關',year:263,origin:'hanshou',place:'jiange',leader:'姜維',guest:'張翼',opponent:'鍾會',
  historyCast:['姜維','廖化','張翼','鍾會','鄧艾'],matchupLabel:'鍾會在劍閣受阻・鄧艾另走陰平',
  mission:'pass-defense',scene:'mountain-front',enemyArmy:'魏軍前鋒',
  history:'姜維、張翼和廖化等人據險守住劍閣。鍾會攻不下關口，軍糧又要從遠處運來，便考慮退軍。此時鄧艾另從陰平走山路，向蜀地腹地前進。',
  briefing:'看預告在哪一路，調友軍守住關口。三波敵軍全數清退，防線還在就過關。',
  ending:'劍閣擋住了鍾會。另一邊，鄧艾走陰平山路深入蜀地，成都接下來還要面對新的危機。',
  camp:'先把山口守住了。糧冊點完，再派人打聽另一條線的消息。',
  question:'劍閣守軍擋住了哪位魏將的軍隊？',choices:['鍾會','從陰平繞行的魏將','從東吳來的援將'],refs:[jiangWei,zhongHui,dengAi,zhangYi,ruler]
 }
];

export const TWENTY_FIRST_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:21,number:index+1,faction:'shu',factionLabel:'蜀漢軍',place:stage.name,
 mapPlace:stage.place,originPlace:stage.origin,detailedRoute:true,viaPlaces:[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
 leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,matchupLabel:stage.matchupLabel,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
 ...(stage.supplyStops?{supplyStops:stage.supplyStops}:{}),
 ...(stage.coverWaves?{coverWaves:true}:{}),
 ...(stage.mission==='withdraw'?{retreatKeys:[],successTitle:'全軍撤回'}:{}),
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
