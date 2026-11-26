export const GATE_MAX=100;
const repairAmount=30;
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
 const lane=fleetChannel(b);
 if(channelHazard(b,lane)==='blocked')return '主航道封住了，請換航道';
 if(!hasEscort(b,lane))return '派友軍到這條航道護航';
 if(enemyNearShip(b,lane))return '前方有敵船，清退或換航道';
 if(channelHazard(b,lane)==='warning')return '主航道即將封閉，可改走岸邊';
 return lane===mainChannel(b)?'順流快行':'沿岸前進';
}

export function stepFleet(b,dt){
 const m=b.mission,lane=fleetChannel(b);
 if(m.done||channelHazard(b,lane)==='blocked')return;
 if(!hasEscort(b,lane)||enemyNearShip(b,lane))return;
 m.travel=Math.min(1,m.travel+dt/(lane===mainChannel(b)?14:22));
 if(m.travel>=1-1e-8){
  m.travel=1;
  m.done=true;
  m.message='主船抵達西陵！';
 }
}

export function selectFleetChannel(b,lane){
 if(!Number.isInteger(lane)||lane<0||lane>=(b.laneTotal||3)||lane===fleetChannel(b)||channelHazard(b,lane)==='blocked')return false;
 b.mission.lane=lane;
 b.mission.message=`主船改走${channelName(b,lane)}，航程保留。`;
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
