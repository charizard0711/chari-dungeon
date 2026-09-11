/** Low wall paintings and matching small props approved for floors 1–5. */
export const RUIN_TERRAIN_FLOORS = [1, 2, 3, 4, 5] as const;
export const RUIN_TERRAIN_PARTS = ['wall-a', 'wall-b', 'relic', 'rubble'] as const;
export function ruinTerrainKey(floor: number, part: typeof RUIN_TERRAIN_PARTS[number]) {
  return `terrain_ruin_${floor}_${part}`;
}
export function hasRuinTerrain(floor: number) {
  return Number.isInteger(floor) && floor >= 1 && floor <= 5;
}
