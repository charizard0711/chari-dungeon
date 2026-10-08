import { ensureSceneAssets } from '../assetStreaming';
import { presentVictory } from '../victoryPresentation';
import { DIFFICULTY_RULES, difficultyOf, type Difficulty } from '../difficulty';
import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { Audio } from '../audio/manager';
import { getSelectedGender, type PlayerGender } from '../playerAppearance';
import { createDamageJournal } from '../damageJournalUI';
import type { AdventureEntry, DamageEntry } from '../damageJournal';

interface EndStats {
  eventMode?: 'halloween' | null;
  eventStartingWeapon?: string;
  cleared: boolean;
  difficulty?: Difficulty;
  unlockedDifficulty?: Difficulty;
  difficultySaveFailed?: boolean;
  difficultyChanged?: boolean;
  playerGender?: PlayerGender;
  floor: number;
  level: number;
  gold: number;
  score: number;
  turns: number;
  hp: number;
  hpMax: number;
  discovered: number;
  totalMonsters: number;
  damageHistory?: DamageEntry[];
  adventureHistory?: AdventureEntry[];
}

export class EndScene extends Phaser.Scene {
  private journal?: Phaser.GameObjects.Container;
  constructor() {
    super('EndScene');
  }

  async create(stats: EndStats) {
    await ensureSceneAssets(this, stats.floor, !!stats.eventMode, true);
    this.journal = undefined;
    if (stats.eventMode === 'halloween') { this.createHalloweenResult(stats); return; }
    if (!stats.cleared) { this.createDefeat(stats); return; }
    presentVictory(this, stats, (x, y, label, primary, action) => this.defeatButton(x, y, label, primary, action));
  }

  private createHalloweenResult(stats: EndStats) {
    const cx = GAME_W / 2, mobile = GAME_W < 700;
    const bg = this.add.image(cx, GAME_H/2, `hw_backdrop_${stats.floor}`);
    bg.setScale(Math.max(GAME_W/bg.width, GAME_H/bg.height));
    this.add.rectangle(cx,GAME_H/2,GAME_W,GAME_H,0x10091b,.82);
    this.add.text(cx,90,'呪われた収穫城',{fontFamily:'"Yu Mincho",serif',fontSize:mobile?'30px':'42px',color:'#ffda91'}).setOrigin(.5);
    this.add.image(cx,245,stats.cleared?'m_hw_king':'m_hw_pumpkin_lord').setDisplaySize(190,190);
    this.add.text(cx,390,stats.cleared?'ハロウィンイベント踏破！':'収穫城で力尽きた…',{fontFamily:'"Yu Gothic UI"',fontSize:mobile?'23px':'32px',color:'#ffe4a9',fontStyle:'bold'}).setOrigin(.5);
    this.add.text(cx,466,`${stats.floor} / 5層 · Lv.${stats.level}\n得点 ${stats.score.toLocaleString()} · ${stats.turns}ターン\n入手した専用装備はコレクションに記録されます。`,{fontFamily:'"Yu Gothic UI"',fontSize:mobile?'13px':'17px',color:'#dfcce6',align:'center',lineSpacing:10}).setOrigin(.5);
    let leaving=false;
    const leave=(scene:string)=>{if(leaving)return;leaving=true;this.scene.start(scene);};
    this.defeatButton(cx,610,'武器を選んでもう一度',true,()=>leave('HalloweenScene'));
    this.defeatButton(cx,690,'タイトルへ',false,()=>leave('TitleScene'));
    if (!stats.cleared) this.addDamageLog(stats, mobile ? 541 : 548);
  }

