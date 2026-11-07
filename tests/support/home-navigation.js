// The original campaigns now sit behind the 大戰殭屍 adventure entrance.
async function openZombieHome(page){
 const entrance=page.locator('#zombieCampaignBtn');
 if(await entrance.isVisible())await entrance.click();
}
module.exports={openZombieHome};
