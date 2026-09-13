// Mechanical cropping and packing only. All transparency comes from ImageGen.
const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..'),art=path.join(root,'art/final-depths-runtime-v1');
async function canvas(width,height,layers,out){await sharp({create:{width,height,channels:4,background:'#00000000'}}).composite(layers).png({compressionLevel:9}).toFile(out);}
async function rectangles(source,cols,rows,count) {
 const m=await sharp(source).metadata();
 if(!m.hasAlpha||(await sharp(source).stats()).isOpaque)throw Error('Native alpha required: '+source);
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const result=[];
 for(let f=0;f<count;f++){
  const left=Math.floor(f%cols*info.width/cols),right=Math.floor((f%cols+1)*info.width/cols);
  const top=Math.floor(Math.floor(f/cols)*info.height/rows),bottom=Math.floor((Math.floor(f/cols)+1)*info.height/rows);
  let x1=right,y1=bottom,x2=-1,y2=-1;
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*info.width+x)*4+3]>=8){x1=Math.min(x1,x);y1=Math.min(y1,y);x2=Math.max(x2,x);y2=Math.max(y2,y);}
  if(x2<0)throw Error('Empty cell '+f+' in '+source);
  result.push({left:x1,top:y1,width:x2-x1+1,height:y2-y1+1});
 }
 return result;
}
async function main(){
 const jobs=JSON.parse(await fs.readFile(path.join(art,'prompts.json'),'utf8'));
 const edits=JSON.parse(await fs.readFile(path.join(art,'alpha-corrections.json'),'utf8'));
 const manifest=[];
 for(const original of jobs){
  const job=edits.find(e=>e.id===original.id)||original;
  const source=path.join(art,job.file);await fs.copyFile(job.source,source);
  const dest=path.join(root,'public/assets/terrain/final-depths-v1',String(job.floor));await fs.mkdir(dest,{recursive:true});
  if(job.kind==='boss'){
   const rects=await rectangles(source,2,2,4),size=job.frameSize,baseline=Math.round(size*118/128);
   const scale=(size*112/128)/Math.max(...rects.flatMap(r=>[r.width,r.height]));
   const layers=[];
   for(let f=0;f<4;f++){const r=rects[f],w=Math.max(1,Math.round(r.width*scale)),h=Math.max(1,Math.round(r.height*scale));
    layers.push({input:await sharp(source).extract(r).resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:f%2*size+Math.round((size-w)/2),top:Math.floor(f/2)*size+baseline-h});}
   const name=['deep_kraken','valzeon','selene','abyss_lord','astravein'][job.floor-26];
   const target=path.join(root,'public/assets/monsters/directional',name+'-directions-v1.png');
   await canvas(size*2,size*2,layers,target);
   await sharp(target).extract({left:0,top:0,width:size,height:size}).png().toFile(path.join(root,'public/assets/monsters','m_'+name+'.png'));
  }else if(job.kind==='props'){
   const count=job.floor===30?7:4,cols=job.floor===30?3:2,rows=cols;
   const rects=await rectangles(source,cols,rows,count);
   for(let f=0;f<count;f++){const r=rects[f],scale=112/Math.max(r.width,r.height),w=Math.round(r.width*scale),h=Math.round(r.height*scale);
    await canvas(128,128,[{input:await sharp(source).extract(r).resize(w,h,{kernel:'nearest'}).png().toBuffer(),left:Math.round((128-w)/2),top:118-h}],path.join(dest,'prop-'+(f+1)+'.png'));}
  }else{
   const m=await sharp(source).metadata(),cols=2,rows=job.kind==='floor'?2:1,count=cols*rows,layers=[];
   for(let f=0;f<count;f++){const l=Math.floor(f%cols*m.width/cols),t=Math.floor(Math.floor(f/cols)*m.height/rows),r=Math.floor((f%cols+1)*m.width/cols),b=Math.floor((Math.floor(f/cols)+1)*m.height/rows);
    const input=await sharp(source).extract({left:l+3,top:t+3,width:r-l-6,height:b-t-6}).resize(64,64,{kernel:'nearest'}).png().toBuffer();
    if(job.kind==='walls')await fs.writeFile(path.join(dest,f===0?'wall-a.png':'wall-b.png'),input);
    else layers.push({input,left:f%2*64,top:Math.floor(f/2)*64});
   }
   if(job.kind==='floor')await canvas(128,128,layers,path.join(dest,'floor.png'));
  }
  manifest.push({...job});console.log('Packed '+job.id);
 }
 await fs.writeFile(path.join(art,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
