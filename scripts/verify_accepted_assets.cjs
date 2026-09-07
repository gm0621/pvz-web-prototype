const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const outDir = 'test-results/accepted-assets';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const failures = [];
  page.on('console', message => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));

  await page.goto('http://127.0.0.1:4173/?verify=accepted-assets', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '查看圖鑑' }).click();

  const guanCard = page.locator('.char-profile.type-firepea');
  await guanCard.scrollIntoViewIfNeeded();
  const guan = await guanCard.locator('img').evaluate(img => ({
    src: img.getAttribute('src'), complete: img.complete,
    naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight
  }));
  await guanCard.click();
  const guanModal = await page.locator('#charModalImg').evaluate(img => ({
    src: img.getAttribute('src'), complete: img.complete,
    naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight
  }));
  await page.screenshot({ path: `${outDir}/guanyu-guide.png`, fullPage: true });

  await page.evaluate(() => {
    closeCharacterDetail();
    showCharacters('zombies');
  });
  const qinCard = page.locator('.char-profile.type-qinEmperor');
  await qinCard.scrollIntoViewIfNeeded();
  const qin = await qinCard.locator('img').evaluate(img => ({
    src: img.getAttribute('src'), complete: img.complete,
    naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight
  }));
  await qinCard.click();
  await page.screenshot({ path: `${outDir}/qin-guide.png`, fullPage: true });

  const battle = await page.evaluate(() => {
    closeCharacterDetail();
    for (let level = 1; level <= 10; level++) completeCampaignLevel('plants', level);
    for (let level = 1; level <= 8; level++) completeCampaignLevel('zombies', level);
    selectedLevel = 9;
    start('zombies');
    clearInterval(timer);
    state.paused = false;
    state.resource = 9999;
    addPlant('firepea', 2, 2);
    addZombie('qinEmperor', 7, 2);
    render();
    return { faction: state.faction, level: selectedLevel };
  });
  await page.locator('#board').screenshot({ path: `${outDir}/guanyu-qin-battle.png` });
  const sprites = await page.locator('#board .entity.type-firepea img, #board .entity.type-qinEmperor img').evaluateAll(images => images.map(img => ({
    type: img.closest('.entity')?.className,
    src: img.getAttribute('src'), complete: img.complete,
    naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight
  })));

  const checks = [guan, guanModal, qin, ...sprites];
  if (checks.some(item => !item.complete || item.naturalWidth !== 1024 || item.naturalHeight !== 1024)) {
    failures.push('one or more accepted character images failed 1024x1024 runtime loading');
  }
  const guanSprites = sprites.filter(item => item.type?.includes('type-firepea'));
  const qinSprites = sprites.filter(item => item.type?.includes('type-qinEmperor'));
  if (!guanSprites.length || !qinSprites.length) failures.push(`expected Guan Yu and Qin battle sprites, found Guan=${guanSprites.length} Qin=${qinSprites.length}`);
  console.log(JSON.stringify({ guan, guanModal, qin, battle, sprites, screenshots: outDir, failures }, null, 2));
  await browser.close();
  if (failures.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
