import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
import ts from 'typescript';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../src/',import.meta.url)),cache=new Map(),storage=new Map();
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
const phaser={Scenes:{Events:{POST_UPDATE:'postupdate',SHUTDOWN:'shutdown'}},GameObjects:{Events:{DESTROY:'destroy'}}};
function load(name){
 if(name==='phaser')return {default:phaser};
 const file=path.resolve(root,name.endsWith('.ts')?name:name+'.ts');
 if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(`(function(require,module,exports){${js}\n})`,{console,Math,localStorage})(d=>load(d==='phaser'?d:path.resolve(path.dirname(file),d)),module,module.exports);return module.exports;
}
const q=load('secretQuests'),data=load('data'),player=load('player'),treasury=load('treasury');
const allKills=Object.fromEntries(q.SECRET_QUESTS.map(quest=>[quest.id,quest.count]));
let p=q.normalizeQuests();
assert.equal(q.recordQuestKill(p,'other',()=>.05).fragment,false);
assert.equal(q.recordQuestKill(p,'other',()=>.049999).fragment,true);
assert.equal(p.fragments,1);
for(let i=0;i<20;i++)q.recordQuestKill(p,'m_mush',()=>.99);
assert.equal(p.kills.lantern,20);assert.equal(p.kills.owl,0);assert.equal(q.canClaimQuest(p),false);
for(let i=0;i<3;i++)assert.equal(q.recordQuestKill(p,'other',()=>0).revealed,false);
const fifth=q.recordQuestKill(p,'other',()=>0);
assert.equal(fifth.revealed,true);assert.equal(fifth.completed.length,1);assert.equal(fifth.completed[0].id,'lantern');
assert.equal(fifth.rewardReady,false);assert.equal(q.completedQuestCount(p),1);
assert.equal(q.claimQuest(p,q.SECRET_WEAPON_KEYS[0]),false,'one quest cannot award a weapon');
assert.equal(q.recordQuestKill(p,'m_mush',()=>0).completed.length,0);assert.equal(p.fragments,5);assert.equal(p.kills.lantern,20);
for(const quest of q.SECRET_QUESTS.slice(1)){
 for(let i=0;i<19;i++)q.recordQuestKill(p,quest.monster,()=>.99);
 assert.equal(q.canClaimQuest(p),false);
 assert.equal(q.claimQuest(p,q.SECRET_WEAPON_KEYS[0]),false,'even four complete quests plus 19 kills is insufficient');
 const r=q.recordQuestKill(p,quest.monster,()=>.99);assert.equal(r.completed[0].id,quest.id);
 assert.equal(r.rewardReady,quest.id==='eye');assert.equal(q.canClaimQuest(p),quest.id==='eye');
}
assert.equal(q.recordQuestKill(p,'m_eye',()=>0).rewardReady,false,'completion is announced once');
assert.equal(q.claimQuest(p,'w_hero_sword'),false);
assert.equal(q.claimQuest(p,q.SECRET_WEAPON_KEYS[0]),true);
for(const key of q.SECRET_WEAPON_KEYS)assert.equal(q.claimQuest(p,key),false,'only one of the five weapons may be claimed');
assert.equal(p.claimed.length,5,'v1 clients must see every individual reward as consumed');
const concealed=q.normalizeQuests({fragments:4,kills:allKills});
assert.equal(q.canClaimQuest(concealed),false,'all kills still require the five fragments');
assert.equal(q.recordQuestKill(concealed,'other',()=>0).rewardReady,true,'reveal after all kills also unlocks reward');
const clean=q.normalizeQuests({fragments:Infinity,kills:{lantern:-1,owl:500,eye:NaN},claimed:['lantern','lantern','fake'],announced:'invalid'});
assert.equal(clean.fragments,0);assert.equal(clean.kills.owl,20);assert.equal(clean.kills.lantern,0);assert.equal(clean.claimed.length,1);assert.equal(clean.announced.length,0);
for(const quest of q.SECRET_QUESTS){
 const old=q.normalizeQuests({fragments:5,kills:allKills,claimed:[quest.id]});
 assert.equal(q.claimQuest(old,q.SECRET_WEAPON_KEYS[0]),false,'a legacy individual reward consumes the journal reward');
 const merged=q.mergeQuests(q.normalizeQuests({fragments:5,kills:allKills}),old);
 assert.equal(q.canClaimQuest(merged),false,'resume cannot erase a previous claim');
}
q.writeQuestJournal(p);assert.equal(q.readQuestJournal().claimed.length,5);assert.equal(q.canClaimQuest(q.readQuestJournal()),false);
const merged=q.mergeQuests(q.readQuestJournal(),{fragments:3,kills:{lantern:2}});assert.equal(merged.fragments,5);assert.equal(merged.kills.lantern,20);assert.equal(merged.claimed.length,5);
storage.set(q.QUEST_SAVE_KEY,'corrupt');assert.equal(q.readQuestJournal().fragments,0);
localStorage.setItem=()=>{throw Error('quota');};assert.equal(q.writeQuestJournal(p),false);
assert.equal(q.SECRET_WEAPON_KEYS.length,5);
for(const key of q.SECRET_WEAPON_KEYS){const w=player.makeWeapon(key,[]),d=data.WEAPON_DEFS.find(d=>d.key===key);assert.equal(w.plus,3);assert.equal(w.grade,'S');assert.ok(w.element&&w.passive);assert.equal(d.exclusiveLoot,true);}
for(let i=0;i<3000;i++)for(const w of [player.rollWeaponByGrade('S'),player.rollGlacialBossWeapon(),player.rollVolcanicBossWeapon(),treasury.rollTreasuryReward().weapon])assert.ok(!q.SECRET_WEAPON_KEYS.includes(w.key),'quest rewards must not leak into ordinary loot');
assert.equal(player.makeShield('s_arcadia_guard').name,'漆黒の盾ルファルゼント');
assert.equal(player.makeShield('s_arcadia_guard').plus,10);
const source=fs.readFileSync(path.join(root,'scenes/GameScene.ts'),'utf8');
const ast=ts.createSourceFile('GameScene.ts',source,ts.ScriptTarget.Latest,true),cls=ast.statements.find(s=>ts.isClassDeclaration(s)&&s.name.text==='GameScene');
const names=['claimSecretQuest','receiveWeapon'];
const harnessSource='class Harness {'+cls.members.filter(m=>names.includes(m.name?.getText(ast))).map(m=>m.getText(ast)).join('\n')+'};globalThis.Harness=Harness;';
const context={makeWeapon:player.makeWeapon,weaponFullName:player.weaponFullName,claimQuest:q.claimQuest,Audio:{playSe(){}},EQUIPMENT_LIMIT:12};
vm.runInNewContext(ts.transpileModule(harnessSource,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,context);
const h=new context.Harness();Object.assign(h,{secretQuests:q.normalizeQuests({fragments:5,kills:{lantern:20}}),player:{weapons:[]},pendingEquipment:null,log(){},emitRefresh(){},saveRun(){this.saves=(this.saves||0)+1;},recordOwnedEquipment(){},showForcedEquipmentSale(){this.sale=true;}});
assert.equal(h.claimSecretQuest(q.SECRET_WEAPON_KEYS[0]),false);assert.equal(h.player.weapons.length,0);
h.secretQuests=q.normalizeQuests({fragments:5,kills:allKills});
assert.equal(h.claimSecretQuest(q.SECRET_WEAPON_KEYS[0]),true);assert.equal(h.player.weapons.length,1);
assert.equal(h.claimSecretQuest(q.SECRET_WEAPON_KEYS[1]),false);assert.equal(h.saves,1);
h.secretQuests=q.normalizeQuests({fragments:5,kills:allKills});
h.player.weapons=Array.from({length:12},()=>player.makeWeapon('w_soldier_blade',[]));
assert.equal(h.claimSecretQuest(q.SECRET_WEAPON_KEYS[1]),true);assert.equal(h.player.weapons.length,12);assert.equal(h.pendingEquipment.item.key,q.SECRET_WEAPON_KEYS[1]);assert.equal(h.sale,true);
assert.equal(h.claimSecretQuest(q.SECRET_WEAPON_KEYS[2]),false);assert.equal(h.pendingEquipment.item.key,q.SECRET_WEAPON_KEYS[1]);
h.pendingEquipment=null;h.busy=true;h.secretQuests=q.normalizeQuests({fragments:5,kills:allKills});
assert.equal(h.claimSecretQuest(q.SECRET_WEAPON_KEYS[0]),false);assert.equal(h.secretQuests.claimed.length,0);
h.busy=false;h.gameEnded=true;assert.equal(h.claimSecretQuest(q.SECRET_WEAPON_KEYS[0]),false);

// Exercise the actual aura update and cleanup against a tiny display-list double.
class Sprite extends EventEmitter {
 constructor(){super();Object.assign(this,{visible:true,active:true,alpha:1,displayWidth:100,displayHeight:100,originX:.5,originY:.8,x:10,y:20,rotation:0,depth:3,lines:[]});}
 clear(){this.lines=[];return this;}setVisible(v){this.visible=v;return this;}setPosition(x,y){this.x=x;this.y=y;return this;}setRotation(r){this.rotation=r;return this;}setDepth(d){this.depth=d;return this;}setAlpha(a){this.alpha=a;return this;}setDisplaySize(w,h){this.displayWidth=w;this.displayHeight=h;return this;}lineStyle(){return this;}lineBetween(...p){this.lines.push(p);return this;}destroy(){this.active=false;this.emit('destroy');}
}
// Phaser's emitter accepts a context argument; Node's emitter adapter preserves it.
class Events { constructor(){this.entries=[];}on(n,f,c){this.entries.push({n,f,c,once:false});}once(n,f,c){this.entries.push({n,f,c,once:true});}off(n,f,c){this.entries=this.entries.filter(e=>!(e.n===n&&e.f===f&&e.c===c));}emit(n){for(const e of [...this.entries])if(e.n===n){e.f.call(e.c);if(e.once)this.off(e.n,e.f,e.c);}}}
const {LegendaryAura,spiralPoint}=load('legendaryAura');assert.notEqual(spiralPoint(.3,0,0).x,spiralPoint(.3,500,0).x);
assert.notEqual(spiralPoint(.3,0,0).front,spiralPoint(.3,0,1).front);
const objects=[],scene={time:{now:0},events:new Events(),add:{graphics:()=>{const s=new Sprite();objects.push(s);return s;},image:()=>{const s=new Sprite();objects.push(s);return s;}}};
const target=new Sprite();target.once=()=>target;target.off=()=>target;
const aura=new LegendaryAura(scene,target,'sword');scene.events.emit('postupdate');const first=JSON.stringify(objects.map(o=>o.lines));scene.time.now=650;scene.events.emit('postupdate');assert.notEqual(JSON.stringify(objects.map(o=>o.lines)),first);aura.enabled=false;scene.events.emit('postupdate');assert.ok(objects.every(o=>!o.visible));aura.destroy();assert.equal(scene.events.entries.length,0);
const shield=new LegendaryAura(scene,target,'shield');scene.events.emit('postupdate');const sizes=objects.slice(-3).map(o=>o.displayWidth);scene.time.now+=500;scene.events.emit('postupdate');assert.notDeepEqual(objects.slice(-3).map(o=>o.displayWidth),sizes);scene.events.emit('shutdown');assert.equal(scene.events.entries.length,0);
for(const [key,rel]of Object.entries(load('adventureArt').ADVENTURE_ART)){const f=new URL('../public/'+rel,import.meta.url);assert.ok(fs.existsSync(f),key);assert.ok(fs.statSync(f).size>1000);}
for(const art of load('equipmentAppearance').HELD_EQUIPMENT)assert.ok(fs.existsSync(new URL('../public/'+art.path,import.meta.url)),art.itemKey);
console.log('PASS: exact 5% / five fragments / all five 20-kill quests required / single journal reward and full inventory / persistence and migration / 12,000 loot rolls / animated aura lifecycle / 15 image assets.');
