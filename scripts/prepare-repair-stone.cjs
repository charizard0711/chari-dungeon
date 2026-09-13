// Remove only connected white background; retain white highlights inside the original drawing.
const fs = require('node:fs'), path = require('node:path');
const sharp = require(process.env.SHARP_PATH || 'C:/Users/masam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
(async () => {
  const { data, info } = await sharp(path.join(root, 'art/repair-stone-v1/source.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info, seen = new Uint8Array(w * h), queue = new Int32Array(w * h); let head = 0, tail = 0;
  function add(i) {
    if (seen[i]) return;
    const p = i * 4, lo = Math.min(data[p], data[p + 1], data[p + 2]), hi = Math.max(data[p], data[p + 1], data[p + 2]);
    if (lo < 222 || hi - lo > 18) return;
    seen[i] = 1; queue[tail++] = i;
  }
  for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { add(y * w); add(y * w + w - 1); }
  while (head < tail) {
    const i = queue[head++], x = i % w, y = Math.floor(i / w); data[i * 4 + 3] = 0;
    if (x) add(i - 1); if (x < w - 1) add(i + 1); if (y) add(i - w); if (y < h - 1) add(i + w);
  }
  const image = await sharp(data, { raw: info }).trim().resize(200, 200, { fit: 'inside' }).png().toBuffer();
  await sharp({ create: { width: 224, height: 224, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: image, gravity: 'centre' }]).png().toFile(path.join(root, 'public/assets/items/equipment-repair-stone.png'));
  console.log('Prepared repair-stone icon: 224×224, transparent background.');
})();
