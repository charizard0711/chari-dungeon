import Phaser from 'phaser';
import { TILE } from '../textures';
import { generateDungeon, generateBossArena, DungeonData, randomFloor, isWalkable } from '../dungeon';
import type { BossRoomZone } from '../dungeon';
import { getTheme, eraSuffix, MONSTER_DEFS, WEAPON_DEFS, makeItem, gradeColor, ITEM_DEFS, ELEMENT_INFO, monsterElement } from '../data';
import type { Dir, Element, EquipmentGrade, ItemKind, MonsterDef, Shield, TileType, Vec2, Weapon } from '../types';
import {
  Player, rollWeaponByGrade, rollShield, rollShieldByGrade,
  weaponFullName, shieldFullName, makeWeapon, makeShield
} from '../player';
import { Enemy } from '../enemy';
import { computePlayerAttack, computeEnemyAttack } from '../combat';
import { Audio } from '../audio/manager';
import { bgmForFloor, elementAttackSe, weaponAttackSe } from '../audio/config';
import { enhancementChance, EQUIPMENT_LIMIT, SCROLL_DROP_RATE } from '../balance';
import {
  armorForGrade,
  DEFAULT_PLAYER_ARMOR,
  getSelectedGender,
  isPlayerArmor,
  isPlayerGender,
  PLAYER_ARMOR_DEFS,
  playerFrameIndex,
  playerSheetKey,
  PlayerArmor,
  PlayerGender,
  PlayerVisualFrame,
  setSelectedGender
} from '../playerAppearance';

// マップ表示ビューポート（画面上の座標。スマホ縦持ちでは縦型レイアウト）
import { MAP_X, MAP_Y, MAP_W, MAP_H } from '../layout';

const ANIM = 116;
// 探索画面のズーム倍率（大きいほど拡大。1.0=等倍）
const MAP_ZOOM = 1.95;
// アンチエイリアスとカメラ拡大で生じる細い隙間を隠すため、地形同士を少し重ねる。
const TERRAIN_RENDER_SIZE = TILE + 2;
const WALL_VISIBLE_TINT = 0xffffff;
const BOSS_ROOM_FLOOR_TINT = 0xd6a85c;
const WORLD_DEPTH_BASE = 10;
const WORLD_DEPTH_Y_SCALE = 0.01;
const WALL_FACADE_HEIGHT = 36;
const HOLD_FIRST_REPEAT_MS = 145;
const HOLD_BOOST_MS = 300;
const HOLD_MAX_BOOST_MS = 820;

// ボスはHPを倍にしつつ、攻撃と防御は控えめに上げる。
// 全能力を2倍にすると体感難度が約4倍になるため、総合的に約2倍の強さへ寄せる。
const BOSS_HP_MULTIPLIER = 2;
const BOSS_ATTACK_MULTIPLIER = 1.35;
const BOSS_DEFENSE_MULTIPLIER = 1.15;
// 追加ギミック込みで、中ボス以上の戦闘圧が従来比およそ1.5倍になるよう配分する。
const FLOOR_BOSS_HP_BOOST = 1.5;
const FLOOR_BOSS_ATTACK_BOOST = 1.15;
const FLOOR_BOSS_DEFENSE_BOOST = 1.08;

const MID_DRAGONS: { key: string; name: string; tint: number }[] = [
  { key: 'm_ember_drake', name: 'エンバードラゴン', tint: 0xff6a35 },
  { key: 'm_frost_wyrm', name: 'フロストワイバーン', tint: 0x9ee8ff },
  { key: 'm_storm_wyvern', name: 'ストームドラゴン', tint: 0x66a5ff },
  { key: 'm_brass_dragon', name: 'ブラスドレイク', tint: 0xe7b85e },
  { key: 'm_void_drake', name: 'ヴォイドドラゴン', tint: 0xa06bff },
  { key: 'm_bone_dragon', name: 'ボーンワイバーン', tint: 0xe0d2b8 },
  { key: 'm_hydra', name: 'ジェイドヒュドラ', tint: 0x65d58b },
  { key: 'm_ember_drake', name: 'クリムゾンドレイク', tint: 0xff4055 },
  { key: 'm_frost_wyrm', name: 'ムーンドラゴン', tint: 0xc6d5ff },
  { key: 'm_storm_wyvern', name: 'サンダーワイバーン', tint: 0xffdf66 },
  { key: 'm_brass_dragon', name: 'ゴールドドラゴン', tint: 0xffc857 },
  { key: 'm_void_drake', name: 'アビスドラゴン', tint: 0x735cff },
  { key: 'm_bone_dragon', name: 'カースドドラゴン', tint: 0xd19aff },
  { key: 'm_hydra', name: 'ブラッドヒュドラ', tint: 0xff5f72 },
  { key: 'm_storm_wyvern', name: 'セレスティアルドラゴン', tint: 0x88eaff }
];

const MILESTONE_BOSSES: Record<number, { key: string; name: string; tint: number; scale: number; hp: number; atkMin: number; atkMax: number; def: number }> = {
  5: { key: 'm_archdemon', name: '封印王アウレリウス', tint: 0xffc96b, scale: 1.72, hp: 96, atkMin: 6, atkMax: 11, def: 4 },
  10: { key: 'm_horn_demon', name: 'グランドバイソン', tint: 0xc98b52, scale: 1.82, hp: 150, atkMin: 9, atkMax: 16, def: 7 },
  15: { key: 'm_bone_colossus', name: '炉心王タイタン', tint: 0xff9a45, scale: 1.9, hp: 220, atkMin: 11, atkMax: 19, def: 10 },
  20: { key: 'm_frost_wyrm', name: 'アズールドラゴン', tint: 0x4fa8ff, scale: 1.85, hp: 310, atkMin: 14, atkMax: 23, def: 12 },
  25: { key: 'm_brass_dragon', name: 'エンシェントドラゴン', tint: 0xff8c42, scale: 1.92, hp: 410, atkMin: 17, atkMax: 28, def: 15 },
  30: { key: 'm_hydra', name: 'トライヘッド・ドラゴン', tint: 0xb072ff, scale: 2.05, hp: 580, atkMin: 20, atkMax: 34, def: 18 }
};

export interface GachaResult {
  rank: 'SS' | 'S' | 'A' | 'B' | 'C';
  color: number;
  name: string;
  texKey: string;
  hasEffect: boolean;
  elementColor?: number;
  tintIcon: boolean;
  category: '武器' | '盾' | '鎧';
  grade: EquipmentGrade;
  elementName?: string;
  feature?: string;
}

interface Chest {
  x: number;
  y: number;
  opened: boolean;
  rare: boolean;   // 赤い宝箱=レア（レアアイテム・大量ゴールド）
  sprite: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Image;
  phase: number;
  baseScale: number;
}

interface GroundItem {
  x: number;
  y: number;
  kind: ItemKind | 'coin' | 'weapon' | 'shield';
  sprite: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Image;
  phase: number;
  value?: number;
  weapon?: Weapon;
  shield?: Shield;
}

type PendingEquipment =
  | { kind: 'weapon'; item: Weapon; source: string }
  | { kind: 'shield'; item: Shield; source: string };

interface AmbientMote {
  x: number;
  y: number;
  baseY: number;
  phase: number;
  sprite: Phaser.GameObjects.Arc;
}

interface WallFacade {
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Image;
}

interface TerrainVisual {
  key: string;
  frame?: number;
  size?: number;
  depth?: number;
}

type BossGimmickKind =
  | 'mid_fire' | 'mid_frost' | 'mid_storm' | 'mid_void' | 'mid_bone' | 'mid_poison'
  | 'bull_charge' | 'furnace_titan' | 'azure_flight' | 'ancient_fire' | 'tri_head';

type BossHazardKind = 'fire' | 'ice' | 'poison' | 'slow' | 'web' | 'lightning';
type BossStrikeChannel = 'primary' | 'secondary' | 'tertiary';
type BossImpactKind = 'fire' | 'ice' | 'lightning' | 'void' | 'bone' | 'poison' | 'impact';

interface BossWarningMarker {
  x: number;
  y: number;
  turns: number;
  channel: BossStrikeChannel;
  plate: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

interface BossIntent {
  kind: BossGimmickKind;
  tiles: Vec2[];
  secondary: Vec2[];
  tertiary: Vec2[];
  destination?: Vec2;
  markers: BossWarningMarker[];
  triggered: boolean;
}

interface BossRuntime {
  kind: BossGimmickKind;
  cooldown: number;
  phase: number;
  stunned: number;
  phaseTwo: boolean;
  intent?: BossIntent;
}

interface BossHazard {
  x: number;
  y: number;
  kind: BossHazardKind;
  turns: number;
  sprite: Phaser.GameObjects.Rectangle;
}

interface BossObstacle {
  x: number;
  y: number;
  turns: number;
  kind: 'bone' | 'iron';
  sprite: Phaser.GameObjects.Image;
}

export class GameScene extends Phaser.Scene {
  player!: Player;
  dungeon!: DungeonData;
  floor = 1;
  turn = 0;
  floorTurn = 0;
  score = 0;
  floorStartHp = 100;
  floorDamaged = false;
  busy = false;
  gameEnded = false;
  floorBossDefeated = false;
  inBossRoom = false;
  bossRewardClaimed = false;
  bossEntranceClosed = false;
  weaponWonThisFloor = false;
  reviveSeedSeen = false;
  shopPurchases = { potion: 0, stone: 0, shieldstone: 0 };
  clickPathToken = 0;
  clickPathActive = false;
  lastMapClickAt = 0;
  qaBossMode = false;
  qaBossRoomZone?: BossRoomZone;

  tileSprites: Phaser.GameObjects.Image[][] = [];
  wallFacades: WallFacade[] = [];
  explored: boolean[][] = [];
  visibleTiles: boolean[][] = [];
  enemies: Enemy[] = [];
  chests: Chest[] = [];
  ground: GroundItem[] = [];
  ambientMotes: AmbientMote[] = [];
  bossStates = new Map<Enemy, BossRuntime>();
  bossHazards: BossHazard[] = [];
  bossObstacles: BossObstacle[] = [];
  bossFloorDecor?: Phaser.GameObjects.Graphics;
  bossRoomBackdrop?: Phaser.GameObjects.Image;
  bossRoomDecorSprites: Phaser.GameObjects.Image[] = [];
  discovered: Set<string> = new Set();
  pendingEquipment: PendingEquipment | null = null;
  secretDualUnlocked = false;
  playerRootTurns = 0;
  itemSealTurns = 0;

  playerSprite!: Phaser.GameObjects.Image;
  playerShadow?: Phaser.GameObjects.Image; // 足元の影（接地感）
  playerAura?: Phaser.GameObjects.Image; // 武器強化のオーラ（剣が光る演出）
  weaponSprite?: Phaser.GameObjects.Image; // キャラが手に持つ武器（装備で変化）
  stepToggle = false; // 歩行アニメの左右足切り替え
  stepFrame = 0;
  playerAttacking = false;
  playerGender: PlayerGender = getSelectedGender();
  playerArmor: PlayerArmor | null = null;
  playerAnimToken = 0;
  stairsHint!: Phaser.GameObjects.Text;
  lightRadius = 3;
  shroomTurns = 0;
  torchTurns = 0;
  dashSteps = 0; // 疾風の羽：残り歩数（1歩で2マス進める）
  themeTileTint = 0xffffff; // 現在フロアのタイル色合い（2階ごとに変わる）
  invisTurns = 0; // 透明ポーション：残りターン（敵から完全に見えない）

  // 長居ペナルティフラグ
  penaltyFlags = { p100: false, p150: false, p200: false, p250: false };

  keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    enter: Phaser.Input.Keyboard.Key;
  };

  // 長押し移動：押しっぱなしで歩き続ける
  heldDir: Dir | null = null;
  holdRepeatAt = 0; // この時刻を過ぎたらリピート開始（初回の誤連打防止）
  holdStartedAt = 0;
  holdBoostTier = 0; // 0=通常 / 1=BOOST / 2=MAX BOOST
  touchDir: Dir | null = null; // スマホ用十字ボタンの押しっぱなし方向（UISceneが設定）
  boostBadge?: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  create() {
    // 状態初期化
    this.player = new Player();
    const qaParams = new URLSearchParams(location.search);
    const qaGender = qaParams.get('qa-gender');
    this.playerGender = location.hostname === 'localhost' && isPlayerGender(qaGender)
      ? qaGender
      : getSelectedGender();
    setSelectedGender(this.playerGender);
    const qaArmor = qaParams.get('qa-armor');
    this.playerArmor = location.hostname === 'localhost' && isPlayerArmor(qaArmor)
      ? qaArmor
      : DEFAULT_PLAYER_ARMOR;
    this.player.armorDefBonus = PLAYER_ARMOR_DEFS[this.playerArmor].defBonus;
    const qaFloor = location.hostname === 'localhost' ? Number(qaParams.get('qa-floor')) : 1;
    const startFloor = Number.isInteger(qaFloor) && qaFloor >= 1 && qaFloor <= 30 ? qaFloor : 1;
    this.qaBossMode = location.hostname === 'localhost' && qaParams.has('qa-boss');
    const qaZone = qaParams.get('qa-boss-zone') as BossRoomZone | null;
    this.qaBossRoomZone = location.hostname === 'localhost' && qaZone && ['north', 'south', 'east', 'west', 'center'].includes(qaZone)
      ? qaZone
      : undefined;
    if (location.hostname === 'localhost' && qaParams.has('qa-gacha')) this.player.gold = 1500;
    if (location.hostname === 'localhost' && qaParams.has('qa-equipment')) {
      const weaponKeys = [
        'w_iron_dagger', 'w_shadow_stiletto', 'w_sawtooth_dirk', 'w_moon_fang', 'w_assassin_requiem',
        'w_soldier_blade', 'w_knight_sword', 'w_rune_saber', 'w_paladin_edge', 'w_black_oath',
        'w_iron_pike', 'w_royal_spear', 'w_bone_lance', 'w_drill_lance', 'w_dragon_lance',
        'w_hunter_bow', 'w_composite_bow', 'w_blackwood_bow', 'w_royal_bow', 'w_siege_arbalest',
        'w_rusted_greatsword', 'w_executioner_blade', 'w_titan_cleaver', 'w_holy_greatsword', 'w_grand_breaker'
      ];
      const shieldKeys = [
        's_iron_round', 's_mirror_silver', 's_thorn_guard', 's_chrono_guard', 's_seraph_guard',
        's_flame_aegis', 's_tidal_aegis', 's_storm_aegis', 's_frost_aegis'
      ];
      this.player.weapons = weaponKeys.map((key) => makeWeapon(key, []));
      this.player.weapon = this.player.weapons[this.player.weapons.length - 1];
      this.player.shields = shieldKeys.map((key) => makeShield(key));
      this.player.shield = this.player.shields[3];
    }
    if (this.qaBossMode) { this.player.hpMax = 999; this.player.hp = 999; }
    this.floor = 1;
    this.turn = 0;
    this.score = 0;
    this.busy = false;
    this.gameEnded = false;
    this.floorBossDefeated = false;
    this.inBossRoom = false;
    this.bossRewardClaimed = false;
    this.bossEntranceClosed = false;
    this.weaponWonThisFloor = false;
    this.reviveSeedSeen = false;
    this.shopPurchases = { potion: 0, stone: 0, shieldstone: 0 };
    this.clickPathToken = 0;
    this.clickPathActive = false;
    this.lastMapClickAt = 0;
    this.discovered = location.hostname === 'localhost' && qaParams.has('qa-codex')
      ? new Set(MONSTER_DEFS.map((monster) => monster.key))
      : new Set();
    this.pendingEquipment = null;
    this.secretDualUnlocked = false;
    this.dashSteps = 0;
    this.stepFrame = 0;
    this.playerAttacking = false;
    this.playerAnimToken = 0;

    // シーン再起動時、Phaserはインスタンスを再利用するため
    // 前回の（破棄済み）オブジェクト参照をリセットする
    this.logHistory = [];
    this.playerSprite = undefined as any;
    this.playerShadow = undefined;
    this.playerAura = undefined;
    this.weaponSprite = undefined;
    this.tileSprites = [];
    this.enemies = [];
    this.chests = [];
    this.ground = [];
    this.ambientMotes = [];
    this.bossStates = new Map();
    this.bossHazards = [];
    this.bossObstacles = [];
    this.explored = [];
    this.visibleTiles = [];

    this.cameras.main.setViewport(MAP_X, MAP_Y, MAP_W, MAP_H);
    this.cameras.main.setBackgroundColor('#05070a');

    if (this.textures.exists('dungeon_chamber')) {
      this.add.image(MAP_W / 2, MAP_H / 2, 'dungeon_chamber')
        .setScrollFactor(0)
        .setDisplaySize(MAP_W, MAP_H)
        .setTint(0x6d9996)
        .setAlpha(.18)
        .setDepth(-20);
    }
    this.boostBadge = this.add.text(14, MAP_H - 38, '⚡ BOOST', {
      fontFamily: '"Yu Gothic UI"', fontSize: '11px', color: '#061012', fontStyle: 'bold',
      backgroundColor: '#58d9d1', padding: { x: 9, y: 5 }
    }).setScrollFactor(0).setDepth(50).setVisible(false);

    // 入力
    const kb = this.input.keyboard!;
    this.keys = {
      up: kb.addKey('UP'),
      down: kb.addKey('DOWN'),
      left: kb.addKey('LEFT'),
      right: kb.addKey('RIGHT'),
      enter: kb.addKey('ENTER')
    };
    // 矢印はupdate()内でホールド検出（長押しで連続移動できる）
    kb.on('keydown-ENTER', (event: KeyboardEvent) => { event.preventDefault(); this.tryDescend(); });
    this.input.off('pointerdown', this.handleMapClick, this);
    this.input.on('pointerdown', this.handleMapClick, this);
    this.heldDir = null;
    this.holdRepeatAt = 0;
    this.holdStartedAt = 0;
    this.holdBoostTier = 0;
    this.touchDir = null;

    // UIシーン起動（重ねて表示）
    this.scene.launch('UIScene');

    this.stairsHint = this.add.text(0, 0, '', {
      fontFamily: '"Yu Gothic UI"', fontSize: '13px', color: '#f5c542',
      backgroundColor: '#000000aa', padding: { x: 4, y: 2 }
    }).setDepth(30).setVisible(false);

    this.buildFloor(startFloor, this.qaBossMode);
    if (location.hostname === 'localhost' && qaParams.has('qa-torch')) {
      this.player.inventory.push(makeItem('torch'));
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-use-torch')) {
      this.torchTurns = 10;
      this.updateVisibility();
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-variety-room')) {
      const room = this.dungeon.rooms.find((candidate) => candidate.w === 3 && candidate.h === 3);
      const qaPos = room && [
        { x: room.cx, y: room.cy },
        { x: room.cx - 1, y: room.cy }, { x: room.cx + 1, y: room.cy },
        { x: room.cx, y: room.cy - 1 }, { x: room.cx, y: room.cy + 1 }
      ].find((position) => !this.enemyAt(position.x, position.y) && !this.chestAt(position.x, position.y));
      if (qaPos) {
        this.player.x = qaPos.x;
        this.player.y = qaPos.y;
        this.placeSprite(this.playerSprite, qaPos.x, qaPos.y);
        this.updateVisibility();
      }
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-field-door')
      && this.dungeon.bossEntry && this.dungeon.bossEntrance) {
      const entry = this.dungeon.bossEntry;
      const approach = this.dungeon.bossEntrance;
      const qaPos = { x: approach.x + approach.x - entry.x, y: approach.y + approach.y - entry.y };
      this.player.x = qaPos.x;
      this.player.y = qaPos.y;
      this.placeSprite(this.playerSprite, qaPos.x, qaPos.y);
      this.updateVisibility();
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-field-arena') && this.dungeon.bossRoom) {
      const boss = this.enemies.find((enemy) => enemy.def.isFloorBoss);
      const room = this.dungeon.bossRoom;
      const qaPos = [
        { x: room.cx - 1, y: room.cy }, { x: room.cx + 1, y: room.cy },
        { x: room.cx, y: room.cy - 1 }, { x: room.cx, y: room.cy + 1 }
      ].find((pos) => !this.enemyAt(pos.x, pos.y));
      if (boss && qaPos) {
        this.player.x = qaPos.x;
        this.player.y = qaPos.y;
        this.placeSprite(this.playerSprite, qaPos.x, qaPos.y);
        this.setBossEntranceClosed(true, false);
        this.updateVisibility();
      }
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-hurt')) {
      this.time.delayedCall(260, () => this.damagePlayer(8, 'QA被弾テスト'));
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-death')) {
      this.player.hp = 1;
      this.time.delayedCall(260, () => this.damagePlayer(8, 'QA死亡テスト'));
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-knockback')) {
      const target = [
        { x: this.player.x + 1, y: this.player.y },
        { x: this.player.x, y: this.player.y + 1 },
        { x: this.player.x - 1, y: this.player.y },
        { x: this.player.x, y: this.player.y - 1 }
      ].find((pos) => {
        const tile = this.dungeon.tiles[pos.y]?.[pos.x];
        return !!tile && isWalkable(tile) && !this.enemyAt(pos.x, pos.y) && !this.chestAt(pos.x, pos.y);
      });
      if (target) {
        const dummyDef: MonsterDef = {
          ...MONSTER_DEFS[0], key: 'qa_knockback_dummy', name: 'ノックバック試験体', hp: 999,
          atkMin: 0, atkMax: 0, def: 0, exp: 0, gold: 0, score: 0
        };
        this.addEnemy(dummyDef, target.x, target.y, 1);
      }
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-one-hit-boss')) {
      for (const enemy of this.enemies) {
        if (enemy.def.isFloorBoss) {
          enemy.hp = 1;
          this.drawEnemyHp(enemy);
        }
      }
    }
    if (location.hostname === 'localhost' && qaParams.has('qa-defeat-boss')) {
      const boss = this.enemies.find((enemy) => enemy.def.isFloorBoss);
      if (boss) this.time.delayedCall(300, () => this.killEnemy(boss, 0));
    }

    // 少し遅らせてUIに初期表示させる
    this.time.delayedCall(50, () => this.emitRefresh());
  }

