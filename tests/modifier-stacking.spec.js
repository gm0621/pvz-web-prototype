const {test,expect}=require('@playwright/test');

async function open(page){
 await page.goto('/?modifier-stacking-test=1');
 await page.waitForFunction(()=>typeof start==='function'&&typeof activeUnit==='function');
}

const ORDER=['base-equipment','character-level','fixed-talent','synergy','tactical-order','temporary-stage-status','clamp'];
const MODIFIER_KEYS=['resourceIncome','damage','rangedDamage','meleeDamage','shield','movementSpeed','attackSpeed','damageTaken','deploymentCost','unitHealth','enemySpawnInterval','healing','relocationCost','enemyResourceIncome'];

test('central modifier pipeline declares every layer and every tactical-order consumer',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>({
  order:window.BATTLE_MODIFIER_LAYER_ORDER,
  consumers:window.BATTLE_MODIFIER_CONSUMERS,
  apis:[typeof window.resolveBattleUnit,typeof window.battleMovementSpeed,typeof window.battleDeploymentCost,typeof window.battleRelocationCost]
 }));
 expect(result.order).toEqual(ORDER);
 expect(Object.keys(result.consumers||{}).sort()).toEqual([...MODIFIER_KEYS].sort());
 for(const key of MODIFIER_KEYS)expect(result.consumers[key],key).toEqual(expect.any(String));
 expect(result.apis).toEqual(['function','function','function','function']);
});

test('unit layers apply synergy before tactical order, clamp once, and preserve source tables',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});playerProfile.inventory.equipment.greenDragonArmor=true;playerProfile.inventory.skills.guanyuSkill=true;playerProfile.inventory.equipped.plants.firepea='greenDragonArmor';playerProfile.characterLevels.plants.firepea.level=3;currentSeason=1;currentFaction='plants';selectedLevel=1;start('plants');clearInterval(timer);
  const before=JSON.stringify({plants:PLANT_TYPES,zombies:ZOMBIE_TYPES});
  state.plants=[];state.zombies=[];addPlant('firepea',1,1);addPlant('zhangfei',2,2);addPlant('liubei',3,3);addZombie('normal',7,1);
  state.gameplay.orders.selected=['tuntian','last-stand'];
  const resolution=resolveBattleUnit('plants','firepea'),base=effectiveUnit('plants','firepea');
  const originalRandom=Math.random;Math.random=()=>.99;
  state.time=5000;actPlants();
  const shot=state.pendingPlantShots.find(item=>item.sourceType==='firepea');
  const firstCount=state.pendingPlantShots.filter(item=>item.sourceType==='firepea').length;
  state.time=shot.at;processPendingPlantShots();
  state.time=5000+resolution.unit.rate;actPlants();const beforeReady=state.pendingPlantShots.filter(item=>item.sourceType==='firepea').length;
  state.time=5000+resolution.unit.rate+1;actPlants();const whenReady=state.pendingPlantShots.filter(item=>item.sourceType==='firepea').length;
  state.gameplay.orders.selected=Array(10).fill('last-stand');
  const clamped=resolveBattleUnit('plants','firepea');
  Math.random=originalRandom;
  return {
   base:{damage:base.damage,rate:base.rate},
   catalogDamage:PLANT_TYPES.firepea.damage,
   final:{damage:resolution.unit.damage,rate:resolution.unit.rate},
   layerIds:resolution.layers.map(layer=>layer.id),
   permanentDamage:resolution.layers.slice(0,3).map(layer=>layer.unit.damage),
   sources:resolution.sources,
   shot:{damage:shot?.damage,firstCount,beforeReady,whenReady},
   clampedRate:clamped.unit.rate,
   unchanged:before===JSON.stringify({plants:PLANT_TYPES,zombies:ZOMBIE_TYPES})
  };
 });
 expect(result.layerIds).toEqual(ORDER);
 expect(result.permanentDamage[0]).toBeGreaterThan(result.catalogDamage);
 expect(result.permanentDamage[1]).toBeGreaterThan(result.permanentDamage[0]);
 expect(result.permanentDamage[2]).toBeGreaterThan(result.permanentDamage[1]);
 expect(result.sources.slice(0,3).map(source=>source.layer)).toEqual(['base-equipment','character-level','fixed-talent']);
 expect(result.sources.map(source=>source.layer)).toEqual(expect.arrayContaining(['synergy','tactical-order','clamp']));
 expect(result.final.damage).toBe(Math.max(1,Math.round(Math.round(result.base.damage*1.15)*.9)));
 expect(result.final.rate).toBe(Math.max(350,Math.round(result.base.rate/1.22)));
 expect(result.shot.damage).toBe(result.final.damage);
 expect(result.shot).toEqual({damage:result.final.damage,firstCount:1,beforeReady:0,whenReady:1});
 expect(result.clampedRate).toBeGreaterThanOrEqual(350);
 expect(result.unchanged).toBe(true);
});

