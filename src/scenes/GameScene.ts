import Phaser from 'phaser';
import { TILE } from '../textures';
import { generateDungeon, DungeonData, randomFloor, isWalkable } from '../dungeon';
import { getTheme, eraSuffix, MONSTER_DEFS, makeItem, plusColor, ITEM_DEFS } from '../data';
import type { Dir, ItemKind, MonsterDef, TileType, Vec2 } from '../types';
import { Player, rollWeapon, weaponFullName, makeShield, rollMagics, shieldFullName } from '../player';
import { Enemy } from '../enemy';
import { computePlayerAttack, computeEnemyAttack } from '../combat';
import { Audio } from '../audio/manager';
import { bgmForFloor } from '../audio/config';
import { enhancementChance, floorBossMultipliers, WEAPON_GACHA_CHANCE } from '../balance';

// マップ表示ビューポート（画面上の座標。スマホ縦持ちでは縦型レイアウト）
import { MAP_X, MAP_Y, MAP_W, MAP_H } from '../layout';

const ANIM = 116;
// 探索画面のズーム倍率（大きいほど拡大。1.0=等倍）
const MAP_ZOOM = 1.95;

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

// tint色を暗くする（壁と道のコントラスト用）
function darken(color: number, f: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * f);
  const g = Math.floor(((color >> 8) & 0xff) * f);
  const b = Math.floor((color & 0xff) * f);
  return (r << 16) | (g << 8) | b;
}

interface GroundItem {
  x: number;
  y: number;
  kind: ItemKind | 'coin' | 'gem';
  sprite: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Image;
  phase: number;
  value?: number;
}

interface Decoration {
  x: number;
  y: number;
  baseY: number;
  phase: number;
  emissive: boolean;
  sprite: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Image;
}

interface AmbientMote {
  x: number;
  y: number;
  baseY: number;
  phase: number;
  sprite: Phaser.GameObjects.Arc;
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
  weaponWonThisFloor = false;

  tileSprites: Phaser.GameObjects.Image[][] = [];
  explored: boolean[][] = [];
  enemies: Enemy[] = [];
  chests: Chest[] = [];
  ground: GroundItem[] = [];
  decorations: Decoration[] = [];
  ambientMotes: AmbientMote[] = [];
  discovered: Set<string> = new Set();

  playerSprite!: Phaser.GameObjects.Image;
  playerShadow?: Phaser.GameObjects.Image; // 足元の影（接地感）
  playerAura?: Phaser.GameObjects.Image; // 武器強化のオーラ（剣が光る演出）
  weaponSprite?: Phaser.GameObjects.Image; // キャラが手に持つ武器（装備で変化）
  stepToggle = false; // 歩行アニメの左右足切り替え
  stepFrame = 0;
  playerAttacking = false;
  stairsHint!: Phaser.GameObjects.Text;
  lightRadius = 4;
  shroomTurns = 0;
  dashSteps = 0; // 疾風の羽：残り歩数（1歩で2マス進める）
  themeTileTint = 0xffffff; // 現在フロアのタイル色合い（2階ごとに変わる）
  smokeTurns = 0;
  invisTurns = 0; // 透明ポーション：残りターン（敵から完全に見えない）

  // 長居ペナルティフラグ
  penaltyFlags = { p100: false, p150: false, p200: false, p250: false };

