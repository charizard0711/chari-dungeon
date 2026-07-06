import type { TileType, Vec2 } from './types';

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

export interface DungeonData {
  w: number;
  h: number;
  tiles: TileType[][];      // [y][x]
  rooms: Room[];
  start: Vec2;
  stairs: Vec2;
  hazards: Vec2[];          // 毒床/落とし穴などのハザード位置
}

function irand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 狭い迷路型マップ：1マス幅の道が中心。部屋はごく小さいものが少しだけ。
export function generateDungeon(floor: number): DungeonData {
  // 迷路のセル数（深い階ほど少しだけ広くなる）
  const cw = 11 + Math.min(4, Math.floor(floor / 6));
  const ch = 8 + Math.min(3, Math.floor(floor / 8));
  const w = cw * 2 + 1;
  const h = ch * 2 + 1;

  const tiles: TileType[][] = [];
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    for (let x = 0; x < w; x++) tiles[y][x] = 'wall';
  }

  // ---- 迷路生成（穴掘り法：奇数マスをセルとして掘り進む）----
  const visited: boolean[][] = [];
  for (let y = 0; y < ch; y++) {
    visited[y] = [];
    for (let x = 0; x < cw; x++) visited[y][x] = false;
  }
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const stack: Vec2[] = [{ x: 0, y: 0 }];
  visited[0][0] = true;
  tiles[1][1] = 'floor';
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const cand = DIRS
      .map(([dx, dy]) => ({ x: cur.x + dx, y: cur.y + dy, dx, dy }))
      .filter((c) => c.x >= 0 && c.y >= 0 && c.x < cw && c.y < ch && !visited[c.y][c.x]);
    if (cand.length === 0) { stack.pop(); continue; }
    const n = cand[irand(0, cand.length - 1)];
    visited[n.y][n.x] = true;
    tiles[cur.y * 2 + 1 + n.dy][cur.x * 2 + 1 + n.dx] = 'floor'; // 間の壁を抜く
    tiles[n.y * 2 + 1][n.x * 2 + 1] = 'floor';
    stack.push({ x: n.x, y: n.y });
  }

  // ---- ループ路：壁を少しだけ抜いて行き止まりだらけにしない ----
  const extra = Math.floor(cw * ch * 0.14);
  for (let i = 0; i < extra; i++) {
    const x = irand(1, w - 2);
    const y = irand(1, h - 2);
    if (tiles[y][x] !== 'wall') continue;
    const horiz = tiles[y][x - 1] !== 'wall' && tiles[y][x + 1] !== 'wall';
    const vert = tiles[y - 1][x] !== 'wall' && tiles[y + 1][x] !== 'wall';
    if (horiz || vert) tiles[y][x] = 'floor';
  }

  // ---- ごく小さい部屋（3x3）を1〜2個だけ（宝箱や休憩ポイント用）----
  // 3x3はどこに置いても必ず迷路の通路と重なるので接続の心配はない
  const rooms: Room[] = [];
  const roomCount = irand(1, 2);
  for (let i = 0; i < roomCount; i++) {
    const rx = irand(1, w - 4);
    const ry = irand(1, h - 4);
    for (let y = ry; y < ry + 3; y++) for (let x = rx; x < rx + 3; x++) tiles[y][x] = 'floor';
    rooms.push({ x: rx, y: ry, w: 3, h: 3, cx: rx + 1, cy: ry + 1 });
  }

  // ---- スタートと階段（BFSで一番遠い床に階段＝探索しがいを出す）----
  const start = { x: 1, y: 1 };
  const dist: number[][] = [];
  for (let y = 0; y < h; y++) { dist[y] = []; for (let x = 0; x < w; x++) dist[y][x] = -1; }
  dist[start.y][start.x] = 0;
  const queue: Vec2[] = [start];
  let stairs = { x: 1, y: 1 };
  let best = 0;
  while (queue.length) {
    const c = queue.shift()!;
    if (dist[c.y][c.x] > best) { best = dist[c.y][c.x]; stairs = { x: c.x, y: c.y }; }
    for (const [dx, dy] of DIRS) {
      const nx = c.x + dx, ny = c.y + dy;
      if (tiles[ny]?.[nx] !== 'wall' && dist[ny][nx] === -1) {
        dist[ny][nx] = dist[c.y][c.x] + 1;
        queue.push({ x: nx, y: ny });
      }
    }
  }
  tiles[stairs.y][stairs.x] = 'stairs';

  // ---- ハザード配置（毒床・ひび割れ・ルーン・水）----
  const hazards: Vec2[] = [];
  const hazardTypes: TileType[] = ['poison', 'cracked', 'rune', 'water'];
  const hazardCount = 3 + Math.floor(floor / 4);
  for (let i = 0; i < hazardCount; i++) {
    const x = irand(1, w - 2);
    const y = irand(1, h - 2);
    if (tiles[y][x] === 'floor' && !(x === start.x && y === start.y)) {
      const t = hazardTypes[irand(0, hazardTypes.length - 1)];
      tiles[y][x] = t;
      if (t === 'poison' || t === 'cracked') hazards.push({ x, y });
    }
  }

  return { w, h, tiles, rooms, start, stairs, hazards };
}

export function isWalkable(t: TileType): boolean {
  return t !== 'wall';
}

// ランダムな床タイル位置を返す（迷路の通路も含めた全床から選ぶ）
export function randomFloor(d: DungeonData, avoid: Vec2[] = []): Vec2 | null {
  for (let tries = 0; tries < 300; tries++) {
    const x = irand(1, d.w - 2);
    const y = irand(1, d.h - 2);
    const t = d.tiles[y][x];
    if (t === 'floor' || t === 'rune') {
      if (avoid.some((a) => a.x === x && a.y === y)) continue;
      return { x, y };
    }
  }
  return null;
}
