import Phaser from 'phaser';
import { MONSTER_DEFS, WEAPON_DEFS } from './data';
import type { ItemKind } from './types';

export const TILE = 32;

// 疑似乱数（テクスチャ生成の再現性用）
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function px(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, w, h);
}

function shade(color: number, factor: number): number {
  const r = Math.min(255, Math.max(0, Math.floor(((color >> 16) & 0xff) * factor)));
  const gg = Math.min(255, Math.max(0, Math.floor(((color >> 8) & 0xff) * factor)));
  const b = Math.min(255, Math.max(0, Math.floor((color & 0xff) * factor)));
  return (r << 16) | (gg << 8) | b;
}

// グリッド文字列からドット絵を描く
function drawGrid(g: Phaser.GameObjects.Graphics, grid: string[], palette: Record<string, number>, scale: number, ox = 0, oy = 0) {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === '.' || c === ' ') continue;
      const col = palette[c];
      if (col === undefined) continue;
      px(g, ox + x * scale, oy + y * scale, scale, scale, col);
    }
  }
}

function gridTexture(scene: Phaser.Scene, key: string, grid: string[], palette: Record<string, number>, scale: number) {
  const w = grid[0].length * scale;
  const h = grid.length * scale;
  const g = scene.add.graphics();
  drawGrid(g, grid, palette, scale);
  g.generateTexture(key, w, h);
  g.destroy();
}

