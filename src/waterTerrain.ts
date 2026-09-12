/** Static painted water ruins. Visual variation never consumes gameplay RNG. */
export const WATER_FLOORS = [6, 7, 8, 9, 10] as const;
export const WATER_PARTS = ['wall-a', 'wall-b', 'prop-1', 'prop-2', 'prop-3', 'prop-4'] as const;
export type WaterPart = typeof WATER_PARTS[number];
export const WATER_PROP_KINDS = ['waterProp1', 'waterProp2', 'waterProp3', 'waterProp4'] as const;
export type WaterPropKind = typeof WATER_PROP_KINDS[number];
export const WATER_TITLES = ['苔むす地下水路', '根絡みの水路', '水鏡の魔術神殿', '沈んだ砦', '蒼潮の大水門'] as const;
export function hasWaterTerrain(floor: number) { return Number.isInteger(floor) && floor >= 6 && floor <= 10; }
export function waterTerrainKey(floor: number, part: WaterPart | 'floor') { return `terrain_water_${floor}_${part}`; }
export function waterFloorFrame(floor: number, x: number, y: number, edge = false) {
  let hash = Math.imul(x + 37, 374761393) ^ Math.imul(y + 71, 668265263) ^ Math.imul(floor, 1274126177);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return hash % 100 < (edge ? 34 : 12) ? 2 + ((hash >>> 8) % 2) : (hash >>> 8) % 2;
}
