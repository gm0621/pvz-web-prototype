import {extracted} from './history-missions.mjs?v=sun-growth-1';
import {createMission,stepMission,protectBarrier,missionReady,missionDuelReady} from './chapter-missions.mjs?v=sun-growth-1';
import {duelBeats} from './duel-patterns.mjs?v=sun-growth-1';
export {duelBeats} from './duel-patterns.mjs?v=sun-growth-1';
import {WEATHER_GENERALS} from './weather-generals.mjs?v=sun-growth-1';
import {campaignState,weaponBonus} from './campaign.mjs?v=sun-growth-1';
import {heroSkill} from './skills.mjs?v=sun-growth-1';
import {heroesForLevel,STAGES,UNLOCKS,FEATURES} from './story.mjs?v=sun-growth-1';

export const SWING={duration:.58,impact:.24,frameTime:.08,frames:6};
export const DUEL_DURATION=19;
export const DUEL_ENTRANCE_DURATION=3.2;
export function skipDuelEntrance(b){if(!b?.duel||b.paused||b.over)return false;b.duel.entranceElapsed=DUEL_ENTRANCE_DURATION;return true}
// Retained for callers that inspect the original Deng Mao sequence.
export const DUEL_BEATS=duelBeats({bossName:'鄧茂'});
export function duelBeat(d){return duelBeats(d).reduce((last,beat)=>d.elapsed>=beat.at?beat:last,duelBeats(d)[0])}
export function attackFrame(unit,time){const elapsed=time-(unit.swingStartedAt??-100);if(elapsed<0||elapsed>=SWING.duration)return 0;const frame=Math.min(5,Math.floor(elapsed/SWING.frameTime));return unit.key==='zhangfei'&&frame===4?3:frame}
export const LANE_CAPACITY=3;
export const battleHeroes=b=>b.roster||heroesForLevel(b.level);
const troop=(b,key)=>key==='archer'||!!battleHeroes(b)[key]?.troop;
export const lanesFor=b=>b.laneTotal||3;
export const laneLabel=(b,n)=>lanesFor(b)===3?['上','中','下'][n]:`第 ${n+1}`;
export const laneCount=(b,lane)=>b.allies.filter(u=>u.hp>0&&u.lane===lane).length;
export const ENEMY_SWING={duration:.66,impact:.24};
export function enemyAttackFrame(unit,time){const age=time-(unit.swingStartedAt??-100);return age<0||age>=ENEMY_SWING.duration?2:age<ENEMY_SWING.impact?0:age<.44?1:2}
function commandUnit(b,key){return b.allies.find(u=>u.hp>0&&(typeof key==='number'?u.id===key:!troop(b,key)&&u.key===key))}
export const SAVE_KEY='heroLegendProgress_v1';
export const BOSS_SKILLS=['試刀','截糧斬','裂陣重擊','旋風斬','鐵壁盾擊','黃天裂陣','黃旗號令','餘燼火路','鉤鐮牽引','黃天符雷'];
// Boss armor makes the first exchange readable; a completed special opens a punish window.
export function hurtEnemy(b,e,damage){
 const guarded=e.boss&&!e.support;
 const factor=!guarded?1:b.time<(e.recoveryUntil||0)?1.25:!e.skillsCast?(b.level<3?.75:.6):b.level<3?1:.8;
 e.hp-=damage*factor;
}
export function bossProfile(b,e){const stage=STAGES[b.level-1];return e.support?WEATHER_GENERALS[e.name]:{title:stage.bossTitle||'敵軍大將',skillType:stage.skillType,skillName:stage.skillName||BOSS_SKILLS[b.level-1]}}
export function positionHero(b,key,lane,x){
 if(!b||b.over||b.paused||b.duel||b.introPending||!Number.isFinite(x)||!Number.isInteger(lane)||lane<0||lane>=lanesFor(b))return false;
 const u=commandUnit(b,key);if(!u)return false;
 if(u.lane!==lane&&!moveHero(b,key,lane))return false;
 const enemy=b.enemies.filter(e=>e.hp>0&&e.lane===lane).sort((a,c)=>a.x-c.x)[0];
 u.targetX=Math.max(.06,Math.min(.84,x,enemy?Math.max(.06,enemy.x-.08):.84));
 u.order=Math.abs(u.targetX-u.x)<.005?'hold':u.targetX<u.x?'back':'forward';
 u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100;
 b.notice=`${battleHeroes(b)[u.key].short}移往指定位置，抵達後駐守`;b.noticeUntil=b.time+2;return true;
}
export function commandHero(b,key,order){
 if(!b||b.over||b.paused||b.duel||b.introPending)return false;
 const u=commandUnit(b,key);
 if(!u)return false;
 if(order==='up'||order==='down')return moveHero(b,key,u.lane+(order==='up'?-1:1));
 if(!['forward','back','hold','auto'].includes(order))return false;
 u.order=order==='auto'?null:order;
 u.targetX=order==='forward'?Math.min(.84,u.x+.16):order==='back'?Math.max(.06,u.x-.16):u.x;
 u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100;
 b.notice=`${battleHeroes(b)[u.key].name}：${{forward:'前進至指定位置',back:'後退至指定位置',hold:'就地駐守',auto:'恢復自動前進'}[order]}`;b.noticeUntil=b.time+2;return true;
}
export function moveHero(b,key,lane){
 if(!b||b.over||b.paused||b.duel||b.introPending)return false;
 const u=commandUnit(b,key);
 if(!u||!Number.isInteger(lane)||lane<0||lane>=lanesFor(b))return false;
 const reason=u.lane===lane?'已在這一路':b.time<(u.moveReadyAt||0)?'調動整備中，稍候再換路':laneCount(b,lane)>=LANE_CAPACITY?`${laneLabel(b,lane)}路已滿（3／3），先調走一名友軍，再換入這一路`:'';
 if(reason){b.notice=reason;b.noticeUntil=b.time+2;return false}
 u.lane=lane;u.moveReadyAt=b.time+2;u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100;
 const enemy=b.enemies.filter(e=>e.hp>0&&e.lane===lane).sort((a,c)=>a.x-c.x)[0];
 if(enemy)u.x=Math.max(.03,Math.min(u.x,enemy.x-.08));
 if(u.order){u.order='hold';u.targetX=u.x}
 b.notice=`${battleHeroes(b)[u.key].name}轉往${laneLabel(b,lane)}路！`;b.noticeUntil=b.time+2;return true;
}
export function normalizeProgress(raw){
 const completed=Number(raw?.completed);
 const count=Number.isInteger(completed)?Math.max(0,Math.min(STAGES.length,completed)):0;
 return {version:1,completed:count,...campaignState(raw,count)};
}
export function createBattle(level,seed=Date.now(),weapons={}){
 if(!Number.isInteger(level)||!STAGES[level-1])throw new Error('關卡不存在');
 return {level,mission:createMission(level),weapons:{...weapons},seed:seed>>>0,time:0,food:220,lives:3,spawned:0,nextSpawn:6,bossSpawned:false,allies:[],enemies:[],effects:[],projectiles:[],hazards:[],oathUsed:false,skillNotice:null,cooldowns:{},nextId:1,paused:false,over:false,won:false,duel:null,duelSeen:false,notice:FEATURES[level-1].text,noticeUntil:8};
}
function random(b){b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;return b.seed/4294967296}
export function canDeploy(b,key,lane){
 if(!b||b.over||b.paused||b.duel||b.introPending)return '戰鬥暫停中';
 if(!battleHeroes(b)[key]||!Number.isInteger(lane)||lane<0||lane>=lanesFor(b))return '請選擇一張兵卡與一路';
 if(!troop(b,key)&&b.allies.some(u=>u.key===key&&u.hp>0))return '這位武將已在場上';
 if(b.food<battleHeroes(b)[key].cost)return '軍糧不足，稍等自動補給';
 if((b.cooldowns[key]||0)>b.time)return '這張兵卡正在準備';
 if(laneCount(b,lane)>=LANE_CAPACITY)return `${laneLabel(b,lane)}路已滿（3／3），請選其他路，或先調走一名友軍`;
 return '';
}
export function deploy(b,key,lane){
 const reason=canDeploy(b,key,lane);if(reason){if(b){b.notice=reason;b.noticeUntil=b.time+2}return false}
 const d=battleHeroes(b)[key];b.food-=d.cost;b.cooldowns[key]=troop(b,key)?b.time+d.cooldown:0;
 if(b.heroMode&&d.heroId){if(!b.participants.includes(d.heroId))b.participants.push(d.heroId);b.heroResources[d.heroId]??={mp:60,ready:{}}}
 b.allies.push({heroId:d.heroId,shield:0,passiveAt:b.time+5,id:b.nextId++,key,lane,x:.1,hp:d.hp,maxHp:d.hp,lastAttack:-10,lastHeal:b.time,lastSkill:b.time,flash:0,order:'hold',targetX:.1,action:'holding'});
 b.notice=`${d.name}出陣駐守！${key==='archer'?'點場上弓兵可調動，駐守時自動射擊':'點選武將，再點前方才會前進'}`;b.noticeUntil=b.time+1.8;return true;
}
function effect(b,type,lane,from,to=from,details={}){const duration=['roar','cleave','oath','heal','boss','rally','hook','thunder'].includes(type)?1:['retreat','capture'].includes(type)?.9:type==='breach'?.7:type==='defeat'?.55:.4;const bossName=b.enemies.find(e=>e.boss&&e.lane===lane)?.name;b.effects.push({id:b.nextId++,type,lane,from,to,remaining:duration,duration,bossName,...details})}
function spawn(b){
 const stage=STAGES[b.level-1],boss=b.spawned>=stage.enemyCount;
 if(boss&&stage.noBoss){b.bossSpawned=true;b.nextSpawn=Infinity;return}
 const lane=boss?Math.floor(lanesFor(b)/2):lanesFor(b)===3?([1,0,2][b.spawned%3]):(b.spawned+Math.floor(b.spawned/lanesFor(b))*(lanesFor(b)===4?1:2))%lanesFor(b);
 const heavy=!boss&&b.level>=UNLOCKS.shields&&b.spawned%4===3;
 const ranged=b.level<17&&!boss&&!heavy&&b.level>=4&&b.spawned%6===4;
 const hp=ranged?46+Math.min(6,b.level)*3:boss?stage.bossHp:Math.round(48+Math.min(6,b.level)*6+(heavy?35:0));
 b.enemies.push({id:b.nextId++,lane,x:.94,hp,maxHp:hp,boss,ranged,name:boss?stage.bossName:b.level>=17?(stage.enemyArmy?(stage.enemyArmy+(heavy?'盾兵':'步兵')):(heavy?'董軍盾兵':'董軍刀兵')):ranged?'黃巾弓手':heavy?'黃巾盾賊':'黃巾刀賊',shielded:heavy||(boss&&b.level===5),stunnedUntil:0,damage:ranged?8:boss?17+Math.min(6,b.level):7+Math.min(6,b.level),rate:ranged?2.6:boss?1.6:1.5,speed:boss?.019:.027+random(b)*.004,lastAttack:b.time,flash:0,action:'marching'});
 if(b.level===14&&!boss&&[0,6,12].includes(b.spawned)){for(const side of [0,2])b.enemies.push({id:b.nextId++,lane:side,x:.97,hp:52,maxHp:52,name:'黃旗衝鋒兵',elite:true,boss:false,damage:9,rate:1.5,speed:.04,lastAttack:b.time,flash:0});b.skillNotice={key:'enemy',text:`第 ${Math.floor(b.spawned/6)+1} 波・黃旗衝鋒`,until:b.time+3};}
 if(ranged){b.notice='黃巾弓手出現！會在遠處蓄力射箭，換路避箭或派武將逼近。';b.noticeUntil=b.time+5;}
 if(!boss&&b.level>=3){
  const number=b.spawned+1,ambushes=[Math.max(3,Math.ceil(stage.enemyCount*.35)),Math.max(6,Math.ceil(stage.enemyCount*.7))];
  if(ambushes.includes(number)){
   const raidLane=(lane+(lanesFor(b)===3?(number%2?1:2):1+(b.level+number)%(lanesFor(b)-1)))%lanesFor(b),raidHp=Math.round(35+Math.min(10,b.level)*3);
   b.enemies.push({id:b.nextId++,lane:raidLane,x:.97,hp:raidHp,maxHp:raidHp,boss:false,elite:true,name:(stage.enemyArmy||(b.level>=17?'董軍':'黃巾'))+'疾行兵',shielded:false,stunnedUntil:0,damage:8+Math.min(6,b.level),rate:1.25,speed:.042+random(b)*.003,lastAttack:b.time,flash:0,action:'marching'});
   b.notice=`${stage.enemyArmy||(b.level>=17?'董軍':'黃巾')}突襲！疾行兵從${laneLabel(b,raidLane)}路逼近，快換路補位！`;b.noticeUntil=b.time+4;
   b.skillNotice={key:'enemy',text:`${stage.enemyArmy||(b.level>=17?'董軍':'黃巾')}突襲・${laneLabel(b,raidLane)}路疾行兵！`,until:b.time+2.5};
  }
 }
 if(b.level===8&&!boss)for(const general of Object.values(WEATHER_GENERALS))if(b.spawned===general.spawnAt){b.enemies.push({id:b.nextId++,lane:general.lane,x:.94,hp:general.hp,maxHp:general.hp,boss:true,support:true,name:general.name,damage:10,rate:1.8,speed:.022,lastAttack:b.time,flash:0,stunnedUntil:0});b.skillNotice={key:'enemy',text:`${general.title}・${general.name}出陣！${general.skillName}`,until:b.time+4};}
 if(boss){if(b.level>=17&&['withdraw','decoy'].includes(stage.mission))b.enemies[b.enemies.length-1].x=.5;b.bossSpawned=true;b.introPending=true;}else b.spawned++;
 b.nextSpawn=b.time+stage.interval;
 if(boss){b.notice=`${stage.bossName}出陣！`;b.noticeUntil=b.time+4}
}
function resolveDuel(b){
 const duel=b.duel;
 for(const fighter of b.allies.filter(u=>u.id===duel.heroId||u.id===duel.partnerId)){fighter.pendingStrike=null;fighter.pendingCleave=null;fighter.swingStartedAt=-100;fighter.lastAttack=b.time;}
 b.notice=`${duel.bossName}${duel.outcome==='retreat'?'已撤走':'已被斬殺'}！繼續照應三路。`;b.noticeUntil=b.time+3;b.duel=null;
}
export function stepBattle(b,seconds){
 if(!b||b.over||b.paused||b.introPending)return;
 const dt=Math.min(.1,Math.max(0,Number(seconds)||0));if(!dt)return;
 if(b.duel){
  const d=b.duel;
  if(d.elapsed===0&&(d.entranceElapsed??DUEL_ENTRANCE_DURATION)<DUEL_ENTRANCE_DURATION){d.entranceElapsed=Math.min(DUEL_ENTRANCE_DURATION,d.entranceElapsed+dt);return}
  d.elapsed=Math.min(DUEL_DURATION,d.elapsed+dt);d.remaining=DUEL_DURATION-d.elapsed;
  const boss=b.enemies.find(e=>e.id===d.bossId),hero=b.allies.find(u=>u.id===d.heroId),beats=duelBeats(d);
  for(let i=d.nextBeat;i<beats.length&&d.elapsed+1e-8>=beats[i].at;i++){
   const beat=beats[i];if(boss&&beat.damage)boss.hp=beat.side==='finish'?0:Math.max(1,boss.hp-d.startHp*beat.damage);const receiver=beat.counterTarget==='partner'?b.allies.find(u=>u.id===d.partnerId):hero;if(receiver&&beat.heroDamage)d.pendingCounter={at:beat.at+.6,damage:receiver.maxHp*beat.heroDamage,targetId:receiver.id};d.nextBeat=i+1;
  }
  if(d.pendingCounter&&d.elapsed+1e-8>=d.pendingCounter.at){const receiver=b.allies.find(u=>u.id===d.pendingCounter.targetId);if(receiver)receiver.hp=Math.max(1,receiver.hp-d.pendingCounter.damage);d.pendingCounter=null;}
  if(d.remaining<=.00001)resolveDuel(b);return;
 }
 b.effects=b.effects.filter(e=>{e.remaining-=dt;return e.remaining>0});
 b.time+=dt;for(const u of b.allies)if(b.time>=(u.shieldUntil||0))u.shield=0;stepMission(b,dt);
 b.projectiles??=[];
 for(const shot of b.projectiles)if(b.time+1e-8>=shot.impactAt){
  const victim=b.allies.find(u=>u.id===shot.targetId&&u.hp>0&&u.lane===shot.lane&&Math.abs(u.x-shot.aimX)<.08);
  if(victim){damageAlly(victim,shot.damage);victim.flash=.2;effect(b,'block',shot.lane,shot.aimX)}
 }
 b.projectiles=b.projectiles.filter(shot=>b.time+1e-8<shot.impactAt);
 for(const h of b.hazards||[]){if(b.time>=h.nextTick&&h.nextTick<=h.until){for(const u of b.allies)if(u.hp>0&&u.lane===h.lane){damageAlly(u,6);u.flash=.2}h.nextTick+=1}}
 b.hazards=(b.hazards||[]).filter(h=>h.until>b.time);
 b.food=Math.min(300,b.food+12*dt);
 const stage=STAGES[b.level-1];
 if(!b.bossSpawned&&b.time>=b.nextSpawn)spawn(b);
 if(b.introPending)return;
 for(const u of b.allies){
  if(u.hp<=0)continue;const d=battleHeroes(b)[u.key];if(b.heroMode&&d.heroId){const r=b.heroResources[d.heroId];r.mp=Math.min(60,r.mp+dt*(['yujin','chengpu'].includes(d.heroId)?4:3));if(d.heroId==='liubei'&&b.time>=u.passiveAt){for(const a of b.allies)if(a.hp>0&&a.lane===u.lane)a.hp=Math.min(a.maxHp,a.hp+5);u.passiveAt=b.time+5}if(d.heroId==='caocao'&&b.time>=u.passiveAt){b.food=Math.min(300,b.food+4);u.passiveAt=b.time+5}}if(b.time>=(u.shieldUntil||0))u.shield=0;u.action='guarding';u.flash=Math.max(0,u.flash-dt);
  if(u.order==='back'){
   u.x=Math.max(u.targetX,u.x-d.speed*2*dt*(b.time<(u.slowUntil||0)?.6:1));u.action='retreating';
   if(u.x<=u.targetX+.0001){u.order='hold';u.action='holding'}
   continue;
  }
  if((u.key==='archer'||d.ranged)&&u.order==='forward'){
   const ahead=b.enemies.filter(e=>e.hp>0&&e.lane===u.lane&&e.x>=u.x).sort((a,c)=>a.x-c.x)[0];
   const limit=Math.min(u.targetX,ahead?Math.max(u.x,ahead.x-.08):.84);
   u.x=Math.min(limit,u.x+d.speed*1.2*dt*(b.time<(u.slowUntil||0)?.6:1));u.action='marching';
   if(u.x>=limit-.0001){u.order='hold';u.action='holding'}
   continue;
  }
  if(u.pendingCleave&&b.time+1e-8>=u.pendingCleave.impactAt){
   const skill=heroSkill(u.key,u.pendingCleave.skill||'cleave',b.level);
   for(const victim of b.enemies)if(victim.hp>0&&victim.lane===u.lane&&u.pendingCleave.ids.includes(victim.id)&&Math.abs(victim.x-u.x)<=.32){hurtEnemy(b,victim,skill.power);victim.flash=.3}
   effect(b,'cleave',u.lane,u.x,Math.min(.96,u.x+.15));u.impactUntil=b.time+.07;b.skillNotice={key:u.key,text:`${d.name}・${skill.name}`,until:b.time+1.5};u.pendingCleave=null;
  }
  if(u.pendingStrike&&b.time+1e-8>=u.pendingStrike.impactAt){
   const strike=u.pendingStrike,victim=b.enemies.find(e=>e.id===strike.targetId&&e.hp>0&&e.lane===u.lane);
   if(victim&&Math.abs(victim.x-u.x)<=d.range+.09){hurtEnemy(b,victim,strike.damage);victim.flash=.2;effect(b,'slash',u.lane,u.x,victim.x,{weapon:u.key});u.impactUntil=b.time+.07}
   u.pendingStrike=null;
  }
  const target=b.enemies.filter(e=>e.hp>0&&e.lane===u.lane&&e.x>=u.x-.015).sort((a,c)=>a.x-c.x)[0];
  if(target&&target.x-u.x<=d.range){
   if(b.level===5&&u.key==='liubei'&&target.boss&&target.hp/target.maxHp>.65&&!target.duelHintShown){target.duelHintShown=true;b.notice='先破盾才能單挑：把石魁生命打到 65% 以下，再由劉備同路近身。';b.noticeUntil=b.time+6;b.duelHint={text:b.notice,until:b.time+6};}

   const partner=stage.duelPartner?b.allies.find(a=>a.key===stage.duelPartner&&a.hp>0):null;
   if((!stage.duelPartner||partner)&&target.boss&&!target.support&&missionDuelReady(b)&&!b.duelSeen&&stage.duelHero===u.key&&(!stage.duelHpRatio||target.hp/target.maxHp<=stage.duelHpRatio)&&target.x-u.x<=Math.max(.14,d.range)){
    b.duelHint=null;b.duelSeen=true;b.duel={...(partner?{format:'two-v-one',partnerId:partner.id,partnerKey:partner.key}:{}),heroId:u.id,bossId:target.id,heroKey:u.key,bossName:target.name,outcome:stage.duelOutcome||'defeat',remaining:DUEL_DURATION,elapsed:0,entranceElapsed:0,nextBeat:0,startHp:target.hp};return;
   }
   if(b.time-u.lastAttack>=d.rate&&!u.pendingCleave&&b.time-(u.swingStartedAt??-100)>=SWING.duration){
    u.lastAttack=b.time;const damage=(d.damage+(b.heroMode&&!b.peachMode&&!b.sunMode?(b.weapons?.[u.key]||0)*4:weaponBonus(u.key,b.weapons?.[u.key]))+(u.key==='ambush'&&!u.ambushUsed?35:0))*(b.time<(b.oathBuffUntil||0)?1.2:1)*(target.shielded&&u.key==='archer'?.5:1);
    u.ambushUsed=true;if(u.key==='archer'||d.ranged){if(d.ranged)u.swingStartedAt=b.time;u.flash=.32;effect(b,'arrow',u.lane,u.x,target.x);hurtEnemy(b,target,damage);target.flash=.2}
    else {u.swingStartedAt=b.time;u.pendingStrike={targetId:target.id,impactAt:b.time+SWING.impact,damage}}
   }
  }else{
   u.action=b.time-(u.swingStartedAt??-100)<SWING.duration?'guarding':'marching';
   // Friendly units use visual subpositions and can pass each other; only enemies block advance.
   const limit=target?Math.max(u.x,target.x-d.range*.9):.84;
   if(u.order==='hold')u.action='holding';
   else if(u.action==='marching'){u.x=Math.min(u.order==='forward'?u.targetX:.84,limit,u.x+d.speed*dt*(b.time<(u.slowUntil||0)?.6:1)*(u.order==='forward'?1.2:1));if(u.order==='forward'&&u.x>=u.targetX-.0001){u.order='hold';u.action='holding'}}
   if(u.x>=.839)u.action='holding';
  }
  const nearby=b.enemies.filter(e=>e.hp>0&&e.lane===u.lane&&e.x>=u.x-.02&&e.x-u.x<=.23);
  if(!b.heroMode&&u.key==='zhangfei'&&b.level>=heroSkill('zhangfei','roar',b.level).level&&nearby.length&&b.time-(u.lastSkill||0)>=heroSkill('zhangfei','roar',b.level).cooldown){
   u.lastSkill=b.time;for(const e of nearby){hurtEnemy(b,e,heroSkill('zhangfei','roar',b.level).power);e.stunnedUntil=b.time+1.1;if(!e.boss)e.x=Math.min(.95,e.x+.065)}effect(b,'roar',u.lane,u.x);b.skillNotice={key:u.key,text:`${d.name}・${heroSkill('zhangfei','roar',b.level).name}`,until:b.time+1.5};
  }
  if(!b.heroMode&&u.key==='guanyu'&&b.level>=heroSkill('guanyu','cleave',b.level).level&&nearby.length&&b.time-(u.lastSkill||0)>=heroSkill('guanyu','cleave',b.level).cooldown){
   u.lastSkill=b.time;if(!u.pendingStrike)u.swingStartedAt=b.time;u.pendingCleave={ids:nearby.map(e=>e.id),impactAt:u.pendingStrike?.impactAt??b.time+SWING.impact};
  }
  const leaderSkill=!b.heroMode&&d.heal?heroSkill('liubei','heal',b.level):null;
  if(leaderSkill&&b.level>=leaderSkill.level&&b.time-u.lastHeal>=leaderSkill.cooldown){
   if(d.faction==='sun'){
    // Offensive skills wait for a target and share the normal swing's impact frame.
    if(nearby.length){u.lastHeal=b.time;if(!u.pendingStrike)u.swingStartedAt=b.time;u.pendingCleave={skill:'heal',ids:nearby.map(e=>e.id),impactAt:u.pendingStrike?.impactAt??b.time+SWING.impact}}
    continue;
   }
   u.lastHeal=b.time;const foodBefore=b.food;if(d.faction==='cao')b.food=Math.min(300,b.food+4);let used=b.food>foodBefore;
   for(const ally of b.allies)if(ally.hp>0&&ally.lane===u.lane){if(ally.hp<ally.maxHp){effect(b,'heal',ally.lane,ally.x);used=true}ally.hp=Math.min(ally.maxHp,ally.hp+leaderSkill.power)}
   if(used)b.skillNotice={key:u.key,text:`${d.name}・${leaderSkill.name}`,until:b.time+1.8};
  }
 }
 protectBarrier(b);
 for(const e of b.enemies){
  if(e.hp<=0)continue;e.action='guarding';e.flash=Math.max(0,e.flash-dt);if(b.time<(e.stunnedUntil||0)){e.action='stunned';e.pendingStrike=null;e.pendingShot=null;e.swingStartedAt=-100;continue}
  if(!e.boss&&e.pendingStrike&&b.time+1e-8>=e.pendingStrike.impactAt){const strike=e.pendingStrike,victim=b.allies.find(u=>u.id===strike.targetId&&u.hp>0&&u.lane===e.lane);if(victim&&Math.abs(e.x-victim.x)<=.11){damageAlly(victim,strike.damage);victim.flash=.2;effect(b,'enemy-slash',e.lane,e.x,victim.x);e.impactUntil=b.time+.08}e.pendingStrike=null}
  if(e.ranged&&e.pendingShot&&b.time+1e-8>=e.pendingShot.releaseAt){
   const victim=b.allies.find(u=>u.id===e.pendingShot.targetId&&u.hp>0&&u.lane===e.lane&&u.x<=e.x+.015&&e.x-u.x<=.29);
   if(victim){const travel=.38;b.projectiles.push({targetId:victim.id,lane:e.lane,aimX:victim.x,impactAt:b.time+travel,damage:e.damage*(b.time<(e.rallyUntil||0)?1.3:1)});effect(b,'enemy-arrow',e.lane,e.x,victim.x,{duration:travel,remaining:travel});e.shotAt=b.time;}
   e.pendingShot=null;
  }
  const target=b.allies.filter(u=>u.hp>0&&u.lane===e.lane&&u.x<=e.x+.015).sort((a,c)=>c.x-a.x)[0];
  if(e.boss){
   if(b.level===5&&!e.guardBroken&&e.hp/e.maxHp<=.65){e.guardBroken=true;e.shielded=false;b.duelHint=null;b.skillNotice={key:'enemy',text:'盾勢已破！劉備同路近身即可單挑',until:b.time+3};effect(b,'block',e.lane,e.x);}
   if(b.level>=3&&!e.support&&!e.enraged&&e.hp<=e.maxHp/2){e.enraged=true;e.rate=1.1;e.nextSkill=b.time;b.skillNotice={key:'enemy',text:`${e.name}・${b.level>=17?'破陣狂攻':'黃天狂攻'}！留意紅色路線`,until:b.time+3};effect(b,'boss',e.lane,e.x);}
   if(e.castAt&&b.time>=e.castAt){
    const kind=bossProfile(b,e).skillType;
    if(kind==='rally'){
     for(const ally of b.enemies)if(ally.hp>0&&!ally.boss){ally.rallyUntil=b.time+4;effect(b,'rally',ally.lane,ally.x)}
     effect(b,'rally',e.lane,e.x);
    }else if(kind==='wind'||kind==='rain'){
     if(b.level===15&&!b.allies.some(u=>u.hp>0&&(e.castLanes||[e.lane]).includes(u.lane))){e.stunnedUntil=b.time+2.5;b.notice='張梁呼風落空，露出破綻！趁機反擊。';b.noticeUntil=b.time+3;}
     for(const lane of e.castLanes||[e.lane]){
      for(const u of b.allies)if(u.hp>0&&u.lane===lane){damageAlly(u,kind==='wind'?12:8);u.flash=.3;if(kind==='wind'){u.x=Math.max(.06,u.x-.045);u.pendingStrike=null;if(u.order==='hold')u.targetX=u.x}else u.slowUntil=b.time+3;}
      effect(b,kind,lane,.5,.5,{duration:2.4,remaining:2.4});
     }
    }else if(kind==='hook'){
     const victim=b.allies.find(u=>u.id===e.castTargetId&&u.hp>0&&u.lane===e.lane&&Math.abs(u.x-e.x)<.38);
     if(victim){damageAlly(victim,24);victim.x=Math.min(e.x-.075,victim.x+.09);victim.targetX=victim.x;victim.order='hold';victim.pendingStrike=null;victim.pendingCleave=null;victim.swingStartedAt=-100;victim.flash=.3;effect(b,'hook',e.lane,e.x,victim.x)}
    }else{
     for(const u of b.allies)if(u.hp>0&&(e.castLanes||[e.lane]).includes(u.lane)&&((b.level===6||kind==='thunder')||Math.abs(u.x-e.x)<.24)){
      damageAlly(u,kind==='fire'?16:b.level===1?8:22+Math.min(6,b.level)+(e.enraged?6:0));u.flash=.3;
      if(b.level===5){u.x=Math.max(.06,u.x-.07);if(u.order==='hold')u.targetX=u.x;u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100;}
     }
     for(const lane of e.castLanes||[e.lane])effect(b,kind==='thunder'?'thunder':'boss',lane,e.x);
     if(kind==='fire')for(const lane of e.castLanes||[e.lane]){b.hazards.push({lane,nextTick:b.time+1,until:b.time+3.2});effect(b,'fire',lane,.5,.5,{duration:3.2,remaining:3.2})}
    }
    e.skillsCast=(e.skillsCast||0)+1;e.recoveryUntil=b.time+2;e.castAt=null;e.castLanes=null;e.castTargetId=null;e.nextSkill=b.time+(e.enraged?7:9);
    b.skillNotice={key:'enemy',text:`${e.name}・${bossProfile(b,e).skillName}`,until:b.time+1.5};
   }
   if(b.time<(e.recoveryUntil||0)){e.action='recovering';continue}
   if(!e.castAt&&target&&e.x-target.x<.34&&b.time>=(e.nextSkill||0)){
    e.castStartedAt=b.time;e.castAt=b.time+(b.level>=5?2.5:1.8);e.castLanes=e.enraged&&bossProfile(b,e).skillType!=='hook'?[e.lane,(e.lane+1)%lanesFor(b)]:[e.lane];e.castTargetId=target.id;
    b.notice=`${e.name}蓄力：${bossProfile(b,e).skillName}！${bossProfile(b,e).skillType==='rally'?'敵兵即將加速，守住各路':'可換路閃避'}`;b.noticeUntil=e.castAt;
   }
   if(e.castAt){e.action='casting';continue}
  }
  if(e.ranged&&target&&e.x-target.x<=.27){
   if(!e.pendingShot&&b.time-e.lastAttack>=e.rate){e.lastAttack=b.time;e.pendingShot={targetId:target.id,releaseAt:b.time+.55};}
   e.action=e.pendingShot?'aiming':'guarding';continue;
  }
  if(e.ranged&&e.pendingShot){e.action='aiming';continue;}
  if(!e.boss&&b.time-(e.swingStartedAt??-100)<ENEMY_SWING.duration){e.action='striking';continue}
  if(target&&e.x-target.x<=.075){if(b.time-e.lastAttack>=e.rate){e.lastAttack=b.time;const damage=e.damage*(b.time<(e.rallyUntil||0)?1.3:1);if(e.boss){e.flash=.32;effect(b,'enemy-slash',e.lane,e.x,target.x);damageAlly(target,damage);target.flash=.2}else{e.swingStartedAt=b.time;e.pendingStrike={targetId:target.id,impactAt:b.time+ENEMY_SWING.impact,damage};e.action='striking'}}}
  else {e.action='marching';e.x-=e.speed*dt*(b.time<(e.rallyUntil||0)?1.35:1);}
  if(e.x<.025){e.hp=0;e.escaped=true;if(e.boss&&!e.support)b.lossReason='commander-breach';effect(b,'breach',e.lane,.025,-.12,{enemy:true,boss:e.boss,shielded:e.shielded,ranged:e.ranged});b.lives--;b.notice='敵軍突破！留意其他路線。';b.noticeUntil=b.time+3}
 }
 if(b.level>=UNLOCKS.oath&&!b.oathUsed&&['liubei','guanyu','zhangfei'].every(key=>b.allies.some(u=>u.key===key&&u.hp>0))){b.oathUsed=true;b.oathBuffUntil=b.time+5;for(const ally of b.allies)if(ally.hp>0){ally.hp=Math.min(ally.maxHp,ally.hp+55);effect(b,'oath',ally.lane,ally.x)}b.skillNotice={key:'liubei',text:b.level>=17?'合擊・同袍合陣':'合擊・桃園同心',until:b.time+2.2};b.notice=(b.level>=17?'同袍合陣':'桃園同心')+'！全軍回復，五秒內攻擊提升。';b.noticeUntil=b.time+5}
 for(const unit of [...b.allies,...b.enemies])if(unit.hp<=0&&!unit.escaped){const captured=unit.boss&&!unit.support&&stage.duelOutcome==='capture',retreat=unit.boss&&(stage.duelOutcome==='retreat'||unit.support);effect(b,captured?'capture':retreat?'retreat':'defeat',unit.lane,unit.x,retreat?1.1:unit.x,{key:unit.key||null,enemy:!unit.key,boss:!!unit.boss,shielded:!!unit.shielded,ranged:!!unit.ranged,bossName:unit.name});if(captured){b.bossCaptured=true;b.notice=unit.name+'已被俘，繼續清退餘兵。';b.noticeUntil=b.time+4}if(retreat)b.bossRetreated=true;if(unit.key&&!troop(b,unit.key))b.cooldowns[unit.key]=b.time+12}
 b.allies=b.allies.filter(u=>u.hp>0);b.enemies=b.enemies.filter(u=>u.hp>0);
 // Recheck evacuation after this tick's damage and movement, without advancing mission time.
 if(['withdraw','decoy'].includes(b.mission?.kind))stepMission(b,0);
 if(b.lives<=0||b.lossReason==='commander-breach'){b.over=true;b.won=false}
 else if(extracted(b)||b.bossSpawned&&!b.enemies.length&&missionReady(b)){b.over=true;b.won=true}
}

