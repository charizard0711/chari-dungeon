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

export interface Weapon {
  key: string;       // テクスチャ/種別キー
  name: string;
  atkMin: number;
  atkMax: number;
  durMax: number;
  dur: number;
  magics: Magic[];
  plus: number;      // 強化値（+1で黄, +2紫, +3青, +4以降赤）。強化石で上昇
  repairUsed?: boolean; // R効果の使用済みフラグ
  dual?: boolean;    // 二刀流（2回攻撃・盾装備不可）
}

export interface Shield {
  key: string;
  name: string;
  defBonus: number;
  durMax: number;
  dur: number;
  plus: number;   // 盾強化石で上昇（縦の強化）。+1ごとに防御+1
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
  | 'map'         // 古地図の巻物
  | 'seal'        // 封印の魔導書
  | 'stone'       // 武器強化石（ダンジョンコアの欠片）＝横の強化
  | 'shieldstone' // 盾強化石＝縦の強化
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
  color: number;          // 代替ドット絵の基調色
}

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
