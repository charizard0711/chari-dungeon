const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage();
 await p.goto('http://localhost:5175/qa/halloween-event.html');
 const result=await p.evaluate(async()=>{
  const {generateHalloweenDungeon,halloweenDecorations,HALLOWEEN_LAYOUTS}=await import('/src/halloweenDungeon.ts');
  let count=0,minBranches=Infinity;const fingerprints=new Set();
  for(let floor=1;floor<=5;floor++)for(let pattern=0;pattern<10;pattern++)for(let sample=0;sample<8;sample++){
   let seed=floor*10000+pattern*100+sample+1;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
   const d=generateHalloweenDungeon(floor,pattern,random);
   if(d.rooms.filter(r=>!d.optionalRooms.some(o=>o.room===r)).length!==5)throw Error('room count');
   const blockers=new Set(halloweenDecorations(d,floor).map(p=>`${p.x},${p.y}`));
   const seen=new Set([`${d.start.x},${d.start.y}`]),queue=[d.start];let branches=0;
   for(let i=0;i<queue.length;i++){const p=queue[i];let degree=0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,key=`${x},${y}`;if(!d.tiles[y]?.[x]||d.tiles[y][x]==='wall'||blockers.has(key))continue;degree++;if(!seen.has(key)){seen.add(key);queue.push({x,y});}}if(degree>=3)branches++;}
   for(const p of [...d.rooms.map(r=>({x:r.cx,y:r.cy})),d.stairs])if(!seen.has(`${p.x},${p.y}`))throw Error(`unreachable floor${floor} pattern${pattern} sample${sample}`);
   for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++)if(d.tiles[y][x]!=='wall'&&!blockers.has(`${x},${y}`)&&!seen.has(`${x},${y}`))throw Error('isolated passage');
   minBranches=Math.min(minBranches,branches);fingerprints.add(d.tiles.map(r=>r.join(',')).join(';'));count++;
  }
  return {pass:true,count,patterns:HALLOWEEN_LAYOUTS.length,uniqueMaps:fingerprints.size,minBranches};
 });fs.mkdirSync('outputs/qa-halloween',{recursive:true});fs.writeFileSync('outputs/qa-halloween/layouts.json',JSON.stringify(result,null,2));console.log(result);await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
