import Phaser from 'phaser';
import type { Dir, MonsterDef, Vec2 } from './types';
import type { MonsterAnimationState } from './monsterAnimation';
import type { MonsterDirectionArt, MonsterDirectionMotion } from './monsterDirections';
import type { ChallengeWave } from './difficultyChallenge';

export class Enemy {
  def: MonsterDef;
  hp: number;
  hpMax: number;
  x: number;
  y: number;
  sprite!: Phaser.GameObjects.Image;
  shadow?: Phaser.GameObjects.Image;
  aura?: Phaser.GameObjects.Image;   // ボス/エリートの特殊オーラ
  hpBar!: Phaser.GameObjects.Graphics;
  skillDebuffVisualKey = '';
  midBossVisualMultiplier = 1;
  baseScale = 1;      // 呼吸アニメ用の基準スケール
  bobPhase = 0;       // アイドル揺れの位相
  animating = false;
  frameAnimation?: MonsterAnimationState;
  directionArt?: MonsterDirectionArt;
  directionMotion?: MonsterDirectionMotion;
  slowToggle = false;     // slow行動用
  freezeTurns = 0;        // 氷結
  freezeFx?: Phaser.GameObjects.Container;
  sealTurns = 0;          // 封印
  poisonTurns = 0;        // 被毒
  loopDir = 0;            // ループ移動方向index
  lineDir: { x: number; y: number } | null = null;
  facing: Dir = 'down';
  moveSteps = 0;
  stealthRevealed = false;
  gimmickCounter = 0;
  gimmickPhase = 0;
  vulnerableTurns = 0;
  guardOpenTurns = 0;
  emedralStunUntil = -1;
  emedralAffected = false;
  emedralWeakUntil = 0;
  stunnedTurns = 0;
  skillAttackDownUntil = -1;
  skillDefenseDownUntil = -1;
  awakened = false;
  revived = false;
  regenBlockedTurns = 0;
  summoned = false;
  cloneDepth = 0;
  charging = false;
  chargeDir: { x: number; y: number } | null = null;
  plannedMove?: Vec2 | null;
  challengeTurn = 0;
  challengeWaves: ChallengeWave[] = [];

  constructor(def: MonsterDef, x: number, y: number, hpScale: number) {
    this.def = def;
    this.hpMax = Math.floor(def.hp * hpScale);
    this.hp = this.hpMax;
    this.x = x;
    this.y = y;
  }

  get alive(): boolean {
    return this.hp > 0;
  }
}
