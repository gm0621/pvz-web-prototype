# 人物小記與行軍頭像

- 對話／序幕提到盧植（含「盧公」）、皇甫嵩、朱儁，以及已有素材的曹操、孫堅、張角、張梁、張寶時，顯示姓名、圖像及一句身分介紹。人物卡是被提及者，不取代正在說話的人；前後翻頁同步更新。
- 行軍圖使用本關主將與實際對手。第 17–19 關曹操，第 20–22 關孫堅，其餘劉備；第 19、20 關標示保全撤離。地點、軍隊切換與原創關卡示意沿用既有資料，並非精確史實路線。
- 行軍動畫放在序幕最前方，抵達後仍保留地圖；減少動態偏好直接到達目的地。戰場開圖沿用暫停及恢復規則。
- 新頭像為美術想像，非歷史肖像。遊戲立繪與陣營圖集沿用現有素材；新素材不修改原有角色。

## 新素材與生成方式

使用內建 imagegen（非 API CLI）；透明 PNG 原檔保存在 `hero/assets/portraits/`。原始生成輸出保留在產生工具的預設目錄。以下為最終提示詞。

### lu-zhi.png

Use case: stylized-concept. Project-bound game portrait for a cute Three Kingdoms Chinese story game. Generate one isolated head-and-shoulders portrait of Lu Zhi (盧植), an elderly Eastern Han scholar-general, wise kind but firm expression, long neatly divided grey beard, dark blue Han scholar headpiece, navy robe and restrained bronze lamellar shoulder armor, holding a rolled bamboo scroll barely visible at lower edge. High quality polished chibi mobile-game illustration, oversized expressive head, warm golden outlines, crisp painted detail readable at 64 pixels. 3/4 view facing slightly right, face centered and fully visible, generous transparent margins. Actual transparent background. No text, letters, watermark, borders or additional characters. A stylized fictional interpretation, not an authentic historical likeness.

### huangfu-song.png

Use case: stylized-concept. One game portrait of Huangfu Song (皇甫嵩), Eastern Han general, for a cute Three Kingdoms story game. Head-and-shoulders portrait, oversized expressive head, mature confident face, dark moustache and short squared beard, dark red Han military headpiece with gold ornament, crimson scarf, bronze-gold lamellar armor. Distinct from an elderly scholar: younger face and alert commanding eyes. Polished chibi mobile-game illustration, warm golden outlines and crisp painted detail, readable at 64px. Face centered and fully visible, 3/4 slightly left, generous transparent margins. Transparent background, no text, no frame, no extra characters. Stylized fictional interpretation rather than historical likeness.

### zhu-jun.png

Use case: stylized-concept. One isolated portrait of Zhu Jun (朱儁), an Eastern Han military commander, for a cute Three Kingdoms story game. Head and shoulders with oversized expressive head, strong middle aged face, thick straight eyebrows, black moustache with a small pointed beard, teal Han military headcloth, bronze helmet rim and dark teal lamellar armor, confident composed expression. Visually distinct from a grey-bearded elderly scholar and a red-clad commander. Polished chibi mobile game painted illustration with warm gold highlights and clear silhouettes, crisp detail readable at 64px. Face centered, fully visible, 3/4 slightly right, generous transparent margins. Truly transparent background. No text, frame, logos or other figures. Stylized interpretation, not a historically authentic portrait.

## 驗證入口

```sh
npm run test:hero:engine
npx playwright test tests/hero-character-map.spec.js tests/hero-campaign-map.spec.js --retries=0
npx playwright test --config=playwright.hero-characters.config.js --retries=0
```
