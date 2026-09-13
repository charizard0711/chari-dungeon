import { thunderFloorFrame } from './thunderTerrain';
export { hasFinalDepthTerrain } from './finalDepthBosses';
export const FINAL_DEPTH_FLOORS = [26, 27, 28, 29, 30] as const;
export const FINAL_DEPTH_TITLES = ['深海の祭壇', '獄炎の鍛冶宮', '氷華の宮殿', '虚空の回廊', '万象の竜座'] as const;
export const FINAL_DEPTH_COLORS = [0x66c6d5, 0xf5a46e, 0x9cddef, 0xba9adb, 0xdfc68e] as const;
export type FinalDepthPart = 'wall-a' | 'wall-b' | 'prop-1' | 'prop-2' | 'prop-3' | 'prop-4' | 'prop-5' | 'prop-6' | 'prop-7';
export type FinalDepthPropKind = 'finalProp1' | 'finalProp2' | 'finalProp3' | 'finalProp4' | 'finalProp5' | 'finalProp6' | 'finalProp7';
export function finalDepthParts(floor: number): FinalDepthPart[] { return ['wall-a', 'wall-b', ...Array.from({ length: floor === 30 ? 7 : 4 }, (_, i) => `prop-${i+1}`)] as FinalDepthPart[]; }
export function finalDepthPropKinds(floor: number): FinalDepthPropKind[] { return Array.from({ length: floor === 30 ? 7 : 4 }, (_, i) => `finalProp${i+1}`) as FinalDepthPropKind[]; }
export function finalDepthTerrainKey(floor: number, part: FinalDepthPart | 'floor') { return `terrain_final_${floor}_${part}`; }
export const finalDepthFloorFrame = thunderFloorFrame;
