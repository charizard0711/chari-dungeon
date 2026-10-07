const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const skillSource = fs.readFileSync('src/weaponSkills.ts', 'utf8');
const skillModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(skillSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports: skillModule.exports });
const { planSkill, weaponSkill, timeStopDestination } = skillModule.exports;
const origin = { x: 5, y: 5 };
const destination = timeStopDestination(origin, 'right', {
  blocked: x => x > 10, enemy: x => x === 6 || x === 7, object: x => x === 8
});
assert.equal(destination.x, 9); assert.equal(destination.y, 5);
assert.equal(timeStopDestination(origin, 'right', { blocked: x => x === 8, enemy: x => x===6 || x===7, object: () => false }), null);
assert.equal(timeStopDestination(origin, 'right', { blocked: () => false, enemy: () => false, object: x=>x===6 }), null);
const body = {};
const lance = planSkill('lance', origin, 'right', { blocked: (x,y)=>x===7&&y===5, enemyAt:()=>body, canHit:()=>true });
assert.equal(lance.tiles.length, 10); assert.equal(lance.targets.length, 1);
assert.ok(lance.tiles.some(p=>p.x===5&&p.y===2));
assert.ok(lance.tiles.every(p=>Math.abs(p.x-origin.x)+Math.abs(p.y-origin.y)<=3));
assert.equal(weaponSkill('twin_daggers').name, '十字絶閃');
for (const type of ['dual_sword', 'twin_daggers']) {
  const front = {}, rear = {}, beyondWall = {};
  const pierced = planSkill(type, origin, 'right', {
    blocked: x => x === 9,
    enemyAt: x => x === 6 ? front : x === 8 ? rear : x === 10 ? beyondWall : null,
    canHit: () => true
  });
  assert.equal(pierced.targets.length, 2);
  assert.equal(pierced.targets[0], front);
  assert.equal(pierced.targets[1], rear);
  assert.equal(weaponSkill(type).multiplier, 1.5);
}
const source = fs.readFileSync('src/scenes/GameScene.ts','utf8');
const ast = ts.createSourceFile('GameScene.ts', source, ts.ScriptTarget.Latest, true);
const scene = ast.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text==='GameScene');
const methods = ['useWeaponSkill','finishTurn','playerAttack','useItem','enemyTurn','enemyDefenseDefinition','enemyAttackDefinition'];
const cls = `class Harness {${scene.members.filter(n=>methods.includes(n.name?.getText(ast))).map(n=>n.getText(ast)).join('\n')}}`;
const Harness = vm.runInNewContext(ts.transpileModule(cls+'; Harness',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,
  { weaponSkill, planSkill, Audio:{playSe(){}}, paintedImpact(){}, paintedStun(){}, skillImpactTime:()=>0,
    consumeWeaponDurability:()=>({}), computePlayerAttack:(p,e,b,opts)=>{p.hits++;p.lastMultiplier=opts.multiplier;return {damage:10,drain:0,killScoreBonus:0};} });
function harness(type) {
  const enemy = { x:6,y:5,hp:1000,hpMax:1000,alive:true,stunnedTurns:0,def:{name:'試験敵',def:0} };
  const h = Object.assign(new Harness(), { busy:false,gameEnded:false,timeStopTurns:0,lanceSkillTurns:0,skillStepsRemaining:0,
    turn:0,floorTurn:20,skillChargeSteps:100,playerAnimToken:0,
    player:{...origin,dir:'right',hp:100,hpMax:300,hits:0,weapon:{weaponType:type,dual:['dual_sword','twin_daggers'].includes(type)},heal(n){this.hp=Math.min(this.hpMax,this.hp+n);}},
    enemies:[enemy],scene:{get:()=>({overlayMode:'none'})},skillTileBlocked:()=>false,enemyAt:(x,y)=>x===6&&y===5?enemy:null,
    dirVec:()=>[1,0],clearMoveInput(){},refreshTimeStopEffect(){},saveRun(){},log(){},emitRefresh(){},setPlayerVisual(){},drawSkillEffect(){},
    time:{delayedCall:(ms,fn)=>fn()},applyEmedralHit(){},playerDamageAgainstGimmick:(e,d)=>d,afterPlayerHitGimmick(){},
    discoverMonster(){},hitFx(){},flashSprite(){},drawEnemyHp(){},knockbackEnemy:async()=>{},healFx(){},
    async finishTurn(){this.turn++;if(this.lanceSkillTurns)this.lanceSkillTurns--;},
    playerSprite:{},dungeon:{},updateVisibility(){},updateStairsHint(){},optionalRoomContaining:()=>null });
  return [h,enemy];
}
(async()=>{
  for(const [type,hits] of [['longsword',1],['lance',1],['bow',1],['handgun',5],['dual_sword',3],['twin_daggers',3],['greatsword',1]]) {
    const [h,e]=harness(type); assert.equal(await h.useWeaponSkill(),true);
    assert.equal(h.player.hits,hits,type); assert.equal(h.turn,1); assert.equal(h.skillChargeSteps,0);
    if(type==='longsword')assert.equal(h.player.hp,170);
    if(type==='greatsword')assert.equal(h.player.hp,110);
    if(type==='bow') {
      assert.equal(e.stunnedTurns,2);
      h.enemyAct=()=>{throw Error('Stunned enemy must not act');};
      h.handleBossTurn=()=>{throw Error('Stunned boss intent must not progress');};
      await h.enemyTurn(); assert.equal(e.stunnedTurns,1);
      await h.enemyTurn(); assert.equal(e.stunnedTurns,0);
    }
    if(type==='lance') {
      assert.equal(h.lanceSkillTurns,0);
      assert.equal(e.skillAttackDownUntil,3);
    }
    if(type==='handgun') assert.equal(e.skillDefenseDownUntil,3);
  }
  for (const scenario of ['multiple','empty','cap','objects','kill']) {
    const [g, first] = harness('greatsword');
    const second = {...first, x:4, def:{...first.def}};
    g.enemies = [first,second];
    g.enemyAt = (x,y) => g.enemies.find(e=>e.x===x&&e.y===y) ?? null;
    let knocks=0; g.knockbackEnemy=async()=>{knocks++;};
    if(scenario==='empty')g.enemyAt=()=>null;
    if(scenario==='cap')g.player.hp=295;
    if(scenario==='objects')second.def.halloweenObject=true;
    if(scenario==='kill'){first.hp=1;g.killEnemy=e=>{e.alive=false;g.enemies=g.enemies.filter(a=>a!==e);};}
    assert.equal(await g.useWeaponSkill(),true);
    assert.equal(g.player.hp,scenario==='empty'?100:scenario==='cap'?300:scenario==='objects'?110:120,scenario);
    assert.equal(knocks,scenario==='empty'?0:scenario==='kill'?1:2,scenario+' knockback');
  }
  const [h,e]=harness('dagger');assert.equal(await h.useWeaponSkill(),true);
  assert.equal(h.timeStopTurns,5);assert.equal(h.player.hits,0);assert.equal(h.turn,0);
  h.finishTurn=Harness.prototype.finishTurn;
  h.player.poisonTurns=3;
  await h.playerAttack(e,'right');h.useItem(0);
  assert.equal(h.player.hits,0);assert.equal(e.hp,1000);
  for(let n=4;n>=0;n--){await h.finishTurn();assert.equal(h.timeStopTurns,n);assert.equal(h.floorTurn,20);assert.equal(h.player.poisonTurns,3);}
  assert.equal(h.turn,5);
  assert.equal(h.player.hits,1);assert.equal(h.player.lastMultiplier,1);
  e.facing='right';const beforeBackstab=e.hp;
  const defenseDefinition=h.enemyDefenseDefinition.bind(h);let hpBeforeNormalAttack;
  h.enemyDefenseDefinition=enemy=>{hpBeforeNormalAttack=enemy.hp;return defenseDefinition(enemy);};
  await h.useWeaponSkill(false,true);
  assert.equal(h.player.lastMultiplier,2);assert.equal(h.turn,5);
  assert.equal(hpBeforeNormalAttack,beforeBackstab-50,'5% fixed damage must precede normal damage');
  assert.equal(e.hp,beforeBackstab-60);
  e.def={def:100,atkMin:100,atkMax:100};e.skillAttackDownUntil=8;e.skillDefenseDownUntil=8;
  for (const turn of [6,7,8]) {
    h.turn=turn;assert.equal(h.enemyAttackDefinition(e).atkMin,70);assert.equal(h.enemyDefenseDefinition(e).def,70);
  }
  h.turn=9;assert.equal(h.enemyAttackDefinition(e).atkMin,100);assert.equal(h.enemyDefenseDefinition(e).def,100);
  console.log('PASS: time-stop collision/5 free turns/finisher; lance four directions/attack debuff; HP+70; bow stun; five gun shots; three cross slashes; greatsword per-monster healing/kill/empty/cap/object exclusion/knockback');
})().catch(e=>{console.error(e);process.exit(1)});
