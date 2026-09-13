const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file){
 file=path.resolve(root,file);if(cache.has(file))return cache.get(file).exports;
 const m={exports:{}};cache.set(file,m);
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInThisContext('(function(require,module,exports){'+js+'\n})',{filename:file})(n=>n.startsWith('.')?load(path.resolve(path.dirname(file),n+'.ts')):require(n),m,m.exports);
 return m.exports;
}
const final=load('src/finalDepthBosses.ts'),terrain=load('src/finalDepthTerrain.ts');
const {generateDungeon,generateBossArena,isWalkable,randomFloor}=load('src/dungeon.ts');
const {customFloorBoss}=load('src/customFloorBosses.ts');
const {directionArtForFloor}=load('src/monsterDirections.ts');
const data=load('src/data.ts'),combat=load('src/combat.ts'),{Player}=load('src/player.ts');
const source=fs.readFileSync(path.join(root,'src/scenes/GameScene.ts'),'utf8');
const ast=ts.createSourceFile('GameScene.ts',source,ts.ScriptTarget.Latest,true);
const scene=ast.statements.find(s=>ts.isClassDeclaration(s)&&s.name.text==='GameScene');
const names=new Set(['spawnEnemies','enemyAt','passable','passableBodyCell','occupiedPositions','prepareFinalDepthIntent','resolveFinalDepthIntent','handleBossTurn','prepareBossIntent','resolveBossIntent','validBossTile','isInsideBossCombatFrame','damagePlayerFromBoss','floorHasGate']);
for (const name of ['applyLongStay', 'spawnWanderer', 'doDescend']) names.add(name);
const methods=scene.members.filter(m=>names.has(m.name?.getText(ast)));
assert.equal(methods.length,names.size);
const js=ts.transpileModule('class Harness {'+methods.map(m=>m.getText(ast)).join('\n')+'}',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const H=vm.runInNewContext(js+'\nHarness',{...final,...data,...combat,isWalkable,randomFloor,TILE:32,Audio:{playSe(){}},elementAttackSe:()=>''});
function chain(){const o={x:0,y:0,destroyed:false};for(const f of ['setDepth','setFillStyle','setPosition','setText','setFontSize','setColor'])o[f]=function(...args){if(f==='setText')this.text=args[0];return this;};return o;}
function harness(floor,bossRoom=true){
 const h=new H(),d=bossRoom?generateBossArena(floor):generateDungeon(floor),r=d.bossRoom;
 Object.assign(h,{floor,inBossRoom:bossRoom,dungeon:d,player:{...d.start},enemies:[],ground:[],chests:[],dungeonObjects:[],bossObstacles:[],bossStates:new Map(),bossHazards:[],invisTurns:0,
  chestAt:()=>null,bossObstacleAt:()=>null,dungeonObjectAt:()=>null,bossRoomCells:()=>[],log(){},effectFx(){},hitFx(){},
  faceEnemyToward(){},updateEnemyDirection(){},destroyBossWarningMarker(m){m.plate.destroyed=true;m.label.destroyed=true},
  bossWarningMarkers(tiles,color,p,channel){return tiles.map(t=>({...t,channel,turns:1,plate:chain(),label:chain()}))},
  playDrawnEnemyAttack(e,k,impact){impact();return Promise.resolve();},bossImpactFx(){},damagePlayerFromBoss(e,f,label,element){this.hits.push(element)},hits:[],
  addEnemy(def,x,y){const e={def:{...def},x,y,alive:true};h.enemies.push(e);return e;},
  randomBossCombatFloor(avoid){return randomFloor(d,avoid);},distToPlayer(x,y){return Math.abs(x-h.player.x)+Math.abs(y-h.player.y);},
  spawnMidBossDragon(){h.midSpawned=true},spawnMilestoneBoss(){h.finalSpawned=true},maybeSpawnTreasureRabbit(){h.rabbitChecked=true}
 });
 if(r)h.player={x:r.cx+2,y:r.cy+4};
 return h;
}
function dragon(h){const r=h.dungeon.bossRoom;return {def:{...customFloorBoss(30,'male'),isBoss:true,isFloorBoss:true},x:r.cx,y:r.cy-2,alive:true,hp:100,hpMax:100};}
const elements=['water','fire','ice','dark','fire'];
for(let f=26;f<=30;f++){
 const boss=customFloorBoss(f,'male');assert.equal(data.monsterElement(boss),elements[f-26]);
 assert.equal(directionArtForFloor(f).monsterKey,boss.key);
 boss.hp=1;assert.notEqual(customFloorBoss(f,'male').hp,1);
 for(const room of [false,true])for(let run=0;run<10;run++){
  const h=harness(f,room);h.player={...h.dungeon.start};h.spawnEnemies(f);
  assert.equal(h.enemies.length,final.finalDepthMobCount(f,room,room?(f===30?8:6):15));
  if(f===30){assert.equal(h.midSpawned,undefined);assert.equal(h.rabbitChecked,undefined);if(room)assert.equal(h.finalSpawned,true);}
 }
}
const h=harness(30),d=h.dungeon,r=d.bossRoom,e=dragon(h);h.enemies=[e];
assert.equal(r.w,24);assert.equal(r.h,18);assert.equal(d.finalDepthArena.props.length,7);
assert.equal(new Set(d.finalDepthArena.props.slice(0,5).map(p=>p.part)).size,5);
for(const p of d.finalDepthArena.props)assert.equal(d.tiles[p.y][p.x],'wall');
assert.equal(final.bodyCells(e,1).length,9);
for(const p of final.bodyCells(e,1)){assert.equal(h.enemyAt(p.x,p.y),e);assert.equal(h.enemyAt(p.x,p.y,e),null);}
assert.equal(h.enemyAt(e.x+2,e.y),null);
assert.equal(final.bodyDistance(e,1,{x:e.x+2,y:e.y}),1);
assert.equal(h.occupiedPositions().filter(p=>final.bodyContains(e,1,p)).length,9);
assert.equal(h.passable(e,e.x+1,e.y),true);
h.player={x:e.x+2,y:e.y};assert.equal(h.passable(e,e.x+1,e.y),false,'leading edge cannot overlap player');
h.player={...d.start};
assert.equal(h.passable(e,r.x,r.cy),false,'3x3 body cannot clip walls');
const obstacle=d.finalDepthArena.props[0];assert.equal(h.passable(e,obstacle.x+1,obstacle.y),false,'body cannot clip altar');
assert.equal(h.passable(e,d.stairs.x,d.stairs.y-1),false,'body cannot cover sealed exit');
let seen=new Set([d.start.x+','+d.start.y]),queue=[d.start];
for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const p={x:queue[i].x+dx,y:queue[i].y+dy},key=p.x+','+p.y;if(!seen.has(key)&&d.tiles[p.y]?.[p.x]&&isWalkable(d.tiles[p.y][p.x])){seen.add(key);queue.push(p)}}
for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++)if(isWalkable(d.tiles[y][x]))assert.ok(seen.has(x+','+y),'all arena cells connected');
assert.ok(seen.has(d.stairs.x+','+(d.stairs.y+1)));
const field=generateDungeon(30);assert.ok(field.w*field.h<1000);assert.equal(field.bossRoom,undefined);assert.equal(field.tiles[field.stairs.y][field.stairs.x],'door');
for (const floor of [26,27,28,29,30]) {
 const a=harness(floor);a.floorTurn=200;a.penaltyFlags={};a.spawnWanderer(false);a.applyLongStay();
 assert.equal(a.enemies.length,0,'long fights must not introduce extra boss-room mobs');
}
{
 const a=harness(26,false),room=a.dungeon.bossRoom,mob={def:{},x:room.x-2,y:room.cy};
 assert.equal(a.passable(mob,room.cx,room.cy),false,'field mobs stay outside final-depth midboss rooms');
}
{
 const a=harness(30,false);a.busy=true;a.enterBossRoom=()=>{a.entered=true};a.gameOver=()=>assert.fail('field must not clear the game');
 a.doDescend();assert.equal(a.entered,true);assert.equal(a.busy,false);
 a.inBossRoom=true;a.floorBossDefeated=false;a.bossRewardClaimed=false;a.doDescend();
 a.floorBossDefeated=true;a.bossRewardClaimed=true;a.floorTurn=90;a.addScore=()=>{};a.gameOver=won=>{a.won=won};
 a.doDescend();assert.equal(a.won,true,'cleared final room leads to victory');
}
// Search a safe sequence of moves, using exactly the displayed delay for every wave.
function canEscape(plan,start,valid){
 let choices=[start];
 for(let turn=1;turn<=Math.max(...plan.waves.map(w=>w.turns));turn++){
  const hits=new Set(plan.waves.filter(w=>w.turns===turn).flatMap(w=>w.tiles.map(p=>p.x+','+p.y))),next=new Map();
  for(const p of choices)for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const q={x:p.x+dx,y:p.y+dy},key=q.x+','+q.y;if(valid(q.x,q.y)&&!hits.has(key))next.set(key,q);}
  choices=[...next.values()];if(!choices.length)return false;
 }
 return true;
}
let plans=0;
for(let floor=26;floor<=30;floor++){
 const a=harness(floor),room=a.dungeon.bossRoom,b={x:room.cx,y:room.cy-2};
 const valid=(x,y)=>a.validBossTile(x,y)&&!final.bodyContains(b,floor===30?1:0,{x,y});
 for(let y=room.y;y<room.y+room.h;y+=2)for(let x=room.x;x<room.x+room.w;x+=2){
  if(!valid(x,y))continue;
  for(let phase=0;phase<10;phase++)for(const phaseTwo of [false,true]){
   const plan=final.finalAttackPlan(floor,phase,phaseTwo,b,{x,y},valid);
   assert.ok(plan.waves.every(w=>w.turns>=1&&w.tiles.every(t=>valid(t.x,t.y))));
   if(!plan.waves.some(w=>w.tiles.length))continue;
   assert.ok(canEscape(plan,{x,y},valid),floor+'F unavoidable wave at '+x+','+y+' phase '+phase);
   if(floor===30)assert.equal(plan.waves.length,phaseTwo?(phase%5===4?5:2):1);
   plans++;
  }
 }
}
(async()=>{
 for(const floor of [26,27,28,29,30]){
  const a=harness(floor),room=a.dungeon.bossRoom,b={def:{...customFloorBoss(floor,'male'),isBoss:floor===30},x:room.cx,y:room.cy-2,hp:100,hpMax:100,alive:true};
  for(const phase of [0,1,4]){
   const state={kind:floor===30?'astral_dragon':'mid_final_depth',phase,phaseTwo:floor===30,cooldown:0,stunned:0,coreLabel:chain()};
   a.hits=[];const intent=a.prepareFinalDepthIntent(b,state);assert.ok(intent);
   const original=[...intent.markers];let count=0,last;
   while(intent.markers.length){last=a.resolveFinalDepthIntent(b,state,intent);await last.animation;assert.ok(++count<=7);}
   assert.equal(last.done,true);assert.ok(original.every(m=>m.plate.destroyed&&m.label.destroyed));assert.ok(state.stunned>=1);
   assert.ok(a.hits.every(el=>elements.includes(el)||el==='thunder'));assert.ok(a.hits.length<=count);
   if(floor===30&&phase===4){assert.deepEqual([...new Set(original.map(m=>m.element))],final.FINAL_ELEMENTS);assert.equal(state.stunned,3);}
  }
 }
 const a=harness(30),boss=dragon(a),state={kind:'astral_dragon',phase:0,phaseTwo:false,cooldown:2,stunned:0};
 a.bossStates.set(boss,state);boss.hp=49;a.handleBossTurn(boss);assert.equal(state.phaseTwo,true);
 // Exercise real damage helper: explicit attack element must override the dragon's current core.
 const p=new Player();p.hpMax=p.hp=1000;p.shield=null;
 a.player=p;a.damagePlayer=(damage)=>{a.lastDamage=damage};a.handleShieldBreak=()=>assert.fail('no shield');const realRandom=Math.random;
 try{Math.random=()=>.5;for(const element of final.FINAL_ELEMENTS){
  const expected=combat.computeEnemyAttack(p,boss.def,element).damage;
  H.prototype.damagePlayerFromBoss.call(a,boss,1,'test',element);assert.equal(a.lastDamage,expected);
 }}finally{Math.random=realRandom;}
 console.log('PASS: five new species, sparse spawns, final-only room, 3x3 collision and cover, '+plans+' escapable attack plans, timed elemental damage, phase two and recovery.');
})().catch(e=>{console.error(e);process.exitCode=1;});
