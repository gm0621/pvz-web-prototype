const { test, expect } = require('@playwright/test');

async function openStyledBattle(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/?battle-typography=1');
  await page.evaluate(() => {
    authIdentityResolved = true;
    currentSeason = 1;
    selectedLevel = 1;
    markStoryRead('plants', 1, 'opening', 1);
    start('plants');
    clearInterval(timer);
    state.paused = true;
    state.countdownActive = false;
    state.plants = [];
    state.zombies = [];
    addPlant('sunflower', 2, 2);
    addZombie('normal', 7, 2);
    render();
    applyPausedBattleUI();
  });
  await expect(page.locator('#game')).toHaveClass(/active/);
  await expect(page.locator('#board .entity .label')).toHaveCount(2);
}

test('battle text is clear and gilded without overflowing the viewport', async ({ page }) => {
  await openStyledBattle(page);

  const result = await page.evaluate(() => {
    const style = selector => {
      const element = document.querySelector(selector);
      const computed = getComputedStyle(element);
      return {
        fontSize: Number.parseFloat(computed.fontSize),
        fontWeight: Number.parseInt(computed.fontWeight, 10),
        color: computed.color,
        backgroundImage: computed.backgroundImage,
        borderWidth: Number.parseFloat(computed.borderTopWidth),
        borderStyle: computed.borderTopStyle,
        boxShadow: computed.boxShadow,
        textShadow: computed.textShadow,
      };
    };
    const board = document.querySelector('#board').getBoundingClientRect();
    const labelsInsideBoard = [...document.querySelectorAll('#board .entity .label')].every(label => {
      const box = label.getBoundingClientRect();
      return box.left >= board.left - 1 && box.right <= board.right + 1 && box.top >= board.top - 1 && box.bottom <= board.bottom + 1;
    });
    const visibleToolbarButtons = [...document.querySelectorAll('#game .top-toolbar button')]
      .filter(button => button.getBoundingClientRect().width > 0)
      .map(button => {
        const computed = getComputedStyle(button);
        return {
          weight: Number.parseInt(computed.fontWeight, 10),
          shadow: computed.textShadow,
        };
      });
    return {
      viewportWidth: innerWidth,
      bodyScrollWidth: document.documentElement.scrollWidth,
      entityLabel: style('#board .entity .label'),
      laneLabel: style('#board .lane-label'),
      waveStatus: style('#waveStatus'),
      deploymentHint: style('.deployment-hint'),
      cardName: style('#cards .card .name'),
      cardCost: style('#cards .card .cost'),
      levelTitle: style('.compact-level-title'),
      resourceStrip: style('.compact-battle-info'),
      cardPanel: style('.cards-panel'),
      visibleToolbarButtons,
      labelsInsideBoard,
    };
  });

  const mobile = result.viewportWidth <= 720;
  expect(result.entityLabel.fontSize).toBeGreaterThanOrEqual(12);
  expect(result.entityLabel.fontWeight).toBeGreaterThanOrEqual(800);
  expect(result.entityLabel.backgroundImage).not.toBe('none');
  expect(result.entityLabel.borderStyle).toBe('solid');
  expect(result.entityLabel.textShadow).not.toBe('none');
  expect(result.laneLabel.fontSize).toBeGreaterThanOrEqual(12);
  expect(result.laneLabel.fontWeight).toBeGreaterThanOrEqual(800);
  expect(result.laneLabel.textShadow).not.toBe('none');
  expect(result.waveStatus.fontSize).toBeGreaterThanOrEqual(mobile ? 12 : 13);
  expect(result.deploymentHint.fontSize).toBeGreaterThanOrEqual(12);
  expect(result.cardName.fontSize).toBeGreaterThanOrEqual(12);
  expect(result.cardName.fontWeight).toBeGreaterThanOrEqual(800);
  expect(result.cardCost.fontSize).toBeGreaterThanOrEqual(11);
  expect(result.levelTitle.fontSize).toBeGreaterThanOrEqual(mobile ? 14 : 18);
  expect(result.resourceStrip.borderWidth).toBeGreaterThanOrEqual(3);
  expect(result.resourceStrip.boxShadow).toContain('inset');
  expect(result.cardPanel.borderWidth).toBeGreaterThanOrEqual(2);
  expect(result.cardPanel.boxShadow).not.toBe('none');
  expect(result.visibleToolbarButtons.length).toBeGreaterThan(0);
  expect(result.visibleToolbarButtons.every(button => button.weight >= 800 && button.shadow !== 'none')).toBe(true);
  expect(result.labelsInsideBoard).toBe(true);
  expect(result.bodyScrollWidth).toBeLessThanOrEqual(result.viewportWidth + 1);
});

