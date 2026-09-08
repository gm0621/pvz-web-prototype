# 第二季選關場景圖

- `s2-01.webp`～`s2-10.webp`：Gimmy 提供的十關選關圖片，守城／進攻共用。
- 順序：01 霜土前哨、02 石壘營門、03 拒馬長道、04 風沙糧倉、05 乾谷斷橋、06 鐵爐兵坊、07 烽臺夜哨、08 霜骨古道、09 魏武中軍、10 北境鐵壁。
- 原始 JPEG 逐張完整保留於 `source-originals/s2-NN.jpeg`；第 2～10 關依使用者附件順序匯入。
- 原始 JPEG 完整保留於 `source-originals/s2-01.jpeg`，SHA256：`1cfef396f9d0c2cae231a4bcdc2746ff4814dbd9cfa55745d76ee3220b83c856`。
- 顯示圖維持原尺寸：第 5 關 1672×940，其餘 1672×941；不翻轉、不裁切、不放大、不去背。Pillow：`ImageOps.exif_transpose(Image.open(source)).convert('RGB').save(dest, 'WEBP', quality=90, method=6)`。
- 關卡資料引用 `js/season2-plan-data.js` 的 `cardArt`；十關圖片已齊全，圖片載入失敗時仍保留佔位回退。
- 僅選關預覽用途，不直接替換第一季背景或第二季戰鬥棋盤。
