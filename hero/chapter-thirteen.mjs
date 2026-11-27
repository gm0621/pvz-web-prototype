const source=(volume,name)=>({title:`《三國志》卷${volume}・${name}`,url:`https://zh.wikisource.org/wiki/三國志/卷${volume}`});
const annals=source('01','武帝紀'),weiGenerals=source('17','張郃傳、徐晃傳'),liu=source('32','先主傳');
const chronicle=volume=>({title:`《資治通鑑》卷 ${volume}`,url:`https://zh.wikisource.org/wiki/資治通鑑/卷0${volume}`});
const laterAnnals=chronicle(68);
const adaptation='對話、行軍圖及任務為遊戲改編。出戰隊伍代表遊戲操作，實際領兵的人以歷史小檔案為準。';

const stages=[
 {
  name:'宕渠收兵',year:215,place:'dangqu',origin:'nanzheng',leader:'張郃',opponent:'張飛',
  mission:'withdraw',coverWaves:true,scene:'ambush-valley',enemyArmy:'巴西追兵',
  history:'張魯歸降後，曹操派張郃向巴地進軍。張飛在宕渠一帶擊敗張郃，張郃退回南鄭。瓦口交戰承接建安二十年末的戰事。',
  briefing:'哪一路亮起，就派友軍去擋。第三波追兵出現後按「全軍撤離」。至少保住一隊，讓所有還在場的友軍回到左側。',
  ending:'張郃收攏隊伍，退回南鄭。這一關救回了隊伍，瓦口之戰仍由張飛打勝。',
  speaker:'張郃',camp:'山道窄，一隊掉頭慢了，後面就都堵住。下次記得先留退路。',
  question:'宕渠一帶的瓦口之戰，誰打退了張郃？',choices:['張飛','張魯','曹丕'],
  refs:[annals,liu,source('36','張飛傳'),chronicle(67)]
 },
 {
  name:'鄴城魏王',year:216,place:'ye',origin:'ye',leader:'曹操',shift:true,
  mission:'dispatch',scene:'supply-road',enemyArmy:'道路游軍',
  history:'建安二十一年，曹操回到鄴城。五月，漢獻帝把曹操的爵位從魏公升為魏王，此時東漢仍在。',
  briefing:'新消息要從城門送出去。讓友軍照應使者，接回三隊，再清退餘兵。',
  ending:'消息安全送達。魏王是曹操在東漢時得到的爵位，皇帝仍是漢獻帝。',
  speaker:'曹丕',camp:'把兩個年份記在一起就好：213 年是魏公，216 年才是魏王。',
  question:'216 年，曹操由魏公升為什麼？',choices:['魏王','漢中王','皇帝'],
  refs:[annals]
 },
 {
  name:'濡須對峙',year:217,place:'ruxu',origin:'juchao',leader:'曹操',opponent:'孫權',shift:true,
  mission:'naval',fleetDestination:'回營渡口',scene:'supply-road',enemyArmy:'吳軍巡船',successTitle:'船隊平安回營',
  history:'曹操在 216 年冬南征，經居巢進攻濡須。217 年春，孫權遣使與曹操修好，曹操引軍離開。這次對峙沒有讓曹操取得江東。',
  briefing:'派友軍護送主船。主航道快封航時可換航道。船到回營渡口、清退剩下的敵船就過關。',
  ending:'前線接應完成。孫權遣使修好，曹操帶兵離開，江東仍由孫權掌握。',
  speaker:'曹操',camp:'使者到了，前線可以收隊。過江之前，先要知道自己能不能回來。',
  question:'濡須對峙後，孫權做了什麼？',choices:['派使者修好','交出江東','前往定軍山'],
  refs:[annals,source('47','吳主傳')]
 },
 {
  name:'馬鳴閣道',year:218,place:'maming',origin:'yangping',leader:'徐晃',opponent:'陳式',shift:true,
  mission:'pass-defense',missionTitle:'閣道守備',scene:'mountain-front',enemyArmy:'截道隊',
  history:'劉備進兵漢中，與夏侯淵、張郃在陽平一帶對峙。劉備派陳式等人切斷馬鳴閣道，徐晃出兵打退了這支隊伍。',
  briefing:'閣道是靠著山崖修的路。哪一路亮起，就派友軍去守。擋住三波，再清完剩下的敵兵。',
  ending:'徐晃保住了閣道，曹軍仍能傳遞消息。這是漢中爭戰中的一場局部勝利。',
  speaker:'徐晃',camp:'一條路斷了，糧車和消息都過不去。今天守住的是整支隊伍的聯絡線。',
  question:'劉備派誰等人去切斷閣道？',choices:['陳式','張魯','曹丕'],
  refs:[weiGenerals,liu]
 },
 {
  name:'定軍山爭高地',year:219,place:'dingjun',origin:'yangping',leader:'劉備',opponent:'夏侯淵',shift:true,faction:'shu',
  mission:'formation',scene:'mountain-front',enemyArmy:'漢中守軍',commander:true,
  history:'劉備從陽平向南渡過沔水，在定軍山依山紮營。法正看準時機，劉備派黃忠從高處出擊，夏侯淵在此役戰死。',
  briefing:'夏侯淵蓄力時，戰場會亮出受威脅的路線。調動友軍避開預警，再擊破守軍。',
  ending:'黃忠按令出擊，夏侯淵戰死。張郃收攏曹軍，漢中之戰還沒有結束。',
  speaker:'黃忠',camp:'等到號令才一起動，力氣才用在同一個地方。法正的眼光幫了大忙！',
  question:'定軍山一戰，劉備派誰從高處出擊？',choices:['黃忠','關羽','趙雲'],
  refs:[liu,source('36','黃忠傳'),source('37','法正傳'),laterAnnals]
 },
 {
  name:'漢中歸劉',year:219,place:'mianyang',origin:'dingjun',leader:'劉備',opponent:'曹操',faction:'shu',
  mission:'supply',supplyStops:['定軍山營地','山路驛站','沔陽營地'],scene:'supply-road',enemyArmy:'山道敵軍',
  history:'曹操從長安來援。劉備守住險要，沒有與曹操主力決戰。夏天曹操撤回長安，劉備得到漢中，秋天在沔陽受群臣推為漢中王。',
  briefing:'派友軍守住亮起的路，再按「發送糧車」。護衛離開時糧車會停，回到這一路就繼續。三批糧車都送到，再清完剩下的敵兵。',
  ending:'曹操撤回長安，漢中由劉備掌握。入秋後，群臣在沔陽推舉劉備為漢中王。',
  speaker:'法正',camp:'春天奪下定軍山，夏天曹軍才撤走。到秋天，大家又在沔陽見證了新的變化。',
  question:'曹操撤出漢中後，誰掌握漢中？',choices:['劉備','孫權','張魯'],
  refs:[liu,annals,laterAnnals],mapOpponent:false,matchupLabel:'曹操撤回長安・戰後消息'
 }
];

