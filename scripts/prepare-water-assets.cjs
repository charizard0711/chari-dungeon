// Crop, resize and pack ImageGen drawings. Preserve the generated alpha without repainting.
const fs = require('node:fs/promises'), path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const art = path.join(root, 'art/water-runtime-floors6-10-v1');
const terrain = path.join(root, 'public/assets/terrain/water-v1');
const parts = ['wall-a', 'wall-b', 'prop-1', 'prop-2', 'prop-3', 'prop-4'];
async function bounds(source) {
  const meta = await sharp(source).metadata();
  if (!meta.hasAlpha || (await sharp(source).stats()).isOpaque) throw Error('Transparent art required: ' + source);
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, boxes = [];
  for (let frame = 0; frame < 6; frame++) {
    const left = Math.floor(frame % 3 * w / 3), right = Math.floor((frame % 3 + 1) * w / 3);
    const top = Math.floor(Math.floor(frame / 3) * h / 2), bottom = Math.floor((Math.floor(frame / 3) + 1) * h / 2);
    let x1 = right, y1 = bottom, x2 = -1, y2 = -1;
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      if (data[(y * w + x) * 4 + 3] < 8) continue;
      x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y);
    }
    if (x2 < x1 || y2 < y1) throw Error('Empty prop cell: ' + source + ' / ' + frame);
    boxes.push({ frame, left: x1, top: y1, width: x2 - x1 + 1, height: y2 - y1 + 1 });
  }
  return boxes;
}
async function canvas(w, h, layers, out) {
  await sharp({ create: { width: w, height: h, channels: 4, background: '#00000000' } })
    .composite(layers).png({ compressionLevel: 9 }).toFile(out);
}
async function main() {
  const jobs = JSON.parse(await fs.readFile(path.join(art, 'prompts.json'), 'utf8'));
  await fs.mkdir(terrain, { recursive: true });
  for (const job of jobs) {
    const source = path.join(art, job.file);
    try { await fs.access(source); } catch { await fs.copyFile(job.source, source); }
    const dest = path.join(terrain, String(job.floor));
    if (job.floor) await fs.mkdir(dest, { recursive: true });
    if (job.kind === 'floor') {
      const m = await sharp(source).metadata(), cw = Math.floor(m.width / 2), ch = Math.floor(m.height / 2), layers = [];
      for (let f = 0; f < 4; f++) layers.push({ input: await sharp(source)
        .extract({ left: f % 2 * cw + 3, top: Math.floor(f / 2) * ch + 3, width: cw - 6, height: ch - 6 })
        .resize(64, 64, { kernel: 'nearest' }).png().toBuffer(), left: f % 2 * 64, top: Math.floor(f / 2) * 64 });
      await canvas(128, 128, layers, path.join(dest, 'floor.png'));
    } else if (job.kind === 'props') {
      for (const { frame, ...rect } of await bounds(source)) {
        const size = frame < 2 ? 64 : 128, maxW = frame < 2 ? 64 : 112, maxH = frame < 2 ? 60 : 112;
        const scale = Math.min(maxW / rect.width, maxH / rect.height), w = Math.round(rect.width * scale), h = Math.round(rect.height * scale);
        const input = await sharp(source).extract(rect).resize(w, h, { kernel: 'nearest' }).png().toBuffer();
        await canvas(size, size, [{ input, left: Math.round((size - w) / 2), top: (frame < 2 ? 62 : 118) - h }], path.join(dest, parts[frame] + '.png'));
      }
    } else await sharp(source).resize(64, 64, { kernel: 'nearest' }).png().toFile(path.join(terrain, 'water.png'));
    console.log('Packed ' + job.id);
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
