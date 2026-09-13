/** Painted storm-region assets. Frame variation is static and never consumes gameplay RNG. */
export const THUNDER_FLOORS = [21, 22, 23, 24, 25] as const;
export const THUNDER_PARTS = ['wall-a', 'wall-b', 'prop-1', 'prop-2', 'prop-3', 'prop-4'] as const;
export type ThunderPart = typeof THUNDER_PARTS[number];
export const THUNDER_PROP_KINDS = ['thunderProp1', 'thunderProp2', 'thunderProp3', 'thunderProp4'] as const;
export type ThunderPropKind = typeof THUNDER_PROP_KINDS[number];
export const THUNDER_TITLES = ['雷雨の石庭', '磁鉄鉱の坑道', '蒼雷の機関殿', '雷雲の祭壇', '轟雷の王庭'] as const;
export function hasThunderTerrain(floor: number) { return Number.isInteger(floor) && floor >= 21 && floor <= 25; }
export function thunderTerrainKey(floor: number, part: ThunderPart | 'floor') { return `terrain_thunder_${floor}_${part}`; }
export function thunderFloorFrame(floor: number, x: number, y: number, edge = false) {
  let hash = Math.imul(x + 37, 374761393) ^ Math.imul(y + 71, 668265263) ^ Math.imul(floor, 1274126177);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return hash % 100 < (edge ? 34 : 12) ? 2 + ((hash >>> 8) % 2) : (hash >>> 8) % 2;
}
