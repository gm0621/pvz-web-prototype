const base=require('./playwright.hero-six.config');
module.exports={...base,testMatch:['hero-chapter-six.spec.js','hero-people.spec.js','hero-chapter-transitions.spec.js','hero-final-chapter.spec.js'],grep:/chapter six|Lu Bu capture|book|boundary 28|final clear|failed final save|reload after unsaved/};