  keys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    wait: Phaser.Input.Keyboard.Key;
    wait2: Phaser.Input.Keyboard.Key;
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
    if (location.hostname === 'localhost' && new URLSearchParams(location.search).has('qa-gacha')) {
      this.player.gold = 900;
    }
    this.floor = 1;
    this.turn = 0;
    this.score = 0;
    this.busy = false;
    this.gameEnded = false;
    this.floorBossDefeated = false;
    this.weaponWonThisFloor = false;
    this.discovered = new Set();
    this.dashSteps = 0;
    this.stepFrame = 0;
    this.playerAttacking = false;

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
    this.decorations = [];
    this.ambientMotes = [];
    this.explored = [];

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
      wait: kb.addKey('SPACE'),
      wait2: kb.addKey('SHIFT'),
      enter: kb.addKey('ENTER')
    };
    // 矢印はupdate()内でホールド検出（長押しで連続移動できる）
    kb.on('keydown-SPACE', (event: KeyboardEvent) => { event.preventDefault(); this.onSpace(); });
    kb.on('keydown-SHIFT', () => this.playerAct('wait'));
    kb.on('keydown-ENTER', (event: KeyboardEvent) => { event.preventDefault(); this.tryDescend(); });
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

    this.buildFloor(1);

    // 少し遅らせてUIに初期表示させる
    this.time.delayedCall(50, () => this.emitRefresh());
  }

  // ============ フロア生成 ============
  buildFloor(floor: number) {
    this.floor = floor;
    this.floorTurn = 0;
    this.floorStartHp = this.player.hp;
    this.floorDamaged = false;
    this.penaltyFlags = { p100: false, p150: false, p200: false, p250: false };
    this.shroomTurns = 0;
    this.smokeTurns = 0;
    this.invisTurns = 0;
    this.floorBossDefeated = false;
    this.weaponWonThisFloor = false;
    this.playerSprite?.setAlpha(1);
    this.weaponSprite?.setAlpha(1);

    // 既存オブジェクト破棄
    for (const row of this.tileSprites) for (const s of row) s.destroy();
    this.tileSprites = [];
    for (const e of this.enemies) { if (e.aura) { this.tweens.killTweensOf(e.aura); e.aura.destroy(); } e.sprite.destroy(); e.hpBar?.destroy(); e.shadow?.destroy(); }
    this.enemies = [];
    for (const c of this.chests) { c.sprite.destroy(); c.glow?.destroy(); }
    this.chests = [];
    for (const gi of this.ground) { gi.sprite.destroy(); gi.glow?.destroy(); }
    this.ground = [];
    for (const d of this.decorations) { d.sprite.destroy(); d.glow?.destroy(); }
    this.decorations = [];
    for (const m of this.ambientMotes) m.sprite.destroy();
    this.ambientMotes = [];

    this.dungeon = generateDungeon(floor);
    const d = this.dungeon;
    // 出口は各階のボスを倒すまで封印された扉として扱う。
    d.tiles[d.stairs.y][d.stairs.x] = 'door';

    // explored初期化
    this.explored = [];
    for (let y = 0; y < d.h; y++) {
      this.explored[y] = [];
      for (let x = 0; x < d.w; x++) this.explored[y][x] = false;
    }

    // タイル描画（系統サフィックスは4種、色合いは2階ごとに変える）
    const theme = getTheme(floor);
    this.themeTileTint = theme.tileTint;
    const themeSuffix = eraSuffix(theme.era);
    for (let y = 0; y < d.h; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < d.w; x++) {
        const t = d.tiles[y][x];
        const key = this.tileTexKey(t, themeSuffix, x, y);
        const spr = this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, key).setDepth(0);
        this.tileSprites[y][x] = spr;
      }
    }
    this.spawnDecorations(floor);
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
      this.playerSprite = this.add.image(0, 0, 'player_down_idle').setDepth(12).setScale(0.85).setOrigin(0.5, 0.6);
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
    // 宝箱配置
    this.spawnChests(floor);
    // 落ちているアイテム
    this.spawnGroundItems(floor);

    this.updateVisibility();
    this.log(`${floor}F「${getTheme(floor).name}」に到達。`, 'sys');
    this.events.emit('floor', floor);
    // BGMは2階ごとに切り替わる。
    Audio.playBgm(bgmForFloor(floor));
  }

  tileTexKey(t: TileType, suffix: string, x: number, y: number): string {
    switch (t) {
      case 'wall': return `wall${suffix}`;
      case 'stairs': return 'stairs';
      case 'door': return 'door';
      case 'water': return `water${suffix}`;
      case 'poison': return `poison${suffix}`;
      case 'pit': return `pit${suffix}`;
      case 'rune': return `rune${suffix}`;
      case 'cracked': return `cracked${suffix}`;
      case 'floor':
      default:
        return `floor${suffix}_${(x + y * 2) % 3}`;
    }
  }

  spawnDecorations(floor: number) {
    const candidates: Vec2[] = [];
    for (let y = 1; y < this.dungeon.h - 1; y++) {
      for (let x = 1; x < this.dungeon.w - 1; x++) {
        if (this.dungeon.tiles[y][x] !== 'wall') continue;
        const nearFloor = [[0, 1], [1, 0], [-1, 0], [0, -1]].some(([dx, dy]) =>
          this.dungeon.tiles[y + dy]?.[x + dx] !== 'wall'
        );
        if (nearFloor) candidates.push({ x, y });
      }
    }
    Phaser.Utils.Array.Shuffle(candidates);
    const keys = floor >= 21
      ? ['prop_crystal', 'prop_statue', 'prop_lantern']
      : floor >= 11
        ? ['prop_lantern', 'prop_crystal', 'prop_barrel', 'prop_statue']
        : ['prop_torch', 'prop_lantern', 'prop_barrel', 'prop_crystal'];
    const count = Math.min(candidates.length, 7 + Math.floor(floor / 5));
    for (let i = 0; i < count; i++) {
      const pos = candidates[i];
      const key = keys[i % keys.length];
      if (!this.textures.exists(key)) continue;
      const emissive = key !== 'prop_barrel' && key !== 'prop_statue';
      const sprite = this.add.image(pos.x * TILE + TILE / 2, pos.y * TILE + TILE / 2 + 2, key)
        .setDepth(4).setOrigin(0.5, 0.68).setScale(0.78);
      const decoration: Decoration = {
        x: pos.x, y: pos.y, baseY: sprite.y, phase: Math.random() * Math.PI * 2,
        emissive, sprite
      };
      if (emissive) {
        decoration.glow = this.add.image(sprite.x, sprite.y - 6, 'glow')
          .setDepth(3.8).setBlendMode(Phaser.BlendModes.ADD)
          .setTint(key === 'prop_torch' ? 0x58d9ff : 0x67f0e2)
          .setDisplaySize(34, 34).setAlpha(0.22);
      }
      this.decorations.push(decoration);
    }
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
    const pool = MONSTER_DEFS.filter((m) => m.minFloor <= floor && floor <= m.maxFloor && !m.isBoss);
    // 出現数（狭い迷路マップに合わせて調整）
    const count = floor === 30 ? 5 : Math.min(10, 4 + Math.floor(floor / 3));
    for (let i = 0; i < count; i++) {
      const def = pool.length ? pool[Math.floor(Math.random() * pool.length)] : MONSTER_DEFS[0];
      const pos = randomFloor(this.dungeon, [this.dungeon.start]);
      if (!pos) continue;
      if (this.distToPlayer(pos.x, pos.y) < 4) continue;
      this.addEnemy(def, pos.x, pos.y, 1 + floor * 0.04);
    }
    // 各階にドラゴン系ボスを1体配置し、出口を封印する。
    if (floor === 30) {
      const finalBase = MONSTER_DEFS.find((m) => m.isBoss)!;
      const boss: MonsterDef = { ...finalBase, isFloorBoss: true };
      const pos = this.nearStairsPosition() ?? randomFloor(this.dungeon, this.occupiedPositions());
      if (pos) this.addEnemy(boss, pos.x, pos.y, 1);
      this.log('★最深部の守護者 コアウォッチャーが階段を封じている！', 'dmg');
    } else {
      this.spawnFloorBoss(floor);
    }
  }

  spawnFloorBoss(floor: number) {
    const dragonKeys = [
      'm_ember_drake', 'm_frost_wyrm', 'm_storm_wyvern',
      'm_brass_dragon', 'm_void_drake', 'm_bone_dragon'
    ];
    const bossNames = [
      'アッシュドラゴン', 'フロストワイバーン', 'ストームドラゴン',
      'ブラスドラゴン', 'ヴォイドドレイク', 'ボーンドラゴン'
    ];
    const index = Math.min(dragonKeys.length - 1, Math.floor((floor - 1) / 5));
    const base = MONSTER_DEFS.find((m) => m.key === dragonKeys[index]) ?? MONSTER_DEFS[0];
    const multipliers = floorBossMultipliers(floor);
    const { softened } = multipliers;
    const def: MonsterDef = {
      ...base,
      name: bossNames[index],
      hp: Math.max(20, Math.floor(base.hp * multipliers.hp)),
      atkMin: Math.max(3, Math.floor(base.atkMin * multipliers.attack)),
      atkMax: Math.max(7, Math.floor(base.atkMax * multipliers.attack)),
      def: Math.max(1, base.def + multipliers.defenseBonus),
      exp: Math.max(10, base.exp * 3),
      gold: Math.max(20, base.gold * 4),
      score: Math.max(100, base.score * 4),
      minFloor: floor,
      maxFloor: floor,
      isElite: true,
      isBoss: false,
      isFloorBoss: true,
      isDragonType: true
    };
    let pos = this.nearStairsPosition();
    if (!pos || this.distToPlayer(pos.x, pos.y) < 5) {
      pos = randomFloor(this.dungeon, this.occupiedPositions());
    }
    if (!pos) return;
    const enemy = this.addEnemy(def, pos.x, pos.y, 1);
    enemy.baseScale *= softened ? 1.22 : 1.38;
    enemy.sprite.setScale(enemy.baseScale);
    this.attachAura(enemy, softened ? 34 : 40, softened ? 0xe7b85e : 0xff5a5a);
    this.log(`${softened ? '◇' : '◆'} フロアボス「${def.name}」が扉を封印している！`, 'dmg');
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

  // 既存モンスターを強化クローンしてボスとして配置
  spawnBoss(floor: number, kind: 'mid' | 'strong') {
    const pool = MONSTER_DEFS.filter((m) => m.minFloor <= floor && !m.isBoss);
    let base = kind === 'strong'
      ? (MONSTER_DEFS.find((m) => m.key === 'm_guard') ?? pool[0])
      : (pool.length ? pool[Math.floor(Math.random() * pool.length)] : MONSTER_DEFS[0]);
    const m = kind === 'strong'
      ? { hp: 5, atk: 1.6, def: 6, gold: 8, score: 5 }
      : { hp: 2.8, atk: 1.35, def: 3, gold: 4, score: 3 };
    const def: MonsterDef = {
      ...base,
      name: base.name + (kind === 'strong' ? '（強ボス）' : '（中ボス）'),
      hp: Math.floor(base.hp * m.hp * (1 + floor * 0.03)),
      atkMin: Math.ceil(base.atkMin * m.atk),
      atkMax: Math.ceil(base.atkMax * m.atk),
      def: base.def + m.def,
      exp: base.exp * 3,
      gold: base.gold * m.gold,
      score: base.score * m.score,
      isElite: true,
      isBoss: false,
      isDragonType: true
    };
    // 出口（階段）を守る位置に配置。取れなければプレイヤーから離れた場所へ
    let pos: Vec2 | null = this.nearStairsPosition();
    if (pos && this.distToPlayer(pos.x, pos.y) < 6) {
      // 開始直後に出口が近すぎる稀なケースは別位置に退避
      pos = null;
    }
    if (!pos) {
      for (let tries = 0; tries < 30; tries++) {
        const p = randomFloor(this.dungeon, this.occupiedPositions());
        if (p && this.distToPlayer(p.x, p.y) >= 6) { pos = p; break; }
      }
    }
    if (!pos) pos = randomFloor(this.dungeon, this.occupiedPositions());
    if (!pos) return;
    const e = this.addEnemy(def, pos.x, pos.y, 1);
    // ボスは一回り大きく＋オーラの色で格を表す（中ボス=紫, 強ボス=赤）
    const grow = kind === 'strong' ? 1.4 : 1.3;
    e.baseScale *= grow;
    e.sprite.setScale(e.baseScale);
    this.attachAura(e, 30 * grow, kind === 'strong' ? 0xff5a5a : 0xb072ff);
    this.log(kind === 'strong' ? `⚠ 強ボス「${def.name}」が出口を守っている！` : `⚠ 中ボス「${def.name}」が出口付近に現れた！`, 'dmg');
  }

  addEnemy(def: MonsterDef, x: number, y: number, hpScale: number): Enemy {
    const e = new Enemy(def, x, y, hpScale);
    e.shadow = this.add.image(0, 0, 'shadow').setDepth(9.5).setAlpha(0.6);
    e.sprite = this.add.image(0, 0, def.key).setDepth(10).setOrigin(0.5, 0.6);
    const maxDim = def.isBoss || def.isFloorBoss ? 40 : def.isElite ? 34 : def.isDragonType ? 30 : 26;
    const tex = this.textures.get(def.key).getSourceImage();
    const sc = maxDim / Math.max(tex.width, tex.height);
    e.sprite.setScale(sc);
    e.baseScale = sc;
    e.bobPhase = Math.random() * Math.PI * 2;
    this.placeSprite(e.sprite, x, y);
    e.shadow.setPosition(e.sprite.x, e.sprite.y + 11);
    // 最終ボスは足元に特殊オーラ（中ボス/強ボスはspawnBossで付与）
    if (def.isBoss) this.attachAura(e, maxDim, 0x4fd0ff);
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
      .setDepth(9.6).setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(auraSize, auraSize)
      .setTint(tint).setAlpha(0.55);
    // 明滅で脈動（スケールは触らない＝サイズ変更と競合させない）
    this.tweens.add({ targets: e.aura, alpha: 0.9, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  spawnChests(floor: number) {
    const n = 3 + Math.floor(Math.random() * 3); // 宝箱を増量(3〜5)
    for (let i = 0; i < n; i++) {
      const pos = randomFloor(this.dungeon, this.occupiedPositions());
      if (!pos) continue;
      // 25%で赤い宝箱（レア）。深い階ほど少し出やすい
      const rare = Math.random() < 0.22 + Math.min(0.2, floor * 0.01);
      const baseScale = 0.85;
      const spr = this.add.image(0, 0, 'chest').setDepth(6).setOrigin(0.5, 0.6).setScale(baseScale);
      if (rare) spr.setTint(0xff6b5a); // 赤く染めてレアを示す
      this.placeSprite(spr, pos.x, pos.y);
      const glow = rare
        ? this.add.image(spr.x, spr.y - 4, 'glow').setDepth(5.5).setBlendMode(Phaser.BlendModes.ADD)
          .setTint(0xff7b52).setDisplaySize(42, 42).setAlpha(0.34)
        : undefined;
      this.chests.push({
        x: pos.x, y: pos.y, opened: false, rare, sprite: spr, glow,
        phase: Math.random() * Math.PI * 2, baseScale
      });
    }
  }

  spawnGroundItems(floor: number) {
    const kinds: (ItemKind | 'coin' | 'gem')[] = [
      'coin', 'coin', 'coin', 'potion', 'gem', 'stone', 'shieldstone', 'invis', 'dash'
    ];
    const n = 4 + Math.floor(Math.random() * 3); // 落ちてるアイテム(4〜6・狭いマップ向け)
    for (let i = 0; i < n; i++) {
      const pos = randomFloor(this.dungeon, this.occupiedPositions());
      if (!pos) continue;
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const texKey = kind === 'coin' ? 'coin' : kind === 'gem' ? 'gem' : `i_${kind}`;
      const spr = this.add.image(0, 0, texKey).setDepth(5).setOrigin(0.5, 0.6).setDisplaySize(22, 22);
      this.placeSprite(spr, pos.x, pos.y);
      const glow = this.add.image(spr.x, spr.y - 2, 'glow').setDepth(4.6)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(kind === 'coin' ? 0xffc45a : kind === 'gem' ? 0x55dfff : 0x88dfd4)
        .setDisplaySize(28, 28).setAlpha(0.18);
      const value = kind === 'coin' ? 10 + Math.floor(Math.random() * floor * 6) : kind === 'gem' ? 40 + floor * 8 : undefined;
      this.ground.push({ x: pos.x, y: pos.y, kind, sprite: spr, glow, phase: Math.random() * Math.PI * 2, value });
    }
  }

  occupiedPositions(): Vec2[] {
    const arr: Vec2[] = [{ x: this.dungeon.start.x, y: this.dungeon.start.y }, this.dungeon.stairs];
    for (const e of this.enemies) arr.push({ x: e.x, y: e.y });
    for (const c of this.chests) arr.push({ x: c.x, y: c.y });
    for (const g of this.ground) arr.push({ x: g.x, y: g.y });
    return arr;
  }

  placeSprite(spr: Phaser.GameObjects.Image, x: number, y: number) {
    spr.setPosition(x * TILE + TILE / 2, y * TILE + TILE / 2);
  }

  // ============ プレイヤー行動 ============
  onSpace() {
    // 階段は踏んだ時点で自動で降りるので、Spaceは常に足踏み
    this.playerAct('wait');
  }

  async playerAct(action: 'move' | 'wait', dir?: Dir) {
    if (this.busy || this.gameEnded) return;

    if (action === 'move' && dir) {
      this.player.dir = dir;
      const [dx, dy] = this.dirVec(dir);
      const nx = this.player.x + dx;
      const ny = this.player.y + dy;

      // 敵がいれば攻撃
      const enemy = this.enemyAt(nx, ny);
      if (enemy) {
        this.busy = true;
        await this.playerAttack(enemy, dir);
        await this.finishTurn();
        this.busy = false;
        return;
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
      if (!t || !isWalkable(t) || t === 'pit') {
        this.setPlayerVisual(dir, 'idle');
        if (t === 'pit') { this.log('落とし穴だ。ここには進めない。', 'sys'); Audio.playSe('deny'); }
        if (t === 'door') { this.log('扉はボスの力で封印されている。', 'sys'); Audio.playSe('deny'); }
        this.emitRefresh();
        return;
      }

      // 移動（歩行アニメを2フレームでめくって滑らかに）
      this.busy = true;
      Audio.playSe('step');
      const moveDuration = this.currentMoveDuration();
      if (this.holdBoostTier > 0) {
        const trail = this.add.image(this.playerSprite.x, this.playerSprite.y, this.playerSprite.texture.key)
          .setDepth(11).setScale(this.playerSprite.scaleX, this.playerSprite.scaleY)
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
      // 階段を踏んだら確認なしで即降りる（doDescendがbusyを管理）
      if (this.dungeon.tiles[ny]?.[nx] === 'stairs') {
        this.doDescend();
        return;
      }
      // 疾風の羽の効果中：同じ方向へもう1マス駆け抜ける（1歩で2マス）
      if (this.dashSteps > 0 && !this.gameEnded) {
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
    } else {
      // 足踏み
      this.busy = true;
      this.setPlayerVisual(this.player.dir, 'idle');
      this.player.heal(1); // 休息で微回復
      await this.finishTurn();
      this.busy = false;
    }
  }

  onEnterTile(x: number, y: number) {
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
        const suffix = eraSuffix(getTheme(this.floor).era);
        this.tileSprites[y][x].setTexture(this.tileTexKey('floor', suffix, x, y));
      }
    } else if (t === 'water') {
      // 減速なし、演出のみ
    } else if (t === 'cracked') {
      if (Math.random() < 0.2) {
        this.damagePlayer(6, 'ひび割れ床が崩れた！');
      }
    }
    // アイテム拾得
    const gi = this.groundAt(x, y);
    if (gi) this.pickUp(gi);
  }

  updateStairsHint() {
    // 階段は踏んだら即降りるため、ヒント表示は不要
    this.stairsHint.setVisible(false);
  }

  pickUp(gi: GroundItem) {
    if (gi.kind === 'coin') {
      this.player.gold += gi.value ?? 5;
      this.addScore(Math.floor((gi.value ?? 5) / 2));
      this.log(`コインを拾った (+${gi.value}G)`, 'gold');
      Audio.playSe('coin');
    } else if (gi.kind === 'gem') {
      this.player.gold += gi.value ?? 20;
      this.addScore(gi.value ?? 20);
      this.log(`輝きの宝石を拾った！ (+${gi.value}G スコアも上昇)`, 'gold');
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
    this.pickupBurst(gi.sprite.x, gi.sprite.y, gi.kind === 'coin' ? 0xffc45a : 0x64e7dc);
    gi.sprite.destroy();
    gi.glow?.destroy();
    this.ground = this.ground.filter((g) => g !== gi);
  }

  // ============ 戦闘 ============
  async playerAttack(e: Enemy, dir: Dir) {
    this.playerAttacking = true;
    this.setPlayerVisual(dir, 'atkWindup');
    await new Promise<void>((resolve) => this.time.delayedCall(42, () => resolve()));
    this.setPlayerVisual(dir, 'atk');
    Audio.playSe('attack');
    // 敵の方向へ踏み込む（前进→戻る）と斬撃エフェクト
    const [ddx, ddy] = this.dirVec(dir);
    const homeX = this.playerSprite.x, homeY = this.playerSprite.y;
    this.slashFx(e.x, e.y, plusColor(this.player.weapon?.plus ?? 0));
    if (this.weaponSprite?.visible) {
      this.tweens.add({
        targets: this.weaponSprite,
        angle: this.weaponSprite.angle + (dir === 'left' || dir === 'up' ? -115 : 115),
        duration: ANIM * 0.45,
        yoyo: true,
        ease: 'Cubic.easeOut'
      });
    }
    await new Promise<void>((resolve) => {
      this.tweens.add({
        targets: this.playerSprite,
        x: homeX + ddx * 10, y: homeY + ddy * 10,
        duration: ANIM * 0.45, yoyo: true, ease: 'Quad.easeOut',
        onComplete: () => { this.playerSprite.x = homeX; this.playerSprite.y = homeY; resolve(); }
      });
    });

    const res = computePlayerAttack(this.player, e.def);
    e.hp -= res.damage;
    this.discovered.add(e.def.key);
    Audio.playSe('hit');

    // 二刀流：2撃目の斬撃を少し遅らせて重ねる
    if (res.hits >= 2) {
      this.time.delayedCall(130, () => {
        this.slashFx(e.x, e.y, plusColor(this.player.weapon?.plus ?? 0));
        Audio.playSe('hit');
      });
    }

    let msg = `${res.hits >= 2 ? '二連撃！ ' : ''}${e.def.name}に${res.damage}ダメージ`;
    if (res.crit) msg += '（会心！）';
    this.log(msg, res.crit ? 'special' : 'dmg');
    this.hitFx(e.x, e.y);
    this.flashSprite(e.sprite);

    if (res.drain > 0) { this.player.heal(res.drain); this.log(`HPを${res.drain}吸収した。`, 'special'); }
    if (res.poison) { e.poisonTurns = 3; this.log(`${e.def.name}に毒を与えた。`, 'special'); this.poisonFx(e.x, e.y); }
    if (res.freeze) { e.freezeTurns = 2; this.log(`${e.def.name}を氷結させた！`, 'special'); }
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
    this.setPlayerVisual(dir, 'idle');

    if (e.hp <= 0) {
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

    // 装備武器はガチャ限定。敵からは消耗品と素材のみ落ちる。
    if (def.key === 'm_snake' && Math.random() < 0.7) this.dropItem(e.x, e.y, 'oldkey');
    // ゴールドは高確率で多めに
    if (Math.random() < 0.7) this.dropItem(e.x, e.y, 'coin', def.gold * 3 + Math.floor(Math.random() * this.floor * 4));
    // アイテムドロップ（確率大幅アップ）
    if (Math.random() < 0.4) {
      const pool: ItemKind[] = ['potion', 'smoke', 'stone', 'shieldstone'];
      this.dropItem(e.x, e.y, pool[Math.floor(Math.random() * pool.length)]);
    }
    // エリート/ボスは強化石を確定ドロップ＋超レアで復活の種
    if (def.isElite || def.isBoss) {
      const stonePool: ItemKind[] = ['stone', 'shieldstone'];
      this.dropItem(e.x, e.y, stonePool[Math.floor(Math.random() * stonePool.length)]);
      if (Math.random() < 0.08) { this.dropItem(e.x, e.y, 'revive'); this.log('復活のタネがこぼれ落ちた…！', 'special'); }
    }

    this.enemyDefeatFx(e);
    if (e.aura) { this.tweens.killTweensOf(e.aura); e.aura.destroy(); }
    e.sprite.destroy();
    e.hpBar?.destroy();
    e.shadow?.destroy();
    this.enemies = this.enemies.filter((x) => x !== e);

    if (def.isFloorBoss) {
      this.unlockFloorGate(def.name);
    }
  }

  unlockFloorGate(bossName: string) {
    if (this.floorBossDefeated) return;
    this.floorBossDefeated = true;
    const { x, y } = this.dungeon.stairs;
    this.dungeon.tiles[y][x] = 'stairs';
    this.tileSprites[y]?.[x]?.setTexture('stairs');
    Audio.playSe('seal');
    this.effectFx(x, y, 'fx_magic', 1.8, 620, 0x58d9d1);
    this.log(`${bossName}を撃破！ 封印の扉が開いた。`, 'special');
    this.updateVisibility();
    this.emitRefresh();
  }

  dropItem(x: number, y: number, kind: ItemKind | 'coin', value?: number) {
    // 壁抜け敵の位置や既に物がある位置には置かず、必ず通行可能な空き床を探す。
    let tx = x, ty = y;
    const startTile = this.dungeon.tiles[ty]?.[tx];
    const invalidStart = !startTile || !isWalkable(startTile) || startTile === 'pit' || this.groundAt(tx, ty) || this.chestAt(tx, ty);
    if (invalidStart) {
      const cand = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, 1], [1, -1], [-1, 1]];
      let placed = false;
      for (const [dx, dy] of cand) {
        const nx = x + dx, ny = y + dy;
        const t = this.dungeon.tiles[ny]?.[nx];
        if (t && isWalkable(t) && t !== 'pit' && !this.groundAt(nx, ny) && !this.chestAt(nx, ny)) {
          tx = nx; ty = ny; placed = true; break;
        }
      }
      if (!placed) return;
    }
    const texKey = kind === 'coin' ? 'coin' : `i_${kind}`;
    const spr = this.add.image(0, 0, texKey).setDepth(5).setOrigin(0.5, 0.6).setDisplaySize(22, 22);
    this.placeSprite(spr, tx, ty);
    spr.setVisible(!!this.explored[ty]?.[tx]);
    const glow = this.add.image(spr.x, spr.y - 2, 'glow').setDepth(4.6)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(kind === 'coin' ? 0xffc45a : 0x88dfd4)
      .setDisplaySize(28, 28).setAlpha(0.18)
      .setVisible(spr.visible);
    this.ground.push({ x: tx, y: ty, kind, sprite: spr, glow, phase: Math.random() * Math.PI * 2, value });
  }

  damagePlayer(dmg: number, reason: string) {
    this.player.hp -= dmg;
    this.floorDamaged = true;
    if (reason) this.log(`${reason} ${dmg}ダメージ！`, 'dmg');
    Audio.playSe('hurt');
    this.cameras.main.shake(120, 0.008);
    if (this.player.hp <= 0) this.handlePlayerDown();
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
    if (this.smokeTurns > 0) this.smokeTurns--;
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
    const pool = MONSTER_DEFS.filter((m) => m.minFloor <= this.floor && this.floor <= m.maxFloor && !m.isBoss && (elite ? m.isElite : true));
    const usePool = pool.length ? pool : MONSTER_DEFS.filter((m) => !m.isBoss);
    const def = usePool[Math.floor(Math.random() * usePool.length)];
    const pos = randomFloor(this.dungeon, this.occupiedPositions());
    if (!pos || this.distToPlayer(pos.x, pos.y) < 5) return;
    this.addEnemy(def, pos.x, pos.y, 1 + this.floor * 0.05);
  }

  async enemyTurn() {
    const anims: Promise<void>[] = [];
    for (const e of this.enemies) {
      if (!e.alive) continue;
      // 状態異常
      if (e.freezeTurns > 0) { e.freezeTurns--; continue; }
      if (e.sealTurns > 0) { e.sealTurns--; continue; }
      if (e.poisonTurns > 0) {
        e.poisonTurns--;
        e.hp -= 2;
        if (e.hp <= 0) { this.killEnemy(e, 0); continue; }
        this.drawEnemyHp(e);
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
    const dxp = this.player.x - e.x;
    const dyp = this.player.y - e.y;
    const dist = Math.abs(dxp) + Math.abs(dyp);
    // 透明化中は敵から完全に見えない（攻撃されず追跡もされない）
    const unseen = this.invisTurns > 0;

    // 隣接なら攻撃
    if (dist === 1 && !unseen) {
      return this.enemyAttack(e);
    }

    // 遠距離攻撃
    if (!unseen && e.def.ranged && (dxp === 0 || dyp === 0) && dist <= 5 && this.smokeTurns === 0) {
      if (this.lineOfSight(e.x, e.y, this.player.x, this.player.y)) {
        return this.enemyRanged(e);
      }
    }

    // 行動パターンによる移動
    let mv: Vec2 | null = null;
    const aggro = !unseen && dist <= 9 && this.smokeTurns === 0;
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
      e.x = mv.x;
      e.y = mv.y;
      return this.animateEnemyMove(e, mv);
    }
    return null;
  }

  animateEnemyMove(e: Enemy, mv: Vec2): Promise<void> {
    e.animating = true;
    const targetX = mv.x * TILE + TILE / 2;
    const targetY = mv.y * TILE + TILE / 2;
    const flying = /drake|dragon|wyrm|wyvern|moth|fiend|lich/.test(e.def.key);
    const rushing = /hound|cerberus|crawler/.test(e.def.key);
    const lean = Math.sign(targetX - e.sprite.x) * (flying ? -2 : -4);
    e.sprite.setAngle(lean);
    if (!flying) this.stepDust(e.sprite.x, e.sprite.y + 10, 0, rushing ? 3 : 2, 0x516b68);
    this.tweens.add({
      targets: e.sprite,
      scaleX: e.baseScale * (rushing ? 1.14 : 1.08),
      scaleY: e.baseScale * (flying ? 1.04 : 0.9),
      duration: ANIM * 0.5,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
    const duration = rushing ? ANIM * 0.76 : e.def.behavior === 'slow' ? ANIM * 1.14 : ANIM;
    return this.tween(e.sprite, { x: targetX, y: targetY }, duration, flying ? 'Sine.easeOut' : 'Sine.easeInOut').then(() => {
      e.animating = false;
      e.sprite.setScale(e.baseScale).setAngle(0);
    });
  }

  enemyAttack(e: Enemy): Promise<void> {
    const res = computeEnemyAttack(this.player, e.def);
    e.animating = true;
    // 攻撃演出：少し前進
    const ox = e.sprite.x, oy = e.sprite.y;
    const px = this.playerSprite.x, py = this.playerSprite.y;
    this.tweens.add({
      targets: e.sprite,
      scaleX: e.baseScale * 1.16,
      scaleY: e.baseScale * 0.84,
      duration: ANIM / 2,
      yoyo: true,
      ease: 'Back.easeInOut'
    });
    return new Promise((resolve) => {
      this.tweens.add({
        targets: e.sprite, x: (ox + px) / 2, y: (oy + py) / 2, duration: ANIM / 2, yoyo: true,
        onComplete: () => {
          e.animating = false;
          e.sprite.setScale(e.baseScale).setAngle(0);
          this.damagePlayer(res.damage, `${e.def.name}の攻撃！`);
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
    this.magicFx(e.x, e.y);
    this.tweens.add({
      targets: e.sprite,
      scaleX: e.baseScale * 0.9,
      scaleY: e.baseScale * 1.12,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
    return new Promise((resolve) => {
      const bolt = this.add.image(e.sprite.x, e.sprite.y, 'fx_bolt').setDepth(20).setTint(e.def.color);
      this.tweens.add({
        targets: bolt, x: this.playerSprite.x, y: this.playerSprite.y, duration: 180,
        onComplete: () => {
          e.animating = false;
          e.sprite.setScale(e.baseScale);
          bolt.destroy();
          const res = computeEnemyAttack(this.player, e.def);
          this.damagePlayer(res.damage, `${e.def.name}の遠距離攻撃！`);
          resolve();
        }
      });
    });
  }

  // ============ 敵移動ヘルパー ============
  passable(e: Enemy, x: number, y: number): boolean {
    const t = this.dungeon.tiles[y]?.[x];
    if (!t) return false;
    if (t === 'wall' && !e.def.wallPass) return false;
    if (t === 'pit') return false;
    if (this.enemyAt(x, y, e)) return false;
    if (this.player.x === x && this.player.y === y) return false;
    if (this.chestAt(x, y)) return false;
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
  updateVisibility() {
    const d = this.dungeon;
    const radius = this.lightRadius + (this.shroomTurns > 0 ? 4 : 0);
    // 現在部屋を特定
    let curRoom = null;
    for (const r of d.rooms) {
      if (this.player.x >= r.x && this.player.x < r.x + r.w && this.player.y >= r.y && this.player.y < r.y + r.h) {
        curRoom = r; break;
      }
    }
    const visible: boolean[][] = [];
    for (let y = 0; y < d.h; y++) { visible[y] = []; for (let x = 0; x < d.w; x++) visible[y][x] = false; }

    for (let y = 0; y < d.h; y++) {
      for (let x = 0; x < d.w; x++) {
        const cheb = Math.max(Math.abs(x - this.player.x), Math.abs(y - this.player.y));
        let vis = cheb <= radius;
        if (curRoom && x >= curRoom.x - 1 && x < curRoom.x + curRoom.w + 1 && y >= curRoom.y - 1 && y < curRoom.y + curRoom.h + 1) vis = true;
        if (vis) { visible[y][x] = true; this.explored[y][x] = true; }
      }
    }

    // タイル表示
    // ・壁は暗めのtintにして道とはっきり見分けられるようにする
    // ・初めて見えたタイルはフェードインで「ヌルっと」視界が広がる
    for (let y = 0; y < d.h; y++) {
      for (let x = 0; x < d.w; x++) {
        const spr = this.tileSprites[y][x];
        const isWall = d.tiles[y][x] === 'wall';
        if (visible[y][x]) {
          const firstReveal = !spr.visible || spr.alpha < .5;
          spr.setVisible(true);
          spr.setTint(isWall ? darken(this.themeTileTint, 0.45) : this.themeTileTint);
          if (firstReveal) {
            spr.setAlpha(.16);
            this.tweens.add({ targets: spr, alpha: 1, duration: 260, ease: 'Quad.easeOut' });
          } else spr.setAlpha(1);
        } else if (this.explored[y][x]) {
          const firstReveal = !spr.visible || spr.alpha < .2;
          spr.setVisible(true);
          spr.setTint(isWall ? 0x10161a : 0x172126);
          if (firstReveal) {
            spr.setAlpha(.05);
            this.tweens.add({ targets: spr, alpha: .18, duration: 260, ease: 'Quad.easeOut' });
          } else spr.setAlpha(.18);
        } else {
          // 未探索部分は完全に隠し、プレイヤー周辺だけを見せる。
          spr.setVisible(false);
        }
      }
    }
    // 敵・宝箱・アイテム表示
    for (const e of this.enemies) { const v = !!visible[e.y]?.[e.x]; e.sprite.setVisible(v); e.shadow?.setVisible(v); e.aura?.setVisible(v); if (e.hpBar) e.hpBar.setVisible(v); }
    for (const c of this.chests) {
      const v = !!visible[c.y]?.[c.x];
      c.sprite.setVisible(v);
      c.glow?.setVisible(v);
    }
    for (const g of this.ground) {
      const v = !!visible[g.y]?.[g.x];
      g.sprite.setVisible(v);
      g.glow?.setVisible(v);
    }
    for (const d of this.decorations) {
      const v = !!visible[d.y]?.[d.x];
      d.sprite.setVisible(v);
      d.glow?.setVisible(v);
    }
    for (const m of this.ambientMotes) m.sprite.setVisible(!!visible[m.y]?.[m.x]);
  }

  // ============ 宝箱 ============
  openChest(c: Chest) {
    c.opened = true;
    c.sprite.setTexture('chest_open');
    c.glow?.setAlpha(c.rare ? 0.46 : 0.18);
    this.tweens.add({
      targets: c.sprite,
      scaleX: c.baseScale * 1.2,
      scaleY: c.baseScale * 0.82,
      duration: 110,
      yoyo: true,
      ease: 'Back.easeOut'
    });
    this.pickupBurst(c.sprite.x, c.sprite.y - 4, c.rare ? 0xffb35c : 0x66e1d7, c.rare ? 9 : 6);
    if (c.rare) c.sprite.setTint(0xff9a5a);
    this.addScore(c.rare ? 120 : 40);
    Audio.playSe('chest');

    if (c.rare) {
      // ★赤い宝箱：レア確定＋大量ゴールド
      this.log('★赤い宝箱だ！ レアなお宝が眠っている！', 'special');
      // 武器はガチャ限定。赤い宝箱は上位素材・盾・復活アイテムを抽選する。
      const rr = Math.random();
      if (rr < 0.15) {
        this.player.inventory.push(makeItem('revive'));
        this.log('超レア！ 復活のタネが入っていた！', 'special');
      } else if (rr < 0.32) {
        this.player.inventory.push(makeItem('stone'), makeItem('stone'));
        this.log('レア！ 武器強化石×2が入っていた！', 'special');
      } else if (rr < 0.55) {
        const s = makeShield(this.floor >= 12 ? 's_skull' : 's_crystal');
        this.player.shields.push(s);
        this.log(`さらに「${s.name}」も入っていた！`, 'item');
      } else {
        this.player.inventory.push(makeItem('stone'));
        this.player.inventory.push(makeItem('shieldstone'));
        this.log('武器強化石＋盾強化石も入っていた！', 'item');
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
          const s = makeShield(this.floor >= 16 ? 's_skull' : 's_crystal');
          this.player.shields.push(s);
          this.log(`宝箱から「${s.name}」を発見！`, 'item');
        } else {
          const kinds: ItemKind[] = ['potion', 'warp', 'map', 'stone', 'shieldstone', 'invis'];
          const k = kinds[Math.floor(Math.random() * kinds.length)];
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
    const item = this.player.inventory[index];
    if (!item) return;
    let consumed = true;
    let passTurn = true;

    switch (item.kind) {
      case 'potion': this.player.heal(40); this.log('回復ポーションでHPを40回復した。', 'item'); Audio.playSe('heal'); this.healFx(); break;
      case 'stone': consumed = this.useStone(); passTurn = false; break;
      case 'shieldstone': consumed = this.useShieldStone(); passTurn = false; break;
      case 'shroom': this.shroomTurns = 12; this.log('光るキノコで周囲が明るくなった。', 'item'); Audio.playSe('pickup'); passTurn = false; break;
      case 'smoke': this.smokeTurns = 6; this.log('煙幕を焚いた。敵から見つかりにくくなった。', 'item'); Audio.playSe('pickup'); break;
      case 'bomb': this.useBomb(); break;
      case 'warp': this.useWarp(); passTurn = false; break;
      case 'seal': this.useSeal(); break;
      case 'map': for (let y = 0; y < this.dungeon.h; y++) for (let x = 0; x < this.dungeon.w; x++) this.explored[y][x] = true; this.log('古地図でこの階の地図が判明した。', 'item'); Audio.playSe('pickup'); passTurn = false; break;
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
    const pos = randomFloor(this.dungeon, this.occupiedPositions());
    if (!pos) return;
    this.player.x = pos.x; this.player.y = pos.y;
    this.placeSprite(this.playerSprite, pos.x, pos.y);
    this.log('ワープベルで別の場所へ転移した。', 'item');
    Audio.playSe('warp');
    this.updateVisibility();
    this.updateStairsHint();
  }

  useSeal() {
    let n = 0;
    for (const e of this.enemies) {
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

  // 武器強化石を使う。石は成否にかかわらず消費。
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

  // ============ ガチャ ============
  // 300Gで1回。SS/S/A/B/C ランクで装備やアイテムが出る。
  // 戻り値はUI演出用（rank/色/名前/アイコン）。ゴールド不足はnull。
  gachaPull(): { rank: 'SS' | 'S' | 'A' | 'B' | 'C'; color: number; name: string; texKey: string } | null {
    if (this.gameEnded) return null;
    if (this.player.gold < 300) {
      this.log('ゴールドが足りない。（ガチャは300G）', 'sys');
      Audio.playSe('deny');
      return null;
    }
    this.player.gold -= 300;

    // ランク抽選: SS 3% / S 12% / A 25% / B 35% / C 25%
    const r = Math.random();
    const rank: 'SS' | 'S' | 'A' | 'B' | 'C' =
      r < 0.03 ? 'SS' : r < 0.15 ? 'S' : r < 0.40 ? 'A' : r < 0.75 ? 'B' : 'C';

    const RANK_COLOR: Record<string, number> = {
      SS: 0xffd700, S: 0xff5a5a, A: 0xa06bff, B: 0x4fb0ff, C: 0xb8c2cc
    };

    let name = '';
    let texKey = '';
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    // 武器はガチャ限定・1階につき最大1本。取得率は全ランク共通で22%。
    const weaponPrize = !this.weaponWonThisFloor && Math.random() < WEAPON_GACHA_CHANCE;
    if (weaponPrize) {
      const floorBonus = rank === 'SS' ? 15 : rank === 'S' ? 10 : rank === 'A' ? 5 : rank === 'B' ? 2 : 0;
      const w = rollWeapon(this.floor + floorBonus);
      if ((rank === 'SS' || rank === 'S') && w.magics.length === 0) w.magics = rollMagics(rank === 'SS' ? 2 : 1);
      if (rank === 'SS') w.plus = Math.max(w.plus, 3);
      else if (rank === 'S') w.plus = Math.max(w.plus, 1);
      this.player.weapons.push(w);
      this.weaponWonThisFloor = true;
      name = weaponFullName(w);
      texKey = w.key;
    } else {
      switch (rank) {
        case 'SS': {
          this.player.inventory.push(makeItem('revive'));
          name = 'リバイブシード'; texKey = 'i_revive';
          break;
        }
        case 'S': {
          const s = makeShield('s_skull');
          s.plus = 1 + Math.floor(Math.random() * 2);
          this.player.shields.push(s);
          name = shieldFullName(s); texKey = s.key;
          break;
        }
        case 'A': {
          const k = pick(['stone', 'shieldstone'] as const);
          this.player.inventory.push(makeItem(k), makeItem(k));
          name = `${ITEM_DEFS[k].name} ×2`; texKey = `i_${k}`;
          break;
        }
        case 'B': {
          const k = pick(['stone', 'shieldstone', 'warp'] as const);
          this.player.inventory.push(makeItem(k));
          name = ITEM_DEFS[k].name; texKey = `i_${k}`;
          break;
        }
        case 'C': {
          const k = pick(['potion', 'smoke'] as const);
          this.player.inventory.push(makeItem(k));
          name = ITEM_DEFS[k].name; texKey = `i_${k}`;
          break;
        }
      }
    }

    this.log(`ガチャ【${rank}】${name}を手に入れた！`, rank === 'SS' || rank === 'S' ? 'special' : 'item');
    return { rank, color: RANK_COLOR[rank], name, texKey };
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

  // ============ 階段 ============
  tryDescend() {
    if (this.busy || this.gameEnded) return;
    if (this.player.x !== this.dungeon.stairs.x || this.player.y !== this.dungeon.stairs.y) return;
    this.doDescend();
  }

  // 実際の降下処理（busyガードなし。移動から即呼ばれる）
  doDescend() {
    if (this.gameEnded) return;
    if (!this.floorBossDefeated) {
      this.log('フロアボスを倒すまで扉は開かない。', 'sys');
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
      this.buildFloor(nextFloor);
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
      this.setPlayerVisual('down', 'idle');
      this.playerSprite.setTexture('player_down');
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

  // 強化オーラ＆手持ち武器の色・表示を更新
  updatePlayerAura() {
    if (this.playerAura) {
      const plus = this.player.weapon?.plus ?? 0;
      if (plus > 0) {
        this.playerAura.setVisible(true).setTint(plusColor(plus)).setAlpha(0.5 + Math.min(0.4, plus * 0.12));
      } else {
        this.playerAura.setVisible(false);
      }
    }
    // 手持ち武器：装備中の武器の絵に変える（強化色でtint）
    if (this.weaponSprite) {
      const w = this.player.weapon;
      if (w && this.textures.exists(w.key)) {
        this.weaponSprite.setVisible(true).setTexture(w.key).setDisplaySize(18, 18);
        this.weaponSprite.setTint((w.plus ?? 0) > 0 ? plusColor(w.plus) : 0xffffff);
      } else {
        this.weaponSprite.setVisible(false);
      }
    }
  }

  // 矢印キーのホールド処理：押した瞬間に1歩、押しっぱなしで歩き続ける
  // （スマホ用十字ボタンの touchDir も同じ仕組みで処理）
  handleMoveKeys(time: number) {
    if (this.busy || this.gameEnded) return;
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
    if (this.heldDir !== dir) {
      // 押した瞬間：即1歩（向き変えも含む）
      this.heldDir = dir;
      this.holdStartedAt = time;
      this.setBoostTier(0);
      this.holdRepeatAt = time + 220; // 少し待ってからリピート開始
      this.playerAct('move', dir);
    } else if (time >= this.holdRepeatAt) {
      const heldFor = time - this.holdStartedAt;
      this.setBoostTier(heldFor >= 1350 ? 2 : heldFor >= 580 ? 1 : 0);
      // 長押し中：進める時だけ歩く（壁に向かってのログ連打を防ぐ）
      if (this.canMoveInto(dir)) {
        this.playerAct('move', dir);
        this.holdRepeatAt = time + (this.holdBoostTier === 2 ? 54 : this.holdBoostTier === 1 ? 76 : 112);
      }
    }
  }

  currentMoveDuration(): number {
    if (this.holdBoostTier === 2) return 58;
    if (this.holdBoostTier === 1) return 78;
    return ANIM;
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
    // 足元の影
    if (this.playerShadow) {
      this.playerShadow.x = ps.x;
      this.playerShadow.y = ps.y + 13;
      this.playerShadow.setScale(1 + Math.sin(time * 0.004) * 0.035, 1 - Math.sin(time * 0.004) * 0.02);
      this.playerShadow.setAlpha(0.62 - Math.sin(time * 0.004) * 0.05);
      this.playerShadow.setVisible(!this.gameEnded);
    }

    if (this.playerAura && this.playerAura.visible) {
      this.playerAura.x = ps.x;
      this.playerAura.y = ps.y - 4;
      const pulse = 0.9 + Math.sin(time * 0.006) * 0.15;
      this.playerAura.setScale(pulse);
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
      this.weaponSprite.setDepth(behind ? 11.5 : 13);
    }

    // 敵：ゆらゆらした待機モーション＋影の追従
    for (const e of this.enemies) {
      if (!e.sprite || !e.sprite.visible) continue;
      if (!e.animating) {
        const flying = /drake|dragon|wyrm|wyvern|moth|fiend|lich/.test(e.def.key);
        const bony = /bone|skeleton|death|grave|lich/.test(e.def.key);
        const pulse = Math.sin(time * (flying ? 0.0052 : 0.004) + e.bobPhase);
        e.sprite.scaleX = e.baseScale * (1 - pulse * (bony ? 0.01 : 0.018));
        e.sprite.scaleY = e.baseScale * (1 + pulse * (flying ? 0.065 : 0.045));
        const rattle = bony ? Math.sin(time * 0.012 + e.bobPhase) * 0.55 : 0;
        e.sprite.angle = Math.sin(time * 0.0027 + e.bobPhase) * (flying ? 1.9 : 1.3) + rattle;
      }
      if (e.shadow) { e.shadow.x = e.sprite.x; e.shadow.y = e.sprite.y + 11; }
      if (e.aura) { e.aura.x = e.sprite.x; e.aura.y = e.sprite.y - 6; }
    }

    for (const c of this.chests) {
      if (!c.sprite.visible) continue;
      const pulse = Math.sin(time * 0.003 + c.phase);
      if (!c.opened) c.sprite.setScale(c.baseScale * (1 + pulse * 0.018), c.baseScale * (1 - pulse * 0.012));
      if (c.glow) {
        c.glow.setPosition(c.sprite.x, c.sprite.y - 4);
        c.glow.setAlpha((c.opened ? 0.2 : 0.28) + pulse * 0.08);
        c.glow.setScale(0.92 + pulse * 0.1);
      }
    }

    for (const g of this.ground) {
      if (!g.sprite.visible) continue;
      const pulse = Math.sin(time * 0.0042 + g.phase);
      g.sprite.y = g.y * TILE + TILE / 2 - 2 + pulse * 2.2;
      g.sprite.angle = Math.sin(time * 0.002 + g.phase) * 2.5;
      if (g.glow) {
        g.glow.setPosition(g.sprite.x, g.sprite.y + 1);
        g.glow.setAlpha(0.16 + pulse * 0.06).setScale(0.9 + pulse * 0.08);
      }
    }

    for (const d of this.decorations) {
      if (!d.sprite.visible) continue;
      const pulse = Math.sin(time * 0.0034 + d.phase);
      if (d.emissive) d.sprite.y = d.baseY + pulse * 0.7;
      if (d.glow) {
        d.glow.setPosition(d.sprite.x, d.sprite.y - 6);
        d.glow.setAlpha(0.18 + pulse * 0.09).setScale(0.88 + pulse * 0.1);
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
    if (!e.hpBar) e.hpBar = this.add.graphics().setDepth(11);
    e.hpBar.clear();
    const w = 24;
    const x = e.sprite.x - w / 2;
    const y = e.sprite.y - 20;
    e.hpBar.fillStyle(0x000000, 0.6); e.hpBar.fillRect(x - 1, y - 1, w + 2, 5);
    e.hpBar.fillStyle(0x40ff70, 1); e.hpBar.fillRect(x, y, w * Math.max(0, e.hp / e.hpMax), 3);
  }

  showEnemyInfo(e: Enemy) {
    this.discovered.add(e.def.key);
    this.events.emit('enemyinfo', {
      name: e.def.name, hp: e.hp, hpMax: e.hpMax,
      atk: `${e.def.atkMin}-${e.def.atkMax}`, def: e.def.def,
      behavior: this.behaviorLabel(e.def.behavior)
    });
  }
  behaviorLabel(b: string): string {
    return { chase: '追尾', slow: '鈍足(2ターンに1回)', random: 'ランダム移動', loop: '徘徊(壁抜け)', line: '直進', ranged: '遠距離攻撃' }[b] ?? b;
  }

  // ============ 描画ヘルパー ============
  setPlayerVisual(dir: Dir, frame: 'idle' | 'walk1' | 'walk2' | 'walk3' | 'atkWindup' | 'atk') {
    this.player.dir = dir;
    // 実アセットには右向きフレームがある。無い場合（procedural時）は左向きを反転
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
