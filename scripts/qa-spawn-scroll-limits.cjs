const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(filename) {
  filename = path.resolve(root, filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename })(name => name.startsWith('.')
    ? load(path.resolve(path.dirname(filename), name + '.ts')) : require(name), module, module.exports);
  return module.exports;
}
const { NORMAL_MONSTER_DEFS, MONSTER_DEFS } = load('src/data.ts');
assert.ok(MONSTER_DEFS.some(m => m.key.startsWith('m_hw_')), 'event codex remains intact');
assert.ok(NORMAL_MONSTER_DEFS.every(m => !m.key.startsWith('m_hw_')));
const source = fs.readFileSync(path.join(root, 'src/scenes/GameScene.ts'), 'utf8');
const ast = ts.createSourceFile('GameScene.ts', source, ts.ScriptTarget.Latest, true);
const scene = ast.statements.find(n => ts.isClassDeclaration(n) && n.name.text === 'GameScene');
const names = ['claimRegularEnhancementScroll', 'grantRegularEnhancementScroll', 'dropGuaranteedBossScroll',
  'milestoneFloorCleared', 'applyLongStay', 'spawnWanderer', 'spawnEnemies', 'summonGimmickMonsters'];
const cls = `class Harness {${scene.members.filter(n => names.includes(n.name?.getText(ast))).map(n => n.getText(ast)).join('\n')}}`;
const Harness = vm.runInNewContext(ts.transpileModule(cls + '; Harness', {
  compilerOptions: { target: ts.ScriptTarget.ES2020 }
}).outputText, { NORMAL_MONSTER_DEFS, MONSTER_DEFS, hasFinalDepthTerrain: () => false,
  finalDepthMobCount: (floor, boss, count) => count, makeItem: kind => ({ kind }),
  randomFloor: () => ({ x: 10, y: 10 }) });
function harness() {
  return Object.assign(new Harness(), { floor: 1, floorBossDefeated: false, inBossRoom: false, eventMode: null,
    enhancementScrollClaimedBlocks: [], enhancementScrollDrops: { stone: false, shieldstone: false },
    reservedBossScroll: null, drops: [], enemies: [], dungeon: {}, player: { inventory: [] },
    occupiedPositions: () => [], bossRoomCells: () => [], distToPlayer: () => 10,
    addEnemy(def) { this.enemies.push({ alive: true, def }); }, maybeSpawnTreasureRabbit() {}, spawnMidBossDragon() {},
    dropItem(x, y, kind) { this.drops.push(kind); }, log() {},
    penaltyFlags: {}, floorTurn: 200 });
}
const h = harness();
assert.ok(h.claimRegularEnhancementScroll());
assert.equal(h.claimRegularEnhancementScroll(), null);
h.floor = 2; h.enhancementScrollDrops = { stone: false, shieldstone: false };
assert.equal(h.dropGuaranteedBossScroll(0, 0), null, 'next floor shares the cap');
h.floor = 3; h.reservedBossScroll = 'shieldstone';
assert.equal(h.grantRegularEnhancementScroll(), null, 'boss reservation shares regular loot cap');
assert.equal(h.dropGuaranteedBossScroll(0, 0), 'shieldstone');
assert.equal(h.dropGuaranteedBossScroll(0, 0), null, 'another boss cannot drop a second scroll');
h.floor = 4; assert.equal(h.claimRegularEnhancementScroll(), null);
h.floor = 5; h.reservedBossScroll = null; assert.ok(h.claimRegularEnhancementScroll());
const saved = JSON.parse(JSON.stringify(h.enhancementScrollClaimedBlocks));
const resumed = harness(); resumed.floor = 6; resumed.enhancementScrollClaimedBlocks = saved;
assert.equal(resumed.dropGuaranteedBossScroll(0, 0), null, 'serializable cap survives resume');
for (let floor = 1; floor <= 30; floor++) {
  const ordinary = harness(); ordinary.floor = floor;
  ordinary.spawnEnemies(floor); ordinary.spawnWanderer(false); ordinary.spawnWanderer(true);
  assert.ok(ordinary.enemies.length);
  assert.ok(ordinary.enemies.every(e => !e.def.key.startsWith('m_hw_')), `normal floor ${floor}`);
}
for (const floor of [5, 10, 15, 20, 25, 30]) {
  const cleared = harness(); cleared.floor = floor; cleared.floorBossDefeated = true;
  cleared.applyLongStay(); cleared.spawnWanderer(false); cleared.spawnWanderer(true);
  cleared.summonGimmickMonsters({}, 'm_hw_pumpkin', 3);
  assert.equal(cleared.enemies.length, 0, `cleared boss floor ${floor} stays quiet`);
}
console.log('PASS: normal stages exclude Halloween enemies; cleared milestone floors stop spawning; one shared scroll per two floors, including bosses and resume');
