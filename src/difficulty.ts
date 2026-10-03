import type { MonsterDef } from './types';

export const DIFFICULTIES = ['normal', 'hard', 'master'] as const;
export type Difficulty = typeof DIFFICULTIES[number];
export const DIFFICULTY_SAVE_KEY = 'chari-dungeon.difficulty.v1';
export const DIFFICULTY_RULES = {
  normal: { name: 'ノーマル', hp: 1, attack: 1, gold: 1, revives: Infinity, color: 0xb68b42, text: '#f0d398', panel: 'ui_obsidian_panel' },
  hard: { name: 'ハード', hp: 1.25, attack: 1.2, gold: .7, revives: 1, color: 0x58bfff, text: '#b7e6ff', panel: 'ui_difficulty_hard' },
  master: { name: 'マスター', hp: 1.5, attack: 1.4, gold: .5, revives: 0, color: 0xf1c355, text: '#ffe5a2', panel: 'ui_difficulty_master' }
} as const;
export interface DifficultyProgress { cleared: Difficulty[]; selected: Difficulty }
export const isDifficulty = (value: unknown): value is Difficulty => DIFFICULTIES.includes(value as Difficulty);
export const difficultyOf = (value: unknown): Difficulty => isDifficulty(value) ? value : 'normal';
export const difficultyFromCode = (code: string): Difficulty | undefined =>
  code === '33333333' ? 'hard' : code === '44444444' ? 'master' : undefined;
export function normalizeDifficulty(value: unknown): DifficultyProgress {
  const raw = value as Partial<DifficultyProgress> | null;
  // A later clear cannot grant earlier clears that were never recorded.
  const cleared: Difficulty[] = [];
  for (const mode of DIFFICULTIES) {
    if (!Array.isArray(raw?.cleared) || !raw.cleared.includes(mode)) break;
    cleared.push(mode);
  }
  const selected = difficultyOf(raw?.selected);
  const progress = { cleared, selected };
  if (!isDifficultyUnlocked(selected, progress)) progress.selected = 'normal';
  return progress;
}
export function isDifficultyUnlocked(mode: Difficulty, progress: DifficultyProgress): boolean {
  return mode === 'normal' || progress.cleared.includes(mode === 'hard' ? 'normal' : 'hard');
}
function storageKey(): string | null {
  if (typeof location !== 'undefined' && location.hostname === 'localhost') {
    const params = new URLSearchParams(location.search);
    const profile = params.get('qa-difficulty-profile');
    if (profile && /^[a-z0-9-]{1,48}$/.test(profile)) return `${DIFFICULTY_SAVE_KEY}.qa.${profile}`;
    if ([...params.keys()].some(key => key.startsWith('qa-'))) return null;
  }
  return DIFFICULTY_SAVE_KEY;
}
export function readDifficultyProgress(): DifficultyProgress {
  try { const key = storageKey(); return normalizeDifficulty(key ? JSON.parse(localStorage.getItem(key) || 'null') : null); }
  catch { return normalizeDifficulty(null); }
}
export function writeDifficultyProgress(progress: DifficultyProgress): boolean {
  try {
    const key = storageKey();
    if (!key) return false;
    const previous = readDifficultyProgress();
    const merged = normalizeDifficulty({ ...progress, cleared: [...previous.cleared, ...progress.cleared] });
    localStorage.setItem(key, JSON.stringify(merged));
    return true;
  } catch { return false; }
}
export function selectDifficulty(mode: Difficulty): boolean {
  const progress = readDifficultyProgress();
  if (!isDifficultyUnlocked(mode, progress)) return false;
  return writeDifficultyProgress({ ...progress, selected: mode });
}
export function recordDifficultyClear(mode: Difficulty): { saved: boolean; unlocked?: Difficulty } {
  const progress = readDifficultyProgress();
  if (!isDifficultyUnlocked(mode, progress)) return { saved: false };
  const first = !progress.cleared.includes(mode);
  progress.cleared.push(mode);
  const saved = writeDifficultyProgress(progress);
  return { saved, unlocked: saved && first && mode !== 'master' ? DIFFICULTIES[DIFFICULTIES.indexOf(mode) + 1] : undefined };
}
export const difficultyGold = (value: number, mode: Difficulty) => Math.max(0, Math.floor(value * DIFFICULTY_RULES[mode].gold));
export function difficultyEnemy(def: MonsterDef, mode: Difficulty): MonsterDef {
  if (def.difficultyApplied === mode) return { ...def };
  const rule = DIFFICULTY_RULES[mode];
  const base = def.difficultyBase ?? { hp: def.hp, atkMin: def.atkMin, atkMax: def.atkMax };
  return { ...def, difficultyApplied: mode, difficultyBase: base, hp: Math.max(1, Math.floor(base.hp * rule.hp)),
    atkMin: Math.floor(base.atkMin * rule.attack), atkMax: Math.floor(base.atkMax * rule.attack) };
}
