import type { TileType, Vec2 } from './types';

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

export type DungeonBiome = 'ruins' | 'aqueduct' | 'frost' | 'magma' | 'storm' | 'void';
export type OptionalRoomKind = 'ambush' | 'treasure' | 'shrine' | 'hazard';

export interface OptionalRoom {
  room: Room;
  door: Vec2;
  entry: Vec2;
  kind: OptionalRoomKind;
  opened: boolean;
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
  lakeRoom?: Room;
  bossRoom?: Room;
  bossRoomZone?: BossRoomZone;
  bossEntrance?: Vec2;
  bossEntry?: Vec2;
  biome: DungeonBiome;
  optionalRooms: OptionalRoom[];
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

function carveWideCorridor(tiles: TileType[][], from: Vec2, to: Vec2, horizontalFirst = Math.random() < 0.5) {
  const carveHorizontal = (x0: number, x1: number, y: number) => {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
      carveCell(tiles, x, y);
      carveCell(tiles, x, y + 1);
    }
  };
  const carveVertical = (y0: number, y1: number, x: number) => {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) {
      carveCell(tiles, x, y);
      carveCell(tiles, x + 1, y);
    }
  };
  if (horizontalFirst) {
    carveHorizontal(from.x, to.x, from.y);
    carveVertical(from.y, to.y, to.x);
  } else {
    carveVertical(from.y, to.y, from.x);
    carveHorizontal(from.x, to.x, to.y);
  }
}

function carveMazeRegion(
  tiles: TileType[][],
  origin: Vec2,
  columns: number,
  rows: number,
  extraLoops = 2
) {
  const visited = Array.from({ length: rows }, () => Array<boolean>(columns).fill(false));
  const cellPosition = (x: number, y: number): Vec2 => ({ x: origin.x + x * 2, y: origin.y + y * 2 });
  const stack: Vec2[] = [{ x: irand(0, columns - 1), y: irand(0, rows - 1) }];
  visited[stack[0].y][stack[0].x] = true;
  const first = cellPosition(stack[0].x, stack[0].y);
  carveCell(tiles, first.x, first.y);

  while (stack.length) {
    const current = stack[stack.length - 1];
    const choices = shuffle(DIRS
      .map(([dx, dy]) => ({ x: current.x + dx, y: current.y + dy, dx, dy }))
      .filter((next) => next.x >= 0 && next.y >= 0 && next.x < columns && next.y < rows
        && !visited[next.y][next.x]));
    if (!choices.length) {
      stack.pop();
      continue;
    }
    const next = choices[0];
    const from = cellPosition(current.x, current.y);
    const to = cellPosition(next.x, next.y);
    carveCell(tiles, Math.floor((from.x + to.x) / 2), Math.floor((from.y + to.y) / 2));
    carveCell(tiles, to.x, to.y);
    visited[next.y][next.x] = true;
    stack.push({ x: next.x, y: next.y });
  }

  // 完全な一本道迷路に少数の再合流を加え、行き止まりと周回路を両方残す。
  const loopCandidates: Vec2[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const cell = cellPosition(x, y);
      if (x < columns - 1 && tiles[cell.y][cell.x + 1] === 'wall') loopCandidates.push({ x: cell.x + 1, y: cell.y });
      if (y < rows - 1 && tiles[cell.y + 1][cell.x] === 'wall') loopCandidates.push({ x: cell.x, y: cell.y + 1 });
    }
  }
  for (const connector of shuffle(loopCandidates).slice(0, extraLoops)) carveCell(tiles, connector.x, connector.y);
}

function roomsOverlap(a: Room, b: Room, padding = 1) {
  return a.x < b.x + b.w + padding && a.x + a.w + padding > b.x
    && a.y < b.y + b.h + padding && a.y + a.h + padding > b.y;
}

function roomTouchesCarvedFloor(tiles: TileType[][], room: Room, padding = 1) {
  for (let y = room.y - padding; y < room.y + room.h + padding; y++) {
    for (let x = room.x - padding; x < room.x + room.w + padding; x++) {
      if (!tiles[y]?.[x] || tiles[y][x] !== 'wall') return true;
    }
  }
  return false;
}

