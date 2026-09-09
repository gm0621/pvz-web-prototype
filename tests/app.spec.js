const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const mockSupabase = `
(() => {
  window.__supabaseCalls = [];
  let authListener = () => {};
  let version = 1;
  const oldCloud = new URL(location.href).searchParams.has('cloudrow');
  let profile = {
    name: oldCloud ? '雲端舊存檔' : '測試將軍', avatarKey: 'guanyu', gold: 500, xp: 200, level: 2,
    highestLevel: 1, completedLevels: {'1': 1}, updatedAt: oldCloud ? '2025-01-01T00:00:00.000Z' : new Date().toISOString(),
    characterLevels: {plants: {}, zombies: {}},
    inventory: {equipment: {}, skills: {}, skins: {}, equipped: {plants: {}, zombies: {}}, activeSkins: {}}
  };
  const row = device => ({profile, save_version: version, active_device_id: device || localStorage.getItem('sgZombieDeviceId'), active_device_name: 'Chrome 電腦', active_seen_at: new Date().toISOString(), updated_at: oldCloud ? '2025-01-01T00:00:00.000Z' : new Date().toISOString()});
  const client = {
    auth: {
      getSession: async () => ({data: {session: new URL(location.href).searchParams.has('existingSession') ? {user: {id: 'user-1', email: 'player@example.com'}} : null}}),
      onAuthStateChange: cb => { authListener = cb; return {data: {subscription: {unsubscribe(){}}}}; },
      signInWithPassword: async ({email}) => ({data: {user: {id: 'user-1', email}}, error: null}),
      signInWithOAuth: async args => { window.__supabaseCalls.push(['oauth', args]); return {data: {}, error: null}; },
      signUp: async ({email}) => ({data: {user: {id: 'user-1', email}, session: null}, error: null}),
      resetPasswordForEmail: async email => { window.__supabaseCalls.push(['resetPasswordForEmail', {email}]); return {error: null}; },
      resend: async args => { window.__supabaseCalls.push(['resend', args]); return {error: null}; },
      updateUser: async args => { window.__supabaseCalls.push(['updateUser', args]); return {data: {user: args}, error: null}; },
      signOut: async args => { window.__supabaseCalls.push(['signOut', args]); return {error: null}; }
    },
    from: () => {
      const q = {select(){return q},eq(){return q},maybeSingle: async () => ({data: oldCloud ? row('previous-device') : null, error: null})};
      return q;
    },
    rpc: async (name, args) => {
      window.__supabaseCalls.push([name, args]);
      if (name === 'sgz_claim_device' && new URL(location.href).searchParams.has('conflict')) return {data: null, error: {code: 'P0001', message: 'DEVICE_LOCKED'}};
      if (name === 'sgz_save_profile') { profile = args.p_profile; version++; }
      if (name === 'sgz_buy_item') { const prices={archerQuiver:120}; profile.gold -= prices[args.p_item_key] || 0; profile.inventory.equipment[args.p_item_key]=1; profile.inventory.equipped.plants.peashooter=args.p_item_key; version++; }
      if (name === 'sgz_heartbeat' && new URL(location.href).searchParams.has('staleheartbeat')) return {data:{...row(args?.p_device_id),profile:{...profile,name:'過期回應'},save_version:0},error:null};
      return {data: row(args?.p_device_id), error: null};
    },
    storage: {from: bucket => ({
      upload: async (path, blob, options) => {window.__supabaseCalls.push(['upload',bucket,path,blob.type,options]);return {data:{path},error:null}},
      getPublicUrl: path => ({data:{publicUrl:'https://example.test/storage/'+bucket+'/'+path}})
    })},
    channel: () => ({on(){return this}, subscribe(){return this}}),
    removeChannel(){}
  };
  window.supabase = {createClient: () => client};
})();`;

async function openApp(page, query='test=1') {
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', route => route.fulfill({contentType: 'application/javascript', body: mockSupabase}));
  await page.goto('/?' + query);
  await expect(page.locator('#start')).toHaveClass(/active/);
}

async function login(page) {
  await page.locator('#accountCornerBtn').click();
  await page.locator('#accountEmailInput').fill('player@example.com');
  await page.locator('#accountPasswordInput').fill('12345678');
  await page.locator('#accountSubmitBtn').click();
  await expect(page.locator('#start')).toHaveClass(/active/);
}

test('restoring an existing login session keeps the player on the main menu', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', route => route.fulfill({contentType: 'application/javascript', body: mockSupabase}));
  await page.goto('/?existingSession=1&cloudrow=1');
  await page.waitForFunction(() => window.__supabaseCalls.some(([name]) => name === 'sgz_claim_device'));
  await expect(page.locator('#start')).toHaveClass(/active/);
  await expect(page.locator('#profile')).not.toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => playerProfile.name)).toBe('雲端舊存檔');
});

test('campaign progression unlocks defense 1-10 before attack 1-10 and then marks all clear', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    playerProfile = normalizeProfile({});
    const unlocked = side => Object.values(LEVELS).filter(lv => isCampaignLevelUnlocked(side, lv.level)).map(lv => lv.level);
    const initial = {plants:unlocked('plants'),zombies:unlocked('zombies'),status:campaignStatus()};
    completeCampaignLevel('plants',1);
    completeCampaignLevel('plants',2);
    const afterDefense2 = {plants:unlocked('plants'),completed:[isCampaignLevelCompleted('plants',1),isCampaignLevelCompleted('plants',2)]};
    for(let level=3;level<=9;level++) completeCampaignLevel('plants',level);
    const beforeDefense10 = {plants:unlocked('plants'),zombies:unlocked('zombies')};
    completeCampaignLevel('plants',10);
    const afterDefense10 = {plants:unlocked('plants'),zombies:unlocked('zombies'),step:nextCampaignStep('plants',10,true)};
    completeCampaignLevel('zombies',1);
    const afterAttack1 = {zombies:unlocked('zombies')};
    for(let level=2;level<=10;level++) completeCampaignLevel('zombies',level);
    return {initial,afterDefense2,beforeDefense10,afterDefense10,afterAttack1,final:campaignStatus()};
  });
  expect(result.initial).toEqual({plants:[1],zombies:[],status:{plants:0,zombies:0,attackUnlocked:false,allComplete:false}});
  expect(result.afterDefense2).toEqual({plants:[1,2,3],completed:[true,true]});
  expect(result.beforeDefense10.plants).toEqual([1,2,3,4,5,6,7,8,9,10]);
  expect(result.beforeDefense10.zombies).toEqual([]);
  expect(result.afterDefense10.zombies).toEqual([1]);
  expect(result.afterDefense10.step).toEqual({faction:'zombies',level:1,label:'開始攻城：第一關 ▶'});
  expect(result.afterAttack1.zombies).toEqual([1,2]);
  expect(result.final).toEqual({plants:10,zombies:10,attackUnlocked:true,allComplete:true});
});

test('a very fast attack win shows a live verification countdown and still allows leaving', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    playerProfile = normalizeProfile({});
    for(let level=1;level<=10;level++) completeCampaignLevel('plants',level);
    for(let level=1;level<=9;level++) completeCampaignLevel('zombies',level);
    selectedLevel=10;
    start('zombies');
    clearInterval(timer);
    await new Promise(requestAnimationFrame);
    currentUser={id:'user-1',email:'player@example.com'};
    cloudLockOwned=true;
    cloudMatchId='00000000-0000-4000-8000-000000000010';
    state.cloudMatchStartedAt=Date.now();
    supabaseClient={rpc:async name=>name==='sgz_claim_level_reward'?{data:null,error:{message:'MATCH_TOO_SHORT'}}:{data:null,error:null}};
    void end(true,'突破成功！','第十關完成');
  });
  await expect(page.locator('#modalText')).toContainText(/倒數.*秒/);
  await expect(page.locator('#modalMainMenu')).toBeEnabled();
  await page.locator('#modalMainMenu').click();
  await expect(page.locator('#start')).toHaveClass(/active/);
});

test('the final attack victory has a primary all-clear exit instead of a dead end', async ({ page }) => {
  await openApp(page);
  await page.evaluate(async () => {
    playerProfile = normalizeProfile({});
    for(let level=1;level<=10;level++) completeCampaignLevel('plants',level);
    for(let level=1;level<=9;level++) completeCampaignLevel('zombies',level);
    selectedLevel=10;
    start('zombies');
    clearInterval(timer);
    currentUser=null;
    await end(true,'突破成功！','第十關完成');
  });
  await expect(page.locator('#modalNext')).toBeVisible();
  await expect(page.locator('#modalNext')).toBeEnabled();
  await expect(page.locator('#modalNext')).toContainText('全破完成');
  await page.locator('#modalNext').click();
  await expect(page.locator('#start')).toHaveClass(/active/);
});

test('cloud retry timing matches the server for attack and defense', async ({ page }) => {
  await openApp(page);
  const timings=await page.evaluate(()=>({attack:cloudMatchMinimumMs('zombies',3),defense:cloudMatchMinimumMs('plants',3)}));
  expect(timings).toEqual({attack:8000,defense:48000});
});

