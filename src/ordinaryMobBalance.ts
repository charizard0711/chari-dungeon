import type { MonsterDef } from './types';
import type { Difficulty } from './difficulty';

/** Attack-time scaling also covers restored saves without changing stored stats. */
export function ordinaryMobAttackBonus(def: MonsterDef, floor: number, mode: Difficulty, eventMode = false): number {
  if (mode !== 'normal' || eventMode || def.isBoss || def.isFloorBoss || def.isElite || def.isTreasureRabbit || def.atkMax <= 0) return 0;
  // Teach movement first, build pressure through floor 11, then hold the bonus
  // steady so deeper floors do not lose pressure as new species take over.
  const depth = Math.floor(floor);
  const base = Math.max(0, Math.min(8, depth - 3));
  return base;
}

export function ordinaryMobAttackDefinition(def: MonsterDef, floor: number, mode: Difficulty, eventMode = false): MonsterDef {
  const bonus = ordinaryMobAttackBonus(def, floor, mode, eventMode);
  // Keep the existing hard-mode attack ceiling; its HP and extra boss turns
  // continue to distinguish hard without changing any hard/master stats.
  return bonus ? { ...def,
    atkMin: Math.min(def.atkMin + bonus, Math.floor(def.atkMin * 1.2)),
    atkMax: Math.min(def.atkMax + bonus, Math.floor(def.atkMax * 1.2)) } : def;
}
