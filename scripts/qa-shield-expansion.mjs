import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url)), cache = new Map();
let seed = 42;
const seededMath = Object.create(Math);
seededMath.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
function load(name) {
  // Rendering animation has its own lifecycle test in qa-secret-adventure.mjs.
  if (path.basename(name).replace(/\.ts$/, '') === 'legendaryAura') return { LegendaryAura: class { enabled = false; } };
  const file = path.resolve(root, name.endsWith('.ts') ? name : `${name}.ts`);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(`(function(require,module,exports){${js}\n})`, { Math: seededMath, console })
    (dep => load(path.resolve(path.dirname(file), dep)), module, module.exports);
  return module.exports;
}
const data = load('data'), player = load('player'), balance = load('balance');
const { resolveShieldHit } = load('shieldEffects');
const { SHIELD_DEFS } = data, { makeShield } = player;
const regular = SHIELD_DEFS.filter(d => !d.exclusiveLoot);
assert.equal(regular.length, 23); assert.equal(SHIELD_DEFS.length, 24);
for (const grade of ['D','C','B','A','S']) assert.equal(regular.filter(d=>d.grade===grade&&!d.element).length,3);
for (const element of ['fire','water','thunder','ice']) assert.equal(regular.filter(d=>d.element===element).length,2);
const seen = new Set();
for(let i=0;i<10000;i++) {
  for(const s of [player.rollShield(30), player.rollShieldByGrade(['D','C','B','A','S'][i%5])]) {
    assert.notEqual(s.key,'s_arcadia_guard'); seen.add(s.key);
  }
}
assert.equal(seen.size,23,'all regular shields can be obtained');
assert.equal(makeShield('s_arcadia_guard').plus,10);
const legendaryWeapon=player.makeWeapon('w_hero_sword',[]),legendaryShield=makeShield('s_arcadia_guard');
assert.equal(legendaryWeapon.grade,'SSS');assert.equal(legendaryShield.grade,'SSS');
assert.equal(legendaryWeapon.atkMin,16);assert.equal(legendaryWeapon.atkMax,30);
assert.equal(legendaryShield.defBonus,16);assert.equal(legendaryShield.durMax,300);
assert.ok(Number.isFinite(data.gradeColor('SSS')));
assert.match(player.weaponFullName(legendaryWeapon),/^\[SSS\]/);assert.match(player.shieldFullName(legendaryShield),/^\[SSS\]/);
for(const item of [legendaryWeapon,legendaryShield]) {
  item.grade='S';item.name='old name';item.plus=17;item.dur=23;item.guardCounter=2;
  player.refreshLegendaryEquipment(item);
  assert.equal(item.grade,'SSS');assert.equal(item.plus,17);assert.equal(item.dur,23);assert.equal(item.guardCounter,2);
  assert.notEqual(item.name,'old name');
}
const regularBefore=player.makeWeapon('w_iron_dagger',[]),regularCopy=JSON.stringify(regularBefore);
player.refreshLegendaryEquipment(regularBefore);assert.equal(JSON.stringify(regularBefore),regularCopy);
const context = {hp:80,hpMax:100};
function hits(key,n=1,damage=20,ctx=context) {
  const s=makeShield(key);return Array.from({length:n},()=>resolveShieldHit(s,damage,ctx,()=>.99));
}
const damages = rows => rows.map(row=>row.damage);
assert.deepEqual(damages(hits('s_arcadia_guard',6)),[20,20,0,20,20,0]);
assert.deepEqual(hits('s_arcadia_guard',6).map(r=>r.reflect),[4,4,0,4,4,0]);
assert.equal(hits('s_arcadia_guard',1,4)[0].reflect,0,'integer reflection rounds down');
assert.equal(hits('s_oak_guard',1,8)[0].damage,6); assert.equal(hits('s_oak_guard',1,9)[0].damage,9);
assert.deepEqual(damages(hits('s_scout_guard',4)),[20,20,20,10]);
assert.equal(hits('s_steel_bastion')[0].damage,18); assert.equal(hits('s_steel_bastion',1,1)[0].damage,1);
assert.deepEqual(hits('s_pilgrim_guard',4).map(r=>r.heal),[0,0,0,3]);
assert.deepEqual(damages(hits('s_duelist_guard',3)),[20,20,10]);
assert.equal(hits('s_watchman_guard')[0].damage,16); assert.equal(hits('s_watchman_guard',1,20,{...context,attackerElement:'fire'})[0].damage,20);
assert.equal(hits('s_sun_guard',1,20,{hp:70,hpMax:100})[0].damage,15);
assert.equal(hits('s_sun_guard',1,20,{hp:69,hpMax:100})[0].damage,20);
assert.equal(hits('s_moon_guard',1,20,{hp:40,hpMax:100})[0].damage,13);
assert.equal(hits('s_moon_guard',1,20,{hp:41,hpMax:100})[0].damage,20);
assert.equal(hits('s_requiem_guard')[0].damage,17); assert.equal(hits('s_requiem_guard')[0].reflect,1);
assert.equal(hits('s_prism_guard',1,20,{...context,attackerElement:'ice'})[0].damage,15);
assert.equal(hits('s_prism_guard')[0].damage,20);
assert.equal(hits('s_ember_guard')[0].reflect,3);
assert.deepEqual(hits('s_pearl_guard',3).map(r=>r.heal),[0,0,4]);
assert.deepEqual(damages(hits('s_thunder_crown',4)),[20,20,20,0]);
assert.equal(hits('s_glacier_guard',1,11)[0].damage,11); assert.equal(hits('s_glacier_guard',1,12)[0].damage,9);
assert.deepEqual(damages(hits('s_chrono_guard',5)),[20,20,20,20,0]);
assert.deepEqual(hits('s_seraph_guard',4).map(r=>r.heal),[0,0,0,6]);
const saved=JSON.parse(JSON.stringify(makeShield('s_arcadia_guard')));saved.guardCounter=2;
assert.equal(resolveShieldHit(saved,20,context).damage,0,'counter survives save/load');
const untouched=makeShield('s_arcadia_guard');resolveShieldHit(untouched,0,context);assert.equal(untouched.guardCounter,0);

