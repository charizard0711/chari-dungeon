const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), cache = new Map();
function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file).exports;
  const m = {exports:{}}; cache.set(file,m);
  const js = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`,{filename:file})(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),m,m.exports);
  return m.exports;
}
const {EquipmentRenderer} = load('src/equipmentRenderer.ts');
const {HELD_EQUIPMENT} = load('src/equipmentAppearance.ts');
const {makeWeapon,makeShield} = load('src/player.ts');
const {WEAPON_DEFS,SHIELD_DEFS} = load('src/data.ts');
let created=0;
const textures=new Set(HELD_EQUIPMENT.map(a=>a.textureKey));
function image(x,y,key) {
  created++;
  return {x,y,texture:{key},frame:{name:0},
    setTexture(key,frame=0){this.texture={key};this.frame={name:frame};return this;},
    setVisible(v){this.visible=v;return this;},setOrigin(x,y){this.originX=x;this.originY=y;return this;},
    setPosition(x,y){this.x=x;this.y=y;return this;},setDisplaySize(w,h){this.displayWidth=w;this.displayHeight=h;return this;},
    setRotation(v){this.rotation=v;return this;},setFlipX(v){this.flipX=v;return this;},
    setDepth(v){this.depth=v;return this;},setAlpha(v){this.alpha=v;return this;},clearTint(){return this;}};
}
const gear=new EquipmentRenderer({add:{image},textures:{exists:k=>textures.has(k)}});
const body={x:100,y:200,originX:.5,originY:.6,scaleX:.85,scaleY:.85,rotation:0,depth:10,alpha:1,visible:true,active:true};
const sword=makeWeapon('w_longsword_ice',[]),shield=makeShield('s_frost_aegis');
const render=(dir='down',frame='idle',weapon=sword,offhand=shield,enabled=true,elapsed=0)=>gear.update(body,weapon,offhand,dir,frame,'female',elapsed,enabled);
render();const offset={x:gear.weapon.x-body.x,y:gear.weapon.y-body.y};
body.x+=37;body.y-=23;render();assert.ok(Math.abs(gear.weapon.x-body.x-offset.x)<1e-8);assert.ok(Math.abs(gear.weapon.y-body.y-offset.y)<1e-8);
body.rotation=Math.PI/2;render();assert.ok(Math.abs(gear.weapon.x-body.x+offset.y)<1e-8);assert.ok(Math.abs(gear.weapon.y-body.y-offset.x)<1e-8);
body.rotation=0;body.scaleX=body.scaleY=1.7;render();assert.ok(Math.abs(gear.weapon.x-body.x-offset.x*2)<1e-8);
body.scaleX=body.scaleY=.85;
for(const [frame,dir] of ['down','left','right','up'].entries()) {
  render(dir);assert.equal(gear.weapon.frame.name,frame);assert.equal(gear.offhand.frame.name,frame);
  assert.equal(gear.weapon.depth<body.depth,dir==='left'||dir==='up');
  assert.equal(gear.offhand.depth<body.depth,dir==='right'||dir==='up');
}
render('right','atk',sword,shield,true,0);const start=gear.weapon.rotation;
render('right','atk',sword,shield,true,42);const middle=gear.weapon.rotation;
render('right','atk',sword,shield,true,85);const end=gear.weapon.rotation;
assert.ok(start<middle&&middle<end,'attack should interpolate between poses');
for(const key of ['w_bow_ice','w_siege_arbalest','w_handgun_ice'])for(const dir of ['down','left','right','up']){
 render(dir,'atk',makeWeapon(key,[]),null,true,85);assert.equal(gear.weapon.rotation,0,'ranged weapons keep aiming instead of swinging');
}
const dual=makeWeapon('w_dual_sword_ice',[]);
render('down','idle',dual,shield);assert.equal(gear.offhand.texture.key,'held_w_dual_sword_ice');assert.equal(gear.offhand.flipX,true);
render();assert.equal(gear.offhand.texture.key,'held_s_frost_aegis');assert.equal(gear.offhand.flipX,false);
render('down','idle',sword,null);assert.equal(gear.offhand.visible,false);assert.equal(gear.weapon.visible,true);
render('down','idle',null,shield);assert.equal(gear.weapon.visible,false);assert.equal(gear.offhand.visible,true);
for(const mode of ['hidden','inactive','disabled','dead']) {
  body.visible=mode!=='hidden';body.active=mode!=='inactive';render('down',mode==='dead'?'down':'idle',sword,shield,mode!=='disabled');
  assert.equal(gear.weapon.visible,false,mode);assert.equal(gear.offhand.visible,false,mode);
}
body.visible=body.active=true;body.alpha=.25;render();assert.equal(gear.weapon.alpha,.25);assert.equal(gear.offhand.alpha,.25);
textures.delete('held_w_longsword_ice');render();assert.equal(gear.weapon.texture.key,'w_longsword_ice');
textures.add('held_w_longsword_ice');render();assert.equal(gear.weapon.texture.key,'held_w_longsword_ice');
for(const w of WEAPON_DEFS)for(const s of [null,...SHIELD_DEFS])for(const dir of ['down','left','right','up'])render(dir,'idle',makeWeapon(w.key,[]),s?makeShield(s.key):null);
assert.equal(created,2,'equipment changes must reuse the two images');
console.log('PASS: hand attachment follows translation/rotation/scale, directional depth, smooth attack, dual/shield/unequip transitions, hidden/dead/transformed states, alpha, fallback, two persistent sprites.');
