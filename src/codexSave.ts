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

export const EQUIPMENT_CODEX_SAVE_KEY = 'chari-dungeon.equipment-codex.v1';

export function equipmentKeys(player: { weapons: { key: string; starred?: boolean }[]; shields: { key: string }[]; armors: { key: string }[] }): string[] {
  return [...player.weapons.flatMap(item => item.starred ? [item.key,`star_${item.key}`] : [item.key]), ...player.shields.map(item => item.key),
    ...player.armors.map(item => `armor_${item.key}`)];
}

export function readEquipmentCodexSave(): Set<string> {
  const keys = new Set<string>();
  try {
    for (const key of stringKeys(JSON.parse(localStorage.getItem(EQUIPMENT_CODEX_SAVE_KEY) ?? '[]'))) keys.add(key);
  } catch { /* 壊れた記録でも起動を続ける。 */ }
  try {
    const player = JSON.parse(localStorage.getItem(LEGACY_RUN_KEY) ?? 'null')?.snapshot?.player;
    if (player && [player.weapons, player.shields, player.armors].every(Array.isArray)) {
      for (const key of equipmentKeys(player)) keys.add(key);
    }
  } catch { /* 旧セーブがなくても図鑑は使える。 */ }
  return keys;
}

export function writeEquipmentCodexSave(discovered: Iterable<string>): boolean {
  try {
    const keys = readEquipmentCodexSave();
    for (const key of discovered) keys.add(key);
    localStorage.setItem(EQUIPMENT_CODEX_SAVE_KEY, JSON.stringify([...keys]));
    return true;
  } catch { return false; }
}
