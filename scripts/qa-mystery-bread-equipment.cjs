const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/scenes/GameScene.ts'), 'utf8');
const ast = ts.createSourceFile('GameScene.ts', source, ts.ScriptTarget.Latest, true);
const names = ['useItem', 'useMysteryBread', 'restoreRunState'];
const methods = ast.statements.find(ts.isClassDeclaration).members.filter(m => names.includes(m.name?.getText(ast)));
assert.equal(methods.length, names.length);
const js = ts.transpileModule(`class Harness {${methods.map(m => m.getText(ast)).join('\n')}}`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const breadDescription = 'HPと所持する武器・盾の耐久を全回復。装備中の武器・盾だけ強化値が必ず+1。';
assert.ok(fs.readFileSync(path.join(__dirname, '../src/data.ts'), 'utf8').includes(breadDescription));
const Game = vm.runInNewContext(js + '\nHarness', {
  Audio: { playSe() {}, setBgmVolume() {}, setSeVolume() {} },
  Player: class {}, pickFields: state => state, RUN_STATE_KEYS: [], difficultyOf: value => value,
  mergeQuests: journal => journal, document: { body: { dataset: {} } },
  makeItem: kind => ({ kind, name: 'ふしぎパン', desc: breadDescription, textureKey: 'i_mystery_bread' }),
  refreshLegendaryEquipment() {}, setSelectedGender() {}
});
const equipment = (plus, dur = 1) => ({ plus, dur, durMax: 100 });
function fresh() {
  const g = new Game(), weapon = equipment(25, 0), spareWeapon = equipment(8), shield = equipment(10), spareShield = equipment(4), armor = { plus: 2 };
  Object.assign(g, {
    player: { hp: 1, hpMax: 200, x: 2, y: 3, weapon, shield, armor, weapons: [weapon, spareWeapon], shields: [shield, spareShield], inventory: [{ kind: 'mystery_bread' }, { kind: 'mystery_bread' }] },
    turn: 0, log() {}, updatePlayerAura() {}, healFx() {}, effectFx() {}, updateVisibility() {}, emitRefresh() {},
    async finishTurn() { this.turn++; }
  });
  return { g, weapon, spareWeapon, shield, spareShield, armor };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const { g, weapon, spareWeapon, shield, spareShield, armor } = fresh();
  g.useItem(0); await settle();
  assert.equal(g.player.hp, 200);
  for (const e of [weapon, spareWeapon, shield, spareShield]) assert.equal(e.dur, e.durMax, 'all owned durability still recovers, including unequipped/broken');
  assert.deepEqual([weapon.plus, spareWeapon.plus, shield.plus, spareShield.plus, armor.plus], [26, 8, 11, 4, 2], 'only equipped weapon and shield gain +1, exactly once');
  assert.equal(g.player.inventory.length, 1); assert.equal(g.turn, 1);

  g.player.weapon = spareWeapon; g.player.shield = spareShield;
  g.useItem(0); await settle();
  assert.deepEqual([weapon.plus, spareWeapon.plus, shield.plus, spareShield.plus], [26, 9, 11, 5], 'second bread strengthens the currently equipped pair');
  assert.equal(g.player.inventory.length, 0); assert.equal(g.turn, 2);

  for (const slot of ['both', 'weapon', 'shield']) {
    const test = fresh(), p = test.g.player;
    if (slot === 'both' || slot === 'weapon') p.weapon = null;
    if (slot === 'both' || slot === 'shield') p.shield = null;
    test.g.useItem(0); await settle();
    assert.equal(p.hp, p.hpMax);
    assert.ok([...p.weapons, ...p.shields].every(e => e.dur === e.durMax));
    assert.equal(test.weapon.plus, slot === 'shield' ? 26 : 25);
    assert.equal(test.shield.plus, slot === 'weapon' ? 11 : 10);
    assert.equal(test.spareWeapon.plus, 8); assert.equal(test.spareShield.plus, 4);
  }
  const detached = fresh();
  detached.g.player.weapons = [detached.spareWeapon]; detached.g.player.shields = [detached.spareShield];
  detached.g.useItem(0); await settle();
  assert.equal(detached.weapon.plus, 26); assert.equal(detached.shield.plus, 11);
  assert.equal(detached.weapon.dur, 100); assert.equal(detached.shield.dur, 100);
  for (const [key,value] of [['busy',true], ['gameEnded',true], ['itemSealTurns',2]]) {
    const blocked = fresh(); blocked.g[key] = value;
    blocked.g.useItem(0); await settle();
    assert.equal(blocked.g.player.inventory.length, 2);
    assert.equal(blocked.weapon.plus, 25); assert.equal(blocked.g.player.hp, 1);
    assert.equal(blocked.g.turn, 0);
  }
  const restored = fresh().g;
  restored.recordOwnedEquipment = () => {}; restored.runSaveEnabled = () => false; restored.discovered = new Set();
  const savedBread = { kind: 'mystery_bread', desc: 'old all-owned enhancement' }, potion = { kind: 'potion', desc: 'heal' };
  restored.restoreRunState({ state: {}, player: { ...restored.player, armors: [], inventory: [savedBread, potion] }, equipped: { weapon: 0, shield: 0, armor: -1 }, discovered: [], logs: [], audio: {} });
  assert.equal(restored.player.inventory[0].desc, breadDescription, 'existing saved bread also gets the corrected explanation');
  assert.equal(restored.player.inventory[1], potion); assert.equal(restored.player.inventory.length, 2);
  console.log('PASS: equipped-only +1, all owned durability and HP restored, duplicate references once, changed equipment, empty slots, armor unchanged, one bread/turn, sealed/busy/end guards, saved item description refreshed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
