const {test,expect}=require('@playwright/test');

async function openApp(page){
 await page.addInitScript(()=>{const read={};for(const side of ['plants','zombies'])for(let level=1;level<=10;level++)for(const scene of ['opening','victory','defeat'])read[`${side}:${level}:${scene}`]=true;localStorage.setItem('sgzStoryRead_v1',JSON.stringify(read));});
 for(let attempt=0;attempt<3;attempt++){
  await page.goto('/?qin-boss-test=1');
  try{await page.waitForFunction(()=>typeof normalizeProfile==='function'&&typeof isQinBossUnlocked==='function'&&typeof campaignLevels==='function'&&typeof start==='function'&&typeof LEVELS==='object'&&!!LEVELS[11]&&typeof ZOMBIE_TYPES==='object',null,{timeout:5000});break}
  catch(error){if(attempt===2)throw error}
 }
 await expect(page.locator('#start')).toHaveClass(/active/);
}

test('Qin emperor becomes a separate finale after defense level ten',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});currentSeason=1;currentFaction='plants';
  const before={hasApi:typeof isQinBossUnlocked==='function',weights:[9,10].map(level=>LEVELS[level].zombieWeights.includes('qinEmperor'))};
  for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  buildLevelCards();
  const card=document.querySelector('[data-qin-boss-card]');
  return {before,unlocked:typeof isQinBossUnlocked==='function'&&isQinBossUnlocked(),card:card?.textContent||'',button:card?.querySelector('button')?.textContent||'',next:nextCampaignStep('plants',10,true)};
 });
 expect(result.before.hasApi).toBeTruthy();
 expect(result.before.weights).toEqual([false,false]);
 expect(result.unlocked).toBeTruthy();
 expect(result.card).toContain('終章');
 expect(result.card).toContain('始皇陵決戰');
 expect(result.button).toContain('挑戰秦皇');
 expect(result.next).toEqual({faction:'plants',level:11,label:'終章：挑戰秦皇 ▶'});
});

test('finale starts the three-phase boss and three tiger seals break formation',async({page})=>{
 await openApp(page);
 const initial=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
  currentSeason=1;selectedLevel=11;start('plants');clearInterval(timer);
  const boss=state.zombies.find(z=>z.boss);
  return {bossCount:state.zombies.filter(z=>z.boss).length,type:boss?.type,hp:boss?.maxHp,phase:state.qinBoss?.phase,command:state.qinBoss?.command,seals:state.qinBoss?.seals,hudHidden:document.querySelector('#qinBossHud')?.hidden,buttonDisabled:document.querySelector('#qinBreakBtn')?.disabled};
 });
 expect(initial).toMatchObject({bossCount:1,type:'qinEmperor',phase:1,command:0,seals:0,hudHidden:false,buttonDisabled:true});
 expect(initial.hp).toBeGreaterThan(3000);
 const ready=await page.evaluate(()=>{collectQinTigerSeal();collectQinTigerSeal();collectQinTigerSeal();updateQinBossHud();state.qinBoss.command=88;return {seals:state.qinBoss.seals,buttonDisabled:document.querySelector('#qinBreakBtn').disabled,beforeHp:state.zombies.find(z=>z.boss).hp}});
 expect(ready).toMatchObject({seals:3,buttonDisabled:false});
 await page.locator('#qinBreakBtn').click();
 const after=await page.evaluate(()=>{const boss=state.zombies.find(z=>z.boss);return {seals:state.qinBoss.seals,command:state.qinBoss.command,hp:boss.hp,stunnedUntil:boss.stunUntil,vulnerableUntil:boss.vulnerableUntil,phase2:(boss.hp=boss.maxHp*.69,processQinBoss(),state.qinBoss.phase),phase3:(boss.hp=boss.maxHp*.34,processQinBoss(),state.qinBoss.phase)}});
 expect(after.seals).toBe(0);
 expect(after.command).toBeLessThanOrEqual(40);
 expect(after.hp).toBeLessThan(ready.beforeHp);
 expect(after.stunnedUntil).toBeGreaterThan(0);
 expect(after.vulnerableUntil).toBe(after.stunnedUntil);
 expect(after.phase2).toBe(2);expect(after.phase3).toBe(3);
});
