export const GATE_MAX=100;
const repairAmount=30;
export const hasGate=m=>m?.gate!==undefined;
const navigationCycle=22;
export const mainChannel=b=>Math.floor((b.laneTotal||3)/2);

export function channelName(b,lane){
 const total=b.laneTotal||3;
 if(lane===mainChannel(b))return '主航道';
 if(lane===0)return '北岸';
 if(lane===total-1)return '南岸';
 return `第 ${lane+1} 航道`;
}

export function fleetChannel(b){
 return b.mission.lane??mainChannel(b);
}

export function channelHazard(b,lane){
 if(lane!==mainChannel(b)||b.mission.done)return '';
 const cycle=b.time%navigationCycle;
 if(cycle>=12&&cycle<18)return 'blocked';
 if(cycle>=8&&cycle<12)return 'warning';
 return '';
}

export const fleetPosition=m=>.17+.70*m.travel;
const hasEscort=(b,lane)=>b.allies.some(unit=>unit.lane===lane&&unit.hp>0);
const enemyNearShip=(b,lane)=>b.enemies.some(enemy=>enemy.lane===lane&&enemy.hp>0&&enemy.x<fleetPosition(b.mission)+.20);

export function fleetStatus(b){
 const lane=fleetChannel(b),cargo=!!b.mission.cargoRuns;
 if(channelHazard(b,lane)==='blocked')return cargo?'封航，請換路':'主航道封住了，請換航道';
 if(!hasEscort(b,lane))return cargo?'請派友軍護航':'派友軍到這條航道護航';
 if(enemyNearShip(b,lane))return cargo?'敵船擋路，可換路':'前方有敵船，清退或換航道';
 if(channelHazard(b,lane)==='warning')return cargo?'快封航，可換路':'主航道即將封閉，可改走岸邊';
 return lane===mainChannel(b)?'順流快行':'沿岸前進';
}

export function stepFleet(b,dt){
 const m=b.mission,lane=fleetChannel(b);
 if(m.done||channelHazard(b,lane)==='blocked')return;
 if(!hasEscort(b,lane)||enemyNearShip(b,lane))return;
 m.travel=Math.min(1,m.travel+dt/(lane===mainChannel(b)?14:22));
 if(m.travel>=1-1e-8){
  if(m.cargoRuns){
   m.delivered++;
   m.done=m.delivered===m.cargoRuns;
   m.travel=m.done?1:0;
   m.message=`第 ${m.delivered} 批軍糧抵達${m.destination}！`;
  }else{
   m.travel=1;
   m.done=true;
   m.message=`主船抵達${m.destination}！`;
  }
 }
}

export function selectFleetChannel(b,lane){
 if(!Number.isInteger(lane)||lane<0||lane>=(b.laneTotal||3)||lane===fleetChannel(b)||channelHazard(b,lane)==='blocked')return false;
 b.mission.lane=lane;
 const m=b.mission;
 m.message=`${m.cargoRuns?'糧船':'主船'}改走${channelName(b,lane)}，航程保留。`;
 return true;
}

export function siegeLane(b){
 const total=b.laneTotal||3,order=b.spawned%total,offset=Math.floor(order/2);
 return order%2?total-1-offset:offset;
}

export function hitGate(b,enemy){
 const damage=enemy.shielded?35:25;
 b.mission.gate=Math.max(0,b.mission.gate-damage);
 b.mission.message=`城門受損 −${damage}`;
 if(!b.mission.gate)b.lossReason='gate-broken';
}

export const canRepairGate=m=>m.repairs>0&&m.gate>0&&m.gate<GATE_MAX;

export function repairGate(m){
 if(!canRepairGate(m))return false;
 const restored=Math.min(GATE_MAX-m.gate,repairAmount);
 m.gate+=restored;
 m.repairs--;
 m.message=`城門修補 +${restored}，還可修 ${m.repairs} 次。`;
 return true;
}

