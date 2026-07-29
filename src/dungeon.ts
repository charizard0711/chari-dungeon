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

function irand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roomAt(x: number, y: number, w: number, h: number): Room {
  return { x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) };
}

function carveRoom(tiles: TileType[][], room: Room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) tiles[y][x] = 'floor';
  }
}

function roomsOverlap(a: Room, b: Room, margin = 1): boolean {
  return a.x - margin < b.x + b.w
    && a.x + a.w + margin > b.x
    && a.y - margin < b.y + b.h
    && a.y + a.h + margin > b.y;
}

function carveCell(tiles: TileType[][], x: number, y: number) {
  if (y > 0 && y < tiles.length - 1 && x > 0 && x < tiles[0].length - 1) tiles[y][x] = 'floor';
}

// Two cells wide through the open dungeon, so corridors read as paths rather than a block maze.
function carveWideCorridor(tiles: TileType[][], from: Vec2, to: Vec2) {
  const horizontalFirst = Math.random() < 0.5;
  const horizontal = (x1: number, x2: number, y: number) => {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
      carveCell(tiles, x, y);
      carveCell(tiles, x, y + 1);
    }
  };
  const vertical = (y1: number, y2: number, x: number) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      carveCell(tiles, x, y);
      carveCell(tiles, x + 1, y);
    }
  };

  if (horizontalFirst) {
    horizontal(from.x, to.x, from.y);
    vertical(from.y, to.y, to.x);
  } else {
    vertical(from.y, to.y, from.x);
    horizontal(from.x, to.x, to.y);
  }
}

// Boss approaches stay one cell wide so the arena has exactly one entrance.
function carveThinCorridor(tiles: TileType[][], from: Vec2, to: Vec2) {
  for (let x = Math.min(from.x, to.x); x <= Math.max(from.x, to.x); x++) carveCell(tiles, x, from.y);
  for (let y = Math.min(from.y, to.y); y <= Math.max(from.y, to.y); y++) carveCell(tiles, to.x, y);
}

function roomDistance(a: Room, b: Room): number {
  return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
}

function connectRooms(tiles: TileType[][], rooms: Room[]) {
  if (rooms.length < 2) return;
  const connected = [rooms[0]];
  const pending = rooms.slice(1);

  // A small minimum-spanning tree keeps every room reachable without producing maze-like clutter.
  while (pending.length) {
    let bestConnected = connected[0];
    let bestPendingIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const source of connected) {
      for (let i = 0; i < pending.length; i++) {
        const distance = roomDistance(source, pending[i]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestConnected = source;
          bestPendingIndex = i;
        }
      }
    }
    const next = pending.splice(bestPendingIndex, 1)[0];
    carveWideCorridor(tiles, bestConnected, next);
    connected.push(next);
  }

  // One optional loop makes backtracking less rigid while keeping the layout readable.
  if (rooms.length >= 4) {
    const a = rooms[irand(0, rooms.length - 1)];
    let b = rooms[irand(0, rooms.length - 1)];
    if (a === b) b = rooms[(rooms.indexOf(a) + 2) % rooms.length];
    carveWideCorridor(tiles, a, b);
  }
}

export function generateDungeon(floor: number): DungeonData {
  const isBossFloor = floor % 2 === 0 || floor % 5 === 0;
  const w = 27 + Math.min(3, Math.floor(floor / 8)) * 2;
  const h = 19 + Math.min(2, Math.floor(floor / 10)) * 2;
  const tiles: TileType[][] = Array.from({ length: h }, () => Array<TileType>(w).fill('wall'));

  // Reserve the right-hand arena before placing normal rooms.
  const bossRoom = isBossFloor ? roomAt(w - 8, Math.floor((h - 6) / 2), 6, 6) : undefined;
  const normalRightEdge = bossRoom ? bossRoom.x - 3 : w - 2;
  const rooms: Room[] = [];
  const targetRooms = Math.min(8, (isBossFloor ? 5 : 6) + Math.floor(floor / 10));

  for (let attempt = 0; attempt < 420 && rooms.length < targetRooms; attempt++) {
    const rw = irand(4, 7);
    const rh = irand(4, 6);
    const maxX = normalRightEdge - rw + 1;
    if (maxX < 1) break;
    const candidate = roomAt(irand(1, maxX), irand(1, h - rh - 1), rw, rh);
    if (rooms.some((room) => roomsOverlap(candidate, room, 1))) continue;
    rooms.push(candidate);
    carveRoom(tiles, candidate);
  }

  // Random placement is intentionally varied, but always guarantee a useful playable layout.
  const fallbacks = [
    roomAt(2, 2, 5, 4),
    roomAt(2, h - 7, 5, 5),
    roomAt(Math.max(9, normalRightEdge - 6), 2, 5, 5),
    roomAt(Math.max(9, normalRightEdge - 6), h - 7, 5, 5)
  ];
  for (const fallback of fallbacks) {
    if (rooms.length >= 4) break;
    if (fallback.x + fallback.w >= normalRightEdge + 2) continue;
    if (rooms.some((room) => roomsOverlap(fallback, room, 1))) continue;
    rooms.push(fallback);
    carveRoom(tiles, fallback);
  }

  connectRooms(tiles, rooms);

  let stairs: Vec2;
  if (bossRoom) {
    carveRoom(tiles, bossRoom);
    const entrance = { x: bossRoom.x, y: bossRoom.cy };
    const approach = { x: bossRoom.x - 1, y: bossRoom.cy };
    const staging = { x: bossRoom.x - 2, y: bossRoom.cy };
    const source = rooms.reduce((nearest, room) => (
      roomDistance(room, bossRoom) < roomDistance(nearest, bossRoom) ? room : nearest
    ), rooms[0]);
    carveThinCorridor(tiles, source, staging);

    // Rebuild the one-cell wall ring after corridor carving, leaving only the entrance open.
    for (let y = bossRoom.y - 1; y <= bossRoom.y + bossRoom.h; y++) {
      for (let x = bossRoom.x - 1; x <= bossRoom.x + bossRoom.w; x++) {
        const onRing = x === bossRoom.x - 1 || x === bossRoom.x + bossRoom.w
          || y === bossRoom.y - 1 || y === bossRoom.y + bossRoom.h;
        if (onRing && !(x === approach.x && y === approach.y)) tiles[y][x] = 'wall';
      }
    }
    tiles[entrance.y][entrance.x] = 'floor';
    tiles[approach.y][approach.x] = 'floor';
    tiles[staging.y][staging.x] = 'floor';
    rooms.push(bossRoom);
    stairs = { x: bossRoom.x + bossRoom.w - 2, y: bossRoom.cy };
  } else {
    const startRoom = rooms[0];
    const farthestRoom = rooms.reduce((farthest, room) => (
      roomDistance(room, startRoom) > roomDistance(farthest, startRoom) ? room : farthest
    ), rooms[rooms.length - 1]);
    stairs = { x: farthestRoom.cx, y: farthestRoom.cy };
  }

  const startRoom = rooms[0];
  const start = { x: startRoom.cx, y: startRoom.cy };
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
