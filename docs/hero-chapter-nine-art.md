# 第九章人物美術

2026-11-12 使用內建 imagegen（非 CLI），以第八章頭像作風格參考；生成後人工確認五人各佔獨立格位。

- 專案素材：`hero/assets/portraits/chapter-nine.png`，1536×1024，3 欄 2 列。
- 上列：高幹、袁熙、田疇；下列：蹋頓、公孫康、空白。
- 皆為敘事／圖鑑角色，不增加可操作兵卡。造型是本作的歷史題材插畫，不是人物真實相貌。
- 戰場沿用既有游兵動作；劇情主事者與外圍游兵分開，不以既有袁軍造型冒充烏桓部隊。
- 原圖保留於生成工具預設目錄；遊戲僅依賴專案內素材。

## 完整生成提示

```text
Use case: historical-scene. Create a game portrait atlas, 1536x1024 landscape, precisely three equal columns and two equal rows, six square cells. Reference image is STYLE ONLY, not edit target. Match its warm parchment, polished friendly illustrated Three Kingdoms bust portraits for elementary school children. Five NEW distinct historical men, centered face and shoulders in each cell with generous 8% margins for circular crop. Top left Gao Gan 高幹: adult Chinese general with square jaw, short beard, dark olive lamellar armor and bronze headpiece. Top middle Yuan Xi 袁熙: young adult Chinese noble, calm long face, blue navy armor and simple silver hair crown; distinguish from red Yuan Tan and teal Yuan Shang reference. Top right Tian Chou 田疇: practical middle aged Chinese guide and scholar, plain tan traveling robe, modest dark cloth cap, friendly observant eyes and short moustache, rolled map at chest. Bottom left Tadun 蹋頓: dignified adult Wuhuan leader of early third century, dark red-brown coat with modest fur collar and leather cap, confident face, natural realistic human features, no stereotype or fantasy horns. Bottom middle Gongsun Kang 公孫康: mature Chinese regional ruler, dark blue violet official robes, rectangular dark official cap, neat trimmed beard, thoughtful stern eyes. Bottom right EMPTY parchment only. No words, names, lettering, watermark, modern clothing, weapons protruding across cells or borders. Opaque warm parchment background; consistent scale and lighting. Exactly five people, each fully confined to designated cell.
```
