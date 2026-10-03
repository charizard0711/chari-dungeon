import type { ItemKind } from './types';

// 消耗品1個の売却額。ショップ商品の買値を下回るように設定する。
export const ITEM_SELL_PRICES: Record<ItemKind, number> = {
  potion: 10,
  shroom: 12,
  torch: 8,
  bomb: 20,
  dynamite: 60,
  mystery_bread: 100,
  warp: 20,
  revive: 150,
  floorkey: 30,
  seal: 60,
  stone: 75,
  shieldstone: 75,
  slime_scroll: 200,
  boss5_scroll: 200,
  invis: 25,
  repair: 25
};

export const SHOP_PRICES = { potion: 25, repair: 100, slime_scroll: 500, boss5_scroll: 500 } as const;
export type ShopItemKind = keyof typeof SHOP_PRICES;

export function enhancementChance(plus: number): number {
  return Math.max(0.3, 0.9 - Math.max(0, plus) * 0.1);
}

export const EQUIPMENT_LIMIT = 12;
export const FLOOR_KEY_DROP_RATE = 0.005;
export const ARCADIA_GACHA_RATE = 0.0001;
export const ARCADIA_BOSS_DROP_RATE = 0.001;

// 属性装備はガチャ・ドロップともに約5%。候補が存在しないグレードでは無属性へフォールバックする。
export const ELEMENTAL_EQUIPMENT_RATE = 0.05;

// 敵や床から強化スクロールが出る確率。
export const SCROLL_DROP_RATE = 1 / 3;

// Independent ordinary-MOB drop roll; already the final 2% probability.
export const DYNAMITE_DROP_RATE = 0.02;
// Independent 1% roll in every difficulty; do not apply ordinary loot multipliers.
export const MYSTERY_BREAD_DROP_RATE = 0.01;
