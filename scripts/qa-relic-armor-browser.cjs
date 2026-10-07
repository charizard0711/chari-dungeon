const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{const p=await b.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:5176/?qa-game&qa-save');await p.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);
const result=await p.evaluate(async()=>{
 const g=window.__game.scene.getScene('GameScene'),u=window.__game.scene.getScene('UIScene'),{makeWeapon}=await import('/src/player.ts'),{makePlayerArmor,playerSheetKey,playerFrameIndex}=await import('/src/playerAppearance.ts'),{rollStarWeapon}=await import('/src/equipmentTraits.ts'),check=(v,m)=>{if(!v)throw Error(m);};
 for(const sex of ['male','female'])for(const armor of ['dawn','aqua']){const t=g.textures.get(playerSheetKey(sex,armor));check(t.frameTotal===65,'64 armor frames '+sex+armor);for(const d of ['up','down','left','right'])for(const f of ['idle','walk1','atk','down'])check(t.has(playerFrameIndex(d,f)),'pose '+d+f);}
 g.player.baseHpMax=100;g.player.armor={...makePlayerArmor('dawn'),trait:'hp'};g.player.weapon=rollStarWeapon(makeWeapon('w_iron_dagger',[]),()=>0);g.player.weapons=[g.player.weapon];g.player.armors=[g.player.armor];check(g.player.hpMax===156,'star + armor HP');
 const snapshot=JSON.parse(JSON.stringify(g.captureRun()));check(snapshot.player.baseHpMax===100&&snapshot.player.hpMax===156,'save HP base');
 g.restoreRunState(snapshot);check(g.player.hpMax===156&&g.player.baseHpMax===100,'restore without doubling HP');
 g.player.armor.trait='charge';g.player.weapon.plus=15;check(g.skillChargeRequired===24,'SS armor reduces skill by six steps');
 g.player.armor.trait='rare_drop';check(g.rareItemDropRate===1.6,'SS drop multiplier');
 u.showEquipmentTooltip('armor',500,400);check(u.tooltip.getByName('rare-drop-description')?.style.color==='#ff83d9','pink tooltip');
 const originalDrops=g.dropEquipment.bind(g),originalItems=g.dropItem.bind(g),originalFloor=g.floor,originalInBoss=g.inBossRoom,originalRandom=Math.random;
 const outcomes=[];g.dropItem=()=>{};g.dropEquipment=(x,y,kind,item)=>outcomes.push({kind,key:item.key});
 try{for(const scenario of [{floor:25,roll:.199999,ss:true,sss:false},{floor:25,roll:.2,ss:false,sss:false},{floor:30,roll:.009999,ss:true,sss:true},{floor:30,roll:.01,ss:true,sss:false},{floor:30,roll:.2,ss:false,sss:false}]){outcomes.length=0;g.floor=scenario.floor;g.inBossRoom=true;g.bossRewardClaimed=false;Math.random=()=>scenario.roll;g.dropBossRewards({x:g.player.x,y:g.player.y},'QA');check(outcomes.some(o=>o.key==='dawn')===scenario.ss,'SS boundary '+JSON.stringify(scenario));check(outcomes.some(o=>o.key==='aqua')===scenario.sss,'SSS boundary '+JSON.stringify(scenario));}}finally{Math.random=originalRandom;g.floor=originalFloor;g.inBossRoom=originalInBoss;g.dropEquipment=originalDrops;g.dropItem=originalItems;}
 g.playerGender='male';g.equipArmor(0);return {frames:256,hp:g.player.hpMax,base:g.player.baseHpMax,dropBoundaries:5,pink:true};
});await p.screenshot({path:'outputs/relic-armor-tooltip.png'});
await p.goto('http://localhost:5176/?qa-game&qa-save&qa-resume');await p.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);
const resumed=await p.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');return {base:g.player.baseHpMax,max:g.player.hpMax,star:!!g.player.weapon?.starred,trait:g.player.armor?.trait};});assert.deepEqual(resumed,{base:100,max:150,star:true,trait:'rare_drop'});
assert.deepEqual(errors,[]);console.log(JSON.stringify(result));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
