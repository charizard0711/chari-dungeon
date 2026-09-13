// Generated artwork; background removal explicitly approved by the user.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'C:/Users/masam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..');
const CELL=96, HEIGHT=74, BASELINE=86;

async function extract(file, matte) {
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h}=info, mask=new Uint8Array(w*h),queue=new Int32Array(w*h);
  let head=0,tail=0;
  function candidate(p) {
    const o=p*4,r=data[o],g=data[o+1],b=data[o+2];
    if(data[o+3]===0)return true;
    const hi=Math.max(r,g,b),lo=Math.min(r,g,b);
    return matte==='checker' ? lo>=94 && hi-lo<=20 : lo>=238 && hi-lo<=18;
  }
  function push(p){if(!mask[p]&&candidate(p)){mask[p]=1;queue[tail++]=p;}}
  for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}
  for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
  while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);if(x)push(p-1);if(x<w-1)push(p+1);if(y)push(p-w);if(y<h-1)push(p+w);}
  for(let p=0;p<mask.length;p++)if(mask[p]){data[p*4]=data[p*4+1]=data[p*4+2]=data[p*4+3]=0;}
  if(matte==='white')for(let p=0;p<mask.length;p++)if(!mask[p]){
    const x=p%w,y=Math.floor(p/w);
    if(!(x&&mask[p-1]||x<w-1&&mask[p+1]||y&&mask[p-w]||y<h-1&&mask[p+w]))continue;
    const o=p*4,min=Math.min(data[o],data[o+1],data[o+2]);
    if(min>150){const a=Math.max(.25,(255-min)/105);for(let c=0;c<3;c++)data[o+c]=Math.max(0,Math.round((data[o+c]-255*(1-a))/a));data[o+3]=Math.round(a*255);}
  }
  return {data,width:w,height:h,removed:tail/(w*h)};
}
function bounds(data,w,h,rect){
  let left=w,top=h,right=-1,bottom=-1,count=0;
  for(let y=rect.top;y<rect.top+rect.height;y++)for(let x=rect.left;x<rect.left+rect.width;x++)if(data[(y*w+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
  if(!count)throw new Error('Empty frame');
  let footLeft=w,footRight=-1;
  for(let y=Math.max(top,bottom-9);y<=bottom;y++)for(let x=left;x<=right;x++)if(data[(y*w+x)*4+3]>64){footLeft=Math.min(footLeft,x);footRight=Math.max(footRight,x);}
  return {left,top,right,bottom,count,footX:(footLeft+footRight)/2};
}

function rowCuts(data,w,h){
  const occupied=Array.from({length:h},(_,y)=>{let n=0;for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>64)n++;return n;});
  const cuts=[0];
  for(let row=1;row<8;row++){
    const expected=row*h/8,radius=Math.floor(h/8*.22);let best=Math.round(expected),score=Infinity;
    for(let y=Math.round(expected)-radius;y<=Math.round(expected)+radius;y++){
      const value=occupied.slice(y-2,y+3).reduce((a,b)=>a+b,0)*100+Math.abs(y-expected);
      if(value<score){score=value;best=y;}
    }
    cuts.push(best);
  }
  cuts.push(h);return cuts;
}

async function pack(key,source,matte='white'){
  const extracted=await extract(source,matte),{data,width:w,height:h}=extracted;
  if(extracted.removed<.3)throw new Error('Background extraction failed: '+key);
  const original=sharp(data,{raw:{width:w,height:h,channels:4}}), layers=[],frames=[];
  const rows=rowCuts(data,w,h);
  const cells=Array.from({length:64},(_,i)=>{
    const col=i%8,row=Math.floor(i/8),left=Math.round(col*w/8),top=rows[row];
    return {left,top,width:Math.round((col+1)*w/8)-left,height:rows[row+1]-top};
  });
  const boxes=cells.map(c=>bounds(data,w,h,c));
  for(let i=0;i<64;i++){
    const b=boxes[i],neutral=boxes[Math.floor(i/16)*16],scale=HEIGHT/(neutral.bottom-neutral.top+1);
    const crop={left:b.left,top:b.top,width:b.right-b.left+1,height:b.bottom-b.top+1};
    const sw=Math.round(crop.width*scale),sh=Math.round(crop.height*scale);
    const directionStart=Math.floor(i/16)*16;
    const anchorX=cells[i].left+neutral.footX-cells[directionStart].left;
    const x=Math.round(CELL/2-(anchorX-b.left)*scale),y=BASELINE-sh;
    if(x<0||y<0||x+sw>CELL||y+sh>CELL)throw new Error(`Frame clips: ${key} #${i} ${JSON.stringify({x,y,sw,sh})}`);
    const input=await original.clone().extract(crop).resize(sw,sh,{kernel:'lanczos3'}).png().toBuffer();
    layers.push({input,left:(i%8)*CELL+x,top:Math.floor(i/8)*CELL+y});
    frames.push({index:i,source:crop,x,y,width:sw,height:sh,footX:b.footX});
  }
  const out=path.join(root,'public/assets/characters/player-painted-v1');await fs.mkdir(out,{recursive:true});
  const png=await sharp({create:{width:CELL*8,height:CELL*8,channels:4,background:'#00000000'}}).composite(layers).png({compressionLevel:9}).toBuffer();
  await fs.writeFile(path.join(out,key+'.png'),png);
  await fs.writeFile(path.join(root,'art/player-painted-v1',key+'.frames.json'),JSON.stringify({source,matte,removed:extracted.removed,cellSize:CELL,frames},null,2)+'\n');
  console.log(`${key}: 64 frames, ${png.length} bytes, matte removed ${(100*extracted.removed).toFixed(1)}%`);
}
if(require.main===module){const[key,source,matte]=process.argv.slice(2);if(!key||!source)throw new Error('Usage: node scripts/prepare-player-painted.cjs male-leather source.png checker|white');pack(key,path.resolve(source),matte).catch(e=>{console.error(e);process.exitCode=1;});}
module.exports={pack,extract};
