const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];const page=await browser.newPage({viewport:{width:1280,height:800}});
page.on('pageerror',e=>errors.push(e.message));
try{
await page.goto('http://localhost:5174/?qa-game&qa-save');
await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active,{timeout:60000});
const results=await page.evaluate(async()=>{
 const g=window.__game.scene.getScene('GameScene'),u=window.__game.scene.getScene('UIScene');
 const {makeWeapon}=await import('/src/player.ts');const {WEAPON_DEFS}=await import('/src/data.ts');
 const {planSkill,joystickDirection,weaponSkill}=await import('/src/weaponSkills.ts');
 const checks=[];const check=(v,m)=>{if(!v)throw Error(m);checks.push(m)};
 check(joystickDirection(0,0)===null && joystickDirection(30,4)==='right' && joystickDirection(-2,-30)==='up','joystick deadzone and direction');
 const body={};const context={blocked:x=>x===6,enemyAt:x=>x>=1&&x<=3?body:null,canHit:()=>true};
 check(planSkill('dual_sword',{x:0,y:0},'right',context).targets.length===1,'large enemy deduplicated');
 check(planSkill('dual_sword',{x:0,y:0},'right',{...context,blocked:x=>x===3}).tiles.length===2,'wall stops beam');
 const base=g.enemies.find(e=>!e.def.isFloorBoss).def;
 g.enemyTurn=async()=>{};g.pendingEquipment=null;g.inBossRoom=false;g.bossEntranceClosed=false;
 const setup=(type,positions)=>{
  for(const e of g.enemies){e.sprite?.destroy();e.shadow?.destroy();e.hpBar?.destroy()};g.enemies=[];
  g.clearBossMechanics();g.dungeonObjects=[];g.chests=[];g.bossObstacles=[];g.dungeon.bossRoom=undefined;
  for(let y=7;y<=14;y++)for(let x=7;x<=20;x++)g.dungeon.tiles[y][x]='floor';
  g.player.x=10;g.player.y=10;g.player.dir='right';g.playerRootTurns=0;g.skillChargeSteps=100;g.turn=0;g.busy=false;
  g.player.hp=g.player.hpMax=10000;g.player.poisonTurns=0;g.gameEnded=false;
  const def=WEAPON_DEFS.find(d=>d.weaponType===type);g.player.weapon=makeWeapon(def.key,[]);g.player.weapons=[g.player.weapon];
  g.placeSprite(g.playerSprite,10,10);
  return positions.map(([x,y])=>{const e=g.addEnemy({...base,hp:10000,def:0,atk:0,gimmick:undefined},x,y,1);e.facing='down';return e});
 };
 for(const [type,positions,hit] of [
 ['longsword',[[11,10],[11,9],[11,11],[9,10]],[true,true,true,false]],
 ['lance',[[11,10],[12,10],[13,10],[14,10]],[true,true,true,false]],
 ['bow',[[17,10],[18,10]],[true,false]],
 ['handgun',[[12,10],[13,10]],[true,false]],
 ['dual_sword',[[11,10],[13,10],[15,10],[16,10]],[true,true,true,false]],
 ['greatsword',[[11,10],[9,9],[12,12]],[true,true,false]],
 ['dagger',[[12,10],[13,10]],[true,false]]]){
  const es=setup(type,positions);const dur=g.player.weapon.dur;
  check(await g.useWeaponSkill(),type+' cast completes');
  check(es.every((e,i)=>(e.hp<10000)===hit[i]),type+' correct targets');
  check(g.turn===1&&g.skillStepsRemaining===100,type+' costs one turn and empties charge');
  check(g.player.weapon.dur===dur-2,type+' durability charged once');
  if(type==='dagger')check(g.player.x===12&&g.player.y===9,'dagger behind enemy');
  if(type==='greatsword')check(es[0].x===12,'greatsword knockback');
  g.player.weapon=makeWeapon(WEAPON_DEFS.find(d=>d.weaponType==='bow').key,[]);
  check(!(await g.useWeaponSkill())&&g.turn===1,'switching weapon preserves cooldown');
 }
 const es=setup('dagger',[[12,10]]);g.dungeon.tiles[9][12]='wall';
 check(!(await g.useWeaponSkill())&&g.turn===0&&g.skillChargeSteps===100,'blocked dagger destination consumes nothing');
 setup('dual_sword',[[15,10]]);g.dungeon.tiles[10][13]='wall';
 check(await g.useWeaponSkill(),'empty cast allowed behind wall');check(g.turn===1&&g.skillChargeSteps===0,'empty cast spends charge');
 setup('dual_sword',[[15,10]]);await g.useWeaponSkill();g.saveRun();
 const snapshot=JSON.parse(localStorage.getItem('chari-dungeon.run.v1')).snapshot;
 check(snapshot.state.skillChargeSteps===g.skillChargeSteps,'cooldown saved');
 g.restoreRunState(snapshot);check(g.skillStepsRemaining===100,'charge restored');
 g.skillChargeSteps=100;u.refresh();
 check(u.skillButton.visible&&u.skillLabel.style.color==='#55dff3','weapon colored skill icon');
 g.player.weapon=null;u.refresh();check(!u.skillButton.visible&&!(await g.useWeaponSkill()),'bare hands hide skill');
 g.restoreRunState({...snapshot,state:{...snapshot.state,skillChargeSteps:undefined}});check(g.skillChargeSteps===100,'legacy save defaults full charge');
 g.player.weapon=makeWeapon(WEAPON_DEFS.find(d=>d.weaponType==='dual_sword').key,[]);u.refresh();
 setup('dual_sword',[]);await g.useWeaponSkill();
 check(g.skillChargeSteps===0,'no enemy skill consumes charge');
 const alpha=u.skillGlyph.alpha;g.busy=true;u.refresh();check(u.skillGlyph.alpha===alpha,'button remains steady when busy');g.busy=false;
 await g.finishTurn();check(g.skillChargeSteps===0,'waiting does not recharge');
 for(let i=0;i<99;i++)await g.playerAct(i%2?'left':'right');
 check(g.skillChargeSteps===99 && !(await g.useWeaponSkill()),'99 walking steps not ready');
 await g.playerAct('left');check(g.skillChargeSteps===100,'100th walking step ready');
 await g.useWeaponSkill();check(g.skillChargeSteps===0,'100 steps grants exactly one cast');
 g.skillChargeSteps=100;u.refresh();return checks;
});
fs.mkdirSync('outputs/qa-weapon-skills',{recursive:true});await page.screenshot({path:'outputs/qa-weapon-skills/pc.png'});
await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');window.__skillCalls=0;g.useWeaponSkill=async()=>{window.__skillCalls++;return true}});
 await page.keyboard.press('q');assert.equal(await page.evaluate(()=>window.__skillCalls),1,'Q activates skill');
 const desktopBox=await page.locator('canvas').boundingBox();const desktopSize=await page.evaluate(()=>({w:window.__game.scale.width,h:window.__game.scale.height}));
 await page.mouse.click(desktopBox.x+852*desktopBox.width/desktopSize.w,desktopBox.y+506*desktopBox.height/desktopSize.h);assert.equal(await page.evaluate(()=>window.__skillCalls),2,'icon activates skill');
 await page.setViewportSize({width:390,height:844});await page.reload();
await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active,{timeout:60000});
await page.evaluate(async()=>{const g=window.__game.scene.getScene('GameScene');const {makeWeapon}=await import('/src/player.ts');const {WEAPON_DEFS}=await import('/src/data.ts');g.player.weapon=makeWeapon(WEAPON_DEFS.find(d=>d.weaponType==='dual_sword').key,[]);window.__game.scene.getScene('UIScene').refresh()});
const box=await page.locator('canvas').boundingBox();const logical=await page.evaluate(()=>({w:window.__game.scale.width,h:window.__game.scale.height}));
const coord=(x,y)=>({x:box.x+x*box.width/logical.w,y:box.y+y*box.height/logical.h});
const center=coord(76,716),right=coord(110,716);
await page.mouse.move(center.x,center.y);await page.mouse.down();await page.waitForTimeout(150);await page.mouse.move(right.x,right.y);
assert.equal(await page.evaluate(()=>window.__game.scene.getScene('GameScene').touchDir),'right','center press can drag after deadzone');
await page.mouse.up();assert.equal(await page.evaluate(()=>window.__game.scene.getScene('GameScene').touchDir),null);
await page.screenshot({path:'outputs/qa-weapon-skills/mobile.png'});
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:results.length+4,checks:results,errors},null,2));
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
