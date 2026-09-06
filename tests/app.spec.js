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
  expect(initial.attackDisabled).toBeTruthy();
  expect(initial.attackText).toContain('守城第十關後解鎖');
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
  expect(result.ui.detail).toContain('未觸發時只使用普通攻擊');
  expect(result.ui.stats).toContain('25%（下級 27%）');
});

test('general effects and critical mechanics only appear when the random super skill triggers', async ({ page }) => {
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
      return {
        effects: document.querySelectorAll(effectSelector).length,
        projectiles: state.projectiles.map(p => ({damage:p.damage,fire:!!p.fire,slow:!!p.slow,r:p.r})),
        damaged: state.zombies.filter((z,i) => z.hp < beforeHp[i]).length,
        totalDamage: state.zombies.reduce((sum,z,i) => sum + beforeHp[i] - z.hp, 0),
        moved: state.zombies.some((z,i) => z.c > beforeC[i]),
        soldiers: state.plants.filter(p => p.type === 'swordSoldier').length
      };
    };
    const heroes = ['firepea','zhaoyun','machao','huangzhong','zhangfei','liubei'];
    return Object.fromEntries(heroes.map(key => [key,{ordinary:run(key,.99),super:run(key,0)}]));
  });
  for (const [key,pair] of Object.entries(result)) {
    expect(pair.ordinary.effects, `${key} ordinary`).toBe(0);
    expect(pair.super.effects, `${key} super`).toBeGreaterThan(0);
  }
  expect(result.firepea.ordinary.projectiles[0].fire).toBeFalsy();
  expect(result.firepea.super.projectiles[0].fire).toBeTruthy();
  expect(result.firepea.super.projectiles[0].damage).toBeGreaterThan(result.firepea.ordinary.projectiles[0].damage);
  expect(result.zhaoyun.ordinary.projectiles[0].slow).toBeFalsy();
  expect(result.zhaoyun.super.projectiles[0].slow).toBeTruthy();
  expect(result.machao.ordinary.damaged).toBe(1);
  expect(result.machao.super.damaged).toBe(3);
  expect(result.huangzhong.ordinary.projectiles).toHaveLength(1);
  expect(result.huangzhong.super.projectiles).toHaveLength(3);
  expect(result.zhangfei.ordinary.moved).toBeFalsy();
  expect(result.zhangfei.super.moved).toBeTruthy();
  expect(result.zhangfei.super.totalDamage).toBeGreaterThan(result.zhangfei.ordinary.totalDamage);
  expect(result.liubei.ordinary.soldiers).toBe(0);
  expect(result.liubei.ordinary.projectiles).toHaveLength(1);
  expect(result.liubei.super.soldiers).toBe(3);
});