// ===================== タイル =====================
export function buildTileTextures(scene: Phaser.Scene) {
  for (let f = 1; f <= 30; f += 0) {
    break; // テーマは4種のみ生成
  }
  // 系統ごとの手続きタイル用パレット（実アセットが読めない時のフォールバック）
  const TILE_PAL: Record<number, { floorColor: number; floorAlt: number; wallColor: number; wallTop: number; accent: number }> = {
    1:  { floorColor: 0x2a3b34, floorAlt: 0x233029, wallColor: 0x35404f, wallTop: 0x46566a, accent: 0x3fe0d0 },
    11: { floorColor: 0x22333a, floorAlt: 0x1b2a30, wallColor: 0x2c3d47, wallTop: 0x3a5560, accent: 0x2fd0b0 },
    21: { floorColor: 0x2e2440, floorAlt: 0x241b33, wallColor: 0x38294f, wallTop: 0x4d3a6b, accent: 0xa06bff },
    30: { floorColor: 0x241a30, floorAlt: 0x1a1226, wallColor: 0x3a2450, wallTop: 0x5a3a7a, accent: 0xf5c542 },
  };
  const themeFloors = [1, 11, 21, 30];
  for (const tf of themeFloors) {
    const th = TILE_PAL[tf];
    const suffix = `_${tf}`;

    // 床（2バリエーション）
    for (let v = 0; v < 3; v++) {
      const g = scene.add.graphics();
      const base = v % 2 === 0 ? th.floorColor : th.floorAlt;
      px(g, 0, 0, TILE, TILE, base);
      const r = rng(tf * 100 + v + 7);
      // タイル目地
      px(g, 0, 0, TILE, 1, shade(base, 0.7));
      px(g, 0, 0, 1, TILE, shade(base, 0.7));
      px(g, 0, TILE - 1, TILE, 1, shade(base, 1.25));
      // ノイズ
      for (let i = 0; i < 14; i++) {
        const x = Math.floor(r() * TILE);
        const y = Math.floor(r() * TILE);
        px(g, x, y, 2, 2, shade(base, r() > 0.5 ? 1.2 : 0.82), 0.6);
      }
      // たまにアクセントの光苔
      if (v === 2) {
        px(g, 8, 20, 3, 3, th.accent, 0.5);
        px(g, 22, 10, 2, 2, th.accent, 0.5);
      }
      g.generateTexture(`floor${suffix}_${v}`, TILE, TILE);
      g.destroy();
    }

    // 壁
    {
      const g = scene.add.graphics();
      px(g, 0, 0, TILE, TILE, th.wallColor);
      px(g, 0, 0, TILE, 8, th.wallTop);
      // レンガ目地
      px(g, 0, 8, TILE, 1, shade(th.wallColor, 0.6));
      px(g, 0, 20, TILE, 1, shade(th.wallColor, 0.6));
      px(g, 10, 8, 1, 12, shade(th.wallColor, 0.6));
      px(g, 22, 20, 1, 12, shade(th.wallColor, 0.6));
      px(g, 0, 20, 1, 12, shade(th.wallColor, 0.6));
      px(g, 0, TILE - 2, TILE, 2, shade(th.wallColor, 0.5));
      g.generateTexture(`wall${suffix}`, TILE, TILE);
      g.destroy();
    }

    // 水
    {
      const g = scene.add.graphics();
      px(g, 0, 0, TILE, TILE, 0x1c4a63);
      for (let i = 0; i < 6; i++) px(g, 2 + i * 5, 6 + (i % 3) * 8, 4, 2, 0x3f9bd0, 0.7);
      g.generateTexture(`water${suffix}`, TILE, TILE);
      g.destroy();
    }
    // 毒床
    {
      const g = scene.add.graphics();
      px(g, 0, 0, TILE, TILE, 0x2a4a1e);
      for (let i = 0; i < 8; i++) px(g, (i * 7) % TILE, (i * 11) % TILE, 4, 4, 0x6fae2a, 0.8);
      px(g, 12, 12, 6, 6, 0x9fdf3a, 0.6);
      g.generateTexture(`poison${suffix}`, TILE, TILE);
      g.destroy();
    }
    // ひび割れ床
    {
      const g = scene.add.graphics();
      px(g, 0, 0, TILE, TILE, th.floorColor);
      g.lineStyle(1, shade(th.floorColor, 0.5), 1);
      g.beginPath(); g.moveTo(4, 4); g.lineTo(16, 14); g.lineTo(12, 26); g.strokePath();
      g.beginPath(); g.moveTo(16, 14); g.lineTo(28, 10); g.strokePath();
      g.generateTexture(`cracked${suffix}`, TILE, TILE);
      g.destroy();
    }
    // 落とし穴
    {
      const g = scene.add.graphics();
      px(g, 0, 0, TILE, TILE, shade(th.floorColor, 0.6));
      px(g, 4, 4, TILE - 8, TILE - 8, 0x05070a);
      px(g, 4, 4, TILE - 8, 3, 0x000000);
      g.generateTexture(`pit${suffix}`, TILE, TILE);
      g.destroy();
    }
    // 癒しの泉（回復エリア）：青緑の泉＋回復の＋マーク
    {
      const g = scene.add.graphics();
      px(g, 0, 0, TILE, TILE, shade(th.floorColor, 0.9));
      g.fillStyle(0x2fa0b0, 0.85); g.fillCircle(TILE / 2, TILE / 2, 11);
      g.fillStyle(0x5fe0d0, 0.7); g.fillCircle(TILE / 2, TILE / 2, 7);
      g.fillStyle(0xbfffe0, 0.6); g.fillCircle(TILE / 2 - 2, TILE / 2 - 2, 3);
      // 回復の＋マーク
      px(g, TILE / 2 - 1, TILE / 2 - 5, 2, 10, 0xffffff, 0.85);
      px(g, TILE / 2 - 5, TILE / 2 - 1, 10, 2, 0xffffff, 0.85);
      g.generateTexture(`rune${suffix}`, TILE, TILE);
      g.destroy();
    }
  }

  // 階段（共通）
  {
    const g = scene.add.graphics();
    px(g, 0, 0, TILE, TILE, 0x20242e);
    for (let i = 0; i < 5; i++) {
      const y = 4 + i * 5;
      px(g, 4 + i, y, TILE - 8 - i * 2, 4, shade(0x4a5568, 1 - i * 0.12));
    }
    g.generateTexture('stairs', TILE, TILE);
    g.destroy();
  }
  // 扉
  {
    const g = scene.add.graphics();
    px(g, 0, 0, TILE, TILE, 0x2a2030);
    px(g, 5, 2, TILE - 10, TILE - 2, 0x5a3a2a);
    px(g, 8, 6, TILE - 16, TILE - 8, 0x3a2418);
    px(g, TILE / 2 + 4, TILE / 2, 3, 3, 0xf5c542);
    g.generateTexture('door', TILE, TILE);
    g.destroy();
  }
}

