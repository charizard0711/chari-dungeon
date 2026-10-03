import type { Vec2 } from './types';
import { bodyDistance } from './finalDepthBosses';

export const BOSS_MOVE_DIRECTIONS: readonly Vec2[] = [
  { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
];

// Search legal body positions, not just tiles between the boss and the player.
// A detour may initially lead away from the player to get around a pillar.
export function bossApproach(
  start: Vec2, target: Vec2, radius: number, canStand: (x: number, y: number) => boolean
): { step: Vec2 | null; reachesTarget: boolean } {
  if (bodyDistance(start, radius, target) === 1) return { step: null, reachesTarget: true };
  const queue: { position: Vec2; firstStep: Vec2 | null }[] = [{ position: start, firstStep: null }];
  const seen = new Set([`${start.x},${start.y}`]);
  let closestDistance = bodyDistance(start, radius, target);
  let closestStep: Vec2 | null = null;
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index];
    const neighbors = BOSS_MOVE_DIRECTIONS.map(dir => ({
      x: node.position.x + dir.x, y: node.position.y + dir.y
    })).sort((a, b) => bodyDistance(a, radius, target) - bodyDistance(b, radius, target));
    for (const position of neighbors) {
      const key = `${position.x},${position.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!canStand(position.x, position.y)) continue;
      const firstStep = node.firstStep ?? position;
      const distance = bodyDistance(position, radius, target);
      if (distance === 1) return { step: firstStep, reachesTarget: true };
      if (distance < closestDistance) {
        closestDistance = distance;
        closestStep = firstStep;
      }
      queue.push({ position, firstStep });
    }
  }
  // If the player is temporarily inaccessible, approach the closest reachable
  // position and wait there; don't oscillate or walk through cover.
  return { step: closestStep, reachesTarget: false };
}
