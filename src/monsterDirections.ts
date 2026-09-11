import type { Dir } from './types';

export interface MonsterDirectionArt {
  readonly monsterKey: string;
  readonly textureKey: string;
  readonly path: string;
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

export const DIRECTIONAL_MONSTERS: readonly MonsterDirectionArt[] = [EMBER_DIRECTIONS, FROST_DIRECTIONS, STORM_DIRECTIONS, BRASS_DIRECTIONS, AURELIUS_DIRECTIONS, BONE_DIRECTIONS, HYDRA_DIRECTIONS, BLACK_MAGE_DIRECTIONS, RIVAL_MALE_DIRECTIONS, RIVAL_FEMALE_DIRECTIONS, BISON_DIRECTIONS];

export function directionArtForFloor(floor: number, playerGender: 'male' | 'female' = 'male'): MonsterDirectionArt {
  if (floor === 9) return playerGender === 'male' ? RIVAL_FEMALE_DIRECTIONS : RIVAL_MALE_DIRECTIONS;
  if (floor === 10) return BISON_DIRECTIONS;
  return DIRECTIONAL_MONSTERS[floor - 1] ?? EMBER_DIRECTIONS;
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