// ===================== キャラクター =====================
// 主人公チャリを4方向×フレームで生成
function playerGrid(dir: string, frame: 'idle' | 'walk1' | 'walk2' | 'walk3' | 'atkWindup' | 'atk' | 'hurt' | 'down'): string[] {
  // 10x12 グリッド. h=帽子, f=顔, b=体, s=剣, l=脚, e=瞳
  const B = 'b'; // 青服
  // ベース（下向き）
  const legL = frame === 'walk1' ? 4 : frame === 'walk2' ? 5 : 4;
  void legL;
  if (dir === 'down') {
    const eye = 'e';
    const armSwing = frame === 'atk' ? 's' : '.';
    return [
      '..hhhh....',
      '.hhhhhh...',
      '.hffffh...',
      '.f' + eye + 'ff' + eye + 'f.' + '..',
      '.ffffff...',
      '..bbbb..' + armSwing + '.',
      '.bbbbbb.' + armSwing + '.',
      '.bbbbbb...',
      '.b.bb.b...',
      (frame === 'walk1' ? '.ll..ll...' : frame === 'walk2' ? '..llll....' : frame === 'walk3' ? '.l....l...' : '.ll..ll...'),
      '.kk..kk...',
      '..........'
    ];
  }
  if (dir === 'up') {
    return [
      '..hhhh....',
      '.hhhhhh...',
      '.hhhhhh...',
      '.hhhhhh...',
      '.hhhhhh...',
      '..bbbb....',
      '.bbbbbb...',
      '.bbbbbb...',
      '.b.bb.b...',
      (frame === 'walk1' ? '.ll..ll...' : frame === 'walk2' ? '..llll....' : frame === 'walk3' ? '.l....l...' : '.ll..ll...'),
      '.kk..kk...',
      '..........'
    ];
  }
  // left / right（rightは後で反転）
  const s = frame === 'atk' ? 's' : '.';
  return [
    '..hhhh....',
    '.hhhhhhh..',
    '.hffff....',
    '.f' + 'e' + 'ff....' + '..',
    '.ffff.....',
    '..bbbb' + s + '..',
    '.bbbbb' + s + '..',
    '.bbbbb....',
    '.bbbb.....',
    (frame === 'walk1' ? '.ll.ll....' : frame === 'walk2' ? '..llll....' : frame === 'walk3' ? '.l...l....' : '.ll.ll....'),
    '.kk.kk....',
    '..........'
  ];
}

function buildPlayerTextures(scene: Phaser.Scene) {
  const pal: Record<string, number> = {
    h: 0x2a3a8a, // 帽子（紺）
    f: 0xf0c8a0, // 顔
    e: 0x203040, // 瞳
    b: 0x33459a, // 服（青）
    l: 0x2a2a3a, // 脚
    k: 0x5a3a20, // 靴
    s: 0x9fe8ff  // 剣光
  };
  const scale = 3;
  // right は left テクスチャを setFlipX で反転して使うため生成しない
  const dirs = ['down', 'up', 'left'];
  const frames = ['idle', 'walk1', 'walk2', 'walk3', 'atkWindup', 'atk'];
  for (const dir of dirs) {
    for (const fr of frames) {
      const grid = playerGrid(dir, fr as any);
      const w = grid[0].length * scale;
      const h = grid.length * scale;
      const g = scene.add.graphics();
      drawGrid(g, grid, pal, scale);
      g.generateTexture(`player_${dir}_${fr}`, w, h);
      g.destroy();
    }
  }
  // ダメージ／やられ
  {
    const grid = playerGrid('down', 'idle');
    const pal2 = { ...pal, f: 0xffb0a0 };
    gridTexture(scene, 'player_hurt', grid, pal2, scale);
  }
  {
    const grid = [
      '..........',
      '..........',
      '..........',
      'hhhh......',
      'hffffbbb..',
      'ffffbbbbb.',
      '.bbbbbbll.',
      '.kkk.ll...',
      '..........',
      '..........',
      '..........',
      '..........'
    ];
    gridTexture(scene, 'player_down', grid, pal, scale);
  }
}

