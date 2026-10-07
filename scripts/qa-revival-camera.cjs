const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
  for(const mobile of [false,true]){
    const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:5176/?qa-game&qa-save'+(mobile?'&mobile=1':''));
    await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);
    const modal=await page.evaluate(()=>{const u=window.__game.scene.getScene('UIScene');u.setOverlay('inv');const shade=u.overlay.list[0];return {x:shade.x,y:shade.y,w:shade.displayWidth,h:shade.displayHeight,alpha:shade.alpha,rootScale:u.overlay.scaleX};});
    await page.waitForTimeout(100);
    assert.deepEqual(await page.evaluate(()=>{const u=window.__game.scene.getScene('UIScene'),s=u.overlay.list[0];return {x:s.x,y:s.y,w:s.displayWidth,h:s.displayHeight,alpha:s.alpha,rootScale:u.overlay.scaleX};}),modal,'dimmer must not animate');
    await page.waitForTimeout(200);
    const state=await page.evaluate(async()=>{const g=window.__game.scene.getScene('GameScene'),u=window.__game.scene.getScene('UIScene');u.setOverlay('none');const {makeItem}=await import('/src/data.ts');g.player.inventory=g.player.inventory.filter(i=>i.kind!=='revive');g.player.inventory.push(makeItem('revive'));g.player.hp=0;const used=g.revivesUsed;g.handlePlayerDown();return {hp:g.player.hp,expected:Math.floor(g.player.hpMax*.6),used:g.revivesUsed-used,paused:g.scene.isPaused(),reviving:g.reviving};});
    assert.equal(state.hp,state.expected);assert.equal(state.used,1);assert.ok(state.reviving);
    await page.waitForTimeout(40);assert.ok(await page.evaluate(()=>window.__game.scene.getScene('GameScene').scene.isPaused()));
    await page.waitForTimeout(700);await page.screenshot({path:`outputs/revival-${mobile?'mobile':'desktop'}-eyes.png`});
    await page.waitForTimeout(1100);await page.screenshot({path:`outputs/revival-${mobile?'mobile':'desktop'}-raise.png`});
    await page.waitForTimeout(1100);
    assert.deepEqual(await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene'),u=window.__game.scene.getScene('UIScene');return {paused:g.scene.isPaused(),reviving:g.reviving,overlay:!!u.children.list.find(c=>c.name==='revival-presentation')};}),{paused:false,reviving:false,overlay:false});
    const camera=await page.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');const alphas=[];for(const dt of [1000/30,1000/60,1000/120]){g.update(g.time.now,dt);alphas.push(g.cameras.main.lerp.x);}return alphas;});
    assert.deepEqual(camera,[1,1,1],'camera should follow the walking tween without delayed damping');
    assert.deepEqual(errors,[]);console.log(JSON.stringify({mobile,revival:state,staticDimmer:true,camera30_60_120:camera,pageErrors:errors.length}));await page.close();
  }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
