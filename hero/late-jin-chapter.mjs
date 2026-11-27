export function lateJinChapter(chapter,stages){
 const adaptation='行軍圖標示史書地點和遊戲示意路線。關卡任務及營地對話為遊戲改編。';
 return stages.map((stage,index)=>({
  name:stage.name,year:stage.year,chapter,number:index+1,faction:'cao',factionLabel:stage.factionLabel||'西晉軍',place:stage.name,campBanner:stage.campBanner||'晉',
  mapPlace:stage.place,originPlace:stage.origin,detailedRoute:true,viaPlaces:[],viewpointShift:!!stage.shift,historyCast:stage.historyCast,
  leaderName:stage.leader,opponentName:stage.opponent,mapOpponent:stage.mapOpponent??!!stage.opponent,matchupLabel:stage.matchupLabel,mapOpponentRole:stage.mapOpponentRole,mapStationRole:stage.mapStationRole,mapLeaderRole:stage.mapLeaderRole,mapMessenger:stage.mapMessenger,mapSecondaryOrigin:stage.mapSecondaryOrigin,
  scene:`./assets/scenes/${stage.scene}.jpg`,mission:stage.mission,missionTitle:stage.missionTitle,missionSites:stage.missionSites,
  successTitle:stage.successTitle,successRibbon:'戰 事 記 錄 ・ 回 營 整 備',
  ...(stage.gateHold?{gateHold:stage.gateHold}:{}),
  ...(stage.coverWaves?{coverWaves:true}:{}),
  ...(stage.mission==='withdraw'?{retreatKeys:[]}:{}),
  noBoss:true,bossName:stage.enemyArmy,bossHp:0,enemyArmy:stage.enemyArmy,enemyCount:stage.enemyCount??0,interval:3.8,
  lead:stage.history,history:stage.history,adaptation,note:adaptation,bossTip:stage.briefing,
  novel:[['說書人',stage.history],[stage.guide||stage.leader,stage.briefing]],
  opening:[['說書人',stage.history],[stage.guide||stage.leader,stage.briefing],['說書人',adaptation]],
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
}
