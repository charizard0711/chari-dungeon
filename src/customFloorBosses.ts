import type { MonsterDef } from './types';
import { makeShield, makeWeapon } from './player';
import { makePlayerArmor, type PlayerGender } from './playerAppearance';

// These replacements are floor-specific; later dragon variants stay intact.
export function customFloorBoss(floor: number, playerGender: PlayerGender): MonsterDef | undefined {
  if (floor === 11) return {
    key: 'm_silver_seraph', name: '白翼のセラフィム',
    description: '銀の鎧と白い翼を持つ槍の守護者。槍で間合いを詰め、銀色の予告マスへ魔力を放つ。',
    hp: 58, atkMin: 11, atkMax: 19, def: 13, exp: 17, gold: 20, score: 105,
    minFloor: 11, maxFloor: 11, behavior: 'chase',
    element: null, color: 0xdce8ef, isDragonType: false
  };
  if (floor === 12) return {
    key: 'm_abyss_dragon', name: 'アビスドラゴン',
    description: '黒紫の鱗と翼を持つ闇の竜。闇の魔力弾を放ち、紫の予告マスへ転移して衝撃を起こす。',
    hp: 60, atkMin: 14, atkMax: 23, def: 9, exp: 20, gold: 24, score: 130,
    minFloor: 12, maxFloor: 12, behavior: 'loop', ranged: true, wallPass: true,
    element: 'dark', color: 0x9867db, isDragonType: true
  };
  if (floor === 13) return {
    key: 'm_ice_knight', name: '氷冠の騎士',
    description: '氷晶の全身鎧と大剣をまとう騎士。氷の剣撃を振るい、一直線の予告マスへ冷気を走らせる。',
    hp: 74, atkMin: 16, atkMax: 26, def: 12, exp: 25, gold: 28, score: 155,
    minFloor: 13, maxFloor: 13, behavior: 'chase',
    element: 'ice', color: 0x98e7ff, isDragonType: false
  };
  if (floor === 14) return {
    key: 'm_thunder_sovereign', name: '雷霆王ゼウス',
    description: '白髪と白い髭をなびかせる雷の王。雷霆を投げ、十字に広がる予告マスへ雷撃を落とす。',
    hp: 76, atkMin: 15, atkMax: 26, def: 13, exp: 25, gold: 28, score: 158,
    minFloor: 14, maxFloor: 14, behavior: 'ranged', ranged: true,
    element: 'thunder', color: 0xffe875, isDragonType: false
  };
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
