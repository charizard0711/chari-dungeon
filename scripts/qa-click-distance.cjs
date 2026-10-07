const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{const p=await b.newPage({viewport:{width:1280,height:900}});p.on('console',m=>{if(m.type()==='error')console.log(m.text());});await p.goto('http://localhost:5176/?qa-game&qa-save');await p.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);console.log(await p.evaluate(async()=>{
const g=window.__game.scene.getScene('GameScene'), trace=[];
for(const method of ['stopClickPath','clearMoveInput']){const old=g[method].bind(g);g[method]=(...args)=>{trace.push({method,stack:new Error().stack});return old(...args);};}
const old=g.playerAct.bind(g);g.playerAct=async(...args)=>{await old(...args);trace.push({method:'step',x:g.player.x,y:g.player.y,busy:g.busy,hp:g.player.hp,token:g.clickPathToken});};
let target;for(let y=0;y<g.dungeon.tiles.length&&!target;y++)for(let x=0;x<g.dungeon.tiles[y].length;x++){if(!g.isTileCurrentlyVisible(x,y))continue;const path=g.findClickPath(x,y);if(path.length===3&&!g.enemyAt(x,y)){target={x,y};break;}}
if(!target)throw Error('No 3-step target');const start={x:g.player.x,y:g.player.y};
const cam=g.cameras.main;const pointer={button:0,downTime:g.time.now,x:cam.x+((target.x+.5)*32-cam.worldView.x)*cam.zoom,y:cam.y+((target.y+.5)*32-cam.worldView.y)*cam.zoom};
await g.handleMapClick(pointer);if(g.player.x!==target.x||g.player.y!==target.y)throw Error('Click path stopped before destination: '+JSON.stringify(trace));return {start,target,end:{x:g.player.x,y:g.player.y},trace};
}));}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
