# 第二十一章「劍閣守關」

接續第 118 關狄道撤軍，沿 256～263 年的史實，從姜維後續北伐走到蜀軍在劍閣擋住鍾會。本章沿用蜀漢軍的三路任務、選將與養成、首勝軍資及戰後營地。

| 關卡 | 史實與行軍圖 | 過關任務 |
| --- | --- | --- |
| 119 段谷撤兵 | 256 年，鍾題 → 段谷，串接兩次出兵。鄧艾在段谷擊敗蜀軍，姜維自請降官。 | 第三波追兵出現後按「全軍撤離」，至少保住一隊，把所有在場友軍帶回左側。 |
| 120 芒水相持 | 257 年，駱谷 → 芒水一帶。蜀、魏相持，魏軍未接受挑戰。258 年姜維撤回成都。 | 依上、下、中路預警守住三波，再清退遊戲中的游兵。 |
| 121 侯和退屯 | 262 年，侯和 → 沓中。姜維在侯和失利後退駐沓中。 | 依序派友軍護送三批糧車通過山口、谷道和沓中營地，再清退餘兵。 |
| 122 沓中脫身 | 263 年，沓中 → 陰平。鄧艾在沓中牽制姜維，鍾會另入漢中。姜維越過陰平橋頭，廖化奉命支援。 | 第三波追兵出現後按「全軍撤離」，至少保住一隊，把所有在場友軍帶回左側。 |
| 123 漢壽會師 | 263 年，陰平 → 漢壽方向。陽安關口失守，姜維、廖化與張翼等隊伍會合。 | 接回三隊聯絡使者。 |
| 124 劍閣守關 | 263 年，漢壽 → 劍閣。鍾會攻關受阻，鄧艾另從陰平深入蜀地。 | 根據預警調動友軍，守住防線並清退三波敵軍。 |

路線是歷史區域示意，鍾題接段谷概括前後兩次出兵，漢壽用來標示張翼等援軍所在方向。戰前和戰場地圖都使用放大的行軍路線，標出起點、終點、北方與方向箭頭。頭像沿路線移動，對手放在圖下方。遊戲以撤離呈現段谷戰敗，以運糧呈現侯和退屯。末關交代劍閣與陰平兩條戰線，進度停在劍閣守住之時。

- [《三國志・姜維傳》](https://zh.wikisource.org/zh-hant/三國志/卷44#姜維) · [《三國志・後主傳》](https://zh.wikisource.org/zh-hant/三國志/卷33#後主_劉禪)
- [《三國志・鄧艾傳》](https://zh.wikisource.org/zh-hant/三國志/卷28#鄧艾) · [《三國志・鍾會傳》](https://zh.wikisource.org/zh-hant/三國志/卷28#鍾會) · [《三國志・張翼傳》](https://zh.wikisource.org/zh-hant/三國志/卷45#張翼) · [《三國志・廖化》](https://zh.wikisource.org/zh-hant/三國志/卷45#廖化)

## 萌將頭像與圖鑑

使用內建 imagegen，以陳泰、夏侯霸頭像為比例、線條和暖色陰影參考。為四人分別生成透明方形半身像，以 40px 也能看清楚的眉形、眼神與嘴型來設計，成品轉為保留透明度的 320 × 320 WebP。

| 人物 | 提示中的神情與服飾 | 圖鑑搜尋 |
| --- | --- | --- |
| [鄧艾](../hero/assets/portraits/deng-ai.webp) | 正面皺眉、閉口抿嘴，深藍頭巾與灰鬍。 | 士載 |
| [鍾會](../hero/assets/portraits/zhong-hui.webp) | 偏向右看，挑單邊眉、嘴角斜笑，黑金高帽與梅紫袍。 | 士季 |
| [廖化](../hero/assets/portraits/liao-hua.webp) | 瞇眼大笑，白鬍、苔綠頭巾與磚紅披肩。 | 元儉 |
| [張翼](../hero/assets/portraits/zhang-yi.webp) | 朝左上看、抬眉微張嘴，綠盔與赭黃護肩。 | 伯恭 |

圖鑑列出四人在各關的實際提及與登場。劇情提及和圖鑑共用姓名辨識，「張翼德」歸於張飛。

<details>
<summary>ImageGen 生成提示</summary>

共同提示

> Use case: illustration-story. Asset type: 1 standalone square transparent head-and-shoulders game avatar, for the same Three Kingdoms cute 萌將 series as the two attached style references. These are references for proportions, bold outlines and warm cel shading only. Design a distinct historical character: [角色設定] Keep the highly simplified cute oversized head and crisp big eyes, soft rounded silhouette with simple clean dark lines, warm tinted flat painted shapes, expressive eyebrow and mouth readability at 40px, and gentle game-illustration finish. Center the bust straight within a square with a little clear margin above head and at sides, shoulders may end near bottom. Genuinely transparent background. No letters, labels, frame, patterns behind the character, weapons, action, blood, gore, magic or realism.

- `deng-ai` — 鄧艾, older Cao Wei general. Straight-on severe concentrated gaze, brows drawn together, a clearly frowning downturned closed mouth. Salt-and-pepper short squared beard, slate-blue tied headwrap with steel plate, dark navy lamellar armour, muted blue cape. Broad square jaw.
- `zhong-hui` — 鍾會, younger Cao Wei scholar commander. Turn a little to the right, quizzical sharply raised single eyebrow, one eye wide and one slightly narrowed, small confident one-sided smirk. Clean-shaven sharp jaw, black tall formal court cap with gold fastening, deep plum robe with lilac collar and dark small shoulder armour.
- `liao-hua` — 廖化, an elderly Shu Han veteran with white bushy straight brows, warm eyes squeezed almost shut and a broad open hearty smile. White moustache and short forked beard, moss-green low tied head scarf with a small jade ornament, russet cloth shoulder wrap and worn bronze lamellar armour.
- `zhang-yi` — 張翼, stern middle-aged Shu Han officer. Half-turned to the left with big eyes looking up and left, both eyebrows raised in concern, lips parted as if making a serious objection. Thin black moustache and narrow pointed chin tuft, dark green helmet and crimson cord, ochre shoulder padding over jade-green armour.

</details>

## 回歸方式

```sh
npm run test:hero:engine
npx playwright test --config=playwright.hero-twenty-one.config.js
```

引擎含正常敵波。觸控用模擬裝置、隔離存檔及受控敵波，驗證第 118 關接第 119 關、撤離、備車、使者、劍閣守關、營地、末關存檔重試和重玩。
