'use strict';
// Standalone read-only preview: deliberately no app, cloud, battle or storage dependencies.
function season2Roster(mode){return mode==='defense'?WEI_GUIDE:mode==='attack'?ZOMBIE_SEASON2_GUIDE:[]}
function season2Available(mode,level){
  if(!['defense','attack'].includes(mode)||!Number.isInteger(level)||level<1||level>10)return [];
  return [...SEASON2_PLAN.initial[mode],...SEASON2_PLAN.rewards[mode].slice(0,level-1)];
}
function planText(tag,text,className){const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el}
function planCharacter(mode,key){return season2Roster(mode).find(d=>d.key===key)}
function planUnitChip(mode,key){
  const d=planCharacter(mode,key),el=planText('div','','unit-chip'),img=document.createElement('img');
  img.src=d.asset;img.alt=d.name;img.width=72;img.height=72;
  const text=planText('div','');text.append(planText('strong',d.name),planText('small',d.role));el.append(img,text);return el;
}
function season2SceneArt(stage){
  const art=planText('div','','scene-art');art.style.setProperty('--scene-accent',stage.hue);
  const placeholder=planText('div','','scene-placeholder');
  placeholder.append(planText('span','北境場景 · 圖片待提供','scene-placeholder-label'),planText('span',stage.light,'scene-light'));
  art.append(placeholder);
  if(stage.cardArt){
    const img=document.createElement('img');img.alt=stage.name+'場景';
    img.onload=()=>{placeholder.hidden=true};
    img.onerror=()=>{img.remove();placeholder.hidden=false};
    img.src=stage.cardArt;art.append(img);
  }
  return art;
}
function planRosterNames(mode,keys,className){
  const el=planText('div','',className);
  keys.forEach(key=>el.append(planText('span',planCharacter(mode,key).name,'unit-name')));
  return el;
}
function planStageCard(stage,mode){
  const challenge=stage[mode],opponent=mode==='defense'?'attack':'defense',modeLabel=mode==='defense'?'守城':'進攻';
  const card=planText('article','','stage-plan');card.dataset.stage=String(stage.number);
  const art=season2SceneArt(stage);art.append(planText('span',`第 ${stage.number} 關`,'stage-number'),planText('span',stage.region,'stage-region'));card.append(art);
  const body=planText('div','','stage-body');body.append(planText('h3',stage.name),planText('p',challenge.story,'stage-story'));
  const focus=planText('p','','stage-focus');focus.append(planText('strong','本關重點'),planText('span',challenge.focus));body.append(focus);
  const rewardKey=SEASON2_PLAN.rewards[mode][stage.number-1],reward=planCharacter(mode,rewardKey);
  const rewardBox=planText('div','','stage-reward'),img=document.createElement('img');img.src=reward.asset;img.alt=reward.name;img.width=76;img.height=76;
  const rewardText=planText('div','');rewardText.append(planText('small',`通過本關後解鎖 · ${stage.number===10?'全破獎勵':'預定'}`),planText('strong',reward.name,'reward-name'),planText('span',reward.role));rewardBox.append(img,rewardText);body.append(rewardBox);
  const details=document.createElement('details'),summary=planText('summary','查看配置與製圖說明');details.append(summary);
  const content=planText('div','','stage-details');
  content.append(planText('h4','首次挑戰可用角色（預定）'),planRosterNames(mode,season2Available(mode,stage.number),'available-roster'));
  content.append(planText('h4',mode==='defense'?'主要敵軍':'主要魏國守軍'),planRosterNames(opponent,challenge.enemies,'enemy-roster'));
  content.append(planText('p',`${stage.number===10?'最終頭目':'末段領隊'}：${planCharacter(opponent,challenge.leader).name}`,'leader-note'));
  content.append(planText('h4','配置限制與解法'),planText('p',challenge.counter));
  content.append(planText('h4','選關圖片製作說明'),planText('p',stage.artBrief,'art-brief'),planText('small',`建議檔名：s2-${String(stage.number).padStart(2,'0')}.webp｜16:9 橫圖；不加標題、按鈕或大頭角色。`,'art-file'));
  content.append(planText('p',stage.number===1?'關卡開放條件：本模式開放後可挑戰（預定）。':`關卡開放條件：通過本季${modeLabel}第 ${stage.number-1} 關（預定）。`,'planned-gate'));
  if(stage.number===1){const play=planText('a',`開始第一關・${modeLabel}`,'play-stage-link');play.href=`index.html?season=2&faction=${mode==='defense'?'plants':'zombies'}`;body.append(play)}
  details.append(content);body.append(details);card.append(body);return card;
}
function renderSeason2Plan(mode){
  if(!['defense','attack'].includes(mode))mode='defense';
  document.body.dataset.mode=mode;
  document.querySelectorAll('[data-plan-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.planMode===mode)));
  document.getElementById('modeSummary').textContent=`${mode==='defense'?'魏國守城':'僵屍進攻'}十關 · 初始 2 位，每關解鎖 1 位，全破收齊 12 位`;
  document.getElementById('starterRoster').replaceChildren(...SEASON2_PLAN.initial[mode].map(key=>planUnitChip(mode,key)));
  document.getElementById('stagePlans').replaceChildren(...SEASON2_PLAN.stages.map(stage=>planStageCard(stage,mode)));
}
document.querySelectorAll('[data-plan-mode]').forEach(b=>b.addEventListener('click',()=>renderSeason2Plan(b.dataset.planMode)));
renderSeason2Plan(new URLSearchParams(location.search).get('mode'));
