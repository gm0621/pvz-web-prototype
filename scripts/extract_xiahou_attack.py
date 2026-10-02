#!/usr/bin/env python3
"""Create aligned Xiahou Dun attack frames from the accepted transparent sheet."""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
import hashlib
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / ".hermes/image_cache/img_e6e924cdb809.png"
OUT = ROOT / "assets/characters/future-generals/wei-season2/xiahou-dun"
EXPECTED_SHA256 = "84724606b37fb72e5ca276589bd8aabfc5d63f0b240933278ac41710fdf7981a"
# Connected visible-component bounds, ordered top-left to bottom-right.
BOUNDS = [
    (12, 90, 436, 468),
    (476, 10, 888, 468),
    (890, 8, 1346, 468),
    (1364, 112, 1760, 468),
    (16, 474, 502, 850),
    (494, 494, 962, 850),
    (936, 484, 1350, 850),
    (1368, 492, 1772, 850),
]
CANVAS = 1024
SCALE = 1.8
BASELINE = 900


def main():
    raw = SOURCE.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_SHA256:
        raise SystemExit(f"Unexpected source SHA-256: {digest}")
    image = Image.open(SOURCE).convert("RGBA")
    if image.size != (1774, 887):
        raise SystemExit(f"Unexpected source dimensions: {image.size}")
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE, OUT / "source-attack-sheet.png")
    alpha = image.getchannel("A")
    binary = alpha.point([255 if value > 8 else 0 for value in range(256)])
    for index, box in enumerate(BOUNDS):
        # Neighboring sword trails overlap as rectangles, so isolate the connected
        # character before normalizing instead of copying pixels from another frame.
        left, top, right, bottom = box
        candidates = [
            (x, y)
            for y in range(top, bottom, 8)
            for x in range(left, right, 8)
            if binary.getpixel((x, y))
        ]
        if not candidates:
            raise SystemExit(f"No visible pixels for frame {index}")
        center = ((left + right) / 2, (top + bottom) / 2)
        seed = min(candidates, key=lambda point: (point[0] - center[0]) ** 2 + (point[1] - center[1]) ** 2)
        filled = binary.copy()
        ImageDraw.floodfill(filled, seed, 128, thresh=0)
        component = filled.point(lambda value: 255 if value == 128 else 0)
        isolated = image.copy()
        isolated.putalpha(ImageChops.multiply(alpha, component))
        component_box = isolated.getbbox()
        if not component_box:
            raise SystemExit(f"Empty connected component for frame {index}")
        frame = isolated.crop(component_box)
        frame = frame.resize(
            (round(frame.width * SCALE), round(frame.height * SCALE)),
            Image.Resampling.LANCZOS,
        )
        canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        x = (CANVAS - frame.width) // 2
        y = BASELINE - frame.height
        canvas.alpha_composite(frame, (x, y))
        canvas.save(OUT / f"attack-{index:02d}.webp", "WEBP", lossless=True, method=6)
    print(f"generated {len(BOUNDS)} frames in {OUT}")


if __name__ == "__main__":
    main()
