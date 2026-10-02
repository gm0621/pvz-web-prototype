#!/usr/bin/env python3
"""Create aligned Zhao Yun spear-attack frames from the accepted transparent sheet."""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
import hashlib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/characters/future-generals/zhaoyun"
SOURCE = OUT / "source-attack-sheet.png"
EXPECTED_SHA256 = "b48ee013865603707a9809704e825afeb29f15bebff8b2f5212273de6b905736"
BOUNDS = [
    (0, 55, 448, 475),
    (442, 0, 894, 478),
    (884, 0, 1338, 478),
    (1325, 95, 1774, 478),
    (0, 465, 458, 882),
    (446, 468, 938, 887),
    (902, 478, 1350, 887),
    (1332, 475, 1774, 887),
]
CANVAS = 1024
BASELINE = 920
SCALE = 1.72


def main():
    raw = SOURCE.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_SHA256:
        raise SystemExit(f"Unexpected source SHA-256: {digest}")
    image = Image.open(SOURCE).convert("RGBA")
    if image.size != (1774, 887):
        raise SystemExit(f"Unexpected source dimensions: {image.size}")
    OUT.mkdir(parents=True, exist_ok=True)
    alpha = image.getchannel("A")
    binary = alpha.point([255 if value > 8 else 0 for value in range(256)])
    for index, box in enumerate(BOUNDS):
        left, top, right, bottom = box
        candidates = [(x, y) for y in range(top, bottom, 8) for x in range(left, right, 8) if binary.getpixel((x, y))]
        if not candidates:
            raise SystemExit(f"No visible pixels for frame {index}")
        center = ((left + right) / 2, (top + bottom) / 2)
        seed = min(candidates, key=lambda p: (p[0] - center[0]) ** 2 + (p[1] - center[1]) ** 2)
        filled = binary.copy()
        ImageDraw.floodfill(filled, seed, 128, thresh=0)
        component = filled.point(lambda value: 255 if value == 128 else 0)
        isolated = image.copy()
        isolated.putalpha(ImageChops.multiply(alpha, component))
        component_box = isolated.getbbox()
        if not component_box:
            raise SystemExit(f"Empty connected component for frame {index}")
        frame = isolated.crop(component_box)
        frame = frame.resize((round(frame.width * SCALE), round(frame.height * SCALE)), Image.Resampling.LANCZOS)
        if frame.width > CANVAS or frame.height > CANVAS:
            ratio = min(CANVAS / frame.width, CANVAS / frame.height) * .96
            frame = frame.resize((round(frame.width * ratio), round(frame.height * ratio)), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        canvas.alpha_composite(frame, ((CANVAS - frame.width) // 2, BASELINE - frame.height))
        canvas.save(OUT / f"attack-{index:02d}.webp", "WEBP", lossless=True, method=6)
    print(f"generated {len(BOUNDS)} frames in {OUT}")


if __name__ == "__main__":
    main()
