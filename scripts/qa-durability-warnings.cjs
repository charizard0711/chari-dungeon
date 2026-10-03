const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const source = fs.readFileSync('src/durabilityWarnings.ts', 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, context);
const { DurabilityWarnings, isDurabilityLow } = context.exports;
for (const [cur, max, expected] of [[20,100,true],[21,100,false],[1,55,true],[11,55,true],[12,55,false],[0,100,false],[-1,100,false],[1,0,false]]) {
  assert.equal(isDurabilityLow({dur:cur,durMax:max}), expected, `${cur}/${max}`);
}
assert.equal(isDurabilityLow(null), false);
function makeImage() {
  return {width:1774,height:887,alpha:1,active:true,setOrigin(){return this;},setDepth(){return this;},
    setVisible(v){this.visible=v;return this;},setDisplaySize(w,h){this.displayWidth=w;this.displayHeight=h;return this;},
    setPosition(x,y){this.x=x;this.y=y;return this;},setAlpha(a){this.alpha=a;return this;},destroy(){this.active=false;}};
}
for (const mobile of [false,true]) {
  const images=[], map=mobile?{x:8,y:116,width:374}:{x:176,y:48,width:740};
  const view=new DurabilityWarnings({add:{image(){const image=makeImage();images.push(image);return image;}}},map,mobile);
  const player={weapon:{dur:20,durMax:100},shield:{dur:10,durMax:50}};
  const before=JSON.stringify(player);
  view.update(player,100,true);
  assert.ok(images.every(i=>i.visible));
  assert.equal(images[0].x,map.x+map.width-8); assert.equal(images[0].y,map.y+8);
  assert.ok(images[0].x-images[0].displayWidth>=map.x);
  assert.ok(images[1].y>images[0].y+images[0].displayHeight);
  view.update(player,1000,true); assert.equal(images[0].alpha,.55);
  view.update(player,1900,true); assert.equal(images[0].alpha,1);
  assert.equal(JSON.stringify(player),before,'warning never consumes or repairs equipment');
  player.weapon.dur=70;view.update(player,2000,true);
  assert.equal(images[0].visible,false); assert.equal(images[1].y,map.y+8,'shield alone occupies the top slot');
  player.shield=null;view.update(player,2100,true);assert.ok(images.every(i=>!i.visible));
  player.weapon={dur:10,durMax:100};player.shield={dur:5,durMax:50};view.update(player,2200,true);
  assert.ok(images.every(i=>i.visible&&i.alpha===1),'new equipment starts brightly');
  for(const prop of ['dual','bow']) {
    player.weapon.dual=prop==='dual';player.weapon.weaponType=prop==='bow'?'bow':'longsword';
    view.update(player,2300,true);assert.equal(images[1].visible,false,'two-handed weapons cannot show a shield warning');
  }
  player.weapon.weaponType='longsword';view.update(player,2400,false);assert.ok(images.every(i=>!i.visible),'menus and ending hide warnings');
  view.update(player,2500,true);assert.ok(images.every(i=>i.visible&&i.alpha===1));
  player.weapon.dur=0;player.shield.dur=0;view.update(player,2600,true);assert.ok(images.every(i=>!i.visible),'broken equipment is no longer about to break');
  view.destroy();assert.ok(images.every(i=>!i.active));
}
console.log('PASS: 20% boundary, equipped-only notices, PC/mobile top-right layout, both/single warnings, pulse, repair/unequip/breakage, bow/dual, modal/end and cleanup.');
