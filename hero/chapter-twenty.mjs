const source=(volume,name,section=name)=>({title:`《三國志》・${name}傳`,url:`https://zh.wikisource.org/zh-hant/三國志/卷${volume}#${section}`});
const ruler=source(33,'後主','後主_劉禪');
const jiang=source(44,'蔣琬'),fei=source(44,'費禕'),jiangWei=source(44,'姜維');
const guo=source(26,'郭淮'),xiahou=source('09','夏侯霸','子霸等'),chen=source(22,'陳泰','子_泰');
const adaptation='行軍圖是歷史區域示意。三路任務、營地對話與可出戰隊伍為遊戲改編，史實人物請看歷史小檔案。';

const stages=[
 {
  name:'涪城新訊',year:246,origin:'chengdu',place:'chengdu',leader:'費禕',guest:'費禕',
  historyCast:['費禕','蔣琬'],mission:'restoration',missionTitle:'安頓三處',missionSites:['糧冊','驛站','營簿'],scene:'supply-road',enemyArmy:'沿路游兵',
  history:'興勢解圍兩年後，費禕在夏天回到成都。這年冬天，曾駐在涪縣的蔣琬病逝，已是大將軍的費禕繼續主持蜀漢政務。',
  briefing:'輪流選擇糧冊、驛站和營簿，守住對應路線，完成各處的整備。',
  ending:'費禕繼續照料各營。次年，姜維率軍向北，在洮河一帶遇上魏軍。',
  camp:'前線要幾袋米，路上有幾匹馬，都要記清楚。少算一項，整隊人就可能得在山路上等。',
  question:'蔣琬病逝後，誰繼續主持蜀漢政務？',choices:['費禕','吳國使者','涪縣守軍'],refs:[ruler,jiang,fei]
 },
 {
  name:'洮西接應',year:247,origin:'mianyang',place:'taoxi',leader:'姜維',guest:'姜維',opponent:'郭淮',shift:true,
  historyCast:['姜維','郭淮','夏侯霸'],matchupLabel:'郭淮、夏侯霸迎擊蜀軍',
  mission:'dispatch',scene:'mountain-front',enemyArmy:'魏軍前鋒',
  history:'姜維率蜀軍出兵隴西等地，在洮河西邊遇上郭淮與夏侯霸。當地有一些部眾投向蜀漢，姜維接應他們回到蜀地。',
  briefing:'每次選一路有友軍照應的通道，接回三隊使者，再守住防線。',
  ending:'姜維把投向蜀漢的部眾帶回安置。這時夏侯霸還是魏將。兩年後，他也將來到蜀地。',
  camp:'先問清楚哪條路有人照應，再派使者。山裡走錯路，多繞一個山頭就可能天黑了。',
  question:'247 年的洮西戰事中，夏侯霸是哪一邊的將領？',choices:['曹魏','蜀漢','東吳'],refs:[jiangWei,guo]
 },
 {
  name:'陰平迎將',year:249,origin:'yinping',place:'mianyang',leader:'夏侯霸',guest:'夏侯霸',shift:true,
  historyCast:['夏侯霸','曹爽'],mission:'supply',scene:'supply-road',enemyArmy:'山路游兵',
  history:'魏國發生政變，曹爽被殺。夏侯霸擔心受牽連，往陰平方向投奔蜀漢。《魏略》說，他途中迷路又缺糧，後來有人來接他。圖上的沔陽代表蜀軍接應方向。',
  briefing:'三路友軍備齊後發車，護送三批糧食到接應營地。',
  ending:'蜀漢派人迎接夏侯霸。以前他與姜維分屬兩軍，後來兩人一起出兵狄道。',
  camp:'我一度連回頭的路都找不到。看到來接我的人，我最先想到的是：終於可以喝口水了。',
  question:'夏侯霸在魏國政變後，投奔了哪一國？',choices:['蜀漢','東吳','他始終留在魏國'],refs:[xiahou,ruler]
 },
 {
  name:'漢壽新訊',year:253,origin:'hanshou',place:'hanshou',leader:'費禕',guest:'姜維',opponent:'郭循',mapOpponent:false,
  historyCast:['費禕','郭循','姜維'],matchupLabel:'史實事件相關人物・原為魏人',
  mission:'dispatch',scene:'supply-road',enemyArmy:'沿路游兵',
  history:'253 年新年，費禕在漢壽參加聚會，被由魏入蜀的郭循殺害。遊戲從事發前的營地接應開始，並在結算交代史實。',
  briefing:'保護有友軍的路，接回三隊傳令使者，讓各營能聯絡上。',
  ending:'費禕在漢壽遇害。當年夏天，姜維率軍出石營，進逼南安。',
  camp:'各營回報已收到消息。我接下來要清點能帶多少糧、路上又能去哪裡補。',
  question:'費禕在哪裡遇害？',choices:['漢壽','成都','狄道'],refs:[ruler,fei]
 },
 {
  name:'南安糧盡',year:253,origin:'mianyang',place:'nanan',leader:'姜維',guest:'姜維',opponent:'陳泰',mapOpponent:false,shift:true,
  historyCast:['姜維','陳泰'],matchupLabel:'魏軍援將・由洛門方向接近',
  mission:'withdraw',coverWaves:true,scene:'mountain-front',enemyArmy:'魏軍追兵',
  history:'費禕遇害後的夏天，姜維率軍包圍南安。魏將陳泰帶援軍到洛門，蜀軍糧食用盡，只得退兵。',
  briefing:'哪一路亮起，就派友軍去擋。第三波追兵出現後按「全軍撤離」。至少保住一隊，讓所有還在場的武將和士兵回到左側。',
  ending:'姜維在糧盡後退兵，南安仍在魏國手中。各營收兵，轉而補足軍糧。',
  camp:'糧袋都見底了。先看看誰還在前面，把人平安帶回來，才有下一次出兵的機會。',
  question:'姜維為什麼撤出南安？',choices:['軍糧用完了','拿下南安後就地扎營','得到東吳的糧食'],refs:[jiangWei,chen,ruler]
 },
 {
  name:'洮西收兵',year:255,origin:'taoxi',via:['didao'],place:'zhongti',leader:'姜維',guest:'夏侯霸',opponent:'王經',mapOpponent:false,
  historyCast:['姜維','夏侯霸','王經','陳泰'],matchupLabel:'王經敗退到狄道・陳泰解圍',
  mission:'withdraw',scene:'mountain-front',enemyArmy:'魏軍追兵',
  history:'姜維和夏侯霸出兵狄道，在洮西擊敗魏將王經。王經退入狄道，姜維圍城。後來陳泰帶兵救援，蜀軍從狄道退到鍾題駐守。',
  briefing:'這關從狄道退軍時開始。接應完成後按「全軍撤離」，讓所有存活的武將和士兵回到左側。至少要有一隊平安撤回。',
  ending:'陳泰解了狄道之圍，姜維退駐鍾題。蜀軍在洮西取得勝仗，狄道仍由魏軍守住。',
  camp:'上一次走到這一帶，我還在魏軍。這次跟大家回蜀營，先把路上的隊友都點清楚。',
  question:'魏軍解了狄道之圍後，姜維退到哪裡駐守？',choices:['鍾題','東吳','成都城內'],refs:[jiangWei,chen,ruler]
 }
];

export const TWENTIETH_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:20,number:index+1,faction:'shu',factionLabel:'蜀漢軍',place:stage.name,
 mapPlace:stage.place,originPlace:stage.origin,viaPlaces:stage.via||[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
 leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,matchupLabel:stage.matchupLabel,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
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
