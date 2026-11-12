import {createHistoryMission,stepHistoryMission,protectHistoricalOutcome,historyMissionText} from './history-missions.mjs?v=chapter-eight-1';
// All objectives share the paused battle clock; story choices never spend resources.
export function createMission(level){
 if(level>=17)return createHistoryMission(level);
 if(level<11)return null;
 return {level,kind:['escort','flags','barrier','waves','windboss','rescue'][level-11],rescued:0,travel:0,lane:1,routeReadyAt:0,flags:0,needed:level===12?3:level===13?2:0,clue:0,nextWeather:12,weather:null,weatherTurn:0,done:false,finaleAt:0,message:''};
}
const symbols=['☰ 天旗','☷ 地旗','☵ 水旗'];
export function flagClue(m){return symbols[m.clue%3]}
const active=b=>b?.mission&&!b.paused&&!b.over&&!b.duel&&!b.introPending;
export function chooseMissionFlag(b,index){if(!active(b)||!Number.isInteger(index)||index<0||index>2)return false;const m=b.mission;if(m.flags>=m.needed)return false;if(index!==m.clue%3){m.message=`再看一次：尋找「${flagClue(m)}」，猜錯不扣血。`;return false}m.flags++;m.clue=(m.clue+2)%3;m.message=m.flags>=m.needed?'真旗已破，迷霧散開！':'霧散了一層！再看下一個符號。';return true}
export function routeCivilians(b,lane){if(!active(b)||!['escort','rescue'].includes(b.mission.kind)||!Number.isInteger(lane)||lane<0||lane>2||b.time<b.mission.routeReadyAt)return false;b.mission.lane=lane;b.mission.routeReadyAt=b.time+2;return true}
function fx(b,type,lane){b.effects.push({id:b.nextId++,type,lane,from:.5,to:.5,duration:2,remaining:2})}
export function stepMission(b,dt){
 const m=b.mission;if(!m)return;if(b.level>=17)return stepHistoryMission(b,dt);
 if(['escort','barrier','rescue'].includes(m.kind)){
  if(!m.weather&&b.time>=m.nextWeather){m.weather={lane:m.weatherTurn%3,at:b.time+2.5,type:m.kind==='rescue'?(m.weatherTurn%2?'rock':'fire'):m.kind==='escort'?'rain':m.weatherTurn%2?'wind':'rain'};m.weatherTurn++}
  if(m.weather&&b.time>=m.weather.at){const w=m.weather;for(const u of b.allies)if(u.hp>0&&u.lane===w.lane){u.hp-=w.type==='rain'?6:10;u.flash=.3;if(w.type==='rain')u.slowUntil=b.time+3;if(w.type==='wind'){u.x=Math.max(.06,u.x-.04);u.pendingStrike=null;if(u.order==='hold')u.targetX=u.x}}fx(b,w.type,w.lane);m.weather=null;m.nextWeather=b.time+12;}
 }
 if(m.kind==='escort'||m.kind==='rescue'){
  const guarded=b.allies.some(u=>u.hp>0&&u.lane===m.lane),blocked=b.enemies.some(e=>e.hp>0&&e.lane===m.lane&&e.x<.55)||m.weather?.lane===m.lane;
  if(m.rescued<3&&guarded&&!blocked){m.travel+=dt/10;if(m.travel>=1){m.travel=0;m.rescued++;m.message=`第 ${m.rescued} 隊鄉民平安抵達！`;if(m.rescued<3)m.lane=(m.lane+1)%3}}
  if(m.rescued===3){if(m.kind==='escort')m.done=true;else if(!m.finaleAt&&['liubei','guanyu','zhangfei'].every(key=>b.allies.some(u=>u.hp>0&&u.key===key))){m.finaleAt=b.time+2;m.message='三兄弟合力開路！鄉民撤入營地。';for(const u of b.allies){u.hp=Math.min(u.maxHp,u.hp+30);fx(b,'oath',u.lane)}}else if(m.finaleAt&&b.time>=m.finaleAt)m.done=true;}
 }else m.done=m.needed?m.flags>=m.needed:true;
}
export function protectBarrier(b){protectHistoricalOutcome(b);if(b.mission?.kind==='barrier'&&b.mission.flags<b.mission.needed)for(const e of b.enemies)if(e.boss&&!e.support)e.hp=Math.max(e.hp,e.maxHp*.65)}
export function missionReady(b){return !b.mission||b.mission.done}
export function missionDuelReady(b){return b.mission?.kind!=='barrier'||b.mission.flags>=b.mission.needed}
export function missionText(b){if(b.level>=17)return historyMissionText(b);const m=b.mission;if(!m)return '';const danger=m.weather?`${['上','中','下'][m.weather.lane]}路${{rain:'降雨',wind:'旋風',fire:'火勢',rock:'落石'}[m.weather.type]}預警！ `:'';
 if(m.kind==='escort'||m.kind==='rescue')return danger+(m.rescued===3?(m.done?'鄉民全部平安！清退餘兵。':m.finaleAt?'桃園同心・合力開路':'鄉民已到出口，請讓劉、關、張三人同時在場開路'):`護送 ${m.rescued}／3 隊 · ${['上','中','下'][m.lane]}路 ${Math.floor(m.travel*100)}% · 派友軍守路，敵人逼近會暫停`);
 if(m.needed)return danger+`破陣 ${m.flags}／${m.needed} · `+(m.flags<m.needed?`尋找「${flagClue(m)}」`:(m.kind==='barrier'?'符障已破！張寶 ≤60%，關羽同路近身可單挑':'迷霧已散，清退追兵'));
 if(m.kind==='waves')return `黃旗衝鋒・第 ${Math.min(3,Math.floor(b.spawned/6)+1)}／3 波 · 可後退至狹口駐守，留意三路`;
 return '躲開呼風可使張梁露出破綻 · 生命 ≤60%，張飛同路近身可單挑';
}
