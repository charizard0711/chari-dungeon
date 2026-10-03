const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const vm = require('node:vm'), ts = require('typescript');
const root = path.resolve(__dirname, '..');
function extract(file, names, context) {
  const ast = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
  const members = ast.statements.find(ts.isClassDeclaration).members.filter(m => names.includes(m.name?.getText(ast)));
  assert.equal(members.length, names.length);
  const js = ts.transpileModule(`class Harness {${members.map(m => m.getText(ast)).join('\n')}}`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return vm.runInNewContext(js + '\nHarness', context);
}
const Game = extract('src/scenes/GameScene.ts', ['clearEnemyHover', 'updateEnemyHover', 'showEnemyInfo', 'behaviorLabel'], {
  MAP_X: 100, MAP_Y: 50, MAP_W: 600, MAP_H: 400,
  monsterElement: def => def.element, ELEMENT_INFO: { fire: { name: '火', weakTo: 'water' }, water: { name: '水' } }
});
const UI = extract('src/scenes/UIScene.ts', ['showEnemyInfo', 'hideEnemyInfo'], {});
const hud = new UI(), timers = [], events = [];
Object.assign(hud, {
  overlayMode: 'none', enemyInfoText: { active: true, visible: false, setText(text) { this.text = text; return this; }, setVisible(v) { this.visible = v; return this; } },
  time: { delayedCall(ms, callback) { const t = { ms, callback, cancelled: false, remove() { this.cancelled = true; } }; timers.push(t); return t; } }
});
const game = new Game();
Object.assign(game, {
  input: { isOver: true, activePointer: { x: 220, y: 170, wasTouch: false } },
  scene: { get: () => hud }, cameras: { main: { getWorldPoint: (x, y) => ({ x: (x - 100) / 2 + 400, y: (y - 50) / 2 + 200 }) } },
  events: { emit(event, info) { events.push({ event, info }); if (event === 'enemyinfo') hud.showEnemyInfo(info); else if (hud.enemyInfoHovered) hud.hideEnemyInfo(); } },
  discoverMonster() {}, player: { hp: 100 }, turnCount: 0
});
function enemy(name, depth = 10) {
  return { alive: true, hp: 20, hpMax: 20, def: { name, key: name, atkMin: 3, atkMax: 5, def: 2, behavior: 'chase' },
    sprite: { active: true, visible: true, depth, getBounds: () => ({ contains: (x, y) => x >= 450 && x < 470 && y >= 250 && y < 270 }) } };
}
const first = enemy('スライム'), front = enemy('ボス', 20);
game.enemies = [front, first];
game.updateEnemyHover();
assert.match(hud.enemyInfoText.text, /ボス/); assert.equal(hud.enemyInfoHovered, true);
assert.equal(timers.length, 0, 'hover stays open beyond the old 3-second timeout');
assert.equal(game.turnCount, 0); assert.equal(game.player.hp, 100); assert.equal(front.hp, 20);
const count = events.length; game.updateEnemyHover(); assert.equal(events.length, count, 'unchanged target does not resend every frame');
front.hp = 12; front.def.element = 'fire'; game.updateEnemyHover();
assert.match(hud.enemyInfoText.text, /12\/20/); assert.match(hud.enemyInfoText.text, /火属性/);
front.alive = false; game.updateEnemyHover(); assert.match(hud.enemyInfoText.text, /スライム/);
first.sprite.getBounds = () => ({ contains: () => false }); game.updateEnemyHover();
assert.equal(hud.enemyInfoText.visible, false, 'moving away from a stationary pointer clears the panel');
first.sprite.getBounds = enemy('bounds').sprite.getBounds;
for (const conceal of ['dead', 'inactive', 'fog', 'ninja', 'mimic', 'ambush', 'statue']) {
  const e = enemy(conceal); game.enemies = [e];
  if (conceal === 'dead') e.alive = false;
  else if (conceal === 'inactive') e.sprite.active = false;
  else if (conceal === 'fog') e.sprite.visible = false;
  else if (conceal === 'ninja') e.def.isDarkNinja = true;
  else e.def.gimmick = conceal;
  game.updateEnemyHover(); assert.equal(hud.enemyInfoText.visible, false, conceal);
  e.alive = true; e.sprite.active = true; e.sprite.visible = true; e.awakened = true; e.stealthRevealed = true;
  game.updateEnemyHover(); assert.equal(hud.enemyInfoText.visible, true); game.clearEnemyHover();
}
game.enemies = [first];
for (const reason of ['canvas', 'map', 'touch', 'menu', 'ended', 'skill']) {
  game.updateEnemyHover(); assert.equal(hud.enemyInfoText.visible, true);
  game.input.isOver = reason !== 'canvas'; game.input.activePointer.x = reason === 'map' ? 99 : 220;
  game.input.activePointer.wasTouch = reason === 'touch'; hud.overlayMode = reason === 'menu' ? 'settings' : 'none';
  game.gameEnded = reason === 'ended'; hud.isSkillPointer = () => reason === 'skill';
  game.updateEnemyHover(); assert.equal(hud.enemyInfoText.visible, false, reason);
  game.input.isOver = true; game.input.activePointer.x = 220; game.input.activePointer.wasTouch = false;
  hud.overlayMode = 'none'; game.gameEnded = false; hud.isSkillPointer = () => false;
}
game.showEnemyInfo(first); const oldTimer = timers.at(-1); assert.equal(oldTimer.ms, 3000, 'touch/click retains timed details');
game.updateEnemyHover(); assert.equal(oldTimer.cancelled, true); assert.equal(hud.enemyInfoText.visible, true);
game.showEnemyInfo(first); assert.equal(hud.enemyInfoTimer, undefined, 'clicking the hovered enemy keeps hover details');
game.clearEnemyHover(); assert.equal(hud.enemyInfoText.visible, false);
game.showEnemyInfo(first); timers.at(-1).callback(); assert.equal(hud.enemyInfoText.visible, false);
console.log('PASS: camera-transformed hover, frontmost target, live HP/element, stationary cursor, fog/disguises/death, exit/menu/touch/skill/ending, timer cancellation, no attack or turn consumption.');