// Exercise actual scene methods, including the category roll and +10 preservation.
const source=fs.readFileSync(path.join(root,'scenes/GameScene.ts'),'utf8');
const ast=ts.createSourceFile('GameScene.ts',source,ts.ScriptTarget.Latest,true);
const scene=ast.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text==='GameScene');
const method=name=>scene.members.find(n=>n.name?.getText(ast)===name);
const globals={...data,...player,...balance,...load('playerAppearance'),...load('monsterDirections'),resolveShieldHit,
  Math:Object.create(Math),console,location:{hostname:'example.com'},URLSearchParams,
  Audio:{playSe(){}}, BOSS_GROUND_ORIGIN_Y:.84,
  MILESTONE_BOSSES:{5:{scale:1.72,tint:0xffc96b}}};
const methods=['gachaPull','resolveShieldDefense','damagePlayer','refreshTransformationVisual','equipmentSellBase','weaponSellPrice','shieldSellPrice'];
const js=ts.transpileModule(`class Harness{${methods.map(n=>method(n).getText(ast)).join('\n')}}`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const Harness=vm.runInNewContext(`${js}\nHarness`,globals);
const prices=new Harness();assert.equal(prices.weaponSellPrice(player.makeWeapon('w_hero_sword',[])),580);
assert.equal(prices.shieldSellPrice(makeShield('s_arcadia_guard')),474);
function gacha(pool,roll) {
  const h=new Harness();let calls=0;globals.Math.random=()=>calls++===0?roll:.999999;
  Object.assign(h,{player:{gold:500},gameEnded:false,busy:false,pendingEquipment:null,weaponWonThisFloor:false,
    ownsArmor:()=>false,receiveShield:s=>h.received=s,receiveWeapon:s=>h.received=s,receiveArmor:s=>h.received=s,log(){},emitRefresh(){}});
  h.result=h.gachaPull(pool);return h;
}
for(const pool of ['weapon','armor']) {
  const win=gacha(pool,.000099999),lose=gacha(pool,.0001);
  assert.equal(win.received.key,pool==='weapon'?'w_hero_sword':'s_arcadia_guard');
  assert.equal(win.received.plus,10);assert.equal(win.result.rank,'SSS');assert.equal(win.result.grade,'SSS');assert.equal(win.received.grade,'SSS');assert.equal(win.player.gold,0);
  assert.notEqual(lose.received.key,win.received.key,'0.01% exclusive upper boundary');
}
const bossBlocks=method('killEnemy').body.statements.filter(n=>ts.isIfStatement(n)&&n.expression.getText(ast).includes('ARCADIA_BOSS_DROP_RATE'));
assert.equal(bossBlocks.length,2);
const dropJS=ts.transpileModule(`function drops(def){const result=[];const e={x:1,y:1};const that={dropEquipment:(x,y,kind,item)=>result.push({kind,item}),log(){}};(function(){${bossBlocks.map(n=>n.getText(ast)).join('\n')}}).call(that);return result}`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const drop=vm.runInNewContext(`${dropJS}\ndrops`,globals);
globals.Math.random=()=>.000999;
for(const def of [{isBoss:true},{isFloorBoss:true}]) {const reward=drop(def);assert.equal(reward.length,2);assert.equal(reward[1].item.plus,10);assert.ok(reward.every(r=>r.item.grade==='SSS'));}
assert.equal(drop({}).length,0);assert.equal(drop({isBoss:true,isTreasureRabbit:true}).length,0);
globals.Math.random=()=>.001;assert.equal(drop({isBoss:true}).length,0,'0.1% exclusive upper boundary');

const h=new Harness();let healed=0,killed=0;
Object.assign(h,{player:{shield:makeShield('s_arcadia_guard'),hp:100,hpMax:100,heal(n){healed+=n;}},
 log(){},effectFx(){},hitFx(){},drawEnemyHp(){},playPlayerHurt(){},handlePlayerDown(){},killEnemy(){killed++;},cameras:{main:{shake(){}}}});
const enemy={def:{key:'test',name:'test',element:null},hp:100,alive:true};
h.damagePlayer(20,'test',enemy);h.damagePlayer(20,'test',enemy);h.damagePlayer(20,'test',enemy);
assert.equal(h.player.hp,60);assert.equal(enemy.hp,92);assert.equal(healed,0);
h.damagePlayer(10,'poison');assert.equal(h.player.shield.guardCounter,3,'environment does not count');
enemy.hp=2;h.damagePlayer(20,'test',enemy);assert.equal(killed,1,'reflection can kill');
h.player.shield=makeShield('s_pilgrim_guard');h.player.shield.guardCounter=3;h.player.hp=1;h.damagePlayer(20,'lethal',enemy);
assert.equal(healed,0,'shield healing cannot resurrect a defeated player');

function sprite(){const obj={scene:true};for(const name of ['setTexture','setVisible','setOrigin','setDepth','setScale','setFlipX','setAlpha','setTint','clearTint'])obj[name]=(...args)=>{obj[name+'Args']=args;return obj;};return obj;}
for(const dir of ['down','left','right','up']) {
 const t=new Harness();Object.assign(t,{player:{dir},playerSprite:{...sprite(),x:10,y:20,depth:1},weaponSprite:sprite(),transformationSprite:sprite(),
   transformation:{kind:'boss5',textureKey:'m_archdemon',displaySize:43},textures:{get:()=>({getSourceImage:()=>({width:512,height:128})})},invisTurns:0});
 t.refreshTransformationVisual();assert.equal(t.transformationBaseScale,40*1.72/120);
 assert.equal(t.transformationSprite.setTextureArgs[0],'aurelius_directions_v1');
 assert.equal(t.transformationSprite.setTextureArgs[1],globals.MONSTER_DIRECTION_FRAME[dir]);
 assert.equal(t.transformationSprite.setFlipXArgs[0],false);assert.equal(t.transformationSprite.setOriginArgs[1],.84);
}
const catalog=load('itemCatalog');assert.equal(catalog.catalogPage('shield',0,9,true).total,24);assert.equal(catalog.catalogPage('shield',0,9,true).pageCount,3);
for(const art of load('equipmentAppearance').HELD_EQUIPMENT)assert.ok(fs.existsSync(new URL('../public/'+art.path,import.meta.url)),`directional asset must exist: ${art.path}`);
const {EquipmentRenderer}=load('equipmentRenderer');
function heldSprite(key){
 const s={texture:{key},frame:{name:'__BASE'}};
 for(const name of ['setOrigin','setPosition','setDisplaySize','setRotation','setFlipX','setDepth','setAlpha','clearTint'])s[name]=()=>s;
 s.setVisible=v=>{s.visible=v;return s;};s.setTexture=(key,frame)=>{s.texture.key=key;s.frame.name=frame;return s;};return s;
}
const renderer=new EquipmentRenderer({add:{image:(_x,_y,key)=>heldSprite(key)},textures:{exists:()=>false}});
const body={visible:true,active:true,texture:{key:'player_male_leather'},frame:{realWidth:128},x:0,y:0,originX:.5,originY:.7,scaleX:1,scaleY:1,rotation:0,depth:1,alpha:1};
for(const d of SHIELD_DEFS.filter(d=>!load('equipmentAppearance').HELD_EQUIPMENT_KEYS.has(d.key)))for(const dir of ['down','left','right','up']) {
 renderer.update(body,player.makeWeapon('w_soldier_blade',[]),makeShield(d.key),dir,'idle','male');
 assert.equal(renderer.offhand.visible,true);assert.equal(renderer.offhand.texture.key,d.key,'new shield painting must render in hand');
}
assert.match(catalog.ITEM_CATALOG.find(e=>e.key==='s_arcadia_guard').description,/防御力 \+26/);
for(const key of ['w_hero_sword','s_arcadia_guard'])assert.match(catalog.ITEM_CATALOG.find(e=>e.key===key).summary,/^SSS \//);
for(const asset of JSON.parse(fs.readFileSync(new URL('../art/shield-skill-expansion-v1/generation.json',import.meta.url))).assets)assert.ok(fs.existsSync(new URL('../'+asset.target,import.meta.url)));
console.log('PASS: 24 shields, 20,000 regular draws, 15 new passives, save counters, combat/reflection, exact legendary boundaries, 4-direction legacy transformation, 22 assets and codex pagination.');
