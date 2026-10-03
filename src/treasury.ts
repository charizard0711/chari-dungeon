import { WEAPON_DEFS } from './data';
import { makeWeapon } from './player';

/** Every diamond chest awards both gold and one elemental A/S/SS weapon, always +3. */
export function rollTreasuryReward(random = Math.random) {
  const pool = WEAPON_DEFS.filter(def => def.element && (def.grade === 'A' || def.grade === 'S'));
  const gold = 500 + Math.floor(random() * 501);
  const weapon = makeWeapon(pool[Math.floor(random() * pool.length)].key, []);
  weapon.plus = 3;
  return { gold, weapon };
}
