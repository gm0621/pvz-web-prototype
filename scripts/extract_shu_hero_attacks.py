#!/usr/bin/env python3
"""Build aligned 8-frame battle animations for the six first-season Shu heroes.

Each accepted source is a transparent 4x2 sheet.  The source artwork does not
use one shared horizontal gutter, so row and column separators are detected
from low-alpha valleys instead of blindly slicing equal rectangles.
"""
from pathlib import Path
from collections import deque

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "assets/characters/future-generals"
CANVAS_SIZE = 1024
BASELINE = 970
FRAME_SCALE = 2.0
ALPHA_THRESHOLD = 8

HEROES = {
    "machao": ASSET_ROOT / "pierce-machao.webp",
    "huangzhong": ASSET_ROOT / "hundred-arrows-huangzhong.webp",
    "zhangfei": ASSET_ROOT / "god-zhangfei.webp",
    "liubei": ASSET_ROOT / "liubei/liubei-main.webp",
    "kongming": ASSET_ROOT / "war-god-kongming.webp",
    "pangtong": ASSET_ROOT / "fire-god-pangtong.webp",
}

# Ma Chao's frame 5 wind trail overlaps frame 6 horizontally in the accepted
# sheet. Frame 5 therefore samples farther right; frame 6 keeps the normal
# start and removes the detached edge component left by frame 5.


def nearest_valley(values, center, radius):
    start = max(1, center - radius)
    end = min(len(values) - 1, center + radius + 1)
    return min(range(start, end), key=lambda index: (values[index], abs(index - center)))


def visible_box(image):
    alpha = image.getchannel("A").point(
        [255 if value > ALPHA_THRESHOLD else 0 for value in range(256)]
    )
    return alpha.getbbox()


def paste_aligned(crop, scale=FRAME_SCALE):
    width = max(1, round(crop.width * scale))
    height = max(1, round(crop.height * scale))
    resized = crop.resize((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    x = (CANVAS_SIZE - width) // 2
    y = BASELINE - height
    canvas.alpha_composite(resized, (x, y))
    return canvas


def prune_edge_fragments(image, max_edge_fraction=0.12):
    """Remove small pieces of a neighbouring frame that cross a sheet gutter."""
    pixels = np.asarray(image).copy()
    mask = pixels[:, :, 3] > ALPHA_THRESHOLD
    total = int(mask.sum())
    visited = np.zeros(mask.shape, dtype=bool)
    height, width = mask.shape
    boundary = [(0, x) for x in range(width)] + [(height - 1, x) for x in range(width)]
    boundary += [(y, 0) for y in range(height)] + [(y, width - 1) for y in range(height)]
    for start_y, start_x in boundary:
        if not mask[start_y, start_x] or visited[start_y, start_x]:
            continue
        queue = deque([(start_y, start_x)])
        visited[start_y, start_x] = True
        component = []
        while queue:
            y, x = queue.popleft()
            component.append((y, x))
            for yy in range(max(0, y - 1), min(height, y + 2)):
                for xx in range(max(0, x - 1), min(width, x + 2)):
                    if mask[yy, xx] and not visited[yy, xx]:
                        visited[yy, xx] = True
                        queue.append((yy, xx))
        if len(component) < total * max_edge_fraction:
            ys, xs = zip(*component)
            pixels[np.asarray(ys), np.asarray(xs), 3] = 0
    return Image.fromarray(pixels, "RGBA")


def split_sheet(sheet, key):
    alpha = np.asarray(sheet.getchannel("A")) > ALPHA_THRESHOLD
    height, width = alpha.shape
    split_y = nearest_valley(alpha.sum(axis=1), height // 2, 70)
    frames = []
    for row_index, (top, bottom) in enumerate(((0, split_y), (split_y, height))):
        row_projection = alpha[top:bottom].sum(axis=0)
        cuts = [0]
        for quarter in (1, 2, 3):
            cuts.append(nearest_valley(row_projection, round(width * quarter / 4), 70))
        cuts.append(width)
        if cuts != sorted(cuts) or len(set(cuts)) != 5:
            raise RuntimeError(f"Invalid detected column cuts: {cuts}")
        for column_index, (left, right) in enumerate(zip(cuts, cuts[1:])):
            frame_index = row_index * 4 + column_index
            if key == "machao" and frame_index == 5:
                right = max(right, 968)
            edge_fraction = 0.30 if key == "machao" and frame_index == 6 else 0.12
            cell = prune_edge_fragments(
                sheet.crop((left, top, right, bottom)), edge_fraction
            )
            if key == "machao" and frame_index == 6:
                pixels = np.asarray(cell).copy()
                green_overlap = (
                    (pixels[:, :45, 1] > pixels[:, :45, 0] * 1.15)
                    & (pixels[:, :45, 1] > pixels[:, :45, 2] * 1.05)
                )
                pixels[:, :20, 3] = 0
                pixels[:, :45, 3][green_overlap] = 0
                cell = Image.fromarray(pixels, "RGBA")
            box = visible_box(cell)
            if not box:
                raise RuntimeError("Detected an empty animation cell")
            frames.append(cell.crop(box))
    return frames


def build_idle(idle_source, output_dir, target_height):
    image = Image.open(idle_source).convert("RGBA")
    box = visible_box(image)
    if not box:
        raise RuntimeError(f"Idle source has no visible pixels: {idle_source}")
    crop = image.crop(box)
    scale = target_height / crop.height
    width = max(1, round(crop.width * scale))
    resized = crop.resize((width, target_height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((CANVAS_SIZE - width) // 2, BASELINE - target_height))
    canvas.save(output_dir / "idle.webp", "WEBP", lossless=True, method=6)


def main():
    for key, idle_source in HEROES.items():
        output_dir = ASSET_ROOT / key
        source = output_dir / "source-attack-sheet.png"
        sheet = Image.open(source).convert("RGBA")
        frames = split_sheet(sheet, key)
        rendered = []
        for index, crop in enumerate(frames):
            frame = paste_aligned(crop)
            frame.save(output_dir / f"attack-{index:02d}.webp", "WEBP", lossless=True, method=6)
            rendered.append(frame)
        edge_heights = []
        for frame in (rendered[0], rendered[-1]):
            box = visible_box(frame)
            edge_heights.append(box[3] - box[1])
        target_height = round(sum(edge_heights) / len(edge_heights))
        build_idle(idle_source, output_dir, target_height)
        print(f"{key}: 8 frames, idle visible height {target_height}px")


if __name__ == "__main__":
    main()
