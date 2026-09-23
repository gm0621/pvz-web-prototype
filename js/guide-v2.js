// Isolated teaching storyboard: never calls combat, save, reward, or random-roll functions.
let guideDemoTimer=null,guideDemoFrame=0,guideDemoModel=null,guideDemoAbility=null,guideLastFocus=null;
function guideNode(tag,text,cls){const el=document.createElement(tag);if(text!=null)el.textContent=text;if(cls)el.className=cls;return el}
function guideStopDemo(){if(guideDemoTimer!==null)clearTimeout(guideDemoTimer);guideDemoTimer=null;if($('guideDemo'))$('guideDemo').dataset.paused='true';const b=$('guidePlay');if(b)b.textContent='▶ 播放'}
function guideV2Init(){
 const modal=$('charModal');modal.classList.add('guide-v2');modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','charModalName');
 modal.querySelector('.char-detail-body').innerHTML=`<section class="guide-main"><h3 id="charModalSkillTitle">普通行動、天賦與技能</h3><p id="charModalSkill" class="skill-copy"></p><label class="guide-field">選擇招式<select id="guideAbility"></select></label><div id="guideAbilityInfo" class="guide-ability-info"></div><section id="guideDemo" aria-label="獨立教學示範"><div class="guide-demo-heading"><strong>範圍與動作教學</strong><span id="guideDemoBadge"></span></div><div id="charModalRange" class="range-board"></div><p class="guide-range-note" id="guideRangeNote"></p><label class="guide-field">示範情境<select id="guideScenario"><option value="success">條件成立（教學指定成功）</option><option value="unmet">條件不成立</option><option value="cooldown">尚未就緒／冷卻中</option><option value="miss">符合條件但機率未中</option></select></label><div class="guide-demo-controls"><button id="guidePlay" type="button">▶ 播放</button><button id="guideStep" type="button">下一步</button><button id="guideReplay" type="button">↺ 重播</button><label>速度<select id="guideSpeed" aria-label="動畫速度"><option value="1">正常</option><option value="2">慢速</option></select></label></div><ol class="guide-timeline"><li>站位</li><li>條件</li><li>動作</li><li>結算</li><li>後續</li></ol><p id="guideDemoCaption" aria-live="polite"></p><p class="guide-disclaimer">獨立教學分鏡，非完整戰鬥模擬；示範時間經過壓縮，不扣資源、不改存檔。實戰數值以所選模式與條件為準。</p></section></section><aside class="guide-side"><h3 id="charModalStatsTitle">能力數值</h3><label class="guide-field">數值模式<select id="guideStatMode"><option value="current">目前等級＋裝備</option><option value="base">基礎數值</option><option value="next">下一級預覽（不升級）</option></select></label><div class="stat-grid" id="charModalStats"></div><div id="guideSummons"></div><h3>配置與限制</h3><p id="guideNotes"></p><p id="guideRandomNote"></p></aside>`;
 $('guideAbility').onchange=()=>guideChooseAbility();
 $('guideScenario').onchange=()=>{guideStopDemo();guideDemoFrame=0;guideDrawDemo()};
 $('guideStatMode').onchange=()=>{const m=guideDemoModel,id=guideDemoAbility.id;showGuideV2(m.roster,m.key,$('guideStatMode').value,id)};
 $('guidePlay').onclick=()=>{if(guideDemoTimer!==null){guideStopDemo();return}if(matchMedia('(prefers-reduced-motion: reduce)').matches){guideAdvance();return}if(guideDemoFrame>=4)guideDemoFrame=0;guideTick()};
 $('guideStep').onclick=()=>{guideStopDemo();guideAdvance()};
 $('guideReplay').onclick=()=>{guideStopDemo();guideDemoFrame=0;guideDrawDemo();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)guideTick()};
 $('charModalClose').addEventListener('click',()=>{guideStopDemo();guideLastFocus?.focus?.()});
 modal.addEventListener('click',e=>{if(e.target===modal)guideStopDemo()});
 modal.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();$('charModalClose').click()}
  if(e.key==='Tab'){const items=[...modal.querySelectorAll('button:not([disabled]),select:not([disabled]),a[href]')].filter(el=>el.getClientRects().length),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)guideStopDemo()});
 new MutationObserver(()=>{if(!modal.classList.contains('show'))guideStopDemo()}).observe(modal,{attributes:true,attributeFilter:['class']});
}
function guideStat(label,value){const item=guideNode('div',null,'stat-pill');item.append(guideNode('b',label),guideNode('span',value));return item}
function showGuideV2(roster,key,mode='current',abilityId=null){
 const m=guideV2Model(roster,key,mode);if(!m)return;
 if(!$('guideDemo'))guideV2Init();
 guideStopDemo();if(!$('charModal').classList.contains('show'))guideLastFocus=document.activeElement;guideDemoModel=m;
 const modal=$('charModal');modal.classList.toggle('wei-preview',roster==='wei');modal.classList.toggle('zombie2-preview',roster==='zombie2');
 $('charModalImg').src=m.asset;$('charModalImg').alt=m.name;$('charModalName').textContent=m.name;
 $('charModalRole').textContent=`${roster==='wei'?'魏國':m.side==='plants'?'蜀國':'僵屍方'}｜第${m.season===2?'二':'一'}季｜${m.status}`;
 $('charModalIntro').textContent=m.intro;
 const talents=m.abilities.filter(a=>a.id==='talent'),skills=m.abilities.filter(a=>a.id==='skill');
 $('charModalSkill').textContent=[m.fixedNote||talents.map(a=>`${a.label.replace('｜','：')}（${m.preview?'設計候選':'固定生效'}）`).join(''),...skills.map(a=>`${a.label.replace('｜','：')}${a.chance?`，目前 Lv.${mode==='base'?1:m.level} 發動率 ${a.chance}%`:'，數值待定'}`),m.randomNote,m.season===1?relocationDetail(key):''].join(' ');
 const statMode=$('guideStatMode');statMode.value=mode;statMode.options[0].textContent=m.preview?'候選／待定（未實裝）':'目前等級＋裝備';statMode.disabled=m.preview;statMode.setAttribute('aria-label',m.preview?'未實裝角色僅顯示候選或待定數值':'數值模式');
 const {d}=m,melee=m.abilities.find(a=>a.id==='melee'),ranged=m.abilities.find(a=>a.id==='ranged');
 $('charModalStatsTitle').textContent=m.preview?'候選／待定數值':mode==='base'?'基礎數值':`Lv.${m.level} ${mode==='next'?'下一級預覽':'目前能力'}`;
 $('charModalStats').replaceChildren(...[
 ['開放狀態',`${m.status}｜${m.statusDetail}`],['數值依據',m.preview?m.statusDetail:mode==='base'?'原始戰鬥定義，不含裝備與等級。':'共用戰鬥 effectiveUnit；含玩家等級與裝備。'],
 ['部署費用',m.base?.hidden?'不可獨立部署':d.cost==null?'待定':`${d.cost} ${m.side==='plants'?'軍糧':'腦'}`],['生命值 HP',d.hp==null?'待定':`${d.hp}`],
 ['近戰攻擊力',melee?`${melee.damage}／擊`:'無獨立近戰普攻'],['遠程攻擊力',ranged?`${ranged.damage}／擊`:'無獨立遠程普攻'],
 ['護盾／減傷',d.shieldHp?`獨立護盾 ${d.shieldHp}；細節見天賦。`:'生命值不等於防禦；特殊保護見天賦，未實裝效果僅為草案。'],
 ['卡片部署冷卻',m.base?.hidden?'不適用，依召喚者週期':guideSeconds(d.cooldown)],
 ['移動',d.speed?`${d.speed} 格／遊戲步（非每秒）；緩速、跳越另計。`:'固定站位／設計以招式說明為準。']
 ].map(([k,v])=>guideStat(k,v)));
 if(skills[0]?.chance){const chance=skills[0].chance,next=m.season===1?Math.round(superSkillChance(key,(mode==='base'?1:m.level)+1)*100):m.preview?Math.min(60,chance+2):chance;$('charModalStats').append(guideStat(m.preview?'機率技能候選':'機率技能發動率',`${chance}%（下級 ${next}%）${m.preview?'・尚未實裝':''}`))}
 $('guideNotes').textContent=m.notes;$('guideRandomNote').textContent=m.randomNote;
 const selector=$('guideAbility');selector.replaceChildren(...m.abilities.map(a=>{const o=guideNode('option',a.label);o.value=a.id;return o}));if(abilityId&&m.abilities.some(a=>a.id===abilityId))selector.value=abilityId;
 const summons=$('guideSummons');summons.replaceChildren();
 const keys=[...new Set(m.abilities.flatMap(a=>a.summons||[]))];if(keys.length){summons.append(guideNode('h3','召喚物詳細資料'));for(const k of keys){const base=(m.side==='plants'?PLANT_TYPES:ZOMBIE_TYPES)[k],b=guideNode('button',`查看 ${base.name}`);b.dataset.guideSummon=k;b.onclick=()=>showGuideV2(m.side,k);summons.append(b)}}
 modal.classList.add('show');guideChooseAbility();modal.querySelector('.char-detail-card').scrollTop=0;$('charModalClose').focus({preventScroll:true});
}
function guideChooseAbility(){
 guideStopDemo();guideDemoFrame=0;const m=guideDemoModel,a=m.abilities.find(a=>a.id===$('guideAbility').value);guideDemoAbility=a;
 const details=[['發動條件',a.condition],['攻擊／影響範圍',a.rangeText],['傷害與效果',a.effect],['間隔／持續／冷卻',a.timing],['限制與例外',a.limits]];
 $('guideAbilityInfo').replaceChildren(...details.map(([k,v])=>guideStat(k,v)));
 $('guideScenario').value='success';$('guideScenario').querySelector('[value="miss"]').disabled=!a.chance&&!(m.preview&&a.id==='skill');
 $('guideDemoBadge').textContent=m.preview?'概念預覽・未實裝':'教學示意・非實戰';
 $('guideRangeNote').textContent=`${a.rangeText}。${a.reach===null?'範圍未定，不繪製假射程。':'金色為招式範圍、藍色為角色、紅色為示範目標；半格／小數以色帶端點為準。'}`;
 guideDrawDemo();
}
function guideAdvance(){guideDemoFrame=(guideDemoFrame+1)%5;guideDrawDemo()}
function guideTick(){if(document.hidden||!$('charModal').classList.contains('show'))return guideStopDemo();$('guideDemo').dataset.paused='false';guideAdvance();if(guideDemoFrame>=4)return guideStopDemo();$('guidePlay').textContent='Ⅱ 暫停';guideDemoTimer=setTimeout(guideTick,850*Number($('guideSpeed').value))}
function guideDemoResult(m,a,frame,scenario){
 const success=scenario==='success',hit=frame>=3&&success;
 // Numeric deltas only where an explicit quantity is known; concept effects use captions.
 const damage=hit?Number((a.damage||0).toFixed(3)):0;
 return {frame,scenario,hit,damage,hp:Math.max(0,600-damage),resource:hit?(a.amount||0):0,shieldLoss:hit&&a.kind==='shield'?(m.key==='xu-huang'&&a.id==='skill'?100:m.combatKey==='s2Cleaver'?m.d.damage*(a.id==='skill'?3:2):0):0,effect:hit?a.effect:'尚未施加效果'};
}
function guideDrawDemo(){
 const m=guideDemoModel,a=guideDemoAbility;if(!m||!a)return;
 const scenario=$('guideScenario').value,result=guideDemoResult(m,a,guideDemoFrame,scenario),f=guideDemoFrame;
 $('guideDemo').dataset.result=JSON.stringify(result);
 const blocked={unmet:'條件不成立：本招不發動；普通行動是否繼續，依實戰規則。',cooldown:'尚未就緒／冷卻中：本招不發動，不提前重置冷卻。',miss:'符合條件，但這次機率未中：保留原本普通行動與固定天賦。'};
 const lead=m.preview?'概念教學（未實裝）':'獨立教學';
 const captions=[`${lead}｜站位：${a.rangeText}`,`${lead}｜檢查條件：${a.condition}`,`${lead}｜${scenario==='success'?(a.chance?'教學指定成功，不代表實戰必定觸發。':'條件成立，準備動作。'):blocked[scenario]}`,`${lead}｜${result.hit?`${a.effect}${result.damage?` 示範目標 HP：600 → ${result.hp}（本次 ${result.damage}）。`:''}`:blocked[scenario]}`,`${lead}｜後續：${a.timing} ${a.limits}`];
 $('guideDemoCaption').textContent=captions[f];document.querySelectorAll('.guide-timeline li').forEach((el,i)=>{el.classList.toggle('current',i===f);el.setAttribute('aria-current',i===f?'step':'false')});
 guideDrawBoard(m,a,result);
}
function guideDrawBoard(m,a,result){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 900 500');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${m.name}：${a.rangeText}`);
 const node=(tag,attrs,parent=svg,text)=>{const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));if(text!=null)el.textContent=text;parent.append(el);return el};
 node('title',{},svg,`${a.label}｜${a.rangeText}`);
 for(let r=0;r<5;r++)for(let c=0;c<9;c++)node('rect',{x:c*100,y:r*100,width:100,height:100,fill:(r+c)%2?'#172b36':'#1c3540',stroke:'#35505b','stroke-width':1});
 const dir=m.side==='plants'?1:-1,origin=dir===1?150:750,cy=250;
 const distance=a.reach==null?2:Math.max(.2,Math.min(3,a.reach*.8)),target=origin+dir*distance*100;
 const color='#efb94b',band=(x,y,w,h)=>node('rect',{x:Math.max(0,x),y:Math.max(0,y),width:Math.max(0,Math.min(w,900-Math.max(0,x))),height:Math.min(h,500-Math.max(0,y)),fill:color,'fill-opacity':.28,stroke:color,'stroke-width':3,'stroke-dasharray':'9 5'});
 if(a.reach!==null){
  if(a.shape==='all')band(0,0,900,500);
  else if(a.shape==='rows')band(0,Math.max(0,200-a.rows*100),900,(1+2*a.rows)*100);
  else if(a.shape==='self')band(origin-40,210,80,80);
  else if(a.shape==='around')band(origin-a.reach*100,200-a.rows*100,a.reach*200,(1+2*a.rows)*100);
  else if(a.shape==='target'){const end=Math.max(0,Math.min(900,origin+dir*a.reach*100));band(Math.min(origin,end),200,Math.abs(end-origin),100);band(target-100,100,200,300)}
  else {const toward=a.shape==='behind'?-dir:dir,end=Math.max(0,Math.min(900,origin+toward*a.reach*100)),start=origin+toward*(a.min||0)*100;band(Math.min(start,end),200-a.rows*100,Math.abs(end-start),(1+2*a.rows)*100)}
 }
 const portrait=(asset,x,y,label,tag,affected=false)=>{
  const g=node('g',{'class':affected?'guide-impact':''});node('rect',{x:x-36,y:y-40,width:72,height:80,rx:12,fill:tag==='我'?'#39798a':'#753c44','fill-opacity':.9},g);
  node('image',{href:asset,x:x-48,y:y-58,width:96,height:96,preserveAspectRatio:'xMidYMid meet'},g);
  node('text',{x,y:y+51,'text-anchor':'middle',fill:'#fff','font-size':18,'font-weight':700},g,label);return g;
 };
 portrait(m.asset,origin,cy,m.name,'我');
 const enemy=m.side==='plants'?ZOMBIE_TYPES.normal:PLANT_TYPES.wallnut;
 const supportive=['guard','supply','summon','mark'].includes(a.kind)&&!a.damage;
 const targetX=a.shape==='behind'?origin-dir*80:target;
 if(a.kind==='supply'){
  node('text',{x:target,y:230,'text-anchor':'middle',fill:'#ffe78d','font-size':44},svg,'🌾');node('text',{x:target,y:290,'text-anchor':'middle',fill:'#fff','font-size':23},svg,`軍糧 +${result.resource}`);
 }else if(a.kind==='summon'){
  const defs=m.side==='plants'?PLANT_TYPES:ZOMBIE_TYPES,unit=defs[a.summons?.[0]];
  if(result.hit&&unit)for(const row of a.rows?[-1,0,1]:[0])portrait(unit.asset,target,cy+row*100,unit.name,'友');
  else node('text',{x:target,y:cy,'text-anchor':'middle',fill:'#cfe8ee','font-size':24},svg,'等待召喚');
 }else {
  const asset=supportive?m.asset:enemy.asset;portrait(asset,targetX,cy,supportive?'效果觀察點':'示範目標','敵',result.hit);
  if(!supportive&&a.damage){node('rect',{x:targetX-35,y:cy-63,width:70,height:8,fill:'#692d38'},svg);node('rect',{x:targetX-35,y:cy-63,width:70*result.hp/600,height:8,fill:'#82dc99'},svg);node('text',{x:targetX,y:cy-76,'text-anchor':'middle',fill:'#fff','font-size':20},svg,`${result.hp}/600`)}
  if(result.hit){
   if(a.damage)node('text',{x:targetX,y:cy-107,'text-anchor':'middle',fill:'#ffe08b','font-size':32,'font-weight':800},svg,`−${result.damage}`);
   else node('text',{x:targetX,y:cy-90,'text-anchor':'middle',fill:'#ffe08b','font-size':25},svg,({guard:'🛡 保護',shield:`削盾 ${result.shieldLoss||'效果'}`,mark:'◉ 標記',control:'◷ 控制',move:'→ 位移',concept:'✦ 概念效果'})[a.kind]||'✦ 生效');
   if(a.kind==='shield')node('text',{x:targetX,y:cy+80,'text-anchor':'middle',fill:'#acd9ff','font-size':20},svg,`示意盾 200 → ${Math.max(0,200-result.shieldLoss)}`);
  }
  if(a.rows&&a.damage)for(const dy of [-100,100]){portrait(enemy.asset,targetX,cy+dy,'範圍內目標','敵',result.hit);if(result.hit)node('text',{x:targetX+68,y:cy+dy,fill:'#ffe08b','font-size':24},svg,`−${Number((a.splash??a.damage).toFixed(2))}`)}
 }
 if(result.frame===2&&result.scenario==='success'){
  node('line',{x1:origin,y1:cy,x2:targetX,y2:cy,stroke:'#ffe79b','stroke-width':7,'stroke-dasharray':'12 9','class':'guide-motion-line'});
  node('circle',{cx:origin,cy,r:14,fill:'#ffe29b','class':'guide-bolt',style:`--guide-travel:${targetX-origin}px`});
 }
 const board=$('charModalRange');board.dataset.direction=String(dir);board.dataset.reach=String(a.reach);board.replaceChildren(svg);
}
