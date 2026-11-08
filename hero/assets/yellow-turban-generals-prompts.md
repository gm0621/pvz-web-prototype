# 張梁、張寶立繪

2026-11-08，以 imagegen built-in 產生原創透明 2D 素材。用於長社關卡的遊戲改編，不作史實肖像。保留原生 alpha，沒有後製去背。

- `zhang-liang.png`：full-body chibi Three Kingdoms Yellow Turban general Zhang Liang; large expressive head, stocky adult warrior, yellow headscarf, ochre armor, ivory scarf, brown beard, bronze ringed dao and wind banner, jade wind curls, left three-quarter, isolated transparent background, no text.
- `zhang-bao.png`：full-body chibi Yellow Turban sorcerer general Zhang Bao; lean adult, pointed black beard, yellow Taoist headwrap, indigo/teal robes and gold trim, bronze staff with rain bell and yellow talismans, blue rain droplets, left three-quarter, transparent background.

呼風、喚雨與二張在長社掩護撤軍的實際交戰為遊戲補寫；二人戰敗撤走，不在此關斬殺。

## 張梁、張寶三格攻擊動作

2026-11-08，使用 imagegen built-in，以既有兩張立繪為角色與畫風參考，新增 `attacks/zhang-liang.png`、`attacks/zhang-bao.png`，均為 2172 × 724、三欄一列透明 PNG。張梁依序為舉刀蓄力、向前斬落、收刀；張寶依序為鈴杖蓄力、揮杖施符、收杖。程式依 2.5 秒技能預警的戰鬥時間切格，暫停時不推進。

- 張梁提示重點：保留黃巾、褐金甲、白巾、環首彎刀、風旗與綠色風紋；三格同尺寸、同腳底線、武器不跨格。初稿帶灰白底，另以 imagegen 精準去背，保留動作與構圖。
- 張寶提示重點：保留黃巾、靛青道袍、鈴杖、符紙與少量雨紋；三格為真正手臂／杖角度變化，不用整張立繪旋轉假裝揮擊。
- 共通限制：水平 3:1、每格完整全身、朝左、真透明 alpha、無文字／分隔線／場景／地面陰影／跨格武器。
