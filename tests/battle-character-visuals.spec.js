const { test, expect } = require('@playwright/test');

async function openAttackBattle(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/?battle-character-visuals=1');
  await page.evaluate(() => {
    authIdentityResolved = true;
    currentSeason = 1;
    for (let level = 1; level <= 10; level += 1) completeCampaignLevel('plants', level, 1);
    for (let level = 1; level <= 10; level += 1) completeCampaignLevel('zombies', level, 1);
    selectedLevel = 2;
    start('zombies');
    clearInterval(timer);
    state.paused = false;
    state.countdownActive = false;
    state.time = 10_000;
    state.plants = [];
    state.zombies = [];
    state.projectiles = [];
    state.pendingZombieStrikes = [];
    state.pendingPlantShots = [];
  });
}

async function installVisualMeasurement(page) {
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = '.entity,.entity.spawn{animation:none!important}.entity .sprite{animation:none!important}';
    document.head.appendChild(style);
    window.visibleArtworkHeight = async image => {
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      let top = height;
      let bottom = -1;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (data[(y * width + x) * 4 + 3] > 8) {
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      }
      const box = image.getBoundingClientRect();
      return box.height * ((bottom - top + 1) / height);
    };
  });
}

test('standard zombie fighters have the same visible stature as the Three Kingdoms roster', async ({ page }) => {
  await openAttackBattle(page);
  await installVisualMeasurement(page);
  const result = await page.evaluate(async () => {
    const measure = async (side, type) => {
      state.plants = [];
      state.zombies = [];
      if (side === 'plants') addPlant(type, 4, 2);
      else addZombie(type, 4, 2);
      render();
      return visibleArtworkHeight(document.querySelector(`#board .type-${type} .char-img`));
    };
    const shuTypes = ['peashooter', 'sunflower', 'firepea', 'zhangfei', 'zhaoyun', 'huangzhong'];
    const zombieTypes = ['normal', 'cone', 'bucket', 'football', 'jester', 'bombJester'];
    const shuHeights = {};
    const zombieHeights = {};
    for (const type of shuTypes) shuHeights[type] = await measure('plants', type);
    for (const type of zombieTypes) zombieHeights[type] = await measure('zombies', type);
    const shuAverage = Object.values(shuHeights).reduce((sum, value) => sum + value, 0) / shuTypes.length;
    return { shuAverage, shuHeights, zombieHeights };
  });
  for (const [type, height] of Object.entries(result.zombieHeights)) {
    expect(height, `${type} should not look smaller than the Three Kingdoms roster`).toBeGreaterThanOrEqual(result.shuAverage * 0.85);
    expect(height, `${type} should stay close to the Three Kingdoms roster scale`).toBeLessThanOrEqual(result.shuAverage * 1.18);
  }
});

test('player-side zombies show a readable full attack animation', async ({ page }) => {
  await openAttackBattle(page);
  const result = await page.evaluate(() => {
    addPlant('wallnut', 2, 2);
    const defender = state.plants.at(-1);
    addZombie('normal', 2.3, 2);
    const attacker = state.zombies.at(-1);
    attacker.last = 0;
    actZombies();
    const samples = [];
    for (const elapsed of [0, 130, 250, 350]) {
      state.time = attacker.attackStartedAt + elapsed;
      render();
      const image = document.querySelector('#board .type-normal .char-img');
      const sprite = image.closest('.sprite');
      const computed = getComputedStyle(sprite);
      samples.push({
        src: image.getAttribute('src'),
        animationName: computed.animationName,
        animationDuration: computed.animationDuration,
        animationDelay: computed.animationDelay,
        transform: computed.transform,
      });
    }
    state.time = 250;
    attacker.attackStartedAt = 0;
    attacker.attackUntil = 500;
    render();
    const zeroStartedAttackDelay = getComputedStyle(document.querySelector('#board .type-normal .sprite')).animationDelay;
    return {
      faction: state.faction,
      defenderHp: defender.hp,
      pending: state.pendingZombieStrikes.length,
      samples,
      zeroStartedAttackDelay,
    };
  });
  expect(result.faction).toBe('zombies');
  expect(result.pending).toBe(1);
  expect(new Set(result.samples.map(sample => sample.src)).size).toBe(4);
  expect(new Set(result.samples.map(sample => sample.transform)).size).toBeGreaterThanOrEqual(3);
  expect(new Set(result.samples.map(sample => sample.animationDelay)).size).toBe(4);
  expect(Number.parseFloat(result.zeroStartedAttackDelay)).toBeCloseTo(-0.25, 2);
  for (const sample of result.samples) {
    expect(sample.animationName).toContain('zombieAttackSurge');
    expect(Number.parseFloat(sample.animationDuration)).toBeGreaterThanOrEqual(0.48);
  }
});

