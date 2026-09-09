function normalizeSeason2Side(raw){const completedLevels={};let highestLevel=0;for(let n=1;n<=2;n++){if(!(Number(raw?.completedLevels?.[n])>0))break;completedLevels[n]=1;highestLevel=n}return {highestLevel,completedLevels}}
function buildSeason2LevelCards(){
 const wrap=$('levelGrid');wrap.replaceChildren();
 SEASON2_PLAN.stages.forEach(stage=>{
  const done=isCampaignLevelCompleted(currentFaction,stage.number,2),open=isCampaignLevelUnlocked(currentFaction,stage.number,2);
  const card=document.createElement('article');card.className=`level-card campaign-card season2-level ${done?'completed':open?'current':'locked'}`;
  card.innerHTML=`<div class="level-ribbon"><span>第 ${stage.number} 關</span><strong>${stage.name}</strong></div><div class="level-art" style="background-image:url('${stage.cardArt}')"></div><p>${stage[currentFaction==='plants'?'defense':'attack'].story}</p><div class="level-meta">${done?'✅ 已通關，可用新角色重玩':open?'已開放':stage.number===2?'先完成本模式第一關':'關卡預覽・尚未開放'}</div><button class="level-start" data-jump-level="${stage.number}" ${open?'':'disabled'}>${open?(done?`重玩第${levelLabel(stage.number)}關`:`開始第${levelLabel(stage.number)}關`):'🔒 尚未開放'}</button>`;
  card.querySelector('button').onclick=()=>startLevel(currentFaction,stage.number);appendStoryReplayButton(card,currentFaction,stage.number);wrap.append(card);
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
  if(p.type==='s2Halberd'){
   const incoming=state.zombies.find(z=>z.hp>0&&!z.boss&&z.r===p.r&&z.c>=p.c&&z.c-p.c<=d.range&&['dash','jump'].includes(z.movementKind)&&state.time-z.movementAt<=100&&z.previousC-z.c>=.4);
   if(incoming&&state.time-(p.lastIntercept??-6000)>=6000){p.lastIntercept=state.time;incoming.hp-=55;incoming.movementKind=null;incoming.dashUntil=0;incoming.c=Math.max(incoming.c,p.c+.8);flash(p,'拒馬列戟');attackFx(incoming,'slash')}
   if(target&&target.hp>0&&state.time-p.last>=d.rate){p.last=state.time;target.hp-=d.damage;markAttack(p);attackFx(target,'slash')}
  }
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
 if(p.type==='s2Shield'&&p.braced)damage*=state.time<(p.armorWeakenedUntil||0)?.85:.6;
 p.lastDamagedAt=state.time;p.hp-=damage;attackFx(p,'slash');
 if(p.hp<=0){if(state.faction==='zombies')state.resource+=50;else state.aiResource+=50}
}
function season2CleaverHit(z,p,d){
 const protectedTarget=(p.shieldHp||0)>0||p.type==='s2Shield'&&p.braced;
 const heavy=protectedTarget&&Math.random()<.2;
 if(p.type==='s2Shield'){
  z.armorHits=z.armorTarget===p.id&&state.time-(z.armorHitAt||0)<=4000?(z.armorHits||0)+1:1;
  z.armorTarget=p.id;z.armorHitAt=state.time;
  if(z.armorHits>=2||heavy){p.armorWeakenedUntil=state.time+8000;flash(p,'列盾削弱')}
 }
 let damage=d.damage;
 if((p.shieldHp||0)>0){const shieldDamage=damage*(heavy?3:2),absorbed=Math.min(p.shieldHp,shieldDamage);p.shieldHp-=absorbed;damage*=1-absorbed/shieldDamage}
 else if(heavy)damage+=d.damage;
 if(heavy)flash(z,'斷盾重劈');damageSeason2Plant(p,damage,true);
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
    }else if(z.type==='s2Cleaver'){season2CleaverHit(z,target,d)}else{
     const pack=z.type==='s2Rat'&&state.zombies.some(other=>other!==z&&other.hp>0&&other.type==='s2Rat'&&other.r===z.r&&other.c>=target.c&&other.c-target.c<=ZOMBIE_TYPES.s2Rat.range);
     damageSeason2Plant(target,d.damage*(pack?1.25:1),true);if(pack)flash(z,'群牙');
    }
   }
  }else{
   z.previousC=z.c;z.c-=d.speed;if(z.c<=.25){triggerMower(z.r);if(z.hp<=0)continue}
   if(z.c<0)return end(state.faction==='zombies',state.faction==='zombies'?'突破成功！':'防線被突破！',`${state.levelConfig.shortName}${state.faction==='zombies'?'攻破！':'失守，可調整陣形再試。'}`);
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
 if((state.s2DefendersCreated||0)>=(state.level===2?8:6))return null;
 const soldiers=options.filter(([key])=>key==='s2Crossbow'||(key==='s2Shield'&&state.level===2&&state.time>18000&&state.plants.filter(p=>p.type==='s2Shield').length<2)||(key==='s2Tuntian'&&state.plants.filter(p=>p.type==='s2Tuntian').length<2));
 if(!soldiers.length)return null;const [key,d]=pick(soldiers);
 const rows=[0,1,2,3,4].sort((a,b)=>laneZombiePressure(b)-laneZombiePressure(a));
 for(const r of rows)for(const c of key==='s2Tuntian'?[0]:key==='s2Shield'?[3,4]:[1,2,3])if(!plantAtCell(r,c))return {key,d,r,c};
 return null;
}
function processSeason2AttackEvents(){
 if(state.bossSpawned||state.time<22000)return;
 const row=state.zombies.filter(z=>z.hp>0).sort((a,b)=>a.c-b.c)[0]?.r??2;
 const cell=[2,1,3,0].find(c=>!plantAtCell(row,c));if(cell===undefined)return;
 state.bossSpawned=true;addPlant('s2Shield',cell,row);const leader=state.plants[state.plants.length-1];leader.boss=true;flash(leader,'大盾領隊');log('魏軍大盾領隊進入戰線；先留骨釘，再讓群屍近身破盾。');
}
function setSeasonPickerVisible(visible){
 $('seasonPicker').classList.toggle('hidden',!visible);$('levelGrid').classList.toggle('hidden',visible);
 $('campaignHeading').textContent=visible?'選擇季度':'選擇關卡';
 $('backFactionBtn').setAttribute('aria-label',visible?'回陣營選擇':'回季度選擇');
}
function showSeasonPicker(faction,syncHistory=true){
 if(!['plants','zombies'].includes(faction))return;
 backToHome(false);currentFaction=faction;$('start').classList.remove('active');$('levelScreen').classList.add('active');$('levelScreen').classList.remove('season2-select');
 setSeasonPickerVisible(true);$('chosenFactionText').textContent=`${faction==='plants'?'守城方':'攻城方'}｜選擇第一季或第二季，各季進度分開保存。`;
 document.querySelectorAll('[data-season-choice]').forEach(button=>{
  const season=Number(button.dataset.seasonChoice),open=isCampaignFactionUnlocked(faction,season);
  button.disabled=!open;
  button.querySelector('.season-status').textContent=!open?'🔒 完成第一季守城十關後解鎖':season===2?'第一、二關已開放・第三～十關預覽':'十關戰役・依通關進度逐關解鎖';
  const art=campaignLevels(season)[1].cardArt||'assets/backgrounds/main-menu-battle-bg.webp';button.style.backgroundImage=`linear-gradient(0deg,rgba(6,15,25,.95),rgba(6,15,25,.18)),url("${art}")`;
 });
 refreshResumeBattleUI();playSceneMusic('stageSelect');if(syncHistory)syncAppHistory('season');
}
function initSeason2Entry(){
 document.querySelectorAll('[data-season-choice]').forEach(button=>button.onclick=()=>chooseFaction(currentFaction,Number(button.dataset.seasonChoice)));
 $('characterRosterIntro').textContent='第二季預告與開放狀態｜屯田兵、強弩兵可從第一關出戰，大盾兵為守城第一關獎勵、長戟兵為第二關獎勵；其他魏國角色尚未開放出戰。';
 $('zombieSeasonIntro').textContent='第二季 12 位角色預告與開放狀態｜鼠牙群屍、腐釘弩屍可從第一關出戰，棺盾小屍為進攻第一關獎勵、裂盾斧屍為第二關獎勵；其餘角色尚未開放出戰。';
 const query=new URLSearchParams(location.search);if(query.get('season')==='2'&&!(state?.season===2&&!state.over))chooseFaction(query.get('faction')==='zombies'?'zombies':'plants',2);
}
