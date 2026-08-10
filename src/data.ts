import type { Weapon, Shield, Item, ItemKind, MonsterDef, MagicCode, EquipmentGrade, Element, WeaponType, WeaponPassive, ShieldPassive } from './types';

// ===== 武器定義 =====
export interface WeaponDef {
  key: string;
  name: string;
  atkMin: number;
  atkMax: number;
  durMax: number;
  minFloor: number;
  rarity: number; // 出現しやすさの重み（小さいほどレア）
  grade: EquipmentGrade;
  dual?: boolean; // 二刀流（1ターンに2回攻撃・盾装備不可）
  weaponType: WeaponType;
  element?: Element;
  passive?: WeaponPassive;
  ss?: boolean;
}

export const WEAPON_DEFS: WeaponDef[] = [
  // 属性は後付け抽選せず、武器の種類・名前・専用アートに固定する。
  { key: 'w_dagger_fire', name: '焔牙カグツチ', atkMin: 6, atkMax: 14, durMax: 120, minFloor: 1, rarity: 10, grade: 'D', weaponType: 'dagger', element: 'fire' },
  { key: 'w_dagger_water', name: '潮刃ミナヅキ', atkMin: 6, atkMax: 14, durMax: 120, minFloor: 1, rarity: 10, grade: 'D', weaponType: 'dagger', element: 'water' },
  { key: 'w_dagger_thunder', name: '雷針イカヅチ', atkMin: 7, atkMax: 15, durMax: 114, minFloor: 1, rarity: 9, grade: 'D', weaponType: 'dagger', element: 'thunder' },
  { key: 'w_dagger_ice', name: '氷晶シラユキ', atkMin: 6, atkMax: 14, durMax: 126, minFloor: 1, rarity: 9, grade: 'D', weaponType: 'dagger', element: 'ice' },

  { key: 'w_longsword_fire', name: '獄炎剣ヴォルガ', atkMin: 9, atkMax: 19, durMax: 180, minFloor: 3, rarity: 8, grade: 'C', weaponType: 'longsword', element: 'fire' },
  { key: 'w_longsword_water', name: '海淵剣ネレイス', atkMin: 9, atkMax: 18, durMax: 192, minFloor: 3, rarity: 8, grade: 'C', weaponType: 'longsword', element: 'water' },
  { key: 'w_longsword_thunder', name: '迅雷剣ヴァジュラ', atkMin: 11, atkMax: 22, durMax: 168, minFloor: 8, rarity: 6, grade: 'B', weaponType: 'longsword', element: 'thunder' },
  { key: 'w_longsword_ice', name: '凍界剣グレイシア', atkMin: 10, atkMax: 21, durMax: 186, minFloor: 8, rarity: 6, grade: 'B', weaponType: 'longsword', element: 'ice' },

  { key: 'w_bow_fire', name: '炎翼弓フェニクス', atkMin: 11, atkMax: 23, durMax: 126, minFloor: 13, rarity: 4, grade: 'A', weaponType: 'bow', element: 'fire' },
  { key: 'w_bow_water', name: '蒼流弓アクエリア', atkMin: 10, atkMax: 22, durMax: 138, minFloor: 13, rarity: 4, grade: 'A', weaponType: 'bow', element: 'water' },
  { key: 'w_bow_thunder', name: '雷鳴弓テンペスト', atkMin: 12, atkMax: 24, durMax: 120, minFloor: 13, rarity: 3, grade: 'A', weaponType: 'bow', element: 'thunder' },
  { key: 'w_bow_ice', name: '氷月弓ルナフロスト', atkMin: 11, atkMax: 23, durMax: 132, minFloor: 13, rarity: 3, grade: 'A', weaponType: 'bow', element: 'ice' },

  { key: 'w_dual_sword_fire', name: '双炎刃イグニス', atkMin: 8, atkMax: 16, durMax: 144, minFloor: 21, rarity: 2, grade: 'S', weaponType: 'dual_sword', element: 'fire', dual: true, ss: true },
  { key: 'w_dual_sword_water', name: '双潮刃リヴァイア', atkMin: 8, atkMax: 15, durMax: 156, minFloor: 21, rarity: 2, grade: 'S', weaponType: 'dual_sword', element: 'water', dual: true, ss: true },
  { key: 'w_dual_sword_thunder', name: '双雷刃ライキリ', atkMin: 9, atkMax: 17, durMax: 138, minFloor: 21, rarity: 1, grade: 'S', weaponType: 'dual_sword', element: 'thunder', dual: true, ss: true },
  { key: 'w_dual_sword_ice', name: '双氷刃フロストバイト', atkMin: 8, atkMax: 16, durMax: 150, minFloor: 21, rarity: 1, grade: 'S', weaponType: 'dual_sword', element: 'ice', dual: true, ss: true },

  // 無属性武器。属性相性に左右されず、各ランクで安定して扱える。
  { key: 'w_iron_dagger', name: '黒鉄の短剣', atkMin: 5, atkMax: 12, durMax: 150, minFloor: 1, rarity: 14, grade: 'D', weaponType: 'dagger' },
  { key: 'w_shadow_stiletto', name: '影縫いのスティレット', atkMin: 7, atkMax: 15, durMax: 132, minFloor: 3, rarity: 10, grade: 'C', weaponType: 'dagger' },
  { key: 'w_sawtooth_dirk', name: '鋸刃のダーク', atkMin: 9, atkMax: 18, durMax: 138, minFloor: 8, rarity: 6, grade: 'B', weaponType: 'dagger' },
  { key: 'w_moon_fang', name: '月牙の短剣', atkMin: 11, atkMax: 22, durMax: 144, minFloor: 13, rarity: 3, grade: 'A', weaponType: 'dagger' },
  { key: 'w_assassin_requiem', name: '暗殺刃レクイエム', atkMin: 13, atkMax: 25, durMax: 156, minFloor: 21, rarity: 1, grade: 'S', weaponType: 'dagger' },

  { key: 'w_soldier_blade', name: '兵士の直剣', atkMin: 6, atkMax: 14, durMax: 180, minFloor: 1, rarity: 14, grade: 'D', weaponType: 'longsword' },
  { key: 'w_knight_sword', name: '騎士剣アルディオン', atkMin: 8, atkMax: 17, durMax: 210, minFloor: 3, rarity: 11, grade: 'C', weaponType: 'longsword' },
  { key: 'w_rune_saber', name: 'ルーン鋼剣', atkMin: 10, atkMax: 21, durMax: 198, minFloor: 8, rarity: 6, grade: 'B', weaponType: 'longsword' },
  { key: 'w_paladin_edge', name: '聖騎士剣ルミナス', atkMin: 12, atkMax: 25, durMax: 216, minFloor: 13, rarity: 3, grade: 'A', weaponType: 'longsword' },
  { key: 'w_black_oath', name: '黒誓剣モルドレッド', atkMin: 15, atkMax: 29, durMax: 228, minFloor: 21, rarity: 1, grade: 'S', weaponType: 'longsword' },

  { key: 'w_iron_pike', name: '鉄兵のパイク', atkMin: 6, atkMax: 15, durMax: 160, minFloor: 1, rarity: 13, grade: 'D', weaponType: 'lance' },
  { key: 'w_royal_spear', name: '王衛槍レオニス', atkMin: 8, atkMax: 18, durMax: 174, minFloor: 3, rarity: 9, grade: 'C', weaponType: 'lance' },
  { key: 'w_bone_lance', name: '白骨槍グレイヴ', atkMin: 10, atkMax: 20, durMax: 174, minFloor: 8, rarity: 7, grade: 'B', weaponType: 'lance' },
  { key: 'w_drill_lance', name: '穿城槍ドリルギア', atkMin: 12, atkMax: 26, durMax: 186, minFloor: 13, rarity: 3, grade: 'A', weaponType: 'lance' },
  { key: 'w_dragon_lance', name: '竜穿槍バハムート', atkMin: 15, atkMax: 30, durMax: 204, minFloor: 21, rarity: 1, grade: 'S', weaponType: 'lance' },

  { key: 'w_hunter_bow', name: '狩人の長弓', atkMin: 5, atkMax: 13, durMax: 126, minFloor: 1, rarity: 13, grade: 'D', weaponType: 'bow' },
  { key: 'w_composite_bow', name: '複合弓ファルコン', atkMin: 8, atkMax: 17, durMax: 138, minFloor: 3, rarity: 9, grade: 'C', weaponType: 'bow' },
  { key: 'w_blackwood_bow', name: '黒檀弓ナイトレイ', atkMin: 10, atkMax: 21, durMax: 144, minFloor: 8, rarity: 6, grade: 'B', weaponType: 'bow' },
  { key: 'w_royal_bow', name: '王弓レガリア', atkMin: 11, atkMax: 24, durMax: 150, minFloor: 13, rarity: 4, grade: 'A', weaponType: 'bow' },
  { key: 'w_siege_arbalest', name: '攻城弩バリスタ', atkMin: 14, atkMax: 29, durMax: 168, minFloor: 21, rarity: 1, grade: 'S', weaponType: 'bow' },

  { key: 'w_rusted_greatsword', name: '錆びた大剣', atkMin: 7, atkMax: 16, durMax: 195, minFloor: 1, rarity: 12, grade: 'D', weaponType: 'greatsword' },
  { key: 'w_executioner_blade', name: '断罪の処刑剣', atkMin: 10, atkMax: 21, durMax: 210, minFloor: 3, rarity: 8, grade: 'C', weaponType: 'greatsword' },
  { key: 'w_titan_cleaver', name: '巨人断ちタイタンクリーバー', atkMin: 12, atkMax: 25, durMax: 225, minFloor: 8, rarity: 5, grade: 'B', weaponType: 'greatsword' },
  { key: 'w_holy_greatsword', name: '聖堂大剣カテドラル', atkMin: 14, atkMax: 28, durMax: 240, minFloor: 13, rarity: 2, grade: 'A', weaponType: 'greatsword' },
  {
    key: 'w_grand_breaker', name: '破城大剣グランバスター', atkMin: 14, atkMax: 29, durMax: 225,
    minFloor: 21, rarity: 1, grade: 'S', weaponType: 'greatsword',
    passive: { key: 'knockback', name: '三撃破砕', description: '3回目の攻撃ごとに敵を1マス押し戻す' }
  }
];

