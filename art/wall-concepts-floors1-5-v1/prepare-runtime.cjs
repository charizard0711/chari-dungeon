// Crop and resize only. Transparency and all painted pixels come from built-in ImageGen.
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
async function main() {
  const jobs = JSON.parse(await fs.readFile(path.join(__dirname, 'runtime-sources.json'), 'utf8'));
  for (const job of jobs) {
    if (process.argv.length > 2 && !process.argv.slice(2).map(Number).includes(job.floor)) continue;
    const source = path.join(__dirname, `runtime-${job.floor}.png`);
    await fs.copyFile(job.source, source);
    const meta = await sharp(source).metadata();
    if (!meta.hasAlpha) throw new Error(`Floor ${job.floor}: alpha background required`);
    const halfW = Math.floor(meta.width / 2), halfH = Math.floor(meta.height / 2);
    const names = ['wall-a', 'wall-b', ...(job.floor === 2 || job.floor === 5 ? ['relic', 'rubble'] : ['rubble', 'relic'])];
    const out = path.resolve(__dirname, '../../public/assets/terrain/ruins-low-v1', String(job.floor));
    await fs.mkdir(out, { recursive: true });
    for (const [i, name] of names.entries()) {
      const cell = await sharp(source).extract({ left: i % 2 * halfW, top: Math.floor(i / 2) * halfH, width: halfW, height: halfH }).toBuffer();
      const trimmed = await sharp(cell).trim().toBuffer();
      if (i < 2) {
        // Fill a tile with a shallow overhead wall. No facade extending over walkable cells.
        await sharp(trimmed).resize(64, 64, { kernel: 'nearest', fit: 'fill' }).png().toFile(path.join(out, `${name}.png`));
      } else {
        const { data, info } = await sharp(trimmed).resize(112, 112, { fit: 'inside', kernel: 'nearest' }).png().toBuffer({ resolveWithObject: true });
        await sharp({ create: { width: 128, height: 128, channels: 4, background: '#00000000' } })
          .composite([{ input: data, left: Math.floor((128 - info.width) / 2), top: 118 - info.height }]).png().toFile(path.join(out, `${name}.png`));
      }
    }
  }
  console.log('Packed selected floor walls and props; generated alpha preserved.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
