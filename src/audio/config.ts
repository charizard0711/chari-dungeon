// ========================================================================
import type { Element, WeaponType } from '../types';
// 音源パス定数
// 本物のmp3/oggに差し替える場合は public/assets/audio/ に
// 下記ファイル名で置くだけでOK（自動で読み込まれ、仮BGMより優先される）。
// ファイルが無い場合は synth.ts が仮チップチューンを自動生成する。
// ========================================================================

export interface AudioDef {
  key: string;     // Phaser sound キー
  path: string;    // 音源ファイルパス（public/ 基準）
  volume: number;  // 基本音量 (0-1)
  loop?: boolean;
}

// ---- BGM ----
export const BGM_DEFS = {
  // タイトル画面：明るく不思議なレトロBGM
  title:    { key: 'bgm_title',    path: 'assets/audio/bgm_title.mp3',    volume: 0.5,  loop: true },
  // ダンジョン：明るい冒険曲を2階ごとに切り替え、10階で一巡する
  floor01:  { key: 'bgm_floor01',  path: 'assets/audio/bgm_floors_01_02.wav', volume: 0.5, loop: true },
  floor03:  { key: 'bgm_floor03',  path: 'assets/audio/bgm_floors_03_04.wav', volume: 0.5, loop: true },
  floor05:  { key: 'bgm_floor05',  path: 'assets/audio/bgm_floors_05_06.wav', volume: 0.5, loop: true },
  floor07:  { key: 'bgm_floor07',  path: 'assets/audio/bgm_floors_07_08.wav', volume: 0.5, loop: true },
  floor09:  { key: 'bgm_floor09',  path: 'assets/audio/bgm_floors_09_10.wav', volume: 0.5, loop: true },
  // 7x7中ボス部屋：入口封鎖から撃破まで流れる高速メタル戦闘曲
  midboss:  { key: 'bgm_midboss',  path: 'assets/audio/bgm_midboss.wav', volume: 0.44, loop: true },
  // 5階ごとの大ボス部屋：氷晶大聖堂（チェレスタ＋弦楽＋控えめな合唱）
  boss:     { key: 'bgm_boss',     path: 'assets/audio/bgm_boss.wav', volume: 0.46, loop: true },
  // クリア：短い勝利ジングル
  clear:    { key: 'bgm_clear',    path: 'assets/audio/bgm_clear.mp3',    volume: 0.6,  loop: false },
  // ゲームオーバー：短い敗北ジングル
  gameover: { key: 'bgm_gameover', path: 'assets/audio/bgm_gameover.mp3', volume: 0.6,  loop: false }
} satisfies Record<string, AudioDef>;

export type BgmName = keyof typeof BGM_DEFS;

// 階層 → BGMトラックのマッピング
export function bgmForFloor(floor: number): BgmName {
  // 2階ごとに曲を切り替え、5曲を循環させる（29F〜30Fは「黄金のゴール」）。
  const band = Math.floor((Math.max(1, floor) - 1) / 2);
  return (['floor01', 'floor03', 'floor05', 'floor07', 'floor09'] as const)[band % 5];
}

