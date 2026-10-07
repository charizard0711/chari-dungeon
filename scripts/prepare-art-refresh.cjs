const fs = require('node:fs/promises'), path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
(async () => {
  const manifests = await Promise.all(['monster', 'weapon', 'ui'].map(async name => JSON.parse((await fs.readFile(path.join(root, 'art/art-refresh-v1', name + '-manifest.json'), 'utf8')).replace(/^\uFEFF/, ''))));
  const rows = manifests.flat();
  const dest = path.join(root, 'public/assets/art-refresh-v1');
  await fs.mkdir(dest, {recursive:true});
  for (const row of rows) {
    const key = row.key.startsWith('w_') ? 'icon_' + row.key : row.key;
    const size = key === 'ui_close_button' ? 128 : key.startsWith('ui_') ? 1024 : 512;
    await sharp(row.path).resize({width:size,height:size,fit:'inside',withoutEnlargement:true}).png({compressionLevel:9}).toFile(path.join(dest, key + '.png'));
  }
  for (const [name, group] of [['monsters', manifests[0]], ['weapons', manifests[1]]]) {
    const cards = await Promise.all(group.map(async row => ({input:await sharp(path.join(dest,(row.key.startsWith('w_')?'icon_':'')+row.key+'.png')).resize(200,200,{fit:'contain',background:'#14242c'}).png().toBuffer()})));
    await sharp({create:{width:800,height:Math.ceil(cards.length/4)*200,channels:4,background:'#14242c'}}).composite(cards.map((card,i)=>({...card,left:i%4*200,top:Math.floor(i/4)*200}))).png().toFile(path.join(root,'art/art-refresh-v1',name+'-preview.png'));
  }
  await fs.writeFile(path.join(root,'art/art-refresh-v1/prompts.md'), '# イラスト刷新\n\n生成方式: built-in ImageGen。モンスター'+manifests[0].length+'種、武器一覧'+manifests[1].length+'種、メニュー'+manifests[2].length+'種。\n\n'+rows.map(row=>'## '+row.key+'\n\n'+row.prompt+'\n\n生成原本: '+row.path+'\n\n実装素材: public/assets/art-refresh-v1/'+(row.key.startsWith('w_')?'icon_':'')+row.key+'.png\n').join('\n'));
  console.log('Prepared '+rows.length+' illustrated assets and previews.');
})().catch(error=>{console.error(error);process.exitCode=1;});
