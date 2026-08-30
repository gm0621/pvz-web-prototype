# Character Assets

目前正式遊戲使用 Gimmy 提供的高品質 PNG 角色圖：三國守方 + 新版僵屍方。舊 SVG 角色仍保留在資料夾中作為歷史/備用素材，但 `index.html` 已改用 PNG。

## 三國守方 PNG 正式素材

- shu-archer.png：蜀軍弓兵，取代原豌豆射手。
- quartermaster-strategist.png：軍糧官 / 小軍師，取代原向日葵。
- shield-general.png：盾將，取代原堅果牆。
- ambush-scout.png：伏兵，取代原土豆雷。
- guanyu-fire-general.png：關羽火焰將，取代原火焰豌豆。

## 僵屍方 PNG 正式素材

位於 `zombie-army/`：

- normal-zombie.png：一般僵屍，取代普通僵屍。
- armored-zombie.png：鐵甲僵屍，取代路障僵屍定位。
- beast-giant.png：獸之巨人，取代鐵桶僵屍定位。
- zombie-warlord.png：僵屍王將軍，取代橄欖球僵屍定位。
- rock-thrower-zombie.png：擲石僵屍，取代豌豆射手僵屍定位。
- jumping-zombie.png：跳躍僵屍，取代撐桿跳僵屍定位。

Manifest：`zombie-army/zombie-army.json`。
原始上傳圖：`zombie-army/source-originals/`。

## Three Kingdoms generals integrated in game

這批武將已加入三國守方卡片與角色介紹頁。

## Audio and animation notes

- 背景音樂使用 `../audio/bgm/01_main.ogg`（Asianoriental1 保留當主畫面）；音效使用瀏覽器 WebAudio 即時合成。
- 遊戲頁有「音樂 ON/OFF」按鈕；受瀏覽器自動播放限制，聲音會在玩家互動後啟動。
- 攻擊動畫包含角色入場/呼吸、攻擊前衝、投射物脈動、命中斬擊、龐統三列鳳火、馬超三格穿刺、孔明全圖八卦/雷陣、火焰/冰凍/爆炸與推車音效。
- 方向修正：跳躍僵屍與鬥神張飛已做 180° 水平翻轉。

- 鬥神張飛：225 軍糧，高防禦/高攻擊，近戰反推一格，攻速慢。
- 寒冰趙雲：175 軍糧，遠程低傷、近戰高傷，命中緩速。
- 穿刺馬超：200 軍糧，三格穿刺群攻，顯示藍色刺擊軌跡。
- 百箭黃忠：200 軍糧，自己排/上排/下排三排射擊。
- 軍神孔明：250 軍糧，全地圖一次性高輸出，使用後消失。
- 火神龐統：175 軍糧，三列鳳火一次性高輸出，使用後消失。
- 仁德劉備：300 軍糧，定時召喚上、前、下三隻可前進刀兵；主圖與四張戰鬥動作圖位於 `future-generals/liubei/`。

## Future shop / ability upgrades

- 目前金幣與經驗值已在遊戲內保存，未來商城可用來兌換或升級將軍能力。
- 劉備預留四個技能素材：仁德治世、昭烈之志、以德服人、匡扶漢室。
- 劉備戰鬥動作素材：仁德治療、鼓舞士氣、雙股劍攻擊、守護之力，可供後續依攻擊/防守/技能狀態切換圖片。

Reserved asset manifest: `future-generals/future-generals.json`.
