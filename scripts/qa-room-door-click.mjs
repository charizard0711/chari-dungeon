import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import vm from 'node:vm';

// Exercise the actual click handler, pathfinding, key consumption and room opening.
const source = await fs.readFile(new URL('../src/scenes/GameScene.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('GameScene.ts', source, ts.ScriptTarget.Latest, true);
const scene = ast.statements.find(node => ts.isClassDeclaration(node) && node.name.text === 'GameScene');
const names = new Set(['handleMapClick', 'findClickPath', 'playerAct', 'optionalRoomAtDoor', 'openOptionalRoom']);
const methods = scene.members.filter(member => names.has(member.name?.getText(ast)));
assert.equal(methods.length, names.size);
const dungeon = await fs.readFile(new URL('../src/dungeon.ts', import.meta.url), 'utf8');
const dungeonAst = ts.createSourceFile('dungeon.ts', dungeon, ts.ScriptTarget.Latest, true);
const walkable = dungeonAst.statements.find(node => ts.isFunctionDeclaration(node) && node.name.text === 'isWalkable');
const testSource = `${walkable.getText(dungeonAst).replace('export ', '')}\nclass SceneHarness { ${methods.map(method => method.getText(ast)).join('\n')} }`;
const javascript = ts.transpileModule(testSource, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const TILE = 32, MAP_X = 176, MAP_Y = 48;
const SceneHarness = vm.runInNewContext(`${javascript}\nSceneHarness`, {
  TILE, MAP_X, MAP_Y, MAP_W: 740, MAP_H: 520, Audio: { playSe() {} },
  getTheme: () => ({ era: 0, accent: 0 }),
  console: { error: (...args) => { throw new Error(args.join(' ')); } }
});

function fixture(withKey = true) {
  const h = new SceneHarness();
  const tiles = Array.from({ length: 5 }, () => Array(8).fill('wall'));
  tiles[2][1] = tiles[2][2] = 'floor';
  tiles[2][3] = 'roomDoor';
  for (let y = 1; y <= 3; y++) for (let x = 4; x <= 6; x++) tiles[y][x] = 'floor';
  const optional = { room: { x: 4, y: 1, w: 3, h: 3, cx: 5, cy: 2 }, door: { x: 3, y: 2 }, entry: { x: 4, y: 2 }, kind: 'diamond', opened: false };
  Object.assign(h, {
    busy: false, gameEnded: false, inBossRoom: false, floor: 1, turn: 0, clickPathToken: 0, clickPathActive: false,
    player: { x: 2, y: 2, hp: 100, inventory: withKey ? [{ kind: 'floorkey' }, { kind: 'potion' }] : [{ kind: 'potion' }] },
    dungeon: { tiles, optionalRooms: [optional], stairs: { x: 6, y: 2 } },
    enemies: [], openedOptionalRooms: new Set(), tileSprites: tiles.map(row => row.map(() => ({}))), logs: [],
    scene: { get: () => ({ overlayMode: 'none' }) }, time: { now: 1000 },
    cameras: { main: { fadeEffect: { isRunning: false }, getWorldPoint: (x, y) => ({ x: x - MAP_X, y: y - MAP_Y }) } },
    isTileCurrentlyVisible: () => true, isInsideBossCombatFrame: () => true, isInsideBossRoom: () => false,
    dungeonObjectAt: () => undefined, enemyAt: () => undefined, bossObstacleAt: () => undefined, chestAt: () => undefined,
    dirVec: dir => ({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] })[dir],
    effectFx() {}, populateOptionalRoom() {}, setBoostTier() {}, setPlayerVisual() {}, applyTileVisual() {}, updateVisibility() {}, emitRefresh() {}, saveRun() {},
    log(message) { h.logs.push(message); }
  });
  return h;
}
const pointer = (x = 3, y = 2) => ({ button: 0, downTime: 1000, x: MAP_X + x * TILE + TILE / 2, y: MAP_Y + y * TILE + TILE / 2 });

{
  const h = fixture();
  await h.playerAct('right');
  assert.ok(h.dungeon.optionalRooms[0].opened, 'directional controls open the door');
}
{
  const h = fixture();
  assert.deepEqual([...h.findClickPath(3, 2)], ['right'], 'closed room door must be a clickable destination');
  await h.handleMapClick(pointer());
  assert.ok(h.dungeon.optionalRooms[0].opened, 'click opens the room through the real player action');
  assert.equal(h.dungeon.tiles[2][3], 'floor');
  assert.equal(h.openedOptionalRooms.size, 1);
  assert.deepEqual(h.player.inventory.map(item => item.kind), ['potion'], 'consume exactly one key');
  assert.equal(h.player.x, 2, 'stop after opening instead of auto-entering');
  assert.equal(h.clickPathActive, false);
}
{
  const h = fixture(false);
  await h.handleMapClick(pointer());
  assert.equal(h.dungeon.optionalRooms[0].opened, false, 'click cannot bypass the key requirement');
  assert.equal(h.dungeon.tiles[2][3], 'roomDoor');
  assert.ok(h.logs.some(message => message.includes('フロアキーが1個必要')), 'click explains the locked door');
  assert.equal(h.turn, 0);
  assert.equal(h.clickPathActive, false);
}
{
  const h = fixture(); h.player.x = 1;
  assert.deepEqual([...h.findClickPath(3, 2)], ['right', 'right'], 'can approach a visible room door from a distance');
  assert.equal(h.findClickPath(4, 2).length, 0, 'closed room doors cannot be crossed as intermediate path cells');
  h.isTileCurrentlyVisible = (x, y) => x !== 3 || y !== 2;
  assert.equal(h.findClickPath(3, 2).length, 0);
  await h.handleMapClick(pointer());
  assert.equal(h.dungeon.optionalRooms[0].opened, false, 'hidden doors remain untargetable');
}
{
  const h = fixture(); h.dungeon.tiles[2][3] = 'door';
  assert.deepEqual([...h.findClickPath(3, 2)], ['right'], 'boss entry door targeting remains supported');
  h.inBossRoom = true;
  assert.equal(h.findClickPath(3, 2).length, 0, 'sealed boss arena exits remain blocked');
  h.inBossRoom = false; h.dungeon.tiles[2][3] = 'wall';
  assert.equal(h.findClickPath(3, 2).length, 0, 'walls remain blocked');
  h.dungeon.tiles[2][3] = 'pit';
  assert.equal(h.findClickPath(3, 2).length, 0, 'pits remain blocked');
}
console.log('PASS: click-to-open, directional parity, one-key consumption, locked/hidden doors, approach paths, no pass-through, and boss/wall/pit restrictions.');
