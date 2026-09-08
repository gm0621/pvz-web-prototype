from collections import deque
from pathlib import Path
from typing import Any, cast

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets/characters/source-originals/zombie-roster-20260907"
OUTPUT_DIR = ROOT / "assets/characters/zombie-army/zombie-roster-v2"

ROSTER = [
    ("01-qin-emperor.png", "qin-emperor.webp", False, False),
    ("02-red-band-grunt.png", "red-band-grunt.webp", False, False),
    ("03-iron-helmet-grunt.png", "iron-helmet-grunt.webp", False, True),
    ("04-giant-mace-brute.png", "giant-mace-brute.webp", False, True),
    ("05-boulder-thrower.png", "boulder-thrower.webp", False, False),
    ("06-leaping-raider.png", "leaping-raider.webp", False, True),
    ("07-white-haired-king.png", "white-haired-king.webp", False, False),
    ("08-bell-jester.png", "bell-jester.webp", False, False),
    ("09-bomb-carrier.png", "bomb-carrier.webp", False, True),
    ("10-banner-titan.png", "banner-titan.webp", False, False),
    ("11-flame-catapult.png", "flame-catapult.webp", True, False),
    ("../zombie-roster-20260908/12-netherfire-necromancer.png", "netherfire-necromancer.webp", False, True),
]


def remove_baked_background(image: Image.Image) -> Image.Image:
    """Remove only border-connected black or light neutral backgrounds."""
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = cast(Any, rgb.load())
    corners = [pixels[0, 0], pixels[width - 1, 0], pixels[0, height - 1], pixels[width - 1, height - 1]]
    dark_background = sum(max(color) for color in corners) / len(corners) < 80

    def is_background(x: int, y: int) -> bool:
        red, green, blue = pixels[x, y]
        if dark_background:
            return max(red, green, blue) <= 24
        return min(red, green, blue) >= 170 and max(red, green, blue) - min(red, green, blue) <= 20

    queue: deque[tuple[int, int]] = deque()
    visited = bytearray(width * height)

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if not visited[index] and is_background(x, y):
            visited[index] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    alpha = Image.new("L", (width, height), 255)
    alpha_pixels = cast(Any, alpha.load())
    for index, removed in enumerate(visited):
        if removed:
            alpha_pixels[index % width, index // width] = 0
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.55))
    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha)
    return rgba


def clean_transparent_pixels(image: Image.Image) -> Image.Image:
    pixels = list(cast(Any, image.get_flattened_data()))
    cleaned = [(0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha) for red, green, blue, alpha in pixels]
    image.putdata(cast(Any, cleaned))
    return image


def normalize(source_path: Path, target_path: Path, mirror: bool, remove_background: bool) -> None:
    source = Image.open(source_path)
    source = remove_baked_background(source) if remove_background else source.convert("RGBA")
    if mirror:
        source = ImageOps.mirror(source)
    alpha = source.getchannel("A")
    bounds = alpha.getbbox()
    if not bounds:
        raise ValueError(f"No visible subject in {source_path.name}")
    source = source.crop(bounds)
    source.thumbnail((960, 960), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    canvas.alpha_composite(source, ((1024 - source.width) // 2, (1024 - source.height) // 2))
    canvas = clean_transparent_pixels(canvas)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(target_path, "WEBP", quality=90, method=6)
    check = Image.open(target_path)
    if check.size != (1024, 1024) or check.mode != "RGBA" or check.getchannel("A").getextrema()[0] != 0:
        raise ValueError(f"Invalid output: {target_path}")
    print(f"{target_path.name}: {target_path.stat().st_size} bytes, bbox={check.getchannel('A').getbbox()}")


if __name__ == "__main__":
    for source_name, output_name, mirror, remove_background in ROSTER:
        normalize(SOURCE_DIR / source_name, OUTPUT_DIR / output_name, mirror, remove_background)
