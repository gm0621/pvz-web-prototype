const source=(volume,name)=>({title:`《三國志》卷${volume}・${name}`,url:`https://zh.wikisource.org/wiki/三國志/卷${volume}`});
const liu=source('32','先主傳'),guan=source('36','關羽傳'),sun=source('47','吳主傳');
const yuXu=source('17','于禁傳、徐晃傳'),chronicle={title:'《資治通鑑》卷 68',url:'https://zh.wikisource.org/wiki/資治通鑑/卷068'};
const adaptation='對話、行軍圖和任務為遊戲改編。兵卡沿用各軍編制，實際領兵與人物結局以歷史小檔案為準。';

const stages=[
 {
  name:'沔陽傳令',place:'mianyang',origin:'mianyang',leader:'劉備',opponent:'關羽',mapOpponent:false,matchupLabel:'在荊州受命・劇情人物',
  mission:'dispatch',scene:'supply-road',enemyArmy:'道路游軍',
  history:'劉備在沔陽受推為漢中王，任命關羽為前將軍。關羽留在荊州領兵。這一幕從漢中的新任命說起，下一關切到荊州前線。',
  briefing:'讓友軍接應三隊傳令使者，把新任命平安傳出去。',
  ending:'使者平安回報。接下來轉到荊州，看關羽如何進兵襄樊。',
  guest:'劉備',camp:'消息交給使者，前線的事交給雲長。大家各守自己的崗位。',
  question:'劉備成為漢中王後，任命關羽擔任什麼職務？',choices:['前將軍','魏王','南郡太守'],refs:[liu,guan]
 },
 {
  name:'襄樊圍城',place:'fancheng',origin:'jiangling',viaPlaces:['xiangyang'],leader:'關羽',opponent:'曹仁',shift:true,
  mission:'holdout',missionTitle:'襄樊前線接應',scene:'enemy-camp',enemyArmy:'樊城守軍',
  history:'關羽向襄陽、樊城一帶進軍，圍攻曹仁守的樊城。兩城隔著漢水，襄陽也有曹軍防守。',
  briefing:'派人守住各路接應點。每路都有友軍且敵軍未逼近時，才會累計 24 秒的接應時間。',
  ending:'關羽軍形成包圍，曹仁仍守在樊城。曹操派于禁來援，戰事還沒結束。',
  guest:'關平',camp:'隔著漢水，各隊看不見彼此。確認消息送到，才能一起守住前線。',
  question:'樊城被圍時，守城的是誰？',choices:['曹仁','張魯','曹丕'],refs:[guan,source('09','曹仁傳'),chronicle]
 },
 {
  name:'漢水暴漲',place:'hanwater',origin:'fancheng',leader:'關羽',opponent:'于禁',
  mission:'naval',cargoRuns:3,fleetDestination:'安全渡口',navalEnemy:'曹軍',scene:'supply-road',enemyArmy:'曹軍船隊',
  history:'秋天連日大雨，漢水暴漲，于禁的援軍受困。于禁向關羽投降。龐德抵抗到最後，被俘後遇害。',
  briefing:'派友軍護送三批糧船到安全渡口。主航道快封航時可換路，航程會保留。三批送到，再清退餘船。',
  ending:'三批軍糧已送到安全渡口。雨水使戰局翻轉，于禁歸降，龐德被俘後遇害。曹仁仍守著樊城。',
  guest:'關平',camp:'連日大雨沖斷道路，光有糧食還不夠，也得想辦法把糧送到。',
  question:'史書記載漢水為什麼突然暴漲？',choices:['連日大雨','關羽挖開堤壩','風吹起浪'],refs:[guan,yuXu,source('18','龐德傳')]
 },
 {
  name:'樊城解圍',place:'fancheng',origin:'yancheng',leader:'徐晃',opponent:'關羽',shift:true,faction:'cao',
  mission:'outposts',outpostSites:[{name:'外圍營地'},{name:'城門圍陣'}],scene:'enemy-camp',enemyArmy:'圍城敵軍',commander:'圍陣守將',
  history:'曹操派徐晃救援曹仁。徐晃突破圍陣，關羽撤去樊城之圍。此時孫權一方也正從長江下游向關羽後方行動。',
  briefing:'選一處據點，派友軍守住那一路。拿下外圍營地和城門圍陣，再擊退守將與剩下的敵軍。',
  ending:'徐晃解了樊城之圍，關羽引軍撤離。江陵的消息也將改變關羽的處境。',
  guest:'徐晃',camp:'圍陣散開了，先清點隊伍。荊州後方的變化，也會影響這一戰。',
  question:'誰趕來替曹仁解了樊城之圍？',choices:['徐晃','夏侯淵','劉備'],refs:[guan,yuXu,chronicle]
 },
 {
  name:'江陵失守',place:'jiangling',origin:'jiangling',leader:'關羽',opponent:'呂蒙',shift:true,
  mapLeader:false,matchupLabel:'江陵已被呂蒙取得・後方消息',
  mission:'dispatch',scene:'supply-road',enemyArmy:'江岸追兵',
  history:'孫權派呂蒙襲取公安、江陵，陸遜進取宜都。關羽部眾的家人在江陵，得知家人平安後，許多人不願再戰。',
  briefing:'這一關接應的是帶回江陵消息的使者。讓友軍護住路線，接回三隊。',
  ending:'使者帶回消息，江陵已落入孫權手中。關羽軍逐漸散去，關羽退守麥城。',
  guest:'關平',camp:'家人平安的消息傳回來後，有些同伴已經離隊。我們也得找地方安頓。',
  question:'孫權派誰帶兵襲取公安、江陵？',choices:['呂蒙','徐晃','張飛'],refs:[guan,sun,source('54','呂蒙傳'),source('58','陸遜傳'),chronicle]
 },
 {
  name:'麥城出走',place:'zhangxiang',origin:'maicheng',leader:'關羽',opponent:'孫權',mapOpponent:false,
  matchupLabel:'派將攔截・劇情人物',retreatKeys:['guanyu'],
  campTalkPrompts:{
   guanyu:{speaker:'劉備',title:'劉備',hint:'談荊州消息'},
   zhangfei:{speaker:'劉備',title:'戰後消息',hint:'關羽與關平的結局'}
  },
  mission:'withdraw',coverWaves:true,scene:'ambush-valley',enemyArmy:'江東追兵',
  history:'關羽退守麥城後出走，身邊只剩少數人。孫權派朱然、潘璋截斷去路。章鄉的位置是戰區示意，史書也以臨沮交代關羽最後的結局。',
  briefing:'看亮起的路線，派友軍掩護。第三波追兵出現後按「全軍撤離」，把關羽和所有在場友軍帶回左側。',
  ending:'關羽、關平出走途中被潘璋部下馬忠擒獲，後來遇害。襄樊戰事告一段落。',
  guest:'劉備',camp:'荊州的消息傳來了。先安頓回來的人，也記住沒有回來的同伴。',
  question:'離開麥城後，關羽和關平遇到什麼事？',choices:['被俘後遇害','平安回到成都','攻下了樊城'],refs:[guan,sun,chronicle]
 }
];