test('landscape fullscreen card tray keeps image, name and cost readable', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await openStyledBattle(page);
  const result = await page.evaluate(() => {
    document.querySelector('#game').classList.add('fullscreen-mode');
    const panel = document.querySelector('.cards-panel').getBoundingClientRect();
    const cards = [...document.querySelectorAll('#cards .card')].map(card => {
      const box = card.getBoundingClientRect();
      const image = card.querySelector('.card-img').getBoundingClientRect();
      const name = card.querySelector('.name').getBoundingClientRect();
      const cost = card.querySelector('.cost').getBoundingClientRect();
      return {
        insidePanel: box.top >= panel.top - 1 && box.bottom <= panel.bottom + 1,
        imageInside: image.top >= box.top - 1 && image.bottom <= box.bottom + 1,
        nameInside: name.top >= box.top - 1 && name.bottom <= box.bottom + 1,
        costInside: cost.top >= box.top - 1 && cost.bottom <= box.bottom + 1,
        nameSize: Number.parseFloat(getComputedStyle(card.querySelector('.name')).fontSize),
        costSize: Number.parseFloat(getComputedStyle(card.querySelector('.cost')).fontSize),
      };
    });
    return {
      cards,
      panelHeight: panel.height,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  expect(result.panelHeight).toBeGreaterThanOrEqual(80);
  expect(result.overflowX).toBe(false);
  expect(result.cards.every(card => card.insidePanel && card.imageInside && card.nameInside && card.costInside)).toBe(true);
  expect(result.cards.every(card => card.nameSize >= 11 && card.costSize >= 10)).toBe(true);
});

test('ornate styling preserves wave urgency and special-unit identity', async ({ page }) => {
  await openStyledBattle(page);
  const result = await page.evaluate(() => {
    const wave = document.querySelector('#waveStatus');
    wave.hidden = false;
    const phaseStyle = phase => {
      wave.dataset.phase = phase;
      const computed = getComputedStyle(wave);
      return `${computed.backgroundColor}|${computed.backgroundImage}|${computed.borderTopColor}|${computed.boxShadow}`;
    };
    const phases = {
      calm: phaseStyle('calm'),
      warning: phaseStyle('warning'),
      active: phaseStyle('active'),
      boss: phaseStyle('boss'),
    };
    state.plants = [];
    state.zombies = [];
    addZombie('normal', 4, 1);
    addZombie('corpseTitan', 4, 2);
    state.zombies.at(-1).boss = true;
    addPlant('wallnut', 4, 3);
    state.plants.at(-1).stageTarget = 'arrow-tower';
    render();
    const labelStyle = selector => {
      const computed = getComputedStyle(document.querySelector(selector));
      return `${computed.color}|${computed.backgroundColor}|${computed.backgroundImage}|${computed.borderTopColor}`;
    };
    return {
      phases,
      ordinary: labelStyle('#board .type-normal .label'),
      boss: labelStyle('#board .type-corpseTitan .label'),
      stageTarget: labelStyle('#board .stage-target .label'),
    };
  });
  expect(result.phases.warning).not.toBe(result.phases.calm);
  expect(result.phases.active).not.toBe(result.phases.calm);
  expect(result.phases.boss).not.toBe(result.phases.calm);
  expect(result.boss).not.toBe(result.ordinary);
  expect(result.stageTarget).not.toBe(result.ordinary);
});

test('320px portrait keeps long edge labels fully inside the battlefield', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await openStyledBattle(page);
  const result = await page.evaluate(() => {
    state.plants = [];
    state.zombies = [];
    addZombie('corpseTitan', 0, 0);
    state.zombies.at(-1).boss = true;
    addPlant('huangzhong', 8, 4);
    state.plants.at(-1).boss = true;
    render();
    const board = document.querySelector('#board').getBoundingClientRect();
    return [...document.querySelectorAll('#board .entity .label')].map(label => {
      const box = label.getBoundingClientRect();
      return {
        text: label.textContent,
        left: box.left - board.left,
        right: board.right - box.right,
        top: box.top - board.top,
        bottom: board.bottom - box.bottom,
      };
    });
  });
  expect(result).toHaveLength(2);
  expect(result.every(label => label.left >= -1 && label.right >= -1 && label.top >= -1 && label.bottom >= -1)).toBe(true);
});
