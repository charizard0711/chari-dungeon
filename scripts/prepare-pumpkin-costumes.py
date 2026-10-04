"""Pack generated 8x8 alpha sheets into 96px player frames, without repainting."""
from pathlib import Path
from PIL import Image
import argparse,json,shutil
p=argparse.ArgumentParser();p.add_argument('--male',type=Path,required=True);p.add_argument('--female',type=Path,required=True);args=p.parse_args()
root=Path(__file__).resolve().parents[1];art=root/'art/halloween-costumes-v1';out=root/'public/assets/characters/halloween-v1'
art.mkdir(exist_ok=True);out.mkdir(parents=True,exist_ok=True)
for gender,source in [('male',args.male),('female',args.female)]:
 shutil.copy2(source,art/f'{gender}-source.png');im=Image.open(source);assert im.mode=='RGBA';frames=[]
 for i in range(64):
  x=i%8;y=i//8;cell=im.crop((round(x*im.width/8),round(y*im.height/8),round((x+1)*im.width/8),round((y+1)*im.height/8)))
  box=cell.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();assert box is not None
  frames.append(cell.crop(box))
 sheet=Image.new('RGBA',(768,768));meta=[]
 for i,frame in enumerate(frames):
  block=(i//16)*16;neutral=frames[block];scale=min(74/neutral.height,86/max(f.width for f in frames[block:block+16]),80/max(f.height for f in frames[block:block+16]))
  frame=frame.resize((round(frame.width*scale),round(frame.height*scale)),Image.Resampling.LANCZOS)
  x=(96-frame.width)//2;y=86-frame.height;assert x>=0 and y>=0
  sheet.alpha_composite(frame,((i%8)*96+x,(i//8)*96+y));meta.append({'index':i,'x':x,'y':y,'width':frame.width,'height':frame.height})
 sheet.save(out/f'{gender}-pumpkin_{gender}.png',optimize=True)
 sheet.crop((0,0,96,96)).save(out/f'armor_pumpkin_{gender}.png')
 (art/f'{gender}-frames.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
 print(gender,im.size,'64 frames packed')
