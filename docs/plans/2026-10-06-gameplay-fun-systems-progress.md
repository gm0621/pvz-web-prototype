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
- [ ] Phase 2：敵人預警與反制
  - [x] Task 2.1：資料驅動、可序列化預警模型
  - [ ] Task 2.2：預警視覺與無障礙語意
  - [ ] Gate：預警→反制／命中→cleanup 全鏈測試
- [ ] Phase 3：大波次後三選一軍令
  - [ ] Task 3.1：9 張軍令與 modifier API
  - [ ] Task 3.2：守城軍令三選一 UI
  - [ ] Task 3.3：攻城里程碑軍令
  - [ ] Gate：兩季攻守、save/reload、mobile/fullscreen/cloud suites
- [ ] Phase 4：關卡專屬規則
  - [ ] Task 4.1：stage-rule registry 與目標文字單一來源
  - [ ] Task 4.2：六關 tracer-bullet 試點
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

## 已完成提交

- `78f3f89` — feat: add battle milestone reports
- `4656a9e` — docs: clarify fair challenge and medal authority
- `7c73fa3` — feat: add gameplay systems state foundation
- `6c5fd29` — feat: add battle telemetry foundation
- `5fb36c8` — feat: telegraph dangerous enemy attacks
