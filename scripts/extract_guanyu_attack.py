#!/usr/bin/env python3
"""Create aligned Guan Yu attack frames from the accepted transparent sheet."""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
import hashlib


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/characters/future-generals/guanyu"
SOURCE = OUT / "source-attack-sheet.png"
IDLE_SOURCE = ROOT / "assets/characters/guanyu-fire-general.webp"
EXPECTED_SHA256 = "08f04e5090bd82caebb6ab498e97df8436e43e78f7f053f2004a75e79821b2e5"
BOUNDS = [
    (0, 92, 432, 478),
    (438, 0, 874, 478),
    (872, 0, 1345, 478),
    (1338, 94, 1774, 482),
    (0, 474, 466, 887),
    (446, 480, 918, 887),
    (910, 480, 1350, 887),
    (1340, 476, 1774, 887),
]
CANVAS = 1024
SCALE = 1.72
BASELINE = 920
IDLE_VISIBLE_HEIGHT = 620


def normalize_idle():
    """Match the idle character's visible body scale and foot line to the slash frames."""
    image = Image.open(IDLE_SOURCE).convert("RGBA")
    visible_box = image.getchannel("A").getbbox()
    if not visible_box:
        raise SystemExit("Empty Guan Yu idle source")
    visible = image.crop(visible_box)
    ratio = IDLE_VISIBLE_HEIGHT / visible.height
    visible = visible.resize((round(visible.width * ratio), IDLE_VISIBLE_HEIGHT), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(visible, ((CANVAS - visible.width) // 2, BASELINE - visible.height))
    canvas.save(OUT / "idle.webp", "WEBP", lossless=True, method=6)


def main():
    raw = SOURCE.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_SHA256:
        raise SystemExit(f"Unexpected source SHA-256: {digest}")
    image = Image.open(SOURCE).convert("RGBA")
    if image.size != (1774, 887):
        raise SystemExit(f"Unexpected source dimensions: {image.size}")
    OUT.mkdir(parents=True, exist_ok=True)
    normalize_idle()

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
    print(f"generated idle and {len(BOUNDS)} attack frames in {OUT}")


if __name__ == "__main__":
    main()
