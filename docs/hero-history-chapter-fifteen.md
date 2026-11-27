# 第十五章「夷陵之戰」

第 83～88 關接續麥城之後。第 83 關先用劇情交代 220 年曹丕建立魏，再從劉備於 221 年在成都稱帝開始。關卡年份為 221～222 年。

| 關卡 | 遊戲任務 | 史書結果 |
| --- | --- | --- |
| 83 成都即位 | 接應三隊傳令使者 | 劉備在成都稱帝，改元章武，任諸葛亮為丞相 |
| 84 閬中噩耗 | 守住各路渡口接應點 | 張飛出征前在閬中遇害，原定在江州會師 |
| 85 巫口進兵 | 逐批護送糧車經巫縣營地、沿江驛站、秭歸營地，再清完餘兵 | 吳班、馮習攻破李異等部，進至秭歸 |
| 86 猇亭對峙 | 守住各路接應點 | 劉備在夷道猇亭一帶紮營，黃權督江北。孫桓守夷道，陸遜等待反擊 |
| 87 夷陵撤退 | 辨認安全、快起火和燃燒中的路線。有友軍在火路時可開路一次；接應就緒後帶劉備與在場友軍撤離 | 陸遜火攻得勝，馮習、張南等戰死，劉備先退秭歸 |
| 88 白帝收兵 | 逐批護送糧車經秭歸營地、山路驛站、永安營地，再清完餘兵 | 劉備撤到魚復，改名永安。黃權因歸路被截率部降魏，劉備後來接受孫權請和 |

閬中地圖只標示消息來源。白帝一帶以永安標記，孫權的和談消息在人物欄呈現。第 87 關的追兵軍官代表戰場遭遇，陸遜的火攻得勝與劉備敗退由戰後劇情呈現。原有劉備軍三路兵卡與養成可以繼續用，實際出場名單以劇情為準。營地對話由當關在世人物交代。

每關的「查看史料出處」包含當關來源。 [《三國志・先主傳》](https://zh.wikisource.org/wiki/三國志/卷32) · [《張飛傳》](https://zh.wikisource.org/wiki/三國志/卷36) · [《黃權傳》](https://zh.wikisource.org/wiki/三國志/卷43) · [《孫桓傳》](https://zh.wikisource.org/wiki/三國志/卷51) · [《陸遜傳》](https://zh.wikisource.org/wiki/三國志/卷58) · [《資治通鑑》卷 69](https://zh.wikisource.org/wiki/資治通鑑/卷069)

## 圖鑑與頭像

吳班、馮習、黃權和孫桓採用內建 imagegen 生成的原創四格圖，裁切為 320px WebP。服裝和外貌是遊戲設計。陸遜、張飛沿用既有頭像並補充本章事蹟。

[吳班](../hero/assets/portraits/wu-ban.webp) · [馮習](../hero/assets/portraits/feng-xi.webp) · [黃權](../hero/assets/portraits/huang-quan.webp) · [孫桓](../hero/assets/portraits/sun-huan.webp)

<details>
<summary>頭像生成提示</summary>

Create ONE 2x2 square portrait atlas, exactly four equal square tiles, no dividers or gutters. Original hand painted late Han Three Kingdoms character busts for an educational adventure game, warmly lit parchment backgrounds. Center heads in each tile, front three-quarter angles, faces recognizable at 50px, eyes about 38% down each tile. Upper left Wu Ban, Liu Bei's resolute vanguard officer, bronze lamellar armor with muted red shoulder scarf, short narrow black beard. Upper right Feng Xi, younger bright-eyed field officer, deep green collar, black tied-back hair and dark cloth headband, little facial hair. Lower left Huang Quan, thoughtful mature field commander with graying neatly trimmed beard, sober violet robe under bronze shoulder guards and high black cloth cap. Lower right Sun Huan, youthful Wu commander, red-brown lamellar coat, ochre tied headwrap and faint mustache. Distinct ages, silhouettes, faces, and color identities without names or text. No text, seals, logos, weapons overlapping tiles, or violence.

</details>

## 驗證

```sh
npm run test:hero:engine
npx playwright test --config=playwright.hero-fifteen.config.js
```

瀏覽器以第 82 關舊存檔開始。測試重玩和章末銜接、各關行軍圖和營地、夷陵的技能預警與撤離、末關存檔失敗後重試及圖鑑。瀏覽器用隔離存檔與受控敵波，戰鬥平衡另由引擎模擬驗證。
