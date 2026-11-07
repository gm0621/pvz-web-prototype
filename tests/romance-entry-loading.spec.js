const {test,expect}=require('@playwright/test');
async function openWithDelayedIdentity(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:`window.supabase={createClient:()=>({auth:{getSession:()=>new Promise((resolve,reject)=>{window.releaseIdentity=()=>resolve({data:{session:null}});window.rejectIdentity=()=>reject(new Error('lookup failed'));}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};`}));
 await page.goto('/');await page.waitForFunction(()=>typeof releaseIdentity==='function');
}
test('entrance responds while identity is pending and unlocks automatically when ready',async({page})=>{
 await openWithDelayedIdentity(page);
 expect(await page.evaluate(()=>authIdentityResolved)).toBe(false);
 await page.locator('#romanceStartBtn').click();
 await expect(page.locator('#levelScreen')).toHaveClass(/active/);
 await expect(page.locator('#romanceIdentityNotice')).toContainText('正在確認登入狀態');
 await expect(page.locator('#continueCampaignBtn')).toBeDisabled();
 await expect(page.locator('#levelGrid .level-start:enabled')).toHaveCount(0);
 expect(await page.evaluate(()=>currentBattlePrincipal())).toBe(null);
 await page.evaluate(()=>releaseIdentity());
 await expect(page.locator('#continueCampaignBtn')).toBeEnabled();
 await expect(page.locator('#romanceIdentityNotice')).toBeHidden();
 await expect(page.locator('#levelGrid .level-start:enabled')).toHaveCount(1);
 await page.locator('#continueCampaignBtn').click();await page.locator('.level-detail-start:visible').click();
 await expect(page.locator('#storyDialog')).toBeVisible();
});
test('identity failure shows a visible retry path without assuming a guest identity',async({page})=>{
 await openWithDelayedIdentity(page);await page.evaluate(()=>rejectIdentity());
 await page.locator('#romanceStartBtn').click();
 await expect(page.locator('#levelScreen')).toHaveClass(/active/);
 await expect(page.locator('#romanceIdentityNotice')).toContainText('登入狀態確認失敗');
 await expect(page.locator('#romanceIdentityRetry')).toBeVisible();
 await expect(page.locator('#continueCampaignBtn')).toBeDisabled();
 expect(await page.evaluate(()=>currentBattlePrincipal())).toBe(null);
});
test('auth event returns before cloud I/O and ignores duplicate initial-session notifications',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());await page.goto('/');await page.waitForFunction(()=>authIdentityResolved);
 const result=await page.evaluate(async()=>{
  window.profileReads=0;
  const client={auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:callback=>{window.authCallback=callback;return {data:{subscription:{unsubscribe(){}}}}}}};
  initSupabaseClient=()=>client;
  pullCloudProfile=()=>{window.profileReads++;return new Promise(resolve=>window.releaseProfile=resolve)};
  await initAuth();
  authCallback('INITIAL_SESSION',{user:{id:'returning-player'}});
  const initialReads=profileReads,returned=authCallback('SIGNED_IN',{user:{id:'returning-player'}});
  return {initialReads,synchronousReads:profileReads,returnedPromise:!!returned?.then};
 });
 expect(result).toEqual({initialReads:0,synchronousReads:0,returnedPromise:false});
 await page.waitForFunction(()=>profileReads===1);
 await page.evaluate(()=>releaseProfile(true));
 await expect.poll(()=>page.evaluate(()=>currentBattlePrincipal())).toBe('user:returning-player');
});
