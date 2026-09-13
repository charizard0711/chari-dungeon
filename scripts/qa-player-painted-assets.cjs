const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require(process.env.SHARP_MODULE||'C:/Users/masam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),size=96;
(async()=>{
 let total=0,checked=0;
 for(const gender of ['male','female'])for(const armor of ['leather','chain','plate','arcane','dragon']){
  const key=`${gender}-${armor}`,file=path.join(root,'public/assets/characters/player-painted-v1',key+'.png');
  const bytes=await fs.readFile(file),meta=await sharp(bytes).metadata();
  assert.equal(meta.width,size*8);assert.equal(meta.height,size*8);assert.equal(meta.hasAlpha,true,key+' must have real transparency');
  assert.ok(bytes.length<600*1024,key+' atlas download size');total+=bytes.length;
  const {data}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true}),hashes=new Set();
  for(let frame=0;frame<64;frame++){
   const x0=frame%8*size,y0=Math.floor(frame/8)*size,pixels=Buffer.alloc(size*size*4);let opaque=0,edge=0;
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const from=((y0+y)*size*8+x0+x)*4,to=(y*size+x)*4;data.copy(pixels,to,from,from+4);
    if(data[from+3]>64){opaque++;if(x<2||x>=size-2||y<2||y>=size-2)edge++;}
   }
   assert.ok(opaque>450&&opaque<6500,`${key}/${frame}: body occupancy ${opaque}`);
   assert.equal(edge,0,`${key}/${frame}: cropped or neighboring sprite at cell border`);
   hashes.add(crypto.createHash('sha256').update(pixels).digest('hex'));checked++;
  }
  assert.equal(hashes.size,64,key+' must contain separately drawn poses');
 }
 assert.ok(total<5.5*1024*1024,'total download budget');
 console.log(`PASS: ${checked} distinct poses in ten RGBA atlases, clear margins, ${(total/1024/1024).toFixed(2)} MiB download, ${(10*(size*8)**2*4/1024/1024).toFixed(1)} MiB decoded texture memory.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
