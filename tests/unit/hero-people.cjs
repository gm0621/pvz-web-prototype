const {test}=require('node:test'),assert=require('node:assert/strict');
test('people book covers named portraits and separates story inventions from historical people',async()=>{
 const {PEOPLE,searchPeople}=await import('../../hero/people-data.mjs'),{STORY_PEOPLE}=await import('../../hero/characters.mjs');
 assert.equal(new Set(PEOPLE.map(p=>p.name)).size,42);for(const p of STORY_PEOPLE)assert.ok(PEOPLE.some(x=>x.name===p.name),p.name);
 for(const p of PEOPLE){assert.ok(p.portrait.asset,p.name);assert.ok(p.intro&&p.remember&&p.note,p.name);assert.ok(p.levels.every(n=>n>=1&&n<=34));}
 assert.deepEqual(searchPeople(' 盧公 ').map(p=>p.name),['盧植']);assert.deepEqual(searchPeople('劉協').map(p=>p.name),['漢獻帝']);assert.equal(searchPeople('','遊戲原創').length,5);assert.deepEqual(searchPeople('','演義人物').map(p=>p.name),['鄧茂','程遠志']);assert.equal(searchPeople('呂布','遊戲原創').length,0);assert.ok(searchPeople('張繡')[0].levels.includes(31));
});
test('people appearances include the visible history notes and quiz',async()=>{
 const {PEOPLE}=await import('../../hero/people-data.mjs');const levels=name=>PEOPLE.find(p=>p.name===name).levels;
 assert.ok(levels('張角').includes(1),'chapter one history and quiz mention Zhang Jiao');assert.ok(levels('盧植').includes(8),'chapter two history notes mention Lu Zhi');assert.ok(levels('董卓').includes(12),'chapter three story notes mention Dong Zhuo');assert.ok(!levels('典韋').includes(34),'source title is not a story appearance');assert.ok(!levels('呂布').includes(30),'exclude reference-only mention');assert.ok(!levels('漢獻帝').includes(30),'chapter six background is not shown in place of stage history');
});
