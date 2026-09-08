"""Rebuild Wei season 2 guide-only assets; preserve uploaded orientation and lettering."""
import hashlib
import json
from pathlib import Path

from PIL import Image
from prepare_zombie_roster_assets import normalize

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / 'assets/characters/future-generals/wei-season2'
ROSTER = [
    ('tuntian-soldier', '屯田兵'), ('shield-soldier', '大盾兵'),
    ('crossbow-soldier', '強弩兵'), ('halberd-soldier', '長戟兵'),
    ('xiahou-dun', '夏侯惇'), ('dian-wei', '典韋'),
    ('xu-chu', '許褚'), ('zhang-liao', '張遼'),
    ('xu-huang', '徐晃'), ('guo-jia', '郭嘉'),
    ('sima-yi', '司馬懿'), ('cao-cao', '曹操'),
]


def main():
    records = []
    for order, (key, name) in enumerate(ROSTER, 1):
        source = DIRECTORY / 'source-originals' / f'{order:02d}-{key}.png'
        target = DIRECTORY / f'{key}.webp'
        with Image.open(source) as image:
            remove_background = 'A' not in image.getbands()
        normalize(source, target, mirror=False, remove_background=remove_background)
        records.append(dict(order=order, key=key, name=name, status='guide_only',
                            playable=False, source_original=str(source.relative_to(ROOT)),
                            source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                            asset=str(target.relative_to(ROOT)), mirrored=False,
                            background_removed=remove_background))
    manifest = dict(season=2, faction='魏國', status='guide_only', characters=records)
    (DIRECTORY / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
