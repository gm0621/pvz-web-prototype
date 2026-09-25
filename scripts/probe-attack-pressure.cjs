// Seeded legal-deployment sample, not a human win-rate estimate. Real engine and simulated timer callbacks.
const {chromium}=require('@playwright/test');
(async()=>{const browser=await chromium.launch();try{
 for(const level of [1,5,8,9,10])for(const seed of [7,42])for(const strategy of ['spread-cheap','focused-mixed']){
  const page=await browser.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto(process.env.GAME_URL||'http://127.0.0.1:4174/');
  const out=await page.evaluate(({level,seed,strategy})=>{
   let rng=seed;Math.random=()=>((rng=rng*48271%2147483647)/2147483647);playerProfile=defaultProfile();currentSeason=1;currentUser=null;
   for(let n=1;n<=10;n++)completeCampaignLevel('plants',n,1);for(let n=1;n<level;n++)completeCampaignLevel('zombies',n,1);
   chooseFaction('zombies',1);selectedLevel=level;start('zombies');clearInterval(timer);
   // Execute mower interval and effect cleanup against the same accelerated clock; no permanent active mower artifact.
   let clock=0,serial=0;const tasks=new Map();
   window.setTimeout=(fn,ms=0,...args)=>{const id=++serial;tasks.set(id,{fn:()=>fn(...args),due:clock+ms,interval:0});return id};
   window.setInterval=(fn,ms=0,...args)=>{const id=++serial;tasks.set(id,{fn:()=>fn(...args),due:clock+ms,interval:Math.max(1,ms)});return id};
   window.clearTimeout=window.clearInterval=id=>tasks.delete(id);
   const advance=to=>{let next;while((next=[...tasks].filter(([,t])=>t.due<=to).sort((a,b)=>a[1].due-b[1].due)[0])){const[id,t]=next;clock=t.due;if(t.interval)t.due+=t.interval;else tasks.delete(id);t.fn()}clock=to};
   render=()=>{};updateHUD=()=>{};persistBattleState=()=>{};let won=null;const finish=end;end=(win,...rest)=>{won=win;return finish(win,...rest)};
   const can=k=>canUseUnit('zombies',k,level)&&!isCooling(k)&&state.resource>=ZOMBIE_TYPES[k].cost;
   let step=0,spent=0;
   const lane=Array.from({length:ROWS},(_,r)=>({r,hp:state.plants.filter(p=>p.r===r).reduce((sum,p)=>sum+p.hp,0)})).sort((a,b)=>a.hp-b.hp)[0].r;
   const order=(level>=9?['corpseTitan','fireCatapult','normal','football','bucket','normal']:level>=5?['bucket','football','normal','peaZombie','cone']:['cone','normal','normal']).filter(k=>canUseUnit('zombies',k,level));
   for(let frame=0;frame<6000&&!state.over;frame++){
    const key=strategy==='spread-cheap'?'normal':order[step%order.length];
    if(can(key)){const before=state.resource;deploySelected(key,strategy==='spread-cheap'?step%ROWS:lane,7);if(state.resource<before){spent+=before-state.resource;step++}}
    tick();advance(state.time);
   }
   return {level,seed,strategy,won,seconds:state.time/1000,deployments:step,spent,brain:state.resource,mowersUsed:state.lawnmowers.filter(m=>m.used).length};
  },{level,seed,strategy});console.log(JSON.stringify(out));await page.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
