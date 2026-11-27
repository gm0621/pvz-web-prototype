const source=(title,path)=>({title,url:`https://zh.wikisource.org/zh-hant/${path}`});
const wuDi=source('《晉書》・武帝紀','晉書/卷003');
const huiDi=source('《晉書》・惠帝紀','晉書/卷004');
const shanTao=source('《晉書》・山濤傳','晉書/卷043#山濤');
const sunHao=source('《三國志》・孫皓傳','三國志/卷48#孫皓');
const yangJun=source('《晉書》・楊駿傳','晉書/卷040#楊駿');
const jia=source('《晉書》・惠賈皇后','晉書/卷031');
const princes=source('《晉書》・八王列傳','晉書/卷059');
const weiGuan=source('《晉書》・衛瓘傳','晉書/卷036#衛瓘');
const tongjian=source('《資治通鑑》・卷八十二','資治通鑑/卷082');
const adaptation='行軍圖示意故事的地理方向，洛陽城內路線是遊戲場景。出戰隊伍、守備、撤離和營地對話為改編，史實結局見歷史小檔案。';

const stages=[
 {
  name:'孫皓入洛',year:280,origin:'shitou',place:'luoyang',shift:true,wu:true,campBanner:'行',factionLabel:'孫皓隨行隊',
  leader:'孫皓',guest:'孫皓',opponent:'司馬炎',mapOpponentRole:'接見',historyCast:['孫皓','司馬炎'],
  mission:'supply',scene:'supply-road',enemyArmy:'隨行補給',successTitle:'隨行補給送達',
  history:'石頭城受降後，孫皓被送往西晉的都城洛陽。司馬炎封他為歸命侯，後來在朝會上接見他。東吳的皇帝從此成了西晉的臣屬。',
  briefing:'各路都派友軍接應。備車完成後按「發送糧車」，共送三批隨行補給。',
  ending:'孫皓到了洛陽，受封歸命侯。西晉開始處理統一後各州郡的事務。',
  camp:'先把同行的人安頓下來。堆在車上的行囊要一件一件點清，免得有人找不到自己的東西。',
  question:'孫皓到洛陽後受封為什麼？',choices:['歸命侯','新的皇帝','洛陽守將'],refs:[wuDi,sunHao]
 },
 {
  name:'太康裁兵',year:280,origin:'luoyang',place:'luoyang',shift:true,
  leader:'司馬炎',guest:'司馬炎',mapStationRole:'議事地',historyCast:['司馬炎'],
  mission:'restoration',missionTitle:'地方整備',missionSites:['軍籍','歸鄉文書','州郡簿'],scene:'supply-road',enemyArmy:'太康整備',successTitle:'地方文書備齊',
  history:'東吳滅亡後，西晉進入太康年間（280～289 年）。朝廷裁減州郡的軍隊，地方仍留下一些負責治安的人。這是統一後調整地方管理的一部分。',
  briefing:'派友軍照應對應路線，整理軍籍、歸鄉文書和州郡簿。',
  ending:'各州郡的地方軍力重新調整。太康年間過後，西晉迎來皇位交接。',
  camp:'有些人準備回家，也有人繼續看守地方。把兩邊的名冊分清楚，再通知各地。',
  question:'統一後，西晉怎麼調整州郡的兵力？',choices:['裁減州郡軍隊，留下部分治安人員','讓各州郡恢復為各自的國家','請東吳回來管理北方'],refs:[wuDi,shanTao]
 },
 {
  name:'惠帝即位',year:290,origin:'luoyangPalace',place:'luoyangPalace',shift:true,
  leader:'司馬衷',guest:'司馬衷',opponent:'楊駿',mapOpponentRole:'輔政',mapStationRole:'即位地',historyCast:['司馬炎','司馬衷','楊駿','賈南風'],
  mission:'dispatch',scene:'supply-road',enemyArmy:'朝廷傳令',successTitle:'即位消息送達',
  history:'290 年，晉武帝司馬炎去世。皇太子司馬衷在洛陽即位，史稱晉惠帝。賈南風成為皇后，楊駿負責輔政，也就是協助皇帝處理國事。',
  briefing:'接應三隊傳令使者，把即位消息傳到各處。可選擇有友軍接應的路線。',
  ending:'司馬衷即位，朝廷由楊駿輔政。皇后和宗室之間的權力角力逐漸加劇。',
  camp:'朝廷換了人主持，有些人還沒收到消息。請把文書和印信核對好，再送往各處。',
  question:'司馬炎去世後，誰在洛陽即位？',choices:['司馬衷','歸命侯','西晉的地方守將'],refs:[huiDi,yangJun,tongjian]
 },
 {
  name:'楊駿之變',year:291,origin:'luoyangPalace',place:'luoyangStreets',shift:true,factionLabel:'洛陽護送隊',campBanner:'護',
  leader:'司馬瑋',guest:'賈南風',opponent:'楊駿',mapOpponentRole:'被罷黜',historyCast:['賈南風','司馬瑋','楊駿'],
  mission:'pass-defense',missionTitle:'街巷守備',scene:'enemy-camp',enemyArmy:'城中亂兵',enemyCount:12,successTitle:'街巷守備完成',
  history:'291 年春，賈皇后聯合楚王司馬瑋等人發動政變。原本輔政的楊駿遭誅，洛陽朝廷的權力重新分配。',
  briefing:'看哪一路亮起，就派友軍去守。擋住上路、下路、中路三波，保住防線，清完剩下的敵兵就過關。',
  ending:'楊駿被殺，朝廷召汝南王司馬亮入洛陽。這次政變揭開了晉室宗王連番爭權的序幕。',
  camp:'街巷暫時能通行了，請先確認各處的消息，再讓等候的人回去。',
  question:'291 年春，在政變中失去權力的是誰？',choices:['楊駿','剛剛入洛的使者','東吳的最後一位皇帝'],refs:[huiDi,yangJun,jia,tongjian]
 },
 {
  name:'汝南王入朝',year:291,origin:'jinXuchang',place:'luoyang',shift:true,
  leader:'司馬亮',guest:'衛瓘',opponent:'衛瓘',mapOpponentRole:'共輔政',historyCast:['司馬亮','衛瓘','司馬衷'],
  mission:'restoration',missionTitle:'朝政交接',missionSites:['印信','公文','名冊'],scene:'supply-road',enemyArmy:'入朝交接',successTitle:'輔政交接完成',
  history:'在此前的皇位交接時，司馬亮為避開楊駿，到了許昌。楊駿死後，司馬亮被召回洛陽，與太保衛瓘一起輔佐晉惠帝。',
  briefing:'派友軍照應對應路線，備妥印信、公文和名冊，再把工作交接清楚。',
  ending:'汝南王司馬亮與衛瓘共同輔政。朝中各方仍有分歧，楚王司馬瑋也握有兵權。',
  camp:'接到新的公文，先比一比印信，再寫清楚由誰接手。這樣負責的人才不會弄錯。',
  question:'汝南王司馬亮回洛陽後，與哪位大臣一同輔政？',choices:['衛瓘','地方的糧官','東吳的使者'],refs:[huiDi,princes,weiGuan,tongjian]
 },
 {
  name:'洛陽再變',year:291,origin:'luoyangStreets',place:'luoyangGate',shift:true,factionLabel:'洛陽撤離隊',campBanner:'護',
  leader:'司馬亮',guest:'司馬衷',opponent:'司馬瑋',mapOpponentRole:'楚王起兵',historyCast:['司馬亮','衛瓘','司馬瑋','賈南風','司馬衷'],
  mission:'withdraw',scene:'enemy-camp',enemyArmy:'城中亂兵',enemyCount:12,successTitle:'撤離隊平安返回',
  history:'291 年夏，賈皇后假借皇命，讓楚王司馬瑋對付司馬亮和衛瓘。兩人被殺後，朝廷又以擅自殺害大臣之罪處死司馬瑋。這是八王之亂的早期事件。',
  briefing:'至少保住一隊友軍。等「全軍撤離」亮起再按下，讓所有存活的友軍回到左側。',
  ending:'司馬亮與衛瓘遇害，楚王司馬瑋隨後也被處死。洛陽暫時平靜下來，宗王之間的爭權仍未結束。',
  camp:'平安回來的人先休息。把失散的名字記清楚，也讓城裡的人知道去哪裡找家人。',
  question:'楚王司馬瑋殺害兩位輔政大臣後，結果如何？',choices:['司馬瑋不久也被處死','司馬瑋成了新的皇帝','東吳重新建立'],refs:[huiDi,jia,princes,weiGuan,tongjian]
 }
];

export const TWENTY_FIFTH_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:25,number:index+1,faction:stage.wu?'sun':'cao',factionLabel:stage.factionLabel||'西晉軍',place:stage.name,campBanner:stage.campBanner||'晉',
 mapPlace:stage.place,originPlace:stage.origin,detailedRoute:true,viaPlaces:[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
 leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,matchupLabel:stage.matchupLabel,mapOpponentRole:stage.mapOpponentRole,mapStationRole:stage.mapStationRole,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
 successTitle:stage.successTitle,successRibbon:'戰 事 記 錄 ・ 回 營 整 備',
 ...(stage.mission==='withdraw'?{retreatKeys:[]}:{}),
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
