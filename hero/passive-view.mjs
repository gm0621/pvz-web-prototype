export function renderPassiveFeedback(b){
 let root=document.getElementById('passiveFeedback');if(!root){root=document.createElement('div');root.id='passiveFeedback';root.setAttribute('aria-hidden','true');document.getElementById('field').append(root)}
 root.hidden=b.over||!!b.duel||!!b.introPending;const existing=new Map([...root.children].map(n=>[n.dataset.unit,n])),ids=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const latest=new Map();for(const u of b.allies)if(u.hp>0&&u.passiveNotice&&b.time-u.passiveNotice.at<1.5){const previous=latest.get(u.lane);if(!previous||u.passiveNotice.at>=previous.passiveNotice.at)latest.set(u.lane,u)}
 for(const u of latest.values()){const p=u.passiveNotice,age=p?b.time-p.at:99;if(age>=1.5||u.hp<=0)continue;const id=String(u.id);ids.add(id);let node=existing.get(id);if(!node){node=document.createElement('span');node.className='passive-cue';node.dataset.unit=id;root.append(node)}node.dataset.kind=p.kind;node.textContent=({ready:'✦ ',heal:'✚ ',food:'糧 ',guard:'◇ ',mp:'✧ ',boost:'✦ '})[p.kind]+p.text;
 // Clamp to the field; the notice follows its general during a lane change.
 node.style.left=`${Math.max(.28,Math.min(.72,u.x))*100}%`;node.style.top=`max(68px, ${(u.lane+.5)/(b.laneTotal||3)*100}%)`;node.style.transform=`translate(-50%,calc(-100% - ${reduced?20:20+age*7}px))`;node.style.opacity=String(Math.min(1,(1.5-age)/.3));
 }
 for(const [id,node] of existing)if(!ids.has(id))node.remove();
}
