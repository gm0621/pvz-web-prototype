const base=require('./playwright.config');
module.exports={...base,testMatch:'hero-all-stage-map.spec.js',projects:[
 ...[['small-phone',320,568],['phone-landscape',667,375],['tablet',768,1024],['tablet-landscape',1024,768]].map(([name,width,height])=>({name,use:{browserName:'chromium',viewport:{width,height},isMobile:true,hasTouch:true}})),
 ...[['webkit-phone',390,844],['webkit-tablet',820,1180]].map(([name,width,height])=>({name,use:{browserName:'webkit',viewport:{width,height},isMobile:true,hasTouch:true}}))
]};
