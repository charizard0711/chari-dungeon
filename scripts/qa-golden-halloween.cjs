const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5175/?qa-silent&qa-save');
 await page.waitForFunction(()=>window.__game?.scene.isActive('TitleScene'),null,{timeout:60000});
 await page.evaluate(()=>window.__game.scene.getScene('TitleScene').scene.start('GameScene',{eventMode:'halloween'}));
 await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active,null,{timeout:60000});
 const results=await page.evaluate(async()=>{
  const g=window.__game.scene.getScene('GameScene'),{makeWeapon,makeShield}=await import('/src/player.ts');
  const {GOLDEN_KING}=await import('/src/halloweenContent.ts');
  const w=makeWeapon('w_hw_emedral',[]),s=makeShield('s_hw_emerald');
  const check=(v,m)=>{if(!v)throw Error(m)};
  check(w.plus===10&&w.grade==='SSS'&&w.name==='エメドラル','weapon definition');
  g.player.weapon=w;g.player.weapons=[w];const e=g.enemies.find(e=>!e.def.isFloorBoss);e.hp=e.hpMax=10000;
  g.player.x=e.x;g.player.y=e.y+1;g.placeSprite(g.playerSprite,g.player.x,g.player.y);
  await g.playerAttack(e,'up',true);check(!e.emedralAffected,'first hit');
  await g.playerAttack(e,'up',true);check(e.stunnedTurns===1&&e.emedralAffected,'second hit stun');
  check(e.freezeFx?.getByName('painted-ice')?.texture.key==='fx_hw_freeze','painted stun crystal');g.updateEnemyFreezeFx(e);check(e.freezeFx.getByName('freeze-turn').text==='スタン 1','stun turn counter');
  check(g.enemyAttackDefinition(e).atkMax===Math.max(1,Math.floor(e.def.atkMax*.7)),'30 percent attack reduction');
  const expiry=e.emedralWeakUntil;g.turn=expiry;check(g.enemyAttackDefinition(e)!==e.def,'fifth turn');
  g.turn++;check(g.enemyAttackDefinition(e)===e.def,'expired after fifth turn');
  await g.playerAttack(e,'up',true);await g.playerAttack(e,'up',true);check(e.emedralWeakUntil===expiry,'same enemy immune');
  g.player.shield=s;g.player.shields=[s];g.player.hpMax=100;g.player.hp=30;
  const before=e.hp;g.damagePlayer(10,'QA',e);check(e.hp===before-2&&g.player.hp===20,'reflection and threshold');
  const start=g.turn;check(g.emeraldGuardActive(),'guard active');
  check(g.emeraldGuardFx?.getByName('painted-barrier')?.texture.key==='fx_hw_barrier','painted invulnerability');
  check(g.emeraldGuardFx.getByName('guard-turn').text==='無敵 3','guard turn counter');
  for(let i=0;i<3;i++){g.turn=start+i;g.damagePlayer(8,'QA',e);check(g.player.hp===20,'three protected turns');}
  g.turn=start+3;g.damagePlayer(1,'QA',e);check(g.player.hp===19&&!g.emeraldGuardActive(),'expires without looping');g.updateEmeraldGuardFx();check(!g.emeraldGuardFx,'barrier removed on expiry');
  g.player.hp=40;g.damagePlayer(20,'QA',e);check(!g.emeraldGuardActive(),'healing cannot bypass cooldown');
  g.turn=start+99;g.player.hp=40;g.damagePlayer(20,'QA',e);check(!g.emeraldGuardActive(),'blocked at turn 99');
  g.turn=start+100;g.player.hp=40;g.damagePlayer(20,'QA',e);check(g.emeraldGuardActive(),'ready at turn 100');
  g.busy=false;g.saveRun();const saved=JSON.parse(localStorage.getItem('chari-dungeon.halloween.run.v1')).snapshot;
  check(saved.enemies.some(x=>x.state.emedralAffected&&x.state.emedralWeakUntil===expiry),'enemy effect saved');
  check(saved.state.emeraldGuardUntil===g.emeraldGuardUntil&&!saved.state.emeraldGuardArmed&&saved.state.emeraldGuardReadyTurn===g.turn+100,'guard and cooldown saved');
  // Deterministic boundary checks use the real spawning and reward code.
  const random=Math.random;let oldEnemies=g.enemies;g.floor=5;
  const spawnAt=(n)=>{Math.random=()=>n;g.enemies=[];g.spawnHalloweenEnemies();const b=g.enemies.find(e=>e.def.isFloorBoss);return b.def.key;};
  try{check(spawnAt(.009)==='m_hw_golden_king','1% rare spawn');check(spawnAt(.01)==='m_hw_king','1% boundary');}finally{Math.random=random;}
  const captured=[];const drop=g.dropEquipment;g.dropEquipment=(x,y,kind,item)=>captured.push(item.key);
  const reward=(rolls,name)=>{captured.length=0;Math.random=()=>rolls.shift()??.9;g.dropBossRewards(undefined,name);return [...captured];};
  try{
   let keys=reward([.099,.1],GOLDEN_KING.name);check(keys.includes(w.key)&&!keys.includes(s.key),'independent bow roll');
   keys=reward([.1,.099],GOLDEN_KING.name);check(!keys.includes(w.key)&&keys.includes(s.key),'independent shield roll');
   keys=reward([0,0],GOLDEN_KING.name);check(keys.includes(w.key)&&keys.includes(s.key),'both drops possible');
   keys=reward([0,0],'収穫王ジャック');check(!keys.includes(w.key)&&!keys.includes(s.key),'normal king excluded');
  }finally{Math.random=random;g.dropEquipment=drop;}
  g.buildFloor(5); const king=g.enemies.find(e=>e.def.isFloorBoss);king.def={...GOLDEN_KING,isFloorBoss:true};king.sprite.setTexture(GOLDEN_KING.key);king.hp=king.hpMax=600;g.player.hp=g.player.hpMax=100;g.player.shield=null;
  g.player.x=king.x;g.player.y=king.y+2;g.placeSprite(g.playerSprite,g.player.x,g.player.y);g.updateVisibility();g.emitRefresh();
  return {weapon:w.name,plus:w.plus,stun:true,weaknessFiveTurns:true,targetImmunity:true,reflection:true,guardThreeTurns:true,cooldown100Turns:true,savePersistence:true,rareSpawnBoundary:true,independentDropBoundaries:true};
 });
 fs.mkdirSync('outputs/qa-golden-halloween',{recursive:true});
 await page.waitForTimeout(400);await page.screenshot({path:'outputs/qa-golden-halloween/emedral.png'});
 await page.evaluate(async()=>{const g=window.__game.scene.getScene('GameScene'),{makeWeapon,makeShield}=await import('/src/player.ts');g.player.weapon=makeWeapon('w_hw_candy',[]);g.player.shield=makeShield('s_hw_emerald');g.emitRefresh();});
 await page.waitForTimeout(300);await page.screenshot({path:'outputs/qa-golden-halloween/shield.png'});
 await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene'),e=g.enemies.find(e=>e.def.isFloorBoss);g.player.hp=15;g.emeraldGuardArmed=true;g.turn=g.emeraldGuardReadyTurn;g.activateEmeraldGuard();e.emedralStunUntil=g.turn+1;g.createPaintedFreeze(e,true);e.sprite.setVisible(true);e.freezeFx.setVisible(true);g.cameras.main.centerOn(e.sprite.x,e.sprite.y);});
 await page.waitForTimeout(300);await page.screenshot({path:'outputs/qa-golden-halloween/painted-status.png'});
 const before=await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');return {y:g.emeraldGuardFx.getAt(0).y,alpha:g.emeraldGuardFx.getAt(1).alpha};});await page.waitForTimeout(350);
 const after=await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');return {y:g.emeraldGuardFx.getAt(0).y,alpha:g.emeraldGuardFx.getAt(1).alpha};});assert.notDeepEqual(before,after,'painted effects animate');
 assert.deepEqual(errors,[]);fs.writeFileSync('outputs/qa-golden-halloween/results.json',JSON.stringify({pass:true,...results},null,2));
 console.log('PASS',results);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