// ===================== モンスター =====================
function buildMonsterTextures(scene: Phaser.Scene) {
  const scale = 2;
  for (const def of MONSTER_DEFS) {
    const base = def.color;
    const size = def.isBoss ? 14 : def.isElite ? 12 : 11;
    // シンプルな怪物シルエットをキーごとに少し変える
    const grid = monsterGrid(def.key, size);
    const pal: Record<string, number> = {
      x: base,
      y: shade(base, 1.35),
      z: shade(base, 0.6),
      e: 0xffffff,
      p: 0x101018,
      a: 0x3fe0d0,
      g: 0xf5c542,
      w: 0xe8e2d0,   // 骨・白
      d: 0x1a1420,   // 影・黒
      r: 0xff4040,   // 赤い発光（眼など）
      o: 0xff8a30    // 橙
    };
    const w = grid[0].length * scale;
    const h = grid.length * scale;
    const g = scene.add.graphics();
    drawGrid(g, grid, pal, scale);
    g.generateTexture(def.key, w, h);
    g.destroy();
  }
}

// シートに実画像が無い追加モンスター用の手描きドット絵。
// x=基調色 y=ハイライト z=影 e=白 p=黒目 a=シアン g=金 w=骨白 d=黒 r=赤光 o=橙
const CUSTOM_GRIDS: Record<string, string[]> = {
  // 鉄塊ゴーレム（ブロック体・光る眼）
  m_golem: [
    '..z........z..', '..zxx....xxz..', '.zxxxxxxxxxxz.', 'zxxyyxxxxyyxxz',
    'zxxxxxxxxxxxxz', 'zxxaxxxxxxaxxz', 'zxxeppxxeppxxz', 'zxxxxxxxxxxxxz',
    'zxxdxdxdxdxxxz', 'zzxxxxxxxxxxzz', '.zxxz....zxxz.', '.ddz......zdd.', '.dd........dd.',
  ],
  // カラクリ蜘蛛（8本脚・赤い目）
  m_spider: [
    'd..d......d..d', '.d.d......d.d.', '..dd......dd..', '...dzxxxxzd...',
    '..d.zxyyxz.d..', '.d.zxrxxrxz.d.', 'd..zxxxxxxz..d', '...zxxxxxxz...',
    '..dzxxxxxxzd..', '.d..zzxxzz..d.', 'd....d..d....d', '.....d..d.....',
  ],
  // 監視の眼（大きな眼球・血管）
  m_eye: [
    '.....xxxx.....', '...xxyyyyxx...', '..xyyeeeeyxx..', '.xyeeewweeeyz.',
    '.xyeewppweexz.', 'zxyeewppweexxz', 'zxyeeewweexxxz', 'zxxyeeeeeyxxxz',
    '.zxxyyyyxxxxz.', '..zxxrxxrxxz..', '...zxxxxxxz...', '.....dddd.....',
  ],
  // 虚無のレイス（ボロ布の亡霊・光る眼）
  m_wraith: [
    '....zxxxxz....', '...zxxyyxxz...', '..zxxyyyyxxz..', '..zxaeppaexz..',
    '..zxxe..exxz..', '..zxxxxxxxxz..', '.zxxxxxxxxxxz.', '.zxxxxxxxxxxz.',
    'zxxxxxxxxxxxxz', 'zxxz.xxxx.zxxz', 'zxz.zxxxxz.zxz', '.z..z.zz.z..z.', '....z....z....',
  ],
  // 深淵の刈手（フード＋骸骨面＋大鎌）
  m_reaper: [
    '............g.', '...zzzz....gg.', '..zxxxxz..gg..', '..zxwwxz.gg...',
    '.zxwrrwxz.g...', '.zxwppwxz.g...', '.zxwwwwxz.g...', '.zxxxxxxz.g...',
    'zxxxxxxxxzdg..', 'zxxxxxxxxxz...', 'zxxz.xx.zxxz..', '.z.zx..xz.z...', '....z..z......',
  ],
  // ゼンマイ甲虫（丸い甲羅・ネジ巻き・脚）
  m_beetle: [
    '......gg......', '......gg......', '.....zxxz.....', '...zzxxxxzz...',
    '..zxyyxxyyxz..', '.zxxxxxxxxxxz.', '.zxexppxppexz.', '.zxxxxxxxxxxz.',
    'dzxxxxxxxxxxzd', '.zzxxxxxxxxzz.', 'd.zzzzzzzzzz.d', '.d.d.d..d.d.d.',
  ],
  // ネジスライム（緑の粘体・泡）※実画像フォールバック
  m_slime: [
    '..............', '......pp......', '.....p..p.....', '......pp......',
    '..............', '...yyxxxxyy...', '..yxxxxxxxxy..', '.zxxeppxppexz.',
    '.zxxxxxxxxxxz.', 'zxxxxxxxxxxxxz', 'zzxxxxxxxxxxzz', '.zzzzzzzzzzzz.',
  ],
  // ボーンアーチャー（骸骨の弓兵：右手に金の弓＋弦＋つがえた矢）
  m_archer: [
    '....zwwwz..g..',
    '...zwwwwwzg.e.',
    '...zwpwpwzg.e.',
    '...zwwwwwzgoe.',
    '....zwwwz.geo.',
    '.....zwz..g.e.',
    '...wwwwwwwg.e.',
    '..d.wwwww.dge.',
    '....w.w.w..g..',
    '...wwwwwww....',
    '....z...z.....',
    '....w...w.....',
    '...ww...ww....',
  ],
  // 迷い火ウィスプ（青い炎）※実画像フォールバック
  m_wisp: [
    '......x.......', '.....xyx......', '....xyyyx.....', '....xyayx.....',
    '...xyaayxx....', '...xyaaayx....', '..xxyaaayxx...', '..xxyeppeyx...',
    '..xxyaaaayx...', '...xxyaayxx...', '....xxyyxx....', '.....xxxx.....',
  ],
};

