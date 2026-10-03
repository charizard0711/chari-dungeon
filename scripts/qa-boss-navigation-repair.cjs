const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const root = path.resolve(__dirname, '..'), cache = new Map();
function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename: file })(
    name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name), module, module.exports);
  return module.exports;
}
function extract(file, names, context) {
  const ast = ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true);
  const methods = ast.statements.find(ts.isClassDeclaration).members.filter(m => names.includes(m.name?.getText(ast)));
  assert.equal(methods.length, names.length);
  const js = ts.transpileModule(`class Harness {${methods.map(m => m.getText(ast)).join('\n')}}`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return vm.runInNewContext(js + '\nHarness', context);
}
const bodies = load('src/finalDepthBosses.ts'), navigation = load('src/bossNavigation.ts');
const { generateBossArena } = load('src/dungeon.ts');
const { customFloorBoss } = load('src/customFloorBosses.ts');
const Game = extract('src/scenes/GameScene.ts', ['passable', 'passableBodyCell', 'enemyAt', 'enemyAct', 'stepToward', 'findBossDestination', 'canBossRelocate', 'teleportBoss', 'isInsideBossRoom', 'isInsideBossCombatFrame', 'repairEquipment'],
  { ...bodies, ...navigation, Audio: { playSe() {} } });
