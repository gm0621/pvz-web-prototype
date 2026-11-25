const {test}=require('node:test');
const assert=require('node:assert/strict');

test('Chengdu extends a finished Jiange save while preserving the historical surrender',async()=>{
 const {STAGES,chapterInfo}=await import('../../hero/story.mjs');
 const {normalizeProgress}=await import('../../hero/engine.mjs');
 const {rewardVictory}=await import('../../hero/campaign.mjs');
 const {routeThrough,campaignMapSvg,MAP_PLACES}=await import('../../hero/campaign-map.mjs');
 const {searchPeople}=await import('../../hero/people-data.mjs');
 const {expressionPortrait,portraitForDisplay}=await import('../../hero/portrait-expressions.mjs');
 const routes=[['yinping','jinggu'],['jinggu','jiangyou'],['chengdu','fu'],['fu','mianzhu'],['chengdu'],['chengdu','chengduNorth']];
 let progress=normalizeProgress({completed:124,coins:150,weapons:{guanyu:2},armyWeapons:{cao:{guanyu:1}},inventory:{grain:2}});
 assert.equal(rewardVictory(progress,124),0);
 const chapter=STAGES.slice(124,130);
 assert.equal(chapter.length,6);
 assert.deepEqual(chapter.map(stage=>stage.faction),['cao','cao','shu','shu','shu','shu']);
 assert.deepEqual(chapter.map(stage=>stage.mission),['supply','restoration','dispatch','withdraw','restoration','dispatch']);
 for(const [i,stage] of chapter.entries()){
  const level=125+i;
  assert.equal(stage.year,263);
  assert.deepEqual(chapterInfo(level),{chapter:22,number:i+1,count:6,title:'成都受降'});
  assert.deepEqual(routeThrough(level),routes[i]);
  assert.ok(stage.historyCast.every(name=>expressionPortrait(name)));
  assert.ok(stage.references.every(ref=>new URL(ref.url).hostname==='zh.wikisource.org'));
  const map=campaignMapSvg(level);
  for(const place of routes[i])assert.ok(map.includes('>'+MAP_PLACES[place].name+'</text>'),place);
  assert.equal(rewardVictory(progress,level),80);
  assert.equal(rewardVictory(progress,level),0);
  progress=normalizeProgress(JSON.parse(JSON.stringify(progress)));
 }
 assert.equal(progress.completed,130);
 assert.equal(progress.coins,630);
 assert.equal(progress.weapons.guanyu,2);
 assert.equal(progress.armyWeapons.cao.guanyu,1);
 assert.equal(progress.inventory.grain,2);
 assert.equal(rewardVictory(progress,149),0);
 assert.match(chapter[3].victory,/綿竹失守.*諸葛瞻、諸葛尚與黃崇殉難/);
 assert.match(chapter[5].victory,/劉禪向鄧艾投降，蜀漢至此滅亡/);
 assert.doesNotMatch(campaignMapSvg(129),/route-inset-arrow/);
 assert.match(campaignMapSvg(130),/route-inset-opponent-role[^>]*>受降<\/text>/);
 assert.match(campaignMapSvg(130),/map-opponent" data-person="鄧艾"/);
 for(const [alias,name,levels] of [
  ['思遠','諸葛瞻',[126,127,128]],['黃崇','黃崇',[127,128]],['諸葛尚','諸葛尚',[128]],['允南','譙周',[129,130]]
 ]){
  const [entry]=searchPeople(alias);
  assert.equal(entry.name,name);
  assert.deepEqual(entry.levels,levels);
  assert.equal(portraitForDisplay(entry.portrait).asset,expressionPortrait(name));
 }
});

test('the Chengdu chapter logistics complete without spawning opponents or reporting enemy defeats',async()=>{
 const {createBattle,deploy,stepBattle}=await import('../../hero/engine.mjs');
 const {historyAction,historyMissionText}=await import('../../hero/history-missions.mjs');
 const {missionQuickState}=await import('../../hero/mission-quick.mjs');
 for(const level of [125,126,129,130]){
  const battle=createBattle(level);
  for(const [lane,key] of ['liubei','guanyu','zhangfei'].entries()){
   assert.ok(deploy(battle,key,lane));
   for(let i=0;i<80;i++)stepBattle(battle,.1);
  }
  for(let i=0;i<600&&!battle.over;i++){
   const m=battle.mission;
   if(m.kind==='restoration'&&m.site<0)historyAction(battle,'site',m.sites.findIndex(n=>n<8));
   if(m.kind==='supply')historyAction(battle,'supply');
   assert.doesNotMatch(historyMissionText(battle),/敵軍已清退/);
   assert.doesNotMatch(missionQuickState(battle).text,/清退/);
   stepBattle(battle,.1);
   assert.equal(battle.enemies.length,0);
  }
  assert.equal(battle.spawned,0);
  assert.equal(battle.won,true);
 }
});
