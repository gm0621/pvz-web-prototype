const SYNERGY_DEFINITIONS=Object.freeze([
 Object.freeze({id:'peach-oath',name:'桃園同心',season:1,side:'plants',members:Object.freeze(['firepea','zhangfei','liubei']),memberNames:Object.freeze(['關羽','張飛','劉備']),effect:Object.freeze({damagePct:.15}),bonusLabel:'組合成員攻擊 +15%'}),
 Object.freeze({id:'sleeping-dragon-phoenix',name:'臥龍鳳雛',season:1,side:'plants',members:Object.freeze(['kongming','pangtong']),memberNames:Object.freeze(['孔明','龐統']),effect:Object.freeze({ratePct:-.12}),bonusLabel:'組合成員攻擊間隔 -12%'}),
 Object.freeze({id:'tiger-guards',name:'虎衛並肩',season:2,side:'plants',members:Object.freeze(['s2DianWei','s2XuChu']),memberNames:Object.freeze(['典韋','許褚']),effect:Object.freeze({damagePct:.12}),bonusLabel:'組合成員攻擊 +12%'}),
 Object.freeze({id:'formation-crossbow',name:'破陣強弩',season:2,side:'plants',members:Object.freeze(['s2XuHuang','s2Crossbow']),memberNames:Object.freeze(['徐晃','強弩兵']),effect:Object.freeze({damagePct:.10}),bonusLabel:'組合成員攻擊 +10%'}),
 Object.freeze({id:'necromancer-flame',name:'屍巫烈焰',season:1,side:'zombies',members:Object.freeze(['necromancer','fireCatapult']),memberNames:Object.freeze(['冥火屍巫','烈焰屍車']),effect:Object.freeze({ratePct:-.10}),bonusLabel:'組合成員攻擊間隔 -10%'}),
 Object.freeze({id:'titan-siege',name:'巨屍攻城',season:1,side:'zombies',members:Object.freeze(['corpseTitan','fireCatapult']),memberNames:Object.freeze(['屍旗大胖','烈焰屍車']),effect:Object.freeze({damagePct:.12}),bonusLabel:'組合成員攻擊 +12%'}),
 Object.freeze({id:'coffin-rat-swarm',name:'棺盾鼠群',season:2,side:'zombies',members:Object.freeze(['s2Coffin','s2Rat']),memberNames:Object.freeze(['棺盾小屍','鼠牙群屍']),effect:Object.freeze({damagePct:.10}),bonusLabel:'組合成員攻擊 +10%'}),
 Object.freeze({id:'smoke-medic-cover',name:'煙醫掩護',season:2,side:'zombies',members:Object.freeze(['s2Smoke','s2Medic']),memberNames:Object.freeze(['煙罐小屍','縫屍醫官']),effect:Object.freeze({ratePct:-.10}),bonusLabel:'組合成員攻擊間隔 -10%'})
]);
const COMBINATION_DEFINITIONS=SYNERGY_DEFINITIONS;
function synergyById(id){return SYNERGY_DEFINITIONS.find(definition=>definition.id===id)||null}
window.SYNERGIES=SYNERGY_DEFINITIONS;
window.synergyById=synergyById;
