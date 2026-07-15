import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { Audio } from '../audio/manager';

const FONT = '"Yu Gothic UI", "Meiryo", sans-serif';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    Audio.playBgm('title');
    const mobile = GAME_W < 700;

    if (this.textures.exists('dungeon_chamber')) {
      this.add.image(GAME_W / 2, GAME_H / 2, 'dungeon_chamber')
        .setDisplaySize(GAME_W, GAME_H)
        .setTint(0xaac3c0)
        .setAlpha(.82);
    } else {
      this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x061013);
    }

    const shade = this.add.graphics();
    shade.fillStyle(0x020708, .58).fillRect(0, 0, GAME_W, GAME_H);
    shade.fillStyle(0x061416, .78).fillRoundedRect(mobile ? 34 : GAME_W / 2 - 420, mobile ? 42 : 25, mobile ? GAME_W - 68 : 840, mobile ? 890 : 720, 24);
    shade.lineStyle(1, 0x618082, .5).strokeRoundedRect(mobile ? 34 : GAME_W / 2 - 420, mobile ? 42 : 25, mobile ? GAME_W - 68 : 840, mobile ? 890 : 720, 24);
    shade.lineStyle(1, 0xe7b85e, .65).lineBetween(GAME_W / 2 - 180, mobile ? 68 : 60, GAME_W / 2 + 180, mobile ? 68 : 60);

    this.add.text(GAME_W / 2, mobile ? 88 : 82, 'THE FORGOTTEN DEPTHS  /  SEASON I', {
      fontFamily: FONT,
      fontSize: mobile ? '11px' : '12px',
      color: '#65dcd4',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(.5);

    const logoY = mobile ? 225 : 205;
    const logo = this.add.container(GAME_W / 2, logoY);
    if (this.textures.exists('logo')) {
      const img = this.add.image(0, 0, 'logo');
      const maxW = mobile ? 470 : 620;
      if (img.width > maxW) img.setScale(maxW / img.width);
      logo.add(img);
    } else {
      const title = this.add.text(0, 0, 'ちゃりだんじょん', {
        fontFamily: FONT, fontSize: mobile ? '54px' : '76px', fontStyle: 'bold', color: '#f4f1e8'
      }).setOrigin(.5).setStroke('#071619', 10).setShadow(0, 6, '#58d9d1', 16, true, true);
      logo.add(title);
    }
    this.tweens.add({ targets: logo, y: logoY - 7, yoyo: true, repeat: -1, duration: 2300, ease: 'Sine.inOut' });

    this.add.text(GAME_W / 2, mobile ? 346 : 330, '30階層  /  TURN-BASED ROGUELIKE', {
      fontFamily: FONT,
      fontSize: mobile ? '15px' : '16px',
      color: '#e7b85e',
      letterSpacing: 2
    }).setOrigin(.5);

    this.makeButton(GAME_W / 2, mobile ? 425 : 410, '深層へ降りる', () => this.scene.start('GameScene'));

    this.add.text(GAME_W / 2, mobile ? 510 : 500, 'HOW TO EXPLORE', {
      fontFamily: FONT,
      fontSize: '10px',
      color: '#6f898c',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(.5);

    const controls = [
      { key: 'MOVE', value: '矢印キー / 十字ボタン' },
      { key: 'BOOST', value: '長押しで移動速度アップ' },
      { key: 'BATTLE', value: '敵へ進むと自動攻撃' },
      { key: 'ITEM', value: 'クリック / タップで使用' }
    ];
    const startY = mobile ? 552 : 540;
    controls.forEach((control, i) => {
      const y = startY + i * (mobile ? 62 : 43);
      const w = mobile ? 450 : 560;
      const row = this.add.graphics();
      row.fillStyle(0x0a1c20, .88).fillRoundedRect(GAME_W / 2 - w / 2, y, w, mobile ? 48 : 34, 9);
      row.lineStyle(1, 0x315155, .7).strokeRoundedRect(GAME_W / 2 - w / 2, y, w, mobile ? 48 : 34, 9);
      this.add.text(GAME_W / 2 - w / 2 + 18, y + (mobile ? 24 : 17), control.key, {
        fontFamily: FONT, fontSize: '9px', color: '#58d9d1', fontStyle: 'bold', letterSpacing: 2
      }).setOrigin(0, .5);
      this.add.text(GAME_W / 2 + w / 2 - 18, y + (mobile ? 24 : 17), control.value, {
        fontFamily: FONT, fontSize: mobile ? '14px' : '13px', color: '#d4dfde'
      }).setOrigin(1, .5);
    });

    this.add.text(GAME_W / 2, mobile ? 888 : 735, '30Fの守護者を倒し、忘却の迷宮を踏破せよ', {
      fontFamily: FONT,
      fontSize: mobile ? '13px' : '12px',
      color: '#819698'
    }).setOrigin(.5);

    for (let i = 0; i < (mobile ? 18 : 30); i++) {
      const mote = this.add.circle(
        Phaser.Math.Between(48, GAME_W - 48),
        Phaser.Math.Between(80, GAME_H - 50),
        Phaser.Math.Between(1, 3),
        i % 4 === 0 ? 0xe7b85e : 0x58d9d1,
        Phaser.Math.FloatBetween(.08, .3)
      );
      this.tweens.add({ targets: mote, y: mote.y - 35, alpha: 0, duration: Phaser.Math.Between(2200, 4800), repeat: -1, delay: Phaser.Math.Between(0, 2200) });
    }

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('GameScene'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('GameScene'));
    if (location.hostname === 'localhost' && new URLSearchParams(location.search).has('qa-game')) {
      this.time.delayedCall(80, () => this.scene.start('GameScene'));
    }
  }

  makeButton(x: number, y: number, label: string, onClick: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const w = GAME_W < 700 ? 350 : 330;
    const h = 62;
    const draw = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover ? 0x62451f : 0x3b2d1b, .98).fillRoundedRect(-w / 2, -h / 2, w, h, 13);
      bg.lineStyle(2, hover ? 0xffdc8a : 0xe7b85e, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 13);
      bg.fillStyle(0xffd77b, hover ? .12 : .06).fillRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 9);
    };
    draw();
    const text = this.add.text(0, 0, `◆  ${label}`, {
      fontFamily: FONT, fontSize: '22px', color: '#ffe1a0', fontStyle: 'bold', letterSpacing: 1
    }).setOrigin(.5);
    container.add([bg, text]);
    container.setSize(w, h).setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    container.on('pointerover', () => { draw(true); this.tweens.add({ targets: container, scale: 1.035, duration: 120 }); });
    container.on('pointerout', () => { draw(false); this.tweens.add({ targets: container, scale: 1, duration: 120 }); });
    container.on('pointerdown', () => { Audio.playSe('click'); onClick(); });
  }
}