export const ELEMENT_INFO: Record<Element, { name: string; color: number; weakTo: Element }> = {
  fire: { name: '火', color: 0xff5a36, weakTo: 'water' },
  thunder: { name: '雷', color: 0xffe348, weakTo: 'ice' },
  water: { name: '水', color: 0x3fa9ff, weakTo: 'thunder' },
  ice: { name: '氷', color: 0x82e9ff, weakTo: 'fire' }
};

export function randomElement(): Element {
  const values: Element[] = ['fire', 'thunder', 'water', 'ice'];
  return values[Math.floor(Math.random() * values.length)];
}

export function elementMultiplier(attack: Element | undefined, defend: Element | undefined): number {
  if (!attack || !defend) return 1;
  return ELEMENT_INFO[defend].weakTo === attack ? 1.5 : attack === defend ? 0.75 : 1;
}

export function monsterElement(def: MonsterDef): Element {
  if (def.element) return def.element;
  const values: Element[] = ['fire', 'thunder', 'water', 'ice'];
  let seed = 0;
  for (let i = 0; i < def.key.length; i++) seed += def.key.charCodeAt(i);
  return values[seed % values.length];
}

// ===== 盾定義 =====
export interface ShieldDef {
  key: string;
  name: string;
  defBonus: number;
  durMax: number;
  minFloor: number;
  rarity: number;
  grade: EquipmentGrade;
  element?: Element;
  passive: ShieldPassive;
}

