const { test, expect } = require('@playwright/test');

async function openBattle(page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto('/?character-scale=1');
  await page.evaluate(() => {
    playerProfile.campaignProgress.plants = { completedLevels: { 1: 1 }, highestLevel: 1 };
    markStoryRead('plants', 2, 'opening', 1);
    currentSeason = 1;
    selectedLevel = 2;
    start('plants');
    clearInterval(timer);
    const style = document.createElement('style');
    style.textContent = '.entity,.entity.spawn{animation:none!important}.entity .sprite{animation:none!important}';
    document.head.appendChild(style);
  });
}

test('battle units and playable cards use the enlarged responsive scale', async ({ page }) => {
  await openBattle(page);
  const sizes = await page.evaluate(() => {
    state.plants = [];
    state.zombies = [];
    addPlant('sunflower', 2, 2);
    addZombie('normal', 6, 2);
    addZombie('corpseTitan', 7, 1);
    addZombie('fireCatapult', 7, 3);
    render();
    const width = selector => Math.round(document.querySelector(selector).getBoundingClientRect().width);
    const cardsFitPanel = () => {
      const panel = document.querySelector('.cards-panel').getBoundingClientRect();
      return [...document.querySelectorAll('#cards .card')].every(card => {
        const cardBox = card.getBoundingClientRect();
        const visibleChildren = [...card.querySelectorAll('.card-img,.name,.cost,.statusline,.coolbar')]
          .filter(child => {
            const box = child.getBoundingClientRect();
            return box.width > 0 && box.height > 0;
          });
        return cardBox.top >= panel.top - 1 && cardBox.bottom <= panel.bottom + 1 && visibleChildren.every(child => {
          const box = child.getBoundingClientRect();
          return box.top >= panel.top - 1 && box.bottom <= panel.bottom + 1;
        });
      });
    };
    const regularCard = width('#cards .card .card-img');
    const regularCardsFit = cardsFitPanel();
    document.querySelector('#game').classList.add('fullscreen-mode');
    const fullscreenCard = width('#cards .card .card-img');
    const fullscreenCardsFit = cardsFitPanel();
    return {
      viewport: innerWidth,
      sunflower: width('#board .type-sunflower .char-img'),
      normal: width('#board .type-normal .char-img'),
      titan: width('#board .type-corpseTitan .char-img'),
      catapult: width('#board .type-fireCatapult .char-img'),
      regularCard,
      fullscreenCard,
      regularCardsFit,
      fullscreenCardsFit,
    };
  });

  const mobile = sizes.viewport <= 720;
  expect(sizes.sunflower).toBe(mobile ? 58 : 76);
  expect(sizes.normal).toBe(mobile ? 58 : 76);
  expect(sizes.titan).toBe(mobile ? 68 : 92);
  expect(sizes.catapult).toBe(mobile ? 76 : 104);
  expect(sizes.regularCard).toBe(mobile ? 48 : 54);
  expect(sizes.fullscreenCard).toBe(54);
  expect(sizes.regularCardsFit).toBe(true);
  expect(sizes.fullscreenCardsFit).toBe(true);
});

test('enlarged visible artwork and labels remain inside the board at every corner', async ({ page }) => {
  await openBattle(page);
  const results = await page.evaluate(async () => {
    const alphaBounds = async image => {
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      let left = width, top = height, right = -1, bottom = -1;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (data[(y * width + x) * 4 + 3] > 8) {
            left = Math.min(left, x); top = Math.min(top, y);
            right = Math.max(right, x); bottom = Math.max(bottom, y);
          }
        }
      }
      return { left: left / width, top: top / height, right: (right + 1) / width, bottom: (bottom + 1) / height };
    };
    const cases = [
      { side: 'plants', type: 'sunflower' },
      { side: 'zombies', type: 'normal' },
      { side: 'zombies', type: 'corpseTitan' },
      { side: 'zombies', type: 'fireCatapult' },
    ];
    const corners = [[0, 0], [COLS - 1, 0], [0, ROWS - 1], [COLS - 1, ROWS - 1]];
    const output = [];
    for (const unit of cases) {
      for (const [col, row] of corners) {
        state.plants = [];
        state.zombies = [];
        if (unit.side === 'plants') addPlant(unit.type, col, row);
        else addZombie(unit.type, col, row);
        render();
        const board = document.querySelector('#board').getBoundingClientRect();
        const entity = document.querySelector(`#board .type-${unit.type}`);
        const image = entity.querySelector('.char-img');
        const label = entity.querySelector('.label');
        const box = image.getBoundingClientRect();
        const visible = await alphaBounds(image);
        const visibleBox = {
          left: box.left + box.width * visible.left,
          right: box.left + box.width * visible.right,
          top: box.top + box.height * visible.top,
          bottom: box.top + box.height * visible.bottom,
        };
        const labelBox = label.getBoundingClientRect();
        output.push({
          type: unit.type,
          col,
          row,
          artworkInside: visibleBox.left >= board.left - 1 && visibleBox.right <= board.right + 1 && visibleBox.top >= board.top - 1 && visibleBox.bottom <= board.bottom + 1,
          labelInside: labelBox.left >= board.left - 1 && labelBox.right <= board.right + 1 && labelBox.top >= board.top - 1 && labelBox.bottom <= board.bottom + 1,
          artworkMargins: { left: visibleBox.left - board.left, right: board.right - visibleBox.right, top: visibleBox.top - board.top, bottom: board.bottom - visibleBox.bottom },
          labelMargins: { left: labelBox.left - board.left, right: board.right - labelBox.right, top: labelBox.top - board.top, bottom: board.bottom - labelBox.bottom },
        });
      }
    }
    return output;
  });

  const failures = results.filter(result => !result.artworkInside || !result.labelInside);
  expect(failures).toEqual([]);
});
