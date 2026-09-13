const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInThisContext('(function(require,module,exports){' + js + '\n})', { filename: file })(
    name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name), module, module.exports);
  return module.exports;
}
function methods(file, names, context) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const scene = ast.statements.find(ts.isClassDeclaration);
  const selected = scene.members.filter(m => names.includes(m.name?.getText(ast)));
  assert.equal(selected.length, names.length);
  const js = ts.transpileModule('class Harness {' + selected.map(m => m.getText(ast)).join('\n') + '}', {
    compilerOptions: { target: ts.ScriptTarget.ES2020 }
  }).outputText;
  return vm.runInNewContext(js + '\nHarness', context);
}
const catalog = load('src/itemCatalog.ts');
const data = load('src/data.ts');
const armor = load('src/playerAppearance.ts');
const expected = [...data.WEAPON_DEFS.map(x => x.key), ...data.SHIELD_DEFS.map(x => x.key),
  ...armor.PLAYER_ARMORS.map(x => `armor_${x}`), ...Object.keys(data.ITEM_DEFS)];
assert.deepEqual(catalog.ITEM_CATALOG.map(x => x.key), expected);
assert.equal(new Set(expected).size, expected.length);
// Every entry uses actual loaded art or an existing item-sheet cutout.
const boot = fs.readFileSync(path.join(root, 'src/scenes/BootScene.ts'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'src/assetLoader.ts'), 'utf8');
for (const entry of catalog.ITEM_CATALOG) {
  assert.ok(entry.name && entry.summary && entry.description);
  const art = boot.match(new RegExp(`\\b${entry.textureKey}: '([^']+)'`));
  if (art) assert.ok(fs.existsSync(path.join(root, 'public', art[1])), entry.textureKey);
  else assert.ok(loader.includes(`key: '${entry.textureKey}'`), entry.textureKey);
}
for (const size of [8, 9]) for (const { key: category } of catalog.CATALOG_TABS) {
  const first = catalog.catalogPage(category, 0, size);
  const found = [];
  for (let i = 0; i < first.pageCount; i++) {
    const page = catalog.catalogPage(category, i, size);
    assert.ok(page.entries.length > 0 && page.entries.length <= size);
    found.push(...page.entries.map(x => x.key));
  }
  assert.deepEqual(found, catalog.ITEM_CATALOG.filter(x => category === 'all' || x.category === category).map(x => x.key));
  assert.equal(catalog.catalogPage(category, -50, size).page, 0);
  assert.equal(catalog.catalogPage(category, 999, size).page, first.pageCount - 1);
}
const sounds = [];
const Game = methods('src/scenes/GameScene.ts', ['redeemCode'], {
  ITEM_CATALOG_CODE: catalog.ITEM_CATALOG_CODE, Audio: { playSe: key => sounds.push(key) }
});
const game = new Game();
game.log = () => {};
game.player = { weapons: [], shield: { key: 'existing' }, gold: 731 };
game.receiveWeapon = () => assert.fail('Code must not grant equipment');
const before = JSON.stringify(game.player);
for (const code of ['', '00000000', '0000000000', '11111111', '111111111', '1111111111', '1996071', '199607110']) {
  assert.equal(game.redeemCode(code), false, code);
}
assert.equal(game.redeemCode('19960711'), true);
assert.equal(JSON.stringify(game.player), before);
const UI = methods('src/scenes/UIScene.ts', ['editCode', 'submitCode', 'handleCodeAndCatalogKey', 'turnCatalogPage', 'selectCatalogItem'], {
  Phaser: { Math: { Clamp: (v, min, max) => Math.max(min, Math.min(max, v)) } }
});
const ui = new UI();
Object.assign(ui, { gs: game, overlayMode: 'settings', codeDigits: '', codeMessage: '', catalogPageIndex: 0,
  catalogPageCount: 9, catalogDetail: null, rebuildOverlay() {}, setOverlay(mode) { this.overlayMode = mode; } });
