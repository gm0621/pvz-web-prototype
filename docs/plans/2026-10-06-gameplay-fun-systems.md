# 戰鬥樂趣六系統 Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 在不依賴新增角色與永久數值膨脹的前提下，為兩季、攻守雙路線加入戰報、敵人預警、三選一軍令、關卡規則、角色組合與挑戰勳章六套可重玩系統。

**Architecture:** 以 `state` 中可序列化的 battle-local 子狀態承載戰鬥統計、預警、軍令、規則和組合效果，沿用現有 `persistBattleState()` / `restoreBattleIfAvailable()` 暫停復原。所有新規則使用資料表驅動，不直接修改 `PLANT_TYPES` / `ZOMBIE_TYPES` 常數；永久勳章與外觀只在雲端戰果確認後寫入 normalized profile，不能提高角色基礎戰力。

**Tech Stack:** 靜態 HTML/CSS/JavaScript、Playwright、localStorage profile/battle snapshot、既有 Supabase 雲端 JSON profile。

---

## 發布原則

- 每階段各自提交、完整測試、正式站 browser smoke，能獨立回滾。
- 每個功能先寫 Playwright RED，確認因缺少行為而失敗，再做最小 GREEN。
- 新狀態必須是 JSON 可序列化；不把 timer、DOM、函式存進 `state`。
- 暫停、切背景、返回選關、重新整理後不得偷推進倒數或重新抽牌。
- 不改動雲端通關權威：登入玩家仍須 `claimCloudMatchReward()` 成功後才能獲得永久勳章／外觀。
- 軍令與組合加成只在單局有效；不新增永久攻擊力農等級。
- 桌機、390×844 手機、844×390 橫向及原生／fallback fullscreen 都需可操作。

## 階段總覽

| 階段 | 玩家價值 | 首次範圍 | 完成門檻 |
|---|---|---|---|
| 0 | 建立安全底座 | 共用事件、統計、狀態 migration | 無 UI 回歸，舊存檔可恢復 |
| 1 | 戰鬥更有回饋 | 波次戰報、傷害／承傷／控制／糧草摘要 | 兩季攻守皆可產生正確摘要 |
| 2 | 危險可讀、可反制 | 攻城車、屍巫、狂笑／重槌、秦皇指令預警 | 警示先出現、暫停凍結、命中後清除 |
| 3 | 每局都有選擇 | 9 張軍令、每次 3 選 1；先守城後攻城里程碑 | 不可重抽、可保存、無必選牌 |
| 4 | 每關有記憶點 | 每季攻守前三關試點，再擴至全 40 路線關卡 | 每關恰好一個主規則，目標與實戰一致 |
| 5 | 陣容有搭配但不綁死 | 蜀、魏、第一／二季殭屍各 2 組組合 | 單組收益約 10–15%，UI 說明且不疊乘失控 |
| 6 | 有重玩目標 | 每關 3 挑戰、勳章、純外觀獎勵 | 結算可信、雲端確認後才永久寫入 |
| 7 | 正式擴充與平衡 | 全關卡、無障礙、音效／震動設定、數值調整 | canonical 0 failed / 0 flaky + 正式站實戰 smoke |

---

## Phase 0：共用戰鬥事件與可序列化統計底座

### Task 0.1：定義 battle-local 狀態與舊存檔 migration

**Objective:** 新舊戰局都取得穩定的 `state.gameplay` 結構，舊 snapshot 不失效。

**Files:**
- Create: `js/gameplay-systems.js`
- Modify: `index.html`
- Modify: `js/app.js` (`start()`, `restoreBattleIfAvailable()`)
- Test: `tests/gameplay-systems.spec.js`

**Steps:**
1. RED：新戰局具備 versioned `state.gameplay`；刪除此欄的舊 battle snapshot 仍可恢復且自動補預設值。
2. Run: `npx playwright test tests/gameplay-systems.spec.js --grep "state migration" --workers=1 --retries=0`，預期 FAIL。
3. GREEN：新增 `createGameplayState()`、`normalizeGameplayState(raw)`；僅含 JSON-safe data。
4. Run focused test，預期 PASS。
5. Commit: `feat: add gameplay systems state foundation`。

### Task 0.2：建立不耦合 DOM 的戰鬥事件與統計 API

**Objective:** 記錄傷害、承傷、擊殺、控制、資源與波次，不改變既有傷害結果。

**Files:**
- Modify: `js/gameplay-systems.js`
- Modify: `js/app.js`（集中傷害／資源／cleanup 接點）
- Modify: `js/season2-game.js`（第二季傷害入口）
- Test: `tests/gameplay-systems.spec.js`

