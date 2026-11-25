import {mapPersonSvg} from './characters.mjs?v=chapter-twenty-one-3';

const viewBox='0 0 400 304';

export function routeInset(from,to){
 const dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy)||1;
 const horizontal=112*dx/distance,vertical=43*dy/distance;
 const origin={x:200-horizontal,y:111-vertical},destination={x:200+horizontal,y:111+vertical};
 const marker=point=>({x:point.x,y:point.y-34});
 return {origin,destination,start:marker(origin),end:marker(destination),viewBox};
}

function location(point,name,goal,side){
 const labelX=side?Math.max(67,Math.min(333,point.x+side*97))-point.x:0;
 const labelY=side?2:17;
 return `<g class="map-city route-inset-stop ${goal?'current':'visited'}" transform="translate(${point.x} ${point.y})">
 <circle r="${goal?11:9}"/>
 <g transform="translate(${labelX} ${labelY})">
  <rect x="-59" width="118" height="58" rx="10"/>
  <text class="route-inset-role" y="20" text-anchor="middle">${goal?'終點':'起點'}</text>
  <text class="route-inset-place" y="46" text-anchor="middle">${name}</text>
 </g></g>`;
}

// This inset preserves bearings and emphasises the active route. Spacing is schematic.
export function routeInsetSvg(from,to,people,showOpponent,mini){
 const {origin,destination,end}=routeInset(from,to);
 const angle=Math.atan2(destination.y-origin.y,destination.x-origin.x)*180/Math.PI;
 const split=Math.abs(destination.x-origin.x)<150?Math.sign(destination.x-origin.x)||1:0;
 const line=`M${origin.x} ${origin.y}L${destination.x} ${destination.y}`;
 return `<svg class="route-inset" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" ${mini?'aria-hidden="true"':`role="img" aria-label="${from.name}到${to.name}的行軍方位示意"`}>
 <rect class="route-inset-paper" width="400" height="304" rx="14"/>
 <path class="route-inset-ridge" d="M0 62Q45 25 80 57T152 43 231 47 316 31 400 66V0H0Z M0 140Q45 146 74 179T167 196Q142 225 84 230H0Z M270 222Q293 183 337 171T400 137V230H270Z"/>
 <g class="route-inset-contours" fill="none">
  <path d="M0 55Q43 7 88 44T163 30 236 33 319 15 400 52 M0 43Q45 -4 95 31T169 17 238 20 320 2 400 38"/>
  <path d="M0 158Q49 162 71 190T149 219 M0 174Q49 177 58 200T116 229 M280 232Q290 200 328 188T400 157 M303 232Q315 205 349 200T400 176"/>
  <path d="M320 67l10-13 10 13m-2 0 12-19 15 21M45 116l10-13 10 13m-1 0 12-18 14 18"/>
 </g>
 <rect class="route-inset-frame" x="8" y="8" width="384" height="288" rx="9"/>
 ${mini?'':`<g class="route-inset-compass" transform="translate(29 34)"><path d="M0-13 6 3 0 0-6 3Z"/><text y="17" text-anchor="middle">北</text></g>`}
 <path class="route-inset-road-edge" d="${line}"/><path class="route-inset-road" d="${line}"/>
 <g transform="translate(200 111) rotate(${angle})">
  <circle class="route-inset-direction" r="${mini?12:18}"/>
  <path class="route-inset-arrow" d="M-10 0H9M2-7 9 0 2 7"/>
 </g>
 ${mini?`<circle class="route-inset-arrival" cx="${destination.x}" cy="${destination.y}" r="12"/>`:`${location(origin,from.name,false,-split)}${location(destination,to.name,true,split)}
 <path class="route-inset-divider" d="M20 243H380"/>
 <text class="route-inset-side" x="24" y="269">我軍</text>
 <text class="route-inset-army-name" x="24" y="291">${people.leader.name}</text>
 ${showOpponent?`<text class="route-inset-opponent-role" x="283" y="266">對陣</text>${mapPersonSvg(people.opponent,'map-opponent',251,271)}`:''}
 ${mapPersonSvg(people.leader,'map-leader',end.x,end.y)}`}
 </svg>`;
}
