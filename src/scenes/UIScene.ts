import { weaponChargeSteps, weaponWearReduction, shieldEnhancementHeal } from '../enhancement';
import Phaser from 'phaser';
import { HALLOWEEN_FLOORS } from '../halloweenContent';
import { DIFFICULTY_RULES, difficultyFromCode, difficultyEnemy } from '../difficulty';
import { questMenuAlpha } from '../secretQuests';
import { createDamageJournal } from '../damageJournalUI';
import { buildQuestJournal, QuestCelebrations } from '../secretQuestUI';
import { LegendaryAura } from '../legendaryAura';
import { CATALOG_TABS, ITEM_CATALOG, catalogPage, type CatalogCategory, type CatalogEntry } from '../itemCatalog';
import { hasWaterTerrain, WATER_TITLES } from '../waterTerrain';
import { hasFinalDepthTerrain, FINAL_DEPTH_TITLES, FINAL_DEPTH_COLORS } from '../finalDepthTerrain';
import { hasThunderTerrain, THUNDER_TITLES } from '../thunderTerrain';
import { EquipmentRenderer } from '../equipmentRenderer';
import { GameScene } from './GameScene';
import { weaponSkill, joystickDirection } from '../weaponSkills';
import { skillIconKey } from '../skillArt';
import type { GachaResult, GachaPool } from './GameScene';
import { GAME_W, GAME_H } from '../main';
import { IS_MOBILE, MAP_X, MAP_Y, MAP_W, MAP_H } from '../layout';
import { durabilityRisk } from '../combat';
import { DurabilityWarnings } from '../durabilityWarnings';
import { weaponFullName } from '../player';
import { getTheme, MAGIC_DESC, MONSTER_DEFS, ITEM_DEFS, gradeColor, isRareItem, ELEMENT_INFO, monsterElement } from '../data';
import type { Armor, MagicCode, ItemKind, Item, Dir, Weapon, Shield, Element, EquipmentGrade, MonsterDef } from '../types';
import { shieldFullName } from '../player';
import { Audio } from '../audio/manager';
import { EQUIPMENT_LIMIT, SHOP_PRICES, type ShopItemKind } from '../balance';
import { armorFullName, armorTextureKey, isPlayerArmor, PLAYER_ARMOR_DEFS, playerFrameIndex, playerSheetKey } from '../playerAppearance';

const COLORS: Record<string, string> = {
  sys: '#d7e3e2', dmg: '#ff7b82', item: '#6fdda8', gold: '#ffd47d', special: '#c9b2ff'
};

type OwnedEquipment = { kind: 'weapon'; item: Weapon } | { kind: 'shield'; item: Shield } | { kind: 'armor'; item: Armor };

const GACHA_PALETTES = {
  weapon: { fill: 0x5b271e, hover: 0x7a3525, dim: 0x271b1a, accent: 0xff8459, text: '#ffe2d4' },
  armor: { fill: 0x174c56, hover: 0x1d6872, dim: 0x142b34, accent: 0x54d7e8, text: '#c8f7ff' }
};

export class UIScene extends Phaser.Scene {
  private halloweenArrival?: Phaser.GameObjects.Container;
  secretRewardOpen = false;
  private slotAuras: { aura: LegendaryAura; icon: Phaser.GameObjects.Image; key: string }[] = [];
  gs!: GameScene;
  logLines: { msg: string; type: string }[] = [];

  topText!: Phaser.GameObjects.Text;
  goldText?: Phaser.GameObjects.Text;
  statusText!: Phaser.GameObjects.Text;
  hpBar!: Phaser.GameObjects.Graphics;
  equipSlots: { kind: 'weapon' | 'armor' | 'shield'; tag: string; bg: Phaser.GameObjects.Graphics; icon: Phaser.GameObjects.Image; name: Phaser.GameObjects.Text; sub: Phaser.GameObjects.Text; rect: [number, number, number, number] }[] = [];
  paperDoll?: Phaser.GameObjects.Image;
  paperDollEquipment?: EquipmentRenderer;
  codexText?: Phaser.GameObjects.Text; // モンスター図鑑サイドパネル（PCのみ）
  logTexts: Phaser.GameObjects.Text[] = []; // 固定8行（行ごとに色分け）
  itemContainer!: Phaser.GameObjects.Container;
  private itemSlotKinds: ItemKind[] = [];
  private dynamiteHoverZone?: Phaser.GameObjects.Zone;
  private durabilityWarnings?: DurabilityWarnings;
  overlay!: Phaser.GameObjects.Container;
  overlayMode: 'none' | 'equip' | 'inv' | 'codex' | 'settings' | 'shop' | 'gacha' | 'pick' | 'itemcatalog' | 'equipmentcatalog' | 'repair' | 'quests' | 'details' = 'none';
  repairKind: 'weapon' | 'shield' = 'weapon';
  repairPageIndex = 0;
  repairPageCount = 1;
  pickSlot = 0; // 'pick'モードで開いている装備スロット（0武器/1服/2盾）
  pickPageIndex = 0;
  pickPageCount = 1;
  gachaAnimating = false; // ガチャ演出中は再描画をブロック
  gachaPool: GachaPool = 'weapon';
  fountainBadge?: Phaser.GameObjects.Container;
  codeDigits = '';
  codeMessage = '';
  catalogCategory: CatalogCategory = 'all';
  catalogPageIndex = 0;
  catalogPageCount = 1;
  catalogDetail: CatalogEntry | null = null;
  catalogClaimMessage = '';
  enemyInfoText!: Phaser.GameObjects.Text;
  private enemyInfoTimer?: Phaser.Time.TimerEvent;
  private enemyInfoHovered = false;
  skillButton?: Phaser.GameObjects.Container;
  private skillBackground?: Phaser.GameObjects.Graphics;
  private skillGlyph?: Phaser.GameObjects.Image;
  private skillLabel?: Phaser.GameObjects.Text;
  private skillCounter?: Phaser.GameObjects.Text;
  private skillVisualKey = '';
  joystick?: Phaser.GameObjects.Container;
  private releaseJoystick?: () => void;
  private skillHovered = false;
  private skillTooltip?: Phaser.GameObjects.Text;
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
  private monsterDetail?: MonsterDef;
  private damageJournal?: Phaser.GameObjects.Container;
  private questMenuArt: (Phaser.GameObjects.Graphics | Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [];
  secretDirection: 'left' | 'right' | null = null;
  secretAlternatingPresses = 0;

  constructor() {
    super('UIScene');
  }

  create() {
    this.itemSlotKinds = [];
    this.dynamiteHoverZone = undefined;
    this.secretRewardOpen = false;
    this.questMenuArt = [];
    this.monsterDetail = undefined;
    this.damageJournal = undefined;
    this.slotAuras = [];
    this.overlayMode = 'none';
    this.gachaAnimating = false;
    this.gachaPool = 'weapon';
    this.fountainBadge = undefined;
    this.paperDoll = undefined;
    this.paperDollEquipment = undefined;
    this.gs = this.scene.get('GameScene') as GameScene;
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
    this.buildFountainBadge();
    this.durabilityWarnings = new DurabilityWarnings(this, { x: MAP_X, y: MAP_Y, width: MAP_W }, IS_MOBILE);
    this.overlay = this.add.container(0, 0).setDepth(100).setVisible(false);
    this.enemyInfoText = this.add.text(IS_MOBILE ? MAP_X + 8 : GAME_W - 360, IS_MOBILE ? MAP_Y + 8 : 300, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#dfe7f0',
      backgroundColor: '#0a1420ee', padding: { x: 8, y: 6 }, lineSpacing: 4,
      wordWrap: { width: IS_MOBILE ? 250 : 330 }
    }).setDepth(90).setVisible(false);
    this.buildSkillButton();

    // イベント購読（GameSceneのイベントemitterに登録）
    const gsEvents = this.gs.events;
    const onRefresh = () => this.refresh();
    const onLog = (d: any) => this.addLog(d.msg, d.type);
    const onFloor = () => { this.refresh(); this.showHalloweenArrival(); };
    const onEnemy = (info: any) => this.showEnemyInfo(info);
    const onEnemyHoverEnd = () => { if (this.enemyInfoHovered) this.hideEnemyInfo(); };
    gsEvents.on('refresh', onRefresh);
    const celebrations = new QuestCelebrations(this, MAP_X + MAP_W / 2, MAP_Y + 77, MAP_W);
    gsEvents.on('quest-notice', celebrations.push);
    for (const slot of this.equipSlots) {
      if (slot.kind !== 'weapon' && slot.kind !== 'shield') continue;
      const aura = new LegendaryAura(this, slot.icon, slot.kind === 'weapon' ? 'sword' : 'shield');
      this.slotAuras.push({ aura, icon: slot.icon, key: slot.kind === 'weapon' ? 'w_hero_sword' : 's_arcadia_guard' });
    }
    gsEvents.on('log', onLog);
    gsEvents.on('floor', onFloor);
    gsEvents.on('enemyinfo', onEnemy);
    gsEvents.on('enemyhoverend', onEnemyHoverEnd);

    const onWheel = (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      if (this.overlayMode === 'equip' && dy !== 0) this.scrollEquipment(dy > 0 ? 1 : -1);
      if (this.overlayMode === 'inv' && dy !== 0) this.scrollInventory(dy > 0 ? 1 : -1);
      if (this.overlayMode === 'codex' && dy !== 0) this.scrollCodex(dy > 0 ? 1 : -1);
      if (['itemcatalog', 'equipmentcatalog'].includes(this.overlayMode) && dy !== 0) this.turnCatalogPage(dy > 0 ? 1 : -1);
      if (this.overlayMode === 'repair' && dy !== 0) this.turnRepairPage(dy > 0 ? 1 : -1);
      if (this.overlayMode === 'pick' && dy !== 0) this.turnPickPage(dy > 0 ? 1 : -1);
    };
    const onSecretKey = (event: KeyboardEvent) => this.handleEquipmentSecret(event);
    this.input.on('wheel', onWheel);
    this.input.keyboard?.on('keydown', onSecretKey);

    // シーン停止時にリスナーを解除（再起動時の多重登録・破棄済み参照アクセス防止）
    this.events.once('shutdown', () => {
      this.durabilityWarnings?.destroy();
      this.durabilityWarnings = undefined;
      this.dynamiteHoverZone = undefined;
      this.gs.showDynamiteRangePreview(false);
      gsEvents.off('refresh', onRefresh);
      gsEvents.off('quest-notice', celebrations.push);
      gsEvents.off('log', onLog);
      gsEvents.off('floor', onFloor);
      gsEvents.off('enemyinfo', onEnemy);
      gsEvents.off('enemyhoverend', onEnemyHoverEnd);
      this.hideEnemyInfo();
      this.input.off('wheel', onWheel);
      this.input.keyboard?.off('keydown', onSecretKey);
    });

    this.refresh();
    this.showHalloweenArrival();

    // ローカル表示確認用。例: ?mobile=1&qa-game&qa-overlay=settings
    if (location.hostname === 'localhost') {
      const qaOverlay = new URLSearchParams(location.search).get('qa-overlay');
      const allowed = ['equip', 'inv', 'codex', 'equipmentcatalog', 'details', 'settings', 'shop', 'gacha'] as const;
      if (qaOverlay && allowed.includes(qaOverlay as typeof allowed[number])) {
        this.time.delayedCall(100, () => this.setOverlay(qaOverlay as typeof allowed[number]));
      }
      if (qaOverlay === 'gacha' && new URLSearchParams(location.search).has('qa-gacha-auto')) {
        this.time.delayedCall(320, () => {
          const category = new URLSearchParams(location.search).get('qa-gacha-category');
          this.gachaPool = category === 'shield' || category === 'armor' ? 'armor' : 'weapon';
          const result = this.gs.gachaPull(this.gachaPool);
          if (result) this.playGachaAnimation(result);
        });
      }
    }
  }

  private showHalloweenArrival() {
    this.halloweenArrival?.destroy(true);
    this.halloweenArrival = undefined;
    if (!this.gs.eventMode) return;
    const width = MAP_W - 24, height = IS_MOBILE ? 110 : 150;
    const cx = MAP_X + MAP_W / 2, cy = MAP_Y + height / 2 + 12;
    const art = this.add.image(cx,cy,`hw_backdrop_${this.gs.floor}`).setDisplaySize(width,height);
    const shade = this.add.rectangle(cx,cy,width,height,0x140b1f,.55).setStrokeStyle(1,0xdda663);
    const title = this.add.text(cx,cy-9,`${this.gs.floor}F · ${HALLOWEEN_FLOORS[this.gs.floor-1]}`,{fontFamily:'"Yu Mincho",serif',fontSize:IS_MOBILE?'22px':'30px',color:'#ffe1a1'}).setOrigin(.5);
    const hint = this.add.text(cx,cy+27,'番人を倒して、次の層へ',{fontFamily:'"Yu Gothic UI"',fontSize:'12px',color:'#e7d4eb'}).setOrigin(.5);
    const card = this.add.container(0,0,[art,shade,title,hint]).setDepth(85);
    this.halloweenArrival = card;
    // A brief, non-blocking postcard uses each floor's bespoke environment painting.
    this.tweens.add({targets:card,alpha:0,delay:1500,duration:500,onComplete:()=>{card.destroy(true);if(this.halloweenArrival===card)this.halloweenArrival=undefined;}});
  }