export const OUTPOSTS=[
 {name:'箭樓',benefit:'停掉箭樓射擊'},
 {name:'補給點',benefit:'軍糧補得更快'}
];
export const RAID_POINTS=[{name:'一號糧屯'},{name:'二號糧屯'}];
export const OUTPOST_SECONDS=7;
export const hasOutposts=m=>m?.kind==='outposts'||(m?.kind==='withdraw'&&!!m.points);
export const outpostLane=(b,index)=>index===0?0:(b.laneTotal||3)-1;
export const pointCompleted=(m,index)=>m.positions[index]>=OUTPOST_SECONDS;
export const nextOutpost=m=>m.positions.findIndex((_,index)=>!pointCompleted(m,index));
const guardPoint=(b,index)=>{
 const lane=outpostLane(b,index);
 return hasEscort(b,lane)&&!b.enemies.some(e=>e.lane===lane&&e.hp>0&&e.x<.48);
};

export function canIgniteRaid(b,index){
 const m=b.mission;
 return Number.isInteger(index)&&!!m.points[index]&&!pointCompleted(m,index)&&guardPoint(b,index);
}

export function igniteRaid(b,index){
 if(!canIgniteRaid(b,index))return false;
 const m=b.mission;
 m.positions[index]=OUTPOST_SECONDS;
 m.done=nextOutpost(m)<0;
 m.message=`${m.points[index].name}已點火！`;
 return true;
}

export function stepOutposts(b,dt){
 const m=b.mission,index=m.target;
 if(index<0)return;
 if(!guardPoint(b,index))return;
 m.positions[index]=Math.min(OUTPOST_SECONDS,m.positions[index]+dt);
 if(m.positions[index]>=OUTPOST_SECONDS){
  const point=m.points[index];
  m.message=`拿下${point.name}！${point.benefit?point.benefit+'。':''}`;
  m.target=-1;
  if(m.kind==='outposts')m.done=nextOutpost(m)<0;
 }
}

export function selectOutpost(b,index){
 const m=b.mission;
 if(!Number.isInteger(index)||!m.points[index]||pointCompleted(m,index)||m.target===index)return false;
 m.target=index;
 m.message=`正在爭取${m.points[index].name}，派友軍守住對應路線。`;
 return true;
}

export const PASS_WAVE_SIZE=4;
export const hasDirectedWaves=m=>m?.kind==='pass-defense'||m?.coverWaves===true;
export const thirdWaveStarted=b=>b.spawned>2*PASS_WAVE_SIZE;
export const passWave=b=>Math.floor(b.spawned/PASS_WAVE_SIZE)+1;
export function passLane(b){
 const total=b.laneTotal||3;
 return [0,total-1,Math.floor(total/2)][passWave(b)-1];
}

export const hasFireRoutes=m=>m?.clearings!==undefined;

export function scheduledFireWarning(b){
 const fire=b.mission?.fireAttack;
 return fire&&fire.at-b.time<=3?fire.lane:null;
}

export function fireLaneState(b,lane){
 if(b.hazards.some(fire=>fire.lane===lane&&fire.until>b.time))return 'burning';
 if(scheduledFireWarning(b)===lane||b.enemies.some(e=>e.boss&&e.hp>0&&e.castAt&&(e.castLanes||[e.lane]).includes(lane)))return 'warning';
 return 'safe';
}

export function canClearFire(b,lane){
 return b.mission.clearings>0&&fireLaneState(b,lane)==='burning'&&hasEscort(b,lane);
}

export function clearFireLane(b,lane){
 if(!Number.isInteger(lane)||lane<0||lane>=(b.laneTotal||3)||!canClearFire(b,lane))return false;
 b.hazards=b.hazards.filter(fire=>fire.lane!==lane);
 b.effects=b.effects.filter(effect=>effect.type!=='fire'||effect.lane!==lane);
 b.mission.clearings--;
 b.mission.message='火已清開，快從這一路撤回！';
 return true;
}