test('a short server-verified attack win retries without relocking level four', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(async () => {
    playerProfile = normalizeProfile({});
    for(let level=1;level<=10;level++) completeCampaignLevel('plants',level);
    completeCampaignLevel('zombies',1);
    completeCampaignLevel('zombies',2);
    selectedLevel=3;
    start('zombies');
    clearInterval(timer);
    state.cloudMatchStartedAt=Date.now()-60000;
    currentUser={id:'user-1',email:'player@example.com'};
    cloudLockOwned=true;
    cloudMatchId='00000000-0000-4000-8000-000000000003';
    cloudSaveVersion=3;
    const beforeClaim=structuredClone(playerProfile);
    const serverAfterClaim=structuredClone(playerProfile);
    serverAfterClaim.campaignProgress.zombies.completedLevels[3]=1;
    serverAfterClaim.campaignProgress.zombies.highestLevel=3;
    let attempts=0,pulls=0;
    supabaseClient={rpc:async name=>{
      if(name==='sgz_claim_level_reward'){
        attempts++;
        if(attempts===1)return {data:null,error:{message:'MATCH_TOO_SHORT'}};
        return {data:{profile:serverAfterClaim,save_version:4,active_device_id:getDeviceId(),active_device_name:'Chrome',active_seen_at:new Date().toISOString(),updated_at:new Date().toISOString()},error:null};
      }
      return {data:'00000000-0000-4000-8000-000000000004',error:null};
    }};
    pullCloudProfile=async()=>{pulls++;playerProfile=normalizeProfile(beforeClaim);return true};
    await end(true,'進攻成功','第三關完成');
    goNextLevel();
    clearInterval(timer);
    return {attempts,pulls,level:state.level,faction:state.faction,attackHighest:campaignStatus().zombies,level4Unlocked:isCampaignLevelUnlocked('zombies',4)};
  });
  expect(result).toEqual({attempts:2,pulls:0,level:4,faction:'zombies',attackHighest:3,level4Unlocked:true});
});

test('campaign UI disables locked faction and labels completed current and locked levels', async ({ page }) => {
  await openApp(page);
  const initial = await page.evaluate(() => {
    playerProfile = normalizeProfile({});
    refreshCampaignUI();
    chooseFaction('plants');
    return {
      attackDisabled:document.querySelector('#zombieStartBtn').disabled,
      attackText:document.querySelector('#zombieStartBtn').textContent,
      levels:[...document.querySelectorAll('#levelGrid .level-card')].map(card => ({className:card.className,text:card.querySelector('button').textContent,disabled:card.querySelector('button').disabled}))
    };
  });
  expect(initial.attackDisabled).toBeFalsy();
  expect(initial.attackText).toContain('選擇進攻季度');
  expect(initial.levels[0]).toMatchObject({disabled:false,text:'開始第一關'});
  expect(initial.levels[1].disabled).toBeTruthy();
  expect(initial.levels[1].className).toContain('locked');

  const advanced = await page.evaluate(() => {
    completeCampaignLevel('plants',1);
    completeCampaignLevel('plants',2);
    buildLevelCards();
    return [...document.querySelectorAll('#levelGrid .level-card')].slice(0,4).map(card => ({className:card.className,text:card.querySelector('button').textContent,disabled:card.querySelector('button').disabled}));
  });
  expect(advanced[0].className).toContain('completed');
  expect(advanced[0].text).toBe('重玩第一關');
  expect(advanced[1].text).toBe('重玩第二關');
  expect(advanced[2]).toMatchObject({disabled:false,text:'開始第三關'});
  expect(advanced[3].disabled).toBeTruthy();
});

test('home can enter level selection and shop', async ({ page }) => {
  await openApp(page);
  await page.locator('#plantStartBtn').click();
  await expect(page.locator('#levelScreen')).toHaveClass(/active/);
  await page.locator('#backFactionBtn').click();
  await page.locator('#shopBtn').click();
  await expect(page.locator('#shop')).toHaveClass(/active/);
  await expect(page.locator('#shopGrid .shop-item')).toHaveCount(16);
});

test('shop offers a larger cosmetic catalog with frame ornament and battlefield filters', async ({ page }) => {
  await openApp(page);
  await page.locator('#shopBtn').click();
  await page.locator('[data-shop-type=skin]').click();
  await expect(page.locator('#shopSubtabs button')).toHaveCount(4);
  await expect(page.locator('#shopGrid .shop-item')).toHaveCount(20);
  await expect(page.locator('#shopGrid')).toContainText('關羽青龍冠');
  await expect(page.locator('#shopGrid')).toContainText('桃園花瓣');
  await expect(page.locator('#shopGrid')).toContainText('血月骨框');
  await page.locator('[data-cosmetic-slot=ornament]').click();
  await expect(page.locator('#shopGrid .shop-item')).toHaveCount(6);
  await page.locator('[data-cosmetic-slot=battlefield]').click();
  await expect(page.locator('#shopGrid .shop-item')).toHaveCount(6);
  await page.locator('[data-cosmetic-slot=frame]').click();
  await expect(page.locator('#shopGrid .shop-item')).toHaveCount(8);
});

test('cosmetic slots stack independently and replacing a frame keeps other effects', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    playerProfile.gold=3000;
    saveProfile();
    showShop('skin');
  });
  for (const [key,name] of [['jadeSealFrame','玉璽金框'],['guanyuDragonCrown','關羽青龍冠'],['peachPetals','桃園花瓣']]) {
    await page.locator(`button[onclick="buyShopItem('${key}')"]`).click();
    await expect(page.locator('#shopStatus')).toContainText(`已購買 ${name}`);
    await page.locator(`button[onclick="activateSkin('${key}')"]`).click();
    await expect(page.locator('#shopStatus')).toContainText(`已套用 ${name}`);
  }
  let active=await page.evaluate(() => playerProfile.inventory.activeCosmetics.plants);
  expect(active).toEqual({frame:'skin-jade-frame',ornament:'ornament-guanyu-crown',battlefield:'battlefield-peach-petals'});
  await expect(page.locator('body')).toHaveClass(/skin-jade-frame/);
  await expect(page.locator('body')).toHaveClass(/ornament-guanyu-crown/);
  await expect(page.locator('body')).toHaveClass(/battlefield-peach-petals/);
  const visuals=await page.evaluate(() => {
    const card=document.createElement('button');
    card.className='card';
    card.dataset.key='firepea';
    document.body.appendChild(card);
    const result={frame:getComputedStyle(card).borderColor,ornament:getComputedStyle(card,'::after').content,battlefield:getComputedStyle(document.querySelector('#board'),'::after').content};
    card.remove();
    return result;
  });
  expect(visuals.frame).toBe('rgb(110, 231, 183)');
  expect(visuals.ornament).toContain('🐉');
  expect(visuals.battlefield).toContain('🌸');

  await page.locator(`button[onclick="buyShopItem('peachBloomFrame')"]`).click();
  await page.locator(`button[onclick="activateSkin('peachBloomFrame')"]`).click();
  active=await page.evaluate(() => playerProfile.inventory.activeCosmetics.plants);
  expect(active).toEqual({frame:'skin-peach-frame',ornament:'ornament-guanyu-crown',battlefield:'battlefield-peach-petals'});
  await expect(page.locator('body')).not.toHaveClass(/skin-jade-frame/);
  await expect(page.locator('body')).toHaveClass(/skin-peach-frame/);
  await expect(page.locator('body')).toHaveClass(/ornament-guanyu-crown/);
  await expect(page.locator('body')).toHaveClass(/battlefield-peach-petals/);
});

test('legacy active skin save migrates into the new frame slot', async ({ page }) => {
  await openApp(page);
  const result=await page.evaluate(() => normalizeProfile({inventory:{equipment:{},skills:{},skins:{redFrame:1},equipped:{plants:{},zombies:{}},activeSkins:{plants:'skin-red'}}}).inventory);
  expect(result.activeSkins.plants).toBe('skin-red');
  expect(result.activeCosmetics.plants.frame).toBe('skin-red');
  expect(result.activeCosmetics.plants.ornament).toBeUndefined();
});

test('Qin emperor profile migration safely seeds existing cloud players', async () => {
  const migration=path.join(__dirname,'..','supabase','migrations','202609070001_qin_emperor_profile.sql');
  expect(fs.existsSync(migration)).toBe(true);
  const sql=fs.readFileSync(migration,'utf8');
  expect(sql).toContain("'qinEmperor'");
  expect(sql).toContain("'{characterLevels}'");
  expect(sql).toContain("'{characterLevels,zombies}'");
  expect(sql).toContain("coalesce(wz.normalized_profile #> '{characterLevels,zombies,qinEmperor}'");
  expect(sql).toContain('save_version=save_version+1');
  expect(sql).toContain('updated_at=now()');
});

