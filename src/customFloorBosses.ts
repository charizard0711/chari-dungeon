import type { MonsterDef } from './types';
import { makeShield, makeWeapon } from './player';
import { makePlayerArmor, type PlayerGender } from './playerAppearance';

// Only floors 8 and 9 use these encounters; later dragon variants stay intact.
export function customFloorBoss(floor: number, playerGender: PlayerGender): MonsterDef | undefined {
  if (floor === 8) return {
    key: 'm_black_mage', name: '黒衣の魔術師',
    description: '黒いローブの無属性の魔術師。杖から魔力弾を放ち、予告した十字のマスを魔力で撃ち抜く。',
    hp: 60, atkMin: 12, atkMax: 20, def: 8, exp: 30, gold: 24, score: 65,
    minFloor: 8, maxFloor: 8, behavior: 'ranged', ranged: true,
    element: null, color: 0xc7c5d0, isDragonType: false
  };
  if (floor !== 9) return undefined;
  const gender: PlayerGender = playerGender === 'male' ? 'female' : 'male';
  const weapon = makeWeapon('w_rune_saber', []);
  const shield = makeShield('s_thorn_guard');
  const armor = makePlayerArmor('plate');
  return {
    key: `m_rival_${gender}`, name: gender === 'male' ? '対の剣士' : '対の女剣士',
    description: `プレイヤーと反対の性別の冒険者。武器[B] ${weapon.name}・盾[B] ${shield.name}・服[B] ${armor.name}を装備。剣と盾で接近戦を挑む。`,
    hp: 66, atkMin: weapon.atkMin, atkMax: weapon.atkMax,
    def: shield.defBonus + armor.defBonus,
    exp: 32, gold: 26, score: 70, minFloor: 9, maxFloor: 9,
    behavior: 'chase', element: null, color: 0x56a8ff, isDragonType: false,
    rivalEquipment: { gender, weapon, shield, armor }
  };
}
