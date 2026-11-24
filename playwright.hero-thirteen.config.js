const base=require('./playwright.hero-twelve.config');
module.exports={...base,testMatch:'hero-chapter-thirteen.spec.js',projects:base.projects.filter(p=>['phone','tablet'].includes(p.name))};
