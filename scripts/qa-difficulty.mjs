import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../src/',import.meta.url)),cache=new Map(),storage=new Map();
const location={hostname:'example.com',search:''};
const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
function load(name){const file=path.resolve(root,name.endsWith('.ts')?name:name+'.ts');if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(`(function(require,module,exports){${js}\n})`,{console,Math,localStorage,location,URLSearchParams})(d=>load(path.resolve(path.dirname(file),d)),module,module.exports);return module.exports;}
const d=load('difficulty'),c=load('difficultyChallenge'),balance=load('balance'),data=load('data');
const json=x=>JSON.stringify(x);
assert.equal(d.isDifficultyUnlocked('hard',d.readDifficultyProgress()),false);
assert.equal(d.recordDifficultyClear('hard').saved,false);
assert.equal(d.selectDifficulty('master'),false);
assert.equal(d.recordDifficultyClear('normal').unlocked,'hard');
assert.equal(d.recordDifficultyClear('normal').unlocked,undefined);
assert.equal(d.selectDifficulty('hard'),true);
assert.equal(d.readDifficultyProgress().selected,'hard');
assert.equal(d.recordDifficultyClear('hard').unlocked,'master');
assert.equal(d.selectDifficulty('master'),true);
assert.equal(d.recordDifficultyClear('master').saved,true);
d.writeDifficultyProgress({selected:'normal',cleared:[]});
assert.equal(d.readDifficultyProgress().cleared.length,3,'stale tabs never erase earned clears');
assert.equal(d.normalizeDifficulty({cleared:['master'],selected:'master'}).selected,'normal');
storage.set(d.DIFFICULTY_SAVE_KEY,'broken');assert.equal(d.readDifficultyProgress().cleared.length,0);
const originalWrite=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota');};assert.equal(d.recordDifficultyClear('normal').saved,false);localStorage.setItem=originalWrite;
const real=storage.get(d.DIFFICULTY_SAVE_KEY);location.hostname='localhost';location.search='?qa-game';assert.equal(d.recordDifficultyClear('normal').saved,false);
location.search='?qa-game&qa-difficulty-profile=automated';assert.equal(d.recordDifficultyClear('normal').saved,true);assert.equal(d.readDifficultyProgress().cleared[0],'normal');assert.equal(storage.get(d.DIFFICULTY_SAVE_KEY),real);
assert.equal(d.difficultyFromCode('33333333'),'hard');assert.equal(d.difficultyFromCode('44444444'),'master');for(const invalid of ['3','3333333','444444444','19960711'])assert.equal(d.difficultyFromCode(invalid),undefined);
for(const mode of d.DIFFICULTIES){const raw={hp:100,atkMin:10,atkMax:20},scaled=d.difficultyEnemy(raw,mode);
 assert.equal(scaled.hp,mode==='normal'?100:mode==='hard'?125:150);assert.equal(json(d.difficultyEnemy(scaled,mode)),json(scaled));
 assert.equal(d.difficultyEnemy(d.difficultyEnemy(scaled,'master'),'hard').hp,125,'switches use original stats');assert.equal(raw.hp,100);
 assert.equal(d.difficultyGold(1000,mode),mode==='normal'?1000:mode==='hard'?700:500);}
