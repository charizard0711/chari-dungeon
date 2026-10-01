const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const failures=[];const errors=[];try{
 const page=await b.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.url()+':'+r.status())});
 await page.goto('http://localhost:5174/?qa-game&qa-floor=10&qa-boss&qa-save');await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);
 const result=await page.evaluate(async()=>{
 const g=window.__game.scene.getScene('GameScene');const boss=g.enemies.find(e=>e.def.isFloorBoss);const initial={name:boss.def.name,key:boss.def.key,hp:boss.hp,texture:boss.sprite.texture.key,zoom:g.cameras.main.zoom};
 if(boss.def.key!=='m_giant_bull'||boss.def.name!=='巨角の猛牛')throw Error('incorrect 10 boss');
 if(g.bossStates.get(boss).kind!=='bull_charge')throw Error('charge lost');
 if(g.dungeon.waterArena.props.some(p=>p.x>g.dungeon.bossRoom.x+2&&p.x<g.dungeon.bossRoom.x+g.dungeon.bossRoom.w-3))throw Error('center obstructed');
 if(g.tileVisual('floor',2,g.dungeon.bossRoom.cx,g.dungeon.bossRoom.cy).key!=='terrain_ruin_floor_1')throw Error('arena not stone');
 // Put player and bull in the center of the visible normal camera.
 for(const e of [...g.enemies])if(e!==boss){e.alive=false;e.sprite.destroy();e.shadow?.destroy();g.enemies.splice(g.enemies.indexOf(e),1)}
 const r=g.dungeon.bossRoom;boss.x=r.cx;boss.y=r.cy-2;g.placeSprite(boss.sprite,boss.x,boss.y);g.player.x=r.cx;g.player.y=r.cy+2;g.placeSprite(g.playerSprite,g.player.x,g.player.y);g.player.dir='up';g.updateVisibility();
 boss.facing='down';g.updateEnemyDirection(boss);
 const frames=[];for(const facing of ['down','left','right','up']){boss.facing=facing;g.updateEnemyDirection(boss);frames.push(boss.sprite.frame.name)}boss.facing='down';g.updateEnemyDirection(boss);
 if(new Set(frames).size!==4)throw Error('direction views missing');
 const path=g.bossChargePath(boss);if(!path.some(p=>p.x===g.player.x&&p.y===g.player.y))throw Error('charge path missing');
 const hp=g.player.hp;g.player.x+=2;g.placeSprite(g.playerSprite,g.player.x,g.player.y);const state=g.bossStates.get(boss);await g.resolveBullCharge(boss,state,path);
 if(state.stunned!==2||g.player.hp!==hp)throw Error('sidestep wall stun broken');
 boss.x=r.cx;boss.y=r.cy-2;g.placeSprite(boss.sprite,boss.x,boss.y);g.player.x=r.cx;g.player.y=r.cy;g.placeSprite(g.playerSprite,g.player.x,g.player.y);g.updateVisibility();
 const {makeWeapon}=await import('/src/player.ts');const {WEAPON_DEFS}=await import('/src/data.ts');g.player.weapon=makeWeapon(WEAPON_DEFS.find(d=>d.weaponType==='dual_sword').key,[]);g.player.weapons=[g.player.weapon];g.skillChargeSteps=100;window.__game.scene.getScene('UIScene').refresh();
 return {initial,frames,chargeWallStun:true};
 });
 fs.mkdirSync('outputs/qa-bull-release',{recursive:true});await page.waitForTimeout(350);await page.screenshot({path:'outputs/qa-bull-release/pc-bull.png'});
 const box=await page.locator('canvas').boundingBox();const size=await page.evaluate(()=>({w:window.__game.scale.width,h:window.__game.scale.height}));
 await page.mouse.move(box.x+852*box.width/size.w,box.y+506*box.height/size.h);await page.waitForTimeout(80);
 assert.equal(await page.evaluate(()=>window.__game.scene.getScene('GameScene').skillRangePreview?.visible),true,'hover shows range');
 await page.screenshot({path:'outputs/qa-bull-release/pc-skill-range.png'});
 await page.mouse.move(50,50);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>window.__game.scene.getScene('GameScene').skillRangePreview.visible),false,'pointer out hides range');
 await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');g.buildFloor(5,true)});assert.deepEqual(await page.evaluate(()=>{const e=window.__game.scene.getScene('GameScene').enemies.find(e=>e.def.isFloorBoss);return {key:e.def.key,name:e.def.name}}),{key:'m_archdemon',name:'封印王アウレリウス'},'5 boss unchanged');
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:5174/?qa-game&qa-floor=10&qa-boss');await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene'),e=g.enemies.find(e=>e.def.isFloorBoss);g.player.x=e.x;g.player.y=e.y+2;g.placeSprite(g.playerSprite,g.player.x,g.player.y);g.updateVisibility()});await page.waitForTimeout(300);await page.screenshot({path:'outputs/qa-bull-release/mobile-bull.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);console.log(JSON.stringify({result,hover:true,floor5Unchanged:true,mobile:true,errors,failures}));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