export const THIRTEENTH_CHAPTER=stages.map((stage,index)=>{
 const {name,year,place,origin,leader,opponent,faction='cao',shift=false,mission,missionTitle,scene,enemyArmy,commander,history,briefing,ending,speaker,camp,question,choices,refs,mapOpponent,matchupLabel}=stage;
 const withdraw=mission==='withdraw';
 return {
  name,year,chapter:13,number:index+1,faction,place:name,mapPlace:place,originPlace:origin,viaPlaces:[],viewpointShift:shift,
  scene:`./assets/scenes/${scene}.jpg`,mission,missionTitle,enemyArmy,enemyCount:commander?14:12,interval:3.8,
  noBoss:!commander,bossName:commander?opponent:enemyArmy,bossHp:commander?620:0,
  ...(stage.supplyStops?{supplyStops:stage.supplyStops}:{}),
  ...(commander?{skillType:'charge',skillName:'山陣突擊',bossTitle:'漢中守將'}:{}),
  ...(withdraw?{coverWaves:stage.coverWaves,retreatKeys:[],successTitle:'保全撤離'}:mission==='naval'?{fleetDestination:stage.fleetDestination,successTitle:stage.successTitle,successRibbon:'平 安 靠 岸 ・ 回 營 整 備'}:{}),
  leaderName:leader,opponentName:opponent,mapOpponent,matchupLabel:matchupLabel||(opponent&&!withdraw?'對方主事者・劇情人物':undefined),
  lead:history,history,adaptation,note:adaptation,novel:[['說書人',history],[speaker,camp]],
  opening:[['說書人',history],[leader,briefing],['說書人',adaptation]],
  ending:[['說書人',ending],[speaker,camp]],campLine:ending,victory:ending,bossIntro:briefing,bossTip:briefing,
  quiz:{kind:'史書小偵探',hero:'liubei',title:question,scene:history,question,choices,answer:0,hint:history,reply:history},
  campTalk:{guanyu:[`${speaker}：${camp}`],zhangfei:[`${leader}：${ending}`]},references:refs
 };
});
