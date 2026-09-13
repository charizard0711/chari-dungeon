const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const sharp=require(process.env.SHARP_MODULE||'sharp'),root=path.resolve(__dirname,'..');
async function main(){
 let count=0,bytes=0;
 for(let floor=26;floor<=30;floor++){
  const name=['deep_kraken','valzeon','selene','abyss_lord','astravein'][floor-26],size=floor===30?256:128;
  const files=[
   ['public/assets/monsters/m_'+name+'.png',size,size,true],
   ['public/assets/monsters/directional/'+name+'-directions-v1.png',size*2,size*2,true],
   ['public/assets/terrain/final-depths-v1/'+floor+'/floor.png',128,128,false],
   ...['wall-a','wall-b'].map(p=>['public/assets/terrain/final-depths-v1/'+floor+'/'+p+'.png',64,64,false]),
   ...Array.from({length:floor===30?7:4},(_,i)=>['public/assets/terrain/final-depths-v1/'+floor+'/prop-'+(i+1)+'.png',128,128,true])
  ];
  for(const [file,w,h,alpha] of files){
   const full=path.join(root,file),meta=await sharp(full).metadata(),stats=await sharp(full).stats();
   assert.equal(meta.width,w,file);assert.equal(meta.height,h,file);
   if(alpha){assert.equal(meta.hasAlpha,true,file);assert.equal(stats.isOpaque,false,file);
    const {data,info}=await sharp(full).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let visible=0,transparent=0;
    for(let i=3;i<data.length;i+=4){if(data[i]>200)visible++;if(data[i]===0)transparent++;}
    assert.ok(visible>info.width*info.height*.08,file+' blank');
    assert.ok(transparent>info.width*info.height*.25,file+' transparent margins');
    for(let x=0;x<w;x++)assert.equal(data[x*4+3],0,file+' clipped top');
   }
   count++;bytes+=(await fs.stat(full)).size;
  }
  const atlas=await fs.readFile(path.join(root,files[1][0]));
  assert.ok(atlas.length<(size===256?512:128)*1024,'bounded atlas size');
 }
 console.log('PASS: '+count+' runtime PNGs, dimensions/native alpha/margins checked; '+Math.round(bytes/1024)+' KiB total.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
