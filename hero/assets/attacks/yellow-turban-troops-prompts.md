# 黃巾小兵揮擊動作

產製方式：imagegen skill，built-in `image_gen`，透明背景；沒有使用 CLI fallback。

最終素材：[yellow-turban-troops.png](yellow-turban-troops.png)，1536 × 1024，三欄兩列；第一列刀賊、第二列盾賊，均向左。每列三格為舉刀蓄力、揮刀命中、收招待機。程式依戰鬥時間切格，圖中沒有獨立動畫。參考角色為既有 `../yellow-turban-raider.png` 與 `../yellow-turban-shield.png`。

初稿部分武器跨格，第二次生成縮小並保留透明邊距。瀏覽器 canvas 驗證透明角落、分格邊界 alpha；預覽的深色襯底不會帶進遊戲。

## 初稿提示

Use case: stylized-concept. Production game sprite sheet on REAL TRANSPARENT background, 3 equally-sized columns by 2 equally-sized rows, landscape 3:2 aspect ratio. Reference images are character identity/style references. Top row: the slim yellow-turban raider from image 1. Bottom row: the stocky yellow-turban shield soldier from image 2, keep his wooden round shield. All six full-body figures face LEFT, enemy advances to left. Each row shows three distinct hand-drawn attack poses: column 1 wind-up, blade raised high behind shoulder; column 2 lunging swing, sword arm extended and blade sweeping LEFT at waist level; column 3 recovery, sword down at front, knees bent. Maintain identical character scale, head size and foot baseline within each equal square cell. Fit whole weapons, turbans and feet inside each cell with generous 10% clear padding, no touching neighboring cells. Preserve brown ragged clothes, yellow turban, face and charming polished chibi illustrated style. No scenery, no text, no labels, no borders, no shadows painted onto ground, no checkerboard, no motion streaks; alpha transparency everywhere outside figures. Exact evenly spaced 3 columns x 2 rows usable as CSS background sprite sheet.

## 最終修正提示

Edit this sprite sheet for production. Remove ALL brown/black background and glow completely, output genuinely transparent alpha pixels outside characters, not a colored backdrop. Keep the exact same six character poses and style. It must be precisely 3 equal square columns by 2 equal square rows, 1536x1024 if possible. Shrink each figure about 20 percent and center each entire figure including weapon WITHIN its own equal cell: top row cells x0-512,512-1024,1024-1536 y0-512; bottom row same columns y512-1024. All swords must stay completely inside their own cell with at least 40px padding. Especially top middle and bottom middle swords must shift right so they do NOT cross column border. Feet at same relative baseline per row. No text or separators, no shadow or background whatsoever. Transparent game sprite sheet.
