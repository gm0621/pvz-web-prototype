import {stagePeople,mapPersonSvg,renderMatchup} from './characters.mjs?v=chapter-nine-1';
import {campaignMapSvg,journeyRoute} from './campaign-map.mjs?v=chapter-nine-map-1';
let cancelJourney=()=>{};
export function mountJourney(level,stage){
 cancelJourney();let root=document.getElementById('journeyIntro');
 if(!root){root=document.createElement('section');root.id='journeyIntro';root.className='journey-intro';root.setAttribute('aria-label','本回行軍路線');document.getElementById('storyPrologue').prepend(root)}
 document.getElementById('storyPrologue').prepend(root);
 const {from,to,same,start,end,viewBox}=journeyRoute(level);
 root.innerHTML='<div class="journey-heading"><div><small>義軍行程 · 地理位置示意</small><h3></h3><p></p></div><button type="button">略過行軍動畫 →</button></div><div class="journey-map"></div><div class="journey-matchup map-matchup"></div><small class="journey-caption"></small>';
 root.querySelector('.journey-heading small').textContent=(stage.faction==='cao'?'曹操軍':stage.faction==='sun'?'孫堅軍':'義軍')+'行程 · 地理位置示意';
 root.querySelector('h3').textContent=(stage.viewpointShift?'轉換視角 · ':'')+(same?`${to.name} · ${stage.place}`:`${from.name} → ${to.name}`);
 root.querySelector('p').textContent=stage.lead||`${same?'義軍繼續前往':'隊伍整裝出發，前往'}${stage.place}，${stage.name}。`;
 root.querySelector('.journey-caption').textContent=to.detail;root.querySelector('.journey-map').innerHTML=campaignMapSvg(level);
 renderMatchup(root.querySelector('.journey-matchup'),level);
 const svg=root.querySelector('svg'),ns='http://www.w3.org/2000/svg';svg.setAttribute('viewBox',viewBox);
 const trail=document.createElementNS(ns,'path');trail.setAttribute('d',`M${start.x} ${start.y} Q${(start.x+end.x)/2+24} ${(start.y+end.y)/2-20} ${end.x} ${end.y}`);trail.setAttribute('class','journey-trail');trail.setAttribute('pathLength','1');svg.append(trail);
 svg.querySelector('.map-leader')?.remove();svg.insertAdjacentHTML('beforeend',mapPersonSvg(stagePeople(level).leader,'journey-army map-leader',start.x,start.y));const army=svg.querySelector('.journey-army');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,length=trail.getTotalLength();let elapsed=0,last=performance.now(),id=0,stopped=false;
 root.dataset.arrived='false';
 function draw(p){const pt=trail.getPointAtLength(length*p);army.setAttribute('transform',`translate(${pt.x} ${pt.y})`);trail.style.strokeDashoffset=String(1-p);root.style.setProperty('--journey-progress',String(p))}
 function finish(){stopped=true;cancelAnimationFrame(id);draw(1);root.dataset.arrived='true';root.querySelector('button').textContent='已抵達 · 繼續讀故事 ↓';root.querySelector('button').onclick=()=>document.getElementById('novelPage').scrollIntoView({block:'start',behavior:reduced?'instant':'smooth'})}
 root.querySelector('button').onclick=finish;
 function frame(now){if(stopped)return;if(!document.hidden)elapsed+=Math.min(100,now-last);last=now;draw(reduced?1:Math.min(1,elapsed/3600));if(elapsed>=4200)finish();else id=requestAnimationFrame(frame)}
 draw(reduced?1:0);if(reduced)finish();else id=requestAnimationFrame(frame);cancelJourney=()=>{stopped=true;cancelAnimationFrame(id)};
}
