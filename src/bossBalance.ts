import type { MonsterDef } from './types';

// Apply to newly spawned floor bosses after their encounter scaling and before difficulty.
export function strengthenLateBoss(def: MonsterDef, floor: number): MonsterDef {
  if (floor < 16 || floor > 30 || !def.isFloorBoss) return def;
  const [hpPercent, attackPercent] = floor <= 20 ? [130, 110]
    : floor <= 25 ? [140, 115] : [150, 120];
  return {
    ...def,
    hp: Math.floor(def.hp * hpPercent / 100),
    atkMin: Math.floor(def.atkMin * attackPercent / 100),
    atkMax: Math.floor(def.atkMax * attackPercent / 100)
  };
}
