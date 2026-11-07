// Optional action-driven hints. Does not mutate combat state or interrupt input.
const STEPS=[
 ['1 / 5 · 選一位武將','先點下方的劉備、關羽或張飛兵卡。','cards'],
 ['2 / 5 · 出陣駐守','點上、中、下任一路出兵。武將會留在原地等你下令。','lanes'],
 ['3 / 5 · 點選場上武將','點剛出陣的武將，讓他知道你要指揮他。','units'],
 ['4 / 5 · 指定前進位置','點武將前方的空地。他會走到那裡，再停下駐守。','lanes'],
 ['5 / 5 · 隨時停下來','再點一次已選中的武將，讓他立即駐守。','units'],
 ['學會了！照應三條路','駐守也會自動攻擊。點其他路可換路；點後方可後退。弓兵原地射擊，軍糧會自動補給。',null]
];
export function createFirstGuide(level){
 const root=document.getElementById('firstGuide');let step=0,closed=level!==1;
 function render(){root.hidden=closed;for(const id of ['cards','lanes','units'])document.getElementById(id).classList.toggle('guide-target',!closed&&STEPS[step][2]===id);if(closed)return;
  document.getElementById('guideTitle').textContent=STEPS[step][0];document.getElementById('guideText').textContent=STEPS[step][1];document.getElementById('guideDismiss').textContent=step===5?'開始指揮！':'略過教學';root.dataset.step=String(step);
 }
 document.getElementById('guideDismiss').onclick=()=>{closed=true;render()};
 render();return {event(type){if(closed)return;const expected=['select-card','deploy','select-unit','move','hold'][step];if(type===expected){step++;render()}},render};
}
