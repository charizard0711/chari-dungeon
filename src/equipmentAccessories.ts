import type { Weapon } from './types';

export function weaponAccessoryKey(w: Weapon | null | undefined): string | undefined {
  return w?.weaponType === 'katana' ? `sheath_${w.starred ? 'star_' : ''}${w.key}`
    : w?.weaponType === 'bow' ? `arrow_${w.key}` : undefined;
}
export function weaponAccessoryLabel(w: Weapon | null | undefined) {
  return w?.weaponType === 'katana' ? '鞘' : w?.weaponType === 'bow' ? '矢' : '盾';
}
const KATANA_COLORS: Record<string, [number, number]> = {
  iron:[0xb5c2cc,0xe9d4b5], mist:[0x9ecfff,0xff9c44], moon:[0xb985f0,0xd9e894],
  sun:[0xff933e,0x73d8ef], dragon:[0x65ce94,0xed5d65], sky:[0x80cfff,0xff9b46],
  divine:[0xffdf8b,0xc778ed], fire:[0xff7439,0x75cfff], water:[0x79c5ff,0xffa366],
  thunder:[0xffdc65,0xb392ff], ice:[0xb4edff,0xffa85a]
};
export function katanaSlashColor(w: Pick<Weapon, 'key' | 'starred'>) {
  return (KATANA_COLORS[w.key.replace('w_katana_', '')] ?? [0xc4e7ef,0xffbd87])[w.starred ? 1 : 0];
}
