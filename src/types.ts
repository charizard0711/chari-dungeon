// ===== 共通型定義 =====

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Vec2 {
  x: number;
  y: number;
}

// 武器マジック（特殊効果）
export type MagicCode =
  | 'B'   // 攻撃力最大値アップ (B2〜B6)
  | 'A'   // 攻撃力全体アップ (A1〜A3)
  | 'H'   // 武器耐久力アップ (H1〜H3)
  | 'R'   // リペア（壊れても1回復活）
  | 'F'   // ファイア（炎追加ダメージ）
  | 'D'   // ドレイン（HP吸収）
  | 'DK'  // ドラゴン/深層特効
  | 'C'   // クリティカル率アップ
  | 'P'   // 毒付与
  | 'I'   // 氷結（1ターン停止）
  | 'K';  // 撃破スコアアップ

export interface Magic {
  code: MagicCode;
  level: number; // B2〜B6 の 2〜6 など
  label: string;
}

export type EquipmentGrade = 'D' | 'C' | 'B' | 'A' | 'S';

export type Element = 'fire' | 'thunder' | 'water' | 'ice';
export type WeaponType = 'dagger' | 'longsword' | 'lance' | 'bow' | 'greatsword' | 'dual_sword' | 'twin_daggers';

export interface WeaponPassive {
  key: 'backstab' | 'sturdy' | 'pierce' | 'eagle_eye' | 'heavy_strike' | 'twin_edge' | 'blood_edge' | 'knockback';
  name: string;
  description: string;
}

export interface Weapon {
  key: string;       // テクスチャ/種別キー
  name: string;
  atkMin: number;
  atkMax: number;
  durMax: number;
  dur: number;
  magics: Magic[];
  grade: EquipmentGrade;
  plus: number;      // 強化値（+1で黄, +2紫, +3青, +4以降赤）。武器強化スクロールで上昇
  repairUsed?: boolean; // R効果の使用済みフラグ
  dual?: boolean;    // 二刀流（2回攻撃・盾装備不可）
  weaponType: WeaponType;
  element?: Element;
  passive?: WeaponPassive;
  ss?: boolean;
  specialCounter?: number;
}

export interface ShieldPassive {
  key: 'brace' | 'mirror' | 'thorns' | 'perfect_guard' | 'recovery' | 'element_guard';
  name: string;
  description: string;
}

export interface Shield {
  key: string;
  name: string;
  defBonus: number;
  durMax: number;
  dur: number;
  grade: EquipmentGrade;
  plus: number;   // 防具強化スクロールで上昇（縦の強化）。+1ごとに防御+1
  element?: Element;
  passive?: ShieldPassive;
  guardCounter?: number;
}

export type ItemKind =
  | 'potion'      // 回復ポーション
  | 'shroom'      // 光るキノコ
  | 'smoke'       // 煙幕ボトル
  | 'bomb'        // ボムナッツ
  | 'warp'        // ワープベル
  | 'revive'      // 復活のタネ
  | 'oldkey'      // 古びた鍵
  | 'floorkey'    // フロアキー
  | 'seal'        // 封印の魔導書
  | 'stone'       // 武器強化スクロール＝横の強化（保存互換のためIDは維持）
  | 'shieldstone' // 防具強化スクロール＝縦の強化（保存互換のためIDは維持）
  | 'invis'       // 透明ポーション（20ターン敵から見えなくなる）
  | 'dash';       // 疾風の羽（20歩の間、1歩で2マス進める）

export interface Item {
  kind: ItemKind;
  name: string;
  desc: string;
  textureKey: string;
}

export interface MonsterDef {
  key: string;
  name: string;
  description?: string;
  hp: number;
  atkMin: number;
  atkMax: number;
  def: number;
  exp: number;
  gold: number;
  score: number;
  minFloor: number;
  maxFloor: number;
  behavior: MonsterBehavior;
  ranged?: boolean;
  wallPass?: boolean;
  isElite?: boolean;
  isBoss?: boolean;
  isFloorBoss?: boolean;
  isDragonType?: boolean; // DK特効対象
  isDarkNinja?: boolean;  // 通常は透明で、3歩ごとに姿を見せる
  isTreasureRabbit?: boolean; // 攻撃せず逃げ続けるレア報酬モンスター
  gimmick?: MonsterGimmick;
  gimmickText?: string;
  bossTint?: number;
  color: number;          // 代替ドット絵の基調色
  element?: Element;
}

export type MonsterGimmick =
  | 'lantern' | 'burrow' | 'split' | 'phase' | 'shell_guard' | 'vine_trail'
  | 'mud_bind' | 'regen' | 'shatter' | 'stance' | 'key_drop' | 'freeze_shot'
  | 'sidestep' | 'fire_breath' | 'ice_trail' | 'storm_trail' | 'heat'
  | 'warp' | 'revive' | 'enrage' | 'pull' | 'statue' | 'rush' | 'item_seal'
  | 'summon' | 'root' | 'knight_guard' | 'necromancy' | 'heat_aura'
  | 'ambush' | 'multi_bite' | 'hydra_regen' | 'rear_weak' | 'vampire'
  | 'element_cycle' | 'mimic' | 'charge' | 'death_burst' | 'web_trail'
  | 'golem_guard' | 'laser_lock' | 'wraith_phase' | 'execute' | 'stealth'
  | 'parry' | 'bull_charge' | 'starfall' | 'treasure_flee' | 'guardian'
  | 'core_laser';

export type MonsterBehavior =
  | 'chase'      // 追尾
  | 'slow'       // 2ターンに1回行動
  | 'random'     // ランダム移動
  | 'loop'       // ぐるぐる（壁抜け）
  | 'line'       // 直線移動
  | 'ranged';    // 遠距離攻撃

export type TileType =
  | 'wall'
  | 'floor'
  | 'stairs'
  | 'water'
  | 'poison'
  | 'pit'
  | 'rune'
  | 'cracked'
  | 'door';
