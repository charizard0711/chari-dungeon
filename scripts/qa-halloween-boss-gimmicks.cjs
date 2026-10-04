const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
await page.goto('http://localhost:5175/?qa-silent&qa-save');
await page.waitForFunction(()=>window.__game?.scene.isActive('TitleScene'));
await page.evaluate(()=>window.__game.scene.getScene('TitleScene').scene.start('GameScene',{eventMode:'halloween'}));
await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);
const results=await page.evaluate(async()=>{
const g=window.__game.scene.getScene('GameScene'), {HALLOWEEN_BOSSES,GOLDEN_KING}=await import('/src/halloweenContent.ts');
const {makeWeapon}=await import('/src/player.ts');
const check=(v,msg)=>{if(!v)throw Error(msg)};
check(HALLOWEEN_BOSSES.map(b=>b.hp).join(',')==='300,400,490,620,900'&&GOLDEN_KING.hp===1200,'double HP');
check(window.__game.scene.getScene('UIScene').theme.panel==='ui_difficulty_hard'&&g.difficulty==='normal','blue frame without difficulty change');
const setup=(floor,golden=false)=>{
g.floor=floor;g.buildFloor(floor);g.player.hp=g.player.hpMax=10000;
let boss=g.enemies.find(e=>e.def.isFloorBoss);if(golden){boss.def={...boss.def,...GOLDEN_KING,isFloorBoss:true};boss.hp=boss.hpMax=1200;}
const state=g.bossStates.get(boss),r=g.dungeon.bossRoom;
g.player.x=r.cx;g.player.y=r.cy+2;g.placeSprite(g.playerSprite,g.player.x,g.player.y);
g.tickHalloweenBoss(boss,state);return{boss,state};};
let{boss,state}=setup(1);boss.hp=140;
let intent=g.prepareBossIntent(boss,state);state.intent=intent;
check(g.halloweenObjects(boss,'bomb').length===3,'three bombs');
check(intent.markers.some(m=>m.turns===2)&&intent.markers.some(m=>m.turns===3)&&intent.markers.some(m=>m.turns===4),'bomb and slash timings');
const bomb=g.halloweenObjects(boss,'bomb')[0],before=intent.markers.length,ground=g.ground.length,exp=g.player.exp;
g.killEnemy(bomb,0);check(intent.markers.length<before&&g.ground.length===ground&&g.player.exp===exp,'bomb destruction cancels blast and no loot');
({boss,state}=setup(2));check(g.halloweenObjects(boss,'lantern').length===2,'two lanterns');
check(g.playerDamageAgainstGimmick(boss,100)===50,'lantern defense');
intent=g.prepareBossIntent(boss,state);state.intent=intent;
for(const o of [...g.halloweenObjects(boss,'lantern')])g.killEnemy(o,0);
check(!state.intent&&state.stunned===2&&g.playerDamageAgainstGimmick(boss,100)===100,'lantern destruction interrupts');
({boss,state}=setup(3));check(g.halloweenObjects(boss,'decoy').length===2,'two decoys');
intent=g.prepareBossIntent(boss,state);state.intent=intent;g.playerDamageAgainstGimmick(boss,Math.ceil(boss.hpMax*.08));
check(!state.intent&&state.stunned===1,'damage interrupts witch');
const decoy=g.halloweenObjects(boss,'decoy')[0];g.killEnemy(decoy,0);check(g.bossHazards.some(h=>h.kind==='poison'&&h.x===decoy.x&&h.y===decoy.y),'decoy poison');
state.stunned=0;state.intent=g.prepareBossIntent(boss,state);const weapon=makeWeapon('w_hw_emedral',[]);weapon.specialCounter=1;g.applyEmedralHit(boss,weapon);check(!state.intent,'stun interrupts cast');
({boss,state}=setup(4));const [dx,dy]=g.dirVec(boss.facing);g.player.x=boss.x+dx;g.player.y=boss.y+dy;
check(g.playerDamageAgainstGimmick(boss,100)===50,'knight front armor');state.stunned=2;check(g.playerDamageAgainstGimmick(boss,100)===150,'knight recovery vulnerability');state.stunned=0;
intent=g.prepareBossIntent(boss,state);check([1,2,3].every(t=>intent.markers.some(m=>m.turns===t)),'three knight waves');
while(intent.markers.length){const resolved=g.resolveBossIntent(boss,state,intent);if(resolved.animation)await resolved.animation;}
check(state.stunned===2,'knight recovery');
({boss,state}=setup(5));check(g.halloweenObjects(boss,'heart').length===2,'two hearts');boss.hp=100;state.halloweenTurn=3;g.tickHalloweenBoss(boss,state);check(boss.hp===172,'heart healing');for(const o of [...g.halloweenObjects(boss,'heart')])g.killEnemy(o,0);state.halloweenTurn=7;g.tickHalloweenBoss(boss,state);check(boss.hp===172,'destroyed hearts stop healing');
({boss,state}=setup(5,true));intent=g.prepareBossIntent(boss,state);state.intent=intent;check(intent.markers.every(m=>m.turns===3),'golden three turn warning');
const guard=g.enemies.find(e=>e.def.isHalloweenRetainer);g.killEnemy(guard,0);check(state.goldenSafe.length===1,'guard creates sanctuary');g.player.x=guard.x;g.player.y=guard.y;let hp=g.player.hp;
while(intent.markers.length){const resolved=g.resolveBossIntent(boss,state,intent);if(resolved.animation)await resolved.animation;}
check(g.player.hp===hp&&state.stunned===2,'golden sanctuary and recovery');check(g.playerDamageAgainstGimmick(boss,100)===150,'broken gold armor');
g.updateVisibility();g.busy=false;g.saveRun();const save=JSON.parse(localStorage.getItem('chari-dungeon.halloween.run.v1'));check(!!save,'encounter save');
return{doubleHp:true,blueFrame:true,bombs:true,lanterns:true,witchInterrupt:true,decoyPoison:true,knightWaves:true,heartHealing:true,goldenSafe:true,save:true};
});
await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');g.scene.stop('UIScene');g.scene.start('GameScene',{eventMode:'halloween',resume:true});});
await page.waitForFunction(()=>window.__game.scene.getScene('GameScene').playerSprite?.active&&!window.__game.scene.getScene('GameScene').restoringRun);
assert.equal(await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene'),b=g.enemies.find(e=>e.def.isFloorBoss),s=g.bossStates.get(b);return g.halloweenObjects(b,'heart').length===2&&s.goldenSafe.length===1&&s.halloweenStarted&&b.hpMax===1200;}),true);
await page.screenshot({path:'outputs/qa-halloween/boss-gimmicks-blue.png'});assert.deepEqual(errors,[]);
fs.writeFileSync('outputs/qa-halloween/boss-gimmicks-results.json',JSON.stringify({pass:true,...results},null,2));console.log('PASS',results);
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
