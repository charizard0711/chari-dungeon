import Phaser from 'phaser';

// ========================================================================
// アセットシート切り抜きローダー
// public/assets/*.png (1448x1086) から各スプライトを切り出し、
// 背景を透過処理してゲーム用テクスチャとして登録する。
// procedural テクスチャ（textures.ts）を上書きするため、
// シートが読めない場合でも代替絵で動作する。
// ========================================================================

type Sheet = 'characters' | 'monsters' | 'items' | 'tiles';
type Mode = 'sprite' | 'tile' | 'logo';

interface FrameDef {
  key: string;
  sheet: Sheet;
  r: [number, number, number, number]; // 大まかな領域 [x1,y1,x2,y2]（自動で境界調整される）
  mode: Mode;
  size?: number;            // sprite: 最大辺のターゲットpx / logo: 幅
  sizeMode?: 'max' | 'h';   // max=最大辺基準, h=高さ基準
}

// ---- 主人公（少年剣士）フレーム座標 ----
// 列: 待機, 歩き1, 歩き2, 歩き3, 攻撃1, 攻撃2 / 行: 下, 上, 左, 右
const PC = [805, 920, 1032, 1145, 1259, 1372]; // 列中心X
const PR: Record<string, [number, number]> = {
  down: [106, 198], up: [199, 291], left: [289, 381], right: [381, 473]
};
function pf(dir: string, col: number): [number, number, number, number] {
  const [y1, y2] = PR[dir];
  return [PC[col] - 56, y1, PC[col] + 56, y2];
}

function playerFrames(): FrameDef[] {
  const out: FrameDef[] = [];
  const frames: [string, number][] = [['idle', 0], ['walk1', 1], ['walk2', 2], ['atk', 5]];
  for (const dir of ['down', 'up', 'left', 'right']) {
    for (const [fr, col] of frames) {
      out.push({ key: `player_${dir}_${fr}`, sheet: 'characters', r: pf(dir, col), mode: 'sprite', size: 36, sizeMode: 'h' });
    }
  }
  out.push({ key: 'player_hurt', sheet: 'characters', r: [855, 540, 975, 660], mode: 'sprite', size: 36, sizeMode: 'h' });
  out.push({ key: 'player_down', sheet: 'characters', r: [1040, 565, 1195, 675], mode: 'sprite', size: 40 });
  return out;
}

