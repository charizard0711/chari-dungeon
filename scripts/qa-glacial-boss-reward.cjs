const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInThisContext(`(function(require,module,exports){${js}\n})`,{filename:file})(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),m,m.exports);return m.exports;}
const player=load('src/player.ts'),appearance=load('src/playerAppearance.ts'),data=load('src/data.ts');
const source=fs.readFileSync(path.join(root,'src/scenes/GameScene.ts'),'utf8'),ast=ts.createSourceFile('GameScene.ts',source,ts.ScriptTarget.Latest,true);
const cls=ast.statements.find(s=>ts.isClassDeclaration(s)&&s.name.text==='GameScene');
const methods=cls.members.filter(m=>['dropBossRewards','unlockFloorGate'].includes(m.name?.getText(ast)));
const js=ts.transpileModule(`class Harness {${methods.map(m=>m.getText(ast)).join('\n')}}`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const Harness=vm.runInNewContext(js+'\nHarness',{...player,...appearance,...data,location:{hostname:'qa',search:''},URLSearchParams,Audio:{playSe(){}}});
function harness(floor){const h=new Harness(),drops=[];Object.assign(h,{floor,inBossRoom:true,player:{hp:100},enemies:[],floorBossDefeated:false,reviveSeedSeen:true,
 dungeon:{bossRoom:{cx:5,cy:5},stairs:{x:5,y:5},tiles:Array.from({length:12},()=>Array(12).fill('floor'))},tileSprites:[],
 dropEquipment:(x,y,kind,item)=>drops.push({kind,item,x,y}),dropItem(){},ownsArmor:()=>true,log(){},effectFx(){},floorHasGate:()=>true,
 refreshBossCompassVisual(){},setBossEntranceClosed(){},updateVisibility(){},emitRefresh(){}});return{h,drops};}
const oldRandom=Math.random,seen=new Set();
try{for(let i=0;i<100;i++){
 Math.random=()=>i/100;
 const {h,drops}=harness(15);h.unlockFloorGate('氷晶王ベヒーモス',{x:7,y:7});
 const weapons=drops.filter(d=>d.kind==='weapon');assert.equal(weapons.length,1);const item=weapons[0].item;
 assert.equal(item.element,'ice');assert.ok(data.WEAPON_DEFS.find(d=>d.key===item.key).minFloor<=15);assert.equal(item.dur,item.durMax);
 assert.ok(item.plus>=1);assert.equal(h.weaponWonThisFloor,true);assert.equal(h.bossRewardClaimed,true);assert.equal(h.dungeon.tiles[5][5],'stairs');
 seen.add(item.key);h.unlockFloorGate('duplicate',{x:7,y:7});assert.equal(drops.filter(d=>d.kind==='weapon').length,1,'repeat victory must not duplicate weapon');
 }
 assert.equal(seen.size,4,'all four unlocked ice weapon types must be reachable');
 const fireSeen=new Set();
 for(let i=0;i<100;i++) {
  Math.random=()=>i/100;
  const {h,drops}=harness(20);h.unlockFloorGate('熔獄竜ヴァルグラド');
  const weapons=drops.filter(d=>d.kind==='weapon');assert.equal(weapons.length,1);
  const w=weapons[0].item; assert.equal(w.element,'fire');assert.equal(w.dur,w.durMax);assert.equal(w.plus,2);
  assert.ok(data.WEAPON_DEFS.find(d=>d.key===w.key).minFloor<=20);fireSeen.add(w.key);
  h.unlockFloorGate('duplicate');assert.equal(drops.filter(d=>d.kind==='weapon').length,1);
  assert.equal(h.dungeon.tiles[5][5],'stairs');
 }
 assert.equal(fireSeen.size,4);
 const {h:field,drops:fieldDrops}=harness(15);field.inBossRoom=false;field.unlockFloorGate('field boss');assert.equal(fieldDrops.filter(d=>d.kind==='weapon').length,0,'guarantee belongs to dedicated 15F boss');
}finally{Math.random=oldRandom;}
console.log('PASS: 100 ice boss victories, exactly one full-durability ice weapon, all four types, no duplicate victory reward, stairs open; 100 fire dragon victories: exactly one fire weapon, all four types, no duplicates.');
