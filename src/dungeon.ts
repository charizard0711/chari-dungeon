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
  bossRoom?: Room;
}

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

export function generateDungeon(floor: number): DungeonData {
  const isBossFloor = floor % 2 === 0 || floor % 5 === 0;
  const mazeColumns = 11 + Math.min(4, Math.floor(floor / 6));
  const mazeRows = 8 + Math.min(3, Math.floor(floor / 8));
  const mazeWidth = mazeColumns * 2 + 1;
  const w = mazeWidth + (isBossFloor ? 8 : 0);
  const h = mazeRows * 2 + 1;
  const tiles: TileType[][] = Array.from({ length: h }, () => Array<TileType>(w).fill('wall'));

  // Normal floors are a classic one-tile-wide maze. Only boss floors get a room.
  generateSinglePathMaze(tiles, mazeColumns, mazeRows);

  const start = { x: 1, y: 1 };
  const rooms: Room[] = [];
  let bossRoom: Room | undefined;
  let stairs: Vec2;

  if (isBossFloor) {
    bossRoom = roomAt(mazeWidth, Math.floor((h - 6) / 2), 6, 6);
    carveRoom(tiles, bossRoom);

    const entrance = { x: bossRoom.x, y: bossRoom.cy };
    const approach = { x: bossRoom.x - 1, y: bossRoom.cy };
    const staging = { x: bossRoom.x - 2, y: bossRoom.cy };
    const sourceRow = Math.max(0, Math.min(mazeRows - 1, Math.round((bossRoom.cy - 1) / 2)));
    const source = { x: staging.x, y: mazeCellPosition(mazeColumns - 1, sourceRow).y };
    carveThinCorridor(tiles, source, staging);

    // Seal the arena perimeter again and leave exactly one entrance on the left.
    for (let y = bossRoom.y - 1; y <= bossRoom.y + bossRoom.h; y++) {
      for (let x = bossRoom.x - 1; x <= bossRoom.x + bossRoom.w; x++) {
        const onRing = x === bossRoom.x - 1 || x === bossRoom.x + bossRoom.w
          || y === bossRoom.y - 1 || y === bossRoom.y + bossRoom.h;
        if (onRing && !(x === approach.x && y === approach.y)) tiles[y][x] = 'wall';
      }
    }
    tiles[staging.y][staging.x] = 'floor';
    tiles[approach.y][approach.x] = 'floor';
    tiles[entrance.y][entrance.x] = 'floor';
    rooms.push(bossRoom);
    stairs = { x: bossRoom.x + bossRoom.w - 2, y: bossRoom.cy };
  } else {
    stairs = farthestReachableFloor(tiles, start);
  }

  tiles[stairs.y][stairs.x] = 'stairs';

  const hazards: Vec2[] = [];
  const hazardTypes: TileType[] = ['poison', 'cracked', 'rune', 'water'];
  const hazardCount = 3 + Math.floor(floor / 4);
  for (let i = 0; i < hazardCount; i++) {
    const x = irand(1, w - 2);
    const y = irand(1, h - 2);
    if (bossRoom && x >= bossRoom.x && x < bossRoom.x + bossRoom.w && y >= bossRoom.y && y < bossRoom.y + bossRoom.h) continue;
    if (tiles[y][x] === 'floor' && !(x === start.x && y === start.y)) {
      const type = hazardTypes[irand(0, hazardTypes.length - 1)];
      tiles[y][x] = type;
      if (type === 'poison' || type === 'cracked') hazards.push({ x, y });
    }
  }

  return { w, h, tiles, rooms, start, stairs, hazards, bossRoom };
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
