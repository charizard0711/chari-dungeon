const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  const url = process.env.QA_URL || 'http://localhost:5174';
  const open = async (query = '', mobile = false) => {
    const page = await context.newPage();
    if(mobile) await page.setViewportSize({width:390,height:844});
    page.on('pageerror', e => errors.push(e.stack));
    await page.goto(url + '/' + query);
    return page;
  };
  const waitGame = p => p.waitForFunction(() => window.__game?.scene.isActive('GameScene') && window.__game.scene.getScene('GameScene').playerSprite?.active, null, { timeout: 60000 });
  const semantic = async p => p.evaluate(() => {
    const s = window.__game.scene.getScene('GameScene').captureRun();
    delete s.logs;
    for (const e of s.enemies) delete e.visual;
    return JSON.parse(JSON.stringify(s));
  });
  try {
    let page = await open('?qa-game&qa-save');
    await waitGame(page);
    await page.evaluate(async () => {
      const gs = window.__game.scene.getScene('GameScene');
      await gs.playerAct('down');
      gs.player.hp = 61; gs.player.gold = 1234; gs.player.poisonTurns = 3;
      gs.player.weapon.plus = 4; gs.player.weapon.dur = 42;
      gs.player.shield = null; gs.pendingEquipment = { kind: 'weapon', item: { ...gs.player.weapon, plus: 7 }, source: 'QA' };
      const barrel = gs.dungeonObjects.find(o => o.kind === 'barrel');
      if (barrel) gs.breakRoomProp(barrel);
      const chest = gs.chests[0]; if (chest) gs.openChest(chest);
      const boss = gs.enemies.find(e => e.def.isFloorBoss);
      if (boss) {
        boss.hp -= 5; boss.poisonTurns = 2; gs.setBossEntranceClosed(true, false);
        const state = gs.bossStates.get(boss);
        if (state) {
          state.cooldown = 1; state.phase = 3;
          state.intent = { kind: state.kind, tiles: [{x:boss.x,y:boss.y}], secondary:[], tertiary:[], triggered:false,
            markers: gs.bossWarningMarkers([{x:boss.x,y:boss.y}], 0xffa755, gs.player, 'primary') };
        }
      }
      gs.weaponWonThisFloor = true; gs.shopPurchases.potion = 2;
      gs.enhancementScrollDrops.stone = true; gs.discovered.add('m_mush');
      gs.torchTurns = 7; gs.invisTurns = 3; gs.updateVisibility(); gs.saveRun();
    });
    const before = await semantic(page);
    const stored = await page.evaluate(() => localStorage.getItem('chari-dungeon.run.v1'));
    assert.ok(stored && stored.length < 500000, 'save must fit comfortably in browser storage');
    await page.close();
    page = await open('',true);
    await page.waitForFunction(() => window.__game?.scene.isActive('TitleScene'), null, { timeout: 60000 });
    assert.ok(await page.evaluate(() => window.__game.scene.getScene('TitleScene').children.list.some(c => c.text === '続きから' || c.list?.some(t => t.text === '続きから'))));
    fs.mkdirSync('outputs/qa-run-save', { recursive:true });
    await page.screenshot({path:'outputs/qa-run-save/mobile-continue.png'});
    await page.keyboard.press('Enter');
    await waitGame(page);
    assert.deepEqual(await semantic(page), before, 'closing and reopening restores the complete gameplay snapshot');
    assert.equal(await page.evaluate(() => { const p=window.__game.scene.getScene('GameScene').player; return p.weapon === p.weapons[0] && typeof p.addExp === 'function'; }), true);
    await page.evaluate(async()=>{
      const g=window.__game.scene.getScene('GameScene');
      const snapshot=JSON.parse(JSON.stringify(g.captureRun()));
      g.busy=true;
      await g.finishTurn();
      g.busy=false;
      if(g.turn!==snapshot.state.turn+1)throw Error('Resumed game cannot advance a turn');
      g.buildFloor(snapshot.state.floor,snapshot.state.inBossRoom,snapshot);
      g.saveRun();
    });
    await page.evaluate(() => { const g=window.__game.scene.getScene('GameScene'); g.player.weapon.dur--; g.emitRefresh(); });
    await page.reload();
    await page.waitForFunction(() => window.__game?.scene.isActive('TitleScene'), null, { timeout: 60000 });
    await page.keyboard.press('Enter'); await waitGame(page);
    assert.equal(await page.evaluate(() => window.__game.scene.getScene('GameScene').player.weapon.dur), 41);
    // Resume a milestone boss arena too: no new enemies/rewards may be generated.
    await page.evaluate(() => {
      const g=window.__game.scene.getScene('GameScene'); g.buildFloor(15,true);
      g.player.hp=55; g.player.hpMax=190; g.bossEntranceClosed=true;
      const boss=g.enemies.find(e=>e.def.isFloorBoss); boss.hp=23;
      g.bossRewardClaimed=true; g.saveRun();
    });
    const arena = await semantic(page);
    await page.close(); page=await open();
    await page.waitForFunction(() => window.__game?.scene.isActive('TitleScene'), null, {timeout:60000});
    await page.keyboard.press('Enter'); await waitGame(page);
    assert.deepEqual(await semantic(page), arena, 'milestone boss arena also survives reopening');
    const mapCases=await page.evaluate(()=>{
      const g=window.__game.scene.getScene('GameScene');
      const normalize=s=>{delete s.logs;for(const e of s.enemies)delete e.visual;return JSON.stringify(s)};
      const cases=[];
      for(const floor of [1,5,10,15,20,25,26,27,28,29,30]) {
        for(const arena of floor===5||floor===30?[true]:floor%5===0?[false,true]:[false]) {
          g.buildFloor(floor,arena);
          g.player.hp=57;g.player.hpMax=140;
          g.startTransformation('slime');
          const boss=g.enemies.find(e=>e.def.isFloorBoss);
          if(boss) {
            g.freezeEnemy(boss,2);
            g.addBossHazards([{x:boss.x,y:boss.y}], 'fire',3);
          }
          const s=JSON.parse(JSON.stringify(g.captureRun()));
          const before=normalize(JSON.parse(JSON.stringify(s)));
          g.buildFloor(floor,arena,s);
          const after=normalize(JSON.parse(JSON.stringify(g.captureRun())));
          if(before!==after)throw Error('Snapshot mismatch at '+floor+'.'+arena);
          cases.push({floor,arena});
        }
      }
      return cases;
    });
    // Storage disabled/full must not prevent play and must show a visible message.
    await page.evaluate(() => {
      const g=window.__game.scene.getScene('GameScene');
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=()=>{throw new DOMException('Full','QuotaExceededError')};
      try { g.saveRun(); } finally { Storage.prototype.setItem=original; }
      if (!g.logHistory.some(l=>l.msg.includes('保存できません'))) throw Error('Missing storage warning');
      g.gameOver(false);
      if(localStorage.getItem('chari-dungeon.run.v1')!==null) throw Error('Death must clear the run');
    });
    await page.close();
    page = await open();
    await page.waitForFunction(() => window.__game?.scene.isActive('TitleScene'), null, {timeout:60000});
    assert.equal(await page.evaluate(() => window.__game.scene.getScene('TitleScene').children.list.some(c=>c.text==='続きから'||c.list?.some(t=>t.text==='続きから'))),false);
    assert.deepEqual(errors, []);
    fs.mkdirSync('outputs/qa-run-save', { recursive:true });
    fs.writeFileSync('outputs/qa-run-save/report.json', JSON.stringify({saveBytes:stored.length, closeReopen:true, exactSnapshot:true, equippedIdentity:true, arena:true, mapCases, mobile:true, storageFailure:true, deathClearsSave:true, errors},null,2));
    console.log('PASS: exact save/resume after page close, equipment identity, changed durability, boss intent, milestone arena, storage errors, death clears save.');
  } finally { await context.close(); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