function nearestMainRoom(room: Room, mainRooms: Room[]): Room {
  return [...mainRooms].sort((a, b) => Math.abs(a.cx - room.cx) + Math.abs(a.cy - room.cy)
    - (Math.abs(b.cx - room.cx) + Math.abs(b.cy - room.cy)))[0];
}

function pointInRoom(point: Vec2, room: Room, padding = 0) {
  return point.x >= room.x - padding && point.x < room.x + room.w + padding
    && point.y >= room.y - padding && point.y < room.y + room.h + padding;
}

export function biomeForFloor(floor: number): DungeonBiome {
  if (floor <= 5) return 'ruins';
  if (floor <= 10) return 'aqueduct';
  if (floor <= 15) return 'frost';
  if (floor <= 20) return 'magma';
  if (floor <= 25) return 'storm';
  return 'void';
}

function optionalRoomKind(index: number, biome: DungeonBiome): OptionalRoomKind {
  const cycle: OptionalRoomKind[] = biome === 'ruins'
    ? ['treasure', 'ambush', 'shrine', 'hazard']
    : ['hazard', 'ambush', 'treasure', 'shrine'];
  return cycle[index % cycle.length];
}

function roomDoorToward(room: Room, target: Vec2): { door: Vec2; entry: Vec2; approach: Vec2 } {
  const dx = target.x - room.cx;
  const dy = target.y - room.cy;
  if (Math.abs(dx) > Math.abs(dy)) {
    const left = dx < 0;
    return {
      door: { x: left ? room.x - 1 : room.x + room.w, y: room.cy },
      entry: { x: left ? room.x : room.x + room.w - 1, y: room.cy },
      approach: { x: left ? room.x - 2 : room.x + room.w + 1, y: room.cy }
    };
  }
  const top = dy < 0;
  return {
    door: { x: room.cx, y: top ? room.y - 1 : room.y + room.h },
    entry: { x: room.cx, y: top ? room.y : room.y + room.h - 1 },
    approach: { x: room.cx, y: top ? room.y - 2 : room.y + room.h + 1 }
  };
}

function closeOptionalRoom(tiles: TileType[][], optional: OptionalRoom) {
  const { room, door, entry } = optional;
  for (let y = room.y - 1; y <= room.y + room.h; y++) {
    for (let x = room.x - 1; x <= room.x + room.w; x++) {
      const ring = x === room.x - 1 || x === room.x + room.w || y === room.y - 1 || y === room.y + room.h;
      if (ring) tiles[y][x] = 'wall';
    }
  }
  // Interior floor must exist in data, but it is never revealed until the door opens.
  // Clear any earlier corridor that happened to cross the room before sealing it.
  carveRoom(tiles, room);
  tiles[entry.y][entry.x] = 'floor';
  tiles[door.y][door.x] = 'roomDoor';
}