test('shop cosmetic migration registers every new item and persists independent slots', async () => {
  const migration=path.join(__dirname,'..','supabase','migrations','202609060003_shop_cosmetics.sql');
  expect(fs.existsSync(migration)).toBe(true);
  const sql=fs.readFileSync(migration,'utf8');
  for (const key of ['jadeSealFrame','peachBloomFrame','moonSilverFrame','bloodMoonBoneFrame','guanyuDragonCrown','zhaoyunIcePlume','zhangfeiTigerGuard','liubeiJadePendant','jesterGhostBell','titanCorpseCrown','peachPetals','redCliffEmbers','hanGoldenRain','ghostFireField','bloodMoonAsh','frostNightField']) expect(sql).toContain(`'${key}'`);
  expect(sql).toContain('cosmetic_slot');
  expect(sql).toContain("array['activeCosmetics',v_item.side,v_slot]");
});

test('account screen exposes recovery and security controls', async ({ page }) => {
  await openApp(page);
  await page.locator('#accountCornerBtn').click();
  await expect(page.locator('#forgotPasswordBtn')).toHaveText('忘記密碼');
  await expect(page.locator('#resendConfirmationBtn')).toHaveText('重寄驗證信');
  await expect(page.locator('#googleLoginBtn')).toHaveText('使用 Google 登入');
  await page.locator('#googleLoginBtn').click();
  await expect.poll(async () => page.evaluate(() => window.__supabaseCalls.some(c => c[0] === 'oauth'))).toBe(true);
  await page.locator('#accountEmailInput').fill('player@example.com');
  await page.locator('#forgotPasswordBtn').click();
  await expect.poll(() => page.evaluate(() => window.__supabaseCalls.some(x => x[0] === 'resetPasswordForEmail'))).toBeTruthy();
  await page.locator('#accountBackBtn').click();
  await page.locator('#profileBtn').click();
  await expect(page.locator('#changePasswordBtn')).toHaveText('修改密碼');
  await expect(page.locator('#changeEmailBtn')).toHaveText('修改 Email');
  await expect(page.locator('#signOutAllBtn')).toHaveText('登出所有裝置');
});

test('confirmation uses in-game dialog instead of native confirm', async ({ page }) => {
  await openApp(page);
  await page.locator('#profileBtn').click();
  await page.locator('#resetLocalProfileBtn').click();
  await expect(page.locator('#confirmDialog')).toHaveClass(/show/);
  await expect(page.locator('#confirmDialogTitle')).toHaveText('重置本機存檔');
  await page.locator('#confirmDialogCancel').click();
  await expect(page.locator('#confirmDialog')).not.toHaveClass(/show/);
});

test('authenticated purchase uses authoritative RPC', async ({ page }) => {
  await openApp(page);
  await login(page);
  await page.locator('#shopBtn').click();
  await page.locator("button[onclick=\"buyShopItem('archerQuiver')\"]").click();
  await expect.poll(() => page.evaluate(() => window.__supabaseCalls.some(x => x[0] === 'sgz_buy_item'))).toBeTruthy();
  await expect(page.locator('#shopStatus')).toContainText('已購買');
});

test('newer local profile survives device claim and is uploaded', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sgZombieProfile', JSON.stringify({name:'本機新存檔',updatedAt:'2030-01-01T00:00:00.000Z',cloudOwnerUserId:'user-1',gold:500,xp:200,level:2,completedLevels:{'1':1},characterLevels:{plants:{},zombies:{}},inventory:{equipment:{},skills:{},skins:{},equipped:{plants:{},zombies:{}},activeSkins:{}}})));
  await openApp(page, 'test=1&cloudrow=1');
  await login(page);
  await expect.poll(() => page.evaluate(() => window.__supabaseCalls.find(x => x[0] === 'sgz_save_profile')?.[1]?.p_profile?.name)).toBe('本機新存檔');
});

test('unconfirmed signup does not create a logged-in UI session', async ({ page }) => {
  await openApp(page);
  await page.locator('#accountCornerBtn').click();
  await page.locator('#accountSignupTab').click();
  await page.locator('#accountEmailInput').fill('new@example.com');
  await page.locator('#accountPasswordInput').fill('12345678');
  await page.locator('#accountSubmitBtn').click();
  await page.locator('#accountBackBtn').click();
  await page.locator('#accountCornerBtn').click();
  await expect(page.locator('#accountScreen')).toHaveClass(/active/);
  await expect(page.locator('#profile')).not.toHaveClass(/active/);
});

test('another account cannot upload a newer shared local profile', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('sgZombieProfile', JSON.stringify({name:'其他帳號本機存檔',updatedAt:'2099-01-01T00:00:00.000Z',cloudOwnerUserId:'other-user'})));
  await openApp(page,'test=1&cloudrow=1');
  await login(page);
  await page.locator('#accountCornerBtn').click();
  await expect(page.locator('#playerNameInput')).toHaveValue('雲端舊存檔');
  expect(await page.evaluate(()=>window.__supabaseCalls.filter(c=>c[0]==='sgz_save_profile').length)).toBe(0);
});

test('late heartbeat cannot overwrite newer local state or version', async ({page}) => {
  await openApp(page,'test=1&staleheartbeat=1');
  await login(page);
  const state=await page.evaluate(async()=>{playerProfile.name='本機編輯';cloudSaveVersion=5;await heartbeatCloudDevice();return {name:playerProfile.name,version:cloudSaveVersion}});
  expect(state).toEqual({name:'本機編輯',version:5});
});

test('signed-in player can upload a resized custom avatar', async ({page}) => {
  await openApp(page);
  await login(page);
  await page.locator('#accountCornerBtn').click();
  await expect(page.locator('#profile')).toHaveClass(/active/);
  await page.locator('#avatarUploadInput').setInputFiles({
    name:'avatar.png',mimeType:'image/png',
    buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')
  });
  await expect.poll(async()=>page.evaluate(()=>window.__supabaseCalls.some(c=>c[0]==='upload'))).toBe(true);
  await expect(page.locator('#profileAvatar img')).toHaveAttribute('src',/example\.test\/storage\/avatars\/user-1\/avatar-\d+\.webp/);
});

test('read-only device cannot upload a custom avatar object', async ({page}) => {
  await openApp(page,'test=1&conflict=1');
  await login(page);
  await page.locator('#accountCornerBtn').click();
  await page.locator('#avatarUploadInput').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')});
  await expect(page.locator('#saveStatus')).toContainText('不能更換頭像');
  expect(await page.evaluate(()=>window.__supabaseCalls.filter(c=>c[0]==='upload').length)).toBe(0);
});

test('fresh owner conflict keeps second device read-only', async ({ page }) => {
  await openApp(page, 'test=1&conflict=1');
  await login(page);
  await expect(page.locator('#accountStatus')).toContainText('唯讀');
});

test('production files are split and loaded', async ({ page }) => {
  await openApp(page);
  const assets = await page.evaluate(() => ({style:[...document.styleSheets].some(s=>s.href?.includes('/css/app.css')),scripts:[...document.scripts].map(s=>s.src).filter(Boolean)}));
  expect(assets.style).toBeTruthy();
  for (const file of ['data.js','cloud.js','account.js','shop.js','app.js']) expect(assets.scripts.some(s => s.includes('/js/' + file))).toBeTruthy();
});

test('the complete zombie roster uses the approved v2 art and memorable names', async ({ page }) => {
  const expected={
    qinEmperor:{name:'始皇屍帝・嬴政',asset:'qin-emperor.webp'},
    normal:{name:'赤巾小屍',asset:'red-band-grunt.webp'},
    cone:{name:'鐵盔小兵',asset:'iron-helmet-grunt.webp'},
    bucket:{name:'巨槌阿蠻',asset:'giant-mace-brute.webp'},
    peaZombie:{name:'飛石阿投',asset:'boulder-thrower.webp'},
    poleVault:{name:'蹦蹦飛屍',asset:'leaping-raider.webp'},
    football:{name:'白髮屍王',asset:'white-haired-king.webp'},
    jester:{name:'鈴鐺丑屍',asset:'bell-jester.webp'},
    bombJester:{name:'爆爆桶屍',asset:'bomb-carrier.webp'},
    corpseTitan:{name:'屍旗大胖',asset:'banner-titan.webp'},
    fireCatapult:{name:'烈焰屍車',asset:'flame-catapult.webp'}
  };
  const sourceDir=path.join(__dirname,'..','assets','characters','source-originals','zombie-roster-20260907');
  const outputDir=path.join(__dirname,'..','assets','characters','zombie-army','zombie-roster-v2');
  const scriptPath=path.join(__dirname,'..','scripts','prepare_zombie_roster_assets.py');
  expect(fs.existsSync(scriptPath)).toBe(true);
  for(let figure=1;figure<=11;figure++) expect(fs.existsSync(path.join(sourceDir,`${String(figure).padStart(2,'0')}-${Object.values(expected)[figure-1].asset.replace('.webp','.png')}`))).toBe(true);
  const script=fs.readFileSync(scriptPath,'utf8');
  expect(script).toContain("ImageOps.mirror(source)");
  expect(script).toContain("remove_baked_background");
  expect(script).toContain('(\"01-qin-emperor.png\", \"qin-emperor.webp\", False, False)');
  await openApp(page);
  const actual=await page.evaluate(async expected=>{
    const result={};
    for(const [key,want] of Object.entries(expected)){
      const unit=ZOMBIE_TYPES[key];
      const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=reject;img.src=unit.asset});
      result[key]={name:unit.name,asset:unit.asset.split('/').pop(),path:unit.asset,size:image,spentAsset:unit.spentAsset};
    }
    return result;
  },expected);
  for(const [key,want] of Object.entries(expected)){
    expect(actual[key]).toMatchObject({name:want.name,asset:want.asset,path:`assets/characters/zombie-army/zombie-roster-v2/${want.asset}`,size:{width:1024,height:1024}});
    expect(fs.existsSync(path.join(outputDir,want.asset))).toBe(true);
  }
  expect(actual.poleVault.spentAsset).toBe(actual.poleVault.path);
});

