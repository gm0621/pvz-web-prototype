# 第十六章「託孤與南征」

第 89～94 關接續第十五章在永安收兵後的史實，時間從 223 年到 225 年。新章沿用蜀軍三路與既有武將成長和兵器存檔。兵卡是遊戲玩法，史實角色由劇情、行軍圖和營地交代。

| 關卡 | 史實順序與地圖 | 過關任務 |
| --- | --- | --- |
| 89 白帝託孤 | 成都 → 永安。劉備囑託諸葛亮、李嚴輔佐劉禪，李嚴守永安，劉備四月去世。 | 依上、下、中路預警擋住三波，再清完餘兵。 |
| 90 劉禪即位 | 成都。五月即位，改元建興。 | 接回三隊傳令使者。 |
| 91 使吳修好 | 成都 → 武昌（今湖北鄂州一帶）。鄧芝出使，與吳王孫權恢復往來。 | 接應三隊使者，可手動切換路線。 |
| 92 務農息民 | 成都。224 年蜀漢勸農，讓百姓休息。 | 三路分別整備田間道路、水渠與糧倉。每處累積 8 戰鬥秒，暫停時保留進度。 |
| 93 南征越巂 | 成都 → 越巂。諸葛亮率主軍從越巂進入，擊敗高定，李恢與馬忠另率隊伍。 | 各路有人且敵人未逼近才計接應時間。 |
| 94 南中收兵 | 越巂 → 滇池一帶，表示主軍大致方位。平定四郡，十二月諸葛亮回到成都。 | 逐批護送糧車經越巂營地、山路驛站、滇池營地。護衛離開時停車，回到原路後繼續；三批送達並清完餘兵。 |

第 91 關是外交會談，孫權頭像標示吳王，戰場的游兵為改編。第 94 關另述李恢在古書稱為「昆明」的地方受圍，與主軍滇池標記分開。《三國志・諸葛亮傳》正文記南征與平定，裴松之注引《漢晉春秋》另載七擒孟獲。《資治通鑑》也收錄這個說法。孟獲出現在人物欄與圖鑑，地圖未假定某場擒放的確切位置。

- 託孤與即位 [《先主傳》](https://zh.wikisource.org/wiki/三國志/卷32) · [《諸葛亮傳》](https://zh.wikisource.org/wiki/三國志/卷35) · [《李嚴傳》](https://zh.wikisource.org/wiki/三國志/卷40) · [《後主傳》](https://zh.wikisource.org/wiki/三國志/卷33)
- 蜀吳修好與南征 [《鄧芝傳》](https://zh.wikisource.org/wiki/三國志/卷45) · [《吳主傳》](https://zh.wikisource.org/wiki/三國志/卷47) · [《李恢傳》《馬忠傳》](https://zh.wikisource.org/wiki/三國志/卷43) · [《資治通鑑》卷 70](https://zh.wikisource.org/wiki/資治通鑑/卷070)

## 人物圖鑑與頭像

新增 [劉禪](../hero/assets/portraits/liu-shan.webp)、[李嚴](../hero/assets/portraits/li-yan.webp)、[鄧芝](../hero/assets/portraits/deng-zhi.webp)、[高定](../hero/assets/portraits/gao-ding.webp)、[李恢](../hero/assets/portraits/li-hui.webp)、[孟獲](../hero/assets/portraits/meng-huo.webp)。各圖依早期盧植與皇甫嵩的萌將風格重畫，保留各人的帽冠、配色與鬍鬚。最終由原創六格立繪裁為 320 × 320 WebP。保留諸葛亮、孫權等既有頭像，補上諸葛亮託孤和南征的圖鑑介紹。

重畫提示

```text
Redraw the first reference (6 portraits) as a production portrait sheet in the family-friendly 三國萌將 style of references 2 and 3 (style only, keep six different identities). Single transparent PNG sheet with a strict evenly divided 2 columns × 3 rows, overall 2:3 aspect ratio. Each tile occupies exactly one square, no dividers, no overlap, no props crossing cell bounds and no graphic backgrounds. Chest-up, centered, bigger chibi heads with rounder cheeks than reference 1 and approximately 2-head tall bust proportions, huge expressive clear eyes with crisp highlights, tiny simplified noses, clearly designed silhouettes, clean dark contour and bright warm simplified cel-shaded colors. Fun, dignified, energetic Chinese three kingdoms cartoon game avatars, clearly stylized and cute even for older characters. No photographic skin details, no brush texture, no lifelike adult proportions, no cinematic lighting and no scenery. On every cell: keep entire eyes, face, ears and collar inside the tile's inner 70%, hat stays comfortably within top margin, shoulders can be wider. Six cells in reading order matching reference 1: (row 1 left) Liu Shan, teenager with round happy cheeks, no facial hair, small black court cap and jade-green gold-trim robe; (row 1 right) Li Yan, confident expressive eyes, pointed little goatee and curved moustache, chestnut officer cap and maroon robe; (row 2 left) Deng Zhi, cheerful clever diplomat with grey short beard, tall teal court cap and a rolled letter, bright blue robe; (row 2 right) Gao Ding, square cheeks, strong brows, a short moustache, blue cloth head wrap and rust trim; (row 3 left) Li Hui, kind determined expression, short perfect moustache, olive leather cap and indigo collar, olive shoulders; (row 3 right) Meng Huo, broad friendly chibi face, thick little beard, red patterned headband and charcoal red clothing. Deliberately distinct silhouettes and colors, readable as 40×40 icons. No lettering, no watermark.
```

## 回歸測試

```sh
npm run test:hero:engine
npx playwright test --config=playwright.hero-sixteen.config.js
```

觸控測試以隔離存檔和受控敵波驗證任務計時、地圖、營地、圖鑑與末關存檔重試。引擎測試使用正常敵波檢查關卡可完成性。
