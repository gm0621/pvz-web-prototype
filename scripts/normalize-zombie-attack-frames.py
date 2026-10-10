#!/usr/bin/env python3
"""Normalize first-season zombie battle sprites without changing presentation art.

The generated attack sheets use one consistent character scale, but their 1024px
canvases have different transparent margins from the roster portraits. This tool:

* keeps the roster portraits untouched for cards and guides;
* derives a battle-only idle sprite at the recovery frame's visible height;
* recenters all four source attack frames without rescaling them; and
* pins idle and attack sprites to the same foot baseline.

Source attack frames are preserved under each unit's source-frames directory.
"""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANVAS = 1024
FOOT_BASELINE = 48
ALPHA_THRESHOLD = 8

UNITS = {
    "normal": "assets/characters/zombie-army/zombie-roster-v2/red-band-grunt.webp",
    "cone": "assets/characters/zombie-army/zombie-roster-v2/iron-helmet-grunt.webp",
    "bucket": "assets/characters/zombie-army/zombie-roster-v2/giant-mace-brute.webp",
    "football": "assets/characters/zombie-army/zombie-roster-v2/white-haired-king.webp",
    "jester": "assets/characters/zombie-army/zombie-roster-v2/bell-jester.webp",
    "bombJester": "assets/characters/zombie-army/zombie-roster-v2/bomb-carrier.webp",
}


def dimensions(path: Path) -> tuple[int, int]:
    output = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "csv=p=0:s=x",
            str(path),
        ],
        text=True,
    ).strip()
    width, height = output.split("x")
    return int(width), int(height)


def alpha_bounds(path: Path) -> tuple[int, int, int, int]:
    width, height = dimensions(path)
    rgba = subprocess.check_output(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "rawvideo", "-pix_fmt", "rgba", "-"]
    )
    left, top, right, bottom = width, height, -1, -1
    for y in range(height):
        row = y * width * 4
        for x in range(width):
            if rgba[row + x * 4 + 3] > ALPHA_THRESHOLD:
                left = min(left, x)
                top = min(top, y)
                right = max(right, x)
                bottom = max(bottom, y)
    if right < left or bottom < top:
        raise RuntimeError(f"No visible pixels in {path}")
    return left, top, right, bottom


def normalize(source: Path, destination: Path, target_height: int | None = None) -> None:
    left, top, right, bottom = alpha_bounds(source)
    width = right - left + 1
    height = bottom - top + 1
    output_width, output_height = width, height
    filters = [f"crop={width}:{height}:{left}:{top}"]
    if target_height is not None:
        output_height = target_height
        output_width = max(1, round(width * target_height / height))
        filters.append(f"scale={output_width}:{output_height}:flags=lanczos")
    x = (CANVAS - output_width) // 2
    y = CANVAS - FOOT_BASELINE - output_height
    if x < 0 or y < 0:
        raise RuntimeError(f"Normalized sprite would clip: {source} -> {output_width}x{output_height}")
    filters.extend(["format=rgba", f"pad={CANVAS}:{CANVAS}:{x}:{y}:color=0x00000000"])
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".png") as intermediate:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-v",
                "error",
                "-i",
                str(source),
                "-vf",
                ",".join(filters),
                "-frames:v",
                "1",
                intermediate.name,
            ],
            check=True,
        )
        subprocess.run(
            ["cwebp", "-quiet", "-lossless", "-q", "100", "-m", "6", intermediate.name, "-o", str(destination)],
            check=True,
        )


def main() -> None:
    for key, idle_relative in UNITS.items():
        animation_dir = ROOT / "assets/characters/zombie-animations" / key
        source_dir = animation_dir / "source-frames"
        recovery_source = source_dir / "attack-03.webp"
        _, recovery_top, _, recovery_bottom = alpha_bounds(recovery_source)
        recovery_height = recovery_bottom - recovery_top + 1
        normalize(ROOT / idle_relative, animation_dir / "idle-battle.webp", recovery_height)
        for index in range(4):
            normalize(source_dir / f"attack-{index:02d}.webp", animation_dir / f"attack-{index:02d}.webp")
        print(f"normalized {key}: recovery height {recovery_height}px, foot baseline {FOOT_BASELINE}px")


if __name__ == "__main__":
    main()
