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
      getSession: async () => ({data: {session: null}}),
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

test('home can enter level selection and shop', async ({ page }) => {
  await openApp(page);
  await page.locator('#plantStartBtn').click();
  await expect(page.locator('#levelScreen')).toHaveClass(/active/);
  await page.locator('#backFactionBtn').click();
  await page.locator('#shopBtn').click();
  await expect(page.locator('#shop')).toHaveClass(/active/);
  await expect(page.locator('#shopGrid .shop-item')).toHaveCount(16);
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

test('migration defines atomic lock and authoritative economy RPCs', async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202609020001_production_foundation.sql'), 'utf8');
  for (const marker of ['for update','sgz_claim_device','sgz_heartbeat','sgz_save_profile','sgz_release_device','sgz_buy_item','sgz_equip_item','sgz_activate_skin','sgz_upgrade_character','security definer','auth.uid()','p_initial_profile','revoke all on function','supabase_realtime',"- 'highestLevel'","- 'completedLevels'",'revoke insert,update,delete']) expect(sql.toLowerCase()).toContain(marker.toLowerCase());
  expect(sql).toMatch(/sgz_claim_level_reward\(p_device_id text,p_match_id uuid,p_character_key text/);
  expect(sql).not.toMatch(/sgz_claim_level_reward\([^)]*p_won/);
});
