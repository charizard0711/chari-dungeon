const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
// Execute the real pure game modules without booting Phaser.
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const localRequire = name => name.startsWith('.')
    ? load(path.resolve(path.dirname(filename), name + '.ts')) : require(name);
  const execute = vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename });
  execute(localRequire, module, module.exports);
  return module.exports;
}
const { customFloorBoss } = load('src/customFloorBosses.ts');
const { generateBossArena, isWalkable } = load('src/dungeon.ts');
const iceArena = generateBossArena(20);
assert.equal(iceArena.biome, 'frost');
assert.equal(iceArena.tiles[iceArena.bossRoom.y][iceArena.bossRoom.x], 'wall', 'cut arena corners');
assert.equal(iceArena.tiles[iceArena.start.y][iceArena.start.x], 'floor', 'safe entrance');
assert.equal(iceArena.tiles[iceArena.stairs.y][iceArena.stairs.x], 'door', 'exit stays sealed until victory');
assert.equal(new Set(iceArena.glacialArena.props.map(p => p.kind)).size, 4);
for (const prop of iceArena.glacialArena.props) {
  assert.equal(iceArena.tiles[prop.y][prop.x], prop.blocking ? 'wall' : 'floor');
}
const reachable = new Set([`${iceArena.start.x},${iceArena.start.y}`]), queue = [iceArena.start];
for (let i = 0; i < queue.length; i++) {
  const p = queue[i];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = p.x + dx, y = p.y + dy, key = `${x},${y}`, tile = iceArena.tiles[y]?.[x];
    if (!tile || !isWalkable(tile) || reachable.has(key)) continue;
    reachable.add(key); queue.push({ x, y });
  }
}
iceArena.tiles.forEach((row, y) => row.forEach((tile, x) => {
  if (isWalkable(tile)) assert.ok(reachable.has(`${x},${y}`), `unreachable icy floor ${x},${y}`);
  assert.notEqual(tile, 'ice', 'ice artwork must not make every step slide');
}));
assert.ok(reachable.has(`${iceArena.stairs.x},${iceArena.stairs.y + 1}`), 'exit is approachable');
for (const floor of [5, 10, 15, 25, 30]) assert.equal(generateBossArena(floor).glacialArena, undefined);
const { monsterElement, elementMultiplier, MONSTER_DEFS, ELEMENT_INFO, WEAPON_DEFS, SHIELD_DEFS } = load('src/data.ts');
const { directionArtForFloor } = load('src/monsterDirections.ts');
const { computeEnemyAttack, computePlayerAttack } = load('src/combat.ts');
const { Player, makeWeapon, makeShield } = load('src/player.ts');
const { elementAttackSe } = load('src/audio/config.ts');
const mage = customFloorBoss(8, 'male');
assert.equal(mage.key, 'm_black_mage');
assert.equal(mage.ranged, true);
assert.equal(mage.isDragonType, false);
assert.equal(monsterElement(mage), undefined);
assert.equal(elementAttackSe(monsterElement(mage)), 'attack');
for (const gender of ['male', 'female']) {
  const rival = customFloorBoss(9, gender);
  const gear = rival.rivalEquipment;
  assert.equal(gear.gender, gender === 'male' ? 'female' : 'male');
  assert.equal(rival.key, `m_rival_${gear.gender}`);
  assert.deepEqual([gear.weapon.grade, gear.shield.grade, gear.armor.grade], ['B', 'B', 'B']);
  assert.equal(gear.weapon.key, 'w_rune_saber');
  assert.equal(gear.shield.key, 's_thorn_guard');
  assert.equal(gear.armor.key, 'plate');
  assert.equal(rival.atkMin, gear.weapon.atkMin);
  assert.equal(rival.atkMax, gear.weapon.atkMax);
  assert.equal(rival.def, gear.shield.defBonus + gear.armor.defBonus);
  assert.equal(rival.ranged, undefined);
  assert.equal(rival.isDragonType, false);
  assert.equal(monsterElement(rival), undefined);
}
const rivalA = customFloorBoss(9, 'male'), rivalB = customFloorBoss(9, 'male');
rivalA.rivalEquipment.weapon.dur = 0;
assert.ok(rivalB.rivalEquipment.weapon.dur > 0, 'encounters must not share mutable equipment');
for (const floor of [1, 7, 10, 15, 23, 24, 26, 27, 28, 29, 30]) assert.equal(customFloorBoss(floor, 'male'), undefined);
const newBosses = [
  [11, 'm_silver_seraph', undefined, false, 'mid_magic'],
  [12, 'm_abyss_dragon', 'dark', true, 'mid_void'],
  [13, 'm_ice_knight', 'ice', false, 'mid_frost'],
  [14, 'm_thunder_sovereign', 'thunder', false, 'mid_storm'],
  [16, 'm_fallen_angel', 'dark', false, 'mid_void'],
  [17, 'm_phoenix', 'fire', false, 'mid_fire'],
  [18, 'm_unicorn', undefined, false, 'mid_magic'],
  [19, 'm_bone_reaper', 'dark', false, 'mid_bone'],
  [20, 'm_ice_behemoth', 'ice', false, 'glacial_slam']
];
for (const [floor, key, element, dragon] of newBosses) {
  const def = customFloorBoss(floor, 'female');
  assert.equal(def.key, key);
  assert.equal(monsterElement(def), element);
  assert.equal(def.isDragonType, dragon);
  assert.equal(directionArtForFloor(floor).monsterKey, key);
}
assert.equal(directionArtForFloor(15).monsterKey, 'm_bone_colossus');
assert.equal(ELEMENT_INFO.dark.name, '闇');
assert.equal(ELEMENT_INFO.dark.weakTo, undefined);
assert.equal(elementAttackSe('dark'), 'warp');
assert.ok([...WEAPON_DEFS, ...SHIELD_DEFS].every(def => def.element !== 'dark'), 'dark affinity must not change equipment');
for (const element of ['fire', 'water', 'ice', 'thunder']) {
  assert.equal(elementMultiplier(element, 'dark'), 1);
  assert.equal(elementMultiplier('dark', element), 1);
  assert.equal(elementMultiplier(element, element), 0.75);
  assert.equal(elementMultiplier(ELEMENT_INFO[element].weakTo, element), 1.5);
}
assert.equal(elementMultiplier('dark', 'dark'), 0.75);
const originalRandom = Math.random;
try {
  Math.random = () => 0.6;
  for (const def of [mage, rivalB]) {
    const player = new Player(); player.weapon = makeWeapon('w_rune_saber', []);
    const outgoing = computePlayerAttack(player, def).damage;
    player.shield = makeShield('s_thorn_guard');
    const incoming = computeEnemyAttack(player, def).damage;
    for (const element of ['fire', 'water', 'ice', 'thunder']) {
      assert.equal(elementMultiplier(element, monsterElement(def)), 1);
      assert.equal(elementMultiplier(monsterElement(def), element), 1);
      player.weapon.element = element;
      player.shield.element = element;
      assert.equal(computePlayerAttack(player, def).damage, outgoing);
      assert.equal(computeEnemyAttack(player, def).damage, incoming);
    }
  }
} finally { Math.random = originalRandom; }
assert.equal(monsterElement(MONSTER_DEFS.find(m => m.key === 'm_ember_drake')), 'fire');
assert.equal(monsterElement(MONSTER_DEFS.find(m => m.key === 'm_frost_wyrm')), 'ice');
const sceneSource = fs.readFileSync(path.join(root, 'src/scenes/GameScene.ts'), 'utf8');
const ast = ts.createSourceFile('GameScene.ts', sceneSource, ts.ScriptTarget.Latest, true);
const scene = ast.statements.find(s => ts.isClassDeclaration(s) && s.name.text === 'GameScene');
const methodNames = new Set(['spawnMidBossDragon', 'spawnMilestoneBoss', 'midBossGimmick', 'milestoneGimmick', 'showEnemyInfo', 'resolveBossIntent', 'resolveBullCharge', 'prepareBossIntent', 'bossCrossTiles', 'uniqueBossTiles', 'bossImpactKind']);
const methods = scene.members.filter(m => methodNames.has(m.name?.getText(ast)));
assert.equal(methods.length, methodNames.size);
const constantNames = new Set(['MID_DRAGONS', 'MILESTONE_BOSSES', 'BOSS_HP_MULTIPLIER', 'BOSS_ATTACK_MULTIPLIER', 'BOSS_DEFENSE_MULTIPLIER', 'FLOOR_BOSS_HP_BOOST', 'FLOOR_BOSS_ATTACK_BOOST', 'FLOOR_BOSS_DEFENSE_BOOST']);
const declarations = ast.statements.filter(s => ts.isVariableStatement(s) && s.declarationList.declarations.some(d => constantNames.has(d.name.getText(ast))));
const harnessCode = ts.transpileModule(declarations.map(d => d.getText(ast)).join('\n')
  + `\nclass Harness {${methods.map(m => m.getText(ast)).join('\n')}}`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const Harness = vm.runInNewContext(harnessCode + '\nHarness', { MONSTER_DEFS, customFloorBoss, monsterElement, ELEMENT_INFO, TILE: 32, Audio: { playSe() {} } });
for (const phaseTwo of [false, true]) {
  const h = new Harness(), p = { x: iceArena.bossRoom.cx, y: iceArena.bossRoom.cy + 2 };
  const e = { x: p.x + 3, y: p.y - 2, def: customFloorBoss(20, 'male') };
  const hazards = [];
  Object.assign(h, {
    player: p, log() {}, cameras: { main: { shake() {} } }, bossImpactFx() {},
    validBossTile: (x, y) => iceArena.tiles[y]?.[x] === 'floor',
    bossImpactColor: () => 0x62dcff,
    bossWarningMarkers: (tiles, _color, _player, channel) => tiles.map(tile => ({ ...tile, channel, turns: 1 })),
    destroyBossWarningMarker() {},
    teleportBoss: () => assert.fail('the grounded ice beast must not teleport'),
    addBossHazards: (tiles, kind, turns) => hazards.push({ tiles, kind, turns }),
    damagePlayerFromBoss: (_e, factor) => { h.damageFactor = factor; }
  });
  const state = { kind: 'glacial_slam', phaseTwo }, intent = h.prepareBossIntent(e, state);
  assert.equal(intent.destination, undefined);
  assert.ok(intent.tiles.length >= 7);
  assert.ok(intent.tiles.every(t => t.x === p.x || t.y === p.y));
  assert.ok(intent.tiles.every(t => h.validBossTile(t.x, t.y)));
  assert.equal(h.bossImpactKind(intent.kind, 'primary'), 'ice');
  h.resolveBossIntent(e, state, intent);
  assert.equal(h.damageFactor, 0.86);
  assert.equal(hazards[0].kind, 'ice');
  assert.equal(hazards[0].turns, 4);
}
for (const gender of ['male', 'female']) {
  const h = new Harness(); h.playerGender = gender;
  h.placeFloorBoss = (def, scale, tint, message, gimmick) => { h.spawn = { def, scale, tint, message, gimmick }; };
  h.spawnMidBossDragon(8, false);
  assert.equal(h.spawn.def.key, 'm_black_mage');
  assert.equal(monsterElement(h.spawn.def), undefined);
  assert.equal(h.spawn.gimmick, 'mid_magic');
  assert.equal(h.spawn.def.isDragonType, false);
  h.spawnMidBossDragon(9, false);
  assert.notEqual(h.spawn.def.rivalEquipment.gender, gender);
  assert.equal(h.spawn.gimmick, 'mid_rival');
  assert.equal(h.spawn.def.isDragonType, false);
  h.spawnMidBossDragon(24, false);
  assert.equal(h.spawn.def.key, 'm_frost_wyrm');
  for (const [floor, key, element, dragon, gimmick] of newBosses) {
    h.spawnMidBossDragon(floor, false);
    assert.equal(h.spawn.def.key, key);
    assert.equal(monsterElement(h.spawn.def), element);
    assert.equal(h.spawn.def.isDragonType, dragon);
    assert.equal(h.spawn.def.bossTint, 0xffffff, 'keep painted colors');
    assert.equal(h.spawn.gimmick, gimmick);
    assert.equal(h.spawn.scale, dragon ? 1.32 : 1);
  }
  for (const [floor, key] of [[1, 'm_ember_drake'], [26, 'm_brass_dragon'], [27, 'm_void_drake'], [28, 'm_bone_dragon'], [29, 'm_hydra']]) {
    h.spawnMidBossDragon(floor, false);
    assert.equal(h.spawn.def.key, key);
  }
  h.spawnMilestoneBoss(15);
  assert.equal(h.spawn.def.key, 'm_bone_colossus');
  assert.equal(h.spawn.def.name, '炉心王タイタン');
  assert.equal(h.spawn.def.bossTint, 0xffffff);
  assert.equal(h.spawn.gimmick, 'furnace_titan');
  assert.equal(h.spawn.scale, 1.9);
  h.spawnMilestoneBoss(20);
  assert.equal(h.spawn.def.key, 'm_ice_behemoth');
  assert.equal(h.spawn.def.name, '氷晶王ベヒーモス');
  assert.equal(h.spawn.def.isDragonType, false);
  assert.equal(monsterElement(h.spawn.def), 'ice');
  assert.equal(h.spawn.def.bossTint, 0xffffff);
  assert.equal(h.spawn.gimmick, 'glacial_slam');
  assert.equal(h.spawn.scale, 1.85);
  h.discovered = new Set(); h.behaviorLabel = b => b;
  h.events = { emit: (_event, info) => { h.info = info; } };
  for (const [floor, expected] of [[12, '闇属性（属性の弱点なし）'], [13, '氷属性（弱点: 火属性）'], [14, '雷属性（弱点: 氷属性）'], [16, '闇属性（属性の弱点なし）']]) {
    h.showEnemyInfo({ def: customFloorBoss(floor, gender), hp: 10, hpMax: 20 });
    assert.equal(h.info.element, expected);
  }
}
async function checkCharge() {
  const h = new Harness();
  let completeTween;
  const e = { x: 1, y: 1, sprite: { x: 48, y: 48 }, directionArt: {}, facing: 'right' };
  Object.assign(h, {
    player: { x: 8, y: 1 }, time: { now: 0 }, cameras: { main: { shake() {} } },
    log() {}, effectFx() {}, faceEnemyToward() {}, updateEnemyDirection() {}, dirVec: () => [1, 0],
    bossImpactFx() {}, bossImpactKind: () => 'impact', destroyBossWarningMarker() {},
    playDrawnEnemyAttack: () => assert.fail('charge must not run a competing attack-position tween'),
    tween: (sprite, props) => new Promise(resolve => { completeTween = () => { Object.assign(sprite, props); resolve(); }; })
  });
  const state = { stunned: 0 };
  const marker = { x: 5, y: 1, turns: 1, channel: 'primary' };
  const result = h.resolveBossIntent(e, state, { kind: 'bull_charge', markers: [marker], triggered: false });
  assert.ok(result.animation && typeof result.animation.then === 'function');
  assert.equal(e.animating, true);
  assert.equal(e.x, 5);
  assert.equal(e.sprite.x, 48, 'sprite must travel rather than teleport or reset');
  let finished = false;
  result.animation.then(() => { finished = true; });
  await Promise.resolve(); assert.equal(finished, false, 'turn must wait until charge ends');
  completeTween(); await result.animation;
  assert.equal(e.sprite.x, 5 * 32 + 16);
  assert.equal(e.sprite.y, 48);
  assert.equal(e.animating, false);
  assert.equal(e.directionMotion, undefined);
  assert.equal(state.stunned, 2);
}
checkCharge().then(() => console.log('PASS: floors 8–20 spawning/art, affinities, equipment, glacial arena collision/reachability, unchanged other arenas and awaited charge.')).catch(error => { console.error(error); process.exitCode = 1; });
