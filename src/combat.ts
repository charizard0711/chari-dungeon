import type { Weapon, Shield, MonsterDef } from './types';
import { Player } from './player';

export interface AttackResult {
  damage: number;
  hits: number;   // 攻撃回数（二刀流=2）
  crit: boolean;
  fire: number;
  drain: number;
  poison: boolean;
  freeze: boolean;
  weaponBroke: boolean;
  weaponRevived: boolean;
  killScoreBonus: number;
}

function irand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// プレイヤー→敵 の攻撃計算
export function computePlayerAttack(p: Player, def: MonsterDef): AttackResult {
  const w = p.weapon;
  // 二刀流は2回斬る（1振りごとにダメージを算出して合算）
  const hits = w?.dual ? 2 : 1;
  let dmg = 0;
  for (let i = 0; i < hits; i++) {
    dmg += Math.max(1, irand(p.atkMin, p.atkMax) - Math.floor(def.def * 0.6));
  }

  let crit = false;
  const cMagic = p.hasMagic('C');
  const critChance = 0.05 + (cMagic ? 0.15 : 0);
  if (Math.random() < critChance) { crit = true; dmg = Math.floor(dmg * 1.8); }

  // ファイア
  let fire = 0;
  if (p.hasMagic('F')) { fire = irand(4, 10); dmg += fire; }

  // DK（深層・機械系特効）
  if (p.hasMagic('DK') && (def.isDragonType || def.isElite || def.isBoss)) {
    dmg = Math.floor(dmg * 1.8);
  }

  // ドレイン
  let drain = 0;
  if (p.hasMagic('D')) { drain = Math.floor(dmg * 0.3); }

  const poison = !!p.hasMagic('P') && Math.random() < 0.5;
  const freeze = !!p.hasMagic('I') && Math.random() < 0.15;

  // 武器耐久（敵の防御が高いほど壊れやすい。消耗は2倍でどんどん壊れる）
  let weaponBroke = false;
  let weaponRevived = false;
  if (w) {
    const wear = (1 + Math.floor(def.def / 4)) * 2;
    w.dur -= wear;
    if (w.dur <= 0) {
      const rMagic = w.magics.find((m) => m.code === 'R');
      if (rMagic && !w.repairUsed) {
        w.repairUsed = true;
        w.dur = Math.floor(w.durMax * 0.5);
        weaponRevived = true;
      } else {
        w.dur = 0;
        weaponBroke = true;
      }
    }
  }

  // 撃破スコアボーナス（K）
  const killScoreBonus = p.hasMagic('K') ? Math.floor(def.score * 0.5) : 0;

  return { damage: dmg, hits, crit, fire, drain, poison, freeze, weaponBroke, weaponRevived, killScoreBonus };
}

// 敵→プレイヤー の攻撃計算
export interface DefendResult {
  damage: number;
  shieldBroke: boolean;
}

export function computeEnemyAttack(p: Player, def: MonsterDef): DefendResult {
  let dmg = irand(def.atkMin, def.atkMax);
  dmg = Math.max(1, dmg - Math.floor(p.def * 0.7));

  let shieldBroke = false;
  const s = p.shield;
  if (s && s.dur > 0) {
    // 敵の攻撃力が高いほど盾が壊れやすい
    const avgAtk = (def.atkMin + def.atkMax) / 2;
    const wear = 1 + Math.floor(avgAtk / 6);
    s.dur -= wear;
    if (s.dur <= 0) { s.dur = 0; shieldBroke = true; }
  }
  return { damage: dmg, shieldBroke };
}

// 破損リスク表示（低/中/高/危険）
export function durabilityRisk(cur: number, max: number): { label: string; color: string } {
  if (max <= 0) return { label: '—', color: '#8a97ab' };
  const ratio = cur / max;
  if (cur <= 0) return { label: '破損', color: '#ff4040' };
  if (ratio > 0.6) return { label: '低', color: '#5fd07a' };
  if (ratio > 0.35) return { label: '中', color: '#f5c542' };
  if (ratio > 0.15) return { label: '高', color: '#ff9040' };
  return { label: '危険', color: '#ff4040' };
}
