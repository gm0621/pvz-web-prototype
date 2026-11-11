const {test,expect}=require('@playwright/test');
const KEY='heroLegendProgress_v1';
async function seed(page,value,block=false){await page.addInitScript(({value,block})=>{
 const key='heroLegendProgress_v1';if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify(value));
 const set=Storage.prototype.setItem;window.allowHeroSave=!block;Storage.prototype.setItem=function(k,v){if(k===key&&!window.allowHeroSave)throw new DOMException('Full','QuotaExceededError');return set.call(this,k,v)};
},{value,block})}
async function stored(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY)}
async function quickWin(page){await page.route('**/hero/engine.mjs?*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('spawned:0,nextSpawn:6','spawned:STAGES[level-1].enemyCount,nextSpawn:0').replace('boss?stage.bossHp:','boss?1:').replace('lane,x:.94,hp','lane,x:.17,hp')})})}
async function fight(page){await page.locator('#storySkip').click();await page.locator('#bossIntroContinue').click();await page.locator('[data-hero=guanyu]').click();await page.locator('.lane').nth(1).click();await expect(page.locator('#result')).toBeVisible()}
async function start(page){await page.goto('/hero/',{waitUntil:'domcontentloaded'});await page.locator('#startBtn').click();await fight(page)}
async function replayFirst(page){await page.locator('#chapterPicker').evaluate(e=>e.open=true);await page.locator('#chapterTabs button[data-chapter="1"]').click();await page.locator('#chapterDots button').first().click();await fight(page)}
test('failed camp purchases keep wallet and stock, retry persists once through reload and replay',async({page})=>{
 await seed(page,{completed:0,coins:100});await quickWin(page);await start(page);await page.locator('#resultNext').click();await page.evaluate(()=>window.allowHeroSave=false);
 for(const [shop,id] of [['weapons','zhangfei'],['items','grain']]){
  await page.locator(`[data-shop=${shop}]`).click();await page.locator(`[data-buy=${id}]`).click();await expect(page.locator('#campMessage')).toContainText('未購買');await expect(page.locator('#campCoins')).toHaveText('180');
 }
 expect((await stored(page)).weapons.zhangfei).toBe(0);expect((await stored(page)).inventory.grain).toBe(0);
 await page.reload({waitUntil:'domcontentloaded'});await replayFirst(page);await expect(page.locator('#resultEarned')).toHaveText('+0');await page.locator('#resultNext').click();
 await page.locator('[data-shop=weapons]').click();await page.locator('[data-buy=zhangfei]').click();await page.locator('[data-shop=items]').click();await page.locator('[data-buy=grain]').click();await expect(page.locator('#campCoins')).toHaveText('100');
 await page.reload({waitUntil:'domcontentloaded'});expect(await stored(page)).toMatchObject({completed:1,coins:100,weapons:{zhangfei:1},inventory:{grain:1}});await replayFirst(page);await expect(page.locator('#resultEarned')).toHaveText('+0');await expect(page.locator('#resultBalance')).toHaveText('100');
});
test('failed victory can retry saving without duplicating rewards after reload',async({page},info)=>{
 await seed(page,{completed:0,coins:35},true);await quickWin(page);await start(page);await expect(page.locator('#resultBalance')).toHaveText('115');await page.locator('#resultRetrySave').click();await expect(page.locator('#resultRetrySave')).toBeVisible();expect(await page.locator('#storageNotice').evaluate(e=>getComputedStyle(e).position)).toBe('static');expect(await page.locator('#resultRetrySave').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('#resultSaved').getBoundingClientRect().bottom)).toBe(true);await page.screenshot({path:info.outputPath('retry-save.png'),fullPage:true,animations:'disabled'});expect(await stored(page)).toMatchObject({completed:0,coins:35});
 await page.evaluate(()=>window.allowHeroSave=true);await page.locator('#resultRetrySave').click();await expect(page.locator('#resultRetrySave')).toBeHidden();await expect(page.locator('#storageNotice')).toBeHidden();expect(await stored(page)).toMatchObject({completed:1,coins:115});
 await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>window.allowHeroSave=true);await replayFirst(page);await expect(page.locator('#resultEarned')).toHaveText('+0');await expect(page.locator('#resultBalance')).toHaveText('115');expect((await stored(page)).coins).toBe(115);
});
test('failed supply saves do not apply effects or consume items; successful uses survive reload',async({page})=>{
 await seed(page,{completed:0,coins:40,inventory:{herb:1,grain:1}},true);await page.clock.install();
 await page.route('**/hero/engine.mjs?*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('return {level,mission:','return window.economyBattle={level,mission:').replace('nextSpawn:6','nextSpawn:9999')})});
 await page.goto('/hero/',{waitUntil:'domcontentloaded'});await page.locator('#startBtn').click();await page.locator('#storySkip').click();await page.locator('[data-hero=liubei]').click();await page.locator('.lane').nth(1).click();await page.clock.pauseAt(new Date(Date.now()+1000));await page.evaluate(()=>{window.economyBattle.food=100;window.economyBattle.allies[0].hp=20});
 for(const id of ['herb','grain'])await page.locator(`[data-supply=${id}]`).click();
 expect(await page.evaluate(()=>({hp:window.economyBattle.allies[0].hp,food:window.economyBattle.food}))).toEqual({hp:20,food:100});expect((await stored(page)).inventory).toEqual({herb:1,grain:1});await expect(page.locator('#storageNotice')).toBeVisible();
 await page.evaluate(()=>window.allowHeroSave=true);for(const id of ['herb','grain'])await page.locator(`[data-supply=${id}]`).click();
 expect(await page.evaluate(()=>({hp:window.economyBattle.allies[0].hp,food:window.economyBattle.food}))).toEqual({hp:80,food:180});expect((await stored(page)).inventory).toEqual({herb:0,grain:0});await page.reload({waitUntil:'domcontentloaded'});expect((await stored(page)).inventory).toEqual({herb:0,grain:0});
});
for(const mode of ['unreadable','malformed'])test(`${mode} original save is protected from temporary new progress`,async({page})=>{
 await page.addInitScript(mode=>{const key='heroLegendProgress_v1',get=Storage.prototype.getItem;window.originalHeroSave=mode==='malformed'?'{broken':JSON.stringify({completed:4,coins:120});if(get.call(localStorage,key)===null)localStorage.setItem(key,window.originalHeroSave);window.readOriginalSave=()=>get.call(localStorage,key);if(mode==='unreadable'&&!sessionStorage.getItem('readRecovered'))Storage.prototype.getItem=function(k){if(k===key)throw new DOMException('Denied','SecurityError');return get.call(this,k)}},mode);
 await quickWin(page);await start(page);await expect(page.locator('#storageNotice')).toContainText('不會覆寫');await expect(page.locator('#resultRetrySave')).toBeHidden();await expect(page.locator('#resultSaved')).toContainText('尚未保存');expect(await page.evaluate(()=>window.readOriginalSave())).toBe(await page.evaluate(()=>window.originalHeroSave));await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#storageNotice')).toContainText('無法讀取');if(mode==='unreadable'){await page.evaluate(()=>sessionStorage.setItem('readRecovered','1'));await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#storageNotice')).toBeHidden();expect(await stored(page)).toMatchObject({completed:4,coins:120})}
});

test('reloading an unsaved victory restores the durable balance and a later clear awards only once',async({page})=>{
 await seed(page,{completed:0,coins:35},true);await quickWin(page);await start(page);await expect(page.locator('#resultBalance')).toHaveText('115');await page.reload({waitUntil:'domcontentloaded'});expect(await stored(page)).toMatchObject({completed:0,coins:35});await page.evaluate(()=>window.allowHeroSave=true);await page.locator('#startBtn').click();await fight(page);await expect(page.locator('#resultEarned')).toHaveText('+80');expect(await stored(page)).toMatchObject({completed:1,coins:115});await page.locator('#replayLevel').click();await fight(page);await expect(page.locator('#resultEarned')).toHaveText('+0');expect((await stored(page)).coins).toBe(115);
});
