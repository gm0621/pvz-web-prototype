# Zombie Army Assets

Gimmy 於 2026-09-07 提供完整新版僵屍方角色素材，並於 2026-09-08追加冥火屍巫。12 位可選角色已整理為 1024×1024 透明 WebP，供角色圖鑑、詳細資料、玩家卡片、頭像與戰場單位共同使用。

| key | 顯示名稱 | 正式素材 |
|---|---|---|
| `normal` | 赤巾小屍 | `zombie-roster-v2/red-band-grunt.webp` |
| `cone` | 鐵盔小兵 | `zombie-roster-v2/iron-helmet-grunt.webp` |
| `bucket` | 巨槌阿蠻 | `zombie-roster-v2/giant-mace-brute.webp` |
| `peaZombie` | 飛石阿投 | `zombie-roster-v2/boulder-thrower.webp` |
| `poleVault` | 蹦蹦飛屍 | `zombie-roster-v2/leaping-raider.webp` |
| `football` | 白髮屍王 | `zombie-roster-v2/white-haired-king.webp` |
| `jester` | 鈴鐺丑屍 | `zombie-roster-v2/bell-jester.webp` |
| `bombJester` | 爆爆桶屍 | `zombie-roster-v2/bomb-carrier.webp` |
| `corpseTitan` | 屍旗大胖 | `zombie-roster-v2/banner-titan.webp` |
| `fireCatapult` | 烈焰屍車 | `zombie-roster-v2/flame-catapult.webp` |
| `qinEmperor` | 始皇屍帝・嬴政 | `zombie-roster-v2/qin-emperor.webp` |
| `necromancer` | 冥火屍巫 | `zombie-roster-v2/netherfire-necromancer.webp` |

原始上傳圖分別保存在 `assets/characters/source-originals/zombie-roster-20260907/` 與 `assets/characters/source-originals/zombie-roster-20260908/`，由專案根目錄的 `scripts/prepare_zombie_roster_assets.py` 可重製正式檔。圖3、4、6、9與冥火屍巫會移除烙入的黑底／棋盤格；始皇沿用原圖朝左方向，不再鏡像；烈焰屍車會水平鏡像，使攻擊朝左。

既有 `zombie-army.json` 與舊 PNG/WebP 留作歷史素材；遊戲執行期不再引用舊的 11 位角色圖。
