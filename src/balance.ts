export function enhancementChance(plus: number): number {
  return Math.max(0.3, 0.9 - Math.max(0, plus) * 0.1);
}

export const EQUIPMENT_LIMIT = 6;

// 属性装備はガチャ・ドロップともに約5%。候補が存在しないグレードでは無属性へフォールバックする。
export const ELEMENTAL_EQUIPMENT_RATE = 0.05;

// 敵や床から強化スクロールが出る確率。
export const SCROLL_DROP_RATE = 1 / 3;
