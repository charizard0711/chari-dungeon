const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const sharp = require(process.env.SHARP_MODULE || '../tmp/qa-mob-runtime/node_modules/sharp');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '../tmp/qa-mob-runtime/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let entries;
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:5190/');
    await page.waitForFunction(() => window.__game?.scene.isActive('TitleScene'));
    entries = await page.evaluate(() => window.__game.registry.get('assetManifest'));
  } finally { await browser.close(); }
  const outputs = {}, folder = 'public/assets/optimized-v1'; fs.mkdirSync(folder, { recursive: true });
  let originalBytes = 0, optimizedBytes = 0;
  for (const entry of entries) {
    if (!entry.path.endsWith('.png') || outputs[entry.path]) continue;
    const source = path.join('public', entry.path);
    if (!fs.existsSync(source)) continue;
    const original = fs.readFileSync(source);
    if (original.length < 20000) continue;
    const meta = await sharp(original).metadata();
    const image = await sharp(original).webp(entry.kind === 'spritesheet' ? { lossless: true, effort: 4 } : { quality: 90, alphaQuality: 100, effort: 4 }).toBuffer();
    if (image.length >= original.length) continue;
    const check = await sharp(image).metadata();
    const transparencyLost = meta.hasAlpha && !check.hasAlpha && (await sharp(original).stats()).channels[3]?.min !== 255;
    if (meta.width !== check.width || meta.height !== check.height || transparencyLost) throw Error(`Image topology changed: ${entry.path}`);
    const filename = crypto.createHash('sha256').update(entry.path).digest('hex').slice(0, 12) + '.webp';
    fs.writeFileSync(path.join(folder, filename), image);
    outputs[entry.path] = `assets/optimized-v1/${filename}`;
    originalBytes += original.length; optimizedBytes += image.length;
  }
  fs.writeFileSync('src/optimizedAssetPaths.json', JSON.stringify(outputs, null, 2) + '\n');
  console.log(JSON.stringify({ files: Object.keys(outputs).length, originalBytes, optimizedBytes }));
})().catch(error => { console.error(error); process.exitCode = 1; });
