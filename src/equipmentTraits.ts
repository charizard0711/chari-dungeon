import type { Armor, EquipmentGrade, Weapon } from './types';

export const STAR_WEAPON_RATE = .001;
export const starWeaponKey = (key: string) => `star_${key}`;
export type ArmorTrait = 'hp' | 'defense' | 'charge' | 'potion' | 'rare_drop';
const TRAIT_STEP: Record<EquipmentGrade,number> = {D:1,C:2,B:3,A:4,S:5,SS:6,SSS:7};
export function rollArmorTrait(random = Math.random): ArmorTrait {
  const roll = random();
  if (roll < .01) return 'rare_drop';
  return (['hp','defense','charge','potion'] as const)[Math.min(3,Math.floor((roll-.01)/.99*4))];
}
export function armorTraitValue(armor: Armor | null | undefined, trait: ArmorTrait) {
  return armor?.trait === trait ? TRAIT_STEP[armor.grade] : 0;
}
export function armorTraitDescription(armor: Armor | null | undefined) {
  if (!armor?.trait) return '';
  const value=TRAIT_STEP[armor.grade];
  return {hp:`最大HP +${value}`,defense:`追加防御力 +${value}`,charge:`スキルに必要な歩数 -${value}`,potion:`ポーション回復量 +${value}`,rare_drop:`特殊アイテムのドロップ率 ${(1+value*.1).toFixed(1)}倍`}[armor.trait];
}
/** Roll once per item, across floor drops, direct rewards, gacha and pending inventory. */
export function rollStarWeapon(weapon: Weapon, random = Math.random) {
  if (weapon.variantRolled || weapon.starred) return weapon;
  weapon.variantRolled = true;
  if (random() < STAR_WEAPON_RATE) { weapon.starred=true; weapon.name=weapon.name.replace(/★$/,'')+'★'; }
  return weapon;
}
