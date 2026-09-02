import type { ItemKind } from './types';

// 消耗品1個の売却額。ショップ商品の買値を下回るように設定する。
export const ITEM_SELL_PRICES: Record<ItemKind, number> = {
  potion: 10,
  shroom: 12,
  torch: 8,
  bomb: 20,
  warp: 20,
  revive: 150,
  floorkey: 30,
  seal: 60,
  stone: 75,
  shieldstone: 75,
  slime_scroll: 200,
  boss5_scroll: 200,
  invis: 25,
  dash: 20
};

export function enhancementChance(plus: number): number {
  return Math.max(0.3, 0.9 - Math.max(0, plus) * 0.1);
}

export const EQUIPMENT_LIMIT = 6;

// 属性装備はガチャ・ドロップともに約5%。候補が存在しないグレードでは無属性へフォールバックする。
export const ELEMENTAL_EQUIPMENT_RATE = 0.05;

// 敵や床から強化スクロールが出る確率。
export const SCROLL_DROP_RATE = 1 / 3;
