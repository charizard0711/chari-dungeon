export const WEAPON_GACHA_CHANCE = 0.22;

export function enhancementChance(plus: number): number {
  return Math.max(0.3, 0.9 - Math.max(0, plus) * 0.1);
}

export function floorBossMultipliers(floor: number) {
  const softened = floor === 5;
  return {
    softened,
    hp: softened ? 1.55 : 1.8 + floor * 0.12,
    attack: softened ? 1.05 : 1.18 + floor * 0.015,
    defenseBonus: softened ? 0 : 2 + Math.floor(floor / 5)
  };
}
