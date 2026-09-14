// Regenerate the readable script from the single authored runtime source.
const fs=require('fs'),vm=require('vm');
const data=vm.runInNewContext(fs.readFileSync('js/wave-story.js','utf8')+';DEFENSE_WAVE_STORY');
const lines=['# 守城波次短劇情','','由 `node scripts/build-wave-story-doc.cjs` 從 `js/wave-story.js` 產生。','','- 警訊在下一波門檻前一名敵人已出陣時觸發；不改出兵時間。','- 警訊顯示 7 秒，進場喊話顯示 4 秒，依戰局時間計時；可略過，不暫停戰鬥。','- 軍情只預告既定波次人數與分路提醒，不承諾尚未確定的兵種。','- 各波訊息和略過狀態隨本機戰局保存；舊戰局不插入新對話。','- 台詞中的糧道、接應、役魂旗延續既有主線，不新增護送或破旗任務。',''];
let count=0;
for(const [season,levels] of Object.entries(data))for(const [level,copy] of Object.entries(levels)){lines.push(`## 第 ${season} 季・第 ${level} 關`,'');copy.scout.forEach((text,i)=>{lines.push(`### 第 ${i+1} 波`,`- 集結警訊：${text}`,`- 進場喊話：${copy.charge[i]}`,'');count+=2})}
fs.writeFileSync('docs/wave-story-script.md',lines.join('\n'));console.log(`Generated ${count} interludes in docs/wave-story-script.md`);
