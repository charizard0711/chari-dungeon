import type { Dir, Vec2, WeaponType } from './types';
import type { SeName } from './audio/config';

export interface WeaponSkill {
  name: string;
  description: string;
  color: number;
  chargeSteps: number;
  range: number;
  multiplier: number;
  sound: SeName;
}

export const WEAPON_SKILLS = {
  dagger: { name: '零刻領域', description: '5ターン時間停止。敵をすり抜けて移動、終了時に正面を攻撃（背後1.5倍）', color: 0xb88cff, chargeSteps: 100, range: 3, multiplier: 0, sound: 'clockTick' },
  longsword: { name: '扇斬り', description: '正面・斜め前の3マスを斬り、HPを70回復', color: 0x6fa8ff, chargeSteps: 100, range: 1, multiplier: 1.3, sound: 'skillLongsword' },
  lance: { name: '貫通突き', description: '東西南北各3マスを攻撃・攻撃力30%低下を3ターン', color: 0xf0c75e, chargeSteps: 100, range: 3, multiplier: 1.35, sound: 'skillLance' },
  bow: { name: '穿ち矢', description: '前方7マス以内の敵1体を攻撃し、2ターンスタン', color: 0x74d88a, chargeSteps: 100, range: 7, multiplier: 1.8, sound: 'skillBow' },
  handgun: { name: '五連射', description: '前方3マス以内の敵1体へ5発・生存時に防御30%低下を3ターン', color: 0xffac60, chargeSteps: 100, range: 3, multiplier: .65, sound: 'skillHandgun' },
  greatsword: { name: '旋風斬り', description: '周囲8マスを斬り、敵を1マス押し戻す', color: 0xff7272, chargeSteps: 100, range: 1, multiplier: 1.45, sound: 'skillGreatsword' },
  dual_sword: { name: '十字絶閃', description: '前方5マスを貫通する斬撃を3連発・各発は通常攻撃の1.5倍', color: 0xffa1ef, chargeSteps: 100, range: 5, multiplier: 1.5, sound: 'skillDual' }
} satisfies Record<Exclude<WeaponType, 'twin_daggers'>, WeaponSkill>;

export function weaponSkill(type?: WeaponType): WeaponSkill | null {
  return type ? WEAPON_SKILLS[type === 'twin_daggers' ? 'dual_sword' : type] : null;
}

export function directionVector(dir: Dir): Vec2 {
  return dir === 'up' ? { x: 0, y: -1 } : dir === 'down' ? { x: 0, y: 1 }
    : dir === 'left' ? { x: -1, y: 0 } : { x: 1, y: 0 };
}

export function joystickDirection(dx: number, dy: number, deadZone = 10): Dir | null {
  if (Math.hypot(dx, dy) < deadZone) return null;
  return Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 'left' : 'right' : dy < 0 ? 'up' : 'down';
}

export interface SkillTargetContext<T> {
  blocked: (x: number, y: number) => boolean;
  enemyAt: (x: number, y: number) => T | null;
  canHit: (enemy: T) => boolean;
}

/** One enemy can occupy several cells; every plan hits each enemy only once. */
export function planSkill<T>(type: WeaponType, origin: Vec2, dir: Dir, context: SkillTargetContext<T>) {
  const skill = weaponSkill(type)!;
  const d = directionVector(dir);
  const tiles: Vec2[] = [];
  const targets: T[] = [];
  const append = (x: number, y: number) => {
    if (context.blocked(x, y)) return false;
    tiles.push({ x, y });
    const enemy = context.enemyAt(x, y);
    if (enemy && context.canHit(enemy) && !targets.includes(enemy)) targets.push(enemy);
    return !!enemy;
  };
  if (type === 'lance') {
    for (const direction of ['up', 'down', 'left', 'right'] as Dir[]) {
      const vector = directionVector(direction);
      for (let n = 1; n <= skill.range; n++) {
        const x = origin.x + vector.x * n, y = origin.y + vector.y * n;
        if (context.blocked(x, y)) break;
        append(x, y);
      }
    }
  } else if (type === 'greatsword') {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      if (dx && dy && context.blocked(origin.x + dx, origin.y) && context.blocked(origin.x, origin.y + dy)) continue;
      append(origin.x + dx, origin.y + dy);
    }
  } else if (type === 'longsword') {
    const front = { x: origin.x + d.x, y: origin.y + d.y };
    append(front.x, front.y);
    for (const side of [-1, 1]) {
      if (context.blocked(front.x, front.y) && context.blocked(origin.x - d.y * side, origin.y + d.x * side)) continue;
      append(front.x - d.y * side, front.y + d.x * side);
    }
  } else {
    const single = type === 'dagger' || type === 'bow' || type === 'handgun';
    for (let n = 1; n <= skill.range; n++) {
      const x = origin.x + d.x * n, y = origin.y + d.y * n;
      if (context.blocked(x, y)) break;
      if (append(x, y) && single) break;
    }
  }
  return { tiles, targets };
}

/** A line of enemies/objects is crossed in one action, but walls and sealed boundaries cannot be crossed. */
export function timeStopDestination(origin: Vec2, dir: Dir, context: {
  blocked: (x: number, y: number) => boolean;
  enemy: (x: number, y: number) => boolean;
  object: (x: number, y: number) => boolean;
}): Vec2 | null {
  const d = directionVector(dir);
  let x = origin.x + d.x, y = origin.y + d.y;
  if (context.blocked(x, y)) return null;
  if (!context.enemy(x, y)) return context.object(x, y) ? null : { x, y };
  while (context.enemy(x, y) || context.object(x, y)) {
    x += d.x; y += d.y;
    if (context.blocked(x, y)) return null;
  }
  return { x, y };
}