  get theme() { return this.gs.eventMode ? { ...DIFFICULTY_RULES.hard, name:'ハロウィン' } : DIFFICULTY_RULES[this.gs.difficulty]; }

  // ============ フレーム ============
  panel(x: number, y: number, w: number, h: number, title?: string) {
    const g = this.add.graphics();
    g.fillStyle(0x0b0a10, 1).fillRoundedRect(x, y, w, h, 8);
    if (this.textures.exists(this.theme.panel)) {
      this.add.image(x + w / 2, y + h / 2, this.theme.panel).setDisplaySize(w, h);
    }
    if (!IS_MOBILE && (title === '冒険ログ' || (w > 1000 && h < 50))) {
      this.add.image(x + w / 2, y + h / 2, 'ui_obsidian_castle').setDisplaySize(w - 12, h - 10).setAlpha(.24).setTint(this.gs.difficulty === 'normal' ? 0xffffff : this.theme.color);
    }
    g.lineStyle(1, this.theme.color, .85).strokeRoundedRect(x + 1, y + 1, w - 2, h - 2, 8);
    if (title) {
      this.add.text(x + 12, y + 6, title, {
        fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: this.theme.text, fontStyle: 'bold', letterSpacing: 1
      }).setShadow(0, 1, '#000000', 3);
    }
    return g;
  }

  buildFrames() {
    // 注意: UISceneはGameSceneの上に重なるため、全画面の背景を描くと
    // マップが完全に隠れてしまう。マップ部分(176,48,740,520)は透過のまま、
    // 枠線だけを描く。
    const g = this.add.graphics();
    g.lineStyle(1, this.theme.color, .8);
    g.strokeRoundedRect(174, 46, 744, 524, 14);
    g.lineStyle(1, this.theme.color, .45);
    g.lineBetween(190, 46, 400, 46);
    g.lineBetween(692, 570, 902, 570);
  }

  buildTopBar() {
    this.panel(8, 4, GAME_W - 16, 36);
    this.add.text(20, 8, `ちゃりだんじょん  /  ${this.theme.name}`, {
      fontFamily: '"Yu Gothic UI"', fontSize: '16px', color: this.theme.text, fontStyle: 'bold', letterSpacing: 1
    });
    this.topText = this.add.text(GAME_W - 170, 11, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: this.theme.text, fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.add.image(GAME_W - 144, 22, 'coin').setDisplaySize(26, 26);
    this.goldText = this.add.text(GAME_W - 26, 13, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#ffe0a0', fontStyle: 'bold'
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
      { t: '冒険図鑑', icon: 'ui_nav_codex', f: () => this.setOverlay('codex') },
      { t: '秘密クエスト', icon: 'ui_nav_quests', f: () => this.setOverlay('quests') },
      { t: '詳細ログ', icon: 'ui_nav_damage_log', f: () => this.setOverlay('details') },
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
    const draw = (c: number, line = this.theme.color) => { g.clear(); g.fillStyle(c, .96); g.fillRoundedRect(x, y, w, h, 8); g.lineStyle(1, line, .9); g.strokeRoundedRect(x, y, w, h, 8); };
    draw(0x141017);
    const icon = this.add.image(x + 24, y + h / 2, iconKey).setDisplaySize(34, 34);
    const t = this.add.text(x + 46, y + h / 2, label, {
      fontFamily: '"Yu Gothic UI"', fontSize: label.length > 7 ? '12px' : '14px', color: '#dfe7f0', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(this.gs.difficulty === 'hard' ? 0x12314b : 0x35202a, this.theme.color));
    zone.on('pointerout', () => draw(0x141017));
    zone.on('pointerdown', () => { Audio.playSe('click'); onClick(); });
    zone.setName(iconKey === 'ui_nav_damage_log' ? 'menu-details' : iconKey === 'ui_nav_codex' ? 'menu-codex' : iconKey === 'ui_nav_quests' ? 'menu-quests' : `menu-${iconKey}`);
    if (iconKey === 'ui_nav_quests') this.questMenuArt.push(g, icon, t);
    void icon; void t;
  }

  // ============ 右ステータス ============
  // 各要素は固定Y座標に配置（テキストとバーの重なり防止）
  hpLabel!: Phaser.GameObjects.Text;
  atkLabel!: Phaser.GameObjects.Text;
  durabilityLabel?: Phaser.GameObjects.Text;

  buildStatusPanel() {
    const x = 924, w = 348;
    // ---- ステータス ----
    this.panel(x, 48, w, 176, 'ステータス');
    const style = { fontFamily: '"Yu Gothic UI"', fontSize: '15px', color: '#dfe7f0' };
    this.statusText = this.add.text(x + 14, 74, '', style);
    this.hpLabel = this.add.text(x + 14, 102, '', style);
    this.hpBar = this.add.graphics();
    this.atkLabel = this.add.text(x + 14, 166, '', style);
    this.durabilityLabel = this.add.text(x + 14, 195, '', { ...style, fontSize: '12px' });

    // ---- 装備（キャラクター見た目＋武器・服・盾）----
    this.panel(x, 232, w, 234, '装備');
    const dollFrame = this.add.graphics();
    dollFrame.fillStyle(0x0b0a10, 0.98).fillRoundedRect(x + 112, 260, 124, 180, 12);
    dollFrame.lineStyle(1.5, this.theme.color, 0.9).strokeRoundedRect(x + 112, 260, 124, 180, 12);
    dollFrame.lineStyle(1, this.theme.color, 0.45).strokeRoundedRect(x + 118, 266, 112, 168, 9);
    this.paperDoll = this.add.image(x + 174, 343, playerSheetKey(this.gs.playerGender, this.gs.playerArmor ?? 'leather'), playerFrameIndex('down', 'idle'))
      .setDisplaySize(116, 116).setDepth(10);
    this.paperDollEquipment = new EquipmentRenderer(this);
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
      fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: this.theme.text, fontStyle: 'bold', letterSpacing: 1
    });
    this.topText = this.add.text(374, 15, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: this.theme.text, fontStyle: 'bold'
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
    fg.lineStyle(2, this.theme.color, 1).strokeRoundedRect(MAP_X - 2, MAP_Y - 2, MAP_W + 4, MAP_H + 4, 6);

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
      fontFamily: '"Yu Gothic UI"', fontSize: '9px', color: this.theme.text, fontStyle: 'bold', letterSpacing: 1
    });
    this.logTexts = [];
    this.logTexts.push(this.add.text(76, 771, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#dfe7f0',
      wordWrap: { width: 294 }
    }));

    // ---- 操作エリア：四方向キー ----
    this.panel(8, 658, 374, 106);
    this.add.text(16, 664, '移動', {
      fontFamily: '"Yu Gothic UI"', fontSize: '9px', color: this.theme.text, fontStyle: 'bold', letterSpacing: 1
    });
    this.buildJoystick(76, 716);
    this.add.text(137, 692, 'スティックで移動\n長押しで加速', {
      fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#91a8b4', lineSpacing: 6
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
      { icon: 'ui_nav_quests', label: '秘密', f: () => this.setOverlay('quests') },
      { icon: 'ui_nav_damage_log', label: '詳細ログ', f: () => this.setOverlay('details') },
      { icon: 'ui_nav_settings', label: '設定', f: () => this.showSettings() }
    ];
    this.panel(8, 800, 374, 36);
    items.forEach((it, i) => {
      const step = 366 / items.length;
      const x = 12 + i * step, y = 803, w = step - 4, h = 30;
      const g = this.add.graphics();
      const draw = (c: number) => { g.clear(); g.fillStyle(c, 1).fillRoundedRect(x, y, w, h, 6); };
      draw(0x25121e);
      const icon = this.add.image(x + w / 2, y + 10, it.icon).setDisplaySize(21, 21);
      const label = this.add.text(x + w / 2, y + 25, it.label, {
        fontFamily: '"Yu Gothic UI"', fontSize: '8px', color: '#dfe7f0'
      }).setOrigin(.5);
      const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.setName(it.icon === 'ui_nav_damage_log' ? 'menu-details' : it.icon === 'ui_nav_codex' ? 'menu-codex' : it.icon === 'ui_nav_quests' ? 'menu-quests' : `menu-${it.icon}`);
      if (it.icon === 'ui_nav_quests') this.questMenuArt.push(g, icon, label);
      zone.on('pointerdown', () => { draw(0x264a48); Audio.playSe('click'); it.f(); });
      zone.on('pointerup', () => draw(0x25121e));
      zone.on('pointerout', () => draw(0x25121e));
    });
  }

