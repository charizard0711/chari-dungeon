// Only crop and resize generated paintings. No procedural painting or recoloring.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
async function main() {
  const jobs = JSON.parse(await fs.readFile(path.join(__dirname, 'runtime-sources.json'), 'utf8'));
  const output = path.resolve(__dirname, '../../public/assets/terrain/ruins-floor-v1');
  await fs.mkdir(output, { recursive: true });
  for (const job of jobs) {
    const source = path.join(__dirname, `runtime-${job.floor}.png`);
    // The copied originals keep this reproducible outside the generating machine.
    try { await fs.access(source); } catch { await fs.copyFile(job.source, source); }
    const meta = await sharp(source).metadata();
    if (meta.width !== 1536 || meta.height !== 1024) throw new Error('Unexpected atlas dimensions');
    const cells = [];
    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3), top = job.cropRows[row];
      const input = await sharp(source).extract({left: (i % 3) * 512, top, width: 512, height: job.cropRows[row + 1] - top})
        .resize(64, 64, { kernel: 'nearest', fit: 'fill' }).png().toBuffer();
      cells.push({input, left: (i % 3) * 64, top: row * 64});
    }
    await sharp({create: {width: 192, height: 128, channels: 4, background: '#00000000'}})
      .composite(cells).png().toFile(path.join(output, `${job.floor}.png`));
  }
  console.log('Packed five static floor atlases (six 64px frames each).');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
