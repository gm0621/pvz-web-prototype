// Separate online test entry. The normal app and its save key are never changed.
try {
 const entry=document.querySelector('script[data-game-entry]').dataset.gameEntry;
 const responses=await Promise.all([fetch(entry,{cache:'no-store'}),fetch('../tools/hero-test-hook.mjs',{cache:'no-store'})]);
 if(responses.some(r=>!r.ok))throw new Error('測試程式載入失敗');
 let [source,hook]=await Promise.all(responses.map(r=>r.text()));
 const marker='SAVE_KEY,normalizeProgress';
 if(source.split(marker).length!==2||source.split('function show(id){').length!==2)throw new Error('遊戲入口已更新，測試工具需要調整');
 source=source.replace(marker,'SAVE_KEY as PLAYER_SAVE_KEY,normalizeProgress').replace('const $=id=>',"const SAVE_KEY='heroLegendOnlineTest_v1';\nconst $=id=>").replace('function show(id){','function show(id){queueMicrotask(positionLocalTestButton);');
 hook=hook.replaceAll('本機跳關測試','線上跳關測試').replace('僅這台電腦可用。','獨立測試入口；知道網址的人也能使用。').replaceAll('本機測試','線上測試').replace("location.assign('/hero/?'+params)","location.assign(location.pathname+'?'+params)");
 const code=(source+'\n'+hook).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g,(_,a,path,z)=>a+new URL(path,entry).href+z);
 const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));try{await import(url)}finally{URL.revokeObjectURL(url)}
}catch(error){const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='測試工具無法啟動，請重新整理：'+error.message;document.body.prepend(p);console.error(error)}
