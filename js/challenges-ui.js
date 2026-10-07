function challengeMedalEarned(definition){return !!playerProfile?.challenges?.medals?.[definition?.medalId]}
function challengeConditionText(definition){
 if(definition.id==='gate-health')return `關卡目標生命保持至少 ${Math.round((definition.minHealthPct??.5)*100)}%。`;
 if(definition.id==='resource-cap')return `總支出不超過 ${definition.maxSpent??500}。`;
 if(definition.id==='time-limit'){const seconds=Math.floor((definition.maxMs??180000)/1000);return `在 ${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')} 內獲勝。`}
 if(definition.id==='protect-unit'){const name=baseUnit(definition.faction,definition.protectedUnitType)?.name||definition.protectedUnitType;return `${name}的首次部署單位必須存活。`}
 return definition.description;
}
function appendChallengeSelector(card,season,faction,level,unlocked){
 const definitions=challengesForRoute(season,faction,level);if(definitions.length!==3)return null;
 const selector=document.createElement('fieldset'),legendId=`challenge-${season}-${faction}-${level}`;selector.className='challenge-selector';selector.setAttribute('aria-labelledby',legendId);
 const earned=definitions.filter(challengeMedalEarned).length;
 selector.innerHTML=`<legend id="${legendId}" class="challenge-selector-head"><span>🏅 挑戰勳章</span><span class="challenge-medal-count">${earned}/3 已取得</span></legend><div class="challenge-option-list"></div>`;
 const list=selector.querySelector('.challenge-option-list');
 for(const definition of definitions){const owned=challengeMedalEarned(definition),label=document.createElement('label');label.className=`challenge-option${owned?' earned':''}`;const condition=challengeConditionText(definition),status=owned?'已取得':'尚未取得';label.innerHTML=`<input type="checkbox" value="${definition.id}" ${unlocked?'':'disabled'} aria-label="${definition.name}：${condition}${status}"><span class="challenge-option-copy"><span class="challenge-option-name">🏅 ${definition.name}</span><span class="challenge-option-description">${condition}</span><span class="challenge-medal-state">${status}</span></span>`;list.append(label)}
 const startButton=card.querySelector('.level-start');startButton?.before(selector);return selector;
}
function selectedChallengeIds(card){return [...(card?.querySelectorAll('.challenge-option input:checked')||[])].map(input=>input.value)}
function challengeFailureReason(definition,telemetry){
 const outcome=challengeOutcomeEvent(telemetry),events=telemetry?.events||[],side=definition.faction;if(!outcome)return '未達成：本場沒有完整戰果';if(outcome.win!==true)return '未達成：本場未獲勝';
 if(definition.id==='no-hero')return '未達成：本場曾部署武將';if(definition.id==='gate-health')return `未達成：目標生命 ${Math.round(Number(outcome.objectiveHealthPct||0)*100)}%，要求至少 ${Math.round((definition.minHealthPct??.5)*100)}%`;
 if(definition.id==='resource-cap')return `未達成：已支出 ${Number(telemetry?.totals?.resources?.[side]?.spent||0)}，限制為 ${definition.maxSpent??500}`;
 if(definition.id==='no-relocation')return '未達成：本場曾使用換列';if(definition.id==='melee-only')return '未達成：本場曾部署遠程單位';
 if(definition.id==='time-limit'){const elapsed=Math.max(0,Number(outcome.elapsedMs||0)),limit=Number(definition.maxMs??180000),clock=value=>`${String(Math.floor(value/60000)).padStart(2,'0')}:${String(Math.floor(value/1000)%60).padStart(2,'0')}`;return `未達成：用時 ${clock(elapsed)}，限制為 ${clock(limit)}`}
 if(definition.id==='protect-unit')return '未達成：指定任務單位未存活';if(definition.id==='no-enemy-leak'&&events.some(event=>event.type==='leak'&&event.side!==side))return '未達成：曾有敵軍突破防線';return '未達成：挑戰條件未完成';
}
function renderChallengeResults(battle=state,{pending=false,cloudVerified=true}={}){
 const panel=$('challengeResultPanel'),list=$('challengeResultList'),definitions=activeChallengeDefinitions(battle);if(!panel||!list)return false;
 if(!definitions.length){list.replaceChildren();panel.classList.add('hidden');return false}
 const fragment=document.createDocumentFragment();for(const definition of definitions){const verdict=evaluateChallengeVerdict(definition,battle.gameplay.telemetry),owned=challengeMedalEarned(definition),item=document.createElement('div');let status='failed',reason=challengeFailureReason(definition,battle.gameplay.telemetry);
  if(verdict.passed&&pending){status='pending';reason='✓ 條件達成｜等待雲端確認'}else if(verdict.passed&&!cloudVerified){status='failed';reason='✓ 條件達成，但雲端同步失敗，未取得永久勳章'}else if(verdict.passed){status='passed';reason=owned?'✓ 已達成｜🏅 已取得勳章':'✓ 已達成'}
  item.className=`challenge-result-item ${status}`;item.innerHTML=`<strong>${status==='failed'?'✕':'✓'} ${definition.name}</strong><span class="challenge-result-reason">${reason}</span>`;fragment.append(item)}
 list.replaceChildren(fragment);panel.classList.remove('hidden');return true;
}
function resultDialogFocusables(){return [...$('modal').querySelectorAll('button:not([disabled]):not(.hidden),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>!element.hidden&&element.getClientRects().length)}
let resultDialogOpener=null,resultDialogInertTargets=[];
function showResultModal(){
 const modal=$('modal');if(!modal.classList.contains('show'))resultDialogOpener=document.activeElement;
 resultDialogInertTargets=[...document.body.children].filter(element=>element!==modal&&!['SCRIPT','DIALOG'].includes(element.tagName));resultDialogInertTargets.forEach(element=>{element.inert=true});
 modal.classList.add('show');modal.querySelector('.modal-card')?.focus();
}
function closeResultDialogAccessibility(){resultDialogInertTargets.forEach(element=>{element.inert=false});resultDialogInertTargets=[];const opener=resultDialogOpener;resultDialogOpener=null;if(opener?.isConnected)opener.focus()}
document.addEventListener('keydown',event=>{
 const modal=$('modal');if(event.key!=='Tab'||!modal?.classList.contains('show')||document.querySelector('dialog[open]'))return;
 const focusables=resultDialogFocusables();if(!focusables.length){event.preventDefault();modal.querySelector('.modal-card')?.focus();return}
 const first=focusables[0],last=focusables[focusables.length-1];
 if(event.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){event.preventDefault();last.focus()}
 else if(!event.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){event.preventDefault();first.focus()}
});
document.addEventListener('focusin',event=>{const modal=$('modal');if(modal?.classList.contains('show')&&!document.querySelector('dialog[open]')&&!modal.contains(event.target))modal.querySelector('.modal-card')?.focus()});
function hideResultModal(){const modal=$('modal');if(!modal)return;modal.classList.remove('show');if(resultDialogOpener)closeResultDialogAccessibility()}
