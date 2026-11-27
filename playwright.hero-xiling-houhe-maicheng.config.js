const base=require('./playwright.hero-tong-yin-mian.config');
module.exports={...base,testMatch:'hero-three-stage-missions.spec.js',grep:/stage (82|121|138) /};
