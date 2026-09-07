from pathlib import Path
from typing import Any, cast

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets/characters/source-originals"


def clean_transparency(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = []
    for r, g, b, a in cast(Any, image.get_flattened_data()):
        pixels.append((r, g, b, a) if a else (0, 0, 0, 0))
    image.putdata(pixels)
    return image


def fit_square(source: Image.Image, max_side: int = 960) -> Image.Image:
    source = source.convert("RGBA")
    source.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    x = (canvas.width - source.width) // 2
    y = (canvas.height - source.height) // 2
    canvas.alpha_composite(source, (x, y))
    return clean_transparency(canvas)


def save_pair(image: Image.Image, stem: Path) -> None:
    image.save(stem.with_suffix(".png"), "PNG", optimize=True)
    image.save(stem.with_suffix(".webp"), "WEBP", lossless=True, method=6, exact=True)


def verify(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    alpha = image.getchannel("A")
    assert image.size == (1024, 1024)
    assert alpha.getextrema() == (0, 255)
    assert alpha.getbbox() is not None
    print(f"verified {path.relative_to(ROOT)} size={image.size} alpha={alpha.getextrema()} bbox={alpha.getbbox()}")


guan_source = Image.open(SOURCE_DIR / "guanyu-accepted-20260907.png").convert("RGBA")
guan = fit_square(guan_source)
save_pair(guan, ROOT / "assets/characters/guanyu-fire-general")

qin_source = Image.open(SOURCE_DIR / "qin-emperor-accepted-20260907.png").convert("RGBA")
qin_source = ImageOps.mirror(qin_source)
qin = fit_square(qin_source)
save_pair(qin, ROOT / "assets/characters/zombie-army/undead-qin-emperor")

for output in [
    ROOT / "assets/characters/guanyu-fire-general.png",
    ROOT / "assets/characters/guanyu-fire-general.webp",
    ROOT / "assets/characters/zombie-army/undead-qin-emperor.png",
    ROOT / "assets/characters/zombie-army/undead-qin-emperor.webp",
]:
    verify(output)
