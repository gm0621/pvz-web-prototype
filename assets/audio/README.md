# Audio Assets

## 已實作

- `bgm/01_main.ogg`：主畫面 BGM，Gimmy 指定保留 Asianoriental1，不換掉。
  - 來源：`https://opengameart.org/sites/default/files/asianoriental1_0.ogg`
  - 授權：依 Gimmy 提供資料標示為 CC0。
- `asianoriental1.ogg`：舊路徑保留一份，避免歷史連結失效。

遊戲目前會在玩家互動後播放背景音樂；瀏覽器自動播放限制下，未互動前不會自動出聲。音效仍用 WebAudio 即時合成。

## 規劃中的音樂分層

Gimmy 已確認：Asianoriental1 固定當主畫面音樂。

| 場景 | 建議曲目 | 目標檔名 | 授權 |
|---|---|---|---|
| 主畫面 | Asianoriental1 | `bgm/01_main.ogg` | CC0 |
| 選關 / 武將配置 | Prepare Your Swords | `bgm/02_stage_select.ogg` | CC0 |
| 一般戰鬥 | Fast Fight / Battle Music – Looped | `bgm/03_battle.ogg` | CC0 |
| 大量僵屍來襲 | Zombies' March | `bgm/04_zombie_wave.ogg` | CC0 |
| 獸之巨人登場 | Battle Epic | `bgm/05_giant_boss.mp3` | Pixabay License |
| 僵屍王將軍 | JRPG Epic Rock Battle Theme #1 | `bgm/06_zombie_king_intro.mp3`, `bgm/06_zombie_king_loop.mp3` | CC0 |
| 名將登場 | 10 Fanfares | `jingle/07_hero_*.ogg` | CC0 |
| 勝利 | Victory Fanfare Short | `jingle/08_victory.wav` | CC0 |

目前只有 Gimmy 已提供直接 URL 的 Asianoriental1 已納入 repo；其他曲目需取得可驗證下載 URL 後再放入。