// ---- 効果音（システム音）----
export const SE_DEFS = {
  click:   { key: 'se_click',   path: 'assets/audio/se_click.mp3',   volume: 0.5 },  // UIクリック
  step:    { key: 'se_step',    path: 'assets/audio/se_step.mp3',    volume: 0.35 }, // 足音
  attack:  { key: 'se_attack',  path: 'assets/audio/se_attack.mp3',  volume: 0.6 },  // 攻撃
  weaponDagger:     { key: 'se_weapon_dagger',     path: 'assets/audio/se_weapon_dagger.wav',     volume: 0.48 },
  weaponLongsword:  { key: 'se_weapon_longsword',  path: 'assets/audio/se_weapon_longsword.wav',  volume: 0.52 },
  weaponLance:      { key: 'se_weapon_lance',      path: 'assets/audio/se_weapon_lance.wav',      volume: 0.54 },
  weaponBow:        { key: 'se_weapon_bow',        path: 'assets/audio/se_weapon_bow.wav',        volume: 0.52 },
  weaponHandgun:    { key: 'se_weapon_handgun',    path: 'assets/audio/se_weapon_handgun.wav',    volume: 0.54 },
  weaponGreatsword: { key: 'se_weapon_greatsword', path: 'assets/audio/se_weapon_greatsword.wav', volume: 0.56 },
  weaponDual:       { key: 'se_weapon_dual',       path: 'assets/audio/se_weapon_dual.wav',       volume: 0.50 },
  elementFire:    { key: 'se_element_fire',    path: 'assets/audio/se_element_fire.mp3',    volume: 0.62 }, // 火属性攻撃
  elementWater:   { key: 'se_element_water',   path: 'assets/audio/se_element_water.mp3',   volume: 0.58 }, // 水属性攻撃
  elementThunder: { key: 'se_element_thunder', path: 'assets/audio/se_element_thunder.mp3', volume: 0.62 }, // 雷属性攻撃
  elementIce:     { key: 'se_element_ice',     path: 'assets/audio/se_element_ice.mp3',     volume: 0.58 }, // 氷属性攻撃
  hit:     { key: 'se_hit',     path: 'assets/audio/se_hit.mp3',     volume: 0.6 },  // 命中
  hurt:    { key: 'se_hurt',    path: 'assets/audio/se_hurt.mp3',    volume: 0.6 },  // 被ダメージ
  kill:    { key: 'se_kill',    path: 'assets/audio/se_kill.mp3',    volume: 0.6 },  // 敵撃破
  coin:    { key: 'se_coin',    path: 'assets/audio/se_coin.mp3',    volume: 0.5 },  // コイン・宝石
  pickup:  { key: 'se_pickup',  path: 'assets/audio/se_pickup.mp3',  volume: 0.5 },  // アイテム取得
  chest:   { key: 'se_chest',   path: 'assets/audio/se_chest.mp3',   volume: 0.6 },  // 宝箱
  stairs:  { key: 'se_stairs',  path: 'assets/audio/se_stairs.mp3',  volume: 0.6 },  // 階段
  levelup: { key: 'se_levelup', path: 'assets/audio/se_levelup.mp3', volume: 0.65 }, // レベルアップ
  heal:    { key: 'se_heal',    path: 'assets/audio/se_heal.mp3',    volume: 0.55 }, // 回復
  bomb:    { key: 'se_bomb',    path: 'assets/audio/se_bomb.mp3',    volume: 0.7 },  // 爆発
  warp:    { key: 'se_warp',    path: 'assets/audio/se_warp.mp3',    volume: 0.55 }, // ワープ
  break:   { key: 'se_break',   path: 'assets/audio/se_break.mp3',   volume: 0.65 }, // 装備破損
  seal:    { key: 'se_seal',    path: 'assets/audio/se_seal.mp3',    volume: 0.55 }, // 封印・魔法
  deny:    { key: 'se_deny',    path: 'assets/audio/se_deny.mp3',    volume: 0.4 }   // 不可・ブロック
} satisfies Record<string, AudioDef>;

export type SeName = keyof typeof SE_DEFS;

export function elementAttackSe(element: Element): SeName {
  return ({
    fire: 'elementFire', water: 'elementWater', thunder: 'elementThunder', ice: 'elementIce'
  } as const)[element];
}

export function weaponAttackSe(type?: WeaponType): SeName {
  if (!type) return 'attack';
  return ({
    dagger: 'weaponDagger',
    longsword: 'weaponLongsword',
    lance: 'weaponLance',
    bow: 'weaponBow',
    handgun: 'weaponHandgun',
    greatsword: 'weaponGreatsword',
    dual_sword: 'weaponDual',
    twin_daggers: 'weaponDual'
  } as const)[type];
}
