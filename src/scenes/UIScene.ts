import Phaser from 'phaser';
import { GameScene } from './GameScene';
import type { GachaResult } from './GameScene';
import { GAME_W, GAME_H } from '../main';
import { IS_MOBILE, MAP_X, MAP_Y, MAP_W, MAP_H } from '../layout';
import { durabilityRisk } from '../combat';
import { weaponFullName } from '../player';
import { getTheme, MAGIC_DESC, MONSTER_DEFS, ITEM_DEFS, gradeColor, isRareItem, ELEMENT_INFO, monsterElement } from '../data';
import type { Armor, MagicCode, ItemKind, Item, Dir, Weapon, Shield, Element } from '../types';
import { shieldFullName } from '../player';
import { Audio } from '../audio/manager';
import { EQUIPMENT_LIMIT } from '../balance';
import { armorFullName, armorTextureKey, isPlayerArmor, PLAYER_ARMOR_DEFS, playerFrameIndex, playerSheetKey } from '../playerAppearance';

const COLORS: Record<string, string> = {
  sys: '#d7e3e2', dmg: '#ff7b82', item: '#6fdda8', gold: '#ffd47d', special: '#c9b2ff'
};

export class UIScene extends Phaser.Scene {
  gs!: GameScene;
  logLines: { msg: string; type: string }[] = [];

