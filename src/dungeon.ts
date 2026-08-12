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
  hazards: Vec2[];
  exitRoom?: Room;
  bossRoom?: Room;
  bossRoomZone?: BossRoomZone;
  bossEntrance?: Vec2;
  bossEntry?: Vec2;
}

export type BossRoomZone = 'north' | 'south' | 'east' | 'west' | 'center';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

function irand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roomAt(x: number, y: number, w: number, h: number): Room {
  return { x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) };
}

function carveCell(tiles: TileType[][], x: number, y: number) {
  if (y > 0 && y < tiles.length - 1 && x > 0 && x < tiles[0].length - 1) tiles[y][x] = 'floor';
}

function mazeCellPosition(cellX: number, cellY: number): Vec2 {
  return { x: 1 + cellX * 2, y: 1 + cellY * 2 };
}

function carveMazeCell(tiles: TileType[][], cellX: number, cellY: number) {
  const position = mazeCellPosition(cellX, cellY);
  carveCell(tiles, position.x, position.y);
}

function connectMazeCells(tiles: TileType[][], cellX: number, cellY: number, dx: number, dy: number) {
  const position = mazeCellPosition(cellX, cellY);
  if (dx === 1) {
    carveCell(tiles, position.x + 1, position.y);
  } else if (dx === -1) {
    carveCell(tiles, position.x - 1, position.y);
  } else if (dy === 1) {
    carveCell(tiles, position.x, position.y + 1);
  } else if (dy === -1) {
    carveCell(tiles, position.x, position.y - 1);
  }
}

function generateSinglePathMaze(tiles: TileType[][], columns: number, rows: number) {
  const visited = Array.from({ length: rows }, () => Array<boolean>(columns).fill(false));
  const stack: Vec2[] = [{ x: 0, y: 0 }];
  visited[0][0] = true;
  carveMazeCell(tiles, 0, 0);

  while (stack.length) {
    const current = stack[stack.length - 1];
    const choices = DIRS
      .map(([dx, dy]) => ({ x: current.x + dx, y: current.y + dy, dx, dy }))
      .filter((next) => next.x >= 0 && next.y >= 0 && next.x < columns && next.y < rows && !visited[next.y][next.x]);
    if (!choices.length) {
      stack.pop();
      continue;
    }
    const next = choices[irand(0, choices.length - 1)];
    connectMazeCells(tiles, current.x, current.y, next.dx, next.dy);
    carveMazeCell(tiles, next.x, next.y);
    visited[next.y][next.x] = true;
    stack.push({ x: next.x, y: next.y });
  }

}

function carveRoom(tiles: TileType[][], room: Room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) tiles[y][x] = 'floor';
  }
}

function carveThinCorridor(tiles: TileType[][], from: Vec2, to: Vec2) {
  for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) carveCell(tiles, x, from.y);
  for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) carveCell(tiles, to.x, y);
}

