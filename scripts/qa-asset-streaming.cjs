const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try {
  const p=await b.newPage(); const errors=[]; p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://localhost:5190/?qa-game&qa-save');
  await p.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active&&!window.__game.scene.getScene('GameScene').assetsLoading);
  const delayedPath=await p.evaluate(()=>window.__game.registry.get('assetManifest').find(e=>e.path.includes('thunder-v1/25/'))?.path);
  assert.ok(delayedPath,'deep-floor asset exists');
  const optimized=require('../src/optimizedAssetPaths.json');
  let retryRequests=0;
  await p.route('**/'+(optimized[delayedPath]||delayedPath),route=>{
   retryRequests++;return retryRequests<=2?route.abort():route.continue();
  });
  const result=await p.evaluate(async()=>{
   const game=window.__game,g=game.scene.getScene('GameScene'),u=game.scene.getScene('UIScene');
   const floors=[];
   for(const floor of [5,8,10,15,20,25,30]) {
    g.floor=floor;await g.buildFloor(g.floor);
    if(g.assetsLoading||g.enemies.some(e=>e.sprite.texture.key==='__MISSING')) throw Error('floor '+floor);
    floors.push(floor);
   }
   u.showControlsGuide();if(!g.busy)throw Error('guide not paused');
   const find=(objects)=>{for(const o of objects){if(o.name==='controls-guide-next')return o;if(o.list){const v=find(o.list);if(v)return v;}}};
   for(let i=0;i<4;i++)find(u.children.list).emit('pointerdown');
   if(g.busy||localStorage.getItem('chari-dungeon.controls-guide.v2')!=='seen')throw Error('guide dismissal');
   g.floor=1;await g.buildFloor(g.floor);const snap=g.captureRun();
   const dragon=snap.enemies.find(e=>e.state.def.key==='m_ember_drake');
   if(dragon){dragon.visual.texture='ember_dragon_directions_v1';dragon.visual.sourceWidth=128;dragon.visual.sourceHeight=128;dragon.visual.scaleX=dragon.visual.scaleY=30/112;}
   g.restoreRunEntities(snap);
   if(g.enemies.some(e=>e.sprite.texture.key==='__MISSING'))throw Error('legacy texture');
   const dr=g.enemies.find(e=>e.def.key==='m_ember_drake');
   if(dr&&dr.sprite.displayWidth>150)throw Error('legacy scale');
   g.saveRun();return {floors,guide:true,legacyDragon:!!dr};
  });
  await p.evaluate(()=>{const game=window.__game;game.scene.stop('UIScene');game.scene.stop('GameScene');game.scene.start('GameScene',{resume:true});});
  await p.waitForFunction(()=>window.__game.scene.getScene('GameScene').floor===1&&window.__game.scene.getScene('GameScene').playerSprite?.active&&!window.__game.scene.getScene('GameScene').assetsLoading);
  await p.evaluate(()=>{const game=window.__game;game.scene.stop('UIScene');game.scene.stop('GameScene');game.scene.start('HalloweenScene');});
  await p.waitForFunction(()=>window.__game.scene.getScene('HalloweenScene').children.list.length>25);
  await p.evaluate(()=>{const game=window.__game;game.scene.stop('HalloweenScene');game.scene.start('EndScene',{cleared:false,floor:10,level:5,gold:30,score:100,turns:100,hp:0,hpMax:100,discovered:10,totalMonsters:100});});
  await p.waitForFunction(()=>window.__game.scene.getScene('EndScene').children.list.length>15);
  assert.equal(retryRequests,3,'failed asset is retried twice');
  assert.deepEqual(errors,[]);console.log('PASS transitions, two failed downloads/retry, resume, event, ending, guide, legacy atlas',result);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});




