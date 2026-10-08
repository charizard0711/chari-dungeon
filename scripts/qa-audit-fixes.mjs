import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../src/', import.meta.url)), cache = new Map();
function load(name) {
  const file = path.resolve(root, name.endsWith('.ts') ? name : name + '.ts');
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(`(function(require,module,exports){${js}\n})`, { Math })(dep => load(path.resolve(path.dirname(file), dep)), module, module.exports);
  return module.exports;
}
const { resolveShieldHit } = load('shieldEffects');
const { enhancementChance } = load('balance');
const { MAX_ENHANCEMENT } = load('enhancement');
const { makeWeapon, makeShield, weaponFullName } = load('player');
const source = fs.readFileSync(path.join(root, 'scenes/GameScene.ts'), 'utf8');
const ast = ts.createSourceFile('GameScene.ts', source, ts.ScriptTarget.Latest, true);
const cls = ast.statements.find(s => ts.isClassDeclaration(s) && s.name.text === 'GameScene');
const names = new Set(['useStone','useShieldStone']);
const code = `class Harness { ${cls.members.filter(m => names.has(m.name?.getText(ast))).map(m => m.getText(ast)).join('\n')} }; globalThis.Harness = Harness;`;
const ctx = { MAX_ENHANCEMENT, weaponFullName, Audio: { playSe() {} } };
vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, ctx);
for (const success of [false, true]) for (const kind of ['weapon','shield']) {
  const h = new ctx.Harness(), item = kind === 'weapon' ? makeWeapon('w_iron_dagger',[]) : makeShield('s_iron_round');
  item.plus = 5; const dur = item.dur;
  h.player = { [kind]: item, [kind+'s']: [item] };
  Object.assign(h, { enhanceSuccess: () => success, enhanceChance: enhancementChance, log() {}, magicFx() {}, effectFx() {}, updatePlayerAura() {}, emitRefresh() {} });
  const action = kind === 'weapon' ? 'useStone' : 'useShieldStone';
  assert.equal(h[action](), true);
  assert.equal(h.player[kind], item); assert.equal(item.dur, dur);
  assert.equal(item.plus, success ? 6 : 5, 'failed enhancement preserves equipment and plus');
  item.plus = 15; assert.equal(h[action](), false, 'max enhancement must not consume a scroll');
}
assert.equal(enhancementChance(0), .9); assert.ok(enhancementChance(14) >= .6);
for (const plus of [0,5,10,15]) for (const key of ['recovery','pilgrim_heal','pearl_mend','arcadia_guard']) {
  const shield = { plus, guardCounter: 0, name: 'QA', passive: { key, name: 'QA' } };
  let damage = 0, healed = 0;
  for (let i = 0; i < 120; i++) {
    const result = resolveShieldHit(shield, 1, { hp: 50, hpMax: 100 });
    damage += result.damage; healed += result.heal;
    assert.ok(healed <= damage * .35, 'weak enemies cannot generate HP through any shield recovery');
  }
}
const { DIRECTIONAL_MONSTERS } = load('monsterDirections');
for (const [index,key] of ['m_ember_drake','m_frost_wyrm','m_storm_wyvern'].entries()) {
  const art = DIRECTIONAL_MONSTERS.find(a => a.monsterKey === key);
  assert.equal(art.frameSize, 128);
  assert.equal(art.textureKey, ['ember_directions_v1','frost_directions_v1','storm_directions_v1'][index]);
  const png = fs.readFileSync(new URL('../public/' + art.path, import.meta.url));
  assert.equal(png.readUInt32BE(16), art.frameSize * 2);
  assert.equal(png.readUInt32BE(20), art.frameSize * 2);
}
const assets = JSON.parse(fs.readFileSync(new URL('../src/optimizedAssetPaths.json', import.meta.url)));
for (const target of Object.values(assets)) assert.ok(fs.existsSync(new URL('../public/'+target, import.meta.url)), target);
console.log('PASS: actual enhancement success/failure/cap, bounded shield recovery, atlas frames/alpha, and every optimized asset exists.');