  topText!: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  hpBar!: Phaser.GameObjects.Graphics;
  equipSlots: { kind: 'weapon' | 'armor' | 'shield'; tag: string; bg: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text; sub: Phaser.GameObjects.Text; rect: [number, number, number, number] }[] = [];
  paperDoll?: Phaser.GameObjects.Image;
  codexText?: Phaser.GameObjects.Text; // モンスター図鑑サイドパネル（PCのみ）
  logTexts: Phaser.GameObjects.Text[] = []; // 固定8行（行ごとに色分け）
  itemContainer!: Phaser.GameObjects.Container;
  overlay!: Phaser.GameObjects.Container;
  overlayMode: 'none' | 'equip' | 'inv' | 'codex' | 'settings' | 'shop' | 'gacha' | 'pick' = 'none';
  pickSlot = 0; // 'pick'モードで開いている装備スロット（0武器/1服/2盾）
  gachaAnimating = false; // ガチャ演出中は再描画をブロック
  codeDigits = '';
  codeMessage = '';
  enemyInfoText!: Phaser.GameObjects.Text;
  // レイアウト依存の座標（PC / スマホ縦で切り替え）
  L!: {
    hpBar: { x: number; y: number; w: number };
    items: { x: number; y: number; cols: number };
    ov: { x: number; y: number; w: number; h: number };
  };
  equipIconSize = 60;
  equipScrollIndex = 0;
  equipScrollMax = 0;
  inventoryTab: 'all' | 'equip' | 'items' = 'all';
  inventoryScrollIndex = 0;
  inventoryScrollMax = 0;
  codexScrollRow = 0;
  codexScrollMax = 0;
  secretDirection: 'left' | 'right' | null = null;
  secretAlternatingPresses = 0;

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
        hpBar: { x: 20, y: 94, w: 350 },
        items: { x: 14, y: 604, cols: 6 },
        ov: { x: 8, y: 48, w: 374, h: 746 }
      };
      this.equipIconSize = 34;
      this.buildMobileLayout();
    } else {
      // PC：従来レイアウト
      this.L = {
        hpBar: { x: 938, y: 128, w: 320 },
        items: { x: 730, y: 596, cols: 8 },
        ov: { x: 200, y: 80, w: 680, h: 460 }
      };
      this.equipIconSize = 58;
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
      backgroundColor: '#0a1420ee', padding: { x: 8, y: 6 }, lineSpacing: 4,
      wordWrap: { width: IS_MOBILE ? 250 : 330 }
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

    const onWheel = (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (this.overlayMode === 'equip' && dy !== 0) this.scrollEquipment(dy > 0 ? 1 : -1);
      if (this.overlayMode === 'inv' && dy !== 0) this.scrollInventory(dy > 0 ? 1 : -1);
      if (this.overlayMode === 'codex' && dy !== 0) this.scrollCodex(dy > 0 ? 1 : -1);
    };
    const onSecretKey = (event: KeyboardEvent) => this.handleEquipmentSecret(event);
    this.input.on('wheel', onWheel);
    this.input.keyboard?.on('keydown', onSecretKey);

    // シーン停止時にリスナーを解除（再起動時の多重登録・破棄済み参照アクセス防止）
    this.events.once('shutdown', () => {
      gsEvents.off('refresh', onRefresh);
      gsEvents.off('log', onLog);
      gsEvents.off('floor', onFloor);
      gsEvents.off('enemyinfo', onEnemy);
      this.input.off('wheel', onWheel);
      this.input.keyboard?.off('keydown', onSecretKey);
    });

    this.refresh();

    // ローカル表示確認用。例: ?mobile=1&qa-game&qa-overlay=settings
    if (location.hostname === 'localhost') {
      const qaOverlay = new URLSearchParams(location.search).get('qa-overlay');
      const allowed = ['equip', 'inv', 'codex', 'settings', 'shop', 'gacha'] as const;
      if (qaOverlay && allowed.includes(qaOverlay as typeof allowed[number])) {
        this.time.delayedCall(100, () => this.setOverlay(qaOverlay as typeof allowed[number]));
      }
      if (qaOverlay === 'gacha' && new URLSearchParams(location.search).has('qa-gacha-auto')) {
        this.time.delayedCall(320, () => {
          const result = this.gs.gachaPull();
          if (result) this.playGachaAnimation(result);
        });
      }
    }
  }

  // ============ フレーム ============
  panel(x: number, y: number, w: number, h: number, title?: string) {
    const g = this.add.graphics();
    g.fillStyle(0x061316, 0.95);
    g.fillRoundedRect(x, y, w, h, 12);
    g.fillStyle(0x102a2d, .28).fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 9);
    g.lineStyle(1.2, 0x426d70, .9);
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
    this.add.text(20, 8, 'ちゃりだんじょん', {
      fontFamily: '"Yu Gothic UI"', fontSize: '16px', color: '#65dcd4', fontStyle: 'bold', letterSpacing: 1
    });
    this.topText = this.add.text(GAME_W - 26, 11, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#f2cf85', fontStyle: 'bold'
    }).setOrigin(1, 0);
  }

  // ============ 左メニュー ============
  buildLeftMenu() {
    this.panel(8, 48, 160, 512, 'メニュー');
    const labels: { t: string; icon: string; f: () => void }[] = [
      { t: '探索', icon: 'ui_nav_explore', f: () => this.setOverlay('none') },
      { t: '持ち物・装備', icon: 'ui_nav_inventory', f: () => this.openInventory() },
      { t: 'ショップ', icon: 'ui_nav_shop', f: () => this.setOverlay('shop') },
      { t: 'ガチャ', icon: 'ui_nav_gacha', f: () => this.setOverlay('gacha') },
      { t: 'モンスター図鑑', icon: 'ui_nav_codex', f: () => this.setOverlay('codex') },
      { t: '設定', icon: 'ui_nav_settings', f: () => this.showSettings() }
    ];
    let y = 84;
    for (const it of labels) {
      this.menuButton(16, y, 144, 40, it.icon, it.t, it.f);
      y += 48;
    }
    // ヒント
    this.add.text(16, y + 6, '矢印・クリック：移動\n長押し：加速', {
      fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#789093', lineSpacing: 5
    });
  }

  menuButton(x: number, y: number, w: number, h: number, iconKey: string, label: string, onClick: () => void) {
    const g = this.add.graphics();
    const draw = (c: number, line = 0x315155) => { g.clear(); g.fillStyle(c, .96); g.fillRoundedRect(x, y, w, h, 8); g.lineStyle(1, line, .9); g.strokeRoundedRect(x, y, w, h, 8); };
    draw(0x0d2226);
    const icon = this.add.image(x + 24, y + h / 2, iconKey).setDisplaySize(34, 34);
    const t = this.add.text(x + 46, y + h / 2, label, {
      fontFamily: '"Yu Gothic UI"', fontSize: label.length > 7 ? '12px' : '14px', color: '#dfe7f0', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(0x1d4244, 0x58d9d1));
    zone.on('pointerout', () => draw(0x0d2226));
    zone.on('pointerdown', () => { Audio.playSe('click'); onClick(); });
    void icon; void t;
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

    // ---- 装備（キャラクター見た目＋武器・服・盾）----
    this.panel(x, 232, w, 234, '装備');
    const dollFrame = this.add.graphics();
    dollFrame.fillStyle(0x071417, 0.98).fillRoundedRect(x + 112, 260, 124, 180, 12);
    dollFrame.lineStyle(1.5, 0x9b793e, 0.9).strokeRoundedRect(x + 112, 260, 124, 180, 12);
    dollFrame.lineStyle(1, 0x58d9d1, 0.45).strokeRoundedRect(x + 118, 266, 112, 168, 9);
    this.paperDoll = this.add.image(x + 174, 343, playerSheetKey(this.gs.playerGender, this.gs.playerArmor ?? 'leather'), playerFrameIndex('down', 'idle'))
      .setDisplaySize(116, 116);
    this.add.text(x + 174, 416, '装備中の見た目', {
      fontFamily: '"Yu Gothic UI"', fontSize: '10px', color: '#a9c9c7'
    }).setOrigin(0.5);

    const slots = [
      { kind: 'weapon' as const, tag: '武器', sx: x + 14, sy: 274 },
      { kind: 'armor' as const, tag: '服', sx: x + w - 100, sy: 274 },
      { kind: 'shield' as const, tag: '盾', sx: x + w - 100, sy: 370 }
    ];
    this.equipSlots = [];
    for (let i = 0; i < slots.length; i++) {
      const { kind, tag, sx, sy } = slots[i];
      const sw = 86, sh = 82;
      const bg = this.add.graphics();
      const icon = this.add.image(sx + sw / 2, sy + 34, 'coin').setDisplaySize(58, 58);
      const name = this.add.text(sx + sw / 2, sy + sh - 15, tag, {
        fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#dfe7f0', fontStyle: 'bold'
      }).setOrigin(0.5);
      const sub = this.add.text(0, 0, '').setVisible(false);
      this.equipSlots.push({ kind, tag, bg, icon, name, sub, rect: [sx, sy, sw, sh] });
      const slotIndex = i;
      const zone = this.add.zone(sx, sy, sw, sh).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.showEquipmentTooltip(kind, sx + sw / 2, sy + 4));
      zone.on('pointerout', () => this.hideTooltip());
      zone.on('pointerdown', () => {
        Audio.playSe('click');
        this.hideTooltip();
        this.pickSlot = slotIndex;
        this.setOverlay('pick');
      });
    }
    this.add.text(x + 20, 378, 'カーソルで詳細\nクリックで装備変更', {
      fontFamily: '"Yu Gothic UI"', fontSize: '10px', color: '#6f9496', lineSpacing: 5
    });

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
    this.panel(716, 568, GAME_W - 724, 184, 'クイックアイテム（クリックで使用）');
    this.itemContainer = this.add.container(0, 0);
  }

  // ============ スマホ縦型レイアウト ============
  buildMobileLayout() {
    // ---- 上部バー（タイトル＋フロア情報）----
    this.panel(8, 8, 374, 38);
    this.add.text(16, 14, 'ちゃりだんじょん', {
      fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#3fe0d0', fontStyle: 'bold', letterSpacing: 1
    });
    this.topText = this.add.text(374, 15, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#f5c542', fontStyle: 'bold'
    }).setOrigin(1, 0);

    // ---- ステータス ----
    this.panel(8, 52, 374, 58);
    const style = { fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#dfe7f0' };
    this.statusText = this.add.text(20, 58, '', style);
    this.hpLabel = this.add.text(20, 77, '', style);
    this.hpBar = this.add.graphics();
    this.atkLabel = this.add.text(370, 77, '', { ...style, fontSize: '10px' }).setOrigin(1, 0);

    // ---- マップ枠 ----
    const fg = this.add.graphics();
    fg.lineStyle(2, 0x2f6f6a, 1).strokeRoundedRect(MAP_X - 2, MAP_Y - 2, MAP_W + 4, MAP_H + 4, 6);

    // ---- 装備（スマホは武器・服・盾の3枠を横並び）----
    this.panel(8, 498, 374, 82, '装備');
    const slots = [
      { kind: 'weapon' as const, tag: '武器' },
      { kind: 'armor' as const, tag: '服' },
      { kind: 'shield' as const, tag: '盾' }
    ];
    this.equipSlots = [];
    for (let i = 0; i < slots.length; i++) {
      const { kind, tag } = slots[i];
      const sx = 14 + i * 122, sy = 520, sw = 116, sh = 52;
      const bg = this.add.graphics();
      const icon = this.add.image(sx + 24, sy + sh / 2, 'coin').setDisplaySize(34, 34);
      const name = this.add.text(sx + 47, sy + 7, tag, {
        fontFamily: '"Yu Gothic UI"', fontSize: '10px', color: '#dfe7f0', fontStyle: 'bold',
        wordWrap: { width: sw - 50 }
      });
      const sub = this.add.text(sx + 47, sy + 26, 'タップで詳細', {
        fontFamily: '"Yu Gothic UI"', fontSize: '7px', color: '#76989b',
        wordWrap: { width: sw - 50 }
      });
      this.equipSlots.push({ kind, tag, bg, icon, name, sub, rect: [sx, sy, sw, sh] });
      const slotIndex = i;
      const zone = this.add.zone(sx, sy, sw, sh).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => { Audio.playSe('click'); this.pickSlot = slotIndex; this.setOverlay('pick'); });
    }

    // ---- もちもの ----
    this.panel(8, 586, 374, 66, 'クイックアイテム（タップで使用）');
    this.itemContainer = this.add.container(0, 0);

    // ---- 冒険ログ（最新1行）----
    this.panel(8, 766, 374, 30);
    this.add.text(16, 773, '冒険ログ', {
      fontFamily: '"Yu Gothic UI"', fontSize: '9px', color: '#65dcd4', fontStyle: 'bold', letterSpacing: 1
    });
    this.logTexts = [];
    this.logTexts.push(this.add.text(76, 771, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#dfe7f0',
      wordWrap: { width: 294 }
    }));

    // ---- 操作エリア：四方向キー ----
    this.panel(8, 658, 374, 106);
    this.add.text(16, 664, '移動', {
      fontFamily: '"Yu Gothic UI"', fontSize: '9px', color: '#65dcd4', fontStyle: 'bold', letterSpacing: 1
    });
    this.buildTouchControls(76, 716, 29, 22);
    this.add.text(142, 692, '十字キーで移動\n長押しで加速', {
      fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#91a8b4', lineSpacing: 6
    });

    // ---- 下部ナビ（メニュー）----
    this.buildMobileNav();
  }

  buildMobileNav() {
    const items: { icon: string; label: string; f: () => void }[] = [
      { icon: 'ui_nav_inventory', label: '所持品', f: () => this.openInventory() },
      { icon: 'ui_nav_shop', label: '店', f: () => this.setOverlay('shop') },
      { icon: 'ui_nav_gacha', label: 'ガチャ', f: () => this.setOverlay('gacha') },
      { icon: 'ui_nav_codex', label: '図鑑', f: () => this.setOverlay('codex') },
      { icon: 'ui_nav_settings', label: '設定', f: () => this.showSettings() }
    ];
    this.panel(8, 800, 374, 36);
    items.forEach((it, i) => {
      const x = 12 + i * 72, y = 803, w = 68, h = 30;
      const g = this.add.graphics();
      const draw = (c: number) => { g.clear(); g.fillStyle(c, 1).fillRoundedRect(x, y, w, h, 6); };
      draw(0x1c2536);
      this.add.image(x + 14, y + h / 2, it.icon).setDisplaySize(24, 24);
      this.add.text(x + 28, y + h / 2, it.label, {
        fontFamily: '"Yu Gothic UI"', fontSize: '8px', color: '#dfe7f0'
      }).setOrigin(0, 0.5);
      const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => { draw(0x264a48); Audio.playSe('click'); it.f(); });
      zone.on('pointerup', () => draw(0x1c2536));
      zone.on('pointerout', () => draw(0x1c2536));
    });
  }

  // ---- タッチ操作：十字ボタン（スマホ=操作エリア、タッチPC=マップ左下に重ねる）----
  // 押しっぱなしで歩き続ける（GameScene.touchDir 経由でキーボード長押しと同じ扱い）
  buildTouchControls(cx: number, cy: number, gap: number, R: number) {
    const mkButton = (dx: number, dy: number, angleDeg: number, onDown: () => void, onUp?: () => void) => {
      const bx = cx + dx, by = cy + dy;
      const g = this.add.graphics().setDepth(60);
      const draw = (active: boolean) => {
        g.clear();
        g.fillStyle(active ? 0x2f6f6a : 0x0e1420, active ? 0.9 : 0.5).fillCircle(bx, by, R);
        g.lineStyle(2, 0x3fe0d0, 0.75).strokeCircle(bx, by, R);
        // 進行方向を指す三角矢印
        const a = Phaser.Math.DegToRad(angleDeg);
        const pt = (r: number, da: number): [number, number] =>
          [bx + Math.cos(a + da) * r, by + Math.sin(a + da) * r];
        const [x1, y1] = pt(14, 0);
        const [x2, y2] = pt(12, 2.5);
        const [x3, y3] = pt(12, -2.5);
        g.fillStyle(0xdfe7f0, 0.95).fillTriangle(x1, y1, x2, y2, x3, y3);
      };
      draw(false);
      const hitRadius = R + 4;
      const zone = this.add.zone(bx - hitRadius, by - hitRadius, hitRadius * 2, hitRadius * 2)
        .setOrigin(0).setInteractive().setDepth(61);
      zone.on('pointerdown', () => { draw(true); onDown(); });
      const release = () => { draw(false); onUp?.(); };
      zone.on('pointerup', release);
      zone.on('pointerupoutside', release);
      zone.on('pointerout', release);
    };
    const hold = (d: Dir) => () => { this.gs.touchDir = d; };
    const release = () => { this.gs.touchDir = null; };
    mkButton(0, -gap, -90, hold('up'), release);
    mkButton(0, gap, 90, hold('down'), release);
    mkButton(-gap, 0, 180, hold('left'), release);
    mkButton(gap, 0, 0, hold('right'), release);
  }

  elementColor(element?: Element): number | undefined {
    return element ? ELEMENT_INFO[element].color : undefined;
  }

  weaponEffectText(weapon: Weapon, compact = false): string {
    const effects: string[] = [];
    if (weapon.element) {
      effects.push(compact
        ? `${ELEMENT_INFO[weapon.element].name}属性`
        : `${ELEMENT_INFO[weapon.element].name}属性（弱点1.5倍・同属性0.75倍）`);
    }
    if (weapon.passive) effects.push(compact ? weapon.passive.name : `${weapon.passive.name}: ${weapon.passive.description}`);
    if (!compact) {
      for (const magic of weapon.magics) effects.push(`${magic.label}: ${MAGIC_DESC[magic.code]}`);
    }
    return effects.length ? effects.join(' / ') : 'なし';
  }

  shieldEffectText(shield: Shield, compact = false): string {
    const effects: string[] = [];
    if (shield.element) {
      effects.push(compact
        ? `${ELEMENT_INFO[shield.element].name}属性防御`
        : `${ELEMENT_INFO[shield.element].name}属性防御（同属性0.75倍・弱点1.5倍）`);
    }
    if (shield.passive) effects.push(compact ? shield.passive.name : `${shield.passive.name}: ${shield.passive.description}`);
    return effects.length ? effects.join(' / ') : 'なし';
  }

  showEquipmentTooltip(kind: 'weapon' | 'armor' | 'shield', anchorX: number, anchorY: number) {
    const p = this.gs.player;
    if (kind === 'weapon') {
      const weapon = p.weapon;
      if (!weapon) return this.showTooltip('素手', '武器を装備していない', anchorX, anchorY);
      const risk = durabilityRisk(weapon.dur, weapon.durMax);
      return this.showTooltip(
        weaponFullName(weapon),
        `攻撃力 ${p.atkMin}–${p.atkMax}\n耐久 ${weapon.dur} / ${weapon.durMax}（${risk.label}）\n効果 ${this.weaponEffectText(weapon)}`,
        anchorX, anchorY
      );
    }
    if (kind === 'armor') {
      const armor = p.armor;
      if (!armor) return this.showTooltip('服', '服を装備していない', anchorX, anchorY);
      const risk = durabilityRisk(armor.dur, armor.durMax);
      return this.showTooltip(
        armorFullName(armor),
        `防御力 +${armor.defBonus + armor.plus}\n耐久 ${armor.dur} / ${armor.durMax}（${risk.label}）\n見た目 ${PLAYER_ARMOR_DEFS[armor.key as keyof typeof PLAYER_ARMOR_DEFS]?.name ?? armor.name}`,
        anchorX, anchorY
      );
    }
    if (p.weapon?.dual) {
      return this.showTooltip('盾を装備できない', '二刀流は両手を使うため、盾を持てない', anchorX, anchorY);
    }
    const shield = p.shield;
    if (!shield) return this.showTooltip('盾', '盾を装備していない', anchorX, anchorY);
    const risk = durabilityRisk(shield.dur, shield.durMax);
    return this.showTooltip(
      shieldFullName(shield),
      `防御力 +${shield.defBonus + shield.plus}\n耐久 ${shield.dur} / ${shield.durMax}（${risk.label}）\n効果 ${this.shieldEffectText(shield)}`,
      anchorX, anchorY
    );
  }

  // ============ リフレッシュ ============
  refresh() {
    const p = this.gs.player;
    const th = getTheme(this.gs.floor);

    const boost = this.gs.holdBoostTier === 2 ? '  最大加速' : this.gs.holdBoostTier === 1 ? '  加速' : '';
    const transformation = this.gs.transformation
      ? `  変身:${this.gs.transformation.name} 残り${this.gs.transformation.turns}`
      : '';
    const floorLabel = this.gs.inBossRoom ? `${this.gs.floor}.5階` : `${this.gs.floor}階`;
    const gate = this.gs.inBossRoom
      ? this.gs.bossRewardClaimed ? '出口解放' : 'ボス封印'
      : this.gs.floor === 5
        ? 'ボス扉'
        : !this.gs.floorBossDefeated
          ? 'ボス封印'
          : this.gs.floorHasGate(this.gs.floor) ? 'ボス扉' : '階段解放';
    this.topText.setText(IS_MOBILE
      ? `${floorLabel}  ${gate}  得点${this.gs.score}${boost}`
      : `${floorLabel} / 30階  ${th.name}   ${gate}   得点 ${this.gs.score}   ${this.gs.turn}ターン${boost}`);

    this.statusText.setText(IS_MOBILE
      ? `${p.name} レベル${p.level}  経験値 ${p.exp}/${p.expNext}  ${this.gs.turn}ターン${transformation}`
      : `${p.name}  レベル${p.level}   （経験値 ${p.exp}/${p.expNext}）${transformation}`);
    this.hpLabel.setText(`体力  ${p.hp} / ${p.hpMax}`);
    this.atkLabel.setText(IS_MOBILE
      ? `攻 ${p.atkMin}-${p.atkMax}  防 ${p.def}  ${p.gold}G`
      : `攻撃力 ${p.atkMin}-${p.atkMax}   防御力 ${p.def}   所持金 ${p.gold}G`);
    // HPバー（ラベルの下の固定位置。座標はレイアウト設定から）
    const { x: bx, y: by, w: bw } = this.L.hpBar;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x2a1518).fillRect(bx, by, bw, 14);
    this.hpBar.fillStyle(0xff5a5a).fillRect(bx, by, bw * Math.max(0, p.hp / p.hpMax), 14);

    const w = p.weapon, a = p.armor, s = p.shield;
    const empty = { tex: null, sub: 'なし', plus: 0 };
    const slotInfo: Record<'weapon' | 'armor' | 'shield', { tex: string | null; sub: string; plus: number; grade?: 'D' | 'C' | 'B' | 'A' | 'S'; element?: Element }> = {
      weapon: w ? { tex: w.key, sub: `攻${w.atkMin}-${w.atkMax}`, plus: w.plus, grade: w.grade, element: w.element } : empty,
      armor: a ? { tex: armorTextureKey(a.key), sub: `防+${a.defBonus + a.plus}`, plus: a.plus, grade: a.grade } : empty,
      shield: w?.dual
        ? { tex: w.key, sub: '二刀流', plus: w.plus, grade: w.grade, element: w.element }
        : s ? { tex: s.key, sub: `防+${s.defBonus + s.plus}`, plus: s.plus, grade: s.grade, element: s.element } : empty
    };
    this.equipSlots.forEach((slot) => {
      const info = slotInfo[slot.kind];
      const [sx, sy, sw, sh] = slot.rect;
      const has = info.tex !== null;
      const rim = this.elementColor(info.element) ?? (info.grade ? gradeColor(info.grade) : 0x2f6f6a);
      slot.bg.clear();
      slot.bg.fillStyle(0x0a1c20, has ? .96 : 0.5).fillRoundedRect(sx, sy, sw, sh, 10);
      slot.bg.lineStyle(info.grade === 'S' ? 3 : info.grade === 'A' ? 2.5 : 1.5, rim, has ? 1 : 0.5).strokeRoundedRect(sx, sy, sw, sh, 8);
      if (has) {
        slot.icon.setTexture(info.tex!).setDisplaySize(this.equipIconSize, this.equipIconSize).setVisible(true).setAlpha(1);
        slot.icon.clearTint();
      } else {
        slot.icon.setVisible(false);
      }
      slot.name.setText(slot.tag).setColor(has ? '#e6eef7' : '#6b7c8c');
      slot.sub.setText(IS_MOBILE ? info.sub : '');
    });
    if (this.paperDoll && this.gs.playerArmor) {
      this.paperDoll.setTexture(playerSheetKey(this.gs.playerGender, this.gs.playerArmor), playerFrameIndex('down', 'idle'));
    }

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
      const icon = this.add.image(cx + 27, cy + 27, grp.item.textureKey).setDisplaySize(48, 48);
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
        const message = IS_MOBILE && l.msg.length > 34 ? `${l.msg.slice(0, 34)}…` : l.msg;
        t.setText(message);
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
    const lines = [
      `【${info.name}】`,
      ...(info.description ? [info.description] : []),
      `属性: ${info.element}`,
      `体力: ${info.hp}/${info.hpMax}`,
      `攻撃: ${info.atk}  防御: ${info.def}`,
      `行動: ${info.behavior}`
    ];
    this.enemyInfoText.setText(lines.join('\n')).setVisible(true);
    this.time.delayedCall(3000, () => this.enemyInfoText.setVisible(false));
  }

  // ============ オーバーレイ ============
  openInventory(tab: 'all' | 'equip' | 'items' = 'all') {
    this.inventoryTab = tab;
    this.inventoryScrollIndex = 0;
    this.setOverlay('inv');
  }

  setInventoryTab(tab: 'all' | 'equip' | 'items') {
    if (this.inventoryTab === tab) return;
    Audio.playSe('click');
    this.inventoryTab = tab;
    this.inventoryScrollIndex = 0;
    this.rebuildOverlay();
  }

  setOverlay(mode: 'none' | 'equip' | 'inv' | 'codex' | 'settings' | 'shop' | 'gacha' | 'pick') {
    if (this.gachaAnimating) return; // 演出中は切替禁止
    if (this.gs.pendingEquipment && mode !== 'equip') mode = 'equip';
    if (mode === 'equip' && this.overlayMode !== 'equip') this.equipScrollIndex = 0;
    if (mode === 'codex' && this.overlayMode !== 'codex') this.codexScrollRow = 0;
    if (mode !== 'equip') {
      this.secretDirection = null;
      this.secretAlternatingPresses = 0;
    }
    this.overlayMode = mode;
    if (mode === 'none') { this.overlay.setVisible(false); return; }
    this.overlay.setVisible(true);
    this.rebuildOverlay();
  }

  showForcedEquipmentSale() {
    if (this.gachaAnimating) return;
    this.overlayMode = 'equip';
    this.overlay.setVisible(true);
    this.rebuildOverlay();
  }

  handleEquipmentSecret(event: KeyboardEvent) {
    if (this.overlayMode === 'codex' && (event.code === 'ArrowUp' || event.code === 'ArrowDown')) {
      event.preventDefault();
      this.scrollCodex(event.code === 'ArrowDown' ? 1 : -1);
      return;
    }
    const equipmentListVisible = this.overlayMode === 'equip'
      || this.overlayMode === 'inv' && this.inventoryTab === 'equip';
    if (!equipmentListVisible || event.repeat || this.gs.secretDualUnlocked) return;
    const direction = event.code === 'ArrowLeft' ? 'left' : event.code === 'ArrowRight' ? 'right' : null;
    if (!direction) return;
    event.preventDefault();
    if (this.secretDirection && this.secretDirection !== direction) this.secretAlternatingPresses++;
    else this.secretAlternatingPresses = 1;
    this.secretDirection = direction;
    if (this.secretAlternatingPresses >= 10) {
      this.secretAlternatingPresses = 0;
      this.secretDirection = null;
      if (this.gs.unlockDualWieldSecret()) this.rebuildOverlay();
    }
  }

  scrollEquipment(delta: number) {
    if (this.overlayMode !== 'equip' || this.equipScrollMax <= 0) return;
    const next = Phaser.Math.Clamp(this.equipScrollIndex + delta, 0, this.equipScrollMax);
    if (next === this.equipScrollIndex) return;
    this.equipScrollIndex = next;
    this.rebuildOverlay();
  }

  scrollInventory(delta: number) {
    if (this.overlayMode !== 'inv' || this.inventoryScrollMax <= 0) return;
    const next = Phaser.Math.Clamp(this.inventoryScrollIndex + delta, 0, this.inventoryScrollMax);
    if (next === this.inventoryScrollIndex) return;
    this.inventoryScrollIndex = next;
    this.rebuildOverlay();
  }

  scrollCodex(delta: number) {
    if (this.overlayMode !== 'codex' || this.codexScrollMax <= 0) return;
    const next = Phaser.Math.Clamp(this.codexScrollRow + delta, 0, this.codexScrollMax);
    if (next === this.codexScrollRow) return;
    this.codexScrollRow = next;
    this.rebuildOverlay();
  }

  rebuildOverlay() {
    if (this.gachaAnimating) return; // 演出中に消さない
    this.overlay.removeAll(true);
    const { x, y, w, h } = this.L.ov;
    const g = this.add.graphics();
    g.fillStyle(0x061316, 0.985).fillRoundedRect(x, y, w, h, 14);
    g.fillStyle(0x143034, .26).fillRoundedRect(x + 5, y + 5, w - 10, h - 10, 10);
    g.lineStyle(1.5, 0x58d9d1).strokeRoundedRect(x, y, w, h, 14);
    this.overlay.add(g);

    const pickTitles = ['武器を変更', '服を変更', '盾を変更'];
    const title =
      this.overlayMode === 'equip' ? (this.gs.pendingEquipment ? '装備上限：売却が必要' : '装備・売却') :
      this.overlayMode === 'inv' ? '所持品・装備' :
      this.overlayMode === 'settings' ? '設定' :
      this.overlayMode === 'shop' ? 'フロアショップ' :
      this.overlayMode === 'gacha' ? 'ダンジョンガチャ' :
      this.overlayMode === 'pick' ? pickTitles[this.pickSlot] :
      'モンスター図鑑';
    this.overlay.add(this.add.text(x + 16, y + 12, title, {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '15px' : '18px',
      color: '#3fe0d0', fontStyle: 'bold', wordWrap: { width: w - 72 }
    }));
    // 閉じるボタン
    const cb = this.add.text(x + w - (IS_MOBILE ? 48 : 34), y + (IS_MOBILE ? 2 : 10), this.gs.pendingEquipment ? '🔒' : '✕', {
      fontFamily: 'sans-serif', fontSize: IS_MOBILE ? '25px' : '22px', color: '#ff8b8b',
      padding: IS_MOBILE ? { x: 10, y: 8 } : { x: 0, y: 0 }
    });
    if (!this.gs.pendingEquipment) {
      cb.setInteractive({ useHandCursor: true });
      cb.on('pointerdown', () => { Audio.playSe('click'); this.setOverlay('none'); });
    }
    this.overlay.add(cb);

    if (this.overlayMode === 'equip') this.buildEquipOverlay(x, y, w, h);
    else if (this.overlayMode === 'inv') this.buildUnifiedInventoryOverlay(x, y, w, h);
    else if (this.overlayMode === 'settings') this.buildSettingsOverlay(x, y, w, h);
    else if (this.overlayMode === 'shop') this.buildShopOverlay(x, y, w);
    else if (this.overlayMode === 'gacha') this.buildGachaOverlay(x, y, w, h);
    else if (this.overlayMode === 'pick') this.buildPickOverlay(x, y, w);
    else this.buildCodexOverlay(x, y, w, h);
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
        const elementColor = this.elementColor(wp.element);
        const frameCol = elementColor ?? gradeColor(wp.grade);
        const icon = this.framedIcon(x + 34, cy + 16, wp.key, frameCol, 36);
        const row = this.rowButton(x + 58, cy, w - 74, `${equipped ? '▶ ' : '　'}${weaponFullName(wp)}  攻${wp.atkMin}-${wp.atkMax}  耐久${wp.dur}/${wp.durMax}(${risk.label})  効果:${this.weaponEffectText(wp, true)}`, equipped, () => this.gs.equipWeapon(i));
        this.overlay.add([...icon, row]);
        cy += 38;
      });
    } else if (this.pickSlot === 1) {
      // 服・鎧
      if (p.armors.length === 0) { empty('（服を持っていない）'); return; }
      p.armors.forEach((armor, i) => {
        const equipped = armor === p.armor;
        const risk = durabilityRisk(armor.dur, armor.durMax);
        const texKey = isPlayerArmor(armor.key) ? armorTextureKey(armor.key) : 'armor_leather';
        const icon = this.framedIcon(x + 34, cy + 16, texKey, gradeColor(armor.grade), 36);
        const row = this.rowButton(x + 58, cy, w - 74,
          `${equipped ? '▶ ' : '　'}${armorFullName(armor)}  防御+${armor.defBonus + armor.plus}  耐久${armor.dur}/${armor.durMax}(${risk.label})`,
          equipped, () => this.gs.equipArmor(i));
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
        const elementColor = this.elementColor(sh.element);
        const frameCol = elementColor ?? gradeColor(sh.grade);
        const icon = this.framedIcon(x + 34, cy + 16, sh.key, frameCol, 36);
        const totalDef = sh.defBonus + (sh.plus ?? 0);
        const row = this.rowButton(x + 58, cy, w - 74, `${equipped ? '▶ ' : '　'}${shieldFullName(sh)}  防御+${totalDef}  耐久${sh.dur}/${sh.durMax}(${risk.label})  効果:${this.shieldEffectText(sh, true)}`, equipped, () => this.gs.equipShield(i));
        this.overlay.add([...icon, row]);
        cy += 38;
      });
    }
  }

  // 四角い枠つきアイコン（枠色を指定できる）
  framedIcon(cx: number, cy: number, texKey: string, frameColor: number, box = 36, tintColor?: number): Phaser.GameObjects.GameObject[] {
    const g = this.add.graphics();
    const hs = box / 2;
    g.fillStyle(0x10161f, 1).fillRoundedRect(cx - hs, cy - hs, box, box, 6);
    g.lineStyle(2.5, frameColor).strokeRoundedRect(cx - hs, cy - hs, box, box, 6);
    const icon = this.add.image(cx, cy, texKey).setDisplaySize(box - 2, box - 2);
    if (tintColor !== undefined) icon.setTintFill(tintColor);
    return [g, icon];
  }

  buildEquipOverlay(x: number, y: number, w: number, h: number) {
    const p = this.gs.player;
    const pending = this.gs.pendingEquipment;
    let listY = y + 72;

    this.overlay.add(this.add.text(x + 16, y + 45, `武器 ${p.weapons.length}/${EQUIPMENT_LIMIT}　服 ${p.armors.length}/${EQUIPMENT_LIMIT}　盾 ${p.shields.length}/${EQUIPMENT_LIMIT}`, {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '11px' : '13px', color: '#b8d8d6'
    }));

    if (pending) {
      const pendingName = pending.kind === 'weapon' ? weaponFullName(pending.item)
        : pending.kind === 'shield' ? shieldFullName(pending.item) : armorFullName(pending.item);
      const pendingKind = pending.kind === 'weapon' ? '武器' : pending.kind === 'shield' ? '盾' : '服';
      this.overlay.add(this.add.text(x + 16, y + 67, `${pendingKind}を1つ売ると「${pendingName}」を受け取ります。閉じることはできません。`, {
        fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '10px' : '12px', color: '#ffb36b',
        wordWrap: { width: w - 32 }
      }));
      listY = y + 103;
    }

    const entries: ({ kind: 'weapon'; item: Weapon; index: number } | { kind: 'armor'; item: Armor; index: number } | { kind: 'shield'; item: Shield; index: number })[] = [
      ...p.weapons.map((item, index) => ({ kind: 'weapon' as const, item, index })),
      ...p.armors.map((item, index) => ({ kind: 'armor' as const, item, index })),
      ...p.shields.map((item, index) => ({ kind: 'shield' as const, item, index }))
    ];
    const visibleCount = Math.min(8, Math.max(4, Math.floor((h - (pending ? 150 : 118)) / 38)));
    this.equipScrollMax = Math.max(0, entries.length - visibleCount);
    this.equipScrollIndex = Phaser.Math.Clamp(this.equipScrollIndex, 0, this.equipScrollMax);

    if (!entries.length) {
      this.overlay.add(this.add.text(x + 20, listY, '（所持装備なし）', { fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#8a97ab' }));
    }

    entries.slice(this.equipScrollIndex, this.equipScrollIndex + visibleCount).forEach((entry, visibleIndex) => {
      const cy = listY + visibleIndex * 38;
      const sellW = IS_MOBILE ? 86 : 98;
      if (entry.kind === 'weapon') {
        const wp = entry.item;
        const equipped = wp === p.weapon;
        const risk = durabilityRisk(wp.dur, wp.durMax);
        const elementColor = this.elementColor(wp.element);
        const icon = this.framedIcon(x + 34, cy + 14, wp.key, elementColor ?? gradeColor(wp.grade), 34);
        const row = this.rowButton(x + 56, cy, w - 78 - sellW, `⚔ ${equipped ? '▶ ' : ''}${weaponFullName(wp)}  耐久${wp.dur}/${wp.durMax}(${risk.label})  効果:${this.weaponEffectText(wp, true)}`, equipped, () => this.gs.equipWeapon(entry.index));
        const sell = this.rowButton(x + w - sellW - 10, cy, sellW,
          equipped ? '装備中' : `${IS_MOBILE ? '売' : '売却'} ${this.gs.weaponSellPrice(wp)}G`, false,
          () => this.gs.sellWeapon(entry.index), !equipped);
        this.overlay.add([...icon, row, sell]);
      } else if (entry.kind === 'armor') {
        const armor = entry.item;
        const equipped = armor === p.armor;
        const risk = durabilityRisk(armor.dur, armor.durMax);
        const texKey = isPlayerArmor(armor.key) ? armorTextureKey(armor.key) : 'armor_leather';
        const icon = this.framedIcon(x + 34, cy + 14, texKey, gradeColor(armor.grade), 34);
        const row = this.rowButton(x + 56, cy, w - 78 - sellW,
          `服 ${equipped ? '▶ ' : ''}${armorFullName(armor)}  防御+${armor.defBonus + armor.plus}  耐久${armor.dur}/${armor.durMax}(${risk.label})`,
          equipped, () => this.gs.equipArmor(entry.index));
        const sell = this.rowButton(x + w - sellW - 10, cy, sellW,
          equipped ? '装備中' : `${IS_MOBILE ? '売' : '売却'} ${this.gs.armorSellPrice(armor)}G`, false,
          () => this.gs.sellArmor(entry.index), !equipped);
        this.overlay.add([...icon, row, sell]);
      } else {
        const sh = entry.item;
        const equipped = sh === p.shield;
        const risk = durabilityRisk(sh.dur, sh.durMax);
        const totalDef = sh.defBonus + (sh.plus ?? 0);
        const elementColor = this.elementColor(sh.element);
        const icon = this.framedIcon(x + 34, cy + 14, sh.key, elementColor ?? gradeColor(sh.grade), 34);
        const row = this.rowButton(x + 56, cy, w - 78 - sellW, `🛡 ${equipped ? '▶ ' : ''}${shieldFullName(sh)}  防御+${totalDef}  耐久${sh.dur}/${sh.durMax}(${risk.label})  効果:${this.shieldEffectText(sh, true)}`, equipped, () => this.gs.equipShield(entry.index));
        const sell = this.rowButton(x + w - sellW - 10, cy, sellW,
          equipped ? '装備中' : `${IS_MOBILE ? '売' : '売却'} ${this.gs.shieldSellPrice(sh)}G`, false,
          () => this.gs.sellShield(entry.index), !equipped);
        this.overlay.add([...icon, row, sell]);
      }
    });

    if (this.equipScrollMax > 0) {
      const navY = y + h - 38;
      const up = this.rowButton(x + w / 2 - 92, navY, 54, '▲', false, () => { Audio.playSe('click'); this.scrollEquipment(-1); }, this.equipScrollIndex > 0);
      const down = this.rowButton(x + w / 2 + 38, navY, 54, '▼', false, () => { Audio.playSe('click'); this.scrollEquipment(1); }, this.equipScrollIndex < this.equipScrollMax);
      const rangeEnd = Math.min(entries.length, this.equipScrollIndex + visibleCount);
      const page = this.add.text(x + w / 2, navY + 14, `${this.equipScrollIndex + 1}-${rangeEnd} / ${entries.length}`, {
        fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#9fb4c4'
      }).setOrigin(0.5);
      this.overlay.add([up, page, down]);
    }
  }

  buildUnifiedInventoryOverlay(x: number, y: number, w: number, h: number) {
    const p = this.gs.player;
    const tabGap = 6;
    const tabW = (w - 32 - tabGap * 2) / 3;
    const tabs: { key: 'all' | 'equip' | 'items'; label: string }[] = [
      { key: 'all', label: 'すべて' },
      { key: 'equip', label: '装備' },
      { key: 'items', label: '道具' }
    ];
    tabs.forEach((tab, index) => {
      const button = this.rowButton(
        x + 16 + index * (tabW + tabGap), y + 44, tabW, tab.label,
        this.inventoryTab === tab.key,
        () => this.setInventoryTab(tab.key)
      );
      this.overlay.add(button);
    });

    const armor = p.armor;
    const summaryY = y + 80;
    const cardGap = 6;
    const cardW = (w - 32 - cardGap * 2) / 3;
    const equippedCards: {
      label: string;
      name: string;
      sub: string;
      texture?: string;
      frame?: number;
      color: number;
      slot?: number;
    }[] = [
      {
        label: '武器',
        name: p.weapon ? weaponFullName(p.weapon) : '素手',
        sub: p.weapon ? `攻${p.weapon.atkMin}-${p.weapon.atkMax}　耐久${p.weapon.dur}/${p.weapon.durMax}` : '装備なし',
        texture: p.weapon?.key,
        color: p.weapon ? this.elementColor(p.weapon.element) ?? gradeColor(p.weapon.grade) : 0x36585d,
        slot: 0
      },
      {
        label: '服',
        name: armor ? armorFullName(armor) : '装備なし',
        sub: armor ? `防+${armor.defBonus + armor.plus}　耐久${armor.dur}/${armor.durMax}` : '装備なし',
        texture: armor ? armorTextureKey(armor.key) : undefined,
        color: armor ? gradeColor(armor.grade) : 0x36585d,
        slot: 1
      },
      {
        label: '盾',
        name: p.weapon?.dual ? '二刀流中' : p.shield ? shieldFullName(p.shield) : '装備なし',
        sub: p.weapon?.dual ? '盾は装備できない' : p.shield ? `防+${p.shield.defBonus + p.shield.plus}　耐久${p.shield.dur}/${p.shield.durMax}` : '装備なし',
        texture: p.weapon?.dual ? p.weapon.key : p.shield?.key,
        color: p.weapon?.dual
          ? this.elementColor(p.weapon.element) ?? gradeColor(p.weapon.grade)
          : p.shield ? this.elementColor(p.shield.element) ?? gradeColor(p.shield.grade) : 0x36585d,
        slot: 2
      }
    ];

    equippedCards.forEach((card, index) => {
      const px = x + 16 + index * (cardW + cardGap);
      const bg = this.add.graphics();
      bg.fillStyle(0x0a1c20, 0.98).fillRoundedRect(px, summaryY, cardW, 72, 7);
      bg.lineStyle(1.5, card.color, 0.95).strokeRoundedRect(px, summaryY, cardW, 72, 7);
      const label = this.add.text(px + 8, summaryY + 5, card.label, {
        fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '9px' : '11px', color: '#8fded8', fontStyle: 'bold'
      });
      const name = this.add.text(px + 48, summaryY + 25, card.name, {
        fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '8px' : '11px', color: '#eef6f7', fontStyle: 'bold',
        wordWrap: { width: cardW - 54 }
      }).setOrigin(0, 0.5);
      const sub = this.add.text(px + 48, summaryY + 50, card.sub, {
        fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '7px' : '9px', color: '#9fb4c4',
        wordWrap: { width: cardW - 54 }
      }).setOrigin(0, 0.5);
      this.overlay.add([bg, label, name, sub]);
      if (card.texture && this.textures.exists(card.texture)) {
        const icon = this.add.image(px + 27, summaryY + 43, card.texture, card.frame)
          .setDisplaySize(IS_MOBILE ? 34 : 40, IS_MOBILE ? 34 : 40);
        this.overlay.add(icon);
      }
      if (card.slot !== undefined) {
        const zone = this.add.zone(px, summaryY, cardW, 72).setOrigin(0).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => {
          Audio.playSe('click');
          this.pickSlot = card.slot!;
          this.setOverlay('pick');
        });
        this.overlay.add(zone);
      }
    });

    type UnifiedEntry =
      | { type: 'weapon'; item: Weapon; index: number }
      | { type: 'armor'; item: Armor; index: number }
      | { type: 'shield'; item: Shield; index: number }
      | { type: 'item'; group: { kind: ItemKind; item: Item; count: number; firstIndex: number } };
    const equipmentEntries: UnifiedEntry[] = [
      ...p.weapons.map((item, index) => ({ type: 'weapon' as const, item, index })),
      ...p.armors.map((item, index) => ({ type: 'armor' as const, item, index })),
      ...p.shields.map((item, index) => ({ type: 'shield' as const, item, index }))
    ];
    const itemEntries: UnifiedEntry[] = this.stackInventory(p.inventory)
      .map((group) => ({ type: 'item' as const, group }));
    const entries = this.inventoryTab === 'equip' ? equipmentEntries
      : this.inventoryTab === 'items' ? itemEntries
      : [...equipmentEntries, ...itemEntries];

    const listTitle = this.inventoryTab === 'equip'
      ? `所持装備　武器 ${p.weapons.length}/${EQUIPMENT_LIMIT}　服 ${p.armors.length}/${EQUIPMENT_LIMIT}　盾 ${p.shields.length}/${EQUIPMENT_LIMIT}`
      : this.inventoryTab === 'items'
        ? `道具　${p.inventory.length}/60`
        : `所持品一覧　装備 ${equipmentEntries.length}　道具 ${p.inventory.length}`;
    this.overlay.add(this.add.text(x + 16, y + 160, listTitle, {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '10px' : '12px', color: '#b8d8d6'
    }));

    const listY = y + 181;
    const visibleCount = Math.max(4, Math.floor((h - 223) / 36));
    this.inventoryScrollMax = Math.max(0, entries.length - visibleCount);
    this.inventoryScrollIndex = Phaser.Math.Clamp(this.inventoryScrollIndex, 0, this.inventoryScrollMax);

    if (!entries.length) {
      this.overlay.add(this.add.text(x + 20, listY + 8, '（この分類には何もありません）', {
        fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#8a97ab'
      }));
    }

    entries.slice(this.inventoryScrollIndex, this.inventoryScrollIndex + visibleCount).forEach((entry, visibleIndex) => {
      const cy = listY + visibleIndex * 36;
      const actionW = IS_MOBILE ? 72 : 94;
      if (entry.type === 'weapon') {
        const wp = entry.item;
        const equipped = wp === p.weapon;
        const risk = durabilityRisk(wp.dur, wp.durMax);
        const icon = this.framedIcon(x + 33, cy + 14, wp.key, this.elementColor(wp.element) ?? gradeColor(wp.grade), 32);
        const row = this.rowButton(x + 54, cy, w - 76 - actionW, `⚔ ${equipped ? '▶ ' : ''}${weaponFullName(wp)}　耐久${wp.dur}/${wp.durMax}(${risk.label})　${this.weaponEffectText(wp, true)}`, equipped, () => this.gs.equipWeapon(entry.index));
        const action = this.rowButton(x + w - actionW - 10, cy, actionW,
          equipped ? '装備中' : `売却 ${this.gs.weaponSellPrice(wp)}G`, false,
          () => this.gs.sellWeapon(entry.index), !equipped);
        this.overlay.add([...icon, row, action]);
      } else if (entry.type === 'armor') {
        const armor = entry.item;
        const equipped = armor === p.armor;
        const risk = durabilityRisk(armor.dur, armor.durMax);
        const texKey = isPlayerArmor(armor.key) ? armorTextureKey(armor.key) : 'armor_leather';
        const icon = this.framedIcon(x + 33, cy + 14, texKey, gradeColor(armor.grade), 32);
        const row = this.rowButton(x + 54, cy, w - 76 - actionW,
          `服 ${equipped ? '▶ ' : ''}${armorFullName(armor)}　防+${armor.defBonus + armor.plus}　耐久${armor.dur}/${armor.durMax}(${risk.label})`,
          equipped, () => this.gs.equipArmor(entry.index));
        const action = this.rowButton(x + w - actionW - 10, cy, actionW,
          equipped ? '装備中' : `売却 ${this.gs.armorSellPrice(armor)}G`, false,
          () => this.gs.sellArmor(entry.index), !equipped);
        this.overlay.add([...icon, row, action]);
      } else if (entry.type === 'shield') {
        const sh = entry.item;
        const equipped = sh === p.shield;
        const risk = durabilityRisk(sh.dur, sh.durMax);
        const icon = this.framedIcon(x + 33, cy + 14, sh.key, this.elementColor(sh.element) ?? gradeColor(sh.grade), 32);
        const row = this.rowButton(x + 54, cy, w - 76 - actionW, `🛡 ${equipped ? '▶ ' : ''}${shieldFullName(sh)}　防+${sh.defBonus + sh.plus}　耐久${sh.dur}/${sh.durMax}(${risk.label})`, equipped, () => this.gs.equipShield(entry.index));
        const action = this.rowButton(x + w - actionW - 10, cy, actionW,
          equipped ? '装備中' : `売却 ${this.gs.shieldSellPrice(sh)}G`, false,
          () => this.gs.sellShield(entry.index), !equipped);
        this.overlay.add([...icon, row, action]);
      } else {
        const group = entry.group;
        const count = group.count > 1 ? ` ×${group.count}` : '';
        const icon = this.framedIcon(x + 33, cy + 14, group.item.textureKey, isRareItem(group.kind) ? 0xff5f67 : 0x2f6f6a, 32);
        const use = () => { this.gs.useItem(group.firstIndex); this.setOverlay('inv'); };
        const row = this.rowButton(x + 54, cy, w - 76 - actionW, `${group.item.name}${count}　—　${group.item.desc}`, false, use);
        const action = this.rowButton(x + w - actionW - 10, cy, actionW, '使用', false, use);
        this.overlay.add([...icon, row, action]);
      }
    });

    if (this.inventoryScrollMax > 0) {
      const navY = y + h - 38;
      const up = this.rowButton(x + w / 2 - 92, navY, 54, '▲', false, () => { Audio.playSe('click'); this.scrollInventory(-1); }, this.inventoryScrollIndex > 0);
      const down = this.rowButton(x + w / 2 + 38, navY, 54, '▼', false, () => { Audio.playSe('click'); this.scrollInventory(1); }, this.inventoryScrollIndex < this.inventoryScrollMax);
      const rangeEnd = Math.min(entries.length, this.inventoryScrollIndex + visibleCount);
      const page = this.add.text(x + w / 2, navY + 14, `${this.inventoryScrollIndex + 1}-${rangeEnd} / ${entries.length}`, {
        fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#9fb4c4'
      }).setOrigin(0.5);
      this.overlay.add([up, page, down]);
    }
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

  buildCodexOverlay(x: number, y: number, w: number, h: number) {
    const columns = w >= 640 ? 4 : 3;
    const gap = 6;
    const rowH = 40;
    const colW = (w - 32 - gap * (columns - 1)) / columns;
    const startY = y + 66;
    const totalRows = Math.ceil(MONSTER_DEFS.length / columns);
    const visibleRows = Math.max(3, Math.floor((h - 106) / rowH));
    this.codexScrollMax = Math.max(0, totalRows - visibleRows);
    this.codexScrollRow = Phaser.Math.Clamp(this.codexScrollRow, 0, this.codexScrollMax);
    const firstIndex = this.codexScrollRow * columns;
    const lastIndex = Math.min(MONSTER_DEFS.length, (this.codexScrollRow + visibleRows) * columns);

    this.overlay.add(this.add.text(x + 16, y + 43, 'ホイール／上下ボタン／スワイプでスクロール', {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '10px' : '11px', color: '#86a9ad'
    }));

    MONSTER_DEFS.slice(firstIndex, lastIndex).forEach((m, visibleIndex) => {
      const i = firstIndex + visibleIndex;
      const found = this.gs.discovered.has(m.key);
      const col = i % columns;
      const px = x + 16 + col * (colW + gap);
      const py = startY + (Math.floor(i / columns) - this.codexScrollRow) * rowH;
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
      const element = monsterElement(m);
      const weakness = ELEMENT_INFO[element].weakTo;
      this.overlay.add(this.add.text(px + 29, py + 15, found ? `${ELEMENT_INFO[element].name}/弱${ELEMENT_INFO[weakness].name} 体力${m.hp} 攻${m.atkMin}-${m.atkMax}` : `???  ${m.minFloor}-${m.maxFloor}階`, {
        fontFamily: '"Yu Gothic UI"', fontSize: '8px', color: found ? '#8fc8d7' : '#465264'
      }));
      const trait = found ? (m.gimmickText ?? '固有効果なし') : '効果 ???';
      this.overlay.add(this.add.text(px + 29, py + 25, trait, {
        fontFamily: '"Yu Gothic UI"', fontSize: '7px', color: found ? '#e7c96d' : '#465264',
        wordWrap: { width: Math.max(60, colW - 34) }, maxLines: 1
      }));
    });

    if (this.codexScrollMax > 0) {
      const navY = y + h - 36;
      const up = this.rowButton(x + w / 2 - 94, navY, 54, '▲', false, () => {
        Audio.playSe('click');
        this.scrollCodex(-1);
      }, this.codexScrollRow > 0);
      const down = this.rowButton(x + w / 2 + 40, navY, 54, '▼', false, () => {
        Audio.playSe('click');
        this.scrollCodex(1);
      }, this.codexScrollRow < this.codexScrollMax);
      const status = this.add.text(x + w / 2, navY + 14, `${this.codexScrollRow + 1} / ${this.codexScrollMax + 1}`, {
        fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#9fb4c4'
      }).setOrigin(0.5);
      this.overlay.add([up, down, status]);

      const dragZone = this.add.zone(x + 12, startY, w - 24, visibleRows * rowH - 3)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });
      let dragStartY: number | null = null;
      const finishDrag = (pointer: Phaser.Input.Pointer) => {
        if (dragStartY === null) return;
        const deltaRows = Math.round((dragStartY - pointer.y) / rowH);
        dragStartY = null;
        if (deltaRows !== 0) this.scrollCodex(deltaRows);
      };
      dragZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => { dragStartY = pointer.y; });
      dragZone.on('pointerup', finishDrag);
      dragZone.on('pointerupoutside', finishDrag);
      this.overlay.add(dragZone);
    }
  }

  // ============ フロアショップ ============
  buildShopOverlay(x: number, y: number, w: number) {
    const p = this.gs.player;
    this.overlay.add(this.add.text(x + w - 58, y + 16, `所持 ${p.gold} G`, {
      fontFamily: '"Yu Gothic UI"', fontSize: '16px', color: '#f5c542', fontStyle: 'bold'
    }).setOrigin(1, 0));
    this.overlay.add(this.add.text(x + 24, y + 58, '強化スクロールの販売は終了しました。変身スクロールはショップ限定・各階1枚、効果は30ターンです。', {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '11px' : '13px', color: '#9db8b9',
      wordWrap: { width: w - 48 }
    }));

    const rows: { kind: 'potion' | 'slime_scroll' | 'boss5_scroll'; price: number; label: string }[] = [
      { kind: 'potion', price: 25, label: '回復ポーション　体力を40回復' },
      { kind: 'slime_scroll', price: 500, label: 'スライム変身スクロール　装備効果を継承して30ターン変身' },
      { kind: 'boss5_scroll', price: 500, label: '封印王変身スクロール　5Fボスへ30ターン変身' }
    ];
    let cy = y + (IS_MOBILE ? 112 : 102);
    for (const row of rows) {
      const remaining = this.gs.shopRemaining(row.kind);
      const color = row.kind === 'potion' ? 0x61c78d : row.kind === 'slime_scroll' ? 0x70e2c2 : 0xffc96b;
      const card = this.add.graphics();
      const cardH = IS_MOBILE ? 104 : 88;
      card.fillStyle(0x111f26, .98).fillRoundedRect(x + 20, cy, w - 40, cardH, 10);
      card.lineStyle(1.5, remaining > 0 ? color : 0x4c5663, .9).strokeRoundedRect(x + 20, cy, w - 40, cardH, 10);
      const icon = this.add.image(x + (IS_MOBILE ? 54 : 62), cy + cardH / 2, `i_${row.kind}`)
        .setDisplaySize(IS_MOBILE ? 42 : 48, IS_MOBILE ? 42 : 48);
      const textX = x + (IS_MOBILE ? 86 : 104);
      const title = this.add.text(textX, cy + (IS_MOBILE ? 11 : 16), row.label, {
        fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '12px' : '14px', color: '#eef5ff', fontStyle: 'bold',
        wordWrap: { width: IS_MOBILE ? w - 118 : w - 210 }
      });
      const stock = this.add.text(textX, cy + (IS_MOBILE ? 49 : 48), `価格 ${row.price}G　残り ${remaining}`, {
        fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '11px' : '13px', color: remaining > 0 ? '#b8d8d6' : '#ff7b82'
      });
      const button = this.rowButton(
        IS_MOBILE ? textX : x + w - 168,
        cy + (IS_MOBILE ? 70 : 30),
        IS_MOBILE ? 126 : 128,
        remaining > 0 ? '購入する' : '売り切れ',
        remaining > 0,
        () => {
        if (this.gs.buyItem(row.kind)) this.setOverlay('shop');
        }
      );
      this.overlay.add([card, icon, title, stock, button]);
      cy += IS_MOBILE ? 116 : 102;
    }
  }

  // ============ ガチャ ============
  buildGachaOverlay(x: number, y: number, w: number, h: number) {
    const p = this.gs.player;
    // 所持ゴールド（右端の✕ボタンと重ならないよう左に寄せる）
    this.overlay.add(this.add.text(x + w - 60, y + 16, `所持 ${p.gold} G`, {
      fontFamily: '"Yu Gothic UI"', fontSize: '16px', color: '#f5c542', fontStyle: 'bold'
    }).setOrigin(1, 0));

    this.overlay.add(this.add.text(x + w / 2, y + 54, '古代遺物召喚', {
      fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#58d9d1', fontStyle: 'bold', letterSpacing: 3
    }).setOrigin(0.5));

    // 説明
    this.overlay.add(this.add.text(x + w / 2, y + 79, '500Gで武器・服・盾を召喚。等級に応じた装備が排出', {
      fontFamily: '"Yu Gothic UI"', fontSize: '15px', color: '#eef3ee', fontStyle: 'bold'
    }).setOrigin(0.5));

    // 排出ランク表
    this.overlay.add(this.add.text(x + w / 2, y + 132, [
      'SS  3%     S  12%     A  25%     B  35%     C  25%',
      '装備等級:  SS→S　S→A　A→B　B→C　C→D',
      '排出カテゴリ: 武器50%　盾40%　服10%  /  属性装備は約5%',
      this.gs.weaponWonThisFloor
        ? 'この階の武器は取得済み  /  以降は盾80%・服20%'
        : '武器は1階につき最大1本'
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
    const idle = this.add.image(x + w / 2, y + h / 2 + 28, 'chest_rare').setDisplaySize(96, 96);
    this.tweens.add({ targets: idle, y: '-=10', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: idleGlow, alpha: 0.15, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: idleRing, angle: 360, duration: 9000, repeat: -1 });
    this.tweens.add({ targets: idleRing2, angle: -360, duration: 13000, repeat: -1 });
    this.overlay.add([idleGlow, idleRing2, idleRing, idle]);

    // 回すボタン
    const bw = 260, bh = 54, bx = x + w / 2 - bw / 2, by = y + h - 84;
    const afford = p.gold >= 500;
    const g = this.add.graphics();
    const draw = (c: number) => {
      g.clear();
      g.fillStyle(c, 1).fillRoundedRect(bx, by, bw, bh, 12);
      g.lineStyle(2, afford ? 0xe7b85e : 0x555f70).strokeRoundedRect(bx, by, bw, bh, 12);
    };
    draw(afford ? 0x49361d : 0x142125);
    const bt = this.add.text(bx + bw / 2, by + bh / 2, '◆  500Gで召喚', {
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
  playGachaAnimation(result: GachaResult) {
    this.gachaAnimating = true;
    // モーダル（ガチャウィンドウ）の矩形。演出はすべてこの中で完結させる
    const { x: mx, y: my, w: mw, h: mh } = this.L.ov;
    const cx = mx + mw / 2, cy = Math.min(my + mh / 2 + 10, my + 320);
    const high = result.rank === 'SS' || result.rank === 'S';
    const mid = result.rank === 'A';
    const rankTitle: Record<GachaResult['rank'], string> = {
      SS: '神話遺物', S: '伝説遺物', A: '秘術遺物', B: '希少遺物', C: '遺物'
    };
    const starCount: Record<GachaResult['rank'], number> = { SS: 5, S: 4, A: 3, B: 2, C: 1 };
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

    const ritualTag = track(this.add.text(cx, my + 28, '禁忌の宝物庫　／　遺物召喚', {
      fontFamily: '"Yu Gothic UI"', fontSize: '10px', color: '#69efe4', fontStyle: 'bold', letterSpacing: 3
    }).setOrigin(.5).setDepth(307));
    const phaseText = track(this.add.text(cx, my + 49, '封印同調　00%', {
      fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#8ca2a5', fontStyle: 'bold', letterSpacing: 2
    }).setOrigin(.5).setDepth(307));

    // ---- 暗幕（モーダル内だけ暗くする）----
    const dim = track(this.add.rectangle(cx, my + mh / 2, mw, mh, 0x000000, 0.88).setDepth(300).setAlpha(0));
    this.tweens.add({ targets: dim, alpha: 1, duration: 200 });

    // ---- 儀式空間：星屑、走査線、上下のシネマバー ----
    const vaultBg = track(this.add.graphics().setDepth(300.5).setAlpha(0));
    vaultBg.fillGradientStyle(0x081e24, 0x081e24, 0x010506, 0x010506, .96);
    vaultBg.fillRect(mx, my, mw, mh);
    vaultBg.fillStyle(0x000000, .58).fillRect(mx, my, mw, 62).fillRect(mx, my + mh - 48, mw, 48);
    vaultBg.lineStyle(1, 0x58d9d1, .18);
    for (let sy = my + 66; sy < my + mh - 48; sy += 12) vaultBg.lineBetween(mx + 10, sy, mx + mw - 10, sy);
    this.tweens.add({ targets: vaultBg, alpha: 1, duration: 320 });

    const cornerFrame = track(this.add.graphics().setDepth(306).setAlpha(0));
    cornerFrame.lineStyle(2, 0x67eee4, .66);
    const corner = 34, inset = 15;
    cornerFrame.lineBetween(mx + inset, my + inset, mx + inset + corner, my + inset);
    cornerFrame.lineBetween(mx + inset, my + inset, mx + inset, my + inset + corner);
    cornerFrame.lineBetween(mx + mw - inset, my + inset, mx + mw - inset - corner, my + inset);
    cornerFrame.lineBetween(mx + mw - inset, my + inset, mx + mw - inset, my + inset + corner);
    cornerFrame.lineBetween(mx + inset, my + mh - inset, mx + inset + corner, my + mh - inset);
    cornerFrame.lineBetween(mx + inset, my + mh - inset, mx + inset, my + mh - inset - corner);
    cornerFrame.lineBetween(mx + mw - inset, my + mh - inset, mx + mw - inset - corner, my + mh - inset);
    cornerFrame.lineBetween(mx + mw - inset, my + mh - inset, mx + mw - inset, my + mh - inset - corner);
    this.tweens.add({ targets: cornerFrame, alpha: 1, duration: 500 });

    for (let i = 0; i < (IS_MOBILE ? 22 : 36); i++) {
      const star = track(this.add.circle(
        mx + 18 + Math.random() * (mw - 36), my + 66 + Math.random() * (mh - 122),
        .7 + Math.random() * 1.6, i % 5 === 0 ? 0xe7b85e : 0x65e9df, .16 + Math.random() * .34
      ).setDepth(301));
      this.tweens.add({
        targets: star, alpha: { from: .08, to: .65 }, scale: { from: .6, to: 1.5 },
        duration: 750 + Math.random() * 1400, delay: Math.random() * 500,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    // ---- 隙間から漏れる光（宝箱の奥で脈動）----
    const leak = track(this.add.image(cx, cy + 40, 'glow').setDepth(301)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff2c0).setAlpha(0).setScale(0.5));
    const sealOuter = track(this.add.circle(cx, cy + 18, 104, 0x58d9d1, .025)
      .setStrokeStyle(2, 0x58d9d1, .38).setDepth(301));
    const sealInner = track(this.add.circle(cx, cy + 18, 78, 0xffffff, .012)
      .setStrokeStyle(1, 0xffffff, .22).setDepth(301));
    this.tweens.add({ targets: sealOuter, angle: 360, duration: 9000, repeat: -1 });
    this.tweens.add({ targets: sealInner, angle: -360, duration: 6500, repeat: -1 });

    const sigil = track(this.add.graphics().setDepth(302).setAlpha(.72));
    sigil.lineStyle(1.5, 0x8ffaf1, .38);
    sigil.strokeTriangle(0, -106, -82, 44, 82, 44);
    sigil.strokeTriangle(0, 76, -82, -74, 82, -74);
    sigil.strokeCircle(0, 0, 55);
    sigil.setPosition(cx, cy + 18);
    this.tweens.add({ targets: sigil, angle: 360, duration: 18000, repeat: -1 });

    const glyphs = ['ᚱ', 'ᛖ', 'ᛚ', 'ᛁ', 'ᚲ', 'ᛋ'];
    glyphs.forEach((glyph, index) => {
      const angle = (index / glyphs.length) * Math.PI * 2 - Math.PI / 2;
      const glyphText = track(this.add.text(cx + Math.cos(angle) * 126, cy + 18 + Math.sin(angle) * 126, glyph, {
        fontFamily: 'serif', fontSize: '18px', color: '#7aece4', fontStyle: 'bold'
      }).setOrigin(.5).setAlpha(.54).setDepth(302));
      this.tweens.add({ targets: glyphText, alpha: .95, duration: 700 + index * 90, yoyo: true, repeat: -1 });
    });

    // ---- 宝箱が空から落ちてくる ----
    const chest = track(this.add.image(cx, -80, 'chest_rare').setDepth(303).setDisplaySize(104, 104));
    this.tweens.add({ targets: chest, y: cy + 20, duration: 650, ease: 'Bounce.easeOut', delay: 150 });

    // 着地：土煙＋振動
    this.time.delayedCall(830, () => {
      phaseText.setText('共鳴を検知　32%');
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
      phaseText.setText('遺物等級を鑑定　64%');
      Audio.playSe('warp');
      this.tweens.add({ targets: chest, angle: { from: -3.5, to: 3.5 }, duration: 85, yoyo: true, repeat: 13 });
      this.tweens.add({ targets: leak, alpha: 0.85, scale: 2.3, duration: 1100, ease: 'Quad.easeIn' });
      // 漏れ光が白→ランク色へ変わる（正体が見え始める）
      this.time.delayedCall(550, () => {
        leak.setTint(result.color);
        sealOuter.setFillStyle(result.color, .035).setStrokeStyle(3, result.color, .72);
        phaseText.setText('遺物等級が確定　100%').setColor(colHex);
      });
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
      chest.setAngle(0).setTexture('chest_rare_open').setDisplaySize(104, 104);
      leak.setAlpha(0);
      ritualTag.setText(`${rankTitle[result.rank]}　／　獲得`).setColor(colHex);
      phaseText.setAlpha(0);
      Audio.playSe(result.rank === 'SS' ? 'levelup' : result.rank === 'S' ? 'kill' : 'chest');

      // 開封の炸裂
      const burst = track(this.add.image(cx, chest.y - 10, 'fx_hit').setDepth(304).setScale(1.2)
        .setBlendMode(Phaser.BlendModes.ADD).setTint(result.color));
      this.tweens.add({ targets: burst, scale: high ? 5.5 : 3.0, alpha: 0, duration: 500 });

      // 品物のY位置（宝箱の上空・モーダル内に収まる固定高さ）
      const itemY = IS_MOBILE ? my + 315 : my + Math.min(180, mh * .42);

      const rewardCard = track(this.add.graphics().setDepth(302).setAlpha(0));
      const cardW = Math.min(mw - 52, IS_MOBILE ? 330 : 500);
      const cardX = cx - cardW / 2;
      rewardCard.fillGradientStyle(0x0b2428, 0x0b2428, 0x03090b, 0x03090b, .98);
      rewardCard.fillRoundedRect(cardX, my + 66, cardW, mh - 112, 18);
      rewardCard.fillStyle(result.color, .14).fillRoundedRect(cardX + 1, my + 67, cardW - 2, 48, 17);
      rewardCard.lineStyle(2.5, result.color, .86).strokeRoundedRect(cardX, my + 66, cardW, mh - 112, 18);
      rewardCard.lineStyle(1, 0xffffff, .13).strokeRoundedRect(cardX + 9, my + 75, cardW - 18, mh - 130, 12);
      rewardCard.lineStyle(1, result.color, .45).lineBetween(cardX + 22, my + 116, cardX + cardW - 22, my + 116);
      this.tweens.add({ targets: rewardCard, alpha: 1, duration: 360 });

      // 回転する光背レイ（品物の後ろ）
      const rays = track(this.add.graphics().setDepth(303).setBlendMode(Phaser.BlendModes.ADD));
      const rayAlpha = high ? 0.18 : mid ? 0.13 : 0.08;
      rays.fillStyle(result.color, rayAlpha);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const a2 = a + 0.065;
        rays.fillTriangle(0, 0, Math.cos(a) * 195, Math.sin(a) * 195, Math.cos(a2) * 195, Math.sin(a2) * 195);
      }
      rays.setPosition(cx, itemY).setAlpha(0);
      this.tweens.add({ targets: rays, alpha: 1, duration: 350, delay: 150 });
      this.tweens.add({ targets: rays, angle: 360, duration: high ? 8000 : 15000, repeat: -1 });

      // 品物が宝箱から飛び出して浮かぶ
      const itemPlate = track(this.add.circle(cx, itemY, 57, 0x020708, .82)
        .setStrokeStyle(2, result.color, .72).setDepth(304).setScale(.45).setAlpha(0));
      this.tweens.add({ targets: itemPlate, scale: 1, alpha: 1, duration: 420, delay: 160, ease: 'Back.easeOut' });
      const halo = track(this.add.image(cx, itemY, 'glow').setDepth(305)
        .setBlendMode(Phaser.BlendModes.ADD).setTint(result.color).setAlpha(0).setScale(1.6));
      this.tweens.add({ targets: halo, alpha: 0.5, duration: 500, delay: 200 });
      if (result.hasEffect || result.elementColor !== undefined) {
        const effectFrame = track(this.add.graphics().setDepth(306).setAlpha(0));
        effectFrame.lineStyle(4, result.elementColor ?? result.color, 1).strokeRoundedRect(cx - 48, itemY - 48, 96, 96, 12);
        this.tweens.add({ targets: effectFrame, alpha: 1, duration: 300, delay: 300 });
      }
      const icon = track(this.add.image(cx, chest.y - 6, result.texKey).setDepth(306).setDisplaySize(22, 22).setAlpha(0));
      if (result.tintIcon && result.elementColor !== undefined) icon.setTintFill(result.elementColor);
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

      const stars = track(this.add.text(cx, itemY - 76, '★'.repeat(starCount[result.rank]), {
        fontFamily: '"Yu Gothic UI"', fontSize: result.rank === 'SS' ? '18px' : '15px',
        color: colHex, fontStyle: 'bold', letterSpacing: 5
      }).setOrigin(.5).setStroke('#000000', 4).setAlpha(0).setDepth(307));
      this.tweens.add({ targets: stars, alpha: 1, y: itemY - 82, duration: 360, delay: 540, ease: 'Back.easeOut' });

      // 品名・性能要約・終了ボタン
      const nameY = itemY + 66;
      const nameText = track(this.add.text(cx, nameY + 8, result.name, {
        fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '15px' : '20px', color: '#ffffff', fontStyle: 'bold',
        align: 'center', wordWrap: { width: cardW - 48 }
      }).setOrigin(0.5).setStroke('#000000', 6).setAlpha(0).setDepth(307));
      if (nameText.width > cardW - 48) nameText.setFontSize(IS_MOBILE ? 12 : 15);
      this.tweens.add({ targets: nameText, alpha: 1, y: nameY, duration: 350, delay: 500 });

      const metaParts = [`${result.category} / 等級 ${result.grade}`, result.elementName ?? '無属性'];
      if (result.feature) metaParts.push(`固有効果: ${result.feature}`);
      const meta = track(this.add.text(cx, itemY + 102, metaParts.join('   ◆   '), {
        fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '9px' : '11px', color: '#b8d8d6',
        fontStyle: 'bold', align: 'center', wordWrap: { width: cardW - 52 }
      }).setOrigin(.5).setAlpha(0).setDepth(307));
      this.tweens.add({ targets: meta, alpha: 1, duration: 350, delay: 680 });

      const hintY = Math.min(my + mh - 70, itemY + 140);
      const hintBg = track(this.add.graphics().setDepth(306).setAlpha(0));
      hintBg.fillStyle(result.color, .14).fillRoundedRect(cx - 105, hintY - 14, 210, 28, 14);
      hintBg.lineStyle(1, result.color, .52).strokeRoundedRect(cx - 105, hintY - 14, 210, 28, 14);
      this.tweens.add({ targets: hintBg, alpha: 1, duration: 350, delay: 850 });
      const hint = track(this.add.text(cx, hintY, 'タップして続ける', {
        fontFamily: '"Yu Gothic UI"', fontSize: '10px', color: '#f6e2ac', fontStyle: 'bold', letterSpacing: 2
      }).setOrigin(0.5).setAlpha(0).setDepth(307));
      this.tweens.add({ targets: hint, alpha: 1, duration: 350, delay: 800 });
      const acquired = track(this.add.text(cx, my + mh - 38, '新たな遺物を獲得', {
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

  rowButton(x: number, y: number, w: number, label: string, highlight: boolean, onClick: () => void, enabled = true) {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();
    const base = !enabled ? 0x141a22 : highlight ? 0x264a48 : 0x1c2536;
    g.fillStyle(base, 1).fillRoundedRect(x, y, w, 28, 5);
    g.lineStyle(1, enabled ? 0x2f6f6a : 0x303946).strokeRoundedRect(x, y, w, 28, 5);
    const t = this.add.text(x + 10, y + 14, label, { fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: enabled ? '#dfe7f0' : '#66727e' }).setOrigin(0, 0.5);
    // 枠からはみ出す場合は末尾を「…」に切り詰める
    if (t.width > w - 18) {
      let s = label;
      while (s.length > 1 && t.width > w - 18) {
        s = s.slice(0, -1);
        t.setText(s + '…');
      }
    }
    if (enabled) {
      const zone = this.add.zone(x, y, w, 28).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => { g.clear(); g.fillStyle(0x3f8f88, 1).fillRoundedRect(x, y, w, 28, 5); g.lineStyle(1, 0x3fe0d0).strokeRoundedRect(x, y, w, 28, 5); });
      zone.on('pointerout', () => { g.clear(); g.fillStyle(base, 1).fillRoundedRect(x, y, w, 28, 5); g.lineStyle(1, 0x2f6f6a).strokeRoundedRect(x, y, w, 28, 5); });
      zone.on('pointerdown', onClick);
      c.add([g, t, zone]);
    } else {
      c.add([g, t]);
    }
    return c;
  }

  showSettings() {
    this.setOverlay('settings');
  }

  // ---- 設定オーバーレイ：BGMと効果音（システム音）を別々に調整 ----
  buildSettingsOverlay(x: number, y: number, w: number, h: number) {
    const rows: {
      label: () => string;
      onMinus: () => void;
      onPlus: () => void;
      onToggle: () => void;
      toggleLabel: () => string;
    }[] = [
      {
        label: () => `音楽音量: ${Math.round(Audio.bgmVolume * 100)}%`,
        onMinus: () => Audio.setBgmVolume(Audio.bgmVolume - 0.1),
        onPlus: () => Audio.setBgmVolume(Audio.bgmVolume + 0.1),
        onToggle: () => Audio.toggleBgm(),
        toggleLabel: () => (Audio.bgmOn ? '音楽 入' : '音楽 切')
      },
      {
        label: () => `🔔 効果音音量: ${Math.round(Audio.seVolume * 100)}%`,
        onMinus: () => Audio.setSeVolume(Audio.seVolume - 0.1),
        onPlus: () => Audio.setSeVolume(Audio.seVolume + 0.1),
        onToggle: () => Audio.toggleSe(),
        toggleLabel: () => (Audio.seOn ? '効果音 入' : '効果音 切')
      }
    ];

    let cy = y + 70;
    for (const row of rows) {
      const labelText = this.add.text(x + (IS_MOBILE ? 20 : 30), cy + 4, row.label(), {
        fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '15px' : '17px', color: '#dfe7f0'
      });
      this.overlay.add(labelText);

      const mkBtn = (bx: number, by: number, bw: number, text: () => string, onClick: () => void) => {
        const g = this.add.graphics();
        const draw = (c: number) => {
          g.clear();
          g.fillStyle(c, 1).fillRoundedRect(bx, by, bw, 38, 6);
          g.lineStyle(2, 0x3fe0d0).strokeRoundedRect(bx, by, bw, 38, 6);
        };
        draw(0x2f6f6a);
        const t = this.add.text(bx + bw / 2, by + 19, text(), {
          fontFamily: '"Yu Gothic UI"', fontSize: '17px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        const zone = this.add.zone(bx, by, bw, 38).setOrigin(0).setInteractive({ useHandCursor: true });
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

      if (IS_MOBILE) {
        const by = cy + 31;
        mkBtn(x + 20, by, 58, () => '－', row.onMinus);
        mkBtn(x + 88, by, 58, () => '＋', row.onPlus);
        mkBtn(x + w - 144, by, 124, row.toggleLabel, row.onToggle);
        cy += 92;
      } else {
        mkBtn(x + 330, cy - 4, 56, () => '－', row.onMinus);
        mkBtn(x + 396, cy - 4, 56, () => '＋', row.onPlus);
        mkBtn(x + 470, cy - 4, 110, row.toggleLabel, row.onToggle);
        cy += 70;
      }
    }

    this.overlay.add(this.add.text(x + (IS_MOBILE ? 20 : 30), cy + 14, [
      '※ 音楽と効果音は別々に調整できます。',
      IS_MOBILE
        ? '※ 音源がない場合は内蔵チップチューンを再生します。'
        : '※ 音源ファイル(public/assets/audio/*.mp3)を置くと自動でそちらが使われます。',
      IS_MOBILE ? '' : '   無い場合は内蔵のレトロ風チップチューンが鳴ります。'
    ].join('\n'), {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '11px' : '13px', color: '#8a97ab', lineSpacing: 6,
      wordWrap: { width: w - (IS_MOBILE ? 40 : 60) }
    }));

    const codeY = Math.min(y + h - 252, cy + (IS_MOBILE ? 82 : 88));
    const centerX = x + w / 2;
    this.overlay.add(this.add.text(x + (IS_MOBILE ? 20 : 30), codeY, 'コード入力欄', {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '15px' : '17px',
      color: '#58d9d1', fontStyle: 'bold'
    }));

    const displayW = Math.min(w - (IS_MOBILE ? 40 : 60), 420);
    const displayX = centerX - displayW / 2;
    const displayY = codeY + 29;
    const displayBg = this.add.graphics();
    displayBg.fillStyle(0x071317, 1).fillRoundedRect(displayX, displayY, displayW, 38, 7);
    displayBg.lineStyle(1.5, 0x2f6f6a, 1).strokeRoundedRect(displayX, displayY, displayW, 38, 7);
    const displayText = this.add.text(centerX, displayY + 19, this.codeDigits || 'コードを入力', {
      fontFamily: 'Consolas, monospace', fontSize: '18px', color: this.codeDigits ? '#ffffff' : '#63787b',
      letterSpacing: 5
    }).setOrigin(0.5);
    this.overlay.add([displayBg, displayText]);

    const buttonW = IS_MOBILE ? 58 : 54;
    const buttonH = 34;
    const gap = 6;
    const gridW = buttonW * 5 + gap * 4;
    const gridX = centerX - gridW / 2;
    const gridY = displayY + 48;
    const updateDisplay = () => {
      displayText.setText(this.codeDigits || 'コードを入力');
      displayText.setColor(this.codeDigits ? '#ffffff' : '#63787b');
    };
    const codeButton = (bx: number, by: number, bw: number, label: string, onClick: () => void, accent = false) => {
      const g = this.add.graphics();
      const draw = (hover: boolean) => {
        g.clear();
        g.fillStyle(hover ? 0x315957 : accent ? 0x49361d : 0x1c2536, 1).fillRoundedRect(bx, by, bw, buttonH, 6);
        g.lineStyle(1.5, accent ? 0xe7b85e : 0x3f8f88, 1).strokeRoundedRect(bx, by, bw, buttonH, 6);
      };
      draw(false);
      const text = this.add.text(bx + bw / 2, by + buttonH / 2, label, {
        fontFamily: '"Yu Gothic UI"', fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5);
      const zone = this.add.zone(bx, by, bw, buttonH).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => draw(true));
      zone.on('pointerout', () => draw(false));
      zone.on('pointerdown', () => { Audio.playSe('click'); onClick(); });
      this.overlay.add([g, text, zone]);
    };

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach((digit, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      codeButton(gridX + col * (buttonW + gap), gridY + row * (buttonH + gap), buttonW, String(digit), () => {
        if (this.codeDigits.length < 10) this.codeDigits += String(digit);
        this.codeMessage = '';
        messageText.setText('');
        updateDisplay();
      });
    });

    const actionY = gridY + (buttonH + gap) * 2 + 4;
    codeButton(centerX - 136, actionY, 126, '消去', () => {
      this.codeDigits = '';
      this.codeMessage = '';
      messageText.setText('');
      updateDisplay();
    });
    codeButton(centerX + 10, actionY, 126, '入力', () => {
      const accepted = this.gs.redeemCode(this.codeDigits);
      this.codeMessage = accepted ? 'コードを適用しました' : 'コードが違います';
      this.codeDigits = '';
      updateDisplay();
      messageText.setText(this.codeMessage).setColor(accepted ? '#f5c542' : '#ff7777');
      this.refresh();
    }, true);
    const messageText = this.add.text(centerX, actionY + 43, this.codeMessage, {
      fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#f5c542', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.overlay.add(messageText);
  }
}
