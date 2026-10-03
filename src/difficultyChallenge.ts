import type { Difficulty } from './difficulty';
import type { Vec2 } from './types';

export interface ChallengeWave { turns: number; tiles: Vec2[] }
const same = (a: Vec2, b: Vec2) => a.x === b.x && a.y === b.y;

/** A one-step dodge must exist for every beat, including the second master strike. */
export function hasChallengeEscape(start: Vec2, waves: ChallengeWave[], canStand: (x: number, y: number) => boolean): boolean {
  let reachable = [start];
  for (let turn = 1; turn <= Math.max(...waves.map(w => w.turns)); turn++) {
    const next: Vec2[] = [];
    for (const p of reachable) for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const tile = { x: p.x + dx, y: p.y + dy };
      if (!canStand(tile.x, tile.y) || next.some(t => same(t, tile))) continue;
      if (waves.some(w => w.turns === turn && w.tiles.some(t => same(t, tile)))) continue;
      next.push(tile);
    }
    if (!next.length) return false;
    reachable = next;
  }
  return true;
}

export function planDifficultyChallenge(mode: Difficulty, player: Vec2, horizontal: boolean,
  validTile: (x: number, y: number) => boolean, canStand: (x: number, y: number) => boolean): ChallengeWave[] {
  if (mode === 'normal') return [];
  for (const alongX of [horizontal, !horizontal]) {
    const line = (xAxis: boolean) => [-2, -1, 0, 1, 2].map(n => ({ x: player.x + (xAxis ? n : 0), y: player.y + (xAxis ? 0 : n) }))
      .filter(p => validTile(p.x, p.y));
    const waves: ChallengeWave[] = [{ turns: 1, tiles: line(alongX) }];
    if (mode === 'master') waves.push({ turns: 2, tiles: line(!alongX) });
    if (waves.every(w => w.tiles.length) && hasChallengeEscape(player, waves, canStand)) return waves;
  }
  return [];
}