function monsterGrid(key: string, size: number): string[] {
  const custom = CUSTOM_GRIDS[key];
  if (custom) return custom;
  // 汎用ブロブ + 目
  const rows: string[] = [];
  const n = size;
  const cx = n / 2;
  for (let y = 0; y < n; y++) {
    let row = '';
    for (let x = 0; x < n; x++) {
      const dx = (x + 0.5 - cx) / cx;
      const dy = (y + 0.5 - cx) / cx;
      const d = dx * dx + dy * dy;
      if (d < 0.85) {
        // 上部ハイライト、下部影
        row += y < n * 0.4 ? 'y' : y > n * 0.7 ? 'z' : 'x';
      } else row += '.';
    }
    rows.push(row);
  }
  // 目を配置
  const eyeY = Math.floor(n * 0.45);
  const arr = rows.map((r) => r.split(''));
  const lx = Math.floor(n * 0.32);
  const rx = Math.floor(n * 0.62);
  if (arr[eyeY]) {
    if (arr[eyeY][lx]) arr[eyeY][lx] = 'e';
    if (arr[eyeY][rx]) arr[eyeY][rx] = 'e';
  }
  if (arr[eyeY + 1]) {
    if (arr[eyeY + 1][lx]) arr[eyeY + 1][lx] = 'p';
    if (arr[eyeY + 1][rx]) arr[eyeY + 1][rx] = 'p';
  }
  // 特徴付け
  if (key === 'm_jelly' && arr[0]) {
    // 王冠
    const mid = Math.floor(n / 2);
    arr[0][mid] = 'g'; if (arr[0][mid - 2]) arr[0][mid - 2] = 'g'; if (arr[0][mid + 2]) arr[0][mid + 2] = 'g';
  }
  if ((key === 'm_skel' || key === 'm_watcher') && arr[1]) {
    for (let i = 2; i < n - 2; i++) if (arr[1][i]) arr[1][i] = 'a';
  }
  if (key === 'm_snake' && arr[eyeY]) {
    // 鍵の色
    const mid = Math.floor(n / 2);
    if (arr[n - 2] && arr[n - 2][mid]) arr[n - 2][mid] = 'g';
  }
  return arr.map((r) => r.join(''));
}

