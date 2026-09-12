/** Painted, static volcano assets. Variation never consumes gameplay RNG. */
export const VOLCANO_FLOORS = [16, 17, 18, 19, 20] as const;
export const VOLCANO_PARTS = ['wall-a', 'wall-b', 'prop-1', 'prop-2', 'prop-3', 'prop-4'] as const;
export type VolcanoPart = typeof VOLCANO_PARTS[number];
export const VOLCANO_PROP_KINDS = ['volcanoProp1', 'volcanoProp2', 'volcanoProp3', 'volcanoProp4'] as const;
export type VolcanoPropKind = typeof VOLCANO_PROP_KINDS[number];
export function hasVolcanoTerrain(floor: number) { return Number.isInteger(floor) && floor >= 16 && floor <= 20; }
export function volcanoTerrainKey(floor: number, part: VolcanoPart | 'floor') { return `terrain_volcano_${floor}_${part}`; }
export function volcanoFloorFrame(floor: number, x: number, y: number, edge = false) {
  let hash = Math.imul(x + 37, 374761393) ^ Math.imul(y + 71, 668265263) ^ Math.imul(floor, 1274126177);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  hash = (hash ^ (hash >>> 16)) >>> 0;
  return hash % 100 < (edge ? 34 : 12) ? 2 + ((hash >>> 8) % 2) : (hash >>> 8) % 2;
}
