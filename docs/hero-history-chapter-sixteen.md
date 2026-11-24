# 第十六章「託孤與南征」

第 89～94 關接續第十五章在永安收兵後的史實，時間從 223 年到 225 年。新章沿用蜀軍三路與既有武將成長和兵器存檔。兵卡是遊戲玩法，史實角色由劇情、行軍圖和營地交代。

| 關卡 | 史實順序與地圖 | 過關任務 |
| --- | --- | --- |
| 89 白帝託孤 | 成都 → 永安。劉備囑託諸葛亮、李嚴輔佐劉禪，李嚴守永安，劉備四月去世。 | 照應三路共 24 戰鬥秒，清退道路游兵。 |
| 90 劉禪即位 | 成都。五月即位，改元建興。 | 接回三隊傳令使者。 |
| 91 使吳修好 | 成都 → 武昌（今湖北鄂州一帶）。鄧芝出使，與吳王孫權恢復往來。 | 接應三隊使者，可手動切換路線。 |
| 92 務農息民 | 成都。224 年蜀漢勸農，讓百姓休息。 | 三路分別整備田間道路、水渠與糧倉。每處累積 8 戰鬥秒，暫停時保留進度。 |
| 93 南征越巂 | 成都 → 越巂。諸葛亮率主軍從越巂進入，擊敗高定，李恢與馬忠另率隊伍。 | 各路有人且敵人未逼近才計接應時間。 |
| 94 南中收兵 | 越巂 → 滇池一帶，表示主軍大致方位。平定四郡，十二月諸葛亮回到成都。 | 各路接應，送出三批軍糧。 |

第 91 關是外交會談，孫權頭像標示吳王，戰場的游兵為改編。第 94 關另述李恢在古書稱為「昆明」的地方受圍，與主軍滇池標記分開。《三國志・諸葛亮傳》正文記南征與平定，裴松之注引《漢晉春秋》另載七擒孟獲。《資治通鑑》也收錄這個說法。孟獲出現在人物欄與圖鑑，地圖未假定某場擒放的確切位置。

- 託孤與即位 [《先主傳》](https://zh.wikisource.org/wiki/三國志/卷32) · [《諸葛亮傳》](https://zh.wikisource.org/wiki/三國志/卷35) · [《李嚴傳》](https://zh.wikisource.org/wiki/三國志/卷40) · [《後主傳》](https://zh.wikisource.org/wiki/三國志/卷33)
- 蜀吳修好與南征 [《鄧芝傳》](https://zh.wikisource.org/wiki/三國志/卷45) · [《吳主傳》](https://zh.wikisource.org/wiki/三國志/卷47) · [《李恢傳》《馬忠傳》](https://zh.wikisource.org/wiki/三國志/卷43) · [《資治通鑑》卷 70](https://zh.wikisource.org/wiki/資治通鑑/卷070)

## 人物圖鑑與頭像

新增 [劉禪](../hero/assets/portraits/liu-shan.webp)、[李嚴](../hero/assets/portraits/li-yan.webp)、[鄧芝](../hero/assets/portraits/deng-zhi.webp)、[高定](../hero/assets/portraits/gao-ding.webp)、[李恢](../hero/assets/portraits/li-hui.webp)、[孟獲](../hero/assets/portraits/meng-huo.webp)。各圖由同一張原創六格立繪裁為 320 × 320 WebP。保留諸葛亮、孫權等既有頭像，補上諸葛亮託孤和南征的圖鑑介紹。

生成提示

```text
Create one game illustration sprite atlas, exactly 2 columns and 3 rows, six equal square tiles edge to edge with no gaps, no borders and no text. Full canvas portrait aspect ratio 2:3. Each character is a separate, clearly distinct, centered chest-up historical strategy game portrait, with empty margin above the hair and room on both sides. Faces fully inside central 70% of their tile. Original detailed warm ink and watercolor illustration for a family-friendly Three Kingdoms history game, Chinese late Eastern Han / early Three Kingdoms period clothing, muted painterly brown teal backgrounds with contrast, gentle historical realism and visually different features. Top left: Liu Shan, youthful 16-year-old prince, round earnest face and no facial hair, small black court cap, jade green layered silk robe with gold trim. Top right: Li Yan, middle-aged high official and field commander, lean face with pointed moustache and goatee, chestnut brown military cap, muted maroon robe with understated bronze lamellar collar. Middle left: Deng Zhi, older tall dignified diplomat, thin face, neatly trimmed black and grey beard, high dark teal court cap, blue grey traveling robe and one tied bamboo letter at chest level. Middle right: Gao Ding, rugged imposing leader in southwest inland highlands of early third-century China, dark blue cloth wrapped around hair, broad square face and short moustache, earthy blue and russet woven layered clothing, realistic and dignified. Bottom left: Li Hui, Chinese Shu commander from Nanzhong, seasoned neat face and dark moustache, braids tied back under subdued dark olive cap, olive lamellar shoulder armor with pale indigo robe. Bottom right: Meng Huo, dignified mature leader from southwest China highlands, distinctive wide cheekbones, cropped beard, deep red woven headband and simple bronze clasp on a dark charcoal woven coat, confident expression. No caricature, no fantasy props, no modern elements, no lettering or watermark.
```

## 回歸測試

```sh
npm run test:hero:engine
npx playwright test --config=playwright.hero-sixteen.config.js
```

觸控測試以隔離存檔和受控敵波驗證任務計時、地圖、營地、圖鑑與末關存檔重試。引擎測試使用正常敵波檢查關卡可完成性。
