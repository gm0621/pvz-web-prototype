const {test,expect}=require('@playwright/test');

async function openStageEight(page,{legacyGap=false}={}){
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',route=>route.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}})};'}));
 await page.goto(process.env.GAME_URL||'/');
 await page.evaluate(legacyGap=>{
  currentUser=null;currentSeason=1;playerProfile=defaultProfile();
  for(let level=1;level<8;level++)completeCampaignLevel('plants',level);
  if(legacyGap){playerProfile.campaignProgress.plants.completedLevels[8]=1;delete playerProfile.campaignProgress.plants.completedLevels[4];playerProfile=normalizeProfile(playerProfile)}
  saveProfile(false,false);markStoryRead('plants',8,'opening');
 },legacyGap);
 await page.locator('#plantStartBtn').click();
 await page.getByRole('button',{name:/第一季 蜀國篇/}).click();
 await page.locator('#levelGrid .level-card').nth(7).locator('button').first().click();
 await page.evaluate(()=>clearInterval(timer));
}

for(const legacyGap of [false,true])test(`Shu defense eight victory opens nine and survives reload (legacy gap: ${legacyGap})`,async({page})=>{
 await openStageEight(page,{legacyGap});
 await page.evaluate(()=>end(true,'防守成功！','第八關完成'));
 await expect(page.locator('#modalNext')).toBeEnabled();
 await page.locator('#modalNext').click();
 await expect(page.locator('#storyDialog')).toBeVisible();
 await page.locator('#storySkip').click();
 await expect(page.locator('#game')).toHaveClass(/active/);
 expect(await page.evaluate(()=>({level:state.level,unlocked:isCampaignLevelUnlocked('plants',9)}))).toEqual({level:9,unlocked:true});
 await page.reload();
 expect(await page.evaluate(()=>isCampaignLevelUnlocked('plants',9))).toBe(true);
 if(legacyGap)expect(await page.evaluate(()=>playerProfile.campaignProgress.plants.completedLevels[4])).toBeUndefined();
});

test('legacy guest continuation does not grant jumps, missing clears, cloud access or season two previews',async({page})=>{
 await openStageEight(page,{legacyGap:true});
 const result=await page.evaluate(()=>{
  const before=JSON.stringify(playerProfile);
  const guest={nine:isCampaignLevelUnlocked('plants',9),ten:isCampaignLevelUnlocked('plants',10),attack:isCampaignLevelUnlocked('zombies',1),seasonTwo:isCampaignLevelUnlocked('plants',3,2)};
  const untouched=before===JSON.stringify(playerProfile);
  currentUser={id:'fixture-only'};
  const cloudNine=isCampaignLevelUnlocked('plants',9);
  currentUser=null;playerProfile=defaultProfile();
  const freshEight=isCampaignLevelUnlocked('plants',8),freshNine=isCampaignLevelUnlocked('plants',9);
  return {guest,untouched,cloudNine,freshEight,freshNine};
 });
 expect(result).toEqual({guest:{nine:true,ten:false,attack:false,seasonTwo:false},untouched:true,cloudNine:false,freshEight:false,freshNine:false});
});
