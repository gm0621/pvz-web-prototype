import {renderPeople,STORY_PEOPLE} from './characters.mjs?v=chapter-eleven-1';
import {HISTORICAL_STAGES} from './history-stages.mjs?v=chapter-eleven-1';
import {paintPortrait} from './factions.mjs?v=chapter-eleven-1';
import {THIRD_CHAPTER} from './chapter-three.mjs?v=chapter-eleven-1';
// Original child-friendly narration around the existing Romance chapter-one sequence.
export const NOVEL_PAGES=[
 [['說書人','桃花落在酒碗邊，城外的招兵榜卻被風吹得啪啪作響。這一年，百姓盼望的，只是一頓安穩飯。'],['張飛','那位壯士，為何對著榜文嘆氣？有心做事，便說出來！'],['劉備','我想救助鄉親，可惜力量太小。若有人同行……也許就能多護住一個人。']],
 [['說書人','天才微亮，車輪已在土路上留下兩道深痕。車上不是金銀，而是義軍盼了一夜的糧食。'],['關羽','刀能護身，糧能養人。這一路，比刀鋒還要緊。'],['張飛','那就讓俺走在前頭！大哥，別讓糧車落了單。']],
 [['說書人','大興山下，黃旗遮住了山口。新募的鄉勇握著兵器，手心裡全是汗。'],['劉備','回頭看看，你們的家就在身後。我與二位兄弟，都在這裡。'],['張飛','鄧茂已經出陣了？好！俺先去，替大家壯一壯膽！']],
 [['說書人','山風忽然一緊。鄧茂落敗，敵陣中又衝出一員大將，刀光直逼眼前。'],['張飛','程遠志來得正好！俺還能再戰！'],['關羽','三弟稍歇。這一陣，讓關某來。']],
 [['說書人','一封急信送到帳前。青州被圍，城中的燈火，一盞一盞熬過長夜。'],['劉備','有人等著援兵，我們便不能只顧自己歇腳。'],['關羽','山道窄，敵人有盾。別急著硬撞，先找能讓大家過去的路。']],
 [['說書人','山谷裡，連鳥鳴也顯得響亮。伏兵屏住呼吸，等著那一聲約好的號令。'],['張飛','敵人追上來了！二哥，現在衝不衝？'],['關羽','再等一等。不是誰先衝，誰就贏；要讓大家一同出手。']],
 [['說書人','青州的烽煙漸遠。廣宗軍營外，劉備勒住馬，整了整沾滿塵土的衣襟。'],['張飛','大哥，見敵將你都不慌，今天怎麼這般鄭重？'],['劉備','帳中的盧植，是我的老師。如今他為平定戰亂奔忙，我也想盡一分力。']],
 [['說書人','還未到長社，夜空已被火光照紅。遠處有人奔走，有人扶起跌倒的同伴。'],['關羽','聽軍士說，皇甫嵩已趁風用火破敵。我們趕到時，大戰已分勝負。'],['劉備','功勞不必都在我們身上。眼前道路混亂，先護住傷者和行人。']],
 [['說書人','車輪碾過碎石。一輛囚車緩緩迎面而來，劉備看清車中人，臉色忽然變了。'],['張飛','是盧公！他明明盡力作戰，怎會落到這般田地？俺去救他！'],['劉備','翼德，先收住兵器。心裡不平，也不能讓無辜的人受傷。']],
 [['說書人','山後喊聲四起，官軍敗退的腳步揚起漫天塵土。三兄弟剛登高，便看見了追來的黃旗。'],['張飛','那不是董卓的人馬嗎？我們要不要幫他？'],['劉備','先看眼前受困的人。救人之前，不必先問他有沒有官職。']]
];
export const CAMP_LINES=[
 '桃花隨著行囊帶進營中。第一次出陣的鄉勇，終於敢笑著談起明天。',
 '糧車平安到營，鍋中冒出白煙。張飛捧起飯碗，說這比慶功酒還香。',
 '山風帶走了戰鼓聲。劉備逐一探望傷者，關羽在燈下擦拭刀鋒。',
 '敵陣退去，三兄弟沒有追遠。營火邊，鄉勇們第一次叫出了關雲長的名字。',
 '青州的求援信仍放在案上。前路未平，眾人先包好傷口，再備行糧。',
 '那聲號令仍迴響在山谷。張飛笑道：這回，等一等竟比先衝更管用。',
 '廣宗的夜，燈火連成一線。劉備望向老師的軍帳，想起少年讀書時的光景。',
 '火場的煙味還留在衣上。眾人把清水先遞給傷者，才坐下來喘一口氣。',
 '囚車已遠，張飛仍悶悶不樂。劉備遞來一碗水：先照顧好身邊的人。',
 '山口的敗兵得救了。世道的冷暖還在前頭，今夜，桃園兄弟先圍著同一堆火。'
];
NOVEL_PAGES.push(...THIRD_CHAPTER.map(s=>s.novel),...HISTORICAL_STAGES.map(s=>s.novel));
CAMP_LINES.push(...THIRD_CHAPTER.map(s=>s.campLine),...HISTORICAL_STAGES.map(s=>s.campLine));
export function mountNovel(level,heroes,background,lead){
 let pages=NOVEL_PAGES[level-1],index=0,notes=false;const $=id=>document.getElementById(id);
 function render(){const [name,line]=pages[index],key=Object.keys(heroes).find(k=>heroes[k].name===name);$('novelSpeaker').textContent=name;$('novelText').textContent=line;renderPeople($('novelPeople'),line,name);$('novelCount').textContent=`${notes?'小札':'序幕'} ${index+1} / ${pages.length}`;const person=heroes[key]||STORY_PEOPLE.find(p=>p.name===name);$('novelPortrait').hidden=!person;if(person){paintPortrait($('novelPortrait'),person);$('novelPortrait').alt=name} $('novelPrevious').disabled=index===0;$('novelNext').textContent=index===pages.length-1?'換你想一想 →':'翻下一頁 →';$('novelPage').dataset.speaker=key||'narrator';if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('novelText').animate([{opacity:.25,transform:'translateX(6px)'},{opacity:1,transform:'translateX(0)'}],{duration:180});}
 $('novelNotes').textContent='說書人的歷史小札';
 $('novelNotes').onclick=()=>{notes=!notes;$('novelNotes').textContent=notes?'回到序幕':'說書人的歷史小札';pages=notes?[['說書人 · 歷史記載',HISTORICAL_STAGES[level-17]?.history||background.history],['說書人 · '+(level>=17?'遊戲改編':'演義故事'),HISTORICAL_STAGES[level-17]?.adaptation||background.story],['說書人 · 這一回',lead+'（對話與遭遇有遊戲改編。）']]:NOVEL_PAGES[level-1];index=0;$('novelPage').hidden=false;$('storyTask').hidden=true;render()};
 $('novelPrevious').onclick=()=>{if(index>0){index--;render()}};
 $('novelNext').onclick=()=>{if(index<pages.length-1){index++;render()}else{$('novelPage').hidden=true;$('storyTask').hidden=false;$('taskChoices').querySelector('button').focus()}};
 $('novelQuiz').onclick=()=>{$('novelPage').hidden=true;$('storyTask').hidden=false};
 $('novelPage').hidden=false;$('storyTask').hidden=true;render();
}