function shuffle<T>(values: T[]): T[] {
  for (let i = values.length - 1; i > 0; i--) {
    const j = irand(0, i);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

function overlapsProtectedRoom(x: number, y: number, protectedRooms: Room[], padding = 1) {
  return protectedRooms.some((room) => x >= room.x - padding && x < room.x + room.w + padding
    && y >= room.y - padding && y < room.y + room.h + padding);
}

function addPassageVariety(
  tiles: TileType[][],
  floor: number,
  start: Vec2,
  protectedRooms: Room[]
): Room[] {
  const h = tiles.length;
  const w = tiles[0].length;
  const widenedCells = new Set<string>();
  const passageCandidates: { x: number; y: number; horizontal: boolean }[] = [];

  // 元の1マス迷路の接続部を候補にし、部分的に2マス幅へ広げる。
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (tiles[y][x] === 'wall' || overlapsProtectedRoom(x, y, protectedRooms, 2)) continue;
      if (x % 2 === 0 && y % 2 === 1 && tiles[y][x - 1] !== 'wall' && tiles[y][x + 1] !== 'wall') {
        passageCandidates.push({ x, y, horizontal: true });
      }
      if (x % 2 === 1 && y % 2 === 0 && tiles[y - 1][x] !== 'wall' && tiles[y + 1][x] !== 'wall') {
        passageCandidates.push({ x, y, horizontal: false });
      }
    }
  }

  const passageTarget = Math.min(12, 6 + Math.floor(floor / 5));
  let passageCount = 0;
  for (const candidate of shuffle(passageCandidates)) {
    if (passageCount >= passageTarget) break;
    const sideChoices = shuffle([-1, 1]);
    let widened = false;
    for (const side of sideChoices) {
      const cells: Vec2[] = candidate.horizontal
        ? [
            { x: candidate.x - 1, y: candidate.y + side },
            { x: candidate.x, y: candidate.y + side },
            { x: candidate.x + 1, y: candidate.y + side }
          ]
        : [
            { x: candidate.x + side, y: candidate.y - 1 },
            { x: candidate.x + side, y: candidate.y },
            { x: candidate.x + side, y: candidate.y + 1 }
          ];
      if (cells.some((cell) => cell.x <= 0 || cell.y <= 0 || cell.x >= w - 1 || cell.y >= h - 1
        || overlapsProtectedRoom(cell.x, cell.y, protectedRooms, 1)
        || widenedCells.has(`${cell.x},${cell.y}`))) continue;
      if (cells.every((cell) => tiles[cell.y][cell.x] !== 'wall')) continue;
      for (const cell of cells) {
        carveCell(tiles, cell.x, cell.y);
        widenedCells.add(`${cell.x},${cell.y}`);
      }
      widened = true;
      break;
    }
    if (widened) passageCount++;
  }

  // 一本道の節を3×3へ広げ、短い戦闘や分岐に使える小空間を作る。
  const pocketCandidates: Vec2[] = [];
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (x % 2 === 0 || y % 2 === 0 || tiles[y][x] === 'wall') continue;
      if (Math.max(Math.abs(x - start.x), Math.abs(y - start.y)) < 5) continue;
      const room = roomAt(x - 1, y - 1, 3, 3);
      let blocked = false;
      for (let roomY = room.y; roomY < room.y + room.h && !blocked; roomY++) {
        for (let roomX = room.x; roomX < room.x + room.w; roomX++) {
          if (overlapsProtectedRoom(roomX, roomY, protectedRooms, 1)) { blocked = true; break; }
        }
      }
      if (!blocked) pocketCandidates.push({ x, y });
    }
  }

  const pocketTarget = Math.min(7, 3 + Math.floor(floor / 8));
  const pocketRooms: Room[] = [];
  for (const center of shuffle(pocketCandidates)) {
    if (pocketRooms.length >= pocketTarget) break;
    if (pocketRooms.some((room) => Math.max(Math.abs(room.cx - center.x), Math.abs(room.cy - center.y)) < 6)) continue;
    const room = roomAt(center.x - 1, center.y - 1, 3, 3);
    carveRoom(tiles, room);
    pocketRooms.push(room);
  }
  return pocketRooms;
}

function farthestReachableFloor(tiles: TileType[][], start: Vec2): Vec2 {
  const distance = tiles.map((row) => row.map(() => -1));
  const queue: Vec2[] = [start];
  let farthest = { ...start };
  distance[start.y][start.x] = 0;

  while (queue.length) {
    const current = queue.shift()!;
    if (distance[current.y][current.x] > distance[farthest.y][farthest.x]) farthest = { ...current };
    for (const [dx, dy] of DIRS) {
      const x = current.x + dx;
      const y = current.y + dy;
      if (tiles[y]?.[x] !== 'wall' && distance[y][x] === -1) {
        distance[y][x] = distance[current.y][current.x] + 1;
        queue.push({ x, y });
      }
    }
  }
  return farthest;
}