function buildSpaciousDungeon(floor: number, forcedBossRoomZone?: BossRoomZone): DungeonData {
  const biome = biomeForFloor(floor);
  const w = 57 + Math.min(6, Math.floor(floor / 10) * 2);
  const h = 47 + Math.min(4, Math.floor(floor / 15) * 2);
  const tiles: TileType[][] = Array.from({ length: h }, () => Array<TileType>(w).fill('wall'));
  const hasFieldBossRoom = floor % 5 !== 0;
  const needsHealingLake = floor % 5 === 0 || (floor >= 6 && floor % 3 === 0);
  const lakeSide = needsHealingLake && Math.random() < 0.5 ? 'left' : needsHealingLake ? 'right' : undefined;
  const hubCenterX = Math.floor(w / 2) + irand(-2, 2);
  const startCenterX = Math.floor(w / 2) + irand(-6, 6);
  const randomBossRoomZone = shuffle<BossRoomZone>(['west', 'north', 'east'])[0];
  const exitZone: BossRoomZone = forcedBossRoomZone === 'west' || forcedBossRoomZone === 'east'
    ? forcedBossRoomZone
    : forcedBossRoomZone === 'north' || forcedBossRoomZone === 'center'
      ? 'north'
      : randomBossRoomZone;
  const exitCenterX = exitZone === 'west'
    ? irand(7, 12)
    : exitZone === 'east'
      ? irand(w - 13, w - 8)
      : Math.floor(w / 2) + irand(-4, 4);
  const hallCenterY = Math.floor(h / 2);
  const leftHeight = lakeSide === 'left' ? 7 : 5;
  const rightHeight = lakeSide === 'right' ? 7 : 5;
  const exitSize = hasFieldBossRoom ? 7 : 5;
  const startRoom = roomAt(startCenterX - 2, h - 6, 5, 3);
  const hubRoom = roomAt(hubCenterX - 3, Math.floor(h / 2) - 2, 7, 5);
  const leftHall = roomAt(3, hallCenterY + irand(-3, 3) - Math.floor(leftHeight / 2), 7, leftHeight);
  const rightHall = roomAt(w - 10, hallCenterY + irand(-3, 3) - Math.floor(rightHeight / 2), 7, rightHeight);
  const exitRoom = roomAt(exitCenterX - Math.floor(exitSize / 2), 2, exitSize, exitSize);
  const lakeRoom = lakeSide === 'left' ? leftHall : lakeSide === 'right' ? rightHall : undefined;
  const mainRooms = [startRoom, hubRoom, leftHall, rightHall, exitRoom];
  for (const room of mainRooms) carveRoom(tiles, room);

  // 広間同士を直線で結ばず、四方向の迷路帯を必ず抜ける構成にする。
  // 小さな再合流はあるが行き止まりも残るため、地図を覚える探索感が生まれる。
  // The four maze bands now contain roughly twice as many cells as before.
  // Their room positions, entry points, exits, DFS routes, and extra loops all vary per run.
  const westMaze = { columns: 6, rows: 5 };
  const eastMaze = { columns: 6, rows: 5 };
  const northMaze = { columns: 7, rows: 5 };
  const southMaze = { columns: 7, rows: 6 };
  const westMazeOrigin = {
    x: leftHall.x + leftHall.w + 1,
    y: Math.floor((leftHall.cy + hubRoom.cy) / 2) - (westMaze.rows - 1)
  };
  const eastMazeOrigin = {
    x: hubRoom.x + hubRoom.w + 1,
    y: Math.floor((rightHall.cy + hubRoom.cy) / 2) - (eastMaze.rows - 1)
  };
  const northMazeOrigin = {
    x: Math.floor((exitRoom.cx + hubRoom.cx) / 2) - (northMaze.columns - 1),
    y: exitRoom.y + exitRoom.h + 1
  };
  const southMazeOrigin = {
    x: Math.floor((startRoom.cx + hubRoom.cx) / 2) - (southMaze.columns - 1),
    y: hubRoom.y + hubRoom.h + 1
  };
  carveMazeRegion(tiles, westMazeOrigin, westMaze.columns, westMaze.rows, irand(1, 3));
  carveMazeRegion(tiles, eastMazeOrigin, eastMaze.columns, eastMaze.rows, irand(1, 3));
  carveMazeRegion(tiles, northMazeOrigin, northMaze.columns, northMaze.rows, irand(1, 3));
  carveMazeRegion(tiles, southMazeOrigin, southMaze.columns, southMaze.rows, irand(1, 3));

  const westEntry = { x: westMazeOrigin.x, y: westMazeOrigin.y + irand(0, westMaze.rows - 1) * 2 };
  const westExit = { x: westMazeOrigin.x + (westMaze.columns - 1) * 2, y: westMazeOrigin.y + irand(0, westMaze.rows - 1) * 2 };
  const eastEntry = { x: eastMazeOrigin.x, y: eastMazeOrigin.y + irand(0, eastMaze.rows - 1) * 2 };
  const eastExit = { x: eastMazeOrigin.x + (eastMaze.columns - 1) * 2, y: eastMazeOrigin.y + irand(0, eastMaze.rows - 1) * 2 };
  const northEntry = { x: northMazeOrigin.x + irand(0, northMaze.columns - 1) * 2, y: northMazeOrigin.y };
  const northExit = { x: northMazeOrigin.x + irand(0, northMaze.columns - 1) * 2, y: northMazeOrigin.y + (northMaze.rows - 1) * 2 };
  const southEntry = { x: southMazeOrigin.x + irand(0, southMaze.columns - 1) * 2, y: southMazeOrigin.y };
  const southExit = { x: southMazeOrigin.x + irand(0, southMaze.columns - 1) * 2, y: southMazeOrigin.y + (southMaze.rows - 1) * 2 };
  carveThinCorridor(tiles, { x: leftHall.x + leftHall.w - 1, y: leftHall.cy }, westEntry);
  carveThinCorridor(tiles, westExit, { x: hubRoom.x, y: hubRoom.cy });
  carveThinCorridor(tiles, { x: hubRoom.x + hubRoom.w - 1, y: hubRoom.cy }, eastEntry);
  carveThinCorridor(tiles, eastExit, { x: rightHall.x, y: rightHall.cy });
  const exitMazeStaging = { x: exitRoom.cx, y: exitRoom.y + exitRoom.h + 1 };
  carveThinCorridor(tiles, exitMazeStaging, northEntry);
  carveThinCorridor(tiles, northExit, { x: hubRoom.cx, y: hubRoom.y });
  carveThinCorridor(tiles, { x: hubRoom.cx, y: hubRoom.y + hubRoom.h - 1 }, southEntry);
  carveThinCorridor(tiles, southExit, { x: startRoom.cx, y: startRoom.y });

  // 迷路の一部だけ3x3の小広場にして、細道だけが続く窮屈さを和らげる。
  const mazePocketCandidates = shuffle([
    roomAt(westMazeOrigin.x + 2, westMazeOrigin.y + 2, 3, 3),
    roomAt(eastMazeOrigin.x + 4, eastMazeOrigin.y + 2, 3, 3),
    roomAt(northMazeOrigin.x + 4, northMazeOrigin.y + 2, 3, 3),
    roomAt(southMazeOrigin.x + 6, southMazeOrigin.y + 4, 3, 3)
  ]);
  for (const mazePocket of mazePocketCandidates.slice(0, irand(1, 2))) carveRoom(tiles, mazePocket);
  const exitApproach = { x: exitRoom.cx, y: exitRoom.y + exitRoom.h };

  const start = { x: startRoom.cx, y: startRoom.cy };
  const stairs = { x: exitRoom.cx, y: exitRoom.cy };
  let bossRoom: Room | undefined;
  let bossEntrance: Vec2 | undefined;
  let bossEntry: Vec2 | undefined;
  if (hasFieldBossRoom) {
    bossRoom = exitRoom;
    bossEntrance = exitApproach;
    bossEntry = { x: exitRoom.cx, y: exitRoom.y + exitRoom.h - 1 };
    for (let y = exitRoom.y - 1; y <= exitRoom.y + exitRoom.h; y++) {
      for (let x = exitRoom.x - 1; x <= exitRoom.x + exitRoom.w; x++) {
        const ring = x === exitRoom.x - 1 || x === exitRoom.x + exitRoom.w
          || y === exitRoom.y - 1 || y === exitRoom.y + exitRoom.h;
        if (ring) tiles[y][x] = 'wall';
      }
    }
    carveRoom(tiles, exitRoom);
    tiles[bossEntrance.y][bossEntrance.x] = 'floor';
    tiles[bossEntry.y][bossEntry.x] = 'floor';
    tiles[stairs.y][stairs.x] = 'door';
  } else {
    tiles[exitApproach.y][exitApproach.x] = 'floor';
    tiles[exitRoom.y + exitRoom.h - 1][exitRoom.cx] = 'floor';
    tiles[stairs.y][stairs.x] = 'door';
  }

  const roomBudget = Math.min(3, 1 + Math.floor((floor - 1) / 4));
  const requestedRooms = Math.max(0, roomBudget - (hasFieldBossRoom ? 1 : 0));
  const candidates = shuffle([
    roomAt(2, 2, 5, 5),
    roomAt(w - 7, 2, 5, 5),
    roomAt(2, h - 8, 5, 5),
    roomAt(w - 7, h - 8, 5, 5),
    roomAt(2, Math.floor(h * 0.25), 5, 5),
    roomAt(w - 7, Math.floor(h * 0.25), 5, 5),
    roomAt(2, Math.floor(h * 0.68), 5, 5),
    roomAt(w - 7, Math.floor(h * 0.68), 5, 5)
  ]).filter((room) => mainRooms.every((main) => !roomsOverlap(room, main, 2))
    && !roomTouchesCarvedFloor(tiles, room, 1));
  const optionalRooms: OptionalRoom[] = [];
  for (const room of candidates) {
    if (optionalRooms.length >= requestedRooms) break;
    if (optionalRooms.some((other) => roomsOverlap(room, other.room, 3))) continue;
    const target = nearestMainRoom(room, [leftHall, rightHall, hubRoom]);
    const doorway = roomDoorToward(room, target);
    const optional: OptionalRoom = {
      room, door: doorway.door, entry: doorway.entry,
      kind: optionalRoomKind(optionalRooms.length + floor, biome), opened: false
    };
    carveWideCorridor(tiles, doorway.approach, { x: target.cx, y: target.cy });
    tiles[doorway.approach.y][doorway.approach.x] = 'floor';
    closeOptionalRoom(tiles, optional);
    optionalRooms.push(optional);
  }

  const hazards: Vec2[] = [];
  const hazardByBiome: Record<DungeonBiome, TileType[]> = {
    ruins: [], aqueduct: ['water', 'poison'], frost: ['ice'],
    magma: ['lava'], storm: ['lightning'], void: ['voidRift', 'pit']
  };
  const protectedRooms = optionalRooms.map((optional) => optional.room);
  const hazardCount = 8 + Math.floor(floor / 3);
  let placed = 0;
  for (let tries = 0; tries < hazardCount * 20 && placed < hazardCount; tries++) {
    const x = irand(2, w - 3), y = irand(2, h - 3);
    if (tiles[y][x] !== 'floor' || Math.abs(x - hubRoom.cx) <= 1
      || x === hubRoom.cx || x === hubRoom.cx + 1
      || pointInRoom({ x, y }, startRoom, 1) || pointInRoom({ x, y }, exitRoom, 1)
      || protectedRooms.some((room) => pointInRoom({ x, y }, room, 1))) continue;
    const biomeHazards = hazardByBiome[biome];
    if (!biomeHazards.length) break;
    const type = biomeHazards[irand(0, biomeHazards.length - 1)];
    tiles[y][x] = type;
    if (type !== 'water' && type !== 'rune') hazards.push({ x, y });
    placed++;
  }

  return {
    w, h, tiles, rooms: [...mainRooms, ...optionalRooms.map((optional) => optional.room)],
    start, stairs, hazards, exitRoom, lakeRoom, bossRoom, bossEntrance, bossEntry,
    bossRoomZone: bossRoom ? exitZone : undefined, biome, optionalRooms
  };
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
  return buildSpaciousDungeon(floor, _forcedBossRoomZone);
  /* Legacy maze generator kept below temporarily as a reference while the spacious generator settles.
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
  */
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
    bossRoomZone: 'center', biome: biomeForFloor(floor), optionalRooms: []
  };
}

export function isWalkable(tile: TileType): boolean {
  return tile !== 'wall' && tile !== 'door' && tile !== 'roomDoor';
}

export function randomFloor(dungeon: DungeonData, avoid: Vec2[] = []): Vec2 | null {
  for (let tries = 0; tries < 300; tries++) {
    const x = irand(1, dungeon.w - 2);
    const y = irand(1, dungeon.h - 2);
    const tile = dungeon.tiles[y][x];
    if (tile === 'floor' || tile === 'rune') {
      if (dungeon.optionalRooms.some((optional) => !optional.opened && pointInRoom({ x, y }, optional.room))) continue;
      if (avoid.some((position) => position.x === x && position.y === y)) continue;
      return { x, y };
    }
  }
  return null;
}
