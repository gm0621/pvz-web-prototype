// Support older shared-home fixtures; the current zombie game opens directly.
async function openZombieHome(page){
 const entrance=page.locator('#zombieCampaignBtn');
 if(await entrance.isVisible())await entrance.click();
}
module.exports={openZombieHome};
