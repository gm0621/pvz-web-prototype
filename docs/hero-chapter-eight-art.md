# 第八章人物美術

使用內建 imagegen（非 CLI），2026-11-12 生成並人工檢視。五人同圖集，最後一格留白，不增加無劇情用途的人物。

- 專案素材：`hero/assets/portraits/chapter-eight.png`（1536×1024、3 欄 2 列）。
- 上列：袁譚、袁尚、審配；下列：辛毗、劉表、空白。
- 原始輸出保留：`/Users/gimmy/.codex/generated_images/01a1c826-35aa-70f1-b0c8-719d5a30a325/exec-0ca98bcf-a2c1-49c4-a978-2c972c656edc.png`。
- 遊戲執行僅依賴專案內相對路徑；原始輸出位置僅供生成紀錄使用。
- 五人皆為敘事／圖鑑角色；袁紹、袁譚、袁尚、審配的行軍頭像是對方主事者，不是玩家直接擊殺的頭目。戰鬥使用既有袁軍／游兵動作圖集。
- 修正 SVG 地圖選取 3×2 圖集時的影像高度，使地圖頭像與劇情、圖鑑使用同一格。

## 完整生成提示

```text
Use case: illustration-story. Asset: production portrait atlas for a child-friendly Three Kingdoms strategy game. Create exactly a 3 column x 2 row grid of equal square cells, total image 1536x1024. Five distinct adult Chinese historical character bust portraits, soft painted chibi storybook style, polished warm colors, readable at 64px, heads centered at same height and scale with generous margins. Top row left: Yuan Tan, older brother, rust-red lamellar armor, tied dark hair, short mustache, determined face. Top middle: Yuan Shang, younger brother, teal and silver armor, youthful clean-shaven face, tall narrow gold head ornament. Top right: Shen Pei, older stern adviser defending Ye, dark purple robe and modest scholar cap, graying short beard. Bottom left: Xin Pi, composed middle-aged diplomatic messenger, olive green scholar robe, dark cloth cap, thin mustache, holding a rolled letter below face. Bottom middle: Liu Biao, elderly Jingzhou governor, pale blue luxurious robe, wide official cap, long gray beard, dignified gentle expression. Bottom right cell intentionally empty warm parchment background, no sixth character. Each cell warm plain parchment background, no frames, no text, no lettering, no watermark, no blood, no weapons overlapping cells. Distinct faces and silhouettes, consistent illustration quality. Historical-inspired fictional visual interpretations, not photos.
```
