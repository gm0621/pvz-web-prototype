# 第十四章「襄樊風雲」

第 77～82 關延續第 76 關沔陽封王。以建安二十四年（219 年）為章節年份。徐晃解圍與孫權取荊州是互相影響的兩條戰線，關卡依視角排列，部分事件同時發生。

| 關卡 | 視角與遊戲任務 | 史書結果 |
| --- | --- | --- |
| 77 沔陽傳令 | 劉備軍接應三隊傳令使者 | 劉備成為漢中王，任命關羽為前將軍 |
| 78 襄樊圍城 | 關羽軍守住各路接應點 | 關羽圍樊，曹仁仍守樊城 |
| 79 漢水暴漲 | 派友軍護送三批糧船，可換航道並保留進度；送達安全渡口並清退餘船 | 大雨使漢水暴漲，于禁投降，龐德被俘後遇害 |
| 80 樊城解圍 | 曹操軍選三至五路，拿下外圍營地和城門圍陣，再擊退守將及餘兵 | 徐晃援救曹仁，關羽退軍 |
| 81 江陵失守 | 關羽軍接應三隊帶回消息的使者 | 呂蒙取得公安、江陵，陸遜進取宜都，關羽軍逐漸散去 |
| 82 麥城出走 | 等接應就緒，帶關羽和在場友軍撤至左側 | 關羽、關平出走途中被馬忠擒獲，後來遇害 |

第 77、81 關顯示消息所在的區域。第 77 關圖上標示劉備在沔陽，關羽在荊州受命的資訊放在人物欄。第 81 關標示呂蒙取得江陵，關羽是前線敘事視角。第 82 關章鄉位置為戰區示意，《吳主傳》記擒獲於章鄉，《關羽傳》則以臨沮交代結局。撤離任務演出出走中的一段，結果頁、營地和章末劇情交代後續史實，遊戲以文字呈現結局。

出戰兵卡沿用兩軍編制。第 80 關的「圍陣守將」代表攔陣敵軍，關羽的撤退由劇情承接。第 82 關的必撤武將是關羽，其他在場友軍也要回到左側。先前的撤離關卡沿用既有條件。使用原戰役存檔與軍資，首勝仍領 80 軍資。

關卡參考史料見遊戲內「查看史料出處」。 [《三國志・先主傳》](https://zh.wikisource.org/wiki/三國志/卷32) · [《關羽傳》](https://zh.wikisource.org/wiki/三國志/卷36) · [《于禁傳、徐晃傳》](https://zh.wikisource.org/wiki/三國志/卷17) · [《龐德傳》](https://zh.wikisource.org/wiki/三國志/卷18) · [《吳主傳》](https://zh.wikisource.org/wiki/三國志/卷47) · [《呂蒙傳》](https://zh.wikisource.org/wiki/三國志/卷54) · [《陸遜傳》](https://zh.wikisource.org/wiki/三國志/卷58) · [《資治通鑑》卷 68](https://zh.wikisource.org/wiki/資治通鑑/卷068)

## 人物圖鑑與頭像

龐德、呂蒙、陸遜、關平使用內建 imagegen 生成的原創四格圖，裁切為 320px WebP。服裝和外貌是遊戲設計。于禁沿用既有頭像、補上表字與襄樊段落。

[龐德](../hero/assets/portraits/pang-de.webp) · [呂蒙](../hero/assets/portraits/lu-meng.webp) · [陸遜](../hero/assets/portraits/lu-xun.webp) · [關平](../hero/assets/portraits/guan-ping.webp)

<details>
<summary>頭像生成提示</summary>

Create ONE square 2 by 2 portrait atlas, four equal square tiles with no gutter, distinct hand-painted original stylized Three Kingdoms character busts for an educational children’s strategy game. Heads centered in each quadrant, front three-quarter, eye line 38%, shoulders contained in own tile, luminous softly painted warm parchment. TOP LEFT Pang De, resolute sturdy middle-aged warrior with steel charcoal lamellar armor, muted ochre scarf and square dark beard, no weapon posing. TOP RIGHT Lü Meng, thoughtful round-featured mature commander, rust-orange lamellar armor under an off-white shoulder cloak, short black beard, a dark folded cap. BOTTOM LEFT Lu Xun, sharp-eyed slim younger scholar commander, deep indigo headwrap, elegant teal and navy embroidered high-collar robe, fine mustache. BOTTOM RIGHT Guan Ping, young determined clean-shaven officer with dark jade lamellar armor and a slim red headband, looks like son of Guan Yu, sharp brows but no long beard. Strong, distinct faces readable at 50px, Late Han inspired. No lettering, dividers, logos, watermark, weapons crossing borders or violent content. Precise centered quadrants.

</details>

## 驗證

```sh
npm run test:hero:engine
npx playwright test --config=playwright.hero-fourteen.config.js
```

瀏覽器流程從重玩第 76 關開始，驗證第十四章銜接、行軍圖、換軍、兵器保存、撤離與末關存檔。流程使用受控敵波，戰鬥平衡另用引擎實際部署與戰鬥模擬驗證。
