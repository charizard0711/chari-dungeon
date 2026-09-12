// Crop and pack ImageGen drawings, preserving their generated alpha and pixels.
const fs = require('node:fs/promises'), path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const art = path.join(root, 'art/volcano-runtime-v1');
const terrain = path.join(root, 'public/assets/terrain/volcano-v1');
const bossNames = ['fallen-angel-volcano-v1', 'phoenix-volcano-v1', 'unicorn-volcano-v1', 'bone-reaper-volcano-v1', 'valgrado-directions-v1'];
const bossKeys = ['m_fallen_angel', 'm_phoenix', 'm_unicorn', 'm_bone_reaper', 'm_valgrado'];
const parts = ['wall-a', 'wall-b', 'prop-1', 'prop-2', 'prop-3', 'prop-4'];
async function bounds(source, cols, rows) {
  const meta = await sharp(source).metadata();
  if (!meta.hasAlpha || (await sharp(source).stats()).isOpaque) throw Error('Transparent art required: '+source);
  const {data,info} = await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const w=info.width,h=info.height;
  const cw=w/cols,ch=h/rows, boxes=[];
  // Complete connected characters can extend across the nominal quadrant boundary.
  if (cols===2) {
    const visited=new Uint8Array(w*h), queue=new Int32Array(w*h), groups=new Map();
    for(let start=0;start<visited.length;start++) {
      if(visited[start] || data[start*4+3]<8) continue;
      let head=0,tail=1,x1=w,y1=h,x2=-1,y2=-1;
      queue[0]=start;visited[start]=1;
      while(head<tail) {
        const p=queue[head++],x=p%w,y=Math.floor(p/w);
        x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);
        for(const next of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1]) {
          if(next<0||visited[next]||data[next*4+3]<8)continue;
          visited[next]=1;queue[tail++]=next;
        }
      }
      if(tail<1000)continue;
      const frame=Math.min(1,Math.floor((x1+x2)/2/cw))+Math.min(1,Math.floor((y1+y2)/2/ch))*2;
      const b=groups.get(frame);
      groups.set(frame,b?{x1:Math.min(b.x1,x1),y1:Math.min(b.y1,y1),x2:Math.max(b.x2,x2),y2:Math.max(b.y2,y2)}:{x1,y1,x2,y2});
    }
    if(groups.size!==4)throw Error('Expected four separate bosses: '+source);
    for(let frame=0;frame<4;frame++) boxes.push({...groups.get(frame),frame});
  } else {
    for(let frame=0;frame<cols*rows;frame++) {
      let x1=w,y1=h,x2=-1,y2=-1;
      for(let y=Math.floor(frame/cols)*ch;y<(Math.floor(frame/cols)+1)*ch;y++) for(let x=frame%cols*cw;x<(frame%cols+1)*cw;x++) {
        if(data[(y*w+x)*4+3]<8)continue;
        x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);
      }
      boxes.push({x1,y1,x2,y2,frame});
    }
  }
  return boxes.map(b=>({frame:b.frame,left:Math.max(0,b.x1-1),top:Math.max(0,b.y1-1),width:Math.min(w-1,b.x2+1)-Math.max(0,b.x1-1)+1,height:Math.min(h-1,b.y2+1)-Math.max(0,b.y1-1)+1}));
}
async function canvas(w,h,layers,out) {
  await sharp({create:{width:w,height:h,channels:4,background:'#00000000'}}).composite(layers).png({compressionLevel:9}).toFile(out);
}
async function main() {
  const jobs=JSON.parse(await fs.readFile(path.join(art,'prompts.json'),'utf8'));
  await fs.mkdir(terrain,{recursive:true});
  for(const job of jobs) {
    const source=path.join(art,job.file);
    try {await fs.access(source);} catch {await fs.copyFile(job.source,source);}
    const dest=path.join(terrain,String(job.floor));
    if(job.floor)await fs.mkdir(dest,{recursive:true});
    if(job.kind==='boss') {
      const drawings=await bounds(source,2,2);
      const scale=112/Math.max(...drawings.flatMap(d=>[d.width,d.height]));
      const layers=[];
      for(const {frame,...rect} of drawings) {
        const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));
        const input=await sharp(source).extract(rect).resize(w,h,{kernel:'nearest'}).png().toBuffer();
        layers.push({input,left:frame%2*128+Math.round((128-w)/2),top:Math.floor(frame/2)*128+118-h});
      }
      const target=path.join(root,'public/assets/monsters/directional',bossNames[job.floor-16]+'.png');
      await canvas(256,256,layers,target);
      await sharp(target).extract({left:0,top:0,width:128,height:128}).png().toFile(path.join(root,'public/assets/monsters',bossKeys[job.floor-16]+'.png'));
    } else if(job.kind==='floor') {
      const m=await sharp(source).metadata(),cw=Math.floor(m.width/2),ch=Math.floor(m.height/2),layers=[];
      for(let f=0;f<4;f++) layers.push({input:await sharp(source).extract({left:f%2*cw+3,top:Math.floor(f/2)*ch+3,width:cw-6,height:ch-6}).resize(64,64,{kernel:'nearest'}).png().toBuffer(),left:f%2*64,top:Math.floor(f/2)*64});
      await canvas(128,128,layers,path.join(dest,'floor.png'));
    } else if(job.kind==='props') {
      for(const {frame,...rect} of await bounds(source,3,2)) {
        const size=frame<2?64:128,maxW=frame<2?64:112,maxH=frame<2?46:112;
        const scale=Math.min(maxW/rect.width,maxH/rect.height),w=Math.round(rect.width*scale),h=Math.round(rect.height*scale);
        const input=await sharp(source).extract(rect).resize(w,h,{kernel:'nearest'}).png().toBuffer();
        await canvas(size,size,[{input,left:Math.round((size-w)/2),top:(frame<2?58:118)-h}],path.join(dest,parts[frame]+'.png'));
      }
    } else await sharp(source).resize(64,64,{kernel:'nearest'}).png().toFile(path.join(terrain,'lava.png'));
    console.log('Packed '+job.id);
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
