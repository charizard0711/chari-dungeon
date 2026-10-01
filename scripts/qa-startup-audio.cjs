const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:800}});
    const requests=[], errors=[];
    page.on('request',request=>requests.push({url:request.url(),method:request.method()}));
    page.on('pageerror',e=>errors.push(e.message));
    let release;
    const held = new Promise(resolve=>release=resolve);
    await page.route('**/bgm_floors_01_02.mp3',async route=>{await held;await route.continue();});
    const started=Date.now();
    await page.goto((process.env.QA_URL||'http://localhost:5174')+'/');
    console.log('QA: document loaded');
    await page.waitForFunction(()=>window.__game?.scene.isActive('TitleScene'),null,{timeout:60000});
    const titleMs=Date.now()-started;
    console.log('QA: title ready');
    assert.equal(await page.evaluate(()=>window.__game.cache.audio.exists('bgm_floor01')),false,'title must be interactive while exploration BGM is still unavailable');
    assert.equal(requests.some(r=>/bgm_(boss|midboss)/.test(r.url)),false,'boss tracks must not be fetched at startup');
    release();
    await page.waitForFunction(()=>window.__game.cache.audio.exists('bgm_floor01'),null,{timeout:30000});
    console.log('QA: exploration BGM decoded');
    assert.equal(requests.filter(r=>r.url.endsWith('bgm_floors_01_02.mp3')).length,1,'BGM preload must share one network request');
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.__game?.scene.isActive('GameScene')&&window.__game.scene.getScene('GameScene').playerSprite?.active,null,{timeout:30000});
    console.log('QA: game ready');
    await page.evaluate(()=>window.__game.scene.getScene('GameScene').setBossEntranceClosed(true,false));
    await page.waitForFunction(()=>window.__game.cache.audio.exists('bgm_midboss'),null,{timeout:30000});
    await page.evaluate(()=>window.__game.scene.getScene('GameScene').buildFloor(15,true));
    await page.waitForFunction(()=>window.__game.cache.audio.exists('bgm_boss'),null,{timeout:30000});
    const buffers=await page.evaluate(()=>{
      return ['bgm_floor01','bgm_midboss','bgm_boss'].map(key=>({key,duration:window.__game.cache.audio.get(key).duration}));
    });
    for(const b of buffers)assert.ok(b.duration>20,'compressed music must decode into a complete track');
    assert.equal(requests.some(r=>/bgm_.*\.wav/.test(r.url)),false);
    assert.equal(requests.some(r=>/bgm_title\.mp3|se_(step|hit|hurt|coin|pickup|chest|heal|levelup)\.mp3/.test(r.url)),false,'synthesized sounds must not probe missing files');
    assert.deepEqual(errors,[]);
    fs.mkdirSync('outputs/qa-run-save',{recursive:true});
    fs.writeFileSync('outputs/qa-run-save/startup.json',JSON.stringify({titleMs,delayedBgmDoesNotBlockTitle:true,buffers,errors},null,2));
    console.log('PASS: delayed exploration BGM does not block title; one shared download; no boss downloads at boot; all compressed tracks decode. Local title time: '+titleMs+' ms');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
