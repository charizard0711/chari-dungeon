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
  return bonus ? { ...def, atkMin: def.atkMin + bonus, atkMax: def.atkMax + bonus } : def;
}