// ===================== アイテム / 武器 / 盾 =====================
function iconTexture(scene: Phaser.Scene, key: string, draw: (g: Phaser.GameObjects.Graphics) => void, size = 24) {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, size, size);
  g.destroy();
}

function buildItemTextures(scene: Phaser.Scene) {
  const items: Record<ItemKind, (g: Phaser.GameObjects.Graphics) => void> = {
    potion: (g) => { px(g, 9, 2, 6, 4, 0x8a6a4a); px(g, 7, 6, 10, 16, 0xd03040); px(g, 9, 12, 6, 8, 0xff6070, 0.7); },
    shroom: (g) => { px(g, 10, 12, 4, 10, 0xe0d8c0); px(g, 5, 6, 14, 8, 0x4fb0ff); px(g, 8, 8, 2, 2, 0xffffff); px(g, 14, 9, 2, 2, 0xffffff); },
    smoke: (g) => { px(g, 8, 4, 8, 6, 0x6a6a6a); px(g, 6, 10, 12, 12, 0x8a8a8a); px(g, 9, 14, 6, 6, 0xb0b0b0, 0.6); },
    bomb: (g) => { px(g, 6, 8, 12, 12, 0x202028); px(g, 12, 3, 2, 5, 0x8a6a4a); px(g, 12, 2, 3, 2, 0xf5a020); px(g, 9, 12, 3, 3, 0x4a4a55); },
    warp: (g) => { px(g, 8, 4, 8, 12, 0xf5c542); px(g, 6, 16, 12, 3, 0xd0a020); px(g, 11, 6, 2, 8, 0x4fd0e0); },
    revive: (g) => { px(g, 11, 8, 2, 12, 0x8a5a2a); px(g, 6, 4, 5, 5, 0x6fae2a); px(g, 13, 4, 5, 5, 0x6fae2a); px(g, 10, 2, 4, 4, 0x9fdf3a); },
    oldkey: (g) => { g.lineStyle(3, 0xc0a040); g.strokeCircle(8, 8, 4); px(g, 9, 10, 3, 10, 0xc0a040); px(g, 12, 16, 4, 3, 0xc0a040); },
    floorkey: (g) => { g.lineStyle(3, 0x4fd0e0); g.strokeCircle(8, 8, 4); px(g, 9, 10, 3, 10, 0x4fd0e0); px(g, 12, 16, 4, 3, 0x4fd0e0); },
    map: (g) => { px(g, 4, 6, 16, 12, 0xd8c89a); px(g, 4, 6, 16, 2, 0xb0a070); g.lineStyle(1, 0x8a6a3a); g.strokeRect(7, 9, 10, 6); },
    seal: (g) => { px(g, 5, 4, 14, 16, 0x2a2450); px(g, 7, 6, 10, 12, 0x4a3a7a); px(g, 10, 9, 4, 4, 0xa06bff); },
    stone: (g) => { g.fillStyle(0x4fd0e0); g.fillTriangle(12, 2, 20, 12, 12, 22); g.fillTriangle(12, 2, 4, 12, 12, 22); g.fillStyle(0xbfefff, 0.8); g.fillTriangle(12, 5, 16, 12, 12, 12); },
    // 盾強化石：琥珀色の結晶＋盾マーク（縦の強化）
    shieldstone: (g) => { g.fillStyle(0xf5a030); g.fillTriangle(12, 2, 20, 12, 12, 22); g.fillTriangle(12, 2, 4, 12, 12, 22); g.fillStyle(0xffe0a0, 0.85); g.fillTriangle(12, 5, 16, 12, 12, 12); g.fillStyle(0x8a5a1a, 0.9); g.fillRect(10, 10, 4, 4); },
    // 透明ポーション：ガラス瓶の輪郭だけが見え、中身が透けている
    invis: (g) => {
      px(g, 9, 2, 6, 4, 0x8a6a4a);                                 // コルク栓
      g.fillStyle(0xbfefff, 0.15); g.fillRoundedRect(7, 6, 10, 16, 3); // 透けた中身
      g.lineStyle(1.5, 0x9fe8ff, 0.95); g.strokeRoundedRect(7, 6, 10, 16, 3); // 瓶の輪郭
      g.fillStyle(0xdfffff, 0.25); g.fillRect(9, 13, 6, 7);         // うっすら液面
      px(g, 9, 8, 2, 5, 0xffffff, 0.55);                            // ガラスの反射
      // 消えかけのきらめき
      px(g, 15, 10, 1, 3, 0xffffff, 0.8); px(g, 14, 11, 3, 1, 0xffffff, 0.8);
    },
    // 疾風の羽：水色の羽＋風のライン
    dash: (g) => {
      g.fillStyle(0x6fd0ff);
      g.fillTriangle(5, 19, 19, 3, 15, 19);
      g.fillStyle(0xbfe8ff);
      g.fillTriangle(8, 18, 18, 5, 15, 18);
      g.fillStyle(0xffffff, 0.9);
      g.fillTriangle(11, 17, 17, 8, 15, 17);
      g.lineStyle(1.5, 0x9fe8ff, 0.8);
      g.beginPath(); g.moveTo(3, 8); g.lineTo(9, 8); g.strokePath();
      g.beginPath(); g.moveTo(2, 12); g.lineTo(7, 12); g.strokePath();
    }
  };
  for (const [k, fn] of Object.entries(items)) {
    iconTexture(scene, `i_${k}`, fn);
  }
  // コイン・宝石・鍵などお宝
  iconTexture(scene, 'coin', (g) => { g.fillStyle(0xf5c542); g.fillCircle(12, 12, 8); g.fillStyle(0xffe680); g.fillCircle(12, 12, 5); });
  iconTexture(scene, 'gem', (g) => { g.fillStyle(0x4fb0ff); g.fillTriangle(12, 3, 21, 12, 12, 21); g.fillTriangle(12, 3, 3, 12, 12, 21); });
}

