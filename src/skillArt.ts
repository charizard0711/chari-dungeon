import type { WeaponType } from './types';

export const SKILL_ICON_ART = Object.fromEntries(
  ['dagger', 'longsword', 'lance', 'bow', 'handgun', 'greatsword', 'dual_sword']
    .map(type => [`skill_${type}`, `assets/skills/painted-v1/skill_${type}.png`])
);

export function skillIconKey(type: WeaponType) {
  return `skill_${type === 'twin_daggers' ? 'dual_sword' : type}`;
}
