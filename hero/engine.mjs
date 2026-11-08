import {WEATHER_GENERALS} from './weather-generals.mjs?v=storm-battle-1';
import {campaignState,weaponBonus} from './campaign.mjs?v=novel-camp-1';
import {heroSkill} from './skills.mjs?v=novel-camp-1';
import {HEROES,STAGES,UNLOCKS,FEATURES} from './story.mjs?v=storm-battle-1';

export const SWING={duration:.58,impact:.24,frameTime:.08,frames:6};
export const DUEL_DURATION=15;
export const DUEL_ENTRANCE_DURATION=3.2;
export function skipDuelEntrance(b){if(!b?.duel||b.paused||b.over)return false;b.duel.entranceElapsed=DUEL_ENTRANCE_DURATION;return true}
export const DUEL_BEATS=[
 {at:0,text:'一騎當千',side:'ready'},
 {at:1.5,text:'報上名來',side:'reply'},
 {at:3,text:'先聲奪人',side:'hero',damage:.12},
 {at:4.8,text:'敵將反擊',side:'enemy'},
 {at:6.2,text:'鏘！擋下了',side:'block'},
 {at:8,text:'破綻！連擊',side:'hero',damage:.18},
 {at:9.1,text:'回馬再戰',side:'enemy'},
 {at:10,text:'蓄勢・決勝一擊',side:'charge'},
 {at:11.8,text:'一擊斬將',side:'finish',damage:1},
 {at:13,text:'敵將討取',side:'victory'}
];
export function duelBeat(d){const beat=DUEL_BEATS.reduce((last,beat)=>d.elapsed>=beat.at?beat:last,DUEL_BEATS[0]);return d.outcome==='retreat'&&['finish','victory'].includes(beat.side)?{...beat,text:beat.side==='finish'?'破陣退敵':'張角退走'}:beat}
export function attackFrame(unit,time){const elapsed=time-(unit.swingStartedAt??-100);if(elapsed<0||elapsed>=SWING.duration)return 0;const frame=Math.min(5,Math.floor(elapsed/SWING.frameTime));return unit.key==='zhangfei'&&frame===4?3:frame}
export const LANE_CAPACITY=3;
export const laneCount=(b,lane)=>b.allies.filter(u=>u.hp>0&&u.lane===lane).length;
export const ENEMY_SWING={duration:.66,impact:.24};
export function enemyAttackFrame(unit,time){const age=time-(unit.swingStartedAt??-100);return age<0||age>=ENEMY_SWING.duration?2:age<ENEMY_SWING.impact?0:age<.44?1:2}
function commandUnit(b,key){return b.allies.find(u=>u.hp>0&&(typeof key==='number'?u.id===key:key!=='archer'&&u.key===key))}
export const SAVE_KEY='heroLegendProgress_v1';
export const BOSS_SKILLS=['試刀','截糧斬','裂陣重擊','旋風斬','鐵壁盾擊','黃天裂陣','黃旗號令','餘燼火路','鉤鐮牽引','黃天符雷'];
export function bossProfile(b,e){const stage=STAGES[b.level-1];return e.support?WEATHER_GENERALS[e.name]:{title:stage.bossTitle||'敵軍大將',skillType:stage.skillType,skillName:BOSS_SKILLS[b.level-1]}}
export function positionHero(b,key,lane,x){
 if(!b||b.over||b.paused||b.duel||b.introPending||!Number.isFinite(x)||!Number.isInteger(lane)||lane<0||lane>2)return false;
 const u=commandUnit(b,key);if(!u)return false;
 if(u.lane!==lane&&!moveHero(b,key,lane))return false;
 const enemy=b.enemies.filter(e=>e.hp>0&&e.lane===lane).sort((a,c)=>a.x-c.x)[0];
 u.targetX=Math.max(.06,Math.min(.84,x,enemy?Math.max(.06,enemy.x-.08):.84));
 u.order=Math.abs(u.targetX-u.x)<.005?'hold':u.targetX<u.x?'back':'forward';
 u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100;
 b.notice=`${HEROES[u.key].short}移往指定位置，抵達後駐守`;b.noticeUntil=b.time+2;return true;
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
 b.notice=`${HEROES[u.key].name}：${{forward:'前進至指定位置',back:'後退至指定位置',hold:'就地駐守',auto:'恢復自動前進'}[order]}`;b.noticeUntil=b.time+2;return true;
}
export function moveHero(b,key,lane){
 if(!b||b.over||b.paused||b.duel||b.introPending)return false;
 const u=commandUnit(b,key);
 if(!u||!Number.isInteger(lane)||lane<0||lane>2)return false;
 const reason=u.lane===lane?'已在這一路':b.time<(u.moveReadyAt||0)?'調動整備中，稍候再換路':laneCount(b,lane)>=LANE_CAPACITY?`${['上','中','下'][lane]}路已滿（3／3），先調走一名友軍，再換入這一路`:'';
 if(reason){b.notice=reason;b.noticeUntil=b.time+2;return false}
 u.lane=lane;u.moveReadyAt=b.time+2;u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100;
 const enemy=b.enemies.filter(e=>e.hp>0&&e.lane===lane).sort((a,c)=>a.x-c.x)[0];
 if(enemy)u.x=Math.max(.03,Math.min(u.x,enemy.x-.08));
 if(u.order){u.order='hold';u.targetX=u.x}
 b.notice=`${HEROES[u.key].name}轉往${['上','中','下'][lane]}路！`;b.noticeUntil=b.time+2;return true;
}
export function normalizeProgress(raw){
 const completed=Number(raw?.completed);
 const count=Number.isInteger(completed)?Math.max(0,Math.min(STAGES.length,completed)):0;
 return {version:1,completed:count,...campaignState(raw,count)};
}
export function createBattle(level,seed=Date.now(),weapons={}){
 if(!Number.isInteger(level)||!STAGES[level-1])throw new Error('關卡不存在');
 return {level,weapons:{...weapons},seed:seed>>>0,time:0,food:220,lives:3,spawned:0,nextSpawn:6,bossSpawned:false,allies:[],enemies:[],effects:[],hazards:[],oathUsed:false,skillNotice:null,cooldowns:{},nextId:1,paused:false,over:false,won:false,duel:null,duelSeen:false,notice:FEATURES[level-1].text,noticeUntil:8};
}
function random(b){b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;return b.seed/4294967296}
export function canDeploy(b,key,lane){
 if(!b||b.over||b.paused||b.duel||b.introPending)return '戰鬥暫停中';
 if(!HEROES[key]||!Number.isInteger(lane)||lane<0||lane>2)return '請選擇一張兵卡與一路';
 if(key!=='archer'&&b.allies.some(u=>u.key===key&&u.hp>0))return '這位武將已在場上';
 if(b.food<HEROES[key].cost)return '軍糧不足，稍等自動補給';
 if((b.cooldowns[key]||0)>b.time)return '這張兵卡正在準備';
 if(laneCount(b,lane)>=LANE_CAPACITY)return `${['上','中','下'][lane]}路已滿（3／3），請選其他路，或先調走一名友軍`;
 return '';
}
export function deploy(b,key,lane){
 const reason=canDeploy(b,key,lane);if(reason){if(b){b.notice=reason;b.noticeUntil=b.time+2}return false}
 const d=HEROES[key];b.food-=d.cost;b.cooldowns[key]=key==='archer'?b.time+d.cooldown:0;
 b.allies.push({id:b.nextId++,key,lane,x:.1,hp:d.hp,maxHp:d.hp,lastAttack:-10,lastHeal:b.time,lastSkill:b.time,flash:0,order:'hold',targetX:.1,action:'holding'});
 b.notice=`${d.name}出陣駐守！${key==='archer'?'點場上弓兵可調動，駐守時自動射擊':'點選武將，再點前方才會前進'}`;b.noticeUntil=b.time+1.8;return true;
}
function effect(b,type,lane,from,to=from,details={}){const duration=['roar','cleave','oath','heal','boss','rally','hook','thunder'].includes(type)?1:type==='retreat'?.9:type==='breach'?.7:type==='defeat'?.55:.4;const bossName=b.enemies.find(e=>e.boss&&e.lane===lane)?.name;b.effects.push({id:b.nextId++,type,lane,from,to,remaining:duration,duration,bossName,...details})}
function spawn(b){
 const stage=STAGES[b.level-1],boss=b.spawned>=stage.enemyCount;
 const lane=boss?1:([1,0,2][b.spawned%3]);
 const heavy=!boss&&b.level>=UNLOCKS.shields&&b.spawned%4===3;
 const hp=boss?stage.bossHp:Math.round(48+Math.min(6,b.level)*6+(heavy?35:0));
 b.enemies.push({id:b.nextId++,lane,x:.94,hp,maxHp:hp,boss,name:boss?stage.bossName:heavy?'黃巾盾賊':'黃巾刀賊',shielded:heavy||(boss&&b.level===5),stunnedUntil:0,damage:boss?17+Math.min(6,b.level):7+Math.min(6,b.level),rate:boss?1.6:1.5,speed:boss?.019:.027+random(b)*.004,lastAttack:b.time,flash:0,action:'marching'});
 if(b.level===8&&!boss)for(const general of Object.values(WEATHER_GENERALS))if(b.spawned===general.spawnAt){b.enemies.push({id:b.nextId++,lane:general.lane,x:.94,hp:general.hp,maxHp:general.hp,boss:true,support:true,name:general.name,damage:10,rate:1.8,speed:.022,lastAttack:b.time,flash:0,stunnedUntil:0});b.skillNotice={key:'enemy',text:`${general.title}・${general.name}出陣！${general.skillName}`,until:b.time+4};}
 if(boss){b.bossSpawned=true;b.introPending=true;}else b.spawned++;
 b.nextSpawn=b.time+stage.interval;
 if(boss){b.notice=`${stage.bossName}出陣！`;b.noticeUntil=b.time+4}
}
function resolveDuel(b){
 const duel=b.duel,hero=b.allies.find(u=>u.id===duel.heroId),boss=b.enemies.find(u=>u.id===duel.bossId);
 if(hero){hero.pendingStrike=null;hero.pendingCleave=null;hero.swingStartedAt=-100;hero.lastAttack=b.time;}
 b.notice=`${duel.bossName}${duel.outcome==='retreat'?'已撤走':'已被斬殺'}！繼續照應三路。`;b.noticeUntil=b.time+3;b.duel=null;
}
export function stepBattle(b,seconds){
 if(!b||b.over||b.paused||b.introPending)return;
 const dt=Math.min(.1,Math.max(0,Number(seconds)||0));if(!dt)return;
 if(b.duel){
  const d=b.duel;
  if(d.elapsed===0&&(d.entranceElapsed??DUEL_ENTRANCE_DURATION)<DUEL_ENTRANCE_DURATION){d.entranceElapsed=Math.min(DUEL_ENTRANCE_DURATION,d.entranceElapsed+dt);return}
  d.elapsed=Math.min(DUEL_DURATION,d.elapsed+dt);d.remaining=DUEL_DURATION-d.elapsed;
  const boss=b.enemies.find(e=>e.id===d.bossId);
  for(let i=d.nextBeat;i<DUEL_BEATS.length&&d.elapsed+1e-8>=DUEL_BEATS[i].at;i++){
   const beat=DUEL_BEATS[i];if(boss&&beat.damage)boss.hp=beat.side==='finish'?0:Math.max(1,boss.hp-d.startHp*beat.damage);d.nextBeat=i+1;
  }
  if(d.remaining<=.00001)resolveDuel(b);return;
 }
 b.effects=b.effects.filter(e=>{e.remaining-=dt;return e.remaining>0});
 b.time+=dt;
 for(const h of b.hazards||[]){if(b.time>=h.nextTick&&h.nextTick<=h.until){for(const u of b.allies)if(u.hp>0&&u.lane===h.lane){u.hp-=6;u.flash=.2}h.nextTick+=1}}
 b.hazards=(b.hazards||[]).filter(h=>h.until>b.time);
 b.food=Math.min(300,b.food+12*dt);
 const stage=STAGES[b.level-1];
 if(!b.bossSpawned&&b.time>=b.nextSpawn)spawn(b);
 if(b.introPending)return;
 for(const u of b.allies){
  if(u.hp<=0)continue;const d=HEROES[u.key];u.action='guarding';u.flash=Math.max(0,u.flash-dt);
  if(u.order==='back'){
   u.x=Math.max(u.targetX,u.x-d.speed*2*dt*(b.time<(u.slowUntil||0)?.6:1));u.action='retreating';
   if(u.x<=u.targetX+.0001){u.order='hold';u.action='holding'}
   continue;
  }
  if(u.key==='archer'&&u.order==='forward'){
   const ahead=b.enemies.filter(e=>e.hp>0&&e.lane===u.lane&&e.x>=u.x).sort((a,c)=>a.x-c.x)[0];
   const limit=Math.min(u.targetX,ahead?Math.max(u.x,ahead.x-.08):.84);
   u.x=Math.min(limit,u.x+d.speed*1.2*dt*(b.time<(u.slowUntil||0)?.6:1));u.action='marching';
   if(u.x>=limit-.0001){u.order='hold';u.action='holding'}
   continue;
  }
  if(u.pendingCleave&&b.time+1e-8>=u.pendingCleave.impactAt){
   for(const victim of b.enemies)if(victim.hp>0&&victim.lane===u.lane&&u.pendingCleave.ids.includes(victim.id)&&Math.abs(victim.x-u.x)<=.32){victim.hp-=heroSkill('guanyu','cleave').power;victim.flash=.3}
   effect(b,'cleave',u.lane,u.x,Math.min(.96,u.x+.15));u.impactUntil=b.time+.07;b.skillNotice={key:u.key,text:'關羽・青龍斬',until:b.time+1.5};u.pendingCleave=null;
  }
  if(u.pendingStrike&&b.time+1e-8>=u.pendingStrike.impactAt){
   const strike=u.pendingStrike,victim=b.enemies.find(e=>e.id===strike.targetId&&e.hp>0&&e.lane===u.lane);
   if(victim&&Math.abs(victim.x-u.x)<=d.range+.09){victim.hp-=strike.damage;victim.flash=.2;effect(b,'slash',u.lane,u.x,victim.x,{weapon:u.key});u.impactUntil=b.time+.07}
   u.pendingStrike=null;
  }
  const target=b.enemies.filter(e=>e.hp>0&&e.lane===u.lane&&e.x>=u.x-.015).sort((a,c)=>a.x-c.x)[0];
  if(target&&target.x-u.x<=d.range){
   if(b.level===5&&u.key==='liubei'&&target.boss&&target.hp/target.maxHp>.65&&!target.duelHintShown){target.duelHintShown=true;b.notice='先破盾才能單挑：把石魁生命打到 65% 以下，再由劉備同路近身。';b.noticeUntil=b.time+6;b.duelHint={text:b.notice,until:b.time+6};}

   if(target.boss&&!target.support&&!b.duelSeen&&stage.duelHero===u.key&&(!stage.duelHpRatio||target.hp/target.maxHp<=stage.duelHpRatio)&&target.x-u.x<=Math.max(.14,d.range)){
    b.duelHint=null;b.duelSeen=true;b.duel={heroId:u.id,bossId:target.id,heroKey:u.key,bossName:target.name,outcome:stage.duelOutcome||'defeat',remaining:DUEL_DURATION,elapsed:0,entranceElapsed:0,nextBeat:0,startHp:target.hp};return;
   }
   if(b.time-u.lastAttack>=d.rate&&!u.pendingCleave&&b.time-(u.swingStartedAt??-100)>=SWING.duration){
    u.lastAttack=b.time;const damage=(d.damage+weaponBonus(u.key,b.weapons?.[u.key]))*(b.time<(b.oathBuffUntil||0)?1.2:1)*(target.shielded&&u.key==='archer'?.5:1);
    if(u.key==='archer'){u.flash=.32;effect(b,'arrow',u.lane,u.x,target.x);target.hp-=damage;target.flash=.2}
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
  if(u.key==='zhangfei'&&b.level>=heroSkill('zhangfei','roar').level&&nearby.length&&b.time-(u.lastSkill||0)>=heroSkill('zhangfei','roar').cooldown){
   u.lastSkill=b.time;for(const e of nearby){e.hp-=heroSkill('zhangfei','roar').power;e.stunnedUntil=b.time+1.1;if(!e.boss)e.x=Math.min(.95,e.x+.065)}effect(b,'roar',u.lane,u.x);b.skillNotice={key:u.key,text:'張飛・燕人怒吼',until:b.time+1.5};
  }
  if(u.key==='guanyu'&&b.level>=heroSkill('guanyu','cleave').level&&nearby.length&&b.time-(u.lastSkill||0)>=heroSkill('guanyu','cleave').cooldown){
   u.lastSkill=b.time;if(!u.pendingStrike)u.swingStartedAt=b.time;u.pendingCleave={ids:nearby.map(e=>e.id),impactAt:u.pendingStrike?.impactAt??b.time+SWING.impact};
  }
  if(d.heal&&b.level>=heroSkill('liubei','heal').level&&b.time-u.lastHeal>=heroSkill('liubei','heal').cooldown){u.lastHeal=b.time;for(const ally of b.allies)if(ally.hp>0&&ally.lane===u.lane){if(ally.hp<ally.maxHp){effect(b,'heal',ally.lane,ally.x);b.skillNotice={key:'liubei',text:'劉備・仁德回春',until:b.time+1.8};}ally.hp=Math.min(ally.maxHp,ally.hp+heroSkill('liubei','heal').power)}}
 }
 for(const e of b.enemies){
  if(e.hp<=0)continue;e.action='guarding';e.flash=Math.max(0,e.flash-dt);if(b.time<(e.stunnedUntil||0)){e.action='stunned';e.pendingStrike=null;e.swingStartedAt=-100;continue}
  if(!e.boss&&e.pendingStrike&&b.time+1e-8>=e.pendingStrike.impactAt){const strike=e.pendingStrike,victim=b.allies.find(u=>u.id===strike.targetId&&u.hp>0&&u.lane===e.lane);if(victim&&Math.abs(e.x-victim.x)<=.11){victim.hp-=strike.damage;victim.flash=.2;effect(b,'enemy-slash',e.lane,e.x,victim.x);e.impactUntil=b.time+.08}e.pendingStrike=null}
  const target=b.allies.filter(u=>u.hp>0&&u.lane===e.lane&&u.x<=e.x+.015).sort((a,c)=>c.x-a.x)[0];
  if(e.boss){
   if(b.level===5&&!e.guardBroken&&e.hp/e.maxHp<=.65){e.guardBroken=true;e.shielded=false;b.skillNotice={key:'enemy',text:'盾勢已破！劉備同路近身即可單挑',until:b.time+3};effect(b,'block',e.lane,e.x);}
   if((b.level===6||b.level===10)&&!e.enraged&&e.hp<=e.maxHp/2){e.enraged=true;e.rate=1.1;e.nextSkill=b.time;b.skillNotice={key:'enemy',text:`${e.name}・黃天狂攻！留意紅色路線`,until:b.time+3};effect(b,'boss',e.lane,e.x);}
   if(e.castAt&&b.time>=e.castAt){
    const kind=bossProfile(b,e).skillType;
    if(kind==='rally'){
     for(const ally of b.enemies)if(ally.hp>0&&!ally.boss){ally.rallyUntil=b.time+4;effect(b,'rally',ally.lane,ally.x)}
     effect(b,'rally',e.lane,e.x);
    }else if(kind==='wind'||kind==='rain'){
     for(const lane of e.castLanes||[e.lane]){
      for(const u of b.allies)if(u.hp>0&&u.lane===lane){u.hp-=kind==='wind'?12:8;u.flash=.3;if(kind==='wind'){u.x=Math.max(.06,u.x-.045);u.pendingStrike=null;if(u.order==='hold')u.targetX=u.x}else u.slowUntil=b.time+3;}
      effect(b,kind,lane,.5,.5,{duration:2.4,remaining:2.4});
     }
    }else if(kind==='hook'){
     const victim=b.allies.find(u=>u.id===e.castTargetId&&u.hp>0&&u.lane===e.lane&&Math.abs(u.x-e.x)<.38);
     if(victim){victim.hp-=24;victim.x=Math.min(e.x-.075,victim.x+.09);victim.targetX=victim.x;victim.order='hold';victim.pendingStrike=null;victim.pendingCleave=null;victim.swingStartedAt=-100;victim.flash=.3;effect(b,'hook',e.lane,e.x,victim.x)}
    }else{
     for(const u of b.allies)if(u.hp>0&&(e.castLanes||[e.lane]).includes(u.lane)&&((b.level===6||kind==='thunder')||Math.abs(u.x-e.x)<.24)){
      u.hp-=kind==='fire'?16:b.level===1?8:22+Math.min(6,b.level)+(e.enraged?6:0);u.flash=.3;
      if(b.level===5){u.x=Math.max(.06,u.x-.07);if(u.order==='hold')u.targetX=u.x;u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100;}
     }
     for(const lane of e.castLanes||[e.lane])effect(b,kind==='thunder'?'thunder':'boss',lane,e.x);
     if(kind==='fire'){b.hazards.push({lane:e.lane,nextTick:b.time+1,until:b.time+3.2});effect(b,'fire',e.lane,.5,.5,{duration:3.2,remaining:3.2})}
    }
    e.castAt=null;e.castLanes=null;e.castTargetId=null;e.nextSkill=b.time+(e.enraged?7:9);
    b.skillNotice={key:'enemy',text:`${e.name}・${bossProfile(b,e).skillName}`,until:b.time+1.5};
   }
   if(!e.castAt&&target&&e.x-target.x<.24&&b.time>=(e.nextSkill||0)){
    e.castAt=b.time+(b.level>=5?2.5:1.8);e.castLanes=e.enraged?[e.lane,(e.lane+1)%3]:[e.lane];e.castTargetId=target.id;
    b.notice=`${e.name}蓄力：${bossProfile(b,e).skillName}！${bossProfile(b,e).skillType==='rally'?'敵兵即將加速，守住三路':'可換路閃避'}`;b.noticeUntil=e.castAt;
   }
   if(e.castAt){e.action='casting';continue}
  }
  if(!e.boss&&b.time-(e.swingStartedAt??-100)<ENEMY_SWING.duration){e.action='striking';continue}
  if(target&&e.x-target.x<=.075){if(b.time-e.lastAttack>=e.rate){e.lastAttack=b.time;const damage=e.damage*(b.time<(e.rallyUntil||0)?1.3:1);if(e.boss){e.flash=.32;effect(b,'enemy-slash',e.lane,e.x,target.x);target.hp-=damage;target.flash=.2}else{e.swingStartedAt=b.time;e.pendingStrike={targetId:target.id,impactAt:b.time+ENEMY_SWING.impact,damage};e.action='striking'}}}
  else {e.action='marching';e.x-=e.speed*dt*(b.time<(e.rallyUntil||0)?1.35:1);}
  if(e.x<.025){e.hp=0;e.escaped=true;effect(b,'breach',e.lane,.025,-.12,{enemy:true,boss:e.boss,shielded:e.shielded});b.lives--;b.notice='敵軍突破！留意另外兩路。';b.noticeUntil=b.time+3}
 }
 if(b.level>=UNLOCKS.oath&&!b.oathUsed&&['liubei','guanyu','zhangfei'].every(key=>b.allies.some(u=>u.key===key&&u.hp>0))){b.oathUsed=true;b.oathBuffUntil=b.time+5;for(const ally of b.allies)if(ally.hp>0){ally.hp=Math.min(ally.maxHp,ally.hp+55);effect(b,'oath',ally.lane,ally.x)}b.skillNotice={key:'liubei',text:'合擊・桃園同心',until:b.time+2.2};b.notice='桃園同心！全軍回復，五秒內攻擊提升。';b.noticeUntil=b.time+5}
 for(const unit of [...b.allies,...b.enemies])if(unit.hp<=0&&!unit.escaped){const retreat=unit.boss&&(b.level===10||unit.support);effect(b,retreat?'retreat':'defeat',unit.lane,unit.x,retreat?1.1:unit.x,{key:unit.key||null,enemy:!unit.key,boss:!!unit.boss,shielded:!!unit.shielded,bossName:unit.name});if(retreat)b.bossRetreated=true;if(unit.key&&unit.key!=='archer')b.cooldowns[unit.key]=b.time+12}
 b.allies=b.allies.filter(u=>u.hp>0);b.enemies=b.enemies.filter(u=>u.hp>0);
 if(b.lives<=0){b.over=true;b.won=false}
 else if(b.bossSpawned&&!b.enemies.length){b.over=true;b.won=true}
}
