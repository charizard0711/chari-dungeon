const assert = require('node:assert/strict'), fs = require('node:fs/promises'), path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
(async () => {
  const jobs = JSON.parse(await fs.readFile(path.join(root, 'art/thunder-runtime-v1/prompts.json'), 'utf8'));
  let count = 0;
  for (const j of jobs) {
    const source = sharp(path.join(root, 'art/thunder-runtime-v1', j.file));
    const stats = await source.stats();
    if (j.kind === 'boss' || j.kind === 'props') assert.equal(stats.isOpaque, false, j.id + ' requires native alpha');
    const targets = j.kind === 'boss'
      ? [[`assets/monsters/directional/${j.key.slice(2)}-directions-v1.png`, 256, 256], [`assets/monsters/${j.key}.png`, 128, 128]]
      : j.kind === 'floor' ? [[`assets/terrain/thunder-v1/${j.floor}/floor.png`, 128, 128]]
      : j.kind === 'props' ? ['prop-1', 'prop-2', 'prop-3', 'prop-4'].map(part => [`assets/terrain/thunder-v1/${j.floor}/${part}.png`, 128, 128])
      : j.kind === 'walls' ? ['wall-a', 'wall-b'].map(part => [`assets/terrain/thunder-v1/${j.floor}/${part}.png`, 64, 64])
      : [['assets/terrain/thunder-v1/storm-clouds.png', 64, 64]];
    for (const [file, width, height] of targets) {
      const image = sharp(path.join(root, 'public', file)), m = await image.metadata();
      assert.deepEqual([m.width, m.height], [width, height], file);
      if (j.kind === 'boss') {
        const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
        const occupied = [0, 0, 0, 0];
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * info.width + x) * 4 + 3] > 127) {
          occupied[Math.floor(y / 128) * 2 + Math.floor(x / 128)]++;
          assert.ok(x % 128 > 0 && x % 128 < 127 && y % 128 > 0 && y % 128 < 127, file + ': sprite touches frame boundary');
        }
        assert.ok(occupied.slice(0, width === 256 ? 4 : 1).every(n => n > 600), file + ': empty/cut frame');
      }
      count++;
    }
  }
  console.log(`PASS: ${count} runtime images; four complete directions per boss, native alpha, dimensions and packaged paths.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
