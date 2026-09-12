/** Low wall paintings and matching small props approved for floors 1–5. */
export const RUIN_TERRAIN_FLOORS = [1, 2, 3, 4, 5] as const;
export const RUIN_TERRAIN_PARTS = ['wall-a', 'wall-b', 'relic', 'rubble'] as const;
export function ruinTerrainKey(floor: number, part: typeof RUIN_TERRAIN_PARTS[number]) {
  return `terrain_ruin_${floor}_${part}`;
}
export function hasRuinTerrain(floor: number) {
  return Number.isInteger(floor) && floor >= 1 && floor <= 5;
}

export const RUIN_FLOOR_FRAME_SIZE = 64;
export function ruinFloorKey(floor: number) {
  return `terrain_ruin_floor_${floor}`;
}

/** Stable variation without consuming gameplay RNG or creating animated tiles. */
export function ruinFloorFrame(floor: number, x: number, y: number, edge = false) {
  let hash = Math.imul(x + 37, 374761393) ^ Math.imul(y + 71, 668265263) ^ Math.imul(floor, 1274126177);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return hash % 100 < (edge ? 32 : 12) ? 4 + ((hash >>> 8) % 2) : (hash >>> 8) % 4;
}
