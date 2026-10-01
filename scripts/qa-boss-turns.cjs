const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const errors=[];
  try {
    const page=await browser.newPage({viewport:{width:1280,height:800}});
    page.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack)});
    page.on('console',m=>{if(m.type()==='error'&&!m.text().startsWith('Failed to load resource:'))errors.push(m.text());if(m.text().startsWith('BOSS QA:'))console.log(m.text())});
    await page.goto(`${process.env.QA_URL||'http://localhost:5173'}/?qa-game`);
    await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene')?.playerSprite?.active,null,{timeout:60000});
    const report=await page.evaluate(async()=>{
      const gs=window.__game.scene.getScene('GameScene'), report=[];
      gs.tweens.timeScale=8;gs.time.timeScale=8;
      for(let floor=1;floor<=30;floor++)for(const arena of floor%5===0&&floor!==5&&floor!==30?[false,true]:[floor===5||floor===30]) {
        gs.buildFloor(floor,arena);gs.player.hp=gs.player.hpMax=1000000;gs.player.weapon=null;gs.player.shield=null;
        const boss=gs.enemies.find(e=>e.def.isFloorBoss);
        const room=gs.dungeon.bossRoom||{x:1,y:1,w:gs.dungeon.w-2,h:gs.dungeon.h-2};
        if(!boss)throw Error(`Missing boss ${floor}.${arena}`);
        const candidates=[];
        for(let y=room.y;y<room.y+room.h;y++)for(let x=room.x;x<room.x+room.w;x++)if(gs.dungeon.tiles[y]?.[x]==='floor'&&gs.isInsideBossCombatFrame(x,y)&&!gs.enemyAt(x,y)&&!gs.dungeonObjectAt(x,y)&&!gs.chestAt(x,y))candidates.push({x,y});
        candidates.sort((a,b)=>(Math.abs(a.x-boss.x)+Math.abs(a.y-boss.y))-(Math.abs(b.x-boss.x)+Math.abs(b.y-boss.y)));
        const p=candidates[0];if(!p)throw Error(`No playable boss cell ${floor}`);
        gs.player.x=p.x;gs.player.y=p.y;gs.placeSprite(gs.playerSprite,p.x,p.y);gs.setBossEntranceClosed(true,false);gs.updateVisibility();
        const start=gs.turn;
        for(let turn=0;turn<24;turn++) {
          const moves=['up','right','down','left'].map(dir=>{const[dx,dy]=gs.dirVec(dir);return{dir,x:gs.player.x+dx,y:gs.player.y+dy}})
            .filter(p=>gs.dungeon.tiles[p.y]?.[p.x]==='floor'&&gs.isInsideBossCombatFrame(p.x,p.y)&&!gs.dungeonObjectAt(p.x,p.y)&&!gs.chestAt(p.x,p.y));
          if(!moves.length)throw Error(`No move available ${floor}F turn${turn}`);
          // Alternate movement and adjacency, exercising knockback, roots and attacks.
          const move=moves[turn%moves.length];
          const before=gs.turn;
          let timer;
          try{await Promise.race([gs.playerAct(move.dir),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(`Stall ${floor}.${arena} turn${turn}`)),8000)})]);}finally{clearTimeout(timer)}
          if(gs.busy||gs.turn!==before+1)throw Error(`Lost input ${floor}.${arena} turn${turn} busy=${gs.busy}`);
          for(const e of gs.enemies)if(['door','roomDoor','stairs'].includes(gs.dungeon.tiles[e.y]?.[e.x]))throw Error(`Enemy on door/stairs ${floor}: ${e.def.name}`);
        }
        report.push({floor,arena,turns:gs.turn-start});
        console.log(`BOSS QA: ${floor}${arena?'.5':''}F 24 turns OK`);
      }
      return report;
    });
    assert.deepEqual(errors,[]);
    const out=path.resolve(__dirname,'../outputs/qa-entrances-gacha-fountain/boss-turns.json');
    fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({report,errors},null,2));
    console.log(`PASS: ${report.length} boss scenarios / ${report.reduce((sum,r)=>sum+r.turns,0)} real turns`);
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