test('Three Kingdoms attack frames never render smaller than their idle pose', async ({ page }) => {
  await openAttackBattle(page);
  await installVisualMeasurement(page);
  const result = await page.evaluate(async () => {
    const types = ['peashooter', 'sunflower', 'potato', 'firepea', 'zhangfei', 'zhaoyun', 'machao', 'huangzhong', 'kongming', 'pangtong', 'liubei'];
    const output = [];
    for (const type of types) {
      state.plants = [];
      state.zombies = [];
      addPlant(type, 4, 2);
      const unit = state.plants.at(-1);
      const definition = PLANT_TYPES[type];
      unit.attackUntil = 0;
      render();
      const idle = await visibleArtworkHeight(document.querySelector(`#board .type-${type} .char-img`));
      let elapsed = 0;
      for (let frame = 0; frame < definition.attackFrames.length; frame += 1) {
        const duration = definition.attackFrameDurations[frame];
        unit.attackStartedAt = 20_000;
        unit.attackUntil = 20_000 + definition.attackFrameDurations.reduce((sum, value) => sum + value, 0);
        state.time = 20_000 + elapsed + Math.min(10, duration / 2);
        render();
        const attack = await visibleArtworkHeight(document.querySelector(`#board .type-${type} .char-img`));
        output.push({ type, frame, ratio: attack / idle });
        elapsed += duration;
      }
    }
    return output;
  });
  const shrinking = result.filter(sample => sample.ratio < 0.94);
  expect(shrinking).toEqual([]);
});

test('mobile zombies keep every attack frame inside the left board edge', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile edge regression');
  await openAttackBattle(page);
  const result = await page.evaluate(async () => {
    const style = document.createElement('style');
    style.textContent = '.entity,.entity.spawn{animation:none!important}';
    document.head.appendChild(style);
    const visibleLeft = async image => {
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      let left = width;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (data[(y * width + x) * 4 + 3] > 8) left = Math.min(left, x);
        }
      }
      const box = image.getBoundingClientRect();
      return box.left + (left / width) * box.width;
    };
    const boardLeft = document.querySelector('#board').getBoundingClientRect().left;
    const samples = [];
    const types = ['normal', 'cone', 'bucket', 'football', 'jester', 'bombJester', 'corpseTitan'];
    for (const type of types) {
      state.plants = [];
      state.zombies = [];
      state.pendingZombieStrikes = [];
      state.gameplay.telegraphs = createBattleTelegraphState();
      addPlant('wallnut', 0, 2);
      const definition = ZOMBIE_TYPES[type];
      addZombie(type, definition.range + definition.speed / 2, 2);
      const unit = state.zombies.at(-1);
      unit.bornAt = 0;
      unit.last = 0;
      state.time = 19_000;
      actZombies();
      state.time = 20_000;
      actZombies();
      render();
      samples.push({ type, frame: 'contact', margin: (await visibleLeft(document.querySelector(`#board .type-${type} .char-img`))) - boardLeft, edgeClass: document.querySelector(`#board .type-${type}`)?.classList.contains('edge-left'), acted: document.querySelector(`#board .type-${type}`)?.classList.contains('attacking') || state.gameplay.telegraphs.active.some(item => item.sourceId === unit.id), contactColumn: unit.c });
      const duration = definition.attackFrameDurations.reduce((sum, value) => sum + value, 0);
      let elapsed = 0;
      for (let frame = 0; frame < definition.attackFrames.length; frame += 1) {
        unit.attackStartedAt = 20_000;
        unit.attackUntil = 20_000 + duration;
        state.time = 20_000 + elapsed + Math.min(10, definition.attackFrameDurations[frame] / 2);
        render();
        const image = document.querySelector(`#board .type-${type} .char-img`);
        samples.push({ type, frame, margin: (await visibleLeft(image)) - boardLeft, edgeClass: document.querySelector(`#board .type-${type}`)?.classList.contains('edge-left'), contactColumn: unit.c });
        elapsed += definition.attackFrameDurations[frame];
      }
    }
    return samples;
  });
  const contacts = result.filter(sample => sample.frame === 'contact');
  expect(new Set(contacts.map(sample => sample.type))).toEqual(new Set(['normal', 'cone', 'bucket', 'football', 'jester', 'bombJester', 'corpseTitan']));
  expect(contacts.every(sample => sample.contactColumn > 0 && sample.edgeClass && sample.acted), JSON.stringify(contacts)).toBe(true);
  const clipped = result.filter(sample => sample.margin < -0.5);
  expect(clipped).toEqual([]);
});

