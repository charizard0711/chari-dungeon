import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../layout';
import { WEAPON_DEFS, gradeColor } from '../data';
import { DEFAULT_PLAYER_WEAPON_KEY } from '../player';
import { readEquipmentCodexSave } from '../codexSave';
import { readRunSave } from '../runSave';
import { HALLOWEEN_TITLE } from '../halloweenContent';
import { Audio } from '../audio/manager';

const FONT = '"Yu Gothic UI", "Meiryo", sans-serif';
export class HalloweenScene extends Phaser.Scene {
  private selected = DEFAULT_PLAYER_WEAPON_KEY;
  private page = 0;
  private cards?: Phaser.GameObjects.Container;
  private detail!: Phaser.GameObjects.Text;
  private pageLabel!: Phaser.GameObjects.Text;
  private collection = WEAPON_DEFS.slice(0, 0);
  private leaving = false;
  constructor() { super('HalloweenScene'); }
  create() {
    this.page = 0; this.leaving = false; this.selected = DEFAULT_PLAYER_WEAPON_KEY;
    const discovered = readEquipmentCodexSave();
    discovered.add(DEFAULT_PLAYER_WEAPON_KEY);
    this.collection = WEAPON_DEFS.filter(w => discovered.has(w.key));
    const mobile = GAME_W < 700, cx = GAME_W / 2;
    const bg = this.add.image(cx, GAME_H / 2, 'hw_backdrop_1');
    bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height));
    this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x100917, .85);
    this.add.text(cx, mobile ? 30 : 36, 'HALLOWEEN', {fontFamily:FONT,fontSize:'13px',color:'#e9b85f',letterSpacing:4}).setOrigin(.5);
    this.add.text(cx, mobile ? 66 : 80, HALLOWEEN_TITLE, {fontFamily:'"Yu Mincho",serif',fontSize:mobile?'30px':'46px',color:'#ffdf99'}).setOrigin(.5);
    this.add.text(cx, mobile ? 107 : 126, '5層の新しい冒険 · レベル1からスタート', {fontFamily:FONT,fontSize:mobile?'12px':'16px',color:'#e8d5bd'}).setOrigin(.5);

    this.add.text(cx, mobile ? 240 : 300, '武器コレクションから1本選択', {fontFamily:FONT,fontSize:mobile?'20px':'24px',color:'#ffdc98',fontStyle:'bold'}).setOrigin(.5);
    this.add.text(cx, mobile ? 273 : 335, '入手済みの武器を新品で持ち込みます。強化・魔法は初期状態。', {fontFamily:FONT,fontSize:mobile?'10px':'14px',color:'#bcb0c4'}).setOrigin(.5);
    this.pageLabel = this.add.text(cx, mobile ? 504 : 535, '', {fontFamily:FONT,fontSize:'13px',color:'#c9b4cd'}).setOrigin(.5);
    this.button(cx-100, mobile ? 505 : 535, '前へ', () => { if(this.page>0) {this.page--;this.drawCollection();} }, 72);
    this.button(cx+100, mobile ? 505 : 535, '次へ', () => { if((this.page+1)*6<this.collection.length) {this.page++;this.drawCollection();} }, 72);
    this.detail = this.add.text(cx, mobile ? 553 : 581, '', {fontFamily:FONT,fontSize:mobile?'13px':'16px',color:'#ffe8b9',align:'center',wordWrap:{width:GAME_W-40}}).setOrigin(.5);
    this.drawCollection();
    this.button(cx, mobile ? 625 : 642, '選んだ武器でイベント開始', () => this.start(false), mobile ? 342 : 420, 50);
    const saved = readRunSave(true);
    if (saved) this.button(cx, mobile ? 690 : 701, `イベントの続きから · ${saved.snapshot.state.floor}F`, () => this.start(true), mobile ? 342 : 420, 42);
    else this.add.text(cx, mobile ? 690 : 700, '通常の冒険と別に自動保存 · 専用装備10種類', {fontFamily:FONT,fontSize:'12px',color:'#b8a6bc'}).setOrigin(.5);
    this.button(mobile ? cx : 95, mobile ? 766 : 710, 'タイトルへ', () => this.scene.start('TitleScene'), 160, 38);
    const back = () => this.scene.start('TitleScene'), start = () => this.start(false);
    this.input.keyboard?.on('keydown-ESC', back);
    this.input.keyboard?.on('keydown-ENTER', start);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', back);
      this.input.keyboard?.off('keydown-ENTER', start);
      this.cards = undefined;
    });
  }
  private drawCollection() {
    this.cards?.destroy(true);
    const previous = new Set(this.children.list);
    const mobile = GAME_W < 700, cols = mobile ? 2 : 3, width = mobile ? 171 : 268, height = mobile ? 57 : 61;
    this.collection.slice(this.page*6,this.page*6+6).forEach((w,i) => {
      const x = GAME_W/2 + (i%cols-(cols-1)/2)*(width+10);
      const y = (mobile ? 323 : 392)+Math.floor(i/cols)*(height+8);
      const chosen = this.selected === w.key;
      this.add.rectangle(x,y,width,height,chosen?0x503029:0x231c2d, .98).setStrokeStyle(chosen?2:1,chosen?0xffc96e:0x685172);
      this.add.image(x-width/2+26,y,w.key).setDisplaySize(40,40);
      this.add.text(x-width/2+51,y-12,w.name,{fontFamily:FONT,fontSize:mobile?'10px':'13px',color:chosen?'#fff0c9':'#d6c8db',wordWrap:{width:width-58}});
      this.add.text(x-width/2+51,y+10,`${w.grade} · 攻撃 ${w.atkMin}〜${w.atkMax}${chosen?' · 選択中':''}`,{fontFamily:FONT,fontSize:'10px',color:`#${gradeColor(w.grade).toString(16).padStart(6,'0')}`});
      this.add.zone(x,y,width,height).setName(`event-weapon-${w.key}`).setInteractive({useHandCursor:true}).on('pointerdown',()=>{this.selected=w.key;Audio.playSe('click');this.drawCollection();});
    });
    this.cards = this.add.container(0,0,this.children.list.filter(c=>!previous.has(c)));
    this.pageLabel.setText(`${this.page+1} / ${Math.max(1,Math.ceil(this.collection.length/6))}`);
    const weapon = this.collection.find(w=>w.key===this.selected)!;
    this.detail.setText(`選択：${weapon.name}\n耐久 ${weapon.durMax} · ${weapon.passive?.description ?? '武器種の固有効果付き'}`);
  }
  private start(resume: boolean) {
    if(this.leaving)return;
    const saved = readRunSave(true);
    if(!resume && saved) { this.confirmRestart(); return; }
    this.launch(resume);
  }
  private launch(resume: boolean) {
    if(this.leaving)return;this.leaving=true;
    this.scene.start('GameScene',{eventMode:'halloween',startingWeapon:this.selected,difficulty:'normal',resume});
  }
  private confirmRestart() {
    if(this.children.getByName('event-confirm'))return;
    const previous=new Set(this.children.list),cx=GAME_W/2,cy=GAME_H/2;
    this.add.rectangle(cx,cy,GAME_W,GAME_H,0x090610,.9).setInteractive();
    this.add.rectangle(cx,cy,Math.min(440,GAME_W-20),230,0x241629).setStrokeStyle(2,0xd99a56);
    this.add.text(cx,cy-65,'イベントの保存を上書きして\n新しく始めますか？',{fontFamily:FONT,fontSize:'19px',color:'#ffe1a0',align:'center'}).setOrigin(.5);
    this.button(cx,cy+10,'最初から始める',()=>this.launch(false),280);
    this.button(cx,cy+70,'戻る',()=>dialog.destroy(true),220);
    const dialog=this.add.container(0,0,this.children.list.filter(c=>!previous.has(c))).setName('event-confirm').setDepth(100);
  }
  private button(x:number,y:number,label:string,action:()=>void,w=280,h=38) {
    const bg=this.add.rectangle(x,y,w,h,0x352236).setStrokeStyle(1,0xd5a35f);
    this.add.text(x,y,label,{fontFamily:FONT,fontSize:'14px',color:'#ffe1a4'}).setOrigin(.5);
    this.add.zone(x,y,w,h).setName(label==='選んだ武器でイベント開始'?'event-start':label.startsWith('イベントの続き')?'event-resume':label).setInteractive({useHandCursor:true})
      .on('pointerover',()=>bg.setFillStyle(0x674031)).on('pointerout',()=>bg.setFillStyle(0x352236)).on('pointerdown',()=>{Audio.playSe('click');action();});
  }
}
