# Future Three Kingdoms Generals

# 未來武將素材

## 六名蜀國武將戰鬥動畫

- 馬超、黃忠、張飛、劉備、孔明、龐統各使用 8 幀透明 WebP 攻擊動畫；第 5 幀開始（320 ms）才結算傷害、召喚或發射投射物。
- 每名武將的目錄包含原始附件 `source-attack-sheet.png`、`attack-00.webp`～`attack-07.webp` 與戰場專用 `idle.webp`；卡片和圖鑑仍使用原本的展示圖。
- 可重現抽取指令：`python3 scripts/extract_shu_hero_attacks.py`。腳本會驗證六張來源圖的 SHA-256、統一縮放與腳底基準，再輸出透明素材。

## 關羽舊動作拆圖

- 舊來源與拆圖保留供未來動畫研究。
- 目前不再供角色介紹、頭像、卡片或戰場使用；所有執行期關羽畫面統一使用 `assets/characters/guanyu-fire-general.webp`。
- 正式素材來源保存於 `assets/characters/source-originals/guanyu-accepted-20260907.png`。

## 鬥神張飛
- 消耗：225 軍糧
- 定位：高防禦近戰反推
- 能力：高防禦力、高攻擊力；敵人靠近被攻擊時往後退一格；攻擊速度較慢。
- 素材：`assets/characters/future-generals/god-zhangfei.png`
- 原始圖：`assets/characters/future-generals/source-originals/god-zhangfei-source.png`

## 寒冰趙雲
- 消耗：175 軍糧
- 定位：遠近雙型緩速
- 能力：可遠程攻擊但攻擊力較低；近距離攻擊力較高；被打到的敵方速度變慢。
- 素材：`assets/characters/future-generals/ice-zhaoyun.png`
- 原始圖：`assets/characters/future-generals/source-originals/ice-zhaoyun-source.png`

## 穿刺馬超
- 消耗：200 軍糧
- 定位：三格穿刺群攻
- 能力：高攻擊力；可以打到三格內敵人；具穿刺效果，可同時打多人，並顯示藍色刺擊軌跡。
- 素材：`assets/characters/future-generals/pierce-machao.png`
- 原始圖：`assets/characters/future-generals/source-originals/pierce-machao-source.png`

## 百箭黃忠
- 消耗：200 軍糧
- 定位：三排弓箭覆蓋
- 能力：同弓兵，但一次可以射三排：自己那一排、上排、下排。
- 素材：`assets/characters/future-generals/hundred-arrows-huangzhong.png`
- 原始圖：`assets/characters/future-generals/source-originals/hundred-arrows-huangzhong-source.png`

## 軍神孔明
- 消耗：250 軍糧
- 定位：全地圖一次性高輸出
- 能力：全地圖攻擊，高輸出傷害；一次性使用，打完就消失。
- 素材：`assets/characters/future-generals/war-god-kongming.png`
- 原始圖：`assets/characters/future-generals/source-originals/war-god-kongming-source.png`

## 火神龐統
- 消耗：175 軍糧
- 定位：三列鳳火一次性高輸出
- 能力：三列火攻，高輸出傷害；一次性使用，打完就消失，並顯示鳳火特效。
- 素材：`assets/characters/future-generals/fire-god-pangtong.png`
- 原始圖：`assets/characters/future-generals/source-originals/fire-god-pangtong-source.png`

## 仁德劉備
- 消耗：300 軍糧
- 定位：召喚三路刀兵輔助
- 能力：每隔一段時間召喚上、前、下三隻可前進刀兵；刀兵為一般攻擊力。
- 主圖：`assets/characters/future-generals/liubei/liubei-main.png`
- 角色介紹頁專用圖：`assets/characters/future-generals/liubei/liubei-guide.png`（Gimmy 提供圖2）
- 戰鬥動作：
  - `liubei-heal.png`：仁德治療
  - `liubei-rally.png`：鼓舞士氣（目前召喚時切換使用）
  - `liubei-slash.png`：雙股劍攻擊
  - `liubei-guard.png`：守護之力
- 未來商城技能素材：仁德治世、昭烈之志、以德服人、匡扶漢室，可用金幣與經驗值升級或兌換。
- 原始圖：`assets/characters/future-generals/source-originals/liubei-sheet-source.png`
