import {HEROES,STAGES,UNLOCKS,FEATURES} from './story.mjs?v=duel-audio-1';

export const SWING={duration:.58,impact:.24,frameTime:.08,frames:6};
export const DUEL_DURATION=15;
export const DUEL_BEATS=[
 {at:0,text:'一騎當千',side:'ready'},
 {at:3,text:'先聲奪人',side:'hero',damage:.12},
 {at:4.8,text:'敵將反擊',side:'enemy'},
 {at:6.2,text:'鏘！擋下了',side:'block'},
 {at:8,text:'破綻！連擊',side:'hero',damage:.18},
 {at:10,text:'蓄勢・決勝一擊',side:'charge'},
 {at:11.8,text:'一擊斬將',side:'finish',damage:1},
 {at:13,text:'敵將討取',side:'victory'}
];
export function duelBeat(d){return DUEL_BEATS.reduce((last,beat)=>d.elapsed>=beat.at?beat:last,DUEL_BEATS[0])}
export function attackFrame(unit,time){const elapsed=time-(unit.swingStartedAt??-100);if(elapsed<0||elapsed>=SWING.duration)return 0;const frame=Math.min(5,Math.floor(elapsed/SWING.frameTime));return unit.key==='zhangfei'&&frame===4?3:frame}
export const SAVE_KEY='heroLegendProgress_v1';
export const BOSS_SKILLS=['試刀','截糧斬','裂陣重擊','旋風斬','破陣斬','黃天震擊'];
export function commandHero(b,key,order){
 if(!b||b.over||b.paused||b.duel||b.introPending)return false;
 const u=b.allies.find(u=>u.key===key&&u.hp>0);
 if(!u||key==='archer')return false;
 if(order==='up'||order==='down')return moveHero(b,key,u.lane+(order==='up'?-1:1));
 if(!['forward','back','hold','auto'].includes(order))return false;
 u.order=order==='auto'?null:order;
 u.targetX=order==='forward'?Math.min(.84,u.x+.16):order==='back'?Math.max(.06,u.x-.16):u.x;
 u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100;
 b.notice=`${HEROES[key].name}：${{forward:'前進至指定位置',back:'後退至指定位置',hold:'就地駐守',auto:'恢復自動前進'}[order]}`;b.noticeUntil=b.time+2;return true;
}
export function moveHero(b,key,lane){
 if(!b||b.over||b.paused||b.duel||b.introPending)return false;
 const u=b.allies.find(u=>u.key===key&&u.hp>0);
 if(!u||key==='archer'||!Number.isInteger(lane)||lane<0||lane>2)return false;
 const reason=u.lane===lane?'已在這一路':b.time<(u.moveReadyAt||0)?'調動整備中，稍候再換路':b.allies.filter(a=>a.hp>0&&a.lane===lane).length>=3?'這一路已有三名友軍':'';
 if(reason){b.notice=reason;b.noticeUntil=b.time+2;return false}
 u.lane=lane;u.moveReadyAt=b.time+6;u.pendingStrike=null;u.pendingCleave=null;u.swingStartedAt=-100;
 const enemy=b.enemies.filter(e=>e.hp>0&&e.lane===lane).sort((a,c)=>a.x-c.x)[0];
 if(enemy)u.x=Math.max(.03,Math.min(u.x,enemy.x-.08));
 if(u.order){u.order='hold';u.targetX=u.x}
 b.notice=`${HEROES[key].name}轉往${['上','中','下'][lane]}路！`;b.noticeUntil=b.time+2;return true;
}
export function normalizeProgress(raw){
 const completed=Number(raw?.completed);
 return {version:1,completed:Number.isInteger(completed)?Math.max(0,Math.min(STAGES.length,completed)):0};
}
export function createBattle(level,seed=Date.now()){
 if(!Number.isInteger(level)||!STAGES[level-1])throw new Error('關卡不存在');
 return {level,seed:seed>>>0,time:0,food:220,lives:3,spawned:0,nextSpawn:6,bossSpawned:false,allies:[],enemies:[],effects:[],oathUsed:false,skillNotice:null,cooldowns:{},nextId:1,paused:false,over:false,won:false,duel:null,duelSeen:false,notice:FEATURES[level-1].text,noticeUntil:8};
}
function random(b){b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;return b.seed/4294967296}
export function canDeploy(b,key,lane){
 if(!b||b.over||b.paused||b.duel||b.introPending)return '戰鬥暫停中';
 if(!HEROES[key]||!Number.isInteger(lane)||lane<0||lane>2)return '請選擇一張兵卡與一路';
 if(key!=='archer'&&b.allies.some(u=>u.key===key&&u.hp>0))return '這位武將已在場上';
 if(b.food<HEROES[key].cost)return '軍糧不足，稍等自動補給';
 if((b.cooldowns[key]||0)>b.time)return '這張兵卡正在準備';
 if(b.allies.filter(u=>u.hp>0&&u.lane===lane).length>=3)return '這一路已有三名友軍，試試其他路';
 return '';
}
export function deploy(b,key,lane){
 const reason=canDeploy(b,key,lane);if(reason){if(b){b.notice=reason;b.noticeUntil=b.time+2}return false}
 const d=HEROES[key];b.food-=d.cost;b.cooldowns[key]=key==='archer'?b.time+d.cooldown:0;
 b.allies.push({id:b.nextId++,key,lane,x:.1,hp:d.hp,maxHp:d.hp,lastAttack:-10,lastHeal:b.time,lastSkill:b.time,flash:0,action:'marching'});
 b.notice=`${d.name}出陣！`;b.noticeUntil=b.time+1.8;return true;
}
function effect(b,type,lane,from,to=from,details={}){const duration=['roar','cleave','oath','heal'].includes(type)?1:type==='breach'?.7:type==='defeat'?.55:.4;const bossName=b.enemies.find(e=>e.boss&&e.lane===lane)?.name;b.effects.push({id:b.nextId++,type,lane,from,to,remaining:duration,duration,bossName,...details})}
function spawn(b){
 const stage=STAGES[b.level-1],boss=b.spawned>=stage.enemyCount;
 const lane=boss?1:([1,0,2][b.spawned%3]);
 const heavy=!boss&&b.level>=UNLOCKS.shields&&b.spawned%4===3;
 const hp=boss?stage.bossHp:Math.round(48+b.level*6+(heavy?35:0));
 b.enemies.push({id:b.nextId++,lane,x:.94,hp,maxHp:hp,boss,name:boss?stage.bossName:heavy?'黃巾盾兵':'黃巾步卒',shielded:heavy,stunnedUntil:0,damage:boss?17+b.level:7+b.level,rate:boss?1.6:1.5,speed:boss?.019:.027+random(b)*.004,lastAttack:b.time,flash:0,action:'marching'});
 if(boss){b.bossSpawned=true;b.introPending=true;}else b.spawned++;
 b.nextSpawn=b.time+stage.interval;
 if(boss){b.notice=`${stage.bossName}出陣！`;b.noticeUntil=b.time+4}
}
function resolveDuel(b){
 const duel=b.duel,hero=b.allies.find(u=>u.id===duel.heroId),boss=b.enemies.find(u=>u.id===duel.bossId);
 if(hero){hero.pendingStrike=null;hero.pendingCleave=null;hero.swingStartedAt=-100;hero.lastAttack=b.time;}
 b.notice=`${duel.bossName}已被斬殺！繼續照應三路。`;b.noticeUntil=b.time+3;b.duel=null;
}
export function stepBattle(b,seconds){
 if(!b||b.over||b.paused||b.introPending)return;
 const dt=Math.min(.1,Math.max(0,Number(seconds)||0));if(!dt)return;
 if(b.duel){
  const d=b.duel;d.elapsed=Math.min(DUEL_DURATION,d.elapsed+dt);d.remaining=DUEL_DURATION-d.elapsed;
  const boss=b.enemies.find(e=>e.id===d.bossId);
  for(let i=d.nextBeat;i<DUEL_BEATS.length&&d.elapsed+1e-8>=DUEL_BEATS[i].at;i++){
   const beat=DUEL_BEATS[i];if(boss&&beat.damage)boss.hp=beat.side==='finish'?0:Math.max(1,boss.hp-d.startHp*beat.damage);d.nextBeat=i+1;
  }
  if(d.remaining<=.00001)resolveDuel(b);return;
 }
 b.effects=b.effects.filter(e=>{e.remaining-=dt;return e.remaining>0});
 b.time+=dt;b.food=Math.min(300,b.food+12*dt);
 const stage=STAGES[b.level-1];
 if(!b.bossSpawned&&b.time>=b.nextSpawn)spawn(b);
 if(b.introPending)return;
 for(const u of b.allies){
  if(u.hp<=0)continue;const d=HEROES[u.key];u.action='guarding';u.flash=Math.max(0,u.flash-dt);
  if(u.order==='back'){
   u.x=Math.max(u.targetX,u.x-d.speed*2*dt);u.action='retreating';
   if(u.x<=u.targetX+.0001){u.order='hold';u.action='holding'}
   continue;
  }
  if(u.pendingCleave&&b.time+1e-8>=u.pendingCleave.impactAt){
   for(const victim of b.enemies)if(victim.hp>0&&victim.lane===u.lane&&u.pendingCleave.ids.includes(victim.id)&&Math.abs(victim.x-u.x)<=.32){victim.hp-=45;victim.flash=.3}
   effect(b,'cleave',u.lane,u.x,Math.min(.96,u.x+.15));u.impactUntil=b.time+.07;b.skillNotice={key:u.key,text:'關羽・青龍斬',until:b.time+1.5};u.pendingCleave=null;
  }
  if(u.pendingStrike&&b.time+1e-8>=u.pendingStrike.impactAt){
   const strike=u.pendingStrike,victim=b.enemies.find(e=>e.id===strike.targetId&&e.hp>0&&e.lane===u.lane);
   if(victim&&Math.abs(victim.x-u.x)<=d.range+.09){victim.hp-=strike.damage;victim.flash=.2;effect(b,'slash',u.lane,u.x,victim.x);u.impactUntil=b.time+.07}
   u.pendingStrike=null;
  }
  const target=b.enemies.filter(e=>e.hp>0&&e.lane===u.lane&&e.x>=u.x-.015).sort((a,c)=>a.x-c.x)[0];
  if(target&&target.x-u.x<=d.range){
   if(target.boss&&!b.duelSeen&&stage.duelHero===u.key&&target.x-u.x<=.14){
    b.duelSeen=true;b.duel={heroId:u.id,bossId:target.id,heroKey:u.key,bossName:target.name,remaining:DUEL_DURATION,elapsed:0,nextBeat:0,startHp:target.hp};return;
   }
   if(b.time-u.lastAttack>=d.rate&&!u.pendingCleave&&b.time-(u.swingStartedAt??-100)>=SWING.duration){
    u.lastAttack=b.time;const damage=d.damage*(b.time<(b.oathBuffUntil||0)?1.2:1)*(target.shielded&&u.key==='archer'?.5:1);
    if(u.key==='archer'){u.flash=.32;effect(b,'arrow',u.lane,u.x,target.x);target.hp-=damage;target.flash=.2}
    else {u.swingStartedAt=b.time;u.pendingStrike={targetId:target.id,impactAt:b.time+SWING.impact,damage}}
   }
  }else{
   u.action=b.time-(u.swingStartedAt??-100)<SWING.duration?'guarding':'marching';const priority={archer:0,liubei:1,guanyu:2,zhangfei:3};
   const ahead=b.allies.filter(a=>a.hp>0&&a.id!==u.id&&a.lane===u.lane&&a.x>u.x+.001&&priority[a.key]>=priority[u.key]).sort((a,c)=>a.x-c.x)[0];
   const limit=ahead?Math.max(u.x,ahead.x-.065):.84;
   if(u.order==='hold')u.action='holding';
   else if(u.action==='marching'){u.x=Math.min(u.order==='forward'?u.targetX:.84,limit,u.x+d.speed*dt);if(u.order==='forward'&&u.x>=u.targetX-.0001){u.order='hold';u.action='holding'}}
   if(u.x>=.839)u.action='holding';
  }
  const nearby=b.enemies.filter(e=>e.hp>0&&e.lane===u.lane&&e.x>=u.x-.02&&e.x-u.x<=.23);
  if(u.key==='zhangfei'&&b.level>=UNLOCKS.roar&&nearby.length&&b.time-(u.lastSkill||0)>=8){
   u.lastSkill=b.time;for(const e of nearby){e.hp-=16;e.stunnedUntil=b.time+1.1;if(!e.boss)e.x=Math.min(.95,e.x+.065)}effect(b,'roar',u.lane,u.x);b.skillNotice={key:u.key,text:'張飛・燕人怒吼',until:b.time+1.5};
  }
  if(u.key==='guanyu'&&b.level>=UNLOCKS.cleave&&nearby.length&&b.time-(u.lastSkill||0)>=7){
   u.lastSkill=b.time;if(!u.pendingStrike)u.swingStartedAt=b.time;u.pendingCleave={ids:nearby.map(e=>e.id),impactAt:u.pendingStrike?.impactAt??b.time+SWING.impact};
  }
  if(d.heal&&b.level>=UNLOCKS.healing&&b.time-u.lastHeal>=3){u.lastHeal=b.time;for(const ally of b.allies)if(ally.hp>0&&ally.lane===u.lane){if(ally.hp<ally.maxHp){effect(b,'heal',ally.lane,ally.x);b.skillNotice={key:'liubei',text:'劉備・仁德回春',until:b.time+1.8};}ally.hp=Math.min(ally.maxHp,ally.hp+d.heal)}}
 }
 for(const e of b.enemies){
  if(e.hp<=0)continue;e.action='guarding';e.flash=Math.max(0,e.flash-dt);if(b.time<(e.stunnedUntil||0)){e.action='stunned';continue}
  const target=b.allies.filter(u=>u.hp>0&&u.lane===e.lane&&u.x<=e.x+.015).sort((a,c)=>c.x-a.x)[0];
  if(e.boss){
   if(e.castAt&&b.time>=e.castAt){
    for(const u of b.allies)if(u.hp>0&&u.lane===e.lane&&Math.abs(u.x-e.x)<.24){u.hp-=b.level===1?8:22+b.level;u.flash=.3;}
    effect(b,'roar',e.lane,e.x);e.castAt=null;e.nextSkill=b.time+9;
    b.skillNotice={key:'enemy',text:`${e.name}・${BOSS_SKILLS[b.level-1]}`,until:b.time+1.5};
   }
   if(!e.castAt&&target&&e.x-target.x<.24&&b.time>=(e.nextSkill||0)){e.castAt=b.time+1.8;b.notice=`${e.name}蓄力：${BOSS_SKILLS[b.level-1]}！可換路閃避`;b.noticeUntil=e.castAt;}
   if(e.castAt){e.action='casting';continue}
  }
  if(target&&e.x-target.x<=.075){if(b.time-e.lastAttack>=e.rate){e.lastAttack=b.time;e.flash=.32;effect(b,'enemy-slash',e.lane,e.x,target.x);target.hp-=e.damage;target.flash=.2}}
  else {e.action='marching';e.x-=e.speed*dt;}
  if(e.x<.025){e.hp=0;e.escaped=true;effect(b,'breach',e.lane,.025,-.12,{enemy:true,boss:e.boss});b.lives--;b.notice='敵軍突破！留意另外兩路。';b.noticeUntil=b.time+3}
 }
 if(b.level>=UNLOCKS.oath&&!b.oathUsed&&['liubei','guanyu','zhangfei'].every(key=>b.allies.some(u=>u.key===key&&u.hp>0))){b.oathUsed=true;b.oathBuffUntil=b.time+5;for(const ally of b.allies)if(ally.hp>0){ally.hp=Math.min(ally.maxHp,ally.hp+55);effect(b,'oath',ally.lane,ally.x)}b.skillNotice={key:'liubei',text:'合擊・桃園同心',until:b.time+2.2};b.notice='桃園同心！全軍回復，五秒內攻擊提升。';b.noticeUntil=b.time+5}
 for(const unit of [...b.allies,...b.enemies])if(unit.hp<=0&&!unit.escaped){effect(b,'defeat',unit.lane,unit.x,unit.x,{key:unit.key||null,enemy:!unit.key,boss:!!unit.boss});if(unit.key&&unit.key!=='archer')b.cooldowns[unit.key]=b.time+12}
 b.allies=b.allies.filter(u=>u.hp>0);b.enemies=b.enemies.filter(u=>u.hp>0);
 if(b.lives<=0){b.over=true;b.won=false}
 else if(b.bossSpawned&&!b.enemies.length){b.over=true;b.won=true}
}
