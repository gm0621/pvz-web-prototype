import {campaignMapSvg,stageLocation,MAP_PLACES} from './campaign-map.mjs?v=history-coalition-1';
let cancelJourney=()=>{};
export function mountJourney(level,stage){
 cancelJourney();let root=document.getElementById('journeyIntro');
 if(!root){root=document.createElement('section');root.id='journeyIntro';root.className='journey-intro';root.setAttribute('aria-label','本回行軍路線');document.getElementById('novelPage').before(root)}
 const from=stage.originPlace?{...MAP_PLACES[stage.originPlace],place:stage.originPlace}:stageLocation(Math.max(1,level-1)),to=stageLocation(level),same=from.place===to.place;
 root.innerHTML='<div class="journey-heading"><div><small>義軍行程 · 地理位置示意</small><h3></h3><p></p></div><button type="button">略過行軍動畫 →</button></div><div class="journey-map"></div><small class="journey-caption"></small>';
 root.querySelector('.journey-heading small').textContent=(stage.faction==='cao'?'曹操軍':stage.faction==='sun'?'孫堅軍':'義軍')+'行程 · 地理位置示意';
 root.querySelector('h3').textContent=(stage.viewpointShift?'轉換視角 · ':'')+(same?`${to.name} · ${stage.place}`:`${from.name} → ${to.name}`);
 root.querySelector('p').textContent=stage.lead||`${same?'義軍繼續前往':'隊伍整裝出發，前往'}${stage.place}，${stage.name}。`;
 root.querySelector('.journey-caption').textContent=to.detail;root.querySelector('.journey-map').innerHTML=campaignMapSvg(level);
 const svg=root.querySelector('svg'),ns='http://www.w3.org/2000/svg',start={x:same?to.x-44:from.x,y:same?to.y+28:from.y},end={x:to.x,y:to.y};
 const trail=document.createElementNS(ns,'path');trail.setAttribute('d',`M${start.x} ${start.y} Q${(start.x+end.x)/2+24} ${(start.y+end.y)/2-20} ${end.x} ${end.y}`);trail.setAttribute('class','journey-trail');trail.setAttribute('pathLength','1');svg.append(trail);
 const army=document.createElementNS(ns,'g');army.setAttribute('class','journey-army');army.innerHTML='<circle r="15" fill="#214b3b" stroke="#ffe2a0" stroke-width="3"/><path d="M0 -6V-31L25 -25 0 -19" fill="#f5cb68" stroke="#7b5327"/><text y="5" text-anchor="middle" fill="#fff6da" font-size="13">義</text>';army.querySelector('text').textContent=stage.faction==='cao'?'曹':stage.faction==='sun'?'孫':'義';svg.append(army);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,length=trail.getTotalLength();let elapsed=0,last=performance.now(),id=0,stopped=false;
 root.dataset.arrived='false';
 function draw(p){const pt=trail.getPointAtLength(length*p);army.setAttribute('transform',`translate(${pt.x} ${pt.y})`);trail.style.strokeDashoffset=String(1-p);root.style.setProperty('--journey-progress',String(p))}
 function finish(){stopped=true;cancelAnimationFrame(id);draw(1);root.dataset.arrived='true';root.querySelector('button').textContent='已抵達 · 繼續讀故事 ↓';root.querySelector('button').onclick=()=>document.getElementById('novelPage').scrollIntoView({block:'start',behavior:reduced?'instant':'smooth'})}
 root.querySelector('button').onclick=finish;
 function frame(now){if(stopped)return;if(!document.hidden)elapsed+=Math.min(100,now-last);last=now;draw(reduced?1:Math.min(1,elapsed/3600));if(elapsed>=4200)finish();else id=requestAnimationFrame(frame)}
 draw(reduced?1:0);id=requestAnimationFrame(frame);cancelJourney=()=>{stopped=true;cancelAnimationFrame(id)};
}
