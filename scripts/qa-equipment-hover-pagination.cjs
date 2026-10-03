const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function extract(file,names,context){
 const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
 const members=ast.statements.find(ts.isClassDeclaration).members.filter(m=>names.includes(m.name?.getText(ast)));
 assert.equal(members.length,names.length);
 return vm.runInNewContext(ts.transpileModule(`class Harness {${members.map(m=>m.getText(ast)).join('\n')}}`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText+'\nHarness',context);
}
const Player=extract('src/player.ts',['atkMin','atkMax','def','fountainBlessingRate'],{});
const context={Phaser:{Math:{Clamp:(n,min,max)=>Math.max(min,Math.min(n,max))}},weaponFullName:w=>w.name,shieldFullName:s=>s.name,armorFullName:a=>a.name,
 durabilityRisk:()=>({label:'高'}),PLAYER_ARMOR_DEFS:{},isPlayerArmor:()=>false,gradeColor:()=>0};
const UI=extract('src/scenes/UIScene.ts',['showOwnedEquipmentTooltip','buildPickOverlay','turnPickPage'],context);
const p=new Player();Object.assign(p,{baseAtkMin:4,baseAtkMax:8,baseDef:3,level:5,transformationAttackRate:1.1,transformationDefBonus:2,fountainBlessingFloor:1,
 weapon:{name:'現在の剣',atkMin:2,atkMax:4,plus:0,magics:[],weaponType:'longsword'},shield:{defBonus:3,plus:1,dur:50},armor:{defBonus:4,plus:2}});
const ui=new UI(),tooltips=[];
Object.assign(ui,{gs:{player:p},weaponEffectText:()=> '火属性 / 追加効果',shieldEffectText:()=> '反射',showTooltip:(title,desc)=>tooltips.push({title,desc})});
const original={weapon:p.weapon,shield:p.shield,armor:p.armor},snapshot=JSON.stringify(p);
const sword={name:'未装備の剣',grade:'A',atkMin:10,atkMax:20,plus:3,magics:[{code:'A',level:2},{code:'B',level:3}],dur:18,durMax:100};
ui.showOwnedEquipmentTooltip({kind:'weapon',item:sword},200,150);
assert.match(tooltips.at(-1).desc,/未装備/);assert.match(tooltips.at(-1).desc,/攻撃力 30–60/);assert.match(tooltips.at(-1).desc,/18 \/ 100/);assert.match(tooltips.at(-1).desc,/追加効果/);
ui.showOwnedEquipmentTooltip({kind:'shield',item:{name:'未装備盾',grade:'S',defBonus:10,plus:3,dur:4,durMax:100}},200,150);
assert.match(tooltips.at(-1).desc,/防御力 \+13/);assert.match(tooltips.at(-1).desc,/装備時の防御力 28/);assert.match(tooltips.at(-1).desc,/反射/);
ui.showOwnedEquipmentTooltip({kind:'armor',item:{name:'未装備鎧',grade:'B',defBonus:9,plus:2}},200,150);
assert.match(tooltips.at(-1).desc,/防御力 \+11/);assert.match(tooltips.at(-1).desc,/耐久なし/);
assert.equal(JSON.stringify(p),snapshot);for(const key of Object.keys(original))assert.equal(p[key],original[key],'preview cannot change live equipment');

for(const height of [460,746])for(const slot of [0,1,2])for(const count of [0,1,12,21]){
 const list=Array.from({length:count},(_,i)=>({name:`装備${i}`,key:`item${i}`,grade:'A',dur:5,durMax:100,defBonus:2,plus:0,atkMin:1,atkMax:2}));
 Object.assign(p,{weapons:list,armors:list,shields:list,weapon:original.weapon});
 ui.pickSlot=slot;ui.pickPageIndex=0;ui.overlayMode='pick';ui.theme={text:'#fff'};
 let rows=[],hovered=[],clicked=-1;
 Object.assign(ui,{overlay:{add(){}},add:{text:()=>({setOrigin(){return this;}})},elementColor(){},framedIcon:()=>[{},{}],
  rowButton:(x,y,w,label,on,click,enabled=true)=>{const row={x,y,w,label,click,enabled};rows.push(row);return row;},
  bindEquipmentTooltip:(row,icon,entry)=>hovered.push({row,entry}),rebuildOverlay(){},
  gs:{player:p,equipWeapon:i=>clicked=i,equipArmor:i=>clicked=i,equipShield:i=>clicked=i}});
 const visited=[];
 do{
  rows=[];hovered=[];ui.buildPickOverlay(200,80,680,height);
  assert.equal(rows[0].enabled,ui.pickPageIndex>0);assert.equal(rows[1].enabled,ui.pickPageIndex<ui.pickPageCount-1);
  for(const {row,entry}of hovered){const index=list.indexOf(entry.item);visited.push(index);row.click();assert.equal(clicked,index);assert.ok(row.y+34<80+height-42,'rows do not overlap footer');}
  const old=ui.pickPageIndex;ui.turnPickPage(1);if(old===ui.pickPageIndex)break;
 }while(true);
 assert.deepEqual(visited,list.map((_,i)=>i));
 ui.pickPageIndex=999;ui.buildPickOverlay(200,80,680,height);assert.equal(ui.pickPageIndex,ui.pickPageCount-1,'inventory shrink clamps current page');
}
console.log('PASS: unequipped stat preview includes enhancement/magic/buffs with no mutation; weapon/shield/armor pagination reaches every original index, stays in bounds and clamps pages on PC/mobile.');
