const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),art=path.join(root,'art/player-painted-v1');
const points=JSON.parse(fs.readFileSync(path.join(art,'hand-points.json'),'utf8'));
const output={};
for(const gender of ['male','female'])for(const armor of ['leather','chain','plate','arcane','dragon']){
 const {frames,cellSize}=JSON.parse(fs.readFileSync(path.join(art,`${gender}-${armor}.frames.json`),'utf8'));
 output[`player_${gender}_${armor}`]=frames.map((f,i)=>points[i].map((v,c)=>{
  const vertical=c%2===1,origin=vertical?f.source.top:f.source.left,size=vertical?f.source.height:f.source.width;
  const actualSize=vertical?f.height:f.width,offset=vertical?f.y:f.x;
  return Math.round((offset+(v-origin)*actualSize/size)/cellSize*40*100)/100;
 }));
}
fs.writeFileSync(path.join(root,'src/playerHandAnchors.ts'),'// Generated from art/player-painted-v1/hand-points.json and packed frame geometry.\nexport const PLAYER_HAND_ANCHORS: Record<string, number[][]> = '+JSON.stringify(output)+';\n');
console.log('Packed 640 pairs of hand anchors.');
