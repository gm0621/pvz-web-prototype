const base=require('./playwright.config');
const sizes=[['small-phone',320,568],['small-phone-landscape',568,320],['phone',390,844],['phone-landscape',667,375],['tablet',768,1024],['tablet-landscape',1024,768],['large-tablet',1180,820]];
module.exports={...base,testMatch:'hero-touch-layout.spec.js',projects:[
 ...sizes.map(([name,width,height])=>({name,use:{browserName:'chromium',viewport:{width,height},isMobile:true,hasTouch:true}})),
 ...[['webkit-phone',390,844],['webkit-tablet',820,1180],['webkit-phone-landscape',667,375],['webkit-tablet-landscape',1024,768]].map(([name,width,height])=>({name,use:{browserName:'webkit',viewport:{width,height},isMobile:true,hasTouch:true}}))
]};
