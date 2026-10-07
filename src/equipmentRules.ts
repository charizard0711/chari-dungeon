import type { Weapon } from './types';

export function isTwoHanded<T extends Pick<Weapon, 'weaponType' | 'dual'>>(weapon: T | null | undefined): weapon is T & ({ weaponType: 'bow' | 'greatsword' | 'katana' } | { dual: true }) {
  return !!weapon && (!!weapon.dual || ['bow', 'greatsword', 'katana'].includes(weapon.weaponType));
}
