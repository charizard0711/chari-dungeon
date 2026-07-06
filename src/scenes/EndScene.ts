import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { Audio } from '../audio/manager';

interface EndStats {
  cleared: boolean;
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
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0b0e14);

    // パーティクル風の装飾
    const g = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const c = stats.cleared ? [0xf5c542, 0x3fe0d0, 0xa06bff] : [0x555f70, 0x3a2450];
      g.fillStyle(c[Math.floor(Math.random() * c.length)], 0.3 + Math.random() * 0.4);
      g.fillRect(Math.random() * GAME_W, Math.random() * GAME_H, 3, 3);
    }

    const titleColor = stats.cleared ? '#f5c542' : '#ff6b6b';
    const titleText = stats.cleared ? '🎉 ダンジョン制覇！ 🎉' : 'GAME OVER';
    const title = this.add.text(GAME_W / 2, 130, titleText, {
      fontFamily: '"Yu Gothic UI"', fontSize: '58px', color: titleColor, fontStyle: 'bold'
    }).setOrigin(0.5);
    title.setStroke('#000000', 8);
    this.tweens.add({ targets: title, scale: 1.06, yoyo: true, repeat: -1, duration: 1000 });

    if (stats.cleared) {
      this.add.text(GAME_W / 2, 195, 'チャリはダンジョンコアへ到達した！', {
        fontFamily: '"Yu Gothic UI"', fontSize: '22px', color: '#3fe0d0'
      }).setOrigin(0.5);
    } else {
      this.add.text(GAME_W / 2, 195, `${stats.floor}F でチャリは力尽きた…`, {
        fontFamily: '"Yu Gothic UI"', fontSize: '22px', color: '#dfe7f0'
      }).setOrigin(0.5);
    }

    // スコアパネル
    const px = GAME_W / 2 - 260, py = 250, pw = 520, ph = 300;
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
    let ry = py + 28;
    for (const [k, v] of rows) {
      this.add.text(px + 40, ry, k, { fontFamily: '"Yu Gothic UI"', fontSize: '19px', color: '#8a97ab' });
      this.add.text(px + pw - 40, ry, v, { fontFamily: '"Yu Gothic UI"', fontSize: '19px', color: '#dfe7f0' }).setOrigin(1, 0);
      ry += 34;
    }
    // スコア大表示
    this.add.text(px + pw / 2, py + ph - 46, 'SCORE', { fontFamily: '"Yu Gothic UI"', fontSize: '18px', color: '#f5c542' }).setOrigin(0.5);
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
    this.makeButton(GAME_W / 2, 610, '🔄 もう一度挑戦', () => this.scene.start('GameScene'));
    this.makeButton(GAME_W / 2, 680, '🏠 タイトルへ', () => this.scene.start('TitleScene'));

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('GameScene'));
  }

  makeButton(x: number, y: number, label: string, onClick: () => void) {
    const w = 280, h = 50;
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
