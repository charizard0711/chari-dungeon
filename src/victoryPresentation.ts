import Phaser from 'phaser';
import { GAME_W, GAME_H } from './layout';

export interface VictoryStats { floor: number; level: number; gold: number; score: number; turns: number; hp: number; hpMax: number; discovered: number; totalMonsters: number }
export function presentVictory(scene: Phaser.Scene, stats: VictoryStats, button: (x: number, y: number, label: string, primary: boolean, action: () => void) => void) {
  const phone = GAME_W < 700, cx = GAME_W / 2;
  scene.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x090e17);
  const art = scene.add.image(cx, GAME_H / 2, 'ending_dawn');
  const scale = Math.max(GAME_W / art.width, GAME_H / art.height);
  art.setScale(scale * 1.05);
  scene.tweens.add({targets:art,scaleX:scale,scaleY:scale,duration:9500,ease:'Sine.out'});
  scene.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x09101e, .22);
  const shade = scene.add.graphics();
  shade.fillGradientStyle(0x09101e,0x09101e,0x09101e,0x09101e,.65,.65,0,0).fillRect(0,0,GAME_W,320);
  shade.fillGradientStyle(0x09101e,0x09101e,0x09101e,0x09101e,0,0,.94,.94).fillRect(0,GAME_H-380,GAME_W,380);
  for (let i = 0; i < (phone ? 26 : 48); i++) {
    const x = Math.random() * GAME_W, y = 180 + Math.random() * (GAME_H - 200);
    const mote = scene.add.circle(x,y,.8+Math.random()*1.5,i%3?0xffd79b:0xa0eaf5,.8).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({targets:mote,y:y-90-Math.random()*100,x:x+25,alpha:0,duration:2200+Math.random()*3600,delay:Math.random()*1500,repeat:-1});
  }
  const crest = scene.add.image(cx,phone?73:89,'quest_crest').setDisplaySize(phone?80:108,phone?80:108).setAlpha(0);
  scene.tweens.add({targets:crest,alpha:.95,duration:1000,delay:200});
  const tag = scene.add.text(cx,phone?127:161,'BEYOND THE LAST FLOOR',{fontFamily:'Georgia, serif',fontSize:phone?'10px':'13px',color:'#e5c799',letterSpacing:4}).setOrigin(.5).setAlpha(0);
  const title = scene.add.text(cx,phone?177:218,'深淵を越えて',{fontFamily:'"Yu Mincho", serif',fontSize:phone?'37px':'60px',color:'#ffe5ad',letterSpacing:phone?3:8,stroke:'#201a22',strokeThickness:3}).setOrigin(.5).setAlpha(0);
  const subtitle = scene.add.text(cx,phone?219:269,'30階踏破 — ダンジョンコア、解放。\n長い夜の先に、新しい朝が訪れる。',{fontFamily:'"Yu Gothic UI"',fontSize:phone?'12px':'16px',color:'#eee4d6',align:'center',lineSpacing:9}).setOrigin(.5).setAlpha(0);
  scene.tweens.add({targets:tag,alpha:1,duration:800,delay:450});
  scene.tweens.add({targets:title,alpha:1,y:phone?166:203,duration:1300,delay:550,ease:'Cubic.out'});
  scene.tweens.add({targets:subtitle,alpha:1,duration:1000,delay:1050});
  const px = phone?18:220, py=phone?438:443, pw=phone?GAME_W-36:840, ph=phone?218:172;
  const group = scene.add.container(0,14).setAlpha(0);
  const panel = scene.add.graphics();
  panel.fillStyle(0x101925,.88).fillRoundedRect(px,py,pw,ph,8);
  panel.lineStyle(1,0xd2ac6c,.7).strokeRoundedRect(px,py,pw,ph,8);
  panel.lineStyle(1,0xd2ac6c,.18).strokeRoundedRect(px+5,py+5,pw-10,ph-10,5);
  group.add(panel);
  const label = (x:number,y:number,value:string,size:number,color:string) => {
    const t = scene.add.text(x,y,value,{fontFamily:'"Yu Gothic UI"',fontSize:`${size}px`,color}).setOrigin(.5);group.add(t);return t;
  };
  ['到達階層','最終レベル','冒険の得点'].forEach((name,i)=>label(px+pw*(i+.5)/3,py+29,name,phone?11:13,'#bca98b'));
  label(px+pw/6,py+69,`${stats.floor} F`,phone?29:36,'#f7e0b0');
  label(px+pw/2,py+69,`Lv. ${stats.level}`,phone?27:34,'#f7e0b0');
  const score = label(px+pw*5/6,py+69,'0',phone?26:36,'#f7e0b0');
  const counter={value:0};
  scene.tweens.add({targets:counter,value:stats.score,duration:1800,delay:1350,ease:'Cubic.out',onUpdate:()=>score.setText(Math.floor(counter.value).toLocaleString())});
  const lines = [`残りHP  ${stats.hp} / ${stats.hpMax}    所持金  ${stats.gold.toLocaleString()}G`, `総ターン数  ${stats.turns.toLocaleString()}    図鑑  ${stats.discovered} / ${stats.totalMonsters}`];
  lines.forEach((line,i)=>label(cx,py+(phone?123:113)+i*(phone?35:29),line,phone?11:14,'#bfccd2'));
  if(phone)label(cx,py+192,'この冒険の記憶は、あなたのもの。',11,'#bda886');
  scene.tweens.add({targets:group,y:0,alpha:1,duration:900,delay:1150,ease:'Cubic.out'});
  let leaving=false;
  const leave=(key:string)=>{if(leaving)return;leaving=true;scene.scene.start(key);};
  button(phone?cx:cx-166,phone?709:666,'新たな冒険へ',true,()=>leave('GameScene'));
  button(phone?cx:cx+166,phone?776:666,'タイトルへ',false,()=>leave('TitleScene'));
  scene.add.text(cx,phone?826:719,'THANK YOU FOR PLAYING  ·  ちゃりだんじょん',{fontFamily:'Georgia, serif',fontSize:phone?'9px':'11px',color:'#b5a18c',letterSpacing:phone?1:2}).setOrigin(.5);
  scene.cameras.main.fadeIn(1100,5,7,12);
  scene.input.keyboard?.once('keydown-ENTER',()=>leave('GameScene'));
}
