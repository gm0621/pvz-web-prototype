const base=require('./playwright.hero-map-audit.config');
module.exports={...base,testMatch:['hero-chapter-eight.spec.js','hero-people.spec.js','hero-chapter-transitions.spec.js','hero-final-chapter.spec.js'],grep:/chapter eight|new five portraits|people book|game opens book|book matches|boundary 40|final clear|failed final save|reload after unsaved/};
