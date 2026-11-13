import {TEAM_BEATS} from './team-duel-beats.mjs?v=multilane-logistics-1';
// Matchup-specific choreography. Every beat uses the engine's paused duel clock.
const patterns={
 '鄧茂':{style:'spear',name:'猛攻搶先',beats:[[3,'hero','蛇矛搶先',.12],[4.8,'enemy','橫刀反擊',0,.03],[6.2,'block','架矛震刀'],[8,'hero','連環突刺',.18],[9.1,'enemy','回身劈斬',0,.03],[10,'charge','挺矛決勝']]},
 '程遠志':{style:'blade',name:'守勢反斬',beats:[[2.8,'enemy','旋風壓陣',0,.03],[4,'block','橫刀接勢'],[5.2,'hero','借勢反斬',.18],[6.6,'enemy','回刀追擊',0,.03],[8,'block','沉肩卸力'],[9,'hero','青龍破勢',.12],[10.2,'charge','拖刀蓄勢']]},
 '石魁':{style:'swords',name:'雙劍破盾',beats:[[2.8,'enemy','重錘壓頂',0,.03],[4,'block','交劍護身'],[5,'hero','左劍探隙',.08],[6,'hero','右劍切入',.1],[7.4,'enemy','巨盾反撞',0,.03],[8.8,'hero','雙劍交叉',.12],[10,'charge','尋隙破盾']]},
 '韓旌':{style:'blade',name:'誘槍斷旗',beats:[[2.6,'enemy','黃旗引槍',0,.03],[3.8,'block','側刀撥槍'],[5,'hero','佯攻旗側',.1],[6.2,'enemy','長槍回掃',0,.03],[7.6,'block','壓住槍鋒'],[9,'hero','回刀斷勢',.2],[10.4,'charge','青龍斷旗']]},
 '焦魯':{style:'spear',name:'長矛破雙刃',beats:[[2.6,'hero','長矛逼退',.1],[3.8,'enemy','雙刃交剪',0,.03],[5,'block','橫矛架雙刀'],[6.3,'hero','踏步突刺',.1],[7.5,'enemy','烈焰回斬',0,.03],[9,'hero','連刺散焰',.1],[10.3,'charge','怒喝破陣']]},
 '杜衡':{style:'swords',name:'鎖鉤反擊',beats:[[2.7,'enemy','鉤鐮探路',0,.03],[4,'block','左劍鎖鉤'],[5.1,'hero','右劍反挑',.15],[6.5,'enemy','回鉤追身',0,.03],[7.8,'block','交劍解鉤'],[9.2,'hero','側步雙斬',.15],[10.4,'charge','定心解鉤']]},
 '張角':{style:'spell',name:'避雷破符',beats:[[2.5,'enemy','符雷封路',0,.03],[3.9,'block','交劍護身'],[5.2,'hero','試探符眼',.08],[6.5,'enemy','雷陣再起',0,.03],[7.8,'hero','左劍破符',.1],[9.2,'hero','右劍開路',.12],[10.4,'charge','合劍破陣']]}
};
const finishers={
 '鄧茂':{id:'spear-rush',name:'丈八蛇矛・雷霆穿陣',color:'#ffbf66',setup:'三連突刺，步步逼退',hits:[13.2,13.65,14.1],finish:15.1},
 '程遠志':{id:'dragon-shadow',name:'青龍偃月・回身絕影斬',color:'#8dffba',setup:'拖刀誘敵，閃身繞背',hits:[13.6,14.4],finish:15.4},
 '石魁':{id:'cross-break',name:'雌雄雙劍・十字破盾',color:'#b6edff',setup:'左劍鎖盾，右劍破隙',hits:[13.25,14.15],finish:15.25},
 '韓旌':{id:'sky-cleave',name:'青龍騰空・斷旗落月',color:'#94ffc0',setup:'躍過槍鋒，凌空落刀',hits:[13.5,14.3],finish:15.5},
 '焦魯':{id:'lion-roar',name:'燕人怒吼・震地破焰',color:'#ffb277',setup:'震退雙刃，踏地重刺',hits:[13.4,14.25],finish:15.3},
 '杜衡':{id:'twin-dance',name:'仁義雙鋒・迴風連斬',color:'#b4eaff',setup:'解鉤換位，左右交擊',hits:[13.2,13.75,14.35],finish:15.5},
 '張角':{id:'seal-break',name:'雙劍同心・破雷開天',color:'#dcc2ff',setup:'閃避雷柱，逐一破符',hits:[13.3,13.85,14.4],finish:15.6}
};
patterns['張寶']={style:'blade',name:'破雨斷符',beats:[[2.6,'enemy','雨符封路',0,.03],[4,'block','橫刀護身'],[5.3,'hero','青龍試陣',.12],[6.7,'enemy','旋風回杖',0,.03],[8.1,'block','側步避風'],[9.3,'hero','回刀斷符',.18],[10.5,'charge','青龍收雨']]};
patterns['張梁']={style:'spear',name:'挑旗震軍',beats:[[2.5,'hero','蛇矛試旗',.1],[3.9,'enemy','環刀重斬',0,.03],[5.2,'block','架矛接刀'],[6.5,'hero','回身連刺',.1],[7.8,'enemy','呼風裂陣',0,.03],[9.1,'hero','踏步挑旗',.1],[10.5,'charge','燕人震旗']]};
finishers['張寶']={...finishers['韓旌'],name:'青龍偃月・斷符收雨',setup:'避過符杖，凌空斷符'};
finishers['張梁']={...finishers['焦魯'],name:'丈八蛇矛・震軍挑旗',setup:'接住環刀，挺矛挑旗'};
export function duelPattern(duel){return patterns[duel.bossName]||patterns['鄧茂']}
export function duelFinisher(duel){return finishers[duel.bossName]||finishers['鄧茂']}
export function duelBeats(duel){if(duel.bossName==='雷烈')return TEAM_BEATS;const f=duelFinisher(duel);return [
 {at:0,text:'兩軍讓開',side:'ready'},{at:1.5,text:'報上名來',side:'reply'},
 ...duelPattern(duel).beats.map(([at,side,text,damage=0,heroDamage=0])=>({at,side,text,damage,heroDamage})),
 {at:11.5,text:f.name,side:'charge'},
 {at:12.7,text:f.setup,side:'maneuver'},
 ...f.hits.map((at,i)=>({at,text:`${f.name}・第${i+1}擊`,side:'combo',damage:.4/f.hits.length})),
 {at:f.finish,text:f.name,side:'finish',damage:1},
 {at:17.2,text:duel.outcome==='retreat'?`${duel.bossName}退走`:'敵將討取',side:'victory'}
]}