function buildWeaponTextures(scene: Phaser.Scene) {
  const colors: Record<string, number> = {
    w_screw: 0xb0b0c0, w_star: 0x3a4a8a, w_gearhammer: 0x8a7a5a, w_rune: 0x4fd0e0,
    w_vine: 0x5a8a3a, w_candle: 0xf5c542, w_compass: 0xc0a040, w_dark: 0x8a4fd0,
    w_gearaxe: 0x9a8a6a, w_gravity: 0x6b4fd0,
    w_twin: 0xd85a7a, w_soulblades: 0x5fe0d8
  };
  for (const def of WEAPON_DEFS) {
    const c = colors[def.key] ?? 0xcccccc;
    if (def.dual) {
      // 二刀流：2本の刃がX字に交差
      iconTexture(scene, def.key, (g) => {
        g.lineStyle(4, shade(c, 0.6), 1);
        g.beginPath(); g.moveTo(5, 3); g.lineTo(19, 19); g.strokePath();
        g.beginPath(); g.moveTo(19, 3); g.lineTo(5, 19); g.strokePath();
        g.lineStyle(2.5, c, 1);
        g.beginPath(); g.moveTo(5, 3); g.lineTo(19, 19); g.strokePath();
        g.beginPath(); g.moveTo(19, 3); g.lineTo(5, 19); g.strokePath();
        // 柄（下側の端）
        px(g, 3, 18, 5, 4, 0x5a3a20); px(g, 16, 18, 5, 4, 0x5a3a20);
        // 交差の光
        g.fillStyle(0xffffff, 0.9); g.fillCircle(12, 11, 2);
      });
      continue;
    }
    iconTexture(scene, def.key, (g) => {
      px(g, 10, 14, 4, 8, 0x5a3a20);      // 柄
      px(g, 7, 3, 10, 12, c);             // 刃/ヘッド
      px(g, 9, 4, 3, 9, shade(c, 1.4));   // ハイライト
      px(g, 6, 13, 12, 2, 0x8a6a3a);      // ガード
    });
  }
  // 盾
  const shields: Record<string, number> = { s_gear: 0x9a8a6a, s_crystal: 0x4fb0ff, s_skull: 0x8a4a6a };
  for (const [k, c] of Object.entries(shields)) {
    iconTexture(scene, k, (g) => {
      g.fillStyle(c); g.fillRoundedRect(5, 3, 14, 16, 3);
      g.fillStyle(shade(c, 0.6)); g.fillRoundedRect(8, 6, 8, 10, 2);
      px(g, 11, 9, 2, 4, 0xffffff, 0.6);
    });
  }

}

