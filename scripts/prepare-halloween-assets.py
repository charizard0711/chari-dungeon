"""Pack ImageGen atlases into runtime sprites. Preserve their alpha; no background removal."""
from pathlib import Path
from PIL import Image
import shutil
import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--generated', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
out = root / 'public/assets/halloween-v1'
art = root / 'art/halloween-v1'
out.mkdir(parents=True, exist_ok=True)
art.mkdir(parents=True, exist_ok=True)
sources = {
    'characters': 'exec-29d11eb0-03d1-4af9-a28a-dcffb085afd6.png',
    'props': 'exec-4c127740-9c91-4892-9aa5-b63371fa73b9.png',
    'equipment': 'exec-6a48dec4-c5aa-46e7-8a74-9d5f13dbfafb.png',
    'environments': 'exec-62682e28-ddb3-48f8-8c82-da78c13d6348.png'
}
for kind, name in sources.items():
    shutil.copy2(args.generated / name, art / f'{kind}-atlas.png')

def cell(image, col, row, cols, rows):
    w,h = image.size
    return image.crop((round(col*w/cols),round(row*h/rows),round((col+1)*w/cols),round((row+1)*h/rows)))

def sprite(image, key):
    assert image.mode == 'RGBA', f'{key} has no alpha'
    box = image.getchannel('A').getbbox()
    if not box: raise ValueError(f'Empty sprite: {key}')
    image = image.crop(box)
    image.thumbnail((256,256),Image.Resampling.LANCZOS)
    padded=Image.new('RGBA',(image.width+12,image.height+12))
    padded.paste(image,(6,6))
    padded.save(out/f'{key}.png',optimize=True)

chars=['m_hw_pumpkin_lord','m_hw_gravekeeper','m_hw_witch','m_hw_headless','m_hw_king','m_hw_pumpkin','m_hw_bat','m_hw_ghost','m_hw_slime']
im=Image.open(art/'characters-atlas.png')
for i,key in enumerate(chars): sprite(cell(im,i%3,i//3,3,3),key)
props=['stairs','wall','gate','pumpkins','grave','lantern','cauldron','books','armor','coffin','throne','tree','chest','chest_open','candy','barrel']
im=Image.open(art/'props-atlas.png')
for i,key in enumerate(props): sprite(cell(im,i%4,i//4,4,4),key)
equipment=['w_hw_candy','w_hw_lantern','w_hw_bat','w_hw_coffin','w_hw_harvest','s_hw_pumpkin','s_hw_grave','s_hw_moon','s_hw_coffin','s_hw_harvest']
im=Image.open(art/'equipment-atlas.png')
# The generated weapons occupy a taller row than the shields.
split=486
for i,key in enumerate(equipment):
    x0=round((i%5)*im.width/5);x1=round((i%5+1)*im.width/5)
    sprite(im.crop((x0,0 if i<5 else split,x1,split if i<5 else im.height)),key)
im=Image.open(art/'environments-atlas.png')
for i in range(5):
    cell(im,0,i,2,5).resize((128,128),Image.Resampling.LANCZOS).save(out/f'floor-{i+1}.png')
    cell(im,1,i,2,5).resize((1024,614),Image.Resampling.LANCZOS).save(out/f'backdrop-{i+1}.webp',quality=86)
(art/'manifest.json').write_text(json.dumps({'generator':'built-in image_gen','reference':'User pumpkin knight image; concept art from this chat','sources':sources,'sprites':chars+props+equipment,'environments':5,'packing':'Rectangular atlas slicing, alpha-preserving trim, scale, padding. No background removal.'},ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Packed {len(chars)+len(props)+len(equipment)+10} Halloween assets into {out}')
