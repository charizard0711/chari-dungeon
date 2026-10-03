const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function extract(file,names,context){
 const ast=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true);
 const methods=ast.statements.find(ts.isClassDeclaration).members.filter(m=>names.includes(m.name?.getText(ast)));
 assert.equal(methods.length,names.length);
 const js=ts.transpileModule(`class Harness {${methods.map(m=>m.getText(ast)).join('\n')}}`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
 return vm.runInNewContext(js+'\nHarness',context);
}
const kinds=['torch','potion','bomb','repair','revive','stone','shieldstone','shroom','warp','invis','slime_scroll','boss5_scroll','mystery_bread','dynamite','floorkey','seal'];
const definitions=Object.fromEntries(kinds.map(kind=>[kind,{name:kind,textureKey:kind,desc:kind+' description'}]));
const item=kind=>({kind,...definitions[kind]});
const Game=extract('src/scenes/GameScene.ts',['useItem'],{Audio:{playSe(){}}});
const Ui=mobile=>extract('src/scenes/UIScene.ts',['stackInventory','useInventoryKind','rebuildItems','buildUnifiedInventoryOverlay'],{
 ITEM_DEFS:definitions,IS_MOBILE:mobile,isRareItem:()=>false,EQUIPMENT_LIMIT:12,Phaser:{Math:{Clamp:(n,a,b)=>Math.max(a,Math.min(b,n))}}
});
function chain(){
 const node={events:{},on(event,callback){this.events[event]=callback;return this;}};
 for(const method of ['clear','fillStyle','fillRoundedRect','lineStyle','strokeRoundedRect','setOrigin','setInteractive','setDisplaySize','setAlpha'])node[method]=()=>node;
 return node;
}
for(const mobile of [false,true])for(const surface of ['quick','items','all']){
 const ui=new (Ui(mobile))(),g=new Game();
 Object.assign(g,{player:{inventory:['torch','potion','torch','bomb'].map(item),weapons:[],shields:[],armors:[],x:1,y:1},
  log(){},effectFx(){},updateVisibility(){},emitRefresh(){ui.refreshView();},itemSellPrice(){return 10;}});
 Object.assign(ui,{gs:g,itemSlotKinds:[],theme:{color:0xaaa},L:{items:{x:14,y:604,cols:6}},overlayMode:surface==='quick'?'none':'inv',inventoryTab:surface,inventoryScrollIndex:0,
  buttons:[],zones:[],icons:[],texts:[],overlay:{add(){}},itemContainer:{add(){},removeAll(){}},textures:{exists:()=>false},
  framedIcon:()=>[],hideTooltip(){},showTooltip(){},setOverlay(){this.refreshView();},
  rowButton(x,y,w,label,highlight,callback,enabled=true){const b={x,y,label,callback,enabled};this.buttons.push(b);return b;},
  refreshView(){this.buttons=[];this.zones=[];this.icons=[];this.texts=[];if(surface==='quick')this.rebuildItems();else this.buildUnifiedInventoryOverlay(8,48,mobile?374:680,mobile?746:620);}
 });
 ui.add={graphics:()=>chain(),image(x,y,key){ui.icons.push({x,y,key});return chain();},zone(x,y){const z=Object.assign(chain(),{x,y});ui.zones.push(z);return z;},text(x,y,text){ui.texts.push(text);return chain();}};
 ui.refreshView();
 const initialPositions=surface==='quick'?ui.icons.map(i=>[i.key,i.x,i.y]):ui.buttons.filter(b=>b.label.includes('description')).map(b=>[b.label.split(' ')[0],b.y]);
 const clickTorch=surface==='quick'?ui.zones[0].events.pointerdown:ui.buttons.find(b=>b.label.startsWith('torch')).callback;
 clickTorch();
 assert.deepEqual(Array.from(ui.stackInventory(g.player.inventory),s=>s.kind),['torch','potion','bomb']);
 assert.equal(g.player.inventory.filter(i=>i.kind==='torch').length,1);
 assert.equal(g.torchTurns,10);
 clickTorch();
 assert.equal(g.player.inventory.filter(i=>i.kind==='torch').length,0);
 clickTorch();clickTorch();
 assert.deepEqual(g.player.inventory.map(i=>i.kind),['potion','bomb'],'stale callback/repeated click cannot use neighboring items');
 const after=ui.stackInventory(g.player.inventory);
 assert.deepEqual(Array.from(after,s=>s.count),[0,1,1]);
 if(surface==='quick'){
  assert.deepEqual(ui.icons.map(i=>[i.key,i.x,i.y]),initialPositions,'quick slots never compact');
  assert.equal(ui.zones[0].events.pointerdown,undefined,'empty slot cannot consume');
  assert.ok(ui.texts.includes('×0'));
 }else{
  const rows=ui.buttons.filter(b=>b.label.includes('description'));
  assert.deepEqual(rows.map(b=>b.y),initialPositions.map(p=>p[1]),'list rows never compact');
  assert.equal(rows[0].enabled,false);
  assert.equal(ui.buttons.find(b=>b.label==='なし').enabled,false);
 }
 g.player.inventory.push(item('repair'),item('torch'));ui.refreshView();
 assert.deepEqual(Array.from(ui.stackInventory(g.player.inventory),s=>s.kind),['torch','potion','bomb','repair'],'reacquired kind returns to its old slot, new kind appends');
 g.player.inventory=[];ui.refreshView();
 assert.deepEqual(Array.from(ui.stackInventory([]),s=>s.count),[0,0,0,0]);
 g.player.inventory=kinds.slice().reverse().map(item);ui.refreshView();
 assert.equal(ui.stackInventory(g.player.inventory).length,16,'at most one slot per item kind');
}
console.log('PASS: desktop/mobile quick items and both inventory tabs retain positions after partial use, exhaustion, repeated/stale clicks, empty inventory and reacquisition; newly obtained kinds append without duplicates.');
