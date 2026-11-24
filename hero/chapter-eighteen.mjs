const source=(volume,name,section=name.replace(/傳.*$/,''))=>({title:`《三國志》卷${volume}・${name}`,url:`https://zh.wikisource.org/zh-hant/三國志/卷${volume}#${section}`});
const ruler=source(33,'後主傳','後主_劉禪'),zhuge=source(35,'諸葛亮傳'),cao=source('09','曹真傳');
const li=source(40,'李嚴傳'),yang=source(40,'楊儀傳'),zhang=source(17,'張郃傳及裴松之注'),guo=source(26,'郭淮傳');
const adaptation='行軍圖是地理示意，三路任務與營地對話是遊戲改編。兵卡沿用原有養成，史實的登場人物請看歷史小檔案。';

const stages=[
 {
  name:'雨阻漢中',year:230,origin:'jiangzhou',place:'nanzheng',leader:'李嚴',guest:'李嚴',opponent:'曹真',
  historyCast:['李嚴','曹真','諸葛亮'],mapOpponent:false,matchupLabel:'魏軍統帥・在秦嶺谷道遇雨',shift:true,
  mission:'holdout',missionTitle:'漢中接應',scene:'mountain-front',enemyArmy:'山道魏軍',
  history:'武都、陰平易手後，230 年曹真率魏軍分道伐蜀。諸葛亮調李嚴帶兵赴漢中。魏軍遇到連日大雨，山中棧道斷絕，奉命退兵。',
  briefing:'照應三路共 24 秒，再清退餘兵。這一回在漢中迎接援軍。',
  ending:'魏軍因大雨與道路中斷撤回。蜀軍在漢中整備，隔年再次出兵祁山。',
  camp:'棧道像掛在山壁上的小橋。大雨一來，連送一袋米都不容易。',
  question:'曹真率領的魏軍為什麼退兵？',choices:['大雨沖斷棧道','攻下漢中','收到蜀漢的降書'],refs:[cao,li,ruler]
 },
 {
  name:'祁山運糧',year:231,origin:'mianyang',place:'qishan',leader:'諸葛亮',guest:'李嚴',opponent:'司馬懿',
  historyCast:['諸葛亮','李嚴','司馬懿'],matchupLabel:'魏軍主帥・接掌祁山戰線',
  mission:'supply',scene:'supply-road',enemyArmy:'沿路魏軍',
  history:'231 年，諸葛亮再出祁山，用木牛運送軍糧。後方的李嚴負責督運。碰上久雨，補給沒能接上，李嚴傳信請前線退兵。',
  briefing:'護住三路，按「發送糧車」送出三批營內存糧，再清退餘兵。',
  ending:'三批軍糧接到前營。史書記載，後方的糧運仍接不上，諸葛亮最後撤兵。李嚴後來也因軍糧事件被免官。',
  camp:'木牛可以幫忙搬糧。路還是得通，糧食才送得出去。',
  question:'這次北伐用什麼運送軍糧？',choices:['木牛','渡江戰船','騎兵的盔甲'],refs:[zhuge,li,zhang]
 },
 {
  name:'木門收兵',year:231,origin:'qishan',place:'mumen',leader:'諸葛亮',guest:'諸葛亮',opponent:'張郃',
  historyCast:['諸葛亮','張郃'],matchupLabel:'魏軍追將・在木門中箭身亡',
  mission:'withdraw',scene:'mountain-front',enemyArmy:'魏軍追兵',
  history:'諸葛亮因糧運不繼而退兵。魏將張郃追到木門，和蜀軍交戰時中箭身亡。',
  briefing:'等退路接應完成，再按「全軍撤離」。至少帶一隊友軍回到左側，讓在場所有友軍都撤到安全處。',
  ending:'蜀軍收兵回去。張郃在木門中箭身亡，祁山一帶仍由魏方掌握。',
  camp:'回營先清點人數。張郃的消息傳來了，我們也該把隊伍帶回漢中休整。',
  question:'哪位魏將追到木門，後來中箭身亡？',choices:['張郃','曹真','郝昭'],refs:[zhang,zhuge]
 },
 {
  name:'斜谷再出',year:234,origin:'mianyang',via:['xiegu'],place:'wuzhang',leader:'諸葛亮',guest:'諸葛亮',opponent:'司馬懿',
  historyCast:['諸葛亮','司馬懿'],mapOpponent:false,matchupLabel:'魏軍主帥・在渭南與蜀軍相持',
  mission:'dispatch',scene:'supply-road',enemyArmy:'沿道魏軍',
  history:'蜀軍休整數年。234 年春，諸葛亮再次出兵，從斜谷北上到五丈原，這次用流馬運糧。司馬懿率魏軍與蜀軍在渭南相持。',
  briefing:'選有友軍守住的路，接應三隊使者，把抵達五丈原的消息送到各營。',
  ending:'各營都收到消息。蜀軍駐在五丈原，兩軍開始長期對峙。',
  camp:'前一次用木牛，這一次用流馬。帶著大軍翻山，吃的和用的都得先準備。',
  question:'234 年春，蜀軍經哪一條山谷北上？',choices:['斜谷','子午谷','箕谷'],refs:[zhuge,ruler,guo]
 },
 {
  name:'渭濱屯田',year:234,origin:'wuzhang',place:'weiFields',leader:'諸葛亮',guest:'諸葛亮',opponent:'司馬懿',
  historyCast:['諸葛亮','司馬懿','郭淮'],matchupLabel:'魏軍主帥・隔營相持',
  mission:'restoration',missionTitle:'渭濱屯田',missionSites:['田畦','水渠','糧棚'],scene:'supply-road',enemyArmy:'魏軍巡兵',
  history:'過去常因軍糧接不上而退兵，這次諸葛亮派部分兵士在渭水邊種田，打算久駐。史書記載，蜀軍與當地百姓一同耕作，沒有侵擾百姓。',
  briefing:'分別選擇田畦、水渠、糧棚，派友軍守住對應的路。完成三處整備後清退餘兵。',
  ending:'田間和糧棚安排好了。蜀軍繼續在五丈原牽制魏軍，雙方都沒有在這裡打下對方的營地。',
  camp:'屯田就是讓一部分士兵種田。先把水渠弄好，才有水可以澆到田裡。',
  question:'諸葛亮為什麼讓一部分兵士屯田？',choices:['在附近種糧，準備久駐','修造渡江戰船','舉辦比武'],refs:[zhuge,guo]
 },
 {
  name:'五丈原歸途',year:234,origin:'wuzhang',via:['xiegu'],place:'mianyang',leader:'楊儀',guest:'楊儀',opponent:'司馬懿',
  historyCast:['楊儀','諸葛亮','司馬懿','姜維'],mapOpponent:false,matchupLabel:'魏軍主帥・在渭南對峙',shift:true,
  mission:'withdraw',scene:'mountain-front',enemyArmy:'魏軍追兵',
  history:'234 年秋，諸葛亮在五丈原軍中病逝。楊儀安排各營撤回，姜維也在退兵隊伍中。這場北伐就此結束。',
  briefing:'接應完成後按「全軍撤離」。至少保住一隊友軍，讓所有在場友軍撤回左側。',
  ending:'楊儀收束隊伍，蜀軍撤回漢中。諸葛亮病逝於五丈原，未能完成北伐的心願。',
  camp:'把各營的人點清楚，沿山路一起回去。丞相交代的事，我們會記在心裡。',
  question:'諸葛亮在五丈原病逝後，誰安排各營撤回？',choices:['楊儀','曹真','李嚴'],refs:[zhuge,yang,ruler]
 }
];

export const EIGHTEENTH_CHAPTER=stages.map((stage,index)=>({
 name:stage.name,year:stage.year,chapter:18,number:index+1,faction:'shu',factionLabel:'蜀漢軍',place:stage.name,
 mapPlace:stage.place,originPlace:stage.origin,viaPlaces:stage.via||[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
 leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??true,matchupLabel:stage.matchupLabel,
 scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
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
