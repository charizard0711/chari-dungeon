export type FloorPattern = 'worn' | 'patchwork' | 'border' | 'runner' | 'mosaic' | 'fractured';
export type WallPattern = 'sparse' | 'rhythm' | 'recessed' | 'broken' | 'fortified';
export type RoomShape = 'square' | 'notched' | 'pillared' | 'cross' | 'offset';

export interface FloorLayoutProfile {
  floor: number;
  name: string;
  floorPattern: FloorPattern;
  wallPattern: WallPattern;
  roomShape: RoomShape;
  mazeLoops: number;
  mazePockets: number;
  passageWidenings: number;
  sidePockets: number;
  detailDensity: number;
  trimCoverage: number;
  wallDetailStep: number;
  seed: number;
}

// 30階を単なる乱数差にせず、各階に固定の設計意図を持たせる。
// 同じプロファイル内でも部屋位置と迷路経路は毎回変わるため、周回時の探索性は残る。
export const FLOOR_LAYOUT_PROFILES: readonly FloorLayoutProfile[] = [
  { floor: 1, name: '欠けた玄関廊', floorPattern: 'worn', wallPattern: 'sparse', roomShape: 'square', mazeLoops: 1, mazePockets: 1, passageWidenings: 5, sidePockets: 2, detailDensity: .10, trimCoverage: .42, wallDetailStep: 8, seed: 101 },
  { floor: 2, name: '継ぎ石の回廊', floorPattern: 'patchwork', wallPattern: 'rhythm', roomShape: 'notched', mazeLoops: 2, mazePockets: 1, passageWidenings: 6, sidePockets: 3, detailDensity: .12, trimCoverage: .48, wallDetailStep: 7, seed: 211 },
  { floor: 3, name: '青銅縁の広間', floorPattern: 'border', wallPattern: 'recessed', roomShape: 'offset', mazeLoops: 2, mazePockets: 2, passageWidenings: 7, sidePockets: 3, detailDensity: .13, trimCoverage: .72, wallDetailStep: 6, seed: 307 },
  { floor: 4, name: '中央帯の祭廊', floorPattern: 'runner', wallPattern: 'fortified', roomShape: 'pillared', mazeLoops: 3, mazePockets: 2, passageWidenings: 8, sidePockets: 4, detailDensity: .14, trimCoverage: .76, wallDetailStep: 5, seed: 419 },
  { floor: 5, name: '封印前庭', floorPattern: 'mosaic', wallPattern: 'fortified', roomShape: 'cross', mazeLoops: 2, mazePockets: 3, passageWidenings: 9, sidePockets: 4, detailDensity: .15, trimCoverage: .66, wallDetailStep: 4, seed: 503 },

  { floor: 6, name: '沈水補修路', floorPattern: 'patchwork', wallPattern: 'broken', roomShape: 'offset', mazeLoops: 2, mazePockets: 2, passageWidenings: 7, sidePockets: 4, detailDensity: .15, trimCoverage: .52, wallDetailStep: 6, seed: 607 },
  { floor: 7, name: '水門縁回廊', floorPattern: 'border', wallPattern: 'rhythm', roomShape: 'notched', mazeLoops: 3, mazePockets: 2, passageWidenings: 8, sidePockets: 4, detailDensity: .16, trimCoverage: .80, wallDetailStep: 5, seed: 701 },
  { floor: 8, name: '導水中央路', floorPattern: 'runner', wallPattern: 'recessed', roomShape: 'pillared', mazeLoops: 2, mazePockets: 3, passageWidenings: 10, sidePockets: 5, detailDensity: .17, trimCoverage: .82, wallDetailStep: 5, seed: 809 },
  { floor: 9, name: '沈殿石の間', floorPattern: 'worn', wallPattern: 'fortified', roomShape: 'cross', mazeLoops: 4, mazePockets: 2, passageWidenings: 8, sidePockets: 5, detailDensity: .18, trimCoverage: .58, wallDetailStep: 4, seed: 907 },
  { floor: 10, name: '水都モザイク廊', floorPattern: 'mosaic', wallPattern: 'recessed', roomShape: 'square', mazeLoops: 3, mazePockets: 3, passageWidenings: 11, sidePockets: 5, detailDensity: .18, trimCoverage: .72, wallDetailStep: 5, seed: 1009 },

  { floor: 11, name: '霜割れの小径', floorPattern: 'fractured', wallPattern: 'sparse', roomShape: 'notched', mazeLoops: 2, mazePockets: 2, passageWidenings: 6, sidePockets: 4, detailDensity: .16, trimCoverage: .44, wallDetailStep: 8, seed: 1103 },
  { floor: 12, name: '氷縁の方形廊', floorPattern: 'border', wallPattern: 'rhythm', roomShape: 'square', mazeLoops: 2, mazePockets: 3, passageWidenings: 7, sidePockets: 4, detailDensity: .17, trimCoverage: .74, wallDetailStep: 7, seed: 1201 },
  { floor: 13, name: '凍結補修区', floorPattern: 'patchwork', wallPattern: 'broken', roomShape: 'offset', mazeLoops: 3, mazePockets: 2, passageWidenings: 8, sidePockets: 5, detailDensity: .18, trimCoverage: .54, wallDetailStep: 6, seed: 1307 },
  { floor: 14, name: '白銀中央廊', floorPattern: 'runner', wallPattern: 'fortified', roomShape: 'pillared', mazeLoops: 2, mazePockets: 3, passageWidenings: 9, sidePockets: 5, detailDensity: .19, trimCoverage: .84, wallDetailStep: 5, seed: 1409 },
  { floor: 15, name: '氷晶交差殿', floorPattern: 'mosaic', wallPattern: 'recessed', roomShape: 'cross', mazeLoops: 4, mazePockets: 3, passageWidenings: 10, sidePockets: 6, detailDensity: .20, trimCoverage: .70, wallDetailStep: 4, seed: 1511 },

  { floor: 16, name: '焼け継ぎの坑道', floorPattern: 'patchwork', wallPattern: 'broken', roomShape: 'notched', mazeLoops: 3, mazePockets: 2, passageWidenings: 8, sidePockets: 4, detailDensity: .18, trimCoverage: .48, wallDetailStep: 6, seed: 1601 },
  { floor: 17, name: '炉壁の列柱廊', floorPattern: 'border', wallPattern: 'fortified', roomShape: 'pillared', mazeLoops: 2, mazePockets: 3, passageWidenings: 9, sidePockets: 5, detailDensity: .19, trimCoverage: .78, wallDetailStep: 4, seed: 1709 },
  { floor: 18, name: '溶鉱中央路', floorPattern: 'runner', wallPattern: 'rhythm', roomShape: 'offset', mazeLoops: 4, mazePockets: 2, passageWidenings: 11, sidePockets: 5, detailDensity: .20, trimCoverage: .86, wallDetailStep: 5, seed: 1801 },
  { floor: 19, name: '崩落炉床', floorPattern: 'fractured', wallPattern: 'broken', roomShape: 'cross', mazeLoops: 3, mazePockets: 3, passageWidenings: 9, sidePockets: 6, detailDensity: .22, trimCoverage: .52, wallDetailStep: 4, seed: 1907 },
  { floor: 20, name: '火冠モザイク殿', floorPattern: 'mosaic', wallPattern: 'recessed', roomShape: 'square', mazeLoops: 4, mazePockets: 3, passageWidenings: 12, sidePockets: 6, detailDensity: .21, trimCoverage: .74, wallDetailStep: 5, seed: 2011 },

  { floor: 21, name: '風化した空廊', floorPattern: 'worn', wallPattern: 'sparse', roomShape: 'offset', mazeLoops: 3, mazePockets: 2, passageWidenings: 7, sidePockets: 5, detailDensity: .18, trimCoverage: .42, wallDetailStep: 8, seed: 2101 },
  { floor: 22, name: '避雷縁回廊', floorPattern: 'border', wallPattern: 'rhythm', roomShape: 'notched', mazeLoops: 4, mazePockets: 3, passageWidenings: 9, sidePockets: 5, detailDensity: .20, trimCoverage: .82, wallDetailStep: 6, seed: 2203 },
  { floor: 23, name: '雷導補修区', floorPattern: 'patchwork', wallPattern: 'recessed', roomShape: 'pillared', mazeLoops: 3, mazePockets: 2, passageWidenings: 10, sidePockets: 6, detailDensity: .21, trimCoverage: .58, wallDetailStep: 5, seed: 2309 },
  { floor: 24, name: '稲妻中央路', floorPattern: 'runner', wallPattern: 'fortified', roomShape: 'cross', mazeLoops: 4, mazePockets: 3, passageWidenings: 12, sidePockets: 6, detailDensity: .22, trimCoverage: .88, wallDetailStep: 4, seed: 2411 },
  { floor: 25, name: '天蓋モザイク殿', floorPattern: 'mosaic', wallPattern: 'broken', roomShape: 'square', mazeLoops: 3, mazePockets: 3, passageWidenings: 11, sidePockets: 7, detailDensity: .23, trimCoverage: .76, wallDetailStep: 5, seed: 2503 },

  { floor: 26, name: '虚無の亀裂路', floorPattern: 'fractured', wallPattern: 'broken', roomShape: 'notched', mazeLoops: 4, mazePockets: 2, passageWidenings: 8, sidePockets: 5, detailDensity: .21, trimCoverage: .48, wallDetailStep: 6, seed: 2609 },
  { floor: 27, name: '深淵縁の回廊', floorPattern: 'border', wallPattern: 'recessed', roomShape: 'offset', mazeLoops: 3, mazePockets: 3, passageWidenings: 10, sidePockets: 6, detailDensity: .22, trimCoverage: .84, wallDetailStep: 5, seed: 2707 },
  { floor: 28, name: '星喰い中央路', floorPattern: 'runner', wallPattern: 'fortified', roomShape: 'pillared', mazeLoops: 5, mazePockets: 3, passageWidenings: 12, sidePockets: 6, detailDensity: .24, trimCoverage: .90, wallDetailStep: 4, seed: 2801 },
  { floor: 29, name: '終端補修区', floorPattern: 'patchwork', wallPattern: 'broken', roomShape: 'cross', mazeLoops: 4, mazePockets: 3, passageWidenings: 11, sidePockets: 7, detailDensity: .25, trimCoverage: .62, wallDetailStep: 4, seed: 2903 },
  { floor: 30, name: '奈落王の敷石殿', floorPattern: 'mosaic', wallPattern: 'fortified', roomShape: 'cross', mazeLoops: 5, mazePockets: 4, passageWidenings: 13, sidePockets: 7, detailDensity: .26, trimCoverage: .80, wallDetailStep: 3, seed: 3001 }
];

export function getFloorLayoutProfile(floor: number): FloorLayoutProfile {
  const index = Math.max(0, Math.min(FLOOR_LAYOUT_PROFILES.length - 1, Math.floor(floor) - 1));
  return FLOOR_LAYOUT_PROFILES[index];
}
