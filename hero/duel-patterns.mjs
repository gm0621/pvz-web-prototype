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
export function duelPattern(duel){return patterns[duel.bossName]||patterns['鄧茂']}
export function duelBeats(duel){return [
 {at:0,text:'兩軍讓開',side:'ready'},{at:1.5,text:'報上名來',side:'reply'},
 ...duelPattern(duel).beats.map(([at,side,text,damage=0,heroDamage=0])=>({at,side,text,damage,heroDamage})),
 {at:11.8,text:duel.outcome==='retreat'?'破陣退敵':'決勝一擊',side:'finish',damage:1},
 {at:13,text:duel.outcome==='retreat'?'張角退走':'敵將討取',side:'victory'}
]}
