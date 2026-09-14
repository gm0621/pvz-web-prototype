// Legal-deployment balance sample, not a guarantee of all-level human balance.
const {chromium}=require('@playwright/test');
(async()=>{const browser=await chromium.launch();try{
for(const season of (process.env.PROBE_LATE?[1]:[1,2]))for(const level of (process.env.PROBE_LATE?[10]:season===1?[1,6,10]:[1,2]))for(const seed of [7,42])for(const waves of [false,true]){
 const page=await browser.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));await page.goto(process.env.GAME_URL||'http://127.0.0.1:4173/');
 const out=await page.evaluate(({season,level,seed,waves})=>{
  let rnd=seed;Math.random=()=>((rnd=rnd*48271%2147483647)/2147483647);currentSeason=season;
  for(let l=1;l<level;l++)completeCampaignLevel('plants',l,season);saveProfile();selectedLevel=level;start('plants');clearInterval(timer);if(!waves)delete state.waveDirector;
  const draw=render,hud=updateHUD,finish=end,add=addZombie;let won=null,peak=0;const arrivals=[];
  render=()=>{};updateHUD=()=>{};end=(win,...args)=>{won=win;return finish(win,...args)};
  addZombie=(k,c,r)=>{arrivals.push(state.time);return add(k,c,r)};
  const econ=season===1?'sunflower':'s2Tuntian',bow=season===1?'peashooter':'s2Crossbow',shield=season===1?'wallnut':'s2Shield';
  const put=(key,r,c)=>{if(canUseUnit('plants',key,level)&&!plantAtCell(r,c)&&!isCooling(key)&&state.resource>=effectiveUnit('plants',key).cost)deploySelected(key,r,c)};
  for(let n=0;n<9000&&!state.over;n++){
   const danger=state.zombies.filter(z=>z.hp>0).sort((a,b)=>a.c-b.c),rows=[...new Set([...danger.map(z=>z.r),0,1,2,3,4])];
   const missing=rows.find(r=>!state.plants.some(p=>p.r===r&&[bow,'firepea','zhaoyun'].includes(p.type)));
   if(missing!==undefined&&state.time>5000)put(bow,missing,1);
   if(state.plants.filter(p=>p.type===econ).length<(season===1&&level>=6?5:3)&&(state.time<5000||missing===undefined||state.resource>=150)){const r=[2,0,4,1,3].find(r=>!plantAtCell(r,0));if(r!==undefined)put(econ,r,0)}
   if(missing===undefined){
    for(const r of rows){if(!plantAtCell(r,2)){put(season===1&&level>=6&&[1,2,3].includes(r)?'huangzhong':season===1&&level>=2?'firepea':bow,r,2);break}}
    if(season===1&&level>=3)for(const r of rows){if(!plantAtCell(r,3)){put('zhaoyun',r,3);break}}
    const r=danger.find(z=>z.c<6&&!plantAtCell(z.r,5))?.r;if(r!==undefined)put(shield,r,5);
   }
   if(season===1&&level>=9&&danger.filter(z=>z.c<6).length>=7)put('kongming',2,4);
   if(season===1&&level>=4&&danger.filter(z=>z.c<5).length>=5)put('pangtong',2,4);
   tick();peak=Math.max(peak,state.zombies.length);
  }
  render=draw;updateHUD=hud;end=finish;addZombie=add;render();updateHUD();
  return{season,level,seed,waves,won,seconds:state.time/1000,spawned:state.enemiesSpawned,peak,fastGaps:arrivals.filter((t,i)=>i&&t-arrivals[i-1]<4000).length,food:state.resource};
 },{season,level,seed,waves});console.log(JSON.stringify(out));await page.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