function damageAlly(u,amount){const blocked=Math.min(u.shield||0,amount);u.shield=Math.max(0,(u.shield||0)-blocked);u.hp-=amount-blocked}
export function castActive(b,key,index){
 if(!b?.heroMode||b.paused||b.over||b.duel||b.introPending)return false;const u=b.allies.find(a=>a.key===key&&a.hp>0),d=battleHeroes(b)[key],s=d?.skills?.[index];if(!u||!s||d.heroLevel<s.level)return false;const r=b.heroResources[d.heroId];if(r.mp<s.mp||b.time<(r.ready[index]||0))return false;
 const near=b.enemies.filter(e=>e.hp>0&&e.lane===u.lane&&e.x>=u.x-.03&&e.x-u.x<=((b.peachMode||b.sunMode)?.17:d.ranged?.4:.28));const offensive=['pierce','sweep','push','volley','rain','halt','lock'].includes(s.id);if(offensive&&!near.length){b.notice='這一路射程內還沒有敵人，MP 未扣除。';b.noticeUntil=b.time+2;return false}
 if(['heal','rally'].includes(s.id)&&!b.allies.some(a=>a.hp>0&&a.hp<a.maxHp&&(s.id==='rally'||a.lane===u.lane))){b.notice='夥伴都很健康，等受傷再用，MP 未扣除。';b.noticeUntil=b.time+2;return false}
 r.mp-=s.mp;r.ready[index]=b.time+s.cooldown;
 const allies=b.allies.filter(a=>a.hp>0&&(s.id==='fort'||s.id==='supply'||s.id==='rally'||a.lane===u.lane));
 if(['heal','supply','rally'].includes(s.id)){for(const a of allies){a.hp=Math.min(a.maxHp,a.hp+(s.id==='supply'?15:35));effect(b,'heal',a.lane,a.x)}if(s.id==='supply')b.food=Math.min(300,b.food+60)}
 if(['shield','escape','fort','lock'].includes(s.id))for(const a of allies){a.shield=Math.max(a.shield||0,s.id==='shield'?35:s.id==='lock'?30:45);a.shieldUntil=b.time+6;effect(b,'block',a.lane,a.x)}
 if(offensive){for(const e of s.id==='volley'?[...near].sort((a,c)=>Math.abs(a.x-u.x)-Math.abs(c.x-u.x)).slice(0,1):near){hurtEnemy(b,e,({pierce:45,sweep:65,push:20,volley:60,rain:45,halt:15,lock:0})[s.id]);if(['sweep','push','halt','lock'].includes(s.id))e.stunnedUntil=b.time+(s.id==='push'?1:s.id==='lock'?3:2);if(s.id==='push'&&!e.boss)e.x=Math.min(.95,e.x+.065);e.flash=.3}effect(b,d.ranged?'arrow':'roar',u.lane,u.x)}
 b.skillNotice={key,text:d.name+'・'+s.name,until:b.time+2};return true;
}
