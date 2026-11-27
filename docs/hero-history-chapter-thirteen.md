# 第十三章「漢中爭雄」

由第 70 關張魯歸降接到建安二十至二十四年。前四關使用既有曹操軍選將與三至五路，後兩關切回劉備軍的固定三將與三路。玩家仍使用原存檔，武將經驗與兵器跟隨各自角色或軍隊，軍資與道具沿用同一份戰役進度。

| 關卡 | 年份與視角 | 遊戲任務 | 史書結果 |
| --- | --- | --- | --- |
| 71 宕渠收兵 | 215 年末戰事，張郃 | 依預警掩護隊伍，第三波才可全軍撤離，所有在場友軍回到左側才結算 | 張飛在瓦口打敗張郃，張郃退回南鄭 |
| 72 鄴城魏王 | 216 年，曹操 | 接應三隊使者 | 漢獻帝將曹操由魏公進爵為魏王 |
| 73 濡須對峙 | 217 年，曹操 | 派友軍護送主船，可換航道並保留航程；抵達回營渡口並清退敵船 | 孫權遣使修好，曹操引軍離開 |
| 74 馬鳴閣道 | 218 年，徐晃 | 固守各路接應點 | 徐晃打退企圖切斷閣道的陳式等軍 |
| 75 定軍山爭高地 | 219 年春，劉備 | 避開夏侯淵技能預警並擊破守軍 | 法正判斷時機，黃忠從高處出擊，夏侯淵戰死 |
| 76 漢中歸劉 | 219 年夏至秋，劉備 | 護送三批糧車 | 曹操撤回長安，劉備取得漢中，後在沔陽受推為漢中王 |

行軍圖表示區域方位。第 73、74、75 關切到各自的戰區起點，第 76 關畫出由定軍山一帶轉到沔陽的敘事位置。第 71 關的退回南鄭、第 76 關曹操回長安由戰後劇情交代。對話、路上遭遇、操作兵卡、戰鬥技能與接應秒數都是遊戲改編。黃忠、法正、張郃及陳式從劇情、地圖或營地登場。

主要史料可在每關的「查看史料出處」開啟。瓦口承接建安二十年末的戰事，以《資治通鑑》卷 67 的編年放在 215 年。徐晃守住閣道是漢中戰事中的一段，年份隨劉備進兵漢中的 218 年篇章。定軍山史實功勞由黃忠與法正的劇情交代，保留後續曹操與劉備在漢中的對峙。 [《三國志・武帝紀》](https://zh.wikisource.org/wiki/三國志/卷01) · [《張郃傳、徐晃傳》](https://zh.wikisource.org/wiki/三國志/卷17) · [《先主傳》](https://zh.wikisource.org/wiki/三國志/卷32) · [《張飛傳、黃忠傳》](https://zh.wikisource.org/wiki/三國志/卷36) · [《法正傳》](https://zh.wikisource.org/wiki/三國志/卷37) · [《吳主傳》](https://zh.wikisource.org/wiki/三國志/卷47) · [《資治通鑑》卷 67](https://zh.wikisource.org/wiki/資治通鑑/卷067) · [卷 68](https://zh.wikisource.org/wiki/資治通鑑/卷068)

## 圖鑑與頭像來源

張郃、陳式、黃忠、法正使用內建 imagegen 生成的原創四格圖，裁切成遊戲用的 320px WebP。服裝和外貌為遊戲想像。

[張郃](../hero/assets/portraits/zhang-he.webp) · [陳式](../hero/assets/portraits/chen-shi.webp) · [黃忠](../hero/assets/portraits/huang-zhong.webp) · [法正](../hero/assets/portraits/fa-zheng.webp)

<details>
<summary>頭像生成提示</summary>

Create ONE square 2 by 2 portrait atlas, four equal square tiles with no gutter, each distinct clean hand-painted original stylized Three Kingdoms character bust for an educational children’s strategy game. Heads centered in each quadrant, front three-quarter, top of head at 13% of tile, eyes at 38%, head and shoulders contained in own tile, each with a softly painted warm parchment backdrop. Top left Zhang He (Zhang Junyi), composed middle-aged archer general, blue-gray lamellar armor, restrained steel cap and short beard. Top right Chen Shi, younger serious field officer with dark green scarf and leather lamellar armor. Bottom left Huang Zhong, kindly but resolute veteran with long white beard, bronzed features and rust red armor, small hint of bow. Bottom right Fa Zheng, clever adviser with black folded Han cap, slim mustache and deep teal woven robe, no armor. Distinct faces and strong silhouettes readable at 50px. Precise quadrant centers. Late Han inspired, original illustrations, no lettering, no separators, no emblems, no watermark.

</details>

## 驗證方式

```sh
npm run test:hero:engine
npx playwright test --config=playwright.hero-thirteen.config.js
```

瀏覽器從第 70 關存檔重玩上一章結尾，經營地進第 71 關，核對視角、選將、行軍圖、暫停恢復、撤離、戰後營地、圖鑑和儲存失敗重試。使用隔離存檔和受控敵波。多路戰鬥模擬則使用引擎實際部署、技能、敵波、任務和勝負判定。