**Steps:**
1. RED：相同 deterministic battle 前後 HP 完全相同，但 telemetry 累計值正確；召喚物與投射物 attribution 不重複。
2. Verify RED。
3. GREEN：實作 `recordBattleEvent(type,payload)`、`battleStatsSnapshot()`；只觀測、不改數值。
4. 加入 pause/save/reload continuity RED→GREEN。
5. Run related combat tests and commit: `feat: track battle events without changing combat`。

**Phase 0 Gate:**
- `gameplay-systems.spec.js` 全過。
- `critical-projectiles`, `season2-game`, `defense-waves`, `season2-save` 全過。
- `npm run test` 0 failed / 0 flaky。

---

## Phase 1：戰鬥爽感與波次戰報（改善 6）

### Task 1.1：每波結束顯示非阻塞戰報

**Objective:** 補陣空檔顯示本波輸出、承傷、擊殺、控制與資源變化，不遮住棋盤操作。

**Files:**
- Modify: `index.html`（`#waveReport`）
- Modify: `js/gameplay-systems.js`
- Modify: `js/defense-waves.js`（波次完成 hook）
- Modify: `js/app.js`（攻城里程碑 hook）
- Create: `css/gameplay-systems.css`
- Test: `tests/gameplay-feedback.spec.js`

**Acceptance:**
- 守城：`wave.sent >= wave.count` 時只結算一次。
- 攻城：以 30%、60%、90% 時間／防線突破里程碑產生摘要，不仿造守城波次。
- 玩家可關閉；6 秒自動收合；暫停時計時凍結。
- 顯示「最高輸出／最高承傷／控制貢獻／本波資源淨變化」，資料不足不顯示假冠軍。

### Task 1.2：命中回饋與設定

**Objective:** 增加爆擊停頓、破盾震動、三路箭微時差及可關閉的強特效，不改傷害時序。

**Files:**
- Modify: `js/app.js`
- Modify: `js/season2-game.js`
- Modify: `css/app.css`
- Modify: `js/gameplay-systems.js`
- Test: `tests/gameplay-feedback.spec.js`

**Acceptance:**
- `prefers-reduced-motion` 或「精簡特效」時停用震動／停頓，投射物與傷害仍正常。
- 命中 frame 與既有 combat assertions 不變。
- 手機不因 FX 造成水平 overflow。

**Phase 1 Gate:** browser screenshots（桌機／手機／短橫向）+ full suite。

---

## Phase 2：敵人預警與反制（改善 3）

### Task 2.1：資料驅動預警模型

**Objective:** 危險技能先建立 serializable telegraph，再於到期時命中。

**Files:**
- Modify: `js/gameplay-systems.js`
- Modify: `js/app.js`
- Modify: `js/season2-game.js`
- Test: `tests/enemy-telegraphs.spec.js`

**Initial telegraphs:**
- 烈焰屍車：九宮格落點，1.2 秒。
- 冥火屍巫：三路禁咒，1.0 秒。
- 鈴鐺丑屍／屍旗大胖：同行／九宮格，0.8 秒。
- 秦皇「天下一統」：目標列，1.4 秒。
- 第二季斷盾、拖行、衝撞：0.7–1.0 秒。

**Acceptance:**
- 警示格出現後才可造成傷害。
- 換列、移除、擊殺施法者等既有操作能依技能設計反制；測試明確列出哪些可取消、哪些只可閃避。
- 暫停／背景／reload 保留剩餘 battle-time，不用 `Date.now()` 偷跑。

### Task 2.2：預警視覺與無障礙語意

**Files:**
- Modify: `index.html`
- Modify: `css/gameplay-systems.css`
- Modify: `js/gameplay-systems.js`
- Test: `tests/enemy-telegraphs.spec.js`

**Acceptance:**
- 紅色不是唯一辨識方式；加入圖樣、圖示與文字 countdown。
- 預警層不攔截格子點擊／拖放。
- 390×844 與 fullscreen 可看見完整落點。

**Phase 2 Gate:** 所有列出的技能都有「預警→反制／未反制→命中→cleanup」測試。

---

## Phase 3：大波次後三選一軍令（改善 1）

### Task 3.1：定義 9 張第一版軍令與 modifier API

**Objective:** 用 battle-local modifier 影響資源、攻速、護盾、敵軍節奏等，不改 unit base data。

**Files:**
- Create: `js/tactical-orders-data.js`
- Modify: `js/gameplay-systems.js`
- Test: `tests/tactical-orders.spec.js`

