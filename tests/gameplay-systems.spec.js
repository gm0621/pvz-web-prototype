const {test,expect}=require('@playwright/test');

async function open(page){
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
 await page.goto('/');
}

test('state migration gives new and legacy battles versioned JSON-safe gameplay state',async({page})=>{
 await open(page);
 const result=await page.evaluate(()=>{
  const jsonUnsafePaths=(value,path='gameplay',seen=new Set())=>{
   const failures=[];
   if(value===undefined||typeof value==='function'||typeof value==='symbol'||typeof value==='bigint')return [path];
   if(value===null||typeof value!=='object')return failures;
   if(seen.has(value))return [path];
   seen.add(value);
   if(value instanceof Node||value instanceof EventTarget)failures.push(path);
   for(const [key,child] of Object.entries(value))failures.push(...jsonUnsafePaths(child,`${path}.${key}`,seen));
   seen.delete(value);
   return failures;
  };
  selectedLevel=1;
  start('plants');
  clearInterval(timer);
  const fresh=state.gameplay;
  const freshJson=JSON.parse(JSON.stringify(fresh));
  pauseAndSaveBattle('test');
  const snapshot=JSON.parse(localStorage.getItem(BATTLE_SAVE_KEY));
  const savedGameplay=snapshot.state.gameplay;
  delete snapshot.state.gameplay;
  localStorage.setItem(BATTLE_SAVE_KEY,JSON.stringify(snapshot));
  const restored=restoreBattleIfAvailable();
  clearInterval(timer);
  return {
   helperTypes:[typeof createGameplayState,typeof normalizeGameplayState],
   fresh,
   freshJson,
   savedGameplay,
   normalizedMalformed:[
    normalizeGameplayState(null),
    normalizeGameplayState([]),
    normalizeGameplayState({version:999,extra:'ignored'})
   ],
   freshUnsafe:jsonUnsafePaths(fresh),
   restored,
   restoredGameplay:state?.gameplay,
   battleSaveVersion:snapshot.version
  };
 });
 expect(result.helperTypes).toEqual(['function','function']);
 expect(result.fresh).toEqual({version:1});
 expect(result.fresh).toEqual(result.freshJson);
 expect(result.savedGameplay).toEqual(result.fresh);
 expect(result.normalizedMalformed).toEqual([result.fresh,result.fresh,result.fresh]);
 expect(result.freshUnsafe).toEqual([]);
 expect(result.fresh.version).toBeGreaterThan(0);
 expect(result.restored).toBe(true);
 expect(result.restoredGameplay).toEqual(result.fresh);
 expect(result.battleSaveVersion).toBe(1);
});
