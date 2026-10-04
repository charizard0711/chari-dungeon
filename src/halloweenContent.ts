import type { MonsterDef } from './types';
import type { WeaponDef, ShieldDef } from './data';

export const HALLOWEEN_TITLE = '呪われた収穫城';
export const HALLOWEEN_FLOORS = ['カボチャの庭園', '霧灯りの墓地', '魔女の書庫', '首なし騎士の回廊', '収穫王の玉座'] as const;
export const HALLOWEEN_COLORS = [0xffb04c, 0x8de4ec, 0xc891f2, 0xf19a6b, 0xffce72] as const;
export const HALLOWEEN_WEAPONS: WeaponDef[] = [
  { key: 'w_hw_candy', name: 'パンプキン卿のキャンディ剣', weaponType: 'longsword', atkMin: 8, atkMax: 17, durMax: 220, grade: 'C', minFloor: 1, rarity: 1, exclusiveLoot: true, passive: { key: 'sturdy', name: '甘い守り', description: '受けるダメージ-5%' } },
  { key: 'w_hw_lantern', name: '墓守の鬼火槍', weaponType: 'lance', atkMin: 10, atkMax: 21, durMax: 210, grade: 'B', element: 'ice', minFloor: 1, rarity: 1, exclusiveLoot: true },
  { key: 'w_hw_bat', name: '魔女のコウモリ弓', weaponType: 'bow', atkMin: 12, atkMax: 24, durMax: 200, grade: 'A', minFloor: 1, rarity: 1, exclusiveLoot: true },
  { key: 'w_hw_coffin', name: '首なし騎士の焔大剣', weaponType: 'greatsword', atkMin: 14, atkMax: 28, durMax: 240, grade: 'A', element: 'fire', minFloor: 1, rarity: 1, exclusiveLoot: true },
  { key: 'w_hw_harvest', name: '収穫王の茨剣', weaponType: 'longsword', atkMin: 16, atkMax: 30, durMax: 260, grade: 'S', element: 'fire', minFloor: 1, rarity: 1, exclusiveLoot: true },
  { key: 'w_hw_emedral', name: 'エメドラル', weaponType: 'bow', atkMin: 16, atkMax: 30, durMax: 300, grade: 'SSS', initialPlus: 10, element: 'ice', minFloor: 1, rarity: 1, exclusiveLoot: true, passive: { key: 'emedral', name: '氷翠の封縛', description: '2回に1回の命中で1ターンスタン＋5ターン攻撃力30%低下。同じ敵には一度だけ' } }
];
export const HALLOWEEN_SHIELDS: ShieldDef[] = [
  { key: 's_hw_pumpkin', name: 'パンプキン卿の笑顔盾', defBonus: 4, durMax: 180, grade: 'C', minFloor: 1, rarity: 1, exclusiveLoot: true, passive: { key: 'brace', name: 'カボチャの守り', description: '10以上の攻撃ダメージを20%軽減' } },
  { key: 's_hw_grave', name: '墓守の石碑盾', defBonus: 5, durMax: 200, grade: 'B', element: 'ice', minFloor: 1, rarity: 1, exclusiveLoot: true, passive: { key: 'element_guard', name: '冷たい霧', description: '同属性の攻撃を軽減' } },
  { key: 's_hw_moon', name: '魔女の三日月盾', defBonus: 6, durMax: 210, grade: 'A', minFloor: 1, rarity: 1, exclusiveLoot: true, passive: { key: 'mirror', name: '月の鏡', description: '15%の確率で攻撃を完全に無効化' } },
  { key: 's_hw_coffin', name: '首なし騎士の黒棺盾', defBonus: 8, durMax: 230, grade: 'A', minFloor: 1, rarity: 1, exclusiveLoot: true, passive: { key: 'thorns', name: '棺の棘', description: '攻撃ダメージの25%を反射' } },
  { key: 's_hw_harvest', name: '収穫王の紋章盾', defBonus: 10, durMax: 260, grade: 'S', element: 'fire', minFloor: 1, rarity: 1, exclusiveLoot: true, passive: { key: 'recovery', name: '収穫の恵み', description: '4回攻撃を受けるごとにHPを6回復' } }
];
export const GOLDEN_SHIELD: ShieldDef = { key: 's_hw_emerald', name: '氷翠の王盾', defBonus: 16, durMax: 300, grade: 'SSS', initialPlus: 10, element: 'ice', minFloor: 1, rarity: 1, exclusiveLoot: true, passive: { key: 'emerald_guard', name: '氷翠の王域', description: '被ダメージの20%を反射。HP20%以下で3ターン無敵。発動後100ターンは再発動不可。HP20%超への回復も必要' } };
HALLOWEEN_SHIELDS.push(GOLDEN_SHIELD);
const base = { minFloor: 31, maxFloor: 35, color: 0xffa64d, behavior: 'chase' as const, element: null };
// Floors outside the regular adventure keep these out of its spawn pools.
export const HALLOWEEN_BOSSES: MonsterDef[] = [
  { ...base, key: 'm_hw_pumpkin_lord', name: 'パンプキン卿', description: '爆弾カボチャ3個を2ターン後に爆発させる。HP半分で横・縦の連続斬り。爆弾を壊して逃げ道を作ろう。', hp: 150, atkMin: 9, atkMax: 16, def: 3, exp: 35, gold: 25, score: 180 },
  { ...base, key: 'm_hw_gravekeeper', name: '霧灯の墓守', description: '鬼火ランタン2個が被ダメージを50%軽減。冷気の予告帯を避けてランタンを壊すと、2ターン動けなくなる。', hp: 200, atkMin: 11, atkMax: 19, def: 4, exp: 45, gold: 35, score: 240, element: 'ice' },
  { ...base, key: 'm_hw_witch', name: '月夜のカボチャ魔女', description: '分身2体と毒の魔法陣を操る。緑の魔力をまとう本物を狙い、詠唱中に最大HP8%分のダメージかスタンで中断しよう。', hp: 245, atkMin: 13, atkMax: 22, def: 5, exp: 60, gold: 45, score: 300 },
  { ...base, key: 'm_hw_headless', name: '首なし騎士グリム', description: '正面からの攻撃を50%軽減。突進・振り返り斬り・薙ぎ払いの順に予告が来る。大技後2ターンは被ダメージ1.5倍。', hp: 310, atkMin: 16, atkMax: 26, def: 7, exp: 80, gold: 60, score: 400, element: 'fire' },
  { ...base, key: 'm_hw_king', name: '収穫王ジャック', description: '茨の心臓が4ターンごとに回復させる。心臓を壊して回復を止めよう。HP半分で覚醒し、鬼火と切り払える茨を広げる。', hp: 450, atkMin: 19, atkMax: 31, def: 8, exp: 120, gold: 100, score: 800, element: 'fire' }
];
HALLOWEEN_BOSSES.forEach(boss => { boss.hp *= 2; });
export const HALLOWEEN_MOBS: MonsterDef[] = [
  { ...base, key: 'm_hw_pumpkin', name: '跳ねカボチャ', hp: 26, atkMin: 5, atkMax: 9, def: 1, exp: 8, gold: 3, score: 15, gimmick: 'lantern', description: '蔓の足で跳ねるカボチャ。倒すとランタンの光が広がる。' },
  { ...base, key: 'm_hw_bat', name: 'キャンディコウモリ', hp: 20, atkMin: 4, atkMax: 8, def: 0, exp: 7, gold: 3, score: 15, behavior: 'random', description: '紫の羽で飛び回る、お菓子好きな使い魔。' },
  { ...base, key: 'm_hw_ghost', name: '灯りおばけ', hp: 30, atkMin: 5, atkMax: 10, def: 1, exp: 9, gold: 4, score: 20, behavior: 'loop', wallPass: true, gimmick: 'phase', description: '青い灯りを運ぶ幽霊。壁をすり抜けて近づく。' },
  { ...base, key: 'm_hw_slime', name: '魔女のカボチャゼリー', hp: 38, atkMin: 6, atkMax: 11, def: 2, exp: 10, gold: 5, score: 25, behavior: 'slow', gimmick: 'mud_bind', description: '魔女の釜から生まれたゼリー。足元を絡め取る。' }
];
export const HALLOWEEN_RETAINERS: MonsterDef[] = [
  { ...base, key: 'm_hw_squire', name: 'キャンディ近衛騎士', hp: 42, atkMin: 6, atkMax: 10, def: 2, exp: 12, gold: 5, score: 30, isHalloweenRetainer: true },
  { ...base, key: 'm_hw_sentinel', name: '鬼火の墓地番兵', hp: 52, atkMin: 7, atkMax: 12, def: 2, exp: 15, gold: 6, score: 35, element: 'ice', isHalloweenRetainer: true },
  { ...base, key: 'm_hw_familiar', name: '月夜のカボチャ使い魔', hp: 62, atkMin: 8, atkMax: 14, def: 3, exp: 18, gold: 7, score: 40, isHalloweenRetainer: true },
  { ...base, key: 'm_hw_soldier', name: '首なし騎士の黒鉄兵', hp: 75, atkMin: 10, atkMax: 16, def: 4, exp: 22, gold: 8, score: 45, element: 'fire', isHalloweenRetainer: true },
  { ...base, key: 'm_hw_royal_guard', name: '収穫王の茨近衛兵', hp: 90, atkMin: 11, atkMax: 18, def: 5, exp: 26, gold: 10, score: 50, isHalloweenRetainer: true }
];
export const GOLDEN_KING: MonsterDef = { ...HALLOWEEN_BOSSES[4], key: 'm_hw_golden_king', name: '金の収穫王', hp: 1200, exp: 180, gold: 300, score: 1500, description: '最終階に1%で登場。黄金の収穫祭は3ターン後に大爆発。近衛兵を倒した跡へ避難しよう。爆発後2ターンは被ダメージ1.5倍。伝説の弓と盾を各10%で落とす。' };
export const HALLOWEEN_MONSTERS = [...HALLOWEEN_BOSSES, ...HALLOWEEN_MOBS, ...HALLOWEEN_RETAINERS, GOLDEN_KING];
export const HALLOWEEN_PROP_NAMES = ['stairs', 'wall', 'gate', 'pumpkins', 'grave', 'lantern', 'cauldron', 'books', 'armor', 'coffin', 'throne', 'tree', 'chest', 'chest_open', 'candy', 'barrel'] as const;
export const HALLOWEEN_ART: Record<string, string> = Object.fromEntries([
  ...['aura_a', 'aura_b', 'freeze', 'barrier'].map(p => [`fx_hw_${p}`, `assets/halloween-fx-v1/${p}.png`]),
  ['i_candykey', 'assets/halloween-loot-v1/candykey.png'],
  ...HALLOWEEN_MONSTERS.map(m => [m.key, `assets/${m.isHalloweenRetainer ? 'halloween-retainers-v1' : 'halloween-v1'}/${m.key}.png`]),
  ...[...HALLOWEEN_WEAPONS, ...HALLOWEEN_SHIELDS].map(e => [e.key, `assets/halloween-v1/${e.key}.png`]),
  ...HALLOWEEN_PROP_NAMES.map(p => [`hw_${p}`, `assets/${p === 'wall' ? 'halloween-wall-v3' : 'halloween-props-v2'}/${p}.png`]),
  ...[1, 2, 3, 4, 5].flatMap(n => [[`hw_floor_${n}`, `assets/halloween-v1/floor-${n}.png`], [`hw_backdrop_${n}`, `assets/halloween-v1/backdrop-${n}.webp`]])
]);
