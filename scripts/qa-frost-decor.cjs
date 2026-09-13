const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..'), cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename: file })(
    name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name), module, module.exports);
  return module.exports;
}
const { generateDungeon, generateBossArena, isWalkable } = load('src/dungeon.ts');
const { eraSuffix } = load('src/data.ts');
const { hasRuinTerrain, ruinTerrainKey, ruinFloorKey, ruinFloorFrame } = load('src/ruinTerrain.ts');
const volcano = load('src/volcanoTerrain.ts');
const water = load('src/waterTerrain.ts');
const thunder = load('src/thunderTerrain.ts');
const finalDepth = load('src/finalDepthTerrain.ts');
const source = fs.readFileSync(path.join(root, 'src/scenes/GameScene.ts'), 'utf8');
const ast = ts.createSourceFile('GameScene.ts', source, ts.ScriptTarget.Latest, true);
const scene = ast.statements.find(s => ts.isClassDeclaration(s) && s.name.text === 'GameScene');
const names = new Set(['usesGlacialTerrain', 'tileVisual', 'ruinFloorVisual', 'volcanoFloorVisual', 'waterFloorVisual', 'thunderFloorVisual', 'createWallFacades', 'roomPropTexture', 'roomPropRenderTiles',
  'roomPropChoices', 'roomPropCandidates', 'canPlaceRoomProp', 'canPlacePermanentDecor', 'isReservedOptionalRoomCell', 'spawnDungeonObjects', 'spawnRoomProps', 'spawnFieldBossRoomProps', 'dungeonObjectAt',
  'isInsideBossCombatFrame', 'validBossTile', 'validMonsterTile', 'bossArenaPosition']);
