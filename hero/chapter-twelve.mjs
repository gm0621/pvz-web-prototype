const source=(volume,name)=>({title:`《三國志》卷${volume}・${name}`,url:`https://zh.wikisource.org/wiki/三國志/卷${volume}`});
const emperor=source('01','武帝紀'),xiahou=source('09','夏侯淵傳'),zhangLu=source('08','張魯傳');
const adaptation='對話、行軍路線及戰場任務是遊戲改編。出戰名單代表遊戲中的曹操軍，史實帶兵者以歷史小檔案為準。';

const chapters=[
 {
  name:'長安收隊',year:212,place:'changan',originPlace:'weinan',mission:'supply',
  leader:'夏侯淵',scene:'supply-road',enemyArmy:'沿途游軍',
  history:'建安十七年，曹操回鄴，留下夏侯淵等屯駐長安，繼續處理關中戰事。渭南戰事結束，關中還需要有人留守。',
  briefing:'長安是留守的據點。讓各路都有友軍接應，分三次送出糧車，再清退沿途游兵。',
  ending:'軍糧備妥。下一回轉看鄴城的消息，並非留守軍跟著曹操一起移防。',
  question:'曹操回鄴後，誰留駐長安一帶？',choices:['夏侯淵等人','曹丕','孫權'],references:[xiahou,emperor]
 },
 {
  name:'鄴城魏公',year:213,place:'ye',originPlace:'ye',mission:'dispatch',viewpointShift:true,
  leader:'曹操',scene:'supply-road',enemyArmy:'道路游軍',
  history:'建安十八年，漢獻帝封曹操為魏公。東漢仍在，曹操此時也還不是魏王。這一幕切回鄴城的消息。',
  briefing:'新消息得送到各處。派友軍護路，接回三隊使者後清退餘兵。',
  ending:'魏公是東漢朝廷封的爵位。接著把視線移回西邊，看看隴右的戰事。',
  question:'213 年曹操獲封什麼爵位？',choices:['魏公','魏王','皇帝'],references:[emperor]
 },
 {
  name:'祁山解圍',year:214,place:'qishan',originPlace:'changan',mission:'holdout',viewpointShift:true,
  leader:'夏侯淵',opponentName:'馬超',missionTitle:'祁山接應',scene:'mountain-front',enemyArmy:'圍城隊',
  history:'馬超向張魯借兵回攻祁山。夏侯淵派前鋒援救，馬超退回漢中，後來才轉投劉備。',
  briefing:'先派人接應守軍。每路都有人、敵軍未逼近時才累計接應時間，守滿 24 秒再清退餘兵。',
  ending:'援軍解了祁山之圍。馬超退回漢中，這一戰沒有單挑處決。',
  question:'祁山解圍之後，馬超先退到哪裡？',choices:['漢中','鄴城','江東'],references:[xiahou]
 },
 {
  name:'散關送糧',year:215,place:'sanguan',originPlace:'chencang',mission:'supply',viewpointShift:true,
  leader:'曹操',scene:'supply-road',enemyArmy:'山道敵軍',
  history:'建安二十年，曹操由陳倉出散關，向漢中進軍。史書記載沿途山道險阻，行軍十分辛苦。',
  briefing:'山路難走，糧車要分批前進。派友軍守住各路，按下發送糧車，共送出三批。',
  ending:'糧車到齊後，隊伍繼續往陽平關。路上的演練只是這段行軍的一小幕。',
  question:'曹操從陳倉經哪座關口西進？',choices:['散關','虎牢關','盧龍塞'],references:[emperor]
 },
 {
  name:'陽平關夜進',year:215,place:'yangping',originPlace:'sanguan',viaPlaces:['wudu'],mission:'formation',
  leader:'曹操',opponentName:'張魯',scene:'ambush-valley',enemyArmy:'陽平守軍',commander:true,
  history:'張魯的弟弟張衛等守陽平。曹操初攻不克，後來守備鬆動，曹軍在夜間得以突破。張魯退往巴中。',
  briefing:'正面一時過不去，先穩住各路。留意守軍的蓄力預警，換路躲開，再擊退守軍。',
  ending:'陽平關失守，曹軍進入南鄭。張魯此時退往巴中，歸降還要等到後來。',
  question:'陽平關失守後，張魯先去了哪裡？',choices:['巴中','許縣','譙縣'],references:[emperor,zhangLu]
 },
 {
  name:'南鄭迎使',year:215,place:'nanzheng',originPlace:'yangping',mission:'dispatch',
  leader:'曹操',opponentName:'張魯',scene:'supply-road',enemyArmy:'道路游軍',
  history:'曹操進入南鄭後派人安撫張魯。建安二十年冬，張魯從巴中率部歸降，曹操後來留夏侯淵鎮守漢中。',
  briefing:'使者要帶回消息。讓友軍護住安全路線，接回三隊使者，並清退道路上的敵兵。',
  ending:'張魯從巴中率部歸降。曹操離開時留下夏侯淵守漢中，故事還會繼續。',
  question:'曹操離開漢中時，留下誰鎮守？',choices:['夏侯淵','孫權','馬超'],references:[emperor,zhangLu]
 }
];

export const TWELFTH_CHAPTER=chapters.map((s,index)=>{
 const {name,year,place,originPlace,viaPlaces=[],viewpointShift=false,mission,missionTitle,scene,history,leader,opponentName,enemyArmy,briefing,ending,question,choices,references,commander=false}=s;
 const final=index===chapters.length-1;
 return {
  name,year,chapter:12,number:index+1,faction:'cao',place:name,mapPlace:place,originPlace,viaPlaces,viewpointShift,mission,missionTitle,
  scene:`./assets/scenes/${scene}.jpg`,enemyCount:commander?14:12,interval:3.8,enemyArmy,
  noBoss:!commander,bossName:commander?'陽平守軍主將':enemyArmy,bossHp:commander?680:0,
  ...(commander?{skillType:'charge',skillName:'關口重擊',bossTitle:'關口守將',duelOutcome:'retreat'}:{}),
  leaderName:leader,opponentName,matchupLabel:final?'來使與歸降・劇情人物':undefined,
  lead:history,history,adaptation,note:commander?`${adaptation} 陽平關失守的細節在裴注引書中有不同說法，關卡不指定單一夜襲經過。`:adaptation,
  novel:[['說書人',history],[leader,briefing]],
  opening:[[leader,briefing],['曹洪','記好本關目標。各隊照應，留意同伴的位置。'],['說書人',adaptation]],
  ending:[['說書人',ending],final?['張魯','先安頓同行的人，再往前走。']:['曹洪','清點隊伍吧，接下來還有路要走。']],
  campLine:ending,victory:ending,bossIntro:briefing,bossTip:briefing,
  quiz:{kind:'史書小偵探',hero:'liubei',title:question,scene:history,question,choices,answer:0,hint:history,reply:history},
  campTalk:{guanyu:[`夏侯惇：${briefing}`],zhangfei:[`曹洪：${ending}`]},references
 };
});
