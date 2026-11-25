import {stageFactionTitle,paintPortrait} from './factions.mjs?v=chapter-twenty-1';
import {STORY_PEOPLE} from './characters.mjs?v=chapter-twenty-1';
export function mountHistoryLesson(stage,heroes){
 let root=document.getElementById('historyLesson');if(!root){root=document.createElement('details');root.id='historyLesson';document.getElementById('storyPrologue').prepend(root)}root.hidden=!stage.year;if(!stage.year)return;root.open=false;
 root.innerHTML='<summary class="history-toggle"></summary><div class="history-timeline"></div><h3></h3><div class="history-roster"></div><div class="history-tabs"><button type="button">史書記了什麼？</button><button type="button">哪些是遊戲改編？</button></div><p class="history-fact"></p><details><summary>查看史料出處</summary><div class="history-sources"></div></details>';
 root.querySelector('.history-toggle').textContent=`${stage.year} 年 · ${stageFactionTitle(stage)} · 點開歷史小檔案`; root.querySelector('h3').textContent=`${stage.year} 年 · 視角：${stageFactionTitle(stage)}${stage.viewpointShift?' · 換一雙眼睛看歷史':''}`;
 const timeline=stage.chapter===20?[[246,'蔣琬病逝・費禕主持政務'],[247,'洮西接應'],[249,'夏侯霸入蜀'],[253,'費禕遇害・南安退兵'],[255,'洮西交戰・狄道解圍']]:stage.chapter===19?[[234,'撤軍爭端・蔣琬接任'],[238,'進駐沔陽'],[243,'移駐涪縣・費禕接任'],[244,'興勢拒魏・援軍解圍']]:stage.chapter===18?[[230,'曹真伐蜀・雨阻退兵'],[231,'祁山糧運・木門收兵'],[234,'斜谷出兵・五丈原']]:stage.chapter===17?[[227,'出師表・北駐漢中'],[228,'隴右響應・街亭與陳倉'],[229,'取得武都、陰平']]:stage.chapter===16?[[223,'白帝託孤・即位與修好'],[224,'務農息民'],[225,'南征四郡・回到成都']]:stage.chapter===15?[[221,'成都即位・伐吳'],[222,'猇亭敗退・白帝收兵']]:stage.chapter===14?[[219,'封漢中王・襄樊圍城・江陵易手']]:stage.chapter===13?[[215,'宕渠・瓦口'],[216,'鄴城・封魏王'],[217,'濡須對峙'],[218,'進兵漢中・馬鳴閣道'],[219,'定軍山・漢中王']]:stage.chapter===12?[[212,'長安留守'],[213,'鄴城・封魏公'],[214,'祁山解圍'],[215,'散關・陽平・南鄭']]:stage.chapter===11?[[209,'譙縣整備・江陵撤守'],[210,'鄴城新訊'],[211,'潼關・渡河・渭南']]:stage.chapter===10?[[208,'荊州・長坂・赤壁']]:stage.chapter===9?[[205,'南皮決戰'],[206,'壺關・北征備糧'],[207,'盧龍・白狼山・柳城']]:stage.chapter===8?[[201,'倉亭再戰'],[202,'黎陽軍前'],[203,'黎陽轉進・西平來信'],[204,'鄴城合圍與戰後']]:stage.chapter===7?[[199,'許都整軍・官渡布防'],[200,'白馬・延津・官渡之戰']]:stage.chapter===6?[[196,'迎駕與屯田'],[197,'宛城與陳地'],[198,'下邳合圍']]:stage.chapter===5?[[192,'長安政變・兗州立足'],[194,'鄄城與濮陽'],[195,'定陶再起']]:[[189,'董卓入京'],[190,'聯軍起兵'],[191,'孫堅北進']];
 root.querySelector('.history-timeline').replaceChildren(...timeline.map(([year,event])=>{const item=document.createElement('span');item.textContent=`${year} · ${event}`;item.classList.toggle('current',stage.year===year);if(stage.year===year)item.setAttribute('aria-current','step');return item}));
 const roster=root.querySelector('.history-roster');
 const people=stage.historyCast?stage.historyCast.map(name=>STORY_PEOPLE.find(person=>person.name===name)).filter(Boolean):[heroes.liubei,heroes.guanyu,heroes.zhangfei];
 if(stage.historyCast)roster.setAttribute('aria-label','本關史料人物');
 for(const person of people){
  const fig=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');
  paintPortrait(img,person);img.alt=person.name;caption.textContent=person.name;fig.append(img,caption);roster.append(fig);
 }
 const buttons=root.querySelectorAll('.history-tabs button');function select(i){root.querySelector('.history-fact').textContent=i?stage.adaptation:stage.history;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)))}buttons.forEach((b,i)=>b.onclick=()=>select(i));select(0);
 for(const ref of stage.references){const a=document.createElement('a');a.href=ref.url;a.textContent=ref.title;a.target='_blank';a.rel='noopener noreferrer';root.querySelector('.history-sources').append(a)}
}
