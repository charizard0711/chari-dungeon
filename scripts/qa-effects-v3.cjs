const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:900}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:5176/?qa-game&qa-save');
    await page.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);
    const initial=await page.evaluate(async()=>{
      const g=window.__game.scene.getScene('GameScene'),u=window.__game.scene.getScene('UIScene');
      const {REFRESHED_EFFECT_KEYS}=await import('/src/effectRefresh.ts');
      for(const key of REFRESHED_EFFECT_KEYS){const texture=g.textures.get(key).getSourceImage();if(texture.width!==512)throw Error('Effect missing '+key);}
      u.setOverlay('shop');
      if(u.overlay.list.some(s=>s.texture?.key==='ui_shop_header'))throw Error('Shop ornament still present');
      return {scale:u.overlay.list[1].scaleX/.22,alpha:u.overlay.list[1].alpha,effects:REFRESHED_EFFECT_KEYS.length};
    });
    assert.equal(initial.scale,.88);assert.equal(initial.alpha,.35);
    await page.waitForTimeout(100);
    const middle=await page.evaluate(()=>window.__game.scene.getScene('UIScene').overlay.list[1].scaleX/.22);
    assert.ok(middle>initial.scale&&middle<=1);
    await page.waitForTimeout(200);
    await page.evaluate(async()=>{
      const g=window.__game.scene.getScene('GameScene'),u=window.__game.scene.getScene('UIScene');
      if(u.overlay.scaleX!==1||u.overlay.x!==0||u.overlay.alpha!==1)throw Error('Modal did not settle');
      u.setOverlay('none');u.setOverlay('gacha');
      if(u.overlay.list.some(s=>s.texture?.key==='ui_gacha_header'))throw Error('Gacha ornament still present');
      u.setOverlay('none');
      if(u.overlay.scaleX!==1||u.overlay.x!==0)throw Error('Close did not reset animation');
      const {REFRESHED_EFFECT_KEYS}=await import('/src/effectRefresh.ts');
      for(const key of REFRESHED_EFFECT_KEYS)g.effectFx(g.player.x,g.player.y,key,1,800);
      const sprites=g.children.list.filter(s=>REFRESHED_EFFECT_KEYS.includes(s.texture?.key));
      if(sprites.some(s=>s.displayWidth>100||s.displayHeight>100))throw Error('Oversized effect');
      const {playPaintedSkill}=await import('/src/skillEffects.ts');
      for(const type of ['dagger','longsword','greatsword','bow','handgun','lance','dual_sword'])playPaintedSkill(g,type,g.player,'right',[{x:g.player.x+1,y:g.player.y}],g.player.weapon.key,0xffffff);
    });
    await page.waitForTimeout(950);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({effects:initial.effects,modalStart:initial.scale,modalMiddle:middle,modalEnd:1,pageErrors:errors.length}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
