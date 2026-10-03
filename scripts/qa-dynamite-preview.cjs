const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function extract(file,names,context){
 const ast=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true);
 const members=ast.statements.find(ts.isClassDeclaration).members.filter(m=>names.includes(m.name?.getText(ast)));
 assert.equal(members.length,names.length);
 const js=ts.transpileModule(`class Harness {${members.map(m=>m.getText(ast)).join('\n')}}`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
 return vm.runInNewContext(js+'\nHarness',context);
}
const balance=fs.readFileSync(path.join(root,'src/balance.ts'),'utf8');
const radius=Number(balance.match(/DYNAMITE_RADIUS = (\d+)/)[1]);assert.equal(radius,2);
const Game=extract('src/scenes/GameScene.ts',['showDynamiteRangePreview','useDynamite'],{TILE:32,DYNAMITE_RADIUS:radius,Audio:{playSe(){}},bossBodyRadius:def=>def.isBoss?1:0});
const draws=[];
function graphic(){const g={active:true,visible:false,tiles:[],clears:0,setDepth(){return this;},setVisible(v){this.visible=v;return this;},clear(){this.tiles=[];this.clears++;return this;},fillStyle(){return this;},lineStyle(){return this;},fillRect(x,y){this.tiles.push({x:(x-2)/32,y:(y-2)/32});return this;},strokeRect(){return this;}};draws.push(g);return g;}
const game=new Game(),ui={overlayMode:'none'};
Object.assign(game,{player:{x:4,y:4,inventory:[{kind:'dynamite'}],hp:100},dungeon:{tiles:Array.from({length:10},()=>Array(10).fill('floor'))},scene:{get:()=>ui},add:{graphics:graphic},log(){},dynamiteExplosionFx(){},clearMoveInput(){this.showDynamiteRangePreview(false);},discoverMonster(){},hitFx(){},killEnemy(e){e.killed=true;},flashSprite(){},drawEnemyHp(){}});
game.dungeon.tiles[4][5]='wall';
game.showDynamiteRangePreview(true);
const preview=game.dynamiteRangePreview;
assert.equal(preview.tiles.length,25);
assert.ok(preview.tiles.some(p=>p.x===6&&p.y===4),'preview includes cells behind walls, matching the blast');
assert.equal(game.player.inventory.length,1,'hover never consumes');assert.equal(game.player.hp,100);
game.showDynamiteRangePreview(true);assert.equal(preview.clears,1,'stationary preview is cached');
game.player.x=5;game.showDynamiteRangePreview(true);assert.equal(preview.clears,2);assert.ok(preview.tiles.some(p=>p.x===7));
game.player.x=0;game.player.y=0;game.showDynamiteRangePreview(true);assert.equal(preview.tiles.length,9,'map edges clip without drawing outside map');
for(const reason of ['out','busy','ended','empty','overlay']){
 game.busy=reason==='busy';game.gameEnded=reason==='ended';game.player.inventory=reason==='empty'?[]:[{kind:'dynamite'}];ui.overlayMode=reason==='overlay'?'inv':'none';
 game.showDynamiteRangePreview(reason!=='out');assert.equal(preview.visible,false,reason);
}
game.busy=false;game.gameEnded=false;ui.overlayMode='none';game.player.inventory=[{kind:'dynamite'}];game.player.x=4;game.player.y=4;
game.showDynamiteRangePreview(true);
const covered=new Set(preview.tiles.map(p=>p.x+','+p.y));
game.enemies=[];
for(let y=0;y<10;y++)for(let x=0;x<10;x++)game.enemies.push({x,y,alive:true,def:{key:'test'},hp:20,hpMax:20});
const bigHit={x:7,y:4,alive:true,def:{key:'large',isBoss:true},hp:100,hpMax:100};
const bigMiss={x:8,y:4,alive:true,def:{key:'large',isBoss:true},hp:100,hpMax:100};
game.enemies.push(bigHit,bigMiss);game.useDynamite();
for(const enemy of game.enemies.slice(0,100))assert.equal(enemy.hp===0,covered.has(enemy.x+','+enemy.y),'preview matches actual affected cells');
assert.equal(bigHit.hp,80);assert.equal(bigMiss.hp,100);assert.equal(preview.visible,false,'using dynamite clears the preview');
preview.active=false;game.showDynamiteRangePreview(true);assert.equal(draws.length,2);assert.equal(game.dynamiteRangePreview.tiles.length,25,'scene recreation redraws');

const UI=extract('src/scenes/UIScene.ts',['update'],{}),hud=new UI();
const calls=[];Object.assign(hud,{input:{isOver:true,activePointer:{x:25,y:25,wasTouch:false}},dynamiteHoverZone:{active:true,getBounds:()=>({contains:(x,y)=>x>=20&&x<74&&y>=20&&y<74})},skillHovered:true,skillButton:{visible:true},slotAuras:[],overlayMode:'none',refreshSkillButton(){},gs:{showDynamiteRangePreview:v=>calls.push(['dynamite',v]),showSkillRangePreview:v=>calls.push(['skill',v])}});
hud.update();assert.deepEqual(calls.splice(0),[['skill',false],['dynamite',true]]);
hud.input.activePointer.x=100;hud.update();assert.deepEqual(calls.splice(0),[['skill',true],['dynamite',false]]);
hud.input.activePointer.x=25;hud.input.isOver=false;hud.update();assert.equal(calls.at(-1)[1],false);
hud.input.isOver=true;hud.input.activePointer.wasTouch=true;hud.update();assert.equal(calls.at(-1)[1],false,'touch does not leave a sticky hover after use');
hud.input.activePointer.wasTouch=false;hud.dynamiteHoverZone=undefined;hud.update();assert.equal(calls.at(-1)[1],false,'depleted/destroyed item zone clears preview');
console.log('PASS: 5x5 hover preview, movement/cache, walls/map edges, all 100 ordinary hit positions and large boss overlap, no consumption, hide/use/overlay/empty/scene lifecycle, pointer exit and touch, skill preview priority.');
