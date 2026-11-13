import {stagePeople,mapPersonSvg,renderMatchup} from './characters.mjs?v=roster-chapters-1';
import {HISTORICAL_STAGES} from './history-stages.mjs?v=roster-chapters-1';
// Approximate regional placement, not historical borders or a surveyed route.
export const MAP_PLACES={
 zhuo:{name:'涿郡',modern:'今河北涿州一帶',x:402,y:78},
 qing:{name:'青州',modern:'今山東青州一帶',x:535,y:190},
 guang:{name:'廣宗',modern:'今河北廣宗一帶',x:365,y:182},
 chang:{name:'長社',modern:'今河南長葛一帶',x:323,y:340},
 road:{name:'北返驛道',modern:'長社至廣宗之間・劇情位置示意',x:344,y:260}
};
export const STAGE_LOCATIONS=[
 {place:'zhuo',detail:'桃園結義後，守護涿縣鄉里。'},
 {place:'zhuo',detail:'涿郡附近運糧小徑；遊戲補寫的遭遇戰。'},
 {place:'zhuo',detail:'大興山迎敵；按演義情節置於涿郡附近示意，非確定山址。'},
 {place:'zhuo',detail:'續戰程遠志，仍在大興山戰區；地點按演義示意。'},
 {place:'qing',detail:'離開涿郡，東南行援救青州；山道位置為劇情示意。'},
 {place:'qing',detail:'青州城外設伏，三路合擊；山口位置為劇情示意。'},
 {place:'guang',detail:'青州解圍後西行至廣宗，前往盧植軍前。'},
 {place:'chang',detail:'自廣宗南下潁川，在長社戰後接應。'},
 {place:'road',detail:'從長社北返廣宗途中遇見囚車；驛道無確定坐標，以沿途示意。'},
 {place:'guang',detail:'回到廣宗附近，救援受困官軍；敗軍山口為劇情示意。'}
];
for(const [i,name] of ['雨夜村道','迷霧林道','風雨祭壇','黃旗狹口','人公前陣','鄉民歸途'].entries()){const key='side'+i;MAP_PLACES[key]={name,modern:'第三章原創支線・位置示意',x:[390,430,475,495,450,400][i],y:[230,250,275,310,340,320][i]};Object.assign(MAP_PLACES,{"yishuiSouth": {"name": "易水", "modern": "今河北易縣一帶・北征歸途示意", "x": 405, "y": 85}, "xiangyang": {"name": "襄陽", "modern": "今湖北襄陽一帶", "x": 280, "y": 475}, "changban": {"name": "長坂", "modern": "今湖北當陽一帶", "x": 270, "y": 545}, "jiangling": {"name": "江陵", "modern": "今湖北荊州一帶", "x": 300, "y": 615}, "chibi": {"name": "赤壁", "modern": "長江中游古戰場區域示意，確切位置有不同說法", "x": 445, "y": 665}});
STAGE_LOCATIONS.push({place:key,detail:name+'・第三章原創支線位置示意，非史實行軍路線。'})}
Object.assign(MAP_PLACES,{luoyang:{name:'洛陽',modern:'今河南洛陽一帶',x:212,y:327},chenliu:{name:'陳留',modern:'今河南開封陳留一帶',x:405,y:325},suanzhao:{name:'酸棗',modern:'今河南延津一帶',x:380,y:275},bian:{name:'滎陽汴水',modern:'今河南滎陽一帶；古河道示意',x:295,y:310},liangdong:{name:'梁東',modern:'今河南臨汝一帶，位置示意',x:265,y:375},yangren:{name:'陽人',modern:'今河南汝州一帶',x:243,y:365},luyang:{name:'魯陽',modern:'今河南魯山一帶',x:270,y:405}});
Object.assign(MAP_PLACES,{dongwuyang:{name:'東武陽',modern:'今山東莘縣一帶・古城位置示意',x:450,y:245},shouzhang:{name:'壽張',modern:'今山東陽谷、梁山一帶',x:465,y:278},jibei:{name:'濟北',modern:'今山東濟南西南一帶・郡域示意',x:500,y:260},juancheng:{name:'鄄城',modern:'今山東鄄城一帶',x:432,y:298},puyang:{name:'濮陽',modern:'今河南濮陽一帶',x:404,y:280},dingtao:{name:'定陶',modern:'今山東菏澤定陶一帶',x:445,y:340}});
Object.assign(MAP_PLACES,{xuxian:{name:'許縣',modern:'今河南許昌一帶',x:350,y:380},wan:{name:'宛城',modern:'今河南南陽一帶',x:280,y:430},chen:{name:'陳地',modern:'今河南周口淮陽一帶・區域示意',x:430,y:395},xiapi:{name:'下邳',modern:'今江蘇睢寧古邳一帶',x:580,y:375}});
Object.assign(MAP_PLACES,{guandu:{name:'官渡',modern:'今河南中牟一帶・位置示意',x:360,y:325},baima:{name:'白馬',modern:'今河南滑縣一帶・位置示意',x:410,y:295},yanjin:{name:'延津',modern:'今河南延津一帶・古渡口示意',x:375,y:300},wuchao:{name:'烏巢',modern:'今河南延津一帶・糧屯位置示意',x:390,y:280}});
Object.assign(MAP_PLACES,{cangting:{name:'倉亭',modern:'今山東陽谷一帶・古渡口示意',x:465,y:250},liyang:{name:'黎陽',modern:'今河南浚縣一帶',x:380,y:255},ye:{name:'鄴城',modern:'今河北臨漳一帶',x:365,y:205},xiping:{name:'西平',modern:'今河南西平一帶',x:370,y:420},runan:{name:'汝南',modern:'今河南汝南一帶・區域示意',x:415,y:445},qiao:{name:'譙',modern:'今安徽亳州一帶',x:475,y:385},junyi:{name:'浚儀',modern:'今河南開封一帶',x:400,y:330}});
Object.assign(MAP_PLACES,{"pingyuan": {"name": "平原", "modern": "今山東平原一帶", "x": 485, "y": 215}, "nanpi": {"name": "南皮", "modern": "今河北南皮一帶", "x": 480, "y": 155}, "guangpingNorth": {"name": "獷平", "modern": "今北京密雲一帶・位置示意", "x": 480, "y": 55}, "huguan": {"name": "壺關", "modern": "今山西長治一帶・古關位置示意", "x": 285, "y": 225}, "chunyu": {"name": "淳于", "modern": "今山東安丘一帶", "x": 565, "y": 255}, "canals": {"name": "北征水路", "modern": "河北水系區域示意，非單一城址", "x": 475, "y": 110}, "wuzhong": {"name": "無終", "modern": "今天津薊州一帶", "x": 500, "y": 90}, "lulong": {"name": "盧龍塞", "modern": "古塞在今河北遷西一帶，非今盧龍縣城", "x": 555, "y": 80}, "baitan": {"name": "白檀", "modern": "今河北灤平一帶・古道位置示意", "x": 520, "y": 25}, "pinggang": {"name": "平岡", "modern": "今遼寧凌源一帶・古道位置示意", "x": 600, "y": 25}, "bailang": {"name": "白狼山", "modern": "今遼寧喀左一帶・古戰場位置示意", "x": 650, "y": 65}, "liucheng": {"name": "柳城", "modern": "今遼寧朝陽一帶", "x": 690, "y": 30}});
Object.assign(MAP_PLACES,{tongguan:{name:'潼關',modern:'今陝西潼關一帶・古關位置示意',x:125,y:345},puban:{name:'蒲阪津',modern:'今山西永濟一帶・黃河古渡口示意',x:125,y:270},weinan:{name:'渭南',modern:'今陝西渭南一帶・渭水戰區示意',x:65,y:330}});
STAGE_LOCATIONS.push(...HISTORICAL_STAGES.map(s=>({place:s.mapPlace,detail:`${s.year} 年・${s.faction==='cao'?'曹操軍':'孫堅軍'}視角。${s.viewpointShift?'此處切換敘事視角，不是上一支軍隊的連續行程。':''}地點為歷史區域示意，並非精確軍事路線。`})));
export function stageLocation(level){if(!Number.isInteger(level)||!STAGE_LOCATIONS[level-1])throw new RangeError('未知戰役關卡');const s=STAGE_LOCATIONS[level-1];return {...MAP_PLACES[s.place],...s,level}}
export function routeThrough(level){stageLocation(level);if(level>=59){const start=level>=61?44:level>=60?43:42;return HISTORICAL_STAGES.slice(start,level-16).flatMap(s=>[s.originPlace,s.mapPlace]).filter((p,i,a)=>i===0||p!==a[i-1])}if(level>=53)return ['yishuiSouth',...HISTORICAL_STAGES.slice(36,level-16).flatMap(s=>[...(s.viaPlaces||[]),s.originPlace,s.mapPlace])].filter((p,i,a)=>i===0||p!==a[i-1]);if(level>=47)return ['ye',...HISTORICAL_STAGES.slice(30,level-16).flatMap(s=>[...(s.viaPlaces||[]),s.originPlace,s.mapPlace])].filter((p,i,a)=>i===0||p!==a[i-1]);if(level>=41)return ['wuchao',...HISTORICAL_STAGES.slice(24,level-16).flatMap(s=>[...(s.viaPlaces||[]),s.originPlace,s.mapPlace])].filter((p,i,a)=>i===0||p!==a[i-1]);if(level>=35)return ['xiapi',...HISTORICAL_STAGES.slice(18,level-16).flatMap(s=>[...(s.originPlace?[s.originPlace]:[]),s.mapPlace])].filter((p,i,a)=>i===0||p!==a[i-1]);if(level>=29)return ['dingtao',...HISTORICAL_STAGES.slice(12,level-16).flatMap(s=>[...(s.originPlace?[s.originPlace]:[]),s.mapPlace])].filter((p,i,a)=>i===0||p!==a[i-1]);if(level>=17){const start=level>=23?22:level>=20?19:16,origin=level>=23?'dongwuyang':level>=20?'luyang':'luoyang';return [origin,...STAGE_LOCATIONS.slice(start,level).map(s=>s.place)].filter((p,i,a)=>i===0||p!==a[i-1])}return STAGE_LOCATIONS.slice(0,level).map(s=>s.place).filter((key,i,arr)=>i===0||key!==arr[i-1])}
// Only this stage's travel segment; changing factions uses its explicit origin.
export function journeyRoute(level){
 const to=stageLocation(level),origin=level>=17?HISTORICAL_STAGES[level-17].originPlace:null;
 const from=origin?{...MAP_PLACES[origin],place:origin}:stageLocation(Math.max(1,level-1)),same=from.place===to.place;
 const start={x:same?to.x-90:from.x-36,y:same?to.y-10:from.y-44},end={x:to.x-36,y:to.y-44};
 const left=Math.min(start.x,end.x)-50,right=Math.max(start.x,to.x+36)+65,top=Math.min(start.y,end.y)-45,bottom=Math.max(from.y,to.y)+95;
 const width=Math.max(320,right-left),height=Math.max(210,bottom-top);
 return {from,to,same,start,end,viewBox:`${(left+right-width)/2} ${(top+bottom-height)/2} ${width} ${height}`};
}
export function campaignMapSvg(level,mini=false){
 const current=stageLocation(level),route=routeThrough(level),visited=new Set(route);
 const points=route.map(key=>`${MAP_PLACES[key].x},${MAP_PLACES[key].y}`).join(' ');
 const cities=Object.entries(MAP_PLACES).map(([key,p])=>{
  const active=key===current.place,labelOffset=active&&route.some(k=>k!==key&&Math.hypot(MAP_PLACES[k].x-p.x,MAP_PLACES[k].y-p.y)<55)?70:38;if(level>=17&&!visited.has(key)&&!active)return '';if(level<17&&['luoyang','chenliu','suanzhao','bian','liangdong','yangren','luyang','dongwuyang','shouzhang','jibei','juancheng','puyang','dingtao','xuxian','wan','chen','xiapi','guandu','baima','yanjin','wuchao','cangting','liyang','ye','xiping','runan','qiao','junyi','pingyuan','nanpi','guangpingNorth','huguan','chunyu','canals','wuzhong','lulong','baitan','pinggang','bailang','liucheng','yishuiSouth','xiangyang','changban','jiangling','chibi','tongguan','puban','weinan'].includes(key))return '';if(key.startsWith('side')&&!visited.has(key)&&!active)return '';
  return `<g class="map-city ${active?'current':visited.has(key)?'visited':'future'}"><circle cx="${p.x}" cy="${p.y}" r="${active?16:7}"/>${active?`<circle class="map-current-ring" cx="${p.x}" cy="${p.y}" r="24"/><path class="map-flag" d="M${p.x},${p.y-14}v-34l26,7 -26,9"/>`:''}${mini||key.startsWith('side')&&!active||level>=35&&!active&&Math.hypot(p.x-current.x,p.y-current.y)<85?'':`<text x="${active?p.x:level>=41&&key==='guandu'?p.x-14:p.x+32}" text-anchor="${active?'middle':level>=41&&key==='guandu'?'end':'start'}" y="${p.y+(active?labelOffset:7)}">${p.name}</text>`}</g>`;
 }).join('');
 return `<svg viewBox="${level>=61?'-35 110 525 325':level===60?'180 500 260 220':level===59?'185 285 400 420':level>=53?'185 0 395 780':level>=47?'220 -65 565 430':level>=41?'285 115 285 430':level>=35?'280 190 380 310':level>=29?'145 245 530 285':level>=23?'345 165 250 260':level>=17?'150 190 340 280':'220 0 440 440'}" xmlns="http://www.w3.org/2000/svg" ${mini?'aria-hidden="true"':'role="img" aria-label="戰役方位示意圖，目前位於'+current.name+'"'}>
 <rect x="-100" y="-100" width="950" height="950" rx="18" fill="#eaddb9"/>
 ${level>=47?'':`<path d="M580 0L720 0V440H655L632 395 660 350 638 310 675 276 646 239 681 216 658 191 606 206 577 181 563 140 593 109 567 68Z" fill="#a9c1bb" opacity=".75"/>`}
 <path d="M35 70L95 22 140 101 180 50 224 143 186 218 235 260 173 321 196 405 40 425Z" fill="#8c987c" opacity=".2"/>
 <path d="M82 180l25-46 28 46m13 28 22-40 24 40m-90 118 26-48 27 48m55-65 23-37 22 37" fill="none" stroke="#78826b" stroke-width="3" opacity=".4"/>
 <path d="M40 110H680M40 220H680M40 330H680M180 25V410M360 25V410M540 25V410" stroke="#ac986b" opacity=".14"/>
 ${mini||level>=17?'':`<g class="map-region"><text x="300" y="45">幽州</text><text x="265" y="152">冀州</text><text x="540" y="145">青州</text><text x="440" y="285">兗州</text><text x="235" y="390">豫州</text><text x="635" y="105">海</text></g><g class="map-reference"><circle cx="212" cy="327" r="5"/><text x="157" y="350">洛陽</text><text x="250" y="422">中原</text></g><path d="M245 85V35m-10 15 10-15 10 15" stroke="#5b6048" stroke-width="3" fill="none"/><text x="236" y="20" class="map-north">北</text>`}
 <polyline points="${points}" class="map-route"/>${cities}${mini?'':mapPersonSvg(stagePeople(level).leader,'map-leader',current.x-36,current.y-44)+mapPersonSvg(stagePeople(level).opponent,'map-opponent',current.x+36,current.y-44)}
 </svg>`;
}
export function mountCampaignMap({stages,getBattle,setPaused}){
 const trigger=document.getElementById('battleMapButton'),dialog=document.getElementById('campaignMapDialog');
 let level=0,openedBattle=null,wasPaused=true,interrupted=false;
 const render=next=>{
  if(level===next)return;level=next;const p=stageLocation(level),stage=stages[level-1];
  document.getElementById('battleMapThumb').innerHTML=campaignMapSvg(level,true);
  document.getElementById('battleMapPlace').textContent=stage.place;
  document.getElementById('battleMapStage').textContent=`第 ${level} 關・${stage.name}`;
  document.getElementById('campaignMapCanvas').innerHTML=campaignMapSvg(level);
  renderMatchup(document.getElementById('campaignMapMatchup'),level);
  document.getElementById('campaignMapLocation').textContent=`目前：${stage.place}`;
  document.getElementById('campaignMapModern').textContent=p.modern;
  document.getElementById('campaignMapDetail').textContent=p.detail;
  document.getElementById('campaignMapRoute').textContent=routeThrough(level).map(key=>MAP_PLACES[key].name).join(' → ');
  document.getElementById('campaignMapStages').replaceChildren(...stages.map((s,i)=>{const li=document.createElement('li');li.textContent=`${i+1}. ${s.name} · ${MAP_PLACES[STAGE_LOCATIONS[i].place].name}`;if(i+1===level)li.setAttribute('aria-current','step');else if(i+1>level)li.className='future';return li}));
 };
 trigger.onclick=()=>{const b=getBattle();if(!b||b.over||b.duel||b.introPending)return;render(b.level);openedBattle=b;wasPaused=b.paused;interrupted=false;setPaused(true);dialog.showModal();dialog.scrollTop=0;document.getElementById('campaignMapClose').focus()};
 document.getElementById('campaignMapClose').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{if(dialog.open)return;if(openedBattle===getBattle()&&!wasPaused&&!interrupted&&!document.hidden)setPaused(false);openedBattle=null;trigger.focus({preventScroll:true})});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)interrupted=true});
 window.addEventListener('pagehide',()=>{if(dialog.open)interrupted=true});
 return {update(b){render(b.level);trigger.disabled=!!b.duel||!!b.introPending||b.over}};
}
