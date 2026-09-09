# 第二季第一關發布

## 範圍
- 守城與進攻均可從第一關開始；各模式初始二角色，通關後解鎖第三角色。
- 第二～十關僅預覽；第一季與第二季進度分離，未完成戰局重新整理後暫停還原。
- 本次不增加其他關卡或更換已接受的角色／選關美術。

## 發布順序
1. `npm run test`；檢查桌面／手機第一關入口、出戰與續玩。
2. 透過已連結 Supabase CLI 保存 `supabase/backup-season2-first-stage.sql` 結果到 repo 外的私有備份目錄。
3. `npx supabase migration list`、`npx supabase db push --dry-run`：只允許新增 `202609090001`。
4. `npx supabase db push --yes`，執行 `supabase/verify-season2-first-stage.sql`，核对玩家第一季／經濟欄位保留。
5. 使用可清除的驗證帳號測試正式 RPC：兩模式第一關、第二關拒絕、權威獎勵與進度、偽造存檔拒絕。驗證後刪除帳號並確認無殘留。
6. 只提交本次檔案；`supabase/sgz_profiles.sql` 既有控制字元變更不納入。
7. 推送 main，等 Pages 對應 SHA 完成；核對遠端 JS/CSS 位元組與桌面／手機實際 DOM、圖片和頁面錯誤。

## 回滾
前端恢復前一個已驗證版本（本次基準 `4281882`）；執行 `supabase/rollback-season2-first-stage.sql` 停用第二季新戰局，保留第一季 RPC 相容性與已取得資料。不可在有第二季戰局時恢復忽略季別的舊領獎函式。

## 證據邊界
合法出兵加速實戰探測是 ad-hoc，不是人工通關。種子 7、42、99 的守城皆成功；進攻成功兩組、一組超時，未保證任何配置皆可通關。正式 RPC 驗證帳號與一般玩家分開；本機 SQL 測試不等同 hosted RPC。
