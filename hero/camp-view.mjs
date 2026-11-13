import {renderHeroCamp} from './roster-view.mjs?v=roster-chapters-1';
import {STORY_PEOPLE,renderPeople} from './characters.mjs?v=roster-chapters-1';
import {STAGES,chapterInfo} from './story.mjs?v=roster-chapters-1';
import {FACTION_SKILLS,factionFor,paintPortrait} from './factions.mjs?v=roster-chapters-1';
import {campConversation} from './camp-talk.mjs?v=roster-chapters-1';
import {GOODS,purchase,weaponsForLevel} from './campaign.mjs?v=roster-chapters-1';
import {CAMP_LINES} from './novel.mjs?v=roster-chapters-1';
import {HERO_SKILLS} from './skills.mjs?v=roster-chapters-1';
export function mountCamp({progress,level,heroes,stage,onSave,onContinue,won=true}){
 const $=id=>document.getElementById(id);let shop='items';
 let people=$('campTalkPeople');if(!people){people=document.createElement('aside');people.id='campTalkPeople';people.className='story-people';people.setAttribute('aria-label','對話提及人物');$('campTalkText').after(people)}people.hidden=true;
 const panels=['campTalk','campShop','campRoster'];
 function openPanel(id){for(const panel of panels)$(panel).hidden=panel!==id;for(const button of document.querySelectorAll('.tent-floor button'))button.setAttribute('aria-pressed','false')}
 openPanel(null);for(const button of document.querySelectorAll('[data-talk]')){const d=heroes[button.dataset.talk];paintPortrait(button.querySelector('img'),d);button.querySelector('img').alt=d.name;button.querySelector('strong').textContent=d.name;button.querySelector('small').textContent='聊聊這一戰';}document.querySelector('.tent-banner').textContent=factionFor(level)==='sun'?'孫':factionFor(level)==='cao'?'曹':'義';
 let visitors=$('campVisitors');if(!visitors){visitors=document.createElement('button');visitors.id='campVisitors';visitors.className='quiet-button';visitors.textContent='探望鄉民與傷兵';$('campNarration').after(visitors)}visitors.hidden=level<11||!won;visitors.onclick=()=>{openPanel('campTalk');people.hidden=true;$('campTalkName').textContent='鄉民與傷兵';$('campTalkPortrait').hidden=true;$('campTalkText').textContent=level===16?'孩子已吃上熱粥，郎中正在替傷兵包紮。謝謝你們把大家平安帶回來。':'鄉民圍在營火旁，郎中替傷者包紮。先歇一歇，我們會彼此照應。';$('campTalkNext').textContent='回到營帳';$('campTalkNext').onclick=()=>openPanel(null)};
 $('campTitle').textContent=won?`${stage.name} · 歇馬整備`:'重整行裝，再來一次';$('campNarration').textContent=won?CAMP_LINES[level-1]:'先回營歇一歇。將士清點行囊，準備再試一次。';
 const finale=won&&(level===STAGES.length||chapterInfo(level+1).chapter!==chapterInfo(level).chapter),chapterLabel='第'+['','一','二','三','四','五','六','七','八','九','十','十一'][chapterInfo(level).chapter]+'章';
 document.querySelector('.camp-departure strong').textContent=finale?chapterLabel+'完成，聽聽戰後故事。':'整備好了，就繼續冒險！';
 $('campContinue').textContent=finale?chapterLabel+'尾聲 ➜':won?'繼續故事 ➜':'重新出戰 →';$('campContinue').onclick=onContinue;
 $('campMessage').textContent=(level>=17?'軍資與行囊共用；每位武將的兵器強化分開保存。':'')+'點一間攤位逛逛。購物可略過；兵器會自動裝備，道具可在戰鬥中使用。';
 function render(){
  $('campCoins').textContent=progress.coins;
  $('campInventory').textContent=`藥包 ${progress.inventory.herb} 包 · 糧袋 ${progress.inventory.grain} 袋。兵器強化自動裝備；出兵先駐守，點武將再點地面調動。`;
  for(const button of document.querySelectorAll('[data-shop]'))button.setAttribute('aria-pressed',String(!$('campShop').hidden&&button.dataset.shop===shop));
  $('shopTitle').textContent=shop==='items'?'行腳郎中 · 道具商':'爐火未熄 · 武器商';
  $('shopGoods').replaceChildren(...Object.entries(GOODS).filter(([,g])=>g.shop===shop&&!(factionFor(level)==='cao'&&shop==='weapons')).map(([id,g])=>{
   const card=document.createElement('article'),weapon=shop==='weapons',owned=weapon?weaponsForLevel(progress,level)[id]:progress.inventory[id],price=g.price*(weapon?owned+1:1),max=owned>=(weapon?3:9);
   card.className='goods-card';const icon=document.createElement('span');icon.className='goods-icon';icon.textContent=weapon&&level>=17?heroes[id].weapon.split('／')[0]:g.icon;const title=document.createElement('h4');title.textContent=weapon&&level>=17?heroes[id].name+'・兵器整備':g.name;const description=document.createElement('p');description.textContent=weapon&&level>=17?`${heroes[id].name}普攻每級 +${id==='liubei'?3:4}；最多三次，只強化這位武將。`:g.description;const stock=document.createElement('small');stock.textContent=weapon?`已強化 ${owned} / 3 次 · 購買後自動裝備`:`行囊 ${owned} / 9`;
   const button=document.createElement('button');button.className='gold-button';button.dataset.buy=id;button.textContent=max?'已滿':`購買 · ${price} 軍資`;button.disabled=max||progress.coins<price;button.onclick=()=>{const error=purchase(progress,id,onSave,level);$('campMessage').textContent=error||`${weapon&&level>=17?heroes[id].name+'兵器':g.name}已${weapon?'強化並裝備':'放入行囊'}！`;render()};card.append(icon,title,description,stock,button);return card;
  }));
  $('campHeroes').replaceChildren(...['liubei','guanyu','zhangfei'].map(key=>{const card=document.createElement('article');card.className='camp-hero';const img=document.createElement('img');paintPortrait(img,heroes[key]);img.alt=heroes[key].name;const text=document.createElement('div'),title=document.createElement('strong');title.textContent=`${heroes[key].name} · 兵器強化 ${weaponsForLevel(progress,level)[key]} / 3 · ${heroes[key].weapon||{liubei:'雙劍／近',guanyu:'大刀／近戰',zhangfei:'長矛／稍長'}[key]}`;const skills=document.createElement('p');skills.textContent='本關招式：'+(FACTION_SKILLS[factionFor(level)]?.[key]||HERO_SKILLS[key]).map(s=>`${s.level<=level?'✦':'🔒'} ${s.name}${s.level>level?`（第 ${s.level} 關）`:''}：${s.text}`).join(' ');text.append(title,skills);card.append(img,text);return card}));
  if(factionFor(level)==='cao')renderHeroCamp({progress,save:onSave,shop,refresh:render});
 }
 for(const button of document.querySelectorAll('[data-shop]'))button.onclick=()=>{shop=button.dataset.shop;openPanel('campShop');render();$('shopTitle').focus({preventScroll:true});$('campShop').scrollIntoView({block:'nearest'})};
 $('campShopBack').onclick=()=>{const trigger=document.querySelector(`[data-shop="${shop}"]`);openPanel(null);trigger?.focus({preventScroll:true})};
 $('campPrepare').onclick=()=>{openPanel('campRoster');$('campPrepare').setAttribute('aria-pressed','true');render();$('campRoster').querySelector('h3').focus({preventScroll:true});$('campRoster').scrollIntoView({block:'nearest'})};
 for(const button of document.querySelectorAll('[data-talk]'))button.onclick=()=>{
  const key=button.dataset.talk,lines=campConversation(level,key,won);let index=0;openPanel('campTalk');button.setAttribute('aria-pressed','true');
  function line(){$('campTalkPortrait').hidden=false;const parts=lines[index].split('：');const speaker=parts.length>1?Object.keys(heroes).find(k=>heroes[k].name===parts[0]):key;const person=heroes[speaker]||STORY_PEOPLE.find(p=>p.name===parts[0])||heroes[key];$('campTalkName').textContent=person.name;paintPortrait($('campTalkPortrait'),person);$('campTalkPortrait').alt=person.name;$('campTalkText').textContent=parts.length>1?parts.slice(1).join('：'):lines[index];renderPeople(people,$('campTalkText').textContent,person.name);$('campTalkNext').textContent=index===lines.length-1?'聊完了，回帳中':'接著聽 →'}
  $('campTalkNext').onclick=()=>{if(index<lines.length-1){index++;line()}else{openPanel(null);button.focus()}};line();$('campTalkNext').focus({preventScroll:true});$('campTalk').scrollIntoView({block:'nearest'});
 };render();
}
