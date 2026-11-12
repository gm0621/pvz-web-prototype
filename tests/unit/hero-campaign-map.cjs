const {test}=require('node:test');const assert=require('node:assert/strict');
const map=import('../../hero/campaign-map.mjs');
test('all campaign stages have explicit location notes and bounded map markers',async()=>{
 const {stageLocation,STAGE_LOCATIONS}=await map,{STAGES}=await import('../../hero/story.mjs');assert.equal(STAGE_LOCATIONS.length,STAGES.length);
 for(let level=1;level<=STAGES.length;level++){const p=stageLocation(level);assert.ok(p.x>30&&p.x<650&&p.y>30&&p.y<480);assert.ok(p.detail&&p.modern);assert.ok((await map).campaignMapSvg(level).includes(p.name));}
 for(const bad of [0,41,NaN,1.5])assert.throws(()=>stageLocation(bad),RangeError);
});
test('route follows story progression, merges local battles and includes return to Guangzong',async()=>{
 const {routeThrough,stageLocation}=await map;assert.deepEqual(routeThrough(4),['zhuo']);assert.deepEqual(routeThrough(6),['zhuo','qing']);assert.deepEqual(routeThrough(10),['zhuo','qing','guang','chang','road','guang']);assert.match(stageLocation(9).detail,/無確定坐標/);assert.match(stageLocation(3).detail,/非確定山址/);
});
test('opening map pauses battle; closing preserves pause and background interruptions',async t=>{
 const {mountCampaignMap}=await map,{STAGES}=await import('../../hero/story.mjs');const prev={document:global.document,window:global.window};t.after(()=>Object.assign(global,prev));
 const nodes=new Map(),docEvents={},winEvents={};function element(){return {style:{},listeners:{},textContent:'',innerHTML:'',disabled:false,open:false,setAttribute(){},replaceChildren(){},append(){},classList:{toggle(){}},focus(){},addEventListener(n,f){this.listeners[n]=f},showModal(){this.open=true},close(){this.open=false;this.listeners.close?.()}}}
 global.document={hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},createElement:element,addEventListener(n,f){docEvents[n]=f}};global.window={addEventListener(n,f){winEvents[n]=f}};
 const battle={level:1,paused:false},control=mountCampaignMap({stages:STAGES,getBattle:()=>battle,setPaused:value=>battle.paused=value});control.update(battle);
 const button=document.getElementById('battleMapButton'),dialog=document.getElementById('campaignMapDialog');button.onclick();assert.equal(battle.paused,true);dialog.listeners.close();assert.equal(battle.paused,true,'fullscreen reopens the modal before its queued close event');dialog.close();assert.equal(battle.paused,false);
 battle.paused=true;button.onclick();dialog.close();assert.equal(battle.paused,true);
 battle.paused=false;button.onclick();document.hidden=true;docEvents.visibilitychange();document.hidden=false;dialog.close();assert.equal(battle.paused,true);
 battle.paused=false;button.onclick();winEvents.pagehide();dialog.close();assert.equal(battle.paused,true);
 battle.duel={};control.update(battle);assert.equal(button.disabled,true);button.onclick();assert.equal(dialog.open,false);
});
test('all travel segments use the previous location, except explicit faction origins; zoom contains both markers',async()=>{
 const {journeyRoute,stageLocation}=await map;for(let level=1;level<=22;level++){
  const r=journeyRoute(level),[x,y,w,h]=r.viewBox.split(' ').map(Number);assert.equal(r.to.place,stageLocation(level).place);assert.equal(r.from.place,level===17?'luoyang':level===20?'luyang':stageLocation(Math.max(1,level-1)).place);
  for(const p of [r.start,r.end,{x:r.to.x+36,y:r.to.y-44}]){assert.ok(p.x-29>=x&&p.x+29<=x+w,`level ${level} horizontal marker`);assert.ok(p.y-29>=y&&p.y+49<=y+h,`level ${level} vertical marker`)}
 }
});
