const {test,expect}=require('@playwright/test');
for(const [width,height] of [[768,1024],[820,1180],[1024,768],[1180,820],[390,844],[667,375]]){
 test(`story actors stay above dialogue at ${width}x${height}`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.goto('/hero/');
  await expect(page.locator('#startBtn')).toBeVisible();
  const menu=page.locator('#chapterPicker summary');
  expect((await menu.boundingBox()).height).toBeGreaterThanOrEqual(48);
  await menu.click();await expect(page.locator('#chapterTabs')).toBeVisible();
  await page.locator('#startBtn').click();await page.locator('#prologueContinue').click();
  // Exercise real opening and ending text in the shared dialogue layout.
  // This is a layout fixture, not a simulated victory or a gameplay test.
  const lines=await page.evaluate(async()=>{
   const {STAGES}=await import('/hero/story.mjs');
   return STAGES.flatMap(s=>[...s.opening,...s.ending]);
  });
  for(const [speaker,line] of lines){
   await page.evaluate(({speaker,line})=>{
    document.querySelector('#storySpeaker').textContent=speaker;
    document.querySelector('#storyLine').textContent=line;
    for(const actor of document.querySelectorAll('.scene-cast img')){
     actor.classList.toggle('speaking',actor.alt===speaker);
     actor.classList.toggle('listening',actor.alt!==speaker);
    }
   },{speaker,line});
   const boxes=await page.evaluate(()=>{
    const d=document.querySelector('.scene-dialogue').getBoundingClientRect();
    const name=document.querySelector('#storySpeaker').getBoundingClientRect();
    const scene=document.querySelector('#storyScene').getBoundingClientRect();
    return {dialogueTop:Math.min(d.top,name.top),dialogueBottom:d.bottom,sceneBottom:scene.bottom,
     actorBottoms:[...document.querySelectorAll('.scene-cast img')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect().bottom),overflow:document.documentElement.scrollWidth>innerWidth};
   });
   expect(boxes.actorBottoms.length).toBeGreaterThan(0);
   for(const bottom of boxes.actorBottoms)expect(bottom).toBeLessThanOrEqual(boxes.dialogueTop);
   expect(boxes.dialogueBottom).toBeLessThanOrEqual(boxes.sceneBottom);
   expect(boxes.overflow).toBe(false);
  }
 });
}