  // ============ フロア生成 ============
  buildFloor(floor: number, bossRoom = false) {
    this.floor = floor;
    this.inBossRoom = bossRoom;
    if (!bossRoom) {
      this.floorTurn = 0;
      this.floorStartHp = this.player.hp;
      this.floorDamaged = false;
      this.penaltyFlags = { p100: false, p150: false, p200: false, p250: false };
      this.shroomTurns = 0;
      this.torchTurns = 0;
      this.invisTurns = 0;
      this.playerRootTurns = 0;
      this.itemSealTurns = 0;
      this.bossRewardClaimed = false;
      this.weaponWonThisFloor = false;
      this.shopPurchases = { potion: 0, stone: 0, shieldstone: 0 };
    } else {
      // フィールド中ボスの任意報酬と、強ボス部屋の必須報酬は別扱い。
      this.bossRewardClaimed = false;
    }
    this.floorBossDefeated = false;
    this.bossEntranceClosed = false;
    this.clickPathToken++;
    this.playerSprite?.setAlpha(1);
    this.weaponSprite?.setAlpha(1);

    // 既存オブジェクト破棄
    this.clearBossMechanics();
    this.bossFloorDecor?.destroy();
    this.bossFloorDecor = undefined;
    this.bossRoomBackdrop?.destroy();
    this.bossRoomBackdrop = undefined;
    for (const sprite of this.bossRoomDecorSprites) sprite.destroy();
    this.bossRoomDecorSprites = [];
    for (const row of this.tileSprites) for (const s of row) s.destroy();
    this.tileSprites = [];
    for (const facade of this.wallFacades) facade.sprite.destroy();
    this.wallFacades = [];
    for (const e of this.enemies) {
      this.destroyEnemyFreezeFx(e);
      if (e.aura) { this.tweens.killTweensOf(e.aura); e.aura.destroy(); }
      e.sprite.destroy();
      e.hpBar?.destroy();
      e.shadow?.destroy();
    }
    this.enemies = [];
    for (const c of this.chests) { c.sprite.destroy(); c.glow?.destroy(); }
    this.chests = [];
    for (const gi of this.ground) { gi.sprite.destroy(); gi.glow?.destroy(); }
    this.ground = [];
    for (const m of this.ambientMotes) m.sprite.destroy();
    this.ambientMotes = [];

    this.dungeon = bossRoom ? generateBossArena(floor) : generateDungeon(floor, this.qaBossRoomZone);
    const d = this.dungeon;

    // explored初期化
    this.explored = [];
    this.visibleTiles = [];
    for (let y = 0; y < d.h; y++) {
      this.explored[y] = [];
      for (let x = 0; x < d.w; x++) this.explored[y][x] = false;
    }

    // タイル描画（系統サフィックスは4種、色合いは2階ごとに変える）
    const theme = getTheme(floor);
    this.themeTileTint = this.softenTerrainTint(theme.tileTint);
    for (let y = 0; y < d.h; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < d.w; x++) {
        const t = d.tiles[y][x];
        const visual = this.tileVisual(t, theme.era, x, y);
        const spr = this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, visual.key, visual.frame)
          .setDepth(visual.depth ?? 0)
          .setDisplaySize(visual.size ?? TERRAIN_RENDER_SIZE, visual.size ?? TERRAIN_RENDER_SIZE);
        this.tileSprites[y][x] = spr;
      }
    }
    this.createWallFacades(theme.era);
    this.createBossRoomVisuals(theme.era, theme.accent);
    this.spawnAmbientMotes(floor);

    // 小さなフロアもビューポート中央に配置し、左右に大きな空白を作らない
    const worldW = d.w * TILE, worldH = d.h * TILE;
    const padX = Math.max(0, (MAP_W - worldW) / 2);
    const padY = Math.max(0, (MAP_H - worldH) / 2);
    this.cameras.main.setBounds(-padX, -padY, Math.max(MAP_W, worldW), Math.max(MAP_H, worldH));

    // プレイヤー配置
    this.player.x = d.start.x;
    this.player.y = d.start.y;
    this.player.dir = 'down';
    if (!this.playerSprite) {
      // 足元の影
      this.playerShadow = this.add.image(0, 0, 'shadow').setDepth(10.5).setAlpha(0.7);
      // 強化オーラ（プレイヤーの足元。tintで強化色に光る）
      this.playerAura = this.add.image(0, 0, 'glow').setDepth(11).setVisible(false);
      const playerSheet = playerSheetKey(this.playerGender, this.playerArmor ?? DEFAULT_PLAYER_ARMOR);
      this.playerSprite = this.add.image(0, 0, playerSheet, playerFrameIndex('down', 'idle'))
        .setDepth(12).setScale(0.85).setOrigin(0.5, 0.6);
      // キャラが手に持つ武器（装備中の武器で絵が変わる）
      this.weaponSprite = this.add.image(0, 0, 'w_screw').setDepth(13).setDisplaySize(18, 18).setVisible(false);
    }
    this.setPlayerVisual('down', 'idle');
    this.placeSprite(this.playerSprite, d.start.x, d.start.y);
    this.playerShadow?.setPosition(this.playerSprite.x, this.playerSprite.y + 13);
    this.updatePlayerAura();
    this.cameras.main.startFollow(this.playerSprite, true, 0.15, 0.15);
    this.cameras.main.setZoom(MAP_ZOOM);

    // 敵配置
    this.spawnEnemies(floor);
    if (!bossRoom) {
      // 通常迷宮だけに探索用の宝箱とアイテムを置く。
      this.spawnChests(floor);
      this.spawnGroundItems(floor);
    }

    if (this.qaBossMode && d.bossRoom) {
      const candidates = [
        { x: d.bossRoom.x + 1, y: d.bossRoom.cy },
        { x: d.bossRoom.x + 1, y: d.bossRoom.cy - 1 },
        { x: d.bossRoom.cx, y: d.bossRoom.y + d.bossRoom.h - 2 }
      ];
      const qaPos = candidates.find((pos) => !this.enemyAt(pos.x, pos.y));
      if (qaPos) {
        this.player.x = qaPos.x;
        this.player.y = qaPos.y;
        this.placeSprite(this.playerSprite, qaPos.x, qaPos.y);
        this.setBossEntranceClosed(true, false);
      }
    }

    this.updateVisibility();
    const floorIntro = bossRoom
      ? `${floor}.5F 強ボス部屋へ転送された。ボスと配下を倒せ！`
      : floor === 5
        ? `${floor}F「${getTheme(floor).name}」に到達。この階に中ボスはおらず、最奥の扉は${floor}.5Fへ通じている。`
        : floor % 5 === 0
          ? `${floor}F「${getTheme(floor).name}」に到達。迷路内の7×7部屋で中ボスを倒すと、同じ部屋の扉から${floor}.5Fへ進める。`
          : `${floor}F「${getTheme(floor).name}」に到達。迷路内の7×7部屋で中ボスを倒すと、同じ部屋に階段が現れる。`;
    this.log(floorIntro, 'sys');
    this.events.emit('floor', floor);
    // BGMは2階ごとに切り替わる。
    Audio.playBgm(bossRoom ? 'boss' : bgmForFloor(floor));
  }

  terrainConnectionMask(x: number, y: number): number {
    let mask = 0;
    if (this.dungeon.tiles[y - 1]?.[x] && this.dungeon.tiles[y - 1][x] !== 'wall') mask |= 1;
    if (this.dungeon.tiles[y]?.[x + 1] && this.dungeon.tiles[y][x + 1] !== 'wall') mask |= 2;
    if (this.dungeon.tiles[y + 1]?.[x] && this.dungeon.tiles[y + 1][x] !== 'wall') mask |= 4;
    if (this.dungeon.tiles[y]?.[x - 1] && this.dungeon.tiles[y][x - 1] !== 'wall') mask |= 8;
    return mask;
  }

  worldDepth(worldY: number, offset = 0): number {
    return WORLD_DEPTH_BASE + (worldY + offset) * WORLD_DEPTH_Y_SCALE;
  }

  createWallFacades(era: number) {
    const d = this.dungeon;
    const texture = `terrain_wall_facade_${era}`;
    for (let y = 0; y < d.h; y++) {
      for (let x = 0; x < d.w; x++) {
        if (d.tiles[y][x] !== 'wall') continue;
        const isOpen = (tx: number, ty: number) => {
          const tile = d.tiles[ty]?.[tx];
          return !!tile && tile !== 'wall';
        };
        const northOpen = isOpen(x, y - 1);
        const southOpen = isOpen(x, y + 1);
        const westOpen = isOpen(x - 1, y);
        const eastOpen = isOpen(x + 1, y);
        const frame = (x * 13 + y * 7) % 3;
        const topY = y * TILE + TILE / 2 - 3;

        if (northOpen || southOpen) {
          const sprite = this.add.image(x * TILE + TILE / 2, topY, texture, frame)
            .setOrigin(0.5, 0)
            .setDisplaySize(TILE + 4, WALL_FACADE_HEIGHT)
            .setDepth(this.worldDepth(topY + WALL_FACADE_HEIGHT, -0.2));
          this.wallFacades.push({ x, y, sprite });
        } else if (westOpen || eastOpen) {
          // Vertical corridor edges get a narrow masonry return so side walls also read as tall.
          const sideX = x * TILE + (eastOpen ? TILE - 4 : 4);
          const sprite = this.add.image(sideX, topY, texture, frame)
            .setOrigin(0.5, 0)
            .setFlipX(westOpen)
            .setDisplaySize(13, WALL_FACADE_HEIGHT)
            .setDepth(this.worldDepth(topY + WALL_FACADE_HEIGHT, -0.25));
          this.wallFacades.push({ x, y, sprite });
        }
      }
    }
  }

  tileVisual(t: TileType, era: number, x: number, y: number): TerrainVisual {
    const suffix = eraSuffix(era);
    const bossEntry = this.dungeon?.bossEntry;
    if (t === 'floor' && bossEntry && x === bossEntry.x && y === bossEntry.y
      && !this.bossEntranceClosed && !this.floorBossDefeated) {
      return { key: 'terrain_boss_gate', size: TILE, depth: 4.2 };
    }
    switch (t) {
      case 'wall': return {
        key: `terrain_wall_${era}`,
        frame: ((x * 13 + y * 7) % 3) * 16 + this.terrainConnectionMask(x, y)
      };
      case 'stairs': return { key: 'terrain_stairs', size: TILE + 10, depth: 3.4 };
      case 'door': return { key: 'terrain_boss_gate', size: TILE, depth: 4.2 };
      case 'water': return { key: `water${suffix}` };
      case 'poison': return { key: `poison${suffix}` };
      case 'pit': return { key: `pit${suffix}` };
      case 'rune': return { key: `rune${suffix}` };
      case 'cracked': return { key: `cracked${suffix}` };
      case 'floor':
      default:
        return { key: `terrain_floor_${era}`, frame: (x * 7 + y * 11) % 3 };
    }
  }

  applyTileVisual(sprite: Phaser.GameObjects.Image, t: TileType, era: number, x: number, y: number) {
    const visual = this.tileVisual(t, era, x, y);
    sprite.setTexture(visual.key, visual.frame)
      .setDepth(visual.depth ?? 0)
      .setDisplaySize(visual.size ?? TERRAIN_RENDER_SIZE, visual.size ?? TERRAIN_RENDER_SIZE);
  }

  softenTerrainTint(tint: number): number {
    const mix = (channel: number) => Math.round(255 * 0.68 + channel * 0.32);
    const r = mix((tint >> 16) & 0xff);
    const g = mix((tint >> 8) & 0xff);
    const b = mix(tint & 0xff);
    return (r << 16) | (g << 8) | b;
  }

  createBossRoomVisuals(era: number, accent: number) {
    const room = this.dungeon.bossRoom;
    if (!room) return;
    if (room.w !== 7 || room.h !== 7) {
      this.createBossFloorDecor(accent);
      return;
    }

    const cx = room.x * TILE + room.w * TILE / 2;
    const cy = room.y * TILE + room.h * TILE / 2;
    this.bossRoomBackdrop = this.add.image(cx, cy, `terrain_boss_floor_${era}`)
      .setDepth(0.35)
      .setDisplaySize(room.w * TILE + 2, room.h * TILE + 2)
      .setVisible(false);

    const brazierInset = 16;
    const braziers = [
      [room.x * TILE + brazierInset, room.y * TILE + brazierInset],
      [(room.x + room.w) * TILE - brazierInset, room.y * TILE + brazierInset],
      [room.x * TILE + brazierInset, (room.y + room.h) * TILE - brazierInset],
      [(room.x + room.w) * TILE - brazierInset, (room.y + room.h) * TILE - brazierInset]
    ];
    for (const [x, y] of braziers) {
      const sprite = this.add.image(x, y, 'terrain_boss_brazier')
        .setDepth(this.worldDepth(y, 8))
        .setDisplaySize(20, 20)
        .setTint(accent)
        .setVisible(false);
      this.bossRoomDecorSprites.push(sprite);
    }

    const entrance = this.dungeon.bossEntrance;
    const lamps = [
      { side: 'top', x: cx, y: room.y * TILE - 7 },
      { side: 'right', x: (room.x + room.w) * TILE + 7, y: cy },
      { side: 'bottom', x: cx, y: (room.y + room.h) * TILE + 7 },
      { side: 'left', x: room.x * TILE - 7, y: cy }
    ];
    const entranceSide = entrance
      ? entrance.x < room.x ? 'left'
        : entrance.x >= room.x + room.w ? 'right'
          : entrance.y < room.y ? 'top' : 'bottom'
      : '';
    for (const lamp of lamps) {
      if (lamp.side === entranceSide) continue;
      const sprite = this.add.image(lamp.x, lamp.y, 'terrain_rune_lamp')
        .setDepth(this.worldDepth(lamp.y, 9))
        .setDisplaySize(13, 18)
        .setTint(accent)
        .setVisible(false);
      this.bossRoomDecorSprites.push(sprite);
    }
  }

  createBossFloorDecor(accent: number) {
    const room = this.dungeon.bossRoom;
    if (!room) return;
    const left = room.x * TILE + 10;
    const top = room.y * TILE + 10;
    const width = room.w * TILE - 20;
    const height = room.h * TILE - 20;
    const cx = room.cx * TILE + TILE / 2;
    const cy = room.cy * TILE + TILE / 2;
    const g = this.add.graphics().setDepth(0.45).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    g.lineStyle(2, 0xffd36b, 0.32);
    g.strokeRoundedRect(left, top, width, height, 12);
    g.lineStyle(1, accent, 0.28);
    g.strokeRoundedRect(left + 7, top + 7, width - 14, height - 14, 9);
    g.strokeCircle(cx, cy, 46);
    g.strokeCircle(cx, cy, 27);
    g.beginPath();
    g.moveTo(cx, cy - 58); g.lineTo(cx + 58, cy); g.lineTo(cx, cy + 58); g.lineTo(cx - 58, cy); g.closePath();
    g.strokePath();
    g.fillStyle(0xffe09a, 0.45);
    for (const [x, y] of [[left + 12, top + 12], [left + width - 12, top + 12], [left + 12, top + height - 12], [left + width - 12, top + height - 12]]) {
      g.fillCircle(x, y, 2.5);
    }
    this.bossFloorDecor = g;
  }

  spawnAmbientMotes(floor: number) {
    const floorCells: Vec2[] = [];
    for (let y = 1; y < this.dungeon.h - 1; y++) {
      for (let x = 1; x < this.dungeon.w - 1; x++) {
        if (this.dungeon.tiles[y][x] !== 'wall') floorCells.push({ x, y });
      }
    }
    Phaser.Utils.Array.Shuffle(floorCells);
    const count = Math.min(18, floorCells.length);
    const color = floor >= 21 ? 0xb47aff : floor >= 11 ? 0x6ce8d8 : 0x65d8ff;
    for (let i = 0; i < count; i++) {
      const pos = floorCells[i];
      const baseY = pos.y * TILE + TILE / 2 - 2 - Math.random() * 10;
      const sprite = this.add.circle(
        pos.x * TILE + TILE / 2 + (Math.random() * 18 - 9), baseY,
        0.7 + Math.random() * 1.1, color, 0.32
      ).setDepth(4.4).setBlendMode(Phaser.BlendModes.ADD);
      this.ambientMotes.push({ x: pos.x, y: pos.y, baseY, phase: Math.random() * Math.PI * 2, sprite });
    }
  }

  spawnEnemies(floor: number) {
    const pool = MONSTER_DEFS.filter((m) =>
      m.minFloor <= floor && floor <= m.maxFloor && !m.isBoss && !m.isTreasureRabbit
    );
    if (this.inBossRoom) {
      const mobCount = floor % 10 === 0 ? 5 : floor % 5 === 0 ? 4 : Math.min(4, 2 + Math.floor(floor / 12));
      for (let i = 0; i < mobCount; i++) {
        const def = pool.length ? pool[Math.floor(Math.random() * pool.length)] : MONSTER_DEFS[0];
        const pos = randomFloor(this.dungeon, this.occupiedPositions());
        if (!pos || this.distToPlayer(pos.x, pos.y) < 4) continue;
        this.addEnemy(def, pos.x, pos.y, 1 + floor * 0.035);
      }
      // 分離部屋に置くのは5階刻みの強ボスだけ。通常の中ボスはフィールド側にいる。
      if (floor % 5 === 0) this.spawnMilestoneBoss(floor);
      else this.spawnMidBossDragon(floor, false); // QAで通常階のボス部屋を直接開いた場合の保険
      return;
    }
    const arenaCells = this.bossRoomCells();
    // 出現数（狭い迷路マップに合わせて調整）
    const count = floor === 30 ? 5 : Math.min(10, 4 + Math.floor(floor / 3));
    for (let i = 0; i < count; i++) {
      const def = pool.length ? pool[Math.floor(Math.random() * pool.length)] : MONSTER_DEFS[0];
      const pos = randomFloor(this.dungeon, [this.dungeon.start, ...arenaCells]);
      if (!pos) continue;
      if (this.distToPlayer(pos.x, pos.y) < 4) continue;
      this.addEnemy(def, pos.x, pos.y, 1 + floor * 0.04);
    }
    if (floor === 30) {
      const watcher = MONSTER_DEFS.find((monster) => monster.key === 'm_watcher');
      const watcherPos = randomFloor(this.dungeon, [this.dungeon.start, ...arenaCells, ...this.occupiedPositions()]);
      if (watcher && watcherPos && this.distToPlayer(watcherPos.x, watcherPos.y) >= 5) {
        this.addEnemy(watcher, watcherPos.x, watcherPos.y, 1.15);
        this.log('最深部を巡回するコアウォッチャーの光が走った。', 'dmg');
      }
    }
    this.maybeSpawnTreasureRabbit(floor);
    if (floor !== 5) this.spawnMidBossDragon(floor, !this.dungeon.bossRoom);
  }

  maybeSpawnTreasureRabbit(floor: number) {
    const def = MONSTER_DEFS.find((monster) => monster.isTreasureRabbit);
    if (!def || floor < def.minFloor || floor > def.maxFloor) return;
    const qaForced = location.hostname === 'localhost'
      && new URLSearchParams(location.search).has('qa-rare-rabbit');
    if (!qaForced && Math.random() >= 0.025) return;
    const pos = randomFloor(this.dungeon, [...this.occupiedPositions(), ...this.bossRoomCells()]);
    if (!pos || this.distToPlayer(pos.x, pos.y) < 5) return;
    this.addEnemy(def, pos.x, pos.y, 1 + floor * 0.025);
    this.log('どこかでまばゆい金色の気配が走った…！', 'special');
  }

  floorHasGate(floor: number): boolean {
    return floor % 5 === 0;
  }

  spawnMidBossDragon(floor: number, fieldPlacement: boolean) {
    const spec = MID_DRAGONS[(floor - 1) % MID_DRAGONS.length];
    const base = MONSTER_DEFS.find((m) => m.key === spec.key) ?? MONSTER_DEFS[0];
    const def: MonsterDef = {
      ...base,
      name: spec.name,
      hp: Math.max(78, Math.floor(base.hp * (1.35 + floor * 0.025) * BOSS_HP_MULTIPLIER * FLOOR_BOSS_HP_BOOST)),
      atkMin: Math.max(5, Math.floor(base.atkMin * (1.04 + floor * 0.008) * BOSS_ATTACK_MULTIPLIER * FLOOR_BOSS_ATTACK_BOOST)),
      atkMax: Math.max(10, Math.floor(base.atkMax * (1.04 + floor * 0.008) * BOSS_ATTACK_MULTIPLIER * FLOOR_BOSS_ATTACK_BOOST)),
      def: Math.max(1, Math.ceil((base.def + Math.floor(floor / 10)) * BOSS_DEFENSE_MULTIPLIER * FLOOR_BOSS_DEFENSE_BOOST)),
      exp: Math.max(12, base.exp * 2),
      gold: Math.max(18, base.gold * 3),
      score: Math.max(90, base.score * 3),
      minFloor: floor,
      maxFloor: floor,
      isElite: true,
      isBoss: false,
      isFloorBoss: true,
      isDragonType: true,
      bossTint: spec.tint
    };
    const message = fieldPlacement
      ? `◆ ${floor}F 中ボス「${def.name}」が迷宮内のどこかに現れた！`
      : this.inBossRoom
        ? `◆ ${floor}.5F 中ボス「${def.name}」が現れた！`
        : `◆ ${floor}F 7×7の専用部屋から強い気配がする。入口を探せ。`;
    this.placeFloorBoss(def, 1.32, spec.tint, message, this.midBossGimmick(base.key), fieldPlacement);
  }

  spawnMilestoneBoss(floor: number) {
    const spec = MILESTONE_BOSSES[floor];
    if (!spec) return;
    const base = MONSTER_DEFS.find((m) => m.key === spec.key) ?? MONSTER_DEFS[0];
    const def: MonsterDef = {
      ...base,
      name: spec.name,
      hp: Math.floor(spec.hp * BOSS_HP_MULTIPLIER * FLOOR_BOSS_HP_BOOST),
      atkMin: Math.floor(spec.atkMin * BOSS_ATTACK_MULTIPLIER * FLOOR_BOSS_ATTACK_BOOST),
      atkMax: Math.floor(spec.atkMax * BOSS_ATTACK_MULTIPLIER * FLOOR_BOSS_ATTACK_BOOST),
      def: Math.ceil(spec.def * BOSS_DEFENSE_MULTIPLIER * FLOOR_BOSS_DEFENSE_BOOST),
      exp: Math.max(30, base.exp * 4),
      gold: Math.max(45, base.gold * 5),
      score: Math.max(240, base.score * 6),
      minFloor: floor,
      maxFloor: floor,
      isElite: true,
      isBoss: floor === 30,
      isFloorBoss: true,
      isDragonType: floor >= 20,
      bossTint: spec.tint
    };
    const label = floor % 10 === 0
      ? `★★ ${floor}.5F 超ボス「${def.name}」が降臨した！`
      : `★ ${floor}.5F 強ボス「${def.name}」が立ちはだかった！`;
    this.placeFloorBoss(def, spec.scale, spec.tint, label, this.milestoneGimmick(floor));
  }

  placeFloorBoss(
    def: MonsterDef,
    scale: number,
    tint: number,
    message: string,
    gimmick: BossGimmickKind,
    fieldPlacement = false
  ) {
    let pos = fieldPlacement ? this.randomFieldBossPosition() : this.bossArenaPosition();
    if (!fieldPlacement && !pos) pos = this.nearStairsPosition();
    if (!pos || this.distToPlayer(pos.x, pos.y) < 5 || this.enemyAt(pos.x, pos.y)) {
      pos = randomFloor(this.dungeon, this.occupiedPositions());
    }
    if (!pos) return;
    const enemy = this.addEnemy(def, pos.x, pos.y, 1);
    enemy.baseScale *= scale;
    enemy.sprite.setScale(enemy.baseScale);
    this.attachAura(enemy, 36 * scale, tint);
    this.registerBossGimmick(enemy, gimmick);
    this.log(message, 'dmg');
  }

  midBossGimmick(key: string): BossGimmickKind {
    if (/frost|wyrm/.test(key)) return 'mid_frost';
    if (/storm|wyvern/.test(key)) return 'mid_storm';
    if (/void/.test(key)) return 'mid_void';
    if (/bone/.test(key)) return 'mid_bone';
    if (/hydra/.test(key)) return 'mid_poison';
    return 'mid_fire';
  }

  milestoneGimmick(floor: number): BossGimmickKind {
    return ({
      5: 'mid_fire', 10: 'bull_charge', 15: 'furnace_titan',
      20: 'azure_flight', 25: 'ancient_fire', 30: 'tri_head'
    } as Record<number, BossGimmickKind>)[floor] ?? 'mid_fire';
  }

  bossRoomCells(): Vec2[] {
    const room = this.dungeon?.bossRoom;
    if (!room) return [];
    const cells: Vec2[] = [];
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) cells.push({ x, y });
    }
    if (this.dungeon.bossEntrance) cells.push({ ...this.dungeon.bossEntrance });
    return cells;
  }

  isInsideBossRoom(x: number, y: number): boolean {
    const room = this.dungeon?.bossRoom;
    return !!room && x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h;
  }

  bossEntrancePosition(): Vec2 | null {
    return this.dungeon?.bossEntrance ? { ...this.dungeon.bossEntrance } : null;
  }

  setBossEntranceClosed(closed: boolean, announce = true) {
    const entrance = this.bossEntrancePosition();
    if (!entrance || this.bossEntranceClosed === closed) return;
    if (closed && this.floorBossDefeated) return;
    this.bossEntranceClosed = closed;
    const tile: TileType = closed ? 'door' : 'floor';
    this.dungeon.tiles[entrance.y][entrance.x] = tile;
    const era = getTheme(this.floor).era;
    const sprite = this.tileSprites[entrance.y]?.[entrance.x];
    if (sprite) this.applyTileVisual(sprite, tile, era, entrance.x, entrance.y);
    const entry = this.dungeon.bossEntry;
    const entrySprite = entry ? this.tileSprites[entry.y]?.[entry.x] : undefined;
    if (entry && entrySprite) this.applyTileVisual(entrySprite, this.dungeon.tiles[entry.y][entry.x], era, entry.x, entry.y);
    if (!this.inBossRoom) {
      Audio.playBgm(closed ? 'midboss' : bgmForFloor(this.floor));
    }
    if (!announce) return;
    this.effectFx(entrance.x, entrance.y, 'fx_magic', 1.45, 420, closed ? 0xff8a5b : 0x58d9d1);
    Audio.playSe('seal');
    const revealedBoss = closed
      ? this.enemies.find((enemy) => enemy.def.isFloorBoss && this.isInsideBossRoom(enemy.x, enemy.y))
      : undefined;
    this.log(closed && revealedBoss
      ? `ボス部屋の入口が閉じ、中ボス「${revealedBoss.def.name}」が姿を現した！`
      : closed ? 'ボス部屋の入口が閉じた！' : 'ボス部屋の入口の扉が消えた。', 'special');
  }

  closeBossEntranceOnEntry(x: number, y: number) {
    const room = this.dungeon?.bossRoom;
    if (!room || this.floorBossDefeated || this.bossEntranceClosed) return;
    const entry = this.dungeon.bossEntry;
    if (entry && x === entry.x && y === entry.y) this.setBossEntranceClosed(true);
  }

  bossArenaPosition(): Vec2 | null {
    const room = this.dungeon.bossRoom;
    if (!room) return null;
    const entry = this.dungeon.bossEntry;
    const candidates: Vec2[] = [];
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) candidates.push({ x, y });
    }
    if (entry) {
      // 埋め込み7×7部屋の中ボスは、唯一の入口から最も遠い床を初期位置にする。
      candidates.sort((a, b) => {
        const distanceA = Math.abs(a.x - entry.x) + Math.abs(a.y - entry.y);
        const distanceB = Math.abs(b.x - entry.x) + Math.abs(b.y - entry.y);
        return distanceB - distanceA;
      });
    } else {
      // N.5Fの大型アリーナは従来どおり中央を優先する。
      candidates.sort((a, b) => {
        const distanceA = Math.abs(a.x - room.cx) + Math.abs(a.y - room.cy);
        const distanceB = Math.abs(b.x - room.cx) + Math.abs(b.y - room.cy);
        return distanceA - distanceB;
      });
    }
    for (const pos of candidates) {
      const tile = this.dungeon.tiles[pos.y]?.[pos.x];
      if (!tile || !isWalkable(tile) || tile === 'pit' || tile === 'stairs') continue;
      if (this.enemyAt(pos.x, pos.y) || this.player.x === pos.x && this.player.y === pos.y) continue;
      return pos;
    }
    return null;
  }

  registerBossGimmick(e: Enemy, kind: BossGimmickKind) {
    const state: BossRuntime = {
      kind,
      cooldown: this.qaBossMode ? 0 : kind.startsWith('mid_') ? 3 : 2,
      phase: 0,
      stunned: 0,
      phaseTwo: false
    };
    this.bossStates.set(e, state);
  }

  // 階段に隣接する歩行可能タイル（＝出口を守る位置）を返す
  nearStairsPosition(): Vec2 | null {
    const st = this.dungeon.stairs;
    const cand = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, 1], [1, -1], [-1, 1]];
    for (const [dx, dy] of cand) {
      const nx = st.x + dx, ny = st.y + dy;
      const t = this.dungeon.tiles[ny]?.[nx];
      if (t && isWalkable(t) && t !== 'pit' && !(nx === this.dungeon.start.x && ny === this.dungeon.start.y)) {
        return { x: nx, y: ny };
      }
    }
    return null;
  }

  randomFieldBossPosition(): Vec2 | null {
    const exitRoom = this.dungeon.exitRoom;
    const outsideExitRoom = (pos: Vec2) => !exitRoom || !(
      pos.x >= exitRoom.x - 1 && pos.x < exitRoom.x + exitRoom.w + 1
      && pos.y >= exitRoom.y - 1 && pos.y < exitRoom.y + exitRoom.h + 1
    );
    for (let tries = 0; tries < 80; tries++) {
      const pos = randomFloor(this.dungeon, this.occupiedPositions());
      if (!pos || !outsideExitRoom(pos)) continue;
      if (this.distToPlayer(pos.x, pos.y) < 6) continue;
      if (Math.abs(pos.x - this.dungeon.stairs.x) + Math.abs(pos.y - this.dungeon.stairs.y) < 6) continue;
      return pos;
    }
    return null;
  }

  addEnemy(def: MonsterDef, x: number, y: number, hpScale: number): Enemy {
    const e = new Enemy(def, x, y, hpScale);
    e.shadow = this.add.image(0, 0, 'shadow').setDepth(9.5).setAlpha(0.6);
    e.sprite = this.add.image(0, 0, def.key).setDepth(10).setOrigin(0.5, 0.6);
    const maxDim = def.isBoss || def.isFloorBoss ? 40
      : def.isTreasureRabbit ? 32
      : def.isElite ? 34
      : def.isDragonType ? 30
      : 26;
    const tex = this.textures.get(def.key).getSourceImage();
    const sc = maxDim / Math.max(tex.width, tex.height);
    e.sprite.setScale(sc);
    if (def.bossTint) e.sprite.setTint(def.bossTint);
    if (def.isDarkNinja) {
      e.sprite.setAlpha(0.08);
      e.shadow.setAlpha(0.12);
    }
    if (def.gimmick === 'mimic') {
      e.sprite.setTexture('chest_common').setAlpha(0.92);
      e.shadow.setAlpha(0.35);
    } else if (def.gimmick === 'ambush') {
      e.sprite.setAlpha(0.1);
      e.shadow.setAlpha(0.08);
    } else if (def.gimmick === 'statue') {
      e.sprite.setTint(0x777c83);
    } else if (def.gimmick === 'phase' || def.gimmick === 'wraith_phase') {
      e.sprite.setAlpha(def.gimmick === 'wraith_phase' ? 0.42 : 0.68);
    }
    e.baseScale = sc;
    e.bobPhase = Math.random() * Math.PI * 2;
    this.placeSprite(e.sprite, x, y);
    e.shadow.setPosition(e.sprite.x, e.sprite.y + 11);
    e.shadow.setDepth(e.sprite.depth - 0.22);
    // 最終ボスは足元に特殊オーラ（中ボス/強ボスはspawnBossで付与）
    if (def.isBoss) this.attachAura(e, maxDim, 0x4fd0ff);
    else if (def.isTreasureRabbit) this.attachAura(e, maxDim, 0xffdc55);
    e.sprite.setInteractive({ useHandCursor: true });
    e.sprite.on('pointerdown', () => this.showEnemyInfo(e));
    this.enemies.push(e);
    return e;
  }

  // ボスの足元に脈動する特殊オーラを付与する（格を演出）
  attachAura(e: Enemy, baseDim: number, tint: number) {
    if (e.aura) { this.tweens.killTweensOf(e.aura); e.aura.destroy(); }
    const auraSize = baseDim * 2.2;
    e.aura = this.add.image(e.sprite.x, e.sprite.y - 6, 'glow')
      .setDepth(e.sprite.depth - 0.16).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(auraSize, auraSize)
      .setTint(tint).setAlpha(0.55);
    // 明滅で脈動（スケールは触らない＝サイズ変更と競合させない）
    this.tweens.add({ targets: e.aura, alpha: 0.9, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  clearBossMechanics() {
    for (const state of this.bossStates.values()) {
      for (const marker of state.intent?.markers ?? []) {
        this.destroyBossWarningMarker(marker);
      }
    }
    for (const hazard of this.bossHazards) hazard.sprite.destroy();
    for (const obstacle of this.bossObstacles) obstacle.sprite.destroy();
    this.bossStates.clear();
    this.bossHazards = [];
    this.bossObstacles = [];
  }

  bossObstacleAt(x: number, y: number): BossObstacle | null {
    return this.bossObstacles.find((o) => o.x === x && o.y === y) ?? null;
  }

  destroyBossObstacle(obstacle: BossObstacle) {
    const color = obstacle.kind === 'iron' ? 0xff9147 : 0xe8d9bd;
    this.effectFx(obstacle.x, obstacle.y, 'fx_hit', 1.35, 300, color);
    this.pickupBurst(obstacle.sprite.x, obstacle.sprite.y, color, 5);
    obstacle.sprite.destroy();
    this.bossObstacles = this.bossObstacles.filter((o) => o !== obstacle);
    this.log(obstacle.kind === 'iron' ? '炉鉄壁を砕いた！' : '骨壁を砕いた！', 'special');
  }

  validBossTile(x: number, y: number): boolean {
    const tile = this.dungeon.tiles[y]?.[x];
    const insideGimmickArea = this.dungeon.bossRoom ? this.isInsideBossRoom(x, y) : true;
    return insideGimmickArea && !!tile && isWalkable(tile) && tile !== 'pit' && tile !== 'stairs';
  }

  validMonsterTile(x: number, y: number): boolean {
    const tile = this.dungeon.tiles[y]?.[x];
    return !!tile && isWalkable(tile) && tile !== 'pit' && tile !== 'stairs' && tile !== 'door';
  }

  uniqueBossTiles(tiles: Vec2[]): Vec2[] {
    const seen = new Set<string>();
    return tiles.filter((tile) => {
      const key = `${tile.x},${tile.y}`;
      if (seen.has(key) || !this.validBossTile(tile.x, tile.y)) return false;
      seen.add(key);
      return true;
    });
  }

  bossCrossTiles(cx: number, cy: number, radius: number): Vec2[] {
    const tiles: Vec2[] = [{ x: cx, y: cy }];
    for (let d = 1; d <= radius; d++) {
      tiles.push({ x: cx + d, y: cy }, { x: cx - d, y: cy }, { x: cx, y: cy + d }, { x: cx, y: cy - d });
    }
    return this.uniqueBossTiles(tiles);
  }

  bossAreaTiles(cx: number, cy: number, radius: number): Vec2[] {
    const tiles: Vec2[] = [];
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) tiles.push({ x, y });
    }
    return this.uniqueBossTiles(tiles);
  }

  bossRoomLine(horizontal: boolean, coordinate: number): Vec2[] {
    const room = this.dungeon.bossRoom;
    const tiles: Vec2[] = [];
    if (!room && horizontal) {
      for (let x = 1; x < this.dungeon.w - 1; x++) tiles.push({ x, y: coordinate });
    } else if (!room) {
      for (let y = 1; y < this.dungeon.h - 1; y++) tiles.push({ x: coordinate, y });
    } else if (horizontal) {
      for (let x = room.x; x < room.x + room.w; x++) tiles.push({ x, y: coordinate });
    } else {
      for (let y = room.y; y < room.y + room.h; y++) tiles.push({ x: coordinate, y });
    }
    return this.uniqueBossTiles(tiles);
  }

  bossChargePath(e: Enemy): Vec2[] {
    const dx = this.player.x === e.x ? 0 : Math.sign(this.player.x - e.x);
    const dy = this.player.y === e.y ? 0 : Math.sign(this.player.y - e.y);
    if (dx !== 0 && dy !== 0) return [];
    const path: Vec2[] = [];
    let x = e.x + dx;
    let y = e.y + dy;
    while (this.validBossTile(x, y)) {
      if (this.enemyAt(x, y, e) || this.bossObstacleAt(x, y)) break;
      path.push({ x, y });
      x += dx;
      y += dy;
    }
    return path;
  }

  findBossDestination(e: Enemy, edge = false): Vec2 | null {
    const room = this.dungeon.bossRoom;
    if (!room) return this.randomFieldBossPosition();
    const candidates: Vec2[] = edge
      ? [
          { x: room.x + 1, y: this.player.y }, { x: room.x + room.w - 2, y: this.player.y },
          { x: this.player.x, y: room.y + 1 }, { x: this.player.x, y: room.y + room.h - 2 }
        ]
      : [
          { x: room.x + 1, y: room.y + 1 }, { x: room.x + room.w - 2, y: room.y + 1 },
          { x: room.x + room.w - 2, y: room.y + room.h - 2 }, { x: room.x + 1, y: room.y + room.h - 2 },
          { x: room.cx, y: room.cy }
        ];
    if (!edge) {
      const offset = this.bossStates.get(e)?.phase ?? 0;
      for (let i = 0; i < offset % candidates.length; i++) candidates.push(candidates.shift()!);
    }
    for (const pos of candidates) {
      if (!this.validBossTile(pos.x, pos.y)) continue;
      if (this.player.x === pos.x && this.player.y === pos.y) continue;
      if (this.enemyAt(pos.x, pos.y, e) || this.bossObstacleAt(pos.x, pos.y)) continue;
      return pos;
    }
    return null;
  }

  teleportBoss(e: Enemy, destination: Vec2) {
    this.effectFx(e.x, e.y, 'fx_magic', 1.5, 360, e.def.bossTint ?? e.def.color);
    e.x = destination.x;
    e.y = destination.y;
    this.placeSprite(e.sprite, e.x, e.y);
    this.effectFx(e.x, e.y, 'fx_magic', 1.7, 420, e.def.bossTint ?? e.def.color);
  }

  destroyBossWarningMarker(marker: BossWarningMarker) {
    this.tweens.killTweensOf(marker.plate);
    marker.plate.destroy();
    marker.label.destroy();
  }

  bossWarningMarkers(
    tiles: Vec2[],
    color: number,
    anchor: Vec2,
    channel: BossStrikeChannel,
    simultaneous = false
  ): BossWarningMarker[] {
    return tiles.map((tile) => {
      const distance = Math.abs(tile.x - anchor.x) + Math.abs(tile.y - anchor.y);
      const turns = simultaneous ? 1 : Phaser.Math.Clamp(distance + 1, 1, 3);
      const plate = this.add.rectangle(
        tile.x * TILE + TILE / 2, tile.y * TILE + TILE / 2,
        TILE - 5, TILE - 5, color, 0.2
      ).setDepth(8.2).setStrokeStyle(2, color, 0.94).setBlendMode(Phaser.BlendModes.ADD);
      const label = this.add.text(plate.x, plate.y, String(turns), {
        fontFamily: 'Arial Black, "Yu Gothic UI"',
        fontSize: '17px',
        color: '#ffffff',
        stroke: '#071115',
        strokeThickness: 5,
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(8.4);
      this.tweens.add({ targets: plate, alpha: 0.68, duration: 330, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return { ...tile, turns, channel, plate, label };
    });
  }

  prepareBossIntent(e: Enemy, state: BossRuntime): BossIntent | null {
    let tiles: Vec2[] = [];
    let secondary: Vec2[] = [];
    let tertiary: Vec2[] = [];
    let destination: Vec2 | undefined;
    let message = '';
    const p = this.player;

    switch (state.kind) {
      case 'mid_fire':
        tiles = this.bossCrossTiles(p.x, p.y, 1);
        message = `${e.def.name}が火炎弾を溜めている！ 赤いマスから離れろ。`;
        break;
      case 'mid_frost': {
        const horizontal = Math.abs(p.x - e.x) >= Math.abs(p.y - e.y);
        tiles = this.bossRoomLine(horizontal, horizontal ? p.y : p.x);
        message = `${e.def.name}の冷気が一直線に走る！`;
        break;
      }
      case 'mid_storm':
        tiles = this.bossCrossTiles(p.x, p.y, 2);
        message = `${e.def.name}が十字雷撃を呼んでいる！`;
        break;
      case 'mid_void':
        destination = this.findBossDestination(e) ?? undefined;
        if (!destination) return null;
        tiles = this.bossAreaTiles(destination.x, destination.y, 1);
        message = `${e.def.name}が空間を歪めた！ 紫のマスへ転移攻撃が来る。`;
        break;
      case 'mid_bone':
        tiles = this.bossCrossTiles(p.x, p.y, 1);
        message = `${e.def.name}が骨片を地面へ撃ち込む！`;
        break;
      case 'mid_poison':
        tiles = this.bossAreaTiles(p.x, p.y, 1).filter((_, i) => i % 2 === 0);
        message = `${e.def.name}が毒液を撒こうとしている！`;
        break;
      case 'bull_charge':
        if (Math.abs(p.x - e.x) + Math.abs(p.y - e.y) < 2) return null;
        if (p.x !== e.x && p.y !== e.y) return null;
        tiles = this.bossChargePath(e);
        if (tiles.length < 2) return null;
        message = 'グランドバイソンが突進の構え！ 横へ避ければ壁へ激突する。';
        break;
      case 'furnace_titan':
        tiles = this.bossCrossTiles(p.x, p.y, 2);
        message = '炉心王タイタンが大地を踏み砕く！ 灼熱の炉鉄壁に注意。';
        break;
      case 'azure_flight': {
        destination = this.findBossDestination(e, true) ?? undefined;
        if (!destination) return null;
        this.teleportBoss(e, destination);
        const horizontal = destination.y === p.y;
        tiles = this.bossRoomLine(horizontal, horizontal ? p.y : p.x);
        message = 'アズールドラゴンが飛翔！ 氷結ブレスの射線から逃げろ。';
        break;
      }
      case 'ancient_fire':
        destination = this.findBossDestination(e) ?? undefined;
        if (destination) this.teleportBoss(e, destination);
        tiles = this.bossAreaTiles(p.x, p.y, 1);
        state.phase++;
        message = 'エンシェントドラゴンが外周を巡り、足場を焼き払う！';
        break;
      case 'tri_head': {
        const attackCount = e.hp <= e.hpMax * 0.25 ? 3 : state.phaseTwo ? 2 : 1;
        for (let i = 0; i < attackCount; i++) {
          const head = (state.phase + i) % 3;
          if (head === 0) {
            const horizontal = Math.abs(p.x - e.x) >= Math.abs(p.y - e.y);
            tiles = this.bossRoomLine(horizontal, horizontal ? p.y : p.x);
          } else if (head === 1) {
            secondary = this.bossCrossTiles(p.x, p.y, 2);
          } else {
            tertiary = this.bossAreaTiles(p.x, p.y, 1).filter((_, index) => index % 2 === 0);
          }
        }
        state.phase = (state.phase + 1) % 3;
        message = `三つ首が${attackCount}つの息吹を同時に溜めている！`;
        break;
      }
    }

    if (!tiles.length && !secondary.length && !tertiary.length) return null;
    const simultaneous = state.kind === 'bull_charge';
    const markers = [
      ...this.bossWarningMarkers(
        tiles,
        this.bossImpactColor(this.bossImpactKind(state.kind, 'primary')),
        p,
        'primary',
        simultaneous
      ),
      ...this.bossWarningMarkers(secondary, this.bossImpactColor(this.bossImpactKind(state.kind, 'secondary')), p, 'secondary'),
      ...this.bossWarningMarkers(tertiary, this.bossImpactColor(this.bossImpactKind(state.kind, 'tertiary')), p, 'tertiary')
    ];
    this.log(message, 'dmg');
    Audio.playSe('seal');
    return { kind: state.kind, tiles, secondary, tertiary, destination, markers, triggered: false };
  }

  handleBossTurn(e: Enemy): { handled: boolean; animation?: Promise<void> } {
    const state = this.bossStates.get(e);
    if (!state) return { handled: false };

    if (!state.phaseTwo && e.hp <= e.hpMax * 0.5 && !state.kind.startsWith('mid_')) {
      state.phaseTwo = true;
      state.cooldown = Math.min(state.cooldown, 1);
      this.effectFx(e.x, e.y, 'fx_levelup', 2.2, 700, e.def.bossTint ?? 0xff7050);
      this.log(`${e.def.name}が第2形態へ移行した！ ギミックの間隔が短くなる。`, 'special');
    }

    if (state.stunned > 0) {
      state.stunned--;
      this.effectFx(e.x, e.y, 'fx_hit', 1.15, 260, 0xffe09a);
      this.log(`${e.def.name}は体勢を崩して動けない！`, 'special');
      return { handled: true };
    }

    if (state.intent) {
      const resolution = this.resolveBossIntent(e, state, state.intent);
      if (resolution.done) {
        state.intent = undefined;
        state.cooldown = state.kind.startsWith('mid_') ? 3 : state.phaseTwo ? 1 : 2;
      }
      return { handled: true, animation: resolution.animation };
    }

    if (state.cooldown > 0) {
      state.cooldown--;
      return { handled: false };
    }
    if (this.invisTurns > 0) return { handled: false };
    const room = this.dungeon.bossRoom;
    if (room && !(this.player.x >= room.x && this.player.x < room.x + room.w && this.player.y >= room.y && this.player.y < room.y + room.h)) {
      return { handled: false };
    }
    const distance = Math.max(Math.abs(this.player.x - e.x), Math.abs(this.player.y - e.y));
    if (distance > 9) return { handled: false };
    const intent = this.prepareBossIntent(e, state);
    if (!intent) return { handled: false };
    state.intent = intent;
    return { handled: true };
  }

  resolveBossIntent(
    e: Enemy,
    state: BossRuntime,
    intent: BossIntent
  ): { done: boolean; animation?: Promise<void> } {
    const due = intent.markers.filter((marker) => marker.turns <= 1);
    const remaining = intent.markers.filter((marker) => marker.turns > 1);
    const primary = due.filter((marker) => marker.channel === 'primary').map(({ x, y }) => ({ x, y }));
    const secondary = due.filter((marker) => marker.channel === 'secondary').map(({ x, y }) => ({ x, y }));
    const tertiary = due.filter((marker) => marker.channel === 'tertiary').map(({ x, y }) => ({ x, y }));
    const finalWave = remaining.length === 0;
    const firstWave = !intent.triggered;

    for (const marker of due) this.destroyBossWarningMarker(marker);
    for (const marker of remaining) {
      marker.turns--;
      marker.label.setText(String(marker.turns));
    }
    intent.markers = remaining;
    intent.triggered = true;

    const onTiles = (tiles: Vec2[]) => tiles.some((tile) => tile.x === this.player.x && tile.y === this.player.y);
    this.bossImpactFx(primary, this.bossImpactKind(intent.kind, 'primary'));
    this.bossImpactFx(secondary, this.bossImpactKind(intent.kind, 'secondary'));
    this.bossImpactFx(tertiary, this.bossImpactKind(intent.kind, 'tertiary'));

    switch (intent.kind) {
      case 'bull_charge':
        return { done: true, animation: this.resolveBullCharge(e, state, primary) };
      case 'mid_void':
        if (firstWave && intent.destination) this.teleportBoss(e, intent.destination);
        if (onTiles(primary)) this.damagePlayerFromBoss(e, 0.72, `${e.def.name}の転移衝撃！`);
        break;
      case 'furnace_titan':
        if (onTiles(primary)) this.damagePlayerFromBoss(e, 0.92, '炉心震撃！');
        this.spawnBossWalls(e, primary, state.phaseTwo ? 2 : 1, 'iron');
        break;
      case 'azure_flight':
        if (onTiles(primary)) this.damagePlayerFromBoss(e, 0.86, '氷結ブレス！');
        this.addBossHazards(primary, 'ice', 4);
        break;
      case 'ancient_fire':
        if (onTiles(primary)) this.damagePlayerFromBoss(e, 0.88, '古竜の炎！');
        this.addBossHazards(primary, 'fire', 4);
        break;
      case 'tri_head': {
        const hit = onTiles(primary) || onTiles(secondary) || onTiles(tertiary);
        if (hit) this.damagePlayerFromBoss(e, state.phaseTwo ? 1.0 : 0.82, '三首連携ブレス！');
        this.addBossHazards(primary, 'fire', 3);
        this.addBossHazards(secondary, 'ice', 3);
        this.addBossHazards(tertiary, 'poison', 4);
        break;
      }
      case 'mid_fire':
        if (onTiles(primary)) this.damagePlayerFromBoss(e, 0.7, '火炎弾！');
        this.addBossHazards(primary, 'fire', 2);
        break;
      case 'mid_frost':
        if (onTiles(primary)) this.damagePlayerFromBoss(e, 0.66, '冷気ブレス！');
        this.addBossHazards(primary, 'ice', 2);
        break;
      case 'mid_storm':
        if (onTiles(primary)) this.damagePlayerFromBoss(e, 0.78, '十字雷撃！');
        break;
      case 'mid_bone':
        if (onTiles(primary)) this.damagePlayerFromBoss(e, 0.62, '骨片噴出！');
        this.spawnBossWalls(e, primary, 1, 'bone');
        break;
      case 'mid_poison':
        if (onTiles(primary)) this.damagePlayerFromBoss(e, 0.64, '毒液散布！');
        this.addBossHazards(primary, 'poison', 3);
        break;
    }
    this.cameras.main.shake(finalWave ? 145 : 90, finalWave ? 0.009 : 0.005);
    return { done: finalWave };
  }

  bossImpactKind(kind: BossGimmickKind, channel: BossStrikeChannel): BossImpactKind {
    if (kind === 'tri_head') {
      return channel === 'primary' ? 'fire' : channel === 'secondary' ? 'ice' : 'poison';
    }
    if (kind === 'mid_fire' || kind === 'ancient_fire') return 'fire';
    if (kind === 'mid_frost' || kind === 'azure_flight') return 'ice';
    if (kind === 'mid_storm') return 'lightning';
    if (kind === 'mid_void') return 'void';
    if (kind === 'mid_bone') return 'bone';
    if (kind === 'furnace_titan') return 'fire';
    if (kind === 'mid_poison') return 'poison';
    return 'impact';
  }

  bossImpactColor(kind: BossImpactKind): number {
    return {
      fire: 0xff5a24,
      ice: 0x62dcff,
      lightning: 0xffe875,
      void: 0xb45cff,
      bone: 0xf0ddbd,
      poison: 0x8ee85a,
      impact: 0xff9d52
    }[kind];
  }

  bossImpactFx(tiles: Vec2[], kind: BossImpactKind) {
    const color = this.bossImpactColor(kind);

    for (const tile of tiles) {
      const x = tile.x * TILE + TILE / 2;
      const y = tile.y * TILE + TILE / 2;
      const art = this.add.graphics().setPosition(x, y).setDepth(23).setBlendMode(Phaser.BlendModes.ADD);

      if (kind === 'fire') {
        art.fillStyle(0xff4a1f, 0.9).fillTriangle(-10, 12, 0, -17, 10, 12);
        art.fillStyle(0xffc14d, 0.95).fillTriangle(-5, 10, 2, -9, 6, 10);
        art.fillStyle(0xffffff, 0.7).fillCircle(1, 7, 3);
        this.pickupBurst(x, y + 4, 0xff8b38, 8);
        art.y -= 16;
      } else if (kind === 'ice') {
        art.fillStyle(0x72e5ff, 0.76);
        art.fillTriangle(-12, 12, -5, -17, 0, 12);
        art.fillTriangle(-2, 12, 5, -22, 10, 12);
        art.fillStyle(0xeaffff, 0.92).fillTriangle(1, 10, 5, -14, 7, 10);
        art.lineStyle(2, 0xffffff, 0.9).strokeCircle(0, 2, 13);
        this.pickupBurst(x, y, 0xa9f4ff, 7);
      } else if (kind === 'lightning') {
        art.lineStyle(5, 0xffffff, 0.96).beginPath().moveTo(-6, -22).lineTo(4, -7).lineTo(-2, -7).lineTo(8, 18).strokePath();
        art.lineStyle(2, 0xffde55, 1).beginPath().moveTo(-11, -17).lineTo(-2, -5).lineTo(-7, -4).lineTo(4, 13).strokePath();
        this.pickupBurst(x, y, 0xffef8a, 9);
      } else if (kind === 'void') {
        art.fillStyle(0x5d1a8c, 0.78).fillCircle(0, 0, 14);
        art.lineStyle(3, 0xd491ff, 0.95).strokeCircle(0, 0, 13).strokeCircle(0, 0, 7);
        art.fillStyle(0xffffff, 0.9).fillCircle(0, 0, 2);
        art.setAngle(Phaser.Math.Between(-35, 35));
      } else if (kind === 'bone') {
        art.fillStyle(0xf7e4bd, 0.9);
        art.fillTriangle(-13, 13, -8, -16, -3, 13);
        art.fillTriangle(-5, 13, 1, -22, 6, 13);
        art.fillTriangle(4, 13, 10, -12, 14, 13);
        art.lineStyle(2, 0x9a7951, 0.9).lineBetween(-14, 13, 14, 13);
      } else if (kind === 'poison') {
        art.fillStyle(0x7dcf45, 0.74).fillCircle(-7, 6, 8).fillCircle(5, 7, 10).fillCircle(0, -2, 7);
        art.lineStyle(2, 0xc4ff83, 0.9).strokeCircle(-7, 6, 8).strokeCircle(5, 7, 10);
        this.pickupBurst(x, y, 0x9eea61, 6);
      } else {
        art.lineStyle(4, 0xffffff, 0.95);
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          art.lineBetween(Math.cos(angle) * 4, Math.sin(angle) * 4, Math.cos(angle) * 17, Math.sin(angle) * 17);
        }
        this.pickupBurst(x, y, color, 8);
      }

      const ring = this.add.circle(x, y, 7, color, 0.16).setDepth(22.5)
        .setStrokeStyle(3, color, 0.9).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: ring,
        scale: 2.5,
        alpha: 0,
        duration: 380,
        ease: 'Quad.easeOut',
        onComplete: () => ring.destroy()
      });
      this.tweens.add({
        targets: art,
        y: kind === 'fire' ? y + 5 : art.y - 5,
        scaleX: kind === 'void' ? 1.55 : 1.28,
        scaleY: kind === 'fire' ? 1.6 : 1.28,
        angle: kind === 'void' ? art.angle + 100 : art.angle,
        alpha: 0,
        duration: kind === 'fire' ? 460 : 390,
        ease: 'Cubic.easeOut',
        onComplete: () => art.destroy()
      });
    }
  }

  resolveBullCharge(e: Enemy, state: BossRuntime, path: Vec2[]): Promise<void> | undefined {
    if (!path.length) return undefined;
    const hitIndex = path.findIndex((tile) => tile.x === this.player.x && tile.y === this.player.y);
    const endIndex = hitIndex >= 0 ? Math.max(0, hitIndex - 1) : path.length - 1;
    const end = path[endIndex];
    if (hitIndex >= 0) {
      this.damagePlayerFromBoss(e, 1.2, '猛烈な突進！');
    } else {
      state.stunned = 2;
      this.log('グランドバイソンが壁へ激突！ 2ターンの反撃チャンス！', 'special');
      this.cameras.main.shake(220, 0.012);
    }
    e.x = end.x;
    e.y = end.y;
    e.animating = true;
    return this.tween(e.sprite, { x: end.x * TILE + TILE / 2, y: end.y * TILE + TILE / 2 }, 190, 'Cubic.easeIn').then(() => {
      e.animating = false;
      this.effectFx(e.x, e.y, 'fx_hit', 1.8, 420, 0xffb060);
    });
  }

  damagePlayerFromBoss(e: Enemy, factor: number, label: string) {
    const result = computeEnemyAttack(this.player, e.def);
    const damage = Math.max(1, Math.floor(result.damage * factor));
    Audio.playSe(elementAttackSe(monsterElement(e.def)));
    this.damagePlayer(damage, label, e);
    if (result.shieldBroke) this.handleShieldBreak();
    this.hitFx(this.player.x, this.player.y);
  }

  handleShieldBreak() {
    const broken = this.player.shield;
    if (!broken) return;
    this.log(`${broken.name}は壊れて砕け散った！`, 'dmg');
    Audio.playSe('break');
    this.player.shields = this.player.shields.filter((shield) => shield !== broken);
    this.player.shield = this.player.shields[0] ?? null;
  }

  spawnBossWalls(e: Enemy, candidates: Vec2[], count: number, kind: 'bone' | 'iron') {
    const choices = candidates.filter((tile) => {
      if (tile.x === this.player.x && tile.y === this.player.y) return false;
      if (tile.x === e.x && tile.y === e.y) return false;
      return !this.enemyAt(tile.x, tile.y) && !this.bossObstacleAt(tile.x, tile.y);
    });
    Phaser.Utils.Array.Shuffle(choices);
    const suffix = eraSuffix(getTheme(this.floor).era);
    const tint = kind === 'iron' ? 0x7a4b36 : 0xffe7c2;
    const effectColor = kind === 'iron' ? 0xff9147 : 0xe8d9bd;
    for (const tile of choices.slice(0, count)) {
      const texture = this.textures.exists('prop_statue') ? 'prop_statue' : `wall${suffix}`;
      const sprite = this.add.image(tile.x * TILE + TILE / 2, tile.y * TILE + TILE / 2, texture)
        .setDepth(this.worldDepth(tile.y * TILE + TILE / 2, 12))
        .setDisplaySize(TILE - 5, TILE - 3).setTint(tint);
      this.bossObstacles.push({ ...tile, turns: 5, kind, sprite });
      this.effectFx(tile.x, tile.y, 'fx_hit', 1.25, 300, effectColor);
    }
  }

  addBossHazards(tiles: Vec2[], kind: BossHazardKind, turns: number, restrictToBossRoom = true) {
    const color = kind === 'fire' ? 0xff5b35
      : kind === 'ice' ? 0x55cfff
      : kind === 'poison' ? 0x9c55d9
      : kind === 'web' ? 0xd7e8ef
      : kind === 'lightning' ? 0xffdb45
      : 0x62b86c;
    for (const tile of tiles) {
      if (!(restrictToBossRoom ? this.validBossTile(tile.x, tile.y) : this.validMonsterTile(tile.x, tile.y))) continue;
      const existing = this.bossHazards.find((hazard) => hazard.x === tile.x && hazard.y === tile.y && hazard.kind === kind);
      if (existing) { existing.turns = Math.max(existing.turns, turns); continue; }
      const sprite = this.add.rectangle(
        tile.x * TILE + TILE / 2, tile.y * TILE + TILE / 2,
        TILE - 7, TILE - 7, color, 0.3
      ).setDepth(7.8).setStrokeStyle(1, color, 0.75).setBlendMode(Phaser.BlendModes.ADD);
      this.bossHazards.push({ ...tile, kind, turns, sprite });
    }
  }

  tickBossMechanics() {
    const standing = this.bossHazards.filter((hazard) => hazard.x === this.player.x && hazard.y === this.player.y);
    if (standing.some((hazard) => hazard.kind === 'fire')) {
      this.damagePlayer(3 + Math.floor(this.floor / 6), '燃焼マスの炎！');
    }
    if (standing.some((hazard) => hazard.kind === 'poison')) {
      this.player.poisonTurns = Math.max(this.player.poisonTurns, 2);
    }
    if (standing.some((hazard) => hazard.kind === 'lightning')) {
      this.damagePlayer(2 + Math.floor(this.floor / 8), '雷床が弾けた！');
    }
    for (const hazard of [...this.bossHazards]) {
      hazard.turns--;
      hazard.sprite.setAlpha(0.16 + hazard.turns * 0.05);
      if (hazard.turns <= 0) {
        hazard.sprite.destroy();
        this.bossHazards = this.bossHazards.filter((h) => h !== hazard);
      }
    }
    for (const obstacle of [...this.bossObstacles]) {
      obstacle.turns--;
      if (obstacle.turns <= 0) {
        obstacle.sprite.destroy();
        this.bossObstacles = this.bossObstacles.filter((o) => o !== obstacle);
      }
    }
  }

  applyBossHazardOnEntry(x: number, y: number) {
    const hazards = this.bossHazards.filter((hazard) => hazard.x === x && hazard.y === y);
    if (hazards.some((hazard) => hazard.kind === 'fire')) this.damagePlayer(3 + Math.floor(this.floor / 8), '燃える床を踏んだ！');
    if (hazards.some((hazard) => hazard.kind === 'poison')) {
      this.player.poisonTurns = Math.max(this.player.poisonTurns, 3);
      this.log('毒沼を踏み、毒状態になった！', 'dmg');
    }
    if (hazards.some((hazard) => hazard.kind === 'slow' || hazard.kind === 'web')) {
      this.playerRootTurns = Math.max(this.playerRootTurns, 1);
      this.log(hazards.some((hazard) => hazard.kind === 'web') ? '糸に絡まり、次の移動が止まる！' : '足場に絡まり、次の移動が止まる！', 'dmg');
    }
    if (hazards.some((hazard) => hazard.kind === 'lightning')) {
      this.damagePlayer(3 + Math.floor(this.floor / 8), '雷床を踏んだ！');
    }
  }

  spawnChests(floor: number) {
    // 1Fには宝箱を置かない。通常宝箱は2Fから出現する。
    const n = floor === 1 ? 0 : (Math.random() < 0.75 ? 1 : 2);
    const arenaCells = this.bossRoomCells();
    for (let i = 0; i < n; i++) {
      const pos = randomFloor(this.dungeon, [...this.occupiedPositions(), ...arenaCells]);
      if (!pos) continue;
      // レア箱は序盤約10%、最深部でも最大25%。色と専用絵で一目で判別できる。
      const rare = Math.random() < 0.10 + Math.min(0.15, floor * 0.005);
      const baseScale = rare ? 0.50 : 0.47;
      const spr = this.add.image(0, 0, rare ? 'chest_rare' : 'chest_common')
        .setDepth(6).setOrigin(0.5, 0.6).setScale(baseScale);
      this.placeSprite(spr, pos.x, pos.y);
      const glow = rare
        ? this.add.image(spr.x, spr.y - 4, 'glow').setDepth(spr.depth - 0.12).setBlendMode(Phaser.BlendModes.ADD)
          .setTint(0xffca52).setDisplaySize(42, 42).setAlpha(0.34)
        : undefined;
      this.chests.push({
        x: pos.x, y: pos.y, opened: false, rare, sprite: spr, glow,
        phase: Math.random() * Math.PI * 2, baseScale
      });
    }
  }

  spawnGroundItems(floor: number) {
    const commonKinds: (ItemKind | 'coin')[] = ['coin', 'coin', 'coin', 'potion', 'torch', 'invis', 'dash'];
    const scrollKinds: ItemKind[] = ['stone', 'shieldstone'];
    const n = 4 + Math.floor(Math.random() * 3); // 落ちてるアイテム(4〜6・狭いマップ向け)
    const arenaCells = this.bossRoomCells();
    for (let i = 0; i < n; i++) {
      const pos = randomFloor(this.dungeon, [...this.occupiedPositions(), ...arenaCells]);
      if (!pos) continue;
      const kind = Math.random() < SCROLL_DROP_RATE
        ? scrollKinds[Math.floor(Math.random() * scrollKinds.length)]
        : commonKinds[Math.floor(Math.random() * commonKinds.length)];
      const texKey = kind === 'coin' ? 'coin' : `i_${kind}`;
      const spr = this.add.image(0, 0, texKey).setDepth(5).setOrigin(0.5, 0.6).setDisplaySize(22, 22);
      this.placeSprite(spr, pos.x, pos.y);
      const glow = this.add.image(spr.x, spr.y - 2, 'glow').setDepth(4.6)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(kind === 'coin' ? 0xffc45a : 0x88dfd4)
        .setDisplaySize(28, 28).setAlpha(0.18);
      glow.setDepth(spr.depth - 0.12);
      const value = kind === 'coin' ? 10 + Math.floor(Math.random() * floor * 6) : undefined;
      this.ground.push({ x: pos.x, y: pos.y, kind, sprite: spr, glow, phase: Math.random() * Math.PI * 2, value });
    }
  }

  occupiedPositions(): Vec2[] {
    const arr: Vec2[] = [{ x: this.dungeon.start.x, y: this.dungeon.start.y }, this.dungeon.stairs];
    for (const e of this.enemies) arr.push({ x: e.x, y: e.y });
    for (const c of this.chests) arr.push({ x: c.x, y: c.y });
    for (const g of this.ground) arr.push({ x: g.x, y: g.y });
    for (const obstacle of this.bossObstacles) arr.push({ x: obstacle.x, y: obstacle.y });
    return arr;
  }

  placeSprite(spr: Phaser.GameObjects.Image, x: number, y: number) {
    spr.setPosition(x * TILE + TILE / 2, y * TILE + TILE / 2)
      .setDepth(this.worldDepth(y * TILE + TILE / 2, 12));
  }

  // ============ プレイヤー行動 ============
  async playerAct(dir: Dir) {
    if (this.busy || this.gameEnded) return;

      this.player.dir = dir;
      const [dx, dy] = this.dirVec(dir);
      const nx = this.player.x + dx;
      const ny = this.player.y + dy;

      const obstacle = this.bossObstacleAt(nx, ny);
      if (obstacle) {
        this.busy = true;
        this.setPlayerVisual(dir, 'atk');
        Audio.playSe(weaponAttackSe(this.player.weapon?.weaponType));
        this.destroyBossObstacle(obstacle);
        await this.finishTurn();
        this.setPlayerVisual(dir, 'idle');
        this.busy = false;
        return;
      }

      // 敵がいれば攻撃
      const enemy = this.enemyAt(nx, ny);
      if (enemy) {
        this.busy = true;
        await this.playerAttack(enemy, dir);
        await this.finishTurn();
        this.busy = false;
        return;
      }
      // 弓は向いている方向の3マス先まで、最初の敵へ矢を放つ。
      if (this.player.weapon?.weaponType === 'bow') {
        for (let distance = 2; distance <= 3; distance++) {
          const tx = this.player.x + dx * distance;
          const ty = this.player.y + dy * distance;
          const tile = this.dungeon.tiles[ty]?.[tx];
          if (!tile || !isWalkable(tile) || tile === 'pit') break;
          const rangedEnemy = this.enemyAt(tx, ty);
          if (rangedEnemy) {
            this.busy = true;
            await this.playerAttack(rangedEnemy, dir, true);
            await this.finishTurn();
            this.busy = false;
            return;
          }
        }
      }
      // 宝箱があれば開ける
      const chest = this.chestAt(nx, ny);
      if (chest && !chest.opened) {
        this.busy = true;
        this.setPlayerVisual(dir, 'idle');
        this.openChest(chest);
        await this.finishTurn();
        this.busy = false;
        return;
      }
      // 壁など通行不可 → 向きだけ変える（ターン経過なし）
      const t = this.dungeon.tiles[ny]?.[nx];
      if (t === 'door' && !this.inBossRoom) {
        this.setPlayerVisual(dir, 'idle');
        const isExitDoor = nx === this.dungeon.stairs.x && ny === this.dungeon.stairs.y;
        if (isExitDoor && this.floorHasGate(this.floor) && (!this.dungeon.bossRoom || this.floorBossDefeated)) {
          this.enterBossRoom();
        } else {
          this.log(isExitDoor
            ? '中ボスを倒すまで階段の封印は解けない。'
            : '戦闘中は7×7部屋の入口が封鎖されている。', 'sys');
          Audio.playSe('deny');
        }
        return;
      }
      if (!t || !isWalkable(t) || t === 'pit') {
        this.setPlayerVisual(dir, 'idle');
        if (t === 'pit') { this.log('落とし穴だ。ここには進めない。', 'sys'); Audio.playSe('deny'); }
        if (t === 'door') {
          this.log(this.floorBossDefeated
            ? '出口の封印が解けるまで待とう。'
            : 'ボスを倒すまで出口は開かない。', 'sys');
          Audio.playSe('deny');
        }
        this.emitRefresh();
        return;
      }

      if (this.playerRootTurns > 0) {
        this.busy = true;
        this.log('足を取られて移動できない！', 'dmg');
        this.effectFx(this.player.x, this.player.y, 'fx_hit', 0.9, 220, 0x9ad5b0);
        await this.finishTurn();
        this.busy = false;
        return;
      }

      // 移動（歩行アニメを2フレームでめくって滑らかに）
      this.busy = true;
      Audio.playSe('step');
      const moveDuration = this.currentMoveDuration();
      if (this.holdBoostTier > 0) {
        const trail = this.add.image(
          this.playerSprite.x,
          this.playerSprite.y,
          this.playerSprite.texture.key,
          this.playerSprite.frame.name
        )
          .setDepth(this.playerSprite.depth - 0.08).setScale(this.playerSprite.scaleX, this.playerSprite.scaleY)
          .setFlipX(this.playerSprite.flipX).setAlpha(this.holdBoostTier > 1 ? .38 : .24)
          .setTint(this.holdBoostTier > 1 ? 0xffd77b : 0x58d9d1);
        this.tweens.add({
          targets: trail, alpha: 0, scaleX: trail.scaleX * 1.15, scaleY: trail.scaleY * 1.15,
          duration: 230, ease: 'Quad.easeOut', onComplete: () => trail.destroy()
        });
      }
      this.stepDust(this.playerSprite.x, this.playerSprite.y + 11, this.holdBoostTier);
      this.stepToggle = !this.stepToggle;
      this.stepFrame = (this.stepFrame + 1) % 3;
      const walkFrames = ['walk1', 'walk2', 'walk3'] as const;
      this.setPlayerVisual(dir, walkFrames[this.stepFrame]);
      this.player.x = nx;
      this.player.y = ny;
      // 歩行の途中で反対の足に切り替え
      this.tweens.add({
        targets: this.playerSprite,
        scaleX: 0.9,
        scaleY: 0.79,
        duration: Math.max(28, moveDuration * 0.5),
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
      this.time.delayedCall(moveDuration * 0.5, () => {
        if (this.player.dir === dir) this.setPlayerVisual(dir, walkFrames[(this.stepFrame + 1) % 3]);
      });
      await this.tween(this.playerSprite, {
        x: nx * TILE + TILE / 2, y: ny * TILE + TILE / 2
      }, moveDuration, this.holdBoostTier > 0 ? 'Quad.easeOut' : 'Sine.easeInOut');
      this.setPlayerVisual(dir, 'idle');
      this.onEnterTile(nx, ny);
      const slidOnIce = await this.slidePlayerOnBossIce(dir, moveDuration);
      // 階段を踏んだら確認なしで即降りる（doDescendがbusyを管理）
      if (this.dungeon.tiles[this.player.y]?.[this.player.x] === 'stairs') {
        this.doDescend();
        return;
      }
      // 疾風の羽の効果中：同じ方向へもう1マス駆け抜ける（1歩で2マス）
      if (this.dashSteps > 0 && !this.gameEnded && !slidOnIce) {
        this.dashSteps--;
        const nx2 = nx + dx, ny2 = ny + dy;
        const t2 = this.dungeon.tiles[ny2]?.[nx2];
        if (t2 && isWalkable(t2) && t2 !== 'pit' && !this.enemyAt(nx2, ny2) && !this.chestAt(nx2, ny2)) {
          this.effectFx(this.player.x, this.player.y, 'fx_slash', 1.2, 260, 0x9fe8ff);
          this.player.x = nx2;
          this.player.y = ny2;
          await this.tween(this.playerSprite, {
            x: nx2 * TILE + TILE / 2, y: ny2 * TILE + TILE / 2
          }, moveDuration * 0.55, 'Sine.easeOut');
          this.onEnterTile(nx2, ny2);
          if (this.dungeon.tiles[ny2]?.[nx2] === 'stairs') {
            this.doDescend();
            return;
          }
        }
        if (this.dashSteps === 0) this.log('疾風の羽の効果が切れた。', 'sys');
      }
      await this.finishTurn();
      this.busy = false;
  }

  onEnterTile(x: number, y: number) {
    this.closeBossEntranceOnEntry(x, y);
    const t = this.dungeon.tiles[y][x];
    if (t === 'poison') {
      this.player.poisonTurns = Math.max(this.player.poisonTurns, 3);
      this.log('毒床を踏んだ！ 毒状態になった。', 'dmg');
    } else if (t === 'rune') {
      // 癒しの泉：HPを回復（1回使うと枯れて普通の床になる）
      if (this.player.hp < this.player.hpMax || this.player.poisonTurns > 0) {
        this.player.heal(30);
        this.player.poisonTurns = 0;
        this.log('癒しの泉で回復した。泉は枯れてしまった…', 'item');
        Audio.playSe('heal');
        this.healFx();
        this.dungeon.tiles[y][x] = 'floor';
        const era = getTheme(this.floor).era;
        this.applyTileVisual(this.tileSprites[y][x], 'floor', era, x, y);
      }
    } else if (t === 'water') {
      // 減速なし、演出のみ
    } else if (t === 'cracked') {
      if (Math.random() < 0.2) {
        this.damagePlayer(6, 'ひび割れ床が崩れた！');
      }
    }
    this.applyBossHazardOnEntry(x, y);
    // アイテム拾得
    const gi = this.groundAt(x, y);
    if (gi) this.pickUp(gi);
  }

  async slidePlayerOnBossIce(dir: Dir, moveDuration: number): Promise<boolean> {
    const icy = this.bossHazards.some((hazard) => hazard.kind === 'ice' && hazard.x === this.player.x && hazard.y === this.player.y);
    if (!icy) return false;
    const [dx, dy] = this.dirVec(dir);
    const nx = this.player.x + dx;
    const ny = this.player.y + dy;
    const tile = this.dungeon.tiles[ny]?.[nx];
    if (!tile || !isWalkable(tile) || tile === 'pit' || this.enemyAt(nx, ny) || this.chestAt(nx, ny) || this.bossObstacleAt(nx, ny)) {
      this.log('氷の上で滑ったが、障害物にぶつかった！', 'sys');
      return false;
    }
    this.log('凍結マスで足を取られ、もう1マス滑った！', 'dmg');
    this.player.x = nx;
    this.player.y = ny;
    await this.tween(this.playerSprite, { x: nx * TILE + TILE / 2, y: ny * TILE + TILE / 2 }, moveDuration * 0.58, 'Sine.easeOut');
    this.onEnterTile(nx, ny);
    return true;
  }

  updateStairsHint() {
    // 階段は踏んだら即降りるため、ヒント表示は不要
    this.stairsHint.setVisible(false);
  }

  pickUp(gi: GroundItem) {
    if (gi.kind === 'weapon' && gi.weapon) {
      if (this.receiveWeapon(gi.weapon, 'ボスドロップ')) {
        this.log(`ボス武器 ${weaponFullName(gi.weapon)} を拾った！`, 'special');
      }
      Audio.playSe('pickup');
    } else if (gi.kind === 'shield' && gi.shield) {
      if (this.receiveShield(gi.shield, 'ボスドロップ')) {
        this.log(`ボスドロップ ${shieldFullName(gi.shield)} を拾った！`, 'special');
      }
      Audio.playSe('pickup');
    } else if (gi.kind === 'coin') {
      this.player.gold += gi.value ?? 5;
      this.addScore(Math.floor((gi.value ?? 5) / 2));
      this.log(`コインを拾った (+${gi.value}G)`, 'gold');
      Audio.playSe('coin');
    } else {
      // 同じアイテムは重ねられるので所持上限は緩め
      if (this.player.inventory.length < 60) {
        const it = makeItem(gi.kind as ItemKind);
        this.player.inventory.push(it);
        this.log(`${it.name}を拾った。`, 'item');
        Audio.playSe('pickup');
      } else {
        this.log('持ち物がいっぱいだ。', 'sys');
        Audio.playSe('deny');
        return;
      }
    }
    const pickupColor = gi.kind === 'coin' ? 0xffc45a
      : gi.kind === 'weapon' && gi.weapon ? gradeColor(gi.weapon.grade)
      : gi.kind === 'shield' && gi.shield ? gradeColor(gi.shield.grade)
      : 0x64e7dc;
    this.pickupBurst(gi.sprite.x, gi.sprite.y, pickupColor);
    gi.sprite.destroy();
    gi.glow?.destroy();
    this.ground = this.ground.filter((g) => g !== gi);
  }

  // ============ 戦闘 ============
  attackSide(e: Enemy): 'front' | 'back' | 'side' {
    const [fx, fy] = this.dirVec(e.facing);
    const rx = this.player.x - e.x;
    const ry = this.player.y - e.y;
    if (rx === fx && ry === fy) return 'front';
    if (rx === -fx && ry === -fy) return 'back';
    return 'side';
  }

  playerDamageAgainstGimmick(e: Enemy, baseDamage: number): number {
    let factor = 1;
    const side = this.attackSide(e);
    switch (e.def.gimmick) {
      case 'phase':
        if (e.vulnerableTurns <= 0) factor *= 0.35;
        break;
      case 'wraith_phase':
        if (e.vulnerableTurns <= 0) factor *= 0.12;
        break;
      case 'shell_guard':
        if (side === 'front' && e.guardOpenTurns <= 0) factor *= e.def.key === 'm_bone_hound' ? 0.4 : 0.5;
        break;
      case 'knight_guard':
      case 'golem_guard':
      case 'guardian':
        if (side === 'front' && e.guardOpenTurns <= 0) factor *= 0.5;
        break;
      case 'rear_weak':
        if (side === 'front') factor *= 0.5;
        else if (side === 'back') factor *= 1.5;
        break;
      case 'stance':
        if (e.gimmickPhase === 1) factor *= 0.6;
        break;
      case 'statue':
      case 'ambush':
        if (!e.awakened) factor *= 0.3;
        break;
      case 'stealth':
        factor *= e.stealthRevealed ? 1.5 : 0.65;
        break;
      case 'parry':
        e.gimmickPhase++;
        if (side === 'front' && e.gimmickPhase % 3 === 0) {
          factor *= 0.2;
          const counter = 2 + Math.floor(this.floor / 8);
          this.damagePlayer(counter, `${e.def.name}の受け流し反撃！`, e);
          this.effectFx(this.player.x, this.player.y, 'fx_slash', 1.0, 240, 0xff7548);
        }
        break;
    }
    if (e.revived) factor *= 1.5;
    return Math.max(1, Math.floor(baseDamage * factor));
  }

  afterPlayerHitGimmick(e: Enemy, weaponElement?: Element) {
    if (e.def.gimmick === 'regen') e.gimmickCounter = 0;
    if (e.def.gimmick === 'hydra_regen' && weaponElement === 'fire') {
      e.regenBlockedTurns = 4;
      this.log(`${e.def.name}の再生を火属性で止めた！`, 'special');
    }
    if ((e.def.gimmick === 'mimic' || e.def.gimmick === 'statue' || e.def.gimmick === 'ambush') && !e.awakened) {
      e.awakened = true;
      if (e.def.gimmick === 'mimic') e.sprite.setTexture(e.def.key).setScale(e.baseScale);
      e.sprite.setAlpha(1).clearTint();
      e.shadow?.setAlpha(0.55);
      this.log(`${e.def.name}が攻撃を受けて正体を現した！`, 'dmg');
    }
  }

  async playerAttack(e: Enemy, dir: Dir, ranged = false) {
    if (e.def.isFloorBoss && this.dungeon.bossRoom
      && (!this.isInsideBossRoom(this.player.x, this.player.y) || !this.isInsideBossRoom(e.x, e.y))) {
      this.log('中ボスへの攻撃と技は7×7の専用エリア内でだけ使える。', 'sys');
      Audio.playSe('deny');
      return;
    }
    this.playerAnimToken++;
    this.playerAttacking = true;
    this.playerSprite.setAngle(0).setScale(0.85);
    this.setPlayerVisual(dir, 'atkWindup');
    this.tweens.add({
      targets: this.playerSprite,
      scaleX: 0.79,
      scaleY: 0.91,
      duration: 58,
      ease: 'Quad.easeOut'
    });
    await new Promise<void>((resolve) => this.time.delayedCall(58, () => resolve()));
    this.setPlayerVisual(dir, 'atk');
    this.tweens.add({
      targets: this.playerSprite,
      scaleX: 0.91,
      scaleY: 0.80,
      duration: 72,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
    const weaponElement = this.player.weapon?.element;
    Audio.playSe(weaponAttackSe(this.player.weapon?.weaponType));
    if (weaponElement) {
      this.time.delayedCall(38, () => Audio.playSe(elementAttackSe(weaponElement)));
    }
    // 敵の方向へ踏み込む（前进→戻る）と斬撃エフェクト
    const [ddx, ddy] = this.dirVec(dir);
    const homeX = this.playerSprite.x, homeY = this.playerSprite.y;
    const elementColor = this.player.weapon?.element ? ELEMENT_INFO[this.player.weapon.element].color : 0xdfe7f0;
    if (ranged) {
      const arrow = this.add.image(this.playerSprite.x, this.playerSprite.y, 'fx_bolt')
        .setDepth(20).setTint(elementColor).setScale(0.82);
      arrow.setRotation(Phaser.Math.Angle.Between(this.playerSprite.x, this.playerSprite.y, e.sprite.x, e.sprite.y));
      await new Promise<void>((resolve) => this.tweens.add({
        targets: arrow, x: e.sprite.x, y: e.sprite.y, duration: 180, ease: 'Quad.easeIn',
        onComplete: () => { arrow.destroy(); resolve(); }
      }));
      this.effectFx(e.x, e.y, 'fx_magic', 1.0, 220, elementColor);
    } else {
      this.slashFx(e.x, e.y, elementColor);
    }
    if (this.weaponSprite?.visible) {
      this.tweens.add({
        targets: this.weaponSprite,
        angle: this.weaponSprite.angle + (dir === 'left' || dir === 'up' ? -115 : 115),
        duration: ANIM * 0.45,
        yoyo: true,
        ease: 'Cubic.easeOut'
      });
    }
    if (!ranged) {
      await new Promise<void>((resolve) => {
        this.tweens.add({
          targets: this.playerSprite,
          x: homeX + ddx * 10, y: homeY + ddy * 10,
          duration: ANIM * 0.45, yoyo: true, ease: 'Quad.easeOut',
          onComplete: () => { this.playerSprite.x = homeX; this.playerSprite.y = homeY; resolve(); }
        });
      });
    }

    const res = computePlayerAttack(this.player, e.def, !ranged && dir === e.facing);
    const attackingWeapon = this.player.weapon;
    let knockbackReady = false;
    if (attackingWeapon?.passive?.key === 'knockback') {
      attackingWeapon.specialCounter = (attackingWeapon.specialCounter ?? 0) + 1;
      knockbackReady = attackingWeapon.specialCounter % 3 === 0;
    }
    const dealtDamage = this.playerDamageAgainstGimmick(e, res.damage);
    e.hp -= dealtDamage;
    this.afterPlayerHitGimmick(e, weaponElement);
    this.discovered.add(e.def.key);
    Audio.playSe('hit');

    // 二刀流：2撃目の斬撃を少し遅らせて重ねる
    if (res.hits >= 2) {
      this.time.delayedCall(130, () => {
        this.slashFx(e.x, e.y, elementColor);
        Audio.playSe('hit');
      });
    }

    let msg = `${res.hits >= 2 ? '二連撃！ ' : ''}${e.def.name}に${dealtDamage}ダメージ`;
    if (res.crit) msg += '（会心！）';
    this.log(msg, res.crit ? 'special' : 'dmg');
    this.hitFx(e.x, e.y);
    this.flashSprite(e.sprite);

    if (knockbackReady && e.hp > 0) {
      const pushed = await this.knockbackEnemy(e, ddx, ddy);
      this.log(
        pushed ? `三撃破砕！ ${e.def.name}を1マス押し戻した！` : `三撃破砕！ ${e.def.name}は壁際で踏みとどまった！`,
        'special'
      );
    }

    if (res.drain > 0) { this.player.heal(res.drain); this.log(`HPを${res.drain}吸収した。`, 'special'); }
    if (res.poison) { e.poisonTurns = 3; this.log(`${e.def.name}に毒を与えた。`, 'special'); this.poisonFx(e.x, e.y); }
    if (res.freeze) this.freezeEnemy(e, 2);
    if (res.weaponRevived) this.log('武器のリペア効果が発動！ 壊れずに復活した。', 'special');
    if (res.weaponBroke) {
      // 壊れた武器はその場で消滅し、持っている別の武器に持ち替える
      const bw = this.player.weapon!;
      this.log(`${bw.name}は壊れて消滅した…`, 'dmg');
      Audio.playSe('break');
      this.player.weapons = this.player.weapons.filter((x) => x !== bw);
      this.player.weapon = this.player.weapons[0] ?? null;
      if (this.player.weapon?.dual && this.player.shield) {
        this.player.shield = null;
        this.log('二刀流のため盾を外した。（両手がふさがる）', 'sys');
      }
      this.updatePlayerAura();
    }

    this.playerAttacking = false;
    this.tweens.killTweensOf(this.playerSprite);
    this.playerSprite.setAngle(0).setScale(0.85);
    this.setPlayerVisual(dir, 'idle');

    if (e.hp <= 0 && e.def.gimmick === 'revive' && !e.revived) {
      e.revived = true;
      e.hp = Math.max(1, Math.floor(e.hpMax * 0.25));
      e.sprite.setTint(0xc7eaff);
      this.effectFx(e.x, e.y, 'fx_levelup', 1.6, 520, 0xc7eaff);
      this.log(`${e.def.name}が骨を組み直して復活した！ 防御が崩れている。`, 'special');
      this.drawEnemyHp(e);
    } else if (e.hp <= 0) {
      this.killEnemy(e, res.killScoreBonus);
    } else {
      this.drawEnemyHp(e);
    }
    this.emitRefresh();
  }

  killEnemy(e: Enemy, scoreBonus: number) {
    const def = e.def;
    const leveled = this.player.addExp(def.exp);
    this.player.gold += def.gold;
    this.addScore(def.score + scoreBonus + (def.isElite ? 60 : 0) + (def.isBoss ? 0 : 0));
    this.log(`${def.name}を倒した！ EXP+${def.exp} G+${def.gold}`, 'gold');
    Audio.playSe('kill');
    if (leveled) { this.log(`レベルアップ！ Lv.${this.player.level} になった。`, 'special'); Audio.playSe('levelup'); this.levelupFx(); }
    if (def.isTreasureRabbit) {
      const ssElemental = WEAPON_DEFS.filter((weapon) => weapon.ss && weapon.element);
      const rewardDef = ssElemental[Math.floor(Math.random() * ssElemental.length)];
      if (rewardDef) {
        const reward = makeWeapon(rewardDef.key, []);
        reward.plus = Math.max(3, reward.plus);
        this.dropEquipment(e.x, e.y, 'weapon', reward);
        this.log(`福袋が弾けた！ 1000Gと属性付きSS武器 ${weaponFullName(reward)} を獲得！`, 'special');
      }
    } else {
      // 通常敵からは消耗品と素材を落とす。
      if (def.key === 'm_snake' && Math.random() < 0.7) this.dropItem(e.x, e.y, 'oldkey');
      // ゴールドは高確率で多めに
      if (Math.random() < 0.7) this.dropItem(e.x, e.y, 'coin', def.gold * 3 + Math.floor(Math.random() * this.floor * 4));
      // 通常消耗品とは別枠で抽選する。
      if (Math.random() < 0.4) {
        const pool: ItemKind[] = ['potion', 'torch', 'warp', 'invis'];
        this.dropItem(e.x, e.y, pool[Math.floor(Math.random() * pool.length)]);
      }
      // 強化スクロールは通常敵・エリート・ボス共通で1/3。
      if (Math.random() < SCROLL_DROP_RATE) {
        const scrollPool: ItemKind[] = ['stone', 'shieldstone'];
        this.dropItem(e.x, e.y, scrollPool[Math.floor(Math.random() * scrollPool.length)]);
      }
      // エリート/ボスは超レアで復活の種。
      if ((def.isElite || def.isBoss) && !this.reviveSeedSeen && Math.random() < 0.08) {
        this.reviveSeedSeen = true;
        this.dropItem(e.x, e.y, 'revive');
        this.log('復活のタネがこぼれ落ちた…！ この冒険で現れるのは一度だけだ。', 'special');
      }
    }

    this.enemyDefeatFx(e);
    const bossState = this.bossStates.get(e);
    if (bossState) {
      for (const marker of bossState.intent?.markers ?? []) {
        this.destroyBossWarningMarker(marker);
      }
      this.bossStates.delete(e);
    }
    this.destroyEnemyFreezeFx(e);
    if (e.aura) { this.tweens.killTweensOf(e.aura); e.aura.destroy(); }
    e.sprite.destroy();
    e.hpBar?.destroy();
    e.shadow?.destroy();
    this.enemies = this.enemies.filter((x) => x !== e);
    this.resolveMonsterDeathGimmick(e);

    if (def.isFloorBoss) {
      this.unlockFloorGate(def.name, { x: e.x, y: e.y });
    }
  }

  freezeEnemy(e: Enemy, turns: number) {
    e.freezeTurns = Math.max(e.freezeTurns, turns);
    this.destroyEnemyFreezeFx(e);

    const crystal = this.add.graphics();
    crystal.fillStyle(0x5bdcff, 0.32);
    crystal.lineStyle(2, 0xcaffff, 0.92);
    const shell = [
      new Phaser.Geom.Point(-15, 10), new Phaser.Geom.Point(-12, -10),
      new Phaser.Geom.Point(-5, -19), new Phaser.Geom.Point(2, -15),
      new Phaser.Geom.Point(10, -20), new Phaser.Geom.Point(15, -7),
      new Phaser.Geom.Point(14, 13), new Phaser.Geom.Point(4, 18),
      new Phaser.Geom.Point(-8, 16)
    ];
    crystal.fillPoints(shell, true).strokePoints(shell, true);
    crystal.fillStyle(0xd9fbff, 0.65)
      .fillTriangle(-13, 9, -8, -16, -3, 13)
      .fillTriangle(2, 15, 8, -18, 13, 10);
    crystal.lineStyle(1.5, 0xffffff, 0.72)
      .lineBetween(-8, -8, 7, 10)
      .lineBetween(6, -13, -3, 14);

    const snow = this.add.text(0, -5, '❄', {
      fontFamily: 'Arial', fontSize: '19px', color: '#ffffff',
      stroke: '#2188a8', strokeThickness: 3
    }).setOrigin(0.5);
    const label = this.add.text(0, -27, String(e.freezeTurns), {
      fontFamily: 'Arial Black', fontSize: '14px', color: '#eaffff',
      stroke: '#075272', strokeThickness: 4, fontStyle: 'bold'
    }).setName('freeze-turn').setOrigin(0.5);
    const fx = this.add.container(e.sprite.x, e.sprite.y - 3, [crystal, snow, label])
      .setDepth(e.sprite.depth + 0.35);
    e.freezeFx = fx;
    e.sprite.setTint(0x9beeff);
    this.time.delayedCall(105, () => {
      if (e.alive && e.freezeTurns > 0 && e.sprite.active) e.sprite.setTint(0x9beeff);
    });
    this.tweens.add({ targets: crystal, alpha: 0.58, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: snow, angle: 90, scale: 1.15, duration: 780, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.pickupBurst(e.sprite.x, e.sprite.y - 4, 0x9ceeff, 10);
    this.log(`${e.def.name}が氷像になった！ 2ターン行動不能。`, 'special');
  }

  updateEnemyFreezeFx(e: Enemy) {
    const label = e.freezeFx?.getByName('freeze-turn') as Phaser.GameObjects.Text | null;
    label?.setText(String(Math.max(0, e.freezeTurns)));
  }

  destroyEnemyFreezeFx(e: Enemy) {
    if (!e.freezeFx) return;
    for (const child of e.freezeFx.getAll()) this.tweens.killTweensOf(child);
    e.freezeFx.destroy(true);
    e.freezeFx = undefined;
    if (e.def.bossTint !== undefined) e.sprite.setTint(e.def.bossTint);
    else e.sprite.clearTint();
  }

  unlockFloorGate(bossName: string, defeatedAt?: Vec2) {
    if (this.floorBossDefeated) return;
    const remaining = this.enemies.filter((e) => e.def.isFloorBoss);
    if (remaining.length > 0) {
      this.log(`${bossName}を撃破！ あと${remaining.length}体のボスが封印を支えている。`, 'special');
      return;
    }
    this.floorBossDefeated = true;
    Audio.playSe('seal');
    this.setBossEntranceClosed(false);
    this.dropBossRewards(defeatedAt);
    this.log(this.inBossRoom
      ? `${bossName}を撃破！ 報酬がその場にドロップし、出口の封印が解けた。`
      : this.floorHasGate(this.floor)
        ? `${bossName}を撃破！ 報酬がその場にドロップし、7×7部屋内の強ボス扉が開いた。`
        : `${bossName}を撃破！ 報酬がその場にドロップし、7×7部屋内に階段が現れた。`, 'special');
    this.updateVisibility();
    this.emitRefresh();
  }

  resolveMonsterDeathGimmick(e: Enemy) {
    const dist = Math.abs(this.player.x - e.x) + Math.abs(this.player.y - e.y);
    if (e.def.gimmick === 'lantern') {
      this.shroomTurns = Math.max(this.shroomTurns, 5);
      this.updateVisibility();
      this.effectFx(e.x, e.y, 'fx_magic', 1.4, 420, 0xffc95a);
      this.log('ランタンの光で5ターンの間、視界が広がった。', 'special');
    }
    if ((e.def.gimmick === 'shatter' || e.def.gimmick === 'death_burst') && dist <= 1) {
      const fiery = e.def.gimmick === 'death_burst';
      this.damagePlayer((fiery ? 5 : 3) + Math.floor(this.floor / 10), fiery ? '迷い火の爆発！' : '砕けた氷片が飛び散った！', e);
      this.effectFx(e.x, e.y, 'fx_magic', 1.5, 360, fiery ? 0xff8b42 : 0x8de9ff);
    }
    if (e.def.gimmick === 'split' && e.cloneDepth === 0) {
      const spots = Phaser.Utils.Array.Shuffle([
        { x: e.x + 1, y: e.y }, { x: e.x - 1, y: e.y },
        { x: e.x, y: e.y + 1 }, { x: e.x, y: e.y - 1 }
      ]);
      let spawned = 0;
      for (const spot of spots) {
        if (spawned >= 2 || !this.validMonsterTile(spot.x, spot.y)) continue;
        if (this.enemyAt(spot.x, spot.y) || this.player.x === spot.x && this.player.y === spot.y
          || this.chestAt(spot.x, spot.y) || this.bossObstacleAt(spot.x, spot.y)) continue;
        const fragmentDef: MonsterDef = {
          ...e.def,
          name: 'ミニゼリー',
          hp: Math.max(4, Math.floor(e.def.hp * 0.35)),
          atkMin: Math.max(1, Math.floor(e.def.atkMin * 0.65)),
          atkMax: Math.max(2, Math.floor(e.def.atkMax * 0.65)),
          exp: Math.max(1, Math.floor(e.def.exp * 0.2)),
          gold: 0,
          score: Math.max(1, Math.floor(e.def.score * 0.2))
        };
        const fragment = this.addEnemy(fragmentDef, spot.x, spot.y, 1);
        fragment.cloneDepth = 1;
        fragment.baseScale *= 0.72;
        fragment.sprite.setScale(fragment.baseScale);
        spawned++;
      }
      if (spawned > 0) this.log('ゼリークラウンが小型ゼリーへ分裂した！', 'dmg');
    }
  }

  async knockbackEnemy(e: Enemy, dx: number, dy: number): Promise<boolean> {
    const nx = e.x + dx;
    const ny = e.y + dy;
    if (!this.passable(e, nx, ny)) return false;
    e.x = nx;
    e.y = ny;
    this.effectFx(nx, ny, 'fx_hit', 1.35, 260, 0xffd477);
    await this.tween(e.sprite, { x: nx * TILE + TILE / 2, y: ny * TILE + TILE / 2 }, 130, 'Back.easeOut');
    this.drawEnemyHp(e);
    return true;
  }

  dropBossRewards(defeatedAt?: Vec2) {
    const room = this.dungeon.bossRoom;
    const origin = defeatedAt ?? (room ? { x: room.cx, y: room.cy } : { ...this.dungeon.stairs });

    // 5階刻みの強ボス／超ボスは、従来の宝箱と同等の武器を直接落とす。
    if (this.inBossRoom && this.floor % 5 === 0) {
      const grade: EquipmentGrade = this.floor >= 25 ? 'S'
        : this.floor >= 15 ? 'A'
        : this.floor >= 10 ? 'B'
        : 'C';
      const weapon = rollWeaponByGrade(grade);
      weapon.plus = Math.max(weapon.plus, Math.min(3, Math.floor(this.floor / 10)));
      this.dropEquipment(origin.x, origin.y, 'weapon', weapon);
      this.weaponWonThisFloor = true;
    }

    const rewardRoll = Math.random();
    if (!this.reviveSeedSeen && rewardRoll < 0.06) {
      this.reviveSeedSeen = true;
      this.dropItem(origin.x, origin.y, 'revive');
    } else if (rewardRoll < 0.28) {
      this.dropEquipment(origin.x, origin.y, 'shield', rollShield(this.floor));
    } else if (rewardRoll < 0.55) {
      this.dropItem(origin.x, origin.y, 'stone');
      this.dropItem(origin.x, origin.y, 'shieldstone');
    } else if (rewardRoll < 0.78) {
      this.dropItem(origin.x, origin.y, 'potion');
      this.dropItem(origin.x, origin.y, Math.random() < 0.5 ? 'invis' : 'dash');
    } else {
      const kinds: ItemKind[] = ['potion', 'warp', 'torch', 'stone', 'shieldstone', 'invis', 'dash'];
      this.dropItem(origin.x, origin.y, kinds[Math.floor(Math.random() * kinds.length)]);
      this.dropItem(origin.x, origin.y, kinds[Math.floor(Math.random() * kinds.length)]);
    }
    this.dropItem(origin.x, origin.y, 'coin', 80 + this.floor * 18 + Math.floor(Math.random() * 80));

    if (this.inBossRoom || (this.dungeon.bossRoom && !this.floorHasGate(this.floor))) {
      this.bossRewardClaimed = true;
      const { x, y } = this.dungeon.stairs;
      this.dungeon.tiles[y][x] = 'stairs';
      const sprite = this.tileSprites[y]?.[x];
      if (sprite) this.applyTileVisual(sprite, 'stairs', getTheme(this.floor).era, x, y);
      this.effectFx(x, y, 'fx_magic', 2.0, 760, 0x54ff92);
    } else if (this.dungeon.bossRoom && this.floorHasGate(this.floor)) {
      this.bossRewardClaimed = true;
      const { x, y } = this.dungeon.stairs;
      this.effectFx(x, y, 'fx_magic', 2.0, 760, 0xffd36b);
    }
  }

  findGroundDropPosition(x: number, y: number): Vec2 | null {
    for (let radius = 0; radius <= 4; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const tx = x + dx, ty = y + dy;
          const tile = this.dungeon.tiles[ty]?.[tx];
          if (!tile || !isWalkable(tile) || tile === 'pit') continue;
          if (this.groundAt(tx, ty) || this.chestAt(tx, ty) || this.enemyAt(tx, ty)) continue;
          if (this.bossObstacleAt(tx, ty) || (this.player.x === tx && this.player.y === ty)) continue;
          return { x: tx, y: ty };
        }
      }
    }
    return null;
  }

  dropEquipment(x: number, y: number, kind: 'weapon', equipment: Weapon): void;
  dropEquipment(x: number, y: number, kind: 'shield', equipment: Shield): void;
  dropEquipment(x: number, y: number, kind: 'weapon' | 'shield', equipment: Weapon | Shield) {
    const pos = this.findGroundDropPosition(x, y);
    if (!pos) {
      if (kind === 'weapon') this.receiveWeapon(equipment as Weapon, 'ボスドロップ');
      else this.receiveShield(equipment as Shield, 'ボスドロップ');
      this.log('落とせる床がないため、ボス装備を自動回収した。', 'special');
      return;
    }
    const sprite = this.add.image(0, 0, equipment.key).setDepth(5).setOrigin(0.5, 0.6).setDisplaySize(24, 24);
    this.placeSprite(sprite, pos.x, pos.y);
    sprite.setVisible(this.isTileCurrentlyVisible(pos.x, pos.y));
    const glow = this.add.image(sprite.x, sprite.y - 2, 'glow').setDepth(4.6)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(gradeColor(equipment.grade))
      .setDisplaySize(34, 34).setAlpha(0.32).setVisible(sprite.visible);
    glow.setDepth(sprite.depth - 0.12);
    this.ground.push({
      x: pos.x, y: pos.y, kind, sprite, glow, phase: Math.random() * Math.PI * 2,
      weapon: kind === 'weapon' ? equipment as Weapon : undefined,
      shield: kind === 'shield' ? equipment as Shield : undefined
    });
  }

  dropItem(x: number, y: number, kind: ItemKind | 'coin', value?: number) {
    const pos = this.findGroundDropPosition(x, y);
    if (!pos) {
      this.collectDropDirectly(kind, value);
      return;
    }
    const { x: tx, y: ty } = pos;
    const texKey = kind === 'coin' ? 'coin' : `i_${kind}`;
    const spr = this.add.image(0, 0, texKey).setDepth(5).setOrigin(0.5, 0.6).setDisplaySize(22, 22);
    this.placeSprite(spr, tx, ty);
    spr.setVisible(this.isTileCurrentlyVisible(tx, ty));
    const glow = this.add.image(spr.x, spr.y - 2, 'glow').setDepth(4.6)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(kind === 'coin' ? 0xffc45a : 0x88dfd4)
      .setDisplaySize(28, 28).setAlpha(0.18)
      .setVisible(spr.visible);
    glow.setDepth(spr.depth - 0.12);
    this.ground.push({ x: tx, y: ty, kind, sprite: spr, glow, phase: Math.random() * Math.PI * 2, value });
  }

  collectDropDirectly(kind: ItemKind | 'coin', value?: number) {
    if (kind === 'coin') {
      const gold = value ?? 5;
      this.player.gold += gold;
      this.addScore(Math.floor(gold / 2));
      this.log(`届かない場所のコインを自動回収した (+${gold}G)`, 'gold');
      Audio.playSe('coin');
      return;
    }
    if (this.player.inventory.length >= 60) {
      this.log(`${ITEM_DEFS[kind]?.name ?? kind}は持ち物がいっぱいで回収できなかった。`, 'sys');
      return;
    }
    const item = makeItem(kind);
    this.player.inventory.push(item);
    this.log(`届かない場所の${item.name}を自動回収した。`, 'item');
    Audio.playSe('pickup');
  }

  damagePlayer(dmg: number, reason: string, attacker?: Enemy) {
    const shieldResult = this.resolveShieldDefense(dmg, attacker);
    dmg = shieldResult.damage;

    if (shieldResult.message) this.log(shieldResult.message, 'special');
    if (dmg > 0) {
      this.player.hp -= dmg;
      this.floorDamaged = true;
      if (reason) this.log(`${reason} ${dmg}ダメージ！`, 'dmg');
      Audio.playSe('hurt');
      this.cameras.main.shake(120, 0.008);
      this.playPlayerHurt();
    } else {
      this.effectFx(this.player.x, this.player.y, 'fx_magic', 1.5, 380, 0xbfefff);
      Audio.playSe('hit');
    }

    if (shieldResult.heal > 0 && this.player.hp > 0) {
      this.player.heal(shieldResult.heal);
      this.log(`聖域再生でHPを${shieldResult.heal}回復した。`, 'special');
      this.effectFx(this.player.x, this.player.y, 'fx_heal', 1.4, 420);
    }

    if (shieldResult.reflect > 0 && attacker?.alive) {
      attacker.hp -= shieldResult.reflect;
      this.log(`反射棘が${attacker.def.name}へ${shieldResult.reflect}ダメージを返した！`, 'special');
      this.hitFx(attacker.x, attacker.y);
      if (attacker.hp <= 0) this.killEnemy(attacker, 0);
      else this.drawEnemyHp(attacker);
    }

    if (this.player.hp <= 0) this.handlePlayerDown();
  }

  resolveShieldDefense(damage: number, attacker?: Enemy): { damage: number; heal: number; reflect: number; message?: string } {
    const shield = this.player.shield;
    if (!shield || !attacker || !shield.passive) return { damage, heal: 0, reflect: 0 };

    const passive = shield.passive;
    let adjusted = damage;
    let heal = 0;
    let reflect = 0;
    let message: string | undefined;

    if (passive.key === 'brace' && damage >= 10) {
      adjusted = Math.max(1, Math.floor(damage * 0.8));
      message = `${shield.name}の踏ん張りでダメージを軽減！`;
    } else if (passive.key === 'mirror' && Math.random() < 0.15) {
      adjusted = 0;
      message = `${shield.name}が攻撃を映し、完全に無効化！`;
    } else if (passive.key === 'thorns') {
      reflect = Math.max(1, Math.floor(damage * 0.25));
    } else if (passive.key === 'perfect_guard') {
      shield.guardCounter = (shield.guardCounter ?? 0) + 1;
      if (shield.guardCounter % 5 === 0) {
        adjusted = 0;
        message = `${shield.name}の時止め防御！ 5回目の攻撃を完全に無効化！`;
      }
    } else if (passive.key === 'recovery') {
      shield.guardCounter = (shield.guardCounter ?? 0) + 1;
      if (shield.guardCounter % 4 === 0) heal = 6;
    }

    return { damage: adjusted, heal, reflect, message };
  }

  handlePlayerDown() {
    // 復活のタネ所持で自動復活
    const idx = this.player.inventory.findIndex((i) => i.kind === 'revive');
    if (idx >= 0) {
      this.player.inventory.splice(idx, 1);
      this.player.hp = Math.floor(this.player.hpMax * 0.6);
      this.log('復活のタネが芽吹いた！ HPが回復して復活した。', 'special');
      return;
    }
    this.gameOver(false);
  }

  playPlayerHurt() {
    if (!this.playerSprite || this.gameEnded) return;
    const token = ++this.playerAnimToken;
    const sprite = this.playerSprite;
    const homeX = sprite.x;
    this.tweens.killTweensOf(sprite);
    sprite.setAngle(0).setScale(0.85);
    this.setPlayerVisual(this.player.dir, 'hurt');
    sprite.setTintFill(0xfff0ec);
    this.tweens.add({
      targets: sprite,
      x: homeX + (this.player.dir === 'left' ? 3 : this.player.dir === 'right' ? -3 : 2),
      angle: this.player.dir === 'left' ? 7 : -7,
      scaleX: 0.91,
      scaleY: 0.77,
      duration: 58,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        sprite.x = homeX;
        sprite.setAngle(0).setScale(0.85).clearTint();
        if (token === this.playerAnimToken && !this.gameEnded && !this.playerAttacking) {
          this.setPlayerVisual(this.player.dir, 'idle');
        }
      }
    });
  }

  playPlayerDeath() {
    const token = ++this.playerAnimToken;
    const sprite = this.playerSprite;
    this.tweens.killTweensOf(sprite);
    sprite.clearTint().setAngle(0).setScale(0.85);
    this.setPlayerVisual(this.player.dir, 'hurt');
    this.tweens.add({
      targets: sprite,
      scaleX: 0.93,
      scaleY: 0.72,
      angle: this.player.dir === 'left' ? -6 : 6,
      duration: 130,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (token !== this.playerAnimToken) return;
        this.setPlayerVisual(this.player.dir, 'down');
        sprite.setAngle(0).setScale(0.85);
        this.tweens.add({ targets: sprite, y: sprite.y + 2, duration: 100, ease: 'Sine.easeOut' });
      }
    });
  }

  // ============ 敵ターン ============
  async finishTurn() {
    this.turn++;
    this.floorTurn++;

    // 毒ダメージ
    if (this.player.poisonTurns > 0) {
      this.player.poisonTurns--;
      this.damagePlayer(3, '毒に侵されている！');
      if (this.gameEnded) return;
    }
    if (this.shroomTurns > 0) this.shroomTurns--;
    if (this.torchTurns > 0) {
      this.torchTurns--;
      if (this.torchTurns === 0) this.log('松明の火が消え、視界が元に戻った。', 'sys');
    }
    // 透明化の残りターンを進める
    if (this.invisTurns > 0) {
      this.invisTurns--;
      if (this.invisTurns === 0) {
        this.log('透明化が解けた。敵に見えるようになった！', 'sys');
        this.playerSprite.setAlpha(1);
        this.weaponSprite?.setAlpha(1);
      }
    }

    this.applyLongStay();

    this.tickBossMechanics();
    if (this.gameEnded) return;

    await this.enemyTurn();

    if (this.gameEnded) return;

    this.updateVisibility();
    this.updateStairsHint();
    this.emitRefresh();
  }

  applyLongStay() {
    const f = this.floorTurn;
    if (f >= 100 && !this.penaltyFlags.p100) { this.penaltyFlags.p100 = true; this.log('空気が重くなってきた…（長居注意）', 'sys'); }
    if (f >= 150 && !this.penaltyFlags.p150) { this.penaltyFlags.p150 = true; this.log('敵の気配が増している！', 'dmg'); }
    if (f >= 200 && !this.penaltyFlags.p200) {
      this.penaltyFlags.p200 = true;
      this.log('強敵が姿を現した！', 'dmg');
      this.spawnWanderer(true);
    }
    // 150以降、20ターンごとに敵追加（HPが減るペナルティは無し）
    if (f >= 150 && f % 20 === 0) this.spawnWanderer(false);
  }

  spawnWanderer(elite: boolean) {
    const pool = MONSTER_DEFS.filter((m) =>
      m.minFloor <= this.floor && this.floor <= m.maxFloor && !m.isBoss && !m.isTreasureRabbit
      && (elite ? m.isElite : true)
    );
    const usePool = pool.length ? pool : MONSTER_DEFS.filter((m) => !m.isBoss && !m.isTreasureRabbit);
    const def = usePool[Math.floor(Math.random() * usePool.length)];
    const pos = randomFloor(this.dungeon, this.occupiedPositions());
    if (!pos || this.distToPlayer(pos.x, pos.y) < 5) return;
    this.addEnemy(def, pos.x, pos.y, 1 + this.floor * 0.05);
  }

  healEnemyFromGimmick(e: Enemy, amount: number, label?: string) {
    if (amount <= 0 || e.hp >= e.hpMax) return;
    const healed = Math.min(amount, e.hpMax - e.hp);
    e.hp += healed;
    this.drawEnemyHp(e);
    this.effectFx(e.x, e.y, 'fx_heal', 0.85, 260, 0x75e89a);
    if (label) this.log(`${e.def.name}${label}${healed}回復した。`, 'special');
  }

  summonGimmickMonsters(e: Enemy, key: string, count: number) {
    const base = MONSTER_DEFS.find((monster) => monster.key === key);
    if (!base) return;
    const spots = Phaser.Utils.Array.Shuffle([
      { x: e.x + 1, y: e.y }, { x: e.x - 1, y: e.y },
      { x: e.x, y: e.y + 1 }, { x: e.x, y: e.y - 1 }
    ]);
    let spawned = 0;
    for (const spot of spots) {
      if (spawned >= count || !this.validMonsterTile(spot.x, spot.y)) continue;
      if (this.enemyAt(spot.x, spot.y) || this.bossObstacleAt(spot.x, spot.y)
        || this.player.x === spot.x && this.player.y === spot.y) continue;
      const minionDef: MonsterDef = {
        ...base,
        name: `${base.name}（召喚）`,
        hp: Math.max(8, Math.floor(base.hp * 0.65)),
        exp: Math.max(1, Math.floor(base.exp * 0.4)),
        gold: Math.max(0, Math.floor(base.gold * 0.25)),
        score: Math.max(1, Math.floor(base.score * 0.4))
      };
      const minion = this.addEnemy(minionDef, spot.x, spot.y, 1);
      minion.cloneDepth = 1;
      this.effectFx(spot.x, spot.y, 'fx_magic', 1.1, 320, e.def.color);
      spawned++;
    }
  }

  nearbyGimmickDestination(e: Enemy): Vec2 | null {
    const candidates = Phaser.Utils.Array.Shuffle([
      { x: this.player.x + 1, y: this.player.y }, { x: this.player.x - 1, y: this.player.y },
      { x: this.player.x, y: this.player.y + 1 }, { x: this.player.x, y: this.player.y - 1 }
    ]);
    return candidates.find((spot) => this.passable(e, spot.x, spot.y)) ?? null;
  }

  resolveMonsterCharge(e: Enemy, maxSteps: number, factor: number, label: string): Promise<void> | undefined {
    const dir = e.chargeDir;
    if (!dir) return undefined;
    let end = { x: e.x, y: e.y };
    let hit = false;
    for (let step = 0; step < maxSteps; step++) {
      const nx = end.x + dir.x;
      const ny = end.y + dir.y;
      if (nx === this.player.x && ny === this.player.y) {
        this.damagePlayerFromBoss(e, factor, label);
        hit = true;
        break;
      }
      if (!this.passable(e, nx, ny)) break;
      end = { x: nx, y: ny };
    }
    e.charging = false;
    e.chargeDir = null;
    e.sprite.clearTint();
    if (end.x === e.x && end.y === e.y && !hit) {
      e.stunnedTurns = Math.max(e.stunnedTurns, 1);
      this.log(`${e.def.name}は壁際で体勢を崩した！`, 'special');
      return undefined;
    }
    e.x = end.x;
    e.y = end.y;
    e.animating = true;
    return this.tween(e.sprite, { x: end.x * TILE + TILE / 2, y: end.y * TILE + TILE / 2 }, 170, 'Cubic.easeIn').then(() => {
      e.animating = false;
      this.effectFx(e.x, e.y, 'fx_hit', 1.3, 300, e.def.color);
    });
  }

  handleMonsterGimmickTurn(e: Enemy): { handled: boolean; animation?: Promise<void> } {
    if (e.def.isFloorBoss) return { handled: false };
    if (e.vulnerableTurns > 0) {
      e.vulnerableTurns--;
      if (e.vulnerableTurns === 0) {
        if (e.def.gimmick === 'phase') e.sprite.setAlpha(0.68);
        if (e.def.gimmick === 'wraith_phase') e.sprite.setAlpha(0.42);
      }
    }
    if (e.guardOpenTurns > 0) e.guardOpenTurns--;
    if (e.regenBlockedTurns > 0) e.regenBlockedTurns--;
    if (e.stunnedTurns > 0) {
      e.stunnedTurns--;
      this.log(`${e.def.name}は体勢を崩して動けない。`, 'special');
      return { handled: true };
    }

    const dx = this.player.x - e.x;
    const dy = this.player.y - e.y;
    const dist = Math.abs(dx) + Math.abs(dy);
    e.gimmickCounter++;

    if (e.def.gimmick === 'stance') e.gimmickPhase = (e.gimmickPhase + 1) % 2;
    if (e.def.gimmick === 'regen' && e.gimmickCounter % 3 === 0) {
      this.healEnemyFromGimmick(e, Math.max(1, Math.floor(e.hpMax * 0.06)), 'が苔の力で');
    }
    if (e.def.gimmick === 'hydra_regen' && e.regenBlockedTurns <= 0) {
      this.healEnemyFromGimmick(e, Math.max(1, Math.floor(e.hpMax * 0.03)));
    }
    if (e.def.gimmick === 'heat_aura' && dist === 1) {
      this.damagePlayer(2 + Math.floor(this.floor / 10), `${e.def.name}の熱気！`, e);
    }

    if ((e.def.gimmick === 'statue' || e.def.gimmick === 'mimic' || e.def.gimmick === 'ambush') && !e.awakened) {
      if (dist > 2) return { handled: true };
      e.awakened = true;
      if (e.def.gimmick === 'mimic') e.sprite.setTexture(e.def.key).setScale(e.baseScale).setAlpha(1);
      else e.sprite.setAlpha(1).clearTint();
      e.shadow?.setAlpha(0.55);
      this.effectFx(e.x, e.y, 'fx_magic', 1.1, 300, e.def.color);
      this.log(`${e.def.name}が正体を現した！`, 'dmg');
      return { handled: true };
    }

    if (e.def.gimmick === 'burrow') {
      if (e.charging) {
        e.charging = false;
        const destination = this.nearbyGimmickDestination(e);
        if (destination) this.teleportBoss(e, destination);
        e.sprite.setAlpha(1);
        e.shadow?.setAlpha(0.55);
        this.log(`${e.def.name}が地中から飛び出した！`, 'dmg');
        return { handled: true };
      }
      if (e.gimmickCounter % 3 === 0) {
        e.charging = true;
        e.sprite.setAlpha(0.05);
        e.shadow?.setAlpha(0.03);
        this.log(`${e.def.name}が地中へ潜った。`, 'sys');
        return { handled: true };
      }
    }

    if (e.def.gimmick === 'warp' && e.gimmickCounter % 4 === 0) {
      const destination = this.nearbyGimmickDestination(e);
      if (destination) {
        this.teleportBoss(e, destination);
        this.log(`${e.def.name}が空間を越えて接近した！`, 'dmg');
        return { handled: true };
      }
    }

    if (e.def.gimmick === 'summon' && !e.summoned && e.hp <= e.hpMax * 0.5) {
      e.summoned = true;
      this.summonGimmickMonsters(e, 'm_horn_demon', 1);
      this.log(`${e.def.name}が双角デーモンを召喚した！`, 'dmg');
      return { handled: true };
    }
    if (e.def.gimmick === 'necromancy' && !e.summoned && e.hp <= e.hpMax * 0.5) {
      e.summoned = true;
      this.summonGimmickMonsters(e, 'm_grave_crawler', 2);
      this.log(`${e.def.name}が墓這いを呼び起こした！`, 'dmg');
      return { handled: true };
    }

    if (e.def.gimmick === 'root' && dist <= 2 && e.gimmickCounter % 3 === 0) {
      this.playerRootTurns = Math.max(this.playerRootTurns, 1);
      this.effectFx(this.player.x, this.player.y, 'fx_poison', 1.0, 280, 0x6fc66e);
      this.log(`${e.def.name}の根が足に絡みついた！`, 'dmg');
      return { handled: true };
    }

    if (e.def.gimmick === 'pull' && dist >= 2 && dist <= 4 && (dx === 0 || dy === 0)
      && this.lineOfSight(e.x, e.y, this.player.x, this.player.y)) {
      const destination = { x: this.player.x - Math.sign(dx), y: this.player.y - Math.sign(dy) };
      const tile = this.dungeon.tiles[destination.y]?.[destination.x];
      if (tile && isWalkable(tile) && tile !== 'pit' && !this.enemyAt(destination.x, destination.y)
        && !this.chestAt(destination.x, destination.y) && !this.bossObstacleAt(destination.x, destination.y)) {
        this.player.x = destination.x;
        this.player.y = destination.y;
        this.log(`${e.def.name}の鎖に引き寄せられた！`, 'dmg');
        const animation = this.tween(this.playerSprite, {
          x: destination.x * TILE + TILE / 2, y: destination.y * TILE + TILE / 2
        }, 150, 'Cubic.easeIn').then(() => this.onEnterTile(destination.x, destination.y));
        return { handled: true, animation };
      }
    }

    if (e.def.gimmick === 'rush' && dist >= 2 && dist <= 5 && (dx === 0 || dy === 0)) {
      const step = { x: Math.sign(dx), y: Math.sign(dy) };
      let destination = { x: e.x, y: e.y };
      for (let i = 0; i < Math.min(2, dist - 1); i++) {
        const next = { x: destination.x + step.x, y: destination.y + step.y };
        if (!this.passable(e, next.x, next.y)) break;
        destination = next;
      }
      if (destination.x !== e.x || destination.y !== e.y) {
        e.x = destination.x;
        e.y = destination.y;
        this.log(`${e.def.name}が一直線に駆け寄った！`, 'dmg');
        return { handled: true, animation: this.animateEnemyMove(e, destination) };
      }
    }

    const chargeLike = e.def.gimmick === 'charge' || e.def.gimmick === 'bull_charge';
    if (chargeLike && e.charging) {
      return {
        handled: true,
        animation: this.resolveMonsterCharge(e, e.def.gimmick === 'bull_charge' ? 5 : 3, 1.2, `${e.def.name}の突進！`)
      };
    }
    if (chargeLike && dist >= 2 && dist <= 6 && (dx === 0 || dy === 0)
      && this.lineOfSight(e.x, e.y, this.player.x, this.player.y)) {
      e.charging = true;
      e.chargeDir = { x: Math.sign(dx), y: Math.sign(dy) };
      e.sprite.setTint(0xffd05a);
      this.effectFx(e.x, e.y, 'fx_levelup', 0.85, 280, 0xffd05a);
      this.log(`${e.def.name}が突進の構え！ 横へ避けろ。`, 'dmg');
      return { handled: true };
    }

    const laserLike = e.def.gimmick === 'laser_lock' || e.def.gimmick === 'core_laser';
    if (laserLike && e.charging) {
      const sameLine = e.def.gimmick === 'core_laser'
        ? (this.player.x === e.x || this.player.y === e.y)
        : (e.chargeDir?.x === 0 ? this.player.x === e.x : this.player.y === e.y);
      if (sameLine && this.lineOfSight(e.x, e.y, this.player.x, this.player.y)) {
        this.damagePlayerFromBoss(e, e.def.gimmick === 'core_laser' ? 1.35 : 1.05, `${e.def.name}の照準レーザー！`);
        this.effectFx(this.player.x, this.player.y, 'fx_bolt', 1.5, 360, 0xff4fc8);
      }
      e.charging = false;
      e.chargeDir = null;
      e.sprite.clearTint();
      return { handled: true };
    }
    if (laserLike && dist <= 6 && (dx === 0 || dy === 0)
      && this.lineOfSight(e.x, e.y, this.player.x, this.player.y)) {
      e.charging = true;
      e.chargeDir = { x: Math.sign(dx), y: Math.sign(dy) };
      e.sprite.setTint(0xff4fc8);
      this.log(`${e.def.name}が射線を固定した！ 次のターンにレーザーが来る。`, 'dmg');
      return { handled: true };
    }

    return { handled: false };
  }

  async enemyTurn() {
    const anims: Promise<void>[] = [];
    for (const e of this.enemies) {
      if (!e.alive) continue;
      // 3歩目に現れた闇忍者は、プレイヤーが1回行動したら再び闇へ溶ける。
      if (e.def.isDarkNinja && e.stealthRevealed) {
        e.stealthRevealed = false;
        e.sprite.setAlpha(0.08);
        e.shadow?.setAlpha(0.08);
        e.hpBar?.setAlpha(0.08);
      }
      if (e.def.isFloorBoss && this.dungeon.bossRoom && !this.isInsideBossRoom(this.player.x, this.player.y)) continue;
      // 状態異常
      if (e.freezeTurns > 0) {
        e.freezeTurns--;
        this.updateEnemyFreezeFx(e);
        this.effectFx(e.x, e.y, 'fx_magic', 1.05, 260, 0x9deeff);
        if (e.freezeTurns <= 0) this.destroyEnemyFreezeFx(e);
        continue;
      }
      if (e.sealTurns > 0) { e.sealTurns--; continue; }
      if (e.poisonTurns > 0) {
        e.poisonTurns--;
        e.hp -= 2;
        if (e.hp <= 0) { this.killEnemy(e, 0); continue; }
        this.drawEnemyHp(e);
      }
      const bossTurn = this.handleBossTurn(e);
      if (bossTurn.handled) {
        if (bossTurn.animation) anims.push(bossTurn.animation);
        continue;
      }
      const gimmickTurn = this.handleMonsterGimmickTurn(e);
      if (gimmickTurn.handled) {
        if (gimmickTurn.animation) anims.push(gimmickTurn.animation);
        continue;
      }
      // slow：2ターンに1回
      if (e.def.behavior === 'slow') {
        e.slowToggle = !e.slowToggle;
        if (!e.slowToggle) continue;
      }
      const p = this.enemyAct(e);
      if (p) anims.push(p);
    }
    await Promise.all(anims);
  }

  enemyAct(e: Enemy): Promise<void> | null {
    if (e.def.isFloorBoss && this.dungeon.bossRoom && !this.isInsideBossRoom(this.player.x, this.player.y)) return null;
    const dxp = this.player.x - e.x;
    const dyp = this.player.y - e.y;
    const dist = Math.abs(dxp) + Math.abs(dyp);
    // 透明化中は敵から完全に見えない（攻撃されず追跡もされない）
    const unseen = this.invisTurns > 0;

    // 福袋うさぎは一切攻撃せず、毎ターンできるだけプレイヤーから離れる。
    if (e.def.isTreasureRabbit) {
      const escape = this.stepAway(e, this.player.x, this.player.y);
      if (!escape) return null;
      const moveDx = escape.x - e.x;
      const moveDy = escape.y - e.y;
      if (Math.abs(moveDx) > Math.abs(moveDy)) e.facing = moveDx > 0 ? 'right' : 'left';
      else if (moveDy !== 0) e.facing = moveDy > 0 ? 'down' : 'up';
      e.x = escape.x;
      e.y = escape.y;
      return this.animateEnemyMove(e, escape);
    }
    if (this.playerRootTurns > 0) this.playerRootTurns--;
    if (this.itemSealTurns > 0) this.itemSealTurns--;

    // 隣接なら攻撃
    if (dist === 1 && !unseen) {
      return this.enemyAttack(e);
    }

    // 遠距離攻撃
    if (!unseen && e.def.ranged && (dxp === 0 || dyp === 0) && dist <= 5) {
      if (this.lineOfSight(e.x, e.y, this.player.x, this.player.y)) {
        return this.enemyRanged(e);
      }
    }

    // 行動パターンによる移動
    let mv: Vec2 | null = null;
    const aggro = !unseen && dist <= 9;
    switch (e.def.behavior) {
      case 'chase':
      case 'slow':
      case 'ranged':
        mv = aggro ? this.stepToward(e, this.player.x, this.player.y) : this.stepRandom(e);
        break;
      case 'random':
        mv = this.stepRandom(e);
        break;
      case 'loop':
        mv = this.stepLoop(e);
        break;
      case 'line':
        mv = this.stepLine(e);
        break;
    }
    if (mv) {
      const from = { x: e.x, y: e.y };
      const moveDx = mv.x - e.x;
      const moveDy = mv.y - e.y;
      if (Math.abs(moveDx) > Math.abs(moveDy)) e.facing = moveDx > 0 ? 'right' : 'left';
      else if (moveDy !== 0) e.facing = moveDy > 0 ? 'down' : 'up';
      e.x = mv.x;
      e.y = mv.y;
      e.moveSteps++;
      this.afterEnemyMoved(e, from);
      return this.animateEnemyMove(e, mv);
    }
    return null;
  }

  animateEnemyMove(e: Enemy, mv: Vec2): Promise<void> {
    e.animating = true;
    if (e.def.isDarkNinja) {
      e.stealthRevealed = e.moveSteps % 3 === 0;
      e.sprite.setAlpha(e.stealthRevealed ? 1 : 0.08);
      e.shadow?.setAlpha(e.stealthRevealed ? 0.55 : 0.08);
      if (e.stealthRevealed) this.effectFx(mv.x, mv.y, 'fx_magic', 0.8, 220, 0x9e55ff);
    }
    const targetX = mv.x * TILE + TILE / 2;
    const targetY = mv.y * TILE + TILE / 2;
    const flying = !!e.def.wallPass || /drake|dragon|wyrm|wyvern|moth|fiend|lich/.test(e.def.key);
    const rushing = /hound|cerberus|crawler/.test(e.def.key);
    const lean = Math.sign(targetX - e.sprite.x) * (flying ? -2 : -4);
    e.sprite.setAngle(lean);
    if (!flying) this.stepDust(e.sprite.x, e.sprite.y + 10, 0, rushing ? 3 : 2, 0x516b68);
    this.tweens.add({
      targets: e.sprite,
      scaleX: e.baseScale * (rushing ? 1.14 : 1.08),
      scaleY: e.baseScale * (flying ? 1.04 : 0.9),
      duration: this.currentTurnAnimDuration(ANIM * 0.5),
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
    const baseDuration = rushing ? ANIM * 0.76 : e.def.behavior === 'slow' ? ANIM * 1.14 : ANIM;
    const duration = this.currentTurnAnimDuration(baseDuration);
    return this.tween(e.sprite, { x: targetX, y: targetY }, duration, flying ? 'Sine.easeOut' : 'Sine.easeInOut').then(() => {
      e.animating = false;
      e.sprite.setScale(e.baseScale).setAngle(0);
    });
  }

  afterEnemyMoved(e: Enemy, from: Vec2) {
    if (e.moveSteps % 3 !== 0) return;
    switch (e.def.gimmick) {
      case 'vine_trail':
        this.addBossHazards([from], 'slow', 4, false);
        this.log(`${e.def.name}が床にツタを残した。`, 'sys');
        break;
      case 'web_trail':
        this.addBossHazards([from], 'web', 5, false);
        this.log(`${e.def.name}が粘着糸を張った。`, 'sys');
        break;
      case 'ice_trail':
        this.addBossHazards([from], 'ice', 4, false);
        break;
      case 'storm_trail':
        this.addBossHazards([from], 'lightning', 3, false);
        break;
    }
  }

  enemyAttackProfile(e: Enemy): { element: Element; factor: number; label: string } {
    let element = monsterElement(e.def);
    let factor = 1;
    let label = '';
    if (e.def.gimmick === 'element_cycle') {
      const cycle: Element[] = ['fire', 'ice', 'thunder'];
      element = cycle[e.gimmickPhase % cycle.length];
      e.gimmickPhase++;
      label = `${ELEMENT_INFO[element].name}変換・`;
    }
    if (['fire_breath', 'heat', 'multi_bite', 'starfall'].includes(e.def.gimmick ?? '')) {
      e.gimmickPhase++;
      if (e.gimmickPhase % 3 === 0) {
        factor *= e.def.gimmick === 'multi_bite' ? 1.55 : 1.4;
        label = e.def.gimmick === 'fire_breath' ? '火炎ブレス・'
          : e.def.gimmick === 'heat' ? '過熱攻撃・'
          : e.def.gimmick === 'multi_bite' ? '三首連撃・'
          : '星弾・';
      }
    }
    if (e.def.gimmick === 'enrage' && e.hp <= e.hpMax * 0.5) {
      factor *= 1.35;
      label = '怒り・';
    }
    if (e.def.gimmick === 'execute' && this.player.hp <= this.player.hpMax * 0.3) {
      factor *= 1.65;
      label = '処刑斬り・';
    }
    if (e.def.gimmick === 'stance' && e.gimmickPhase === 0) {
      factor *= 1.25;
      label = '攻撃姿勢・';
    }
    return { element, factor, label };
  }

  afterEnemyHitGimmick(e: Enemy, damage: number, ranged: boolean) {
    if (e.def.gimmick === 'mud_bind') {
      this.playerRootTurns = Math.max(this.playerRootTurns, 1);
      this.log('泥が足に絡み、次の移動が止まる！', 'dmg');
    }
    if (e.def.gimmick === 'freeze_shot' && Math.random() < 0.35) {
      this.playerRootTurns = Math.max(this.playerRootTurns, 1);
      this.log('氷弾で足が凍りついた！', 'dmg');
    }
    if (e.def.gimmick === 'item_seal' && Math.random() < 0.5) {
      this.itemSealTurns = Math.max(this.itemSealTurns, 2);
      this.log('仮面の呪いでアイテムを2ターン封じられた！', 'dmg');
    }
    if (e.def.gimmick === 'vampire') {
      this.healEnemyFromGimmick(e, Math.max(1, Math.floor(damage * 0.35)), 'が血を吸って');
    }
    if (e.def.gimmick === 'phase' || e.def.gimmick === 'wraith_phase') {
      e.vulnerableTurns = 2;
      e.sprite.setAlpha(1);
      this.log(`${e.def.name}が攻撃直後に実体化した！`, 'special');
    }
    if (['shell_guard', 'knight_guard', 'golem_guard', 'guardian'].includes(e.def.gimmick ?? '')) {
      e.guardOpenTurns = 2;
      this.log(`${e.def.name}の守りが一時的に開いた！`, 'special');
    }
    if (e.def.gimmick === 'sidestep' && ranged) {
      const options = Phaser.Utils.Array.Shuffle([
        { x: e.x + 1, y: e.y }, { x: e.x - 1, y: e.y },
        { x: e.x, y: e.y + 1 }, { x: e.x, y: e.y - 1 }
      ]).filter((spot) => this.passable(e, spot.x, spot.y));
      const destination = options[0];
      if (destination) {
        e.x = destination.x;
        e.y = destination.y;
        this.tween(e.sprite, {
          x: destination.x * TILE + TILE / 2, y: destination.y * TILE + TILE / 2
        }, 120, 'Sine.easeOut');
      }
    }
  }

  enemyAttack(e: Enemy): Promise<void> {
    const profile = this.enemyAttackProfile(e);
    const res = computeEnemyAttack(this.player, e.def, profile.element);
    const damage = Math.max(1, Math.floor(res.damage * profile.factor));
    const enemyElement = profile.element;
    const enemyElementInfo = ELEMENT_INFO[enemyElement];
    e.animating = true;
    // 攻撃演出：少し前進
    const ox = e.sprite.x, oy = e.sprite.y;
    const px = this.playerSprite.x, py = this.playerSprite.y;
    this.tweens.add({
      targets: e.sprite,
      scaleX: e.baseScale * 1.16,
      scaleY: e.baseScale * 0.84,
      duration: this.currentTurnAnimDuration(ANIM / 2),
      yoyo: true,
      ease: 'Back.easeInOut'
    });
    return new Promise((resolve) => {
      this.tweens.add({
        targets: e.sprite, x: (ox + px) / 2, y: (oy + py) / 2,
        duration: this.currentTurnAnimDuration(ANIM / 2), yoyo: true,
        onComplete: () => {
          e.animating = false;
          e.sprite.setScale(e.baseScale).setAngle(0);
          Audio.playSe(elementAttackSe(enemyElement));
          this.damagePlayer(damage, `${e.def.name}の${profile.label}${enemyElementInfo.name}属性攻撃！`, e);
          this.afterEnemyHitGimmick(e, damage, false);
          this.effectFx(this.player.x, this.player.y, 'fx_magic', 1.4, 360, enemyElementInfo.color);
          this.hitFx(this.player.x, this.player.y);
          this.cameras.main.shake(90, 0.004);
          if (res.shieldBroke) {
            // 壊れた盾はその場で消滅し、持っている別の盾に持ち替える
            const bs = this.player.shield!;
            this.log(`${bs.name}は壊れて砕け散った！`, 'dmg');
            Audio.playSe('break');
            this.player.shields = this.player.shields.filter((x) => x !== bs);
            this.player.shield = this.player.shields[0] ?? null;
          }
          this.flashSprite(this.playerSprite);
          resolve();
        }
      });
    });
  }

  enemyRanged(e: Enemy): Promise<void> {
    e.animating = true;
    const profile = this.enemyAttackProfile(e);
    const enemyElement = profile.element;
    const enemyElementInfo = ELEMENT_INFO[enemyElement];
    Audio.playSe(elementAttackSe(enemyElement));
    this.effectFx(e.x, e.y, 'fx_magic', 2.0, 600, enemyElementInfo.color);
    this.tweens.add({
      targets: e.sprite,
      scaleX: e.baseScale * 0.9,
      scaleY: e.baseScale * 1.12,
      duration: this.currentTurnAnimDuration(90),
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
    return new Promise((resolve) => {
      const bolt = this.add.image(e.sprite.x, e.sprite.y, 'fx_bolt').setDepth(20).setTint(enemyElementInfo.color);
      this.tweens.add({
        targets: bolt, x: this.playerSprite.x, y: this.playerSprite.y,
        duration: this.currentTurnAnimDuration(180),
        onComplete: () => {
          e.animating = false;
          e.sprite.setScale(e.baseScale);
          bolt.destroy();
          const res = computeEnemyAttack(this.player, e.def, profile.element);
          const damage = Math.max(1, Math.floor(res.damage * profile.factor));
          this.damagePlayer(damage, `${e.def.name}の${profile.label}${enemyElementInfo.name}属性遠距離攻撃！`, e);
          this.afterEnemyHitGimmick(e, damage, true);
          if (res.shieldBroke) this.handleShieldBreak();
          this.effectFx(this.player.x, this.player.y, 'fx_magic', 1.45, 360, enemyElementInfo.color);
          resolve();
        }
      });
    });
  }

  // ============ 敵移動ヘルパー ============
  passable(e: Enemy, x: number, y: number): boolean {
    const t = this.dungeon.tiles[y]?.[x];
    if (!t) return false;
    if (e.def.isFloorBoss && this.dungeon.bossRoom && !this.isInsideBossRoom(x, y)) return false;
    if (t === 'wall' && !e.def.wallPass) return false;
    if (t === 'pit') return false;
    if (this.enemyAt(x, y, e)) return false;
    if (this.player.x === x && this.player.y === y) return false;
    if (this.chestAt(x, y)) return false;
    if (this.bossObstacleAt(x, y)) return false;
    return true;
  }

  stepToward(e: Enemy, tx: number, ty: number): Vec2 | null {
    const dx = Math.sign(tx - e.x);
    const dy = Math.sign(ty - e.y);
    const opts: Vec2[] = [];
    if (Math.abs(tx - e.x) >= Math.abs(ty - e.y)) {
      if (dx) opts.push({ x: e.x + dx, y: e.y });
      if (dy) opts.push({ x: e.x, y: e.y + dy });
    } else {
      if (dy) opts.push({ x: e.x, y: e.y + dy });
      if (dx) opts.push({ x: e.x + dx, y: e.y });
    }
    for (const o of opts) if (this.passable(e, o.x, o.y)) return o;
    return null;
  }

  stepAway(e: Enemy, tx: number, ty: number): Vec2 | null {
    const dirs = Phaser.Utils.Array.Shuffle([
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
    ]);
    const choices = dirs
      .map((dir) => ({ x: e.x + dir.x, y: e.y + dir.y }))
      .filter((pos) => this.passable(e, pos.x, pos.y))
      .sort((a, b) => {
        const da = Math.abs(a.x - tx) + Math.abs(a.y - ty);
        const db = Math.abs(b.x - tx) + Math.abs(b.y - ty);
        return db - da;
      });
    return choices[0] ?? null;
  }

  stepRandom(e: Enemy): Vec2 | null {
    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    Phaser.Utils.Array.Shuffle(dirs);
    for (const d of dirs) {
      const nx = e.x + d.x, ny = e.y + d.y;
      if (this.passable(e, nx, ny)) return { x: nx, y: ny };
    }
    return null;
  }

  stepLoop(e: Enemy): Vec2 | null {
    const dirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
    for (let i = 0; i < 4; i++) {
      const d = dirs[(e.loopDir + i) % 4];
      const nx = e.x + d.x, ny = e.y + d.y;
      if (this.passable(e, nx, ny)) { e.loopDir = (e.loopDir + i) % 4; return { x: nx, y: ny }; }
    }
    return null;
  }

  stepLine(e: Enemy): Vec2 | null {
    if (!e.lineDir) e.lineDir = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }][Math.floor(Math.random() * 4)];
    let nx = e.x + e.lineDir.x, ny = e.y + e.lineDir.y;
    if (this.passable(e, nx, ny)) return { x: nx, y: ny };
    // 壁に当たったら方向転換
    e.lineDir = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }][Math.floor(Math.random() * 4)];
    nx = e.x + e.lineDir.x; ny = e.y + e.lineDir.y;
    if (this.passable(e, nx, ny)) return { x: nx, y: ny };
    return null;
  }

  lineOfSight(x0: number, y0: number, x1: number, y1: number): boolean {
    // 直線上に壁がないか（水平/垂直のみ）
    if (x0 === x1) {
      const step = Math.sign(y1 - y0);
      for (let y = y0 + step; y !== y1; y += step) if (this.dungeon.tiles[y][x0] === 'wall') return false;
      return true;
    }
    if (y0 === y1) {
      const step = Math.sign(x1 - x0);
      for (let x = x0 + step; x !== x1; x += step) if (this.dungeon.tiles[y0][x] === 'wall') return false;
      return true;
    }
    return false;
  }

  // ============ 可視範囲 ============
  blocksVisionAt(x: number, y: number) {
    const tile = this.dungeon.tiles[y]?.[x];
    return !tile || tile === 'wall' || tile === 'door';
  }

  hasVisionLine(x0: number, y0: number, x1: number, y1: number) {
    if (x0 === x1 && y0 === y1) return true;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const stepX = Math.sign(x1 - x0);
    const stepY = Math.sign(y1 - y0);
    let x = x0;
    let y = y0;
    let movedX = 0;
    let movedY = 0;

    // Supercover式で視線が触れる全マスをたどる。壁そのものは見えるが、その先は通さない。
    while (movedX < dx || movedY < dy) {
      const decision = (1 + 2 * movedX) * dy - (1 + 2 * movedY) * dx;
      if (decision === 0) {
        // 壁角のすき間から斜め奥が漏れて見える「角抜け」も遮断する。
        const nextIsTarget = x + stepX === x1 && y + stepY === y1;
        const targetIsWall = nextIsTarget && this.blocksVisionAt(x1, y1);
        if (!targetIsWall && (this.blocksVisionAt(x + stepX, y) || this.blocksVisionAt(x, y + stepY))) return false;
        x += stepX;
        y += stepY;
        movedX++;
        movedY++;
      } else if (decision < 0) {
        x += stepX;
        movedX++;
      } else {
        y += stepY;
        movedY++;
      }
      if (x === x1 && y === y1) return true;
      if (this.blocksVisionAt(x, y)) return false;
    }
    return true;
  }

  updateVisibility() {
    const d = this.dungeon;
    const torchRadius = this.torchTurns > 0 ? this.lightRadius * 2 : this.lightRadius;
    const shroomRadius = this.shroomTurns > 0 ? 7 : this.lightRadius;
    const radius = Math.max(this.lightRadius, torchRadius, shroomRadius);
    const bossRoomConcealed = !!d.bossRoom && !!d.bossEntry
      && !this.isInsideBossRoom(this.player.x, this.player.y);
    const isConcealedBossCell = (x: number, y: number) => bossRoomConcealed && !!d.bossRoom
      && x >= d.bossRoom.x && x < d.bossRoom.x + d.bossRoom.w
      && y >= d.bossRoom.y && y < d.bossRoom.y + d.bossRoom.h;
    const visible: boolean[][] = [];
    for (let y = 0; y < d.h; y++) {
      visible[y] = [];
      for (let x = 0; x < d.w; x++) visible[y][x] = false;
    }

    for (let y = 0; y < d.h; y++) {
      for (let x = 0; x < d.w; x++) {
        const cheb = Math.max(Math.abs(x - this.player.x), Math.abs(y - this.player.y));
        let vis = cheb <= radius && this.hasVisionLine(this.player.x, this.player.y, x, y);
        const insideConcealedRoom = isConcealedBossCell(x, y);
        const isEntryDoor = !!d.bossEntry && x === d.bossEntry.x && y === d.bossEntry.y;
        if (insideConcealedRoom && !isEntryDoor) vis = false;
        if (vis) {
          visible[y][x] = true;
          this.explored[y][x] = true;
        }
      }
    }

    // 視界内の床に接する最初の壁面は表示する。壁の先の床へは視界を伝播させない。
    for (let y = 0; y < d.h; y++) {
      for (let x = 0; x < d.w; x++) {
        if (!visible[y][x] || this.blocksVisionAt(x, y)) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const wallX = x + dx;
            const wallY = y + dy;
            const wallTile = d.tiles[wallY]?.[wallX];
            if (wallTile !== 'wall' && wallTile !== 'door') continue;
            const isEntryDoor = !!d.bossEntry && wallX === d.bossEntry.x && wallY === d.bossEntry.y;
            if (isConcealedBossCell(wallX, wallY) && !isEntryDoor) continue;
            visible[wallY][wallX] = true;
            this.explored[wallY][wallX] = true;
          }
        }
      }
    }
    this.visibleTiles = visible;

    // 現在の視界外は、探索済みであっても完全に隠す。
    for (let y = 0; y < d.h; y++) {
      for (let x = 0; x < d.w; x++) {
        const spr = this.tileSprites[y][x];
        const isWall = d.tiles[y][x] === 'wall';
        const room = d.bossRoom;
        const isBossRoomFloor = !!room && x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h;
        const visionState = visible[y][x] ? 'visible' : 'hidden';
        const previousState = spr.getData('visionState') as string | undefined;
        if (previousState !== visionState) {
          this.tweens.killTweensOf(spr);
          spr.setData('visionState', visionState);
        }
        if (visible[y][x]) {
          spr.setVisible(true);
          spr.setTint(isWall ? WALL_VISIBLE_TINT : isBossRoomFloor ? BOSS_ROOM_FLOOR_TINT : this.themeTileTint);
          if (previousState !== 'visible') {
            spr.setAlpha(.16);
            this.tweens.add({ targets: spr, alpha: 1, duration: 260, ease: 'Quad.easeOut' });
          } else spr.setAlpha(1);
        } else {
          spr.setVisible(false);
        }
      }
    }
    for (const facade of this.wallFacades) {
      const active = !!visible[facade.y]?.[facade.x];
      facade.sprite.setVisible(active);
      if (active) facade.sprite.setTint(WALL_VISIBLE_TINT).setAlpha(1);
    }
    if (d.bossRoom) {
      let roomFullyVisible = true;
      for (let y = d.bossRoom.y; y < d.bossRoom.y + d.bossRoom.h && roomFullyVisible; y++) {
        for (let x = d.bossRoom.x; x < d.bossRoom.x + d.bossRoom.w; x++) {
          if (!visible[y]?.[x]) { roomFullyVisible = false; break; }
        }
      }
      this.bossFloorDecor?.setVisible(roomFullyVisible);
      this.bossRoomBackdrop?.setVisible(roomFullyVisible).setAlpha(roomFullyVisible ? 1 : 0).clearTint();
      for (const sprite of this.bossRoomDecorSprites) {
        const tileX = Math.floor(sprite.x / TILE);
        const tileY = Math.floor(sprite.y / TILE);
        const active = !!visible[tileY]?.[tileX];
        sprite.setVisible(active).setAlpha(active ? 1 : 0);
      }
    }
    // 敵・宝箱・アイテム表示
    for (const e of this.enemies) {
      const concealedMidBoss = bossRoomConcealed && e.def.isFloorBoss && this.isInsideBossRoom(e.x, e.y);
      const v = !concealedMidBoss && !!visible[e.y]?.[e.x];
      e.sprite.setVisible(v);
      e.shadow?.setVisible(v);
      e.aura?.setVisible(v);
      e.freezeFx?.setVisible(v);
      if (e.hpBar) e.hpBar.setVisible(v).setAlpha(1);
      if (e.def.isDarkNinja) {
        e.sprite.setAlpha(v ? (e.stealthRevealed ? 1 : .08) : 0);
        e.shadow?.setAlpha(v ? (e.stealthRevealed ? .55 : .08) : 0);
        if (e.hpBar) e.hpBar.setAlpha(e.stealthRevealed ? 1 : 0.08);
      } else e.sprite.setAlpha(v ? 1 : 0);
    }
    for (const c of this.chests) {
      const v = !!visible[c.y]?.[c.x];
      c.sprite.setVisible(v).setAlpha(v ? 1 : 0);
      c.glow?.setVisible(v);
    }
    for (const g of this.ground) {
      const v = !!visible[g.y]?.[g.x];
      g.sprite.setVisible(v).setAlpha(v ? 1 : 0);
      g.glow?.setVisible(v);
    }
    for (const m of this.ambientMotes) m.sprite.setVisible(!!visible[m.y]?.[m.x]);
    for (const state of this.bossStates.values()) {
      for (const marker of state.intent?.markers ?? []) {
        const v = !!visible[marker.y]?.[marker.x];
        marker.plate.setVisible(v);
        marker.label.setVisible(v);
      }
    }
    for (const hazard of this.bossHazards) hazard.sprite.setVisible(!!visible[hazard.y]?.[hazard.x]);
    for (const obstacle of this.bossObstacles) {
      const v = !!visible[obstacle.y]?.[obstacle.x];
      obstacle.sprite.setVisible(v).setAlpha(v ? 1 : 0);
    }
  }

  isTileCurrentlyVisible(x: number, y: number) {
    return !!this.visibleTiles[y]?.[x];
  }

  // ============ 宝箱 ============
  openChest(c: Chest) {
    c.opened = true;
    c.sprite.setTexture(c.rare ? 'chest_rare_open' : 'chest_common_open');
    c.sprite.clearTint();
    c.glow?.setAlpha(c.rare ? 0.46 : 0.18);
    this.tweens.add({
      targets: c.sprite,
      scaleX: c.baseScale * 1.2,
      scaleY: c.baseScale * 0.82,
      duration: 110,
      yoyo: true,
      ease: 'Back.easeOut'
    });
    const chestColor = c.rare ? 0xffcf52 : 0xcbd0d6;
    this.pickupBurst(c.sprite.x, c.sprite.y - 4, chestColor, c.rare ? 9 : 6);
    this.addScore(c.rare ? 120 : 40);
    Audio.playSe('chest');

    if (c.rare) {
      // 金の宝箱：レア確定＋大量ゴールド
      this.log('★金の宝箱だ！ レアなお宝が眠っている！', 'special');
      // 武器はガチャ限定。金の宝箱は上位素材・盾・復活アイテムを抽選する。
      const rr = Math.random();
      if (rr < 0.15 && !this.reviveSeedSeen) {
        this.reviveSeedSeen = true;
        this.player.inventory.push(makeItem('revive'));
        this.log('超レア！ この冒険で一度だけの復活のタネが入っていた！', 'special');
      } else if (rr < 0.32) {
        this.player.inventory.push(makeItem('stone'), makeItem('stone'));
        this.log('レア！ 武器強化スクロール×2が入っていた！', 'special');
      } else if (rr < 0.55) {
        const s = rollShield(Math.max(8, this.floor));
        if (this.receiveShield(s, '金の宝箱')) this.log(`さらに「${s.name}」も入っていた！`, 'item');
      } else {
        this.player.inventory.push(makeItem('stone'));
        this.player.inventory.push(makeItem('shieldstone'));
        this.log('武器強化スクロール＋防具強化スクロールも入っていた！', 'item');
      }
      // 大量ゴールド
      const gold = 80 + Math.floor(Math.random() * this.floor * 20);
      this.player.gold += gold;
      this.addScore(gold);
      this.log(`さらに${gold}Gを入手！`, 'gold');
      this.effectFx(c.x, c.y, 'fx_levelup', 2.0, 700);
    } else {
      // 通常宝箱から武器は出ない。消耗品・盾・ゴールドのみ。
      const roll = Math.random();
      if (roll < 0.6) {
        const eq = Math.random();
        if (this.floor >= 8 && eq < 0.35) {
          const s = rollShield(this.floor);
          if (this.receiveShield(s, '宝箱')) this.log(`宝箱から「${s.name}」を発見！`, 'item');
        } else {
          const scrollKinds: ItemKind[] = ['stone', 'shieldstone'];
          const consumableKinds: ItemKind[] = ['potion', 'torch', 'warp', 'invis'];
          const pool = Math.random() < SCROLL_DROP_RATE ? scrollKinds : consumableKinds;
          const k = pool[Math.floor(Math.random() * pool.length)];
          this.player.inventory.push(makeItem(k));
          this.log(`宝箱から「${makeItem(k).name}」を入手。`, 'item');
        }
      } else {
        const gold = 40 + Math.floor(Math.random() * this.floor * 12);
        this.player.gold += gold;
        this.addScore(Math.floor(gold / 2));
        this.log(`宝箱から${gold}Gを入手！`, 'gold');
      }
    }
    this.emitRefresh();
  }

  // ============ アイテム使用（UIから呼ばれる）============
  useItem(index: number) {
    if (this.busy || this.gameEnded) return;
    if (this.itemSealTurns > 0) {
      this.log(`仮面の呪いでアイテムを使えない！ 残り${this.itemSealTurns}ターン`, 'dmg');
      Audio.playSe('deny');
      return;
    }
    const item = this.player.inventory[index];
    if (!item) return;
    let consumed = true;
    let passTurn = true;

    switch (item.kind) {
      case 'potion': this.player.heal(40); this.log('回復ポーションでHPを40回復した。', 'item'); Audio.playSe('heal'); this.healFx(); break;
      case 'stone': consumed = this.useStone(); passTurn = false; break;
      case 'shieldstone': consumed = this.useShieldStone(); passTurn = false; break;
      case 'shroom': this.shroomTurns = 12; this.log('光るキノコで周囲が明るくなった。', 'item'); Audio.playSe('pickup'); passTurn = false; break;
      case 'torch': {
        this.torchTurns = 10;
        this.effectFx(this.player.x, this.player.y, 'fx_magic', 1.45, 460, 0xffa52f);
        this.log('松明に火を灯した！ 10ターンの間、視界が通常の2倍になる。', 'item');
        Audio.playSe('pickup');
        passTurn = false;
        break;
      }
      case 'bomb': this.useBomb(); break;
      case 'warp': this.useWarp(); passTurn = false; break;
      case 'seal': this.useSeal(); break;
      case 'revive': this.log('復活のタネは倒れた時に自動で使われる。', 'sys'); Audio.playSe('deny'); consumed = false; passTurn = false; break;
      case 'oldkey': case 'floorkey': this.log('近くに対応する扉がない。', 'sys'); Audio.playSe('deny'); consumed = false; passTurn = false; break;
      case 'invis': {
        // 20ターンの間、敵から完全に見えなくなる
        this.invisTurns = 20;
        this.playerSprite.setAlpha(0.4);
        this.weaponSprite?.setAlpha(0.4);
        this.effectFx(this.player.x, this.player.y, 'fx_magic', 1.6, 500, 0x9fe8ff);
        Audio.playSe('warp');
        this.log('透明ポーションで姿を消した！ 20ターンの間、敵に見つからない。', 'item');
        passTurn = false;
        break;
      }
      case 'dash': {
        // 20歩の間、1歩で2マス進めるようになるバフ
        this.dashSteps = 20;
        this.effectFx(this.player.x, this.player.y, 'fx_slash', 1.5, 320, 0x9fe8ff);
        Audio.playSe('warp');
        this.log('疾風の羽で体が軽くなった！ 20歩の間、1歩で2マス進める。', 'item');
        passTurn = false;
        break;
      }
    }

    if (consumed) this.player.inventory.splice(index, 1);
    this.updateVisibility();
    this.emitRefresh();
    if (passTurn && consumed) {
      this.busy = true;
      this.finishTurn().then(() => { this.busy = false; });
    }
  }

  useBomb() {
    this.log('ボムナッツが炸裂！', 'special');
    Audio.playSe('bomb');
    this.cameras.main.shake(200, 0.01);
    for (const e of [...this.enemies]) {
      if (e.def.isFloorBoss && this.dungeon.bossRoom
        && (!this.isInsideBossRoom(this.player.x, this.player.y) || !this.isInsideBossRoom(e.x, e.y))) continue;
      const dist = Math.abs(e.x - this.player.x) + Math.abs(e.y - this.player.y);
      if (dist <= 2) {
        const dmg = 25 + Math.floor(Math.random() * 20);
        e.hp -= dmg;
        this.hitFx(e.x, e.y);
        this.log(`${e.def.name}に${dmg}の爆発ダメージ！`, 'dmg');
        if (e.hp <= 0) this.killEnemy(e, 0); else this.drawEnemyHp(e);
      }
    }
  }

  useWarp() {
    const pos = randomFloor(this.dungeon, [...this.occupiedPositions(), ...this.bossRoomCells()]);
    if (!pos) return;
    this.player.x = pos.x; this.player.y = pos.y;
    this.placeSprite(this.playerSprite, pos.x, pos.y);
    this.setBossEntranceClosed(false);
    this.log('ワープベルで別の場所へ転移した。', 'item');
    Audio.playSe('warp');
    this.updateVisibility();
    this.updateStairsHint();
  }

  useSeal() {
    let n = 0;
    for (const e of this.enemies) {
      if (e.def.isFloorBoss && this.dungeon.bossRoom
        && (!this.isInsideBossRoom(this.player.x, this.player.y) || !this.isInsideBossRoom(e.x, e.y))) continue;
      const dist = Math.abs(e.x - this.player.x) + Math.abs(e.y - this.player.y);
      if (dist <= 4) { e.sealTurns = 4; n++; this.magicFx(e.x, e.y); }
    }
    this.magicFx(this.player.x, this.player.y);
    this.log(`封印の魔導書で周囲の敵${n}体を止めた。`, 'special');
    Audio.playSe('seal');
  }

  enhanceChance(plus: number): number {
    return enhancementChance(plus);
  }

  // 強化成功率：+0は90%、強化値ごとに10ポイント低下し、+6以降は30%固定。
  enhanceSuccess(plus: number): boolean {
    return Math.random() < this.enhanceChance(plus);
  }

  // 武器強化スクロールを使う。スクロールは成否にかかわらず消費。
  useStone(): boolean {
    const w = this.player.weapon;
    if (!w) { this.log('強化する武器を装備していない。', 'sys'); Audio.playSe('deny'); return false; }
    if (this.enhanceSuccess(w.plus ?? 0)) {
      // 成功
      w.plus = (w.plus ?? 0) + 1;
      this.log(`強化成功！ ${weaponFullName(w)}（次回${Math.round(this.enhanceChance(w.plus) * 100)}%）`, 'special');
      Audio.playSe('levelup');
      this.magicFx(this.player.x, this.player.y);
      this.updatePlayerAura();
      // 強化色の閃光
      this.effectFx(this.player.x, this.player.y, 'fx_levelup', 1.8, 650);
    } else {
      // 失敗 → 武器が燃えて消滅
      this.log(`強化失敗… ${w.name} は燃え尽きてしまった！`, 'dmg');
      Audio.playSe('break');
      // 燃えるエフェクト（ヒットスパークを赤く）
      const fx = this.add.image(this.playerSprite.x, this.playerSprite.y - 8, 'fx_hit').setDepth(22).setTint(0xff5020).setScale(1.2);
      this.tweens.add({ targets: fx, alpha: 0, scale: 2.2, duration: 500, onComplete: () => fx.destroy() });
      this.cameras.main.shake(150, 0.006);
      // 所持武器から除去し、別の武器へ持ち替え
      this.player.weapons = this.player.weapons.filter((x) => x !== w);
      this.player.weapon = this.player.weapons[0] ?? null;
      this.updatePlayerAura();
    }
    this.emitRefresh();
    return true;
  }

  // 盾も武器と同じ成功率カーブを使う。
  useShieldStone(): boolean {
    const s = this.player.shield;
    if (!s) { this.log('強化する盾を装備していない。', 'sys'); Audio.playSe('deny'); return false; }
    if (this.enhanceSuccess(s.plus ?? 0)) {
      s.plus = (s.plus ?? 0) + 1;
      this.log(`盾の強化成功！ +${s.plus} ${s.name}（次回${Math.round(this.enhanceChance(s.plus) * 100)}%）`, 'special');
      Audio.playSe('levelup');
      this.magicFx(this.player.x, this.player.y);
      this.effectFx(this.player.x, this.player.y, 'fx_levelup', 1.8, 650);
    } else {
      this.log(`盾の強化失敗… ${s.name} は砕けてしまった！`, 'dmg');
      Audio.playSe('break');
      const fx = this.add.image(this.playerSprite.x, this.playerSprite.y - 8, 'fx_hit').setDepth(22).setTint(0xff5020).setScale(1.2);
      this.tweens.add({ targets: fx, alpha: 0, scale: 2.2, duration: 500, onComplete: () => fx.destroy() });
      this.cameras.main.shake(150, 0.006);
      this.player.shields = this.player.shields.filter((x) => x !== s);
      this.player.shield = this.player.shields[0] ?? null;
    }
    this.emitRefresh();
    return true;
  }

  private showForcedEquipmentSale() {
    this.time.delayedCall(0, () => {
      const ui = this.scene.get('UIScene') as { showForcedEquipmentSale?: () => void } | undefined;
      ui?.showForcedEquipmentSale?.();
    });
  }

  receiveWeapon(weapon: Weapon, source: string): boolean {
    if (this.player.weapons.length < EQUIPMENT_LIMIT) {
      this.player.weapons.push(weapon);
      return true;
    }
    this.pendingEquipment = { kind: 'weapon', item: weapon, source };
    this.log(`武器は${EQUIPMENT_LIMIT}本まで。${weaponFullName(weapon)}を受け取るには、武器を1本売却してください。`, 'special');
    this.emitRefresh();
    this.showForcedEquipmentSale();
    return false;
  }

  receiveShield(shield: Shield, source: string): boolean {
    if (this.player.shields.length < EQUIPMENT_LIMIT) {
      this.player.shields.push(shield);
      return true;
    }
    this.pendingEquipment = { kind: 'shield', item: shield, source };
    this.log(`盾は${EQUIPMENT_LIMIT}個まで。${shieldFullName(shield)}を受け取るには、盾を1個売却してください。`, 'special');
    this.emitRefresh();
    this.showForcedEquipmentSale();
    return false;
  }

  private acceptPendingEquipment(kind: 'weapon' | 'shield') {
    const pending = this.pendingEquipment;
    if (!pending || pending.kind !== kind) return;
    if (kind === 'weapon' && pending.kind === 'weapon') this.player.weapons.push(pending.item);
    if (kind === 'shield' && pending.kind === 'shield') this.player.shields.push(pending.item);
    const name = pending.kind === 'weapon' ? weaponFullName(pending.item) : shieldFullName(pending.item);
    this.pendingEquipment = null;
    this.log(`${pending.source}の${name}を所持装備に入れた。`, 'special');
  }

  unlockDualWieldSecret(): boolean {
    if (this.secretDualUnlocked) return false;
    this.secretDualUnlocked = true;
    const weapon = makeWeapon('w_dual_sword_thunder', []);
    const added = this.receiveWeapon(weapon, '隠し操作');
    this.log(added
      ? '隠し装備「デュアルソード（二刀流）」を所持装備に追加した！'
      : '隠し装備「デュアルソード（二刀流）」を発見した！ 売却後に受け取れます。', 'special');
    Audio.playSe('levelup');
    this.emitRefresh();
    return true;
  }

  redeemCode(code: string): boolean {
    if (code !== '0000000000') {
      this.log('コードが違うようだ。', 'sys');
      Audio.playSe('deny');
      return false;
    }
    const owned = this.player.weapons.find((weapon) => weapon.dual && weapon.plus >= 10);
    if (owned) {
      this.log(`${weaponFullName(owned)}はすでに所持している。`, 'sys');
      return true;
    }
    const strongest = WEAPON_DEFS
      .filter((weapon) => weapon.dual)
      .sort((a, b) => b.atkMax - a.atkMax || b.atkMin - a.atkMin)[0];
    if (!strongest) return false;
    const weapon = makeWeapon(strongest.key, []);
    weapon.plus = 10;
    const added = this.receiveWeapon(weapon, 'コード入力');
    if (added) {
      this.player.weapon = weapon;
      this.player.shield = null;
      this.updatePlayerAura();
      this.log(`秘蔵装備 ${weaponFullName(weapon)} を装備した！`, 'special');
    } else {
      this.log(`秘蔵装備 ${weaponFullName(weapon)} が現れた！ 売却後に受け取れます。`, 'special');
    }
    Audio.playSe('levelup');
    return true;
  }

  // ============ ガチャ ============
  // 500Gで1回。排出は武器か盾のみ。ランクが装備グレードへ直結する。
  // 戻り値はUI演出用（rank/色/名前/アイコン）。ゴールド不足はnull。
  gachaPull(): GachaResult | null {
    if (this.gameEnded) return null;
    if (this.player.gold < 500) {
      this.log('ゴールドが足りない。（ガチャは500G）', 'sys');
      Audio.playSe('deny');
      return null;
    }
    this.player.gold -= 500;

    // ランク抽選: SS 3% / S 12% / A 25% / B 35% / C 25%
    const forcedRank = location.hostname === 'localhost'
      ? new URLSearchParams(location.search).get('qa-gacha-rank')
      : null;
    const forcedCategory = location.hostname === 'localhost'
      ? new URLSearchParams(location.search).get('qa-gacha-category')
      : null;
    const r = Math.random();
    const rank: 'SS' | 'S' | 'A' | 'B' | 'C' =
      forcedRank && ['SS', 'S', 'A', 'B', 'C'].includes(forcedRank)
        ? forcedRank as 'SS' | 'S' | 'A' | 'B' | 'C'
        : r < 0.03 ? 'SS' : r < 0.15 ? 'S' : r < 0.40 ? 'A' : r < 0.75 ? 'B' : 'C';

    const RANK_COLOR: Record<string, number> = {
      SS: 0xffd700, S: 0xff5a5a, A: 0xa06bff, B: 0x4fb0ff, C: 0xb8c2cc
    };

    const gradeByRank: Record<typeof rank, EquipmentGrade> = {
      SS: 'S', S: 'A', A: 'B', B: 'C', C: 'D'
    };
    const grade = gradeByRank[rank];
    let name = '';
    let texKey = '';
    let hasEffect = false;
    let elementColor: number | undefined;
    let tintIcon = false;
    let category: '武器' | '盾' | '鎧' = '盾';
    let elementName: string | undefined;
    let feature: string | undefined;

    // SSの約1/3は最高位の鎧。その他は武器か盾で、属性付きは各抽選関数側で5%に制限する。
    const armorPrize = rank === 'SS'
      && (forcedCategory === 'armor' || (forcedCategory !== 'weapon' && forcedCategory !== 'shield' && Math.random() < 1 / 3));
    const weaponPrize = !armorPrize && !this.weaponWonThisFloor
      && (forcedCategory === 'weapon' || (forcedCategory !== 'shield' && Math.random() < 0.5));
    if (armorPrize) {
      const armor = armorForGrade(grade);
      this.equipArmor(armor.key);
      name = `[SS] ${armor.name}`;
      texKey = playerSheetKey(this.playerGender, armor.key);
      category = '鎧';
      hasEffect = true;
      elementName = '無属性';
      feature = `防御力 +${armor.defBonus}`;
    } else if (weaponPrize) {
      const w = rollWeaponByGrade(grade);
      if (rank === 'SS') w.plus = Math.max(w.plus, 3);
      else if (rank === 'S') w.plus = Math.max(w.plus, 1);
      this.receiveWeapon(w, 'ガチャ');
      this.weaponWonThisFloor = true;
      name = weaponFullName(w);
      texKey = w.key;
      category = '武器';
      hasEffect = !!w.passive;
      elementColor = w.element ? ELEMENT_INFO[w.element].color : undefined;
      elementName = w.element ? `${ELEMENT_INFO[w.element].name}属性` : '無属性';
      feature = w.passive?.name ?? (w.magics.length ? `魔法刻印 ${w.magics.map((magic) => magic.label).join('')}` : undefined);
    } else {
      const s = rollShieldByGrade(grade);
      if (rank === 'SS') s.plus = 2;
      else if (rank === 'S') s.plus = 1;
      this.receiveShield(s, 'ガチャ');
      name = shieldFullName(s);
      texKey = s.key;
      elementColor = s.element ? ELEMENT_INFO[s.element].color : undefined;
      hasEffect = !!s.passive;
      category = '盾';
      elementName = s.element ? `${ELEMENT_INFO[s.element].name}属性` : '無属性';
      feature = s.passive?.name;
    }

    this.log(`ガチャ【${rank}】${name}を引き当てた！`, rank === 'SS' || rank === 'S' ? 'special' : 'item');
    return {
      rank, color: RANK_COLOR[rank], name, texKey, hasEffect, elementColor, tintIcon,
      category, grade, elementName, feature
    };
  }

  shopRemaining(kind: 'potion' | 'stone' | 'shieldstone'): number {
    const limit = kind === 'potion' ? 5 : 2;
    return Math.max(0, limit - this.shopPurchases[kind]);
  }

  buyItem(kind: 'potion' | 'stone' | 'shieldstone'): boolean {
    const price = kind === 'potion' ? 25 : 100;
    if (this.gameEnded) return false;
    if (this.shopRemaining(kind) <= 0) {
      this.log(`この階の${ITEM_DEFS[kind].name}は売り切れだ。`, 'sys');
      Audio.playSe('deny');
      return false;
    }
    if (this.player.gold < price) {
      this.log(`${ITEM_DEFS[kind].name}を買うゴールドが足りない。`, 'sys');
      Audio.playSe('deny');
      return false;
    }
    if (this.player.inventory.length >= 60) {
      this.log('持ち物がいっぱいだ。', 'sys');
      Audio.playSe('deny');
      return false;
    }
    this.player.gold -= price;
    this.player.inventory.push(makeItem(kind));
    this.shopPurchases[kind]++;
    this.log(`${ITEM_DEFS[kind].name}を${price}Gで購入した。`, 'item');
    Audio.playSe('coin');
    this.emitRefresh();
    return true;
  }

  equipArmor(armor: PlayerArmor) {
    this.playerArmor = armor;
    this.player.armorDefBonus = PLAYER_ARMOR_DEFS[armor].defBonus;
    if (this.playerSprite) this.setPlayerVisual(this.player.dir, 'idle');
  }

  // 装備切替（UIから）
  equipWeapon(i: number) {
    const w = this.player.weapons[i];
    if (!w) return;
    this.player.weapon = w;
    this.log(`${weaponFullName(w)}を装備した。`, 'sys');
    // 二刀流は両手がふさがるので盾を外す
    if (w.dual && this.player.shield) {
      this.player.shield = null;
      this.log('二刀流のため盾を外した。（両手がふさがる）', 'sys');
    }
    Audio.playSe('pickup'); this.updatePlayerAura(); this.emitRefresh();
  }
  equipShield(i: number) {
    const s = this.player.shields[i];
    if (!s) return;
    if (this.player.weapon?.dual) {
      this.log('二刀流中は盾を持てない。（武器を持ち替えれば装備できる）', 'sys');
      Audio.playSe('deny');
      return;
    }
    this.player.shield = s; this.log(`${s.name}を装備した。`, 'sys'); Audio.playSe('pickup'); this.updatePlayerAura(); this.emitRefresh();
  }

  equipmentSellBase(grade: EquipmentGrade): number {
    return { D: 20, C: 45, B: 90, A: 160, S: 280 }[grade];
  }

  weaponSellPrice(weapon: Weapon): number {
    const condition = 0.4 + 0.6 * Math.max(0, weapon.dur / Math.max(1, weapon.durMax));
    return Math.max(5, Math.round((this.equipmentSellBase(weapon.grade) + weapon.plus * 30 + weapon.magics.length * 18) * condition));
  }

  shieldSellPrice(shield: Shield): number {
    const condition = 0.4 + 0.6 * Math.max(0, shield.dur / Math.max(1, shield.durMax));
    return Math.max(5, Math.round((this.equipmentSellBase(shield.grade) * 0.8 + shield.plus * 25) * condition));
  }

  sellWeapon(index: number): boolean {
    const weapon = this.player.weapons[index];
    if (!weapon) return false;
    if (weapon === this.player.weapon) {
      this.log('装備中の武器は売れない。先に別の武器へ持ち替えよう。', 'sys');
      Audio.playSe('deny');
      return false;
    }
    const price = this.weaponSellPrice(weapon);
    this.player.weapons.splice(index, 1);
    this.player.gold += price;
    this.log(`${weaponFullName(weapon)}を${price}Gで売却した。`, 'gold');
    this.acceptPendingEquipment('weapon');
    Audio.playSe('coin');
    this.emitRefresh();
    return true;
  }

  sellShield(index: number): boolean {
    const shield = this.player.shields[index];
    if (!shield) return false;
    if (shield === this.player.shield) {
      this.log('装備中の盾は売れない。先に別の盾へ持ち替えよう。', 'sys');
      Audio.playSe('deny');
      return false;
    }
    const price = this.shieldSellPrice(shield);
    this.player.shields.splice(index, 1);
    this.player.gold += price;
    this.log(`${shieldFullName(shield)}を${price}Gで売却した。`, 'gold');
    this.acceptPendingEquipment('shield');
    Audio.playSe('coin');
    this.emitRefresh();
    return true;
  }

  // ============ 階段 ============
  floorDisplayLabel(): string {
    return `${this.floor}${this.inBossRoom ? '.5' : ''}F`;
  }

  enterBossRoom() {
    if (this.busy || this.gameEnded || this.inBossRoom) return;
    this.busy = true;
    this.clickPathToken++;
    Audio.playSe('seal');
    const cam = this.cameras.main;
    cam.fadeOut(260, 24, 75, 62);
    cam.once('camerafadeoutcomplete', () => {
      this.buildFloor(this.floor, true);
      cam.fadeIn(340, 0, 0, 0);
      this.emitRefresh();
      this.busy = false;
    });
  }

  tryDescend() {
    if (this.busy || this.gameEnded) return;
    if (this.player.x !== this.dungeon.stairs.x || this.player.y !== this.dungeon.stairs.y) return;
    this.doDescend();
  }

  // 実際の降下処理（busyガードなし。移動から即呼ばれる）
  doDescend() {
    if (this.gameEnded) return;
    if (!this.inBossRoom && this.dungeon.bossRoom && !this.floorBossDefeated) {
      this.log('7×7部屋の中ボスを倒すまで次の階へは進めない。', 'sys');
      Audio.playSe('deny');
      this.busy = false;
      return;
    }
    if (this.inBossRoom && (!this.floorBossDefeated || !this.bossRewardClaimed)) {
      this.log('ボスを倒して出口の封印を解くまで次の階へは進めない。', 'sys');
      Audio.playSe('deny');
      this.busy = false;
      return;
    }
    // 階層クリアボーナス
    let bonus = 100 + this.floor * 10;
    let msg = `${this.floor}F クリア！ スコア+${bonus}`;
    if (!this.floorDamaged) { bonus += 150; msg += '（ノーダメージ +150）'; }
    if (this.floorTurn <= 40) { bonus += 100; msg += '（短時間クリア +100）'; }
    this.addScore(bonus);
    this.log(msg, 'gold');
    Audio.playSe('stairs');

    if (this.floor >= 30) {
      this.gameOver(true);
      return;
    }

    // 暗転して次の階へ
    const nextFloor = this.floor + 1;
    this.busy = true;
    const cam = this.cameras.main;
    cam.fadeOut(280, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.buildFloor(nextFloor, false);
      cam.fadeIn(300, 0, 0, 0);
      this.emitRefresh();
      this.busy = false;
    });
  }

  // ============ スコア/終了 ============
  addScore(v: number) {
    this.score += v;
  }

  gameOver(cleared: boolean) {
    if (this.gameEnded) return;
    this.gameEnded = true;

    if (cleared) {
      this.addScore(3000);
      this.addScore(this.player.hp * 5);
      this.addScore(this.player.inventory.length * 30);
      this.log('★30Fを制覇！ ダンジョンコアに到達した！★', 'special');
      Audio.playBgm('clear'); // 勝利ジングル
    } else {
      this.log('チャリは力尽きた…', 'dmg');
      this.playerAttacking = false;
      this.playPlayerDeath();
      this.weaponSprite?.setVisible(false);
      this.playerAura?.setVisible(false);
      Audio.playBgm('gameover'); // 敗北ジングル
    }

    const stats = {
      cleared,
      floor: this.floor,
      level: this.player.level,
      gold: this.player.gold,
      score: this.score,
      turns: this.turn,
      hp: this.player.hp,
      hpMax: this.player.hpMax,
      discovered: this.discovered.size,
      totalMonsters: MONSTER_DEFS.length
    };
    this.time.delayedCall(cleared ? 800 : 1000, () => {
      this.scene.stop('UIScene');
      this.scene.start('EndScene', stats);
    });
  }

  // ============ エフェクト ============
  stepDust(x: number, y: number, boost = 0, count = 3, color = 0x57706e) {
    const total = count + boost * 2;
    for (let i = 0; i < total; i++) {
      const dot = this.add.circle(
        x + Phaser.Math.Between(-6, 6), y + Phaser.Math.Between(-1, 3),
        Phaser.Math.FloatBetween(0.7, 1.6),
        boost > 1 ? 0xffd77b : boost > 0 ? 0x58d9d1 : color,
        boost > 0 ? 0.7 : 0.4
      ).setDepth(14).setBlendMode(boost > 0 ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL);
      this.tweens.add({
        targets: dot,
        x: dot.x + Phaser.Math.Between(-8, 8),
        y: dot.y - Phaser.Math.Between(3, 9),
        alpha: 0,
        scale: 0.25,
        duration: Phaser.Math.Between(180, 320),
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy()
      });
    }
  }

  pickupBurst(x: number, y: number, color: number, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.25;
      const spark = this.add.circle(x, y, i % 3 === 0 ? 1.8 : 1.1, color, 0.9)
        .setDepth(24).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * Phaser.Math.Between(10, 22),
        y: y + Math.sin(angle) * Phaser.Math.Between(8, 18) - 4,
        alpha: 0,
        scale: 0.25,
        duration: Phaser.Math.Between(260, 430),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  enemyDefeatFx(e: Enemy) {
    const echo = this.add.image(e.sprite.x, e.sprite.y, e.sprite.texture.key)
      .setDepth(19).setOrigin(e.sprite.originX, e.sprite.originY)
      .setScale(e.sprite.scaleX, e.sprite.scaleY)
      .setFlipX(e.sprite.flipX)
      .setTint(0x9ff8ef)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.72);
    this.tweens.add({
      targets: echo,
      alpha: 0,
      scaleX: echo.scaleX * 1.35,
      scaleY: echo.scaleY * 1.35,
      angle: Phaser.Math.Between(-10, 10),
      y: echo.y - 10,
      duration: 360,
      ease: 'Cubic.easeOut',
      onComplete: () => echo.destroy()
    });
    this.pickupBurst(e.sprite.x, e.sprite.y - 4, e.def.color || 0x58d9d1, e.def.isBoss ? 14 : 8);
  }

  slashFx(x: number, y: number, tint?: number) {
    const fx = this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, 'fx_slash').setDepth(20);
    if (tint !== undefined && tint !== 0xdfe7f0) fx.setTint(tint);
    this.tweens.add({ targets: fx, alpha: 0, scale: 1.4, duration: 220, onComplete: () => fx.destroy() });
  }
  hitFx(x: number, y: number) {
    const fx = this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, 'fx_hit').setDepth(21);
    this.tweens.add({ targets: fx, alpha: 0, scale: 1.5, duration: 260, onComplete: () => fx.destroy() });
  }
  // 汎用エフェクト（効果シートの画像を表示。tint指定で色を変えられる）
  effectFx(x: number, y: number, key: string, scale = 1.5, dur = 500, tint?: number) {
    if (!this.textures.exists(key)) return;
    const fx = this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, key).setDepth(22).setScale(0.8);
    if (tint !== undefined) fx.setTint(tint);
    this.tweens.add({ targets: fx, alpha: 0, scale, duration: dur, onComplete: () => fx.destroy() });
  }
  healFx() { this.effectFx(this.player.x, this.player.y, 'fx_heal', 1.6, 550); }
  levelupFx() { this.effectFx(this.player.x, this.player.y, 'fx_levelup', 1.8, 700); }
  magicFx(x: number, y: number) { this.effectFx(x, y, 'fx_magic', 2.0, 600); }
  poisonFx(x: number, y: number) { this.effectFx(x, y, 'fx_poison', 1.5, 500); }

  // 強化値は輝きの強さだけを上げ、武器色は属性だけで変える。
  updatePlayerAura() {
    if (this.playerAura) {
      const plus = this.player.weapon?.plus ?? 0;
      const grade = this.player.weapon?.grade ?? 'D';
      const element = this.player.weapon?.element;
      const highGrade = grade === 'A' || grade === 'S';
      if (plus > 0 || highGrade || element) {
        this.playerAura.setVisible(true)
          .setTint(element ? ELEMENT_INFO[element].color : gradeColor(grade))
          .setAlpha(Math.min(0.92, 0.34 + plus * 0.12 + (highGrade ? 0.14 : 0)))
          .setScale(0.9 + Math.min(0.35, plus * 0.06));
      } else {
        this.playerAura.setVisible(false);
      }
    }
    // 手持ち武器：装備中の武器の絵に変える（強化色でtint）
    if (this.weaponSprite) {
      const w = this.player.weapon;
      if (w && this.textures.exists(w.key)) {
        const size = w.grade === 'S' ? 22 : w.grade === 'A' ? 20 : 18;
        this.weaponSprite.setVisible(true).setTexture(w.key).setDisplaySize(size, size);
        this.weaponSprite.clearTint();
      } else {
        this.weaponSprite.setVisible(false);
      }
    }
  }

  // 矢印キーのホールド処理：押した瞬間に1歩、押しっぱなしで歩き続ける
  // （スマホ用十字ボタンの touchDir も同じ仕組みで処理）
  async handleMapClick(pointer: Phaser.Input.Pointer) {
    if (pointer.button !== 0 || this.gameEnded) return;
    if (pointer.x < MAP_X || pointer.x >= MAP_X + MAP_W || pointer.y < MAP_Y || pointer.y >= MAP_Y + MAP_H) return;
    const ui = this.scene.get('UIScene') as any;
    if (ui?.overlayMode && ui.overlayMode !== 'none') return;

    const clickedAt = pointer.downTime || this.time.now;
    if (this.clickPathActive && clickedAt - this.lastMapClickAt <= 360) {
      this.lastMapClickAt = 0;
      this.stopClickPath();
      this.effectFx(this.player.x, this.player.y, 'fx_magic', 0.72, 180, 0xffd36b);
      return;
    }
    this.lastMapClickAt = clickedAt;
    if (this.busy) return;

    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const target = { x: Math.floor(world.x / TILE), y: Math.floor(world.y / TILE) };
    const tile = this.dungeon.tiles[target.y]?.[target.x];
    const bossDoorTarget = tile === 'door' && !this.inBossRoom;
    if (!tile || (!isWalkable(tile) && !bossDoorTarget) || tile === 'pit') {
      Audio.playSe('deny');
      return;
    }
    if (!this.isTileCurrentlyVisible(target.x, target.y)) {
      Audio.playSe('deny');
      this.log('暗闇の先へは自動移動できない。', 'sys');
      return;
    }

    const token = ++this.clickPathToken;
    this.clickPathActive = true;
    this.setBoostTier(2);
    this.effectFx(target.x, target.y, 'fx_magic', 0.9, 260, 0x58d9d1);

    while (token === this.clickPathToken && !this.gameEnded && !this.busy) {
      if (this.player.x === target.x && this.player.y === target.y) break;
      if (!this.isTileCurrentlyVisible(target.x, target.y)) break;
      let path = this.findClickPath(target.x, target.y);
      if (!path.length) path = this.findClickPath(target.x, target.y, true);
      if (!path.length) break;
      const dir = path[0];
      const [dx, dy] = this.dirVec(dir);
      const nextX = this.player.x + dx;
      const nextY = this.player.y + dy;
      let encounteredEnemy = !!this.enemyAt(nextX, nextY) || !!this.bossObstacleAt(nextX, nextY);
      if (!encounteredEnemy && this.player.weapon?.weaponType === 'bow') {
        for (let distance = 2; distance <= 3; distance++) {
          if (this.enemyAt(this.player.x + dx * distance, this.player.y + dy * distance)) {
            encounteredEnemy = true;
            break;
          }
        }
      }
      await this.playerAct(dir);
      // 自動移動中に敵へ遭遇したら、攻撃は1回だけにして必ず停止する。
      if (encounteredEnemy) break;
      if (this.busy) break;
    }

    if (token === this.clickPathToken) {
      this.clickPathActive = false;
      this.setBoostTier(0);
    }
  }

  stopClickPath() {
    this.clickPathToken++;
    this.clickPathActive = false;
    this.setBoostTier(0);
  }

  findClickPath(targetX: number, targetY: number, stopAtEnemy = false): Dir[] {
    const dirs: { dir: Dir; dx: number; dy: number }[] = [
      { dir: 'up', dx: 0, dy: -1 }, { dir: 'down', dx: 0, dy: 1 },
      { dir: 'left', dx: -1, dy: 0 }, { dir: 'right', dx: 1, dy: 0 }
    ];
    const queue: { x: number; y: number; path: Dir[] }[] = [{ x: this.player.x, y: this.player.y, path: [] }];
    const visited = new Set<string>([`${this.player.x},${this.player.y}`]);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const step of dirs) {
        const nx = cur.x + step.dx, ny = cur.y + step.dy;
        const key = `${nx},${ny}`;
        if (visited.has(key)) continue;
        const tile = this.dungeon.tiles[ny]?.[nx];
        const isTarget = nx === targetX && ny === targetY;
        const bossDoorTarget = isTarget && tile === 'door' && !this.inBossRoom;
        if (!this.isTileCurrentlyVisible(nx, ny)) continue;
        if (!tile || (!isWalkable(tile) && !bossDoorTarget) || tile === 'pit') continue;
        const path = [...cur.path, step.dir];
        if (!isTarget && this.enemyAt(nx, ny)) {
          if (stopAtEnemy) return path;
          continue;
        }
        if (!isTarget && (this.chestAt(nx, ny) || this.bossObstacleAt(nx, ny))) continue;
        if (isTarget) return path;
        visited.add(key);
        queue.push({ x: nx, y: ny, path });
      }
    }
    return [];
  }

  handleMoveKeys(time: number) {
    if (this.busy || this.gameEnded) return;
    const ui = this.scene.get('UIScene') as { overlayMode?: string } | undefined;
    if (ui?.overlayMode && ui.overlayMode !== 'none') {
      this.heldDir = null;
      this.holdStartedAt = 0;
      this.touchDir = null;
      this.setBoostTier(0);
      return;
    }
    const entries: [Phaser.Input.Keyboard.Key, Dir][] = [
      [this.keys.up, 'up'], [this.keys.down, 'down'],
      [this.keys.left, 'left'], [this.keys.right, 'right']
    ];
    // 最後に押されたキーを優先（斜め同時押しでも自然に）
    let best: [Phaser.Input.Keyboard.Key, Dir] | null = null;
    for (const [k, d] of entries) {
      if (k.isDown && (!best || k.timeDown > best[0].timeDown)) best = [k, d];
    }
    const dir = best ? best[1] : this.touchDir;
    if (!dir) {
      this.heldDir = null;
      this.holdStartedAt = 0;
      this.setBoostTier(0);
      return;
    }
    if (this.clickPathActive) {
      this.clickPathToken++;
      this.clickPathActive = false;
      this.setBoostTier(0);
    }
    if (this.heldDir !== dir) {
      // 押した瞬間：即1歩（向き変えも含む）
      this.heldDir = dir;
      this.holdStartedAt = time;
      this.setBoostTier(0);
      this.holdRepeatAt = time + HOLD_FIRST_REPEAT_MS;
      this.playerAct(dir);
    } else if (time >= this.holdRepeatAt) {
      const heldFor = time - this.holdStartedAt;
      this.setBoostTier(heldFor >= HOLD_MAX_BOOST_MS ? 2 : heldFor >= HOLD_BOOST_MS ? 1 : 0);
      // 長押し中：進める時だけ歩く（壁に向かってのログ連打を防ぐ）
      if (this.canMoveInto(dir)) {
        this.playerAct(dir);
        this.holdRepeatAt = time + (this.holdBoostTier === 2 ? 44 : this.holdBoostTier === 1 ? 62 : 96);
      }
    }
  }

  currentMoveDuration(): number {
    if (this.clickPathActive) return 40;
    if (this.holdBoostTier === 2) return 44;
    if (this.holdBoostTier === 1) return 62;
    return 104;
  }

  currentTurnAnimDuration(base: number): number {
    const scale = this.clickPathActive ? 0.48 : this.holdBoostTier === 2 ? 0.44 : this.holdBoostTier === 1 ? 0.64 : 1;
    return Math.max(28, Math.round(base * scale));
  }

  setBoostTier(tier: number) {
    if (this.holdBoostTier === tier) return;
    this.holdBoostTier = tier;
    this.events.emit('refresh');
    if (!this.boostBadge) return;
    if (tier === 0) {
      this.boostBadge.setVisible(false);
      return;
    }
    this.boostBadge
      .setText(tier === 2 ? '⚡ MAX BOOST' : '⚡ BOOST')
      .setBackgroundColor(tier === 2 ? '#e7b85e' : '#58d9d1')
      .setVisible(true)
      .setScale(.75);
    this.tweens.add({ targets: this.boostBadge, scale: 1, duration: 190, ease: 'Back.easeOut' });
  }

  // その方向に「移動 or 攻撃 or 宝箱」できるか（長押しリピート用）
  canMoveInto(dir: Dir): boolean {
    const [dx, dy] = this.dirVec(dir);
    const nx = this.player.x + dx, ny = this.player.y + dy;
    if (this.enemyAt(nx, ny)) return true;
    if (this.bossObstacleAt(nx, ny)) return true;
    const c = this.chestAt(nx, ny);
    if (c && !c.opened) return true;
    const t = this.dungeon.tiles[ny]?.[nx];
    return !!t && isWalkable(t) && t !== 'pit';
  }

  // 毎フレーム：影の追従・アイドルの呼吸・オーラ＆武器の追従
  update(time: number) {
    const ps = this.playerSprite;
    if (!ps) return;

    // 矢印長押しで連続移動
    this.handleMoveKeys(time);

    // プレイヤーの呼吸（立ち止まっているときだけ、ふわっと上下に伸縮）
    if (!this.gameEnded && !this.busy) {
      const breathe = Math.sin(time * 0.004);
      ps.scaleX = 0.85 * (1 - breathe * 0.012);
      ps.scaleY = 0.85 * (1 + breathe * 0.032);
    }
    ps.setDepth(this.worldDepth(ps.y, 13));
    // 足元の影
    if (this.playerShadow) {
      this.playerShadow.x = ps.x;
      this.playerShadow.y = ps.y + 13;
      this.playerShadow.setScale(1 + Math.sin(time * 0.004) * 0.035, 1 - Math.sin(time * 0.004) * 0.02);
      this.playerShadow.setAlpha(0.62 - Math.sin(time * 0.004) * 0.05);
      this.playerShadow.setVisible(!this.gameEnded);
      this.playerShadow.setDepth(ps.depth - 0.22);
    }

    if (this.playerAura && this.playerAura.visible) {
      this.playerAura.x = ps.x;
      this.playerAura.y = ps.y - 4;
      const pulse = 0.9 + Math.sin(time * 0.006) * 0.15;
      this.playerAura.setScale(pulse);
      this.playerAura.setDepth(ps.depth - 0.16);
    }
    // 手持ち武器を「握って構えている」ように向きごとに位置・角度・反転を調整
    if (this.weaponSprite && this.weaponSprite.visible && !this.playerAttacking) {
      const dir = this.player.dir;
      // ox,oy=手元オフセット / rot=傾き(ラジアン) / flip=左右反転 / behind=キャラの後ろ
      let ox = 8, oy = 6, rot = 0.5, flip = false, behind = false;
      if (dir === 'down') { ox = 8; oy = 7; rot = 0.5; flip = false; }
      else if (dir === 'up') { ox = -8; oy = -3; rot = 0.5; flip = true; behind = true; }
      else if (dir === 'left') { ox = -10; oy = 6; rot = -0.5; flip = true; }
      else { ox = 10; oy = 6; rot = 0.5; flip = false; } // right
      this.weaponSprite.x = ps.x + ox;
      this.weaponSprite.y = ps.y + oy;
      this.weaponSprite.setRotation(rot);
      this.weaponSprite.setFlipX(flip);
      this.weaponSprite.setDepth(ps.depth + (behind ? -0.08 : 0.18));
    }

    // 敵：ゆらゆらした待機モーション＋影の追従
    for (const e of this.enemies) {
      if (!e.sprite || !e.sprite.visible) continue;
      if (!e.animating) {
        const flying = !!e.def.wallPass || /drake|dragon|wyrm|wyvern|moth|fiend|lich/.test(e.def.key);
        const bony = ['m_bone_dragon', 'm_death_knight', 'm_grave_crawler', 'm_lich'].includes(e.def.key);
        const pulse = Math.sin(time * (flying ? 0.0052 : 0.004) + e.bobPhase);
        e.sprite.scaleX = e.baseScale * (1 - pulse * (bony ? 0.01 : 0.018));
        e.sprite.scaleY = e.baseScale * (1 + pulse * (flying ? 0.065 : 0.045));
        const rattle = bony ? Math.sin(time * 0.012 + e.bobPhase) * 0.55 : 0;
        e.sprite.angle = Math.sin(time * 0.0027 + e.bobPhase) * (flying ? 1.9 : 1.3) + rattle;
      }
      e.sprite.setDepth(this.worldDepth(e.sprite.y, 12));
      if (e.shadow) {
        e.shadow.x = e.sprite.x;
        e.shadow.y = e.sprite.y + 11;
        e.shadow.setDepth(e.sprite.depth - 0.22);
      }
      if (e.aura) {
        e.aura.x = e.sprite.x;
        e.aura.y = e.sprite.y - 6;
        e.aura.setDepth(e.sprite.depth - 0.16);
      }
      if (e.freezeFx) {
        e.freezeFx.setPosition(e.sprite.x, e.sprite.y - 3).setDepth(e.sprite.depth + 0.35);
      }
      e.hpBar?.setDepth(e.sprite.depth + 0.45);
    }

    for (const c of this.chests) {
      if (!c.sprite.visible) continue;
      c.sprite.setDepth(this.worldDepth(c.sprite.y, 11));
      const pulse = Math.sin(time * 0.003 + c.phase);
      if (!c.opened) c.sprite.setScale(c.baseScale * (1 + pulse * 0.018), c.baseScale * (1 - pulse * 0.012));
      if (c.glow) {
        c.glow.setPosition(c.sprite.x, c.sprite.y - 4);
        c.glow.setAlpha((c.opened ? 0.2 : 0.28) + pulse * 0.08);
        c.glow.setScale(0.92 + pulse * 0.1);
        c.glow.setDepth(c.sprite.depth - 0.12);
      }
    }

    for (const g of this.ground) {
      if (!g.sprite.visible) continue;
      const pulse = Math.sin(time * 0.0042 + g.phase);
      g.sprite.y = g.y * TILE + TILE / 2 - 2 + pulse * 2.2;
      g.sprite.angle = Math.sin(time * 0.002 + g.phase) * 2.5;
      g.sprite.setDepth(this.worldDepth(g.sprite.y, 7));
      if (g.glow) {
        g.glow.setPosition(g.sprite.x, g.sprite.y + 1);
        g.glow.setAlpha(0.16 + pulse * 0.06).setScale(0.9 + pulse * 0.08);
        g.glow.setDepth(g.sprite.depth - 0.12);
      }
    }

    for (const m of this.ambientMotes) {
      if (!m.sprite.visible) continue;
      const pulse = Math.sin(time * 0.0018 + m.phase);
      m.sprite.y = m.baseY - ((time * 0.006 + m.phase * 8) % 14);
      m.sprite.x += Math.sin(time * 0.001 + m.phase) * 0.015;
      m.sprite.setAlpha(0.12 + (pulse + 1) * 0.13);
    }
  }
  flashSprite(spr: Phaser.GameObjects.Image) {
    spr.setTintFill(0xffffff);
    this.time.delayedCall(90, () => spr.clearTint());
  }
  drawEnemyHp(e: Enemy) {
    if (!e.hpBar) e.hpBar = this.add.graphics().setDepth(e.sprite.depth + 0.45);
    else e.hpBar.setDepth(e.sprite.depth + 0.45);
    e.hpBar.clear();
    const w = 24;
    const x = e.sprite.x - w / 2;
    const y = e.sprite.y - 20;
    e.hpBar.fillStyle(0x000000, 0.6); e.hpBar.fillRect(x - 1, y - 1, w + 2, 5);
    e.hpBar.fillStyle(0x40ff70, 1); e.hpBar.fillRect(x, y, w * Math.max(0, e.hp / e.hpMax), 3);
  }

  showEnemyInfo(e: Enemy) {
    this.discovered.add(e.def.key);
    const element = monsterElement(e.def);
    this.events.emit('enemyinfo', {
      name: e.def.name, hp: e.hp, hpMax: e.hpMax,
      atk: `${e.def.atkMin}-${e.def.atkMax}`, def: e.def.def,
      behavior: this.behaviorLabel(e.def.behavior),
      description: e.def.description,
      element: `${ELEMENT_INFO[element].name}属性（弱点: ${ELEMENT_INFO[ELEMENT_INFO[element].weakTo].name}属性）`
    });
  }
  behaviorLabel(b: string): string {
    return { chase: '追尾', slow: '鈍足(2ターンに1回)', random: 'ランダム移動', loop: '徘徊(壁抜け)', line: '直進', ranged: '遠距離攻撃' }[b] ?? b;
  }

  // ============ 描画ヘルパー ============
  setPlayerVisual(dir: Dir, frame: PlayerVisualFrame) {
    this.player.dir = dir;
    const sheetKey = playerSheetKey(this.playerGender, this.playerArmor ?? DEFAULT_PLAYER_ARMOR);
    if (this.textures.exists(sheetKey)) {
      this.playerSprite.setTexture(sheetKey, playerFrameIndex(dir, frame));
      this.playerSprite.setFlipX(false);
      return;
    }

    // 新シートが読めない環境では従来素材へフォールバックする。
    if (frame === 'hurt') {
      this.playerSprite.setTexture('player_hurt').setFlipX(dir === 'right');
      return;
    }
    if (frame === 'down') {
      this.playerSprite.setTexture('player_down').setFlipX(false);
      return;
    }
    const key = `player_${dir}_${frame}`;
    if (this.textures.exists(key)) {
      this.playerSprite.setTexture(key);
      this.playerSprite.setFlipX(false);
    } else {
      const base = dir === 'right' ? 'left' : dir;
      this.playerSprite.setTexture(`player_${base}_${frame}`);
      this.playerSprite.setFlipX(dir === 'right');
    }
  }

  tween(target: any, props: any, ms: number, ease = 'Linear'): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({ targets: target, ...props, duration: ms, ease, onComplete: () => resolve() });
    });
  }

  emitRefresh() {
    this.events.emit('refresh');
  }

  // UIScene起動前のログも保持し、UIScene側が起動時に復元できるようにする
  logHistory: { msg: string; type: string }[] = [];

  log(msg: string, type: 'sys' | 'dmg' | 'item' | 'gold' | 'special' = 'sys') {
    this.logHistory.push({ msg, type });
    if (this.logHistory.length > 8) this.logHistory.shift();
    this.events.emit('log', { msg, type });
  }

  // ============ ユーティリティ ============
  dirVec(dir: Dir): [number, number] {
    return dir === 'up' ? [0, -1] : dir === 'down' ? [0, 1] : dir === 'left' ? [-1, 0] : [1, 0];
  }
  enemyAt(x: number, y: number, exclude?: Enemy): Enemy | null {
    for (const e of this.enemies) if (e !== exclude && e.alive && e.x === x && e.y === y) return e;
    return null;
  }
  chestAt(x: number, y: number): Chest | null {
    for (const c of this.chests) if (!c.opened && c.x === x && c.y === y) return c;
    return null;
  }
  groundAt(x: number, y: number): GroundItem | null {
    for (const g of this.ground) if (g.x === x && g.y === y) return g;
    return null;
  }
  distToPlayer(x: number, y: number): number {
    return Math.abs(x - this.player.x) + Math.abs(y - this.player.y);
  }
}
