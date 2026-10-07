const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.QA_URL || 'http://localhost:5176';
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    for (const mobile of [false,true]) {
      const page = await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900}});
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'/?qa-game&qa-save'+(mobile?'&mobile=1':''),{waitUntil:'domcontentloaded',timeout:90000});
      await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);
      const result=await page.evaluate(async () => {
        const game=window.__game, g=game.scene.getScene('GameScene'), u=game.scene.getScene('UIScene');
        const art=await import('/src/artRefresh.ts'), {makeWeapon}=await import('/src/player.ts'), {WEAPON_DEFS}=await import('/src/data.ts'), {playerSheetKey,playerFrameIndex}=await import('/src/playerAppearance.ts');
        for (const key of Object.keys(art.ART_REFRESH)) {
          const t=u.textures.get(key).getSourceImage();
          if (!u.textures.exists(key)||t.width<128) throw Error('Missing illustrated texture '+key);
        }
        for (const {key} of WEAPON_DEFS) {
          const w=makeWeapon(key,[]);
          for(const gender of ['male','female'])for(const dir of ['up','right','down','left'])for(const frame of ['idle','atkWindup','atk']) {
            g.playerSprite.setTexture(playerSheetKey(gender,'leather'),playerFrameIndex(dir,frame));
            g.equipmentRenderer.update(g.playerSprite,w,null,dir,frame,gender,85);
            const s=g.equipmentRenderer.weapon;
            if(!s.visible||s.texture.key.startsWith('icon_')||![s.x,s.y,s.rotation].every(Number.isFinite)) throw Error('Held weapon transform '+key+dir+frame);
          }
        }
        return {textures:Object.keys(art.ART_REFRESH).length,heldPoses:WEAPON_DEFS.length*24};
      });
      for(const mode of ['equip','inv','codex','settings','shop','gacha','pick','itemcatalog','equipmentcatalog','repair','quests']) {
        await page.evaluate(mode=>window.__game.scene.getScene('UIScene').setOverlay(mode),mode);
        await page.waitForTimeout(80);
        const point=await page.evaluate(()=>{
          const u=window.__game.scene.getScene('UIScene'), children=u.overlay.list;
          if(!children.some(s=>s.name==='painted-modal-frame'))throw Error('Undrawn modal '+u.overlayMode);
          const close=children.find(s=>s.name==='painted-modal-close');
          if(!close?.input?.enabled)throw Error('Close button missing '+u.overlayMode);
          const canvas=window.__game.canvas.getBoundingClientRect();
          return {x:canvas.left+close.x*canvas.width/window.__game.scale.gameSize.width,y:canvas.top+close.y*canvas.height/window.__game.scale.gameSize.height};
        });
        await page.mouse.click(point.x,point.y);
        if(await page.evaluate(()=>window.__game.scene.getScene('UIScene').overlayMode)!=='none')throw Error('Close action failed '+mode);
      }
      await page.evaluate(()=>window.__game.scene.getScene('UIScene').setOverlay('details'));
      await page.evaluate(()=>{const u=window.__game.scene.getScene('UIScene'),close=u.damageJournal.list.find(s=>s.name==='journal-close');if(!close?.input?.enabled)throw Error('Journal close missing');close.emit('pointerdown');if(u.overlayMode!=='none')throw Error('Journal close failed');});
      for(const mode of ['settings','shop','gacha','codex','pick']) {
        await page.evaluate(mode=>window.__game.scene.getScene('UIScene').setOverlay(mode),mode);
        await page.waitForTimeout(120);
        await page.screenshot({path:`outputs/art-refresh-${mobile?'mobile':'desktop'}-${mode}.png`});
      }
      if(errors.length)throw Error(errors.join('\n'));
      console.log(JSON.stringify({mobile,...result,modalCloseChecks:11,pageErrors:errors.length}));
      await page.close();
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