test('defense campaign waits before zombies, accelerates over time, and ends with a boss', async ({ page }) => {
  await openApp(page);
  const campaign = await page.evaluate(() => Object.values(LEVELS).map(level => ({
    level: level.level,
    difficultyRank: level.difficultyRank,
    firstZombieDelay: level.firstZombieDelay,
    openingSpacing: level.openingSpacing,
    winAfter: level.winAfter,
    bossAt: level.bossAt,
    bossType: level.bossType
  })));
  expect(campaign.map(level => level.difficultyRank)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  expect(campaign.map(level => level.winAfter)).toEqual([35000,40000,45000,50000,55000,60000,65000,70000,75000,80000]);
  expect(campaign.every(level => level.firstZombieDelay === (level.level <= 4 ? 5000 : 7000))).toBeTruthy();
  expect(campaign.every(level => level.openingSpacing >= 2800 && level.bossAt < level.winAfter && level.bossType)).toBeTruthy();
  expect(campaign[8].openingSpacing).toBeGreaterThanOrEqual(4500);
  expect(campaign[9].openingSpacing).toBeGreaterThanOrEqual(4500);

  const runtime = await page.evaluate(() => {
    for(let level=1;level<=9;level++) completeCampaignLevel('plants',level);
    selectedLevel = 10;
    start('plants');
    clearInterval(timer);
    const noImmediateZombie = state.zombies.length === 0;
    state.time = LEVELS[10].firstZombieDelay - 1;
    processLevelEvents();
    const stillWaiting = state.zombies.length === 0;
    state.time = LEVELS[10].firstZombieDelay;
    processLevelEvents();
    const firstWaveCount = state.zombies.length;
    const savedRandom = Math.random;
    Math.random = () => 0.5;
    state.time = 12000;
    const earlyPace = aiPace('zombies');
    state.time = 42000;
    const midPace = aiPace('zombies');
    state.time = LEVELS[10].bossAt - 1000;
    const latePace = aiPace('zombies');
    Math.random = savedRandom;
    state.time = LEVELS[10].bossAt;
    processLevelEvents();
    const bosses = state.zombies.filter(z => z.boss);
    processLevelEvents();
    return {
      noImmediateZombie,
      stillWaiting,
      firstWaveCount,
      earlyPace,
      midPace,
      latePace,
      bossCount: state.zombies.filter(z => z.boss).length,
      bossHp: bosses[0]?.maxHp || 0,
      baseHp: bosses[0] ? ZOMBIE_TYPES[bosses[0].type].hp : 0
    };
  });
  expect(runtime.noImmediateZombie).toBeTruthy();
  expect(runtime.stillWaiting).toBeTruthy();
  expect(runtime.firstWaveCount).toBe(1);
  expect(runtime.earlyPace).toBeGreaterThan(runtime.midPace);
  expect(runtime.midPace).toBeGreaterThan(runtime.latePace);
  expect(runtime.earlyPace).toBeGreaterThanOrEqual(6500);
  expect(runtime.bossCount).toBe(1);
  expect(runtime.bossHp).toBeGreaterThan(runtime.baseHp);

  const bossesByLevel = await page.evaluate(() => {
    for(let level=1;level<=10;level++) completeCampaignLevel('plants',level);
    return Object.values(LEVELS).map(level => {
    selectedLevel = level.level;
    start('plants');
    clearInterval(timer);
    state.time = level.bossAt;
    processLevelEvents();
    processLevelEvents();
    const boss = state.zombies.find(z => z.boss);
    return {
      level: level.level,
      count: state.zombies.filter(z => z.boss).length,
      type: boss?.type,
      row: boss?.r,
      hp: boss?.maxHp || 0,
      baseHp: boss ? ZOMBIE_TYPES[boss.type].hp : 0
    };
    });
  });
  expect(bossesByLevel.every(boss => boss.count === 1 && boss.type)).toBeTruthy();
  expect(bossesByLevel.every(boss => boss.row >= 1 && boss.row <= 3)).toBeTruthy();
  expect(bossesByLevel.every(boss => boss.hp > boss.baseHp)).toBeTruthy();
});

test('linear campaign migration protects faction progress and locks server matches', async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202609060001_linear_campaign_progression.sql'), 'utf8');
  for (const marker of ["- 'campaignProgress'", "profile->'campaignProgress'", "p_faction='zombies'", "raise exception 'FACTION_LOCKED'", "raise exception 'LEVEL_LOCKED'", "array[p_faction,'completedLevels']", "array[v_match.faction]"]) expect(sql).toContain(marker);
  expect(sql).toContain("where not (profile ? 'campaignProgress')");
  expect(sql).toMatch(/for v_i in 1\.\.10 loop/g);
});

test('migration defines atomic lock and authoritative economy RPCs', async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '202609020001_production_foundation.sql'), 'utf8');
  for (const marker of ['for update','sgz_claim_device','sgz_heartbeat','sgz_save_profile','sgz_release_device','sgz_buy_item','sgz_equip_item','sgz_activate_skin','sgz_upgrade_character','security definer','auth.uid()','p_initial_profile','revoke all on function','supabase_realtime',"- 'highestLevel'","- 'completedLevels'",'revoke insert,update,delete']) expect(sql.toLowerCase()).toContain(marker.toLowerCase());
  expect(sql).toMatch(/sgz_claim_level_reward\(p_device_id text,p_match_id uuid,p_character_key text/);
  expect(sql).not.toMatch(/sgz_claim_level_reward\([^)]*p_won/);
});
