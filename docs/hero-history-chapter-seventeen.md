# 第十七章「北伐初征」

接續第 94 關南征收兵。六關沿用蜀漢三路兵卡、軍資與武將養成。史實登場人物、路線和營地對話由關卡資料獨立提供。

| 關卡 | 史實與行軍圖 | 過關任務 |
| --- | --- | --- |
| 95 漢中出師 | 227 年，成都 → 沔陽。諸葛亮上《出師表》並進駐漢中。 | 接應三隊使者。 |
| 96 隴右響應 | 228 年，祁山 → 天水一帶。南安、天水、安定響應，姜維投奔蜀軍。 | 各路累計接應 24 秒。 |
| 97 街亭撤離 | 228 年，祁山 → 街亭一帶。張郃擊敗馬謖，王平收攏散兵。 | 依上、下、中路預警接應。第三波開始後下令撤離，至少保住一隊，所有存活友軍退回左側。 |
| 98 箕谷收兵 | 228 年，箕谷一帶 → 南鄭。切到同期另一條戰線，趙雲、鄧芝失利後收兵。 | 依預警掩護隊伍。第三波追兵出現才可全軍撤離，至少保住一隊，所有在場友軍都回到左側才過關。 |
| 99 陳倉糧盡 | 228 年冬，散關 → 陳倉。郝昭守城，蜀軍糧盡撤退。 | 先站穩兩處城外陣地，掩護後隊接應，再下令帶存活友軍撤回左側。 |
| 100 武都陰平 | 229 年，武都 → 陰平。陳式進軍，郭淮退走，蜀軍取得兩郡。 | 分批護送糧車經武都營地、山路驛站、陰平營地。護衛離開時暫停，回來後繼續；三批送達並清退餘兵。 |

街亭和箕谷的確切位置有不同說法，地圖採區域示意。郭淮的援軍在旁線，列於人物欄。姜維投奔的細節在正文和注文有別。馬謖最後經過的記載也有差異，劇情寫為戰後被處置。各關的戰鬥目標是遊戲改編。

- [《諸葛亮傳》](https://zh.wikisource.org/wiki/三國志/卷35) · [《後主傳》](https://zh.wikisource.org/wiki/三國志/卷33) · [《姜維傳》](https://zh.wikisource.org/wiki/三國志/卷44)
- [《張郃傳》](https://zh.wikisource.org/wiki/三國志/卷17) · [《王平傳》](https://zh.wikisource.org/wiki/三國志/卷43) · [《馬良傳》](https://zh.wikisource.org/wiki/三國志/卷39)
- [《趙雲傳》](https://zh.wikisource.org/wiki/三國志/卷36) · [《曹真傳》及裴松之注](https://zh.wikisource.org/wiki/三國志/卷9) · [《郭淮傳》](https://zh.wikisource.org/wiki/三國志/卷26)

## 萌將頭像

新增 [姜維](../hero/assets/portraits/jiang-wei.webp)、[馬謖](../hero/assets/portraits/ma-su.webp)、[王平](../hero/assets/portraits/wang-ping.webp)、[曹真](../hero/assets/portraits/cao-zhen.webp)、[郝昭](../hero/assets/portraits/hao-zhao.webp)、[郭淮](../hero/assets/portraits/guo-huai.webp)。畫風以既有劉禪、黃忠為參考。六格原畫分別裁成 320 × 320 WebP。

```text
One original transparent game portrait atlas with strict 2 columns by 3 rows of six square cells, overall 2:3 portrait canvas. Match the supplied original 三國萌將 chibi cartoon reference, especially round oversized heads, big expressive eyes, tiny simplified noses, colorful clear silhouettes, smooth warm cel shading, dark linework, readable as 40px icons. No photography or realistic skin, no lettering, no watermark, no backdrops. Chest up bust with padding and centered face inside each tile. No character crosses any tile boundary. Reading order: top left 姜維 Jiang Wei young composed clean-shaven officer with dark high topknot, jade and turquoise coat with gold pauldron; top right 馬謖 Ma Su, clever young-mature scholar with thin moustache, eggplant black scholar cap, indigo robes and rolled map; middle left 王平 Wang Ping, steady broad-faced officer with short dark beard, forest-green head scarf and ochre bronze armor; middle right 曹真 Cao Zhen, mature dignified broad square face with thick dark beard and black-and-gold helmet, violet and deep red heavy armor; bottom left 郝昭 Hao Zhao, vigilant officer in blue gray helmet with pale cloth knot, neat moustache and dark navy scarf, silver-blue shoulder plates; bottom right 郭淮 Guo Huai, alert middle-aged general, black short pointed beard, blue headwear with sky blue jewel, teal and brass armor with warm pale scarf. Clearly distinct. Keep the larger hats inside each cell.
```

## 本機回歸

```sh
npm run test:hero:engine
npx playwright test --config=playwright.hero-seventeen.config.js
```

觸控測試以隔離存檔與受控敵波驗證關卡銜接、各關地圖、撤離、營地、末關存檔失敗重試與重整。引擎測試另用正常敵波驗證勝利條件。
