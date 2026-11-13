const base=require('./playwright.hero-map-audit.config');
module.exports={...base,testMatch:['hero-chapter-eight.spec.js','hero-eight-audit.spec.js','hero-eight-upgrades-flow.spec.js'],retries:0};
