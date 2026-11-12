import {enemyPortrait,paintPortrait} from './factions.mjs?v=chapter-six-1';
import {bossProfile} from './engine.mjs?v=six-audit-1';
import {enemyArt} from './story.mjs?v=chapter-six-1';
import {hitSound} from './audio.mjs?v=history-coalition-1';
const seen=new WeakMap();
const label=(root,selector,text)=>{const node=root.querySelector(selector);if(node.textContent!==text)node.textContent=text};
const clamp=n=>Math.max(0,Math.min(1,n));
export function renderBossCutin(b){
 let root=document.getElementById('bossCutin');
 if(!root){root=document.createElement('aside');root.id='bossCutin';root.className='boss-cutin';root.hidden=true;root.setAttribute('role','status');root.setAttribute('aria-live','polite');root.innerHTML='<div class="boss-cutin-rays" aria-hidden="true"></div><img alt="" class="boss-cutin-portrait"><div class="boss-cutin-copy"><small>敵將出招 · 留意路線</small><span class="boss-cutin-name"></span><strong class="boss-cutin-skill"></strong><p></p></div>';document.getElementById('battle').append(root)}
 if(!b||b.over||b.duel||b.introPending){root.hidden=true;return}
 const casts=b.enemies.filter(e=>e.boss&&e.hp>0&&e.castAt&&e.castAt>b.time);
 const recent=casts.filter(e=>b.time-(e.castStartedAt??-100)<.85).sort((a,c)=>c.castStartedAt-a.castStartedAt);
 if(!recent.length){root.hidden=true;return}
 const enemy=recent[0],profile=bossProfile(b,enemy),key=`${enemy.id}:${enemy.castAt}`,age=b.time-enemy.castStartedAt;
 let stamps=seen.get(b);if(!stamps){stamps=new Map();seen.set(b,stamps)}
 if(!b.paused){const fresh=recent.some(e=>stamps.get(e.id)!==e.castAt);for(const e of recent)stamps.set(e.id,e.castAt);if(fresh)void hitSound(`warning-${profile.skillType||'strike'}`)}
 root.hidden=false;root.dataset.kind=profile.skillType||'strike';root.dataset.cast=key;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,p=clamp(age/.85),enter=reduced?1:clamp(age/.12),leave=reduced?1:clamp((.85-age)/.16);
 root.style.setProperty('--cutin-opacity',String(Math.min(enter,leave)));root.style.setProperty('--cutin-slide',`${reduced?0:(1-enter)*-45}px`);root.style.setProperty('--portrait-zoom',String(reduced?1:1+p*.06));root.style.setProperty('--ray-shift',`${reduced?0:p*80}px`);
 if(root.querySelector('img').dataset.name!==enemy.name){const img=root.querySelector('img');img.dataset.name=enemy.name;paintPortrait(img,enemyPortrait(enemy.name,b.level)||{asset:enemyArt(enemy.name)})}
 label(root,'.boss-cutin-name',enemy.name);label(root,'.boss-cutin-skill',profile.skillName);
 const lanes=[...new Set(casts.flatMap(e=>e.castLanes||[e.lane]))].sort().map(l=>['上','中','下'][l]+'路').join('、');
 label(root,'p',`${lanes}預警 · ${profile.skillType==='rally'?'敵軍即將強化':'換路閃避！'}`+(casts.length>1?`（${casts.filter(e=>e!==enemy).map(e=>e.name).join('、')}也在蓄力）`:''));
}
