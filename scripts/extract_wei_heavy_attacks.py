#!/usr/bin/env python3
"""Extract aligned transparent Dian Wei and Xu Chu battle animations.

The supplied 4x2 JPEG sprite sheets contain a baked checkerboard. This script
removes that background, keeps only the connected foreground belonging to each
cell (discarding neighbouring-cell spill), and places every frame at one fixed
source scale and foot baseline on a 1024x1024 transparent canvas.
"""
from __future__ import annotations

import hashlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "assets/characters/future-generals/wei-season2"
CANVAS = 1024
BASELINE = 920
SOURCE_SCALE = 1.95
ALPHA_THRESHOLD = 128
EXPECTED = {
    "dian-wei": "8c8a2f5ac02362b4bc8d7603a53da15c8fbf1698215cc46f3372d5eb8d1a850e",
    "xu-chu": "a18c657dae311d5d101bd4c2209ab850e6b0ac9c908070a85a69a186191b32aa",
    "zhang-liao": "8e8b28c6c73e4e1a577c61e04abb15c1e0e3ca2b82762345aea0e69b0b484725",
    "xu-huang": "f3d39bb5ac7bfea59094d9f85ada7bfa363423ef5e2a5aec68922e999ba7be73",
}
FRAME_BOUNDS = {
    "xu-chu": {2: (-65, 20)},
    "xu-huang": {2: (-20, 0)},
}
LEFT_EDGE_CLEAR = {
    ("dian-wei", 6): 30,
    ("xu-chu", 7): 30,
    ("zhang-liao", 3): 30,
    ("zhang-liao", 5): 30,
    ("xu-huang", 3): 30,
    ("xu-huang", 5): 30,
}
RIGHT_EDGE_FADE = {
    ("xu-chu", 2),
    ("zhang-liao", 2),
    ("zhang-liao", 4),
    ("xu-huang", 2),
    ("xu-huang", 4),
}
TOP_EDGE_CLEAR = {("xu-huang", 6): 36}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checkerboard_alpha(crop: Image.Image) -> Image.Image:
    """Return an alpha mask that removes the neutral bright JPEG checkerboard."""
    rgb = np.asarray(crop, dtype=np.float32) / 255.0
    high = rgb.max(axis=2)
    low = rgb.min(axis=2)
    saturation = (high - low) / np.maximum(high, 0.001)
    luminance = rgb.mean(axis=2)

    definite_foreground = ((saturation > 0.13) | (luminance < 0.67)).astype(np.uint8) * 255
    protected = np.asarray(
        Image.fromarray(definite_foreground).filter(ImageFilter.MaxFilter(11))
    ) > 0
    candidate = (saturation < 0.18) & (luminance > 0.66) & ~protected

    height, width = candidate.shape
    seen = np.zeros((height, width), dtype=bool)
    background = np.zeros((height, width), dtype=bool)
    for y in range(height):
        for x in range(width):
            if not candidate[y, x] or seen[y, x]:
                continue
            queue = [(y, x)]
            seen[y, x] = True
            component: list[tuple[int, int]] = []
            touches_edge = False
            for yy, xx in queue:
                component.append((yy, xx))
                touches_edge |= yy == 0 or xx == 0 or yy == height - 1 or xx == width - 1
                for ny, nx in ((yy - 1, xx), (yy + 1, xx), (yy, xx - 1), (yy, xx + 1)):
                    if 0 <= ny < height and 0 <= nx < width and candidate[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))
            if touches_edge or len(component) > 120:
                yy, xx = zip(*component)
                background[yy, xx] = True

    alpha = (~background).astype(np.uint8) * 255
    return Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.45))


def keep_main_component(image: Image.Image) -> Image.Image:
    """Discard foreground pieces spilled into this cell by neighbouring frames."""
    alpha = np.asarray(image.getchannel("A")) > ALPHA_THRESHOLD
    height, width = alpha.shape
    seen = np.zeros_like(alpha)
    components: list[list[tuple[int, int]]] = []
    for y in range(height):
        for x in range(width):
            if not alpha[y, x] or seen[y, x]:
                continue
            queue = [(y, x)]
            seen[y, x] = True
            component: list[tuple[int, int]] = []
            for yy, xx in queue:
                component.append((yy, xx))
                for ny, nx in ((yy - 1, xx), (yy + 1, xx), (yy, xx - 1), (yy, xx + 1)):
                    if 0 <= ny < height and 0 <= nx < width and alpha[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))
            components.append(component)
    if not components:
        raise RuntimeError("No foreground component found")
    main = max(components, key=len)
    mask = np.zeros((height, width), dtype=np.uint8)
    yy, xx = zip(*main)
    mask[yy, xx] = 255
    mask = np.asarray(Image.fromarray(mask).filter(ImageFilter.MaxFilter(5)))
    rgba = np.asarray(image).copy()
    rgba[:, :, 3] = np.minimum(rgba[:, :, 3], mask)
    return Image.fromarray(rgba)


