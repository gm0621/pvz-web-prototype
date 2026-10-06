function normalizeSeason2Side(raw){const completedLevels={};let highestLevel=0;for(let n=1;n<=10;n++){if(!(Number(raw?.completedLevels?.[n])>0))break;completedLevels[n]=1;highestLevel=n}return {highestLevel,completedLevels}}
function buildSeason2LevelCards(){
 const wrap=$('levelGrid');wrap.replaceChildren();
 SEASON2_PLAN.stages.forEach(stage=>{
  const done=isCampaignLevelCompleted(currentFaction,stage.number,2),open=isCampaignLevelUnlocked(currentFaction,stage.number,2);
  const card=document.createElement('article');card.className=`level-card campaign-card season2-level ${done?'completed':open?'current':'locked'}`;
  card.innerHTML=`<div class="level-ribbon"><span>第 ${stage.number} 關</span><strong>${stage.name}</strong></div><div class="level-art" style="background-image:url('${stage.cardArt}')"></div><p>${stage[currentFaction==='plants'?'defense':'attack'].story}</p><div class="level-meta">難度：${SEASON2_LEVELS[stage.number].difficulty}｜${done?'✅ 已通關，可用新角色重玩':open?'已開放':`先完成第 ${stage.number-1} 關`}</div><button class="level-start" data-jump-level="${stage.number}" ${open?'':'disabled'}>${open?(done?`重玩第${levelLabel(stage.number)}關`:`開始第${levelLabel(stage.number)}關`):'🔒 尚未解鎖'}</button>`;
  card.querySelector('button').onclick=()=>startLevel(currentFaction,stage.number);appendStoryReplayButton(card,currentFaction,stage.number);wrap.append(card);
 });
}
function applySeasonBattleTheme(){
 $('game').classList.toggle('season2-battle',state?.season===2);
 $('levelScreen').classList.toggle('season2-select',currentSeason===2);
}
function processSeason2PendingHits(){
 if(!state?.pendingHits?.length)return;
 const waiting=[];
 for(const hit of state.pendingHits){
  if(hit.at>state.time){waiting.push(hit);continue}
  const source=state.plants.find(unit=>unit.id===hit.sourceId&&unit.hp>0);
  const target=state.zombies.find(unit=>unit.id===hit.targetId&&unit.hp>0);
  if(!source||!target)continue;
  if(hit.projectile){state.projectiles.push({x:source.c+.72,y:source.r+.5,r:source.r,dir:1,damage:hit.damage,from:'plant',speed:.11,targetId:target.id});sfx('shoot');continue}
  target.hp-=hit.damage;attackFx(target,hit.fx||'slash');sfx('hit');flash(target,'重刀命中');
 }
 state.pendingHits=waiting;
}
function advanceSeason2Shield(p,d){
 p.braced=true;
 const enemy=state.zombies.filter(z=>z.hp>0&&z.r===p.r&&z.c>p.c).sort((a,b)=>a.c-b.c)[0];
 if(!enemy)return false;
 const stopAt=enemy.c-(d.range||.8),lastHop=p.lastHopAt??p.bornAt;
 if(stopAt<=p.c+.05||state.time-lastHop<d.hopRate)return false;
 p.c=Math.min(stopAt,p.c+d.hopDistance);p.lastHopAt=state.time;p.hopUntil=state.time+d.hopDuration;p.movementKind='hop';p.movementAt=state.time;
 return true;
}
function actSeason2Plants(){
 for(const p of state.plants){
  if(p.hp<=0)continue;const d=activeUnit('plants',p.type);if(!d)continue;
  if(p.type==='s2Shield'){advanceSeason2Shield(p,d);continue}
  const target=state.zombies.filter(z=>z.hp>0&&z.r===p.r&&z.c>p.c&&z.c-p.c<=(d.range||1)).sort((a,b)=>a.c-b.c)[0];
  if(p.type==='s2Tuntian'&&state.time-p.last>=d.rate){const safe=state.time-(p.lastDamagedAt??p.bornAt)>=8000,gain=d.produce+(safe?15:0);p.last=state.time;if(state.faction==='plants')state.resource+=gain;else state.aiResource+=gain;flash(p,`🌾 +${gain}`);continue}
  if(p.type==='s2Halberd'){const incoming=state.zombies.find(z=>z.hp>0&&!z.boss&&z.r===p.r&&z.c>=p.c&&z.c-p.c<=d.range&&['dash','jump'].includes(z.movementKind)&&state.time-z.movementAt<=100&&z.previousC-z.c>=.4);if(incoming&&state.time-(p.lastIntercept??-6000)>=6000){p.lastIntercept=state.time;incoming.hp-=55;incoming.movementKind=null;incoming.c=Math.max(incoming.c,p.c+.8);flash(p,'拒馬列戟')}}
  if(!target||state.time-p.last<d.rate)continue;
  p.last=state.time;markAttack(p);let damage=d.damage;
  if(p.type==='s2Crossbow'){p.focusStacks=p.focusId===target.id?Math.min(3,(p.focusStacks||0)+1):0;p.focusId=target.id;damage=Math.round(damage*(1+.2*p.focusStacks))}
  if(p.type==='s2Xiahou'&&(p.rage||0)>=100){damage+=60;p.rage=0;p.unyieldingUntil=state.time+2500;flash(p,'獨目修羅')}
  if(p.type==='s2XuHuang'){p.armorStacks=p.armorTarget===target.id?Math.min(3,(p.armorStacks||0)+1):0;p.armorTarget=target.id;damage=Math.round(damage*(1+p.armorStacks*.18))}
  if(p.type==='s2SimaYi')damage=Math.round(damage*(1+Math.min(.6,(state.time-p.bornAt)/45000*.6)));
  if(p.type==='s2ZhangLiao'){target.breakMarkedUntil=state.time+5000;flash(target,'破陣標記')}
  if(d.attackHitAt){state.pendingHits=state.pendingHits||[];state.pendingHits.push({sourceId:p.id,targetId:target.id,damage,at:state.time+d.attackHitAt,fx:'slash',projectile:(d.range||0)>2})}
  else if((d.range||0)>2){state.projectiles.push({x:p.c+.72,y:p.r+.5,r:p.r,dir:1,damage,from:'plant',speed:.11,targetId:target.id});sfx('shoot')}
  else{target.hp-=damage;attackFx(target,'slash');sfx('hit')}
 }
}
function damageSeason2Plant(p,amount,melee=false){
 if(p.hp<=0)return;let damage=amount;
 if(melee){if(p.type!=='s2Shield'){p.braced=false;p.lastCombatAt=state.time}if(p.boneMarks>0&&state.time<(p.boneExpires||0)){p.boneMarks--;damage+=20;flash(p,'骨釘引爆')}}
 if(p.type==='s2Shield'){const d=PLANT_TYPES.s2Shield,reduction=state.time<(p.armorWeakenedUntil||0)?d.weakenedDamageReduction:d.damageReduction;damage*=1-reduction}
 if(p.unyieldingUntil&&state.time<p.unyieldingUntil)damage*=.7;
 const guard=p.type!=='s2DianWei'&&state.plants.find(g=>g.hp>0&&g.type==='s2DianWei'&&g.r===p.r&&g.c<p.c&&p.c-g.c<=1.2);
 if(guard){const shared=Math.min(damage*.35,guard.hp-1);guard.hp-=shared;damage-=shared;flash(guard,'帳前死衛')}
 p.lastDamagedAt=state.time;p.hp-=damage;if(p.type==='s2Xiahou')p.rage=Math.min(100,(p.rage||0)+damage*.8);attackFx(p,'slash');
 if(p.hp<=0){if(state.faction==='zombies')state.resource+=50;else state.aiResource+=50}
}
function season2CleaverHit(z,p,d){
 const protectedTarget=(p.shieldHp||0)>0||p.type==='s2Shield';
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
  if(z.hp<=0)continue;const d=activeUnit('zombies',z.type);if(!d)continue;z.previousC=z.c;
  if(z.type==='s2Medic'&&state.time-(z.lastHeal||0)>=5000){const ally=state.zombies.filter(a=>a!==z&&a.type!=='s2Medic'&&a.hp>0&&a.r===z.r&&a.hp<a.maxHp&&Math.abs(a.c-z.c)<2.2).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(ally){z.lastHeal=state.time;ally.hp=Math.min(ally.maxHp,ally.hp+55);flash(ally,'補肉 +55')}}
  const target=zombieEnteredBattlefield(z)?state.plants.filter(p=>p.hp>0&&p.r===z.r&&p.c<z.c&&z.c-p.c<=(d.range||.8)).sort((a,b)=>b.c-a.c)[0]:null;
  if(!target){if(z.type==='s2Ram')z.charge=Math.min(90,(z.charge||0)+.06);z.c-=(z.slowUntil&&state.time<z.slowUntil?d.speed*.5:d.speed);if(z.c<=.25){triggerMower(z.r);if(z.hp<=0)continue}if(z.c<0)return end(state.faction==='zombies',state.faction==='zombies'?'突破成功！':'防線被突破！',`${state.levelConfig.shortName}${state.faction==='zombies'?'攻破！':'失守，可調整陣形再試。'}`);continue}
  if(z.type==='s2Hook'&&state.time-(z.lastHook||0)>=8000){const occupied=state.plants.some(p=>p.hp>0&&p.r===target.r&&Math.round(p.c)===Math.round(target.c+1));if(!occupied&&target.type!=='s2XuChu'){z.lastHook=state.time;target.c=Math.min(z.c-.8,target.c+1);target.slowUntil=state.time+2200;flash(target,'纏鏈拖行')}}
  if(state.time-z.last<d.rate)continue;z.last=state.time;markAttack(z);let damage=d.damage;
  if(z.type==='s2Rat'&&state.zombies.some(a=>a.hp>0&&a!==z&&a.r===z.r&&Math.abs(a.c-z.c)<1.5))damage=Math.round(damage*1.25);
  if(z.type==='s2Cleaver'){season2CleaverHit(z,target,d);continue}
  if(z.type==='s2Nail'){state.projectiles.push({x:z.c-.1,y:z.r+.5,r:z.r,dir:-1,damage,from:'zombie',speed:.085,targetId:target.id,nail:true,marks:1});sfx('shoot');continue}
  if(z.type==='s2Venom'){for(const p of state.plants.filter(p=>p.hp>0&&p.r===target.r&&Math.abs(p.c-target.c)<=1))damageSeason2Plant(p,damage,p===target);flash(target,'腐液殘留');continue}
  if(z.type==='s2Ram'&&(z.charge||0)>0){damage+=Math.round(z.charge);z.charge=0;flash(z,'蓄勢破門')}
  if(z.type==='s2Hexer'){target.buffBlockedUntil=state.time+4000;flash(target,'孤軍咒')}
  if(z.type==='s2Overseer'){for(const ally of state.zombies.filter(a=>a.hp>0&&a.r===z.r&&Math.abs(a.c-z.c)<2.5))ally.hasteUntil=state.time+3000;flash(z,'破陣號令')}
  damageSeason2Plant(target,damage,true);attackFx(target,'slash');sfx('hit');
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
 if((state.s2DefendersCreated||0)>=8+state.level)return null;
 const affordable=options.filter(([key,d])=>key!=='s2Tuntian'||state.plants.filter(p=>p.type==='s2Tuntian').length<3);
 if(!affordable.length)return null;const [key,d]=pick(affordable),r=[0,1,2,3,4].sort((a,b)=>laneZombiePressure(b)-laneZombiePressure(a))[0];
 const ranged=(d.range||0)>2||d.produce,cols=ranged?[0,1,2]:[3,4,2,1];for(const c of cols)if(!plantAtCell(r,c))return {key,d,r,c};return null;
}
function processSeason2AttackEvents(){
 if(state.bossSpawned||state.time<22000+state.level*1500)return;
 const row=state.zombies.filter(z=>z.hp>0).sort((a,b)=>a.c-b.c)[0]?.r??2,cell=[2,1,3,0,4].find(c=>!plantAtCell(row,c));if(cell===undefined)return;
 const leaderKey=SEASON2_UNIT_ORDER.plants[Math.min(11,state.level+1)];state.bossSpawned=true;addPlant(leaderKey,cell,row);const leader=state.plants[state.plants.length-1];leader.boss=true;leader.hp*=1.35;leader.maxHp=leader.hp;flash(leader,`${PLANT_TYPES[leaderKey].name}領軍`);log(`魏軍${PLANT_TYPES[leaderKey].name}進入戰線；觀察其技能，再調整攻城隊順序。`);
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
  button.querySelector('.season-status').textContent=!open?'🔒 完成第一季守城十關後解鎖':season===2?'十關已開放・逐關解鎖角色':'十關戰役・依通關進度逐關解鎖';
  const art=campaignLevels(season)[1].cardArt||'assets/backgrounds/main-menu-battle-bg.webp';button.style.backgroundImage=`linear-gradient(0deg,rgba(6,15,25,.95),rgba(6,15,25,.18)),url("${art}")`;
 });
 refreshResumeBattleUI();playSceneMusic('stageSelect');if(syncHistory)syncAppHistory('season');
}
function initSeason2Entry(){
 document.querySelectorAll('[data-season-choice]').forEach(button=>button.onclick=()=>chooseFaction(currentFaction,Number(button.dataset.seasonChoice)));
 $('characterRosterIntro').textContent='第二季 12 位魏國角色均已實裝｜屯田兵、強弩兵為初始角色，其餘依序通過第一至第十關解鎖。';
 $('zombieSeasonIntro').textContent='第二季 12 位僵屍角色均已實裝｜鼠牙群屍、腐釘弩屍為初始角色，其餘依序通過第一至第十關解鎖。';
 const query=new URLSearchParams(location.search);if(query.get('season')==='2'&&!(state?.season===2&&!state.over))chooseFaction(query.get('faction')==='zombies'?'zombies':'plants',2);
}

