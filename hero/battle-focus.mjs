import {mountMissionQuick} from './mission-quick.mjs?v=chapter-twenty-four-1';
import {ARMY_STYLE,TACTICS,SIGNATURES,doctrine,useTactic} from './army-doctrine.mjs?v=army-1';
export function mountBattleFocus({getBattle,getSelected,toggleAutoSkill}){
 const $=id=>document.getElementById(id),battle=$('battle'),field=$('field');
 const create=(tag,id,text)=>{const e=document.createElement(tag);if(id)e.id=id;if(text)e.textContent=text;return e};
 const top=battle.querySelector('.battle-top'),home=top.querySelector('[data-home]');home.textContent='主選單';home.style.minWidth='0';
 const dock=create('div','battleDock'),bar=create('div','commandBar');battle.append(dock);
 const picker=$('unitPicker');picker.firstChild.textContent='';bar.append(picker);
 const buttons={};
 function button(id,text,parent){const e=create('button',id,text);e.type='button';e.className='quiet-button';parent.append(e);return e}
 const auto=button('autoSkillButton','自動技：關',bar);auto.setAttribute('aria-pressed','false');auto.title='F：目前選取武將自動施放技能';auto.onclick=toggleAutoSkill;
 const panels=create('div','battlePanels');battle.append(panels);let current=null;
 function close(){if(current){current.panel.hidden=true;current.button.setAttribute('aria-expanded','false');current=null}}
 function drawer(id,title,triggerParent){
  const trigger=button(id+'Button',title,triggerParent),panel=create('section',id);panel.hidden=true;panel.className='battle-drawer';panel.setAttribute('aria-label',title);trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',id);
  const header=create('header'),heading=create('strong',null,title);header.append(heading);const dismiss=button(id+'Close','收起 ✕',header);panel.append(header);panels.append(panel);
  trigger.onclick=()=>{const was=current?.panel===panel;close();if(!was){panel.hidden=false;trigger.setAttribute('aria-expanded','true');current={panel,button:trigger}}};dismiss.onclick=()=>{close();(trigger.getClientRects().length?trigger:buttons.battleMenu).focus({preventScroll:true})};buttons[id]=trigger;return panel;
 }
 const orders=drawer('commandDrawer','調動',bar);orders.append($('orders'));
 // Desktop mouse commands mirror the original validated orders; keyboard and
 // touch continue to use that same selection and engine path.
 const quick=create('div','quickOrders');quick.setAttribute('aria-label','滑鼠部隊調動');quick.hidden=true;
 const quickButtons=[...$('orders').querySelectorAll('button')].map(source=>{
  const proxy=button('',source.textContent,quick);proxy.dataset.quickOrder=source.dataset.order;
  proxy.onclick=()=>source.click();return {source,proxy};
 });
 const details=button('selectedDetails','詳情',bar);details.onclick=()=>{close();$('skillGuideButton').click()};
 const mission=drawer('missionDrawer','任務',top),menu=drawer('battleMenu','更多',top);
 const updateMissionQuick=mountMissionQuick(field,()=>{if(current?.panel!==mission)buttons.missionDrawer.click()});
 const tactics=drawer('tacticDrawer','戰術（T）',menu),style=create('p'),signatureText=create('p'),meter=create('p');tactics.append(style,signatureText,meter);
 const tacticButtons=TACTICS.map(spec=>{const e=button('tactic-'+spec.id,spec.name+' · '+spec.cost,tactics);e.title=spec.text;e.onclick=()=>{const b=getBattle(),u=getSelected();if(useTactic(b,spec.id,u?.lane))close()};tactics.append(create('p',null,spec.text));return e});
 menu.append($('battleMapButton'),$('supplies'),$('skillGuideButton'),$('battleKeyHint'));
 const sound=create('div');for(const source of document.querySelectorAll('.site-bar button')){if(source.id==='soundTest')continue;const proxy=button('',source.textContent,sound);proxy.onclick=()=>source.click();proxy.dataset.soundSource=source.id||'sfx'}menu.append(sound);
 const explanation=create('p',null,'點場上武將或使用友軍選單，技能與調動會切換到同一人。自動技能預設關閉，開啟後依 MP、冷卻及目標狀況施放；本場有效。任務與調動面板不會暫停戰鬥，可隨時收起。');menu.append(explanation);const tutorial=button('showBattleGuide','操作教學',menu);tutorial.onclick=()=>{close();const guide=$('firstGuide');guide.hidden=false;guide.classList.remove('guide-quiet');guide.dataset.step='manual';guide.dataset.lastStep='manual';guide.dataset.shownAt=String(getBattle()?.time||0);$('guideTitle').textContent='選將 → 點地移動 → 按技能';$('guideText').textContent='點兵卡再點路線出兵。點場上友軍調動，普通攻擊自動進行；長篇說明在「詳情」。';$('guideDismiss').textContent='知道了'};
 dock.append(bar,quick,$('activeSkills'),$('cards'));
 field.append($('bossHud'),$('firstGuide'),$('commandFeedback'));
 const toast=create('p','battleToast');toast.setAttribute('role','status');toast.hidden=true;field.append(toast);
 // All frequently used controls stay on the stage; informational copy is on demand.
 $('battleNotice').hidden=true;battle.querySelector('.deploy-caption').hidden=true;
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current&&!document.querySelector('dialog[open]')){const trigger=current.button;close();(trigger.getClientRects().length?trigger:buttons.battleMenu).focus({preventScroll:true})}});
 document.addEventListener('keydown',e=>{if(e.code==='KeyT'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&!document.querySelector('dialog[open]')){const b=getBattle();if(b&&!b.over&&!b.duel&&!b.introPending&&document.body.classList.contains('battle-focus')){e.preventDefault();buttons.tacticDrawer.click()}}});
 let lastBattle=null,lastNotice='',noticeAt=0;
 return {close,update(b){
  if(b!==lastBattle){lastBattle=b;lastNotice='';$('firstGuide').dataset.lastStep='';close()}
  const u=getSelected(),army=doctrine(b);style.textContent=ARMY_STYLE[army.army].name+'｜'+ARMY_STYLE[army.army].text;signatureText.textContent=SIGNATURES[u?.heroId]||'選取武將後，可在其所在路使用戰術。';meter.textContent='軍勢 '+Math.floor(army.points)+'/100 · '+(b.time<army.ready?'冷卻 '+Math.ceil(army.ready-b.time)+' 秒':'可下令')+(army.traps.length?' · 伏兵待命':'')+(b.time<army.chargeUntil?' · 全軍突擊中':'');tacticButtons.forEach((e,i)=>e.disabled=!u||b.paused||b.over||!!b.duel||!!b.introPending||army.points<TACTICS[i].cost||b.time<army.ready);auto.hidden=!u?.heroId;auto.disabled=b.paused||b.over||!!b.duel||!!b.introPending;const enabled=!!b.autoSkills?.[u?.heroId];auto.textContent=enabled?'自動技：開':'自動技：關';auto.setAttribute('aria-pressed',String(enabled));details.hidden=!u?.heroId;buttons.commandDrawer.hidden=!u;
  quick.hidden=!u;for(const {source,proxy} of quickButtons){proxy.textContent=source.textContent;proxy.disabled=source.disabled;proxy.title=source.title}
  const option=$('unitSelect').selectedOptions[0];if(option&&u?.heroId){const r=b.heroResources[u.heroId];option.textContent=option.textContent.split(' · MP')[0]+' · MP '+Math.floor(r.mp)+'/60'}
  if(!u&&current?.panel===orders)close();
  const panel=$('chapterMission');if(panel&&panel.parentElement!==mission)mission.append(panel);
  updateMissionQuick(b);buttons.missionDrawer.hidden=!b.mission;if(b.mission)buttons.missionDrawer.title=$('missionObjective')?.textContent||'本關任務';
  for(const lane of $('lanes').children){let marker=lane.querySelector('.tactic-trap');const trap=army.traps.find(t=>t.lane===Number(lane.dataset.lane));if(trap){if(!marker){marker=create('span');marker.className='tactic-trap';lane.append(marker)}marker.textContent='伏';marker.style.left=(trap.x*100)+'%';marker.title='伏兵待命 '+Math.ceil(trap.until-b.time)+' 秒'}else marker?.remove()}
  const guide=$('firstGuide');if(guide&&!guide.hidden){if(guide.dataset.step!==guide.dataset.lastStep){guide.dataset.lastStep=guide.dataset.step;guide.dataset.shownAt=b.time}guide.classList.toggle('guide-quiet',b.time-Number(guide.dataset.shownAt)>7)}
  const text=b.time<b.noticeUntil?b.notice:'';if(text&&text!==lastNotice){lastNotice=text;noticeAt=b.time}if(!text)lastNotice='';toast.textContent=text;toast.hidden=!text||b.time-noticeAt>3||!!b.duel||!!b.introPending;
  if(b.duel||b.introPending||b.over)close();
  for(const proxy of sound.children){const source=proxy.dataset.soundSource==='sfx'?document.querySelector('.site-bar button:not([id])'):$(proxy.dataset.soundSource);if(source){proxy.textContent=source.textContent;proxy.setAttribute('aria-pressed',source.getAttribute('aria-pressed')||'false')}}
 }};
}
