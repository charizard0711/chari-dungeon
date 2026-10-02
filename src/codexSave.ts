// 図鑑は冒険のセーブとは別に保持し、死亡・最初から開始でも消さない。
export const CODEX_SAVE_KEY = 'chari-dungeon.codex.v1';
const LEGACY_RUN_KEY = 'chari-dungeon.run.v1';

function stringKeys(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string') : [];
}

export function readCodexSave(): Set<string> {
  const keys = new Set<string>();
  try {
    for (const key of stringKeys(JSON.parse(localStorage.getItem(CODEX_SAVE_KEY) ?? '[]'))) keys.add(key);
  } catch { /* 保存不可・壊れた記録でもゲームを起動できる。 */ }
  // 旧バージョンの冒険セーブにある発見記録も引き継ぐ。
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_RUN_KEY) ?? 'null');
    for (const key of stringKeys(legacy?.snapshot?.discovered)) keys.add(key);
  } catch { /* 旧セーブがなくても独立した図鑑は使える。 */ }
  return keys;
}

export function writeCodexSave(discovered: Iterable<string>): boolean {
  try {
    const keys = readCodexSave();
    for (const key of discovered) keys.add(key);
    localStorage.setItem(CODEX_SAVE_KEY, JSON.stringify([...keys]));
    return true;
  } catch { return false; }
}