function renderSeason2UnlockReveal(faction,level){
 const rewardPanel=$('rewardPanel'),key=SEASON2_UNIT_ORDER[faction][level+1],unit=SEASON2_UNITS[faction][key],guide=season2GuideForCombat(faction,key);if(!rewardPanel||!unit)return;
 $('unlockReveal')?.remove();const reveal=document.createElement('section');reveal.id='unlockReveal';reveal.className=`unlock-reveal ${faction==='plants'?'wei-unlock':'zombie-unlock'}`;reveal.setAttribute('role','status');reveal.setAttribute('aria-live','polite');
 const skillName=guide?.talent||guide?.skill||'新戰力',skillText=`${guide?.effect||unit.desc}${guide?.skill?`\n機率技能・${guide.skill}：${guide.skillEffect}`:''}`;
 reveal.innerHTML=`<div class="unlock-rays" aria-hidden="true"></div><div class="unlock-sparks" aria-hidden="true">✦ ✧ ✦ ✧ ✦</div><p class="unlock-kicker">🎉 恭喜解鎖</p><div class="unlock-portrait"><img src="${unit.asset}" alt="${unit.name}"></div><div class="unlock-copy"><h3>${unit.name}</h3><p class="unlock-role">${guide?.role||'全新戰力'}｜已加入${faction==='plants'?'魏國軍陣':'屍軍攻城隊'}</p><div class="unlock-skill"><b>能力重點｜${skillName}</b><span>${skillText}</span></div><small>通過本模式後續關卡與重玩時可選用</small></div><div class="unlock-demo"><b>實戰能力示範</b><div class="unlock-demo-board" aria-label="${unit.name}攻擊方式與範圍示範"></div><p class="unlock-demo-status">正在準備示範…</p><div class="unlock-demo-actions"><button type="button" class="unlock-demo-replay">↺ 重播示範</button><button type="button" class="unlock-demo-detail">查看完整能力圖鑑</button></div></div>`;
 rewardPanel.before(reveal);requestAnimationFrame(()=>{reveal.classList.add('revealed');attachUnlockAbilityDemo(reveal,faction==='plants'?'wei':'zombie2',key)});sfx('reward');
}