const FRAME_DEFS: FrameDef[] = [
  // ---- ロゴ ----
  { key: 'logo', sheet: 'characters', r: [28, 15, 615, 285], mode: 'logo', size: 560 },
  { key: 'npc_merchant', sheet: 'characters', r: [30, 870, 128, 1000], mode: 'sprite', size: 28 },

  ...playerFrames(),

  // ---- モンスター（左側の1フレーム目を使用）----
  { key: 'm_mush', sheet: 'monsters', r: [40, 225, 152, 360], mode: 'sprite', size: 32 },
  { key: 'm_mole', sheet: 'monsters', r: [378, 225, 500, 360], mode: 'sprite', size: 32 },
  { key: 'm_jelly', sheet: 'monsters', r: [738, 230, 855, 360], mode: 'sprite', size: 32 },
  { key: 'm_ghost', sheet: 'monsters', r: [1093, 220, 1212, 362], mode: 'sprite', size: 32 },
  { key: 'm_gear', sheet: 'monsters', r: [33, 415, 168, 548], mode: 'sprite', size: 32 },
  { key: 'm_vine', sheet: 'monsters', r: [378, 415, 498, 548], mode: 'sprite', size: 32 },
  { key: 'm_mud', sheet: 'monsters', r: [733, 415, 857, 548], mode: 'sprite', size: 32 },
  { key: 'm_moss', sheet: 'monsters', r: [1078, 408, 1202, 550], mode: 'sprite', size: 32 },
  { key: 'm_bat', sheet: 'monsters', r: [33, 590, 168, 712], mode: 'sprite', size: 32 },
  { key: 'm_imp', sheet: 'monsters', r: [383, 585, 502, 712], mode: 'sprite', size: 32 },
  { key: 'm_snake', sheet: 'monsters', r: [728, 590, 852, 712], mode: 'sprite', size: 32 },
  { key: 'm_skel', sheet: 'monsters', r: [1088, 582, 1207, 714], mode: 'sprite', size: 32 },
  { key: 'm_guard', sheet: 'monsters', r: [148, 750, 292, 888], mode: 'sprite', size: 36 },
  { key: 'm_watcher', sheet: 'monsters', r: [635, 742, 935, 892], mode: 'sprite', size: 48 },
  // 下段「環境クリーチャー」から流用（実画像がある追加モンスター）
  { key: 'm_slime', sheet: 'monsters', r: [342, 928, 519, 1064], mode: 'sprite', size: 32 }, // どくぬめり
  { key: 'm_wisp',  sheet: 'monsters', r: [66, 928, 142, 1064], mode: 'sprite', size: 36 },  // 青い炎

  // ---- 武器 ----
  { key: 'w_screw', sheet: 'items', r: [32, 58, 148, 198], mode: 'sprite', size: 48},
  { key: 'w_star', sheet: 'items', r: [182, 58, 298, 198], mode: 'sprite', size: 48},
  { key: 'w_gearhammer', sheet: 'items', r: [332, 58, 448, 198], mode: 'sprite', size: 48},
  { key: 'w_rune', sheet: 'items', r: [464, 58, 580, 198], mode: 'sprite', size: 48},
  { key: 'w_vine', sheet: 'items', r: [607, 58, 723, 198], mode: 'sprite', size: 48},
  { key: 'w_candle', sheet: 'items', r: [755, 58, 871, 198], mode: 'sprite', size: 48},
  { key: 'w_compass', sheet: 'items', r: [900, 58, 1016, 198], mode: 'sprite', size: 48},
  { key: 'w_dark', sheet: 'items', r: [1034, 58, 1150, 198], mode: 'sprite', size: 48},
  { key: 'w_gearaxe', sheet: 'items', r: [1172, 58, 1288, 198], mode: 'sprite', size: 48},
  { key: 'w_gravity', sheet: 'items', r: [1307, 58, 1423, 198], mode: 'sprite', size: 48},

  // ---- 盾 ----
  { key: 's_gear', sheet: 'items', r: [38, 318, 140, 445], mode: 'sprite', size: 48},
  { key: 's_crystal', sheet: 'items', r: [168, 318, 270, 445], mode: 'sprite', size: 48},
  { key: 's_skull', sheet: 'items', r: [298, 318, 402, 445], mode: 'sprite', size: 48},

  // ---- 消耗品 ----
  { key: 'i_potion', sheet: 'items', r: [85, 505, 196, 645], mode: 'sprite', size: 48},
  { key: 'i_shroom', sheet: 'items', r: [415, 505, 526, 645], mode: 'sprite', size: 48},
  { key: 'i_smoke', sheet: 'items', r: [750, 505, 861, 645], mode: 'sprite', size: 48},
  { key: 'i_bomb', sheet: 'items', r: [907, 505, 1018, 645], mode: 'sprite', size: 48},
  { key: 'i_warp', sheet: 'items', r: [1066, 505, 1177, 645], mode: 'sprite', size: 48},
  { key: 'i_revive', sheet: 'items', r: [1245, 505, 1356, 645], mode: 'sprite', size: 48},

  // ---- お宝・キーアイテム ----
  { key: 'coin', sheet: 'items', r: [75, 715, 205, 848], mode: 'sprite', size: 48},
  { key: 'gem', sheet: 'items', r: [268, 715, 378, 848], mode: 'sprite', size: 48},
  { key: 'i_oldkey', sheet: 'items', r: [428, 715, 538, 848], mode: 'sprite', size: 48},
  { key: 'i_floorkey', sheet: 'items', r: [583, 715, 693, 848], mode: 'sprite', size: 48},
  { key: 'i_stone', sheet: 'items', r: [745, 715, 868, 848], mode: 'sprite', size: 48},  // ダンジョンコアの欠片=強化石
  { key: 'i_map', sheet: 'items', r: [915, 715, 1038, 848], mode: 'sprite', size: 48},
  { key: 'i_seal', sheet: 'items', r: [1085, 715, 1196, 848], mode: 'sprite', size: 48},

  // ---- エフェクト（効果シートから切り抜き）----
  { key: 'fx_slash', sheet: 'items', r: [75, 908, 258, 1055], mode: 'sprite', size: 40 },    // 剣の斬撃
  { key: 'fx_magic', sheet: 'items', r: [293, 908, 473, 1055], mode: 'sprite', size: 40 },   // 魔法陣
  { key: 'fx_hit', sheet: 'items', r: [510, 908, 690, 1055], mode: 'sprite', size: 32 },     // ヒットスパーク
  { key: 'fx_heal', sheet: 'items', r: [727, 908, 907, 1055], mode: 'sprite', size: 40 },    // 回復エフェクト
  { key: 'fx_poison', sheet: 'items', r: [944, 908, 1124, 1055], mode: 'sprite', size: 36 }, // 毒の霧
  { key: 'fx_levelup', sheet: 'items', r: [1161, 908, 1341, 1055], mode: 'sprite', size: 44 }, // レベルアップ

  // ---- 宝箱・階段・扉 ----
  { key: 'chest', sheet: 'tiles', r: [30, 588, 135, 692], mode: 'sprite', size: 30 },
  { key: 'chest_open', sheet: 'tiles', r: [163, 585, 275, 692], mode: 'sprite', size: 30 },
  { key: 'stairs', sheet: 'tiles', r: [878, 95, 982, 205], mode: 'tile' },
  { key: 'door', sheet: 'tiles', r: [1018, 92, 1122, 204], mode: 'tile' }
];

