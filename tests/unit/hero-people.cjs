const {test}=require('node:test'),assert=require('node:assert/strict');
test('people book covers named portraits and separates story inventions from historical people',async()=>{
 const {PEOPLE,searchPeople}=await import('../../hero/people-data.mjs'),{STORY_PEOPLE}=await import('../../hero/characters.mjs');
 assert.equal(new Set(PEOPLE.map(p=>p.name)).size,42);for(const p of STORY_PEOPLE)assert.ok(PEOPLE.some(x=>x.name===p.name),p.name);
 for(const p of PEOPLE){assert.ok(p.portrait.asset,p.name);assert.ok(p.intro&&p.remember&&p.note,p.name);assert.ok(p.levels.every(n=>n>=1&&n<=34));}
 assert.deepEqual(searchPeople(' 盧公 ').map(p=>p.name),['盧植']);assert.deepEqual(searchPeople('劉協').map(p=>p.name),['漢獻帝']);assert.equal(searchPeople('','遊戲原創').length,5);assert.deepEqual(searchPeople('','演義人物').map(p=>p.name),['鄧茂','程遠志']);assert.equal(searchPeople('呂布','遊戲原創').length,0);assert.ok(searchPeople('張繡')[0].levels.includes(31));
});