def clean_edge_spill(slug: str, index: int, image: Image.Image) -> Image.Image:
    """Remove known neighbouring-frame spill without cropping the character."""
    rgba = np.asarray(image).copy()
    left = LEFT_EDGE_CLEAR.get((slug, index), 0)
    top = TOP_EDGE_CLEAR.get((slug, index), 0)
    if left:
        rgba[:, :left, 3] = 0
        width = min(40, rgba.shape[1] - left)
        fade = np.linspace(0.0, 1.0, width, dtype=np.float32)
        rgba[:, left:left + width, 3] = np.rint(rgba[:, left:left + width, 3] * fade).astype(np.uint8)
    if top:
        rgba[:top, :, 3] = 0
        height = min(40, rgba.shape[0] - top)
        fade = np.linspace(0.0, 1.0, height, dtype=np.float32)[:, None]
        rgba[top:top + height, :, 3] = np.rint(rgba[top:top + height, :, 3] * fade).astype(np.uint8)
    if (slug, index) == ("xu-huang", 2):
        height = min(250, rgba.shape[0])
        width = min(20, rgba.shape[1])
        rgba[:height, :width, 3] = 0
    if (slug, index) in RIGHT_EDGE_FADE:
        width = min(40, rgba.shape[1])
        fade = np.linspace(1.0, 0.0, width, dtype=np.float32)
        rgba[:, -width:, 3] = np.rint(rgba[:, -width:, 3] * fade).astype(np.uint8)
    return Image.fromarray(rgba)


def align_frame(frame: Image.Image) -> Image.Image:
    def opaque(value: int) -> int:
        return 255 if value > 8 else 0

    bbox = frame.getchannel("A").point(opaque).getbbox()
    if not bbox:
        raise RuntimeError("Frame became empty")
    foreground = frame.crop(bbox)
    size = (round(foreground.width * SOURCE_SCALE), round(foreground.height * SOURCE_SCALE))
    foreground = foreground.resize(size, Image.Resampling.LANCZOS)
    if foreground.width > CANVAS or foreground.height > BASELINE:
        raise RuntimeError(f"Aligned foreground does not fit canvas: {foreground.size}")
    canvas = Image.new("RGBA", (CANVAS, CANVAS))
    canvas.alpha_composite(foreground, ((CANVAS - foreground.width) // 2, BASELINE - foreground.height))
    return canvas


def extract(slug: str) -> None:
    out = ASSET_ROOT / slug
    source = out / "source-attack-sheet.jpg"
    if sha256(source) != EXPECTED[slug]:
        raise RuntimeError(f"Unexpected source image for {slug}")
    sheet = Image.open(source).convert("RGB")
    width, height = sheet.size
    xs = [round(index * width / 4) for index in range(5)]
    ys = [0, round(height / 2), height]
    frames: list[Image.Image] = []
    for index in range(8):
        row, column = divmod(index, 4)
        left, right = FRAME_BOUNDS.get(slug, {}).get(index, (0, 0))
        crop = sheet.crop(
            (
                max(0, xs[column] + left),
                ys[row],
                min(width, xs[column + 1] + right),
                ys[row + 1],
            )
        )
        rgba = crop.convert("RGBA")
        rgba.putalpha(checkerboard_alpha(crop))
        frame = align_frame(clean_edge_spill(slug, index, keep_main_component(rgba)))
        frame.save(out / f"attack-{index:02d}.webp", "WEBP", lossless=True, method=6)
        frames.append(frame)
    frames[0].save(out / "idle.webp", "WEBP", lossless=True, method=6)
    print(f"{slug}: wrote idle.webp and 8 aligned attack frames")


if __name__ == "__main__":
    for character in EXPECTED:
        extract(character)