**First 9 orders:**
- 屯田急令、火箭齊射、固守中軍、背水一戰、援軍令、空城計、急行換防、醫護營、斷糧奇襲。

**Balance constraints:**
- 每張都有清楚收益與代價，不能存在任何陣容都必選的純正收益牌。
- modifier 只透過 `effectiveBattleModifier()` 讀取，不直接覆寫角色定義。

### Task 3.2：守城軍令選擇 UI

**Objective:** 每個大波完成後抽 3 張，戰鬥暫停到選擇完成。

**Files:**
- Modify: `index.html`
- Modify: `css/gameplay-systems.css`
- Modify: `js/defense-waves.js`
- Modify: `js/gameplay-systems.js`
- Test: `tests/tactical-orders.spec.js`

**Acceptance:**
- offer 產生後立即 persist；reload 不能重抽。
- 選擇只能成功一次；重複點擊不疊加。
- UI 顯示收益、代價、剩餘作用時間／本局永久。
- story modal、pause overlay、軍令 modal 不可同時搶 focus。

### Task 3.3：攻城路線里程碑軍令

**Objective:** 攻城不用假波次，以擊破守軍／剩餘時間里程碑觸發同一套選擇。

**Files:**
- Modify: `js/gameplay-systems.js`
- Modify: `js/app.js`
- Modify: `js/season2-game.js`
- Test: `tests/tactical-orders.spec.js`

**Acceptance:**
- 每場最多 2 次；不得靠拖時間重複觸發。
- 進攻失敗／重玩時清空本局軍令。

**Phase 3 Gate:** 兩季攻守、save/reload、手機、fullscreen、雲端戰果相關 suite 全過。

---

## Phase 4：關卡專屬規則（改善 2）

### Task 4.1：建立 stage-rule registry 與目標文字單一來源

**Objective:** 關卡卡片、戰鬥 HUD、判定與圖鑑說明讀同一份規則資料。

**Files:**
- Create: `js/stage-rules-data.js`
- Modify: `js/gameplay-systems.js`
- Modify: `js/app.js`
- Modify: `js/season2-game.js`
- Test: `tests/stage-rules.spec.js`

**Rule contract:** `{id,title,brief,objective,start,tick,onEvent,isComplete,isFailed}`；runtime state 另存 `state.gameplay.stageRule`。

### Task 4.2：六關 tracer-bullet 試點

**Objective:** 先證明規則類型，而不是一次寫 40 個關卡。

**Pilot:**
- 第一季守城 1：保住五路推車（教學型）。
- 第一季守城 2：護送／保護運糧兵。
- 第一季守城 3：指定路線週期封鎖。
- 第一季攻城 1：限時破壞箭塔。
- 第二季守城 1：霜土減速區輪替。
- 第二季攻城 1：掩護撞門單位抵達。

**Acceptance:** 每條規則可贏、可輸、可暫停還原，目標 UI 與實際判定一致。

### Task 4.3：擴至全 40 個 season/faction/level 組合

**Objective:** 每個路線關卡恰好一個主規則；重用約 8 個規則 archetype，避免 40 套硬編碼。

**Archetypes:** escort、protect、hazard-lane、destroy-target、survive-resource、capture-seals、fog/vision、formation-shift。

**Acceptance:** data completeness test 列舉兩季 × 兩陣營 × 10 關，缺任何一關即 FAIL。

**Phase 4 Gate:** 關卡資料完整性 + 每 archetype deterministic journey + full suite。

---

## Phase 5：角色組合技（改善 4）

### Task 5.1：資料驅動組合偵測與 UI

**Objective:** 活著且已部署的指定組合啟動小幅效果，離場立即取消。

**Files:**
- Create: `js/synergies-data.js`
- Modify: `js/gameplay-systems.js`
- Modify: `index.html`
- Modify: `css/gameplay-systems.css`
- Test: `tests/synergies.spec.js`

**Initial set:**
- 蜀：桃園同心、臥龍鳳雛。
- 魏：虎衛並肩、破陣強弩。
- 第一季殭屍：屍巫烈焰、巨屍攻城。
- 第二季殭屍：棺盾鼠群、煙醫掩護。

**Acceptance:**
- 每組收益約 10–15%，不可乘法疊成爆發漏洞。
- 組合是加分，不是通關必要條件。
- HUD 顯示啟動原因與精確效果；角色死亡／撤下／換陣營立即更新。

### Task 5.2：組合與軍令、關卡規則的堆疊順序

**Objective:** 固定計算順序並測試上限。

**Order:** base/equipment → character level → fixed talent → synergy → tactical order → temporary stage status；最後集中 clamp。

