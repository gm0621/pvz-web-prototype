# 第二十二章「成都受降」

接續第 124 關劍閣守關。六關沿 263 年史實，從鄧艾走陰平、江由守將投降，到綿竹失守和劉禪在成都城北向鄧艾投降。本章保留行軍圖、人物圖鑑、營地與首勝軍資。

| 關卡 | 史實與行軍圖 | 遊戲任務 |
| --- | --- | --- |
| 125 陰平越險 | 陰平 → 景谷山道。鍾會在劍閣受阻，鄧艾另走山路，糧運艱難。 | 魏軍視角，備車並送出三批補給。 |
| 126 江由開城 | 景谷山道 → 江由。魏軍前隊抵達，蜀軍守將投降。 | 魏軍視角，整備關門、道路、糧冊。 |
| 127 涪縣急報 | 成都 → 涪縣。黃崇勸諸葛瞻先守險要，建議未被採納，蜀軍前隊失利。 | 蜀漢視角，接應三隊使者。 |
| 128 綿竹撤兵 | 涪縣 → 綿竹。鄧艾率軍擊敗蜀軍，諸葛瞻、諸葛尚和黃崇殉難。 | 下令撤離，至少保住一隊，所有存活的友軍回到左側。 |
| 129 成都議降 | 成都。譙周在朝議時勸劉禪降魏，使者攜文書與印綬出發。 | 整備文書、印綬、驛站。地圖以單一地名牌標示議事地。 |
| 130 成都受降 | 成都 → 成都城北。劉禪向鄧艾投降，蜀漢結束，各地守軍奉命停戰。 | 接應三隊傳令使者。 |

《黃權傳》在不同版本可見黃崇與黃祟兩種寫法，遊戲採用黃崇。行軍圖沿用高對比地名牌、方向箭頭與頭像，路線間距為示意。遊戲任務與營地對話為改編。第 125、126、129、130 關以運補、整備或傳令進行，沒有敵軍波次。前兩關沿用遊戲魏軍選將及各自的強化，回到蜀軍後讀取原有蜀軍強化。綿竹撤離的是倖存隊伍，歷史人物的結局在戰後文字交代。

- [《三國志・鄧艾傳》](https://zh.wikisource.org/zh-hant/三國志/卷28#鄧艾) · [《三國志・鍾會傳》](https://zh.wikisource.org/zh-hant/三國志/卷28#鍾會) · [《三國志・後主傳》](https://zh.wikisource.org/zh-hant/三國志/卷33#後主_劉禪)
- [《三國志・諸葛瞻》](https://zh.wikisource.org/zh-hant/三國志/卷35#諸葛瞻) · [《三國志・黃權傳》](https://zh.wikisource.org/zh-hant/三國志/卷43#黃權) · [《三國志・譙周傳》](https://zh.wikisource.org/zh-hant/三國志/卷42#譙周) · [《三國志・姜維傳》](https://zh.wikisource.org/zh-hant/三國志/卷44#姜維)

## 萌將頭像

使用內建 imagegen，以張翼、廖化、鄧艾為風格參考，分別生成透明方形半身像並轉成 320 × 320 WebP。四位人物均可在圖鑑查詢登場關卡。

| 人物 | 神情與辨識特徵 |
| --- | --- |
| [諸葛瞻](../hero/assets/portraits/zhuge-zhan.webp) | 正面抿嘴、眉眼堅定，玉色盔飾和白圍領。 |
| [黃崇](../hero/assets/portraits/huang-chong.webp) | 抬眉向上看，微張嘴像在急著提醒人，戴褐金頭帶。 |
| [諸葛尚](../hero/assets/portraits/zhuge-shang.webp) | 青年圓臉朝左喊話，紅頭帶和淺玉色護肩。 |
| [譙周](../hero/assets/portraits/qiao-zhou.webp) | 垂眼思索，單邊抬眉，戴深色高帽，留灰色長鬍。 |

<details>
<summary>ImageGen 生成提示</summary>

> Use case illustration-story. Produce one standalone square transparent head-and-shoulders character avatar in the same Chinese Three Kingdoms 萌將 style as the attached portraits. Reference images are style only (large head, chunky warm flat cel shading, bold contours); design a different historical character. [角色設定] Readable expression at 40px, very large head, crisp eyes and strong facial silhouette on true transparent alpha. Center portrait with small clear margin above and sides and end shoulders near bottom. No text, background, frame, weapon, gore or realism.

- `zhuge-zhan` — 諸葛瞻, adult Shu Han officer and the son of Zhuge Liang. Calm straight-on expression with slightly drawn brows, direct resolute gaze and lips firmly pressed in a level line. Small neat ink-black moustache and point beard, deep jade feather-shaped helmet ornament, cream silk neck wrap, copper accents and teal lamellar armor.
- `huang-chong` — 黃崇, middle-aged Shu officer, empathic deep-set eyes looking slightly upward to the right, both brows raised in the middle and small parted mouth like an urgent warning. Short straight moustache, tawny gold cloth headband, saffron scarf and warm umber armor. Rounded face.
- `zhuge-shang` — 諸葛尚, youthful adult Shu officer, bright determined eyes tilted left, mouth open in a brave call, strong diagonally lowered eyebrows. Clean-shaven round cheeks, dark leaf green armor, deep crimson headband tied around black topknot and light jade shoulder plates. Clearly younger than his father.
- `qiao-zhou` — 譙周, older Shu court scholar. Thoughtful half-lidded look down-left, one eyebrow slightly raised, pursed mouth bending mildly down as if weighing a difficult decision. Silver narrow moustache and long grey pointed beard, dark indigo court scholar cap edged in gold and muted lavender robes.

</details>

## 回歸方式

```sh
npm run test:hero:engine
npx playwright test --config=playwright.hero-twenty-two.config.js
```

引擎測試驗證敵波及非交戰關卡。觸控測試使用模擬裝置、隔離存檔與受控敵波，覆蓋第 124 關接第 125 關、魏蜀強化、地圖、六關任務、營地及重玩。