test('movement stage status is last, while costs and income use production modifiers',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  playerProfile=normalizeProfile({});currentSeason=1;currentFaction='plants';selectedLevel=5;for(let level=1;level<5;level++)completeCampaignLevel('plants',level);start('plants');clearInterval(timer);
  state.gameplay.orders.selected=['tuntian','reinforcements','rapid-redeploy','empty-city','supply-raid'];
  const deployment=battleDeploymentCost(100),relocation=battleRelocationCost(20);
  const selected=[...state.gameplay.orders.selected],rawResourceModifiers=state.gameplay.orders.selected.map(id=>tacticalOrderById(id)?.modifiers?.resourceIncome??null),resourceModifier=effectiveBattleModifier('resourceIncome'),resourceIncome=battleIncomeAmount(100,'player'),enemyIncome=battleIncomeAmount(100,'enemy'),spawn=battleEnemySpawnInterval(10000);
  state.gameplay.orders.selected=['reinforcements'];buildCards();state.resource=1000;const deployedCost=battleDeploymentCost(PLANT_TYPES.peashooter.cost);deploySelected('peashooter',0,0);const deploymentSpent=1000-state.resource,cardCost=document.querySelector('.card[data-key="peashooter"] .cost').textContent;
  state.gameplay.orders.selected=['tuntian'];state.resource=0;state.aiResource=0;state.time=1;state.nextIncome=0;income();const periodicIncome=state.resource,expectedPeriodic=Math.round(state.levelConfig.plantIncome*1.25);
  state.plants=[];state.resource=0;addPlant('sunflower',0,0);state.time=activeUnit('plants','sunflower').rate+2;actPlants();const produced=state.resource,expectedProduce=Math.round(activeUnit('plants','sunflower').produce*1.25);
  state.gameplay.orders.selected=['medical-camp'];const healerFaction=state.faction,healModifier=effectiveBattleModifier('healing'),healOrder=tacticalOrderById('medical-camp')?.modifiers?.healing,ownHealing=battleHealingAmount(100,'plants'),enemyHealing=battleHealingAmount(100,'zombies');
  state.gameplay.orders.selected=['last-stand'];state.plants=[];addPlant('wallnut',0,0);const defender=state.plants[0],hpBefore=defender.hp;damagePlant(defender,100);const damageTaken=hpBefore-defender.hp;
  state.gameplay.stageRule.data={kind:'fog-vision',visibleLane:0,speedMultiplier:1.12};
  state.faction='zombies';state.gameplay.orders.selected=['hold-center'];
  const movement=battleMovementSpeed('zombies','normal',1);
  const base=effectiveUnit('zombies','normal').speed;
  return {selected,rawResourceModifiers,resourceModifier,deployment,relocation,resourceIncome,enemyIncome,spawn,plantCost:PLANT_TYPES.peashooter.cost,deployedCost,deploymentSpent,cardCost,periodicIncome,expectedPeriodic,produced,expectedProduce,healerFaction,healModifier,healOrder,ownHealing,enemyHealing,damageTaken,movement,base};
 });
 expect(result).toEqual({selected:['tuntian','reinforcements','rapid-redeploy','empty-city','supply-raid'],rawResourceModifiers:[1.25,null,null,.85,.9],resourceModifier:1,deployment:85,relocation:10,resourceIncome:100,enemyIncome:80,spawn:12000,plantCost:result.plantCost,deployedCost:Math.round(result.plantCost*.85),deploymentSpent:Math.round(result.plantCost*.85),cardCost:`${Math.round(result.plantCost*.85)} 軍糧`,periodicIncome:result.expectedPeriodic,expectedPeriodic:result.expectedPeriodic,produced:result.expectedProduce,expectedProduce:result.expectedProduce,healerFaction:'plants',healModifier:1.3,healOrder:1.3,ownHealing:130,enemyHealing:100,damageTaken:115,movement:result.base*.85*1.12,base:result.base});
});
