import type { Dir } from './types';

export interface MonsterDirectionArt {
  readonly monsterKey: string;
  readonly textureKey: string;
  readonly path: string;
  readonly originY?: number;
  readonly frameSize: number;
  readonly artSize: number;
}

export const EMBER_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_ember_drake',
  textureKey: 'ember_directions_v1',
  path: 'assets/monsters/directional/ember-directions-v1.png',
  frameSize: 128,
  artSize: 120
};

export const FROST_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_frost_wyrm',
  textureKey: 'frost_directions_v1',
  path: 'assets/monsters/directional/frost-directions-v1.png',
  frameSize: 128,
  artSize: 120
};

export const STORM_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_storm_wyvern',
  textureKey: 'storm_directions_v1',
  path: 'assets/monsters/directional/storm-directions-v1.png',
  frameSize: 128,
  artSize: 120
};

export const BRASS_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_brass_dragon',
  textureKey: 'brass_directions_v1',
  path: 'assets/monsters/directional/brass-directions-v1.png',
  frameSize: 128,
  artSize: 120
};

export const AURELIUS_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_archdemon',
  textureKey: 'aurelius_directions_v1',
  path: 'assets/monsters/directional/aurelius-directions-v1.png',
  frameSize: 128,
  artSize: 120
};

export const BONE_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_bone_dragon',
  textureKey: 'bone_directions_v1',
  path: 'assets/monsters/directional/bone-directions-v1.png',
  frameSize: 128,
  artSize: 120
};

export const HYDRA_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_hydra',
  textureKey: 'hydra_directions_v1',
  path: 'assets/monsters/directional/hydra-directions-v1.png',
  frameSize: 128,
  artSize: 120
};

export const BLACK_MAGE_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_black_mage', textureKey: 'black_mage_directions_v1',
  path: 'assets/monsters/directional/black-mage-directions-v1.png', frameSize: 128, artSize: 120
};

export const RIVAL_MALE_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_rival_male', textureKey: 'rival_male_directions_v1',
  path: 'assets/monsters/directional/rival-male-directions-v1.png', frameSize: 128, artSize: 120
};

export const RIVAL_FEMALE_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_rival_female', textureKey: 'rival_female_directions_v1',
  path: 'assets/monsters/directional/rival-female-directions-v1.png', frameSize: 128, artSize: 120
};

export const BISON_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_horn_demon', textureKey: 'bison_directions_v1',
  path: 'assets/monsters/directional/bison-directions-v1.png', frameSize: 128, artSize: 120
};

export const SERAPH_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_silver_seraph', textureKey: 'seraph_directions_v1',
  path: 'assets/monsters/directional/seraph-directions-v1.png', frameSize: 128, artSize: 120
};
export const ABYSS_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_abyss_dragon', textureKey: 'abyss_directions_v1',
  path: 'assets/monsters/directional/abyss-directions-v1.png', frameSize: 128, artSize: 120
};
export const ICE_KNIGHT_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_ice_knight', textureKey: 'ice_knight_directions_v1',
  path: 'assets/monsters/directional/ice-knight-directions-v1.png', frameSize: 128, artSize: 120
};
export const THUNDER_SOVEREIGN_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_thunder_sovereign', textureKey: 'thunder_sovereign_directions_v1',
  path: 'assets/monsters/directional/thunder-sovereign-directions-v1.png', frameSize: 128, artSize: 120
};
export const TITAN_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_bone_colossus', textureKey: 'titan_directions_v1',
  path: 'assets/monsters/directional/titan-directions-v1.png', frameSize: 128, artSize: 120
};

export const FALLEN_ANGEL_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_fallen_angel', textureKey: 'fallen_angel_volcano_v1',
  path: 'assets/monsters/directional/fallen-angel-volcano-v1.png', frameSize: 128, artSize: 120
};

export const PHOENIX_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_phoenix', textureKey: 'phoenix_volcano_v1',
  path: 'assets/monsters/directional/phoenix-volcano-v1.png', frameSize: 128, artSize: 120
};
export const UNICORN_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_unicorn', textureKey: 'unicorn_volcano_v1',
  path: 'assets/monsters/directional/unicorn-volcano-v1.png', frameSize: 128, artSize: 120
};
export const BONE_REAPER_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_bone_reaper', textureKey: 'bone_reaper_volcano_v1',
  path: 'assets/monsters/directional/bone-reaper-volcano-v1.png', frameSize: 128, artSize: 120
};
export const ICE_BEHEMOTH_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_ice_behemoth', textureKey: 'ice_behemoth_directions_v1',
  path: 'assets/monsters/directional/ice-behemoth-directions-v1.png', frameSize: 128, artSize: 120
};

export const VALGRADO_DIRECTIONS: MonsterDirectionArt = {
  monsterKey: 'm_valgrado', textureKey: 'valgrado_directions_v1',
  path: 'assets/monsters/directional/valgrado-directions-v1.png', frameSize: 128, artSize: 120
};

