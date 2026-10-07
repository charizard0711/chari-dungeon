const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const s=fs.readFileSync('src/scenes/GameScene.ts','utf8');const method=s.slice(s.indexOf('  useDynamite() {'),s.indexOf('  private dynamiteExplosionFx'));
const run=vm.runInNewContext('(function '+method.trim()+')',{bossBodyRadius:()=>0,DYNAMITE_RADIUS:2,Audio:{playSe(){}}});
const boss={x:0,y:0,hp:700,hpMax:2000,alive:true,def:{isBoss:true,name:'boss',key:'boss'}};
const normal={x:0,y:0,hp:40,hpMax:40,alive:true,def:{name:'normal',key:'normal'}};
const ctx={player:{x:0,y:0},enemies:[boss,normal],clearMoveInput(){},log(){},dynamiteExplosionFx(){},discoverMonster(){},hitFx(){},killEnemy(e){e.alive=false},flashSprite(){},drawEnemyHp(){}};
run.call(ctx);assert.equal(boss.hp,630);assert.equal(normal.hp,0);run.call(ctx);assert.equal(boss.hp,567);console.log('Dynamite current HP 10%: 700 -> 630 -> 567; ordinary enemy defeated');
