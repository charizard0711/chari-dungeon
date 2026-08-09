export function enhancementChance(plus: number): number {
  return Math.max(0.3, 0.9 - Math.max(0, plus) * 0.1);
}

export const EQUIPMENT_LIMIT = 6;
