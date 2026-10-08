const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:5189/?qa-game&qa-save');
    await page.waitForFunction(() => window.__game?.scene.getScene('GameScene').playerSprite?.active, null, { timeout: 60000 });
    const results = await page.evaluate(async () => {
      const g = window.__game.scene.getScene('GameScene');
      const { NORMAL_MONSTER_DEFS } = await import('/src/data.ts');
      const { difficultyEnemy } = await import('/src/difficulty.ts');
      const { makeShield } = await import('/src/player.ts');
      const { makePlayerArmor } = await import('/src/playerAppearance.ts');
      const check = (ok, label) => { if (!ok) throw Error(label); };
      g.floor = 10; g.turn = 20; g.difficulty = 'normal'; g.eventMode = null;
      g.player.level = 6; g.player.weapon = null; g.player.baseDef = 3;
      g.player.transformationDefBonus = 0; g.player.fountainBlessingFloor = null;
      g.player.armor = { ...makePlayerArmor('plate'), plus: 2, trait: undefined };
      g.player.shield = { ...makeShield('s_thorn_guard'), plus: 2, dur: 10000, durMax: 10000, passive: undefined };
      const raw = NORMAL_MONSTER_DEFS.find(d => d.key === 'm_snake');
      const e = g.addEnemy(raw, g.player.x + 3, g.player.y, 1.4);
      const saved = JSON.stringify(e.def);
      let info; const listener = value => info = value; g.events.on('enemyinfo', listener);
      g.showEnemyInfo(e);
      check(info.atk === `${raw.atkMin+7}-${raw.atkMax+7}`, 'enemy panel must show corrected attack');
      const beforeRandom = Math.random; Math.random = () => .5;
      let result;
      try { result = g.computeIncomingAttack(e); } finally { Math.random = beforeRandom; }
      check(result.damage > 1, 'ordinary equipped player must take more than one damage: ' + JSON.stringify(result));
      check(result.steps.some(s => s.includes('階層補正')), 'damage journal must explain depth bonus');
      check(JSON.stringify(e.def) === saved, 'runtime stats must not mutate');
      const beforeHp = g.player.hp;
      g.damagePlayer(result.damage, 'バランスQA', e, result.steps);
      check(g.player.hp === beforeHp-result.damage, 'actual hit must apply calculated damage');
      e.skillAttackDownUntil = g.turn;
      check(g.enemyAttackDefinition(e).atkMax === Math.floor((raw.atkMax+7)*.8), 'lance debuff');
      e.skillAttackDownUntil = -1;
      const values = [];
      for (const mode of ['normal','hard','master']) {
        g.difficulty = mode; e.def = difficultyEnemy(raw, mode);
        values.push(g.enemyAttackDefinition(e).atkMax);
        if (mode !== 'normal') {
          check(g.enemyAttackDefinition(e).atkMax === e.def.atkMax, mode + ' original attack');
          check(!g.computeIncomingAttack(e).steps.some(s => s.includes('階層補正')), mode + ' no bonus in journal');
          g.showEnemyInfo(e);
          check(info.atk === `${e.def.atkMin}-${e.def.atkMax}`, mode + ' original panel');
        }
      }
      g.difficulty = 'normal'; e.def = JSON.parse(saved); g.eventMode = 'halloween';
      check(g.enemyAttackDefinition(e).atkMax === raw.atkMax, 'event exclusion');
      g.eventMode = null; e.def.isBoss = true;
      check(g.enemyAttackDefinition(e).atkMax === raw.atkMax, 'boss exclusion');
      g.events.off('enemyinfo', listener);
      return { defense: g.player.def, panelAttack: info.atk, actualDamage: result.damage, difficultyAttackMax: values };
    });
    assert.deepEqual(errors, []);
    console.log('PASS actual Phaser scene: panel, damage calculation/journal, HP loss, debuff, restored stats, unchanged hard/master, boss/event exclusions', results);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
