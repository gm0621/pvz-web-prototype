const {test}=require('node:test'),assert=require('node:assert/strict');
const characters=import('../../hero/characters.mjs');
test('story mentions identify the named person without replacing the speaker',async()=>{
 const {mentionedPeople}=await characters;assert.deepEqual(mentionedPeople('皇甫嵩與朱儁借風火攻。','關羽').map(p=>p.name),['皇甫嵩','朱儁']);assert.deepEqual(mentionedPeople('是盧公！老師盧植。').map(p=>p.name),['盧植']);assert.equal(mentionedPeople('盧植','盧植').length,0);assert.equal(mentionedPeople('路口有敵人').length,0);
});
test('all 22 stages pair their own army with their actual opponent, including withdrawal',async()=>{
 const {stagePeople}=await characters,{STAGES}=await import('../../hero/story.mjs');for(let level=1;level<=22;level++){const {leader,opponent,relation}=stagePeople(level);assert.equal(leader.name,level>=20?'孫堅':level>=17?'曹操':'劉備');assert.equal(opponent.name,STAGES[level-1].bossName);if([19,20].includes(level))assert.match(relation,/撤離/)}
});
