import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { Audio } from '../audio/manager';
import { getSelectedGender, type PlayerGender } from '../playerAppearance';

interface EndStats {
  cleared: boolean;
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
}

export class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  create(stats: EndStats) {
    if (!stats.cleared) { this.createDefeat(stats); return; }
    const mobile = GAME_W < 700;
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0b0e14);

    // パーティクル風の装飾
    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const c = stats.cleared ? [0xf5c542, 0x3fe0d0, 0xa06bff] : [0x555f70, 0x3a2450];
      g.fillStyle(c[Math.floor(Math.random() * c.length)], 0.3 + Math.random() * 0.4);
      g.fillRect(Math.random() * GAME_W, Math.random() * GAME_H, 3, 3);
    }

    const titleColor = stats.cleared ? '#f5c542' : '#ff6b6b';
    const titleText = stats.cleared ? '🎉 ダンジョン制覇！ 🎉' : '力尽きた…';
    const title = this.add.text(GAME_W / 2, mobile ? 102 : 130, titleText, {
      fontFamily: '"Yu Gothic UI"', fontSize: mobile ? '34px' : '58px', color: titleColor, fontStyle: 'bold'
    }).setOrigin(0.5).setWordWrapWidth(GAME_W - 32);
    title.setStroke('#000000', mobile ? 5 : 8);
    this.tweens.add({ targets: title, scale: 1.06, yoyo: true, repeat: -1, duration: 1000 });

    if (stats.cleared) {
      this.add.text(GAME_W / 2, mobile ? 160 : 195, 'チャリはダンジョンコアへ到達した！', {
        fontFamily: '"Yu Gothic UI"', fontSize: mobile ? '16px' : '22px', color: '#3fe0d0'
      }).setOrigin(0.5).setWordWrapWidth(GAME_W - 36);
    } else {
      this.add.text(GAME_W / 2, mobile ? 160 : 195, `${stats.floor}階でチャリは力尽きた…`, {
        fontFamily: '"Yu Gothic UI"', fontSize: mobile ? '16px' : '22px', color: '#dfe7f0'
      }).setOrigin(0.5).setWordWrapWidth(GAME_W - 36);
    }

    // スコアパネル
    const px = mobile ? 18 : GAME_W / 2 - 260;
    const py = mobile ? 210 : 250;
    const pw = mobile ? GAME_W - 36 : 520;
    const ph = mobile ? 380 : 300;
    const panel = this.add.graphics();
    panel.fillStyle(0x141a26, 0.96).fillRoundedRect(px, py, pw, ph, 12);
    panel.lineStyle(3, 0x3fe0d0).strokeRoundedRect(px, py, pw, ph, 12);

    const rows: [string, string][] = [
      ['到達階層', `${stats.floor} F`],
      ['最終レベル', `Lv. ${stats.level}`],
      ['残りHP', `${stats.hp} / ${stats.hpMax}`],
      ['所持ゴールド', `${stats.gold} G`],
      ['総ターン数', `${stats.turns}`],
      ['モンスター図鑑', `${stats.discovered} / ${stats.totalMonsters}`]
    ];
    let ry = py + (mobile ? 34 : 28);
    for (const [k, v] of rows) {
      this.add.text(px + (mobile ? 24 : 40), ry, k, { fontFamily: '"Yu Gothic UI"', fontSize: mobile ? '16px' : '19px', color: '#8a97ab' });
      this.add.text(px + pw - (mobile ? 24 : 40), ry, v, { fontFamily: '"Yu Gothic UI"', fontSize: mobile ? '16px' : '19px', color: '#dfe7f0' }).setOrigin(1, 0);
      ry += mobile ? 42 : 34;
    }
    // スコア大表示
    this.add.text(px + pw / 2, py + ph - 54, '得点', { fontFamily: '"Yu Gothic UI"', fontSize: '18px', color: '#f5c542' }).setOrigin(0.5);
    const scoreText = this.add.text(px + pw / 2, py + ph - 16, '0', {
      fontFamily: '"Yu Gothic UI"', fontSize: '40px', color: '#f5c542', fontStyle: 'bold'
    }).setOrigin(0.5);
    // スコアカウントアップ演出
    const tmp = { v: 0 };
    this.tweens.add({
      targets: tmp, v: stats.score, duration: 1400, ease: 'Cubic.out',
      onUpdate: () => scoreText.setText(Math.floor(tmp.v).toLocaleString())
    });

    // ボタン
    this.makeButton(GAME_W / 2, mobile ? 670 : 610, '🔄 もう一度挑戦', () => this.scene.start('GameScene'));
    this.makeButton(GAME_W / 2, mobile ? 742 : 680, '🏠 タイトルへ', () => this.scene.start('TitleScene'));

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('GameScene'));
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
    const leave = (scene: string) => { if (leaving) return; leaving = true; this.scene.start(scene); };
    this.defeatButton(mobile ? cx : cx - 166, mobile ? 658 : 640, 'もう一度挑戦', true, () => leave('GameScene'));
    this.defeatButton(mobile ? cx : cx + 166, mobile ? 734 : 640, 'タイトルへ', false, () => leave('TitleScene'));
    this.input.keyboard?.once('keydown-ENTER', () => leave('GameScene'));
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
