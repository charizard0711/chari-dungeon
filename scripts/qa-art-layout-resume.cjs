const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_URL||'http://localhost:5176';
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
  const p=await b.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const wait=()=>p.waitForFunction(()=>window.__game?.scene.getScene('GameScene').playerSprite?.active);
  await p.goto(base+'/?qa-game&qa-save',{timeout:90000});await wait();
  await p.evaluate(async()=>{
    const g=window.__game.scene.getScene('GameScene'),{REFRESHED_MONSTER_KEYS}=await import('/src/artRefresh.ts'),{MONSTER_DEFS}=await import('/src/data.ts'),{writeRunSave}=await import('/src/runSave.ts');
    const tiles=[];for(let y=1;y<g.dungeon.h-1;y++)for(let x=1;x<g.dungeon.w-1;x++)if(g.dungeon.tiles[y][x]==='floor')tiles.push({x,y});
    const enemies=REFRESHED_MONSTER_KEYS.map((key,i)=>g.addEnemy(MONSTER_DEFS.find(m=>m.key===key),tiles[i].x,tiles[i].y,1));
    const fragment=g.addEnemy(MONSTER_DEFS.find(m=>m.key==='m_jelly'),tiles[13].x,tiles[13].y,1);fragment.cloneDepth=1;enemies.push(fragment);
    const s=g.captureRun();s.enemies=s.enemies.filter(e=>enemies.some(n=>n.x===e.state.x&&n.y===e.state.y&&n.def.key===e.state.def.key));s.bosses=[];
    for(const e of s.enemies){const oldSize=e.state.def.key==='m_watcher'?48:e.state.def.key==='m_guard'||e.state.def.key==='m_wisp'?36:32;const world=e.state.def.isBoss?40:e.state.def.isElite?34:26;e.state.baseScale=world/oldSize*(e.state.cloneDepth? .72:1);e.visual.scaleX=e.visual.scaleY=e.state.baseScale;delete e.visual.sourceWidth;delete e.visual.sourceHeight;}
    if(s.enemies.length!==13)throw Error('Legacy fixture count '+s.enemies.length);writeRunSave(s);g.runSaveEnabled=()=>false;
  });
  await p.goto(base+'/?qa-game&qa-save&qa-resume',{timeout:90000});await wait();
  const check=()=>p.evaluate(()=>{const g=window.__game.scene.getScene('GameScene');for(const e of g.enemies){const size=Math.max(e.sprite.displayWidth,e.sprite.displayHeight);if(size>45)throw Error('Oversized restored monster '+e.def.key+': '+size);if(e.cloneDepth&&size>20)throw Error('Oversized fragment '+size);}const s=g.captureRun();if(s.enemies.some(e=>!e.visual.sourceWidth||!e.visual.sourceHeight))throw Error('Missing saved image dimensions');return {count:g.enemies.length,maximum:Math.max(...g.enemies.map(e=>e.sprite.displayWidth)),base:g.enemies.map(e=>e.baseScale)};});
  const first=await check();await p.evaluate(()=>window.__game.scene.getScene('GameScene').saveRun());await p.reload();await wait();const second=await check();if(first.base.some((scale,i)=>Math.abs(scale-second.base[i])>1e-8))throw Error('Scale changed on second resume');
  const u='UIScene';await p.evaluate(async()=>{const u=window.__game.scene.getScene('UIScene'),{ITEM_CATALOG}=await import('/src/itemCatalog.ts');u.setOverlay('equipmentcatalog');u.catalogDetail=ITEM_CATALOG.find(e=>e.key==='w_hero_sword');u.rebuildOverlay();});await p.waitForTimeout(150);await p.screenshot({path:'outputs/art-fixed-hero-aura.png'});
  for(const mode of ['shop','gacha']){await p.evaluate(mode=>window.__game.scene.getScene('UIScene').setOverlay(mode),mode);await p.waitForTimeout(100);await p.screenshot({path:'outputs/art-fixed-'+mode+'.png'});const bounds=await p.evaluate(()=>{const u=window.__game.scene.getScene('UIScene'),f=u.overlay.list.find(s=>s.name==='painted-modal-frame'),h=u.overlay.list.find(s=>s.name==='painted-modal-header');const b=f.getBounds();if(b.x<0||b.y<0||b.right>1280||b.bottom>760)throw Error('Frame overflow');if(h&&Math.abs(h.scaleX-h.scaleY)>1e-9)throw Error('Distorted header');return{width:b.width,height:b.height};});console.log({mode,...bounds});}
  await p.goto(base+'/?qa-silent',{timeout:90000});await p.waitForFunction(()=>window.__game?.scene.isActive('TitleScene')&&typeof window.__game.scene.getScene('TitleScene').titleAction==='function');
  await p.evaluate(()=>{const t=window.__game.scene.getScene('TitleScene');t.titleAction();const children=t.children.list.flatMap(s=>s.list??[s]);if(children.some(s=>s.type==='Rectangle'&&s.width===3&&s.height===32))throw Error('Unwanted menu bar remains');});await p.waitForTimeout(100);await p.screenshot({path:'outputs/art-fixed-title-menu.png'});
  if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({legacyResume:first.count,doubleResume:second.count,maximumMonsterSize:second.maximum,pageErrors:0}));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