export const SHIELD_DEFS: ShieldDef[] = [
  // 無属性盾5種：すべて形と固有効果が異なる。
  {
    key: 's_iron_round', name: '黒鉄の円盾', defBonus: 2, durMax: 65, minFloor: 1, rarity: 14, grade: 'D',
    passive: { key: 'brace', name: '踏ん張り', description: '10以上の攻撃ダメージを20%軽減' }
  },
  {
    key: 's_mirror_silver', name: '鏡銀の盾', defBonus: 3, durMax: 55, minFloor: 3, rarity: 10, grade: 'C',
    passive: { key: 'mirror', name: '鏡避け', description: '15%の確率で攻撃を完全に無効化' }
  },
  {
    key: 's_thorn_guard', name: '反撃盾ヴァイン', defBonus: 4, durMax: 70, minFloor: 8, rarity: 6, grade: 'B',
    passive: { key: 'thorns', name: '反射棘', description: '受けた攻撃ダメージの25%を敵へ返す' }
  },
  {
    key: 's_chrono_guard', name: '時守りの盾クロノス', defBonus: 5, durMax: 75, minFloor: 14, rarity: 3, grade: 'A',
    passive: { key: 'perfect_guard', name: '時止め防御', description: '5回に1回、敵の攻撃を完全に無効化' }
  },
  {
    key: 's_seraph_guard', name: '聖域盾セラフィム', defBonus: 6, durMax: 90, minFloor: 21, rarity: 1, grade: 'S',
    passive: { key: 'recovery', name: '聖域再生', description: '4回攻撃を受けるごとにHPを6回復' }
  },

  // 属性盾4種：色替えではなく、属性ごとに専用の形・名前・原画を持つ。
  {
    key: 's_flame_aegis', name: '炎獄盾イグナード', defBonus: 3, durMax: 60, minFloor: 4, rarity: 8, grade: 'C', element: 'fire',
    passive: { key: 'element_guard', name: '火炎障壁', description: '火属性の攻撃に強い' }
  },
  {
    key: 's_tidal_aegis', name: '海淵盾ネレイア', defBonus: 3, durMax: 64, minFloor: 4, rarity: 8, grade: 'C', element: 'water',
    passive: { key: 'element_guard', name: '水流障壁', description: '水属性の攻撃に強い' }
  },
  {
    key: 's_storm_aegis', name: '雷皇盾ヴォルテクス', defBonus: 4, durMax: 62, minFloor: 8, rarity: 6, grade: 'B', element: 'thunder',
    passive: { key: 'element_guard', name: '雷電障壁', description: '雷属性の攻撃に強い' }
  },
  {
    key: 's_frost_aegis', name: '氷城盾グレイシア', defBonus: 4, durMax: 70, minFloor: 8, rarity: 6, grade: 'B', element: 'ice',
    passive: { key: 'element_guard', name: '氷雪障壁', description: '氷属性の攻撃に強い' }
  }
];

