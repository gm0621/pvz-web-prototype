# 戰鬥樂趣六系統執行進度

主規格：[`2026-10-06-gameplay-fun-systems.md`](./2026-10-06-gameplay-fun-systems.md)

## 執行規則

- 一次只允許一個 writer 修改工作樹；其他 Agent 僅做唯讀規劃或驗證。
- 依 Phase 0 → 7 順序執行；前一階段未通過 gate，不得開始下一階段。
- 每項功能遵循 RED → GREEN；每階段需 focused tests、相關回歸、canonical `npm run test`。
- UI 階段必須做 desktop、390×844、844×390 的實際 browser/DOM/screenshot 驗收。
- 每階段獨立 commit、push，可獨立 rollback。
- 若工作樹有不明未提交修改，停止該輪並回報，不覆蓋。
- 完成 Phase 7 正式發布與 production smoke 後，勾選 `PROJECT COMPLETE`。

## 進度

- [x] Phase 0：共用戰鬥事件與可序列化統計底座
  - [x] Task 0.1：battle-local state 與舊存檔 migration
  - [x] Task 0.2：純觀測 battle event 與 telemetry API
  - [x] Gate：focused、canonical suite、commit、push
- [x] 秦皇終章 hotfix：通關紀錄、跨列軍令、軍陣減傷、三虎符／8 秒破陣、舊戰局恢復與 responsive UI
  - [x] Gate：desktop／mobile focused、1440×900／390×844／844×390 DOM＋screenshots、canonical suite
- [x] Phase 1：戰鬥爽感與波次戰報
  - [x] Task 1.1：波次／里程碑戰報
  - [x] Task 1.2：命中回饋與精簡特效設定
  - [x] Gate：desktop／mobile／短橫向 browser screenshots + full suite
- [x] Phase 2：敵人預警與反制
  - [x] Task 2.1：資料驅動、可序列化預警模型
  - [x] Task 2.2：預警視覺與無障礙語意
  - [x] Gate：預警→反制／命中→cleanup 全鏈測試
- [x] Phase 3：大波次後三選一軍令
  - [x] Task 3.1：9 張軍令與 modifier API
  - [x] Task 3.2：守城軍令三選一 UI
  - [x] Task 3.3：攻城里程碑軍令
  - [x] Gate：兩季攻守、save/reload、mobile/fullscreen/cloud suites
- [ ] Phase 4：關卡專屬規則
  - [x] Task 4.1：stage-rule registry 與目標文字單一來源
  - [x] Task 4.2：六關 tracer-bullet 試點
  - [ ] Task 4.3：擴至兩季×兩陣營×10 關
  - [ ] Gate：資料完整性、archetype journeys、full suite
- [ ] Phase 5：角色組合技
  - [ ] Task 5.1：資料驅動組合偵測與 UI
  - [ ] Task 5.2：組合、軍令與關卡規則堆疊順序
  - [ ] Gate：全角色回歸與 desktop/mobile smoke
- [ ] Phase 6：關卡挑戰、勳章與純外觀獎勵
  - [ ] Task 6.1：profile migration、fair challenge evaluator、atomic/idempotent reward
  - [ ] Task 6.2：選關與結算勳章 UI
  - [ ] Task 6.3：勳章里程碑純外觀獎勵
  - [ ] Gate：guest/cloud/conflict/profile migration suites
- [ ] Phase 7：全關卡擴充、平衡與正式發布
  - [ ] Task 7.1：完整資料矩陣與靜態檢查
  - [ ] Task 7.2：deterministic balance tests
  - [ ] Task 7.3：完整 UI／無障礙驗收
  - [ ] Task 7.4：發布、Pages marker、production journeys、mobile screenshot
  - [ ] Gate：canonical 0 failed / 0 flaky + production smoke
- [ ] PROJECT COMPLETE

## 當前狀態

