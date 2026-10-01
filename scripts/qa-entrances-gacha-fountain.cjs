const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

// Run against npm run dev. Set NODE_PATH to a Playwright installation if needed.
const base = process.env.QA_URL || 'http://localhost:5173';
const output = path.resolve(__dirname, '../outputs/qa-entrances-gacha-fountain');
fs.mkdirSync(output, { recursive: true });
const failures = [];
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', error => { failures.push(error.message); console.log('BROWSER ERROR:', error.stack); });
    page.on('console', msg => { if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource:')) failures.push(msg.text()); if(msg.text().startsWith('QA:')) console.log(msg.text()); });
    page.on('response', res => {if(res.status()>=400) failures.push(`${res.status()} ${res.request().method()} ${res.url()}`);});
    await page.goto(`${base}/?qa-game&qa-gacha`);
    await page.waitForFunction(() => window.__game?.scene.getScene('GameScene')?.playerSprite?.active, null, { timeout: 60000 });
    const report = await page.evaluate(async () => {
      const gs = window.__game.scene.getScene('GameScene');
      const ui = window.__game.scene.getScene('UIScene');
      const { TILE } = await import('/src/textures.ts');
      const { makeShield, makeWeapon } = await import('/src/player.ts');
      const { MONSTER_DEFS } = await import('/src/data.ts');
      const check = (condition, message) => { if (!condition) throw Error(message); };
      const checks = [];
      checks.push = (...messages) => { console.log('QA:', ...messages); return Array.prototype.push.apply(checks,messages); };
      const within = (promise, label) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(Error(`stalled: ${label}`)), 5000))]);
      const position = (p) => { gs.player.x = p.x; gs.player.y = p.y; gs.placeSprite(gs.playerSprite, p.x, p.y); };

      // Real inventory/receipt code, category guarantees and failed purchase safety.
      gs.player.gold = 50000;
      for (let i = 0; i < 30; i++) {
        gs.player.weapons = []; gs.weaponWonThisFloor = false;
        check(gs.gachaPull('weapon')?.category === '武器', 'weapon pool leaked another category');
        const gold = gs.player.gold;
        check(gs.gachaPull('weapon') === null && gs.player.gold === gold, 'sold-out weapon charged gold');
        gs.player.shields = []; gs.player.armors = [];
        check(['盾', '服'].includes(gs.gachaPull('armor')?.category), 'defense pool leaked weapon');
      }
      check(gs.player.gold === 20000, 'successful gacha charge mismatch');
      gs.player.gold = 499;
      check(gs.gachaPull('armor') === null && gs.player.gold === 499, 'insufficient funds mutated gold');
      gs.player.gold = 1500; gs.weaponWonThisFloor = false;
      gs.player.weapon = makeWeapon('w_iron_dagger', []); gs.player.weapons = [gs.player.weapon];
      gs.player.shield = null; gs.player.shields = [];
      checks.push('60 draws: category, price, sold-out and insufficient funds');

      // A used fountain heals/cures and grants exactly one floor-scoped multiplier.
      gs.buildFloor(1, false);
      const fountain = gs.dungeonObjects.find(o => o.kind === 'fountain');
      check(fountain, 'missing fountain');
      gs.player.hp = 20; gs.player.poisonTurns = 3;
      const atk = gs.player.atkMax, def = gs.player.def;
      gs.useHealingObject(fountain);
      check(gs.player.hp === gs.player.hpMax && gs.player.poisonTurns === 0, 'fountain recovery failed');
      check(gs.player.atkMax === Math.floor(atk * 1.1) && gs.player.def === Math.floor(def * 1.1), 'blessing not in combat stats');
      check(ui.fountainBadge.visible, 'buff icon missing');
      const boosted = gs.player.atkMax;
      gs.useHealingObject(fountain);
      check(gs.player.atkMax === boosted, 'used fountain stacked buff');
      // The center of a multi-cell fountain is a clickable interaction destination.
      const fy = fountain.y - Math.floor((fountain.h - 1) / 2) - 1;
      position({ x: fountain.x, y: fy }); gs.torchTurns = 999; gs.updateVisibility();
      check(gs.findClickPath(fountain.x, fountain.y).length > 0, 'fountain center cannot be clicked');
      gs.enemies = gs.enemies.filter(e => !e.def.isFloorBoss);
      gs.unlockFloorGate('QA');
      check(gs.player.fountainBlessingFloor === null && !ui.fountainBadge.visible, 'blessing persisted after normal floor boss');
      gs.buildFloor(10, false); gs.player.fountainBlessingFloor = 10;
      gs.enemies = gs.enemies.filter(e => !e.def.isFloorBoss); gs.unlockFloorGate('QA');
      check(gs.player.fountainBlessingFloor === 10, 'midboss incorrectly ended milestone blessing');
      gs.buildFloor(10, true);
      check(gs.player.fountainBlessingFloor === 10, 'blessing lost entering strong boss arena');
      gs.enemies = gs.enemies.filter(e => !e.def.isFloorBoss); gs.unlockFloorGate('QA');
      check(gs.player.fountainBlessingFloor === null, 'strong boss did not end blessing');
      gs.player.fountainBlessingFloor = 10; gs.buildFloor(11, false);
      check(gs.player.fountainBlessingFloor === null, 'blessing leaked to next floor');
      checks.push('fountain recovery, stats, icon, click center, no stacking, normal/milestone/next-floor lifetime');

      // All enemy sizes and wall-pass behavior must respect sealed exits and entrances.
      for (const floor of [1, 5, 10, 15, 20, 25, 30]) {
        gs.buildFloor(floor, floor % 5 === 0);
        const st = gs.dungeon.stairs;
        for (const wallPass of [false, true]) {
          const enemy = gs.enemies[0];
          const original = enemy.def; enemy.def = { ...original, wallPass };
          check(!gs.passableBodyCell(enemy, st.x, st.y), `enemy walks on locked exit ${floor}`);
          gs.dungeon.tiles[st.y][st.x] = 'stairs';
          check(!gs.passableBodyCell(enemy, st.x, st.y), `enemy walks on stairs ${floor}`);
          gs.dungeon.tiles[st.y][st.x] = 'door'; enemy.def = original;
        }
      }
      checks.push('seven floors: small/large/wall-pass enemies cannot occupy doors or stairs');

      // Real Phaser interruption paths previously left their Promises pending.
      gs.buildFloor(1, false);
      let action = gs.tween(gs.playerSprite, { x: gs.playerSprite.x + TILE }, 200);
      gs.time.delayedCall(20, () => gs.playPlayerHurt());
      await within(action, 'hurt cancels move');
      const dummy = gs.add.image(0, 0, 'coin');
      action = gs.tween(dummy, { x: 40 }, 200); dummy.destroy();
      await within(action, 'destroyed actor');
      const reflected = gs.addEnemy({ ...MONSTER_DEFS[0], key: 'qa_reflect', hp: 1, gold: 0, exp: 0, score: 0 }, gs.player.x + 1, gs.player.y, 1);
      reflected.directionArt = { textureKey: reflected.sprite.texture.key, originY: .6 };
      const updateDirection = gs.updateEnemyDirection; gs.updateEnemyDirection = () => {};
      await within(gs.playDirectionalEnemyAttack(reflected, () => { reflected.hp = 0; gs.killEnemy(reflected, 0); }, true, false), 'reflection kills attacker during recovery');
      gs.updateEnemyDirection = updateDirection;
      checks.push('Phaser move interruption, destroyed actor and reflected kill resolve');

      // Status expiry must work without any enemyAct calls (boss skills, frozen or dead enemies).
      gs.buildFloor(1, false);
      for (const e of gs.enemies) { e.sprite.destroy(); e.hpBar?.destroy(); e.shadow?.destroy(); }
      gs.enemies = [];
      gs.playerRootTurns = 2; gs.itemSealTurns = 2;
      await within(gs.finishTurn(), 'root expiry turn one');
      check(gs.playerRootTurns === 1 && gs.itemSealTurns === 1, 'status duration depends on enemy count');
      await within(gs.finishTurn(), 'root expiry turn two');
      check(gs.playerRootTurns === 0 && gs.itemSealTurns === 0, 'status never expires');
      const moves = ['up', 'down', 'left', 'right'];
      const dir = moves.find(d => { const [dx,dy] = gs.dirVec(d); return gs.dungeon.tiles[gs.player.y+dy]?.[gs.player.x+dx] === 'floor' && !gs.dungeonObjectAt(gs.player.x+dx,gs.player.y+dy); });
      check(dir, 'no test move');
      const before = gs.turn;
      action = gs.playerAct(dir); gs.time.delayedCall(20, () => gs.playPlayerHurt());
      await within(action, 'full player action interrupted');
      check(!gs.busy && gs.turn === before+1, 'interrupted player action stayed busy');
      checks.push('root/item-seal expire with zero enemies; interrupted player action unlocks');

      // Separate boss entry stairs and battle exit seals, and actual transition ownership.
      gs.buildFloor(5, false);
      let st = gs.dungeon.stairs;
      check(gs.tileSprites[st.y][st.x].texture.key === 'terrain_boss_descent', 'boss entry still has chains');
      const neighbor = [{x:st.x,y:st.y+1,dir:'up'},{x:st.x-1,y:st.y,dir:'right'},{x:st.x,y:st.y-1,dir:'down'},{x:st.x+1,y:st.y,dir:'left'}]
        .find(p => gs.dungeon.tiles[p.y]?.[p.x] === 'floor' && !gs.dungeonObjectAt(p.x,p.y) && !gs.enemyAt(p.x,p.y));
      check(neighbor, 'no boss staircase approach'); position(neighbor);
      check(gs.canMoveInto(neighbor.dir), 'holding movement cannot enter boss staircase');
      gs.player.fountainBlessingFloor = 5;
      console.log('QA: transition entry action');
      await within(gs.playerAct(neighbor.dir), 'boss entry action');
      console.log('QA: transition entry fade');
      await new Promise(resolve => setTimeout(resolve, 1000));
      check(gs.inBossRoom && !gs.busy && gs.player.fountainBlessingFloor === 5,
        `boss entry transition failed: ${JSON.stringify({boss:gs.inBossRoom,busy:gs.busy,blessing:gs.player.fountainBlessingFloor,ended:gs.gameEnded,fade:gs.cameras.main.fadeEffect.isRunning})}`);
      st = gs.dungeon.stairs;
      check(gs.tileSprites[st.y][st.x].texture.key === 'terrain_boss_chain_gate', 'battle exit seal changed');
      gs.player.hp = gs.player.hpMax = 99999;
      for (const e of [...gs.enemies]) if (e.def.isFloorBoss) gs.killEnemy(e, 0);
      await new Promise(resolve => setTimeout(resolve, 1000));
      check(gs.dungeon.tiles[st.y][st.x] === 'stairs' && gs.tileSprites[st.y][st.x].texture.key === 'terrain_stairs', 'victory exit not restored');
      position(st); gs.tryDescend();
      await new Promise(resolve => setTimeout(resolve, 1000));
      check(gs.floor === 6 && !gs.inBossRoom && !gs.busy, 'next floor transition stuck');
      checks.push('5F boss stair entry, battle exit seal, victory exit and 6F descent');
      return checks;
    });
    console.log(report.map(s => `PASS: ${s}`).join('\n'));

    // Visual and movement smoke checks across all 30 floors and four entry orientations.
    for (const dir of ['north', 'east', 'south', 'west']) {
      await page.evaluate(dir => {
        const gs = window.__game.scene.getScene('GameScene');
        const ui = window.__game.scene.getScene('UIScene'); ui.setOverlay('none');
        gs.qaBossRoomZone = dir; gs.buildFloor(1, false);
        const entrance = gs.dungeon.bossEntrance, entry = gs.dungeon.bossEntry;
        gs.player.x = entrance.x - (entry.x-entrance.x); gs.player.y = entrance.y - (entry.y-entrance.y);
        gs.placeSprite(gs.playerSprite,gs.player.x,gs.player.y); gs.torchTurns = 999;
        gs.updateVisibility(); gs.cameras.main.stopFollow(); gs.cameras.main.centerOn(entrance.x*32+16,entrance.y*32+16);
      }, dir);
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(output, `entry-${dir}.png`) });
    }
    const allFloors = await page.evaluate(async () => {
      const gs=window.__game.scene.getScene('GameScene'); const results=[];
      for(let floor=1;floor<=30;floor++) {
        gs.qaBossRoomZone=undefined; gs.buildFloor(floor,false);
        gs.player.hp=gs.player.hpMax=999999;
        for(const e of gs.enemies) e.freezeTurns=50;
        gs.playerRootTurns=0; gs.itemSealTurns=0;
        const dirs=['up','down','left','right'];
        const dir=dirs.find(d=>{const [dx,dy]=gs.dirVec(d),x=gs.player.x+dx,y=gs.player.y+dy;return gs.dungeon.tiles[y]?.[x]==='floor'&&!gs.dungeonObjectAt(x,y)&&!gs.enemyAt(x,y)&&!gs.chestAt(x,y)});
        if(!dir)throw Error(`no clear start on ${floor}F`);
        const start=gs.turn; await gs.playerAct(dir);
        if(gs.busy||gs.turn!==start+1)throw Error(`movement stuck ${floor}F`);
        if(floor%5===0&&gs.tileSprites[gs.dungeon.stairs.y][gs.dungeon.stairs.x].texture.key!=='terrain_boss_descent')throw Error(`wrong milestone stair ${floor}`);
        results.push(floor);
      }
      return results;
    });
    assert.equal(allFloors.length,30);
    console.log('PASS: 30 floors generated and one real movement turn on each');
    await page.evaluate(() => {
      const gs=window.__game.scene.getScene('GameScene'),ui=window.__game.scene.getScene('UIScene');
      gs.buildFloor(5,false); gs.player.hp=gs.player.hpMax=100;gs.player.gold=1500;gs.player.fountainBlessingFloor=5;
      gs.torchTurns=999;const p=gs.dungeon.stairs;gs.player.x=p.x;gs.player.y=p.y+1;gs.placeSprite(gs.playerSprite,gs.player.x,gs.player.y);gs.updateVisibility();gs.cameras.main.centerOn(p.x*32+16,p.y*32+16);gs.emitRefresh();
      ui.gachaPool='weapon'; ui.setOverlay('gacha');
    });
    await page.screenshot({ path:path.join(output,'gacha-weapon.png') });
    // Actual pointer event switches the visible pool.
    const tab=await page.evaluate(()=>{const {x,y,w}=window.__game.scene.getScene('UIScene').L.ov;return{x:x+w*.75,y:y+68}});
    await page.mouse.click(tab.x,tab.y + 20); // canvas centered vertically in an 800px viewport
    // Assert the selection via the scene, independently of screenshot appearance.
    assert.equal(await page.evaluate(()=>window.__game.scene.getScene('UIScene').gachaPool),'armor');
    await page.screenshot({ path:path.join(output,'gacha-armor.png') });
    await page.evaluate(()=>window.__game.scene.getScene('UIScene').setOverlay('none'));
    await page.waitForTimeout(350);
    await page.screenshot({ path:path.join(output,'boss-stair-and-buff.png') });

    const mobile=await browser.newPage({viewport:{width:390,height:844}});
    mobile.on('pageerror',e=>failures.push(e.message));
    await mobile.goto(`${base}/?mobile=1&qa-game&qa-gacha&qa-overlay=gacha`);
    await mobile.waitForFunction(()=>window.__game?.scene.getScene('UIScene')?.overlayMode==='gacha',null,{timeout:60000});
    await mobile.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');g.player.fountainBlessingFloor=g.floor;g.emitRefresh()});
    await mobile.screenshot({path:path.join(output,'mobile-gacha.png')});
    await mobile.evaluate(()=>window.__game.scene.getScene('UIScene').setOverlay('none'));
    await mobile.screenshot({path:path.join(output,'mobile-buff.png')});
    assert.deepEqual(failures,[], 'browser errors');
    fs.writeFileSync(path.join(output,'results.json'), JSON.stringify({passed:report,allFloors,browserErrors:failures},null,2));
    console.log(`PASS: desktop/mobile UI, pool switching and screenshots. ${output}`);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
