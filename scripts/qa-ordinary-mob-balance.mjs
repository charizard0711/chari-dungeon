import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url)), cache = new Map();
const controlledMath = Object.create(Math);
function load(name) {
  const file = path.resolve(root, name.endsWith('.ts') ? name : name + '.ts');
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInNewContext(`(function(require,module,exports){${js}\n})`, { Math: controlledMath })(
    dep => load(path.resolve(path.dirname(file), dep)), module, module.exports);
  return module.exports;
}
const { ordinaryMobAttackBonus: bonus, ordinaryMobAttackDefinition: scale } = load('ordinaryMobBalance');
const { NORMAL_MONSTER_DEFS } = load('data');
const { difficultyEnemy, DIFFICULTIES } = load('difficulty');
const { Player, makeShield } = load('player');
const { computeEnemyAttack } = load('combat');
const mob = NORMAL_MONSTER_DEFS.find(def => def.key === 'm_mush');
assert.deepEqual(Array.from({ length: 22 }, (_, i) => bonus(mob, i + 1, 'normal')),
  [0,0,0,1,2,3,4,5,6,7,8,8,8,8,8,8,8,8,8,8,8,8]);
for (const mode of DIFFICULTIES) {
  for (const flag of ['isBoss','isFloorBoss','isElite','isTreasureRabbit']) {
    assert.equal(bonus({ ...mob, [flag]: true }, 10, mode), 0);
  }
  assert.equal(bonus(mob, 10, mode, true), 0);
  assert.equal(bonus({ ...mob, atkMin: 0, atkMax: 0 }, 10, mode), 0);
}

const source = fs.readFileSync(path.resolve(root, 'scenes/GameScene.ts'), 'utf8');
const ast = ts.createSourceFile('GameScene.ts', source, ts.ScriptTarget.Latest, true);
const scene = ast.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'GameScene');
const method = scene.members.find(node => node.name?.getText(ast) === 'enemyAttackDefinition');
const harnessJs = ts.transpileModule(`class Harness { ${method.getText(ast)} }; globalThis.Harness = Harness;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2020 }
}).outputText;
const ctx = { ordinaryMobAttackDefinition: scale, Math }; vm.runInNewContext(harnessJs, ctx);
const h = new ctx.Harness(); Object.assign(h, { floor: 10, difficulty: 'normal', eventMode: false, turn: 20 });
const enemy = { def: difficultyEnemy(mob, 'normal'), emedralWeakUntil: -1, skillAttackDownUntil: -1 };
const saved = JSON.stringify(enemy.def);
assert.equal(h.enemyAttackDefinition(enemy).atkMax, Math.floor(mob.atkMax * 1.2));
assert.equal(h.enemyAttackDefinition(enemy).atkMax, Math.floor(mob.atkMax * 1.2));
assert.equal(JSON.stringify(enemy.def), saved, 'attack calculations cannot stack or mutate saved stats');
enemy.skillAttackDownUntil = 20;
assert.equal(h.enemyAttackDefinition(enemy).atkMax, Math.floor((Math.floor(mob.atkMax * 1.2)) * .8));
enemy.emedralAffected = true; enemy.emedralWeakUntil = 20;
assert.equal(h.enemyAttackDefinition(enemy).atkMax, Math.floor((Math.floor(mob.atkMax * 1.2)) * .7));
enemy.skillAttackDownUntil = -1; enemy.emedralWeakUntil = -1;
enemy.def = JSON.parse(saved);
assert.equal(h.enemyAttackDefinition(enemy).atkMax, Math.floor(mob.atkMax * 1.2), 'old saved enemies also receive the correction');

function distribution(player, def) {
  const values = [];
  for (let atk = def.atkMin; atk <= def.atkMax; atk++) {
    controlledMath.random = () => (atk - def.atkMin + .5) / (def.atkMax - def.atkMin + 1);
    if (player.shield) player.shield.dur = 10000;
    values.push(computeEnemyAttack(player, def).damage);
  }
  return { avg: values.reduce((a,b) => a+b,0) / values.length, one: values.filter(v => v === 1).length / values.length };
}
const report = [];
for (const floor of [1,3,5,8,10,15,20,25,29]) {
  const p = new Player();
  p.level = floor <= 3 ? floor : floor <= 5 ? 4 : floor <= 10 ? 6 : 8;
  p.armor = { grade: floor < 5 ? 'D' : floor < 10 ? 'C' : 'B', defBonus: floor < 5 ? 1 : floor < 10 ? 3 : 5, plus: floor < 5 ? 0 : 2 };
  p.shield = floor === 1 ? null : { ...makeShield(floor < 5 ? 's_iron_round' : floor < 8 ? 's_steel_bastion' : 's_thorn_guard'), plus: floor < 5 ? 0 : 2, dur: 10000, durMax: 10000, passive: undefined };
  const pool = NORMAL_MONSTER_DEFS.filter(d => d.minFloor <= floor && floor <= d.maxFloor && !d.isBoss && !d.isFloorBoss && !d.isElite && !d.isTreasureRabbit);
  const summary = { before: 0, after: 0, one: 0, strong: 0 };
  for (const def of pool) {
    const normal = difficultyEnemy(def, 'normal'), corrected = scale(normal, floor, 'normal');
    const before = distribution(p, normal), after = distribution(p, corrected);
    summary.before += before.avg; summary.after += after.avg; summary.one += after.one;
    if (floor <= 3) assert.equal(after.avg, before.avg);
    for (const mode of ['hard','master']) {
      const original = difficultyEnemy(def, mode);
      assert.ok(corrected.atkMin <= original.atkMin && corrected.atkMax <= original.atkMax, 'normal cannot exceed higher-mode attack');
      assert.equal(bonus(original, floor, mode), 0);
      assert.equal(scale(original, floor, mode), original, `${mode} must keep its original stats`);
      assert.deepEqual(distribution(p, scale(original, floor, mode)), distribution(p, original));
    }
    const plus = p.armor.plus; p.armor.plus += 10;
    const strong = distribution(p, corrected); p.armor.plus = plus;
    assert.ok(strong.avg <= after.avg, 'armor upgrades must remain effective'); summary.strong += strong.avg;
  }
  assert.ok(pool.length);
  const n = pool.length;
  if (floor >= 5 && floor <= 15) assert.ok(summary.after >= summary.before);
  report.push({ floor, defense: p.def, oldAverage: +(summary.before/n).toFixed(2), newAverage: +(summary.after/n).toFixed(2), oneDamagePercent: +(summary.one/n*100).toFixed(1), armorPlus10Average: +(summary.strong/n).toFixed(2) });
}
console.table(report);
console.log('PASS: normal depth progression, armor value, unchanged hard/master, exclusions, old saves, no stacking, and debuffs. Equal species/attack-roll weighting; not a measured playthrough.');