test('first-season zombie attacks and wallnut hit reactions keep stable visible stature', async ({ page }) => {
  await openAttackBattle(page);
  await installVisualMeasurement(page);
  const result = await page.evaluate(async () => {
    const samples = [];
    const measureFrames = async ({ side, type, frameKind }) => {
      state.plants = [];
      state.zombies = [];
      const collection = side === 'plants' ? state.plants : state.zombies;
      if (side === 'plants') addPlant(type, 4, 2);
      else addZombie(type, 4, 2);
      const unit = collection.at(-1);
      const definition = side === 'plants' ? PLANT_TYPES[type] : ZOMBIE_TYPES[type];
      render();
      const idle = await visibleArtworkHeight(document.querySelector(`#board .type-${type} .char-img`));
      const frames = frameKind === 'hit' ? definition.hitFrames : definition.attackFrames;
      const durations = frameKind === 'hit' ? definition.hitFrameDurations : definition.attackFrameDurations;
      let elapsed = 0;
      for (let frame = 0; frame < frames.length; frame += 1) {
        const startedAt = 30_000;
        const total = durations.reduce((sum, value) => sum + value, 0);
        if (frameKind === 'hit') {
          unit.hitStartedAt = startedAt;
          unit.hitUntil = startedAt + total;
        } else {
          unit.attackStartedAt = startedAt;
          unit.attackUntil = startedAt + total;
        }
        state.time = startedAt + elapsed + Math.min(10, durations[frame] / 2);
        render();
        const visible = await visibleArtworkHeight(document.querySelector(`#board .type-${type} .char-img`));
        samples.push({ type, frameKind, frame, ratio: visible / idle });
        elapsed += durations[frame];
      }
    };
    for (const type of ['normal', 'cone', 'bucket', 'football', 'jester', 'bombJester', 'corpseTitan']) {
      await measureFrames({ side: 'zombies', type, frameKind: 'attack' });
    }
    await measureFrames({ side: 'plants', type: 'wallnut', frameKind: 'hit' });
    return samples;
  });
  expect(result).toHaveLength(32);
  const unstable = result.filter(sample => !Number.isFinite(sample.ratio) || sample.ratio < 0.94 || sample.ratio > 1.08);
  expect(unstable, JSON.stringify(unstable)).toEqual([]);
});

test('profile replacement synchronizes reduced effects without shifting a left-edge attacker', async ({ page }) => {
  await openAttackBattle(page);
  const animation = await page.evaluate(() => {
    addPlant('wallnut', 0, 2);
    addZombie('normal', 0.4, 2);
    const attacker = state.zombies.at(-1);
    render();
    const before = document.querySelector('#board .type-normal').getBoundingClientRect().left;
    playerProfile = normalizeProfile({ ...playerProfile, settings: { ...playerProfile.settings, reducedEffects: true } });
    attacker.attackStartedAt = state.time;
    attacker.attackUntil = state.time + 500;
    render();
    const during = document.querySelector('#board .type-normal').getBoundingClientRect().left;
    const enabledClass = document.querySelector('#game').classList.contains('reduced-effects');
    const animationName = getComputedStyle(document.querySelector('#board .type-normal .sprite')).animationName;
    playerProfile = normalizeProfile({ ...playerProfile, settings: { ...playerProfile.settings, reducedEffects: false } });
    render();
    return {
      enabledClass,
      animationName,
      positionDelta: Math.abs(during - before),
      disabledClass: document.querySelector('#game').classList.contains('reduced-effects'),
    };
  });
  expect(animation.enabledClass).toBe(true);
  expect(animation.animationName).toBe('none');
  expect(animation.positionDelta).toBeLessThanOrEqual(0.5);
  expect(animation.disabledClass).toBe(false);
});
