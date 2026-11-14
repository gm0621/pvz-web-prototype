import {MASTER_STYLES} from './master-style.mjs?v=passive-feedback-1';
import {ALL_GENERALS} from './roster.mjs?v=passive-feedback-1';
import {paintPortrait} from './factions.mjs?v=passive-feedback-1';
import {hitSound} from './audio.mjs?v=passive-feedback-1';
const seen=new WeakMap();
const ring=(r)=>`<circle cx="150" cy="70" r="${r}"/>`;
const line=(x,y,x2,y2)=>`<path d="M${x} ${y}L${x2} ${y2}"/>`;
export function masterArtwork(motif){
 switch(motif){
 case 'blossom':return Array.from({length:8},(_,i)=>`<ellipse cx="150" cy="43" rx="12" ry="27" transform="rotate(${i*45} 150 70)"/>`).join('')+ring(12);
 case 'crescent':return '<path d="M30 110Q100 -20 275 35Q150 10 70 125Q130 55 240 52"/>';
 case 'quake':return [25,45,65].map(ring).join('')+'<path d="M15 115L75 90L95 115L135 85L165 120L200 95L280 120"/>';
 case 'banners':return [70,140,210].map(x=>`<path d="M${x} 125V20L${x+45} 32L${x} 62"/>`).join('');
 case 'lance':return '<path d="M5 105L235 45L225 30L290 32L245 70L245 52L5 115M40 75L185 35M65 130L220 90"/>';
 case 'wings':return '<path d="M150 120L120 65L20 25L45 70L110 95M150 120L180 65L280 25L255 70L190 95M150 120V25L180 45L150 85L120 45Z"/>';
 case 'fortress':return Array.from({length:8},(_,i)=>`<path d="M135 8L150 3L165 8V25L150 37L135 25Z" transform="rotate(${i*45} 150 70)"/>`).join('')+ring(26);
 case 'arrows':return [25,55,85,115].map((y,i)=>`<path d="M${10+i*12} ${y}H270M250 ${y-10}L270 ${y}L250 ${y+10}"/>`).join('');
 case 'grid':return [50,100,150,200,250].map(x=>line(x,20,x,120)).join('')+[30,70,110].map(y=>line(30,y,270,y)).join('');
 case 'claws':return [0,65,130].map(x=>`<path d="M${x+70} 5Q${x+20} 65 ${x+25} 130L${x+55} 85Z"/>`).join('');
 case 'chains':return Array.from({length:6},(_,i)=>`<ellipse cx="${40+i*44}" cy="${60+(i%2)*20}" rx="30" ry="16" transform="rotate(-25 ${40+i*44} ${60+(i%2)*20})"/>`).join('');
 case 'wall':return '<path d="M20 120V35H65V15H110V35H155V15H200V35H245V15H280V120ZM20 75H280M65 75V120M155 75V120M245 75V120"/>';
 default:return '';
 }
}
export function renderMasterCutin(b){
 let root=document.getElementById('masterCutin'),fx=document.getElementById('masterBurst');
 if(!root){root=document.createElement('aside');root.id='masterCutin';root.className='master-cutin';root.setAttribute('role','status');root.innerHTML='<div class="master-portrait"><img alt=""></div><div><small></small><strong></strong><span></span></div>';document.getElementById('battle').append(root);fx=document.createElement('div');fx.id='masterBurst';fx.className='master-burst';fx.setAttribute('aria-hidden','true');document.getElementById('field').append(fx)}
 const c=b?.masterCast,age=c?b.time-c.at:99,style=MASTER_STYLES[c?.heroId];
 root.hidden=fx.hidden=!style||b.over||!!b.duel||!!b.introPending||age>=1.65;
 if(root.hidden)return;
 if(seen.get(b)!==c){seen.set(b,c);root.dataset.hero=c.heroId;fx.dataset.motif=style.motif;paintPortrait(root.querySelector('img'),ALL_GENERALS[c.heroId]);root.querySelector('small').textContent=`${ALL_GENERALS[c.heroId].name} · Lv.${c.level} 奧義`;root.querySelector('strong').textContent=c.name;root.querySelector('span').textContent=style.tag;fx.innerHTML=`<svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMid meet">${masterArtwork(style.motif)}</svg>`;if(!b.paused)void hitSound('master-'+c.heroId)}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,p=Math.min(1,age/1.65),fade=Math.min(1,(1.65-age)/.3);
 for(const el of [root,fx]){el.style.setProperty('--master-color',style.color);el.style.opacity=String(fade)}
 root.style.transform=`translateX(${reduced?0:Math.max(0,1-age/.16)*-35}px)`;
 fx.style.top=`${(c.lane+.5)/(b.laneTotal||3)*100}%`;
 fx.style.transform=`translate(-50%,-50%) scale(${reduced?1:.65+p*.8}) rotate(${reduced?0:style.motif==='blossom'?p*45:style.motif==='crescent'?-15+p*30:0}deg)`;
 fx.querySelector('svg').style.strokeDashoffset=String(reduced?0:150*(1-Math.min(1,age/.45)));
}
