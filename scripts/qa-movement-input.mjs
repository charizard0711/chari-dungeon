import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import vm from 'node:vm';

// Exercise the real scene methods with a deterministic keyboard and clock.
// Phaser rendering is checked separately in qa/input-response.html.
const source = await fs.readFile(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('GameScene.ts', source, ts.ScriptTarget.Latest, true);
const names = new Set(['handleMoveKeys', 'handleMoveKeyDown', 'handleMoveKeyUp', 'clearMoveInput',
  'currentTurnAnimDuration', 'animateEnemyMove', 'playDrawnEnemyAttack', 'updateEnemyDirection', 'updateDirectionalEnemyPose', 'playDirectionalEnemyAttack']);
const constants = new Set(['ANIM', 'HOLD_FIRST_REPEAT_MS', 'HOLD_BOOST_MS', 'HOLD_MAX_BOOST_MS', 'MOVE_KEY_DIRS']);
const declarations = ast.statements.filter(statement => ts.isVariableStatement(statement)
  && statement.declarationList.declarations.some(d => constants.has(d.name.getText(ast))));
const scene = ast.statements.find(statement => ts.isClassDeclaration(statement) && statement.name.text === 'GameScene');
const methods = scene.members.filter(member => names.has(member.name?.getText(ast)));
assert.equal(methods.length, names.size);
const testSource = declarations.map(d => d.getText(ast)).join('\n')
  + `\nexport class SceneHarness { ${methods.map(m => m.getText(ast)).join('\n')} }`;
const javascript = ts.transpileModule(testSource, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } }).outputText;
const textures = await fs.readFile(new URL('../src/textures.ts', import.meta.url), 'utf8');
const TILE = Number(textures.match(/export const TILE\s*=\s*(\d+)/)[1]);
const directionSource = await fs.readFile(new URL('../src/monsterDirections.ts', import.meta.url), 'utf8');
const directionJS = ts.transpileModule(directionSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { EMBER_DIRECTIONS, DIRECTIONAL_MONSTERS, MONSTER_DIRECTION_FRAME, monsterDirectionPose } =
  await import(`data:text/javascript;base64,${Buffer.from(directionJS).toString('base64')}`);
const SceneHarness = vm.runInNewContext(javascript.replace('export class SceneHarness', 'class SceneHarness')
  + '\nSceneHarness;', { TILE, MONSTER_DIRECTION_FRAME, monsterDirectionPose }, { filename: 'movement-scene-under-test.js' });

const codes = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
function harness() {
  const h = new SceneHarness();
  Object.assign(h, { busy: false, gameEnded: false, heldDir: null, queuedMove: null, touchDir: null,
    holdStartedAt: 0, holdRepeatAt: 0, holdBoostTier: 0, clickPathActive: false, actions: [],
    ui: { overlayMode: 'none' }, keys: Object.fromEntries(Object.keys(codes).map(d => [d, { isDown: false, timeDown: 0 }])),
    scene: { get: () => h.ui }, setBoostTier: tier => { h.holdBoostTier = tier; },
    playerAct: dir => { h.actions.push(dir); h.busy = true; }, canMoveInto: () => true,
    stopClickPath: () => { h.clickPathActive = false; h.holdBoostTier = 0; },
    input: { keyboard: { resetKeys: () => { for (const key of Object.values(h.keys)) key.isDown = false; } } }
  });
  h.press = (dir, time, repeat = false) => {
    Object.assign(h.keys[dir], { isDown: true, timeDown: time });
    h.handleMoveKeyDown({ code: codes[dir], repeat, preventDefault() {} });
  };
  h.release = dir => { h.keys[dir].isDown = false; h.handleMoveKeyUp({ code: codes[dir] }); };
  return h;
}

{
  const h = harness();
  h.press('down', 0); h.release('down'); h.handleMoveKeys(16);
  assert.deepEqual(h.actions, ['down'], 'tap between render frames must survive keyup');
}
{
  const h = harness(); h.busy = true;
  h.press('left', 20); h.release('left'); h.handleMoveKeys(40);
  assert.deepEqual(h.actions, []);
  assert.equal(h.queuedMove, 'left');
  h.busy = false; h.handleMoveKeys(640); h.busy = false; h.handleMoveKeys(900);
  assert.deepEqual(h.actions, ['left'], 'tap during an attack must execute exactly once when it finishes');
}
{
  const h = harness();
  h.press('down', 0); h.handleMoveKeys(0); h.release('down');
  h.press('down', 30); h.release('down'); h.handleMoveKeys(40);
  h.busy = false; h.handleMoveKeys(100);
  assert.deepEqual(h.actions, ['down', 'down'], 'repress must bypass the old held-key repeat deadline');
}
{
  const h = harness(); h.busy = true;
  h.press('left', 10); h.release('left'); h.press('right', 20); h.release('right');
  h.busy = false; h.handleMoveKeys(400); h.busy = false; h.handleMoveKeys(800);
  assert.deepEqual(h.actions, ['right'], 'only the latest direction is buffered; never accumulate extra turns');
}
{
  const h = harness();
  h.press('up', 0); h.handleMoveKeys(0); h.press('up', 70, true); h.handleMoveKeys(80);
  assert.equal(h.queuedMove, null, 'OS key repeat must not enqueue extra actions');
  h.busy = false; h.handleMoveKeys(100); assert.equal(h.actions.length, 1);
  h.handleMoveKeys(160); assert.equal(h.actions.length, 2);
  h.release('up'); h.busy = false; h.handleMoveKeys(900);
  assert.equal(h.actions.length, 2, 'releasing a hold must stop movement');
}
for (const stop of ['overlay', 'death', 'blur']) {
  const h = harness(); h.busy = true; h.press('down', 0);
  if (stop === 'overlay') h.ui.overlayMode = 'inv';
  if (stop === 'death') h.gameEnded = true;
  if (stop === 'blur') h.clearMoveInput(); else h.handleMoveKeys(10);
  h.ui.overlayMode = 'none'; h.gameEnded = false; h.busy = false; h.handleMoveKeys(500);
  assert.deepEqual(h.actions, [], `${stop} must discard stale input`);
}
{
  const h = harness(); h.busy = true; h.clickPathActive = true;
  h.press('right', 0); h.release('right');
  assert.equal(h.clickPathActive, false, 'keyboard must cancel click movement even while busy');
  h.busy = false; h.handleMoveKeys(500); assert.deepEqual(h.actions, ['right']);
}
{
  const h = harness(); h.touchDir = 'left'; h.handleMoveKeys(0);
  h.touchDir = null; h.handleMoveKeys(50); h.busy = false; h.handleMoveKeys(500);
  assert.deepEqual(h.actions, ['left'], 'touch hold/release must keep working');
}

for (const boost of [0, 2]) {
  const h = harness(); h.holdBoostTier = boost;
  h.setEnemyAnimation = () => {};
  let moveDuration;
  h.tween = (_sprite, _target, duration) => { moveDuration = duration; return Promise.resolve(); };
  await h.animateEnemyMove({ def: {}, frameAnimation: {}, sprite: { active: true } }, { x: 1, y: 1 });
  assert.equal(moveDuration, boost ? 80 : 116, 'sprite-sheet walking must respect movement speed');

  for (const action of ['claw', 'cast']) {
    const events = [], timers = [];
    const e = { alive: true, sprite: { active: true } };
    h.time = { now: 0, delayedCall: (ms, callback) => timers.push({ ms, callback }) };
    h.bossStates = new Map(); h.faceEnemyToward = () => {}; h.updateEnemyAnimation = () => {};
    h.setEnemyAnimation = (_enemy, state, duration) => events.push({ state, duration, time: h.time.now });
    const attack = h.playDrawnEnemyAttack(e, action, () => events.push({ impact: true, time: h.time.now }));
    const duration = action === 'cast' ? (boost ? 240 : 400) : (boost ? 160 : 280);
    assert.equal(events[0].duration, duration);
    for (const timer of timers.sort((a, b) => a.ms - b.ms)) {
      h.time.now = timer.ms; timer.callback(); await Promise.resolve(); await Promise.resolve();
    }
    await attack;
    assert.equal(events.find(event => event.impact).time, duration / 2, 'damage must remain on the third drawing');
    assert.equal(events.at(-1).state, 'idle');
    assert.equal(e.animating, false);
  }
}
assert.deepEqual(DIRECTIONAL_MONSTERS.map(art => art.monsterKey), ['m_ember_drake', 'm_frost_wyrm', 'm_storm_wyvern', 'm_brass_dragon', 'm_archdemon', 'm_bone_dragon', 'm_hydra', 'm_black_mage', 'm_rival_male', 'm_rival_female', 'm_horn_demon', 'm_silver_seraph', 'm_abyss_dragon', 'm_ice_knight', 'm_thunder_sovereign', 'm_bone_colossus', 'm_fallen_angel', 'm_phoenix', 'm_unicorn', 'm_bone_reaper', 'm_ice_behemoth', 'm_valgrado', 'm_voltyrex', 'm_spark_beetle', 'm_galvan', 'm_amatsuchi', 'm_raiga', 'm_deep_kraken', 'm_valzeon', 'm_selene', 'm_abyss_lord', 'm_astravein']);
assert.equal(new Set(DIRECTIONAL_MONSTERS.map(art => art.textureKey)).size, DIRECTIONAL_MONSTERS.length, 'each species needs its own drawings');
assert.equal(new Set(Object.values(MONSTER_DIRECTION_FRAME)).size, 4);
for (const art of DIRECTIONAL_MONSTERS) {
const atlas = await fs.readFile(new URL(`../public/${art.path}`, import.meta.url));
assert.equal(atlas.readUInt32BE(16), art.frameSize * 2);
assert.equal(atlas.readUInt32BE(20), art.frameSize * 2);
assert.equal(atlas[25], 6, 'direction artwork must retain RGBA alpha');
assert.ok(atlas.length < (art.frameSize === 256 ? 512 : 128) * 1024, 'four directions must stay small');
}
for (let time = 0; time < 10000; time += 16) {
  const pose = monsterDirectionPose(time, 1, false);
  assert.ok(Math.abs(pose.x) <= 0.35 && Math.abs(pose.y) <= 1.15 && Math.abs(pose.angle) <= 1.45);
  assert.deepEqual(monsterDirectionPose(time, 1, true), { x: 0, y: 0, angle: 0 });
}
for (const kind of ['walk', 'attack']) {
  const motion = { kind, startedAt: 1000, duration: 116, dx: 1, dy: 0 };
  for (const time of [999, 1000, 1116, 1117]) {
    const actual = monsterDirectionPose(time, 1, false, motion), idle = monsterDirectionPose(time, 1, false);
    for (const key of ['x', 'y', 'angle']) assert.ok(Math.abs(actual[key] - idle[key]) < 1e-10, 'action joins must not snap back to idle');
  }
  // The added action offset must also have near-zero speed at either end.
  for (const time of [1000.01, 1115.99]) {
    const actual = monsterDirectionPose(time, 1, false, motion), idle = monsterDirectionPose(time, 1, false);
    for (const key of ['x', 'y', 'angle']) assert.ok(Math.abs(actual[key] - idle[key]) < 1e-6);
  }
}
for (const art of DIRECTIONAL_MONSTERS) for (const facing of ['down', 'left', 'right', 'up']) {
  const h = harness(), swaps = [];
  h.time = { now: 1000 };
  h.dirVec = dir => ({ down: [0, 1], left: [-1, 0], right: [1, 0], up: [0, -1] })[dir];
  const sprite = { active: true, texture: { key: '' }, frame: { name: -1 }, scaleX: 0.44, scaleY: 0.44,
    x: 90.125, y: 40.875, width: 128, height: 128,
    setTexture(key, frame) { swaps.push(frame); this.texture.key = key; this.frame.name = String(frame); return this; },
    setOrigin() { return this; }, setFlip() { return this; }, setAngle(value) { this.angle = value; return this; },
    setDisplayOrigin(x, y) { this.displayOriginX = x; this.displayOriginY = y; return this; } };
  const e = { x: 3, y: 4, facing, directionArt: art, sprite, def: {}, alive: true, baseScale: 0.44, bobPhase: 1 };
  for (let i = 0; i < 300; i++) { h.updateEnemyDirection(e); h.updateDirectionalEnemyPose(e, i * 16); }
  assert.deepEqual(swaps, [MONSTER_DIRECTION_FRAME[facing]], 'idle must never cycle or repeatedly upload frames');
  assert.equal(sprite.texture.key, art.textureKey);
  assert.equal(sprite.x, 90.125); assert.equal(sprite.y, 40.875, 'visual sway must not overwrite movement/knockback coordinates');
  const tweens = [];
  h.tween = async (_sprite, target, duration, ease) => { tweens.push({ target, duration, ease }); };
  await h.animateEnemyMove(e, { x: 4, y: 4 });
  assert.equal(tweens.length, 1);
  assert.equal(tweens[0].duration, 116);
  assert.equal(tweens[0].ease, 'Sine.easeInOut');
  assert.ok(!('scaleX' in tweens[0].target) && !('scaleY' in tweens[0].target));
  for (const action of ['claw', 'cast']) {
    tweens.length = 0;
    let impacts = 0;
    const attack = h.playDrawnEnemyAttack(e, action, () => impacts++, false);
    assert.equal(impacts, action === 'cast' ? 1 : 0, 'ranged release must not add a windup delay');
    await attack;
    assert.equal(impacts, 1);
    assert.equal(tweens.length, 2);
    assert.equal(tweens.reduce((sum, t) => sum + t.duration, 0), 116);
    assert.ok(tweens.every(t => t.ease === 'Sine.easeInOut'));
    const [dx, dy] = h.dirVec(facing);
    assert.equal(tweens[0].target.x, e.x * TILE + TILE / 2 + dx * 3);
    assert.equal(tweens[0].target.y, e.y * TILE + TILE / 2 + dy * 3);
    assert.equal(sprite.scaleX, 0.44); assert.equal(sprite.scaleY, 0.44);
    assert.equal(e.animating, false);
  }
}
for (const key of ['m_abyss_dragon', 'm_fallen_angel']) {
  const h = harness();
  h.time = { now: 1000 }; h.dirVec = () => [1, 0];
  h.updateEnemyDirection = () => {};
  const e = { x: 1, y: 2, facing: 'right', alive: true, directionArt: DIRECTIONAL_MONSTERS.find(a => a.monsterKey === key),
    sprite: { x: 48, y: 80, active: true } };
  const targets = [];
  h.tween = async (sprite, props) => { targets.push({ ...props }); Object.assign(sprite, props); };
  await h.playDrawnEnemyAttack(e, 'cast', () => {
    e.x = 7; e.y = 9;
    e.sprite.x = e.x * TILE + TILE / 2; e.sprite.y = e.y * TILE + TILE / 2;
  }, false);
  assert.equal(targets[0].x, 7 * TILE + TILE / 2 + 3, 'cast motion must begin at teleport destination');
  assert.equal(e.sprite.x, 7 * TILE + TILE / 2, 'attack recovery must not pull a teleported boss back');
  assert.equal(e.sprite.y, 9 * TILE + TILE / 2);
  assert.equal(e.animating, false);
}
console.log('PASS: input buffering, held repeat, release, overlays, click/touch, four fixed direction frames, continuous pose joins, unchanged scale, eased movement, attack timing, and teleport recovery coordinates.');
