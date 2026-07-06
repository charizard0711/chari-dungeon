import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { Audio } from '../audio/manager';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    Audio.playBgm('title');
    // 背景
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x0b0e14);
    const g = this.add.graphics();
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * GAME_W;
      const y = Math.random() * GAME_H;
      const c = [0x3fe0d0, 0xa06bff, 0xf5c542][Math.floor(Math.random() * 3)];
      g.fillStyle(c, 0.2 + Math.random() * 0.4);
      g.fillRect(x, y, 2, 2);
    }

    // ロゴ（アセットシートから切り抜いた実画像を優先）
    const logo = this.add.container(GAME_W / 2, 220);
    if (this.textures.exists('logo')) {
      const img = this.add.image(0, 0, 'logo');
      logo.add(img);
      const sub = this.add.text(0, 130, '〜 30階層 ターン制ローグライク 〜', {
        fontFamily: '"Yu Gothic UI", sans-serif',
        fontSize: '22px',
        color: '#f5c542'
      }).setOrigin(0.5);
      logo.add(sub);
    } else {
      const plate = this.add.graphics();
      plate.fillStyle(0x1a2436, 0.9);
      plate.fillRoundedRect(-360, -90, 720, 180, 16);
      plate.lineStyle(4, 0x3fe0d0, 1);
      plate.strokeRoundedRect(-360, -90, 720, 180, 16);
      logo.add(plate);

      const title = this.add.text(0, -20, 'ちゃりだんじょん', {
        fontFamily: '"Yu Gothic UI", "Meiryo", sans-serif',
        fontSize: '82px',
        fontStyle: 'bold',
        color: '#3fe0d0'
      }).setOrigin(0.5);
      title.setStroke('#0a1f2a', 10);
      title.setShadow(0, 4, '#a06bff', 8, true, true);
      logo.add(title);

      const sub = this.add.text(0, 52, '〜 30階層 ターン制ローグライク 〜', {
        fontFamily: '"Yu Gothic UI", sans-serif',
        fontSize: '22px',
        color: '#f5c542'
      }).setOrigin(0.5);
      logo.add(sub);
    }

    this.tweens.add({ targets: logo, y: 210, yoyo: true, repeat: -1, duration: 2200, ease: 'Sine.inOut' });

    // スタートボタン
    const startBtn = this.makeButton(GAME_W / 2, 430, '▶  冒険をはじめる', 0x2f6f6a, () => {
      this.scene.start('GameScene');
    });
    void startBtn;

    // 操作説明
    const help = [
      '【操作方法】',
      '矢印キー：移動 ／ 敵の方向に進むと自動攻撃',
      'Space / Shift：その場で足踏み（ターン経過）',
      'アイテム欄クリック：使用 ／ 武器・盾欄クリック：装備切替',
      '敵をクリック：ステータス表示',
      '',
      '30Fの階段を降りればクリア！ スコアを競おう。'
    ];
    this.add.text(GAME_W / 2, 540, help.join('\n'), {
      fontFamily: '"Yu Gothic UI", sans-serif',
      fontSize: '19px',
      color: '#dfe7f0',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5, 0);

    // Enterでも開始
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('GameScene'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('GameScene'));
  }

  makeButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    const w = 320, h = 64;
    const draw = (col: number) => {
      bg.clear();
      bg.fillStyle(col, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(3, 0x3fe0d0, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    };
    draw(color);
    const txt = this.add.text(0, 0, label, {
      fontFamily: '"Yu Gothic UI", sans-serif', fontSize: '26px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    c.add([bg, txt]);
    c.setSize(w, h);
    c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    c.on('pointerover', () => { draw(0x3f8f88); this.tweens.add({ targets: c, scale: 1.05, duration: 100 }); });
    c.on('pointerout', () => { draw(color); this.tweens.add({ targets: c, scale: 1.0, duration: 100 }); });
    c.on('pointerdown', () => { Audio.playSe('click'); onClick(); });
    return c;
  }
}