test('accepted Guan Yu and the latest mirrored Qin artwork drive every runtime surface', async ({ page }) => {
  const scriptPath=path.join(__dirname,'..','scripts','prepare_accepted_character_assets.py');
  const guanSource=path.join(__dirname,'..','assets','characters','source-originals','guanyu-accepted-20260907.png');
  const qinSource=path.join(__dirname,'..','assets','characters','source-originals','qin-emperor-accepted-20260907.png');
  for(const file of [scriptPath,guanSource,qinSource]) expect(fs.existsSync(file)).toBe(true);
  const script=fs.readFileSync(scriptPath,'utf8');
  expect(script).toContain('ImageOps.mirror(qin_source)');
  await openApp(page);
  const result=await page.evaluate(() => {
    showCharacters('plants');
    showCharacterDetail('plants','firepea');
    const avatar=AVATAR_CHOICES.find(item=>item[0]==='guanyu');
    return {
      guanAsset:PLANT_TYPES.firepea.asset,
      avatarAsset:avatar?.[2],
      guideAsset:new URL(document.querySelector('#charModalImg').src).pathname,
      warmup:collectWarmupAssets(),
      qinAsset:ZOMBIE_TYPES.qinEmperor.asset
    };
  });
  expect(result.guanAsset).toBe('assets/characters/guanyu-fire-general.webp');
  expect(result.avatarAsset).toBe(result.guanAsset);
  expect(result.guideAsset).toContain('/assets/characters/guanyu-fire-general.webp');
  expect(result.warmup).toContain(result.guanAsset);
  expect(result.qinAsset).toBe('assets/characters/zombie-army/zombie-roster-v2/qin-emperor.webp');
});

test('undead Qin emperor unlocks late with an independent summon identity', async ({ page }) => {
  await openApp(page);
  const result=await page.evaluate(() => {
    playerProfile=normalizeProfile({});
    buildCharacterGrid('zombies');
    const card=document.querySelector('#characterGrid .type-qinEmperor');
    return {
      order:UNIT_ORDER.zombies,
      level8:isUnlocked('zombies','qinEmperor',8),
      level9:isUnlocked('zombies','qinEmperor',9),
      level10:isUnlocked('zombies','qinEmperor',10),
      definition:ZOMBIE_TYPES.qinEmperor,
      footballAsset:ZOMBIE_TYPES.football.asset,
      summonAssets:[ZOMBIE_TYPES.terracottaSoldier.asset,ZOMBIE_TYPES.blackArmorGuard.asset],
      level9Weight:LEVELS[9].zombieWeights.includes('qinEmperor'),
      level10Weight:LEVELS[10].zombieWeights.includes('qinEmperor'),
      guideText:card?.textContent||''
    };
  });
  expect(result.order.at(-2)).toBe('qinEmperor');
  expect(result.level8).toBe(false);
  expect(result.level9).toBe(false);
  expect(result.level10).toBe(true);
  expect(result.definition.name).toBe('始皇屍帝・嬴政');
  expect(result.definition.asset).toBe('assets/characters/zombie-army/zombie-roster-v2/qin-emperor.webp');
  expect(result.definition.summon).toBe(true);
  expect(result.level9Weight).toBe(true);
  expect(result.level10Weight).toBe(true);
  expect(result.guideText).toContain('天賦：兵馬俑召令');
  expect(result.guideText).toContain('機率技能：大秦軍陣');
  expect(result.definition.asset).not.toBe(result.footballAsset);
  expect(fs.existsSync(path.join(__dirname,'..',result.definition.asset))).toBe(true);
  expect(new Set(result.summonAssets).size).toBe(2);
  for(const asset of result.summonAssets) expect(fs.existsSync(path.join(__dirname,'..',asset))).toBe(true);
});

test('netherfire necromancer is a final all-clear reward and level-ten boss', async ({ page }) => {
  const source=path.join(__dirname,'..','assets','characters','source-originals','zombie-roster-20260908','12-netherfire-necromancer.png');
  const asset=path.join(__dirname,'..','assets','characters','zombie-army','zombie-roster-v2','netherfire-necromancer.webp');
  await openApp(page);
  const result=await page.evaluate(() => {
    playerProfile=normalizeProfile({});
    for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
    for(let level=1;level<=9;level++)completeCampaignLevel('zombies',level);
    selectedLevel=10;
    buildCharacterGrid('zombies');
    start('zombies');
    clearInterval(timer);
    const before={
      guideLocked:document.querySelector('#characterGrid .type-necromancer')?.classList.contains('locked')??true,
      battleCard:!!document.querySelector('#cards [data-key="necromancer"]')
    };
    completeCampaignLevel('zombies',10);
    buildCharacterGrid('zombies');
    buildCards();
    const unit=ZOMBIE_TYPES.necromancer;
    return {
      before,
      after:{
        guideLocked:document.querySelector('#characterGrid .type-necromancer')?.classList.contains('locked')??true,
        battleCard:!!document.querySelector('#cards [data-key="necromancer"]')
      },
      unit:unit?{name:unit.name,asset:unit.asset,curse:unit.curse,cost:unit.cost}:null,
      last:UNIT_ORDER.zombies.at(-1),
      level10Weight:LEVELS[10].zombieWeights.includes('necromancer'),
      bossOnly:AI_DELAYS.zombies.necromancer===Infinity,
      level10Boss:LEVEL_PACING[10].bossType
    };
  });
  expect(result.before).toEqual({guideLocked:true,battleCard:false});
  expect(result.after).toEqual({guideLocked:false,battleCard:true});
  expect(result.unit).toEqual({
    name:'冥火屍巫',
    asset:'assets/characters/zombie-army/zombie-roster-v2/netherfire-necromancer.webp',
    curse:true,
    cost:400
  });
  expect(result.last).toBe('necromancer');
  expect(result.level10Weight).toBe(true);
  expect(result.bossOnly).toBe(true);
  expect(result.level10Boss).toBe('necromancer');
  expect(fs.existsSync(source)).toBe(true);
  expect(fs.existsSync(asset)).toBe(true);
});

test('netherfire necromancer fixed talent damages and confuses a distant defender', async ({ page }) => {
  await openApp(page);
  const result=await page.evaluate(() => {
    playerProfile=normalizeProfile({});
    for(let level=1;level<=9;level++)completeCampaignLevel('plants',level);
    selectedLevel=10;
    start('plants');
    clearInterval(timer);
    state.time=6000;
    state.plants=[];
    state.zombies=[];
    addPlant('wallnut',3,2);
    const caster=addZombie('necromancer',8,2),target=state.plants[0];
    actZombies();
    buildCharacterGrid('zombies');
    const summary=document.querySelector('.char-profile.type-necromancer .ability-summary')?.textContent||'';
    return {
      hp:target.hp,
      stunUntil:target.stunUntil,
      curseLast:caster.curseLast,
      fx:!!document.querySelector('.necromancer-curse-fx'),
      summary
    };
  });
  expect(result.hp).toBe(420-72);
  expect(result.stunUntil).toBe(8200);
  expect(result.curseLast).toBe(6000);
  expect(result.fx).toBe(true);
  expect(result.summary).toContain('天賦：幽冥禁咒');
  expect(result.summary).toContain('固定生效');
});

test('Qin emperor attacks by summoning one terracotta soldier or three black-armour guards', async ({ page }) => {
  await openApp(page);
  const result=await page.evaluate(() => {
    for(let level=1;level<=10;level++) completeCampaignLevel('plants',level);
    for(let level=1;level<=8;level++) completeCampaignLevel('zombies',level);
    const run=roll => {
      selectedLevel=9;
      start('zombies');
      clearInterval(timer);
      state.time=10000;
      state.plants=[];
      state.zombies=[];
      document.querySelectorAll('.qin-command-fx').forEach(node=>node.remove());
      addPlant('wallnut',4,2);
      addZombie('qinEmperor',4.5,2);
      const beforeHp=state.plants[0].hp;
      const savedRandom=Math.random;
      Math.random=()=>roll;
      actZombies();
      Math.random=savedRandom;
      render();
      return {
        plantDamage:beforeHp-state.plants[0].hp,
        soldiers:state.zombies.filter(z=>z.type==='terracottaSoldier').map(z=>({r:z.r,c:z.c,summoned:!!z.summoned})),
        guards:state.zombies.filter(z=>z.type==='blackArmorGuard').map(z=>({r:z.r,c:z.c,summoned:!!z.summoned,elite:!!z.elite})),
        labels:[...document.querySelectorAll('.entity .label')].map(node=>node.textContent),
        effects:document.querySelectorAll('.qin-command-fx').length
      };
    };
    return {ordinary:run(.99),super:run(0)};
  });
  expect(result.ordinary.plantDamage).toBe(0);
  expect(result.ordinary.soldiers).toHaveLength(1);
  expect(result.ordinary.soldiers[0]).toMatchObject({r:2,summoned:true});
  expect(result.ordinary.guards).toHaveLength(0);
  expect(result.ordinary.labels).toContain('秦俑屍兵');
  expect(result.ordinary.effects).toBeGreaterThan(0);
  expect(result.super.plantDamage).toBe(0);
  expect(result.super.soldiers).toHaveLength(0);
  expect(result.super.guards).toHaveLength(3);
  expect(result.super.guards.map(unit=>unit.r)).toEqual([1,2,3]);
  expect(result.super.guards.every(unit=>unit.summoned&&unit.elite)).toBeTruthy();
  expect(result.super.labels.filter(label=>label==='玄甲禁軍')).toHaveLength(3);
  expect(result.super.effects).toBeGreaterThan(0);
});

