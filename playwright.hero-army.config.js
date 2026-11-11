const base=require('./playwright.hero-map-audit.config');
module.exports={...base,testMatch:'hero-army-identity.spec.js',use:{...base.use,actionTimeout:15000}};
