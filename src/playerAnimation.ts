import type { PlayerVisualFrame } from './playerAppearance';

const WALK = ['walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6'] as const;
const STRIKE = ['atk', 'atk2', 'atkFollow', 'atkRecover'] as const;
export type PlayerAction = 'idle' | 'walk' | 'windup' | 'attack' | 'hurt' | 'down';

export function playerAction(frame: PlayerVisualFrame): PlayerAction {
  if (frame.startsWith('walk')) return 'walk';
  if (frame.startsWith('atkWindup')) return 'windup';
  if (frame.startsWith('atk')) return 'attack';
  return frame === 'idle2' ? 'idle' : frame as PlayerAction;
}

/** Visual clock only. It never schedules a turn, a timer, or an input lock. */
export class PlayerAnimation {
  action: PlayerAction = 'idle';
  since = 0;
  walkFrameMs = 48;
  private walkPhase = 0;
  private stoppedWalkingAt = -Infinity;

  play(frame: PlayerVisualFrame, now: number) {
    const next = playerAction(frame);
    if (next === this.action && next !== 'windup' && next !== 'attack' && next !== 'hurt') return;
    if (this.action === 'walk') {
      this.walkPhase = (this.walkPhase + Math.max(0, now - this.since) / this.walkFrameMs) % WALK.length;
      this.stoppedWalkingAt = now;
    }
    if (next === 'walk' && now - this.stoppedWalkingAt > 200) this.walkPhase = 0;
    this.action = next;
    this.since = now;
  }

  sample(now: number): PlayerVisualFrame {
    const elapsed = Math.max(0, now - this.since);
    switch (this.action) {
      case 'walk': return WALK[Math.floor(this.walkPhase + elapsed / this.walkFrameMs) % WALK.length];
      case 'windup': return elapsed < 29 ? 'atkWindup' : 'atkWindup2';
      case 'attack': return STRIKE[Math.min(3, Math.floor(elapsed / 26))];
      case 'idle': return elapsed % 1800 < 1100 ? 'idle' : 'idle2';
      default: return this.action;
    }
  }
}