function pathToFloor(tiles: TileType[][], start: Vec2, target: Vec2): Vec2[] {
  const seen = tiles.map((row) => row.map(() => false));
  const parent = new Map<string, Vec2>();
  const queue: Vec2[] = [{ ...start }];
  seen[start.y][start.x] = true;
  while (queue.length) {
    const current = queue.shift()!;
    if (current.x === target.x && current.y === target.y) break;
    for (const [dx, dy] of DIRS) {
      const x = current.x + dx, y = current.y + dy;
      if (tiles[y]?.[x] === 'wall' || seen[y]?.[x]) continue;
      seen[y][x] = true;
      parent.set(`${x},${y}`, current);
      queue.push({ x, y });
    }
  }
  const path: Vec2[] = [];
  for (let current: Vec2 | undefined = { ...target }; current; current = parent.get(`${current.x},${current.y}`)) {
    path.push(current);
    if (current.x === start.x && current.y === start.y) break;
  }
  return path.reverse();
}

function reachableFloorsByDistance(tiles: TileType[][], start: Vec2): Vec2[] {
  const distance = tiles.map((row) => row.map(() => -1));
  const queue: Vec2[] = [{ ...start }];
  const floors: Vec2[] = [];
  distance[start.y][start.x] = 0;
  while (queue.length) {
    const current = queue.shift()!;
    floors.push(current);
    for (const [dx, dy] of DIRS) {
      const x = current.x + dx, y = current.y + dy;
      if (tiles[y]?.[x] === 'wall' || distance[y]?.[x] !== -1) continue;
      distance[y][x] = distance[current.y][current.x] + 1;
      queue.push({ x, y });
    }
  }
  return floors.sort((a, b) => distance[b.y][b.x] - distance[a.y][a.x]);
}

function nearestMazeCoordinate(value: number, origin: number, cells: number): number {
  const cell = Math.max(0, Math.min(cells - 1, Math.round((value - origin - 1) / 2)));
  return origin + 1 + cell * 2;
}

function removeUnreachableFloors(tiles: TileType[][], start: Vec2) {
  const seen = tiles.map((row) => row.map(() => false));
  const queue: Vec2[] = [{ ...start }];
  seen[start.y][start.x] = true;
  while (queue.length) {
    const current = queue.shift()!;
    for (const [dx, dy] of DIRS) {
      const x = current.x + dx, y = current.y + dy;
      if (!tiles[y]?.[x] || tiles[y][x] === 'wall' || seen[y][x]) continue;
      seen[y][x] = true;
      queue.push({ x, y });
    }
  }
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (tiles[y][x] !== 'wall' && !seen[y][x]) tiles[y][x] = 'wall';
    }
  }
}

