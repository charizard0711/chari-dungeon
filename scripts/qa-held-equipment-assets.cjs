const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const sharp=require(process.env.SHARP_MODULE||'sharp'),root=path.resolve(__dirname,'..');
async function main(){
 const art=path.join(root,'art/equipment-directions-v1');
 const jobs=JSON.parse(await fs.readFile(path.join(art,'jobs.json'),'utf8'));
 let bytes=0;const previews=[];
 for(const job of jobs){
  const file=path.join(root,'public/assets/equipment/directional',job.key+'.png');
  const meta=await sharp(file).metadata();assert.equal(meta.width,128);assert.equal(meta.height,128);assert.ok(meta.hasAlpha);
  for(let frame=0;frame<4;frame++){
   const {data,info}=await sharp(file).extract({left:frame%2*64,top:Math.floor(frame/2)*64,width:64,height:64}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let painted=0,clear=0;
   for(let i=3;i<data.length;i+=info.channels){if(data[i]>0)painted++;else clear++;}
   assert.ok(painted>30&&clear>1000,job.key+' frame '+frame+' must contain a cutout');
   for(let x=0;x<64;x++){assert.equal(data[x*4+3],0);assert.equal(data[(63*64+x)*4+3],0);}
   for(let y=0;y<64;y++){assert.equal(data[(y*64)*4+3],0);assert.equal(data[(y*64+63)*4+3],0);}
  }
  const record=JSON.parse((await fs.readFile(path.join(art,job.key+'.json'),'utf8')).replace(/^\uFEFF/,''));
  assert.ok(record.prompt&&record.mode==='built-in ImageGen');await fs.access(path.join(art,job.key+'.png'));
  bytes+=(await fs.stat(file)).size;previews.push({key:job.key,input:await sharp(file).resize(256,256,{kernel:'nearest'}).toBuffer()});
 }
 for(let page=0;page<Math.ceil(previews.length/20);page++){
  const group=previews.slice(page*20,page*20+20);
  await sharp({create:{width:1280,height:Math.ceil(group.length/5)*256,channels:4,background:'#293640'}})
   .composite(group.map((p,i)=>({input:p.input,left:i%5*256,top:Math.floor(i/5)*256}))).png().toFile(path.join(art,'preview-'+page+'.png'));
 }
 console.log(JSON.stringify({pass:true,items:jobs.length,directionalFrames:jobs.length*4,runtimeBytes:bytes,decodedTextureBytes:jobs.length*128*128*4}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
