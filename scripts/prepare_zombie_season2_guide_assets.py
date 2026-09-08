"""Reproduce season-two zombie guide artwork, preserving source lettering/orientation."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageFilter
from collections import deque
from tempfile import TemporaryDirectory
from typing import Any, cast
from prepare_zombie_roster_assets import normalize, remove_baked_background
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/characters/zombie-army/season2'
ROSTER=[('coffin-shield','棺盾小屍',True),('shield-cleaver','裂盾斧屍',True),('smoke-pot','煙罐小屍',True),('chain-hook','鉤鎖屍卒',False),('corpse-medic','縫屍醫官',True),('banner-hexer','斷旗咒屍',True),('decoy-puppet','替身偶屍',True),('siege-overseer','陷城屍督',True)]
ROSTER += [('rat-fang','鼠牙群屍',True),('rot-nail-crossbow','腐釘弩屍',True),('venom-sac','毒囊噴屍',False),('gate-ram','破門撞屍',False)]
# Reviewed source-coordinate seeds inside enclosed white background gaps.
# Never globally threshold pale bandages, teeth, smoke or metal highlights.
GAPS={
 'rot-nail-crossbow':[(704,96),(956,106),(790,107),(782,229),(279,531),(259,549)],
 'coffin-shield':[(1010,426),(531,773),(919,1015)],
 'shield-cleaver':[(1159,397),(270,987)],
 'smoke-pot':[(197,837)],
 'corpse-medic':[(617,95),(886,107),(785,163),(967,172),(144,549)],
 'banner-hexer':[(678,269),(460,822),(437,906)],
 'decoy-puppet':[(612,54),(1137,644)],
 'siege-overseer':[(880,6),(774,132),(1098,213),(516,266),(942,354),(414,701),(497,871),(413,872)]
}
def clear_background_gaps(source,key):
 im=Image.open(source).convert('RGBA');out=remove_baked_background(im)
 w,h=im.size;pixels=cast(Any,im.load());mask=Image.new('L',im.size,0);marks=cast(Any,mask.load())
 queue=deque(GAPS.get(key,[]));visited=set()
 while queue:
  x,y=queue.popleft()
  if (x,y) in visited or not(0<=x<w and 0<=y<h):continue
  visited.add((x,y));rgb=pixels[x,y][:3]
  if min(rgb)<210 or max(rgb)-min(rgb)>22:continue
  marks[x,y]=255
  queue.extend(((x-1,y),(x+1,y),(x,y-1),(x,y+1)))
 from PIL import ImageChops
 out.putalpha(ImageChops.subtract(out.getchannel('A'),mask.filter(ImageFilter.GaussianBlur(.55))))
 return out

def main():
 records=[]
 for i,(key,name,remove) in enumerate(ROSTER,1):
  source=BASE/'source-originals'/f'{i:02d}-{key}.png';target=BASE/f'{key}.webp'
  if remove:
   with TemporaryDirectory(prefix='zombie-guide-') as tmp:
    intermediate=Path(tmp)/'transparent.png'
    clear_background_gaps(source,key).save(intermediate)
    normalize(intermediate,target,False,False)
  else:normalize(source,target,False,False)
  with Image.open(target) as im:
   assert im.size==(1024,1024) and im.mode=='RGBA'
   assert im.getchannel('A').getextrema()==(0,255)
  records.append(dict(key=key,name=name,asset=str(target.relative_to(ROOT)),source_original=str(source.relative_to(ROOT)),source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),mirror=False,remove_background=remove,enclosed_background_seeds=GAPS.get(key,[])))
 (BASE/'manifest.json').write_text(json.dumps(dict(status='season2_guide_preview',integrated_in_combat=False,characters=records),ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
