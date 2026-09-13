import { ELEMENT_INFO, ITEM_DEFS, SHIELD_DEFS, WEAPON_DEFS } from './data';
import { armorTextureKey, PLAYER_ARMORS, PLAYER_ARMOR_DEFS } from './playerAppearance';
import { makeShield } from './player';
import type { Element, EquipmentGrade, WeaponType } from './types';

export const ITEM_CATALOG_CODE = '19960711';
export const CATALOG_TABS = [
  { key: 'all', label: 'すべて' }, { key: 'weapon', label: '武器' },
  { key: 'shield', label: '盾' }, { key: 'armor', label: '服' }, { key: 'item', label: '道具' }
] as const;
export type CatalogCategory = typeof CATALOG_TABS[number]['key'];
export interface CatalogClaimResult {
  status: 'received' | 'pending' | 'unavailable';
  message: string;
}
export interface CatalogEntry {
  key: string;
  category: Exclude<CatalogCategory, 'all'>;
  name: string;
  textureKey: string;
  grade?: EquipmentGrade;
  element?: Element;
  summary: string;
  description: string;
}
const WEAPON_NAMES: Record<WeaponType, string> = {
  dagger: '短剣', longsword: '片手剣', lance: '槍', bow: '弓', handgun: '銃',
  greatsword: '大剣', dual_sword: '双剣', twin_daggers: '双短剣'
};
const affinity = (element?: Element) => element ? `${ELEMENT_INFO[element].name}属性` : '無属性';

// 所持状況や到達階で絞らず、ゲーム本体の定義から全種類を作る。
export const ITEM_CATALOG: readonly CatalogEntry[] = [
  ...WEAPON_DEFS.map((weapon): CatalogEntry => ({
    key: weapon.key, category: 'weapon', name: weapon.name, textureKey: weapon.key,
    grade: weapon.grade, element: weapon.element,
    summary: `${weapon.ss ? 'SS' : weapon.grade} / ${WEAPON_NAMES[weapon.weaponType]} / ${affinity(weapon.element)}`,
    description: [
      `攻撃力 ${weapon.atkMin}〜${weapon.atkMax}　耐久 ${weapon.durMax}`,
      weapon.dual ? '二刀流：1ターンに2回攻撃。盾は装備できません。' : '',
      weapon.passive ? `${weapon.passive.name}：${weapon.passive.description}` : ''
    ].filter(Boolean).join('\n')
  })),
  ...SHIELD_DEFS.map((def): CatalogEntry => {
    const shield = makeShield(def.key);
    return {
      key: shield.key, category: 'shield', name: shield.name, textureKey: shield.key,
      grade: shield.grade, element: shield.element,
      summary: `${shield.grade} / 盾 / ${affinity(shield.element)}`,
      description: `防御力 +${shield.defBonus}　耐久 ${shield.durMax}\n${def.passive.name}：${def.passive.description}`
    };
  }),
  ...PLAYER_ARMORS.map((key): CatalogEntry => {
    const armor = PLAYER_ARMOR_DEFS[key];
    return { key: `armor_${key}`, category: 'armor', name: armor.name, textureKey: armorTextureKey(key),
      grade: armor.grade, summary: `${armor.grade} / 服`, description: `防御力 +${armor.defBonus}` };
  }),
  ...Object.entries(ITEM_DEFS).map(([kind, item]): CatalogEntry => ({
    key: kind, category: 'item', name: item.name, textureKey: item.textureKey,
    summary: '道具', description: item.desc
  }))
];

export function catalogPage(category: CatalogCategory, page: number, pageSize: number) {
  const entries = ITEM_CATALOG.filter((entry) => category === 'all' || entry.category === category);
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(entries.length / size));
  const index = Math.max(0, Math.min(pageCount - 1, Math.floor(page)));
  return { entries: entries.slice(index * size, (index + 1) * size), page: index, pageCount, total: entries.length };
}
