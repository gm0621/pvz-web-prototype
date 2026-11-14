import {teamPose} from './team-duel-beats.mjs?v=dispatch-score-1';
import {DUEL_ENTRANCE_DURATION} from './engine.mjs?v=dispatch-score-1';
import {hitSound} from './audio.mjs?v=dispatch-score-1';
export function renderTeamDuel(b){
 const $=id=>document.getElementById(id),d=b.duel,dialog=$('duelDialog');let root=$('teamDuel');
 if(!root){root=document.createElement('section');root.id='teamDuel';root.innerHTML=`<p class="team-rule">聯手交鋒 · 二打一｜未來也可能一打二</p><div class="team-vitals"></div><div class="team-arena" aria-label="關羽、張飛聯手對戰雷烈"><div class="team-trail team-green"></div><div class="team-trail team-gold"></div><div class="team-ring"></div><div class="team-fighter" data-fighter="guanyu" role="img" aria-label="關羽"></div><div class="team-fighter" data-fighter="zhangfei" role="img" aria-label="張飛"></div><div class="team-fighter team-enemy" data-fighter="enemy" role="img" aria-label="雷烈揮斧"></div><div class="team-axe-impact"></div><span class="team-seal">二 對 一</span></div><h3 class="team-move" role="status"></h3><p class="team-line"></p><small>聯手演出期間三路暫停 · 結束後兩將返回原位</small>`;dialog.querySelector('.duel-controls').before(root);
 for(const [key,name] of [['guanyu','關羽'],['zhangfei','張飛'],['enemy','雷烈']]){const card=document.createElement('div');card.innerHTML=`<strong>${name}</strong><div class="duel-health ${key==='enemy'?'':'ally-health'}" role="progressbar" aria-label="${name}生命" aria-valuemin="0"><i></i></div><small></small>`;card.dataset.health=key;root.querySelector('.team-vitals').append(card)}

 }
 root.hidden=false;$('duelCombat').hidden=true;$('duelVersus').hidden=true;
 const entrance=d.elapsed===0&&d.entranceElapsed<DUEL_ENTRANCE_DURATION,hadFocus=document.activeElement===$('duelEnter');
 $('duelEnter').hidden=!entrance;$('duelEnter').disabled=b.paused;if(!entrance&&hadFocus)$('duelPause').focus({preventScroll:true});
 dialog.dataset.phase='combat';root.dataset.entrance=String(entrance);dialog.dataset.beat='team';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,p=teamPose(d,reduced),beat=p.beat;
 root.dataset.move=entrance?'entrance':beat.side;
 const fighters={guanyu:b.allies.find(u=>u.id===d.heroId),zhangfei:b.allies.find(u=>u.id===d.partnerId),enemy:b.enemies.find(u=>u.id===d.bossId)};
 for(const key of Object.keys(fighters)){
  const unit=fighters[key],hp=Math.max(0,unit?.hp||0),max=unit?.maxHp||1,card=root.querySelector(`[data-health="${key}"]`),bar=card.querySelector('[role="progressbar"]');bar.setAttribute('aria-valuenow',String(Math.ceil(hp)));bar.setAttribute('aria-valuemax',String(max));bar.querySelector('i').style.width=`${hp/max*100}%`;card.querySelector('small').textContent=`${Math.ceil(hp)} / ${max}`;
  const pose=p[key],node=root.querySelector(`[data-fighter="${key}"]`);node.style.left=`${pose.x}%`;node.style.transform=`translate(-50%,${key==='enemy'?'22%':'0'}) scaleX(${pose.facing})${key==='enemy'&&pose.fallen?' rotate(75deg)':''}`;node.style.opacity=key==='enemy'&&pose.fallen?'.35':'1';
  if(key==='enemy'){node.style.backgroundImage="url('./assets/attacks/lei-lie.png')";node.style.backgroundPosition=`${pose.frame*50}% 0%`;node.dataset.frame=String(pose.frame)}else{node.style.backgroundImage=`url('./assets/attacks/${key}.png')`;node.style.backgroundPosition=`${pose.frame%3*50}% ${Math.floor(pose.frame/3)*100}%`;node.dataset.frame=pose.frame;}
  node.dataset.facing=pose.facing;
 }
 root.querySelector('.team-arena').style.transform=`translateX(${p.shake}px)`;
 root.style.setProperty('--team-hit',String(entrance?0:p.pulse));root.style.setProperty('--team-counter',String(p.counterPulse));
 root.querySelector('.team-green').style.opacity=String(!entrance&&['guanyu','both'].includes(beat.actor)?p.pulse:0);root.querySelector('.team-gold').style.opacity=String(!entrance&&['zhangfei','both'].includes(beat.actor)?p.pulse:0);
 root.querySelector('.team-move').textContent=entrance?'關羽 ＋ 張飛　迎戰雷烈':beat.text;
 root.querySelector('.team-line').textContent=entrance?'陣前交鋒不只一對一！兩將輪流進攻、互相掩護，最後施展聯手大招。':beat.line;
 $('duelPause').textContent=b.paused?'繼續單挑':'暫停單挑';
 if(!b.paused&&!entrance&&d.lastTeamSound!==beat.at){if(['hero','combo','block','enemy','finish'].includes(beat.side))void hitSound(beat.side==='combo'?'hero':beat.side);d.lastTeamSound=beat.at}
}
