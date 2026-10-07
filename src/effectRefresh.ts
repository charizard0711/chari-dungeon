export const REFRESHED_EFFECT_KEYS = ['fx_slash','fx_hit','fx_heal','fx_magic','fx_poison','fx_levelup','fx_crescent','fx_impact','fx_arrow','fx_beam','fx_bolt','fx_skill_cross_v3','fx_skill_stun_v3','fx_move_v3','fx_skill_dagger_v3'] as const;
export const REFRESHED_EFFECT_ART = Object.fromEntries(REFRESHED_EFFECT_KEYS.map(key => [key, `assets/effects/painted-v3/${key}.png`]));
export function effectWorldSize(key: string): [number, number] {
  if (key === 'fx_bolt') return [32,16];
  if (key === 'fx_move_v3') return [32,20];
  if (key === 'fx_hit' || key === 'fx_impact') return [32,32];
  if (key === 'fx_levelup') return [44,44];
  if (key === 'fx_poison') return [36,36];
  return [40,40];
}
