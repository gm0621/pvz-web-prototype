// Ad-hoc balance probe: accelerated real battle ticks, legal costs/cooldowns,
// no enemy deletion, injected victory, inflated resources or altered combat HP.
const {chromium}=require('@playwright/test');
(async()=>{const browser=await chromium.launch();try{
 for(const level of [1,2])for(const faction of ['plants','zombies'])for(const seed of [7,42,99]){
  const page=await browser.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174/');
  const out=await page.evaluate(({faction,seed,level})=>{
   let rnd=seed;Math.random=()=>((rnd=rnd*48271%2147483647)/2147483647);
   playerProfile=normalizeProfile({});if(level===2)completeCampaignLevel(faction,1,2);markStoryRead(faction,level,'opening',2);chooseFaction(faction,2);startLevel(faction,level);clearInterval(timer);
   const originalRender=render,originalHUD=updateHUD;render=()=>{};updateHUD=()=>{};
   const can=key=>!isCooling(key)&&state.resource>=effectiveUnit(faction,key).cost;
   const placeUnit=(key,r,c)=>{if(can(key))deploySelected(key,r,c)};
   for(let n=0;n<6000&&!state.over;n++){
    if(faction==='plants'){
     const threatened=state.zombies.filter(z=>z.hp>0).sort((a,b)=>a.c-b.c).map(z=>z.r),rows=[...new Set([...threatened,0,1,2,3,4])];
     let missing=rows.find(r=>!state.plants.some(p=>p.type==='s2Crossbow'&&p.r===r));
     if(missing!==undefined&&state.time>5000)placeUnit('s2Crossbow',missing,1);
     const econ=state.plants.filter(p=>p.type==='s2Tuntian');
     if(econ.length<3&&(state.time<5000||missing===undefined||state.resource>=150)){
      const r=[2,0,4].find(r=>!plantAtCell(r,0));if(r!==undefined)placeUnit('s2Tuntian',r,0);
     }
     if(missing===undefined){for(const r of rows){if(!plantAtCell(r,2)){placeUnit('s2Crossbow',r,2);break}}}
     if(level===2&&missing===undefined){const row=threatened.find(r=>!plantAtCell(r,4));if(row!==undefined)placeUnit('s2Shield',row,4)}
    }else{
     const wave=level===2?['s2Coffin','s2Nail','s2Rat','s2Rat','s2Nail']:['s2Rat','s2Nail','s2Rat','s2Rat','s2Nail'],key=wave[(state.probeStep||0)%wave.length];
     if(can(key)){deploySelected(key,1,7);state.probeStep=(state.probeStep||0)+1}
    }
    tick();
   }
   render=originalRender;updateHUD=originalHUD;render();updateHUD();
   return {level,faction,seed,time:state.time,over:state.over,won:playerProfile.season2Progress[faction].highestLevel===level,boss:state.bossSpawned,spawned:state.enemiesSpawned,resource:state.resource,used:state.usedUnits[faction],remaining:{plants:state.plants.length,zombies:state.zombies.length}};
  },{faction,seed,level});console.log(JSON.stringify(out));await page.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
