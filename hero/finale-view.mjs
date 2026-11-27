import {STORY_PEOPLE} from './characters.mjs?v=yuesui-wukou-taoxi-1';
import {paintPortrait} from './factions.mjs?v=yuesui-wukou-taoxi-1';

const recap=[
 {title:'桃園與黃巾',people:['劉備','關羽','張飛'],text:'故事從桃園的約定開始。劉備、關羽和張飛結伴踏上征途，在黃巾戰亂中互相照應。'},
 {title:'赤壁相助',people:['周瑜','諸葛亮'],text:'孫權和劉備聯手。周瑜率軍在赤壁迎戰，曹操退回北方。'},
 {title:'三國鼎立',people:['曹丕','劉備','孫權'],text:'魏、蜀、吳各有自己的地盤。曹丕、劉備和孫權各自領導一國。'},
 {title:'西晉建立',people:['司馬炎'],text:'司馬炎建立西晉，接掌了魏國的土地。蜀漢已亡，東吳仍守著長江。'},
 {title:'天下歸一',people:['王濬','孫皓'],text:'王濬的船隊抵達石頭城。孫皓投降，西晉統一天下。從桃園出發的故事，走到了終點。'}
];

export function mountFinale(root){
 const step=root.querySelector('#finaleStep');
 const card=root.querySelector('#finaleCard');
 const complete=root.querySelector('#finaleComplete');
 const heading=card.querySelector('h2');
 const faces=card.querySelector('.finale-portraits');
 const previous=root.querySelector('#finalePrevious');
 const next=root.querySelector('#finaleNext');
 let index=0;

 function showComplete(){
  step.hidden=true;
  complete.hidden=false;
  complete.querySelector('h2').focus();
 }
 function render(){
  const page=recap[index];
  heading.textContent=page.title;
  card.querySelector('p').textContent=page.text;
  card.querySelector('small').textContent=`${index+1} / ${recap.length}`;
  faces.replaceChildren(...page.people.map(name=>{
   const item=document.createElement('figure');
   const img=document.createElement('img');
   const caption=document.createElement('figcaption');
   img.alt='';
   paintPortrait(img,STORY_PEOPLE.find(person=>person.name===name));
   caption.textContent=name;
   item.append(img,caption);
   return item;
  }));
  previous.disabled=index===0;
  next.textContent=index===recap.length-1?'看通關紀念 →':'下一幕 →';
  heading.focus({preventScroll:true});
 }
 previous.onclick=()=>{index--;render()};
 next.onclick=()=>{if(index===recap.length-1)showComplete();else{index++;render()}};
 root.querySelector('#finaleSkip').onclick=showComplete;
 return {
  start(){index=0;complete.hidden=true;step.hidden=false;render()},
  complete:showComplete
 };
}