test('named generals gain random super-skill chance with level while strategists stay excluded', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    const heroes = ['firepea','huangzhong','zhaoyun','machao','zhangfei','liubei'];
    return {
      level1: heroes.map(key => superSkillChance(key, 1)),
      level10: heroes.map(key => superSkillChance(key, 10)),
      capped: heroes.map(key => superSkillChance(key, 99)),
      lowRoll: heroes.map(key => rollSuperSkill(key, () => 0.249)),
      highRoll: heroes.map(key => rollSuperSkill(key, () => 0.99)),
      excluded: ['kongming','pangtong'].map(key => ({chance: superSkillChance(key, 99), roll: rollSuperSkill(key, () => 0)})),
      ui: (() => { showCharacterDetail('plants','firepea'); return {detail:document.querySelector('#charModalSkill').textContent,stats:document.querySelector('#charModalStats').textContent}; })()
    };
  });
  expect(result.level1).toEqual([0.25,0.25,0.25,0.25,0.25,0.25]);
  expect(result.level10).toEqual([0.43,0.43,0.43,0.43,0.43,0.43]);
  expect(result.capped).toEqual([0.6,0.6,0.6,0.6,0.6,0.6]);
  expect(result.lowRoll.every(Boolean)).toBeTruthy();
  expect(result.highRoll.some(Boolean)).toBeFalsy();
  expect(result.excluded).toEqual([{chance:0,roll:false},{chance:0,roll:false}]);
  expect(result.ui.detail).toContain('目前 Lv.1 發動率 25%');
  expect(result.ui.detail).toContain('天賦：火焰效果（固定生效）');
  expect(result.ui.detail).toContain('機率技能：青龍爆擊');
  expect(result.ui.detail).not.toContain('未觸發時只使用普通攻擊');
  expect(result.ui.stats).toContain('25%（下級 27%）');
});

test('character guide lighting follows real campaign unlock progress instead of the selected level', async ({ page }) => {
  await openApp(page);
  const result=await page.evaluate(() => {
    playerProfile=normalizeProfile({});
    selectedLevel=10;
    buildCharacterGrid('plants');
    const before={
      guanyu:document.querySelector('#characterGrid .type-firepea').classList.contains('locked'),
      zhaoyun:document.querySelector('#characterGrid .type-zhaoyun').classList.contains('locked')
    };
    completeCampaignLevel('plants',1);
    selectedLevel=1;
    buildCharacterGrid('plants');
    const afterFirst={
      guanyu:document.querySelector('#characterGrid .type-firepea').classList.contains('locked'),
      zhaoyun:document.querySelector('#characterGrid .type-zhaoyun').classList.contains('locked')
    };
    completeCampaignLevel('plants',2);
    buildCharacterGrid('plants');
    const afterSecond={zhaoyun:document.querySelector('#characterGrid .type-zhaoyun').classList.contains('locked')};
    for(let level=3;level<=10;level++)completeCampaignLevel('plants',level);
    buildCharacterGrid('zombies');
    const attackStart={
      normal:document.querySelector('#characterGrid .type-normal').classList.contains('locked'),
      bucket:document.querySelector('#characterGrid .type-bucket').classList.contains('locked')
    };
    completeCampaignLevel('zombies',1);
    buildCharacterGrid('zombies');
    const afterAttackFirst={bucket:document.querySelector('#characterGrid .type-bucket').classList.contains('locked')};
    return {before,afterFirst,afterSecond,attackStart,afterAttackFirst};
  });
  expect(result).toEqual({
    before:{guanyu:true,zhaoyun:true},
    afterFirst:{guanyu:false,zhaoyun:true},
    afterSecond:{zhaoyun:false},
    attackStart:{normal:false,bucket:true},
    afterAttackFirst:{bucket:false}
  });
});

test('every completed stage lights exactly one additional character guide card', async ({ page }) => {
  await openApp(page);
  const counts = await page.evaluate(() => {
    playerProfile=normalizeProfile({});
    const countUnlocked=roster=>{buildCharacterGrid(roster);return document.querySelectorAll('#characterGrid .char-profile:not(.locked)').length};
    const plants=[countUnlocked('plants')];
    for(let level=1;level<=8;level++){
      completeCampaignLevel('plants',level);
      plants.push(countUnlocked('plants'));
    }
    for(let level=9;level<=10;level++)completeCampaignLevel('plants',level);
    const zombies=[countUnlocked('zombies')];
    for(let level=1;level<=10;level++){
      completeCampaignLevel('zombies',level);
      zombies.push(countUnlocked('zombies'));
    }
    return {plants,zombies};
  });
  expect(counts.plants).toEqual([4,5,6,7,8,9,10,11,12]);
  expect(counts.zombies).toEqual([2,3,4,5,6,7,8,9,10,11,12]);
});

test('character guide cards use a complete ability block and align their footer', async ({ page }) => {
  await openApp(page);
  const result=await page.evaluate(() => {
    playerProfile=normalizeProfile({});
    for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
    buildCharacterGrid('plants');
    const cards=[...document.querySelectorAll('#characterGrid .char-profile')];
    const basic=document.querySelector('#characterGrid .type-peashooter');
    const talented=document.querySelector('#characterGrid .type-firepea');
    return {
      allHaveAbility:cards.every(card=>!!card.querySelector('.ability-summary')),
      basicText:basic.querySelector('.ability-summary')?.textContent||'',
      talentText:talented.querySelector('.ability-summary')?.textContent||'',
      footerDelta:Math.abs(basic.querySelector('.statusline').getBoundingClientRect().bottom-talented.querySelector('.statusline').getBoundingClientRect().bottom)
    };
  });
  expect(result.allHaveAbility).toBeTruthy();
  expect(result.basicText).toContain('招式：基礎遠程射箭');
  expect(result.basicText).toContain('影響範圍：同一路全線');
  expect(result.talentText).toContain('天賦：火焰效果');
  expect(result.footerDelta).toBeLessThanOrEqual(1);
});

test('character guide cards explain every random super skill before opening details', async ({ page }) => {
  await openApp(page);
  const summaries = await page.evaluate(() => {
    playerProfile = normalizeProfile({});
    buildCharacterGrid('plants');
    return Object.fromEntries(['firepea','huangzhong','zhaoyun','machao','zhangfei','liubei'].map(key => [key, document.querySelector(`#characterGrid .type-${key}`).textContent]));
  });
  const talentNames = {firepea:'火焰效果',huangzhong:'上、中、下三列效果',zhaoyun:'寒冰效果',machao:'穿刺三格效果',zhangfei:'彈開效果',liubei:'召喚將士'};
  const randomSkillNames = {firepea:'青龍爆擊',huangzhong:'百箭爆擊',zhaoyun:'冰龍爆擊',machao:'鐵騎爆擊',zhangfei:'震軍爆擊',liubei:'白毦號令'};
  for (const [key, text] of Object.entries(summaries)) {
    expect(text).toContain(`天賦：${talentNames[key]}`);
    expect(text).toContain(`機率技能：${randomSkillNames[key]}`);
    expect(text).toContain('Lv.1 發動率 25%');
    expect(text).toContain('每升一級 +2%，最高 60%');
  }
});

