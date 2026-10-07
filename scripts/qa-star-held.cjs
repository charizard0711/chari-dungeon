const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{const p=await b.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:5176/?qa-game&qa-save');await p.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);
const result=await p.evaluate(async()=>{
 const {WEAPON_DEFS}=await import('/src/data.ts'),{makeWeapon}=await import('/src/player.ts'),{rollStarWeapon}=await import('/src/equipmentTraits.ts'),{EquipmentRenderer}=await import('/src/equipmentRenderer.ts'),{playerSheetKey,playerFrameIndex,PLAYER_WORLD_SCALE}=await import('/src/playerAppearance.ts');
 const g=window.__game.scene.getScene('GameScene'),u=window.__game.scene.getScene('UIScene');g.scene.pause();u.add.rectangle(0,0,1280,780,0x253039).setOrigin(0).setDepth(99990);
 let poses=0;for(let i=0;i<WEAPON_DEFS.length;i++){
  const w=rollStarWeapon(makeWeapon(WEAPON_DEFS[i].key,[]),()=>0),sex=i%2?'female':'male',armor=i%4<2?'dawn':'aqua',body=u.add.image(100+i%8*150,80+Math.floor(i/8)*83,playerSheetKey(sex,armor)).setScale(PLAYER_WORLD_SCALE).setDepth(100000),r=new EquipmentRenderer(u);
  for(const dir of ['down','left','right','up'])for(const frame of ['idle','walk1','atk','hurt']){
   body.setFrame(playerFrameIndex(dir,frame));r.update(body,w,null,dir,frame,sex,100);if(w.weaponType==='katana'&&frame!=='atk' ? (!(dir==='down'?r.waistFitting.visible:r.scabbard.visible)||r.weapon.visible) : (!r.weapon.visible||r.weapon.texture.key!=='star_'+w.key||![r.weapon.x,r.weapon.y,r.weapon.rotation,r.weapon.displayWidth].every(Number.isFinite)))throw Error('Invalid held variant '+w.key+dir+frame);poses++;
  }
  body.setFrame(playerFrameIndex('down','idle'));r.update(body,w,null,'down','idle',sex,0);u.add.text(body.x,body.y+29,w.name,{fontSize:'9px',color:'#ffffff'}).setOrigin(.5).setDepth(100001);
 }return {weapons:WEAPON_DEFS.length,poses};
});await p.screenshot({path:'outputs/star-held-all-58.png'});assert.deepEqual(errors,[]);console.log(result);
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
