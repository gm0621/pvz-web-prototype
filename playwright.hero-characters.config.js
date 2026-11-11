const base=require('./playwright.config');
module.exports={...base,testMatch:'hero-character-map.spec.js',projects:[
 {name:'small-phone',use:{browserName:'chromium',viewport:{width:320,height:568},isMobile:true,hasTouch:true}},
 {name:'tablet',use:{browserName:'chromium',viewport:{width:768,height:1024},isMobile:true,hasTouch:true}},
 {name:'webkit-phone',use:{browserName:'webkit',viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
 {name:'webkit-tablet',use:{browserName:'webkit',viewport:{width:820,height:1180},isMobile:true,hasTouch:true}}
]};
