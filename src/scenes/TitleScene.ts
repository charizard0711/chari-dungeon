import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { Audio } from '../audio/manager';
import {
  getSelectedGender,
  isPlayerGender,
  playerFrameIndex,
  playerSheetKey,
  PlayerGender,
  setSelectedGender
} from '../playerAppearance';
import { showGameLoading } from '../loadingOverlay';

const FONT = '"Yu Gothic UI", "Meiryo", sans-serif';

export class TitleScene extends Phaser.Scene {
  private selectedGender: PlayerGender = getSelectedGender();

  constructor() {
    super('TitleScene');
  }

  create() {
    // ローカルQAだけを無音にする。通常プレイのサウンド設定には影響させない。
    const qaParams = new URLSearchParams(location.search);
    const qaGender = qaParams.get('qa-gender');
    if (location.hostname === 'localhost' && isPlayerGender(qaGender)) {
      this.selectedGender = qaGender;
      setSelectedGender(qaGender);
    } else {
      this.selectedGender = getSelectedGender();
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-silent')) {
      Audio.bgmOn = false;
      Audio.seOn = false;
    }
    Audio.playBgm('title');

    let starting = false;
    const startGame = () => {
      if (starting) return;
      starting = true;
      setSelectedGender(this.selectedGender);
      showGameLoading();
      this.cameras.main.fadeOut(180, 2, 7, 8);
      this.time.delayedCall(190, () => this.scene.start('GameScene'));
    };

    if (GAME_W < 700) this.createMobileTitle(startGame);
    else this.createArtworkTitle(startGame);

    this.input.keyboard?.once('keydown-ENTER', (event: KeyboardEvent) => { event.preventDefault(); startGame(); });
    this.input.keyboard?.once('keydown-SPACE', (event: KeyboardEvent) => { event.preventDefault(); startGame(); });
    if (location.hostname === 'localhost' && qaParams.has('qa-game')) {
      this.time.delayedCall(80, startGame);
    }
  }