// ===== マジック定義 =====
const MAGIC_LABELS: Record<MagicCode, (lv: number) => string> = {
  B: (lv) => `B${lv}`,
  A: (lv) => `A${lv}`,
  H: (lv) => `H${lv}`,
  R: () => 'R',
  F: () => 'F',
  D: () => 'D',
  DK: () => 'DK',
  C: () => 'C',
  P: () => 'P',
  I: () => 'I',
  K: () => 'K'
};

export const MAGIC_DESC: Record<MagicCode, string> = {
  B: '攻撃力の最大値アップ',
  A: '攻撃力の全体アップ',
  H: '武器耐久力アップ',
  R: 'リペア：壊れても1回復活',
  F: 'ファイア：炎の追加ダメージ',
  D: 'ドレイン：ダメージの一部をHP吸収',
  DK: '深層・機械系モンスターに大ダメージ',
  C: 'クリティカル率アップ',
  P: '毒付与',
  I: '氷結：低確率で敵を1ターン停止',
  K: '撃破時のスコアアップ'
};

export function magicLabel(code: MagicCode, level: number): string {
  return MAGIC_LABELS[code](level);
}

// ===== アイテム定義 =====
export const ITEM_DEFS: Record<ItemKind, Omit<Item, 'kind'>> = {
  potion:  { name: '回復ポーション', desc: 'HPを40回復する', textureKey: 'i_potion' },
  shroom:  { name: '光るキノコ', desc: '周囲をしばらく明るくする', textureKey: 'i_shroom' },
  smoke:   { name: '煙幕ボトル', desc: '敵の視界を乱し逃げやすくなる', textureKey: 'i_smoke' },
  bomb:    { name: 'ボムナッツ', desc: '周囲の敵に範囲ダメージ', textureKey: 'i_bomb' },
  warp:    { name: 'ワープベル', desc: '同じ階のランダム地点へ移動', textureKey: 'i_warp' },
  revive:  { name: '復活のタネ', desc: '倒れた時に一度だけ復活', textureKey: 'i_revive' },
  oldkey:  { name: '古びた鍵', desc: 'ロックされた扉を開ける', textureKey: 'i_oldkey' },
  floorkey:{ name: 'フロアキー', desc: '特殊な扉を開ける', textureKey: 'i_floorkey' },
  seal:    { name: '封印の魔導書', desc: '周囲の敵を数ターン止める', textureKey: 'i_seal' },
  stone:   { name: '武器強化スクロール', desc: '装備中の武器を強化。成功率90%から強化ごとに10%低下（最低30%）', textureKey: 'i_stone' },
  shieldstone: { name: '防具強化スクロール', desc: '装備中の盾を強化。成功率90%から強化ごとに10%低下（最低30%）', textureKey: 'i_shieldstone' },
  invis:   { name: '透明ポーション', desc: '20ターンの間、敵から完全に見えなくなる', textureKey: 'i_invis' },
  dash:    { name: '疾風の羽', desc: '20歩の間、1歩で2マス進めるようになる', textureKey: 'i_dash' }
};

// レアアイテム（所持欄で赤枠になる）
const RARE_ITEMS = new Set<ItemKind>(['revive']);
export function isRareItem(kind: ItemKind): boolean {
  return RARE_ITEMS.has(kind);
}

// ===== 武器強化(+N)の色 =====
// +1:黄 / +2:紫 / +3:青 / +4以降:赤
export function plusColor(plus: number): number {
  if (plus <= 0) return 0xdfe7f0;
  if (plus === 1) return 0xf5c542;
  if (plus === 2) return 0xa06bff;
  if (plus === 3) return 0x4fb0ff;
  return 0xff5a5a;
}

export function plusColorHex(plus: number): string {
  return '#' + plusColor(plus).toString(16).padStart(6, '0');
}

export function gradeColor(grade: EquipmentGrade): number {
  return { D: 0x9ba8b4, C: 0x61c78d, B: 0x56a8ff, A: 0xb57aff, S: 0xffc857 }[grade];
}

export function gradeColorHex(grade: EquipmentGrade): string {
  return '#' + gradeColor(grade).toString(16).padStart(6, '0');
}

export function makeItem(kind: ItemKind): Item {
  return { kind, ...ITEM_DEFS[kind] };
}

