import { generateDungeon } from '../src/dungeon';
import { FLOOR_LAYOUT_PROFILES, getFloorLayoutProfile } from '../src/floorLayout';
import type { DungeonData, Room } from '../src/dungeon';
import type { TileType, Vec2 } from '../src/types';

const RUNS_PER_FLOOR = Number(process.env.QA_RUNS_PER_FLOOR ?? 120);

function key(point: Vec2) {
  return `${point.x},${point.y}`;
}

function fail(floor: number, run: number, message: string): never {
  throw new Error(`${floor}F / run ${run + 1}: ${message}`);
}

function reachable(dungeon: DungeonData) {
  const seen = new Set<string>([key(dungeon.start)]);
  const queue: Vec2[] = [{ ...dungeon.start }];
  while (queue.length) {
    const current = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const next = { x: current.x + dx, y: current.y + dy };
      const tile = dungeon.tiles[next.y]?.[next.x];
      const nextKey = key(next);
      if (!tile || tile === 'wall' || tile === 'pit' || tile === 'roomDoor' || seen.has(nextKey)) continue;
      seen.add(nextKey);
      queue.push(next);
    }
  }
  return seen;
}

function roomContains(room: Room, point: Vec2) {
  return point.x >= room.x && point.x < room.x + room.w
    && point.y >= room.y && point.y < room.y + room.h;
}

function dumpDungeon(dungeon: DungeonData, focus: Vec2) {
  const pads = new Set(dungeon.teleportPads.map(key));
  console.error(JSON.stringify({
    start: dungeon.start, stairs: dungeon.stairs, focus, bossRoomZone: dungeon.bossRoomZone,
    bossEntrance: dungeon.bossEntrance, bossEntry: dungeon.bossEntry,
    rooms: dungeon.rooms.slice(0, 5)
  }));
  for (let y = 0; y < dungeon.h; y++) {
    let row = '';
    for (let x = 0; x < dungeon.w; x++) {
      const point = { x, y };
      const tile = dungeon.tiles[y][x];
      row += x === focus.x && y === focus.y ? 'X'
        : x === dungeon.start.x && y === dungeon.start.y ? 'S'
          : pads.has(key(point)) ? 'T'
            : tile === 'wall' ? '#' : tile === 'roomDoor' ? 'R' : tile === 'door' ? 'D'
              : tile === 'pit' ? 'O' : tile === 'ice' ? 'I' : '.';
    }
    console.error(row);
  }
}

function corridorAxisAt(tiles: TileType[][], x: number, y: number): 'horizontal' | 'vertical' | null {
  const floorLike = (tile: TileType | undefined) => !!tile
    && tile !== 'wall' && tile !== 'door' && tile !== 'roomDoor' && tile !== 'pit';
  if (!floorLike(tiles[y]?.[x])) return null;
  const open = (px: number, py: number) => floorLike(tiles[py]?.[px]);
  const left = open(x - 1, y), right = open(x + 1, y);
  const up = open(x, y - 1), down = open(x, y + 1);
  if (left && right && !up && !down) return 'horizontal';
  if (up && down && !left && !right) return 'vertical';
  return null;
}

function validateIce(dungeon: DungeonData, floor: number, run: number) {
  for (let y = 1; y < dungeon.h - 1; y++) {
    for (let x = 1; x < dungeon.w - 1; x++) {
      if (dungeon.tiles[y][x] !== 'ice') continue;
      const axis = corridorAxisAt(dungeon.tiles, x, y);
      if (!axis) fail(floor, run, `氷 (${x},${y}) が曲がり角・交差点・部屋にある`);
      const [dx, dy] = axis === 'horizontal' ? [1, 0] : [0, 1];
      let before = 0, after = 0;
      for (let px = x - dx, py = y - dy; corridorAxisAt(dungeon.tiles, px, py) === axis; px -= dx, py -= dy) before++;
      for (let px = x + dx, py = y + dy; corridorAxisAt(dungeon.tiles, px, py) === axis; px += dx, py += dy) after++;
      if (before + after + 1 < 5 || before === 0 || after === 0) {
        fail(floor, run, `氷 (${x},${y}) が長い一本道の内側に収まっていない`);
      }
    }
  }
}

