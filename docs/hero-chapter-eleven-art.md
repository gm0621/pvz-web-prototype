# 第十一章人物圖集

使用內建 imagegen，非 CLI。專案素材 `hero/assets/portraits/chapter-eleven.png`，1536×1024、3×2；由左至右、由上至下為馬超、韓遂、許褚、徐晃、曹丕，最後格空白。遊戲用 atlasRows=2。人工確認五格人物與裁切；造型為遊戲想像，非歷史肖像。

生成提示：

> Create one production-ready sprite atlas for a child-friendly Three Kingdoms historical strategy game. Landscape 1536x1024, EXACTLY 3 columns by 2 rows of equally sized square portrait cells, no gaps, no borders, no text or watermark. Warm pale parchment background in every cell, centered bust occupying 80%, fully contained. Polished painterly chibi illustrations, expressive eyes, crisp dark outlines, richly shaded late Han Chinese costume, approachable dignified characters, distinct faces readable at tiny icon size. Reading order: top-left Ma Chao 馬超, young clean-shaven determined warrior in silver armor with white helmet and blue plume; top-middle Han Sui 韓遂, older weathered commander with grey moustache and beard, rust red scarf and bronze helmet; top-right Xu Chu 許褚, broad muscular friendly stern guard with short black beard, dark blue armor and ochre headcloth; bottom-left Xu Huang 徐晃, disciplined middle-aged warrior with neat moustache, green headwrap and steel armor; bottom-middle Cao Pi 曹丕, young refined noble with long narrow face, indigo robes with gold trim and dark traditional court cap, small document held at chest; bottom-right blank parchment, no person. All imaginative game designs, not historical likenesses. No weapons crossing cell edges, no duplicate characters.

初版曹丕冠帽過於帝王化，內建 imagegen 編修後採用：

> Edit only the headwear of the bottom-middle young scholar portrait Cao Pi. Replace the tall gold decorated crown and all hanging beads with a SIMPLE SHORT BLACK CLOTH SCHOLAR CAP, modest late Han non-imperial headwear with no gold, no hanging beads, no tall crown. This character is not an emperor at this point. Keep his face, expression, hairstyle, indigo robe, document, and all other characters and their exact grid cells unchanged. Preserve exact 3 by 2 layout, landscape dimensions and blank bottom right cell.
