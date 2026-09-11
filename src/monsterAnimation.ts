import type { Dir } from './types';

export type MonsterAction = 'idle' | 'walk' | 'claw' | 'cast' | 'charge';

export interface MonsterAnimationState {
  action: MonsterAction;
  startedAt: number;
  duration: number;
}

export interface MonsterAnimationDefinition {
  readonly monsterKey: string;
  readonly frameSize: number;
  readonly artSize: number;
  readonly originY: number;
  readonly columns: number;
  readonly baseTint: number;
  readonly motionKey: string;
  readonly attackKey: string;
  readonly motionPath: string;
  readonly attackPath: string;
}

// Each direction has its own drawings, including a genuine rear view for up.
// Keep every frame on the same canvas/pivot; never resize individual poses.
export const EMBER_ANIMATION = {
  monsterKey: 'm_ember_drake',
  frameSize: 256,
  artSize: 168,
  originY: 0.75,
  columns: 8,
  baseTint: 0xff6a35,
  motionKey: 'ember_motion_v2',
  attackKey: 'ember_attacks_v2',
  motionPath: 'assets/monsters/animated/ember-motion-v2.png',
  attackPath: 'assets/monsters/animated/ember-attacks-v2.png'
} as const;

export const FROST_ANIMATION = {
  monsterKey: 'm_frost_wyrm',
  frameSize: 256,
  artSize: 130,
  originY: 0.6875,
  columns: 8,
  baseTint: 0x9ee8ff,
  motionKey: 'frost_motion_v2',
  attackKey: 'frost_attacks_v2',
  motionPath: 'assets/monsters/animated/frost-motion-v2.png',
  attackPath: 'assets/monsters/animated/frost-attacks-v2.png'
} as const;

export const STORM_ANIMATION = {
  monsterKey: 'm_storm_wyvern',
  frameSize: 256,
  artSize: 130,
  originY: 0.6875,
  columns: 8,
  baseTint: 0x66a5ff,
  motionKey: 'storm_motion_v2',
  attackKey: 'storm_attacks_v2',
  motionPath: 'assets/monsters/animated/storm-motion-v2.png',
  attackPath: 'assets/monsters/animated/storm-attacks-v2.png'
} as const;

// The 64-frame redraws stay parked; lightweight direction art is registered separately.
// Keep the definitions above available to the art preview pages.
export const MONSTER_ANIMATIONS: readonly MonsterAnimationDefinition[] = [];

export function getMonsterAnimation(monsterKey: string) {
  return MONSTER_ANIMATIONS.find(animation => animation.monsterKey === monsterKey);
}

const DIRECTION_ROW: Record<Dir, number> = { down: 0, left: 1, right: 2, up: 3 };
const POSES: Record<MonsterAction, readonly number[]> = {
  idle: [0, 1, 2, 3, 2, 1],
  walk: [4, 5, 6, 7],
  claw: [0, 1, 2, 3],
  cast: [4, 5, 6, 7],
  charge: [4, 5, 5, 4]
};

export function monsterAnimationFrame(
  dir: Dir, state: MonsterAnimationState, time: number, animation: MonsterAnimationDefinition
) {
  const poses = POSES[state.action];
  const elapsed = Math.max(0, time - state.startedAt);
  const looping = state.action === 'idle' || state.action === 'charge';
  const duration = Math.max(1, state.duration);
  const progress = looping ? (elapsed % duration) / duration
    : Math.min(0.999999, elapsed / duration);
  return {
    texture: state.action === 'idle' || state.action === 'walk'
      ? animation.motionKey : animation.attackKey,
    frame: DIRECTION_ROW[dir] * animation.columns + poses[Math.floor(progress * poses.length)]
  };
}