function validateRoomShape(dungeon: DungeonData, floor: number, run: number) {
  const profile = getFloorLayoutProfile(floor);
  const hub = dungeon.rooms[0];
  const outer = { x: hub.x, y: hub.y };
  const outerSide = { x: hub.x + 1, y: hub.y };
  const inner = { x: hub.x + 1, y: hub.y + 1 };
  const at = (point: Vec2) => dungeon.tiles[point.y][point.x];
  if (profile.roomShape === 'square' && (at(outer) === 'wall' || at(inner) === 'wall')) {
    fail(floor, run, '正方形広間に意図しない欠けがある');
  }
  if (profile.roomShape === 'notched' && at(outer) !== 'wall') fail(floor, run, '欠け角広間の角が開いている');
  if (profile.roomShape === 'pillared' && at(inner) !== 'wall') fail(floor, run, '列柱広間の内柱がない');
  if (profile.roomShape === 'cross' && (at(outer) !== 'wall' || at(outerSide) !== 'wall')) {
    fail(floor, run, '十字広間の角欠きが足りない');
  }
  if (profile.roomShape === 'offset') {
    const corners = [
      dungeon.tiles[hub.y][hub.x], dungeon.tiles[hub.y][hub.x + hub.w - 1],
      dungeon.tiles[hub.y + hub.h - 1][hub.x], dungeon.tiles[hub.y + hub.h - 1][hub.x + hub.w - 1]
    ];
    if (corners.filter((tile) => tile === 'wall').length !== 2) fail(floor, run, '非対称広間の対角欠きが崩れている');
  }
}

if (FLOOR_LAYOUT_PROFILES.length !== 30
  || FLOOR_LAYOUT_PROFILES.some((profile, index) => profile.floor !== index + 1)
  || new Set(FLOOR_LAYOUT_PROFILES.map((profile) => profile.seed)).size !== 30) {
  throw new Error('30階プロファイルが欠落または重複している');
}

let maps = 0;
let iceTiles = 0;
let pocketRooms = 0;
const roomsByFloor = new Map<number, number>();
for (let floor = 1; floor <= 30; floor++) {
  for (let run = 0; run < RUNS_PER_FLOOR; run++) {
    const dungeon = generateDungeon(floor);
    maps++;
    const seen = reachable(dungeon);
    const targets: { label: string; point: Vec2 }[] = [
      { label: '階段', point: dungeon.stairs },
      ...dungeon.teleportPads.map((point, index) => ({ label: `テレポート${index + 1}`, point }))
    ];
    if (dungeon.bossEntrance) targets.push({ label: 'ボス入口前', point: dungeon.bossEntrance });
    if (dungeon.bossEntry) targets.push({ label: 'ボス部屋内', point: dungeon.bossEntry });
    for (const target of targets) {
      if (!seen.has(key(target.point))) {
        dumpDungeon(dungeon, target.point);
        fail(floor, run, `${target.label} (${target.point.x},${target.point.y}) に到達できない`);
      }
    }
    if (dungeon.tiles[dungeon.start.y][dungeon.start.x] !== 'floor') fail(floor, run, '開始地点が通常床ではない');
    if (dungeon.teleportPads.some((pad) => pad.x === dungeon.start.x && pad.y === dungeon.start.y)) {
      fail(floor, run, '開始地点にテレポートがある');
    }
    for (const pad of dungeon.teleportPads) {
      const room = dungeon.rooms.slice(0, 5).find((candidate) => roomContains(candidate, pad));
      if (!room) fail(floor, run, `テレポート (${pad.x},${pad.y}) が主要部屋外にある`);
      const centeredEdge = (pad.x === room.cx && (pad.y === room.y || pad.y === room.y + room.h - 1))
        || (pad.y === room.cy && (pad.x === room.x || pad.x === room.x + room.w - 1));
      if (!centeredEdge) fail(floor, run, `テレポート (${pad.x},${pad.y}) が部屋端中央ではない`);
      if (pad.y === room.y) fail(floor, run, `テレポート (${pad.x},${pad.y}) が部屋上辺にある`);
    }
    if (dungeon.bossRoom) {
      for (let y = dungeon.bossRoom.y; y < dungeon.bossRoom.y + dungeon.bossRoom.h; y++) {
        for (let x = dungeon.bossRoom.x; x < dungeon.bossRoom.x + dungeon.bossRoom.w; x++) {
          if (dungeon.tiles[y][x] === 'wall') fail(floor, run, `7x7ボス部屋内 (${x},${y}) が壁で欠けている`);
        }
      }
    }
    validateRoomShape(dungeon, floor, run);
    validateIce(dungeon, floor, run);
    const floorIce = dungeon.tiles.flat().filter((tile) => tile === 'ice').length;
    const floorPockets = dungeon.rooms.filter((room) => room.w === 3 && room.h === 3).length;
    iceTiles += floorIce;
    pocketRooms += floorPockets;
    roomsByFloor.set(floor, (roomsByFloor.get(floor) ?? 0) + floorPockets);
  }
}

const pocketAverages = [...roomsByFloor.entries()].map(([floor, count]) => `${floor}F:${(count / RUNS_PER_FLOOR).toFixed(1)}`);
console.log(`OK: ${maps} maps / ${iceTiles} ice tiles / ${pocketRooms} side-pocket rooms`);
console.log(`Pocket averages: ${pocketAverages.join('  ')}`);
