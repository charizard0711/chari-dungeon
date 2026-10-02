const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('fs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.QA_URL||'http://localhost:5173')+'/?qa-game&qa-save');await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);const checks=await page.evaluate(async()=>{
const g=window.__game.scene.getScene('GameScene');const {makeItem,MONSTER_DEFS}=await import('/src/data.ts');const {DYNAMITE_DROP_RATE}=await import('/src/balance.ts');const checks=[];const check=(v,m)=>{if(!v)throw Error(m);checks.push(m)};
g.enemyTurn=async()=>{};g.clearBossMechanics();g.enemies=[];g.dungeonObjects=[];g.chests=[];
for(let y=7;y<15;y++)for(let x=7;x<15;x++)g.dungeon.tiles[y][x]='floor';g.player.x=10;g.player.y=10;g.placeSprite(g.playerSprite,10,10);g.player.hp=g.player.hpMax=100;g.player.poisonTurns=0;
const base={...MONSTER_DEFS[0],hp:10000,exp:0,gold:0,score:0,def:999,isBoss:false,isFloorBoss:false,gimmick:undefined};
const add=(x,y,def={})=>g.addEnemy({...base,...def},x,y,1);
const corner=add(12,12),reverse=add(8,8),reviver=add(12,10,{gimmick:'revive'}),outside=add(13,10),boss=add(11,10,{isBoss:true,hp:1000});
const splitter=add(9,10,{gimmick:'split'}),shatter=add(10,9,{gimmick:'shatter'}),burst=add(9,9,{gimmick:'death_burst'});
g.dungeon.tiles[11][11]='wall';
g.player.inventory=[makeItem('dynamite'),makeItem('dynamite')];const turn=g.turn;g.useItem(0);await new Promise(resolve=>setTimeout(resolve,80));
check(!g.enemies.includes(corner)&&!g.enemies.includes(reverse),'all square corners hit, including across wall');
check(!g.enemies.includes(reviver),'ordinary reviving enemy killed outright');check(outside.hp===10000,'outside range untouched');check(boss.hp===800,'boss loses exactly 20 percent max HP regardless of defense');check(g.player.hp===100,'player takes no explosion or death-burst damage');check(!g.enemies.includes(splitter)&&!g.enemies.some(e=>e.cloneDepth>0),'splitter completely destroyed');check(g.turn===turn+1&&g.player.inventory.length===1,'one item and one turn consumed');
g.busy=false;g.useItem(0);await new Promise(resolve=>setTimeout(resolve,80));check(boss.hp===600,'second blast still uses maximum HP');
const drop=g.dropItem.bind(g),random=Math.random;let drops=[];g.dropItem=(x,y,kind)=>drops.push(kind);
try{for(const rate of [.019999,.02]){drops=[];Math.random=()=>rate;g.killEnemy(add(9,10),0,{quiet:true});check(drops.includes('dynamite')===(rate<.02),'exact 2 percent boundary '+rate)}
Math.random=()=>0;drops=[];g.killEnemy(add(9,10,{isBoss:true}),0,{quiet:true});check(!drops.includes('dynamite'),'boss does not use MOB drop roll');}finally{g.dropItem=drop;Math.random=random}
check(DYNAMITE_DROP_RATE===.02,'rate independent of ordinary drop halving');
g.player.inventory=[makeItem('dynamite')];g.saveRun();check(JSON.parse(localStorage.getItem('chari-dungeon.run.v1')).snapshot.player.inventory[0].kind==='dynamite','item saved');
g.buildFloor(10,true);g.player.hp=g.player.hpMax=10000;const realBoss=g.enemies.find(e=>e.def.isFloorBoss);g.player.x=realBoss.x;g.player.y=realBoss.y+1;g.placeSprite(g.playerSprite,g.player.x,g.player.y);g.player.inventory=[];
for(let i=0;i<5;i++)g.useDynamite();check(!g.enemies.includes(realBoss)&&g.floorBossDefeated,'five blasts kill real boss and unlock exit');
check(!g.logHistory.some(entry=>/10×10|専用エリア|その場にドロップ/.test(entry.msg||entry.text||'')),'player facing logs have no room-size implementation text');
check(!/10×10/.test(g.playerFacingSavedLog('◆ 1F 10×10の専用部屋から強い気配がする。入口を探せ。')),'legacy saved log refreshed');
check(window.__game.cache.audio.get('se_dynamite').duration>1,'full explosion sound decoded');
g.player.inventory=[makeItem('dynamite')];window.__game.scene.getScene('UIScene').refresh();return checks;
});fs.mkdirSync('outputs/qa-dynamite',{recursive:true});await page.screenshot({path:'outputs/qa-dynamite/explosion.png'});await page.waitForTimeout(1300);await page.screenshot({path:'outputs/qa-dynamite/item.png'});assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,errors},null,2));}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
