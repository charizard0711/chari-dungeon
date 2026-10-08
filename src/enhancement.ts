export function weaponChargeSteps(plus = 0) { return plus >= 15 ? 30 : plus >= 10 ? 50 : plus >= 5 ? 75 : 100; }
export function weaponWearReduction(plus = 0) { return plus >= 10 ? 3 : plus >= 5 ? 1 : 0; }
export function shieldEnhancementHeal(plus = 0) { return plus >= 15 ? 6 : plus >= 10 ? 4 : plus >= 5 ? 2 : 0; }
export const MAX_ENHANCEMENT = 15;
export function isRemovedItem(kind: string) { return kind === 'shroom' || kind === 'bomb'; }