export function generateDungeon(floor: number, _forcedBossRoomZone?: BossRoomZone): DungeonData {
  // 縦横を約√2倍にし、従来比でおよそ2倍の探索面積を確保する。
  const mazeColumns = 16 + Math.min(5, Math.floor(floor / 6));
  const mazeRows = 12 + Math.min(4, Math.floor(floor / 8));
  const mazeWidth = mazeColumns * 2 + 1;
  const hasBossRoom = floor !== 5;
  const w = mazeWidth;
  const h = mazeRows * 2 + 1;
  const tiles: TileType[][] = Array.from({ length: h }, () => Array<TileType>(w).fill('wall'));

  generateSinglePathMaze(tiles, mazeColumns, mazeRows);
  const start = { x: 1, y: 1 };
  if (floor === 1) {
    // 初期装備の赤箱まで、正面2マスの通路を必ず確保する。
    tiles[2][1] = 'floor';
    tiles[3][1] = 'floor';
  }
  const exitAnchor = farthestReachableFloor(tiles, start);
  let exitRoom: Room;
  let stairs: Vec2;
  let bossRoom: Room | undefined;
  let bossEntrance: Vec2 | undefined;
  let bossEntry: Vec2 | undefined;

  if (hasBossRoom) {
    // 最遠地点へ至る正規ルートを壊さない範囲で、いちばん奥の床を前室に選ぶ。
    // その先へ7x7部屋を増築し、入口は必ず上辺か下辺に限定する。
    let placement: { room: Room; staging: Vec2; enterFromTop: boolean } | null = null;
    for (const staging of reachableFloorsByDistance(tiles, start)) {
      if (placement) break;
      const roomX = staging.x - 3;
      if (roomX < 2 || roomX > w - 9) continue;
      const route = pathToFloor(tiles, start, staging);
      for (const enterFromTop of [true, false]) {
        const roomY = enterFromTop ? staging.y + 2 : staging.y - 8;
        if (roomY < 2 || roomY > h - 9) continue;
        const room = roomAt(roomX, roomY, 7, 7);
        const overlapsRoute = route.slice(0, -1).some((cell) => cell.x >= room.x - 1
          && cell.x <= room.x + room.w && cell.y >= room.y - 1 && cell.y <= room.y + room.h);
        if (!overlapsRoute) {
          placement = { room, staging: { ...staging }, enterFromTop };
          break;
        }
      }
    }
    if (!placement) throw new Error('中ボス部屋を迷路の最奥へ配置できませんでした。');
    bossRoom = placement.room;
    const { staging, enterFromTop } = placement;

    const entry = enterFromTop
      ? { x: bossRoom.cx, y: bossRoom.y }
      : { x: bossRoom.cx, y: bossRoom.y + bossRoom.h - 1 };
    const approach = enterFromTop
      ? { x: bossRoom.cx, y: bossRoom.y - 1 }
      : { x: bossRoom.cx, y: bossRoom.y + bossRoom.h };
    // 外周1マスを壁で閉じてから部屋を掘り直す。例外は入口の1マスだけ。
    for (let y = bossRoom.y - 1; y <= bossRoom.y + bossRoom.h; y++) {
      for (let x = bossRoom.x - 1; x <= bossRoom.x + bossRoom.w; x++) {
        const onRing = x === bossRoom.x - 1 || x === bossRoom.x + bossRoom.w
          || y === bossRoom.y - 1 || y === bossRoom.y + bossRoom.h;
        if (onRing) tiles[y][x] = 'wall';
      }
    }
    carveRoom(tiles, bossRoom);
    carveThinCorridor(tiles, staging, approach);
    tiles[staging.y][staging.x] = 'floor';
    tiles[approach.y][approach.x] = 'floor';
    tiles[entry.y][entry.x] = 'floor';

    bossEntrance = approach;
    bossEntry = entry;
    exitRoom = bossRoom;
    // 出口は見失わないよう7x7部屋の中央へ置き、中ボス撃破までは封印床として確保する。
    stairs = { x: bossRoom.cx, y: bossRoom.cy };
    tiles[stairs.y][stairs.x] = 'door';
  } else {
    // 5Fだけは従来どおり、最遠地点の出口から独立した5.5F強ボス部屋へ進む。
    exitRoom = roomAt(
      Math.max(1, Math.min(mazeWidth - 5, exitAnchor.x - 1)),
      Math.max(1, Math.min(h - 5, exitAnchor.y - 1)),
      4,
      4
    );
    carveRoom(tiles, exitRoom);
    carveThinCorridor(tiles, exitAnchor, { x: exitRoom.cx, y: exitRoom.cy });
    stairs = { x: exitRoom.cx, y: exitRoom.cy };
    tiles[stairs.y][stairs.x] = 'door';
  }

  // 7x7区画で元の一本道が分断された場合、到達不能側を壁へ戻して配置物の孤立を防ぐ。
  removeUnreachableFloors(tiles, start);

  // ボス区画と出口を保護しながら、通常探索部へ2マス通路と3x3小空間を混ぜる。
  const passageRooms = addPassageVariety(tiles, floor, start, [exitRoom]);
  removeUnreachableFloors(tiles, start);

  const hazards: Vec2[] = [];
  const hazardTypes: TileType[] = ['poison', 'cracked', 'rune', 'water'];
  const hazardCount = 3 + Math.floor(floor / 4);
  for (let i = 0; i < hazardCount; i++) {
    const x = irand(1, w - 2);
    const y = irand(1, h - 2);
    const insideExitRoom = x >= exitRoom.x && x < exitRoom.x + exitRoom.w
      && y >= exitRoom.y && y < exitRoom.y + exitRoom.h;
    const insideBossArea = bossRoom && x >= bossRoom.x - 1 && x <= bossRoom.x + bossRoom.w
      && y >= bossRoom.y - 1 && y <= bossRoom.y + bossRoom.h;
    const insideStarterPath = floor === 1 && x === 1 && y <= 3;
    if (tiles[y][x] === 'floor' && !insideExitRoom && !insideBossArea && !insideStarterPath && !(x === start.x && y === start.y)) {
      const type = hazardTypes[irand(0, hazardTypes.length - 1)];
      tiles[y][x] = type;
      if (type === 'poison' || type === 'cracked') hazards.push({ x, y });
    }
  }

  return {
    w, h, tiles, rooms: bossRoom ? [...passageRooms, bossRoom] : [...passageRooms, exitRoom], start, stairs, hazards,
    exitRoom, bossRoom, bossRoomZone: bossRoom ? 'center' : undefined, bossEntrance, bossEntry
  };
}