test('character guide uses balanced ability sections and labels key zombie talents', async ({ page }) => {
  await openApp(page);
  const result=await page.evaluate(() => {
    playerProfile=normalizeProfile({});
    buildCharacterGrid('plants');
    const plantCards=[...document.querySelectorAll('#characterGrid .char-profile')];
    const plant={
      allHaveAbility:plantCards.every(card=>card.querySelector('.ability-summary')),
      basic:document.querySelector('#characterGrid .type-peashooter .ability-summary')?.textContent,
      kongming:document.querySelector('#characterGrid .type-kongming .ability-summary')?.textContent,
      pangtong:document.querySelector('#characterGrid .type-pangtong .ability-summary')?.textContent,
      cardDisplay:getComputedStyle(plantCards[0]).display,
      statusMargin:getComputedStyle(plantCards[0].querySelector('.statusline')).marginTop
    };
    buildCharacterGrid('zombies');
    const zombieCards=[...document.querySelectorAll('#characterGrid .char-profile')];
    const zombie={
      allHaveAbility:zombieCards.every(card=>card.querySelector('.ability-summary')),
      basic:document.querySelector('#characterGrid .type-normal .ability-summary')?.textContent,
      talents:Object.fromEntries(['football','jester','bombJester','corpseTitan','fireCatapult','qinEmperor','necromancer'].map(key=>[key,document.querySelector(`#characterGrid .type-${key} .ability-summary`)?.textContent]))
    };
    showCharacterDetail('zombies','corpseTitan');
    zombie.detail=document.querySelector('#charModalSkill').textContent;
    return {plant,zombie};
  });
  expect(result.plant.allHaveAbility).toBeTruthy();
  expect(result.plant.basic).toContain('招式：');
  expect(result.plant.kongming).toContain('天賦：雷鎖八門');
  expect(result.plant.pangtong).toContain('天賦：鳳火燎原');
  expect(result.plant.cardDisplay).toBe('flex');
  expect(result.plant.statusMargin).toBe('0px');
  expect(result.zombie.allHaveAbility).toBeTruthy();
  expect(result.zombie.basic).toContain('招式：');
  const expected={football:'屍王疾行',jester:'亂陣狂笑',bombJester:'終幕爆彈',corpseTitan:'破城震擊',fireCatapult:'烈焰轟石',qinEmperor:'兵馬俑召令',necromancer:'幽冥禁咒'};
  for(const [key,name] of Object.entries(expected))expect(result.zombie.talents[key]).toContain(`天賦：${name}`);
  expect(result.zombie.detail).toContain('天賦：破城震擊（固定生效）');
});

test('Kongming and Pang Tong one-use talents apply slow and lingering burn', async ({ page }) => {
  await openApp(page);
  const result=await page.evaluate(() => {
    playerProfile=normalizeProfile({});
    for(let level=1;level<=7;level++)completeCampaignLevel('plants',level);
    selectedLevel=7;
    start('plants');
    clearInterval(timer);
    state.time=1000;
    state.plants=[];
    state.zombies=[{id:'target',type:'normal',r:2,c:6,hp:500,maxHp:500,last:0,bornAt:0,jumped:false,shootLast:-999999}];
    addPlant('kongming',2,2);
    actPlants();
    const kongming={hp:state.zombies[0].hp,slowFor:state.zombies[0].slowUntil-state.time,expires:!!state.plants[0].expireAt};

    state.time=5000;
    state.plants=[];
    state.zombies=[0,1,2,3,4].map(r=>({id:`z${r}`,type:'normal',r,c:6,hp:500,maxHp:500,last:0,bornAt:0,jumped:false,shootLast:-999999}));
    addPlant('pangtong',2,2);
    actPlants();
    const afterStrike=state.zombies.map(z=>z.hp);
    for(const time of [6000,7000,8000]){state.time=time;processLingeringEffects()}
    const afterBurn=state.zombies.map(z=>z.hp);
    return {kongming,afterStrike,afterBurn,pangtongExpires:!!state.plants[0].expireAt};
  });
  expect(result.kongming).toEqual({hp:350,slowFor:4000,expires:true});
  expect(result.afterStrike).toEqual([500,270,270,270,500]);
  expect(result.afterBurn).toEqual([500,195,195,195,500]);
  expect(result.pangtongExpires).toBeTruthy();
});

test('defender removal mode frees an occupied cell without refunding grain', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    selectedLevel = 1;
    start('plants');
    clearInterval(timer);
    state.resource = 200;
    addPlant('peashooter', 2, 2);
    setBattleActionMode('remove');
    place(2, 2);
    return {
      remaining: state.plants.length,
      resource: state.resource,
      mode: state.actionMode,
      buttonText: document.querySelector('#removeUnitBtn').textContent
    };
  });
  expect(result).toEqual({remaining:0,resource:200,mode:null,buttonText:'🪏 移除武將'});
});

test('only Zhao Yun and Ma Chao can change to an adjacent lane for 40 grain after cooldown', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    for (let level=1; level<4; level++) completeCampaignLevel('plants', level);
    selectedLevel = 4;
    start('plants');
    clearInterval(timer);
    state.plants = [];
    state.resource = 100;
    state.time = 0;
    addPlant('zhaoyun', 2, 2);
    state.time = 8000;
    setBattleActionMode('relocate');
    place(2, 2);
    place(1, 2);
    const moved = {...state.plants[0], resource:state.resource};

    state.time = 12000;
    setBattleActionMode('relocate');
    place(1, 2);
    place(0, 2);
    const cooling = {...state.plants[0], resource:state.resource};

    addPlant('wallnut', 4, 4);
    state.time = 30000;
    setBattleActionMode('relocate');
    place(4, 4);
    const wallnutSelected = state.movingPlantId;
    showCharacterDetail('plants','zhaoyun');
    return {moved,cooling,wallnutSelected,skillText:document.querySelector('#charModalSkill').textContent};
  });
  expect([result.moved.r,result.moved.c,result.moved.resource]).toEqual([1,2,60]);
  expect([result.cooling.r,result.cooling.c,result.cooling.resource]).toEqual([1,2,60]);
  expect(result.wallnutSelected).toBeNull();
  expect(result.skillText).toContain('可調動到同欄相鄰一路');
  expect(result.skillText).toContain('消耗 40 軍糧');
  expect(result.skillText).toContain('冷卻 8 秒');
});

test('defense stages last through larger finite zombie armies instead of fixed survival timers', async ({ page }) => {
  await openApp(page);
  const pacing = await page.evaluate(() => Object.values(LEVELS).map(level => ({
    level:level.level,
    enemyCount:level.enemyCount,
    firstZombieDelay:level.firstZombieDelay,
    minSpawnSpacing:level.minSpawnSpacing,
    attackTimeLimit:level.attackTimeLimit
  })));
  expect(pacing.map(level => level.enemyCount)).toEqual([14,16,18,20,22,25,28,31,34,36]);
  expect(pacing.every(level => level.firstZombieDelay >= (level.level <= 4 ? 7000 : 9000))).toBeTruthy();
  expect(pacing.every(level => level.minSpawnSpacing >= 4000)).toBeTruthy();

  const defense = await page.evaluate(() => {
    selectedLevel=1;
    start('plants');
    clearInterval(timer);
    state.time=999999;
    state.bossSpawned=false;
    state.enemiesSpawned=state.levelConfig.enemyCount-1;
    state.zombies=[];
    checkEnd();
    const noTimerWin=!state.over;
    state.enemiesSpawned=state.levelConfig.enemyCount;
    state.nextAI=state.time;
    processLevelEvents();
    const bossCount=state.zombies.filter(z=>z.boss).length;
    state.zombies=[];
    checkEnd();
    return {noTimerWin,bossCount,wonAfterArmyCleared:state.over,title:document.querySelector('#modalTitle').textContent};
  });
  expect(defense).toEqual({noTimerWin:true,bossCount:1,wonAfterArmyCleared:true,title:'防守成功！'});

  const attack = await page.evaluate(() => {
    for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
    selectedLevel=1;start('zombies');clearInterval(timer);state.resource=0;state.zombies=[];state.time=9000;checkEnd();
    const survivesEmptyMoment=!state.over;
    state.time=state.levelConfig.attackTimeLimit+1;checkEnd();
    return {survivesEmptyMoment,overAtDeadline:state.over,title:document.querySelector('#modalTitle').textContent};
  });
  expect(attack).toEqual({survivesEmptyMoment:true,overAtDeadline:true,title:'進攻失敗'});
});

test('leaving a battle for level select keeps a paused cache that resumes at the exact state', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    selectedLevel=1;
    start('plants');
    clearInterval(timer);
    state.time=23450;
    state.resource=287;
    addPlant('peashooter',2,2);
    addZombie('normal',7.2,2);
    render();
  });

  await page.locator('#gameFloatBackBtn').click();
  await expect(page.locator('#levelScreen')).toHaveClass(/active/);
  await expect(page.locator('#profile')).not.toHaveClass(/active/);
  const cached=await page.evaluate(()=>JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY)||'null'));
  expect(cached?.state).toMatchObject({time:23450,resource:287,paused:true,level:1,faction:'plants'});
  await expect(page.locator('#resumeBattleLevelBtn')).toBeVisible();

  await page.locator('#resumeBattleLevelBtn').click();
  await expect(page.locator('#game')).toHaveClass(/active/);
  await expect(page.locator('#pauseOverlay')).toHaveClass(/show/);
  const resumed=await page.evaluate(()=>({time:state.time,resource:state.resource,plants:state.plants.length,zombies:state.zombies.length,paused:state.paused}));
  expect(resumed).toEqual({time:23450,resource:287,plants:1,zombies:1,paused:true});
});

test('battle home button returns to the main menu and offers the cached battle', async ({ page }) => {
  await openApp(page);
  await page.evaluate(()=>{
    selectedLevel=1;
    start('plants');
    clearInterval(timer);
    state.time=14500;
    state.resource=246;
  });

  await page.locator('#backBtn').click();
  await expect(page.locator('#start')).toHaveClass(/active/);
  await expect(page.locator('#profile')).not.toHaveClass(/active/);
  await expect(page.locator('#resumeBattleBtn')).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY)).state.time)).toBe(14500);

  await page.locator('#resumeBattleBtn').click();
  await expect(page.locator('#game')).toHaveClass(/active/);
  expect(await page.evaluate(()=>({time:state.time,resource:state.resource,paused:state.paused}))).toEqual({time:14500,resource:246,paused:true});
});