// ---- タイル（テーマ別の床3種+壁、共通ハザード）----
function tileDefs(): FrameDef[] {
  const out: FrameDef[] = [];
  const block = (cx: number, cy: number, half = 37): [number, number, number, number] =>
    [cx - half, cy - half, cx + half, cy + half];

  // 床: テーマごとに3バリエーション [中心x, 中心y]
  const floors: Record<string, [number, number][]> = {
    _1: [[62, 122], [145, 122], [228, 122]],       // 地下遺跡（苔の石畳）
    _11: [[315, 122], [400, 122], [485, 122]],     // 機械迷宮（暗青緑）
    _21: [[570, 122], [797, 122], [400, 205]],     // 深層コア（紫）
    _30: [[727, 205], [797, 205], [727, 122]]      // 最深部
  };
  for (const [suffix, list] of Object.entries(floors)) {
    list.forEach(([cx, cy], i) => {
      out.push({ key: `floor${suffix}_${i}`, sheet: 'tiles', r: block(cx, cy), mode: 'tile' });
    });
  }
  // 壁
  const walls: Record<string, [number, number]> = {
    _1: [55, 332], _11: [182, 332], _21: [247, 332], _30: [310, 332]
  };
  for (const [suffix, [cx, cy]] of Object.entries(walls)) {
    out.push({ key: `wall${suffix}`, sheet: 'tiles', r: block(cx, cy, 34), mode: 'tile' });
  }
  // ハザード床（全テーマ共通で同じ絵を使用）
  const hazards: Record<string, [number, number]> = {
    cracked: [413, 330], poison: [512, 330], pit: [612, 330], rune: [710, 330], water: [800, 330]
  };
  for (const [name, [cx, cy]] of Object.entries(hazards)) {
    for (const suffix of ['_1', '_11', '_21', '_30']) {
      out.push({ key: `${name}${suffix}`, sheet: 'tiles', r: block(cx, cy, 38), mode: 'tile' });
    }
  }
  return out;
}

const ALL_DEFS = [...FRAME_DEFS, ...tileDefs()];

// ========================================================================
// 画素処理
// ========================================================================

interface SheetData {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  bg: [number, number, number];
}

function prepareSheet(scene: Phaser.Scene, sheet: Sheet): SheetData | null {
  const texKey = `sheet_${sheet}`;
  if (!scene.textures.exists(texKey)) return null;
  const src = scene.textures.get(texKey).getSourceImage() as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0);
  // 背景色 = 左上端のピクセル
  const p = ctx.getImageData(2, 2, 1, 1).data;
  return { canvas, ctx, bg: [p[0], p[1], p[2]] };
}

function isBg(d: Uint8ClampedArray, i: number, bg: [number, number, number], thr: number): boolean {
  return Math.abs(d[i] - bg[0]) <= thr && Math.abs(d[i + 1] - bg[1]) <= thr && Math.abs(d[i + 2] - bg[2]) <= thr;
}

// 指定領域内の「背景でない」ピクセルの正確な境界を求める
function tightBounds(img: ImageData, bg: [number, number, number], thr: number) {
  const { width: w, height: h, data: d } = img;
  let x1 = w, y1 = h, x2 = -1, y2 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!isBg(d, i, bg, thr)) {
        if (x < x1) x1 = x;
        if (x > x2) x2 = x;
        if (y < y1) y1 = y;
        if (y > y2) y2 = y;
      }
    }
  }
  if (x2 < 0) return null;
  return { x1, y1, x2, y2 };
}

