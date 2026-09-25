# 平板全螢幕第五路遮擋修正

## 範圍與驗收
- 防守方沿用左側七欄空格綠框＋✓，不改成本、部署規則、戰役或存檔。
- 守城／攻城共用全螢幕配置，原生與 CSS 降級全螢幕皆適用。
- 改用工具列、棋盤區、卡牌列三段正常排版；卡牌不再 fixed 覆蓋棋盤，不預留硬編碼的卡牌高度。使用可見 viewport 高度、安全邊界；旋轉／縮放／退出更新。
- 五路全部可點、第五路底緣不得被卡牌蓋住；平板橫直向、卡牌增高時皆成立。保留守軍移除／换列按鈕。
- 常見 Chromium 平板尺寸原版已通過，不能宣稱重現使用者的特定裝置；額外以增高卡牌模擬裝置排版差異，驗证固定預留空間的缺陷。

## 實作順序
1. 平板尺寸／兩陣營／原生及降級模式測試，旋轉、第五路實際落子及卡牌增高測試。
2. 獨立 fullscreen-layout CSS/JS，後載蓋過舊固定高度規則；不移動 DOM 或更動戰鬥資料。
3. 定向執行 battle-guidance、tablet-fullscreen、wave-story-layout，目視平板畫面。盡可能加測 WebKit；實體平板未驗證須明說。
4. 僅提交本次檔案，保留既有 SQL；推送後 HTTP 版本比對及正式站 UI 測試。

## 驗證紀錄
- 變更前一般 Chromium 平板尺寸 20 案例通過；增加卡牌列高度至 180px 的防守降級全螢幕案例失敗，第五路被遮擋。這是排版壓力重現，不是對使用者實體裝置的診斷。
- 修改後 `npm test -- --config=playwright.tablet.config.js --workers=1 --reporter=dot`：40 passed（Chromium/WebKit、五種尺寸、雙陣營、原生嘗試與降級路徑、旋轉、第五路落子）。
- `npm test -- tests/battle-guidance.spec.js tests/wave-story-layout.spec.js --workers=1 --reporter=dot`：31 passed、1 skipped，非全套測試。
- Chromium 原生全螢幕不能透過 Browser.setWindowBounds 調整視窗，旋轉測試使用 CDP device metrics；WebKit／降級版面使用 viewport resize。
- WebKit 自動化不等同實體 iPad Safari；若特定裝置仍有異常，需對方型號／瀏覽器與截圖確認。

## 回退
revert 本次前端提交即可；不變動 DB 或玩家存檔。