export const FINAL_DEPTH_DIRECTIONS: readonly MonsterDirectionArt[] = ['deep_kraken', 'valzeon', 'selene', 'abyss_lord', 'astravein'].map((name, i) => ({
  monsterKey: `m_${name}`, textureKey: `m_${name}_directions_v1`, path: `assets/monsters/directional/${name}-directions-v1.png`,
  frameSize: i === 4 ? 256 : 128, artSize: i === 4 ? 240 : 120, originY: i === 4 ? .76 : .6
}));
export const THUNDER_DIRECTIONS: readonly MonsterDirectionArt[] = [
  { monsterKey: 'm_voltyrex', textureKey: 'm_voltyrex_directions_v1', path: 'assets/monsters/directional/voltyrex-directions-v1.png', frameSize: 128, artSize: 120 },
  { monsterKey: 'm_spark_beetle', textureKey: 'm_spark_beetle_directions_v1', path: 'assets/monsters/directional/spark_beetle-directions-v1.png', frameSize: 128, artSize: 120 },
  { monsterKey: 'm_galvan', textureKey: 'm_galvan_directions_v1', path: 'assets/monsters/directional/galvan-directions-v1.png', frameSize: 128, artSize: 120 },
  { monsterKey: 'm_amatsuchi', textureKey: 'm_amatsuchi_directions_v1', path: 'assets/monsters/directional/amatsuchi-directions-v1.png', frameSize: 128, artSize: 120 },
  { monsterKey: 'm_raiga', textureKey: 'm_raiga_directions_v1', path: 'assets/monsters/directional/raiga-directions-v1.png', frameSize: 128, artSize: 120 },
];

export const DIRECTIONAL_MONSTERS: readonly MonsterDirectionArt[] = [EMBER_DIRECTIONS, FROST_DIRECTIONS, STORM_DIRECTIONS, BRASS_DIRECTIONS, AURELIUS_DIRECTIONS, BONE_DIRECTIONS, HYDRA_DIRECTIONS, BLACK_MAGE_DIRECTIONS, RIVAL_MALE_DIRECTIONS, RIVAL_FEMALE_DIRECTIONS, BISON_DIRECTIONS, SERAPH_DIRECTIONS, ABYSS_DIRECTIONS, ICE_KNIGHT_DIRECTIONS, THUNDER_SOVEREIGN_DIRECTIONS, TITAN_DIRECTIONS, FALLEN_ANGEL_DIRECTIONS, PHOENIX_DIRECTIONS, UNICORN_DIRECTIONS, BONE_REAPER_DIRECTIONS, ICE_BEHEMOTH_DIRECTIONS, VALGRADO_DIRECTIONS, ...THUNDER_DIRECTIONS, ...FINAL_DEPTH_DIRECTIONS];

const FLOOR_DIRECTION_ART = [EMBER_DIRECTIONS, FROST_DIRECTIONS, STORM_DIRECTIONS, BRASS_DIRECTIONS,
  AURELIUS_DIRECTIONS, BONE_DIRECTIONS, HYDRA_DIRECTIONS, BLACK_MAGE_DIRECTIONS, RIVAL_FEMALE_DIRECTIONS,
  BISON_DIRECTIONS, SERAPH_DIRECTIONS, ABYSS_DIRECTIONS, ICE_KNIGHT_DIRECTIONS, THUNDER_SOVEREIGN_DIRECTIONS, ICE_BEHEMOTH_DIRECTIONS, FALLEN_ANGEL_DIRECTIONS, PHOENIX_DIRECTIONS, UNICORN_DIRECTIONS, BONE_REAPER_DIRECTIONS, VALGRADO_DIRECTIONS];

export function directionArtForFloor(floor: number, playerGender: 'male' | 'female' = 'male'): MonsterDirectionArt {
  if (floor >= 26 && floor <= 30) return FINAL_DEPTH_DIRECTIONS[floor - 26];
  if (floor >= 21 && floor <= 25) return THUNDER_DIRECTIONS[floor - 21];
  if (floor === 9) return playerGender === 'male' ? RIVAL_FEMALE_DIRECTIONS : RIVAL_MALE_DIRECTIONS;
  return FLOOR_DIRECTION_ART[floor - 1] ?? EMBER_DIRECTIONS;
}
export const MONSTER_DIRECTION_FRAME: Readonly<Record<Dir, number>> = { down: 0, left: 1, right: 2, up: 3 };

export interface MonsterDirectionMotion {
  kind: 'walk' | 'attack';
  startedAt: number;
  duration: number;
  dx: number;
  dy: number;
}

// A continuous visual pose, independent of the grid position and action tweens.
// The pulse joins idle with zero velocity at both ends; no scaling or extra frames.
export function monsterDirectionPose(time: number, phase: number, frozen: boolean, motion?: MonsterDirectionMotion) {
  if (frozen) return { x: 0, y: 0, angle: 0 };
  const progress = motion ? Math.max(0, Math.min(1, (time - motion.startedAt) / Math.max(1, motion.duration))) : 0;
  const pulse = Math.sin(progress * Math.PI) ** 2;
  return {
    x: Math.sin(time * 0.0021 + phase) * 0.35,
    y: Math.sin(time * 0.0032 + phase) * 1.15 - pulse * (motion?.kind === 'walk' ? 0.9 : 0.35),
    angle: Math.sin(time * 0.0027 + phase) * 1.45 - pulse * (motion?.dx ?? 0) * 2.2
  };
}
