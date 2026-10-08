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
- [x] Phase 4：關卡專屬規則
  - [x] Task 4.1：stage-rule registry 與目標文字單一來源
  - [x] Task 4.2：六關 tracer-bullet 試點
  - [x] Task 4.3：擴至兩季×兩陣營×10 關
  - [x] Gate：資料完整性、archetype journeys、full suite
- [x] Phase 5：角色組合技
  - [x] Task 5.1：資料驅動組合偵測與 UI
  - [x] Task 5.2：組合、軍令與關卡規則堆疊順序
  - [x] Gate：全角色回歸與 desktop/mobile smoke
- [x] Phase 6：關卡挑戰、勳章與純外觀獎勵
  - [x] Task 6.1：profile migration、fair challenge evaluator、atomic/idempotent reward
  - [x] Task 6.2：選關與結算勳章 UI
  - [x] Task 6.3：勳章里程碑純外觀獎勵
  - [x] Gate：guest/cloud/conflict/profile migration suites
- [ ] Phase 7：全關卡擴充、平衡與正式發布
  - [x] Task 7.1：完整資料矩陣與靜態檢查
  - [x] Task 7.2：deterministic balance tests
  - [x] Task 7.3：完整 UI／無障礙驗收
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
- Task 4.2 驗證：Playwright RED 先因六關仍解析為 standard rule 而失敗；focused desktop＋mobile 20/20；related gameplay/waves/season2/save 38/38。獨立回歸發現箭塔 45 秒期限與攻城軍令 60% 節點衝突，改為該關總時限 70% 後 tactical orders＋stage rules 17/17；fresh canonical 471 passed／5 skipped／0 failed／0 flaky；`git diff --check` 與相關 JS `node --check` 通過。實際 Chromium 戰鬥畫面已於 1280×720、390×844、844×390 驗收，任務 cue、HP／進度與操作區均可見且無關鍵遮擋。另以 RED 補上箭塔剩餘秒數與運糧兵 HP／行程即時 cue，focused desktop＋mobile 20/20，follow-up `ebe9f86`。production commit `2469b29`；下一項為 Task 4.3。
- Task 4.3 與 Phase 4 Gate 已完成：兩季 × 兩陣營 × 10 關共 40 條 route 均有 JSON-safe `ruleId + params`，且每關只解析一個主規則；完整矩陣覆蓋 protect、escort、hazard-lane、destroy-target、survive-resource、capture-seals、fog-vision、formation-shift 八種 archetype。新增留糧守城、分路奪印、烽煙視界、輪轉破陣的 battle-time runtime、勝敗判定與即時 cue；第一季霧中加速亦接入既有移動流程，暫停／reload 不使用 wall clock。
- Task 4.3 驗證：Playwright RED 先確認 40 關矩陣與四個新 archetype 尚不存在，再確認每關 `ruleId + params` config API 缺失；focused `tests/stage-rules.spec.js` desktop＋mobile 24/24，related（操作提示、兩季完整戰役、主線、第二季存檔）37 passed／1 skipped。首輪 canonical 找出舊倒數測試與 L1 箭塔 70% 期限競態，改由無提前期限的 L2 驗證通用倒數，連跑 desktop／mobile 各三次 6/6；fresh canonical 475 passed／5 skipped／0 failed／0 flaky。`git diff --check`、`node --check js/stage-rules-data.js`、`node --check js/app.js` 均通過。
- Task 4.3 browser evidence：實際 Chromium 在 desktop 1280×720、portrait 390×844、landscape 844×390 的關卡卡片與戰鬥畫面均顯示同源規則目標／cue，無文字裁切、重疊或水平溢位，首關操作與後續鎖定狀態可達；下一項為 Task 5.1。
- Task 5.1 已完成：新增獨立 immutable `SYNERGIES` registry，精確提供規格要求的八組「桃園同心、臥龍鳳雛、虎衛並肩、破陣強弩、屍巫烈焰、巨屍攻城、棺盾鼠群、煙醫掩護」；依 season／玩家當前陣營與場上存活且不重複的 `type` 集合即時計算，不另存可漂移狀態。效果只套用組合成員並透過 `activeUnit` 接入真實 projectile／支援節奏／攻速流程；敵方 AI 不會取得未提示加成，任一成員退場或 HP 歸零後立即解除，原始單位資料不會被修改。同一成員同時取得傷害與速度組合時按相同比例縮放，總 throughput 上限 +15%，HUD 會明示此限制。戰鬥 HUD 顯示成員原因與精確加成，以 activation signature 避免每 tick 重建 `aria-live`。
- Task 5.1 驗證：follow-up gate 先攔截原版本僅 3 組、孔明／龐統 `supportRate` 無實效、烈焰屍車雙組乘法達約 +24.2% 及 mobile portrait／landscape 遮擋；focused `tests/synergies.spec.js` desktop＋mobile 18/18，涵蓋逐組精確 schema、全組生命週期、支援節奏、重疊 cap 與 HUD 說明、投射物實際命中 HP、敵方 AI 隔離、撤下即時取消、pause/save/reload、三尺寸幾何／toolbar overlap，以及 landscape native／fallback fullscreen 真實選卡部署；related（synergies、gameplay systems、tactical orders、stage rules、移除換列、第二季、存檔、操作提示）111 passed／1 skipped／0 failed／0 flaky，mobile deadline 無 retry 另連跑 10/10。fresh canonical 497 passed／5 skipped／0 failed。`git diff --check` 與相關 JS `node --check` 均通過。
- Task 5.1 browser evidence：實際 Chromium 在 desktop 1440×900 以安全 normal-flow 列顯示；portrait 390×844 使用工具列左側窄版多行卡；landscape 844×390 使用工具列第二行橫幅並保留全螢幕按鈕。三尺寸均完整顯示組合名稱、成員與精確效果，DOM overlap assertion 與實圖驗收皆確認未遮擋操作、資源、關卡目標、棋盤或卡牌；844×390 在 native 與 fallback fullscreen 均完成最後一列 hit-test、選卡及實際部署。下一項為 Task 5.2。
- Task 5.2 與 Phase 5 Gate 已完成：`resolveBattleUnit()` 固定以 base/equipment → character level → fixed talent → synergy → tactical order → temporary stage status → centralized clamp 計算並保留逐層 snapshot/source；`permanentUnitLayers()` 將裝備、角色等級與固定技能分層，但以原始 base 的 cumulative bonus 計算，維持舊 profile 最終數值相容。軍令的 damage/ranged/melee、HP、attack speed、move speed、shield、healing、damage taken、deployment/relocation cost、player/enemy income 與 enemy spawn interval 均接入真實 combat/resource/deploy/wave paths；玩家效果不套到敵方 AI，`PLANT_TYPES`／`ZOMBIE_TYPES` 保持 immutable。卡牌價格、實扣與 eligibility 同源，波次延遲與戰報秒數同源。
- Task 5.2 reviewer follow-up：production RED 重現 stage movement 在 clamp 後才乘倍率、`supply-raid` 將 AI affordability top-up 錯當收入而出現 `aiResource=-2`、default melee／peaZombie cadence 與 poleVault `spentSpeed` 繞過中央 resolver。修正後 `changeBattleResource()` 僅作純 ledger，真正收入 producer 才使用 `grantBattleIncome()`；兩季移動、召喚 HP、death blast、攻擊 cadence 均由 resolved runtime stats 驅動。選取 HP／shield 軍令會依新舊 resolved 值的相對倍率遷移既有己方 entity，保留受傷比例與 `escort-ram` 620 HP 等關卡自訂上限；無關軍令不再覆寫特殊 entity 狀態。
- Task 5.2 驗證：原中央 pipeline 先以缺少 layer/consumer API 取得 RED，再以真實關羽 Lv.3＋青龍戰袍＋青龍火斬、桃園同心＋屯田／背水一戰、實際投射物、部署、週期補給／向日葵、承傷與 stage movement 覆蓋單層值、組合值、敵我隔離與資料 immutability；deterministic desktop＋mobile repeat 無 retry 30/30、targeted reviewer fixes 44/44、原 Phase 5 related 216 passed／4 skipped、原 canonical 503 passed／5 skipped。follow-up 新增 production movement、affordability、melee/ranged cadence、spent movement、entity transition、summon/death blast regression；獨立 review 再以真瀏覽器重現特殊衝車被 620/310 重設為 480/240，新增 RED 後修正，focused desktop＋mobile 2/2、完整 modifier 18/18、related 40/40。實際 Chromium 1280×633 驗收軍令 dialog 的三張卡、ARIA、焦點、文字與 viewport，console 0 error；`git diff --check`、相關 JS `node --check` 與 added-lines security scan 均通過。下一項為 Phase 6.1。
- Task 6.1 已完成：40 條主線 route 各有三個 deterministic challenge；正式 `start(...,{challengeIds})` seam 啟用 fair mode，永久裝備／等級／固定技能／部署冷卻與英雄機率技能不會進入公平戰局。`protect-unit` 綁定首次指定實體 ID，不能死亡後以同型替補規避；攻城 route 不配置不適用的 gate-health。guest 只在真實勝場 exactly-once 保存勳章；cloud 將 canonical telemetry、SHA-256、角色 key 與 route challenge IDs 送入單一 atomic RPC，由 PostgreSQL 重算摘要及 objective，與 level reward 同 transaction 發放，並拒絕敗場、route 外 ID、摘要／內容突變、跨角色 replay、anon 及 profile entitlement 注入。首次 migration 清除既有未受信任 challenge 欄位，後續 profile INSERT／save 仍維持 server authority；舊 battle snapshot deterministic 補入 inactive challenge state。
- Task 6.1 驗證：RED 覆蓋 production start seam、fair cooldown／proc、指定實體 replacement、40-route JS／SQL contract、canonical digest mismatch、ledger mutation、atomic rollback、idempotent replay、initial/save profile anti-forgery 與真實 legacy normalization。focused desktop＋mobile 19 passed／1 skipped，related 146 passed／4 skipped，fresh canonical 534 passed／6 skipped／0 failed；三路原始 review 與修正後窄 review 均已完成，最終 verdict PASS。`git diff --check`、相關 JS `node --check` 與新增行 credential scan 全數通過；下一項為 Task 6.2 選關與結算勳章 UI。
- Task 7.1 已完成：新增 immutable 40-route gameplay matrix，將兩季 × 守城／攻城 × 10 關的主規則、三項挑戰、軍令池與敵軍危險預告需求整合成單一 production resolver；軍令三選一實際從 route pool 取樣，正式勝敗結算共用可測的繁中結果文案。秦皇第 11 關維持獨立 `qin-finale` 並明確排除於矩陣。靜態契約逐 route 檢查玩家可見名稱、條件、軍令、預告與勝敗結果皆含繁中文字且不出現 `undefined`／`NaN`；README、首頁消息及角色頁 fallback 已同步兩季守城／攻城各十關皆可玩。RED 分別確認 matrix API、對外文案、runtime 軍令接線與結果 copy 缺失；focused matrix＋軍令 22/22、stage rules 28/28、challenges 54/54、第二季入口／圖鑑 10/10，fresh canonical 578 passed／6 skipped／0 failed。獨立 reviewer verdict PASS，`git diff --check`、相關 JS `node --check` 與新增行 credential scan 均通過；下一項為 Task 7.2 deterministic balance tests。
- Task 7.2 已完成：以 production `createTacticalOrderOffer()`、角色 resolver、modifier consumers 與 route schema 建立兩季 × 雙陣營 × 十關、每 route 128 fixed seeds 的 5,120-sample deterministic simulation，比較無軍令、普通選擇與依當局策略優先目標挑選的最佳選擇。九張軍令皆至少成為最佳一次，overall pick rate <25%、conditional pick rate ≤65%、平均 utility spread <0.12；route pool 依正式 roster capability 排除 dead cards，關卡需求由 immutable stage-rule metadata 區分玩家解鎖與 encounter-provided 單位。八組組合均透過真實 battle entities、`combinationIsActive()` 與 `applyCombinationUnitModifier()` 驗證 10–15% throughput 及 15% overlap cap。reviewer follow-up 以 production action 重現醫官 55→63 後又被重複放大至 72，RED 後改為直接消費 resolved `d.heal`，實際治療與 resolver 均為 63。最新 related desktop／mobile 176/176，fresh canonical 590 passed／6 skipped／0 failed，兩輪最終獨立 reviewer verdict PASS；`git diff --check`、相關 JS `node --check` 與 added-lines credential scan 均通過。下一項為 Task 7.3 完整 UI／無障礙驗收。
- Task 7.3 已完成：集中 battle overlay lifecycle cleanup，replay、切回選關與回主選單會同步清除 feedback timers/classes、enemy telegraph DOM／banner／layout、軍令 dialog／background `inert`、transient FX，並取消尚未執行且會重新建立 DOM 的 battle FX timers；暫停 snapshot 的 gameplay telegraph state 保留，resume 時仍由正式 render path 重建。新增 regression 同時驗證三條 navigation path 的 immediate snapshot 與 250ms delayed snapshot，修正前曾重現 4 個 delayed transient nodes 復活，修正後 desktop／mobile 2/2、完整 related matrix 182/182。desktop 1280×900、portrait 390×844、landscape 844×390 最新 workspace 實畫均無水平溢位、runtime error 或 blocking clipping；5 組 tablet viewport、兩陣營及 native／fallback fullscreen 均通過。fresh canonical 592 passed／6 skipped／0 failed，最終獨立 reviewer verdict PASS；`git diff --check`、相關 JS syntax 與 added-lines credential scan 均通過。下一項為 Task 7.4 發布與 production smoke。

## 已完成提交

- `e552659` — `feat: add data-driven battle combinations`
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
- `ebe9f86` — fix: expose live stage objective status
- `c908ba7` — feat: expand stage rules across campaigns
