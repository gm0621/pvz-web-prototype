const base=require('./playwright.config');
module.exports={...base,testMatch:'tablet-fullscreen.spec.js',projects:[
 {name:'tablet-chromium',use:{browserName:'chromium'}},
 {name:'tablet-webkit',use:{browserName:'webkit'}}
]};
