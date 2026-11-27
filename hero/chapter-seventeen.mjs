const source=(volume,name)=>({title:`《三國志》卷${volume}・${name}`,url:`https://zh.wikisource.org/wiki/三國志/卷${volume}`});
const ruler=source(33,'後主傳'),zhuge=source(35,'諸葛亮傳'),zhao=source(36,'趙雲傳及裴松之注');
const jiang=source(44,'姜維傳'),wang=source(43,'王平傳'),zhang=source(17,'張郃傳'),ma=source(39,'馬良傳附馬謖');
const cao=source(9,'曹真傳及裴松之注'),guo=source(26,'郭淮傳');
const adaptation='路線為歷史區域示意，過關任務和營地對話為遊戲改編。三路兵卡保留既有養成，史實登場人物請看歷史小檔案。';

const stages=[
 {
  name:'漢中出師',year:227,place:'mianyang',origin:'chengdu',leader:'諸葛亮',guest:'諸葛亮',
  historyCast:['諸葛亮','劉禪'],mission:'dispatch',scene:'supply-road',enemyArmy:'山路游兵',
  history:'南征結束後，227 年，諸葛亮向劉禪呈上《出師表》，交代朝政上的建議與北伐的決心。隨後他率軍北駐漢中沔陽，準備出兵。',
  briefing:'派三路友軍接回三隊傳令使者，讓各營都收到進駐漢中的消息。',
  ending:'使者順利抵達。諸葛亮在漢中駐軍，隔年才出兵祁山。',
  camp:'出遠門前，家裡的事也要交代清楚。《出師表》就是交代這些心事和打算的奏章。',
  question:'諸葛亮北駐漢中前，向誰呈上《出師表》？',choices:['劉禪','吳王','魏帝'],refs:[ruler,zhuge]
 },
 {
  name:'隴右響應',year:228,place:'tianshui',origin:'qishan',leader:'諸葛亮',guest:'姜維',
  historyCast:['諸葛亮','姜維'],mission:'holdout',missionTitle:'隴右接應',scene:'mountain-front',enemyArmy:'沿途魏軍',
  history:'228 年春，諸葛亮出兵祁山。南安、天水、安定三郡響應蜀軍。天水官員姜維在局勢變動中投奔諸葛亮，後來隨軍回到漢中。史書對他投奔的細節有不同記載。',
  briefing:'照應三路，守住接應路線共 24 秒，再清退餘兵。',
  ending:'蜀軍在隴右獲得響應。魏國派兵反擊，響應的三郡沒有長期留在蜀軍手中。',
  camp:'我是天水人。遇到這場變局，我得選一條自己願意走的路。',
  question:'哪一位天水官員在這次北伐投奔諸葛亮？',choices:['姜維','一名吳國使者','一名成都守軍'],refs:[zhuge,jiang]
 },
 {
  name:'街亭撤離',year:228,place:'jieting',origin:'qishan',leader:'馬謖',guest:'王平',opponent:'張郃',
  historyCast:['馬謖','王平','張郃','諸葛亮'],mission:'withdraw',coverWaves:true,scene:'mountain-front',enemyArmy:'魏軍追兵',
  matchupLabel:'魏軍援將・街亭取勝',
  history:'馬謖帶前軍到街亭，沒有照諸葛亮的部署行事，敗給張郃。王平事前勸過馬謖，戰敗時仍穩住部隊，收攏各路散兵。',
  briefing:'照預警守住前兩波。第三波來時按「全軍撤離」，讓所有在場友軍退回左側。至少要有一隊平安撤回。',
  ending:'王平收攏散兵。街亭仍由魏軍取勝，諸葛亮撤回漢中。馬謖事後被處置，諸葛亮也請求降職。',
  camp:'散開的人先回來點名。街亭已經失守，我們還能把能帶回來的人帶回去。',
  question:'街亭失守後，誰穩住隊伍並收攏散兵？',choices:['王平','打下街亭的魏將','留守成都的官員'],refs:[zhuge,zhang,wang,ma]
 },
 {
  name:'箕谷收兵',year:228,place:'nanzheng',origin:'jigu',leader:'趙雲',guest:'鄧芝',opponent:'曹真',mapOpponent:false,shift:true,
  historyCast:['趙雲','鄧芝','曹真'],mission:'withdraw',coverWaves:true,scene:'mountain-front',enemyArmy:'沿道魏軍',
  matchupLabel:'魏軍統帥・箕谷戰線',
  history:'第一次北伐有兩條戰線。諸葛亮往祁山時，趙雲和鄧芝在箕谷牽制魏軍。遇到曹真軍抵抗，蜀軍失利，趙雲收束隊伍，避免更大的損失。',
  briefing:'哪一路亮起，就派友軍去擋。第三波追兵出現後按「全軍撤離」。至少保住一隊，讓所有還在場的友軍回到左側。',
  ending:'趙雲與鄧芝收兵回漢中。箕谷沒有取勝，這次保住更多部隊和物資。',
  camp:'守住退路、把隊伍整整齊齊帶回去，也是重要的任務。',
  question:'在箕谷領隊牽制魏軍的是誰？',choices:['趙雲與鄧芝','祁山的主力軍','成都的守城隊'],refs:[zhuge,zhao,cao]
 },
 {
  name:'陳倉糧盡',year:228,place:'chencang',origin:'sanguan',leader:'諸葛亮',guest:'諸葛亮',opponent:'郝昭',
  historyCast:['諸葛亮','郝昭','曹真'],mission:'withdraw',
  outpostSites:[{name:'攻城前陣'},{name:'側翼陣地'}],scene:'enemy-camp',enemyArmy:'魏軍守隊',
  matchupLabel:'魏軍守將・陳倉守城',
  history:'228 年冬，諸葛亮出散關圍陳倉。魏方已有準備，郝昭守住城池。蜀軍糧食用盡，諸葛亮下令撤回。此後魏將王雙追擊，敗於蜀軍。',
  briefing:'先選一處城外陣地，派友軍守住那一路，兩處都站穩後掩護後隊。接應到了就按「全軍撤離」，把友軍帶回左側。郝昭仍守著陳倉。',
  ending:'蜀軍糧盡後撤，陳倉未被攻下。王雙追擊時戰敗身亡，蜀軍回到漢中。',
  camp:'再堅固的軍隊也需要吃飯。糧食用盡，就得先把同伴接回去。',
  question:'蜀軍為什麼撤離陳倉？',choices:['軍糧用盡','城已攻下','準備渡江出使'],refs:[zhuge,ruler,cao]
 },
 {
  name:'武都陰平',year:229,place:'yinping',origin:'wudu',leader:'陳式',guest:'陳式',opponent:'郭淮',mapOpponent:false,
  historyCast:['陳式','諸葛亮','郭淮'],mission:'supply',supplyStops:['武都營地','山路驛站','陰平營地'],scene:'supply-road',enemyArmy:'沿路魏軍',
  matchupLabel:'魏方援將・諸葛亮進至建威後退走',
  history:'229 年，諸葛亮派陳式進攻武都、陰平。魏將郭淮準備救援，諸葛亮率軍到建威，郭淮退走，兩郡由蜀軍取得。',
  briefing:'派友軍守住亮起的路，再按「發送糧車」。護衛離開時糧車會停，回到這一路就繼續。三批糧車都送到，再清完剩下的敵兵。',
  ending:'蜀軍取得武都、陰平兩郡。諸葛亮恢復丞相職位。北伐的故事在這裡暫歇。',
  camp:'打開道路後，先把糧車送到。新的地方也需要時間和人手來安頓。',
  question:'陳式這一回拿下了哪兩郡？',choices:['武都、陰平','南安、安定','南鄭、成都'],refs:[ruler,zhuge,guo]
 }
];

export const SEVENTEENTH_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:17,number:index+1,faction:'shu',factionLabel:'蜀漢軍',place:stage.name,
 mapPlace:stage.place,originPlace:stage.origin,viaPlaces:[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
 leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,matchupLabel:stage.matchupLabel,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,
 ...(stage.coverWaves?{coverWaves:true}:{}),
 ...(stage.supplyStops?{supplyStops:stage.supplyStops}:{}),
 ...(stage.outpostSites?{outpostSites:stage.outpostSites}:{}),
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