const press = (key, repeat = false) => ui.handleCodeAndCatalogKey({ key, repeat, preventDefault() {} });
for (const digit of '19960712') press(digit);
press('Backspace'); press('１'); press('Enter');
assert.equal(ui.overlayMode, 'itemcatalog');
assert.equal(ui.codeDigits, '');
press('ArrowRight'); assert.equal(ui.catalogPageIndex, 1);
press('ArrowRight', true); assert.equal(ui.catalogPageIndex, 1);
ui.turnCatalogPage(999); assert.equal(ui.catalogPageIndex, 8);
ui.catalogDetail = catalog.ITEM_CATALOG[0];
press('ArrowRight'); assert.equal(ui.catalogPageIndex, 8);
press('Escape'); assert.equal(ui.catalogDetail, null);
press('Escape'); assert.equal(ui.overlayMode, 'settings');
for (const digit of '1111111111') press(digit);
press('Enter'); assert.equal(ui.overlayMode, 'settings'); assert.equal(ui.codeMessage, 'コードが違います');
ui.editCode('19960711'); ui.submitCode(); assert.equal(ui.overlayMode, 'itemcatalog');
assert.equal(ui.catalogPageIndex, 0); assert.equal(ui.catalogCategory, 'all');
assert.equal(JSON.stringify(game.player), before);
const playerModule = load('src/player.ts');
const { EQUIPMENT_LIMIT } = load('src/balance.ts');
const ClaimGame = methods('src/scenes/GameScene.ts', ['redeemCode', 'claimCatalogItem', 'receiveWeapon', 'receiveShield',
  'receiveArmor', 'ownsArmor', 'acceptPendingEquipment'], {
  ...catalog, ...data, ...armor, ...playerModule, EQUIPMENT_LIMIT, Audio: { playSe() {} }
});
function claimGame(unlocked = true) {
  const g = new ClaimGame();
  Object.assign(g, { itemCatalogUnlocked: unlocked, gameEnded: false, pendingEquipment: null,
    player: { weapons: [], shields: [], armors: [], inventory: [], weapon: null, shield: null, armor: null, gold: 731 },
    log() {}, emitRefresh() {}, showForcedEquipmentSale() { this.saleShown = true; } });
  return g;
}
for (const entry of catalog.ITEM_CATALOG) {
  const g = claimGame();
  assert.equal(g.claimCatalogItem(entry.key).status, 'received', entry.key);
  const items = [...g.player.weapons, ...g.player.shields, ...g.player.armors, ...g.player.inventory];
  assert.equal(items.length, 1);
  const received = items[0];
  assert.equal(received.name, entry.name);
  if (entry.category === 'item') assert.equal(received.kind, entry.key);
  else {
    assert.equal(received.plus, 0);
    assert.equal(received.grade, entry.grade);
    if (entry.category !== 'armor') { assert.equal(received.dur, received.durMax); assert.equal(received.element, entry.element); }
  }
  if (entry.category === 'shield') assert.ok(entry.description.includes(`防御力 +${received.defBonus}　耐久 ${received.durMax}`));
  assert.equal(g.player.gold, 731);
  assert.equal(g.player.weapon, null); assert.equal(g.player.shield, null); assert.equal(g.player.armor, null);
}
const locked = claimGame(false);
assert.equal(locked.claimCatalogItem('potion').status, 'unavailable');
assert.equal(locked.redeemCode('0000000000'), false);
assert.equal(locked.redeemCode('1111111111'), false);
assert.equal(locked.itemCatalogUnlocked, false);
assert.equal(locked.redeemCode('19960711'), true);
assert.equal(locked.claimCatalogItem('potion').status, 'received');
assert.equal(locked.claimCatalogItem('potion').status, 'received');
assert.notEqual(locked.player.inventory[0], locked.player.inventory[1]);
assert.equal(locked.claimCatalogItem('not-an-item').status, 'unavailable');
locked.gameEnded = true;
assert.equal(locked.claimCatalogItem('potion').status, 'unavailable');
assert.equal(locked.player.inventory.length, 2);
const fullItems = claimGame();
fullItems.player.inventory = Array.from({ length: 60 }, () => data.makeItem('potion'));
assert.equal(fullItems.claimCatalogItem('revive').status, 'unavailable');
assert.equal(fullItems.player.inventory.length, 60);
const owned = claimGame();
assert.equal(owned.claimCatalogItem('armor_dragon').status, 'received');
assert.equal(owned.claimCatalogItem('armor_dragon').status, 'unavailable');
assert.equal(owned.player.armors.length, 1);
for (const [category, list, key] of [['weapon', 'weapons', 'w_dual_sword_ice'], ['shield', 'shields', 's_frost_aegis']]) {
  const full = claimGame();
  full.player[list] = Array.from({ length: EQUIPMENT_LIMIT }, () => category === 'weapon'
    ? playerModule.makeWeapon('w_iron_dagger', []) : playerModule.makeShield('s_iron_round'));
  assert.equal(full.claimCatalogItem(key).status, 'pending');
  assert.equal(full.player[list].length, EQUIPMENT_LIMIT);
  assert.equal(full.saleShown, true);
  const pending = full.pendingEquipment;
  assert.equal(pending.item.key, key);
  assert.equal(full.claimCatalogItem('potion').status, 'pending');
  assert.equal(full.pendingEquipment, pending, 'Pending reward must survive a second selection');
  full.player[list].pop();
  full.acceptPendingEquipment(category);
  assert.equal(full.pendingEquipment, null);
  assert.equal(full.player[list].length, EQUIPMENT_LIMIT);
  assert.equal(full.player[list].at(-1).key, key);
}
const grantUI = new UI();
Object.assign(grantUI, { gs: claimGame(), overlayMode: 'itemcatalog', catalogDetail: null,
  rebuildOverlay() {}, setOverlay(mode) { this.overlayMode = mode; } });
const potion = catalog.ITEM_CATALOG.find(x => x.key === 'potion');
grantUI.selectCatalogItem(potion);
assert.equal(grantUI.gs.player.inventory.length, 1);
assert.equal(grantUI.catalogDetail, potion);
assert.ok(grantUI.catalogClaimMessage.includes('取得しました'));
grantUI.selectCatalogItem(potion);
assert.equal(grantUI.gs.player.inventory.length, 2);
grantUI.gs.player.weapons = Array.from({ length: EQUIPMENT_LIMIT }, () => playerModule.makeWeapon('w_iron_dagger', []));
grantUI.selectCatalogItem(catalog.ITEM_CATALOG[0]);
assert.equal(grantUI.overlayMode, 'equip');
console.log(`PASS: ${expected.length} illustrated items and grants, categories/pages, legacy codes disabled, keyboard/keypad, repeat claims, inventory limits, pending reward preservation`);