// ===== モンスター定義 =====
const MONSTER_ELEMENTS: Record<string, Element> = {
  m_mush: 'fire', m_mole: 'thunder', m_jelly: 'water', m_ghost: 'ice',
  m_gear: 'thunder', m_vine: 'water', m_mud: 'water', m_moss: 'water',
  m_bat: 'ice', m_imp: 'thunder', m_snake: 'water', m_skel: 'ice', m_archer: 'thunder',
  m_ember_drake: 'fire', m_frost_wyrm: 'ice', m_storm_wyvern: 'thunder',
  m_brass_dragon: 'fire', m_void_drake: 'thunder', m_bone_dragon: 'ice',
  m_horn_demon: 'fire', m_chain_demon: 'thunder', m_flame_gargoyle: 'fire',
  m_abyss_hound: 'ice', m_mask_fiend: 'thunder', m_archdemon: 'fire',
  m_bone_hound: 'thunder', m_skeleton_mage: 'ice', m_death_knight: 'thunder',
  m_lich: 'ice', m_bone_colossus: 'fire', m_grave_crawler: 'water',
  m_cerberus: 'fire', m_hydra: 'water', m_crystal_crab: 'ice', m_blood_moth: 'fire',
  m_clockwork_chimera: 'thunder', m_slime: 'thunder', m_beetle: 'thunder',
  m_wisp: 'fire', m_spider: 'water', m_golem: 'thunder', m_eye: 'thunder',
  m_wraith: 'ice', m_reaper: 'fire', m_guard: 'ice', m_watcher: 'thunder'
};

