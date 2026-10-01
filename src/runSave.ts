import type { GameScene } from './scenes/GameScene';

export const RUN_SAVE_KEY = 'chari-dungeon.run.v1';
export type RunSnapshot = ReturnType<GameScene['captureRun']>;
export interface RunSave { version: 1; savedAt: number; snapshot: RunSnapshot }

export function pickFields<T, K extends keyof T>(value: T, keys: readonly K[]): Pick<T, K> {
  return Object.fromEntries(keys.map(key => [key, value[key]])) as Pick<T, K>;
}

export function readRunSave(): RunSave | null {
  try {
    const raw = localStorage.getItem(RUN_SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw) as RunSave;
    const s = save?.snapshot;
    const d = s?.dungeon;
    if (save.version !== 1 || !Number.isFinite(save.savedAt) || !s || !d
      || !Number.isInteger(s.state.floor) || s.state.floor < 1 || s.state.floor > 30
      || !Number.isInteger(d.w) || !Number.isInteger(d.h) || d.w < 1 || d.h < 1 || d.w > 200 || d.h > 200
      || d.tiles?.length !== d.h || d.tiles.some(row => row.length !== d.w)
      || s.explored?.length !== d.h || s.explored.some(row => row.length !== d.w)
      || !Number.isInteger(s.player.x) || !Number.isInteger(s.player.y)
      || !d.tiles[s.player.y]?.[s.player.x] || !(s.player.hp > 0)
      || !Array.isArray(s.player.weapons) || !Array.isArray(s.player.shields) || !Array.isArray(s.player.armors)
      || !Array.isArray(s.player.inventory) || !Array.isArray(s.enemies) || !Array.isArray(s.chests)
      || !Array.isArray(s.ground) || !Array.isArray(s.objects) || !Array.isArray(s.bosses)
      || !Array.isArray(s.discovered) || !Array.isArray(s.openedRooms)
      || !Array.isArray(s.hazards) || !Array.isArray(s.obstacles)
      || !Array.isArray(s.logs) || !s.equipped || !s.audio
      || !['male', 'female'].includes(s.state.playerGender)
      || !['up', 'down', 'left', 'right'].includes(s.player.dir)
      || !Number.isFinite(s.player.hpMax) || !Number.isFinite(s.player.gold)
      || !Number.isFinite(s.audio.bgmVolume) || !Number.isFinite(s.audio.seVolume)
      || typeof s.audio.bgmOn !== 'boolean' || typeof s.audio.seOn !== 'boolean'
      || !Object.values(s.equipped).every(index => Number.isInteger(index) && index >= -1)
      || s.enemies.some(enemy => !enemy.state?.def?.key || !enemy.visual?.texture || !Number.isFinite(enemy.state.hp)
        || !d.tiles[enemy.state.y]?.[enemy.state.x])
      || s.openedRooms.some(index => !Number.isInteger(index) || !d.optionalRooms[index])
      || s.bosses.some(boss => !s.enemies[boss.enemy] || !boss.state?.kind)) return null;
    return save;
  } catch { return null; }
}

export function writeRunSave(snapshot: RunSnapshot): boolean {
  try {
    localStorage.setItem(RUN_SAVE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), snapshot } satisfies RunSave));
    return true;
  } catch { return false; }
}

export function clearRunSave(): boolean {
  try { localStorage.removeItem(RUN_SAVE_KEY); return true; } catch { return false; }
}
