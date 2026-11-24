const base=require('./playwright.hero-input.config');
module.exports={...base,use:{...base.use,actionTimeout:12000,trace:'retain-on-failure'},grep:undefined,testMatch:'hero-chapter-twelve.spec.js',projects:base.projects.filter(p=>['small','phone','tablet'].includes(p.name))};