test('resume card keeps every desktop main-menu action inside the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name!=='desktop');
  await openApp(page);
  await page.evaluate(()=>{selectedLevel=1;start('plants');clearInterval(timer);state.time=12000;backToHome()});
  const bounds=await page.evaluate(()=>{
    const resume=document.querySelector('#resumeBattleCard').getBoundingClientRect();
    const shop=document.querySelector('#shopBtn').closest('.mode-banner').getBoundingClientRect();
    return {resumeTop:resume.top,shopBottom:shop.bottom,viewport:innerHeight};
  });
  expect(bounds.resumeTop).toBeGreaterThanOrEqual(0);
  expect(bounds.shopBottom).toBeLessThanOrEqual(bounds.viewport);
});

test('mobile resume menu uses normal page scrolling without a nested clipped action list', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name!=='mobile');
  await openApp(page);
  await page.evaluate(()=>{selectedLevel=1;start('plants');clearInterval(timer);backToHome()});
  const layout=await page.evaluate(()=>{
    const actions=document.querySelector('.main-actions.clean');
    return {clientHeight:actions.clientHeight,scrollHeight:actions.scrollHeight,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth};
  });
  expect(layout.scrollHeight).toBe(layout.clientHeight);
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
});

test('unfinished battle cache does not expire merely because the player was away for a long time', async ({ page }) => {
  await openApp(page);
  await page.evaluate(()=>{
    selectedLevel=1;
    start('plants');
    clearInterval(timer);
    state.time=32100;
    state.resource=199;
    persistBattleState();
    const snapshot=JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY));
    snapshot.savedAt=Date.now()-30*24*60*60*1000;
    localStorage.setItem(BATTLE_SAVE_KEY,JSON.stringify(snapshot));
    document.querySelector('#game').classList.remove('active');
  });

  await page.reload();
  await expect(page.locator('#game')).toHaveClass(/active/);
  expect(await page.evaluate(()=>({time:state.time,resource:state.resource,paused:state.paused}))).toEqual({time:32100,resource:199,paused:true});
});

test('invalid battle cache is cleared and never opens a broken resume screen', async ({ page }) => {
  await openApp(page);
  const result=await page.evaluate(()=>{
    localStorage.setItem(BATTLE_SAVE_KEY,JSON.stringify({version:BATTLE_SAVE_VERSION+1,state:{level:1,faction:'plants'}}));
    const restored=restoreBattleIfAvailable();
    return {restored,cached:localStorage.getItem(BATTLE_SAVE_KEY),resumeHidden:document.querySelector('#resumeBattleCard').classList.contains('hidden'),homeActive:document.querySelector('#start').classList.contains('active')};
  });
  expect(result).toEqual({restored:false,cached:null,resumeHidden:true,homeActive:true});
});

test('browser back during a battle stays in the app and caches the paused game', async ({ page }) => {
  await openApp(page);
  const appUrl=page.url();
  await page.evaluate(()=>{
    selectedLevel=1;
    start('plants');
    clearInterval(timer);
    state.time=17800;
    state.resource=211;
  });

  await page.goBack();
  await expect(page).toHaveURL(appUrl);
  await expect(page.locator('#start')).toHaveClass(/active/);
  await expect(page.locator('#profile')).not.toHaveClass(/active/);
  const cached=await page.evaluate(()=>JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY)||'null'));
  expect(cached?.state).toMatchObject({time:17800,resource:211,paused:true});
});

test('manual pause and background restore preserve the unfinished battle without advancing time', async ({ page }) => {
  await openApp(page);
  const beforeReload = await page.evaluate(() => {
    selectedLevel = 1;
    start('plants');
    clearInterval(timer);
    state.time = 12350;
    state.resource = 333;
    addPlant('peashooter', 2, 2);
    addZombie('normal', 7.5, 2);
    togglePause();
    const manualSaved = JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY));
    togglePause();
    pauseAndSaveBattle('background');
    tick();
    return {manualSavedTime:manualSaved.state.time,paused:state.paused,timeAfterTick:state.time};
  });
  expect(beforeReload).toEqual({manualSavedTime:12350,paused:true,timeAfterTick:12350});

  await page.reload();
  await expect(page.locator('#game')).toHaveClass(/active/);
  await expect(page.locator('#pauseOverlay')).toHaveClass(/show/);
  const restored = await page.evaluate(() => {
    clearInterval(timer);
    const value = {level:state.level,time:state.time,resource:state.resource,plants:state.plants.length,zombies:state.zombies.length,paused:state.paused,pauseLabel:document.querySelector('#pauseBtn').textContent};
    tick();
    value.timeAfterPausedTick = state.time;
    togglePause();
    value.pausedAfterContinue = state.paused;
    return value;
  });
  expect(restored).toEqual({level:1,time:12350,resource:333,plants:1,zombies:1,paused:true,pauseLabel:'繼續',timeAfterPausedTick:12350,pausedAfterContinue:false});
});

test('visible battle action controls work by tap and stay disabled for attackers', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    selectedLevel = 1;
    start('plants');
    clearInterval(timer);
    state.resource = 200;
    addPlant('peashooter', 2, 2);
    render();
  });
  await expect(page.locator('#removeUnitBtn')).toBeEnabled();
  await page.locator('#removeUnitBtn').click();
  await expect(page.locator('#removeUnitBtn')).toHaveClass(/active/);
  await page.locator('.cell[data-r="2"][data-c="2"]').click();
  expect(await page.evaluate(() => state.plants.length)).toBe(0);
  expect(await page.evaluate(() => state.resource)).toBe(200);

  await page.evaluate(() => {
    for (let level=1;level<=10;level++) completeCampaignLevel('plants',level);
    selectedLevel=1;
    start('zombies');
    clearInterval(timer);
  });
  await expect(page.locator('#removeUnitBtn')).toBeDisabled();
  await expect(page.locator('#relocateUnitBtn')).toBeDisabled();
});

test('general talents always apply while random super skills only add their stronger bonus', async ({ page }) => {
  await openApp(page);
  const result = await page.evaluate(() => {
    for(let level=1;level<=9;level++) completeCampaignLevel('plants',level);
    const effectSelector = '.guanyu-dragon-fx,.zhaoyun-ice-fx,.lance-dash-fx,.huangzhong-volley-fx,.zhangfei-roar-fx,.liubei-benevolence-fx';
    const run = (key, roll) => {
      selectedLevel = 10;
      start('plants');
      clearInterval(timer);
      state.time = 10000;
      state.plants = [];
      state.zombies = [];
      state.projectiles = [];
      document.querySelectorAll(effectSelector).forEach(node => node.remove());
      addPlant(key, 2, 2);
      const hero = state.plants[0];
      hero.last = 0;
      const positions = key === 'machao' ? [[2,3.5],[2,4.2],[2,4.9]] : key === 'zhangfei' ? [[2,2.7]] : [[1,4],[2,4],[3,4]];
      positions.forEach(([r,c]) => addZombie('normal', c, r));
      const beforeHp = state.zombies.map(z => z.hp);
      const beforeC = state.zombies.map(z => z.c);
      const savedRandom = Math.random;
      Math.random = () => roll;
      actPlants();
      Math.random = savedRandom;
      render();
      return {
        effects: document.querySelectorAll(effectSelector).length,
        projectiles: state.projectiles.map(p => ({damage:p.damage,fire:!!p.fire,slow:!!p.slow,r:p.r})),
        damaged: state.zombies.filter((z,i) => z.hp < beforeHp[i]).length,
        totalDamage: state.zombies.reduce((sum,z,i) => sum + beforeHp[i] - z.hp, 0),
        moved: state.zombies.some((z,i) => z.c > beforeC[i]),
        militia: state.plants.filter(p => p.type === 'swordSoldier').map(p=>({hp:p.maxHp,damage:PLANT_TYPES[p.type].damage,elite:!!p.elite,c:p.c})),
        elites: state.plants.filter(p => p.type === 'whiteFeatherGuard').map(p=>({hp:p.maxHp,damage:PLANT_TYPES[p.type].damage,elite:!!p.elite,c:p.c})),
        militiaLabels:[...document.querySelectorAll('.entity.type-swordSoldier .label')].map(x=>x.textContent),
        eliteLabels:[...document.querySelectorAll('.entity.type-whiteFeatherGuard .label')].map(x=>x.textContent)
      };
    };
    const heroes = ['firepea','zhaoyun','machao','huangzhong','zhangfei','liubei'];
    return Object.fromEntries(heroes.map(key => [key,{ordinary:run(key,.99),super:run(key,0)}]));
  });
  for (const [key,pair] of Object.entries(result)) {
    expect(pair.super.effects, `${key} super`).toBeGreaterThan(0);
  }
  expect(result.firepea.ordinary.projectiles[0].fire).toBeTruthy();
  expect(result.firepea.super.projectiles[0].fire).toBeTruthy();
  expect(result.firepea.super.projectiles[0].damage).toBeGreaterThan(result.firepea.ordinary.projectiles[0].damage);
  expect(result.zhaoyun.ordinary.projectiles[0].slow).toBeTruthy();
  expect(result.zhaoyun.super.projectiles[0].slow).toBeTruthy();
  expect(result.zhaoyun.super.projectiles[0].damage).toBeGreaterThan(result.zhaoyun.ordinary.projectiles[0].damage);
  expect(result.machao.ordinary.damaged).toBe(3);
  expect(result.machao.super.damaged).toBe(3);
  expect(result.machao.super.totalDamage).toBeGreaterThan(result.machao.ordinary.totalDamage);
  expect(result.huangzhong.ordinary.projectiles).toHaveLength(3);
  expect(result.huangzhong.super.projectiles).toHaveLength(3);
  expect(result.huangzhong.super.projectiles[0].damage).toBeGreaterThan(result.huangzhong.ordinary.projectiles[0].damage);
  expect(result.zhangfei.ordinary.moved).toBeTruthy();
  expect(result.zhangfei.super.moved).toBeTruthy();
  expect(result.zhangfei.super.totalDamage).toBeGreaterThan(result.zhangfei.ordinary.totalDamage);
  expect(result.liubei.ordinary.projectiles).toHaveLength(0);
  expect(result.liubei.ordinary.militia).toHaveLength(1);
  expect(result.liubei.ordinary.elites).toHaveLength(0);
  expect(result.liubei.super.projectiles).toHaveLength(0);
  expect(result.liubei.super.militia).toHaveLength(0);
  expect(result.liubei.super.elites).toHaveLength(3);
  expect(result.liubei.super.elites[0].hp).toBeGreaterThan(result.liubei.ordinary.militia[0].hp);
  expect(result.liubei.super.elites[0].damage).toBeGreaterThan(result.liubei.ordinary.militia[0].damage);
  expect(result.liubei.super.elites.every(s=>s.elite)).toBeTruthy();
  expect(result.liubei.super.elites[0].c).toBeGreaterThan(result.liubei.ordinary.militia[0].c);
  expect(result.liubei.ordinary.militiaLabels).toEqual(['蜀軍鄉勇']);
  expect(result.liubei.super.eliteLabels).toEqual(['白毦禁衛','白毦禁衛','白毦禁衛']);
});

