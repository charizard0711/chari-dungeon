import { WEAPON_DEFS, SHIELD_DEFS } from './data';
import type { Dir, WeaponType } from './types';
import type { PlayerGender, PlayerVisualFrame } from './playerAppearance';

export const HELD_FRAME_SIZE = 64;
export const HELD_DIRECTION_FRAME: Record<Dir, number> = {down:0,left:1,right:2,up:3};
export const HELD_EQUIPMENT = [...WEAPON_DEFS, ...SHIELD_DEFS].map(def => ({
  itemKey:def.key, textureKey:`held_${def.key}`, path:`assets/equipment/directional/${def.key}.png`
}));
export const HELD_EQUIPMENT_KEYS = new Set(HELD_EQUIPMENT.map(art=>art.itemKey));

export function heldArtSize(type: WeaponType | 'shield') {
  return {dagger:16,longsword:23,lance:32,bow:25,handgun:18,greatsword:29,dual_sword:20,twin_daggers:18,shield:18}[type];
}

export function heldGrip(type: WeaponType | 'shield', dir: Dir): [number, number] {
  if (type === 'shield' || type === 'bow') return [.5,.5];
  if (type === 'handgun') return [dir === 'left' ? .68 : dir === 'right' ? .32 : .5,.78];
  return [.5,type === 'lance' ? .64 : .82];
}

/** Hand coordinates in the existing 40px character cells, shared by all armor sets. */
export function heldHandPose(dir: Dir, frame: PlayerVisualFrame, gender: PlayerGender, offhand: boolean, elapsed: number, type: WeaponType | 'shield') {
  const idle: Record<Dir, [number,number,number,number]> = {
    down:[12,27,27,27], left:[16,27,23,27], right:[25,27,17,27], up:[27,27,12,27]
  };
  let [wx,wy,sx,sy] = idle[dir];
  const attack = frame === 'atk' || frame === 'atkWindup';
  if (attack) {
    // Left attack uses the mirrored right-facing body cell.
    [wx,wy,sx,sy] = frame === 'atk' ? (dir === 'left' ? [8,23,29,24] : [32,23,11,24])
      : (dir === 'left' ? [10,25,28,24] : [30,25,12,24]);
  }
  const walking = frame === 'walk1' ? -.65 : frame === 'walk3' ? .65 : 0;
  const x = offhand ? sx : wx, y = (offhand ? sy : wy) + walking + (gender === 'female' ? -1 : 0);
  const behind = dir === 'up' || (offhand ? dir === 'right' : dir === 'left');
  const ranged = type === 'bow' || type === 'handgun';
  let angle = type === 'shield' || ranged ? 0 : dir === 'left' ? -.3 : dir === 'right' ? .3 : offhand ? .2 : -.2;
  if (attack && type !== 'shield') {
    const target = ranged ? 0 : {down:Math.PI*.8,left:-Math.PI/2,right:Math.PI/2,up:0}[dir];
    const windup = ranged ? 0 : dir === 'left' ? .7 : -.7;
    const progress = Math.min(1, Math.max(0, elapsed / (frame === 'atkWindup' ? 58 : 85)));
    const ease = progress * progress * (3 - 2 * progress);
    angle = frame === 'atkWindup' ? angle + (windup - angle) * ease : windup + (target - windup) * ease;
  }
  return {x,y,angle,depth:behind ? -.12 : offhand ? .22 : .18};
}
