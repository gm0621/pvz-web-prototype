# 開發與跨工具接手指南

## 換一台電腦

需要 Git、Node.js 20 或更新版本、npm，以及可安裝的 Playwright 瀏覽器。專案不需要 Codex 專用套件，也不依賴特定 Agent。

```sh
git clone https://github.com/gm0621/pvz-web-prototype.git
cd pvz-web-prototype
git switch main
git pull --ff-only
npm ci
npx playwright install chromium
```

`package-lock.json` 是可重現安裝的依據，使用 `npm ci`；不要為了換工具而順便升級依賴、改用另一份鎖檔或提交 `node_modules`。

在此資料夾啟動你的開發工具，先讓它讀 `AGENTS.md`。只有文件不能提供 GitHub 寫入權限、模型帳號、資料庫憑證或另一台電腦的未提交變更；這些環境仍需各自設定。

### 不同 Agent 的入口

| 工具 | 專案入口 |
| --- | --- |
| Codex | 根目錄 `AGENTS.md` |
| Hermes Agent | 共用 `AGENTS.md`，本專案沒有另外建立會蓋過它的 `.hermes.md` |
| Claude Code | `CLAUDE.md` 用 `@AGENTS.md` 匯入同一份說明，兼顧不同版本 |
| 其他工具 | 明確請它先讀 `AGENTS.md` 和此次工作需要的文件 |

工具版本、全域設定或個人 override 可能改變載入方式。開始新 session 時可請 Agent 列出它讀到的專案規則檔，以確認沒有漏讀。