- 秦皇終章 hotfix 已完成：通關會寫入並在主選單／終章卡永久顯示；秦皇依階段與軍令循環跨列，未破陣時減傷 45%，三枚虎符開啟 8 秒全傷害窗口；舊 snapshot 自動補齊護體與 lane cycle。focused 15 passed／1 skipped，canonical 411 passed／5 skipped，三尺寸實畫無水平裁切。
- Phase 1 已完成：暴擊命中與護盾破裂加入不改變傷害時序的視覺／震動回饋；三路箭只做視覺微錯峰，實際釋放與命中時序一致；「精簡特效」會持久化，且與 `prefers-reduced-motion` 一同停用停格、震動與錯峰。
- Task 1.2 focused／related tests 與 tablet fullscreen 回歸均通過；canonical suite 為 419 passed／5 skipped，desktop 1440×900、portrait 390×844、landscape 844×390 實畫與 DOM 驗收無水平溢位或重要遮擋。
- Task 2.1 已完成：第一、二季危險敵技改採 `state.time` 兩階段預警／結算，支援換列與擊殺施術者反制、exactly-once 清除及暫停／背景／讀檔一致性；並保留第二季拖行既有落點、控制時長與攻擊節奏。RED 先確認危險技仍立即命中／缺少預警；focused `tests/enemy-telegraphs.spec.js` 12/12、第二季與共用系統 related 40/40，canonical 為 431 passed／5 skipped／0 failed／0 flaky，`git diff --check` 與相關 JS `node --check` 全數通過。
- Task 2.1 browser evidence：desktop 1440×900、portrait 390×844、landscape 844×390 實際 DOM／截圖均顯示預警 banner 與九宮格、無水平溢位、警示不攔截 pointer。390×844 的下方警示區仍會被既有卡片抽屜遮住，列入下一個 Task 2.2 的可讀性修正，不提前勾選。
- Task 2.2 與 Phase 2 Gate 已完成：危險技加入各自圖示、斜紋、文字／語意化 `<time>` 倒數與固定反制提示；預警層保持 `pointer-events:none`，手機有預警時依卡片抽屜位置縮放棋盤，390×844 與 fullscreen 的最下方九宮格完整可見。RED 先確認缺少 `.telegraph-icon`／`time.telegraph-countdown`；focused `tests/enemy-telegraphs.spec.js` 18/18、related（共用系統、第二季、秦皇、操作提示、tablet fullscreen）93 passed／1 skipped，新增全技能反制／未反制命中／cleanup gate；canonical 為 437 passed／5 skipped／0 failed／0 flaky，`git diff --check` 與相關 JS `node --check` 全數通過。
- Task 2.2 browser evidence：desktop 1440×900、portrait 390×844、landscape 844×390、portrait fullscreen 實際 DOM／截圖均無水平溢位、卡片遮擋或 pointer 攔截；圖示、文字倒數、lane／九宮格圖樣與反制 banner 清楚可辨。
- Task 3.1 已完成：新增 9 張全局內軍令資料，每張均有明確收益與代價；`state.gameplay.orders` 可序列化並會清理未知／重複 id，`effectiveBattleModifier()` 以加法疊加並限制在 0.5–1.5，不修改角色基礎資料。RED 先確認 API 與 battle-local order state 缺失；focused 4/4、related（gameplay systems、敵技預警、第二季存檔）36/36，fresh canonical 441 passed／5 skipped／0 failed／0 flaky，`git diff --check` 與相關 JS `node --check` 通過。Task 3.1 無玩家 UI 變更，未要求 screenshot。
- Task 3.2 已完成：每個守城波次完成後建立並立即保存三張不重複軍令；選擇期間以 battle-time 暫停，reload 保留原 offer、不重抽，選擇 exactly-once 並立即啟用 modifier。恢復中的 offer 保持安全暫停，pause overlay、story/result modal、navigation、focus 與背景 `inert` 已協調。RED 先確認缺少三選一 UI、焦點回復與 navigation cleanup；focused 10/10，related 130/130，canonical 447 passed／5 skipped／0 failed／0 flaky，`git diff --check` 與相關 JS `node --check` 通過。desktop 1440×900、portrait 390×844、landscape 844×390 的實際 DOM／截圖均顯示三卡完整可讀、無裁切／重疊／水平溢位或背景互動；下一項為 Task 3.3。
- Task 3.3 與 Phase 3 Gate 已完成：第一、二季攻城在首次擊破守軍與剩餘 40% 時間壓力各觸發一次三選一軍令，每局最多兩次；已觸發 milestone 與 pending offer 都隨 battle-local snapshot 保存，reload 不重抽，拖時間不會重複觸發，攻城失敗後重開會建立全新軍令狀態。deadline 會先結算失敗，不會在 00:00 彈出無效軍令。RED 為 desktop／mobile 4 failed；focused 14/14，Phase Gate 34/34，canonical 451 passed／5 skipped／0 failed／0 flaky，`git diff --check` 與相關 JS `node --check` 全數通過。desktop 1440×900、portrait 390×844、landscape 844×390 的實際 DOM／截圖均顯示三張軍令完整可讀、無裁切／重疊／水平溢位；下一項為 Task 4.1。
- Task 4.1 已完成：新增 `STAGE_RULES` registry 與完整 `id/title/brief/objective/start/tick/onEvent/isComplete/isFailed` contract；第一、二季攻守及秦皇終章由同一來源建立關卡卡片、戰鬥 HUD 與勝敗判定。`state.gameplay.stageRule` 僅保存 JSON-safe `{id,data}`，新局、舊 snapshot、reload 與未知 rule id 都會 deterministic normalize；未知 id 不會沿用不相容 runtime data。RED 先確認 registry／runtime／共用目標缺失（3 failed），再確認未知 rule data 未清理（1 failed）；focused desktop＋mobile 10/10、related desktop 74 passed／1 skipped、mobile 19/19，fresh canonical 461 passed／5 skipped／0 failed／0 flaky，`git diff --check`、相關 JS `node --check` 與新增行 credential scan 均通過。
- Task 4.1 browser evidence：desktop 1280×720、portrait 390×844、landscape 844×390 的實際 DOM／全頁截圖均顯示關卡目標清楚可讀，無水平裁切或重疊；下一項為 Task 4.2。
- Task 4.2 已完成：六個優先 pilot 關卡已有真正可玩的 stage-rule tracer bullets。第一季守方 L1 保住五路推車、L2 護送具生命與進度的運糧兵、L3 每 12 秒輪轉封路；第一季攻方 L1 限時摧毀標記箭塔後突破；第二季守方 L1 每 10 秒輪轉霜徑並實際降低該路敵軍移速；第二季攻方 L1 護送專屬衝車存活破門。規則均由 battle time 驅動、JSON-safe 保存，沿用既有 `checkEnd` 與雲端勝場提交流程；暫停與 reload 不會偷跑時間或重抽狀態。
- Task 4.2 驗證：Playwright RED 先因六關仍解析為 standard rule 而失敗；focused desktop＋mobile 20/20；related gameplay/waves/season2/save 38/38。獨立回歸發現箭塔 45 秒期限與攻城軍令 60% 節點衝突，改為該關總時限 70% 後 tactical orders＋stage rules 17/17；fresh canonical 471 passed／5 skipped／0 failed／0 flaky；`git diff --check` 與相關 JS `node --check` 通過。實際 Chromium 戰鬥畫面已於 1280×720、390×844、844×390 驗收，任務 cue、HP／進度與操作區均可見且無關鍵遮擋。production commit `2469b29`；下一項為 Task 4.3。

## 已完成提交

- `78f3f89` — feat: add battle milestone reports
- `4656a9e` — docs: clarify fair challenge and medal authority
- `7c73fa3` — feat: add gameplay systems state foundation
- `6c5fd29` — feat: add battle telemetry foundation
- `5fb36c8` — feat: telegraph dangerous enemy attacks
- `a7ecee1` — feat: improve enemy telegraph readability
- `ed9218b` — feat: add tactical order modifier foundation
- `49974a0` — feat: add defense tactical order selection
- `f8a0a65` — feat: add attack tactical order milestones
- `8ef4a32` — feat: add stage rule registry
- `2469b29` — feat: add six pilot stage objectives