// 迷路と完全に分離された「N.5F」ボス専用アリーナ。
export function generateBossArena(floor: number): DungeonData {
  const isSuper = floor % 10 === 0;
  const isStrong = floor % 5 === 0;
  // 強ボス用マップも約2倍に広げ、戦闘室そのものは全体の約半分に収める。
  const w = isSuper ? 35 : isStrong ? 31 : 25;
  const h = isSuper ? 25 : isStrong ? 23 : 19;
  const tiles: TileType[][] = Array.from({ length: h }, () => Array<TileType>(w).fill('wall'));
  const roomW = isSuper ? 25 : isStrong ? 21 : 17;
  const roomH = isSuper ? 17 : isStrong ? 15 : 13;
  const bossRoom = roomAt(Math.floor((w - roomW) / 2), Math.floor((h - roomH) / 2), roomW, roomH);
  carveRoom(tiles, bossRoom);

  // 中央を広く保ち、四隅の柱だけでボス攻撃を避ける駆け引きを作る。
  const pillarInset = isSuper ? 4 : 3;
  const pillars: Vec2[] = [
    { x: bossRoom.x + pillarInset, y: bossRoom.y + pillarInset },
    { x: bossRoom.x + bossRoom.w - 1 - pillarInset, y: bossRoom.y + pillarInset },
    { x: bossRoom.x + pillarInset, y: bossRoom.y + bossRoom.h - 1 - pillarInset },
    { x: bossRoom.x + bossRoom.w - 1 - pillarInset, y: bossRoom.y + bossRoom.h - 1 - pillarInset }
  ];
  for (const pillar of pillars) tiles[pillar.y][pillar.x] = 'wall';

  const start = { x: bossRoom.cx, y: bossRoom.y + bossRoom.h - 1 };
  // 強ボス撃破後の出口は見失わないよう、部屋の完全な中央に置く。
  const stairs = { x: bossRoom.cx, y: bossRoom.cy };
  tiles[start.y][start.x] = 'floor';
  tiles[stairs.y][stairs.x] = 'door';
  return {
    w, h, tiles, rooms: [bossRoom], start, stairs, hazards: [], bossRoom,
    bossRoomZone: 'center'
  };
}

export function isWalkable(tile: TileType): boolean {
  return tile !== 'wall' && tile !== 'door';
}

export function randomFloor(dungeon: DungeonData, avoid: Vec2[] = []): Vec2 | null {
  for (let tries = 0; tries < 300; tries++) {
    const x = irand(1, dungeon.w - 2);
    const y = irand(1, dungeon.h - 2);
    const tile = dungeon.tiles[y][x];
    if (tile === 'floor' || tile === 'rune') {
      if (avoid.some((position) => position.x === x && position.y === y)) continue;
      return { x, y };
    }
  }
  return null;
}
