/** Values are captured at impact, never reconstructed from equipment after death. */
export interface DamageEntry {
  turn: number;
  floor: number;
  source: string;
  reason: string;
  damage: number;
  hpBefore: number;
  hpAfter: number;
  lethal: boolean;
  revived?: boolean;
  steps: string[];
}

export interface AdventureEntry { turn: number; floor: number; msg: string; type: string }
export const JOURNAL_LIMIT = 120;

export function appendJournal<T>(entries: T[], entry: T) {
  entries.push(entry);
  if (entries.length > JOURNAL_LIMIT) entries.splice(0, entries.length - JOURNAL_LIMIT);
}