assert.equal(data.SHIELD_DEFS.find(s=>s.key==='s_arcadia_guard').name,'漆黒の盾ルファルゼント');
const source=fs.readFileSync(path.join(root,'scenes/GameScene.ts'),'utf8'),ast=ts.createSourceFile('GameScene.ts',source,ts.ScriptTarget.Latest,true);
const cls=ast.statements.find(s=>ts.isClassDeclaration(s)&&s.name.text==='GameScene');
const selected=['handlePlayerDown','awardGold','redeemCode','handleDifficultyBossTurn','playerFacingSavedLog'];
const harness='class Harness {'+cls.members.filter(m=>selected.includes(m.name?.getText(ast))).map(m=>m.getText(ast)).join('\n')+'};globalThis.Harness=Harness;';
const ctx={...d,planDifficultyChallenge:c.planDifficultyChallenge,ITEM_CATALOG_CODE:'19960711',Audio:{playSe(){}},document:{body:{dataset:{}}},isWalkable:t=>t==='floor',bodyDistance:()=>2,bossBodyRadius:()=>0};
vm.runInNewContext(ts.transpileModule(harness,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,ctx);
for(const mode of d.DIFFICULTIES){const h=new ctx.Harness();Object.assign(h,{difficulty:mode,revivesUsed:0,player:{hp:0,hpMax:100,gold:0,inventory:[{kind:'revive'},{kind:'revive'}]},log(){},gameOver(){this.dead=true;}});
 h.handlePlayerDown();assert.equal(!!h.dead,mode==='master');h.handlePlayerDown();assert.equal(!!h.dead,mode!=='normal');assert.equal(h.awardGold(1000),d.difficultyGold(1000,mode));}
const h=new ctx.Harness(),enemy={alive:true,def:d.difficultyEnemy({hp:100,atkMin:10,atkMax:20},'normal'),hpMax:200,hp:100,challengeWaves:[],challengeTurn:2};
Object.assign(h,{difficulty:'normal',difficultyClearEligible:true,enemies:[enemy],player:{gold:125},floor:12,revivesUsed:1,log(){},clearDifficultyWarnings(){},drawEnemyHp(){},saveRun(){this.saved=true;},time:{delayedCall(){}},scene:{stop(){},launch(){}}});
assert.equal(h.redeemCode('33333333'),true);assert.equal(h.difficulty,'hard');assert.equal(enemy.hpMax,250);assert.equal(enemy.hp,125);assert.equal(h.floor,12);assert.equal(h.player.gold,125);assert.equal(h.revivesUsed,1);assert.equal(h.difficultyClearEligible,false);assert.equal(h.saved,true);
assert.equal(h.redeemCode('44444444'),true);assert.equal(enemy.hpMax,300);assert.equal(enemy.hp,150);h.redeemCode('44444444');assert.equal(enemy.hpMax,300);
assert.equal(h.redeemCode('19960711'),true);assert.equal(h.itemCatalogUnlocked,true);assert.equal(h.playerFacingSavedLog('堕天盾ルシファー+10'),'漆黒の盾ルファルゼント+10');
// Evaluate the actual production drop predicate with boundary rolls in every mode.
let breadIf;function visit(node){if(ts.isIfStatement(node)&&node.expression.getText(ast).includes('MYSTERY_BREAD_DROP_RATE'))breadIf=node;ts.forEachChild(node,visit);}visit(ast);assert.ok(breadIf);assert.equal(balance.MYSTERY_BREAD_DROP_RATE,.01);
for(const mode of d.DIFFICULTIES)for(const [roll,want]of [[0,true],[.009999,true],[.01,false],[.99,false]])for(const def of [{},{isBoss:true},{isFloorBoss:true},{isTreasureRabbit:true}]){
 const got=vm.runInNewContext(breadIf.expression.getText(ast),{def,difficulty:mode,MYSTERY_BREAD_DROP_RATE:balance.MYSTERY_BREAD_DROP_RATE,Math:{random:()=>roll}});
 assert.equal(got,want&&!Object.keys(def).length);}
const point={x:0,y:0},valid=(x,y)=>Math.abs(x)<4&&Math.abs(y)<4;
for(const mode of ['hard','master']){const waves=c.planDifficultyChallenge(mode,point,true,valid,valid);assert.equal(waves.length,mode==='hard'?1:2);assert.equal(waves[0].turns,1);assert.equal(c.hasChallengeEscape(point,waves,valid),true);
 assert.equal(c.planDifficultyChallenge(mode,point,true,valid,(x,y)=>x===0&&y===0).length,0,'never trap player in an unavoidable pattern');
 const boss={def:{isBoss:true},x:2,y:0,challengeWaves:JSON.parse(json(waves)),challengeTurn:0};let hits=0;
 Object.assign(h,{difficulty:mode,player:point,bossStates:new Map(),drawDifficultyWarnings(){},bossImpactFx(){},damagePlayerFromBoss(){hits++;},invisTurns:0});
 assert.equal(h.handleDifficultyBossTurn(boss),true);assert.equal(hits,1);assert.equal(boss.challengeWaves.length,mode==='master'?1:0);
 if(mode==='master'){assert.equal(boss.challengeWaves[0].turns,1);h.handleDifficultyBossTurn(boss);assert.equal(hits,2);assert.equal(boss.challengeWaves.length,0);}}
const counts={weapons:data.WEAPON_DEFS.length,shields:data.SHIELD_DEFS.length};
for(const mode of ['hard','master']){
 const boss={def:{isBoss:true},x:1,y:1,challengeWaves:[],challengeTurn:mode==='hard'?2:1};
 Object.assign(h,{difficulty:mode,player:{x:18,y:18},bossStates:new Map(),isInsideBossRoom:()=>true,
 dungeon:{tiles:Array.from({length:20},()=>Array(20).fill('floor'))},bossObstacleAt:()=>null,enemyAt:()=>null,chestAt:()=>null,dungeonObjects:[],bossHazards:[]});
 ctx.bodyDistance=()=>34;
 assert.equal(h.handleDifficultyBossTurn(boss),true,'room edges do not disable difficulty follow-up attacks');
 assert.ok(boss.challengeWaves.some(w=>w.tiles.some(p=>p.x===18&&p.y===18)));
 boss.challengeWaves=[];h.isInsideBossRoom=()=>false;
 assert.equal(h.handleDifficultyBossTurn(boss),false,'distant targets outside the room retain the range limit');
}
console.log('PASS: ordered persistent unlocks, corrupt/full storage, QA isolation, exact codes, stat scaling, idempotent switches, HP ratio, retained floor/items, gold/revive rules, bread 1% boundaries in every mode, safe timed boss waves and shield migration.');
console.log(counts);
