const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'./tests',testMatch:'hero-battle-focus.spec.js',timeout:45000,retries:0,workers:2,reporter:'list',outputDir:'test-results/battle-focus',use:{baseURL:'http://127.0.0.1:4174',headless:true},webServer:{command:'node tests/support/static-server.js',url:'http://127.0.0.1:4174',reuseExistingServer:false},projects:[
 {name:'small',use:{browserName:'chromium',viewport:{width:320,height:568}}},
 {name:'phone',use:{browserName:'chromium',viewport:{width:390,height:844}}},
 {name:'landscape',use:{browserName:'chromium',viewport:{width:667,height:375}}},
 {name:'desktop',use:{browserName:'chromium',viewport:{width:1440,height:900}}},
 {name:'webkit-phone',use:{browserName:'webkit',viewport:{width:390,height:844}}},
 {name:'tablet',use:{browserName:'webkit',viewport:{width:820,height:1180}}}
]});
