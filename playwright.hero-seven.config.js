const base=require('./playwright.hero-map-audit.config');
module.exports={...base,testMatch:['hero-chapter-seven.spec.js','hero-people.spec.js','hero-chapter-transitions.spec.js'],grep:/chapter seven|new six portraits|people book|game opens book|book matches|boundary 34/};
