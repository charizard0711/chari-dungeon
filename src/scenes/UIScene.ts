import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { GAME_W, GAME_H } from '../main';
import { IS_MOBILE, MAP_X, MAP_Y, MAP_W, MAP_H } from '../layout';
import { durabilityRisk } from '../combat';
import { weaponFullName } from '../player';
import { getTheme, MAGIC_DESC, MONSTER_DEFS, ITEM_DEFS, plusColor, plusColorHex, isRareItem } from '../data';
import type { MagicCode, ItemKind, Item, Dir } from '../types';
import { shieldFullName } from '../player';
import { Audio } from '../audio/manager';

const COLORS: Record<string, string> = {
  sys: '#d7e3e2', dmg: '#ff7b82', item: '#6fdda8', gold: '#ffd47d', special: '#c9b2ff'
};

export class UIScene extends Phaser.Scene {
  gs!: GameScene;
  logLines: { msg: string; type: string }[] = [];

  topText!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  hpBar!: Phaser.GameObjects.Graphics;
  equipSlots: { tag: string; bg: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text; sub: Phaser.GameObjects.Text; rect: [number, number, number, number] }[] = [];
  codexText?: Phaser.GameObjects.Text; // モンスター図鑑サイドパネル（PCのみ）
  logTexts: Phaser.GameObjects.Text[] = []; // 固定8行（行ごとに色分け）
  itemContainer!: Phaser.GameObjects.Container;
  overlay!: Phaser.GameObjects.Container;
  overlayMode: 'none' | 'equip' | 'inv' | 'codex' | 'settings' | 'shop' | 'gacha' | 'pick' = 'none';
  pickSlot = 0; // 'pick'モードで開いている装備スロット（0武器/1盾/2頭/3体）
  gachaAnimating = false; // ガチャ演出中は再描画をブロック
  enemyInfoText!: Phaser.GameObjects.Text;
  // レイアウト依存の座標（PC / スマホ縦で切り替え）
  L!: {
    hpBar: { x: number; y: number; w: number };
    items: { x: number; y: number; cols: number };
    ov: { x: number; y: number; w: number; h: number };
  };
  equipIconSize = 60;

  constructor() {
    super('UIScene');
  }

  create() {
    this.gs = this.scene.get('GameScene') as GameScene;
    if (this.textures.exists('dungeon_chamber')) {
      this.add.image(GAME_W / 2, GAME_H / 2, 'dungeon_chamber')
        .setDisplaySize(GAME_W, GAME_H)
        .setTint(0x5e8583)
        .setAlpha(.105)
        .setDepth(-100);
    }
    // UIScene起動前に発行されたログ（フロア到達など）を復元
    this.logLines = [...(this.gs.logHistory ?? [])];

    if (IS_MOBILE) {
      // スマホ縦持ち：縦型レイアウト
      this.L = {
        hpBar: { x: 20, y: 114, w: 560 },
        items: { x: 18, y: 622, cols: 9 },
        ov: { x: 10, y: 120, w: 580, h: 760 }
      };
      this.equipIconSize = 52;
      this.buildMobileLayout();
    } else {
      // PC：従来レイアウト
      this.L = {
        hpBar: { x: 938, y: 128, w: 320 },
        items: { x: 730, y: 596, cols: 8 },
        ov: { x: 200, y: 80, w: 680, h: 460 }
      };
      this.equipIconSize = 60;
      this.buildFrames();
      this.buildTopBar();
      this.buildLeftMenu();
      this.buildStatusPanel();
      this.buildBottom();
      // タッチ操作もできるPC（タッチ対応ノート等）では十字ボタンをマップに重ねる
      if (this.sys.game.device.input.touch) this.buildTouchControls(284, 444, 64, 28);
    }

    this.buildTooltip();
    this.overlay = this.add.container(0, 0).setDepth(100).setVisible(false);
    this.enemyInfoText = this.add.text(IS_MOBILE ? MAP_X + 8 : GAME_W - 360, IS_MOBILE ? MAP_Y + 8 : 300, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#dfe7f0',
      backgroundColor: '#0a1420ee', padding: { x: 8, y: 6 }, lineSpacing: 4
    }).setDepth(90).setVisible(false);

    // イベント購読（GameSceneのイベントemitterに登録）
    const gsEvents = this.gs.events;
    const onRefresh = () => this.refresh();
    const onLog = (d: any) => this.addLog(d.msg, d.type);
    const onFloor = () => this.refresh();
    const onEnemy = (info: any) => this.showEnemyInfo(info);
    gsEvents.on('refresh', onRefresh);
    gsEvents.on('log', onLog);
    gsEvents.on('floor', onFloor);
    gsEvents.on('enemyinfo', onEnemy);

    // シーン停止時にリスナーを解除（再起動時の多重登録・破棄済み参照アクセス防止）
    this.events.once('shutdown', () => {
      gsEvents.off('refresh', onRefresh);
      gsEvents.off('log', onLog);
      gsEvents.off('floor', onFloor);
      gsEvents.off('enemyinfo', onEnemy);
    });

