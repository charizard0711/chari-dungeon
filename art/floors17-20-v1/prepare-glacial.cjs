// Crop and resize generated PNGs only; preserve their original alpha and painting.
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
async function main() {
  const [floor, wall, objects] = process.argv.slice(2);
  const out = path.resolve(__dirname, '../../public/assets/terrain/glacial');
  await fs.mkdir(out, { recursive: true });
  for (const source of [wall, objects]) {
    if (!(await sharp(source).metadata()).hasAlpha) throw new Error('Generated props must already have alpha');
  }
  await sharp(floor).resize(64, 64).png().toFile(path.join(out, 'floor.png'));
  await sharp(wall).resize(64, 64, { kernel: 'nearest' }).png().toFile(path.join(out, 'wall.png'));
  const meta = await sharp(objects).metadata();
  // The generated top row is taller than its bottom row; crop between the complete props.
  const half = meta.width / 2, split = Math.round(meta.height * 0.598);
  for (const [index, name] of ['crystal', 'obelisk', 'boulder', 'altar'].entries()) {
    const top = index < 2 ? 0 : split, height = index < 2 ? split : meta.height - split;
    const cell = await sharp(objects).extract({ left: index % 2 * half, top, width: half, height }).toBuffer();
    const trimmed = await sharp(cell).trim().toBuffer();
    const { data, info } = await sharp(trimmed).resize(112, 112, { fit: 'inside', kernel: 'nearest' })
      .png().toBuffer({ resolveWithObject: true });
    await sharp({ create: { width: 128, height: 128, channels: 4, background: '#00000000' } })
      .composite([{ input: data, left: Math.floor((128 - info.width) / 2), top: 118 - info.height }])
      .png().toFile(path.join(out, `${name}.png`));
  }
  console.log('Packed 2 glacial tiles and 4 props, preserving generated alpha.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
