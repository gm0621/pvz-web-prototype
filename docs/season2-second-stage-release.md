# 第二季第二關與前兩關劇情交付

## 範圍
- 第二关石壘營門：守城 18 名有限敵軍後登場裂盾斧屍頭目；棺盾不連續派遣。進攻守方逐步補大盾，上限兩名，防守總增援上限八名。
- 必須同模式通過第一關才開放第二關；通過第二關取得長戟兵／裂盾斧屍，可回前兩關使用。第三～十關維持預覽。
- 第一、二關各有攻守開場、勝利、失敗，共十二幕；來源 `docs/plans/season2-stage2-and-story-draft.md`，生成 `js/season2-story-data.js`。劇情閱讀紀錄按季別隔離，舊第一關玩家可直接回看。
- 長戟兵近距離普通攻擊已可使用；攔截只接受真正快速移動事件，前兩關沒有此種敵人，不把普通步行偽裝成突進。未實裝未來角色。
- 裂盾斧屍對護盾的固定及機率能力與無盾普通傷害分開；削弱標記維持八秒，涵蓋大盾脫戰四秒後的重新架盾，不改第一關原列盾規則。

## 驗證方法及已完成本地結果
- `npm run test`：桌面／手機完整 Playwright suite（最終結果以執行紀錄為準）。舊導覽測試已明確操作新增的劇情跳過按鈕；圖鑑斷言更新第二關獎勵，而不是刪掉斷言。
- `tests/season2-database.spec.js` 使用 PGlite 執行真實 PostgreSQL 語法；第二關鎖定、兩模式獎勵、新角色不得提前領獎、重複領獎、一般存檔不得偽造進度、migration 重跑與第一季隔離。
- `scripts/probe-season2-balance.cjs` 使用真實 tick、費用、冷卻及正常血量，只有排程加速和既有第一關通關前置；第二關攻守各三個種子全勝。第一關守城三勝、进攻兩勝一敗，不代表每種固定策略必勝。
- `scripts/verify-season2-stage2-ui.cjs`：桌面、iPhone 直／橫向，兩陣營正常點選／部署／暫停刷新、結算優先、劇情回看。結果注入是 UI fixture，不是自然過關證明。
- `scripts/verify-season2-hosted.cjs`：獨立測試帳號、真實 Auth/RPC、裝置鎖、時間門檻、非法角色、重複獎勵及 forged save；瀏覽器登入後第二關開戰及暫停刷新。RPC fixture 不代表伺服器驗證逐幀戰鬥。測試帳號於 finally 清除。

## 部署順序與回滾
1. 私有備份已保存至本機 `~/ServerBackups/pvz-season2/`，不加入 Git；不動現有未提交的 `supabase/sgz_profiles.sql`。
2. `npx supabase db push --dry-run` 必須只列 `202609090002_season2_second_stage.sql`；再 `npx supabase db push --yes`。此 migration 保留既有進度、經濟、角色經驗，僅增加資料與相容 RPC。
3. 本機新前端連真實雲端執行 hosted probe，確認無誤才推送 main 部署 GitHub Pages。
4. 核對正式站 JS/HTML 雜湊，正式站執行 UI、hosted probe；不只檢查原始碼或首頁 HTTP 200。
5. 如前端需回滾，revert 本次前端提交再部署；保留向後相容的新增 DB 結構／角色／第二關進度。不要將私有舊備份覆寫整個生產資料庫，避免破壞新進度和測試以外玩家的更新。若 RPC 需還原，只從備份恢復相關函式並保留目前玩家資料，重新驗證第一關登入／開戰／領獎。