export const FOURTEENTH_CHAPTER=stages.map((stage,index)=>{
 const {name,place,origin,viaPlaces=[],leader,opponent,faction='shu',shift=false,mission,missionTitle,scene,enemyArmy,commander,retreatKeys,history,briefing,ending,guest,camp,campTalkPrompts,question,choices,refs,mapOpponent,mapLeader,matchupLabel}=stage;
 return {
  name,year:219,chapter:14,number:index+1,faction,place:name,mapPlace:place,originPlace:origin,viaPlaces,viewpointShift:shift,
  scene:`./assets/scenes/${scene}.jpg`,mission,missionTitle,enemyArmy,enemyCount:commander?14:12,interval:3.8,
  noBoss:!commander,bossName:commander||enemyArmy,bossHp:commander?640:0,
  ...(stage.cargoRuns?{cargoRuns:stage.cargoRuns,fleetDestination:stage.fleetDestination,navalEnemy:stage.navalEnemy,successTitle:'三批軍糧平安送達',successRibbon:'軍 糧 靠 岸 ・ 回 營 整 備'}:{}),
  ...(stage.outpostSites?{outpostSites:stage.outpostSites,successTitle:'樊城解圍',successRibbon:'圍 陣 已 破 ・ 回 營 整 備'}:{}),
  ...(commander?{skillType:'charge',skillName:'圍陣重擊',bossTitle:'圍陣軍官・遊戲改編',duelOutcome:'retreat'}:{}),
  ...(stage.coverWaves?{coverWaves:true}:{}),
  ...(retreatKeys?{retreatKeys,successTitle:'離開麥城',successRibbon:'戰 事 記 錄 ・ 聽 聽 後 記'}:{}),
  leaderName:leader,opponentName:opponent,mapOpponent,mapLeader,matchupLabel,
  lead:history,history,adaptation,note:adaptation,novel:[['說書人',history],[guest,camp]],
  opening:[['說書人',history],[leader,briefing],['說書人',adaptation]],
  ending:[['說書人',ending],[guest,camp]],campLine:ending,victory:ending,bossIntro:briefing,bossTip:briefing,
  quiz:{kind:'史書小偵探',hero:'guanyu',title:question,scene:history,question,choices,answer:0,hint:history,reply:history},
  campTalkPrompts,campTalk:{guanyu:[`${guest}：${camp}`],zhangfei:[`${guest}：${ending}`]},references:refs
 };
});
