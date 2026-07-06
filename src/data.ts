import type { Weapon, Shield, Item, ItemKind, MonsterDef, MagicCode } from './types';

// ===== 武器定義 =====
export interface WeaponDef {
  key: string;
  name: string;
  atkMin: number;
  atkMax: number;
  durMax: number;
  minFloor: number;
  rarity: number; // 出現しやすさの重み（小さいほどレア）
  dual?: boolean; // 二刀流（1ターンに2回攻撃・盾装備不可）
}

export const WEAPON_DEFS: WeaponDef[] = [
  { key: 'w_screw', name: '螺旋槍スパイラス', atkMin: 5, atkMax: 12, durMax: 40, minFloor: 1, rarity: 10 },
  { key: 'w_star', name: '流星刃ステラ', atkMin: 7, atkMax: 15, durMax: 35, minFloor: 1, rarity: 8 },
  { key: 'w_gearhammer', name: '破城鎚ギガギア', atkMin: 10, atkMax: 22, durMax: 55, minFloor: 4, rarity: 6 },
  { key: 'w_rune', name: '魔紋剣ルーンヴェイン', atkMin: 12, atkMax: 26, durMax: 60, minFloor: 6, rarity: 5 },
  { key: 'w_vine', name: '茨鞭ローズヴァイン', atkMin: 9, atkMax: 20, durMax: 50, minFloor: 5, rarity: 6 },
  { key: 'w_candle', name: '灯杖ルミナリア', atkMin: 11, atkMax: 24, durMax: 60, minFloor: 8, rarity: 5 },
  { key: 'w_compass', name: '羅針槍アジマス', atkMin: 8, atkMax: 18, durMax: 38, minFloor: 3, rarity: 7 },
  { key: 'w_dark', name: '深淵牙ノクティス', atkMin: 15, atkMax: 30, durMax: 75, minFloor: 12, rarity: 4 },
  { key: 'w_gearaxe', name: '断罪斧ジャッジガイア', atkMin: 18, atkMax: 36, durMax: 95, minFloor: 15, rarity: 3 },
  { key: 'w_gravity', name: '重星杖グラビトス', atkMin: 20, atkMax: 44, durMax: 90, minFloor: 20, rarity: 2 },
  // ===== 二刀流（レア・2回攻撃・盾装備不可）=====
  { key: 'w_twin', name: '双牙刃リンクス', atkMin: 8, atkMax: 16, durMax: 80, minFloor: 8, rarity: 2, dual: true },
  { key: 'w_soulblades', name: '双魂剣ゲミノス', atkMin: 13, atkMax: 24, durMax: 100, minFloor: 16, rarity: 1, dual: true }
];

// ===== 盾定義 =====
export interface ShieldDef {
  key: string;
  name: string;
  defBonus: number;
  durMax: number;
  minFloor: number;
}

export const SHIELD_DEFS: ShieldDef[] = [
  { key: 's_gear', name: '機装盾ギアヴァルト', defBonus: 2, durMax: 40, minFloor: 1 },
  { key: 's_crystal', name: '晶盾クリスタリア', defBonus: 4, durMax: 55, minFloor: 8 },
  { key: 's_skull', name: '死王盾スカルレクス', defBonus: 6, durMax: 70, minFloor: 16 }
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
  map:     { name: '古地図の巻物', desc: 'この階のマップを表示する', textureKey: 'i_map' },
  seal:    { name: '封印の魔導書', desc: '周囲の敵を数ターン止める', textureKey: 'i_seal' },
  stone:   { name: '武器強化石', desc: '武器を+1強化。成功70%(+5〜は50%)、失敗で焼失', textureKey: 'i_stone' },
  shieldstone: { name: '盾強化石', desc: '盾を+1強化(防御UP)。成功70%、失敗で破壊', textureKey: 'i_shieldstone' },
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

export function makeItem(kind: ItemKind): Item {
  return { kind, ...ITEM_DEFS[kind] };
}

// ===== モンスター定義 =====
export const MONSTER_DEFS: MonsterDef[] = [
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
    key: 'm_skel', name: 'トーチスケルトン', hp: 32, atkMin: 8, atkMax: 15, def: 5,
    exp: 10, gold: 10, score: 70, minFloor: 12, maxFloor: 28, behavior: 'ranged', ranged: true, color: 0x4fd0ff
  },
  {
    key: 'm_archer', name: 'ボーンアーチャー', hp: 26, atkMin: 7, atkMax: 14, def: 4,
    exp: 9, gold: 10, score: 65, minFloor: 5, maxFloor: 26, behavior: 'ranged', ranged: true, color: 0xd8d2c0
  },
  // ===== 追加モンスター（種類を増やす）=====
  {
    key: 'm_slime', name: 'ネジスライム', hp: 14, atkMin: 2, atkMax: 6, def: 0,
    exp: 3, gold: 4, score: 25, minFloor: 1, maxFloor: 8, behavior: 'random', color: 0x6fd06f
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
