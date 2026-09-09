function normalizeSeason2Side(raw){const done=Number(raw?.completedLevels?.[1])>0;return {highestLevel:done?1:0,completedLevels:done?{1:1}:{}}}
function buildSeason2LevelCards(){
 const wrap=$('levelGrid');wrap.replaceChildren();
 SEASON2_PLAN.stages.forEach(stage=>{
  const done=isCampaignLevelCompleted(currentFaction,stage.number,2),open=stage.number===1;
  const card=document.createElement('article');card.className=`level-card campaign-card season2-level ${done?'completed':open?'current':'locked'}`;
  card.innerHTML=`<div class="level-ribbon"><span>第 ${stage.number} 關</span><strong>${stage.name}</strong></div><div class="level-art" style="background-image:url('${stage.cardArt}')"></div><p>${stage[currentFaction==='plants'?'defense':'attack'].story}</p><div class="level-meta">${done?'✅ 已通關，可用新角色重玩':open?'第一關已開放':'關卡預覽・尚未開放'}</div><button class="level-start" data-jump-level="${stage.number}" ${open?'':'disabled'}>${open?(done?'重玩第一關':'開始第一關'):'🔒 尚未開放'}</button>`;
  card.querySelector('button').onclick=()=>startLevel(currentFaction,stage.number);wrap.append(card);
 });
}
function applySeasonBattleTheme(){
 $('game').classList.toggle('season2-battle',state?.season===2);
 $('levelScreen').classList.toggle('season2-select',currentSeason===2);
}
function actSeason2Plants(){
 for(const p of state.plants){
  if(p.hp<=0)continue;const d=activeUnit('plants',p.type);
  const target=state.zombies.filter(z=>z.hp>0&&z.r===p.r&&z.c>p.c&&z.c-p.c<=d.range).sort((a,b)=>a.c-b.c)[0];
  if(p.type==='s2Tuntian'&&state.time-p.last>=d.rate){
   const safe=state.time-(p.lastDamagedAt??p.bornAt)>=8000,gain=d.produce+(safe?15:0);p.last=state.time;
   if(state.faction==='plants')state.resource+=gain;else state.aiResource+=gain;flash(p,`🌾 +${gain}`);
  }
  if(p.type==='s2Shield'){
   if(target)p.lastCombatAt=state.time;
   p.braced=state.time-(p.lastCombatAt??p.bornAt)>=4000;
   if(target&&state.time-p.last>=d.rate){p.last=state.time;markAttack(p);target.hp-=d.damage;attackFx(target,'slash')}
  }
  if(p.type==='s2Crossbow'){
   if(!target){p.focusId=null;p.focusStacks=0;continue}
   if(state.time-p.last<d.rate)continue;
   p.focusStacks=p.focusId===target.id?Math.min(3,(p.focusStacks||0)+1):0;p.focusId=target.id;p.last=state.time;
   markAttack(p);state.projectiles.push({x:p.c+.72,y:p.r+.5,r:p.r,dir:1,damage:Math.round(d.damage*(1+.2*p.focusStacks)),from:'plant',speed:.11,targetId:target.id});sfx('shoot');
  }
 }
}
function damageSeason2Plant(p,amount,melee=false){
 if(p.hp<=0)return;let damage=amount;
 if(melee){p.braced=false;p.lastCombatAt=state.time;if(p.boneMarks>0&&state.time<(p.boneExpires||0)){p.boneMarks--;damage+=20;flash(p,'骨釘引爆')}}
 if(p.type==='s2Shield'&&p.braced)damage*=.6;
 p.lastDamagedAt=state.time;p.hp-=damage;attackFx(p,'slash');
 if(p.hp<=0){if(state.faction==='zombies')state.resource+=50;else state.aiResource+=50}
}
function actSeason2Zombies(){
 for(const z of state.zombies){
  if(z.hp<=0)continue;const d=activeUnit('zombies',z.type);
  const target=state.plants.filter(p=>p.hp>0&&p.r===z.r&&p.c<=z.c&&z.c-p.c<=d.range).sort((a,b)=>b.c-a.c)[0];
  if(target){
   if(state.time-z.last>=d.rate){
    z.last=state.time;markAttack(z);
    if(z.type==='s2Nail'){
     const burst=Math.random()<.2;state.projectiles.push({x:z.c-.35,y:z.r+.5,r:z.r,dir:-1,damage:d.damage*(burst?2:1),from:'zombie',nail:true,marks:burst?2:1,speed:.09});if(burst)flash(z,'雙釘齊發');
    }else{
     const pack=z.type==='s2Rat'&&state.zombies.some(other=>other!==z&&other.hp>0&&other.type==='s2Rat'&&other.r===z.r&&other.c>=target.c&&other.c-target.c<=ZOMBIE_TYPES.s2Rat.range);
     damageSeason2Plant(target,d.damage*(pack?1.25:1),true);if(pack)flash(z,'群牙');
    }
   }
  }else{
   z.c-=d.speed;if(z.c<=.25){triggerMower(z.r);if(z.hp<=0)continue}
   if(z.c<0)return end(state.faction==='zombies',state.faction==='zombies'?'突破成功！':'防線被突破！',state.faction==='zombies'?'霜土前哨攻破！':'霜土前哨失守，可調整陣形再試。');
  }
 }
}
function moveSeason2Projectiles(){
 for(const pr of state.projectiles){
  if(pr.hit)continue;pr.x+=pr.dir*(pr.speed||.085);
  const targets=pr.from==='plant'?state.zombies:state.plants;
  const target=targets.filter(t=>t.hp>0&&t.r===pr.r&&Math.abs(t.c+.5-pr.x)<.19).sort((a,b)=>pr.from==='plant'?a.c-b.c:b.c-a.c)[0];
  if(!target)continue;pr.hit=true;
  if(pr.from==='plant'){
   const shield=state.zombies.filter(z=>z.hp>0&&z.type==='s2Coffin'&&(z.shieldHp??ZOMBIE_TYPES.s2Coffin.shieldHp)>0&&z.r===target.r&&z.c<=target.c&&target.c-z.c<=.9).sort((a,b)=>a.c-b.c)[0];
   let damage=pr.damage;if(shield){shield.shieldHp??=ZOMBIE_TYPES.s2Coffin.shieldHp;const absorbed=Math.min(shield.shieldHp,damage*.6);shield.shieldHp-=absorbed;damage-=absorbed;flash(shield,shield.shieldHp>0?'棺板掩護':'棺盾破裂')}
   target.hp-=damage;attackFx(target,'slash');
  }else{
   damageSeason2Plant(target,pr.damage);if(pr.nail&&target.hp>0){target.boneMarks=Math.min(2,(state.time<(target.boneExpires||0)?target.boneMarks||0:0)+(pr.marks||1));target.boneExpires=state.time+5000;flash(target,`骨釘 ${target.boneMarks}`)}
  }
 }
}
function season2DefenseChoice(options){
 if((state.s2DefendersCreated||0)>=6)return null;
 const soldiers=options.filter(([key])=>key==='s2Crossbow'||(key==='s2Tuntian'&&state.plants.filter(p=>p.type==='s2Tuntian').length<2));
 if(!soldiers.length)return null;const [key,d]=pick(soldiers);
 const rows=[0,1,2,3,4].sort((a,b)=>laneZombiePressure(b)-laneZombiePressure(a));
 for(const r of rows)for(const c of key==='s2Tuntian'?[0]:[1,2,3])if(!plantAtCell(r,c))return {key,d,r,c};
 return null;
}
function processSeason2AttackEvents(){
 if(state.bossSpawned||state.time<22000)return;
 const row=state.zombies.filter(z=>z.hp>0).sort((a,b)=>a.c-b.c)[0]?.r??2;
 const cell=[2,1,3,0].find(c=>!plantAtCell(row,c));if(cell===undefined)return;
 state.bossSpawned=true;addPlant('s2Shield',cell,row);const leader=state.plants[state.plants.length-1];leader.boss=true;flash(leader,'大盾領隊');log('魏軍大盾領隊進入戰線；先留骨釘，再讓群屍近身破盾。');
}
function initSeason2Entry(){
 bind('season2DefenseBtn',()=>chooseFaction('plants',2));bind('season2AttackBtn',()=>chooseFaction('zombies',2));
 $('characterRosterIntro').textContent='第二季預告與開放狀態｜屯田兵、強弩兵可從第一關出戰，大盾兵為守城第一關獎勵；其他魏國角色尚未開放出戰。';
 $('zombieSeasonIntro').textContent='第二季 12 位角色預告與開放狀態｜鼠牙群屍、腐釘弩屍可從第一關出戰，棺盾小屍為進攻第一關獎勵；其餘角色尚未開放出戰。';
 const query=new URLSearchParams(location.search);if(query.get('season')==='2'&&!(state?.season===2&&!state.over))chooseFaction(query.get('faction')==='zombies'?'zombies':'plants',2);
}
