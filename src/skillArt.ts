import type { WeaponType } from './types';

export const SKILL_ICON_ART = { katana_waist_fitting_v3: 'assets/katana-waist-v3/fitting.png', skill_katana: 'assets/katana-v2/skill_katana.png', katana_scabbard_v2: 'assets/katana-v2/katana_scabbard.png', ...Object.fromEntries(
  ['dagger', 'longsword', 'lance', 'bow', 'handgun', 'greatsword', 'dual_sword']
    .map(type => [`skill_${type}`, `assets/skills/painted-v1/skill_${type}.png`])
)};

export const SKILL_FX_ART = {
  fx_skill_cross_v2: 'assets/skills/painted-v2/effects.webp',
  fx_skill_stun_v2: 'assets/skills/painted-v2/effects.webp'
};

export function skillIconKey(type: WeaponType) {
  return `skill_${type === 'twin_daggers' ? 'dual_sword' : type}`;
}
