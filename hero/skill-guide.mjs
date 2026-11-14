import {GENERALS,PEACH_GENERALS,SUN_GENERALS,heroLevel} from './roster.mjs?v=skill-tiers-1';
import {skillSummary} from './roster-view.mjs?v=skill-tiers-1';
import {factionFor,paintPortrait} from './factions.mjs?v=skill-tiers-1';
export function mountSkillGuide({getBattle,getProgress,setPaused}){
 const button=document.createElement('button');button.id='skillGuideButton';button.className='quiet-button';button.textContent='武將技能介紹';button.setAttribute('aria-haspopup','dialog');document.getElementById('cards').before(button);
 const dialog=document.createElement('dialog');dialog.id='skillGuide';dialog.className='skill-guide';dialog.setAttribute('aria-labelledby','skillGuideTitle');dialog.innerHTML='<header><h2 id="skillGuideTitle">武將技能介紹</h2><button class="quiet-button">返回戰場 ✕</button></header><p>三軍武將：被動技自動生效，主動技要自己按。先點場上武將，再點他的技能按鈕。MP 上限 60，通常每秒回復 3；暫停不回復。營地購買的是兵器強化，只增加該武將的普通攻擊，不會把他的招式或強化送給別人。</p><label>查看軍隊 <select aria-label="查看軍隊"><option value="1">劉備軍</option><option value="17">曹操軍</option><option value="20">孫堅軍</option></select></label><div class="skill-guide-list"></div><p>劉備軍、曹操軍與孫堅軍的武將各有個別經驗。實際上場後勝利 +20 經驗；敗戰需持續 10 秒才 +5。Lv.3 第二主動技、Lv.5 新被動、Lv.7 第三主動技、Lv.10 滿級被動；每級生命 +5、普攻 +1。重玩也能練經驗，軍資只在首次通關發放。技能顯示會計入已學會的被動加成。小兵沒有武將 MP 技能。</p>';document.body.append(dialog);
 let battle,wasPaused,interrupted=false;
 function render(){const level=Number(dialog.querySelector('select').value),generals=level===17?GENERALS:level===20?SUN_GENERALS:PEACH_GENERALS;dialog.querySelector('.skill-guide-list').replaceChildren(...Object.entries(generals).map(([id,g])=>{const card=document.createElement('article'),img=document.createElement('img'),text=document.createElement('div');paintPortrait(img,g);img.alt=g.name;const title=document.createElement('h3');title.textContent=g.name+' · '+g.role;const p=document.createElement('p');p.className='skill-copy';p.textContent=skillSummary(g,heroLevel(getProgress().heroGrowth[id].xp));text.append(title,p);card.append(img,text);return card}));}

 button.onclick=()=>{battle=getBattle();if(!battle||battle.over||battle.duel||battle.introPending)return;wasPaused=battle.paused;interrupted=false;setPaused(true);dialog.querySelector('select').value=String(factionFor(battle.level)==='cao'?17:factionFor(battle.level)==='sun'?20:1);render();dialog.showModal();dialog.scrollTop=0};
 dialog.querySelector('select').onchange=render;dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(dialog.open)return;if(getBattle()===battle)setPaused(wasPaused||interrupted||document.hidden);battle=null;button.focus({preventScroll:true})});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)interrupted=true});
 window.addEventListener('pagehide',()=>{if(dialog.open)interrupted=true});
}
