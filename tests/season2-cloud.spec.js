const {test,expect}=require('@playwright/test');
test('season-two cloud match uses its dedicated RPC and only server-returned progress unlocks the reward',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.goto('/');
 const result=await page.evaluate(async()=>{
  chooseFaction('plants',2);startLevel('plants',1);clearInterval(timer);
  const calls=[];currentUser={id:'test-user'};cloudLockOwned=true;
  const server=normalizeProfile({gold:53,season2Progress:{plants:{completedLevels:{1:1}}}});
  supabaseClient={rpc:async(name,args)=>{calls.push({name,args});if(name==='sgz_start_season2_match')return {data:'test-match',error:null};if(name==='sgz_claim_level_reward')return {data:{profile:server,save_version:99,active_device_id:getDeviceId()},error:null};return {data:null,error:{message:'UNEXPECTED_RPC'}}}};
  await startCloudMatch(1,'plants');state.usedUnits.plants.s2Crossbow=1;await end(true,'','');
  return {calls,progress:playerProfile.season2Progress,first:playerProfile.campaignProgress.plants.highestLevel,match:cloudMatchId};
 });
 expect(result.calls.map(c=>c.name)).toEqual(['sgz_start_season2_match','sgz_claim_level_reward']);
 expect(result.calls[1].args.p_match_id).toBe('test-match');expect(result.calls[1].args.p_character_key).toBe('s2Crossbow');expect(result.first).toBe(0);expect(result.progress.plants.highestLevel).toBe(1);
 await expect(page.locator('#modalText')).toContainText('大盾兵');
});
