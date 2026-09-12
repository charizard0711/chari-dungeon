// Crop, resize and pack ImageGen sprites. Never paint or remove backgrounds here.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
async function main() {
  const key = process.argv[2];
  const recordFile = path.join(root, 'art/equipment-directions-v1', key + '.json');
  const job = JSON.parse((await fs.readFile(recordFile, 'utf8')).replace(/^\uFEFF/, ''));
  const source = path.join(root, 'art/equipment-directions-v1', key + '.png');
  try { await fs.access(source); } catch { await fs.copyFile(job.source, source); }
  const meta = await sharp(source).metadata(), stats = await sharp(source).stats();
  if (!meta.hasAlpha || stats.isOpaque) throw new Error(key + ': transparent background required');
  const w = Math.floor(meta.width / 2), h = Math.floor(meta.height / 2), cells = [];
  const bounds = [];
  for (let i = 0; i < 4; i++) {
    const cell = await sharp(source).extract({left: i % 2 * w, top: Math.floor(i / 2) * h, width: w, height: h}).png().toBuffer();
    const cropped = await sharp(cell).trim({threshold: 10}).png().toBuffer();
    bounds.push(await sharp(cropped).metadata());
    cells.push(cropped);
  }
  // Same scale for every view: thin side views stay thin instead of being widened.
  const scale = Math.min(56 / Math.max(...bounds.map(b=>b.width)), 56 / Math.max(...bounds.map(b=>b.height)));
  const packed = [];
  for (let i = 0; i < 4; i++) {
    const width = Math.max(1, Math.round(bounds[i].width * scale)), height = Math.max(1, Math.round(bounds[i].height * scale));
    const input = await sharp(cells[i]).resize(width, height, {kernel:'nearest'}).png().toBuffer();
    packed.push({input, left: i % 2 * 64 + Math.floor((64 - width) / 2), top: Math.floor(i / 2) * 64 + 60 - height});
  }
  const destination = path.join(root, 'public/assets/equipment/directional');
  await fs.mkdir(destination, {recursive:true});
  await sharp({create:{width:128,height:128,channels:4,background:'#00000000'}})
    .composite(packed).png().toFile(path.join(destination,key+'.png'));
  console.log(key + ': packed four transparent views');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
