// Pack four transparent drawings (down, left, right, up) into a small runtime atlas.
// Preserve generated alpha and apply one common scale to all directions.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');

async function main() {
  const [source, output] = process.argv.slice(2);
  if (!source || !output) throw new Error('Usage: node prepare-monster-directions.cjs SOURCE OUTPUT');
  const meta = await sharp(source).metadata();
  if (!meta.hasAlpha || meta.width !== meta.height || meta.width % 2) {
    throw new Error('Expected a square RGBA sheet with four equal cells');
  }
  const size = meta.width / 2;
  let drawings = [], crossesGrid = false;
  for (let frame = 0; frame < 4; frame++) {
    const cell = sharp(source).extract({ left: frame % 2 * size, top: Math.floor(frame / 2) * size, width: size, height: size });
    const { data, info } = await cell.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let x1 = size, y1 = size, x2 = -1, y2 = -1;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (data[(y * size + x) * info.channels + 3] < 8) continue;
      x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y);
    }
    if (x2 < 0) throw new Error(`Frame ${frame} is empty`);
    if (x1 === 0 || y1 === 0 || x2 === size - 1 || y2 === size - 1) crossesGrid = true;
    drawings.push({ frame, left: frame % 2 * size + x1 - 1, top: Math.floor(frame / 2) * size + y1 - 1,
      width: x2 - x1 + 3, height: y2 - y1 + 3 });
  }
  // Generated wings can cross the nominal quadrant line while remaining separate.
  // In that case locate complete drawings by connected alpha, preserving every wing.
  if (crossesGrid) {
    const { data } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const w = meta.width, h = meta.height, visited = new Uint8Array(w * h), queue = new Int32Array(w * h);
    const groups = new Map();
    for (let start = 0; start < visited.length; start++) {
      if (visited[start] || data[start * 4 + 3] < 8) continue;
      let head = 0, tail = 1, x1 = w, y1 = h, x2 = -1, y2 = -1;
      queue[0] = start; visited[start] = 1;
      while (head < tail) {
        const p = queue[head++], x = p % w, y = Math.floor(p / w);
        x1 = Math.min(x1, x); x2 = Math.max(x2, x); y1 = Math.min(y1, y); y2 = Math.max(y2, y);
        for (const next of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
          if (next < 0 || visited[next] || data[next * 4 + 3] < 8) continue;
          visited[next] = 1; queue[tail++] = next;
        }
      }
      if (tail < 1000) continue;
      const frame = Math.floor((x1 + x2) / 2 / size) + Math.floor((y1 + y2) / 2 / size) * 2;
      const box = groups.get(frame);
      groups.set(frame, box ? { x1: Math.min(box.x1, x1), y1: Math.min(box.y1, y1), x2: Math.max(box.x2, x2), y2: Math.max(box.y2, y2) } : { x1, y1, x2, y2 });
    }
    if (groups.size !== 4 || [0, 1, 2, 3].some(frame => !groups.has(frame))) throw new Error('Expected four separate complete drawings');
    drawings = [...groups].map(([frame, b]) => {
      if (b.x1 < 1 || b.y1 < 1 || b.x2 >= w - 1 || b.y2 >= h - 1) throw new Error(`Drawing ${frame} touches the image edge`);
      return { frame, left: b.x1 - 1, top: b.y1 - 1, width: b.x2 - b.x1 + 3, height: b.y2 - b.y1 + 3 };
    });
    for (const a of drawings) for (const b of drawings) {
      if (a.frame < b.frame && a.left < b.left + b.width && b.left < a.left + a.width
        && a.top < b.top + b.height && b.top < a.top + a.height) throw new Error('Drawing bounds overlap; repack would include a neighbor');
    }
  }
  const scale = 112 / Math.max(...drawings.flatMap(d => [d.width, d.height]));
  const layers = [];
  for (const { frame, left, top, width, height } of drawings) {
    const w = Math.round(width * scale), h = Math.round(height * scale);
    layers.push({ input: await sharp(source).extract({ left, top, width, height }).resize(w, h, { kernel: 'nearest' }).png().toBuffer(),
      left: frame % 2 * 128 + Math.round((128 - w) / 2), top: Math.floor(frame / 2) * 128 + 118 - h });
  }
  await fs.mkdir(path.dirname(output), { recursive: true });
  await sharp({ create: { width: 256, height: 256, channels: 4, background: '#00000000' } })
    .composite(layers).png({ compressionLevel: 9 }).toFile(output);
  console.log(`Packed four 128px frames: ${output} (${(await fs.stat(output)).size} bytes)`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
