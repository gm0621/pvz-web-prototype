const {test,expect}=require('@playwright/test');

async function open(page){
 await page.goto('/?season2-balance=1');
 await page.waitForFunction(()=>typeof deploySelected==='function'&&typeof actSeason2Plants==='function');
}

test('fixed-seed legal season-two deployments provide stable early mid and finale baselines',async({page})=>{
 test.setTimeout(120000);
 await open(page);
 const report=await page.evaluate(()=>{
  render=()=>{};updateHUD=()=>{};persistBattleState=()=>{};
  const completedThrough=level=>Object.fromEntries(Array.from({length:Math.max(0,level-1)},(_,index)=>[index+1,1]));
  const formationFor=(faction,level)=>{
   if(faction==='plants'){
    if(level===1)return [['s2Tuntian',0,2],...Array.from({length:5},(_,row)=>['s2Crossbow',2,row])];
    if(level===5)return [['s2Tuntian',0,2],['s2Tuntian',0,0],...Array.from({length:5},(_,row)=>['s2Crossbow',2,row]),...Array.from({length:5},(_,row)=>['s2Shield',6,row]),['s2DianWei',5,1],['s2DianWei',5,3],['s2Xiahou',4,2],['s2Halberd',3,0],['s2Halberd',3,4]];
    return [['s2Tuntian',0,2],['s2Tuntian',0,0],...Array.from({length:5},(_,row)=>['s2Crossbow',2,row]),...Array.from({length:5},(_,row)=>['s2Shield',6,row]),['s2DianWei',5,1],['s2DianWei',5,3],['s2ZhangLiao',4,2],['s2XuHuang',4,0],['s2XuHuang',4,4],['s2GuoJia',1,1],['s2SimaYi',1,3]];
   }
   if(level===1)return [['s2Nail',2],['s2Rat',2],['s2Rat',1],['s2Rat',3],['s2Nail',1],['s2Nail',3]];
   if(level===5)return [['s2Hook',2],['s2Cleaver',2],['s2Smoke',2],['s2Rat',2],['s2Coffin',2],['s2Nail',2],['s2Rat',1],['s2Rat',3],['s2Coffin',1],['s2Coffin',3]];
   return [['s2Coffin',2],['s2Medic',2],['s2Ram',2],['s2Hexer',2],['s2Venom',2],['s2Smoke',2],['s2Decoy',2],['s2Hook',2],['s2Nail',1],['s2Nail',3],['s2Rat',1],['s2Rat',3]];
  };
  const run=(faction,level,seedValue)=>{
   let seed=seedValue;Math.random=()=>{seed=(seed*1664525+0x3c6ef35f)>>>0;return seed/4294967296};
   const prior=completedThrough(level),highest=Math.max(0,level-1),season1=Object.fromEntries(Array.from({length:10},(_,index)=>[index+1,1]));
   playerProfile=normalizeProfile({campaignProgress:{plants:{highestLevel:10,completedLevels:season1},zombies:{highestLevel:10,completedLevels:season1}},season2Progress:{plants:{highestLevel:highest,completedLevels:prior},zombies:{highestLevel:highest,completedLevels:prior}}});
   currentSeason=2;currentFaction=faction;selectedLevel=level;start(faction,{difficulty:'medium'});clearInterval(timer);state.paused=false;
   const plan=formationFor(faction,level),deployed=[],rejected=[];
   for(let step=0;step<9000&&!state.over;step++){
    if(state.time%500===0){
     const laneTieOrder=[2,0,4,1,3],entries=faction==='plants'?[...plan].sort((left,right)=>{
      const score=entry=>{const row=entry[2],enemies=state.zombies.filter(unit=>unit.hp>0&&unit.r===row),nearest=enemies.length?Math.min(...enemies.map(unit=>unit.c)):9;return enemies.length*20+(9-nearest)*20+(state.lawnmowers[row].used?50:0)};
      return score(right)-score(left)||laneTieOrder.indexOf(left[2])-laneTieOrder.indexOf(right[2]);
     }):plan;
     for(const entry of entries){
      const [type,a,b]=entry,row=faction==='plants'?b:a,col=faction==='plants'?a:7;
      if(faction==='plants'&&state.plants.some(unit=>unit.hp>0&&unit.type===type&&unit.r===row&&Math.round(unit.c)===col))continue;
      const ready=deploymentReadyReason(type),cell=deploymentCellReason(row,col);if(ready||cell)continue;
      const before=state.resource;if(deploySelected(type,row,col))deployed.push({type,row,col,at:state.time,cost:before-state.resource});else rejected.push({type,row,col,at:state.time});
     }
    }
    tick();
   }
   const outcome=[...(state.gameplay?.telemetry?.events||[])].reverse().find(event=>event.type==='outcome');
   return {faction,level,seed:seedValue,over:state.over,won:outcome?.win??null,paused:state.paused,time:state.time,deployed:deployed.length,rejected:rejected.length,resource:Math.floor(state.resource),mowersUsed:state.lawnmowers.filter(item=>item.used).length,plantsAlive:state.plants.filter(unit=>unit.hp>0).length,zombiesAlive:state.zombies.filter(unit=>unit.hp>0).length,damage:state.gameplay.telemetry.totals.damageDealt,control:state.gameplay.telemetry.totals.controlDuration};
  };
  return [1,5,10].flatMap(level=>['plants','zombies'].flatMap(faction=>[run(faction,level,20261028),run(faction,level,20261028)]));
 });
 console.log('SEASON2_BASELINE '+JSON.stringify(report));
 expect(report).toHaveLength(12);
 expect(report.every(row=>row.rejected===0),JSON.stringify(report)).toBe(true);
 expect(report.every(row=>row.deployed>0),JSON.stringify(report)).toBe(true);
 expect(report.every(row=>row.over&&row.won&&!row.paused),JSON.stringify(report)).toBe(true);
 expect(report.filter(row=>row.faction==='plants').every(row=>row.time<=300000),JSON.stringify(report)).toBe(true);
 expect(report.filter(row=>row.faction==='zombies').every(row=>row.time<=60000),JSON.stringify(report)).toBe(true);
 expect(report.filter(row=>row.faction==='plants'&&row.level===10).every(row=>row.mowersUsed<=2),JSON.stringify(report)).toBe(true);
 for(let index=0;index<report.length;index+=2){const [a,b]=report.slice(index,index+2);expect({...b,seed:a.seed}).toEqual({...a,seed:a.seed})}
});