names.add('finalDepthFloorVisual');
const methods = scene.members.filter(m => names.has(m.name?.getText(ast)));
assert.equal(methods.length, names.size);
const js = ts.transpileModule(`class Harness {${methods.map(m => m.getText(ast)).join('\n')}}`, {
  compilerOptions: { target: ts.ScriptTarget.ES2020 }
}).outputText;
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
  return array;
}
const Harness = vm.runInNewContext(js + '\nHarness', { ...finalDepth, ...thunder, ...water, ...volcano, isWalkable, eraSuffix, hasRuinTerrain, ruinTerrainKey, ruinFloorKey, ruinFloorFrame, TILE: 32, Phaser: { Utils: { Array: { Shuffle: shuffle } } } });
function reachable(d, blocked) {
  const seen = new Set([`${d.start.x},${d.start.y}`]), queue = [d.start];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = p.x + dx, y = p.y + dy, key = `${x},${y}`, tile = d.tiles[y]?.[x];
      // Include doors when checking topology: every optional room must still be accessible after opening it.
      if (!tile || tile === 'wall' || tile === 'pit' || blocked.has(key) || seen.has(key)) continue;
      seen.add(key); queue.push({ x, y });
    }
  }
  return seen;
}
const kinds = ['iceCrystal', 'iceObelisk', 'snowBoulder', 'iceAltar'];
const textures = ['terrain_glacial_crystal', 'terrain_glacial_obelisk', 'terrain_glacial_boulder', 'terrain_glacial_altar'];
let maps = 0, props = 0;
const originalRandom = Math.random;
let seed = 741901;
Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
try {
  for (let floor = 1; floor <= 30; floor++) for (let run = 0; run < 25; run++) {
    const h = new Harness(); h.floor = floor; h.dungeon = generateDungeon(floor); h.inBossRoom = false; h.dungeonObjects = [];
    h.addDungeonObject = (kind, x, y, w, height, breakable) => h.dungeonObjects.push({ kind, x, y, w, h: height, breakable });
    const blockedCells = () => {
      const cells = new Set();
      for (let y = 0; y < h.dungeon.h; y++) for (let x = 0; x < h.dungeon.w; x++) {
        const object = h.dungeonObjectAt(x, y);
        if (object && !object.breakable) cells.add(`${x},${y}`);
      }
      return cells;
    };
    h.spawnDungeonObjects(floor);
    const before = reachable(h.dungeon, blockedCells());
    const originalTiles = JSON.stringify(h.dungeon.tiles);
    h.spawnRoomProps(floor);
    const blocked = blockedCells(), after = reachable(h.dungeon, blocked);
    for (const cell of before) if (!blocked.has(cell)) assert.ok(after.has(cell), `${floor}F run${run}: decor severs ${cell}`);
    assert.equal(JSON.stringify(h.dungeon.tiles), originalTiles, 'do not alter the maze or ice sliding tiles');
    assert.ok(h.dungeonObjects.filter(p => p.breakable).length >= 6, `${floor}F run${run}: keep exploration supply containers`);
    const room = h.dungeon.bossRoom;
    if (room) {
      assert.equal(room.w, 10); assert.equal(room.h, 10);
      const inside = p => p.x >= room.x && p.x < room.x + room.w && p.y >= room.y && p.y < room.y + room.h;
      const roomProps = h.dungeonObjects.filter(inside);
      assert.ok(roomProps.length >= 6 && roomProps.length <= 8, `${floor}F: six to eight props, found ${roomProps.length}`);
      assert.ok(!roomProps.some(p => p.x >= room.x + 3 && p.x <= room.x + 6 && p.y >= room.y + 3 && p.y <= room.y + 6), 'open central four-by-four square');
      assert.ok(after.has(`${h.dungeon.bossEntry.x},${h.dungeon.bossEntry.y}`), 'entry is reachable');
      assert.ok(after.has(`${room.cx},${room.cy}`), 'central seal is reachable');
      assert.ok(!h.dungeonObjects.some(p => inside(p) && (p.x === room.cx || p.y === room.cy)), 'clear central cross');
      h.player = h.dungeon.start; h.enemyAt = () => null;
      const spawn = h.bossArenaPosition();
      assert.ok(spawn && inside(spawn) && !h.dungeonObjectAt(spawn.x, spawn.y), 'boss spawns away from props');
      for (const prop of h.dungeonObjects.filter(inside)) {
        assert.equal(h.validBossTile(prop.x, prop.y), false, 'boss teleport/charge must avoid props');
        assert.equal(h.validMonsterTile(prop.x, prop.y), false, 'summons must avoid props');
      }
    }
    if (hasRuinTerrain(floor)) {
      for (const kind of ['ruinRelic', 'ruinRubble']) assert.ok(h.dungeonObjects.some(p => p.kind === kind), `${floor}F missing ${kind}`);
      assert.equal(h.tileVisual('wall', 1, 0, 0).key, ruinTerrainKey(floor, 'wall-b'));
      const frames = new Set();
      for (let y = 0; y < h.dungeon.h; y++) for (let x = 0; x < h.dungeon.w; x++) {
        if (h.dungeon.tiles[y][x] !== 'floor' || (h.dungeon.bossEntry?.x === x && h.dungeon.bossEntry?.y === y)) continue;
        const visual = h.tileVisual('floor', 1, x, y);
        assert.equal(visual.key, ruinFloorKey(floor));
        assert.ok(visual.frame >= 0 && visual.frame < 6);
        frames.add(visual.frame);
      }
      assert.equal(frames.size, 6, 'all painted floor variants are used');
      assert.equal(h.tileVisual('stairs', 1, h.dungeon.stairs.x, h.dungeon.stairs.y).key, 'terrain_stairs');
      assert.equal(h.tileVisual('poison', 1, 1, 1).key, 'terrain_hazard_poison');
      h.createWallFacades(1);
    }
    if (water.hasWaterTerrain(floor)) {
      for (const kind of water.WATER_PROP_KINDS) assert.ok(h.dungeonObjects.some(p => p.kind === kind), `${floor}F missing ${kind}`);
      assert.equal(h.tileVisual('wall', 1, 0, 0).key, water.waterTerrainKey(floor, 'wall-b') + '_ground');
      const frames = new Set();
      for (let y = 0; y < h.dungeon.h; y++) for (let x = 0; x < h.dungeon.w; x++) {
        if (h.dungeon.tiles[y][x] !== 'floor' || (h.dungeon.bossEntry?.x === x && h.dungeon.bossEntry?.y === y)) continue;
        const visual = h.tileVisual('floor', 1, x, y);
        assert.equal(visual.key, water.waterTerrainKey(floor, 'floor'));
        assert.ok(visual.frame >= 0 && visual.frame < 4); frames.add(visual.frame);
      }
      assert.equal(frames.size, 4, 'all water floor variants are used');
      assert.equal(h.tileVisual('poison', 1, 1, 1).key, 'terrain_hazard_poison');
      assert.equal(h.tileVisual('ice', 1, 1, 1).key, 'terrain_hazard_ice');
      h.createWallFacades(1);
    }
    if (thunder.hasThunderTerrain(floor)) {
      for (const kind of thunder.THUNDER_PROP_KINDS) assert.ok(h.dungeonObjects.some(p => p.kind === kind), `${floor}F missing ${kind}`);
      assert.equal(h.tileVisual('wall', 1, 0, 0).key, thunder.thunderTerrainKey(floor, 'wall-b') + '_ground');
      const frames = new Set();
      for (let y = 0; y < h.dungeon.h; y++) for (let x = 0; x < h.dungeon.w; x++) {
        if (h.dungeon.tiles[y][x] !== 'floor' || (h.dungeon.bossEntry?.x === x && h.dungeon.bossEntry?.y === y)) continue;
        const visual = h.tileVisual('floor', 1, x, y);
        assert.equal(visual.key, thunder.thunderTerrainKey(floor, 'floor'));
        assert.ok(visual.frame >= 0 && visual.frame < 4); frames.add(visual.frame);
      }
      assert.equal(frames.size, 4);
      h.createWallFacades(1);
    }
    if (h.dungeon.biome === 'frost' && !finalDepth.hasFinalDepthTerrain(floor)) {
    for (const [i, kind] of kinds.entries()) {
      assert.ok(h.dungeonObjects.some(p => p.kind === kind), `${floor}F missing ${kind}`);
      assert.equal(h.roomPropTexture(kind), textures[i]);
    }
    assert.equal(h.usesGlacialTerrain(), true);
    assert.equal(h.tileVisual('wall', 2, 0, 0).key, 'terrain_glacial_wall');
    assert.equal(h.tileVisual('ice', 2, 1, 1).key, 'terrain_hazard_ice');
    h.createWallFacades(2); // Must return before any Phaser image construction.
    }
    maps++; props += h.dungeonObjects.length;
  }
  const h = new Harness();
  for (const floor of thunder.THUNDER_FLOORS) {
    h.floor = floor; h.dungeon = generateBossArena(floor); h.inBossRoom = true; h.dungeonObjects = [];
    const d = h.dungeon, r = d.bossRoom, seen = reachable(d, new Set());
    assert.equal(d.thunderArena.props.length, 8);
    if (floor === 25) {
      assert.equal(r.w, 16); assert.equal(r.h, 14);
      assert.equal(d.tiles[r.y][r.x], 'wall');
    }
    for (const p of d.thunderArena.props) {
      assert.equal(d.tiles[p.y][p.x], 'wall');
      assert.equal(h.tileVisual('wall', 1, p.x, p.y).key, thunder.thunderTerrainKey(floor, 'floor'));
      assert.equal(h.validBossTile(p.x, p.y), false);
    }
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      if (d.tiles[y][x] !== 'wall') assert.ok(seen.has(`${x},${y}`), 'storm arena reachable');
      if (x === r.cx || y === r.cy) assert.notEqual(d.tiles[y][x], 'wall', 'storm axes clear');
    }
    assert.equal(h.tileVisual('wall', 1, 0, 0).key, 'terrain_thunder_clouds');
    assert.equal(h.tileVisual('door', 1, d.stairs.x, d.stairs.y).key, 'terrain_boss_chain_gate');
  }
  for (const floor of water.WATER_FLOORS) {
    h.floor = floor; h.dungeon = generateBossArena(floor); h.inBossRoom = true; h.dungeonObjects = [];
    const d = h.dungeon, r = d.bossRoom, seen = reachable(d, new Set());
    assert.equal(d.waterArena.props.length, 8);
    for (const p of d.waterArena.props) {
      assert.equal(d.tiles[p.y][p.x], 'wall', 'props block movement and projectiles');
      assert.equal(h.tileVisual('wall', 1, p.x, p.y).key, water.waterTerrainKey(floor, 'floor'), 'no rock wall beneath props');
      assert.equal(h.validBossTile(p.x, p.y), false, 'boss avoids props');
    }
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      if (d.tiles[y][x] !== 'wall') assert.ok(seen.has(`${x},${y}`), 'all arena floor reachable');
      if (x === r.cx || y === r.cy) assert.notEqual(d.tiles[y][x], 'wall', 'both central axes clear');
    }
    assert.equal(h.tileVisual('wall', 1, 0, 0).key, 'terrain_water_surface');
    assert.equal(h.tileVisual('wall', 1, r.x - 1, r.cy).key.endsWith('_water'), true);
    assert.equal(h.tileVisual('door', 1, d.stairs.x, d.stairs.y).key, 'terrain_boss_chain_gate');
  }
  for (const floor of [5, 10, 15, 20, 25, 30]) {
    h.floor = floor; h.dungeon = generateBossArena(floor); h.inBossRoom = true;
    assert.equal(h.usesGlacialTerrain(), floor === 15, 'ice arena moves to 15F, furnace to 20F');
  }
  for (const floor of [1, 6, 16, 21, 26]) {
    h.floor = floor; h.dungeon = generateDungeon(floor); h.inBossRoom = false;
    assert.equal(h.usesGlacialTerrain(), false);
    assert.ok(!h.roomPropChoices().some(k => kinds.includes(k)));
  }
} finally { Math.random = originalRandom; }
console.log(`PASS: ${maps} maps across all 30 floors / ${props} props; 10x10 midboss rooms with 6–8 props, open centers, six painted floor variants, no severed routes, original hazards and supplies.`);
