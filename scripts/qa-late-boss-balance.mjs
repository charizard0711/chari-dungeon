import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const cache = new Map();
function load(name) {
  const file = path.resolve(root, name.endsWith('.ts') ? name : `${name}.ts`);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInNewContext(`(function(require,module,exports){${js}\n})`, { Math })(
    name => load(path.resolve(path.dirname(file), name)), module, module.exports);
  return module.exports;
}

const { difficultyEnemy } = load('difficulty');
const { strengthenLateBoss } = load('bossBalance');
const source = fs.readFileSync(path.join(root, 'scenes/GameScene.ts'), 'utf8');
const ast = ts.createSourceFile('GameScene.ts', source, ts.ScriptTarget.Latest, true);
const scene = ast.statements.find(s => ts.isClassDeclaration(s) && s.name.text === 'GameScene');
const names = ['spawnMidBossDragon', 'spawnMilestoneBoss', 'placeFloorBoss', 'addEnemy', 'midBossGimmick', 'milestoneGimmick'];
const constants = ['MID_DRAGONS', 'MILESTONE_BOSSES', 'BOSS_HP_MULTIPLIER', 'BOSS_ATTACK_MULTIPLIER',
  'BOSS_DEFENSE_MULTIPLIER', 'FLOOR_BOSS_HP_BOOST', 'FLOOR_BOSS_ATTACK_BOOST', 'FLOOR_BOSS_DEFENSE_BOOST', 'BOSS_GROUND_ORIGIN_Y'];
const declarations = ast.statements.filter(s => ts.isVariableStatement(s)
  && s.declarationList.declarations.some(d => constants.includes(d.name.getText(ast))));
const methods = scene.members.filter(m => names.includes(m.name?.getText(ast)));
assert.equal(methods.length, names.length);
const code = declarations.map(d => d.getText(ast)).join('\n')
  + `\nclass Harness {${methods.map(m => m.getText(ast)).join('\n')}}\nHarness`;
const Harness = vm.runInNewContext(ts.transpileModule(code, {
  compilerOptions: { target: ts.ScriptTarget.ES2020 }
}).outputText, {
  ...load('customFloorBosses'), ...load('data'), ...load('finalDepthBosses'), ...load('enemy'),
  strengthenLateBoss, difficultyEnemy, hasFinalDepthTerrain: floor => floor >= 26,
  DIRECTIONAL_MONSTERS: [], getMonsterAnimation: () => undefined, TILE: 32
});
function graphic() {
  const image = {};
  for (const name of ['setDepth', 'setAlpha', 'setOrigin', 'setScale', 'setTint', 'setTexture',
    'setDisplaySize', 'clearTint', 'setInteractive', 'on']) image[name] = () => image;
  return image;
}
const h = new Harness();
Object.assign(h, {
  enemies: [], dungeon: {}, add: { image: graphic },
  textures: { exists: () => false, get: () => ({ getSourceImage: () => ({ width: 128, height: 128 }) }) },
  bossArenaPosition: () => ({ x: 8, y: 8 }), randomFieldBossPosition: () => ({ x: 8, y: 8 }),
  distToPlayer: () => 10, enemyAt: () => null,
  placeSprite() {}, updateEnemyShadow() {}, attachAura() {}, registerBossGimmick() {}, log() {}
});
const stats = def => [def.hp, def.atkMin, def.atkMax, def.def];
// Released normal-mode encounter stats before this change: HP, attack min/max, defense.
const previousMid = [
  [115,8,16,5], [142,11,21,7], [171,14,26,8], [252,18,31,17], [265,23,38,12],
  [333,27,43,15], [347,25,44,17], [279,20,34,10], [311,17,36,14], [192,15,27,9],
  [282,19,33,18], [297,24,40,13], [371,28,46,17], [387,26,46,18], [310,25,41,13],
  [147,9,18,7], [181,12,23,8], [216,16,29,9], [317,20,35,18], [477,27,46,24],
  [326,20,35,19], [342,26,43,22], [427,30,49,18], [444,28,49,19], [509,28,48,24],
  [540,32,54,24], [595,38,64,25], [627,35,60,24], [672,41,67,25], [787,39,67,27]
];
const previousMilestone = {
  5: [288,9,17,5], 10: [450,13,24,9], 15: [660,17,29,13],
  20: [930,21,35,15], 25: [1230,26,43,19], 30: [1740,31,52,23]
};
const correctedMid = { 16: [395,27,45,7], 17: [400,27,47,8], 18: [406,27,49,9] };
const modeFactors = { normal: [1,1], hard: [1.25,1.2], master: [1.5,1.4] };
let encounters = 0;
for (const gender of ['male', 'female']) for (let floor = 1; floor <= 30; floor++) {
  for (const milestone of floor % 5 === 0 ? [false, true] : [false]) {
    const previous = milestone ? previousMilestone[floor] : previousMid[floor - 1];
    const factors = floor < 16 ? [100,100] : floor <= 20 ? [130,110] : floor <= 25 ? [140,115] : [150,120];
    const expectedNormal = correctedMid[floor] ?? previous.map((n, i) => i === 3 ? n : Math.floor(n * factors[i === 0 ? 0 : 1] / 100));
    for (const [mode, [hpFactor, attackFactor]] of Object.entries(modeFactors)) {
      Object.assign(h, { playerGender: gender, floor, difficulty: mode, enemies: [], inBossRoom: milestone });
      if (milestone) h.spawnMilestoneBoss(floor);
      else h.spawnMidBossDragon(floor, floor % 2 === 0);
      assert.equal(h.enemies.length, 1, `${floor}F ${mode}: one boss must spawn`);
      const enemy = h.enemies[0];
      const expected = expectedNormal.map((n, i) => i === 3 ? n : Math.floor(n * (i === 0 ? hpFactor : attackFactor)));
      assert.deepEqual(stats(enemy.def), expected, `${floor}F ${mode} ${milestone ? 'milestone' : 'mid'}`);
      assert.equal(enemy.hp, expected[0]);
      assert.equal(enemy.hpMax, expected[0]);
      // Mode switches and save serialization must retain the adjusted base, without compounding.
      const saved = JSON.parse(JSON.stringify(enemy.def));
      for (const nextMode of Object.keys(modeFactors)) {
        const switchedBack = difficultyEnemy(difficultyEnemy(saved, nextMode), mode);
        assert.deepEqual(stats(switchedBack), expected);
      }
      encounters++;
    }
  }
}
const sample = { hp: 100, atkMin: 10, atkMax: 20, def: 12, gold: 50, exp: 30, isFloorBoss: true };
for (const floor of [1, 15, 31]) assert.deepEqual(strengthenLateBoss(sample, floor), sample);
const ordinary = { ...sample, isFloorBoss: false };
for (const floor of [16, 21, 26, 30]) assert.deepEqual(strengthenLateBoss(ordinary, floor), ordinary);
for (const floor of [16, 21, 26]) {
  const boosted = strengthenLateBoss(sample, floor);
  for (const field of ['def', 'gold', 'exp', 'isFloorBoss']) assert.equal(boosted[field], sample[field]);
}
assert.equal(sample.hp, 100, 'shared source definitions are not mutated');
console.log(`PASS: ${encounters} actual boss spawn paths across 30 floors, both genders and all modes; early floors, defense and rewards unchanged; 16–18F corrected; mode switches/save round trips retain buffs without stacking.`);