const MONSTER_DEFS_RAW: MonsterDef[] = [
  {
    key: 'm_mush', name: 'ランタンマッシュ', hp: 18, atkMin: 3, atkMax: 7, def: 1,
    exp: 4, gold: 3, score: 30, minFloor: 1, maxFloor: 10, behavior: 'chase', color: 0x8a6bff
  },
  {
    key: 'm_mole', name: '時計モグラ', hp: 26, atkMin: 5, atkMax: 10, def: 6,
    exp: 6, gold: 5, score: 45, minFloor: 2, maxFloor: 14, behavior: 'slow', color: 0x9c7a4a
  },
  {
    key: 'm_jelly', name: 'ゼリークラウン', hp: 22, atkMin: 4, atkMax: 8, def: 2,
    exp: 5, gold: 20, score: 40, minFloor: 1, maxFloor: 12, behavior: 'chase', color: 0x4fd0e0
  },
  {
    key: 'm_ghost', name: 'ループゴースト', hp: 20, atkMin: 5, atkMax: 9, def: 3,
    exp: 6, gold: 6, score: 50, minFloor: 3, maxFloor: 16, behavior: 'loop', wallPass: true, color: 0x6b4a8a
  },
  {
    key: 'm_gear', name: '歯車ガメ', hp: 34, atkMin: 6, atkMax: 11, def: 9,
    exp: 8, gold: 8, score: 55, minFloor: 4, maxFloor: 20, behavior: 'slow', color: 0x6a7a5a
  },
  {
    key: 'm_vine', name: 'ツタホイール', hp: 28, atkMin: 6, atkMax: 12, def: 4,
    exp: 7, gold: 6, score: 50, minFloor: 5, maxFloor: 20, behavior: 'line', color: 0x5a8a4a
  },
  {
    key: 'm_mud', name: 'ドロぐち', hp: 30, atkMin: 7, atkMax: 13, def: 3,
    exp: 8, gold: 10, score: 55, minFloor: 6, maxFloor: 22, behavior: 'chase', color: 0x7a5a3a
  },
  {
    key: 'm_moss', name: 'モスナイト', hp: 40, atkMin: 8, atkMax: 14, def: 10,
    exp: 10, gold: 12, score: 65, minFloor: 8, maxFloor: 24, behavior: 'chase', color: 0x4a7a4a
  },
  {
    key: 'm_bat', name: 'クリスタルコウモリ', hp: 24, atkMin: 6, atkMax: 12, def: 3,
    exp: 8, gold: 8, score: 60, minFloor: 10, maxFloor: 26, behavior: 'random', ranged: true, color: 0x4fb0ff
  },
  {
    key: 'm_imp', name: 'スイッチインプ', hp: 26, atkMin: 6, atkMax: 11, def: 4,
    exp: 8, gold: 9, score: 60, minFloor: 11, maxFloor: 26, behavior: 'chase', color: 0x5a4a8a
  },
  {
    key: 'm_snake', name: 'カギヘビ', hp: 30, atkMin: 7, atkMax: 13, def: 5,
    exp: 9, gold: 14, score: 65, minFloor: 9, maxFloor: 24, behavior: 'chase', color: 0x3a9a6a
  },
  {
    key: 'm_skel', name: '蒼灯フクロウ', description: '青い灯火を吊るし、上空から氷弾を放つ機械フクロウ。',
    hp: 32, atkMin: 8, atkMax: 15, def: 5, exp: 10, gold: 10, score: 70,
    minFloor: 12, maxFloor: 28, behavior: 'ranged', ranged: true, wallPass: true, color: 0x4fd0ff
  },
  {
    key: 'm_archer', name: 'ギアホーネット', description: '小型の弩を抱え、雷を帯びた針で遠距離を射抜く機巧蜂。',
    hp: 26, atkMin: 7, atkMax: 14, def: 4, exp: 9, gold: 10, score: 65,
    minFloor: 5, maxFloor: 26, behavior: 'ranged', ranged: true, wallPass: true, color: 0xd0a13d
  },
  // ===== 深層獣群アップデート（新規23種） =====
  {
    key: 'm_ember_drake', name: '火鱗の幼竜', hp: 28, atkMin: 5, atkMax: 10, def: 4,
    exp: 7, gold: 8, score: 55, minFloor: 4, maxFloor: 13, behavior: 'chase', isDragonType: true, color: 0xd84a2a
  },
  {
    key: 'm_frost_wyrm', name: '氷晶ワーム', hp: 34, atkMin: 7, atkMax: 13, def: 5,
    exp: 9, gold: 10, score: 65, minFloor: 8, maxFloor: 18, behavior: 'loop', ranged: true, isDragonType: true, color: 0x62c8ff
  },
  {
    key: 'm_storm_wyvern', name: '雷翼ワイバーン', hp: 40, atkMin: 9, atkMax: 16, def: 6,
    exp: 12, gold: 13, score: 80, minFloor: 12, maxFloor: 23, behavior: 'line', ranged: true, isDragonType: true, color: 0x378dff
  },
  {
    key: 'm_brass_dragon', name: '真鍮竜ギアドラス', hp: 58, atkMin: 11, atkMax: 19, def: 13,
    exp: 17, gold: 20, score: 105, minFloor: 15, maxFloor: 26, behavior: 'slow', isDragonType: true, color: 0xc78a32
  },
  {
    key: 'm_void_drake', name: '虚空ドレイク', hp: 60, atkMin: 14, atkMax: 23, def: 9,
    exp: 20, gold: 24, score: 130, minFloor: 20, maxFloor: 29, behavior: 'loop', ranged: true,
    wallPass: true, isDragonType: true, color: 0x7a3bd1
  },
  {
    key: 'm_bone_dragon', name: '骨竜スカルヴァーン', hp: 74, atkMin: 16, atkMax: 26, def: 12,
    exp: 25, gold: 28, score: 155, minFloor: 23, maxFloor: 29, behavior: 'chase',
    isElite: true, isDragonType: true, color: 0xd8c7a3
  },
  {
    key: 'm_horn_demon', name: '双角デーモン', hp: 25, atkMin: 5, atkMax: 11, def: 3,
    exp: 6, gold: 7, score: 48, minFloor: 3, maxFloor: 13, behavior: 'chase', color: 0xc63838
  },
  {
    key: 'm_chain_demon', name: '鎖獄の悪魔', hp: 36, atkMin: 7, atkMax: 14, def: 6,
    exp: 10, gold: 11, score: 68, minFloor: 7, maxFloor: 19, behavior: 'line', color: 0x7d344f
  },
  {
    key: 'm_flame_gargoyle', name: '焔ガーゴイル', hp: 46, atkMin: 9, atkMax: 17, def: 12,
    exp: 13, gold: 14, score: 86, minFloor: 11, maxFloor: 22, behavior: 'slow', color: 0x5d5a58
  },
  {
    key: 'm_abyss_hound', name: '奈落の魔犬', hp: 35, atkMin: 10, atkMax: 18, def: 5,
    exp: 13, gold: 15, score: 88, minFloor: 14, maxFloor: 25, behavior: 'chase', color: 0x31356e
  },
  {
    key: 'm_mask_fiend', name: '仮面の魔人', hp: 42, atkMin: 12, atkMax: 20, def: 6,
    exp: 16, gold: 18, score: 105, minFloor: 17, maxFloor: 28, behavior: 'ranged',
    ranged: true, wallPass: true, color: 0x7245a8
  },
  {
    key: 'm_archdemon', name: '大悪魔アスモル', hp: 82, atkMin: 17, atkMax: 28, def: 14,
    exp: 29, gold: 34, score: 180, minFloor: 24, maxFloor: 29, behavior: 'chase', isElite: true, color: 0xb6292d
  },
  {
    key: 'm_bone_hound', name: '鉄殻アルマジロ', description: '分厚い鉄殻を丸め、雷をまとって一直線に突進する装甲獣。',
    hp: 34, atkMin: 7, atkMax: 13, def: 9, exp: 9, gold: 9, score: 62,
    minFloor: 5, maxFloor: 15, behavior: 'line', color: 0x4f6670
  },
  {
    key: 'm_skeleton_mage', name: 'ルーンマンドラゴラ', description: '浮遊するルーン石を操り、根を張ったまま氷の術を放つ魔草。',
    hp: 30, atkMin: 7, atkMax: 15, def: 4, exp: 10, gold: 12, score: 72,
    minFloor: 9, maxFloor: 20, behavior: 'ranged', ranged: true, color: 0x8a58bd
  },
  {
    key: 'm_death_knight', name: '死霊騎士', hp: 52, atkMin: 12, atkMax: 21, def: 13,
    exp: 18, gold: 20, score: 115, minFloor: 15, maxFloor: 26, behavior: 'chase', color: 0x34394c
  },
  {
    key: 'm_lich', name: 'リッチロード', hp: 66, atkMin: 15, atkMax: 25, def: 10,
    exp: 24, gold: 30, score: 155, minFloor: 22, maxFloor: 29, behavior: 'ranged',
    ranged: true, wallPass: true, isElite: true, color: 0x633e9e
  },
  {
    key: 'm_bone_colossus', name: '溶鉱炉タイタン', description: '炉心の炎で巨体を動かし、灼熱の鉄拳を振り下ろす機械巨人。',
    hp: 86, atkMin: 15, atkMax: 25, def: 17, exp: 27, gold: 30, score: 170,
    minFloor: 20, maxFloor: 29, behavior: 'slow', isElite: true, color: 0xc96b32
  },
  {
    key: 'm_grave_crawler', name: '墓這い', hp: 16, atkMin: 4, atkMax: 9, def: 1,
    exp: 4, gold: 4, score: 34, minFloor: 2, maxFloor: 12, behavior: 'line', color: 0x8b806f
  },
  {
    key: 'm_cerberus', name: '三首獄犬', hp: 68, atkMin: 14, atkMax: 24, def: 10,
    exp: 22, gold: 25, score: 140, minFloor: 18, maxFloor: 29, behavior: 'chase', isElite: true, color: 0x9e2f28
  },
  {
    key: 'm_hydra', name: '深淵ヒュドラ', hp: 76, atkMin: 15, atkMax: 26, def: 13,
    exp: 25, gold: 28, score: 158, minFloor: 21, maxFloor: 29, behavior: 'ranged',
    ranged: true, isDragonType: true, color: 0x363f9d
  },
  {
    key: 'm_crystal_crab', name: '晶甲クラブ', hp: 44, atkMin: 6, atkMax: 12, def: 15,
    exp: 11, gold: 16, score: 78, minFloor: 7, maxFloor: 18, behavior: 'slow', color: 0x2367a8
  },
  {
    key: 'm_blood_moth', name: '血月モス', hp: 28, atkMin: 8, atkMax: 15, def: 4,
    exp: 11, gold: 13, score: 76, minFloor: 10, maxFloor: 23, behavior: 'random',
    ranged: true, wallPass: true, color: 0x9a2f4e
  },
  {
    key: 'm_clockwork_chimera', name: '機巧キマイラ', hp: 78, atkMin: 16, atkMax: 27, def: 15,
    exp: 27, gold: 32, score: 172, minFloor: 23, maxFloor: 29, behavior: 'line', isElite: true, color: 0xb07b30
  },
  // ===== 追加モンスター（種類を増やす）=====
  {
    key: 'm_slime', name: 'ミミックチェスト', description: '宝箱に擬態し、近づいた冒険者へ雷を帯びた長い舌で襲いかかる。',
    hp: 20, atkMin: 4, atkMax: 9, def: 3, exp: 5, gold: 10, score: 38,
    minFloor: 1, maxFloor: 8, behavior: 'chase', color: 0x7b4a38
  },
  {
    key: 'm_beetle', name: 'ゼンマイ甲虫', hp: 24, atkMin: 5, atkMax: 9, def: 7,
    exp: 6, gold: 6, score: 45, minFloor: 3, maxFloor: 16, behavior: 'line', color: 0xc08a3a
  },
  {
    key: 'm_wisp', name: '迷い火ウィスプ', hp: 16, atkMin: 5, atkMax: 10, def: 2,
    exp: 7, gold: 7, score: 55, minFloor: 4, maxFloor: 18, behavior: 'loop', wallPass: true, color: 0xff9f40
  },
  {
    key: 'm_spider', name: 'カラクリ蜘蛛', hp: 30, atkMin: 7, atkMax: 12, def: 5,
    exp: 9, gold: 9, score: 60, minFloor: 7, maxFloor: 22, behavior: 'chase', color: 0x8a5a7a
  },
  {
    key: 'm_golem', name: '鉄塊ゴーレム', hp: 55, atkMin: 10, atkMax: 18, def: 13,
    exp: 14, gold: 16, score: 85, minFloor: 12, maxFloor: 26, behavior: 'slow', color: 0x7a7a8a
  },
  {
    key: 'm_eye', name: '監視の眼', hp: 30, atkMin: 9, atkMax: 16, def: 4,
    exp: 11, gold: 12, score: 75, minFloor: 13, maxFloor: 28, behavior: 'ranged', ranged: true, color: 0xd04fa0
  },
  {
    key: 'm_wraith', name: '虚無のレイス', hp: 38, atkMin: 11, atkMax: 19, def: 6,
    exp: 14, gold: 14, score: 90, minFloor: 18, maxFloor: 29, behavior: 'loop', wallPass: true, color: 0x6b50d0
  },
  {
    key: 'm_reaper', name: '深淵の刈手', hp: 52, atkMin: 14, atkMax: 24, def: 10,
    exp: 20, gold: 22, score: 120, minFloor: 22, maxFloor: 29, behavior: 'chase', isDragonType: true, color: 0xc03060
  },
  {
    key: 'm_guard', name: '深層の守衛', hp: 60, atkMin: 12, atkMax: 22, def: 14,
    exp: 20, gold: 25, score: 120, minFloor: 21, maxFloor: 30, behavior: 'chase', isElite: true, isDragonType: true, color: 0x3a3a5a
  },
  {
    key: 'm_watcher', name: 'コアウォッチャー', hp: 160, atkMin: 18, atkMax: 30, def: 16,
    exp: 80, gold: 100, score: 500, minFloor: 30, maxFloor: 30, behavior: 'ranged', ranged: true,
    isBoss: true, isDragonType: true, color: 0x2a2a4a
  }
];

