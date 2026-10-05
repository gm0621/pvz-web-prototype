#!/usr/bin/env python3
"""Extract the accepted corpseTitan four-frame attack sheet deterministically."""
from collections import deque
from hashlib import sha256
from pathlib import Path
from statistics import median
from typing import cast
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/characters/zombie-animations/corpseTitan/source-attack-sheet.png'
IDLE = ROOT / 'assets/characters/zombie-army/zombie-roster-v2/banner-titan.webp'
OUT = SOURCE.parent
EXPECTED_SHA256 = 'c18d6550ff2e25d8a03d5abd939aa1604f9197e4a15560ff502809d73f64dd84'
CORE_ALPHA = 8
CANVAS = 1024
BASELINE = 980
SAFETY = 48
MARGIN = 4

if sha256(SOURCE.read_bytes()).hexdigest() != EXPECTED_SHA256:
    raise SystemExit('source-attack-sheet.png SHA-256 mismatch')

source = Image.open(SOURCE).convert('RGBA')
w, h = source.size
pixels = cast(tuple[tuple[int, int, int, int], ...], source.get_flattened_data())
alpha = bytearray(px[3] for px in pixels)
core = bytearray(1 if value > CORE_ALPHA else 0 for value in alpha)
seen = bytearray(w * h)
components = []

for start, value in enumerate(core):
    if not value or seen[start]:
        continue
    queue = [start]
    seen[start] = 1
    head = 0
    members = []
    minx, miny, maxx, maxy = w, h, 0, 0
    while head < len(queue):
        pos = queue[head]
        head += 1
        members.append(pos)
        y, x = divmod(pos, w)
        minx, miny = min(minx, x), min(miny, y)
        maxx, maxy = max(maxx, x), max(maxy, y)
        for nxt in (pos-1, pos+1, pos-w, pos+w, pos-w-1, pos-w+1, pos+w-1, pos+w+1):
            if nxt < 0 or nxt >= w*h or seen[nxt] or not core[nxt]:
                continue
            ny, nx = divmod(nxt, w)
            if abs(nx-x) > 1 or abs(ny-y) > 1:
                continue
            seen[nxt] = 1
            queue.append(nxt)
    if len(members) >= 100:
        components.append({'members': members, 'bbox': (minx, miny, maxx+1, maxy+1)})

components.sort(key=lambda item: item['bbox'][0])
if len(components) != 4:
    raise SystemExit(f'expected four major alpha components, got {len(components)}')

labels = bytearray(w * h)
queue = deque()
for label, component in enumerate(components, 1):
    for pos in component['members']:
        labels[pos] = label
        queue.append(pos)

# Preserve antialiasing by growing each visible core through every connected nonzero-alpha pixel.
while queue:
    pos = queue.popleft()
    label = labels[pos]
    y, x = divmod(pos, w)
    for nxt in (pos-1, pos+1, pos-w, pos+w, pos-w-1, pos-w+1, pos+w-1, pos+w+1):
        if nxt < 0 or nxt >= w*h or labels[nxt] or alpha[nxt] == 0:
            continue
        ny, nx = divmod(nxt, w)
        if abs(nx-x) > 1 or abs(ny-y) > 1:
            continue
        labels[nxt] = label
        queue.append(nxt)

centers = [(item['bbox'][0] + item['bbox'][2]) / 2 for item in components]
for pos, value in enumerate(alpha):
    if value and not labels[pos]:
        x = pos % w
        labels[pos] = min(range(4), key=lambda index: abs(x-centers[index])) + 1

max_width = max(item['bbox'][2]-item['bbox'][0] for item in components)
max_height = max(item['bbox'][3]-item['bbox'][1] for item in components)
scale = min((CANVAS-SAFETY)/max_width, (CANVAS-SAFETY)/max_height)
frames = []
visible_heights = []

for index, component in enumerate(components):
    label = index + 1
    x0, y0, x1, y1 = component['bbox']
    visible_heights.append(y1-y0)
    x0, y0 = max(0, x0-MARGIN), max(0, y0-MARGIN)
    x1, y1 = min(w, x1+MARGIN), min(h, y1+MARGIN)
    crop = Image.new('RGBA', (x1-x0, y1-y0), (0, 0, 0, 0))
    crop_pixels = crop.load()
    assert crop_pixels is not None
    for y in range(y0, y1):
        row = y*w
        for x in range(x0, x1):
            pos = row+x
            if labels[pos] == label:
                crop_pixels[x-x0, y-y0] = pixels[pos]
    resized = crop.resize((round(crop.width*scale), round(crop.height*scale)), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    px = (CANVAS-resized.width)//2
    py = BASELINE-resized.height
    canvas.alpha_composite(resized, (px, py))
    output = OUT / f'attack-{index:02d}.webp'
    canvas.save(output, 'WEBP', lossless=True, method=6)
    frames.append(Image.open(output).convert('RGBA'))
    print(output.relative_to(ROOT), 'bbox=', component['bbox'], 'scale=', round(scale, 5))

# Battle-only idle uses the same representative visible height and baseline.
idle = Image.open(IDLE).convert('RGBA')
idle_alpha = idle.getchannel('A')
idle_values = cast(tuple[int, ...], idle_alpha.get_flattened_data())
idle_mask = Image.frombytes('L', idle.size, bytes(255 if value > CORE_ALPHA else 0 for value in idle_values))
idle_bbox = idle_mask.getbbox()
if not idle_bbox:
    raise SystemExit('idle asset has no visible alpha content')
ix0, iy0, ix1, iy1 = idle_bbox
idle_crop = idle.crop((max(0, ix0-MARGIN), max(0, iy0-MARGIN), min(idle.width, ix1+MARGIN), min(idle.height, iy1+MARGIN)))
target_height = round(median(visible_heights)*scale)
idle_scale = target_height / idle_crop.height
idle_resized = idle_crop.resize((round(idle_crop.width*idle_scale), target_height), Image.Resampling.LANCZOS)
idle_canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
idle_canvas.alpha_composite(idle_resized, ((CANVAS-idle_resized.width)//2, BASELINE-idle_resized.height))
idle_output = OUT / 'idle-battle.webp'
idle_canvas.save(idle_output, 'WEBP', lossless=True, method=6)
print(idle_output.relative_to(ROOT), 'target_height=', target_height)

# Contact sheet is generated from the actual runtime WebP decodes.
preview_size = 512
contact = Image.new('RGB', (preview_size*4, preview_size), '#233047')
draw = ImageDraw.Draw(contact)
for index, frame in enumerate(frames):
    preview = frame.resize((preview_size, preview_size), Image.Resampling.LANCZOS)
    contact.paste(preview, (index*preview_size, 0), preview)
    draw.rounded_rectangle((index*preview_size+12, 12, index*preview_size+58, 58), 10, fill='#111827')
    draw.text((index*preview_size+29, 25), str(index+1), fill='white')
contact.save(OUT/'contact-sheet.png', optimize=True)
print((OUT/'contact-sheet.png').relative_to(ROOT))