test('character descriptions separate fixed talents from random skills', async ({ page }) => {
  await openApp(page);
  const details=await page.evaluate(()=>Object.fromEntries(['firepea','zhaoyun','zhangfei','huangzhong','machao','liubei'].map(key=>[key,skillDetail(key,effectiveUnit('plants',key),'plants')])));
  const talents={firepea:'火焰',zhaoyun:'寒冰',zhangfei:'彈開',huangzhong:'上、中、下三列',machao:'穿刺三格',liubei:'召喚將士'};
  for(const [key,detail] of Object.entries(details)){
    expect(detail).toContain(`天賦：${talents[key]}`);
    expect(detail).toContain('機率技能：');
    expect(detail).not.toContain('未觸發時只使用普通攻擊');
  }
});

test('defense campaign waits before zombies, eases from slow opening to steady pressure, and ends with one boss', async ({ page }) => {
  await openApp(page);
  const campaign = await page.evaluate(() => Object.values(LEVELS).map(level => ({
    level:level.level,difficultyRank:level.difficultyRank,firstZombieDelay:level.firstZombieDelay,
    openingSpacing:level.openingSpacing,minSpawnSpacing:level.minSpawnSpacing,enemyCount:level.enemyCount,bossType:level.bossType
  })));
  expect(campaign.map(level=>level.difficultyRank)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  expect(campaign.map(level=>level.enemyCount)).toEqual([14,16,18,20,22,25,28,31,34,36]);
  expect(campaign.every(level=>level.firstZombieDelay>=7000&&level.openingSpacing>=6300&&level.minSpawnSpacing>=4000&&level.bossType)).toBeTruthy();

  const runtime=await page.evaluate(()=>{
    for(let level=1;level<=9;level++)completeCampaignLevel('plants',level);
    selectedLevel=10;start('plants');clearInterval(timer);
    const noImmediateZombie=state.zombies.length===0;
    state.time=LEVELS[10].firstZombieDelay-1;processLevelEvents();
    const stillWaiting=state.zombies.length===0;
    state.time=LEVELS[10].firstZombieDelay;processLevelEvents();
    const firstWaveCount=state.zombies.length;
    const savedRandom=Math.random;Math.random=()=>0.5;
    state.enemiesSpawned=1;const earlyPace=aiPace('zombies');
    state.enemiesSpawned=Math.floor(LEVELS[10].enemyCount/2);const midPace=aiPace('zombies');
    state.enemiesSpawned=LEVELS[10].enemyCount-1;const latePace=aiPace('zombies');
    Math.random=savedRandom;
    state.enemiesSpawned=LEVELS[10].enemyCount;state.openingQueue=[];state.nextAI=state.time;processLevelEvents();
    const bosses=state.zombies.filter(z=>z.boss);processLevelEvents();
    return {noImmediateZombie,stillWaiting,firstWaveCount,earlyPace,midPace,latePace,bossCount:state.zombies.filter(z=>z.boss).length,bossHp:bosses[0]?.maxHp||0,baseHp:bosses[0]?ZOMBIE_TYPES[bosses[0].type].hp:0};
  });
  expect(runtime.noImmediateZombie).toBeTruthy();
  expect(runtime.stillWaiting).toBeTruthy();
  expect(runtime.firstWaveCount).toBe(1);
  expect(runtime.earlyPace).toBeGreaterThan(runtime.midPace);
  expect(runtime.midPace).toBeGreaterThan(runtime.latePace);
  expect(runtime.latePace).toBeGreaterThanOrEqual(4000);
  expect(runtime.bossCount).toBe(1);
  expect(runtime.bossHp).toBeGreaterThan(runtime.baseHp);

  const bossesByLevel=await page.evaluate(()=>{
    for(let level=1;level<=10;level++)completeCampaignLevel('plants',level);
    return Object.values(LEVELS).map(level=>{
      selectedLevel=level.level;start('plants');clearInterval(timer);
      state.enemiesSpawned=level.enemyCount;state.openingQueue=[];state.time=10000;state.nextAI=state.time;
      processLevelEvents();processLevelEvents();const boss=state.zombies.find(z=>z.boss);
      return {level:level.level,count:state.zombies.filter(z=>z.boss).length,type:boss?.type,row:boss?.r,hp:boss?.maxHp||0,baseHp:boss?ZOMBIE_TYPES[boss.type].hp:0};
    });
  });
  expect(bossesByLevel.every(boss=>boss.count===1&&boss.type)).toBeTruthy();
  expect(bossesByLevel.every(boss=>boss.row>=1&&boss.row<=3)).toBeTruthy();
  expect(bossesByLevel.every(boss=>boss.hp>boss.baseHp)).toBeTruthy();
});

test('linear campaign migration protects faction progress and locks server matches', async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202609060001_linear_campaign_progression.sql'), 'utf8');
  for (const marker of ["- 'campaignProgress'", "profile->'campaignProgress'", "p_faction='zombies'", "raise exception 'FACTION_LOCKED'", "raise exception 'LEVEL_LOCKED'", "array[p_faction,'completedLevels']", "array[v_match.faction]"]) expect(sql).toContain(marker);
  expect(sql).toContain("where not (profile ? 'campaignProgress')");
  expect(sql).toMatch(/for v_i in 1\.\.10 loop/g);
});

test('server accepts legitimate attack wins after eight seconds while preserving defense timing checks', async () => {
  const migrationsDir=path.join(__dirname,'..','supabase','migrations');
  const sql=fs.readdirSync(migrationsDir).sort().map(name=>fs.readFileSync(path.join(migrationsDir,name),'utf8')).join('\n');
  expect(sql).toMatch(/v_minimum_seconds\s*:=\s*case\s+when\s+v_match\.faction\s*=\s*'zombies'\s+then\s+8\s+else\s+30\s*\+\s*v_match\.level_no\s*\*\s*6\s+end/i);
  expect(sql).toMatch(/now\(\)\s*-\s*v_match\.started_at\s*<\s*make_interval\(secs\s*=>\s*v_minimum_seconds\)/i);
});

test('migration defines atomic lock and authoritative economy RPCs', async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202609020001_production_foundation.sql'), 'utf8');
  for (const marker of ['for update','sgz_claim_device','sgz_heartbeat','sgz_save_profile','sgz_release_device','sgz_buy_item','sgz_equip_item','sgz_activate_skin','sgz_upgrade_character','security definer','auth.uid()','p_initial_profile','revoke all on function','supabase_realtime',"- 'highestLevel'","- 'completedLevels'",'revoke insert,update,delete']) expect(sql.toLowerCase()).toContain(marker.toLowerCase());
  expect(sql).toMatch(/sgz_claim_level_reward\(p_device_id text,p_match_id uuid,p_character_key text/);
  expect(sql).not.toMatch(/sgz_claim_level_reward\([^)]*p_won/);
});
