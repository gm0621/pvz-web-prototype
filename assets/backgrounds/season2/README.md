# 第二季選關場景圖

- `s2-01.webp`：第一關「霜土前哨」，守城／進攻共用。Gimmy 提供。
- 原始 JPEG 完整保留於 `source-originals/s2-01.jpeg`，SHA256：`1cfef396f9d0c2cae231a4bcdc2746ff4814dbd9cfa55745d76ee3220b83c856`。
- 顯示圖維持 1672×941；不翻轉、不裁切、不放大、不去背。Pillow：`ImageOps.exif_transpose(Image.open(source)).convert('RGB').save(dest, 'WEBP', quality=90, method=6)`。
- 關卡資料引用 `js/season2-plan-data.js` 的 `cardArt`；其餘未提供的關卡保持 null。
- 僅選關預覽用途，不直接替換第一季背景或第二季戰鬥棋盤。