// ===================== エフェクト・その他 =====================
function buildMiscTextures(scene: Phaser.Scene) {
  // 宝箱
  iconTexture(scene, 'chest', (g) => {
    px(g, 4, 10, 24, 18, 0x8a5a2a); px(g, 4, 10, 24, 4, 0xb07a3a);
    px(g, 4, 6, 24, 6, 0x6a4520); px(g, 14, 14, 4, 6, 0xf5c542);
  }, 32);
  iconTexture(scene, 'chest_open', (g) => {
    px(g, 4, 14, 24, 14, 0x8a5a2a); px(g, 4, 4, 24, 8, 0x6a4520);
    px(g, 7, 16, 18, 8, 0xf5c542); px(g, 10, 18, 4, 4, 0xffe680);
  }, 32);
  // 斬撃エフェクト
  iconTexture(scene, 'fx_slash', (g) => {
    g.lineStyle(3, 0xbfefff, 0.9); g.beginPath(); g.arc(16, 16, 12, -0.6, 0.9); g.strokePath();
    g.lineStyle(1, 0xffffff, 0.9); g.beginPath(); g.arc(16, 16, 12, -0.5, 0.8); g.strokePath();
  }, 32);
  iconTexture(scene, 'fx_hit', (g) => {
    g.fillStyle(0xffd040, 0.9); g.fillCircle(16, 16, 5);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; px(g, 16 + Math.cos(a) * 9 - 1, 16 + Math.sin(a) * 9 - 1, 3, 3, 0xffa020); }
  }, 32);
  iconTexture(scene, 'fx_bolt', (g) => { g.fillStyle(0xa06bff, 0.9); g.fillCircle(8, 8, 5); g.fillStyle(0xd0a0ff); g.fillCircle(8, 8, 2); }, 16);
  // NPC（簡易）
  iconTexture(scene, 'npc_merchant', (g) => { px(g, 6, 4, 12, 6, 0x3a7a4a); px(g, 5, 10, 14, 14, 0x8a6a4a); px(g, 8, 6, 3, 3, 0x000); }, 24);
  // 光カーソル
  iconTexture(scene, 'cursor', (g) => { g.lineStyle(2, 0xf5c542, 1); g.strokeRect(1, 1, TILE - 2, TILE - 2); }, TILE);
  // 強化オーラ用の柔らかい光（白で作り、ゲーム側でtintして色を変える）
  iconTexture(scene, 'glow', (g) => {
    for (let r = 20; r >= 2; r -= 2) {
      g.fillStyle(0xffffff, 0.06);
      g.fillCircle(24, 24, r);
    }
  }, 48);
  // 足元の柔らかい影（キャラ・敵の接地感を出して自然に見せる）
  {
    const g = scene.add.graphics();
    for (let r = 14; r >= 2; r -= 1) {
      g.fillStyle(0x000000, 0.05);
      g.fillEllipse(16, 10, r * 2, r);
    }
    g.generateTexture('shadow', 32, 20);
    g.destroy();
  }
}

export function buildAllTextures(scene: Phaser.Scene) {
  buildTileTextures(scene);
  buildPlayerTextures(scene);
  buildMonsterTextures(scene);
  buildItemTextures(scene);
  buildWeaponTextures(scene);
  buildMiscTextures(scene);
}
