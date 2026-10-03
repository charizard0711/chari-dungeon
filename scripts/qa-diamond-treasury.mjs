import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

// Load actual pure TS modules without a browser or a second dependency/toolchain.
const root = fileURLToPath(new URL('../src/', import.meta.url));
const cache = new Map();
function load(name) {
  const file = path.resolve(root, name.endsWith('.ts') ? name : `${name}.ts`);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  let source = fs.readFileSync(file, 'utf8');
  if (file.endsWith('dungeon.ts')) source += '\nexport { generateBaseDungeon };';
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(`(function(require,module,exports){${js}\n})`, { Math, console })
    (dep => load(path.resolve(path.dirname(file), dep)), module, module.exports);
  return module.exports;
}
const { generateBaseDungeon, addDiamondTreasury, removeLegacyRoomDoors, TREASURY_CHANCE } = load('dungeon');
const { rollTreasuryReward } = load('treasury');
assert.equal(TREASURY_CHANCE, 0.10);
const clone = value => structuredClone(value);
function reachable(d, target, openDoor = false) {
  const queue = [d.start], seen = new Set();
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i], key = `${p.x},${p.y}`;
    if (seen.has(key)) continue; seen.add(key);
    if (p.x === target.x && p.y === target.y) return true;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const x = p.x + dx, y = p.y + dy, tile = d.tiles[y]?.[x];
      if (tile && tile !== 'wall' && tile !== 'pit' && tile !== 'door' && (tile !== 'roomDoor' || openDoor)) queue.push({x,y});
    }
  }
  return false;
}
let layouts = 0;
for (let floor = 1; floor <= 30; floor++) for (const zone of ['north','south','east','west']) {
  for (const sideRoll of [0, 0.99]) {
    const d = generateBaseDungeon(floor, zone);
    const oldBossOffset = d.bossRoom ? d.bossEntrance.y - d.bossRoom.y : null;
    let calls = 0;
    addDiamondTreasury(d, () => calls++ === 0 ? 0.099999 : sideRoll);
    removeLegacyRoomDoors(d);
    const treasures = d.optionalRooms.filter(room => room.kind === 'diamond');
    assert.equal(treasures.length, 1, `floor ${floor} ${zone}`);
    const {room,door,entry} = treasures[0];
    assert.equal(room.w,7); assert.equal(room.h,7);
    for (let y=room.y; y<room.y+7; y++) for(let x=room.x;x<room.x+7;x++) assert.equal(d.tiles[y][x],'floor');
    assert.equal(d.tiles[door.y][door.x],'roomDoor');
    assert.equal(d.tiles[entry.y][entry.x],'floor');
    assert.equal(d.tiles.flat().filter(tile=>tile==='roomDoor').length,1,'old doors are gone');
    assert.equal(d.tiles.length,d.h);
    assert.ok(d.tiles.every(row=>row.length===d.w));
    assert.ok(room.cy < d.start.y || room.cy > d.start.y);
    if (d.bossRoomZone==='north' || floor===30) assert.ok(room.cy>d.start.y);
    if (d.bossRoomZone==='south') assert.ok(room.cy<d.start.y);
    if (d.bossRoom) assert.equal(d.bossEntrance.y-d.bossRoom.y,oldBossOffset,'boss geometry shifts together');
    const outside = {x:door.x,y:door.y+(entry.y<door.y?1:-1)};
    assert.ok(reachable(d,outside),`reachable gold door floor ${floor} ${zone}`);
    assert.equal(reachable(d,entry),false,'no route can bypass the key');
    assert.ok(reachable(d,{x:room.cx,y:room.cy},true),'unlocked treasury is reachable');
    const before = JSON.stringify(d);
    addDiamondTreasury(d,()=>0);
    assert.equal(JSON.stringify(d),before,'at most one treasury');
    layouts++;
  }
}
const base = generateBaseDungeon(5,'north');
let successes = 0;
for (let bucket=0;bucket<100;bucket++) {
  const d = clone(base);
  addDiamondTreasury(d,()=>bucket/100);
  if(d.optionalRooms.some(room=>room.kind==='diamond'))successes++;
}
assert.equal(successes,10,'exactly the first 10 of 100 probability buckets qualify');
for(const roll of [0.10,0.999999]) {
  const d=clone(base),before=JSON.stringify(d);let calls=0;
  addDiamondTreasury(d,()=>{calls++;return roll;});
  assert.equal(calls,1,'failed roll does not retry');assert.equal(JSON.stringify(d),before);
}
const legacy=clone(base);
for(const room of legacy.optionalRooms){room.opened=false;legacy.tiles[room.door.y][room.door.x]='roomDoor';}
assert.equal(removeLegacyRoomDoors(legacy).length,legacy.optionalRooms.length);
assert.equal(removeLegacyRoomDoors(legacy).length,0,'loading again does not replenish old room contents');
for (const roll of [0,0.999999]) {
  const reward=rollTreasuryReward(()=>roll);
  assert.equal(reward.gold,roll===0?500:1000);assert.equal(reward.weapon.plus,3);
  assert.ok(reward.weapon.element);assert.ok(['A','S'].includes(reward.weapon.grade));
}
const elements=new Set(),keys=new Set();
for(let i=0;i<1000;i++) {
  let calls=0;const reward=rollTreasuryReward(()=>calls++===0 ? i/1000 : (999-i)/1000);
  assert.ok(reward.gold>=500 && reward.gold<=1000);assert.equal(reward.weapon.plus,3);
  assert.ok(['A','S'].includes(reward.weapon.grade));assert.ok(reward.weapon.element);
  elements.add(reward.weapon.element);keys.add(reward.weapon.key);
}
assert.equal(elements.size,4);assert.ok(keys.size>4);
const sceneSource=fs.readFileSync(path.join(root,'scenes/GameScene.ts'),'utf8');
const ast=ts.createSourceFile('GameScene.ts',sceneSource,ts.ScriptTarget.Latest,true);
const scene=ast.statements.find(node=>ts.isClassDeclaration(node)&&node.name.text==='GameScene');
const names=new Set(['openChest','receiveWeapon','updateEnemyShadow']);
const methods=scene.members.filter(member=>names.has(member.name?.getText(ast)));
assert.equal(methods.length,names.size);
const js=ts.transpileModule(`class Harness { ${methods.map(method=>method.getText(ast)).join('\n')} }`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const Harness=vm.runInNewContext(`${js}\nHarness`,{rollTreasuryReward,weaponFullName:w=>w.name,TILE:32,EQUIPMENT_LIMIT:12,Audio:{playSe(){}}});
const sprite=()=>({visible:true,depth:15,x:100,y:100,setTexture(key){this.texture=key;return this;},clearTint(){return this;},setAlpha(a){this.alpha=a;return this;},setPosition(x,y){this.x=x;this.y=y;return this;},setDisplaySize(w,h){this.w=w;this.h=h;return this;},setDepth(d){this.depth=d;return this;},setVisible(v){this.visible=v;return this;}});
for(const count of [1,12]) {
  const h=new Harness();Object.assign(h,{player:{gold:0,weapons:Array(count).fill({})},tweens:{add(){}},pickupBurst(){},addScore(){},log(){},effectFx(){},emitRefresh(){},saveRun(){},recordOwnedEquipment(){},showForcedEquipmentSale(){this.saleShown=true;}});
  const c={diamond:true,rare:true,opened:false,baseScale:1,x:3,y:3,sprite:sprite(),glow:sprite()};
  h.openChest(c);
  assert.equal(c.opened,true);assert.equal(c.sprite.texture,'chest_diamond_open');assert.ok(h.player.gold>=500&&h.player.gold<=1000);
  assert.equal(h.player.weapons.length,count===12?12:2);
  const reward=count===12?h.pendingEquipment.item:h.player.weapons.at(-1);
  assert.equal(reward.plus,3);assert.ok(reward.element);
  if(count===12)assert.equal(h.saleShown,true,'a full inventory preserves the weapon in pendingEquipment');
  const gold=h.player.gold,held=h.player.weapons.length,pending=h.pendingEquipment;
  h.openChest(c);assert.equal(h.player.gold,gold);assert.equal(h.player.weapons.length,held);assert.equal(h.pendingEquipment,pending);
}
for(const def of [{isBoss:true},{isFloorBoss:true}]) {
  const h=new Harness(),e={def,x:4,y:7,alive:true,sprite:sprite(),shadow:sprite()};
  h.updateEnemyShadow(e);assert.equal(e.shadow.x,144);assert.equal(e.shadow.y,246.4);assert.equal(e.shadow.w,32);
  e.sprite.x+=250;e.sprite.y-=400;h.updateEnemyShadow(e);assert.equal(e.shadow.x,144);assert.equal(e.shadow.y,246.4);
  e.x++;h.updateEnemyShadow(e);assert.equal(e.shadow.x,176);
  e.alive=false;h.updateEnemyShadow(e);assert.equal(e.shadow.visible,false);
}
console.log(`PASS: ${layouts} layouts (floors 1–30, all boss sides), 10% boundary/no reroll, 7×7, locked reachability, legacy migration, and 1,002 A+/elemental/+3 rewards.`);
console.log('PASS: real chest/receive methods grant once, retain full-inventory rewards, and anchor boss shadows to the occupied cell.');
