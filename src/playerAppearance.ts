import type { Dir, EquipmentGrade } from './types';

export const PLAYER_GENDERS = ['male', 'female'] as const;
export type PlayerGender = typeof PLAYER_GENDERS[number];

export const PLAYER_ARMORS = ['leather', 'chain', 'plate', 'arcane', 'dragon'] as const;
export type PlayerArmor = typeof PLAYER_ARMORS[number];

export const PLAYER_VISUAL_FRAMES = [
  'idle', 'walk1', 'walk2', 'walk3', 'atkWindup', 'atk', 'hurt', 'down'
] as const;
export type PlayerVisualFrame = typeof PLAYER_VISUAL_FRAMES[number];

export const DEFAULT_PLAYER_GENDER: PlayerGender = 'male';
export const DEFAULT_PLAYER_ARMOR: PlayerArmor = 'leather';

export interface PlayerArmorDef {
  key: PlayerArmor;
  name: string;
  grade: EquipmentGrade;
  defBonus: number;
}

export const PLAYER_ARMOR_DEFS: Record<PlayerArmor, PlayerArmorDef> = {
  leather: { key: 'leather', name: '革の鎧', grade: 'D', defBonus: 0 },
  chain: { key: 'chain', name: '鎖帷子', grade: 'C', defBonus: 2 },
  plate: { key: 'plate', name: '騎士の板金鎧', grade: 'B', defBonus: 4 },
  arcane: { key: 'arcane', name: '秘術装甲', grade: 'A', defBonus: 6 },
  dragon: { key: 'dragon', name: '竜鱗神鎧', grade: 'S', defBonus: 9 }
};

const GENDER_STORAGE_KEY = 'chari-dungeon:player-gender';
const DIR_ROW: Record<Dir, number> = { down: 0, left: 1, right: 2, up: 3 };

export const PLAYER_SHEETS = PLAYER_GENDERS.flatMap((gender) =>
  PLAYER_ARMORS.map((armor) => ({
    gender,
    armor,
    key: playerSheetKey(gender, armor),
    path: `assets/characters/player/${gender}-${armor}.png`
  }))
);

export function isPlayerGender(value: unknown): value is PlayerGender {
  return typeof value === 'string' && PLAYER_GENDERS.includes(value as PlayerGender);
}

export function isPlayerArmor(value: unknown): value is PlayerArmor {
  return typeof value === 'string' && PLAYER_ARMORS.includes(value as PlayerArmor);
}

export function rollStarterArmor(): PlayerArmor {
  return DEFAULT_PLAYER_ARMOR;
}

export function armorForGrade(grade: EquipmentGrade): PlayerArmorDef {
  return Object.values(PLAYER_ARMOR_DEFS).find((armor) => armor.grade === grade)
    ?? PLAYER_ARMOR_DEFS[DEFAULT_PLAYER_ARMOR];
}

export function getSelectedGender(): PlayerGender {
  try {
    const stored = localStorage.getItem(GENDER_STORAGE_KEY);
    return isPlayerGender(stored) ? stored : DEFAULT_PLAYER_GENDER;
  } catch {
    return DEFAULT_PLAYER_GENDER;
  }
}

export function setSelectedGender(gender: PlayerGender) {
  try {
    localStorage.setItem(GENDER_STORAGE_KEY, gender);
  } catch {
    // Storage can be unavailable in privacy modes; the current scene still keeps the choice.
  }
}

export function playerSheetKey(gender: PlayerGender, armor: PlayerArmor = DEFAULT_PLAYER_ARMOR): string {
  return `player_${gender}_${armor}`;
}

export function playerFrameIndex(dir: Dir, frame: PlayerVisualFrame): number {
  return DIR_ROW[dir] * PLAYER_VISUAL_FRAMES.length + PLAYER_VISUAL_FRAMES.indexOf(frame);
}