    this.refresh();
  }

  // ============ フレーム ============
  panel(x: number, y: number, w: number, h: number, title?: string) {
    const g = this.add.graphics();
    g.fillStyle(0x071518, 0.92);
    g.fillRoundedRect(x, y, w, h, 12);
    g.lineStyle(1, 0x426367, .88);
    g.strokeRoundedRect(x, y, w, h, 12);
    g.lineStyle(1, 0xe7b85e, .26);
    g.lineBetween(x + 14, y + 1, x + Math.min(w - 14, 118), y + 1);
    if (title) {
      this.add.text(x + 12, y + 6, title, {
        fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#65dcd4', fontStyle: 'bold', letterSpacing: 1
      });
    }
    return g;
  }

  buildFrames() {
    // 注意: UISceneはGameSceneの上に重なるため、全画面の背景を描くと
    // マップが完全に隠れてしまう。マップ部分(176,48,740,520)は透過のまま、
    // 枠線だけを描く。
    const g = this.add.graphics();
    g.lineStyle(1, 0x6f8d8e, .8);
    g.strokeRoundedRect(174, 46, 744, 524, 14);
    g.lineStyle(1, 0xe7b85e, .45);
    g.lineBetween(190, 46, 400, 46);
    g.lineBetween(692, 570, 902, 570);
  }

  buildTopBar() {
    this.panel(8, 4, GAME_W - 16, 36);
    this.add.text(20, 9, 'CHARI  /  DEEP RUN', {
      fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#65dcd4', fontStyle: 'bold', letterSpacing: 2
    });
    this.topText = this.add.text(GAME_W - 26, 11, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#f2cf85', fontStyle: 'bold'
    }).setOrigin(1, 0);
  }

  // ============ 左メニュー ============
  buildLeftMenu() {
    this.panel(8, 48, 160, 512, 'NAVIGATION');
    const labels: { t: string; f: () => void }[] = [
      { t: '🧭 探索', f: () => this.setOverlay('none') },
      { t: '⚔ 装備', f: () => this.setOverlay('equip') },
      { t: '🎒 所持品', f: () => this.setOverlay('inv') },
      { t: '🛒 ショップ', f: () => this.setOverlay('shop') },
      { t: '🎰 ガチャ', f: () => this.setOverlay('gacha') },
      { t: '👾 モンスター', f: () => this.setOverlay('codex') },
      { t: '⚙ 設定', f: () => this.showSettings() }
    ];
    let y = 84;
    for (const it of labels) {
      this.menuButton(16, y, 144, 40, it.t, it.f);
      y += 48;
    }
    // ヒント
    this.add.text(16, y + 6, '矢印: 移動\n長押し: BOOST\n敵へ進む: 攻撃', {
      fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#789093', lineSpacing: 5
    });
  }

  menuButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void) {
    const g = this.add.graphics();
    const draw = (c: number, line = 0x315155) => { g.clear(); g.fillStyle(c, .96); g.fillRoundedRect(x, y, w, h, 8); g.lineStyle(1, line, .9); g.strokeRoundedRect(x, y, w, h, 8); };
    draw(0x0d2226);
    const t = this.add.text(x + 12, y + h / 2, label, {
      fontFamily: '"Yu Gothic UI"', fontSize: '15px', color: '#dfe7f0'
    }).setOrigin(0, 0.5);
    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(0x1d4244, 0x58d9d1));
    zone.on('pointerout', () => draw(0x0d2226));
    zone.on('pointerdown', () => { Audio.playSe('click'); onClick(); });
    void t;
  }

  // ============ 右ステータス ============
  // 各要素は固定Y座標に配置（テキストとバーの重なり防止）
  hpLabel!: Phaser.GameObjects.Text;
  atkLabel!: Phaser.GameObjects.Text;

  buildStatusPanel() {
    const x = 924, w = 348;
    // ---- ステータス ----
    this.panel(x, 48, w, 176, 'ステータス');
    const style = { fontFamily: '"Yu Gothic UI"', fontSize: '15px', color: '#dfe7f0' };
    this.statusText = this.add.text(x + 14, 74, '', style);
    this.hpLabel = this.add.text(x + 14, 102, '', style);
    this.hpBar = this.add.graphics();
    this.atkLabel = this.add.text(x + 14, 166, '', style);

    // ---- そうび（武器・盾の2枠を横並びで大きく表示）----
    this.panel(x, 232, w, 234, 'そうび');
    const tags = ['⚔', '🛡'];
    const gx = x + 14, gy = 262;
    const sw = (w - 28 - 8) / 2, sh = 190, gapx = 8;
    this.equipSlots = [];
    for (let i = 0; i < 2; i++) {
      const sx = gx + i * (sw + gapx), sy = gy;
      const bg = this.add.graphics();
      const icon = this.add.image(sx + sw / 2, sy + 76, 'coin').setDisplaySize(60, 60);
      this.add.text(sx + 8, sy + 6, tags[i], { fontFamily: '"Yu Gothic UI"', fontSize: '15px' });
      const name = this.add.text(sx + sw / 2, sy + 118, '', {
        fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#dfe7f0', align: 'center',
        wordWrap: { width: sw - 10 }
      }).setOrigin(0.5, 0);
      const sub = this.add.text(sx + sw / 2, sy + sh - 24, '', {
        fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#9fb4c4', align: 'center'
      }).setOrigin(0.5, 0);
      this.equipSlots.push({ tag: tags[i], bg, icon, name, sub, rect: [sx, sy, sw, sh] });
      // クリックで装備変更ポップアップを開く
      const slotIndex = i;
      const zone = this.add.zone(sx, sy, sw, sh).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.showTooltip('装備を変更', 'クリックで持っている装備から選べる', sx + sw / 2, sy + 8));
      zone.on('pointerout', () => this.hideTooltip());
      zone.on('pointerdown', () => {
        Audio.playSe('click');
        this.hideTooltip();
        this.pickSlot = slotIndex;
        this.setOverlay('pick');
      });
    }

    // ---- モンスター図鑑 ----
    this.panel(x, 474, w, 86, 'モンスター図鑑');
    this.codexText = this.add.text(x + 14, 502, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#dfe7f0', lineSpacing: 3, wordWrap: { width: w - 28 }
    });
  }

  // ============ 下部 ============
  buildBottom() {
    // ログ（最新8行のみ表示。パネルからはみ出さない固定行）
    this.panel(8, 568, 700, 184, '冒険ログ');
    this.logTexts = [];
    for (let i = 0; i < 8; i++) {
      this.logTexts.push(this.add.text(20, 594 + i * 18.5, '', {
        fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#dfe7f0'
      }));
    }
    // アイテム欄
    this.panel(716, 568, GAME_W - 724, 184, '所持アイテム（クリックで使用）');
    this.itemContainer = this.add.container(0, 0);
    // ターン終了ボタン
    this.turnEndButton();
  }

  // ============ スマホ縦型レイアウト ============
  buildMobileLayout() {
    // ---- 上部バー（タイトル＋フロア情報）----
    this.panel(8, 8, 584, 52);
    this.add.text(16, 12, 'ちゃりだんじょん', {
      fontFamily: '"Yu Gothic UI"', fontSize: '17px', color: '#3fe0d0', fontStyle: 'bold'
    });
    this.topText = this.add.text(16, 34, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#f5c542'
    });

    // ---- ステータス ----
    this.panel(8, 66, 584, 94);
    const style = { fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#dfe7f0' };
    this.statusText = this.add.text(20, 74, '', style);
    this.hpLabel = this.add.text(20, 94, '', style);
    this.hpBar = this.add.graphics();
    this.atkLabel = this.add.text(20, 136, '', { ...style, fontSize: '13px' });

    // ---- マップ枠 ----
    const fg = this.add.graphics();
    fg.lineStyle(2, 0x2f6f6a, 1).strokeRoundedRect(MAP_X - 2, MAP_Y - 2, MAP_W + 4, MAP_H + 4, 4);

    // ---- そうび（右カラム・縦2枠）----
    this.panel(436, MAP_Y, 156, MAP_H, 'そうび');
    const tags = ['⚔', '🛡'];
    this.equipSlots = [];
    for (let i = 0; i < 2; i++) {
      const sx = 444, sy = MAP_Y + 34 + i * 138, sw = 140, sh = 128;
      const bg = this.add.graphics();
      const icon = this.add.image(sx + sw / 2, sy + 44, 'coin').setDisplaySize(52, 52);
      this.add.text(sx + 6, sy + 4, tags[i], { fontFamily: '"Yu Gothic UI"', fontSize: '13px' });
      const name = this.add.text(sx + sw / 2, sy + 76, '', {
        fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#dfe7f0', align: 'center',
        wordWrap: { width: sw - 8 }
      }).setOrigin(0.5, 0);
      const sub = this.add.text(sx + sw / 2, sy + sh - 16, '', {
        fontFamily: '"Yu Gothic UI"', fontSize: '10px', color: '#9fb4c4', align: 'center'
      }).setOrigin(0.5, 0);
      this.equipSlots.push({ tag: tags[i], bg, icon, name, sub, rect: [sx, sy, sw, sh] });
      const slotIndex = i;
      const zone = this.add.zone(sx, sy, sw, sh).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => { Audio.playSe('click'); this.pickSlot = slotIndex; this.setOverlay('pick'); });
    }

    // ---- もちもの（マップ下の横1列）----
    this.panel(8, 594, 584, 86, 'もちもの（タップで使用）');
    this.itemContainer = this.add.container(0, 0);

    // ---- 冒険ログ（2行）----
    this.panel(8, 688, 584, 64, '冒険ログ');
    this.logTexts = [];
    for (let i = 0; i < 2; i++) {
      this.logTexts.push(this.add.text(20, 710 + i * 18, '', {
        fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#dfe7f0'
      }));
    }

    // ---- 操作エリア：十字キー＋ターン終了 ----
    this.buildTouchControls(108, 846, 58, 30);
    this.mobileTurnEndButton();

    // ---- 下部ナビ（メニュー）----
    this.buildMobileNav();
  }

  mobileTurnEndButton() {
    const x = 330, y = 780, w = 254, h = 132;
    const g = this.add.graphics();
    const draw = (c: number) => {
      g.clear();
      g.fillStyle(c, 1).fillRoundedRect(x, y, w, h, 12);
      g.lineStyle(2.5, 0x3fe0d0).strokeRoundedRect(x, y, w, h, 12);
    };
    draw(0x2f6f6a);
    this.add.text(x + w / 2, y + h / 2 - 14, '⏭ ターン終了', {
      fontFamily: '"Yu Gothic UI"', fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(x + w / 2, y + h / 2 + 20, '（その場で1ターン休む）', {
      fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#bfe8e0'
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(0x3f8f88));
    zone.on('pointerout', () => draw(0x2f6f6a));
    zone.on('pointerdown', () => { Audio.playSe('click'); this.gs.playerAct('wait'); });
  }

  buildMobileNav() {
    const items: { icon: string; label: string; f: () => void }[] = [
      { icon: '⚔', label: '装備', f: () => this.setOverlay('equip') },
      { icon: '🎒', label: '所持品', f: () => this.setOverlay('inv') },
      { icon: '🛒', label: 'ショップ', f: () => this.setOverlay('shop') },
      { icon: '🎰', label: 'ガチャ', f: () => this.setOverlay('gacha') },
      { icon: '👾', label: '図鑑', f: () => this.setOverlay('codex') },
      { icon: '⚙', label: '設定', f: () => this.showSettings() }
    ];
    this.panel(8, 944, 584, 52);
    items.forEach((it, i) => {
      const x = 14 + i * 96, y = 948, w = 92, h = 44;
      const g = this.add.graphics();
      const draw = (c: number) => { g.clear(); g.fillStyle(c, 1).fillRoundedRect(x, y, w, h, 6); };
      draw(0x1c2536);
      this.add.text(x + w / 2, y + 13, it.icon, { fontSize: '15px' }).setOrigin(0.5);
      this.add.text(x + w / 2, y + 32, it.label, {
        fontFamily: '"Yu Gothic UI"', fontSize: '10px', color: '#dfe7f0'
      }).setOrigin(0.5);
      const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => { draw(0x264a48); Audio.playSe('click'); it.f(); });
      zone.on('pointerup', () => draw(0x1c2536));
      zone.on('pointerout', () => draw(0x1c2536));
    });
  }

  // ---- タッチ操作：十字ボタン（スマホ=操作エリア、タッチPC=マップ左下に重ねる）----
  // 押しっぱなしで歩き続ける（GameScene.touchDir 経由でキーボード長押しと同じ扱い）
  buildTouchControls(cx: number, cy: number, gap: number, R: number) {
    const mkButton = (dx: number, dy: number, angleDeg: number | null, onDown: () => void, onUp?: () => void) => {
      const bx = cx + dx, by = cy + dy;
      const g = this.add.graphics().setDepth(60);
      const draw = (active: boolean) => {
        g.clear();
        g.fillStyle(active ? 0x2f6f6a : 0x0e1420, active ? 0.9 : 0.5).fillCircle(bx, by, R);
        g.lineStyle(2, 0x3fe0d0, 0.75).strokeCircle(bx, by, R);
        if (angleDeg !== null) {
          // 進行方向を指す三角矢印
          const a = Phaser.Math.DegToRad(angleDeg);
          const pt = (r: number, da: number): [number, number] =>
            [bx + Math.cos(a + da) * r, by + Math.sin(a + da) * r];
          const [x1, y1] = pt(14, 0);
          const [x2, y2] = pt(12, 2.5);
          const [x3, y3] = pt(12, -2.5);
          g.fillStyle(0xdfe7f0, 0.95).fillTriangle(x1, y1, x2, y2, x3, y3);
        } else {
          // 中央ボタン＝足踏み（1ターン休む）
          g.fillStyle(0xdfe7f0, 0.9).fillCircle(bx, by, 7);
        }
      };
      draw(false);
      const zone = this.add.zone(bx - R - 8, by - R - 8, (R + 8) * 2, (R + 8) * 2)
        .setOrigin(0).setInteractive().setDepth(61);
      zone.on('pointerdown', () => { draw(true); onDown(); });
      const release = () => { draw(false); onUp?.(); };
      zone.on('pointerup', release);
      zone.on('pointerout', release);
    };
    const hold = (d: Dir) => () => { this.gs.touchDir = d; };
    const release = () => { this.gs.touchDir = null; };
    mkButton(0, -gap, -90, hold('up'), release);
    mkButton(0, gap, 90, hold('down'), release);
    mkButton(-gap, 0, 180, hold('left'), release);
    mkButton(gap, 0, 0, hold('right'), release);
    mkButton(0, 0, null, () => { Audio.playSe('click'); this.gs.playerAct('wait'); });
  }

  turnEndButton() {
    const x = GAME_W - 168, y = 712, w = 150, h = 34;
    const g = this.add.graphics();
    const draw = (c: number) => { g.clear(); g.fillStyle(c, 1); g.fillRoundedRect(x, y, w, h, 6); g.lineStyle(2, 0x3fe0d0); g.strokeRoundedRect(x, y, w, h, 6); };
    draw(0x2f6f6a);
    this.add.text(x + w / 2, y + h / 2, '⏭ ターン終了', {
      fontFamily: '"Yu Gothic UI"', fontSize: '15px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(0x3f8f88));
    zone.on('pointerout', () => draw(0x2f6f6a));
    zone.on('pointerdown', () => { Audio.playSe('click'); this.gs.playerAct('wait'); });
  }

  // ============ リフレッシュ ============
  refresh() {
    const p = this.gs.player;
    const th = getTheme(this.gs.floor);

    const boost = this.gs.holdBoostTier === 2 ? '  ⚡MAX BOOST' : this.gs.holdBoostTier === 1 ? '  ⚡BOOST' : '';
    this.topText.setText(`${String(this.gs.floor).padStart(2, '0')}F / 30F  ${th.name}   SCORE ${this.gs.score}   TURN ${this.gs.turn}${boost}`);

    this.statusText.setText(`${p.name}  Lv.${p.level}   (EXP ${p.exp}/${p.expNext})`);
    this.hpLabel.setText(`HP  ${p.hp} / ${p.hpMax}`);
    this.atkLabel.setText(`攻撃力 ${p.atkMin}-${p.atkMax}   防御力 ${p.def}   💰 ${p.gold} G`);

    // HPバー（ラベルの下の固定位置。座標はレイアウト設定から）
    const { x: bx, y: by, w: bw } = this.L.hpBar;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x2a1518).fillRect(bx, by, bw, 14);
    this.hpBar.fillStyle(0xff5a5a).fillRect(bx, by, bw * Math.max(0, p.hp / p.hpMax), 14);

    const w = p.weapon, s = p.shield;
    const slotInfo: { tex: string | null; name: string; sub: string; plus: number }[] = [
      w ? { tex: w.key, name: w.name, sub: `耐久 ${w.dur}/${w.durMax}`, plus: w.plus }
        : { tex: null, name: '素手', sub: '', plus: 0 },
      w?.dual ? { tex: w.key, name: w.name, sub: '二刀流・左手', plus: w.plus }
        : s ? { tex: s.key, name: s.name, sub: `防 +${s.defBonus + s.plus}  耐久 ${s.dur}/${s.durMax}`, plus: s.plus }
        : { tex: null, name: 'なし', sub: '', plus: 0 }
    ];
    this.equipSlots.forEach((slot, i) => {
      const info = slotInfo[i];
      const [sx, sy, sw, sh] = slot.rect;
      const has = info.tex !== null;
      const rim = info.plus > 0 ? plusColor(info.plus) : 0x2f6f6a;
      slot.bg.clear();
      slot.bg.fillStyle(0x0a1c20, has ? .96 : 0.5).fillRoundedRect(sx, sy, sw, sh, 10);
      slot.bg.lineStyle(info.plus > 0 ? 2 : 1.5, rim, has ? 1 : 0.5).strokeRoundedRect(sx, sy, sw, sh, 8);
      if (has) {
        slot.icon.setTexture(info.tex!).setDisplaySize(this.equipIconSize, this.equipIconSize).setVisible(true).setAlpha(1);
      } else {
        slot.icon.setVisible(false);
      }
      const nameCol = info.plus > 0 ? plusColorHex(info.plus) : '#e6eef7';
      slot.name.setText(info.name + (info.plus > 0 ? ` +${info.plus}` : '')).setColor(has ? nameCol : '#6b7c8c');
      slot.sub.setText(info.sub);
    });

    // 図鑑（サイドパネルはPCのみ。詳細は図鑑オーバーレイで）
    if (this.codexText) {
      const found = MONSTER_DEFS.filter((m) => this.gs.discovered.has(m.key));
      const recent = found.slice(-3).map((m) => m.name).join('、');
      this.codexText.setText(
        `発見数: ${found.length} / ${MONSTER_DEFS.length}` +
        (found.length ? `\n最近: ${recent}\n（「👾モンスター」で一覧）` : '\n（まだ発見していない）')
      );
    }

    this.rebuildItems();
    this.renderLog();
    if (this.overlayMode !== 'none') this.rebuildOverlay();
  }

  // 同じ種類のアイテムをまとめて {kind, count, firstIndex} にする
  stackInventory(inv: Item[]): { kind: ItemKind; item: Item; count: number; firstIndex: number }[] {
    const groups: { kind: ItemKind; item: Item; count: number; firstIndex: number }[] = [];
    inv.forEach((it, i) => {
      const g = groups.find((g) => g.kind === it.kind);
      if (g) g.count++;
      else groups.push({ kind: it.kind, item: it, count: 1, firstIndex: i });
    });
    return groups;
  }

  rebuildItems() {
    this.itemContainer.removeAll(true);
    const p = this.gs.player;
    const { x: startX, y: startY, cols } = this.L.items;
    const cell = 62;
    const groups = this.stackInventory(p.inventory);
    groups.forEach((grp, i) => {
      const cx = startX + (i % cols) * cell;
      const cy = startY + Math.floor(i / cols) * 74;
      const rare = isRareItem(grp.kind);
      const frameCol = rare ? 0xff4040 : 0x2f6f6a;      // レアは赤枠
      const frameHover = rare ? 0xff8080 : 0x3fe0d0;
      const bg = this.add.graphics();
      const drawBg = (fill: number, line: number, lw = 1.5) => { bg.clear(); bg.fillStyle(fill, 1).fillRoundedRect(cx, cy, 54, 54, 6); bg.lineStyle(lw, line).strokeRoundedRect(cx, cy, 54, 54, 6); };
      drawBg(0x1c2536, frameCol, rare ? 2.5 : 1.5);
      // 枠だけ＋アイコン（名前は省略／カーソルでツールチップ表示）
      const icon = this.add.image(cx + 27, cy + 27, grp.item.textureKey).setDisplaySize(36, 36);
      this.itemContainer.add([bg, icon]);
      // ×N（2個以上のとき）
      if (grp.count > 1) {
        const cnt = this.add.text(cx + 50, cy + 50, `×${grp.count}`, {
          fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
          backgroundColor: '#000000aa', padding: { x: 2, y: 0 }
        }).setOrigin(1, 1);
        this.itemContainer.add(cnt);
      }
      const zone = this.add.zone(cx, cy, 54, 54).setOrigin(0).setInteractive({ useHandCursor: true });
      const cntSuffix = grp.count > 1 ? ` ×${grp.count}` : '';
      zone.on('pointerover', () => { drawBg(0x264a48, frameHover, rare ? 2.5 : 1.5); this.showTooltip((rare ? '★' : '') + grp.item.name + cntSuffix, grp.item.desc, cx + 27, cy); });
      zone.on('pointerout', () => { drawBg(0x1c2536, frameCol, rare ? 2.5 : 1.5); this.hideTooltip(); });
      zone.on('pointerdown', () => { this.hideTooltip(); this.gs.useItem(grp.firstIndex); });
      this.itemContainer.add(zone);
    });
    if (groups.length === 0) {
      this.itemContainer.add(this.add.text(startX, startY + 10, 'アイテムを持っていない', {
        fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#8a97ab'
      }));
    }
  }

  addLog(msg: string, type = 'sys') {
    this.logLines.push({ msg, type });
    // 古いログは捨てて常に最新8行だけ保持（パネルはみ出し防止）
    if (this.logLines.length > 8) this.logLines.shift();
    this.renderLog();
  }

  renderLog() {
    const n = this.logTexts.length;
    const lines = this.logLines.slice(-n);
    for (let i = 0; i < n; i++) {
      const t = this.logTexts[i];
      if (!t) continue;
      const l = lines[i];
      if (l) {
        t.setText(l.msg);
        t.setColor(COLORS[l.type] ?? COLORS.sys);
        // 最新行だけ少し強調
        t.setAlpha(i === lines.length - 1 ? 1 : 0.75);
      } else {
        t.setText('');
      }
    }
  }

  // ---- アイテムのツールチップ（カーソルで名前+説明）----
  tooltipBg!: Phaser.GameObjects.Graphics;
  tooltipTitle!: Phaser.GameObjects.Text;
  tooltipDesc!: Phaser.GameObjects.Text;
  tooltip!: Phaser.GameObjects.Container;

  buildTooltip() {
    this.tooltipBg = this.add.graphics();
    this.tooltipTitle = this.add.text(0, 0, '', { fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#3fe0d0', fontStyle: 'bold' });
    this.tooltipDesc = this.add.text(0, 0, '', { fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#dfe7f0', wordWrap: { width: 220 } });
    this.tooltip = this.add.container(0, 0, [this.tooltipBg, this.tooltipTitle, this.tooltipDesc]).setDepth(200).setVisible(false);
  }

  showTooltip(title: string, desc: string, anchorX: number, anchorY: number) {
    this.tooltipTitle.setText(title).setPosition(10, 8);
    this.tooltipDesc.setText(desc).setPosition(10, 28);
    const w = Math.max(this.tooltipTitle.width, this.tooltipDesc.width) + 20;
    const h = 28 + this.tooltipDesc.height + 8;
    this.tooltipBg.clear();
    this.tooltipBg.fillStyle(0x0a1420, 0.97).fillRoundedRect(0, 0, w, h, 6);
    this.tooltipBg.lineStyle(1.5, 0x3fe0d0).strokeRoundedRect(0, 0, w, h, 6);
    // アイテム欄の上に出す（画面内に収める）
    let tx = anchorX - w / 2;
    tx = Math.max(8, Math.min(GAME_W - w - 8, tx));
    const ty = anchorY - h - 8;
    this.tooltip.setPosition(tx, ty).setVisible(true);
  }

  hideTooltip() {
    this.tooltip.setVisible(false);
  }

  showEnemyInfo(info: any) {
    this.enemyInfoText.setText([
      `【${info.name}】`,
      `HP: ${info.hp}/${info.hpMax}`,
      `攻撃: ${info.atk}  防御: ${info.def}`,
      `行動: ${info.behavior}`
    ].join('\n')).setVisible(true);
    this.time.delayedCall(3000, () => this.enemyInfoText.setVisible(false));
  }

  // ============ オーバーレイ ============
  setOverlay(mode: 'none' | 'equip' | 'inv' | 'codex' | 'settings' | 'shop' | 'gacha' | 'pick') {
    if (this.gachaAnimating) return; // 演出中は切替禁止
    this.overlayMode = mode;
    if (mode === 'none') { this.overlay.setVisible(false); return; }
    this.overlay.setVisible(true);
    this.rebuildOverlay();
  }

  rebuildOverlay() {
    if (this.gachaAnimating) return; // 演出中に消さない
    this.overlay.removeAll(true);
    const { x, y, w, h } = this.L.ov;
    const g = this.add.graphics();
    g.fillStyle(0x0e1420, 0.98).fillRoundedRect(x, y, w, h, 10);
    g.lineStyle(2, 0x3fe0d0).strokeRoundedRect(x, y, w, h, 10);
    this.overlay.add(g);

    const pickTitles = ['⚔ 武器を変更', '🛡 盾を変更'];
    const title =
      this.overlayMode === 'equip' ? '⚔ 装備（クリックで装備）' :
      this.overlayMode === 'inv' ? '🎒 所持品' :
      this.overlayMode === 'settings' ? '⚙ 設定（サウンド）' :
      this.overlayMode === 'shop' ? '🛒 ショップ（クリックで購入）' :
      this.overlayMode === 'gacha' ? '🎰 ダンジョンガチャ' :
      this.overlayMode === 'pick' ? pickTitles[this.pickSlot] :
      '👾 モンスター図鑑';
    this.overlay.add(this.add.text(x + 16, y + 12, title, { fontFamily: '"Yu Gothic UI"', fontSize: '18px', color: '#3fe0d0', fontStyle: 'bold' }));
    // 閉じるボタン
    const cb = this.add.text(x + w - 34, y + 10, '✕', { fontFamily: 'sans-serif', fontSize: '22px', color: '#ff6b6b' }).setInteractive({ useHandCursor: true });
    cb.on('pointerdown', () => { Audio.playSe('click'); this.setOverlay('none'); });
    this.overlay.add(cb);

    if (this.overlayMode === 'equip') this.buildEquipOverlay(x, y, w);
    else if (this.overlayMode === 'inv') this.buildInvOverlay(x, y, w);
    else if (this.overlayMode === 'settings') this.buildSettingsOverlay(x, y, w);
    else if (this.overlayMode === 'shop') this.buildShopOverlay(x, y, w);
    else if (this.overlayMode === 'gacha') this.buildGachaOverlay(x, y, w, h);
    else if (this.overlayMode === 'pick') this.buildPickOverlay(x, y, w);
    else this.buildCodexOverlay(x, y, w);
  }

  // ---- 装備スロットから開く「装備変更」ポップアップ ----
  buildPickOverlay(x: number, y: number, w: number) {
    const p = this.gs.player;
    let cy = y + 52;
    const empty = (msg: string) => {
      this.overlay.add(this.add.text(x + 20, cy, msg, { fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#8a97ab' }));
    };

    if (this.pickSlot === 0) {
      // 武器
      if (p.weapons.length === 0) { empty('（武器を持っていない）'); return; }
      p.weapons.forEach((wp, i) => {
        const equipped = wp === p.weapon;
        const risk = durabilityRisk(wp.dur, wp.durMax);
        const frameCol = (wp.plus ?? 0) > 0 ? plusColor(wp.plus) : 0x2f6f6a;
        const icon = this.framedIcon(x + 34, cy + 16, wp.key, frameCol);
        const row = this.rowButton(x + 58, cy, w - 74, `${equipped ? '▶ ' : '　'}${weaponFullName(wp)}  攻${wp.atkMin}-${wp.atkMax}  耐久${wp.dur}/${wp.durMax}(${risk.label})`, equipped, () => this.gs.equipWeapon(i));
        this.overlay.add([...icon, row]);
        cy += 38;
      });
    } else {
      // 盾
      if (p.weapon?.dual) {
        this.overlay.add(this.add.text(x + 20, cy, '⚠ 二刀流中は盾を持てない（武器を持ち替えれば装備できる）', {
          fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#f5c542'
        }));
        cy += 32;
      }
      if (p.shields.length === 0) { empty('（盾を持っていない）'); return; }
      p.shields.forEach((sh, i) => {
        const equipped = sh === p.shield;
        const risk = durabilityRisk(sh.dur, sh.durMax);
        const frameCol = (sh.plus ?? 0) > 0 ? plusColor(sh.plus) : 0x2f6f6a;
        const icon = this.framedIcon(x + 34, cy + 16, sh.key, frameCol);
        const totalDef = sh.defBonus + (sh.plus ?? 0);
        const row = this.rowButton(x + 58, cy, w - 74, `${equipped ? '▶ ' : '　'}${shieldFullName(sh)}  防御+${totalDef}  耐久${sh.dur}/${sh.durMax}(${risk.label})`, equipped, () => this.gs.equipShield(i));
        this.overlay.add([...icon, row]);
        cy += 38;
      });
    }
  }

  // 四角い枠つきアイコン（枠色を指定できる）
  framedIcon(cx: number, cy: number, texKey: string, frameColor: number, box = 36): Phaser.GameObjects.GameObject[] {
    const g = this.add.graphics();
    const hs = box / 2;
    g.fillStyle(0x10161f, 1).fillRoundedRect(cx - hs, cy - hs, box, box, 6);
    g.lineStyle(2.5, frameColor).strokeRoundedRect(cx - hs, cy - hs, box, box, 6);
    const icon = this.add.image(cx, cy, texKey).setDisplaySize(box - 8, box - 8);
    return [g, icon];
  }

  buildEquipOverlay(x: number, y: number, w: number) {
    const p = this.gs.player;
    let cy = y + 48;
    this.overlay.add(this.add.text(x + 16, cy, '── 武器 ──', { fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#f5c542' }));
    cy += 26;
    if (p.weapons.length === 0) { this.overlay.add(this.add.text(x + 20, cy, '（武器なし・素手で戦っています）', { fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#8a97ab' })); cy += 30; }
    p.weapons.forEach((wp, i) => {
      const equipped = wp === p.weapon;
      const risk = durabilityRisk(wp.dur, wp.durMax);
      // 枠の色は強化値で変化（+1黄/+2紫/+3青/+4赤、未強化はテール）
      const frameCol = (wp.plus ?? 0) > 0 ? plusColor(wp.plus) : 0x2f6f6a;
      const icon = this.framedIcon(x + 34, cy + 16, wp.key, frameCol);
      const row = this.rowButton(x + 58, cy, w - 74, `${equipped ? '▶ ' : '　'}${weaponFullName(wp)}  耐久${wp.dur}/${wp.durMax}(${risk.label})`, equipped, () => this.gs.equipWeapon(i));
      this.overlay.add([...icon, row]);
      cy += 38;
    });
    cy += 10;
    this.overlay.add(this.add.text(x + 16, cy, '── 盾 ──', { fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#f5c542' }));
    cy += 26;
    if (p.shields.length === 0) { this.overlay.add(this.add.text(x + 20, cy, '（盾なし）', { fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#8a97ab' })); cy += 30; }
    p.shields.forEach((sh, i) => {
      const equipped = sh === p.shield;
      const risk = durabilityRisk(sh.dur, sh.durMax);
      const frameCol = (sh.plus ?? 0) > 0 ? plusColor(sh.plus) : 0x2f6f6a;
      const icon = this.framedIcon(x + 34, cy + 16, sh.key, frameCol);
      const totalDef = sh.defBonus + (sh.plus ?? 0);
      const row = this.rowButton(x + 58, cy, w - 74, `${equipped ? '▶ ' : '　'}${shieldFullName(sh)}  防御+${totalDef}  耐久${sh.dur}/${sh.durMax}(${risk.label})`, equipped, () => this.gs.equipShield(i));
      this.overlay.add([...icon, row]);
      cy += 38;
    });

  }

  buildInvOverlay(x: number, y: number, w: number) {
    const p = this.gs.player;
    let cy = y + 52;
    const groups = this.stackInventory(p.inventory);
    if (groups.length === 0) this.overlay.add(this.add.text(x + 16, cy, 'アイテムはありません。', { fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#8a97ab' }));
    groups.forEach((grp) => {
      const cntLabel = grp.count > 1 ? ` ×${grp.count}` : '';
      const icon = this.add.image(x + 30, cy + 14, grp.item.textureKey).setDisplaySize(26, 26);
      const row = this.rowButton(x + 48, cy, w - 64, `${grp.item.name}${cntLabel} — ${grp.item.desc}`, false, () => { this.gs.useItem(grp.firstIndex); this.setOverlay('inv'); });
      this.overlay.add([icon, row]);
      cy += 34;
    });
  }

  buildCodexOverlay(x: number, y: number, w: number) {
    const columns = w >= 640 ? 4 : 3;
    const gap = 6;
    const rowH = 30;
    const colW = (w - 32 - gap * (columns - 1)) / columns;
    const startY = y + 50;
    MONSTER_DEFS.forEach((m, i) => {
      const found = this.gs.discovered.has(m.key);
      const col = i % columns;
      const px = x + 16 + col * (colW + gap);
      const py = startY + Math.floor(i / columns) * rowH;
      const card = this.add.graphics();
      card.fillStyle(found ? 0x152235 : 0x111824, 0.92).fillRoundedRect(px, py, colW, rowH - 3, 4);
      card.lineStyle(1, found ? m.color : 0x2b3442, found ? 0.72 : 0.45)
        .strokeRoundedRect(px, py, colW, rowH - 3, 4);
      this.overlay.add(card);

      if (found) {
        const icon = this.add.image(px + 14, py + 13, m.key).setDisplaySize(24, 24);
        this.overlay.add(icon);
      } else {
        this.overlay.add(this.add.text(px + 14, py + 13, '?', {
          fontFamily: 'Georgia', fontSize: '15px', color: '#495568', fontStyle: 'bold'
        }).setOrigin(0.5));
      }

      const name = found ? m.name : '未発見';
      this.overlay.add(this.add.text(px + 29, py + 3, name, {
        fontFamily: '"Yu Gothic UI"', fontSize: '10px', color: found ? '#eef5ff' : '#596579', fontStyle: 'bold'
      }));
      this.overlay.add(this.add.text(px + 29, py + 15, found ? `HP${m.hp}  攻${m.atkMin}-${m.atkMax}  防${m.def}` : `???  B${m.minFloor}-${m.maxFloor}`, {
        fontFamily: '"Yu Gothic UI"', fontSize: '8px', color: found ? '#8fc8d7' : '#465264'
      }));
    });
  }

  // ---- ショップ：ゴールドで消耗品と強化石を購入 ----
  buildShopOverlay(x: number, y: number, w: number) {
    // 消耗品に加えて、武器強化石・盾強化石も購入できる
    const shop: { kind: ItemKind; price: number }[] = [
      { kind: 'potion', price: 25 },
      { kind: 'dash', price: 60 },
      { kind: 'invis', price: 100 },
      { kind: 'stone', price: 120 },
      { kind: 'shieldstone', price: 120 }
    ];
    // 所持ゴールド表示（右端の✕ボタンと重ならないよう左に寄せる）
    const goldText = this.add.text(x + w - 60, y + 16, `所持 ${this.gs.player.gold} G`, {
      fontFamily: '"Yu Gothic UI"', fontSize: '16px', color: '#f5c542', fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.overlay.add(goldText);

    let cy = y + 52;
    shop.forEach((s) => {
      const def = ITEM_DEFS[s.kind];
      const afford = this.gs.player.gold >= s.price;
      const icon = this.add.image(x + 32, cy + 15, def.textureKey).setDisplaySize(28, 28);
      if (!afford) icon.setAlpha(0.4);
      const label = `${def.name}  —  ${s.price} G   （${def.desc}）`;
      const row = this.rowButton(x + 52, cy, w - 68, label, false, () => {
        if (this.gs.buyItem(s.kind, s.price)) this.setOverlay('shop'); // 買えたら再描画（ゴールド更新）
      });
      if (!afford) row.setAlpha(0.55);
      this.overlay.add([icon, row]);
      cy += 34;
    });
  }

  // ============ ガチャ ============
  buildGachaOverlay(x: number, y: number, w: number, h: number) {
    const p = this.gs.player;
    // 所持ゴールド（右端の✕ボタンと重ならないよう左に寄せる）
    this.overlay.add(this.add.text(x + w - 60, y + 16, `所持 ${p.gold} G`, {
      fontFamily: '"Yu Gothic UI"', fontSize: '16px', color: '#f5c542', fontStyle: 'bold'
    }).setOrigin(1, 0));

    this.overlay.add(this.add.text(x + w / 2, y + 54, 'ARCANE  RELIQUARY', {
      fontFamily: '"Yu Gothic UI"', fontSize: '10px', color: '#58d9d1', fontStyle: 'bold', letterSpacing: 4
    }).setOrigin(0.5));

    // 説明
    this.overlay.add(this.add.text(x + w / 2, y + 79, '古の宝箱へ300Gを捧げ、未知のレリックを召喚する', {
      fontFamily: '"Yu Gothic UI"', fontSize: '15px', color: '#eef3ee', fontStyle: 'bold'
    }).setOrigin(0.5));

    // 排出ランク表
    this.overlay.add(this.add.text(x + w / 2, y + 108, [
      'SS  3%     S  12%     A  25%     B  35%     C  25%',
      '最高級レリック        強化装備        装備・素材        消耗品'
    ].join('\n'), {
      fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#859a9c', align: 'center', lineSpacing: 7
    }).setOrigin(0.5));

    // 待機中の宝箱（金色の光をまとってふわふわ浮く）
    const idleGlow = this.add.image(x + w / 2, y + h / 2 + 42, 'glow')
      .setBlendMode(Phaser.BlendModes.ADD).setTint(0xf5c542).setAlpha(0.3).setScale(2.4);
    const idleRing = this.add.circle(x + w / 2, y + h / 2 + 28, 76, 0xe7b85e, .025)
      .setStrokeStyle(1.5, 0xe7b85e, .5);
    const idleRing2 = this.add.circle(x + w / 2, y + h / 2 + 28, 100, 0x58d9d1, .015)
      .setStrokeStyle(1, 0x58d9d1, .25);
    const idle = this.add.image(x + w / 2, y + h / 2 + 28, 'chest').setScale(1.9);
    this.tweens.add({ targets: idle, y: '-=10', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: idleGlow, alpha: 0.15, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: idleRing, angle: 360, duration: 9000, repeat: -1 });
    this.tweens.add({ targets: idleRing2, angle: -360, duration: 13000, repeat: -1 });
    this.overlay.add([idleGlow, idleRing2, idleRing, idle]);

    // 回すボタン
    const bw = 260, bh = 54, bx = x + w / 2 - bw / 2, by = y + h - 84;
    const afford = p.gold >= 300;
    const g = this.add.graphics();
    const draw = (c: number) => {
      g.clear();
      g.fillStyle(c, 1).fillRoundedRect(bx, by, bw, bh, 12);
      g.lineStyle(2, afford ? 0xe7b85e : 0x555f70).strokeRoundedRect(bx, by, bw, bh, 12);
    };
    draw(afford ? 0x49361d : 0x142125);
    const bt = this.add.text(bx + bw / 2, by + bh / 2, '◆  300Gで召喚', {
      fontFamily: '"Yu Gothic UI"', fontSize: '20px', color: afford ? '#ffe0a0' : '#5a6577', fontStyle: 'bold'
    }).setOrigin(0.5);
    const zone = this.add.zone(bx, by, bw, bh).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { if (afford) draw(0x6a4b22); });
    zone.on('pointerout', () => draw(afford ? 0x49361d : 0x142125));
    zone.on('pointerdown', () => {
      if (this.gachaAnimating) return;
      Audio.playSe('click');
      const result = this.gs.gachaPull();
      if (result) this.playGachaAnimation(result);
    });
    this.overlay.add([g, bt, zone]);
  }

  // ============================================================
  // ガチャ演出（宝箱召喚版）
  //  ①暗転→古の宝箱が空から落ちてきて着地（土煙＋振動）
  //  ②宝箱が震え、隙間からランク色の光が漏れて脈動
  //  ③S/SS: 宝箱が宙に浮き「静寂」→白フラッシュ→光柱と共に爆発開封
  //    A: 色フラッシュで開封 / B・C: ポンと開封
  //  ④開いた宝箱から品物が飛び出し、回転光背＋ランク印がドン。SSは金吹雪
  // ============================================================
  playGachaAnimation(result: { rank: 'SS' | 'S' | 'A' | 'B' | 'C'; color: number; name: string; texKey: string }) {
    this.gachaAnimating = true;
    // モーダル（ガチャウィンドウ）の矩形。演出はすべてこの中で完結させる
    const { x: mx, y: my, w: mw, h: mh } = this.L.ov;
    const cx = mx + mw / 2, cy = Math.min(my + mh / 2 + 10, my + 320);
    const high = result.rank === 'SS' || result.rank === 'S';
    const mid = result.rank === 'A';
    const objs: Phaser.GameObjects.GameObject[] = [];
    const timers: Phaser.Time.TimerEvent[] = [];
    // モーダル外にはみ出た描画はマスクで切り取る（Zoneはクリック判定なので除外）
    const maskShape = this.make.graphics({}, false);
    maskShape.fillStyle(0xffffff).fillRoundedRect(mx, my, mw, mh, 10);
    const mask = maskShape.createGeometryMask();
    const track = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      objs.push(o);
      if (o.type !== 'Zone') (o as any).setMask?.(mask);
      return o;
    };
    const colHex = '#' + result.color.toString(16).padStart(6, '0');

    const ritualTag = track(this.add.text(cx, my + 30, 'RELIC  SUMMON', {
      fontFamily: '"Yu Gothic UI"', fontSize: '10px', color: '#58d9d1', fontStyle: 'bold', letterSpacing: 4
    }).setOrigin(.5).setDepth(307));
    const phaseText = track(this.add.text(cx, my + 52, 'SEAL SYNCHRONIZING...', {
      fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#8ca2a5', fontStyle: 'bold', letterSpacing: 2
    }).setOrigin(.5).setDepth(307));

    // ---- 暗幕（モーダル内だけ暗くする）----
    const dim = track(this.add.rectangle(cx, my + mh / 2, mw, mh, 0x000000, 0.88).setDepth(300).setAlpha(0));
    this.tweens.add({ targets: dim, alpha: 1, duration: 200 });

    // ---- 隙間から漏れる光（宝箱の奥で脈動）----
    const leak = track(this.add.image(cx, cy + 40, 'glow').setDepth(301)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff2c0).setAlpha(0).setScale(0.5));
    const sealOuter = track(this.add.circle(cx, cy + 18, 104, result.color, .025)
      .setStrokeStyle(2, result.color, .38).setDepth(301));
    const sealInner = track(this.add.circle(cx, cy + 18, 78, 0xffffff, .012)
      .setStrokeStyle(1, 0xffffff, .22).setDepth(301));
    this.tweens.add({ targets: sealOuter, angle: 360, duration: 9000, repeat: -1 });
    this.tweens.add({ targets: sealInner, angle: -360, duration: 6500, repeat: -1 });

    // ---- 宝箱が空から落ちてくる ----
    const chest = track(this.add.image(cx, -80, 'chest').setDepth(303).setScale(2.4));
    this.tweens.add({ targets: chest, y: cy + 20, duration: 650, ease: 'Bounce.easeOut', delay: 150 });

    // 着地：土煙＋振動
    this.time.delayedCall(830, () => {
      phaseText.setText('RESONANCE DETECTED').setColor(colHex);
      Audio.playSe('hit');
      this.cameras.main.shake(180, 0.008);
      for (let i = 0; i < 6; i++) {
        const puff = track(this.add.image(cx + (Math.random() * 100 - 50), cy + 52, 'glow').setDepth(302)
          .setTint(0xb0a890).setAlpha(0.65).setDisplaySize(20 + Math.random() * 18, 14));
        this.tweens.add({
          targets: puff, x: puff.x + (puff.x < cx ? -45 : 45), alpha: 0,
          duration: 480 + Math.random() * 200, ease: 'Quad.easeOut', onComplete: () => puff.destroy()
        });
      }
    });

    // ---- 震えフェーズ：ガタガタ揺れ、光が漏れ出す ----
    this.time.delayedCall(1050, () => {
      phaseText.setText('READING RELIC CLASS...');
      Audio.playSe('warp');
      this.tweens.add({ targets: chest, angle: { from: -3.5, to: 3.5 }, duration: 85, yoyo: true, repeat: 13 });
      this.tweens.add({ targets: leak, alpha: 0.85, scale: 2.3, duration: 1100, ease: 'Quad.easeIn' });
      // 漏れ光が白→ランク色へ変わる（正体が見え始める）
      this.time.delayedCall(550, () => leak.setTint(result.color));
      // 隙間から光の粒が吹き出す
      timers.push(this.time.addEvent({
        delay: 85, repeat: 11, callback: () => {
          const sp = track(this.add.image(cx + (Math.random() * 90 - 45), cy + 28, 'glow').setDepth(304)
            .setBlendMode(Phaser.BlendModes.ADD).setTint(result.color)
            .setDisplaySize(6 + Math.random() * 9, 6 + Math.random() * 9).setAlpha(0.9));
          this.tweens.add({
            targets: sp, y: sp.y - 60 - Math.random() * 60, alpha: 0,
            duration: 500 + Math.random() * 300, ease: 'Quad.easeOut', onComplete: () => sp.destroy()
          });
        }
      }));
    });

    // ---- 後片付け＆クローズ ----
    const cleanup = () => {
      for (const t of timers) t.remove();
      for (const o of objs) { this.tweens.killTweensOf(o); o.destroy(); }
      mask.destroy();
      maskShape.destroy();
      this.gachaAnimating = false;
      this.setOverlay('gacha'); // ゴールド表示などを更新
      this.refresh();
    };

    // ---- 開封＆リザルト ----
    const reveal = () => {
      this.tweens.killTweensOf([chest, leak]);
      chest.setAngle(0).setTexture('chest_open');
      leak.setAlpha(0);
      phaseText.setText(`${result.rank}  RELIC MANIFESTED`).setColor(colHex);
      Audio.playSe(result.rank === 'SS' ? 'levelup' : result.rank === 'S' ? 'kill' : 'chest');

      // 開封の炸裂
      const burst = track(this.add.image(cx, chest.y - 10, 'fx_hit').setDepth(304).setScale(1.2)
        .setBlendMode(Phaser.BlendModes.ADD).setTint(result.color));
      this.tweens.add({ targets: burst, scale: high ? 5.5 : 3.0, alpha: 0, duration: 500 });

      // 品物のY位置（宝箱の上空・モーダル内に収まる固定高さ）
      const itemY = my + 150;

      const rewardCard = track(this.add.graphics().setDepth(302).setAlpha(0));
      rewardCard.fillStyle(0x071518, .96).fillRoundedRect(cx - 222, my + 68, 444, mh - 116, 18);
      rewardCard.lineStyle(2, result.color, .72).strokeRoundedRect(cx - 222, my + 68, 444, mh - 116, 18);
      rewardCard.lineStyle(1, 0xffffff, .1).strokeRoundedRect(cx - 212, my + 78, 424, mh - 136, 14);
      this.tweens.add({ targets: rewardCard, alpha: 1, duration: 360 });

      // 回転する光背レイ（品物の後ろ）
      const rays = track(this.add.graphics().setDepth(304).setBlendMode(Phaser.BlendModes.ADD));
      const rayAlpha = high ? 0.35 : mid ? 0.22 : 0.12;
      rays.fillStyle(result.color, rayAlpha);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const a2 = a + 0.11;
        rays.fillTriangle(0, 0, Math.cos(a) * 240, Math.sin(a) * 240, Math.cos(a2) * 240, Math.sin(a2) * 240);
      }
      rays.setPosition(cx, itemY).setAlpha(0);
      this.tweens.add({ targets: rays, alpha: 1, duration: 350, delay: 150 });
      this.tweens.add({ targets: rays, angle: 360, duration: high ? 8000 : 15000, repeat: -1 });

      // 品物が宝箱から飛び出して浮かぶ
      const halo = track(this.add.image(cx, itemY, 'glow').setDepth(305)
        .setBlendMode(Phaser.BlendModes.ADD).setTint(result.color).setAlpha(0).setScale(1.6));
      this.tweens.add({ targets: halo, alpha: 0.5, duration: 500, delay: 200 });
      const icon = track(this.add.image(cx, chest.y - 6, result.texKey).setDepth(306).setDisplaySize(22, 22).setAlpha(0));
      this.tweens.add({
        targets: icon, y: itemY, displayWidth: 78, displayHeight: 78, alpha: 1,
        duration: 550, ease: 'Back.easeOut'
      });
      // ふわふわ浮遊
      this.tweens.add({ targets: icon, y: itemY - 8, duration: 1100, yoyo: true, repeat: -1, delay: 600, ease: 'Sine.easeInOut' });

      // ランク印が上からドンと落ちてくる
      const rankText = track(this.add.text(cx, itemY - 118, result.rank, {
        fontFamily: '"Yu Gothic UI"', fontSize: result.rank === 'SS' ? '58px' : '48px', fontStyle: 'bold', color: colHex
      }).setOrigin(0.5).setStroke('#000000', 8).setShadow(0, 0, colHex, 16, true, true).setScale(3.2).setAlpha(0).setDepth(307));
      this.tweens.add({
        targets: rankText, scale: 1, alpha: 1, duration: 240, delay: 420, ease: 'Cubic.easeIn',
        onComplete: () => {
          this.cameras.main.shake(160, high ? 0.01 : 0.005);
          if (high) this.tweens.add({ targets: rankText, scale: 1.15, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.easeInOut' });
        }
      });

      // 品名＆ヒント
      const nameText = track(this.add.text(cx, chest.y + 64, result.name, {
        fontFamily: '"Yu Gothic UI"', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5).setStroke('#000000', 6).setAlpha(0).setDepth(307));
      if (nameText.width > 460) nameText.setFontSize(15);
      this.tweens.add({ targets: nameText, alpha: 1, y: chest.y + 56, duration: 350, delay: 500 });
      const hint = track(this.add.text(cx, chest.y + 92, '― クリックで閉じる ―', {
        fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#e7b85e', fontStyle: 'bold', letterSpacing: 1
      }).setOrigin(0.5).setAlpha(0).setDepth(307));
      this.tweens.add({ targets: hint, alpha: 1, duration: 350, delay: 800 });
      const acquired = track(this.add.text(cx, my + mh - 38, 'NEW RELIC ACQUIRED', {
        fontFamily: '"Yu Gothic UI"', fontSize: '9px', color: '#70898b', fontStyle: 'bold', letterSpacing: 3
      }).setOrigin(.5).setAlpha(0).setDepth(307));
      this.tweens.add({ targets: acquired, alpha: 1, duration: 350, delay: 650 });

      // SS：金の紙吹雪が舞い続ける
      if (result.rank === 'SS') {
        const confetti = () => {
          const colors = [0xffd700, 0xffe680, 0xf5a030, 0xfff0b0];
          const px = cx + (Math.random() * 380 - 190);
          const r = track(this.add.rectangle(px, itemY - 130, 5 + Math.random() * 4, 9 + Math.random() * 5,
            colors[Math.floor(Math.random() * colors.length)]).setDepth(308).setAngle(Math.random() * 360));
          this.tweens.add({
            targets: r, y: chest.y + 90 + Math.random() * 60, angle: '+=' + (180 + Math.random() * 360),
            x: px + (Math.random() * 60 - 30), alpha: 0,
            duration: 1400 + Math.random() * 700, ease: 'Quad.easeIn',
            onComplete: () => r.destroy()
          });
        };
        timers.push(this.time.addEvent({ delay: 90, repeat: -1, callback: confetti }));
        for (let i = 0; i < 10; i++) confetti();
      }

      // クリックで終了
      const closeZone = track(this.add.zone(0, 0, GAME_W, GAME_H).setOrigin(0).setDepth(310).setInteractive());
      closeZone.once('pointerdown', () => { Audio.playSe('click'); cleanup(); });
    };

    // ---- ランク別のつなぎ演出 ----
    if (high) {
      // S/SS：宝箱が宙に浮いて「静寂」→白フラッシュ→光柱と共に爆発開封
      this.time.delayedCall(1800, () => {
        this.tweens.killTweensOf(chest);
        chest.setAngle(0);
        for (const t of timers) t.remove();
        timers.length = 0;
        Audio.playSe('seal');
        // ゆっくり浮き上がる（不穏な静けさ）
        this.tweens.add({ targets: chest, y: cy - 30, duration: 620, ease: 'Sine.easeOut' });
        this.tweens.add({ targets: leak, alpha: 0.12, duration: 450 });
        this.time.delayedCall(760, () => {
          // 白フラッシュ＋大振動＋光柱
          const flash = track(this.add.rectangle(cx, my + mh / 2, mw, mh, 0xffffff, 1).setDepth(309).setAlpha(0));
          this.tweens.add({ targets: flash, alpha: 1, duration: 90, yoyo: true, onComplete: () => flash.setAlpha(0) });
          this.cameras.main.shake(500, 0.014);
          Audio.playSe('bomb');
          const pillar = track(this.add.rectangle(cx, cy - 130, 30, 480, result.color, 0.9)
            .setDepth(305).setBlendMode(Phaser.BlendModes.ADD).setScale(0.1, 0));
          this.tweens.add({ targets: pillar, scaleY: 1, duration: 260, ease: 'Quad.easeOut' });
          this.tweens.add({ targets: pillar, scaleX: 3.4, alpha: 0, duration: 800, delay: 240 });
          // 衝撃波リング
          const ring = track(this.add.image(cx, cy - 30, 'glow').setDepth(304)
            .setBlendMode(Phaser.BlendModes.ADD).setTint(result.color).setScale(0.4).setAlpha(0.9));
          this.tweens.add({ targets: ring, scale: 6.0, alpha: 0, duration: 550, ease: 'Quad.easeOut' });
          this.time.delayedCall(260, reveal);
        });
      });
    } else if (mid) {
      // A：ひと呼吸ためて色フラッシュ→開封
      this.time.delayedCall(1700, () => {
        const flash = track(this.add.rectangle(cx, my + mh / 2, mw, mh, result.color, 1).setDepth(309).setAlpha(0));
        this.tweens.add({ targets: flash, alpha: 0.45, duration: 90, yoyo: true, onComplete: () => flash.setAlpha(0) });
        this.cameras.main.shake(200, 0.006);
        this.time.delayedCall(260, reveal);
      });
    } else {
      // B/C：そのままポンと開封
      this.time.delayedCall(1720, reveal);
    }
  }

  rowButton(x: number, y: number, w: number, label: string, highlight: boolean, onClick: () => void) {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();
    const base = highlight ? 0x264a48 : 0x1c2536;
    g.fillStyle(base, 1).fillRoundedRect(x, y, w, 28, 5);
    g.lineStyle(1, 0x2f6f6a).strokeRoundedRect(x, y, w, 28, 5);
    const t = this.add.text(x + 10, y + 14, label, { fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#dfe7f0' }).setOrigin(0, 0.5);
    // 枠からはみ出す場合は末尾を「…」に切り詰める
    if (t.width > w - 18) {
      let s = label;
      while (s.length > 1 && t.width > w - 18) {
        s = s.slice(0, -1);
        t.setText(s + '…');
      }
    }
    const zone = this.add.zone(x, y, w, 28).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { g.clear(); g.fillStyle(0x3f8f88, 1).fillRoundedRect(x, y, w, 28, 5); g.lineStyle(1, 0x3fe0d0).strokeRoundedRect(x, y, w, 28, 5); });
    zone.on('pointerout', () => { g.clear(); g.fillStyle(base, 1).fillRoundedRect(x, y, w, 28, 5); g.lineStyle(1, 0x2f6f6a).strokeRoundedRect(x, y, w, 28, 5); });
    zone.on('pointerdown', onClick);
    c.add([g, t, zone]);
    return c;
  }

  showSettings() {
    this.setOverlay('settings');
  }

  // ---- 設定オーバーレイ：BGMと効果音（システム音）を別々に調整 ----
  buildSettingsOverlay(x: number, y: number, w: number) {
    const rows: {
      label: () => string;
      onMinus: () => void;
      onPlus: () => void;
      onToggle: () => void;
      toggleLabel: () => string;
    }[] = [
      {
        label: () => `🎵 BGM音量: ${Math.round(Audio.bgmVolume * 100)}%`,
        onMinus: () => Audio.setBgmVolume(Audio.bgmVolume - 0.1),
        onPlus: () => Audio.setBgmVolume(Audio.bgmVolume + 0.1),
        onToggle: () => Audio.toggleBgm(),
        toggleLabel: () => (Audio.bgmOn ? '🔊 ON' : '🔇 OFF')
      },
      {
        label: () => `🔔 効果音音量: ${Math.round(Audio.seVolume * 100)}%`,
        onMinus: () => Audio.setSeVolume(Audio.seVolume - 0.1),
        onPlus: () => Audio.setSeVolume(Audio.seVolume + 0.1),
        onToggle: () => Audio.toggleSe(),
        toggleLabel: () => (Audio.seOn ? '🔊 ON' : '🔇 OFF')
      }
    ];

    let cy = y + 70;
    for (const row of rows) {
      const labelText = this.add.text(x + 30, cy + 4, row.label(), {
        fontFamily: '"Yu Gothic UI"', fontSize: '17px', color: '#dfe7f0'
      });
      this.overlay.add(labelText);

      const mkBtn = (bx: number, bw: number, text: () => string, onClick: () => void) => {
        const g = this.add.graphics();
        const draw = (c: number) => {
          g.clear();
          g.fillStyle(c, 1).fillRoundedRect(bx, cy - 4, bw, 38, 6);
          g.lineStyle(2, 0x3fe0d0).strokeRoundedRect(bx, cy - 4, bw, 38, 6);
        };
        draw(0x2f6f6a);
        const t = this.add.text(bx + bw / 2, cy + 15, text(), {
          fontFamily: '"Yu Gothic UI"', fontSize: '17px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        const zone = this.add.zone(bx, cy - 4, bw, 38).setOrigin(0).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => draw(0x3f8f88));
        zone.on('pointerout', () => draw(0x2f6f6a));
        zone.on('pointerdown', () => {
          onClick();
          Audio.playSe('click'); // 変更後の音量で鳴らして確認できる
          labelText.setText(row.label());
          t.setText(text());
        });
        this.overlay.add(this.add.container(0, 0, [g, t, zone]));
      };

      mkBtn(x + 330, 56, () => '－', row.onMinus);
      mkBtn(x + 396, 56, () => '＋', row.onPlus);
      mkBtn(x + 470, 110, row.toggleLabel, row.onToggle);
      cy += 70;
    }

    this.overlay.add(this.add.text(x + 30, cy + 14, [
      '※ BGMと効果音は別々に調整できます。',
      '※ 音源ファイル(public/assets/audio/*.mp3)を置くと自動でそちらが使われます。',
      '   無い場合は内蔵のレトロ風チップチューンが鳴ります。'
    ].join('\n'), {
      fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#8a97ab', lineSpacing: 6
    }));
  }
}