  // ---- タッチ操作：十字ボタン（スマホ=操作エリア、タッチPC=マップ左下に重ねる）----
  private buildJoystick(cx: number, cy: number) {
    const radius = 43, travel = 26;
    this.input.addPointer(1); // One finger holds movement while another taps the skill.
    const container = this.add.container(cx, cy).setDepth(60);
    this.joystick = container;
    const base = this.add.graphics();
    base.fillStyle(0x0c343a, .18).fillCircle(0, 0, radius);
    base.lineStyle(2, 0x55dff3, .45).strokeCircle(0, 0, radius);
    base.lineStyle(1, 0x55dff3, .15).strokeCircle(0, 0, travel);
    const thumb = this.add.circle(0, 0, 17, 0x55dff3, .5).setStrokeStyle(1.5, 0xa8ffff, .65);
    container.add([base, thumb]).setSize(radius * 2, radius * 2)
      .setInteractive(new Phaser.Geom.Circle(radius, radius, radius), Phaser.Geom.Circle.Contains);
    let activePointer: number | null = null;
    const move = (pointer: Phaser.Input.Pointer) => {
      if (activePointer !== pointer.id) return;
      if (this.overlayMode !== 'none' || this.gs.gameEnded) { release(); return; }
      const dx = pointer.x - cx, dy = pointer.y - cy;
      const distance = Math.hypot(dx, dy), factor = distance > travel ? travel / distance : 1;
      thumb.setPosition(dx * factor, dy * factor);
      this.gs.touchDir = joystickDirection(dx, dy);
      if (!this.gs.touchDir) { this.gs.heldDir = null; this.gs.setBoostTier(0); }
    };
    const release = () => {
      activePointer = null;
      thumb.setPosition(0, 0);
      this.gs.touchDir = null;
      this.gs.heldDir = null;
      this.gs.holdStartedAt = 0;
      this.gs.setBoostTier(0);
    };
    this.releaseJoystick = release;
    container.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      if (activePointer !== null || this.overlayMode !== 'none' || this.gs.gameEnded) return;
      activePointer = pointer.id; move(pointer); event.stopPropagation();
    });
    const up = (pointer: Phaser.Input.Pointer) => { if (activePointer === pointer.id) release(); };
    this.input.on('pointermove', move);
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
    this.input.on('gameout', release);
    this.game.events.on(Phaser.Core.Events.BLUR, release);
    this.gs.events.on('moveinputcleared', release);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointermove', move); this.input.off('pointerup', up);
      this.input.off('pointerupoutside', up); this.input.off('gameout', release);
      this.game.events.off(Phaser.Core.Events.BLUR, release);
      this.gs.events.off('moveinputcleared', release);
      release(); this.releaseJoystick = undefined;
    });
  }

  private buildSkillButton() {
    const x = IS_MOBILE ? 326 : MAP_X + MAP_W - 64;
    const y = IS_MOBILE ? 716 : MAP_Y + MAP_H - 62;
    const radius = IS_MOBILE ? 38 : 48;
    this.skillVisualKey = '';
    this.skillHovered = false;
    const button = this.add.container(x, y).setDepth(65);
    this.skillButton = button;
    this.skillBackground = this.add.graphics();
    this.skillGlyph = this.add.image(0, -7, 'skill_dagger').setDisplaySize(IS_MOBILE ? 44 : 56, IS_MOBILE ? 44 : 56);
    this.skillLabel = this.add.text(0, IS_MOBILE ? 22 : 27, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '9px' : '11px', fontStyle: 'bold', color: '#ddffff',
      stroke: '#071115', strokeThickness: 3, align: 'center'
    }).setOrigin(.5);
    this.skillCounter = this.add.text(0, -6, '', { fontFamily: 'Meiryo', fontSize: IS_MOBILE ? '11px' : '13px', color: '#ffffff', stroke: '#071115', strokeThickness: 3 }).setOrigin(.5);
    button.add([this.skillBackground, this.skillGlyph, this.skillLabel, this.skillCounter]);
    if (!IS_MOBILE) button.add(this.add.text(radius - 10, 9, 'Q', { fontSize: '13px', color: '#bde4e9', backgroundColor: '#071115aa', padding: {x:3,y:2} }).setOrigin(.5));
    button.setSize(radius * 2, radius * 2).setInteractive({ hitArea: new Phaser.Geom.Circle(radius, radius, radius), hitAreaCallback: Phaser.Geom.Circle.Contains, useHandCursor: true });
    this.skillTooltip = this.add.text(Math.max(8, x - 260), y - radius - 120, '', {
      fontFamily: 'Meiryo', fontSize: '13px', color: '#f5e7bd', backgroundColor: '#101824f2',
      padding: { x: 12, y: 10 }, wordWrap: { width: 270 }, lineSpacing: 5
    }).setDepth(100).setVisible(false);
    button.on('pointerover', () => { this.skillHovered = true; this.gs.showSkillRangePreview(true); });
    let holdTimer: Phaser.Time.TimerEvent | undefined;
    let held = false;
    let pressed = false;
    button.on('pointerout', () => { pressed = false; holdTimer?.remove(); this.skillHovered = false; this.gs.showSkillRangePreview(false); });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.skillHovered = false; this.gs.showSkillRangePreview(false); });
    button.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (IS_MOBILE) {
        pressed = true; held = false; this.skillHovered = false;
        holdTimer = this.time.delayedCall(350, () => { held = true; this.skillHovered = true; });
        this.releaseJoystick?.();
        return;
      }
      this.skillHovered = false; this.gs.showSkillRangePreview(false);
      this.releaseJoystick?.();
      void this.gs.useWeaponSkill();
    });
    button.on('pointerup', () => {
      if (!IS_MOBILE || !pressed) return;
      pressed = false; holdTimer?.remove();
      this.skillHovered = false; this.gs.showSkillRangePreview(false);
      if (!held) void this.gs.useWeaponSkill();
    });
    this.refreshSkillButton();
    for (const entry of this.slotAuras) { entry.aura.emerald = ['w_hw_emedral', 's_hw_emerald'].includes(entry.icon.texture.key); entry.aura.enabled = entry.icon.texture.key === entry.key || entry.aura.emerald; }
  }

  isSkillPointer(x: number, y: number) {
    if (!this.skillButton?.visible || this.overlayMode !== 'none') return false;
    return Math.hypot(x - this.skillButton.x, y - this.skillButton.y) <= (IS_MOBILE ? 38 : 48);
  }

  private refreshSkillButton() {
    if (!this.skillButton) return;
    const type = this.gs.player?.weapon?.weaponType;
    const skill = weaponSkill(type);
    const visible = !!skill && !this.gs.gameEnded && this.overlayMode === 'none';
    this.skillButton.setVisible(visible);
    if (!skill || !type) return;
    const remaining = this.gs.skillStepsRemaining;
    const key = `${type}:${remaining}:${visible}:${this.gs.timeStopTurns}:${this.gs.lanceSkillTurns}`;
    if (key === this.skillVisualKey) return;
    this.skillVisualKey = key;
    const radius = IS_MOBILE ? 38 : 48;
    this.skillBackground!.clear();
    this.skillBackground!.lineStyle(2, skill.color, .25).strokeCircle(0, 0, radius);
    if (remaining < this.gs.skillChargeRequired) {
      this.skillBackground!.lineStyle(3, skill.color, .6).beginPath()
        .arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - Math.min(1, remaining / this.gs.skillChargeRequired))).strokePath();
    }
    this.skillGlyph!.setTexture(skillIconKey(type)).setAlpha(remaining > 0 ? .72 : 1);
    this.skillLabel!.setText(skill.name).setColor(`#${skill.color.toString(16).padStart(6, '0')}`);
    this.skillCounter!.setText(this.gs.timeStopTurns > 0 ? `時停止 ${this.gs.timeStopTurns}`
      : type === 'lance' && this.gs.lanceSkillTurns > 0 ? `四方 ${this.gs.lanceSkillTurns}` : '');
  }

  update() {
    const pulse = questMenuAlpha(this.gs.secretQuests, this.time.now);
    for (const art of this.questMenuArt) art.setAlpha(pulse);
    this.refreshSkillButton();
    this.durabilityWarnings?.update(this.gs.player, this.time.now, this.overlayMode === 'none' && !this.gs.gameEnded);
    for (const entry of this.slotAuras) { entry.aura.emerald = ['w_hw_emedral', 's_hw_emerald'].includes(entry.icon.texture.key); entry.aura.enabled = entry.icon.texture.key === entry.key || entry.aura.emerald; }
    const pointer = this.input.activePointer;
    const dynamiteHovered = !!this.dynamiteHoverZone?.active && this.input.isOver && !pointer.wasTouch
      && this.dynamiteHoverZone.getBounds().contains(pointer.x, pointer.y);
    const skillPreview = !dynamiteHovered && this.skillHovered && !!this.skillButton?.visible;
    this.gs.showSkillRangePreview(skillPreview);
    const hoveredSkill = weaponSkill(this.gs.player?.weapon?.weaponType);
    this.skillTooltip?.setVisible(skillPreview && !!hoveredSkill);
    if (skillPreview && hoveredSkill) {
      const status = this.gs.timeStopTurns > 0 ? `時間停止：残り${this.gs.timeStopTurns}ターン`
        : this.gs.skillStepsRemaining > 0 ? `再使用まであと${this.gs.skillStepsRemaining}歩` : '使用可能';
      this.skillTooltip?.setText(`${hoveredSkill.name}\n${hoveredSkill.description}\n${status}`);
    }
    this.gs.showDynamiteRangePreview(dynamiteHovered);
    if (this.overlayMode !== 'none' || this.gs.gameEnded) this.releaseJoystick?.();
  }

  // 押しっぱなしで歩き続ける（GameScene.touchDir 経由でキーボード長押しと同じ扱い）
  buildTouchControls(cx: number, cy: number, gap: number, R: number) {
    const mkButton = (dx: number, dy: number, angleDeg: number, onDown: () => void, onUp?: () => void) => {
      const bx = cx + dx, by = cy + dy;
      const g = this.add.graphics().setDepth(60);
      const draw = (active: boolean) => {
        g.clear();
        g.fillStyle(active ? this.theme.color : 0x0e1420, active ? 0.9 : 0.5).fillCircle(bx, by, R);
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
    if (weapon.plus >= 5) effects.push(`強化効果: スキル${weaponChargeSteps(weapon.plus)}歩・耐久消耗-${weaponWearReduction(weapon.plus)}（最低1）`);
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
    if (shield.plus >= 5) effects.push(`強化効果: 3回被攻撃ごとHP${shieldEnhancementHeal(shield.plus)}回復`);
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
      return this.showTooltip(
        armorFullName(armor),
        `防御力 +${armor.defBonus + armor.plus}\n見た目 ${PLAYER_ARMOR_DEFS[armor.key as keyof typeof PLAYER_ARMOR_DEFS]?.name ?? armor.name}`,
        anchorX, anchorY
      );
    }
    if ((p.weapon?.dual || p.weapon?.weaponType === 'bow')) {
      return this.showTooltip('盾を装備できない', '弓と二刀流は両手を使うため、盾を持てない', anchorX, anchorY);
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

  private showOwnedEquipmentTooltip(entry: OwnedEquipment, anchorX: number, anchorY: number) {
    const p = this.gs.player;
    // Reuse Player's stat getters on a separate preview; never equip the hovered item.
    const preview = Object.create(p) as typeof p;
    const lines = [`グレード ${entry.item.grade} ／ ${p[entry.kind] === entry.item ? '装備中' : '未装備'}`];
    let title: string;
    if (entry.kind === 'weapon') {
      const weapon = entry.item;
      preview.weapon = weapon;
      title = weaponFullName(weapon);
      lines.push(`装備時の攻撃力 ${preview.atkMin}–${preview.atkMax}（現在 ${p.atkMin}–${p.atkMax}）`,
        `耐久 ${weapon.dur} / ${weapon.durMax}（${durabilityRisk(weapon.dur, weapon.durMax).label}）`,
        `効果 ${this.weaponEffectText(weapon)}`);
    } else if (entry.kind === 'shield') {
      const shield = entry.item;
      preview.shield = shield;
      title = shieldFullName(shield);
      lines.push(`防御力 +${shield.defBonus + (shield.plus ?? 0)}`,
        p.weapon?.dual || p.weapon?.weaponType === 'bow' ? '弓・二刀流中は盾を装備できません'
          : `装備時の防御力 ${preview.def}（現在 ${p.def}）`,
        `耐久 ${shield.dur} / ${shield.durMax}（${durabilityRisk(shield.dur, shield.durMax).label}）`,
        `効果 ${this.shieldEffectText(shield)}`);
    } else {
      const armor = entry.item;
      preview.armor = armor;
      title = armorFullName(armor);
      lines.push(`防御力 +${armor.defBonus + (armor.plus ?? 0)}`,
        `装備時の防御力 ${preview.def}（現在 ${p.def}）`, '耐久なし',
        `見た目 ${PLAYER_ARMOR_DEFS[armor.key as keyof typeof PLAYER_ARMOR_DEFS]?.name ?? armor.name}`);
    }
    this.showTooltip(title, lines.join('\n'), anchorX, anchorY);
  }

  private bindEquipmentTooltip(row: Phaser.GameObjects.Container, icon: Phaser.GameObjects.GameObject, entry: OwnedEquipment) {
    const zone = row.getByName('row-hit') as Phaser.GameObjects.Zone;
    const art = icon as Phaser.GameObjects.Image;
    art.setInteractive({ useHandCursor: true });
    const show = (pointer: Phaser.Input.Pointer) => {
      if (!pointer.wasTouch) this.showOwnedEquipmentTooltip(entry, pointer.x, pointer.y);
    };
    for (const target of [zone, art]) {
      target.on('pointerover', show);
      target.on('pointerout', () => this.hideTooltip());
      target.on('pointerdown', () => this.hideTooltip());
    }
  }

  // ============ リフレッシュ ============
  buildFountainBadge() {
    const x = MAP_X + 10, y = MAP_Y + 10;
    const bg = this.add.graphics();
    bg.fillStyle(0x071e24, .95).fillRoundedRect(0, 0, 122, 30, 7);
    bg.lineStyle(1, 0x62f7e8, .85).strokeRoundedRect(0, 0, 122, 30, 7);
    bg.fillStyle(0x62f7e8, 1).fillTriangle(8, 16, 15, 5, 22, 16).fillCircle(15, 17, 7);
    bg.fillStyle(0xe4ffff, .9).fillCircle(12, 16, 2);
    const label = this.add.text(29, 7, '攻・防 ×1.1', {
      fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#b9fff5', fontStyle: 'bold'
    });
    label.setName('fountain-rate');
    const zone = this.add.zone(0, 0, 122, 30).setOrigin(0).setInteractive({ useHandCursor: true });
    const show = () => this.showTooltip(this.gs.eventMode ? '収穫の祝福' : this.gs.player.fountainBlessingPower === 1.5 ? '金の泉の加護' : this.gs.player.fountainBlessingPower === 1.2 ? '銀の泉の加護' : '噴水の加護',
      `${this.gs.floor}階のボス討伐まで、攻撃力・防御力が${this.gs.player.fountainBlessingRate}倍。\n重ねて使っても倍率は増えません。`, x, y + 34);
    zone.on('pointerover', show);
    zone.on('pointerout', () => this.hideTooltip());
    zone.on('pointerdown', (_p: unknown, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (this.tooltip.visible) this.hideTooltip(); else show();
    });
    this.fountainBadge = this.add.container(x, y, [bg, label, zone]).setDepth(40).setVisible(false);
  }

  refresh() {
    this.refreshSkillButton();
    for (const entry of this.slotAuras) { entry.aura.emerald = ['w_hw_emedral', 's_hw_emerald'].includes(entry.icon.texture.key); entry.aura.enabled = entry.icon.texture.key === entry.key || entry.aura.emerald; }
    const p = this.gs.player;
    this.fountainBadge?.setVisible(p.fountainBlessingFloor !== null);
    (this.fountainBadge?.getByName('fountain-rate') as Phaser.GameObjects.Text | undefined)?.setText(`攻・防 ×${p.fountainBlessingRate}`);
    const th = this.gs.dungeon?.glacialArena
      ? { ...getTheme(this.gs.floor), name: '氷晶の広間', accent: 0x8adfff }
      : this.gs.dungeon?.volcanoArena
        ? { ...getTheme(this.gs.floor), name: '熔獄竜の火口', accent: 0xff783d }
      : hasFinalDepthTerrain(this.gs.floor)
        ? { ...getTheme(this.gs.floor), name: FINAL_DEPTH_TITLES[this.gs.floor - 26], accent: FINAL_DEPTH_COLORS[this.gs.floor - 26] }
      : hasThunderTerrain(this.gs.floor)
        ? { ...getTheme(this.gs.floor), name: THUNDER_TITLES[this.gs.floor - 21], accent: 0xa7d7ff }
      : hasWaterTerrain(this.gs.floor)
        ? { ...getTheme(this.gs.floor), name: WATER_TITLES[this.gs.floor - 6], accent: 0x75c7c4 }
      : getTheme(this.gs.floor);

    const boost = this.gs.holdBoostTier === 2 ? '  最大加速' : this.gs.holdBoostTier === 1 ? '  加速' : '';
    const transformation = this.gs.transformation
      ? `  変身:${this.gs.transformation.name} 残り${this.gs.transformation.turns}`
      : '';
    const floorLabel = this.gs.inBossRoom ? `${this.gs.floor}.5階` : `${this.gs.floor}階`;
    const gate = this.gs.inBossRoom
      ? this.gs.bossRewardClaimed ? '出口解放' : 'ボス封印'
      : this.gs.floorHasGate(this.gs.floor) && !this.gs.dungeon?.bossRoom
        ? 'ボス階段'
        : !this.gs.floorBossDefeated
          ? 'ボス封印'
          : this.gs.floorHasGate(this.gs.floor) ? 'ボス階段' : '階段解放';
    this.topText.setText(this.gs.eventMode ? `🎃 ${this.gs.floor} / 5層 · ${HALLOWEEN_FLOORS[this.gs.floor - 1]} · ${gate}` : IS_MOBILE
      ? `${this.theme.name}  ${floorLabel}  ${gate}${boost}`
      : `${floorLabel} / 30階  ${th.name}   ${gate}   得点 ${this.gs.score}   ${this.gs.turn}ターン${boost}`);

    this.statusText.setText(IS_MOBILE
      ? `${p.name} レベル${p.level}  経験値 ${p.exp}/${p.expNext}  ${this.gs.turn}ターン${transformation}`
      : `${p.name}  レベル${p.level}   （経験値 ${p.exp}/${p.expNext}）${transformation}`);
    this.goldText?.setText(`所持金 ${p.gold}G`);
    this.hpLabel.setText(`体力  ${p.hp} / ${p.hpMax}`);
    this.atkLabel.setText(IS_MOBILE
      ? `攻 ${p.atkMin}-${p.atkMax}  防 ${p.def}  ${p.gold}G`
      : `攻撃力 ${p.atkMin}-${p.atkMax}   防御力 ${p.def}`);
    this.durabilityLabel?.setText(`耐久　武器 ${p.weapon ? `${p.weapon.dur}/${p.weapon.durMax}` : 'なし'}　盾 ${p.shield ? `${p.shield.dur}/${p.shield.durMax}` : 'なし'}`);
    // HPバー（ラベルの下の固定位置。座標はレイアウト設定から）
    const { x: bx, y: by, w: bw } = this.L.hpBar;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x2a1518).fillRect(bx, by, bw, 14);
    this.hpBar.fillStyle(0xff5a5a).fillRect(bx, by, bw * Math.max(0, p.hp / p.hpMax), 14);

    const w = p.weapon, a = p.armor, s = p.shield;
    const empty = { tex: null, sub: 'なし', plus: 0 };
    const slotInfo: Record<'weapon' | 'armor' | 'shield', { tex: string | null; sub: string; plus: number; grade?: EquipmentGrade; element?: Element }> = {
      weapon: w ? { tex: w.key, sub: `攻${w.atkMin}-${w.atkMax}`, plus: w.plus, grade: w.grade, element: w.element } : empty,
      armor: a ? { tex: armorTextureKey(a.key), sub: `防+${a.defBonus + a.plus}`, plus: a.plus, grade: a.grade } : empty,
      shield: (w?.dual || w?.weaponType === 'bow')
        ? { tex: w.key, sub: w.weaponType === 'bow' ? '両手持ち' : '二刀流', plus: w.plus, grade: w.grade, element: w.element }
        : s ? { tex: s.key, sub: `防+${s.defBonus + s.plus}`, plus: s.plus, grade: s.grade, element: s.element } : empty
    };
    this.equipSlots.forEach((slot) => {
      const info = slotInfo[slot.kind];
      const [sx, sy, sw, sh] = slot.rect;
      const has = info.tex !== null;
      const rim = this.elementColor(info.element) ?? (info.grade ? gradeColor(info.grade) : this.theme.color);
      slot.bg.clear();
      slot.bg.fillStyle(0x0a1c20, has ? .96 : 0.5).fillRoundedRect(sx, sy, sw, sh, 10);
      slot.bg.lineStyle(info.grade === 'SSS' ? 3.5 : info.grade === 'S' ? 3 : info.grade === 'A' ? 2.5 : 1.5, rim, has ? 1 : 0.5).strokeRoundedRect(sx, sy, sw, sh, 8);
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
      const dollSize = p.weapon?.key === 'w_hero_sword' ? 82 : 116;
      this.paperDoll.setDisplaySize(dollSize, dollSize);
      this.paperDollEquipment?.update(this.paperDoll,p.weapon,p.shield,'down','idle',this.gs.playerGender);
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

  // Keep each discovered kind in its slot for this adventure, even at zero.
  // Removing a consumed array entry must not put another item under the cursor.
  stackInventory(inv: Item[]): { kind: ItemKind; item: Item; count: number; firstIndex: number }[] {
    const groups = new Map<ItemKind, { kind: ItemKind; item: Item; count: number; firstIndex: number }>();
    inv.forEach((it, i) => {
      if (!this.itemSlotKinds.includes(it.kind)) this.itemSlotKinds.push(it.kind);
      const g = groups.get(it.kind);
      if (g) g.count++;
      else groups.set(it.kind, { kind: it.kind, item: it, count: 1, firstIndex: i });
    });
    return this.itemSlotKinds.map(kind => groups.get(kind) ?? {
      kind, item: { kind, ...ITEM_DEFS[kind] }, count: 0, firstIndex: -1
    });
  }

  useInventoryKind(kind: ItemKind) {
    // Resolve at click time: old callbacks must never consume a shifted index.
    const index = this.gs.player.inventory.findIndex(item => item.kind === kind);
    if (index >= 0) this.gs.useItem(index);
  }

  rebuildItems() {
    this.dynamiteHoverZone = undefined;
    this.itemContainer.removeAll(true);
    const p = this.gs.player;
    const { x: startX, y: startY, cols } = this.L.items;
    const cell = 62;
    const groups = this.stackInventory(p.inventory);
    groups.forEach((grp, i) => {
      const cx = startX + (i % cols) * cell;
      const cy = startY + Math.floor(i / cols) * 74;
      const rare = isRareItem(grp.kind);
      const available = grp.count > 0;
      const frameCol = rare ? 0xff4040 : this.theme.color;      // レアは赤枠
      const frameHover = rare ? 0xff8080 : 0x3fe0d0;
      const bg = this.add.graphics();
      const drawBg = (fill: number, line: number, lw = 1.5) => { bg.clear(); bg.fillStyle(fill, 1).fillRoundedRect(cx, cy, 54, 54, 6); bg.lineStyle(lw, line).strokeRoundedRect(cx, cy, 54, 54, 6); };
      drawBg(available ? 0x25121e : 0x141a22, available ? frameCol : 0x303946, rare ? 2.5 : 1.5);
      // 枠だけ＋アイコン（名前は省略／カーソルでツールチップ表示）
      const icon = this.add.image(cx + 27, cy + 27, grp.item.textureKey).setDisplaySize(48, 48).setAlpha(available ? 1 : 0.3);
      this.itemContainer.add([bg, icon]);
      // ×N（2個以上のとき）
      if (grp.count !== 1) {
        const cnt = this.add.text(cx + 50, cy + 50, `×${grp.count}`, {
          fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
          backgroundColor: '#000000aa', padding: { x: 2, y: 0 }
        }).setOrigin(1, 1);
        this.itemContainer.add(cnt);
      }
      const zone = this.add.zone(cx, cy, 54, 54).setOrigin(0).setInteractive({ useHandCursor: true });
      if (grp.kind === 'dynamite' && available) this.dynamiteHoverZone = zone;
      const cntSuffix = available ? grp.count > 1 ? ` ×${grp.count}` : '' : '（所持なし）';
      zone.on('pointerover', () => { if (available) drawBg(0x264a48, frameHover, rare ? 2.5 : 1.5); this.showTooltip((rare ? '★' : '') + grp.item.name + cntSuffix, grp.item.desc, cx + 27, cy); });
      zone.on('pointerout', () => { drawBg(available ? 0x25121e : 0x141a22, available ? frameCol : 0x303946, rare ? 2.5 : 1.5); this.hideTooltip(); });
      if (available) zone.on('pointerdown', () => { this.hideTooltip(); this.useInventoryKind(grp.kind); });
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
    this.tooltipTitle = this.add.text(0, 0, '', { fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: this.theme.text, fontStyle: 'bold' });
    this.tooltipDesc = this.add.text(0, 0, '', { fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#dfe7f0', wordWrap: { width: 220 } });
    this.tooltip = this.add.container(0, 0, [this.tooltipBg, this.tooltipTitle, this.tooltipDesc]).setDepth(200).setVisible(false);
  }

  showTooltip(title: string, desc: string, anchorX: number, anchorY: number) {
    this.tooltipTitle.setWordWrapWidth(IS_MOBILE ? 220 : 280).setText(title).setPosition(10, 8);
    this.tooltipDesc.setText(desc).setPosition(10, 8 + this.tooltipTitle.height + 6);
    const w = Math.max(this.tooltipTitle.width, this.tooltipDesc.width) + 20;
    const h = this.tooltipDesc.y + this.tooltipDesc.height + 8;
    this.tooltipBg.clear();
    this.tooltipBg.fillStyle(0x0a1420, 0.97).fillRoundedRect(0, 0, w, h, 6);
    this.tooltipBg.lineStyle(1.5, 0x3fe0d0).strokeRoundedRect(0, 0, w, h, 6);
    // アイテム欄の上に出す（画面内に収める）
    let tx = anchorX - w / 2;
    tx = Math.max(8, Math.min(GAME_W - w - 8, tx));
    const preferredY = anchorY - h - 8;
    const ty = Math.max(8, Math.min(GAME_H - h - 8, preferredY >= 8 ? preferredY : anchorY + 24));
    this.tooltip.setPosition(tx, ty).setVisible(true);
  }

  hideTooltip() {
    this.tooltip.setVisible(false);
  }

  showEnemyInfo(info: any) {
    this.enemyInfoTimer?.remove();
    this.enemyInfoTimer = undefined;
    this.enemyInfoHovered = !!info.hover;
    if (info.concealed) {
      this.enemyInfoText.setText('何かいるようだ…').setVisible(true);
      return;
    }
    const lines = [
      `【${info.name}】`,
      ...(info.description ? [info.description] : []),
      `属性: ${info.element}`,
      `体力: ${info.hp}/${info.hpMax}`,
      `攻撃: ${info.atk}  防御: ${info.def}`,
      `行動: ${info.behavior}`
    ];
    this.enemyInfoText.setText(lines.join('\n')).setVisible(true);
    if (!this.enemyInfoHovered) {
      this.enemyInfoTimer = this.time.delayedCall(3000, () => this.hideEnemyInfo());
    }
  }

  private hideEnemyInfo() {
    this.enemyInfoTimer?.remove();
    this.enemyInfoTimer = undefined;
    this.enemyInfoHovered = false;
    if (this.enemyInfoText?.active) this.enemyInfoText.setVisible(false);
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

  setOverlay(mode: 'none' | 'equip' | 'inv' | 'codex' | 'settings' | 'shop' | 'gacha' | 'pick' | 'itemcatalog' | 'equipmentcatalog' | 'repair' | 'quests' | 'details') {
    if (this.gachaAnimating) return; // 演出中は切替禁止
    if (this.gs.pendingEquipment && mode !== 'equip') mode = 'equip';
    if (mode === 'equip' && this.overlayMode !== 'equip') this.equipScrollIndex = 0;
    if (mode === 'codex' && this.overlayMode !== 'codex') { this.codexScrollRow = 0; this.monsterDetail = undefined; }
    if (mode === 'repair' && this.overlayMode !== 'repair') this.repairPageIndex = 0;
    if (mode === 'pick') this.pickPageIndex = 0;
    if (mode === 'equipmentcatalog' && this.overlayMode !== mode) {
      this.catalogCategory = 'all';
      this.catalogPageIndex = 0;
      this.catalogDetail = null;
      this.catalogClaimMessage = '';
    }
    if (mode !== 'equip') {
      this.secretDirection = null;
      this.secretAlternatingPresses = 0;
    }
    if (mode !== 'details') { this.damageJournal?.destroy(true); this.damageJournal = undefined; }
    this.overlayMode = mode;
    this.releaseJoystick?.();
    this.refreshSkillButton();
    for (const entry of this.slotAuras) { entry.aura.emerald = ['w_hw_emedral', 's_hw_emerald'].includes(entry.icon.texture.key); entry.aura.enabled = entry.icon.texture.key === entry.key || entry.aura.emerald; }
    this.gs.clearMoveInput();
    this.hideTooltip();
    this.hideEnemyInfo();
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
    if (this.overlayMode === 'details') {
      if (event.key === 'Escape') { event.preventDefault(); this.setOverlay('none'); }
      return;
    }
    if (this.overlayMode === 'codex') {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (this.monsterDetail) { this.monsterDetail = undefined; this.rebuildOverlay(); }
        else this.setOverlay('none');
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'ArrowRight', 'ArrowDown', 'PageDown'].includes(event.key)) {
        event.preventDefault();
        if (!event.repeat) this.scrollCodex(['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key) ? -1 : 1);
      }
      return;
    }
    if (this.overlayMode === 'pick') {
      if (['ArrowLeft', 'ArrowUp', 'PageUp', 'ArrowRight', 'ArrowDown', 'PageDown'].includes(event.key)) {
        event.preventDefault();
        if (!event.repeat) this.turnPickPage(['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key) ? -1 : 1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.setOverlay('none');
      }
      return;
    }
    if (this.overlayMode === 'repair') {
      if (['ArrowLeft', 'ArrowUp', 'PageUp', 'ArrowRight', 'ArrowDown', 'PageDown'].includes(event.key)) {
        event.preventDefault();
        if (!event.repeat) this.turnRepairPage(['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key) ? -1 : 1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.setOverlay('inv');
      }
      return;
    }
    if (this.handleCodeAndCatalogKey(event)) return;
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
    if (this.overlayMode !== 'codex' || this.codexScrollMax <= 0 || this.monsterDetail) return;
    const next = Phaser.Math.Clamp(this.codexScrollRow + delta, 0, this.codexScrollMax);
    if (next === this.codexScrollRow) return;
    this.codexScrollRow = next;
    this.rebuildOverlay();
  }

  rebuildOverlay() {
    if (this.gachaAnimating) return; // 演出中に消さない
    if (this.overlayMode === 'details') {
      if (!this.damageJournal?.active) {
        this.overlay.removeAll(true);
        this.damageJournal = createDamageJournal(this, this.gs.damageHistory, this.gs.adventureHistory, this.gs.difficulty, () => this.setOverlay('none'));
      }
      return;
    }
    this.hideTooltip();
    this.overlay.removeAll(true);
    const { x, y, w, h } = this.overlayMode === 'quests' && !IS_MOBILE ? { x: 230, y: 40, w: 820, h: 680 }
      : ['itemcatalog', 'equipmentcatalog', 'codex'].includes(this.overlayMode) && !IS_MOBILE
      ? { x: 180, y: 40, w: 920, h: 680 }
      : ['settings', 'shop', 'repair'].includes(this.overlayMode) && !IS_MOBILE
        ? { x: 200, y: 60, w: 680, h: 620 } : this.L.ov;
    const illustrated = ['codex', 'equipmentcatalog'].includes(this.overlayMode);
    if (illustrated) {
      this.overlay.add(this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x020307, .72).setInteractive());
      this.overlay.add(this.add.image(x + w / 2, y + h / 2, this.theme.panel).setDisplaySize(w, h));
    }
    const g = this.add.graphics();
    g.fillStyle(0x110b13, 0.985).fillRoundedRect(x, y, w, h, 14);
    g.fillStyle(0x143034, .26).fillRoundedRect(x + 5, y + 5, w - 10, h - 10, 10);
    g.lineStyle(1.5, this.theme.color).strokeRoundedRect(x, y, w, h, 14);
    if (!illustrated) this.overlay.add(g); else g.destroy();

    const pickTitles = ['武器を変更', '服を変更', '盾を変更'];
    const title =
      this.overlayMode === 'equip' ? (this.gs.pendingEquipment ? '装備上限：売却が必要' : '装備・売却') :
      this.overlayMode === 'inv' ? '所持品・装備' :
      this.overlayMode === 'quests' ? '秘密クエスト' :
      this.overlayMode === 'settings' ? '設定' :
      this.overlayMode === 'itemcatalog' ? '全アイテム一覧' :
      ['equipmentcatalog', 'codex'].includes(this.overlayMode) ? '冒険図鑑' :
      this.overlayMode === 'shop' ? 'フロアショップ' :
      this.overlayMode === 'repair' ? '修復する装備を選ぶ' :
      this.overlayMode === 'gacha' ? 'ダンジョンガチャ' :
      this.overlayMode === 'pick' ? pickTitles[this.pickSlot] :
      'モンスター図鑑';
    this.overlay.add(this.add.text(x + (illustrated ? 32 : 16), y + (illustrated ? 21 : 12), title, {
      fontFamily: '"Yu Gothic UI"', fontSize: illustrated ? IS_MOBILE ? '20px' : '24px' : IS_MOBILE ? '15px' : '18px',
      color: this.theme.text, fontStyle: 'bold', wordWrap: { width: w - 72 }
    }));
    // 閉じるボタン
    const cb = this.add.text(x + w - (illustrated ? 64 : IS_MOBILE ? 48 : 34), y + (illustrated ? 14 : IS_MOBILE ? 2 : 10), this.gs.pendingEquipment ? '🔒' : '✕', {
      fontFamily: 'sans-serif', fontSize: IS_MOBILE ? '25px' : '22px', color: '#ff8b8b',
      padding: IS_MOBILE ? { x: 10, y: 8 } : { x: 0, y: 0 }
    });
    if (!this.gs.pendingEquipment) {
      cb.setInteractive({ useHandCursor: true });
      cb.on('pointerdown', () => { Audio.playSe('click'); this.setOverlay('none'); });
    }
    this.overlay.add(cb);

    if (this.overlayMode === 'equip') this.buildEquipOverlay(x, y, w, h);
    else if (this.overlayMode === 'quests') buildQuestJournal(this, x, y, w, h);
    else if (this.overlayMode === 'inv') this.buildUnifiedInventoryOverlay(x, y, w, h);
    else if (this.overlayMode === 'settings') this.buildSettingsOverlay(x, y, w, h);
    else if (illustrated) {
      const gap = 8, tabW = (w - 48 - gap) / 2;
      for (const [i, mode] of (['codex', 'equipmentcatalog'] as const).entries()) {
        this.overlay.add(this.rowButton(x + 24 + i * (tabW + gap), y + 51, tabW, i === 0 ? 'モンスター' : '装備', this.overlayMode === mode,
          () => this.setOverlay(mode)).setName(`codex-tab-${i === 0 ? 'monsters' : 'equipment'}`));
      }
      if (this.overlayMode === 'codex') this.buildCodexOverlay(x + 8, y + 50, w - 16, h - 58);
      else this.buildItemCatalogOverlay(x + 8, y + 50, w - 16, h - 58);
    }
    else if (this.overlayMode === 'itemcatalog') this.buildItemCatalogOverlay(x, y, w, h);
    else if (this.overlayMode === 'shop') this.buildShopOverlay(x, y, w);
    else if (this.overlayMode === 'repair') this.buildRepairOverlay(x, y, w, h);
    else if (this.overlayMode === 'gacha') this.buildGachaOverlay(x, y, w, h);
    else if (this.overlayMode === 'pick') this.buildPickOverlay(x, y, w, h);
    else this.buildCodexOverlay(x, y, w, h);
  }

  // ---- 装備スロットから開く「装備変更」ポップアップ ----
  turnPickPage(delta: number) {
    if (this.overlayMode !== 'pick') return;
    const next = Phaser.Math.Clamp(this.pickPageIndex + delta, 0, this.pickPageCount - 1);
    if (next === this.pickPageIndex) return;
    this.pickPageIndex = next;
    this.rebuildOverlay();
  }

  buildPickOverlay(x: number, y: number, w: number, h: number) {
    const p = this.gs.player;
    const owned = this.pickSlot === 0 ? p.weapons : this.pickSlot === 1 ? p.armors : p.shields;
    const shieldBlocked = this.pickSlot === 2 && (p.weapon?.dual || p.weapon?.weaponType === 'bow');
    const removeHeight = this.pickSlot === 1 ? 0 : 38;
    const noticeHeight = (shieldBlocked ? 48 : 0) + removeHeight;
    const rowsPerPage = Math.max(1, Math.floor((h - 52 - noticeHeight - 58) / 38));
    this.pickPageCount = Math.max(1, Math.ceil(owned.length / rowsPerPage));
    this.pickPageIndex = Phaser.Math.Clamp(this.pickPageIndex, 0, this.pickPageCount - 1);
    const start = this.pickPageIndex * rowsPerPage;
    const footerY = y + h - 42;
    this.overlay.add(this.rowButton(x + 20, footerY, 80, '‹ 前へ', false,
      () => this.turnPickPage(-1), this.pickPageIndex > 0));
    this.overlay.add(this.add.text(x + w / 2, footerY + 14,
      `${this.pickPageIndex + 1} / ${this.pickPageCount}　全${owned.length}個`, {
        fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#dfe7f0'
      }).setOrigin(0.5));
    this.overlay.add(this.rowButton(x + w - 100, footerY, 80, '次へ ›', false,
      () => this.turnPickPage(1), this.pickPageIndex < this.pickPageCount - 1));
    let cy = y + 52;
    if (this.pickSlot !== 1) {
      const kind = this.pickSlot === 0 ? 'weapon' : 'shield';
      const equipped = !!p[kind];
      const remove = this.rowButton(x + 20, cy, w - 40,
        kind === 'weapon' ? '武器を外す（素手）' : '盾を外す', false,
        () => this.gs.unequipEquipment(kind), equipped);
      remove.setName(`unequip-${kind}`); this.overlay.add(remove); cy += removeHeight;
    }
    const empty = (msg: string) => {
      this.overlay.add(this.add.text(x + 20, cy, msg, { fontFamily: '"Yu Gothic UI"', fontSize: '14px', color: '#8a97ab' }));
    };

    if (this.pickSlot === 0) {
      // 武器
      if (p.weapons.length === 0) { empty('（武器を持っていない）'); return; }
      p.weapons.slice(start, start + rowsPerPage).forEach((wp, pageIndex) => {
        const i = start + pageIndex;
        const equipped = wp === p.weapon;
        const risk = durabilityRisk(wp.dur, wp.durMax);
        const elementColor = this.elementColor(wp.element);
        const frameCol = elementColor ?? gradeColor(wp.grade);
        const icon = this.framedIcon(x + 34, cy + 16, wp.key, frameCol, 36);
        const row = this.rowButton(x + 58, cy, w - 74, `${equipped ? '▶ ' : '　'}${weaponFullName(wp)}  攻${wp.atkMin}-${wp.atkMax}  耐久${wp.dur}/${wp.durMax}(${risk.label})  効果:${this.weaponEffectText(wp, true)}`, equipped, () => this.gs.equipWeapon(i));
        this.bindEquipmentTooltip(row, icon[1], { kind: 'weapon', item: wp });
        this.overlay.add([...icon, row]);
        cy += 38;
      });
    } else if (this.pickSlot === 1) {
      // 服・鎧
      if (p.armors.length === 0) { empty('（服を持っていない）'); return; }
      p.armors.slice(start, start + rowsPerPage).forEach((armor, pageIndex) => {
        const i = start + pageIndex;
        const equipped = armor === p.armor;
        const texKey = isPlayerArmor(armor.key) ? armorTextureKey(armor.key) : 'armor_leather';
        const icon = this.framedIcon(x + 34, cy + 16, texKey, gradeColor(armor.grade), 36);
        const row = this.rowButton(x + 58, cy, w - 74,
          `${equipped ? '▶ ' : '　'}${armorFullName(armor)}  防御+${armor.defBonus + armor.plus}`,
          equipped, () => this.gs.equipArmor(i));
        this.bindEquipmentTooltip(row, icon[1], { kind: 'armor', item: armor });
        this.overlay.add([...icon, row]);
        cy += 38;
      });
    } else {
      // 盾
      if (shieldBlocked) {
        this.overlay.add(this.add.text(x + 20, cy, '⚠ 弓・二刀流中は盾を持てない（武器を持ち替えれば装備できる）', {
          fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: this.theme.text, wordWrap: { width: w - 40 }
        }));
        cy += noticeHeight;
      }
      if (p.shields.length === 0) { empty('（盾を持っていない）'); return; }
      p.shields.slice(start, start + rowsPerPage).forEach((sh, pageIndex) => {
        const i = start + pageIndex;
        const equipped = sh === p.shield;
        const risk = durabilityRisk(sh.dur, sh.durMax);
        const elementColor = this.elementColor(sh.element);
        const frameCol = elementColor ?? gradeColor(sh.grade);
        const icon = this.framedIcon(x + 34, cy + 16, sh.key, frameCol, 36);
        const totalDef = sh.defBonus + (sh.plus ?? 0);
        const row = this.rowButton(x + 58, cy, w - 74, `${equipped ? '▶ ' : '　'}${shieldFullName(sh)}  防御+${totalDef}  耐久${sh.dur}/${sh.durMax}(${risk.label})  効果:${this.shieldEffectText(sh, true)}`, equipped, () => this.gs.equipShield(i));
        this.bindEquipmentTooltip(row, icon[1], { kind: 'shield', item: sh });
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
        this.bindEquipmentTooltip(row, icon[1], { kind: 'weapon', item: wp });
        const sell = this.rowButton(x + w - sellW - 10, cy, sellW,
          equipped ? '装備中' : `${IS_MOBILE ? '売' : '売却'} ${this.gs.weaponSellPrice(wp)}G`, false,
          () => this.gs.sellWeapon(entry.index), !equipped);
        this.overlay.add([...icon, row, sell]);
      } else if (entry.kind === 'armor') {
        const armor = entry.item;
        const equipped = armor === p.armor;
        const texKey = isPlayerArmor(armor.key) ? armorTextureKey(armor.key) : 'armor_leather';
        const icon = this.framedIcon(x + 34, cy + 14, texKey, gradeColor(armor.grade), 34);
        const row = this.rowButton(x + 56, cy, w - 78 - sellW,
          `服 ${equipped ? '▶ ' : ''}${armorFullName(armor)}  防御+${armor.defBonus + armor.plus}`,
          equipped, () => this.gs.equipArmor(entry.index));
        this.bindEquipmentTooltip(row, icon[1], { kind: 'armor', item: armor });
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
        this.bindEquipmentTooltip(row, icon[1], { kind: 'shield', item: sh });
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
        sub: armor ? `防+${armor.defBonus + armor.plus}` : '装備なし',
        texture: armor ? armorTextureKey(armor.key) : undefined,
        color: armor ? gradeColor(armor.grade) : 0x36585d,
        slot: 1
      },
      {
        label: '盾',
        name: (p.weapon?.dual || p.weapon?.weaponType === 'bow') ? (p.weapon?.weaponType === 'bow' ? '弓装備中' : '二刀流中') : p.shield ? shieldFullName(p.shield) : '装備なし',
        sub: (p.weapon?.dual || p.weapon?.weaponType === 'bow') ? '盾は装備できない' : p.shield ? `防+${p.shield.defBonus + p.shield.plus}　耐久${p.shield.dur}/${p.shield.durMax}` : '装備なし',
        texture: (p.weapon?.dual || p.weapon?.weaponType === 'bow') ? p.weapon.key : p.shield?.key,
        color: (p.weapon?.dual || p.weapon?.weaponType === 'bow')
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
        ? `道具　${p.inventory.length}個（上限なし）　／ 売却は1個ずつ`
        : `所持品一覧　装備 ${equipmentEntries.length}　道具 ${p.inventory.length}`;
    this.overlay.add(this.add.text(x + 16, y + 160, listTitle, {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '10px' : '12px', color: '#b8d8d6'
    }));

    const listY = y + 181;
    const rowHeight = IS_MOBILE ? 64 : 36;
    const visibleCount = Math.max(4, Math.floor((h - 223) / rowHeight));
    this.inventoryScrollMax = Math.max(0, entries.length - visibleCount);
    this.inventoryScrollIndex = Phaser.Math.Clamp(this.inventoryScrollIndex, 0, this.inventoryScrollMax);

    if (!entries.length) {
      this.overlay.add(this.add.text(x + 20, listY + 8, '（この分類には何もありません）', {
        fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#8a97ab'
      }));
    }

    entries.slice(this.inventoryScrollIndex, this.inventoryScrollIndex + visibleCount).forEach((entry, visibleIndex) => {
      const cy = listY + visibleIndex * rowHeight;
      const actionW = IS_MOBILE ? 72 : 94;
      if (entry.type === 'weapon') {
        const wp = entry.item;
        const equipped = wp === p.weapon;
        const risk = durabilityRisk(wp.dur, wp.durMax);
        const icon = this.framedIcon(x + 33, cy + 14, wp.key, this.elementColor(wp.element) ?? gradeColor(wp.grade), 32);
        const row = this.rowButton(x + 54, cy, w - 76 - actionW, `⚔ ${equipped ? '▶ ' : ''}${weaponFullName(wp)}　耐久${wp.dur}/${wp.durMax}(${risk.label})　${this.weaponEffectText(wp, true)}`, equipped, () => this.gs.equipWeapon(entry.index));
        this.bindEquipmentTooltip(row, icon[1], { kind: 'weapon', item: wp });
        const action = this.rowButton(x + w - actionW - 10, cy, actionW,
          equipped ? '装備中' : `売却 ${this.gs.weaponSellPrice(wp)}G`, false,
          () => this.gs.sellWeapon(entry.index), !equipped);
        this.overlay.add([...icon, row, action]);
      } else if (entry.type === 'armor') {
        const armor = entry.item;
        const equipped = armor === p.armor;
        const texKey = isPlayerArmor(armor.key) ? armorTextureKey(armor.key) : 'armor_leather';
        const icon = this.framedIcon(x + 33, cy + 14, texKey, gradeColor(armor.grade), 32);
        const row = this.rowButton(x + 54, cy, w - 76 - actionW,
          `服 ${equipped ? '▶ ' : ''}${armorFullName(armor)}　防+${armor.defBonus + armor.plus}`,
          equipped, () => this.gs.equipArmor(entry.index));
        this.bindEquipmentTooltip(row, icon[1], { kind: 'armor', item: armor });
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
        this.bindEquipmentTooltip(row, icon[1], { kind: 'shield', item: sh });
        const action = this.rowButton(x + w - actionW - 10, cy, actionW,
          equipped ? '装備中' : `売却 ${this.gs.shieldSellPrice(sh)}G`, false,
          () => this.gs.sellShield(entry.index), !equipped);
        this.overlay.add([...icon, row, action]);
      } else {
        const group = entry.group;
        const available = group.count > 0;
        const count = ` ×${group.count}`;
        const icon = this.framedIcon(x + 33, cy + 14, group.item.textureKey, isRareItem(group.kind) ? 0xff5f67 : this.theme.color, 32);
        const use = () => { this.useInventoryKind(group.kind); if (this.overlayMode !== 'repair') this.setOverlay('inv'); };
        const sellW = 112;
        const useW = 64;
        const actionY = IS_MOBILE ? cy + 30 : cy;
        const sellX = x + w - sellW - 10;
        const useX = sellX - useW - 6;
        const row = this.rowButton(x + 54, cy, IS_MOBILE ? w - 64 : useX - x - 60,
          `${group.item.name}${count}　—　${group.item.desc}`, false, use, available);
        const action = this.rowButton(useX, actionY, useW, available ? '使用' : 'なし', false, use, available);
        const sell = this.rowButton(sellX, actionY, sellW, `売却 ${this.gs.itemSellPrice(group.kind)}G`, false,
          () => this.gs.sellItem(group.kind), available);
        this.overlay.add([...icon, row, action, sell]);
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
      const cntLabel = grp.count !== 1 ? ` ×${grp.count}` : '';
      const icon = this.add.image(x + 30, cy + 14, grp.item.textureKey).setDisplaySize(26, 26);
      const row = this.rowButton(x + 48, cy, w - 64, `${grp.item.name}${cntLabel} — ${grp.item.desc}`, false, () => { this.useInventoryKind(grp.kind); if (this.overlayMode !== 'repair') this.setOverlay('inv'); }, grp.count > 0);
      this.overlay.add([icon, row]);
      cy += 34;
    });
  }

  buildCodexOverlay(x: number, y: number, w: number, h: number) {
    const label = (tx: number, ty: number, value: string, size: number, color = '#dfd9c9', width = w - 40) => {
      const t = this.add.text(tx, ty, value, { fontFamily: '"Yu Gothic UI", Meiryo, sans-serif', fontSize: `${size}px`, color,
        wordWrap: { width, useAdvancedWrap: true }, lineSpacing: 3 });
      this.overlay.add(t); return t;
    };
    const portrait = (m: MonsterDef, cx: number, cy: number, size: number) => {
      const art = this.add.image(cx, cy, m.key);
      art.setScale(size / Math.max(art.width, art.height));
      this.overlay.add(art); return art;
    };
    if (this.monsterDetail) {
      const base = this.monsterDetail, m = difficultyEnemy(base, this.gs.difficulty);
      this.overlay.add(this.rowButton(x + 16, y + 43, 138, '‹ 一覧に戻る', false, () => {
        this.monsterDetail = undefined; this.rebuildOverlay();
      }).setName('monster-detail-back'));
      portrait(m, x + w / 2, y + (IS_MOBILE ? 193 : 172), IS_MOBILE ? 180 : 190);
      label(x + w / 2, y + (IS_MOBILE ? 297 : 277), m.name, IS_MOBILE ? 23 : 28, this.theme.text).setOrigin(.5, 0);
      const element = monsterElement(m), weakTo = element ? ELEMENT_INFO[element].weakTo : undefined;
      const affinity = element ? `${ELEMENT_INFO[element].name}属性 ／ ${weakTo ? `弱点：${ELEMENT_INFO[weakTo].name}` : '弱点なし'}` : '無属性';
      label(x + 24, y + 342, `${affinity}\nHP ${m.hp} ／ 攻撃 ${m.atkMin}〜${m.atkMax} ／ 防御 ${m.def}`, IS_MOBILE ? 14 : 19, '#b6dbe0', w - 48);
      label(x + 24, y + 410, m.gimmickText ?? '固有効果なし', IS_MOBILE ? 15 : 18, '#efd59b', w - 48);
      label(x + 24, y + h - 73, m.key.startsWith('m_hw_') ? 'ハロウィンイベントで出現' : `出現：${m.minFloor}〜${m.maxFloor}階`, 13, '#a0b5bd', w - 48);
      label(x + 24, y + h - 46, `数値は${this.theme.name}の基本能力。戦闘中の強化・弱体は詳細ログで確認。`, IS_MOBILE ? 10 : 13, '#8a9aa5', w - 48);
      return;
    }
    const pageSize = 9, columns = 3, gap = IS_MOBILE ? 7 : 14;
    this.codexScrollMax = Math.max(0, Math.ceil(MONSTER_DEFS.length / pageSize) - 1);
    this.codexScrollRow = Phaser.Math.Clamp(this.codexScrollRow, 0, this.codexScrollMax);
    label(x + 16, y + 43, `発見 ${this.gs.discovered.size} / ${MONSTER_DEFS.length}体 · 絵を押すと詳しい情報`, IS_MOBILE ? 11 : 15, '#9db8c5');
    const colW = (w - 32 - gap * 2) / columns, rowH = (h - 129 - gap * 2) / 3;
    const startY = y + 76;
    MONSTER_DEFS.slice(this.codexScrollRow * pageSize, (this.codexScrollRow + 1) * pageSize).forEach((base, index) => {
      const found = this.gs.discovered.has(base.key), m = difficultyEnemy(base, this.gs.difficulty);
      const px = x + 16 + index % columns * (colW + gap), py = startY + Math.floor(index / columns) * (rowH + gap);
      this.overlay.add(this.add.rectangle(px, py, colW, rowH, found ? 0x10202b : 0x10151d, .94).setOrigin(0).setStrokeStyle(1, found ? this.theme.color : 0x3b4149));
      const artSize = Math.min(IS_MOBILE ? 83 : 102, rowH - (IS_MOBILE ? 80 : 62));
      if (found) portrait(m, px + colW / 2, py + artSize / 2 + 9, artSize).setName(`monster-card-art-${base.key}`);
      else label(px + colW / 2, py + 23, '？', IS_MOBILE ? 47 : 64, '#505c66', colW).setOrigin(.5, 0);
      const nameY = py + artSize + 14;
      label(px + colW / 2, nameY, found ? m.name : '未発見', IS_MOBILE ? 11 : 17, found ? '#f3e4c7' : '#82909a', colW - 12).setOrigin(.5, 0).setAlign('center');
      const element = monsterElement(m);
      if (IS_MOBILE) label(px + colW / 2, py + rowH - 44, found ? element ? `${ELEMENT_INFO[element].name}属性` : '無属性' : '？？？', 10, '#a9cbd1', colW - 10).setOrigin(.5, 0);
      label(px + colW / 2, py + rowH - 24, found ? IS_MOBILE ? '詳細を見る ›' : `${element ? ELEMENT_INFO[element].name : '無'} · HP ${m.hp} · 攻 ${m.atkMin}〜${m.atkMax}  ›` : base.key.startsWith('m_hw_') ? 'イベント' : `${m.minFloor}〜${m.maxFloor}階`, IS_MOBILE ? 10 : 13, '#cbb98f', colW - 10).setOrigin(.5, 0);
      const zone = this.add.zone(px, py, colW, rowH).setOrigin(0).setName(`monster-card-${base.key}`);
      if (found) zone.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        Audio.playSe('click'); this.monsterDetail = base; this.rebuildOverlay();
      });
      this.overlay.add(zone);
    });
    const navY = y + h - 40;
    this.overlay.add(this.rowButton(x + 16, navY, IS_MOBILE ? 82 : 110, '‹ 前へ', false, () => this.scrollCodex(-1), this.codexScrollRow > 0).setName('codex-prev'));
    label(x + w / 2, navY + 14, `${this.codexScrollRow + 1} / ${this.codexScrollMax + 1}`, 14, this.theme.text, 90).setOrigin(.5);
    this.overlay.add(this.rowButton(x + w - (IS_MOBILE ? 98 : 126), navY, IS_MOBILE ? 82 : 110, '次へ ›', false, () => this.scrollCodex(1), this.codexScrollRow < this.codexScrollMax).setName('codex-next'));
  }
  turnRepairPage(delta: number) {
    if (this.overlayMode !== 'repair') return;
    const next = Phaser.Math.Clamp(this.repairPageIndex + delta, 0, this.repairPageCount - 1);
    if (next === this.repairPageIndex) return;
    this.repairPageIndex = next;
    this.rebuildOverlay();
  }

  buildRepairOverlay(x: number, y: number, w: number, h: number) {
    const p = this.gs.player;
    const count = p.inventory.filter(item => item.kind === 'repair').length;
    this.overlay.add(this.add.text(x + 20, y + 54, `修復石：${count}個　1個で耐久を50回復（最大まで）\n服には耐久がありません。選ばずに閉じると消費しません。`, {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '11px' : '13px', color: '#a9d4d5',
      wordWrap: { width: w - 40 }, lineSpacing: 5
    }));
    for (const [i, kind] of (['weapon', 'shield'] as const).entries()) {
      this.overlay.add(this.rowButton(x + 20 + i * (w - 32) / 2, y + 106, (w - 48) / 2,
        kind === 'weapon' ? '武器' : '盾', this.repairKind === kind,
        () => { this.repairKind = kind; this.repairPageIndex = 0; this.rebuildOverlay(); }));
    }
    const owned: (Weapon | Shield)[] = this.repairKind === 'weapon' ? p.weapons : p.shields;
    const rowsPerPage = Math.max(1, Math.floor((h - 154 - 50) / 72));
    this.repairPageCount = Math.max(1, Math.ceil(owned.length / rowsPerPage));
    this.repairPageIndex = Phaser.Math.Clamp(this.repairPageIndex, 0, this.repairPageCount - 1);
    const start = this.repairPageIndex * rowsPerPage;
    if (!owned.length) this.overlay.add(this.add.text(x + 24, y + 164, '修復できる装備を持っていません。', { fontSize: '14px', color: '#bccbce' }));
    owned.slice(start, start + rowsPerPage).forEach((equipment, index) => {
      const cy = y + 154 + index * 72;
      const restored = Math.max(0, Math.min(50, equipment.durMax - equipment.dur));
      const equipped = equipment === p.weapon || equipment === p.shield;
      const bg = this.add.graphics().fillStyle(0x112a31).fillRoundedRect(x + 16, cy, w - 32, 64, 8);
      const icon = this.framedIcon(x + 42, cy + 32, equipment.key, gradeColor(equipment.grade), 36);
      const name = this.add.text(x + 68, cy + 6, `${equipped ? '装備中 ' : ''}${equipment.name} +${equipment.plus}`, {
        fontFamily: '"Yu Gothic UI"', fontSize: '12px', color: '#e1f2ec', wordWrap: { width: w - 172, useAdvancedWrap: true }
      });
      const dur = this.add.text(x + 68, cy + 44, `耐久 ${equipment.dur}/${equipment.durMax}${restored ? ` → ${equipment.dur + restored}` : '（最大）'}`, {
        fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#82dfcb'
      });
      const button = this.rowButton(x + w - 94, cy + 17, 74, restored ? '修復する' : '修復不要', restored > 0 && count > 0,
        () => {
          if (!this.gs.repairEquipment(this.repairKind, equipment)) return;
          if (p.inventory.some(item => item.kind === 'repair')) this.rebuildOverlay();
          else this.setOverlay('inv');
        }, restored > 0 && count > 0);
      this.overlay.add([bg, ...icon, name, dur, button]);
    });
    const footerY = y + h - 42;
    this.overlay.add(this.rowButton(x + 20, footerY, 80, '‹ 前へ', false,
      () => this.turnRepairPage(-1), this.repairPageIndex > 0));
    this.overlay.add(this.add.text(x + w / 2, footerY + 14,
      `${this.repairPageIndex + 1} / ${this.repairPageCount}　全${owned.length}個`, {
        fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#dfe7f0'
      }).setOrigin(0.5));
    this.overlay.add(this.rowButton(x + w - 100, footerY, 80, '次へ ›', false,
      () => this.turnRepairPage(1), this.repairPageIndex < this.repairPageCount - 1));
  }

  // ============ フロアショップ ============
  buildShopOverlay(x: number, y: number, w: number) {
    const p = this.gs.player;
    this.overlay.add(this.add.text(x + w - 58, y + 16, `所持 ${p.gold} G`, {
      fontFamily: '"Yu Gothic UI"', fontSize: '16px', color: this.theme.text, fontStyle: 'bold'
    }).setOrigin(1, 0));
    this.overlay.add(this.add.text(x + 24, y + 58, '装備修復石は各階1個。変身スクロールも各階1枚まで購入できます。', {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '11px' : '13px', color: '#9db8b9',
      wordWrap: { width: w - 48 }
    }));

    const rows: { kind: ShopItemKind; label: string }[] = [
      { kind: 'potion', label: '回復ポーション　体力を40回復' },
      { kind: 'repair', label: '装備修復石　武器か盾の耐久を50回復' },
      { kind: 'slime_scroll', label: 'スライム変身　30ターン／攻撃+5%・防御+1' },
      { kind: 'boss5_scroll', label: '封印王アウレリウス変身　30ターン／攻撃+10%・防御+3' }
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
        wordWrap: { width: IS_MOBILE ? w - 118 : w - 210, useAdvancedWrap: true }
      });
      const stock = this.add.text(textX, cy + (IS_MOBILE ? 49 : 48), `価格 ${SHOP_PRICES[row.kind]}G　残り ${remaining}`, {
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
    this.overlay.add(this.rowButton(x + 20, cy + 8, w - 40, '消耗品を売る → 所持品の道具欄', false,
      () => this.openInventory('items')));
  }

  // ============ ガチャ ============
  buildGachaOverlay(x: number, y: number, w: number, h: number) {
    const p = this.gs.player;
    // 所持ゴールド（右端の✕ボタンと重ならないよう左に寄せる）
    this.overlay.add(this.add.text(x + w - 60, y + 16, `所持 ${p.gold} G`, {
      fontFamily: '"Yu Gothic UI"', fontSize: '16px', color: this.theme.text, fontStyle: 'bold'
    }).setOrigin(1, 0));

    const tabW = (w - 52) / 2;
    for (const [i, pool] of (['weapon', 'armor'] as const).entries()) {
      this.overlay.add(this.rowButton(x + 20 + i * (tabW + 12), y + 52, tabW,
        pool === 'weapon' ? '武器ガチャ' : '防具ガチャ', this.gachaPool === pool,
        () => { this.gachaPool = pool; this.rebuildOverlay(); }, true, GACHA_PALETTES[pool]));
    }
    const weaponPool = this.gachaPool === 'weapon';
    const palette = GACHA_PALETTES[this.gachaPool];
    const soldOut = weaponPool && this.gs.weaponWonThisFloor;

    // 説明
    this.overlay.add(this.add.text(x + w / 2, y + 103, weaponPool ? '500Gで武器を1本召喚' : '500Gで盾・服・鎧を1つ召喚', {
      fontFamily: '"Yu Gothic UI"', fontSize: '15px', color: palette.text, fontStyle: 'bold'
    }).setOrigin(0.5));

    // 召喚できる装備と利用条件
    this.overlay.add(this.add.text(x + w / 2, y + 164, [
      weaponPool ? '武器のみ排出  /  属性装備も登場'
        : '盾・服・鎧を排出（所持済みの服は盾へ）',
      weaponPool ? '特別な装備：覇天剣アルカディア+10'
        : '特別な装備：漆黒の盾ルファルゼント+10',
      weaponPool ? soldOut ? 'この階の武器は取得済み' : '武器は1階につき最大1本'
        : '武器を取得済みでも利用できます'
    ].join('\n'), {
      fontFamily: '"Yu Gothic UI"', fontSize: IS_MOBILE ? '10px' : '11px', color: '#859a9c', align: 'center', lineSpacing: 7
    }).setOrigin(0.5));

    // 選択中のガチャに合わせ、光と召喚陣も武器／防具の色にする。
    const idleGlow = this.add.image(x + w / 2, y + h / 2 + 42, 'glow')
      .setBlendMode(Phaser.BlendModes.ADD).setTint(palette.accent).setAlpha(0.3).setScale(2.4);
    const idleRing = this.add.circle(x + w / 2, y + h / 2 + 28, 76, palette.accent, .025)
      .setStrokeStyle(1.5, palette.accent, .5);
    const idleRing2 = this.add.circle(x + w / 2, y + h / 2 + 28, 100, palette.accent, .015)
      .setStrokeStyle(1, palette.accent, .25);
    const idle = this.add.image(x + w / 2, y + h / 2 + 28, 'chest_rare').setDisplaySize(96, 96);
    this.tweens.add({ targets: idle, y: '-=10', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: idleGlow, alpha: 0.15, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: idleRing, angle: 360, duration: 9000, repeat: -1 });
    this.tweens.add({ targets: idleRing2, angle: -360, duration: 13000, repeat: -1 });
    this.overlay.add([idleGlow, idleRing2, idleRing, idle]);

    // 回すボタン
    const bw = 260, bh = 54, bx = x + w / 2 - bw / 2, by = y + h - 84;
    const afford = p.gold >= 500 && !soldOut;
    const g = this.add.graphics();
    const draw = (c: number) => {
      g.clear();
      g.fillStyle(c, 1).fillRoundedRect(bx, by, bw, bh, 12);
      g.lineStyle(2, afford ? palette.accent : 0x555f70).strokeRoundedRect(bx, by, bw, bh, 12);
    };
    draw(afford ? palette.fill : 0x142125);
    const bt = this.add.text(bx + bw / 2, by + bh / 2, soldOut ? 'この階の武器は取得済み' : `500Gで${weaponPool ? '武器' : '防具'}を召喚`, {
      fontFamily: '"Yu Gothic UI"', fontSize: '17px', color: afford ? palette.text : '#5a6577', fontStyle: 'bold'
    }).setOrigin(0.5);
    const zone = this.add.zone(bx, by, bw, bh).setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { if (afford) draw(palette.hover); });
    zone.on('pointerout', () => draw(afford ? palette.fill : 0x142125));
    zone.on('pointerdown', () => {
      if (this.gachaAnimating || !afford) return;
      Audio.playSe('click');
      const result = this.gs.gachaPull(this.gachaPool);
      if (result) this.playGachaAnimation(result);
    });
    this.overlay.add([g, bt, zone]);
  }

  // ============================================================
  // ガチャ演出（宝箱召喚版）
  //  ①暗転→古の宝箱が空から落ちてきて着地（土煙＋振動）
  //  ②宝箱が震え、隙間からランク色の光が漏れて脈動
  //  ③A以上: 宝箱が宙に浮き「静寂」→白フラッシュ→光柱と共に爆発開封
  //    B: 色フラッシュで開封 / C・D: ポンと開封
  //  ④開いた宝箱から品物が飛び出し、装備の等級を表示。S以上は金吹雪
  // ============================================================
  playGachaAnimation(result: GachaResult) {
    this.gachaAnimating = true;
    // モーダル（ガチャウィンドウ）の矩形。演出はすべてこの中で完結させる
    const { x: mx, y: my, w: mw, h: mh } = this.L.ov;
    const cx = mx + mw / 2, cy = Math.min(my + mh / 2 + 10, my + 320);
    const supreme = result.grade === 'SSS' || result.grade === 'SS' || result.grade === 'S';
    const high = supreme || result.grade === 'A';
    const mid = result.grade === 'B';
    const gradeTitle: Record<GachaResult['grade'], string> = {
      SSS: '至高遺物', SS: '神話遺物', S: '伝説遺物', A: '秘術遺物', B: '希少遺物', C: '上質な遺物', D: '遺物'
    };
    const starCount: Record<GachaResult['grade'], number> = { SSS: 7, SS: 6, S: 5, A: 4, B: 3, C: 2, D: 1 };
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
    vaultBg.lineStyle(1, this.theme.color, .18);
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
        .7 + Math.random() * 1.6, i % 5 === 0 ? this.theme.color : 0x65e9df, .16 + Math.random() * .34
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
    const sealOuter = track(this.add.circle(cx, cy + 18, 104, this.theme.color, .025)
      .setStrokeStyle(2, this.theme.color, .38).setDepth(301));
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
      ritualTag.setText(`${gradeTitle[result.grade]}　／　獲得`).setColor(colHex);
      phaseText.setAlpha(0);
      Audio.playSe(supreme ? 'levelup' : result.grade === 'A' ? 'kill' : 'chest');

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
      const rankText = track(this.add.text(cx, itemY - 118, result.grade, {
        fontFamily: '"Yu Gothic UI"', fontSize: supreme ? '58px' : '48px', fontStyle: 'bold', color: colHex
      }).setOrigin(0.5).setStroke('#000000', 8).setShadow(0, 0, colHex, 16, true, true).setScale(3.2).setAlpha(0).setDepth(307));
      this.tweens.add({
        targets: rankText, scale: 1, alpha: 1, duration: 240, delay: 420, ease: 'Cubic.easeIn',
        onComplete: () => {
          this.cameras.main.shake(160, high ? 0.01 : 0.005);
          if (high) this.tweens.add({ targets: rankText, scale: 1.15, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.easeInOut' });
        }
      });

      const stars = track(this.add.text(cx, itemY - 76, '★'.repeat(starCount[result.grade]), {
        fontFamily: '"Yu Gothic UI"', fontSize: supreme ? '18px' : '15px',
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

      // S以上：金の紙吹雪が舞い続ける
      if (supreme) {
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

  rowButton(x: number, y: number, w: number, label: string, highlight: boolean, onClick: () => void,
    enabled = true, palette?: (typeof GACHA_PALETTES)[GachaPool]) {
    const c = this.add.container(0, 0);
    const g = this.add.graphics();
    const base = !enabled ? 0x141a22 : highlight ? (palette?.fill ?? 0x264a48) : (palette?.dim ?? 0x25121e);
    const border = enabled ? (palette?.accent ?? this.theme.color) : 0x303946;
    const lineWidth = palette && highlight ? 2 : 1;
    g.fillStyle(base, 1).fillRoundedRect(x, y, w, 28, 5);
    g.lineStyle(lineWidth, border).strokeRoundedRect(x, y, w, 28, 5);
    const t = this.add.text(x + 10, y + 14, label, { fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: enabled ? (palette?.text ?? '#dfe7f0') : '#66727e', fontStyle: palette && highlight ? 'bold' : 'normal' }).setOrigin(0, 0.5);
    // 枠からはみ出す場合は末尾を「…」に切り詰める
    if (t.width > w - 18) {
      let s = label;
      while (s.length > 1 && t.width > w - 18) {
        s = s.slice(0, -1);
        t.setText(s + '…');
      }
    }
    if (enabled) {
      const zone = this.add.zone(x, y, w, 28).setName('row-hit').setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => { g.clear(); g.fillStyle(palette?.hover ?? 0x3f8f88, 1).fillRoundedRect(x, y, w, 28, 5); g.lineStyle(lineWidth, palette?.accent ?? 0x3fe0d0).strokeRoundedRect(x, y, w, 28, 5); });
      zone.on('pointerout', () => { g.clear(); g.fillStyle(base, 1).fillRoundedRect(x, y, w, 28, 5); g.lineStyle(lineWidth, border).strokeRoundedRect(x, y, w, 28, 5); });
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

  editCode(value: string) {
    this.codeDigits = value.slice(0, 10);
    this.codeMessage = '';
    this.rebuildOverlay();
  }

  submitCode() {
    const resetSkill = this.codeDigits === '11111111';
    const mode = difficultyFromCode(this.codeDigits);
    const accepted = this.gs.redeemCode(this.codeDigits);
    this.codeDigits = '';
    this.codeMessage = accepted ? '' : 'コードが違います';
    if (accepted && resetSkill) {
      this.codeMessage = 'スキルのクールダウンをリセットしました';
      this.rebuildOverlay();
    } else if (accepted && mode) {
      this.setOverlay('none');
    } else if (accepted) {
      this.catalogCategory = 'all';
      this.catalogPageIndex = 0;
      this.catalogDetail = null;
      this.catalogClaimMessage = '';
      this.setOverlay('itemcatalog');
    } else {
      this.rebuildOverlay();
    }
  }

  handleCodeAndCatalogKey(event: KeyboardEvent): boolean {
    if (this.overlayMode === 'settings') {
      const key = event.key.normalize('NFKC');
      if (/^[0-9]$/.test(key)) {
        event.preventDefault();
        if (!event.repeat) this.editCode(this.codeDigits + key);
      } else if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault();
        this.editCode(key === 'Delete' ? '' : this.codeDigits.slice(0, -1));
      } else if (key === 'Enter') {
        event.preventDefault();
        if (!event.repeat) this.submitCode();
      }
      return true;
    }
    if (!['itemcatalog', 'equipmentcatalog'].includes(this.overlayMode)) return false;
    const key = event.key;
    if (key === 'Escape') {
      event.preventDefault();
      if (this.catalogDetail) { this.catalogDetail = null; this.rebuildOverlay(); }
      else this.setOverlay(this.overlayMode === 'equipmentcatalog' ? 'none' : 'settings');
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'ArrowRight', 'ArrowDown', 'PageDown'].includes(key)) {
      event.preventDefault();
      if (!event.repeat) this.turnCatalogPage(['ArrowLeft', 'ArrowUp', 'PageUp'].includes(key) ? -1 : 1);
    }
    return true;
  }

  turnCatalogPage(delta: number) {
    if (!['itemcatalog', 'equipmentcatalog'].includes(this.overlayMode) || this.catalogDetail) return;
    const next = Phaser.Math.Clamp(this.catalogPageIndex + delta, 0, this.catalogPageCount - 1);
    if (next === this.catalogPageIndex) return;
    this.catalogPageIndex = next;
    this.rebuildOverlay();
  }

  selectCatalogItem(entry: CatalogEntry) {
    if (this.overlayMode === 'equipmentcatalog') {
      if (!this.gs.discoveredEquipment.has(entry.key)) return;
      this.catalogDetail = entry;
      this.rebuildOverlay();
      return;
    }
    const result = this.gs.claimCatalogItem(entry.key);
    this.catalogClaimMessage = result.message;
    if (result.status === 'pending') {
      this.setOverlay('equip');
      return;
    }
    this.catalogDetail = entry;
    this.rebuildOverlay();
  }

  buildItemCatalogOverlay(x: number, y: number, w: number, h: number) {
    const equipmentOnly = this.overlayMode === 'equipmentcatalog';
    const addText = (tx: number, ty: number, text: string, size = 14, color = '#dfe7f0', width = w - 40) => {
      const label = this.add.text(tx, ty, text, {
        fontFamily: '"Yu Gothic UI"', fontSize: `${size}px`, color,
        wordWrap: { width, useAdvancedWrap: true }, lineSpacing: 3
      });
      this.overlay.add(label);
      return label;
    };
    const addArt = (entry: CatalogEntry, cx: number, cy: number, size: number) => {
      const icon = this.add.image(cx, cy, entry.textureKey);
      icon.setScale(size / Math.max(icon.width, icon.height));
      this.overlay.add(icon);
      if (['w_hero_sword', 's_arcadia_guard', 'w_hw_emedral', 's_hw_emerald'].includes(entry.key)) { const aura = new LegendaryAura(this, icon, entry.key.startsWith('w_') ? 'sword' : 'shield'); aura.emerald = entry.key.startsWith('w_hw_') || entry.key.startsWith('s_hw_'); }
    };
    if (this.catalogDetail) {
      const entry = this.catalogDetail;
      this.overlay.add(this.rowButton(x + 16, y + 50, 132, '‹ 一覧に戻る', false, () => {
        this.catalogDetail = null;
        this.rebuildOverlay();
      }));
      addArt(entry, x + w / 2, y + 196, IS_MOBILE ? 172 : 200);
      addText(x + 24, y + 320, entry.name, IS_MOBILE ? 21 : 26, '#fff2cb', w - 48);
      addText(x + 24, y + 396, entry.summary, 16, '#58d9d1', w - 48);
      addText(x + 24, y + 432, entry.description, 16, '#dfe7f0', w - 48);
      if (!equipmentOnly) {
        addText(x + 24, y + h - 112, this.catalogClaimMessage, 14, '#fff2cb', w - 48);
        const ownedArmor = entry.category === 'armor' && this.gs.ownsArmor(entry.key.slice('armor_'.length));
        this.overlay.add(this.rowButton(x + 24, y + h - 74, 168, ownedArmor ? '所持済み' : 'もう1つ取得', true,
          () => this.selectCatalogItem(entry), !ownedArmor));
      }
      addText(x + 24, y + h - 38, '装備の数値は入手時の基本性能です。', 12, '#86a9ad', w - 48);
      return;
    }

    const tabGap = 6;
    const tabs = equipmentOnly ? CATALOG_TABS.filter(tab => tab.key !== 'item') : CATALOG_TABS;
    const tabW = (w - 32 - tabGap * (tabs.length - 1)) / tabs.length;
    tabs.forEach((tab, i) => {
      this.overlay.add(this.rowButton(x + 16 + i * (tabW + tabGap), y + 49, tabW, tab.label,
        this.catalogCategory === tab.key, () => {
          this.catalogCategory = tab.key;
          this.catalogPageIndex = 0;
          this.rebuildOverlay();
        }));
    });
    const columns = IS_MOBILE ? 2 : 3;
    const rows = Math.max(1, Math.floor((h - 164) / 140));
    const page = catalogPage(this.catalogCategory, this.catalogPageIndex, columns * rows, equipmentOnly);
    this.catalogPageIndex = page.page;
    this.catalogPageCount = page.pageCount;
    const total = equipmentOnly ? ITEM_CATALOG.filter(entry => entry.category !== 'item').length : ITEM_CATALOG.length;
    const unlocked = ITEM_CATALOG.filter(entry => entry.category !== 'item' && this.gs.discoveredEquipment.has(entry.key)).length;
    addText(x + 16, y + 87, equipmentOnly ? `開放 ${unlocked} / ${total}種類　入手すると開放` : `${page.total}種類 / 全${total}種類　絵を押すと1個取得`, IS_MOBILE ? 12 : 14, '#86a9ad');
    const gap = 10;
    const cardW = (w - 32 - gap * (columns - 1)) / columns;
    const cardH = (h - 164 - gap * (rows - 1)) / rows;
    page.entries.forEach((entry, index) => {
      const found = !equipmentOnly || this.gs.discoveredEquipment.has(entry.key);
      const px = x + 16 + (index % columns) * (cardW + gap);
      const py = y + 114 + Math.floor(index / columns) * (cardH + gap);
      const color = !found ? 0x465264 : entry.element ? ELEMENT_INFO[entry.element].color : entry.grade ? gradeColor(entry.grade) : this.theme.color;
      const card = this.add.graphics();
      card.fillStyle(0x142630).fillRoundedRect(px, py, cardW, cardH, 8);
      card.lineStyle(1, color, .65).strokeRoundedRect(px, py, cardW, cardH, 8);
      this.overlay.add(card);
      if (found) addArt(entry, px + cardW / 2, py + 43, 72);
      else addText(px + cardW / 2, py + 43, "?", 42, "#596579").setOrigin(.5);
      const name = addText(px + 10, py + 85, found ? entry.name : '未入手', IS_MOBILE ? 12 : 15, '#f5ead1', cardW - 20);
      // 長い道具名も省略せず、カード内に収める。
      while (name.height > cardH - 115 && parseInt(name.style.fontSize as string) > 10) {
        name.setFontSize(parseInt(name.style.fontSize as string) - 1);
      }
      addText(px + 10, py + cardH - 22, found ? entry.summary : '???', IS_MOBILE ? 10 : 12,
        `#${color.toString(16).padStart(6, '0')}`, cardW - 20);
      const zone = this.add.zone(px, py, cardW, cardH).setOrigin(0);
      if (found) zone.setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.selectCatalogItem(entry);
      });
      this.overlay.add(zone);
    });
    const footerY = y + h - 36;
    this.overlay.add(this.rowButton(x + 16, footerY, IS_MOBILE ? 66 : 100, equipmentOnly ? '閉じる' : '設定へ', false, () => this.setOverlay(equipmentOnly ? 'none' : 'settings')));
    this.overlay.add(this.rowButton(x + w / 2 - 76, footerY, 44, '‹', false, () => this.turnCatalogPage(-1), page.page > 0));
    addText(x + w / 2, footerY + 14, `${page.page + 1} / ${page.pageCount}`, 13).setOrigin(.5);
    this.overlay.add(this.rowButton(x + w / 2 + 32, footerY, 44, '›', false, () => this.turnCatalogPage(1), page.page < page.pageCount - 1));
  }

  // ---- 設定オーバーレイ：BGMと効果音（システム音）を別々に調整 ----
  buildSettingsOverlay(x: number, y: number, w: number, h: number) {
    const returnButton = this.rowButton(x + 20, y + h - 36, w - 40, '冒険を保存してスタート画面へ', true, () => {
      if (this.gs.busy || this.gs.gameEnded) return;
      this.gs.clearMoveInput();
      this.gs.stopClickPath();
      if (!this.gs.saveRun()) return;
      this.gs.scene.stop('UIScene');
      this.gs.scene.start('TitleScene');
    });
    returnButton.setName('settings-return-title');
    this.overlay.add(returnButton);
    this.overlay.add(this.add.text(x + w - 166, y + 18, 'アクセス計測について', {
      fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#8de0e4', padding: { x: 4, y: 8 }
    }).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      window.open('./privacy.html', '_blank', 'noopener,noreferrer');
    }));
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
        draw(this.theme.color);
        const t = this.add.text(bx + bw / 2, by + 19, text(), {
          fontFamily: '"Yu Gothic UI"', fontSize: '17px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        const zone = this.add.zone(bx, by, bw, 38).setOrigin(0).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => draw(0x3f8f88));
        zone.on('pointerout', () => draw(this.theme.color));
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

    this.overlay.add(this.add.text(x + (IS_MOBILE ? 20 : 30), cy + 14,
      '音楽と効果音は別々に調整できます。\nコードは下の数字ボタン、またはキーボードから入力できます。', {
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
    displayBg.lineStyle(1.5, this.theme.color, 1).strokeRoundedRect(displayX, displayY, displayW, 38, 7);
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
    const codeButton = (bx: number, by: number, bw: number, label: string, onClick: () => void, accent = false) => {
      const g = this.add.graphics();
      const draw = (hover: boolean) => {
        g.clear();
        g.fillStyle(hover ? 0x315957 : accent ? 0x49361d : 0x25121e, 1).fillRoundedRect(bx, by, bw, buttonH, 6);
        g.lineStyle(1.5, accent ? this.theme.color : 0x3f8f88, 1).strokeRoundedRect(bx, by, bw, buttonH, 6);
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
        this.editCode(this.codeDigits + String(digit));
      });
    });

    const actionY = gridY + (buttonH + gap) * 2 + 4;
    codeButton(centerX - 136, actionY, 126, '消去', () => this.editCode(''));
    codeButton(centerX + 10, actionY, 126, '入力', () => this.submitCode(), true);
    const messageText = this.add.text(centerX, actionY + 43, this.codeMessage, {
      fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#ff7777', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.overlay.add(messageText);
  }
}