export const MONSTER_DEFS: MonsterDef[] = MONSTER_DEFS_RAW.map((monster) => ({
  ...monster,
  element: MONSTER_ELEMENTS[monster.key]
}));

// ===== 階層テーマ（2フロアごとに名前・見た目が変わる）=====
export interface FloorTheme {
  name: string;
  era: 1 | 2 | 3 | 4;   // タイル素材の系統（1:遺跡 2:機械 3:深層 4:最深部）
  accent: number;
  tileTint: number;     // タイルに掛ける色（2階帯ごとに雰囲気を変える）
}

// 2フロア=1バンド。1〜10F=遺跡, 11〜20F=機械, 21〜29F=深層, 30F=最深部
// tileTint は大胆に色を変えて、フロアごとの雰囲気をガラッと変える
const THEME_BANDS: { name: string; era: 1 | 2 | 3 | 4; accent: number; tileTint: number }[] = [
  // 遺跡系（1-10F）
  { name: '苔むす回廊',   era: 1, accent: 0x3fe0d0, tileTint: 0xffffff },  // 自然な苔色
  { name: '忘却の広間',   era: 1, accent: 0x6fe0a0, tileTint: 0x6fe69a },  // 強い緑
  { name: '水没遺構',     era: 1, accent: 0x4fb0ff, tileTint: 0x66a0ff },  // 深い青
  { name: '蒼き祭壇',     era: 1, accent: 0x5fd0e0, tileTint: 0x5fe0e6 },  // シアン
  { name: '崩れた聖堂',   era: 1, accent: 0xd0c060, tileTint: 0xe6d666 },  // 黄金色の夕暮れ
  // 機械系（11-20F）
  { name: '歯車坑道',     era: 2, accent: 0xd0a040, tileTint: 0xe6b066 },  // 琥珀
  { name: '蒸気回廊',     era: 2, accent: 0x8fd0d0, tileTint: 0x7fd0d8 },  // 蒸気の青緑
  { name: '断裂回路',     era: 2, accent: 0xff8030, tileTint: 0xff9955 },  // 警告オレンジ
  { name: '魔導機関室',   era: 2, accent: 0xa06bff, tileTint: 0x9f80ff },  // 魔力の紫
  { name: '監視区画',     era: 2, accent: 0xff5050, tileTint: 0xff7f7f },  // 危険な赤
  // 深層系（21-29F）
  { name: '紫晶洞',       era: 3, accent: 0xa06bff, tileTint: 0xffffff },  // 自然な紫
  { name: '虚無の淵',     era: 3, accent: 0x6050ff, tileTint: 0x7066ff },  // 深い藍
  { name: '囁く回廊',     era: 3, accent: 0xe060ff, tileTint: 0xe07fff },  // 毒々しいピンク紫
  { name: '結晶墓所',     era: 3, accent: 0x60c0ff, tileTint: 0x7fc8ff },  // 氷の青
  { name: '深淵核域',     era: 3, accent: 0xff4070, tileTint: 0xff668f },  // 血の赤
];

const FINAL_THEME = { name: '最深部・コアゲート', era: 4 as const, accent: 0xf5c542, tileTint: 0xffd166 };

export function getTheme(floor: number): FloorTheme {
  if (floor >= 30) return FINAL_THEME;
  const band = Math.floor((floor - 1) / 2); // 0..14
  return THEME_BANDS[Math.min(band, THEME_BANDS.length - 1)];
}

// タイル素材の系統サフィックス（_1/_11/_21/_30）
export function eraSuffix(era: number): string {
  return era === 1 ? '_1' : era === 2 ? '_11' : era === 3 ? '_21' : '_30';
}