// 彩度とコントラストを上げて絵を濃く鮮やかにする
function boostColor(img: ImageData, sat: number, contrast: number) {
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; // 透過ピクセルは対象外
    let r = d[i], g = d[i + 1], b = d[i + 2];
    // 彩度アップ（グレーからの差を強調）
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * sat;
    g = gray + (g - gray) * sat;
    b = gray + (b - gray) * sat;
    // コントラスト（128中心）
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;
    d[i] = Math.max(0, Math.min(255, r));
    d[i + 1] = Math.max(0, Math.min(255, g));
    d[i + 2] = Math.max(0, Math.min(255, b));
  }
}

// 縁から背景をフラッドフィルで透過（内部の白/明色は保持される）
function chromaFlood(img: ImageData, bg: [number, number, number], thr: number) {
  const { width: w, height: h, data: d } = img;
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    if (!isBg(d, idx * 4, bg, thr)) return;
    visited[idx] = 1;
    stack.push(idx);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const idx = stack.pop()!;
    const x = idx % w, y = (idx / w) | 0;
    d[idx * 4 + 3] = 0; // 透過
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
}

// ========================================================================
// メイン: 全定義を処理して既存テクスチャを実画像で上書き
// ========================================================================
export function applyRealAssets(scene: Phaser.Scene): { applied: number; skipped: string[] } {
  const sheets: Partial<Record<Sheet, SheetData | null>> = {};
  const skipped: string[] = [];
  let applied = 0;
  const THR = 14;

  for (const def of ALL_DEFS) {
    if (!(def.sheet in sheets)) sheets[def.sheet] = prepareSheet(scene, def.sheet);
    const sd = sheets[def.sheet];
    if (!sd) { skipped.push(def.key); continue; }

    const [rx1, ry1, rx2, ry2] = def.r;
    const sw = rx2 - rx1, sh = ry2 - ry1;
    if (sw <= 0 || sh <= 0) { skipped.push(def.key); continue; }

    let img: ImageData;
    try {
      img = sd.ctx.getImageData(rx1, ry1, sw, sh);
    } catch {
      skipped.push(def.key);
      continue;
    }

    // 正確な境界を検出
    const tb = tightBounds(img, sd.bg, THR);
    if (!tb) { skipped.push(def.key); continue; }

    // タイト領域を取り直し
    const tw = tb.x2 - tb.x1 + 1, th = tb.y2 - tb.y1 + 1;
    const tight = sd.ctx.getImageData(rx1 + tb.x1, ry1 + tb.y1, tw, th);

    // 背景透過（タイルは矩形そのままなので不要）
    if (def.mode !== 'tile') chromaFlood(tight, sd.bg, THR);

    // 色をほんの少しだけ整える（やり過ぎるとAIっぽく不自然になるので控えめ）
    boostColor(tight, def.mode === 'tile' ? 1.08 : 1.12, def.mode === 'tile' ? 1.02 : 1.04);

    // 一時canvasへ
    const tmp = document.createElement('canvas');
    tmp.width = tw; tmp.height = th;
    tmp.getContext('2d')!.putImageData(tight, 0, 0);

    // ターゲットサイズ計算
    let dw: number, dh: number;
    if (def.mode === 'tile') {
      dw = 32; dh = 32; // タイルは32x32に引き伸ばし
    } else if (def.mode === 'logo') {
      const s = (def.size ?? 560) / tw;
      dw = Math.round(tw * s); dh = Math.round(th * s);
    } else if (def.sizeMode === 'h') {
      const s = (def.size ?? 32) / th;
      dw = Math.max(1, Math.round(tw * s)); dh = def.size ?? 32;
    } else {
      const s = (def.size ?? 32) / Math.max(tw, th);
      dw = Math.max(1, Math.round(tw * s)); dh = Math.max(1, Math.round(th * s));
    }

    // 既存（procedural）テクスチャを置き換え
    if (scene.textures.exists(def.key)) scene.textures.remove(def.key);
    const canvasTex = scene.textures.createCanvas(def.key, dw, dh);
    if (!canvasTex) { skipped.push(def.key); continue; }
    const cctx = canvasTex.getContext();
    // 高解像度の元絵をスムーズに縮小（元アセットの質感を保つ）
    cctx.imageSmoothingEnabled = true;
    (cctx as any).imageSmoothingQuality = 'high';
    cctx.drawImage(tmp, 0, 0, tw, th, 0, 0, dw, dh);
    canvasTex.refresh();
    applied++;
  }

  return { applied, skipped };
}
