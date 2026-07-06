// ========================================================================
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
  // 1F〜10F：探索感のある16bit風ダンジョンBGM
  ruins:    { key: 'bgm_ruins',    path: 'assets/audio/bgm_ruins.mp3',    volume: 0.5,  loop: true },
  // 11F〜20F：歯車・機械迷宮っぽい緊張感のあるBGM
  machine:  { key: 'bgm_machine',  path: 'assets/audio/bgm_machine.mp3',  volume: 0.5,  loop: true },
  // 21F〜29F：深層コアの危険な雰囲気のBGM
  core:     { key: 'bgm_core',     path: 'assets/audio/bgm_core.mp3',     volume: 0.5,  loop: true },
  // 30F：最深部・ラスボス前の緊張感あるBGM
  final:    { key: 'bgm_final',    path: 'assets/audio/bgm_final.mp3',    volume: 0.55, loop: true },
  // クリア：短い勝利ジングル
  clear:    { key: 'bgm_clear',    path: 'assets/audio/bgm_clear.mp3',    volume: 0.6,  loop: false },
  // ゲームオーバー：短い敗北ジングル
  gameover: { key: 'bgm_gameover', path: 'assets/audio/bgm_gameover.mp3', volume: 0.6,  loop: false }
} satisfies Record<string, AudioDef>;

export type BgmName = keyof typeof BGM_DEFS;

// 階層 → BGMトラックのマッピング
export function bgmForFloor(floor: number): BgmName {
  if (floor <= 10) return 'ruins';
  if (floor <= 20) return 'machine';
  if (floor <= 29) return 'core';
  return 'final';
}

// ---- 効果音（システム音）----
export const SE_DEFS = {
  click:   { key: 'se_click',   path: 'assets/audio/se_click.mp3',   volume: 0.5 },  // UIクリック
  step:    { key: 'se_step',    path: 'assets/audio/se_step.mp3',    volume: 0.35 }, // 足音
  attack:  { key: 'se_attack',  path: 'assets/audio/se_attack.mp3',  volume: 0.6 },  // 攻撃
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
