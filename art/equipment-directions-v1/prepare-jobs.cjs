const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '../..');
const boot = fs.readFileSync(path.join(root, 'src/scenes/BootScene.ts'), 'utf8');
const artCode = ['WEAPON_ART', 'SHIELD_ART'].map(name => boot.match(new RegExp('const ' + name + ' = \\{[\\s\\S]*?\\} as const;'))[0]).join('\n');
const art = vm.runInNewContext(ts.transpileModule(artCode, {compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText + '\n({WEAPON_ART,SHIELD_ART})');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, 'src/data.ts'),'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText, {exports:exportsObject});
const jobs = [...exportsObject.SHIELD_DEFS, ...exportsObject.WEAPON_DEFS].map(def => ({
  key:def.key, name:def.name, weaponType:def.weaponType, kind:def.key.startsWith('w_')?'weapon':'shield',
  reference:path.join(root,'public',art.WEAPON_ART[def.key] || art.SHIELD_ART[def.key])
}));
fs.writeFileSync(path.join(__dirname,'jobs.json'), JSON.stringify(jobs,null,2)+'\n');
async function previews() {
  for(let offset=0;offset<jobs.length;offset+=20) {
    const batch=jobs.slice(offset,offset+20), parts=[];
    for(const [i,job] of batch.entries()) parts.push({input:await sharp(job.reference).resize(128,128,{fit:'contain',background:'#00000000'}).png().toBuffer(),left:i%5*128,top:Math.floor(i/5)*128});
    await sharp({create:{width:640,height:Math.ceil(batch.length/5)*128,channels:4,background:'#00000000'}}).composite(parts).png().toFile(path.join(__dirname,`reference-${offset/20+1}.png`));
  }
  console.log('Prepared '+jobs.length+' equipment references.');
}
previews().catch(e=>{console.error(e);process.exitCode=1;});
