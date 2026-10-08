const {test,expect}=require('@playwright/test');
const fs=require('fs');

async function openApp(page){
 await page.goto('/?phase7-matrix-test=1');
 await page.waitForFunction(()=>typeof stageRuleConfigFor==='function'&&typeof challengesForRoute==='function'&&Array.isArray(window.TACTICAL_ORDERS));
}

test('campaign route matrix binds rule challenges tactical orders and telegraph needs for exactly forty routes',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>{
  const matrix=window.CAMPAIGN_ROUTE_MATRIX||null,rows=matrix?Object.entries(matrix).map(([route,value])=>({route,...structuredClone(value)})):[];
  const expected=[];
  for(const season of [1,2])for(const faction of ['plants','zombies'])for(let level=1;level<=10;level++)expected.push(`${season}:${faction}:${level}`);
  return {
   api:[typeof matrix,typeof window.campaignRouteMatrixFor],
   frozen:matrix?Object.isFrozen(matrix)&&Object.values(matrix).every(Object.isFrozen):false,
   expected,rows,
   validOrderIds:TACTICAL_ORDERS.map(order=>order.id),
   qinMatrix:typeof window.campaignRouteMatrixFor==='function'?window.campaignRouteMatrixFor(1,'plants',11):'missing',
   qinRule:stageRuleConfigFor({season:1,faction:'plants',level:11,levelConfig:{qinBoss:true}}).ruleId
  };
 });
 expect(result.api).toEqual(['object','function']);
 expect(result.frozen).toBe(true);
 expect(result.rows.map(row=>row.route).sort()).toEqual(result.expected.sort());
 expect(result.rows).toHaveLength(40);
 for(const row of result.rows){
  const [season,faction,level]=row.route.split(':');
  expect(row.ruleId,row.route).toBe(await page.evaluate(({season,faction,level})=>stageRuleConfigFor({season:Number(season),faction,level:Number(level),levelConfig:campaignLevels(Number(season))[Number(level)]}).ruleId,{season,faction,level}));
  expect(row.challengeIds,row.route).toHaveLength(3);
  expect(new Set(row.challengeIds).size,row.route).toBe(3);
  expect(row.orderPool.length,row.route).toBeGreaterThanOrEqual(3);
  expect(new Set(row.orderPool).size,row.route).toBe(row.orderPool.length);
  expect(row.orderPool.every(id=>result.validOrderIds.includes(id)),row.route).toBe(true);
  expect(row.telegraphRequirement,row.route).toEqual({required:expect.any(Boolean),kinds:expect.any(Array)});
 }
 expect(result.qinMatrix).toBeNull();
 expect(result.qinRule).toBe('qin-finale');
});

test('runtime tactical offers consume the route matrix order pool',async({page})=>{
 await openApp(page);
 const result=await page.evaluate(()=>({
  api:typeof window.tacticalOrderPoolForBattle,
  rows:Object.keys(CAMPAIGN_ROUTE_MATRIX).map(route=>{const [season,faction,level]=route.split(':'),battle={season:Number(season),faction,level:Number(level)};return {route,pool:typeof window.tacticalOrderPoolForBattle==='function'?window.tacticalOrderPoolForBattle(battle):null,expected:CAMPAIGN_ROUTE_MATRIX[route].orderPool}})
 }));
 expect(result.api).toBe('function');
 for(const row of result.rows)expect(row.pool,row.route).toEqual(row.expected);
});

test('all forty routes expose Traditional Chinese player copy without undefined or NaN',async({page})=>{
 await openApp(page);
 const rows=await page.evaluate(()=>Object.entries(CAMPAIGN_ROUTE_MATRIX).map(([route,row])=>{
  const [season,faction,level]=route.split(':'),context={season:Number(season),faction,level:Number(level),levelConfig:campaignLevels(Number(season))[Number(level)]};
  const levelConfig=context.levelConfig,rule=stageRuleFor(context),challenges=challengesForRoute(context.season,faction,context.level);
  const routeOrderIds=new Set(row.orderPool),orders=TACTICAL_ORDERS.filter(order=>routeOrderIds.has(order.id));
  const telegraphs=row.telegraphRequirement.kinds.map(kind=>ENEMY_TELEGRAPH_RULES[kind]);
  const results=typeof window.campaignRouteResultCopy==='function'?[window.campaignRouteResultCopy(context,true),window.campaignRouteResultCopy(context,false)]:[];
  return {
   route,resultApi:typeof window.campaignRouteResultCopy,
   texts:[
    levelConfig.name,levelConfig.shortName,levelConfig.difficulty,levelConfig.plantHint,levelConfig.zombieHint,
    rule.title,rule.brief,...rule.objective(context),
    ...challenges.flatMap(definition=>[definition.name,challengeConditionText(definition),challengeFailureReason(definition,{events:[{type:'outcome',win:false}]})]),
    ...orders.flatMap(order=>[order.name,order.benefit,order.cost]),
    ...telegraphs.flatMap(telegraph=>[telegraph?.label,telegraph?.counter]),
    ...results.flatMap(result=>[result?.title,result?.text])
   ]
  };
 }));
 expect(rows).toHaveLength(40);
 for(const {route,resultApi,texts} of rows){
  expect(resultApi,route).toBe('function');
  for(const text of texts){
   expect(typeof text,route).toBe('string');
   expect(text,route).not.toMatch(/undefined|NaN/);
   expect(text,route).toMatch(/[\u3400-\u9fff]/);
  }
 }
});

test('README and home copy announce both complete ten-stage seasons',async({page})=>{
 await openApp(page);
 const readme=fs.readFileSync('README.md','utf8');
 const copy=await page.evaluate(()=>({news:document.querySelector('.menu-news')?.textContent||'',characters:[document.querySelector('#characters .subtitle')?.textContent,document.querySelector('#zombieSeasonIntro')?.textContent,document.querySelector('#characterRosterIntro')?.textContent].join('｜')}));
 for(const text of [readme,copy.news]){
  expect(text).toContain('第一季、第二季皆有守城十關與攻城十關');
  expect(text).not.toContain('第二季第一關已開放');
 }
 expect(copy.characters).not.toMatch(/預告|尚未開放出戰|尚待實作/);
});