共用入口的設計參考：[Codex 官方文件](https://developers.openai.com/codex/guides/agents-md)、[Hermes 官方文件](https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files)、[Claude Code 官方文件](https://code.claude.com/docs/en/memory)。

## 本機預覽

```sh
node tests/support/static-server.js
```

開啟 `http://127.0.0.1:4174/`（殭屍）或 `http://127.0.0.1:4174/hero/`（獨立演義）。前端沒有打包步驟，修改後重新整理即可。一般訪客試玩不需要自己的 Supabase 密鑰；登入與雲端操作則使用目前專案設定，測試應採既有 mock，避免動到真實帳號。

## 測試

先停止手動預覽，再執行下列命令。`playwright.config.js` 自己啟動 4174 埠服務，預設測桌機與手機，單 worker。

```sh
# 獨立英雄演義：完整單元測試（引擎、六章、地圖與背景音訊）及 UI
npm run test:hero:engine
npm test -- tests/hero-standalone.spec.js --workers=1

# 英雄演義存檔、軍資、營地交易與保存失敗
npm test -- tests/hero-economy-persistence.spec.js tests/hero-settlement.spec.js tests/hero-novel-camp.spec.js --retries=0

# 曹仁／夏侯淵劇情、營地、圖鑑與虛構標示（六尺寸）
npx playwright test --config=playwright.hero-cao-people.config.js

# 第六章完整流程、圖鑑、第五章邊界與最終存檔
npx playwright test --config=playwright.hero-six-audit.config.js

# 第六章與人物圖鑑手機／平板
npx playwright test --config=playwright.hero-six.config.js

# 第五章手機／平板完整檢查（含存檔與跨章）
npx playwright test --config=playwright.hero-five-audit.config.js --retries=0

# 第五章手機／平板、六章連續銜接與 34 關亂序重玩
npx playwright test --config=playwright.hero-five.config.js --retries=0
npx playwright test --config=playwright.hero-transitions.config.js --retries=0

# 新手教學、導覽與原戰役進度
npm test -- tests/progressive-onboarding.spec.js tests/season-navigation.spec.js tests/defense-progression.spec.js --workers=1

# 戰場目標、部署與護送等規則
npm test -- tests/battle-objectives.spec.js tests/battle-guidance.spec.js tests/stage-rules.spec.js --workers=1

# 原戰役劇情與波次
npm test -- tests/season1-story.spec.js tests/season2-story.spec.js tests/defense-waves.spec.js --workers=1

# 完整現有測試
npm test
```

平板與 WebKit 檢查另需安裝瀏覽器：

```sh
npx playwright install chromium webkit
npm test -- --config=playwright.tablet.config.js --workers=1
```

英雄演義的手機／平板劇情、營地與單挑觸控檢查（含 Chromium、WebKit、直橫向與旋轉）：

```sh
npm test -- --config=playwright.hero-touch.config.js --retries=0
```

視改動選擇相關測試。記錄執行命令、實際瀏覽器、通過／失敗／略過項目。受控 fixture、強制結算及手動改狀態只驗證流程，不能作為自然戰鬥平衡或真人勝率的證據。

第五、六章人物一致性檢查（十二關序幕來回翻頁、勝敗營地逐句比對圖鑑，以及六尺寸關卡流程）：

```sh
npx playwright test --config=playwright.hero-companion-audit.config.js --retries=0
```

## 程式導覽

| 檔案 | 主要用途 |
| --- | --- |
| `index.html` | 畫面結構、模組載入順序、快取版本 |
| `js/app.js` | 戰局建立／還原、戰鬥、畫面、導覽、結果結算 |
| `js/data.js` | 第一季兵種、關卡與戰鬥資料 |
| `js/season2-data.js`、`js/season2-game.js` | 第二季資料與特有行為、季度選擇 |
| `hero/people.html` | 人物圖鑑；people-data.mjs 維護姓名別名、簡介、分類、出場關卡，people.mjs 唯讀搜尋，無存檔寫入 |
| `hero/chapter-six.mjs` | 第 29～34 關史實、對話、任務、營地與來源；規格見 hero-history-chapter-six.md |
| `hero/story.mjs` | 第一章資料、角色數值與六章關卡組合；後續章節見 `hero/chapter-two.mjs`、`hero/chapter-three.mjs`、`hero/chapter-four.mjs` |
| `hero/engine.mjs` | 獨立三路戰鬥、補糧、部署、分段單挑與勝負 |
| `hero/app.mjs`、`hero/game.css` | 獨立畫面、操作及本機保存；配樂見 `hero/audio.mjs`，營地經濟見 `hero/campaign.mjs` |
| `js/romance-*.js` | 舊版相容程式，沒有首頁入口 |
| `js/stage-rules-data.js` | 關卡勝負規則與序列化任務資料 |
| `js/defense-waves.js` | 有限波次、預警及波次還原 |
| `js/season1-story.js` | 三條戰役共用劇情介面與閱讀流程 |
| `js/gameplay-systems.js` | 戰鬥修正層、軍令、戰報、遙測等 |
| `js/cloud.js`、`js/account.js`、`js/shop.js` | 雲端、帳號、養成與商城 |
| `css/romance.css` | 演義／單挑樣式及雙模式首頁 |
| `supabase/` | 資料表、權威經濟及功能 migration |
| `tests/` | Playwright 與資料契約回歸 |

原殭屍遊戲是傳統 script 架構，模組透過共用全域函式合作。搬動載入順序、引入 `type="module"` 或改為打包框架前，要先盤點相依與現有測試。

## 保存與模式界線

- 原戰役 `season 1/2` 使用既有玩家 profile、雲端進度與權威獎勵；勿改變原有驗證契約。
- 獨立英雄演義只使用 `heroLegendProgress_v1`：版本、已完成關數 0–40（上限由 `hero/campaign-config.mjs` 的 `CAMPAIGN_LENGTH` 定義）、軍資 coins、獎勵標記 rewarded、道具 inventory、兵器 weapons，不按帳號分區，不與原 profile 共用。
- 回主選單暫停並保留當頁戰局；重整後保留已完成關數、軍資、道具與兵器，不保存進行中的單位、冷卻或單挑。
- 營地購買與戰鬥道具需成功保存才接受扣款／消耗；寫入失敗會回復交易，且道具不生效。通關獎勵保存失敗時留在當頁，可於結算點「重試保存」，未保存前重整仍回到最後成功的存檔。讀取拋錯或 JSON 損壞時顯示警告，當頁拒絕覆寫原存檔，待重新整理再讀取。
- 原遊戲及舊共用演義存檔原封保留；不自動遷移，以免不同身份或規則互相覆寫。
- 新版劇情與圖片規格見 [獨立版設計](hero-standalone.md)。舊 [第一章設計](romance-chapter-one.md) 僅為歷史規劃，非新版實作規格。

英雄演義逐格動作、命中時間及素材維護見 [攻擊動畫交接](hero-attack-animation.md)。

## 分支與發布

跨電腦交接前先提交並上傳工作分支；下一台先 fetch，再接同一個分支。只有已上傳的檔案會跟著 GitHub，聊天、登入、瀏覽器存檔及未提交檔案不會。

```sh
git fetch origin
git switch -c my-next-change origin/main
git status --short
```

本專案目前使用 GitHub Pages。以當下的儲存庫 Settings / Actions 狀態為準；已觀察到 `main` 的提交會觸發 `pages build and deployment`。發布需要當次授權，確認沒有衝突、相關測試通過後再合併。程式進入 `main` 與網站部署完成是兩件事。

正式網址：<https://gm0621.github.io/pvz-web-prototype/>

確認 Actions 發布成功後，再實際開站檢查兩個獨立網址、相關腳本及一場遊戲，不以 PR 已合併代替驗證。

## 給下一個 Agent 的開場句

> 請先讀根目錄 AGENTS.md，以及 docs/PROJECT_STATUS.md。確認目前分支、工作區與遠端版本後，再依本次任務讀相關開發／設計文件。保留原有殭屍戰役與玩家存檔；實際執行相關測試，並把完成狀態與未完成事項更新回交接文件。

第七章六尺寸流程：`npx playwright test --config=playwright.hero-seven.config.js --retries=0`。

完整銜接與最終關結算／保存恢復：`npx playwright test --config=playwright.hero-seven-flow.config.js --retries=0`（檔名沿用，實際依目前 46 關驗證）。

第八章六尺寸新關、人物圖鑑、40→41 保存失敗與第 46 關結算：`npx playwright test --config=playwright.hero-eight.config.js --retries=0`。

全 46 關銜接、亂序重玩、八個跨章／換軍保存邊界與舊章回歸：`npx playwright test --config=playwright.hero-eight-flow.config.js --retries=0`。每關行軍圖六尺寸：`npx playwright test --config=playwright.hero-map-audit.config.js --grep "chapter 8" --retries=0`。
