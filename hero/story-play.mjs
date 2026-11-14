import {HISTORICAL_STAGES} from './history-stages.mjs?v=story-reader-1';
import {paintPortrait} from './factions.mjs?v=story-reader-1';
import {THIRD_CHAPTER} from './chapter-three.mjs?v=story-reader-1';
// Small, optional story choices. Facts, novel episodes and invented encounters stay labelled.
export const STORY_TASKS=[
 {kind:'演義故事',hero:'zhangfei',title:'桃園缺一位好朋友',scene:'劉備想幫助鄉親，卻沒有招募義勇的錢。',question:'誰願意拿出家財，幫忙招募義勇？',choices:['張飛','關羽','張角'],answer:0,hint:'找找那位嗓門大、家中有莊田的朋友。',reply:'張飛：「俺願出資！」有了朋友相助，理想才能開始。桃園結義是《三國演義》的故事。'},
 {kind:'遊戲想像',hero:'liubei',title:'替義軍打點行囊',scene:'隊伍要出發了，糧車卻停在危險的路口。',question:'先保護哪一樣，才能讓大家繼續前進？',choices:['一車糧食','漂亮旗子','慶功燈籠'],answer:0,hint:'想一想：大家走了一整天，肚子會怎麼樣？',reply:'劉備：「先護糧車！」這段護送是遊戲補寫，但行軍確實需要糧食。'},
 {kind:'演義故事',hero:'zhangfei',title:'認出蛇矛小英雄',scene:'大興山前，鄧茂出陣。三兄弟握緊手中兵器。',question:'《演義》中，是誰挺矛迎戰鄧茂？',choices:['拿雙劍的劉備','拿蛇矛的張飛','拿青龍刀的關羽'],answer:1,hint:'答案藏在兵器裡：找拿「矛」的人！',reply:'張飛：「燕人張翼德在此！」小說寫張飛迎戰鄧茂；遊戲的特效是想像。'},
 {kind:'演義故事',hero:'guanyu',title:'青龍刀輪到誰？',scene:'程遠志舞刀而來，另一位兄弟策馬上前。',question:'這次是誰出戰？',choices:['劉備','關羽','張飛'],answer:1,hint:'他留著長鬍子，手中是青龍偃月刀。',reply:'關羽：「關雲長在此。」《演義》寫關羽迎戰程遠志，與張飛先後立功。'},
 {kind:'遊戲想像',hero:'liubei',title:'分清故事與想像',scene:'青州有人求救！山道上，石魁舉起巨盾。',question:'巨盾頭目石魁，是從哪裡來的？',choices:['遊戲新設計的角色','歷史課本記載','三兄弟的老師'],answer:0,hint:'救青州取材自小說；這位拿巨盾的攔路者是新朋友。',reply:'劉備：「石魁是遊戲原創。」救援青州來自《演義》，並非每個遊戲人物都出現在史書裡。'},
 {kind:'演義故事',hero:'guanyu',title:'等一聲，大家一起！',scene:'三兄弟商量設伏，分頭藏好，等待號令。',question:'想讓兩邊伏兵一起出擊，該怎麼辦？',choices:['各自亂衝','聽到約好的號令再出發','一直躲著'],answer:1,hint:'一起做事，要有大家都聽得懂的訊號。',reply:'關羽：「先約定，再行動。」小說寫三兄弟用鳴金作號，配合伏兵解圍；雷烈是遊戲原創。'},
 {kind:'演義故事',hero:'liubei',title:'拜見熟悉的老師',scene:'青州暫安，劉備帶兄弟北上廣宗，要見一位老師。',question:'劉備要拜見哪位老師？',choices:['盧植','張角','韓旌'],answer:0,hint:'名字是兩個字，第一個字是「盧」。',reply:'劉備：「恩師盧植，學生來助戰了！」《演義》寫劉備投奔盧植；韓旌是遊戲原創頭目。'},
 {kind:'歷史記載',hero:'guanyu',title:'火光中的線索',scene:'長社火起！三兄弟趕到前，官軍已開始反攻。',question:'長社火攻主要由誰指揮？',choices:['張飛','皇甫嵩','焦魯'],answer:1,hint:'他是朝廷派出的將領，名字有三個字。',reply:'關羽：「記住皇甫嵩！」史書記載他趁風縱火破敵，朱儁等共同作戰；不是劉備策劃的。'},
 {kind:'演義故事',hero:'liubei',title:'先停一下，想一想',scene:'囚車裡竟是盧植！張飛很生氣，想立刻動手。',question:'如果你在旁邊，會怎麼勸張飛？',choices:['先問清楚，別衝動傷人','馬上攻擊押送的人','假裝沒看見'],answer:0,hint:'生氣可以理解，但先停一停，才能想出更好的辦法。',reply:'劉備：「先收起兵器。」《演義》中，劉備勸住張飛。遇到不公平，也要先想清楚行動的後果。'},
 {kind:'演義故事',hero:'liubei',title:'先救人，還是問身分？',scene:'官軍被追得四散，前方有人正等待援手。',question:'劉備決定先做什麼？',choices:['先救受困的人','先問有多少獎賞','等對方求自己'],answer:0,hint:'桃園的誓言，是想幫助受苦的人。',reply:'劉備：「救人要緊！」《演義》寫三兄弟救董卓，卻受到冷遇。張角的雷光與破陣單挑是遊戲想像。'}
];
STORY_TASKS.push(...THIRD_CHAPTER.map(s=>s.quiz),...HISTORICAL_STAGES.map(s=>s.quiz));
export function mountStoryTask(level,heroes,onReward=()=>{}){
 const task=STORY_TASKS[level-1],root=document.getElementById('storyTask');
 root.dataset.solved='false';document.getElementById('taskKind').textContent=task.kind;
 document.getElementById('taskTitle').textContent=task.title;
 const portrait=document.getElementById('taskPortrait');paintPortrait(portrait,heroes[task.hero]);portrait.alt=heroes[task.hero].name;
 document.getElementById('taskScene').textContent=task.scene;
 document.getElementById('taskQuestion').textContent=task.question;
 const feedback=document.getElementById('taskFeedback');feedback.textContent='點一個答案，聽聽武將怎麼說。';
 document.getElementById('taskChoices').replaceChildren(...task.choices.map((label,index)=>{
  const button=document.createElement('button');button.type='button';button.textContent=label;button.className='story-choice';
  button.onclick=()=>{if(root.dataset.solved==='true')return;
   const correct=index===task.answer;button.dataset.result=correct?'correct':'try';
   feedback.textContent=correct?'★ '+task.reply:'再想想看！'+task.hint;
   if(correct){root.dataset.solved='true';onReward();for(const choice of root.querySelectorAll('.story-choice'))choice.setAttribute('aria-disabled','true')}
  };return button;
 }));
}
