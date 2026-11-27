const base=require('./playwright.hero-xiling-houhe-maicheng.config');
module.exports={...base,grep:/stage (110|146|170) /,use:{...base.use,trace:'off',screenshot:'only-on-failure'}};
