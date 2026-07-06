import Phaser from 'phaser';
import type { MonsterDef } from './types';

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
  baseScale = 1;      // 呼吸アニメ用の基準スケール
  bobPhase = 0;       // アイドル揺れの位相
  slowToggle = false;     // slow行動用
  freezeTurns = 0;        // 氷結
  sealTurns = 0;          // 封印
  poisonTurns = 0;        // 被毒
  loopDir = 0;            // ループ移動方向index
  lineDir: { x: number; y: number } | null = null;

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
