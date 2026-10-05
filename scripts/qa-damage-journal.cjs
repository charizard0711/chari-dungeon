const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename })(name => name.startsWith('.')
    ? load(path.resolve(path.dirname(filename), name + '.ts')) : require(name), module, module.exports);
  return module.exports;
}
const combat = load('src/combat.ts'), journal = load('src/damageJournal.ts');
const { resolveShieldHit } = load('src/shieldEffects.ts');
const { difficultyEnemy, DIFFICULTY_RULES } = load('src/difficulty.ts');
const def = { key: 'qa', name: '試験の敵', atkMin: 40, atkMax: 50, def: 0, hp: 100, minFloor: 1, maxFloor: 30, element: 'fire' };
const p = { def: 10 };
p.weapon = { passive: { key: 'sturdy', name: '堅牢' } };
p.shield = { name: '試験の盾', element: 'ice', dur: 5, durMax: 5, passive: { key: 'brace', name: '踏ん張り' } };
let calls = 0;
const random = Math.random;
Math.random = () => { calls++; return .5; };
const result = combat.computeEnemyAttack(p, def);
Math.random = random;
assert.equal(calls, 1, 'logging never rerolls an attack');
assert.ok(result.steps.some(line => line.includes('抽選値 45')));
assert.ok(result.steps.some(line => line.includes('防御 10 × 0.7')));
assert.equal(p.shield.dur, 0);
assert.ok(result.steps.some(line => line.includes('この攻撃で破損')));
const expected = Math.max(1, Math.floor(Math.max(1, Math.floor((45 - 7) * load('src/data.ts').elementMultiplier('fire', 'ice'))) * .95));
assert.equal(result.damage, expected, 'the existing damage formula is preserved');

// Execute the real impact method with only its animation/audio dependencies replaced.
const source = fs.readFileSync(path.join(root, 'src/scenes/GameScene.ts'), 'utf8');
const ast = ts.createSourceFile('GameScene.ts', source, ts.ScriptTarget.Latest, true);
const scene = ast.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'GameScene');
const members = ['damagePlayer', 'computeIncomingAttack', 'enemyAttackDefinition', 'resolveShieldDefense'];
const cls = `class ImpactHarness { ${scene.members.filter(node => members.includes(node.name?.getText(ast))).map(node => node.getText(ast)).join('\n')} }`;
const js = ts.transpileModule(cls, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const Harness = vm.runInNewContext(`${js}; ImpactHarness`, {
  appendJournal: journal.appendJournal, computeEnemyAttack: combat.computeEnemyAttack,
  resolveShieldHit, monsterElement: load('src/data.ts').monsterElement, DIFFICULTY_RULES,
  Audio: { playSe() {} }
});
function harness(hp = 18) {
  const h = new Harness();
  Object.assign(h, { player: { hp, hpMax: 100, shield: null, heal(n) { this.hp = Math.min(100, this.hp + n); } },
    difficulty: 'normal', turn: 7, floor: 3, damageHistory: [], gameEnded: false,
    emeraldGuardArmed: true, emeraldGuardActive: () => false, updateEmeraldGuardFx() {},
    log() {}, cameras: { main: { shake() {} } }, playPlayerHurt() {}, effectFx() {},
    handlePlayerDown() { this.gameEnded = true; }, playerSprite: {}, hitFx() {} });
  return h;
}
const lethal = harness();
lethal.damagePlayer(32, '試験の敵の攻撃！', { def, alive: false }, ['攻撃力の抽選値 40', '防御 8を軽減 → 32']);
const hit = lethal.damageHistory[0];
assert.equal(hit.damage, 32); assert.equal(hit.hpBefore, 18); assert.equal(hit.hpAfter, 0);
assert.equal(hit.lethal, true); assert.equal(hit.source, def.name); assert.equal(lethal.gameEnded, true);
lethal.damagePlayer(20, '死亡後の攻撃'); assert.equal(lethal.damageHistory.length, 1);
const fixed = harness(50); fixed.damagePlayer(3, '毒に侵されている！');
assert.equal(fixed.damageHistory[0].hpAfter, 47);
assert.ok(fixed.damageHistory[0].steps[0].includes('通常の攻撃力・防御計算を使わない'));
const guard = harness(); guard.emeraldGuardActive = () => true;
guard.damagePlayer(100, '炎'); assert.equal(guard.damageHistory[0].damage, 0); assert.equal(guard.player.hp, 18);
const block = harness(30); block.player.shield = { name: '盾', passive: { key: 'perfect_guard', name: '完全防御' }, guardCounter: 4 };
block.damagePlayer(22, '攻撃', { def, alive: false });
assert.equal(block.damageHistory[0].damage, 0); assert.equal(block.player.hp, 30);
const brace = harness(50); brace.player.shield = { name: '盾', passive: { key: 'brace', name: '踏ん張り' } };
brace.damagePlayer(20, '攻撃', { def, alive: false });
assert.equal(brace.damageHistory[0].damage, 16); assert.ok(brace.damageHistory[0].steps.some(line => line.includes('20 → 16')));
const revive = harness(); revive.handlePlayerDown = function () { this.player.hp = 60; };
revive.damagePlayer(32, '攻撃'); assert.equal(revive.damageHistory[0].revived, true);
assert.ok(revive.damageHistory[0].steps.some(line => line.includes('HP 60で復活')));
const healed = harness(50); healed.player.shield = { name: '盾', passive: { key: 'recovery', name: '回復' }, guardCounter: 3 };
healed.damagePlayer(10, '攻撃', { def, alive: false }); assert.equal(healed.damageHistory[0].hpAfter, 46);
const history = [];
for (let i = 0; i < 140; i++) journal.appendJournal(history, { turn: i });
assert.equal(history.length, 120); assert.equal(history[0].turn, 20);
const saved = JSON.parse(JSON.stringify(lethal.damageHistory));
p.def = 999; assert.deepEqual(saved, JSON.parse(JSON.stringify(lethal.damageHistory)), 'equipment changes cannot rewrite past calculations');
const hard = difficultyEnemy(def, 'hard');
assert.equal(hard.atkMin, 48); assert.equal(hard.atkMax, 60);
const quests = load('src/secretQuests.ts');
const ready = quests.normalizeQuests({ fragments: 5, kills: Object.fromEntries(quests.SECRET_QUESTS.map(q => [q.id, q.count])) });
assert.equal(quests.questMenuAlpha(quests.normalizeQuests(), 1600), 1);
assert.equal(quests.questMenuAlpha(ready, 0), 1);
assert.ok(Math.abs(quests.questMenuAlpha(ready, 1600) - .44) < .000001);
assert.equal(quests.questMenuAlpha(ready, 3200), 1);
assert.equal(quests.claimQuest(ready, quests.SECRET_WEAPON_KEYS[0]), true);
assert.equal(quests.questMenuAlpha(ready, 1600), 1, 'claiming the reward immediately stops the pulse');
console.log('PASS: unchanged attack RNG/formula, shield wear/passives, fixed damage, immunity, lethal hit, revival, healing, bounded serializable history');
console.log('PASS: secret quest pulse starts only for a claimable reward and stops after claiming');
