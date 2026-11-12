const base=require('./playwright.config');
module.exports={...base,testMatch:['hero-chapter-transitions.spec.js','hero-final-chapter.spec.js'],projects:[{name:'phone',use:{browserName:'chromium',viewport:{width:390,height:844},isMobile:true,hasTouch:true}},{name:'tablet',use:{browserName:'webkit',viewport:{width:820,height:1180},isMobile:true,hasTouch:true}}]};