function fresh(width = 15, height = 15, radius = 0) {
  const g = new Game();
  const boss = { x: 4, y: 4, def: { key: radius ? 'm_astravein' : 'test', isBoss: true, isFloorBoss: true, behavior: 'chase' }, alive: true, moveSteps: 0 };
  Object.assign(g, {
    floor: 5, inBossRoom: true, invisTurns: 0, player: { x: 11, y: 4 }, enemies: [boss],
    dungeon: { w: width, h: height, tiles: Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => x && y && x < width - 1 && y < height - 1 ? 'floor' : 'wall')), teleportPads: [], bossRoom: { x: 1, y: 1, w: width - 2, h: height - 2, cx: 7, cy: 7 } },
    chests: [], props: [], obstacles: [], bossStates: new Map(),
    chestAt(x,y) { return this.chests.find(p=>p.x===x&&p.y===y); },
    dungeonObjectAt(x,y) { return this.props.find(p=>p.x===x&&p.y===y); },
    bossObstacleAt(x,y) { return this.obstacles.find(p=>p.x===x&&p.y===y); },
    afterEnemyMoved() {}, animateEnemyMove() { return Promise.resolve(); }, enemyAttack() { this.attacked = true; return Promise.resolve(); },
    stepRandom() { this.randomMovement = true; return null; }, stepLoop() { assert.fail('boss must seek a route'); }, stepLine() { assert.fail('boss must seek a route'); },
    lineOfSight() { return false; }, effectFx() {}, placeSprite() {}, log() {}, emitRefresh() {}
  });
  return { g, boss };
}
function walk(g, boss, limit = g.dungeon.w * g.dungeon.h) {
  let moves = 0;
  while (bodies.bodyDistance(boss, bodies.bossBodyRadius(boss.def), g.player) > 1 && moves < limit) {
    const from = { x: boss.x, y: boss.y };
    g.enemyAct(boss);
    assert.equal(Math.abs(from.x - boss.x) + Math.abs(from.y - boss.y), 1, 'must make a legal one-tile detour each movement turn');
    assert.ok(g.passable(boss, boss.x, boss.y), 'entire body remains on legal cells');
    moves++;
  }
  assert.equal(bodies.bodyDistance(boss, bodies.bossBodyRadius(boss.def), g.player), 1);
  g.enemyAct(boss); assert.equal(g.attacked, true, 'adjacent boss attacks instead of moving');
  return moves;
}
{
  const { g, boss } = fresh();
  for (const [x,y] of [[5,4],[4,3],[4,5]]) g.dungeon.tiles[y][x] = 'wall';
  assert.equal(g.stepToward(boss, g.player.x, g.player.y), null, 'reproduce old permanent stall');
  g.enemyAct(boss); assert.equal(boss.x, 3, 'first move must lead away from target to escape pocket');
  walk(g, boss);
}
{
  const { g, boss } = fresh(16,16,1); boss.y = 3; g.player.y = 3;
  for (let y=1;y<15;y++) if (y!==3 && !(y>=8&&y<=11)) g.dungeon.tiles[y][7]='wall';
  assert.ok(walk(g,boss)>15, '3x3 boss must take the wide lower opening instead of the one-cell gap');
}
for (const behavior of ['chase','slow','ranged','random','loop','line']) {
  const { g,boss }=fresh(24,16); boss.def.behavior=behavior; g.player.x=21;
  g.enemyAct(boss); assert.equal(boss.x,5,'room boss pursues beyond nine tiles');
  g.invisTurns=1; boss.def.behavior='chase'; g.enemyAct(boss); assert.equal(g.randomMovement,true,'invisibility still prevents tracking');
}
{
  const { g,boss }=fresh(); const target={x:6,y:4};
  for (const property of ['chests','props','obstacles']) {
    g[property]=[target]; assert.equal(g.canBossRelocate(boss,target),false); g[property]=[];
  }
  for (const tile of ['wall','pit','door','roomDoor','stairs']) {
    g.dungeon.tiles[4][6]=tile; assert.equal(g.canBossRelocate(boss,target),false);
  }
  g.dungeon.tiles[4][6]='floor';
  g.dungeon.teleportPads=[target]; assert.equal(g.canBossRelocate(boss,target),false); g.dungeon.teleportPads=[];
  for (const [x,y] of [[5,4],[7,4],[6,3],[6,5]]) g.dungeon.tiles[y][x]='wall';
  assert.equal(g.canBossRelocate(boss,target),false,'isolated teleport pocket rejected');
  g.dungeon.tiles[4][7]='floor'; assert.equal(g.canBossRelocate(boss,target),true);
  const chosen=g.findBossDestination(boss); assert.ok(chosen);
  g.chests=[chosen]; g.teleportBoss(boss,chosen); assert.equal(boss.x,4,'occupied delayed destination must not be used');
  g.chests=[]; g.teleportBoss(boss,chosen); assert.equal(boss.x,chosen.x);
}
{
  const { g,boss }=fresh();
  for (let y=1;y<14;y++) g.dungeon.tiles[y][6]='wall';
  g.enemyAct(boss); assert.equal(boss.x,5);
  g.enemyAct(boss); assert.equal(boss.x,5,'inaccessible player must not cause oscillation');
  g.dungeon.tiles[4][6]='floor'; walk(g,boss);
}
let arenaRoutes=0;
for (let floor=1;floor<=30;floor++) {
  const {g,boss}=fresh(); g.floor=floor; g.dungeon=generateBossArena(floor);
  boss.def={...customFloorBoss(floor,'male'),isFloorBoss:true,isBoss:floor===30};
  const r=g.dungeon.bossRoom; boss.x=r.cx; boss.y=r.cy-2;
  const cells=[];
  for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++) if(g.dungeon.tiles[y]?.[x]==='floor') cells.push({x,y});
  for(const target of cells.filter((_,i)=>i%13===0)) {
    g.player=target; boss.x=r.cx; boss.y=r.cy-2; g.attacked=false;
    if(!g.passable(boss,boss.x,boss.y))continue;
    const route=navigation.bossApproach(boss,target,bodies.bossBodyRadius(boss.def),(x,y)=>g.passable(boss,x,y));
    if(!route.reachesTarget)continue;
    walk(g,boss);arenaRoutes++;
  }
}
function uiHarness(mobile) {
  const UI=extract('src/scenes/UIScene.ts',['buildRepairOverlay','turnRepairPage','handleEquipmentSecret'], {
    IS_MOBILE:mobile, gradeColor:()=>0xffffff, Phaser:{Math:{Clamp:(n,min,max)=>Math.max(min,Math.min(max,n))}}
  });
  const {g}=fresh(); g.player={inventory:[{kind:'repair'}],weapons:[],shields:[]};
  for (const kind of ['weapons','shields']) g.player[kind]=Array.from({length:12},(_,i)=>({key:kind+i,name:kind+i,grade:'A',plus:3,dur:10,durMax:100}));
  const ui=new UI(), bounds=mobile?[8,48,374,746]:[200,60,680,620];
  Object.assign(ui,{gs:g,repairKind:'weapon',repairPageIndex:0,repairPageCount:1,overlayMode:'repair',
    buttons:[],labels:[],rects:[],overlay:{add(){}},framedIcon:()=>[],
    rowButton(x,y,w,label,highlight,action,enabled=true){const b={x,y,w,label,action,enabled};this.buttons.push(b);return b;},
    setOverlay(mode){this.overlayMode=mode;},
    rebuildOverlay(){this.buttons=[];this.labels=[];this.rects=[];this.buildRepairOverlay(...bounds);}
  });
  ui.add={text(x,y,text){ui.labels.push(text);return{setOrigin(){return this;}};},graphics(){return{fillStyle(){return this;},fillRoundedRect(x,y,w,h){ui.rects.push({y,h});return this;}};}};
  ui.rebuildOverlay(); return {ui,g,bounds};
}
for(const mobile of [false,true]) {
  for(const kind of ['weapon','shield']) {
    const {ui,g,bounds}=uiHarness(mobile); ui.repairKind=kind; ui.rebuildOverlay();
    const seen=new Set();
    for(let page=0;page<ui.repairPageCount;page++) {
      for(const label of ui.labels)if(label.startsWith(kind))seen.add(label);
      for(const rect of ui.rects)assert.ok(rect.y+rect.h<=bounds[1]+bounds[3]-50,'rows stay above footer');
      const next=ui.buttons.find(b=>b.label==='次へ ›');
      assert.equal(next.enabled,page<ui.repairPageCount-1);
      if(next.enabled)next.action();
    }
    assert.equal(seen.size,12,'all owned items can be selected');
    assert.equal(g.player.inventory.length,1,'paging consumes nothing');
    const owned=kind==='weapon'?g.player.weapons:g.player.shields;
    ui.buttons.filter(b=>b.label==='修復する').at(-1).action();
    assert.equal(owned[11].dur,60,'last page repairs the selected item');
    assert.equal(owned[0].dur,10); assert.equal(g.player.inventory.length,0); assert.equal(ui.overlayMode,'inv');
    ui.overlayMode='repair';ui.rebuildOverlay(); assert.ok(ui.buttons.filter(b=>b.label==='修復する').every(b=>!b.enabled));
  }
  const {ui,g}=uiHarness(mobile); ui.turnRepairPage(99); assert.equal(ui.repairPageIndex,ui.repairPageCount-1);
  ui.handleEquipmentSecret({key:'PageUp',preventDefault(){}});assert.equal(ui.repairPageIndex,ui.repairPageCount-2);
  ui.buttons.find(b=>b.label==='盾').action(); assert.equal(ui.repairPageIndex,0);
  ui.turnRepairPage(99);g.player.shields.length=1;ui.rebuildOverlay();assert.equal(ui.repairPageIndex,0);assert.equal(ui.repairPageCount,1);
  g.player.shields[0].dur=100;ui.rebuildOverlay();assert.equal(ui.buttons.find(b=>b.label==='修復不要').enabled,false);
  g.player.shields=[];ui.rebuildOverlay();assert.ok(ui.labels.some(t=>t.includes('持っていません')));
  assert.equal(g.player.inventory.length,1);
  ui.handleEquipmentSecret({key:'Escape',preventDefault(){}});assert.equal(ui.overlayMode,'inv');
}
console.log(`PASS: U-shaped trap, 3x3 wide detour, all boss movement patterns, teleport occupancy/isolation, dynamic routes, ${arenaRoutes} arena routes; desktop/mobile repair pages, all 12 weapons/shields, exact-item repair, no paging cost, keyboard, clamp, empty/full/no-stone guards.`);
