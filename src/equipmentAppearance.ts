import { WEAPON_DEFS, SHIELD_DEFS } from './data';
import type { Dir, WeaponType } from './types';
import { playerFrameIndex, type PlayerGender, type PlayerVisualFrame } from './playerAppearance';
import { playerAction } from './playerAnimation';
import { PLAYER_HAND_ANCHORS } from './playerHandAnchors';

export const HELD_FRAME_SIZE = 64;
export const HELD_DIRECTION_FRAME: Record<Dir, number> = {down:0,left:1,right:2,up:3};
export const HELD_EQUIPMENT = [...WEAPON_DEFS, ...SHIELD_DEFS].map(def => ({
  itemKey:def.key, textureKey:`held_${def.key}`, path:`assets/equipment/directional/${def.key}.png`
}));
export const HELD_EQUIPMENT_KEYS = new Set(HELD_EQUIPMENT.map(art=>art.itemKey));

export function heldArtSize(type: WeaponType | 'shield') {
  return {dagger:16,longsword:23,lance:32,bow:25,handgun:18,greatsword:29,dual_sword:20,twin_daggers:18,shield:13}[type];
}

export function heldGrip(type: WeaponType | 'shield', dir: Dir): [number, number] {
  if (type === 'shield' || type === 'bow') return [.5,.5];
  if (type === 'handgun') return [dir === 'left' ? .68 : dir === 'right' ? .32 : .5,.78];
  return [.5,type === 'lance' ? .64 : .82];
}

/** Hand coordinates in a normalized 40-unit art space, shared by all armor sets. */
export function heldHandPose(dir: Dir, frame: PlayerVisualFrame, gender: PlayerGender, offhand: boolean, elapsed: number, type: WeaponType | 'shield', bodyTexture?: string) {
  const anchors = PLAYER_HAND_ANCHORS[bodyTexture ?? ''] ?? PLAYER_HAND_ANCHORS[`player_${gender}_leather`];
  const [wx,wy,sx,sy] = anchors[playerFrameIndex(dir,frame)];
  const action = playerAction(frame);
  const attack = action === 'attack' || action === 'windup';
  const x = offhand ? sx : wx, y = offhand ? sy : wy;
  const behind = dir === 'up' || (offhand ? dir === 'right' : dir === 'left' && !attack);
  const ranged = type === 'bow' || type === 'handgun';
  let angle = type === 'shield' || ranged ? 0 : dir === 'left' ? -.3 : dir === 'right' ? .3 : offhand ? .2 : -.2;
  if (attack && type !== 'shield') {
    const target = ranged ? 0 : {down:Math.PI*.8,left:-Math.PI/2,right:Math.PI/2,up:0}[dir];
    const windup = ranged ? 0 : dir === 'left' ? .7 : -.7;
    const progress = Math.min(1, Math.max(0, elapsed / (action === 'windup' ? 58 : 85)));
    const ease = progress * progress * (3 - 2 * progress);
    angle = action === 'windup' ? angle + (windup - angle) * ease : windup + (target - windup) * ease;
  }
  return {x,y,angle,depth:behind ? -.12 : offhand ? .22 : .18};
}
