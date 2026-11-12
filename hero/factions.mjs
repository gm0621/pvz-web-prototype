export const BLANK_PORTRAIT='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22256%22 height=%22256%22/%3E';
const person=(name,faction,row,stats,weapon,description)=>({name,short:name,faction,atlas:`./assets/factions/${faction}.png`,row,asset:BLANK_PORTRAIT,...stats,weapon,description});
export const FACTIONS={
 cao:{title:'曹操軍',heroes:{
  liubei:person('曹操','cao',0,{hp:175,damage:19,range:.08,rate:1.2,heal:10},'佩劍／近戰','整軍號令・治療同路，補充軍糧'),
  guanyu:person('夏侯惇','cao',1,{hp:205,damage:28,range:.105,rate:1.25},'長槍／稍長','奮槍突進・穿擊近處敵軍'),
  zhangfei:person('曹洪','cao',2,{hp:280,damage:22,range:.08,rate:1.3},'刀盾／近戰','捨身斷後・震退近敵')
 }},
 sun:{title:'孫堅軍',heroes:{
  liubei:person('孫堅','sun',0,{hp:235,damage:28,range:.09,rate:1.15,heal:1},'大刀／近戰','虎威奮擊・定時斬擊近敵'),
  guanyu:person('程普','sun',1,{hp:215,damage:26,range:.11,rate:1.25},'長矛／稍長','鐵脊橫掃・穿擊近處敵軍'),
  zhangfei:person('黃蓋','sun',2,{hp:310,damage:23,range:.08,rate:1.4},'鐵鞭與盾／近戰','堅陣護軍・震退近敵')
 }}
};
export const factionFor=level=>level>=20&&level<=22?'sun':(level>=17&&level<=19||level>=23&&level<=40)?'cao':null;
export const FACTION_SKILLS={
 cao:{liubei:[{id:'heal',name:'整軍號令',level:1,cooldown:4,power:10,text:'同路回復 10，另補充 4 軍糧。'}],guanyu:[{id:'cleave',name:'奮槍突進',level:1,cooldown:6,power:40,text:'長槍穿擊前方多名敵人。'}],zhangfei:[{id:'roar',name:'捨身斷後',level:1,cooldown:8,power:14,text:'震退近敵，爭取撤軍時間。'}]},
 sun:{liubei:[{id:'heal',name:'虎威奮擊',level:1,cooldown:5,power:22,text:'斬擊同路近處敵人，不提供治療。'}],guanyu:[{id:'cleave',name:'鐵脊橫掃',level:1,cooldown:6,power:42,text:'長矛掃擊前方多名敵人。'}],zhangfei:[{id:'roar',name:'堅陣護軍',level:1,cooldown:7,power:15,text:'盾陣震退近敵，短暫打斷進攻。'}]}
};
export function enemyPortrait(name,level){if(level>=35)return {name,asset:BLANK_PORTRAIT,atlas:'./assets/factions/yuan.png',row:name==='淳于瓊'?0:level===35?2:1};if(level>=29&&name!=='呂布'){if(level>=33)return {name,asset:BLANK_PORTRAIT,atlas:'./assets/factions/yan.png',row:1};return {name,asset:BLANK_PORTRAIT,atlas:'./assets/factions/central.png',row:name==='張繡'?0:name==='橋蕤'?1:2}}if(level>=23&&level<=28||name==='呂布')return {name,asset:BLANK_PORTRAIT,atlas:'./assets/factions/yan.png',row:name==='呂布'?0:level>=26?1:2};if(level<17&&!['徐榮','華雄'].includes(name))return null;return {name,asset:BLANK_PORTRAIT,atlas:'./assets/factions/dong.png',row:name==='徐榮'?0:name==='華雄'?1:2}}
export function paintPortrait(node,person){
 node.src=person.asset;node.classList.toggle('faction-portrait',!!person.atlas);
 node.style.backgroundImage=person.atlas?`url("${person.atlas}")`:'';node.style.backgroundSize=person.atlas?`300% ${person.atlasRows===2?200:300}%`:'';node.style.backgroundPosition=person.atlas?`${(person.col||0)*50}% ${person.row*(person.atlasRows===2?100:50)}%`:'';
}
