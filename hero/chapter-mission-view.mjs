import {renderHistoryMission} from './history-missions.mjs?v=skill-tiers-1';
import {chooseMissionFlag,routeCivilians,missionText} from './chapter-missions.mjs?v=skill-tiers-1';
export function renderMission(b,refresh){
 let panel=document.getElementById('chapterMission'),scene=document.getElementById('missionScene');
 if(!panel){panel=document.createElement('section');panel.id='chapterMission';panel.className='chapter-mission';panel.setAttribute('aria-label','本關任務');panel.innerHTML='<strong id="missionObjective"></strong><div id="missionChoices"></div><small id="missionMessage" role="status"></small>';document.getElementById('field').before(panel);scene=document.createElement('div');scene.id='missionScene';scene.setAttribute('aria-hidden','true');scene.innerHTML='<div class="mission-fog"></div><div class="civilian-group"><svg viewBox="0 0 90 64"><g fill="#fff5d8" stroke="#654c30" stroke-width="2"><circle cx="25" cy="12" r="7"/><path d="M25 21l-12 25h24zM20 46l-5 14m16-14 5 14"/><circle cx="57" cy="14" r="7"/><path d="M57 23l-11 23h22zM52 46l-4 14m14-14 5 14"/><circle cx="41" cy="32" r="5"/><path d="M41 38l-7 15h14z"/></g></svg><span>鄉民隊伍</span></div>';document.getElementById('field').append(scene)}
 panel.hidden=!b.mission;scene.hidden=!b.mission;if(!b.mission)return;
 if(b.level>=17){renderHistoryMission(b,panel,scene,refresh);return}scene.querySelector('.history-decoy')?.setAttribute('hidden','');scene.querySelector('.civilian-group span').textContent='鄉民隊伍';
 const m=b.mission,locked=b.paused||b.over||!!b.duel||b.introPending;
 document.getElementById('missionObjective').textContent=missionText(b);document.getElementById('missionMessage').textContent=m.message;
 const choices=document.getElementById('missionChoices'),mode=m.needed?'flags':['escort','rescue'].includes(m.kind)?'route':'none';
 if(choices.dataset.mode!==mode){choices.dataset.mode=mode;choices.replaceChildren();if(mode!=='none')for(const [i,label] of (mode==='flags'?['☰ 天旗','☷ 地旗','☵ 水旗']:['護送走上路','護送走中路','護送走下路']).entries()){const button=document.createElement('button');button.type='button';button.dataset.choice=i;button.textContent=label;choices.append(button)}}
 for(const button of choices.children){const i=Number(button.dataset.choice);button.disabled=locked||(mode==='flags'?m.flags>=m.needed:m.rescued>=3||b.time<m.routeReadyAt);button.setAttribute('aria-pressed',String(mode==='route'&&m.lane===i));button.onclick=()=>{if(mode==='flags')chooseMissionFlag(b,i);else routeCivilians(b,i);refresh()}}
 scene.querySelector('.mission-fog').style.opacity=m.needed?String(.45*(1-m.flags/m.needed)):'0';
 const civilians=scene.querySelector('.civilian-group');civilians.hidden=!['escort','rescue'].includes(m.kind)||m.rescued>=3;civilians.style.left=`${18+m.travel*65}%`;civilians.style.top=`${(m.lane+.75)/3*100}%`;
 scene.dataset.warning=m.weather?.type||'';
}
