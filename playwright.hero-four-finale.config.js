const base=require('./playwright.hero-map-audit.config');
module.exports={...base,testMatch:['hero-four-finale-flow.spec.js','hero-coalition-enemies.spec.js','hero-coalition-objectives.spec.js','hero-army-skills.spec.js'],grep:/19 through 22|stage (19|20|21)|retreat (19|20)|Luoyang|switching armies|coalition spear/,retries:0};
