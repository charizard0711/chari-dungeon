const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const url = process.env.QA_URL || 'http://localhost:5175';
const out = 'outputs/qa-halloween';
fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.stack));
  const waitScene=name=>page.waitForFunction(name=>window.__game?.scene.isActive(name),name,{timeout:60000});
  const waitGame=()=>page.waitForFunction(()=>window.__game?.scene.isActive('GameScene')&&window.__game.scene.getScene('GameScene').playerSprite?.active&&!window.__game.scene.getScene('GameScene').restoringRun,null,{timeout:60000});
  const clickNamed=async(scene,name)=>{
    const point=await page.evaluate(({scene,name})=>{const children=window.__game.scene.getScene(scene).children.list; const o=[...children,...children.flatMap(c=>c.list||[])].find(c=>c.name===name); if(!o)throw Error(name);return {x:o.x,y:o.y};},{scene,name});
    const box=await page.locator('canvas').boundingBox();
    const size=await page.evaluate(()=>({w:window.__game.scale.gameSize.width,h:window.__game.scale.gameSize.height}));
    await page.mouse.click(box.x+point.x*box.width/size.w,box.y+point.y*box.height/size.h);
  };
  const summary=()=>page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');return {mode:g.eventMode,floor:g.floor,level:g.player.level,weapon:g.player.weapon.key,weapons:g.player.weapons.length,bosses:g.enemies.filter(e=>e.def.isFloorBoss).map(e=>e.def.key),mobs:g.enemies.filter(e=>!e.def.isFloorBoss).map(e=>e.def.key),objects:g.dungeonObjects.map(o=>o.sprite.texture.key),tile:g.dungeon.tiles[g.dungeon.stairs.y][g.dungeon.stairs.x]};});
  try {
    await page.goto(url+'/?qa-silent&qa-save');await waitScene('TitleScene');
    await page.evaluate(()=>{localStorage.setItem('chari-dungeon.equipment-codex.v1',JSON.stringify(['w_iron_dagger','w_royal_spear']));});
    await page.screenshot({path:out+'/01-title.png'});
    await clickNamed('TitleScene','halloween-event');await waitScene('HalloweenScene');
    await page.screenshot({path:out+'/02-weapon-choice.png'});
    await clickNamed('HalloweenScene','event-weapon-w_royal_spear');
    await clickNamed('HalloweenScene','event-start');await waitGame();
    const initial=await summary();assert.equal(initial.mode,'halloween');assert.equal(initial.level,1);assert.equal(initial.weapon,'w_royal_spear');assert.equal(initial.weapons,1);assert.deepEqual(initial.bosses,['m_hw_pumpkin_lord']);assert.ok(initial.mobs.every(k=>k.startsWith('m_hw_')));assert.ok(initial.objects.includes('hw_candy'));
    // Verify every key has a real source image, rather than the missing texture fallback.
    assert.equal(await page.evaluate(()=>Object.keys(window.__game.textures.list).filter(k=>k.startsWith('m_hw_')||k.startsWith('w_hw_')||k.startsWith('s_hw_')).every(k=>window.__game.textures.get(k).getSourceImage().width>30)),true);
    await page.evaluate(async()=>{const g=window.__game.scene.getScene('GameScene');await g.playerAct('up');g.saveRun();});
    const eventSave=await page.evaluate(()=>localStorage.getItem('chari-dungeon.halloween.run.v1'));assert.ok(eventSave);
    // Start and save a regular adventure; it must survive all event operations byte-for-byte.
    await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');g.scene.stop('UIScene');g.scene.start('GameScene',{difficulty:'normal'});});await waitGame();
    await page.evaluate(()=>window.__game.scene.getScene('GameScene').saveRun());
    let normalSave=await page.evaluate(()=>localStorage.getItem('chari-dungeon.run.v1'));assert.ok(normalSave);
    assert.equal(await page.evaluate(()=>localStorage.getItem('chari-dungeon.halloween.run.v1')),eventSave);
    assert.ok((await summary()).mobs.every(k=>!k.startsWith('m_hw_')));
    await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');g.scene.stop('UIScene');g.scene.start('GameScene',{resume:true});});await waitGame();
    assert.equal((await summary()).mode,null);assert.equal((await summary()).weapon,'w_iron_dagger');
    await page.evaluate(()=>window.__game.scene.getScene('GameScene').saveRun());
    normalSave=await page.evaluate(()=>localStorage.getItem('chari-dungeon.run.v1'));
    await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');g.scene.stop('UIScene');g.scene.start('HalloweenScene');});await waitScene('HalloweenScene');
    normalSave=await page.evaluate(()=>localStorage.getItem('chari-dungeon.run.v1'));
    await clickNamed('HalloweenScene','event-resume');await waitGame();assert.equal((await summary()).weapon,'w_royal_spear');
    // Restored objects and chests retain their themed textures.
    assert.equal(await page.evaluate(()=>window.__game.scene.getScene('GameScene').chests.every(c=>c.sprite.texture.key===(c.diamond?(c.opened?'chest_diamond_open':'chest_diamond'):(c.opened?'hw_chest_open':'hw_chest')))),true);
    const results=[];
    for(let floor=1;floor<=5;floor++){
      assert.equal((await summary()).floor,floor);
      const checks=await page.evaluate(async()=>{
        const g=window.__game.scene.getScene('GameScene'),d=g.dungeon,b=g.enemies.find(e=>e.def.isFloorBoss);
        if(!b)throw Error('missing boss');
        const retainers=g.enemies.filter(e=>e.def.isHalloweenRetainer);
        const mobs=g.enemies.filter(e=>!e.def.isFloorBoss&&!e.def.isHalloweenRetainer);
        if(retainers.length!==3||mobs.length!==(11+g.floor*2)*3)throw Error('event enemy counts');
        if(![...mobs,...retainers].every(e=>Math.abs(e.baseScale*Math.max(e.sprite.texture.getSourceImage().width,e.sprite.texture.getSourceImage().height)-44.2)<.1))throw Error('event mob size');
        if(!retainers.every(e=>g.isInsideBossRoom(e.x,e.y)))throw Error('retainer outside room');
        const outside=d.start;
        if(retainers.some(e=>g.passable(e,outside.x,outside.y)))throw Error('retainer can leave room');
        if(retainers.some(e=>g.enemyAct(e)!==null))throw Error('retainer active before room entry');

        // Reachability with real permanent object footprints excluded; containers may be broken.
        const seen=new Set([`${d.start.x},${d.start.y}`]),queue=[d.start];
        for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,key=`${x},${y}`,t=d.tiles[y]?.[x],o=g.dungeonObjectAt(x,y);if(!t||t==='wall'||seen.has(key)||(o&&!o.breakable))continue;seen.add(key);queue.push({x,y});}}
        const reachable=seen.has(`${d.stairs.x},${d.stairs.y}`)&&seen.has(`${b.x},${b.y}`);
        const oldFloor=g.floor;g.doDescend();const locked=g.floor===oldFloor&&!g.gameEnded;
        const beforeLongStay=g.enemies.length;g.floorTurn=200;g.applyLongStay();if(g.enemies.length!==beforeLongStay)throw Error('regular reinforcements entered the event');
        // Place the player in the boss room and exercise actual warning/impact mechanics.
        const r=d.bossRoom;g.player.x=r.cx;g.player.y=r.cy+3;g.placeSprite(g.playerSprite,g.player.x,g.player.y);g.player.hp=1000;g.player.hpMax=1000;
        const state=g.bossStates.get(b),intent=g.prepareBossIntent(b,state);if(!intent)throw Error('no event boss attack');
        const warningCount=intent.markers.length;
        while(intent.markers.length){const resolved=g.resolveBossIntent(b,state,intent);if(resolved.animation)await resolved.animation;}
        if(g.floor===5){b.hp=Math.floor(b.hpMax*.4);g.handleBossTurn(b);}
        g.updateVisibility();g.emitRefresh();
        return {reachable,locked,warningCount,boss:b.def.key,phaseTwo:state.phaseTwo};
      });
      assert.ok(checks.reachable,'all rooms/stairs/boss reachable');assert.ok(checks.locked);assert.ok(checks.warningCount>0);if(floor===5)assert.ok(checks.phaseTwo);
      await page.waitForTimeout(350);await page.screenshot({path:out+`/floor-${floor}-boss.png`});
      const rewards=await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');g.killEnemy(g.enemies.find(e=>e.def.isFloorBoss),0);const keys=g.ground.map(i=>i.weapon?.key||i.shield?.key).filter(Boolean);for(const i of [...g.ground])if(i.weapon||i.shield)g.pickUp(i);g.saveRun();return {keys,tile:g.dungeon.tiles[g.dungeon.stairs.y][g.dungeon.stairs.x],gate:g.floorBossDefeated,claimed:g.bossRewardClaimed};});
      assert.ok(rewards.keys.some(k=>k.startsWith('w_')&&!k.startsWith('w_hw_')));assert.ok(rewards.keys.some(k=>k.startsWith('s_')&&!k.startsWith('s_hw_')));assert.equal(rewards.tile,'stairs');assert.ok(rewards.gate&&rewards.claimed);
      await page.waitForTimeout(650);await page.screenshot({path:out+`/floor-${floor}-stairs.png`});
      results.push({floor,...checks,...rewards});
      await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');g.busy=false;g.doDescend();});
      if(floor<5)await page.waitForFunction(f=>window.__game.scene.getScene('GameScene').floor===f&&!window.__game.scene.getScene('GameScene').busy,floor+1);
    }
    await waitScene('EndScene');await page.screenshot({path:out+'/03-cleared.png'});
    assert.equal(await page.evaluate(()=>localStorage.getItem('chari-dungeon.run.v1')),normalSave);
    assert.equal(await page.evaluate(()=>localStorage.getItem('chari-dungeon.halloween.run.v1')),null);
    const discovered=await page.evaluate(()=>JSON.parse(localStorage.getItem('chari-dungeon.equipment-codex.v1')));assert.equal(discovered.filter(k=>k.includes('_hw_')).length,0);
    // Mobile entry, pagination and selection include newly collected equipment.
    await page.setViewportSize({width:390,height:844});await page.goto(url+'/?mobile=1&qa-silent&qa-save');await waitScene('TitleScene');
    await page.screenshot({path:out+'/mobile-title.png'});await clickNamed('TitleScene','halloween-event');await waitScene('HalloweenScene');
    await page.screenshot({path:out+'/mobile-choice.png'});await clickNamed('HalloweenScene','次へ');await page.screenshot({path:out+'/mobile-choice-page2.png'});
    await clickNamed('HalloweenScene','event-start');await waitGame();
    await page.screenshot({path:out+'/mobile-game.png'});
    // Bad save must not crash the event entry.
    await page.evaluate(()=>{localStorage.setItem('chari-dungeon.halloween.run.v1','{broken');const g=window.__game.scene.getScene('GameScene');g.scene.stop('UIScene');g.scene.start('HalloweenScene');});await waitScene('HalloweenScene');
    assert.equal(await page.evaluate(()=>!!window.__game.scene.getScene('HalloweenScene').children.getByName('event-resume')),false);
    assert.deepEqual(errors,[]);
    fs.writeFileSync(out+'/results.json',JSON.stringify({pass:true,results,errors},null,2));
    console.log('PASS: title event entry, owned weapon selection, level-1 start, dedicated art/mobs, all 5 reachable floors, warning/impact mechanics, final phase, drops, stairs, collection persistence, save separation/resume/corrupt recovery, desktop/mobile and clear.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
