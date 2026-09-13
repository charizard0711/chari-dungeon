const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const root = path.resolve(__dirname, '..'), cache = new Map();
function load(file) {
  file = path.resolve(root, file); if (cache.has(file)) return cache.get(file).exports;
  const m = { exports: {} }; cache.set(file, m);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename: file })(n => n.startsWith('.') ? load(path.resolve(path.dirname(file), n + '.ts')) : require(n), m, m.exports);
  return m.exports;
}
const data = load('src/data.ts'), balance = load('src/balance.ts');
const ast = ts.createSourceFile('GameScene.ts', fs.readFileSync(path.join(root, 'src/scenes/GameScene.ts'), 'utf8'), ts.ScriptTarget.Latest, true);
const names = ['useItem', 'useWarp', 'repairEquipment', 'shopRemaining', 'buyItem'];
const members = ast.statements.find(ts.isClassDeclaration).members.filter(m => names.includes(m.name?.getText(ast)));
assert.equal(members.length, names.length);
const js = ts.transpileModule(`class Harness {${members.map(m => m.getText(ast)).join('\n')}}`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const Harness = vm.runInNewContext(js + '\nHarness', { ...data, ...balance, Audio: { playSe() {} } });
function fresh() {
  const h = new Harness(); let mode = 'inv';
  Object.assign(h, { player: { x: 9, y: 8, dir: 'up', gold: 300, inventory: [data.makeItem('repair'), data.makeItem('warp')], weapons: [], shields: [] },
    dungeon: { start: { x: 2, y: 3 } }, playerSprite: {}, clickPathToken: 5, clickPathActive: true, queuedMove: 'right',
    shopPurchases: { potion: 0, repair: 0, slime_scroll: 0, boss5_scroll: 0 }, turn: 9, floor: 7, floorTurn: 6, bossEntranceClosed: true,
    busy: false, gameEnded: false, itemSealTurns: 0, scene: { get: () => ({ setOverlay: value => { mode = value; } }) },
    log() {}, updateVisibility() {}, emitRefresh() {}, setPlayerVisual() {}, updatePlayerAura() {}, refreshTransformationVisual() {}, updateStairsHint() {},
    enemyAt() {}, chestAt() {}, dungeonObjectAt() {}, bossObstacleAt() {},
    clearMoveInput() { this.queuedMove = null; }, placeSprite(sprite, x, y) { sprite.x = x; sprite.y = y; },
    setBossEntranceClosed(value) { this.bossEntranceClosed = value; }, finishTurn() { throw Error('Recovery item should not advance turn'); } });
  h.mode = () => mode; return h;
}
assert.equal(data.ITEM_DEFS.warp.name, 'リコールベル'); assert.equal(data.ITEM_DEFS.repair.name, '装備修復石'); assert.equal(data.ITEM_DEFS.dash, undefined);
assert.ok(balance.ITEM_SELL_PRICES.repair < balance.SHOP_PRICES.repair);
const h = fresh(), weapon = { name: '試験の剣', dur: 20, durMax: 500, plus: 4, repairUsed: true };
h.player.weapons.push(weapon); h.useItem(0);
assert.equal(h.mode(), 'repair'); assert.equal(h.player.inventory.length, 2, 'Opening/canceling selection must not consume');
assert.equal(h.repairEquipment('weapon', { ...weapon }), false, 'Do not repair a stale or unowned item');
assert.equal(h.repairEquipment('shield', weapon), false);
assert.equal(h.repairEquipment('weapon', weapon), true); assert.equal(weapon.dur, 120); assert.equal(weapon.plus, 4); assert.equal(weapon.repairUsed, true);
assert.equal(h.player.inventory.length, 1); assert.equal(h.repairEquipment('weapon', weapon), false, 'No free second repair');
const s = fresh(), shield = { name: '試験の盾', dur: 280, durMax: 300 }; s.player.shields.push(shield);
assert.equal(s.repairEquipment('shield', shield), true); assert.equal(shield.dur, 300);
s.player.inventory.push(data.makeItem('repair')); const len = s.player.inventory.length;
assert.equal(s.repairEquipment('shield', shield), false); assert.equal(s.player.inventory.length, len);
for (const [key, value] of [['busy', true], ['gameEnded', true], ['itemSealTurns', 2]]) {
  const g = fresh(); g.player.weapons.push({ ...weapon, dur: 10 }); g[key] = value;
  g.useItem(0); assert.equal(g.mode(), 'inv');
  assert.equal(g.repairEquipment('weapon', g.player.weapons[0]), false); assert.equal(g.player.inventory.length, 2);
}
const r = fresh(); r.useItem(1);
assert.deepEqual([r.player.x, r.player.y], [2, 3]); assert.equal(r.player.inventory.length, 1); assert.equal(r.turn, 9); assert.equal(r.floor, 7); assert.equal(r.floorTurn, 6);
assert.equal(r.queuedMove, null); assert.equal(r.clickPathActive, false); assert.equal(r.clickPathToken, 6); assert.equal(r.bossEntranceClosed, false);
r.player.inventory.push(data.makeItem('warp')); r.useItem(1); assert.equal(r.player.inventory.length, 2, 'Already at start keeps bell');
for (const blocker of ['enemyAt', 'chestAt', 'dungeonObjectAt', 'bossObstacleAt']) {
  const b = fresh(); b[blocker] = () => ({}); b.useItem(1); assert.equal(b.player.x, 9); assert.equal(b.player.inventory.length, 2);
}
const shop = fresh(); assert.equal(shop.shopRemaining('repair'), 1);
assert.equal(shop.buyItem('repair'), true); assert.equal(shop.player.gold, 200); assert.equal(shop.shopRemaining('repair'), 0);
assert.equal(shop.buyItem('repair'), false); assert.equal(shop.player.gold, 200);
shop.player.gold = 9999; assert.equal(shop.buyItem('repair'), false);
for (const reason of ['poor', 'full', 'ended']) {
  const g = fresh(); if (reason === 'poor') g.player.gold = 99; if (reason === 'full') g.player.inventory = Array.from({ length: 60 }, () => data.makeItem('potion')); if (reason === 'ended') g.gameEnded = true;
  const gold = g.player.gold; assert.equal(g.buyItem('repair'), false); assert.equal(g.player.gold, gold); assert.equal(g.shopRemaining('repair'), 1);
}
console.log('PASS: repair +100/cap, weapon/shield selection, cancellation/full/stale/no stone/sealed guards; recall exact start/no turn/input cleared/blocked safe; one shop stone for 100G, stock and failed purchase safety.');
