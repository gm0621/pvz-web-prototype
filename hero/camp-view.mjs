import {campConversation} from './camp-talk.mjs?v=chapter-camp-2';
import {GOODS,purchase} from './campaign.mjs?v=novel-camp-1';
import {CAMP_LINES} from './novel.mjs?v=novel-camp-1';
import {HERO_SKILLS} from './skills.mjs?v=novel-camp-1';
export function mountCamp({progress,level,heroes,stage,onSave,onContinue,won=true}){
 const $=id=>document.getElementById(id);let shop='items';
 const panels=['campTalk','campShop','campRoster'];
 function openPanel(id){for(const panel of panels)$(panel).hidden=panel!==id;for(const button of document.querySelectorAll('.tent-floor button'))button.setAttribute('aria-pressed','false')}
 openPanel(null);
 $('campTitle').textContent=won?`${stage.name} · 歇馬整備`:'重整行裝，再來一次';$('campNarration').textContent=won?CAMP_LINES[level-1]:'先回營歇一歇。三兄弟清點行囊，準備再試一次。';
 $('campContinue').textContent=won?'繼續故事 ➜':'重新出戰 →';$('campContinue').onclick=onContinue;
 $('campMessage').textContent='點一間攤位逛逛。購物可略過；兵器會自動裝備，道具可在戰鬥中使用。';
 function render(){
  $('campCoins').textContent=progress.coins;
  $('campInventory').textContent=`藥包 ${progress.inventory.herb} 包 · 糧袋 ${progress.inventory.grain} 袋。兵器強化自動裝備；出兵先駐守，點武將再點地面調動。`;
  for(const button of document.querySelectorAll('[data-shop]'))button.setAttribute('aria-pressed',String(!$('campShop').hidden&&button.dataset.shop===shop));
  $('shopTitle').textContent=shop==='items'?'行腳郎中 · 道具商':'爐火未熄 · 武器商';
  $('shopGoods').replaceChildren(...Object.entries(GOODS).filter(([,g])=>g.shop===shop).map(([id,g])=>{
   const card=document.createElement('article'),weapon=shop==='weapons',owned=weapon?progress.weapons[id]:progress.inventory[id],price=g.price*(weapon?owned+1:1),max=owned>=(weapon?3:9);
   card.className='goods-card';const icon=document.createElement('span');icon.className='goods-icon';icon.textContent=g.icon;const title=document.createElement('h4');title.textContent=g.name;const description=document.createElement('p');description.textContent=g.description;const stock=document.createElement('small');stock.textContent=weapon?`已強化 ${owned} / 3 次 · 購買後自動裝備`:`行囊 ${owned} / 9`;
   const button=document.createElement('button');button.className='gold-button';button.dataset.buy=id;button.textContent=max?'已滿':`購買 · ${price} 軍資`;button.disabled=max||progress.coins<price;button.onclick=()=>{const error=purchase(progress,id);$('campMessage').textContent=error||`${g.name}已${weapon?'強化並裝備':'放入行囊'}！`;if(!error)onSave();render()};card.append(icon,title,description,stock,button);return card;
  }));
  $('campHeroes').replaceChildren(...['liubei','guanyu','zhangfei'].map(key=>{const card=document.createElement('article');card.className='camp-hero';const img=document.createElement('img');img.src=heroes[key].asset;img.alt=heroes[key].name;const text=document.createElement('div'),title=document.createElement('strong');title.textContent=`${heroes[key].name} · 兵器強化 ${progress.weapons[key]} / 3 · ${{liubei:'雙劍／近',guanyu:'大刀／近戰',zhangfei:'長矛／稍長'}[key]}`;const skills=document.createElement('p');skills.textContent=HERO_SKILLS[key].map(s=>`${s.level<=Math.max(1,progress.completed+1)?'✦':'🔒'} ${s.name}${s.level>progress.completed+1?`（第 ${s.level} 關）`:''}：${s.text}`).join(' ');text.append(title,skills);card.append(img,text);return card}));
 }
 for(const button of document.querySelectorAll('[data-shop]'))button.onclick=()=>{shop=button.dataset.shop;openPanel('campShop');render();$('shopTitle').focus({preventScroll:true});$('campShop').scrollIntoView({block:'nearest'})};
 $('campShopBack').onclick=()=>{const trigger=document.querySelector(`[data-shop="${shop}"]`);openPanel(null);trigger?.focus({preventScroll:true})};
 $('campPrepare').onclick=()=>{openPanel('campRoster');$('campPrepare').setAttribute('aria-pressed','true');render();$('campRoster').querySelector('h3').focus({preventScroll:true});$('campRoster').scrollIntoView({block:'nearest'})};
 for(const button of document.querySelectorAll('[data-talk]'))button.onclick=()=>{
  const key=button.dataset.talk,lines=campConversation(level,key,won);let index=0;openPanel('campTalk');button.setAttribute('aria-pressed','true');
  function line(){const parts=lines[index].split('：');const speaker=parts.length>1?Object.keys(heroes).find(k=>heroes[k].name===parts[0]):key;const person=heroes[speaker]||heroes[key];$('campTalkName').textContent=person.name;$('campTalkPortrait').src=person.asset;$('campTalkText').textContent=parts.length>1?parts.slice(1).join('：'):lines[index];$('campTalkNext').textContent=index===lines.length-1?'聊完了，回帳中':'接著聽 →'}
  $('campTalkNext').onclick=()=>{if(index<lines.length-1){index++;line()}else{openPanel(null);button.focus()}};line();$('campTalkNext').focus({preventScroll:true});$('campTalk').scrollIntoView({block:'nearest'});
 };render();
}
