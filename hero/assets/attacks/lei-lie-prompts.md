# 雷烈二打一揮斧動作

2026-11-08，imagegen built-in，使用既有 `../lei-lie.png` 角色參考。三欄一列透明圖，原生 2172×724。面向右，蓄斧、斬下、收招三個不同手臂與兵器姿勢。

首版：scarred stocky bearded Yellow Turban bandit, yellow headband, ragged red cape, dark leather armour, crescent battle axe; 3 equal square frames, windup, downward swing, recovery; transparent alpha, no labels.

修訂：首格斧頭貼邊，要求重建完整斧刃、各格內容縮至內側 78%、共同腳底基準，保留獨立透明邊界及較短刀光。使用修訂版，未裁切或以程式去背。

單挑反擊起手後 0～0.45 秒蓄力、0.45～0.85 秒揮斧、其後收招；原引擎在 0.6 秒命中。影格來自 `duel.elapsed`，暫停凍結。整張立繪不再旋轉模擬揮擊；倒地轉向保留。