  private createDefeat(stats: EndStats) {
    const mobile = GAME_W < 700;
    const cx = GAME_W / 2;
    this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x101012);
    const gender = stats.playerGender ?? getSelectedGender();
    const art = this.add.image(cx, mobile ? 170 : 165, `defeat_${gender}`);
    art.setScale(Math.min((mobile ? 330 : 440) / art.width, (mobile ? 200 : 240) / art.height));
    this.add.text(cx, mobile ? 300 : 320, '力尽きた…', {
      fontFamily: '"Yu Mincho", serif', fontSize: mobile ? '34px' : '46px', color: '#e1d9c9', letterSpacing: 3
    }).setOrigin(.5);
    const x = mobile ? 18 : cx - 360, y = mobile ? 350 : 375;
    const w = mobile ? GAME_W - 36 : 720, h = mobile ? 244 : 180;
    this.resultFrame(x, y, w, h);
    const metrics: [string, string][] = [['到達階層', `${stats.floor}階`], ['レベル', `${stats.level}`], ['得点', stats.score.toLocaleString()]];
    metrics.forEach(([label, value], i) => {
      const mx = x + w * (i + .5) / 3;
      this.add.text(mx, y + 32, label, { fontFamily: '"Yu Gothic UI"', fontSize: mobile ? '13px' : '16px', color: '#baa67f' }).setOrigin(.5);
      this.add.text(mx, y + 76, value, { fontFamily: '"Yu Mincho", serif', fontSize: mobile ? '27px' : '36px', color: '#f3dfb4' }).setOrigin(.5);
    });
    const detailFont = { fontFamily: '"Yu Gothic UI"', fontSize: mobile ? '13px' : '14px', color: '#bfb7aa' };
    if (mobile) {
      [`所持金  ${stats.gold.toLocaleString()}G`, `総ターン数  ${stats.turns.toLocaleString()}`, `モンスター図鑑  ${stats.discovered} / ${stats.totalMonsters}`].forEach((text, i) => {
        this.add.text(cx, y + 133 + i * 35, text, detailFont).setOrigin(.5);
      });
    } else {
      this.add.text(cx, y + 127, `所持金 ${stats.gold.toLocaleString()}G    総ターン数 ${stats.turns.toLocaleString()}    図鑑 ${stats.discovered} / ${stats.totalMonsters}`, detailFont).setOrigin(.5);
    }
    let leaving = false;
    const leave = (scene: string) => { if (leaving) return; leaving = true; this.scene.start(scene, { difficulty: difficultyOf(stats.difficulty) }); };
    this.add.text(cx, mobile ? 328 : 350, DIFFICULTY_RULES[difficultyOf(stats.difficulty)].name, {fontFamily:'"Yu Gothic UI"',fontSize:'14px',color:DIFFICULTY_RULES[difficultyOf(stats.difficulty)].text}).setOrigin(.5);
    this.defeatButton(mobile ? cx : cx - 166, mobile ? 658 : 640, 'もう一度挑戦', true, () => leave('GameScene'));
    this.defeatButton(mobile ? cx : cx + 166, mobile ? 734 : 640, 'タイトルへ', false, () => leave('TitleScene'));
    this.addDamageLog(stats, mobile ? 613 : 584);
    const retry = () => { if (!this.journal?.active) leave('GameScene'); };
    this.input.keyboard?.on('keydown-ENTER', retry);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.off('keydown-ENTER', retry));
  }

  private addDamageLog(stats: EndStats, y: number) {
    const open = (fatalFirst = false) => {
      if (this.journal?.active) return;
      this.journal = createDamageJournal(this, stats.damageHistory ?? [], stats.adventureHistory ?? [], difficultyOf(stats.difficulty), () => { this.journal = undefined; }, fatalFirst);
    };
    this.add.image(GAME_W / 2 - 66, y, 'ui_nav_damage_log').setDisplaySize(32, 32);
    this.add.text(GAME_W / 2 + 16, y, '詳細ログを見る', { fontFamily: '"Yu Gothic UI"', fontSize: '16px', color: '#f0d398', padding: { x: 16, y: 10 } })
      .setOrigin(.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => open(true));
  }

  private resultFrame(x: number, y: number, w: number, h: number) {
    const g = this.add.graphics();
    g.fillStyle(0x1b1818, .95).fillRoundedRect(x, y, w, h, 8);
    g.lineStyle(1, 0x9c7743, .85).strokeRoundedRect(x, y, w, h, 8);
    g.lineStyle(1, 0x9c7743, .28).strokeRoundedRect(x + 5, y + 5, w - 10, h - 10, 6);
    for (const [cx, cy] of [[x + 9, y + 9], [x + w - 9, y + 9], [x + 9, y + h - 9], [x + w - 9, y + h - 9]]) {
      g.fillStyle(0xbd9557, .8).fillPoints([{x:cx,y:cy-4},{x:cx+4,y:cy},{x:cx,y:cy+4},{x:cx-4,y:cy}],true);
    }
    g.lineStyle(1, 0x9c7743, .35).lineBetween(x + 24, y + 105, x + w - 24, y + 105);
  }

  private defeatButton(x: number, y: number, label: string, primary: boolean, action: () => void) {
    const w = Math.min(300, GAME_W - 64), h = 56;
    const g = this.add.graphics();
    const draw = (hover = false) => {
      g.clear();
      g.fillStyle(primary ? (hover ? 0x69402d : 0x492d24) : (hover ? 0x343031 : 0x242123), 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 7);
      g.lineStyle(1.5, hover ? 0xf0ce89 : 0xad834c).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 7);
      g.lineStyle(1, 0xad834c, .35).strokeRoundedRect(x - w / 2 + 5, y - h / 2 + 5, w - 10, h - 10, 4);
      for (const dx of [-w / 2 + 17, w / 2 - 17]) {
        g.fillStyle(0xc9a265, .8).fillPoints([{x:x+dx,y:y-4},{x:x+dx+4,y},{x:x+dx,y:y+4},{x:x+dx-4,y}],true);
      }
    };
    draw();
    this.add.text(x, y, label, { fontFamily: '"Yu Gothic UI"', fontSize: '19px', color: '#f4dfb9', fontStyle: 'bold' }).setOrigin(.5);
    this.add.zone(x, y, w, h).setInteractive({useHandCursor:true})
      .on('pointerover', () => draw(true)).on('pointerout', () => draw())
      .on('pointerdown', () => { Audio.playSe('click'); action(); });
  }

  makeButton(x: number, y: number, label: string, onClick: () => void) {
    const w = Math.min(280, GAME_W - 60), h = 50;
    const g = this.add.graphics();
    const draw = (c: number) => { g.clear(); g.fillStyle(c, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 10); g.lineStyle(2, 0x3fe0d0).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10); };
    draw(0x2f6f6a);
    this.add.text(x, y, label, { fontFamily: '"Yu Gothic UI"', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const zone = this.add.zone(x - w / 2, y - h / 2, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(0x3f8f88));
    zone.on('pointerout', () => draw(0x2f6f6a));
    zone.on('pointerdown', () => { Audio.playSe('click'); onClick(); });
  }
}