  private createArtworkTitle(startGame: () => void) {
    if (!this.textures.exists('title_screen_v2')) {
      this.createMobileTitle(startGame);
      return;
    }

    const art = this.add.image(GAME_W / 2, GAME_H / 2, 'title_screen_v2');
    art.setScale(Math.max(GAME_W / art.width, GAME_H / art.height));

    this.createGenderSelector(GAME_H * 0.64);

    // 画像内の開始ボタンへ操作領域とホバー発光だけを重ねる。
    const buttonY = GAME_H * 0.806;
    const buttonW = 420;
    const buttonH = 108;
    const hover = this.add.graphics().setDepth(2);
    const drawHover = (active: boolean) => {
      hover.clear();
      if (!active) return;
      hover.fillStyle(0x55e6ed, 0.06).fillRoundedRect(GAME_W / 2 - buttonW / 2, buttonY - buttonH / 2, buttonW, buttonH, 14);
      hover.lineStyle(2, 0x6ff7ff, 0.62).strokeRoundedRect(GAME_W / 2 - buttonW / 2, buttonY - buttonH / 2, buttonW, buttonH, 14);
    };
    const startZone = this.add.zone(GAME_W / 2, buttonY, buttonW, buttonH)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });
    startZone.on('pointerover', () => drawHover(true));
    startZone.on('pointerout', () => drawHover(false));
    startZone.on('pointerdown', () => { Audio.playSe('click'); startGame(); });
    startZone.on('pointerup', startGame);

    const help = this.createHelpOverlay();
    this.add.zone(GAME_W / 2, GAME_H * 0.925, 150, 38)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { Audio.playSe('click'); help.setVisible(true); });

    // 画像右下のスピーカーを実際のミュート操作として機能させる。
    const muteMark = this.add.text(GAME_W - 72, GAME_H - 52, '×', {
      fontFamily: FONT,
      fontSize: '30px',
      color: '#ff7b72',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(4).setVisible(!Audio.bgmOn && !Audio.seOn);
    this.add.zone(GAME_W - 72, GAME_H - 52, 48, 48)
      .setDepth(3)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (Audio.seOn) Audio.playSe('click');
        const enable = !(Audio.bgmOn || Audio.seOn);
        if (Audio.bgmOn !== enable) Audio.toggleBgm();
        if (Audio.seOn !== enable) Audio.toggleSe();
        if (Audio.seOn) Audio.playSe('click');
        muteMark.setVisible(!enable);
      });
  }

  private createMobileTitle(startGame: () => void) {
    if (this.textures.exists('dungeon_chamber')) {
      const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'dungeon_chamber');
      bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height)).setTint(0x8fb8b7);
    } else {
      this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x031012);
    }

    const shade = this.add.graphics();
    shade.fillStyle(0x020708, 0.62).fillRect(0, 0, GAME_W, GAME_H);
    shade.fillStyle(0x06333a, 0.28).fillCircle(GAME_W / 2, 410, 235);

    const logoY = 248;
    const logo = this.add.container(GAME_W / 2, logoY);
    if (this.textures.exists('logo')) {
      const image = this.add.image(0, 0, 'logo');
      image.setScale(Math.min(1, (GAME_W - 24) / image.width));
      logo.add(image);
    } else {
      logo.add(this.add.text(0, 0, 'ちゃりだんじょん', {
        fontFamily: FONT,
        fontSize: '48px',
        color: '#f4f1e8',
        fontStyle: 'bold'
      }).setOrigin(0.5).setStroke('#071619', 9));
    }
    this.tweens.add({ targets: logo, y: logoY - 6, yoyo: true, repeat: -1, duration: 2300, ease: 'Sine.inOut' });

    this.add.text(GAME_W / 2, 374, '30階層・ターン制ローグライク', {
      fontFamily: FONT,
      fontSize: '14px',
      color: '#e7b85e',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);

    this.createGenderSelector(468, true);
    this.makeButton(GAME_W / 2, 600, '深層へ降りる', startGame);
    const help = this.createHelpOverlay();
    this.add.text(GAME_W / 2, 678, '遊び方', {
      fontFamily: FONT,
      fontSize: '15px',
      color: '#d5c08b',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { Audio.playSe('click'); help.setVisible(true); });
    this.add.text(GAME_W / 2, GAME_H - 42, '30Fの守護者を倒し、忘却の迷宮を踏破せよ', {
      fontFamily: FONT,
      fontSize: '12px',
      color: '#91a6a7'
    }).setOrigin(0.5);
  }

  private createHelpOverlay() {
    const overlay = this.add.container(0, 0).setDepth(20).setVisible(false);
    const dismiss = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x020708, 0.88)
      .setInteractive({ useHandCursor: true });
    const panelW = Math.min(GAME_W - 36, 620);
    const panelH = GAME_W < 700 ? 330 : 280;
    const panelX = GAME_W / 2 - panelW / 2;
    const panelY = GAME_H / 2 - panelH / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x071a1e, 0.98).fillRoundedRect(panelX, panelY, panelW, panelH, 18);
    panel.lineStyle(2, 0x58d9d1, 0.72).strokeRoundedRect(panelX, panelY, panelW, panelH, 18);
    const title = this.add.text(GAME_W / 2, panelY + 38, '遊び方', {
      fontFamily: FONT,
      fontSize: '22px',
      color: '#ffe09a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    const guide = [
      '移動　矢印キー / 画面の十字ボタン',
      '加速　方向キー / 十字ボタンを長押し',
      '戦闘　敵へ進むと通常攻撃',
      '道具　アイテム欄からクリック / タップ'
    ].join('\n\n');
    const copy = this.add.text(GAME_W / 2, panelY + 86, guide, {
      fontFamily: FONT,
      fontSize: GAME_W < 700 ? '14px' : '16px',
      color: '#dce7e6',
      align: 'left',
      lineSpacing: 4
    }).setOrigin(0.5, 0);
    const close = this.add.text(GAME_W / 2, panelY + panelH - 34, 'タップして閉じる', {
      fontFamily: FONT,
      fontSize: '12px',
      color: '#78999b'
    }).setOrigin(0.5);
    dismiss.on('pointerdown', () => overlay.setVisible(false));
    overlay.add([dismiss, panel, title, copy, close]);
    return overlay;
  }

  private createGenderSelector(y: number, compact = false) {
    const cardW = compact ? 116 : 126;
    const cardH = compact ? 96 : 104;
    const gap = compact ? 10 : 16;
    const centerOffset = (cardW + gap) / 2;
    const cards: {
      gender: PlayerGender;
      container: Phaser.GameObjects.Container;
      background: Phaser.GameObjects.Graphics;
      portrait: Phaser.GameObjects.Image;
    }[] = [];

    this.add.text(GAME_W / 2, y - cardH / 2 - 20, '冒険者を選ぶ', {
      fontFamily: FONT,
      fontSize: compact ? '13px' : '14px',
      color: '#d5c08b',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(4).setStroke('#020708', 4);

    const refresh = () => {
      for (const card of cards) {
        const selected = card.gender === this.selectedGender;
        card.background.clear();
        card.background.fillStyle(selected ? 0x092b30 : 0x07161a, selected ? 0.96 : 0.88)
          .fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
        card.background.lineStyle(2, selected ? 0x67f3ef : 0x53686b, selected ? 1 : 0.72)
          .strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
        if (selected) {
          card.background.fillStyle(0x58d9d1, 0.09)
            .fillRoundedRect(-cardW / 2 + 5, -cardH / 2 + 5, cardW - 10, cardH - 10, 7);
        }
        card.portrait.setAlpha(selected ? 1 : 0.72);
        this.tweens.add({ targets: card.container, scale: selected ? 1.04 : 1, duration: 120, ease: 'Quad.easeOut' });
      }
    };

    const choose = (gender: PlayerGender) => {
      if (this.selectedGender === gender) return;
      this.selectedGender = gender;
      setSelectedGender(gender);
      Audio.playSe('click');
      refresh();
    };

    const options: { gender: PlayerGender; label: string; x: number }[] = [
      { gender: 'male', label: '男性', x: GAME_W / 2 - centerOffset },
      { gender: 'female', label: '女性', x: GAME_W / 2 + centerOffset }
    ];
    for (const option of options) {
      const container = this.add.container(option.x, y).setDepth(4);
      const background = this.add.graphics();
      const portrait = this.add.image(
        0,
        compact ? -9 : -11,
        playerSheetKey(option.gender),
        playerFrameIndex('down', 'idle')
      ).setScale(compact ? 1.62 : 1.78);
      const label = this.add.text(0, cardH / 2 - 13, option.label, {
        fontFamily: FONT,
        fontSize: compact ? '13px' : '14px',
        color: '#f4dfaa',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      container.add([background, portrait, label]);
      container.setSize(cardW, cardH).setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => choose(option.gender));
      cards.push({ gender: option.gender, container, background, portrait });
    }

    const chooseMale = () => choose('male');
    const chooseFemale = () => choose('female');
    this.input.keyboard?.on('keydown-LEFT', chooseMale);
    this.input.keyboard?.on('keydown-RIGHT', chooseFemale);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-LEFT', chooseMale);
      this.input.keyboard?.off('keydown-RIGHT', chooseFemale);
    });
    refresh();
  }

  makeButton(x: number, y: number, label: string, onClick: () => void) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    const w = GAME_W < 700 ? Math.min(350, GAME_W - 56) : 330;
    const h = 68;
    const draw = (hover = false) => {
      bg.clear();
      bg.fillStyle(0x121d20, 0.98).fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.lineStyle(2, hover ? 0x7ff8ff : 0xe7b85e, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      bg.fillStyle(hover ? 0x58d9d1 : 0xe7b85e, hover ? 0.12 : 0.06).fillRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 8);
    };
    draw();
    const text = this.add.text(0, 0, label, {
      fontFamily: FONT,
      fontSize: '22px',
      color: '#ffe1a0',
      fontStyle: 'bold',
      letterSpacing: 1
    }).setOrigin(0.5);
    container.add([bg, text]);
    container.setSize(w + 28, h + 20).setInteractive(
      new Phaser.Geom.Rectangle(-w / 2 - 14, -h / 2 - 10, w + 28, h + 20),
      Phaser.Geom.Rectangle.Contains
    );
    container.on('pointerover', () => { draw(true); this.tweens.add({ targets: container, scale: 1.035, duration: 120 }); });
    container.on('pointerout', () => { draw(false); this.tweens.add({ targets: container, scale: 1, duration: 120 }); });
    container.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.985, duration: 45 });
      Audio.playSe('click');
      onClick();
    });
    // 一部タッチ環境でdownが取りこぼされた場合もupで補完する（開始処理側で二重実行を防止）。
    container.on('pointerup', onClick);
  }
}
