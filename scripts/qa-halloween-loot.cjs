const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:5175/?qa-silent&qa-save&qa-treasury&qa-gacha-rank=A&qa-gacha-category=weapon');
 await p.waitForFunction(()=>window.__game?.scene.isActive('TitleScene'),null,{timeout:60000});
 await p.evaluate(()=>window.__game.scene.getScene('TitleScene').scene.start('GameScene',{eventMode:'halloween'}));
 await p.waitForFunction(()=>window.__game.scene.getScene('GameScene').playerSprite?.active,null,{timeout:60000});
 const result=await p.evaluate(async()=>{
  const g=window.__game.scene.getScene('GameScene'),{makeItem}=await import('/src/data.ts'),{makePlayerArmor,armorForGrade}=await import('/src/playerAppearance.ts'),{addDiamondTreasury}=await import('/src/dungeon.ts'),{generateHalloweenDungeon}=await import('/src/halloweenDungeon.ts');
  const check=(v,m)=>{if(!v)throw Error(m)},rnd=Math.random;
  const d=generateHalloweenDungeon(1,0,()=>.5);addDiamondTreasury(d,()=>.1);check(d.optionalRooms.length===0,'treasury excluded at 10%');addDiamondTreasury(d,()=>.099);check(d.optionalRooms.length===1,'treasury included below 10%');
  const room=g.dungeon.optionalRooms.find(o=>o.kind==='diamond'),chest=g.chests.find(c=>c.diamond);check(room&&chest,'gold door and diamond chest');check(chest.sprite.texture.key==='chest_diamond','diamond appearance');
  g.openChest(chest);check(!chest.opened,'sealed chest blocked');
  const dx=room.door.x-room.entry.x,dy=room.door.y-room.entry.y;
  g.player.x=room.door.x+dx;g.player.y=room.door.y+dy;g.placeSprite(g.playerSprite,g.player.x,g.player.y);
  const dir=dx>0?'left':dx<0?'right':dy>0?'up':'down';
  g.player.inventory.push(makeItem('floorkey'));await g.playerAct(dir);check(!room.opened,'normal key rejected');
  g.player.inventory.push(makeItem('candykey'));await g.playerAct(dir);check(room.opened,'candy key opens door');check(!g.player.inventory.some(i=>i.kind==='candykey'),'one key consumed');
  const received=[],receive=g.receiveWeapon;g.receiveWeapon=w=>{received.push(w.key);return true};
  for(const roll of [0,.2,.4,.6,.8,.999]){chest.opened=false;Math.random=()=>roll;g.openChest(chest);}
  Math.random=rnd;g.receiveWeapon=receive;check(new Set(received).size===5&&received.every(k=>k.startsWith('w_hw_')&&k!=='w_hw_emedral'),'all five event weapons, no strongest');
  const drops=[],drop=g.dropEquipment,item=g.dropItem;
  g.dropEquipment=(x,y,kind,e)=>drops.push(e.key);g.dropItem=()=>{};
  try{
   for(const gender of ['male','female']){g.playerGender=gender;g.floor=5;Math.random=()=>.049;g.dropBossRewards(undefined,'収穫王ジャック');check(drops.includes(`pumpkin_${gender}`),'5% costume matches gender');drops.length=0;Math.random=()=>.05;g.dropBossRewards(undefined,'収穫王ジャック');check(!drops.some(k=>k.startsWith('pumpkin_')),'5% boundary');drops.length=0;}
   g.floor=4;Math.random=()=>0;g.dropBossRewards(undefined,'首なし騎士グリム');check(!drops.some(k=>k.startsWith('pumpkin_')),'costume final boss only');check(!drops.some(k=>k.startsWith('w_hw_')||k.startsWith('s_hw_')),'ordinary boss gear');
  }finally{Math.random=rnd;g.dropEquipment=drop;g.dropItem=item;}
  check(armorForGrade('A').key==='arcane'&&!g.availableArmorDefs(30).some(a=>a.exclusiveLoot),'costumes excluded from ordinary pools');
  const keys=[],dropItem=g.dropItem;g.dropItem=(x,y,kind)=>keys.push(kind);
  try{
   Math.random=()=>.01;let e=g.enemies.find(e=>!e.def.isFloorBoss);g.killEnemy(e,0);check(!keys.includes('candykey'),'1% drop boundary');keys.length=0;
   Math.random=()=>.009;e=g.enemies.find(e=>!e.def.isFloorBoss);g.killEnemy(e,0);check(keys.includes('candykey'),'1% key drop');
  }finally{Math.random=rnd;g.dropItem=dropItem;}
  g.player.gold=10000;g.busy=false;g.pendingEquipment=null;g.weaponWonThisFloor=false;
  Math.random=()=>.5;const ordinary=g.gachaPull('weapon');check(!ordinary.texKey.startsWith('w_hw_'),'gacha ordinary gear');
  g.weaponWonThisFloor=false;g.pendingEquipment=null;Math.random=()=>.02;const event=g.gachaPull('weapon');check(event.texKey.startsWith('w_hw_')&&event.texKey!=='w_hw_emedral','gacha event gear excluding strongest');Math.random=rnd;
  for(const gender of ['male','female']){
   g.playerGender=gender;g.receiveArmor(makePlayerArmor(`pumpkin_${gender}`),'QA');const index=g.player.armors.findIndex(a=>a.key===`pumpkin_${gender}`);g.equipArmor(index);
   check(g.playerSprite.texture.key===`player_${gender}_pumpkin_${gender}`,'pumpkin player skin');
   for(const dir of ['down','left','right','up'])for(const frame of ['idle','walk1','atk','down']){g.setPlayerVisual(dir,frame);check(g.playerSprite.frame.realWidth===96,'directional/action frame');}
  }
  g.busy=false;g.saveRun();const saved=JSON.parse(localStorage.getItem('chari-dungeon.halloween.run.v1')).snapshot;check(saved.dungeon.optionalRooms.some(o=>o.opened),'gold door state saved');check(saved.player.armors.some(a=>a.key==='pumpkin_female'),'costume saved');
  g.setPlayerVisual('down','idle');g.emitRefresh();
  return {pass:true,key1Percent:true,door10Percent:true,keyConsumption:true,diamondFiveWeapons:true,ordinaryGear:true,mixedGacha:true,costume5Percent:true,bothGenderSkins:true,savePersistence:true};
 });assert.deepEqual(errors,[]);fs.mkdirSync('outputs/qa-halloween-loot',{recursive:true});await p.screenshot({path:'outputs/qa-halloween-loot/costume.png'});fs.writeFileSync('outputs/qa-halloween-loot/results.json',JSON.stringify(result,null,2));console.log(result);await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
