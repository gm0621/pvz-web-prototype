# 第二章武將素材

使用 imagegen skill 的 built-in image_gen 模式；原始生成圖保留於工具輸出位置，專案內為複本。立繪參考鄧茂畫風，三格動作依各自立繪生成。韓旌第一版動作有不透明白底，另以 image_gen 去背，使用 alpha 修正版。攻擊圖排列為 3 欄 × 1 列：待機、蓄力、出手；不以裁切修掉兵器。

## han-jing 立繪

Use case: stylized-concept. Single full-body chibi Three Kingdoms Yellow Turban enemy general, transparent alpha background. Match reference polished painted outlines and big head proportions but completely distinct identity. Face RIGHT, three-quarter ready stance, entire weapons and body in square image with generous clear margin. Clearly yellow headcloth and rebel styling, no imperial crown, no text, no scenery, no platform. HAN JING, disciplined stern thin mustached spear captain, yellow wrapped headcloth, dark teal patched lamellar vest, tall spear with yellow triangular command pennant attached below its point, holds pole diagonally with whole spear visible. One yellow back banner without text. No fur, no sword.

## jiao-lu 立繪

Use case: stylized-concept. Single full-body chibi Three Kingdoms Yellow Turban enemy general, transparent alpha background. Match reference polished painted outlines and big head proportions but completely distinct identity. Face RIGHT, three-quarter ready stance, entire weapons and body in square image with generous clear margin. Clearly yellow headcloth and rebel styling, no imperial crown, no text, no scenery, no platform. JIAO LU, fierce stocky fire raider, bald head tied with short yellow headband, soot-black face streaks, singed ochre sleeveless jacket and dark leather apron, two short broad blades with orange hot glowing edges, red cloth around wrists. Two small unlit oil gourds at belt. No long spear, no cape, no shield. Feet and both blades visible.

## du-heng 立繪

Use case: stylized-concept. Single full-body chibi Three Kingdoms Yellow Turban enemy general, transparent alpha background. Match reference polished painted outlines and big head proportions but completely distinct identity. Face RIGHT, three-quarter ready stance, entire weapons and body in square image with generous clear margin. Clearly yellow headcloth and rebel styling, no imperial crown, no text, no scenery, no platform. DU HENG, slim masked ambush captain, yellow headwrap, lower face covered by dark indigo scarf, sleeveless gray-blue leather jacket, high cloth boots, wields a distinctive long hooked sickle spear horizontally angled with full curved hook visible. Agile low stance, cold watchful eyes. No armor helmet, no shield, no fire.

## han-jing 動作

Create a transparent horizontal 3:1 sprite sheet with EXACTLY THREE equally sized square cells in one row. Same chibi character as reference, facing RIGHT. Each cell contains entire body AND entire weapon with 15% empty margin, consistent scale and feet baseline. No text, no lines or background. Three clearly different anatomically coherent poses: guard ready; draw weapon back for attack; strong forward attack. Banner spear: ready, draw spear back, thrust spear forward. Preserve exact costume, face and weapon.

## jiao-lu 動作

Create a transparent horizontal 3:1 sprite sheet with EXACTLY THREE equally sized square cells in one row. Same chibi character as reference, facing RIGHT. Each cell contains entire body AND entire weapon with 15% empty margin, consistent scale and feet baseline. No text, no lines or background. Three clearly different anatomically coherent poses: guard ready; draw weapon back for attack; strong forward attack. Two fiery short blades: ready, arms draw back, forward crossed slash. Preserve exact costume, face and weapon.

## du-heng 動作

Create a transparent horizontal 3:1 sprite sheet with EXACTLY THREE equally sized square cells in one row. Same chibi character as reference, facing RIGHT. Each cell contains entire body AND entire weapon with 15% empty margin, consistent scale and feet baseline. No text, no lines or background. Three clearly different anatomically coherent poses: guard ready; draw weapon back for attack; strong forward attack. Hooked spear: ready, pull back spear, reach and hook forward. Preserve exact costume, face and weapon.

## zhang-jiao 動作

Create a transparent horizontal 3:1 sprite sheet with EXACTLY THREE equally sized square cells in one row. Same chibi character as reference, facing RIGHT. Each cell contains entire body AND entire weapon with 15% empty margin, consistent scale and feet baseline. No text, no lines or background. Three clearly different anatomically coherent poses: guard ready; draw weapon back for attack; strong forward attack. Taoist staff and talisman: ready, lift staff, cast lightning forward. Preserve exact costume, face and weapon.

## 韓旌去背修正

Remove the white paper background and all ground shadows from this THREE CELL horizontal 3:1 sprite sheet. Output true transparent alpha background. Preserve exact positions of all three complete characters, their spear tips and cloth banners, exact same 3:1 dimensions and layout. Do not add backdrop, checkerboard or solid white. Keep all painted character details unchanged.

