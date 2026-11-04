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
    for (const type of ['football', 'bombJester']) {
      state.zombies = [];
      addZombie(type, 0, 2);
      const unit = state.zombies.at(-1);
      const definition = ZOMBIE_TYPES[type];
      const duration = definition.attackFrameDurations.reduce((sum, value) => sum + value, 0);
      let elapsed = 0;
      for (let frame = 0; frame < definition.attackFrames.length; frame += 1) {
        unit.attackStartedAt = 20_000;
        unit.attackUntil = 20_000 + duration;
        state.time = 20_000 + elapsed + Math.min(10, definition.attackFrameDurations[frame] / 2);
        render();
        const image = document.querySelector(`#board .type-${type} .char-img`);
        samples.push({ type, frame, margin: (await visibleLeft(image)) - boardLeft });
        elapsed += definition.attackFrameDurations[frame];
      }
    }
    return samples;
  });
  const clipped = result.filter(sample => sample.margin < -0.5);
  expect(clipped).toEqual([]);
});
