import {skillPresentation,skillArtwork} from './skill-presentation.mjs?v=skill-tiers-1';
import {ALL_GENERALS} from './roster.mjs?v=skill-tiers-1';
import {paintPortrait} from './factions.mjs?v=skill-tiers-1';
import {hitSound} from './audio.mjs?v=skill-tiers-1';
const seen=new WeakMap();
export function renderSkillCutin(b){
 let root=document.getElementById('skillCutin'),fx=document.getElementById('skillBurst');
 if(!root){root=document.createElement('aside');root.id='skillCutin';root.className='skill-cutin';root.setAttribute('role','status');root.innerHTML='<img alt=""><div><small></small><strong></strong></div>';document.getElementById('battle').append(root);fx=document.createElement('div');fx.id='skillBurst';fx.className='skill-burst';fx.setAttribute('aria-hidden','true');document.getElementById('field').append(fx)}
 const c=b?.skillCast,style=c&&skillPresentation(c.heroId,c.index),age=c?b.time-c.at:99;
 root.hidden=fx.hidden=!style||b.over||!!b.duel||!!b.introPending||age>=style.duration;
 if(root.hidden)return;
 if(seen.get(b)!==c){seen.set(b,c);root.dataset.hero=c.heroId;root.dataset.tier=fx.dataset.tier=style.tier;fx.dataset.motif=style.motif;paintPortrait(root.querySelector('img'),ALL_GENERALS[c.heroId]);root.querySelector('small').textContent=`${ALL_GENERALS[c.heroId].name} · Lv.${style.tier} 技能`;root.querySelector('strong').textContent=c.name;fx.innerHTML=`<svg viewBox="0 0 300 140">${skillArtwork(style.motif)}</svg>`;if(!b.paused)void hitSound(`skill-${c.heroId}-${c.index}`)}
 // A newer ultimate owns the visual foreground; quick early casts still sound once.
 if(b.masterCast&&b.time-b.masterCast.at<1.65){root.hidden=fx.hidden=true;return}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,p=Math.min(1,age/style.duration);
 for(const el of [root,fx]){el.style.setProperty('--skill-color',style.color);el.style.opacity=String(Math.min(1,(style.duration-age)/.18))}
 fx.style.top=`${(c.lane+.5)/(b.laneTotal||3)*100}%`;fx.style.left=`${Math.max(.22,Math.min(.78,c.x+.08))*100}%`;
 fx.style.transform=`translate(-50%,-50%) scale(${reduced?1:.75+p*.35})`;
 fx.querySelector('svg').style.strokeDashoffset=String(reduced?0:120*(1-Math.min(1,p*3)));
}
