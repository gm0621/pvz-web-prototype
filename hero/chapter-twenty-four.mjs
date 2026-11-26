const source=(title,path)=>({title,url:`https://zh.wikisource.org/zh-hant/${path}`});
const yangHu=source('《晉書》・羊祜傳','晉書/卷034#羊祜');
const luKang=source('《三國志》・陸抗傳','三國志/卷58#陸抗');
const duYu=source('《晉書》・杜預傳','晉書/卷034#杜預');
const wangJun=source('《晉書》・王濬傳','晉書/卷042#王濬');
const sunHao=source('《三國志》・孫皓傳','三國志/卷48#孫皓');
const tongjian79=source('《資治通鑑》・卷七十九','資治通鑑/卷079');
const tongjian80=source('《資治通鑑》・卷八十','資治通鑑/卷080');
const tongjian81=source('《資治通鑑》・卷八十一','資治通鑑/卷081');
const adaptation='行軍圖以史書地名示意方向，省略沿途站點。兵卡、出戰隊伍、任務與營地對話屬遊戲改編，人物與戰事結果依史書。';

const stages=[
 {
  name:'襄陽屯田',year:269,origin:'luoyang',place:'xiangyang',shift:true,
  leader:'羊祜',guest:'羊祜',historyCast:['司馬炎','羊祜','陸抗'],
  mission:'restoration',missionTitle:'襄陽屯田',missionSites:['田地','水渠','糧倉'],scene:'supply-road',enemyArmy:'邊地屯田',successTitle:'襄陽田備完成',
  history:'西晉建立後，司馬炎派羊祜到荊州，駐在襄陽。羊祜讓部分士兵耕作，累積軍糧。長江一帶仍是晉、吳的邊界，後來吳將陸抗在對岸一帶守備。',
  briefing:'派友軍照應對應路線，整備田地、水渠和糧倉。',
  ending:'羊祜在襄陽屯田，邊地漸漸存下軍糧。晉、吳在荊州相望，東吳仍守著長江沿岸。',
  camp:'糧倉要乾燥，水渠要暢通。把這兩件事理好，收來的穀子才放得久。',
  question:'羊祜在襄陽讓部分士兵做什麼？',choices:['耕作存糧','搬到洛陽','放下兵器投降'],refs:[yangHu,tongjian79]
 },
 {
  name:'西陵守圍',year:272,origin:'lexiangWu',place:'xiling',shift:true,wu:true,
  leader:'陸抗',guest:'陸抗',opponent:'羊祜',mapOpponentRole:'江陵另路',matchupLabel:'晉援軍・羊祜另一路往江陵',historyCast:['陸抗','羊祜','步闡'],
  mission:'holdout',missionTitle:'西陵守備',scene:'mountain-front',enemyArmy:'晉軍援兵',enemyCount:12,successTitle:'西陵守備完成',
  history:'吳將步闡在西陵反叛，向西晉求援。陸抗帶吳軍到西陵，晉軍分路來援，羊祜領一路前往江陵。陸抗守住圍線，晉援軍最後撤走。',
  briefing:'派隊伍照應每一路，累積守備 24 秒，再清退場上的援軍。',
  ending:'陸抗拿回西陵，晉軍撤退。晉、吳繼續隔著邊界相持，史書也記載羊祜和陸抗後來互通使者。',
  camp:'西陵守住了。接下來把各處的人數點清，家在附近的人也能知道消息了。',
  question:'272 年的西陵之戰，最後是哪一方保住西陵？',choices:['陸抗帶領的東吳','從江陵來的晉軍','早已滅亡的蜀漢'],refs:[luKang,yangHu,tongjian79]
 },
 {
  name:'襄陽交印',year:278,origin:'xiangyang',place:'xiangyang',shift:true,
  leader:'杜預',guest:'杜預',opponent:'羊祜',mapOpponentRole:'舉薦',mapStationRole:'接任地',historyCast:['羊祜','杜預','司馬炎'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'襄陽交接',successTitle:'接任軍令送達',
  history:'陸抗在 274 年病逝。幾年後，生病的羊祜向司馬炎推薦杜預接掌荊州事務。278 年羊祜去世，杜預接任，繼續整備。',
  briefing:'接應三隊送軍令的使者。選擇有友軍照應的路線。',
  ending:'羊祜舉薦的杜預接掌荊州。晉朝之後分多路出兵，長江上游的船隊也是其中一路。',
  camp:'接過新的職責，先聽各營帶來的消息。哪裡有人、哪裡有糧，都要對清楚。',
  question:'羊祜推薦誰接任？',choices:['杜預','一位吳國使者','襄陽的百姓'],refs:[yangHu,duYu,tongjian80]
 },
 {
  name:'益州備舟',year:279,origin:'jinYizhou',place:'jinYizhou',shift:true,
  leader:'王濬',guest:'王濬',mapStationRole:'備舟地',historyCast:['王濬','司馬炎'],
  mission:'naval',cargoRuns:3,fleetDestination:'備舟碼頭',scene:'supply-road',enemyArmy:'船隊補給',successTitle:'船隊補給送達',
  history:'王濬早已在益州準備戰船。279 年，司馬炎下令多路伐吳。王濬率領上游船隊，準備順長江往東。',
  briefing:'派友軍到糧船走的航道，護送三批軍糧到備舟碼頭。主航道快封時，按「改走航道」沿岸走，已走的距離會保留。',
  ending:'晉軍分路南下，王濬的船隊從長江上游出發。接下來要經過吳軍的西部關口。',
  camp:'船要走遠路，糧袋得先點好。三批補給都收到了，就把數目交給管理的人。',
  question:'王濬在什麼地方準備戰船？',choices:['益州','洛陽城內','襄陽田間'],refs:[wangJun,tongjian81]
 },
 {
  name:'西陵順流',year:280,origin:'jinYongan',place:'xiling',
  leader:'王濬',guest:'王濬',historyCast:['王濬','杜預'],
  mission:'naval',scene:'mountain-front',enemyArmy:'吳軍巡江船隊',enemyCount:12,successTitle:'主船抵達西陵',
  history:'280 年，王濬率船隊順長江東下，晉軍攻下西陵等據點。杜預從另一條路進軍江陵。兩路推進後，王濬繼續向長江下游前進。',
  briefing:'派友軍替主船護航。主航道較快，亮出封航預警時可按「改走航道」。護送主船到西陵，再清退剩餘敵軍。',
  ending:'這次西陵落入晉軍手中。王濬繼續向東，後來經武昌直往東吳都城建業。',
  camp:'沿江的消息已經接到。把受傷的人和補給先安頓好，這一路還沒走完。',
  question:'280 年攻下西陵等據點的晉軍船隊，由誰率領？',choices:['王濬','一位吳國使者','襄陽的農兵'],refs:[wangJun,duYu,tongjian81]
 },
 {
  name:'孫皓受降',year:280,origin:'wuWuchang',place:'shitou',shift:true,
  leader:'王濬',guest:'孫皓',opponent:'孫皓',mapOpponentRole:'請降',historyCast:['王濬','孫皓','司馬炎'],
  mission:'restoration',missionTitle:'石頭城交接',missionSites:['降書','印綬','城門'],scene:'supply-road',enemyArmy:'建業交接',successTitle:'石頭城交接完成',
  history:'王濬由武昌順江抵達建業石頭城。東吳皇帝孫皓出降，王濬接受投降。魏、蜀、吳分立的局面至此結束。',
  briefing:'派友軍看守對應路線，完成降書、印綬和城門三處交接。',
  ending:'孫皓在石頭城向王濬投降，東吳滅亡。280 年，西晉結束三國分立，天下再度統一。',
  camp:'城門已經交接，先把消息傳給城裡的人。走了這麼長的路，也讓大家回去歇一歇吧。',
  question:'孫皓在石頭城向誰投降？',choices:['王濬','東吳的守軍','建業的使者'],refs:[wangJun,sunHao,tongjian81]
 }
];

export const TWENTY_FOURTH_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:24,number:index+1,faction:stage.wu?'sun':'cao',factionLabel:stage.wu?'東吳軍':'西晉軍',place:stage.name,campBanner:stage.wu?'吳':'晉',
 mapPlace:stage.place,originPlace:stage.origin,detailedRoute:true,viaPlaces:[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
 leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,matchupLabel:stage.matchupLabel,mapOpponentRole:stage.mapOpponentRole,mapStationRole:stage.mapStationRole,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
 ...(stage.cargoRuns?{cargoRuns:stage.cargoRuns,fleetDestination:stage.fleetDestination}:{}),
 successTitle:stage.successTitle,successRibbon:'戰 事 記 錄 ・ 回 營 整 備',
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
