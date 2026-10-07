const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [1280,390]){
  const p=await b.newPage({viewport:{width,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://localhost:5176/?qa-game&qa-save');await p.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);
  const result=await p.evaluate(async()=>{
   const {ITEM_CATALOG}=await import('/src/itemCatalog.ts'),{WEAPON_DEFS}=await import('/src/data.ts');
   const g=window.__game.scene.getScene('GameScene'),u=window.__game.scene.getScene('UIScene'),key='w_iron_dagger',entry=ITEM_CATALOG.find(e=>e.key===key);
   g.discoveredEquipment.add(key);g.discoveredEquipment.delete('star_'+key);u.setOverlay('equipmentcatalog');u.selectCatalogItem(entry);
   const labels=()=>u.overlay.list.flatMap(c=>c.list||[c]).filter(c=>typeof c.text==='string').map(c=>c.text);
   if(labels().includes('特殊個体'))throw Error('Unacquired variant tab exposed');
   g.discoveredEquipment.add('star_'+key);u.catalogVariant=null;u.rebuildOverlay();
   if(!labels().includes('通常個体')||!labels().includes('特殊個体')||!labels().includes(entry.name+'★'))throw Error('Acquired variant tabs/default missing');
   if(!u.overlay.getByName('star-catalog-background'))throw Error('Gray variant background missing');
   u.catalogVariant='normal';u.rebuildOverlay();if(labels().includes(entry.name+'★'))throw Error('Normal tab still shows variant');
   u.catalogVariant='star';u.rebuildOverlay();
   return {width:window.innerWidth,variants:WEAPON_DEFS.length,loaded:WEAPON_DEFS.filter(w=>g.textures.exists('star_'+w.key)).length};
  });
  await p.waitForTimeout(350);await p.screenshot({path:`outputs/star-codex-${width}.png`});assert.deepEqual(errors,[]);console.log(result);await p.close();
 }
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