**Acceptance:** 測試每一層的單獨值與組合值，禁止隱性修改 `PLANT_TYPES` / `ZOMBIE_TYPES`。

**Phase 5 Gate:** 全角色戰鬥與圖鑑 suite 無回歸；新增組合提示的桌機／手機 browser smoke。

---

## Phase 6：關卡挑戰、勳章與純外觀獎勵（改善 5）

### Task 6.1：profile migration 與 challenge evaluator

**Objective:** 每個關卡 3 個挑戰，保存最佳達成，不影響解鎖主線。

**Files:**
- Modify: `js/app.js` (`defaultProfile()`, `normalizeProfile()`, result flow)
- Create: `js/challenges-data.js`
- Modify: `js/gameplay-systems.js`
- Test: `tests/challenges.spec.js`

**Challenge templates:** no-hero、gate-health、resource-cap、no-relocation、melee-only、time-limit、protect-unit、no-enemy-leak。

**Acceptance:**
- evaluator 使用 telemetry/event data，不從 DOM 猜結果。
- 勝利且（訪客或雲端已確認）才記錄；失敗、同步失敗、replay result 不發永久獎勵。
- 舊 profile normalize 後有空 challenge 結構，不遺失 inventory/progress。

### Task 6.2：選關與結算顯示勳章

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `js/season2-game.js`
- Modify: `css/gameplay-systems.css`
- Test: `tests/challenges.spec.js`

**Acceptance:**
- 關卡卡顯示 0–3 枚與挑戰條件。
- 結算逐項顯示達成／未達成原因。
- 不阻擋「下一關」與故事流程。

### Task 6.3：里程碑純外觀獎勵

**Objective:** 以累積勳章解鎖卡框、旗幟、FX 色與稱號，不增加戰力。

**Files:**
- Modify: `js/shop.js`
- Modify: `js/app.js`
- Modify: `css/app.css`
- Test: `tests/challenges.spec.js`

**Acceptance:**
- 里程碑建議：15、30、60、90 勳章。
- reward idempotent；import/export/cloud profile 保留。
- 外觀關閉後不殘留戰鬥 class 或 DOM。

**Phase 6 Gate:** profile migration、訪客、登入同步成功／失敗、跨裝置 conflict suite 全過。

---

## Phase 7：全關卡擴充、平衡與正式發布

### Task 7.1：完整資料矩陣與靜態檢查

- 兩季 × 兩陣營 × 10 關都有：1 主規則、3 挑戰、軍令 pool、危險預告需求。
- 秦皇 level 11 獨立規則，不被十關矩陣誤算。
- 所有玩家可見名稱、條件、結果皆為繁中且無 `undefined/NaN`。

### Task 7.2：平衡測試

- 無軍令／普通選擇／最佳選擇三組 deterministic simulations。
- 單張軍令 pick-rate proxy 與收益差距；純正收益或必選牌必須改成有代價。
- 組合技開關差距保持約 10–15%。
- 關卡規則不得要求尚未解鎖角色。

### Task 7.3：完整 UI 與無障礙驗收

- Desktop、390×844、844×390、5 個 tablet viewport。
- Native fullscreen + fallback fullscreen。
- 鍵盤 focus、Escape、reduced motion、色盲非顏色提示。
- 所有 overlay timer/DOM 在關閉、切關、重玩、回主選單時 cleanup。

### Task 7.4：正式發布

1. `git diff --check`、`node --check`。
2. Related suites per system。
3. `npm run test`，要求 0 failed / 0 flaky。
4. Commit/push。
5. 等待 GitHub Pages marker。
6. Cache-busted 正式站 browser journey：兩季攻守各至少一場，觸發規則、預警、軍令、組合、戰報與挑戰結算。
7. 手機 screenshot 驗收後才宣稱完成。

---

## 明確延後／不做

- 不新增第三種永久戰力貨幣。
- 不做抽卡、每日體力、廣告或付費軍令。
- 不讓勳章直接增加 HP／攻擊。
- 不在第一個階段一次改完 40 關；先 tracer bullet，再資料化擴充。
- 不把攻城硬套成守城波次；使用攻城里程碑。
- 不以大量 `setTimeout` 作為 gameplay authority；全部使用 `state.time`。
- 不先增加新角色；六系統穩定後再評估第三季。

## 每階段交付報告格式

- 實作內容與未做內容。
- RED 證據、focused GREEN、related suite、canonical suite。
- Desktop/mobile/browser 畫面驗收。
- 存檔 migration 與雲端權威邊界。
- Commit SHA、正式站 URL、rollback commit。
