// Regenerate the human-readable design/art handoff from the same data the preview displays.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({document:{querySelectorAll:()=>[]}});
for(const file of ['js/wei-guide.js','js/zombie-season2-guide.js','js/season2-plan-data.js']){
 new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file}).runInContext(context);
}
const {plan,wei,zombies}=vm.runInContext('({plan:SEASON2_PLAN,wei:WEI_GUIDE,zombies:ZOMBIE_SEASON2_GUIDE})',context);
const roster=mode=>mode==='defense'?wei:zombies;
const name=(mode,key)=>{const d=roster(mode).find(d=>d.key===key);if(!d)throw new Error(`Unknown ${mode} unit: ${key}`);return d.name};
const names=(mode,keys)=>keys.map(k=>name(mode,k)).join('、');
for(const mode of ['defense','attack']){
 const all=[...plan.initial[mode],...plan.rewards[mode]];
 if(all.length!==12||new Set(all).size!==12)throw new Error('Invalid progression');
 names(mode,all);
}
const out=[
 '# 第二季「北境鐵壁」— 關卡設計與製圖交接',
 '',
 '> 設計預覽，尚未開放遊玩。此文件由 `node scripts/export_season2_plan.cjs` 產生，資料來源為 `js/season2-plan-data.js`。不是已完成的戰鬥規格或通關實測。',
 '',
 '## 範圍與進度規則',
 '',
 '- 共十處場景；魏國守城十關、僵屍進攻十關，各有獨立進度。圖片可由攻守共用，敵軍配置與教學目標不同。',
 '- 第二季採魏國／第二季僵屍獨立出戰設計，第四季再跨季合流；共用角色身份與收集資料，不複製帳號。',
 '- 每個模式初始 2 位角色；每關首次通關後取得 1 位，十關全破收齊該側 12 位。重玩不重複解鎖或發首次通關獎勵。',
 '- 暫定沿用第一季的順序：本季守城全破後開放本季進攻。第二季整體入口是否要求第一季全破，仍待 Gimmy 確認。',
 '- 曹操與陷城屍督分別是守城／進攻第十關通關後獎勵，不能在該模式的首次第十關使用。',
 '- 預覽所有關卡不表示已解鎖。此頁沒有通關模擬、資源寫入、雲端 RPC 或可啟動的第二季戰鬥。',
 '- 實裝時須獨立儲存 season / mode 進度；前端入口、部署卡、AI、match-start 與獎勵 RPC 一致驗證。禁止把本設計案直接塞入第一季 LEVELS 或以假存檔全開。',
 '',
 '## 初始角色',
 '',
 `- 守城：${names('defense',plan.initial.defense)}。`,
 `- 進攻：${names('attack',plan.initial.attack)}。腦力沿用自動補給概念，不依賴尚不存在的經濟兵。`,
 '',
 '## 十關總表（獎勵均為通關後取得）',
 '',
 '| 關卡 | 場景 | 守城獎勵 | 進攻獎勵 | 氣氛 |',
 '|---|---|---|---|---|',
 ...plan.stages.map(s=>`| ${s.number} | ${s.name} | ${name('defense',plan.rewards.defense[s.number-1])} | ${name('attack',plan.rewards.attack[s.number-1])} | ${s.light} |`),
 '',
 '## 共通製圖規格',
 '',
 '- 16:9 橫圖，建議 1920×1080 或更高解析度；無關卡字、UI、按鈕與人物大頭。',
 '- 北境軍營／要塞：深藍、鐵灰、冷白為主，局部暖金或爐火。避免沿用第一季綠草坪；河道、船與水路保留給吳國。',
 '- 重要建物留在中央安全區，邊緣預留裁切空間；明亮與細節集中遠景，前景簡潔。',
 '- 選關圖片先以 CSS 場景示意佔位，各關 `cardArt:null`；不請求不存在的圖片。',
 '- 收到圖片後保留原圖並轉 WebP，設定對應 stage.cardArt，例如 `assets/backgrounds/season2/s2-01.webp`。載入失敗仍顯示佔位。',
 '- 這批圖是選關卡片。未來戰鬥盤面另做可讀性設計，不直接把橋洞、拒馬或風沙變成隨機封格、遮擋、扣血與滑動規則。',
 '',
 '## 各關設計與圖片說明'
];
for(const s of plan.stages){
 out.push('',`### ${String(s.number).padStart(2,'0')}｜${s.name} — ${s.region}`,'',`**製圖／${s.light}：**${s.artBrief}`,`建議檔名：\`s2-${String(s.number).padStart(2,'0')}.webp\``);
 for(const mode of ['defense','attack']){
  const c=s[mode],other=mode==='defense'?'attack':'defense';
  out.push('',`**${mode==='defense'?'魏國守城':'僵屍進攻'}**`,c.story,'',`- 重點：${c.focus}`,`- 首次挑戰可用：${names(mode,[...plan.initial[mode],...plan.rewards[mode].slice(0,s.number-1)])}。`,`- 主要對手：${names(other,c.enemies)}。`,`- ${s.number===10?'最終頭目':'末段領隊'}：${name(other,c.leader)}。`,`- 通關後解鎖：${name(mode,plan.rewards[mode][s.number-1])}。`,`- 限制／反制：${c.counter}`);
 }
}
out.push('', '## 戰鬥實裝的驗收門檻（尚未完成）', '',
 '- 角色普通攻擊、固定天賦、機率技能與冷卻：逐個 deterministic hit/miss 測試，不讓支援、治療、標記與反傷無限循環。',
 '- 領隊可沿用既有角色外觀另設關卡強度，不是新的可收集角色。最終頭目不得混入普通波次。',
 '- 守城採有限敵軍、清楚的波次與末段頭目；清完即可勝利，不因剩餘倒數而拖延。資源、HP、出兵數量、時間與機率尚未定值，不宣稱已平衡。',
 '- 難度依首次挑戰實際可用角色測試，不能使用當關的通關獎勵作弊驗收。',
 '- 進攻每關保留可突破路線；不能讓煙霧、鉤鎖或封策任一角色成為唯一解。',
 '- 客戶端與資料庫的角色資格、進度與首次通關獎勵皆通過後，才將設計預覽升級為可玩入口。',
 '', '## 預覽的本機驗證', '',
 '`npx playwright test tests/season2-plan.spec.js`', '',
 '`npm run test`', '',
 '測試涵蓋攻守十關、完整且不重複的獎勵順序、每關首次可用名單、對手引用、佔位與缺圖回退、首頁往返與存檔不變。這是預覽驗證，不是第二季戰鬥通關驗證。','');
const dest=path.join(root,'docs/season2-campaign-plan.md');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,out.join('\n'));console.log('Exported',path.relative(root,dest),'— 10 scenes / 20 mode plans / 24 character progression references verified.');
