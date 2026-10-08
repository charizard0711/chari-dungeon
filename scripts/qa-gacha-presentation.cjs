const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});const out='outputs/gacha-v2-20261009';fs.mkdirSync(out,{recursive:true});try{
 for(const width of [1280,390]){
  const p=await b.newPage({viewport:{width,height:width===390?844:760}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://localhost:5190/?qa-game&qa-save');
  await p.waitForFunction(()=>window.__game?.scene.getScene('UIScene').gs&&!window.__game.scene.getScene('GameScene').assetsLoading);
  const pull=await p.evaluate(()=>{
   const g=window.__game.scene.getScene('GameScene'),u=window.__game.scene.getScene('UIScene');g.player.gold=499;u.refresh();
   if(g.gachaPull('armor')!==null)throw Error('insufficient gold');
   g.player.gold=654;u.refresh();u.setOverlay('gacha');const result=g.gachaPull('armor');
   if(!result||g.player.gold!==154)throw Error('real pull cost');
   return result;
  });
  await p.screenshot({path:`${out}/idle-${width}.png`});
  const grades=width===1280?['D','B','A','S','SS','SSS']:['S'];
  for(const grade of grades){
   await p.evaluate(({pull,grade})=>{const u=window.__game.scene.getScene('UIScene');u.playGachaAnimation({...pull,grade});u.setOverlay('none');if(u.overlayMode!=='gacha')throw Error('animation not locked');},{pull,grade});
   if(grade==='S'){await p.waitForTimeout(450);await p.screenshot({path:`${out}/summon-${width}.png`});await p.waitForTimeout(550);await p.screenshot({path:`${out}/unlock-${width}.png`});}
   await p.waitForFunction(()=>{const u=window.__game.scene.getScene('UIScene'),c=u.children.getByName('gacha-ritual');return c?.getByName('gacha-receive')?.input?.enabled;});
   const facts=await p.evaluate(()=>{const game=window.__game,u=game.scene.getScene('UIScene'),c=u.children.getByName('gacha-ritual'),next=c.getByName('gacha-receive'),name=c.getByName('gacha-result-name'),icon=c.getByName('gacha-result-icon'),rank=c.getByName('gacha-result-rank'),r=game.canvas.getBoundingClientRect();return{name:name.text,rank:rank.text,texture:icon.texture.key,width:name.width,maxWidth:u.L.ov.w-68,click:{x:r.x+(c.x+next.x)*r.width/u.scale.width,y:r.y+(c.y+next.y)*r.height/u.scale.height}};});
   assert.equal(facts.name,pull.name);assert.equal(facts.rank,`${grade}ランク`);assert.notEqual(facts.texture,'__MISSING');assert.ok(facts.width<=facts.maxWidth);
   await p.screenshot({path:`${out}/result-${width}-${grade}.png`});await p.mouse.click(facts.click.x,facts.click.y);
   await p.waitForFunction(()=>!window.__game.scene.getScene('UIScene').gachaAnimating);assert.equal(await p.evaluate(()=>!!window.__game.scene.getScene('UIScene').children.getByName('gacha-ritual')),false);
  }
  await p.emulateMedia({reducedMotion:'reduce'});
  const click=await p.evaluate(()=>{
   const game=window.__game,g=game.scene.getScene('GameScene'),u=game.scene.getScene('UIScene');g.player.gold=1000;g.weaponWonThisFloor=false;u.gachaPool='weapon';u.setOverlay('gacha');u.refresh();
   const zone=u.overlay.getByName('gacha-pull'),r=game.canvas.getBoundingClientRect();return{x:r.x+(zone.x+zone.width/2)*r.width/u.scale.width,y:r.y+(zone.y+zone.height/2)*r.height/u.scale.height};
  });
  await p.mouse.click(click.x,click.y);
  await p.waitForFunction(()=>window.__game.scene.getScene('UIScene').children.getByName('gacha-ritual')?.getByName('gacha-receive')?.input?.enabled);
  assert.equal(await p.evaluate(()=>window.__game.scene.getScene('GameScene').player.gold),500);
  const received=await p.evaluate(()=>{const game=window.__game,u=game.scene.getScene('UIScene'),c=u.children.getByName('gacha-ritual'),z=c.getByName('gacha-receive'),r=game.canvas.getBoundingClientRect();return{x:r.x+(c.x+z.x)*r.width/u.scale.width,y:r.y+(c.y+z.y)*r.height/u.scale.height}});
  await p.mouse.click(received.x,received.y);await p.waitForFunction(()=>!window.__game.scene.getScene('UIScene').gachaAnimating);
  assert.deepEqual(errors,[]);await p.close();
 }
 console.log('PASS PC/mobile, real 500G debit, insufficient gold, D/B/A/S/SS/SSS presentation, actual result icon/name, modal lock, receive click and cleanup');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
